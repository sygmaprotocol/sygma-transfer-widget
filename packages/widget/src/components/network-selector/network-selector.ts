import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import {
  EthereumConfig,
  RawConfig,
  SubstrateConfig
} from '@buildwithsygma/sygma-sdk-core';
import { ifDefined } from 'lit/directives/if-defined.js';
import { map } from 'lit/directives/map.js';
import { when } from 'lit/directives/when.js';
import { styles } from './styles';
import { renderNetworkIcon } from '../../utils';

const directions = {
  from: 'From',
  to: 'To'
};

@customElement('network-selector')
export default class NetworkSelector extends LitElement {
  static styles = styles;

  @property({
    type: Array,
    hasChanged: (n, o) => n !== o
  })
  domains?: RawConfig['domains'];

  @property({
    type: Boolean
  })
  isHomechainSelector = false;

  @property({
    type: Object,
    hasChanged: (n, o) => n !== o
  })
  homechain?: EthereumConfig | SubstrateConfig;

  @property({
    type: Object
  })
  onChange?: (event: Event) => void;

  @property({
    type: String
  })
  directionLabel?: 'from' | 'to';

  @property({
    type: Number
  })
  selectedNetworkChainId?: number;

  @property({
    type: Boolean
  })
  networkIcons = false;

  renderHomechainOptions() {
    return html`<option
      value="${ifDefined(this.homechain?.id)}"
      ?selected="${!!this.homechain?.id}"
    >
      ${this.homechain?.name}
    </option>`;
  }

  renderNetworkOptions() {
    return html`${map(this.domains, (domain, idx) => {
      if (idx === 0) {
        return html`
          <option
            value="${domain.id}"
            ?selected="${this.homechain?.id === domain.id}"
          >
            Network
          </option>
          <option value="${domain.id}" P>${domain.name}</option>
        `;
      }
      return html`
        <option
          value="${domain.id}"
          ?selected="${this.homechain?.id === domain.id}"
        >
          ${domain.name}
        </option>
      `;
    })}`;
  }

  updated(): void {
    if (this.isHomechainSelector && this.homechain) {
      this.selectedNetworkChainId = this.homechain.chainId;
    }
  }

  render() {
    return html`
      <div class="selectorContainer">
        <label for="network-selector" class="directionLabel"
          >${this.directionLabel && directions[this.directionLabel]}</label
        >
        <section class="selectorSection">
          ${when(
            this.networkIcons,
            () =>
              html`<div>
                ${renderNetworkIcon(this.selectedNetworkChainId)}
              </div>`,
            () => null // do not render network icon slot
          )}
          <select
            @change=${this.onChange}
            ?disabled=${this.isHomechainSelector}
            id="network-selector"
            class="selector"
          >
            ${when(
              this.homechain,
              () => this.renderHomechainOptions(),
              () => this.renderNetworkOptions()
            )}
          </select>
        </section>
      </div>
    `;
  }
}