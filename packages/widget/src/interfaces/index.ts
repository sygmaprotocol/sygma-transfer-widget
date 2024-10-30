import type { Environment } from '@buildwithsygma/sygma-sdk-core';
import type { ApiPromise } from '@polkadot/api';
import type { Signer } from '@polkadot/api/types';
import type { WalletConnectOptions } from '@web3-onboard/walletconnect/dist/types';
import { ReactiveElement } from 'lit';
import { ExecutionController } from '../controllers/execution';
import { SelectionsController } from '../controllers/selections';
import { TransactionBuilderController } from '../controllers/transactionBuilder';
import { ValidationController } from '../controllers/validation';

export type ThemeVariables =
  | 'mainColor'
  | 'secondaryColor'
  | 'fontSize'
  | 'borderRadius'
  | 'borderRadiusSecondary';

export type Theme = Record<ThemeVariables, string>;

export interface Eip1193Provider {
  request(request: {
    method: string;
    params?: Array<unknown> | Record<string, unknown>;
  }): Promise<unknown>;
}

export interface TransferElement extends ReactiveElement {
  selectionsController: SelectionsController;
  transactionBuilderController: TransactionBuilderController;
  executionController: ExecutionController;
  validationController: ValidationController;
}

export interface ISygmaProtocolWidget {
  environment?: Environment;
  whitelistedSourceNetworks?: string[];
  whitelistedDestinationNetworks?: string[];
  whitelistedSourceResources?: string[];
  evmProvider?: Eip1193Provider;
  substrateProviders?: Array<ApiPromise>;
  substrateSigner?: Signer;
  show?: boolean;
  expandable?: boolean;
  darkTheme?: boolean;
  customLogo?: SVGElement;
  theme?: Theme;
  walletConnectOptions?: WalletConnectOptions;
}

export class SdkInitializedEvent extends CustomEvent<{
  hasInitialized: boolean;
}> {
  constructor(update: { hasInitialized: boolean }) {
    super('sdk-initialized', { detail: update, composed: true, bubbles: true });
  }
}
