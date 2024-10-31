import { Eip1193Provider } from '@buildwithsygma/core';
import { TransactionRequest } from '@buildwithsygma/evm';
import { ethers } from 'ethers';
import { BaseTransactionExecutor, TransactionExecutor } from './baseExecutor';
import { TransactionExecutionStatus } from './baseExecutor';

export class EvmTransactionExecutor
  extends BaseTransactionExecutor
  implements TransactionExecutor<{ transactionHash: string }, string>
{
  provider: Eip1193Provider;
  transaction: TransactionRequest;
  signerAddress: string;

  constructor(
    title: string,
    signerAddress: string,
    provider: Eip1193Provider,
    transaction: TransactionRequest
  ) {
    super(title);
    this.provider = provider;
    this.transaction = transaction;
    this.signerAddress = signerAddress;
  }

  async executeTransaction(): Promise<{
    status: TransactionExecutionStatus;
    result?: { transactionHash: string };
    error?: string;
  }> {
    try {
      this.__status = TransactionExecutionStatus.Executing;
      const provider = this.provider;
      const web3Provider = new ethers.providers.Web3Provider(provider);

      const signer = await web3Provider.getSigner();
      const sentTransaction = await signer.sendTransaction(this.transaction);

      await sentTransaction.wait();
      this.__status = TransactionExecutionStatus.Successful;

      return {
        status: TransactionExecutionStatus.Successful,
        result: { transactionHash: sentTransaction.hash }
      };
    } catch (error) {
      this.__status = TransactionExecutionStatus.Failed;
      return {
        status: TransactionExecutionStatus.Failed,
        error: (error as Error).message
      };
    }
  }
}
