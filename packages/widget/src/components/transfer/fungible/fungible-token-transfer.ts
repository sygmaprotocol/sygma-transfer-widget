import type { Domain, Resource } from '@buildwithsygma/core';
import { Environment } from '@buildwithsygma/sygma-sdk-core';
import type { HTMLTemplateResult } from 'lit';
import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '../../../context/wallet';

import '../../common/buttons/button';
import '../../address-input';
import '../../resource-amount-selector';
import './transfer-button';
import './transfer-detail';
import './transfer-status';
import '../../network-selector';
import { BaseComponent } from '../../common';
import { Directions } from '../../network-selector/network-selector';
import { WalletController } from '../../../controllers';
import { styles } from './styles';
import { SelectionsController } from '../../../controllers/selections';
import { ValidationController } from '../../../controllers/validation';
import { TransactionBuilderController } from '../../../controllers/transactionBuilder';
import { ExecutionController } from '../../../controllers/execution';
import { BigNumber } from 'ethers';
import { TransferElement } from '../../../interfaces';
@customElement('sygma-fungible-transfer')
export class FungibleTokenTransfer
  extends BaseComponent
  implements TransferElement
{
  static styles = styles;

  @property({ type: String })
  environment?: Environment = Environment.MAINNET;

  @property({ type: Object })
  whitelistedSourceNetworks?: string[];

  @property({ type: Object })
  whitelistedDestinationNetworks?: string[];

  @property({ type: Object })
  whitelistedSourceResources?: string[];

  @property({ type: Object })
  onSourceNetworkSelected?: (domain: Domain) => void;

  walletController: WalletController;
  selectionsController: SelectionsController;
  validationController: ValidationController;
  transactionBuilderController: TransactionBuilderController;
  executionController: ExecutionController;

  constructor() {
    super();
    this.walletController = new WalletController(this);
    this.selectionsController = new SelectionsController(this);
    this.validationController = new ValidationController(this);
    this.transactionBuilderController = new TransactionBuilderController(this);
    this.executionController = new ExecutionController(this);
  }

  connectedCallback(): void {
    super.connectedCallback();

    void this.selectionsController.initialize({
      environment: this.environment
    });
  }

  private onClick = (): void => {
    this.executionController.execute();
  };

  renderTransferStatus(): HTMLTemplateResult {
    return html` <section>
      <sygma-transfer-status
        .amount=${this.selectionsController.bigAmount}
        .tokenDecimals=${this.selectionsController.selectedResource?.decimals}
        .destinationNetworkName=${this.selectionsController.selectedDestination
          ?.name}
        .sourceNetworkName=${this.selectionsController.selectedSource?.name}
        .resourceSymbol=${this.selectionsController.selectedResource?.symbol}
        .explorerLinkTo=${''}
      >
      </sygma-transfer-status>
    </section>`;

    //   <sygma-fungible-transfer-button
    //   .state=${FungibleTransferState.COMPLETED}
    //   .onClick=${this.onClick}
    // ></sygma-fungible-transfer-button>
  }

  renderTransfer(): HTMLTemplateResult {
    const {
      sourceDomainConfig,
      recipientAddress,
      selectedDestination,
      selectedResource,
      selectedSource,
      selectableDestinationDomains,
      selectableResources,
      selectableSourceDomains
    } = this.selectionsController;

    const onSourceNetworkSelection = (network?: Domain) => {
      if (network) {
        this.selectionsController.handleInputUpdate({ source: network });
        if (this.onSourceNetworkSelected) {
          this.onSourceNetworkSelected(network);
        }
      }
    };

    const onDestinationNetworkSelection = (network?: Domain) => {
      if (network) {
        this.selectionsController.handleInputUpdate({ destination: network });
      }
    };

    const onResourceSelection = (resource: Resource) => {
      this.selectionsController.handleInputUpdate({ resource });
    };

    const onRecipientAddressUpdate = (recipientAddress: string) => {
      this.selectionsController.handleInputUpdate({ recipientAddress });
    };

    const onAmountChanged = (amount: string) => {
      this.selectionsController.handleInputUpdate({ amount });
    };

    return html` <form @submit=${() => {}}>
      <section class="networkSelectionWrapper">
        <sygma-network-selector
          .selectedNetwork=${selectedSource?.name}
          .direction=${Directions.FROM}
          .icons=${true}
          .onNetworkSelected=${onSourceNetworkSelection}
          .networks=${selectableSourceDomains}
        >
        </sygma-network-selector>
      </section>
      <section class="networkSelectionWrapper">
        <sygma-network-selector
          .selectedNetwork=${selectedDestination?.name}
          .direction=${Directions.TO}
          .icons=${true}
          .disabled=${!selectedSource}
          .onNetworkSelected=${onDestinationNetworkSelection}
          .networks=${selectableDestinationDomains}
        >
        </sygma-network-selector>
      </section>
      <section>
        <sygma-resource-amount-selector
          .sourceDomainConfig=${sourceDomainConfig}
          .disabled=${!selectedSource || !selectedDestination}
          .resources=${selectableResources}
          .selectedResource=${selectedResource}
          .onResourceSelected=${onResourceSelection}
          .onAmountChanged=${onAmountChanged}
          .validationMessage=${this.validationController
            .resourceAmountErrorMessage}
        >
        </sygma-resource-amount-selector>
      </section>
      <section>
        <sygma-address-input
          .networkType=${selectedDestination?.type}
          .address=${recipientAddress}
          .onAddressChange=${onRecipientAddressUpdate}
        >
        </sygma-address-input>
      </section>
      <section>
        <sygma-fungible-transfer-detail
          .amountToReceive=${BigNumber.from(0)}
          .sourceDomainConfig=${sourceDomainConfig}
          .selectedResource=${selectedResource}
        ></sygma-fungible-transfer-detail>
      </section>
      <section>
        <sygma-fungible-transfer-button
          .text=${this.validationController.transferButtonText}
          .disabled=${this.validationController.transferButtonDisabled}
          .isLoading=${this.validationController.transferButtonLoading}
          .onClick=${this.onClick}
        ></sygma-fungible-transfer-button>
      </section>
    </form>`;
  }

  render(): HTMLTemplateResult {
    return this.renderTransfer();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sygma-fungible-transfer': FungibleTokenTransfer;
  }
}
