import { ApiPromise, WsProvider } from '@polkadot/api';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { SubstrateWallet } from '../../../../src/controllers/wallet-manager/wallets';

vi.mock('@polkadot/api', async () => {
  const mod =
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    await vi.importActual<typeof import('@polkadot/api')>('@polkadot/api');
  const WsProviderMock = vi.fn();
  const ApiPromiseMock = {
    create: async () => {}
  };
  return {
    ...mod,
    WsProvider: WsProviderMock,
    ApiPromise: ApiPromiseMock
  };
});

describe('SubstrateWallet', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be able to create an instance of SubstrateWallet passing an ApiPromise', async () => {
    const wsProvider = new WsProvider('wss:someurl');
    const apiPromise = await ApiPromise.create({ provider: wsProvider });

    const substrateWallet = SubstrateWallet.initFromApiPromise(apiPromise);
    expect(substrateWallet).toBeInstanceOf(SubstrateWallet);
  });

  it('should be able to create an instance of SubstrateWallet passing a wssProvider', async () => {
    const substrateWallet =
      await SubstrateWallet.initFromWssProvider('wss:someurl');
    expect(substrateWallet).toBeInstanceOf(SubstrateWallet);
  });
});
