import type { Domain } from '@buildwithsygma/core';
import { Network } from '@buildwithsygma/core';
import { ContextConsumer } from '@lit/context';
import type { Account } from '@polkadot-onboard/core';
import { InjectedWalletProvider } from '@polkadot-onboard/injected-wallets';
import Onboard from '@web3-onboard/core';
import injectedModule from '@web3-onboard/injected-wallets';
import type { ReactiveController, ReactiveElement } from 'lit';
import type { WalletInit, AppMetadata } from '@web3-onboard/common';

import type { WalletConnectOptions } from '@web3-onboard/walletconnect/dist/types';
import { utils } from 'ethers';
import { WalletUpdateEvent, walletContext } from '../../context';
import type { Eip1193Provider } from '../../interfaces';
import { CHAIN_ID_URL } from '../../constants';

/**
 * This is a stripped version of the response that is returned from chainId service
 */
type ChainData = {
  chainId: number;
  name: string;
  rpc: string[];
  nativeCurrency: { name: string; symbol: string; decimals: number };
  explorers: Array<{ name: string; standard: string; url: string }>;
};

type ChainDataResponse = Array<ChainData>;

export class WalletController implements ReactiveController {
  host: ReactiveElement;

  walletContext: ContextConsumer<typeof walletContext, ReactiveElement>;

  /**
   * Provides list of wallets specified by 3rd party
   * along with default injected connector
   * @param {{ dappUrl?: string }} options
   * @returns {WalletInit[]}
   */
  getWallets(options?: {
    walletConnectOptions?: WalletConnectOptions;
    walletModules?: WalletInit[];
    appMetaData?: AppMetadata;
  }): WalletInit[] {
    // always have injected ones
    const injected = injectedModule();
    const wallets = [injected];

    if (options?.walletModules?.length) {
      wallets.push(...options.walletModules);
    }

    return wallets;
  }

  constructor(host: ReactiveElement) {
    (this.host = host).addController(this);

    this.walletContext = new ContextConsumer(host, {
      context: walletContext,
      subscribe: true
    });
  }

  hostConnected(): void {}

  hostDisconnected(): void {
    const substrateWallet = this.walletContext.value?.substrateWallet;
    if (substrateWallet) {
      substrateWallet.unsubscribeSubstrateAccounts?.();
    }
  }

  connectWallet = (
    network: Domain,
    options?: {
      walletConnectOptions?: WalletConnectOptions;
      appMetaData?: AppMetadata;
      walletModules?: WalletInit[];
    }
  ): void => {
    switch (network.type) {
      case Network.EVM:
        {
          void this.connectEvmWallet(network, options);
        }
        break;
      case Network.SUBSTRATE:
        {
          void this.connectSubstrateWallet(network, options);
        }
        break;
      default:
        throw new Error('Unsupported network type');
    }
  };

  disconnectWallet = (): void => {
    this.disconnectEvmWallet();
    this.disconnectSubstrateWallet();
  };

  disconnectEvmWallet = (): void => {
    const evmWallet = this.walletContext.value?.evmWallet;
    if (evmWallet) {
      this.host.dispatchEvent(
        new WalletUpdateEvent({
          evmWallet: undefined
        })
      );
    }
  };

  disconnectSubstrateWallet = (): void => {
    const substrateWallet = this.walletContext.value?.substrateWallet;
    if (substrateWallet) {
      substrateWallet.unsubscribeSubstrateAccounts?.();
      void substrateWallet.disconnect?.();
      this.host.dispatchEvent(
        new WalletUpdateEvent({
          substrateWallet: undefined
        })
      );
    }
  };

  async switchEvmChain(
    chainId: number,
    provider: Eip1193Provider
  ): Promise<void> {
    if (this.walletContext.value?.evmWallet) {
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: utils.hexValue(chainId) }]
        });
      } catch (switchError) {
        const chainData = (await (
          await fetch(CHAIN_ID_URL)
        ).json()) as ChainDataResponse;

        const selectedChain = chainData.find(
          (chain) => chain.chainId === chainId
        ) as ChainData;

        void this.addEvmChain(selectedChain, provider);
      }
    }
  }
  connectEvmWallet = async (
    network: Domain,
    options?: {
      walletConnectOptions?: WalletConnectOptions;
      appMetaData?: AppMetadata;
    }
  ): Promise<void> => {
    const walletsToConnect = this.getWallets(options);

    const onboard = Onboard({
      appMetadata: options?.appMetaData,
      wallets: walletsToConnect,
      chains: [
        {
          id: network.chainId
        }
      ],
      accountCenter: {
        desktop: { enabled: false },
        mobile: { enabled: false }
      }
    });

    const wallets = await onboard.connectWallet();
    if (wallets[0]) {
      const provider = wallets[0].provider;
      const providerChainId = parseInt(
        await provider.request({ method: 'eth_chainId' })
      );
      this.host.dispatchEvent(
        new WalletUpdateEvent({
          evmWallet: {
            address:
              wallets[0].accounts[0].ens?.name ??
              wallets[0].accounts[0].address,
            providerChainId,
            provider
          }
        })
      );
      if (network.chainId !== providerChainId) {
        await this.switchEvmChain(network.chainId, provider);
      }
      this.host.requestUpdate();
    }
  };

  connectSubstrateWallet = async (
    _network: Domain, // TODO: remove underscore prefix once arg usage is added
    options?: {
      walletConnectOptions?: WalletConnectOptions;
      appMetaData?: AppMetadata;
    }
  ): Promise<void> => {
    const injectedWalletProvider = new InjectedWalletProvider(
      { disallowed: [] },
      options?.appMetaData?.name ?? 'Sygma Widget'
    );
    const wallets = await injectedWalletProvider.getWallets();

    //TODO: UI for selecting substrate wallet

    const wallet = wallets[0];
    await wallet.connect();
    if (wallet.signer) {
      const accounts = await wallet.getAccounts();
      const unsub = await wallet.subscribeAccounts(
        this.onSubstrateAccountChange
      );
      this.host.dispatchEvent(
        new WalletUpdateEvent({
          substrateWallet: {
            signer: wallet.signer,
            signerAddress: accounts[0].address,
            accounts,
            unsubscribeSubstrateAccounts: unsub,
            disconnect: wallet.disconnect
          }
        })
      );
    }
  };

  sourceNetworkUpdated(sourceNetwork: Domain | undefined): void {
    if (!sourceNetwork) {
      this.disconnectEvmWallet();
      this.disconnectSubstrateWallet();
    }
    switch (sourceNetwork?.type) {
      case Network.SUBSTRATE:
        {
          this.disconnectEvmWallet();
        }
        break;
      case Network.EVM:
        {
          this.disconnectSubstrateWallet();
        }
        break;
      default:
        return;
    }
  }

  private onSubstrateAccountChange = (accounts: Account[]): void => {
    if (this.walletContext.value?.substrateWallet && accounts.length !== 0) {
      this.host.dispatchEvent(
        new WalletUpdateEvent({
          substrateWallet: {
            signer: this.walletContext.value.substrateWallet.signer,
            signerAddress:
              this.walletContext.value.substrateWallet.signerAddress,
            disconnect: this.walletContext.value.substrateWallet.disconnect,
            unsubscribeSubstrateAccounts:
              this.walletContext.value.substrateWallet
                .unsubscribeSubstrateAccounts,
            //TODO: convert address to network format
            accounts
          }
        })
      );
    }
    if (accounts.length === 0) {
      this.disconnectSubstrateWallet();
    }
  };

  private async addEvmChain(
    chainData: ChainData,
    provider: Eip1193Provider
  ): Promise<void> {
    const {
      chainId,
      name,
      nativeCurrency: { name: tokenName, symbol, decimals },
      rpc,
      explorers
    } = chainData;
    try {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: `0x${chainId.toString(16)}`,
            chainName: name,
            rpcUrls: [rpc[0]],
            nativeCurrency: {
              name: tokenName,
              symbol: symbol,
              decimals: decimals
            },
            blockExplorerUrls: explorers.map((explorer) => explorer.url)
          }
        ]
      });
    } catch (addEvmError) {
      console.error('Failed to add evm network into wallet', addEvmError);
    }
  }

  onSubstrateAccountSelected = (account: Account): void => {
    if (this.walletContext.value?.substrateWallet) {
      this.host.dispatchEvent(
        new WalletUpdateEvent({
          substrateWallet: {
            signer: this.walletContext.value.substrateWallet.signer,
            signerAddress: account.address,
            accounts: this.walletContext.value.substrateWallet.accounts
          }
        })
      );
    }
  };
}
