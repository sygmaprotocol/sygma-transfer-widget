import { ReactiveController, ReactiveElement } from 'lit';
import { ContextConsumer } from '@lit/context';
import { walletContext } from '../context';
import { TransactionBuilderStatus } from './transactionBuilder';
import { validateSelections, SelectionError } from '../lib/selectionErrors';
import { TransferElement } from '../interfaces';
import { ExeuctionState } from './execution';

const AMOUNT_ERRORS = [
  SelectionError.ZERO_AMOUNT,
  SelectionError.AMOUNT_EXCEEDS_BALANCE,
  SelectionError.AMOUNT_MISSING
];

export class ValidationController implements ReactiveController {
  walletContext: ContextConsumer<typeof walletContext, ReactiveElement>;
  host: TransferElement;

  transferButtonText: string = 'Select source network';
  transferButtonDisabled = true;
  transferButtonLoading = false;

  selectionErrorMessage: string | null = null;
  resourceAmountErrorMessage: string | null = null;

  hostConnected(): void {}

  constructor(host: TransferElement) {
    this.host = host;

    this.walletContext = new ContextConsumer(host, {
      context: walletContext,
      subscribe: true
    });
  }

  validateSelections(): boolean {
    const sel = this.host.selectionsController;
    const { error, message } = validateSelections(
      sel,
      this.walletContext.value,
      this.host.tokenBalanceController.balance
    );

    if (error && AMOUNT_ERRORS.includes(error)) {
      this.transferButtonText = 'Invalid amount';
      this.resourceAmountErrorMessage = message;
      this.transferButtonDisabled = true;
      this.transferButtonLoading = false;
      return false;
    } else if (error && !AMOUNT_ERRORS.includes(error)) {
      this.transferButtonText = message!;
      this.resourceAmountErrorMessage = null;
      this.transferButtonDisabled = true;
      this.transferButtonLoading = false;
      return false;
    } else {
      this.resourceAmountErrorMessage = null;
      return true;
    }
  }

  validateBuilderState(): boolean {
    switch (this.host.transactionBuilderController.status) {
      case TransactionBuilderStatus.Built:
        return true;
      case TransactionBuilderStatus.Building:
        this.transferButtonText = 'Preparing Transactions';
        this.transferButtonLoading = true;
        this.transferButtonDisabled = true;
        return false;
      case TransactionBuilderStatus.Error:
        this.transferButtonText = `Error Preparing Transaction`;
        this.transferButtonLoading = false;
        this.transferButtonDisabled = true;
        return false;
      case TransactionBuilderStatus.Idle:
        this.transferButtonText = `Ready`;
        this.transferButtonLoading = false;
        this.transferButtonDisabled = true;
        return false;
    }
  }

  validateExecutionState(): boolean {
    let nextTitle;
    switch (this.host.executionController.state) {
      case ExeuctionState.Complete:
        this.host.executionController.reset();
        this.host.selectionsController.reset();
        return true;
      case ExeuctionState.Ready:
        nextTitle = this.host.executionController.getNextTransactionTitle();
        this.transferButtonText = `Execute ${nextTitle}`;
        this.transferButtonLoading = false;
        this.transferButtonDisabled = false;
        return true;
      case ExeuctionState.Failed:
        nextTitle = this.host.executionController.getNextTransactionTitle();
        this.transferButtonText = `Execution Failed ${nextTitle}`;
        this.transferButtonDisabled = true;
        this.transferButtonLoading = false;
        return false;
      case ExeuctionState.Executing:
        nextTitle =
          this.host.executionController.getExecutingTransactionTitle();
        this.transferButtonText = `Executing ${nextTitle}`;
        this.transferButtonLoading = true;
        this.transferButtonDisabled = true;
        return false;
      default:
        return false;
    }
  }

  updateState() {
    const selectionsAreValid = this.validateSelections();
    if (selectionsAreValid) {
      const isBuilderStateValid = this.validateBuilderState();

      if (isBuilderStateValid) {
        this.validateExecutionState();
      }
    }

    this.host.requestUpdate();
  }
}
