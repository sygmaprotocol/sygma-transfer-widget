import { FeeHandlerType } from '@buildwithsygma/core';
import type { BaseConfig, Network, Resource } from '@buildwithsygma/core';
import '../../../common/buttons/button';
import type { HTMLTemplateResult } from 'lit';
import { html } from 'lit';
import { when } from 'lit/directives/when.js';
import { customElement, property } from 'lit/decorators.js';
import { BigNumber } from 'ethers';
import { tokenBalanceToNumber } from '../../../../utils/token';
import { BaseComponent } from '../../../common/base-component';
import { styles } from './styles';
import { EvmFee } from '@buildwithsygma/evm';

@customElement('sygma-fungible-transfer-detail')
export class FungibleTransferDetail extends BaseComponent {
  static styles = styles;

  @property({ type: Object })
  fee?: EvmFee | null;

  @property({ type: Object })
  selectedResource?: Resource;

  @property({ type: Object })
  amountToReceive!: BigNumber;

  @property({ type: Object })
  sourceDomainConfig?: BaseConfig<Network>;

  @property({ type: Object })
  estimatedGasFee?: BigNumber;

  getSygmaFeeParams(type: FeeHandlerType): {
    decimals?: number;
    symbol: string;
  } {
    let decimals = undefined;
    let symbol = '';

    switch (type) {
      case FeeHandlerType.BASIC:
        if (this.sourceDomainConfig) {
          decimals = Number(this.sourceDomainConfig.nativeTokenDecimals);
          symbol = this.sourceDomainConfig.nativeTokenSymbol.toUpperCase();
        }
        return { decimals, symbol };
      case FeeHandlerType.PERCENTAGE:
        if (this.selectedResource) {
          symbol = this.selectedResource.symbol ?? '';
          decimals = this.selectedResource.decimals ?? undefined;
        }
        return { decimals, symbol };
      default:
        return { decimals, symbol };
    }
  }

  getGasFeeParams(): {
    decimals?: number;
    symbol: string;
  } {
    let decimals = undefined;
    let symbol = '';
    if (this.sourceDomainConfig) {
      decimals = Number(this.sourceDomainConfig.nativeTokenDecimals);
      symbol = this.sourceDomainConfig.nativeTokenSymbol.toUpperCase();
    }
    return { decimals, symbol };
  }

  getSygmaFee(): string {
    if (!this.fee) return '';
    const { symbol, decimals } = this.getSygmaFeeParams(this.fee.type);
    const { fee } = this.fee;
    let _fee = '';

    if (decimals) {
      _fee = tokenBalanceToNumber(BigNumber.from(fee.toString()), decimals, 4);
    }

    return `${_fee} ${symbol}`;
  }

  getEstimatedGasFee(): string {
    if (!this.estimatedGasFee) return '';
    const { symbol, decimals } = this.getGasFeeParams();

    if (decimals && this.estimatedGasFee) {
      const gasFee = tokenBalanceToNumber(this.estimatedGasFee, decimals, 4);
      return `${gasFee} ${symbol}`;
    }

    return 'calculating...';
  }

  render(): HTMLTemplateResult {
    return html`
      <section class="transferDetail">
        ${when(
          this.fee !== null,
          () =>
            html` <div class="transferDetailContainer">
              <div class="transferDetailContainerLabel">Amount to receive:</div>
              <div class="transferDetailContainerValue">
                ${tokenBalanceToNumber(
                  this.amountToReceive,
                  this.selectedResource?.decimals as number
                )}
                ${this.selectedResource?.symbol}
              </div>
            </div>`
        )}
        ${when(
          this.fee !== null,
          () =>
            html`<div class="transferDetailContainer">
              <div class="transferDetailContainerLabel">Bridge Fee</div>
              <div class="transferDetailContainerValue">
                ${this.getSygmaFee()}
              </div>
            </div>`
        )}
        ${when(
          this.estimatedGasFee !== undefined,
          () =>
            html`<div class="transferDetailContainer">
              <div class="transferDetailContainerLabel" id="gasFeeLabel">
                Gas Fee
              </div>
              <div class="transferDetailContainerValue" id="gasFeeValue">
                ${this.getEstimatedGasFee()}
              </div>
            </div>`
        )}
      </section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sygma-fungible-transfer-detail': FungibleTransferDetail;
  }
}
