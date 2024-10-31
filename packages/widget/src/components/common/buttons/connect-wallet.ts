import type { Domain } from '@buildwithsygma/core';
import { consume } from '@lit/context';
import type { HTMLTemplateResult, PropertyValues, TemplateResult } from 'lit';
import { html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { when } from 'lit/directives/when.js';

import { choose } from 'lit/directives/choose.js';
import { greenCircleIcon, plusIcon } from '../../../assets';
import type { ConfigContext, WalletContext } from '../../../context';
import { configContext, walletContext } from '../../../context';
import { WalletController } from '../../../controllers';
import { shortAddress } from '../../../utils';
import { BaseComponent } from '../base-component';

import { WalletContextKeys } from '../../../context/wallet';
import { connectWalletStyles } from './connect-wallet.styles';

@customElement('sygma-connect-wallet-btn')
export class ConnectWalletButton extends BaseComponent {
  static styles = connectWalletStyles;

  @property({
    type: Object,
    attribute: true,
    hasChanged: (value: Domain, old: Domain) => {
      return value?.id !== old?.id;
    }
  })
  sourceNetwork?: Domain;

  @consume({ context: walletContext, subscribe: true })
  @state()
  private wallets!: WalletContext;

  @consume({ context: configContext, subscribe: true })
  @state()
  private configContext!: ConfigContext;

  private walletController = new WalletController(this);

  updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);
    if (changedProperties.has('sourceNetwork')) {
      this.walletController.sourceNetworkUpdated(this.sourceNetwork);
    }
  }

  private onConnectClicked = (): void => {
    if (this.sourceNetwork) {
      this.walletController.connectWallet(
        this.sourceNetwork,
        this.configContext
      );
    }
  };

  private onDisconnectClicked = (): void => {
    this.walletController.disconnectWallet();
  };

  private isWalletConnected(): boolean {
    return !!this.wallets.evmWallet || !!this.wallets.substrateWallet?.signer;
  }

  private renderConnectWalletButton(): HTMLTemplateResult | undefined {
    if (this.wallets.substrateWallet?.signer) return;

    return when(
      this.isWalletConnected(),
      () =>
        html` <button
          role="button"
          @click=${this.onDisconnectClicked}
          class="connectWalletButton"
        >
          Disconnect
        </button>`,
      () =>
        html` <button
          @click=${this.onConnectClicked}
          role="button"
          class="connectWalletButton"
        >
          ${plusIcon} Connect Wallet
        </button>`
    );
  }

  private renderWalletAddress(): TemplateResult | undefined {
    const evmWallet = this.wallets.evmWallet;
    const activeWalletKey = (
      Object.keys(this.wallets) as (keyof typeof this.wallets)[]
    ).find((key) => !!this.wallets[key]);

    return choose(activeWalletKey, [
      [
        WalletContextKeys.EVM_WALLET,
        () =>
          html`<span
            class="walletAddress"
            title=${ifDefined(evmWallet?.address)}
          >
            ${greenCircleIcon} ${shortAddress(evmWallet?.address ?? '')}
          </span>`
      ],
      [
        WalletContextKeys.SUBSTRATE_WALLET,
        () => html`
          <sygma-substrate-account-selector></sygma-substrate-account-selector>
        `
      ]
    ]);
  }

  render(): HTMLTemplateResult {
    return html` <div class="connectWalletContainer">
      ${this.renderWalletAddress()} ${this.renderConnectWalletButton()}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sygma-connect-wallet-btn': ConnectWalletButton;
  }
}
