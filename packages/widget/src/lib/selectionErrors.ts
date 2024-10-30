import { BigNumber } from 'ethers';
import { SelectionsController } from '../controllers/selections';
import { validateAddress } from '../utils';
import { WalletContext } from '../context';
import { Network } from '@buildwithsygma/core';

export enum SelectionError {
  SOURCE_MISSING = 'SOURCE_MISSING',
  DESTINATION_MISSING = 'DESTINATION_MISSING',
  AMOUNT_MISSING = 'AMOUNT_MISSING',
  RESOURCE_MISSING = 'RESOURCE_MISSING',
  RECIPIENT_ADDRESS_MISSING = 'RECIPIENT_ADDRESS_MISSING',
  INVALID_RECIPIENT_ADDRESS = 'INVALID_RECIPIENT_ADDRESS',
  ZERO_AMOUNT = 'ZERO_AMOUNT',
  AMOUNT_EXCEEDS_BALANCE = 'AMOUNT_EXCEEDS_BALANCE',
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED'
}

const ERROR_MESSAGES: Record<SelectionError, string> = {
  [SelectionError.SOURCE_MISSING]: 'Select source',
  [SelectionError.DESTINATION_MISSING]: 'Select destination',
  [SelectionError.AMOUNT_MISSING]: 'Enter Amount',
  [SelectionError.RESOURCE_MISSING]: 'Select a token',
  [SelectionError.RECIPIENT_ADDRESS_MISSING]: 'Enter recipient address',
  [SelectionError.INVALID_RECIPIENT_ADDRESS]: 'Invalid Recipient address',
  [SelectionError.ZERO_AMOUNT]: 'Amount must be greater than 0',
  [SelectionError.AMOUNT_EXCEEDS_BALANCE]: 'Amount exceeds balance',
  [SelectionError.WALLET_NOT_CONNECTED]: 'Wallet not connected'
};

/**
 * Get UI Selection Error
 * returns null when all selections
 * are defined
 * @param {SelectionsController} selectionsController
 * @returns {SelectionError | null}
 */
export function getSelectionError(
  selectionsController: SelectionsController,
  walletContext?: WalletContext
) {
  const {
    selectedSource,
    selectedDestination,
    displayAmount,
    selectedResource,
    recipientAddress
  } = selectionsController;

  let error: SelectionError | null = null;

  if (!selectedSource) {
    error = SelectionError.SOURCE_MISSING;
  } else if (!selectedDestination) {
    error = SelectionError.DESTINATION_MISSING;
  } else if (!selectedResource) {
    error = SelectionError.RESOURCE_MISSING;
  } else if (!displayAmount || displayAmount.length === 0) {
    error = SelectionError.AMOUNT_MISSING;
  } else if (BigNumber.from(displayAmount).lte(0)) {
    error = SelectionError.ZERO_AMOUNT;
  } else if (!recipientAddress || recipientAddress.length === 0) {
    error = SelectionError.RECIPIENT_ADDRESS_MISSING;
  } else if (validateAddress(recipientAddress, selectedDestination.type)) {
    error = SelectionError.INVALID_RECIPIENT_ADDRESS;
  } else if (selectedSource) {
    const { type } = selectedSource;
    if (type === Network.SUBSTRATE) {
      if (
        !walletContext ||
        !walletContext.substrateWallet ||
        !walletContext.substrateWallet.signer
      ) {
        error = SelectionError.WALLET_NOT_CONNECTED;
      }
    } else if (type === Network.EVM) {
      if (
        !walletContext ||
        !walletContext.evmWallet ||
        !walletContext.evmWallet.provider
      ) {
        error = SelectionError.WALLET_NOT_CONNECTED;
      }
    }
  }

  return error;
}

/**
 * Get UI Selection Error Messsage
 * returns null when all selections
 * are defined
 * @param {SelectionsController} selectionsController
 * @returns {SelectionError | null}
 */
export function validateSelections(
  selectionsController: SelectionsController,
  walletContext?: WalletContext
): {
  message: string | null;
  error: SelectionError | null;
} {
  const error = getSelectionError(selectionsController, walletContext);
  if (error) return { message: ERROR_MESSAGES[error], error };
  return { message: null, error: null };
}
