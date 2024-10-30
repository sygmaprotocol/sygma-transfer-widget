import { BigNumber, ethers } from 'ethers';
import type { PopulatedTransaction } from 'ethers';
import type { Eip1193Provider } from '../interfaces';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { SubmittableResult } from '@polkadot/api';

/**
 * This method calculate the amount of gas
 * list of transactions will cost
 * @param {number} chainId blockchain ID
 * @param {Eip1193Provider} eip1193Provider EIP compatible provider
 * @param {string} sender address of signer connected with provider
 * @param {PopulatedTransaction[]} transactions list of EVM transactions
 * @returns {Promise<BigNumber>} gas cost in 18 decimals // or chain native decimals
 */
export async function estimateEvmTransactionsGasCost(
  chainId: number,
  eip1193Provider: Eip1193Provider,
  sender: string,
  transactions: PopulatedTransaction[]
): Promise<BigNumber> {
  const provider = new ethers.providers.Web3Provider(eip1193Provider, chainId);
  const signer = provider.getSigner(sender);

  let cost = ethers.constants.Zero;
  for (const transaction of transactions) {
    const _cost = await signer.estimateGas(transaction);
    cost = cost.add(_cost);
  }

  const gasPrice = await provider.getGasPrice();
  return gasPrice.mul(cost);
}

export async function estimateSubstrateGas(
  signerAddress: string,
  pendingTransferTransaction: SubmittableExtrinsic<'promise', SubmittableResult>
): Promise<BigNumber> {
  const { partialFee } =
    await pendingTransferTransaction.paymentInfo(signerAddress);
  const estimatedGas = BigNumber.from(partialFee.toString());

  return estimatedGas;
}
