import { ERC20__factory } from '@buildwithsygma/sygma-contracts';
import type {
  EvmResource,
  Resource,
  SubstrateResource
} from '@buildwithsygma/sygma-sdk-core';
import { ResourceType } from '@buildwithsygma/core';
import { Network } from '@buildwithsygma/core';
import { ContextConsumer } from '@lit/context';
import { ethers, BigNumber } from 'ethers';
import type { ReactiveController, ReactiveElement } from 'lit';
import { getAssetBalance } from '@buildwithsygma/sygma-sdk-core/substrate';
import { walletContext } from '../../context';
import { substrateProviderContext } from '../../context/wallet';
import type { SubstrateWallet } from '../../context/wallet';

const BALANCE_REFRESH_MS = 5_000;

export const BALANCE_UPDATE_KEY = 'accountBalance';

export class TokenBalanceController implements ReactiveController {
  host: ReactiveElement;

  walletContext: ContextConsumer<typeof walletContext, ReactiveElement>;
  substrateProviderContext: ContextConsumer<
    typeof substrateProviderContext,
    ReactiveElement
  >;

  loadingBalance: boolean = true;

  //"wei"
  balance: BigNumber = ethers.constants.Zero;
  decimals: number = 18;

  timeout?: ReturnType<typeof setInterval>;

  constructor(host: ReactiveElement) {
    (this.host = host).addController(this);
    this.walletContext = new ContextConsumer(host, {
      context: walletContext,
      subscribe: true
    });
    this.substrateProviderContext = new ContextConsumer(host, {
      context: substrateProviderContext,
      subscribe: true
    });
  }

  hostConnected(): void {}

  hostDisconnected(): void {
    clearInterval(this.timeout);
  }

  startBalanceUpdates(
    resource: Resource,
    networkType: Network,
    caipId: string
  ): void {
    if (this.timeout) {
      clearInterval(this.timeout);
    }
    this.balance = ethers.constants.Zero;
    this.host.requestUpdate();

    if (networkType === Network.EVM) {
      if (resource.type === ResourceType.FUNGIBLE) {
        //trigger so we don't wait BALANCE_REFRESH_MS before displaying balance
        void this.subscribeERC20BalanceUpdate(resource as EvmResource);
        this.timeout = setInterval(
          this.subscribeERC20BalanceUpdate,
          BALANCE_REFRESH_MS,
          resource as EvmResource
        );
        return;
      }
      //resource.native is not set :shrug:
      if (resource.symbol === 'eth') {
        void this.subscribeEvmNativeBalanceUpdate();

        this.timeout = setInterval(
          this.subscribeEvmNativeBalanceUpdate,
          BALANCE_REFRESH_MS
        );
        return;
      }
    } else if (networkType === Network.SUBSTRATE) {
      const params = {
        resource: resource as SubstrateResource,
        caipId
      };
      void this.suscribeSubstrateBalanceUpdate(params);
      this.timeout = setInterval(
        this.suscribeSubstrateBalanceUpdate,
        BALANCE_REFRESH_MS,
        params
      );
      return;
    }
    throw new Error('Unsupported resource');
  }

  resetBalance(): void {
    if (this.timeout) {
      clearInterval(this.timeout);
    }
    this.balance = ethers.constants.Zero;
  }

  subscribeERC20BalanceUpdate = (resource: EvmResource): void => {
    const provider = this.walletContext.value?.evmWallet?.provider;
    const address = this.walletContext.value?.evmWallet?.address;
    if (!provider || !address) return;

    const web3Provider = new ethers.providers.Web3Provider(provider);
    const ierc20 = ERC20__factory.connect(resource.address, web3Provider);
    void async function (this: TokenBalanceController) {
      this.loadingBalance = true;
      this.host.requestUpdate();
      this.decimals = await ierc20.decimals();
      this.balance = await ierc20.balanceOf(address);
      this.loadingBalance = false;
      this.host.requestUpdate(BALANCE_UPDATE_KEY);
    }.bind(this)();
  };

  subscribeEvmNativeBalanceUpdate = (): void => {
    const provider = this.walletContext.value?.evmWallet?.provider;
    const address = this.walletContext.value?.evmWallet?.address;
    if (!provider || !address) return;

    const web3Provider = new ethers.providers.Web3Provider(provider);
    void async function (this: TokenBalanceController) {
      this.loadingBalance = true;
      this.host.requestUpdate();
      const balance = await web3Provider.getBalance(address);
      this.loadingBalance = false;
      this.balance = balance;
      this.decimals = 18;
      this.host.requestUpdate();
    }.bind(this)();
  };

  suscribeSubstrateBalanceUpdate = (params: {
    resource: SubstrateResource;
    caipId: string;
  }): void => {
    const { resource, caipId } = params;

    const substrateProvider =
      this.substrateProviderContext.value?.substrateProviders?.get(caipId);
    const { signerAddress } = this.walletContext.value
      ?.substrateWallet as SubstrateWallet;

    if (!substrateProvider) {
      console.error('substrate provider unavailable');
      return;
    }

    void async function (this: TokenBalanceController) {
      try {
        this.loadingBalance = true;
        this.host.requestUpdate();
        const tokenBalance = await getAssetBalance(
          substrateProvider,
          resource.assetID as number,
          signerAddress
        );
        this.loadingBalance = false;
        this.balance = BigNumber.from(tokenBalance.balance.toString());
        this.decimals = resource.decimals!;
        this.host.requestUpdate(BALANCE_UPDATE_KEY);
      } catch (e) {
        console.error("Failed to fetch account's token balance", e);
        this.loadingBalance = false;
        this.host.requestUpdate();
      }
    }.bind(this)();
  };
}
