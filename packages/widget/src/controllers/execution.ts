import { ReactiveController } from 'lit';
import { SubstrateTransactionExecutor } from '../lib/substrateTransactionExecutor';
import { TransferElement } from '../interfaces';
import { EvmTransactionExecutor } from '../lib/EvmTransactionExecutor';

export enum ExeuctionState {
  Executing = 'Executing',
  Failed = 'Failed',
  Ready = 'Ready',
  Idle = 'Idle',
  Complete = 'Complete'
}

export class ExecutionController implements ReactiveController {
  host: TransferElement;

  state: ExeuctionState;

  private executions: Array<
    EvmTransactionExecutor | SubstrateTransactionExecutor
  > = [];

  executing: SubstrateTransactionExecutor | EvmTransactionExecutor | null =
    null;

  hostConnected(): void {}

  getNextTransactionTitle(): string {
    if (this.executing) return this.executing.title;
    if (this.executions.length > 0) return this.executions[0].title;
    return '';
  }

  constructor(host: TransferElement) {
    this.host = host;
    this.state = ExeuctionState.Idle;
  }

  reset() {
    this.state = ExeuctionState.Idle;
    this.executions = [];
    this.executing = null;
  }

  onExecutorsReady(
    executors: Array<EvmTransactionExecutor | SubstrateTransactionExecutor>
  ) {
    this.executions = executors;
    this.state = ExeuctionState.Ready;
  }

  async execute() {
    const next = this.executions.shift();
    try {
      if (next) {
        this.state = ExeuctionState.Executing;
        this.host.validationController.updateState();
        this.executing = next;
        await this.executing.executeTransaction();
        this.state = ExeuctionState.Ready;
        if (this.executions.length === 0) {
          this.state = ExeuctionState.Complete;
        } else {
          this.state = ExeuctionState.Ready;
        }
        this.executing = null;
        this.host.validationController.updateState();
      }
    } catch (error) {
      console.log(error);
      this.executions.unshift(next!);
      this.executing = null;
      this.state = ExeuctionState.Failed;
      this.host.validationController.updateState();
    }
  }
}
