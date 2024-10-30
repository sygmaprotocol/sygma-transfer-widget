import { ReactiveController, ReactiveElement } from 'lit';
import { Eip1193Provider, Network } from '@buildwithsygma/core';
import { TransferBuilder } from '../lib/transferBuilder';
import { ContextConsumer } from '@lit/context';
import { walletContext } from '../context';
import { substrateProviderContext } from '../context/wallet';
import { ApiPromise, SubmittableResult } from '@polkadot/api';
import { TransferElement } from '../interfaces';
import {
  createFungibleAssetTransfer,
  TransactionRequest
} from '@buildwithsygma/evm';
import { SubstrateTransactionExecutor } from '../lib/substrateTransactionExecutor';
import { Signer, SubmittableExtrinsic } from '@polkadot/api/types';
import { createSubstrateFungibleAssetTransfer } from '@buildwithsygma/substrate';
import { EvmTransactionExecutor } from '../lib/EvmTransactionExecutor';

type EvmFungibleTransfer = Awaited<
  ReturnType<typeof createFungibleAssetTransfer>
>;

type SubstrateFungibleTransfer = Awaited<
  ReturnType<typeof createSubstrateFungibleAssetTransfer>
>;

export enum TransactionBuilderStatus {
  Idle,
  Building,
  Built,
  Error
}

export class TransactionBuilderController implements ReactiveController {
  protected host: TransferElement;
  protected walletContext: ContextConsumer<
    typeof walletContext,
    ReactiveElement
  >;
  protected substrateProviderContext: ContextConsumer<
    typeof substrateProviderContext,
    ReactiveElement
  >;

  status: TransactionBuilderStatus = TransactionBuilderStatus.Idle;

  hostConnected(): void {}

  getSourceProvider(): Eip1193Provider | ApiPromise | null {
    if (this.walletContext.value) {
      const { evmWallet } = this.walletContext.value;

      if (evmWallet) {
        return evmWallet.provider;
      }
    }

    if (this.substrateProviderContext.value) {
      const { substrateProviders } = this.substrateProviderContext.value;

      if (substrateProviders) {
        const sourceDomainConfig =
          this.host.selectionsController.sourceDomainConfig;
        if (sourceDomainConfig) {
          const apiPromise = substrateProviders.get(sourceDomainConfig.caipId);
          if (apiPromise) return apiPromise;
        }
      }
    }

    return null;
  }

  constructor(host: TransferElement) {
    this.host = host;
    this.host.addController(this);

    this.walletContext = new ContextConsumer(host, {
      context: walletContext,
      subscribe: true
    });

    this.substrateProviderContext = new ContextConsumer(host, {
      context: substrateProviderContext,
      subscribe: true
    });
  }

  buildEvmExecutor(
    sourceAddress: string,
    title: string,
    transaction: TransactionRequest,
    provider: Eip1193Provider
  ): EvmTransactionExecutor {
    return new EvmTransactionExecutor(
      title,
      sourceAddress,
      provider,
      transaction
    );
  }

  buildSubstrateExecutor(
    sourceAddress: string,
    signer: Signer,
    title: string,
    transaction: SubmittableExtrinsic<'promise', SubmittableResult>,
    provider: ApiPromise
  ): SubstrateTransactionExecutor {
    return new SubstrateTransactionExecutor(
      title,
      signer,
      sourceAddress,
      transaction,
      provider
    );
  }

  async buildEvmExecutors(
    transfer: EvmFungibleTransfer,
    sourceAddress: string,
    provider: Eip1193Provider
  ) {
    const executors: Array<EvmTransactionExecutor> = [];
    const approvals = await transfer.getApprovalTransactions();
    executors.push(
      ...approvals.map((appr) =>
        this.buildEvmExecutor(sourceAddress, 'Approval', appr, provider)
      )
    );

    const transferTx = await transfer.getTransferTransaction();
    executors.push(
      this.buildEvmExecutor(sourceAddress, 'Transfer', transferTx, provider)
    );

    return executors;
  }

  async buildSubstrateExecutors(
    transfer: SubstrateFungibleTransfer,
    sourceAddress: string,
    signer: Signer,
    provider: ApiPromise
  ) {
    const tx = await transfer?.getTransferTransaction();
    const executor = await this.buildSubstrateExecutor(
      sourceAddress,
      signer!,
      'Transfer',
      tx as unknown as any,
      provider as ApiPromise
    );

    return [executor];
  }

  async buildTransfer() {
    try {
      const selections = this.host.selectionsController;
      const sourceIsEvm = selections.selectedSource?.type === Network.EVM;
      const provider = this.getSourceProvider();
      const substrateSigner = this.walletContext.value?.substrateWallet?.signer;
      const sourceAddress = sourceIsEvm
        ? this.walletContext.value?.evmWallet?.address
        : this.walletContext.value?.substrateWallet?.signerAddress;

      if (provider && sourceAddress && selections.bigAmount) {
        this.status = TransactionBuilderStatus.Building;
        this.host.validationController.updateState();
        const transfer = await new TransferBuilder().tryBuildTransfer({
          sourceAddress,
          environment: selections.environment,
          source: selections.selectedSource,
          destination: selections.selectedDestination,
          resource: selections.selectedResource,
          amount: selections.bigAmount,
          recipientAddress: selections.recipientAddress,
          provider
        });

        if (transfer) {
          const executors = [];
          if (sourceIsEvm) {
            executors.push(
              ...(await this.buildEvmExecutors(
                transfer as EvmFungibleTransfer,
                sourceAddress,
                provider as Eip1193Provider
              ))
            );
          } else {
            executors.push(
              ...(await this.buildSubstrateExecutors(
                transfer as SubstrateFungibleTransfer,
                sourceAddress,
                substrateSigner!,
                provider as ApiPromise
              ))
            );
          }

          this.host.executionController.onExecutorsReady(executors);
          this.status = TransactionBuilderStatus.Built;
          this.host.validationController.updateState();
        }
      }
    } catch (error: unknown) {
      console.log(error);
      this.status = TransactionBuilderStatus.Error;
      this.host.validationController.updateState();
    } finally {
      this.host.requestUpdate();
    }
  }
}
