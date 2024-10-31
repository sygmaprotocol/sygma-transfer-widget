import { Domain, Environment, Network, Resource } from '@buildwithsygma/core';
import {
  createFungibleAssetTransfer,
  FungibleTransferParams
} from '@buildwithsygma/evm';
import {
  createSubstrateFungibleAssetTransfer,
  SubstrateAssetTransferRequest
} from '@buildwithsygma/substrate';
import { BigNumber } from 'ethers';
import { Eip1193Provider } from '../interfaces';
import { ApiPromise } from '@polkadot/api';

export class TransferBuilder {
  public async tryBuildTransfer(params: {
    sourceAddress?: string;
    environment?: Environment;
    source?: Domain;
    destination?: Domain;
    resource?: Resource;
    amount?: BigNumber;
    recipientAddress?: string;
    provider?: Eip1193Provider | ApiPromise;
  }): Promise<
    | ReturnType<typeof createFungibleAssetTransfer>
    | ReturnType<typeof createSubstrateFungibleAssetTransfer>
    | null
  > {
    const {
      sourceAddress,
      environment,
      source,
      destination,
      resource,
      amount,
      recipientAddress,
      provider
    } = params;

    if (
      sourceAddress &&
      environment &&
      source &&
      destination &&
      resource &&
      amount &&
      recipientAddress &&
      provider
    ) {
      return this.build(
        params.sourceAddress!,
        params.environment!,
        params.source!,
        params.destination!,
        params.resource!,
        params.amount!,
        params.recipientAddress!,
        params.provider!
      );
    } else {
      return null;
    }
  }

  private async build(
    sourceAddress: string,
    environment: Environment,
    source: Domain,
    destination: Domain,
    resource: Resource,
    amount: BigNumber,
    recipientAddress: string,
    provider: Eip1193Provider | ApiPromise
  ): Promise<
    | ReturnType<typeof createFungibleAssetTransfer>
    | ReturnType<typeof createSubstrateFungibleAssetTransfer>
  > {
    let params: SubstrateAssetTransferRequest | FungibleTransferParams;

    try {
      switch (source.type) {
        case Network.EVM: {
          params = {
            sourceAddress,
            amount: amount.toBigInt(),
            recipientAddress,
            source,
            destination,
            sourceNetworkProvider: provider as Eip1193Provider,
            resource,
            environment
          } as FungibleTransferParams;
          const transfer = await createFungibleAssetTransfer(
            params as FungibleTransferParams
          );
          return transfer;
        }
        case Network.SUBSTRATE: {
          params = {
            sourceAddress,
            sourceNetworkProvider: provider as ApiPromise,
            source,
            destination,
            resource,
            amount: amount.toBigInt(),
            destinationAddress: recipientAddress,
            environment
          } as SubstrateAssetTransferRequest;
          const transfer = await createSubstrateFungibleAssetTransfer(
            params as SubstrateAssetTransferRequest
          );
          return transfer;
        }
        default: {
          throw new Error('Unsupported source network type.');
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        return Promise.reject(new Error(error.message));
      } else {
        return Promise.reject(new Error('Could not create a transfer.'));
      }
    }
  }
}
