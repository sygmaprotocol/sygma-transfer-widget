import { ApiPromise, SubmittableResult } from '@polkadot/api';
import { Signer, SubmittableExtrinsic } from '@polkadot/api/types';
import {
  BaseTransactionExecutor,
  TransactionExecutor,
  TransactionExecutionStatus
} from './baseExecutor';

export class SubstrateTransactionExecutor
  extends BaseTransactionExecutor
  implements TransactionExecutor<{ extrinsicId: string }, string>
{
  provider: ApiPromise;
  transaction: SubmittableExtrinsic<'promise', SubmittableResult>;
  signer: Signer;
  signerAddress: string;

  constructor(
    title: string,
    signer: Signer,
    senderAddress: string,
    transaction: SubmittableExtrinsic<'promise', SubmittableResult>,
    provider: ApiPromise
  ) {
    super(title);
    this.provider = provider;
    this.transaction = transaction;
    this.signer = signer;
    this.signerAddress = senderAddress;
  }

  async executeTransaction(): Promise<{
    status: TransactionExecutionStatus;
    result?: { extrinsicId: string };
    error?: string;
  }> {
    this.__status = TransactionExecutionStatus.Executing;
    return new Promise(async (res, rej) => {
      try {
        const unsub = await this.transaction.signAndSend(
          this.signerAddress,
          { signer: this.signer },
          ({ status }) => {
            if (status.isFinalized) {
              this.__status = TransactionExecutionStatus.Successful;
              unsub();

              res({
                status: TransactionExecutionStatus.Successful,
                result: {
                  extrinsicId: status.hash.toString()
                }
              });
            }
          }
        );
      } catch (error) {
        this.__status = TransactionExecutionStatus.Failed;
        return rej({
          status: TransactionExecutionStatus.Failed,
          error: (error as Error).message
        });
      }
    });
  }
}
