import type { HTMLTemplateResult } from 'lit';
import { html } from 'lit';
import { decodeAddress, encodeAddress } from '@polkadot/keyring';
import { hexToU8a, isHex } from '@polkadot/util';
import { Network } from '@buildwithsygma/core';
import { ethers } from 'ethers';
import {
  baseNetworkIcon,
  cronosNetworkIcon,
  ethereumIcon,
  khalaNetworkIcon,
  noNetworkIcon,
  phalaNetworkIcon,
  polygonNetworkIcon
} from '../assets';

export * from './resource';

export const renderNetworkIcon = (
  networkChainId?: number
): HTMLTemplateResult | undefined => {
  switch (networkChainId) {
    case 1:
    case 5:
    case 11155111:
    case 17000:
      return html`${ethereumIcon}`;
    case 5231:
    case 5233:
      return html`${phalaNetworkIcon}`;
    case 5232:
      return html`${khalaNetworkIcon}`;
    case 84531:
    case 8453:
      return html`${baseNetworkIcon}`;
    case 338:
    case 25:
      return html`${cronosNetworkIcon}`;
    case 80001:
    case 137:
      return html`${polygonNetworkIcon}`;
  }
  return undefined;
};

export const renderNoNetworkIcon = (): HTMLTemplateResult => {
  return html`${noNetworkIcon}`;
};

export const capitalize = (s: string): string => {
  const firstLetter = s.charAt(0).toUpperCase();
  const rest = s.slice(1);
  return `${firstLetter}${rest}`;
};

export const shortAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-5)}`;
};

export const validateSubstrateAddress = (address: string): boolean => {
  try {
    encodeAddress(isHex(address) ? hexToU8a(address) : decodeAddress(address));
    return true;
  } catch (error) {
    return false;
  }
};

export const validateAddress = (
  address: string,
  network: Network
): string | null => {
  switch (network) {
    case Network.SUBSTRATE: {
      const validPolkadotAddress = validateSubstrateAddress(address);
      return validPolkadotAddress ? null : 'invalid Substrate address';
    }
    case Network.EVM: {
      const isAddress = ethers.utils.isAddress(address);

      return isAddress ? null : 'invalid Ethereum address';
    }
    default:
      return 'unsupported network';
  }
};

export const debounce = <T>(
  cb: (args: T) => void,
  delay: number
): ((value: T) => void) => {
  let timeout: NodeJS.Timeout;
  return (args: T): void => {
    if (timeout !== undefined) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => cb(args), delay);
  };
};

export const isValidPolkadotAddress = (address: string) => {
  try {
    encodeAddress(isHex(address) ? hexToU8a(address) : decodeAddress(address));

    return true;
  } catch (error) {
    return false;
  }
};
