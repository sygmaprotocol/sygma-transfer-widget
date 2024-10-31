import { Environment } from '@buildwithsygma/sygma-sdk-core';

export const DEFAULT_ETH_DECIMALS = 18;

export const MAINNET_EXPLORER_URL = 'https://scan.buildwithsygma.com/transfer/';
export const TESTNET_EXPLORER_URL =
  'https://scan.test.buildwithsygma.com/transfer/';
export const CHAIN_ID_URL = 'https://chainid.network/chains.json';

type WsUrl = `ws://${string}` | `wss://${string}`;
export type CaipId = string;
export const SUBSTRATE_RPCS: {
  [env in Environment]: Record<CaipId, WsUrl>;
} = {
  [Environment.DEVNET]: {},
  [Environment.LOCAL]: {},
  [Environment.TESTNET]: {
    '': 'wss://rhala-node.phala.network/ws'
  },
  [Environment.MAINNET]: {
    '': 'wss://rpc.helikon.io/khala',
    '': 'wss://phala.api.onfinality.io/public-ws'
  }
};

export const INPUT_DEBOUNCE_TIME = 600;
