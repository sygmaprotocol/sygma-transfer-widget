import { ReactiveController, ReactiveElement } from 'lit';
import {
  Config,
  Environment,
  getRoutes,
  RouteType,
  SygmaDomainConfig,
  type Domain,
  type Resource,
  type Route
} from '@buildwithsygma/core';
import { BigNumber } from 'ethers';
import { ContextConsumer } from '@lit/context';
import { walletContext } from '../context';
import { substrateProviderContext } from '../context/wallet';
import { SdkInitializedEvent } from '../interfaces';
import { TransferElement } from '../interfaces';
import { parseUnits } from 'ethers/lib/utils';

export class SelectionsController implements ReactiveController {
  config: Config;

  environment!: Environment;
  selectedResource?: Resource;
  selectedSource?: Domain;
  selectedDestination?: Domain;
  specifiedTransferAmount?: bigint;
  recipientAddress: string = '';

  bigAmount?: BigNumber;
  displayAmount: string = '';

  allDomains: Domain[] = [];
  selectableSourceDomains: Domain[];
  selectableDestinationDomains: Domain[];
  selectableResources: Resource[];

  routesStorage: Map<string, Route[]> = new Map();
  host: TransferElement;
  walletContext: ContextConsumer<typeof walletContext, ReactiveElement>;
  substrateProviderContext: ContextConsumer<
    typeof substrateProviderContext,
    ReactiveElement
  >;

  get sourceDomainConfig(): SygmaDomainConfig | undefined {
    if (this.selectedSource) {
      return this.config.getDomainConfig(this.selectedSource);
    }
  }

  async initialize(params: { environment?: Environment }) {
    this.environment = params.environment ?? Environment.MAINNET;
    await this.config.init(this.environment);
    this.allDomains = this.config.getDomains();
    this.selectableSourceDomains = this.allDomains;
    this.selectableDestinationDomains = this.allDomains;
    this.host.requestUpdate();
    this.host.dispatchEvent(new SdkInitializedEvent({ hasInitialized: true }));
  }

  constructor(host: TransferElement) {
    this.config = new Config();
    this.allDomains = [];
    this.selectableSourceDomains = [];
    this.selectableDestinationDomains = [];
    this.selectableResources = [];

    this.host = host;
    this.host.addController(this);

    this.walletContext = new ContextConsumer(host, {
      context: walletContext,
      subscribe: true
    });

    this.substrateProviderContext = new ContextConsumer(host, {
      context: substrateProviderContext,
      subscribe: true
    });
  }

  resetResource() {
    this.selectedResource = undefined;
    this.specifiedTransferAmount = undefined;
  }

  resetRecipientAddress() {
    this.recipientAddress = '';
  }

  hostConnected(): void {}

  handleInputUpdate(params: {
    source?: Domain;
    recipientAddress?: string;
    destination?: Domain;
    amount?: string;
    resource?: Resource;
  }) {
    if (params.source) {
      this.selectSource(params.source);
    } else if (params.recipientAddress) {
      this.setRecipientAddress(params.recipientAddress);
    } else if (params.resource) {
      this.selectResource(params.resource);
    } else if (params.destination) {
      this.selectDestination(params.destination);
    } else if (params.amount || params.amount === '') {
      this.setAmount(params.amount);
    }

    this.host.validationController.updateState();
    this.host.transactionBuilderController.buildTransfer();
    this.host.requestUpdate();
  }

  private selectSource(domain: Domain): void {
    if (this.selectedDestination) {
      this.resetResource();
      this.resetRecipientAddress();
      this.selectedDestination = undefined;
    }

    this.selectedSource = domain;
    void this.populateDestinations(domain);
  }

  private selectDestination(domain: Domain): void {
    if (this.selectedDestination) {
      this.resetResource();
      this.resetRecipientAddress();
    }

    this.selectedDestination = domain;
    if (this.selectedSource) {
      this.populateResources(this.selectedSource, domain);
    }
  }

  private selectResource(resource?: Resource) {
    if (this.selectedResource) {
      this.host.tokenBalanceController.resetBalance();
    }

    if (resource) {
      this.host.tokenBalanceController.startBalanceUpdates(
        resource,
        this.selectedSource!.type,
        this.selectedSource?.caipId!
      );
    }
    this.selectedResource = resource;
  }

  private setAmount(amount: string) {
    if (this.selectedResource && this.selectedResource.decimals) {
      if (amount === '') {
        this.bigAmount = BigNumber.from(0);
      } else {
        this.bigAmount = parseUnits(amount, this.selectedResource.decimals);
      }
    }
    this.displayAmount = amount;
  }

  private setRecipientAddress = (address: string): void => {
    this.recipientAddress = address;
  };

  private async populateDestinations(source: Domain) {
    if (!this.routesStorage.has(source.caipId)) {
      this.routesStorage.set(
        source.caipId,
        await getRoutes(source, this.environment, {
          routeTypes: [RouteType.FUNGIBLE]
        })
      );
    }

    const routes = this.routesStorage.get(source.caipId)!;
    const destinations = new Set(routes.map((route) => route.toDomain.chainId));

    this.selectableDestinationDomains = this.allDomains.filter((domain) => {
      return destinations.has(domain.chainId);
    });

    this.host.requestUpdate();
  }

  private async populateResources(source: Domain, destination: Domain) {
    const routes = this.routesStorage.get(source.caipId);

    if (!routes) {
      this.selectableResources = [];
    }

    if (routes) {
      const routesWithDestination = new Set(
        routes
          .filter((route) => {
            return route.toDomain.caipId === destination.caipId;
          })
          .map((route) => route.resource.resourceId)
      );

      const resources = this.config.getResources(source);
      this.selectableResources = resources.filter((resource) => {
        return routesWithDestination.has(resource.resourceId);
      });
    }

    this.host.requestUpdate();
  }

  reset() {
    this.host.tokenBalanceController.resetBalance();
    this.bigAmount = BigNumber.from(0);
    this.displayAmount = '';
    this.recipientAddress = '';
    this.selectedDestination = undefined;
    this.selectedResource = undefined;
    this.selectedSource = undefined;
  }
}
