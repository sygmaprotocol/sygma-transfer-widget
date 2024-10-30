export enum TransactionExecutionStatus {
  Failed,
  Ready,
  Executing,
  Successful
}

export interface TransactionExecutor<ExecutionResponse, ExecutionFailure> {
  executeTransaction(): Promise<{
    status: TransactionExecutionStatus;
    result?: ExecutionResponse;
    error?: ExecutionFailure;
  }>;
}

export abstract class BaseTransactionExecutor {
  protected __title: string;
  protected __status: TransactionExecutionStatus;

  get status() {
    return this.__status;
  }

  get title() {
    return this.__title;
  }

  constructor(title: string) {
    this.__title = title;
    this.__status = TransactionExecutionStatus.Ready;
  }
}
