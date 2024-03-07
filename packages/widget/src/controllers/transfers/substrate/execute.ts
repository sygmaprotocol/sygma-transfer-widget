import type { SubmittableExtrinsic } from '@polkadot/api/types';
import type { SubmittableResult } from '@polkadot/api';
import type { FungibleTokenTransferController } from '../fungible-token-transfer';

export async function executeNextSubstrateTransaction(
  this: FungibleTokenTransferController
): Promise<void> {
  this.errorMessage = null;
  const destinationAddress = this.destinatonAddress;
  const sender = this.walletContext.value?.substrateWallet?.accounts![0];
  const signer = this.walletContext.value?.substrateWallet?.signer;
  if (
    this.pendingTransferTransactions === undefined ||
    destinationAddress == undefined ||
    sender?.address == undefined
  )
    return;

  await (
    this.pendingTransferTransactions as SubmittableExtrinsic<
      'promise',
      SubmittableResult
    >
  ).signAndSend(
    sender.address,
    { signer: signer },
    ({
      isInBlock,
      isFinalized,
      blockNumber,
      txIndex,
      isError,
      isCompleted
    }) => {
      if (isInBlock) {
        this.waitingTxExecution = false;
        this.host.requestUpdate();
      }

      if (isCompleted) {
        this.pendingTransferTransactions = undefined;
        this.transferTransactionId = `${blockNumber?.toString()}-${txIndex?.toString()}`;
        this.host.requestUpdate();
      }

      if (isError) {
        this.errorMessage = 'Transfer transaction reverted or rejected';
        this.waitingTxExecution = false;
        this.host.requestUpdate();
      }

      if (isFinalized) {
        this.waitingUserConfirmation = false;
        this.waitingTxExecution = false;
        this.host.requestUpdate();
      }
    }
  );
}