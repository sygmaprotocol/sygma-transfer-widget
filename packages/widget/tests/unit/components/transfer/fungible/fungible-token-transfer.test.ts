import { Environment } from '@buildwithsygma/sygma-sdk-core';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers';
import { html } from 'lit';
import { afterEach, assert, describe, it, vi } from 'vitest';
import type { AddressInput } from '../../../../../src/components';
import { FungibleTokenTransfer } from '../../../../../src/components';
import type { WalletContextProvider } from '../../../../../src/context';
import { WalletUpdateEvent } from '../../../../../src/context';

vi.mock('@polkadot/api');
vi.mock(
  '@buildwithsygma/sygma-sdk-core',

  async (importOriginal) => {
    const mod =
      // eslint-disable-next-line @typescript-eslint/consistent-type-imports
      await importOriginal<typeof import('@buildwithsygma/sygma-sdk-core')>();
    const modConfig = vi.fn<[], typeof mod.Config>();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    modConfig.prototype.init = vi.fn();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    modConfig.prototype.getDomains = vi.fn().mockReturnValue([
      { id: 2, chainId: 11155111, name: 'sepolia', type: 'evm' },
      { id: 3, chainId: 5231, name: 'rococo-phala', type: 'substrate' },
      { id: 5, chainId: 338, name: 'cronos', type: 'evm' },
      { id: 6, chainId: 17000, name: 'holesky', type: 'evm' },
      { id: 8, chainId: 421614, name: 'arbitrum_sepolia', type: 'evm' },
      { id: 9, chainId: 10200, name: 'gnosis_chiado', type: 'evm' },
      { id: 10, chainId: 84532, name: 'base_sepolia', type: 'evm' }
    ]);
    const modGetRoutes = vi.fn().mockReturnValue([
      {
        fromDomain: { id: 2, chainId: 11155111, name: 'sepolia', type: 'evm' },
        toDomain: { id: 10, chainId: 84532, name: 'base_sepolia', type: 'evm' },
        resource: {
          resourceId: '123',
          type: 'fungible',
          address: '0x123',
          symbol: 'sygUSDC'
        }
      },
      {
        fromDomain: { id: 2, chainId: 11155111, name: 'sepolia', type: 'evm' },
        toDomain: { id: 10, chainId: 84532, name: 'base_sepolia', type: 'evm' },
        resource: {
          resourceId: '124',
          type: 'fungible',
          address: '0x123',
          symbol: 'ERC20LRTest'
        }
      }
    ]);
    return {
      ...mod,
      Config: modConfig,
      getRoutes: modGetRoutes
    };
  }
);

describe('Fungible token Transfer', function () {
  afterEach(() => {
    fixtureCleanup();
  });

  it('is defined', async () => {
    const el = await fixture(
      html` <sygma-fungible-transfer
        .environment=${Environment.TESTNET}
      ></sygma-fungible-transfer>`
    );

    assert.instanceOf(el, FungibleTokenTransfer);
  });

  // it('Fill the destination address -> when networks types are the same', async () => {
  //   const connectedAddress = '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5';
  //   const walletContext = await fixture<WalletContextProvider>(html`
  //     <sygma-wallet-context-provider></sygma-wallet-context-provider>
  //   `);

  //   walletContext.dispatchEvent(
  //     new WalletUpdateEvent({
  //       evmWallet: {
  //         address: connectedAddress,
  //         providerChainId: 1,
  //         provider: getMockedEvmWallet().provider
  //       }
  //     })
  //   );
  //   const fungibleTransfer = await fixture<FungibleTokenTransfer>(
  //     html` <sygma-fungible-transfer
  //       .environment=${Environment.TESTNET}
  //     ></sygma-fungible-transfer>`,
  //     { parentNode: walletContext }
  //   );

  //   // Set Source and Destination Networks
  //   fungibleTransfer.transferController.onSourceNetworkSelected(sepoliaNetwork);
  //   fungibleTransfer.transferController.onDestinationNetworkSelected(
  //     baseSepolia
  //   );
  //   fungibleTransfer.requestUpdate();
  //   await fungibleTransfer.updateComplete;

  //   const sygmaAddressInput = fungibleTransfer.shadowRoot!.querySelector(
  //     'sygma-address-input'
  //   ) as AddressInput;

  //   assert(sygmaAddressInput.address === connectedAddress);
  // });

  it('Should NOT fill the destination address -> when networks type is substrate', async () => {
    const walletContext = await fixture<WalletContextProvider>(html`
      <sygma-wallet-context-provider></sygma-wallet-context-provider>
    `);

    walletContext.dispatchEvent(
      new WalletUpdateEvent({
        substrateWallet: {
          accounts: [
            {
              address: '155EekKo19tWKAPonRFywNVsVduDegYChrDVsLE8HKhXzjqe'
            }
          ],
          signer: {},
          signerAddress: '155EekK'
        }
      })
    );

    const fungibleTransfer = await fixture<FungibleTokenTransfer>(
      html` <sygma-fungible-transfer
        .environment=${Environment.TESTNET}
      ></sygma-fungible-transfer>`,
      { parentNode: walletContext }
    );

    const sygmaAddressInput = fungibleTransfer.shadowRoot!.querySelector(
      'sygma-address-input'
    ) as AddressInput;

    assert.equal(sygmaAddressInput.address, '');
  });

  // it('should filter whitelisted networks and resources', async () => {
  //   const walletContext = await fixture<WalletContextProvider>(html`
  //     <sygma-wallet-context-provider></sygma-wallet-context-provider>
  //   `);

  //   const fungibleTransfer = await fixture<FungibleTokenTransfer>(
  //     html` <sygma-fungible-transfer
  //       .whitelistedSourceNetworks=${whitelistedSourceNetworks}
  //       .whitelistedDestinationNetworks=${whitelistedDestinationNetworks}
  //       .whitelistedSourceResources=${whitelistedResources}
  //       .environment=${Environment.TESTNET}
  //     ></sygma-fungible-transfer>`,
  //     { parentNode: walletContext }
  //   );

  //   walletContext.dispatchEvent(
  //     new WalletUpdateEvent({
  //       evmWallet: {
  //         address: connectedAddress,
  //         providerChainId: 11155111,
  //         provider: getMockedEvmWallet().provider
  //       }
  //     })
  //   );

  //   await fungibleTransfer.updateComplete;

  //   containsWhitelistedData(
  //     fungibleTransfer.transferController.supportedSourceNetworks,
  //     whitelistedSourceNetworks,
  //     (network) => network.name,
  //     'transfer controller for source networks'
  //   );

  //   containsWhitelistedData(
  //     fungibleTransfer.transferController.supportedDestinationNetworks,
  //     whitelistedDestinationNetworks,
  //     (network) => network.name,
  //     'transfer controller for destination networks'
  //   );

  //   // Set Source and Destination Networks
  //   fungibleTransfer.transferController.onSourceNetworkSelected(sepoliaNetwork);
  //   fungibleTransfer.transferController.onDestinationNetworkSelected(
  //     baseSepolia
  //   );
  //   fungibleTransfer.requestUpdate();
  //   await fungibleTransfer.updateComplete;

  //   const [sygmaSourceNetwork, sygmaDestinationNetwork] =
  //     fungibleTransfer.shadowRoot!.querySelectorAll('sygma-network-selector');

  //   const resourceSelector = fungibleTransfer.shadowRoot!.querySelector(
  //     'sygma-resource-amount-selector'
  //   ) as ResourceAmountSelector;

  //   containsWhitelistedData(
  //     fungibleTransfer.transferController.supportedResources,
  //     whitelistedResources,
  //     (resource) => resource.symbol!,
  //     'transfer controller for resources'
  //   );

  //   assert.isTrue(
  //     whitelistedSourceNetworks.includes(
  //       sygmaSourceNetwork.networks?.[0]?.name
  //     ),
  //     `Expected source network to be one of ${whitelistedSourceNetworks.join(', ')}, but got ${sygmaSourceNetwork.networks?.[0]?.name}`
  //   );
  //   assert.isTrue(
  //     whitelistedDestinationNetworks.includes(
  //       sygmaDestinationNetwork.networks?.[0]?.name
  //     ),
  //     `Expected destination network to be one of ${whitelistedDestinationNetworks.join(', ')}, but got ${sygmaDestinationNetwork.networks?.[0]?.name}`
  //   );
  //   assert.isTrue(
  //     whitelistedResources.includes(
  //       resourceSelector.resources[0]?.symbol || ''
  //     ),
  //     `Expected Resource to be one of ${whitelistedResources.join(', ')}, but got ${resourceSelector.resources.join(', ')}`
  //   );
  // });

  // it('should re-init the transfer controller -> when networks or resources are updated', async () => {
  //   const walletContext = await fixture<WalletContextProvider>(html`
  //     <sygma-wallet-context-provider></sygma-wallet-context-provider>
  //   `);

  //   const fungibleTransfer = await fixture<FungibleTokenTransfer>(
  //     html` <sygma-fungible-transfer
  //       .whitelistedSourceNetworks=${whitelistedSourceNetworks}
  //       .whitelistedDestinationNetworks=${whitelistedDestinationNetworks}
  //       .whitelistedSourceResources=${whitelistedResources}
  //       .environment=${Environment.TESTNET}
  //     ></sygma-fungible-transfer>`,
  //     { parentNode: walletContext }
  //   );
  //   const spyInit = vi.spyOn(fungibleTransfer.transferController, 'init');

  //   fungibleTransfer.whitelistedSourceNetworks = ['cronos'];
  //   fungibleTransfer.whitelistedDestinationNetworks = ['sepolia'];
  //   fungibleTransfer.whitelistedSourceResources = ['ERC20LRTest'];

  //   fungibleTransfer.requestUpdate();
  //   await fungibleTransfer.updateComplete;

  //   expect(spyInit).toHaveBeenCalledTimes(1);
  //   expect(spyInit).toHaveBeenCalledWith(Environment.TESTNET, {
  //     whitelistedSourceNetworks: ['cronos'],
  //     whitelistedDestinationNetworks: ['sepolia'],
  //     whitelistedSourceResources: ['ERC20LRTest']
  //   });

  //   await waitUntil(
  //     () => {
  //       if (
  //         fungibleTransfer.transferController.supportedSourceNetworks.length > 0
  //       ) {
  //         return true;
  //       }
  //       return undefined;
  //     },
  //     '',
  //     { interval: 1, timeout: 100 }
  //   );

  //   containsWhitelistedData(
  //     fungibleTransfer.transferController.supportedSourceNetworks,
  //     ['cronos'],
  //     (network) => network.name,
  //     'transfer controller for source networks'
  //   );

  //   containsWhitelistedData(
  //     fungibleTransfer.transferController.supportedDestinationNetworks,
  //     ['sepolia'],
  //     (network) => network.name,
  //     'transfer controller for source networks'
  //   );

  //   // Set Source Network
  //   fungibleTransfer.transferController.onSourceNetworkSelected(cronosNetwork);
  //   fungibleTransfer.requestUpdate();
  //   await fungibleTransfer.updateComplete;

  //   containsWhitelistedData(
  //     fungibleTransfer.transferController.supportedResources,
  //     ['ERC20LRTest'],
  //     (resource) => resource.symbol!,
  //     'transfer controller for resources'
  //   );

  //   spyInit.mockRestore();
  // });
});
