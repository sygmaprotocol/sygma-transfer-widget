import '../../../common/buttons/button';
import type { HTMLTemplateResult } from 'lit';
import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Button } from '../../../common';
import { BaseComponent } from '../../../common/base-component';

@customElement('sygma-fungible-transfer-button')
export class FungibleTransferButton extends BaseComponent {
  @property({ type: String })
  text: string = '';

  @property({ type: Object })
  onClick: () => void = () => {};

  @property({ type: Boolean })
  isLoading = false;

  @property({ type: Boolean })
  disabled = false;

  render(): HTMLTemplateResult {
    return html`<sygma-action-button
      .disabled=${this.disabled}
      .isLoading=${this.isLoading}
      .text=${this.text}
      @click=${this.onClick}
    ></sygma-action-button>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sygma-fungible-transfer-button': Button;
  }
}
