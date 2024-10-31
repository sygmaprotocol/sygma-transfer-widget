import { type Resource } from '@buildwithsygma/sygma-sdk-core';
import type { PropertyValues } from '@lit/reactive-element';
import type { HTMLTemplateResult, PropertyDeclaration } from 'lit';
import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { when } from 'lit/directives/when.js';
import { networkIconsMap } from '../../assets';
import type { DropdownOption } from '../common/dropdown/dropdown';
import { BaseComponent } from '../common/base-component';
import { styles } from './styles';
import { EthereumConfig, SubstrateConfig } from '@buildwithsygma/core';
import { BigNumber } from 'ethers';
import { tokenBalanceToNumber } from '../../utils/token';

@customElement('sygma-resource-amount-selector')
export class ResourceAmountSelector extends BaseComponent {
  static styles = styles;

  @property({ type: Array })
  resources: Resource[] = [];

  @property({ type: Boolean })
  disabled = false;

  @property({ type: String })
  preselectedToken?: string;

  @property({ attribute: false })
  onResourceSelected: (resource: Resource) => void = () => {};

  @property({ attribute: false })
  onAmountChanged: (amount: string) => void = () => {};

  @property({ type: Object })
  sourceDomainConfig?: EthereumConfig | SubstrateConfig;

  @property() selectedResource: Resource | null = null;
  @property() validationMessage: string | null = null;
  @property() amount: string = '';

  @property() tokenBalance?: BigNumber;

  requestUpdate(
    name?: PropertyKey,
    oldValue?: unknown,
    options?: PropertyDeclaration<unknown, unknown>
  ): void {
    super.requestUpdate(name, oldValue, options);
  }

  _renderAccountBalance(): HTMLTemplateResult {
    if (this.tokenBalance && this.selectedResource) {
      return html`
        <section class="balanceContent">
          <span
            >${tokenBalanceToNumber(
              this.tokenBalance,
              this.selectedResource.decimals!,
              4
            )}</span
          >
          <button class="maxButton">Max</button>
        </section>
      `;
    }

    return html``;
  }

  _renderErrorMessages(): HTMLTemplateResult {
    return when(
      this.validationMessage,
      () =>
        html` <div class="validationMessage">${this.validationMessage}</div>`
    );
  }

  _normalizeOptions(): DropdownOption<Resource>[] {
    return when(this.resources, () =>
      this.resources.map((entry) => ({
        id: entry.resourceId,
        name: entry.symbol!,
        icon: networkIconsMap.default,
        value: entry
      }))
    );
  }

  updated(changedProperties: PropertyValues<this>): void {
    if (changedProperties.has('selectedResource')) {
      if (changedProperties.get('selectedResource') !== null) {
        this.onAmountChanged('');
      }
    }
  }

  render(): HTMLTemplateResult {
    const amountSelectorContainerClasses = classMap({
      amountSelectorContainer: true,
      hasError: !!this.validationMessage
    });

    return html`
      <div class=${amountSelectorContainerClasses}>
        <section class="tokenBalanceSection">
          <label class="amountSelectorLabel">Amount to transfer</label>
          ${this._renderAccountBalance()}
        </section>
        <section class="amountSelectorSection">
          <div class="amountWrapper">
            <input
              type="number"
              class="amountSelectorInput"
              placeholder="0.000"
              @input=${(evt: Event) =>
                this.onAmountChanged((evt.target as HTMLInputElement).value)}
              .disabled=${this.disabled}
              .value=${this.amount}
            />
            <section class="selectorSection">
              <dropdown-component
                .placeholder=${'Select token'}
                ?disabled=${this.disabled}
                .onOptionSelected=${(item: DropdownOption<Resource>) =>
                  this.onResourceSelected(item.value)}
                .options=${this._normalizeOptions()}
              ></dropdown-component>
            </section>
          </div>
          <div class="errorWrapper">${this._renderErrorMessages()}</div>
        </section>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sygma-resource-amount-selector': ResourceAmountSelector;
  }
}
