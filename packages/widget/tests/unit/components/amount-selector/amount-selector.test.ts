import type { Resource } from '@buildwithsygma/sygma-sdk-core';
import { ResourceType } from '@buildwithsygma/sygma-sdk-core';
import { fixture, fixtureCleanup, nextFrame } from '@open-wc/testing-helpers';
import { utils } from 'ethers';
import { html } from 'lit';
import { afterEach, assert, describe, expect, it, vi } from 'vitest';
import { AmountSelector } from '../../../../src/components';
import type { DropdownOption } from '../../../../src/components/common/dropdown/dropdown';
import { BALANCE_UPDATE_KEY } from '../../../../src/controllers/wallet-manager/token-balance';

describe('Amount selector component - sygma-resource-selector', () => {
  afterEach(() => {
    fixtureCleanup();
  });

  const resources: Resource[] = [
    {
      resourceId: 'resourceId1',
      address: 'address1',
      symbol: 'PHA',
      type: ResourceType.FUNGIBLE
    }
  ];

  it('is defined', () => {
    const el = document.createElement('sygma-resource-selector');
    assert.instanceOf(el, AmountSelector);
  });

  it('displays account balance correctly', async () => {
    const el = await fixture<AmountSelector>(
      html` <sygma-resource-selector></sygma-resource-selector>`
    );
    el.tokenBalanceController.balance = utils.parseEther('5.000199');
    el.requestUpdate();
    await el.updateComplete;

    const balanceDisplay = el.shadowRoot!.querySelector('.balanceContent span');
    assert.strictEqual(balanceDisplay!.textContent, '5.0001');
  });

  it('useMax button works', async () => {
    const balance = '100';
    const mockOptionSelectHandler = vi.fn();
    const dropdownOption: DropdownOption<Resource> = {
      name: 'Resource1',
      value: { ...resources[0] }
    };

    const el = await fixture<AmountSelector>(
      html` <sygma-resource-selector
        .resources=${resources}
        .onResourceSelected=${mockOptionSelectHandler}
      ></sygma-resource-selector>`
    );

    // Set Resource
    el._onResourceSelectedHandler(dropdownOption);
    await el.updateComplete;

    // Set Account balance
    el.tokenBalanceController.balance = utils.parseEther(balance.toString());
    el.requestUpdate();
    await el.updateComplete;

    const useMaxButton =
      el.shadowRoot!.querySelector<HTMLButtonElement>('.maxButton');
    useMaxButton?.click();
    await el.updateComplete;

    assert.equal(el.amount, '100.0');
    expect(mockOptionSelectHandler).toHaveBeenCalledOnce();
    expect(mockOptionSelectHandler).toHaveBeenCalledWith(
      el.selectedResource,
      utils.parseEther(el.amount.toString())
    );
  });

  it('resets input and acc balance on resource change', async () => {
    const mockOptionSelectHandler = vi.fn();
    const amount = '50';

    const dropdownOption: DropdownOption<Resource> = {
      name: 'Resource1',
      value: { ...resources[0] }
    };

    const el = await fixture<AmountSelector>(
      html`<sygma-resource-selector
        .resources=${resources}
        .onResourceSelected=${mockOptionSelectHandler}
      ></sygma-resource-selector>`
    );

    // Set amount
    const input = el.shadowRoot!.querySelector(
      '.amountSelectorInput'
    ) as HTMLInputElement;
    input.value = amount;
    input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    await el.updateComplete;

    //set acc balance
    el.tokenBalanceController.balance = utils.parseEther('100');
    el.requestUpdate();
    await el.updateComplete;

    el._onResourceSelectedHandler(dropdownOption);
    await el.updateComplete;

    expect(el.amount).toEqual('0');
    expect(el.tokenBalanceController.balance.toNumber()).toEqual(0);
    expect(el.tokenBalanceController.decimals).toEqual(18);
  });

  it('calls onResourceSelected callback correctly', async () => {
    const mockOptionSelectHandler = vi.fn();
    const amount = '50';
    const resources: Resource[] = [
      {
        resourceId: 'resourceId1',
        address: 'address1',
        symbol: 'PHA',
        type: ResourceType.FUNGIBLE
      }
    ];

    const dropdownOption: DropdownOption<Resource> = {
      name: 'Resource1',
      value: { ...resources[0] }
    };

    const el = await fixture<AmountSelector>(
      html`<sygma-resource-selector
        .resources=${resources}
        .onResourceSelected=${mockOptionSelectHandler}
      ></sygma-resource-selector>`
    );
    el._onResourceSelectedHandler(dropdownOption);
    await el.updateComplete;

    el.tokenBalanceController.balance = utils.parseEther('100');
    el.requestUpdate();

    // Set resource
    await el.updateComplete;
    // Set amount
    const input = el.shadowRoot!.querySelector(
      '.amountSelectorInput'
    ) as HTMLInputElement;
    input.value = amount;
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    await el.updateComplete;

    expect(mockOptionSelectHandler).toHaveBeenCalledTimes(1);
    expect(mockOptionSelectHandler).toHaveBeenCalledWith(
      el.selectedResource,
      utils.parseEther(amount)
    );
  });

  describe('Validation', () => {
    it('validates input amount when balance is low', async () => {
      const el = await fixture(
        html` <sygma-resource-selector></sygma-resource-selector>`
      );

      // input amount greater than balance
      const input = el.shadowRoot!.querySelector(
        '.amountSelectorInput'
      ) as HTMLInputElement;
      input.value = '150';
      input.dispatchEvent(new Event('input'));
      await nextFrame();

      const validationMessage = el.shadowRoot!.querySelector(
        '.validationMessage'
      ) as HTMLDivElement;
      assert.strictEqual(
        validationMessage.textContent,
        'Amount exceeds account balance'
      );
    });
    it('revalidates on account balance change', async () => {
      const el = await fixture<AmountSelector>(
        html` <sygma-resource-selector></sygma-resource-selector>`
      );

      // input amount greater than balance
      const input = el.shadowRoot!.querySelector(
        '.amountSelectorInput'
      ) as HTMLInputElement;
      input.value = '150';
      input.dispatchEvent(new Event('input'));
      await nextFrame();

      const validationMessage = el.shadowRoot!.querySelector(
        '.validationMessage'
      ) as HTMLDivElement;
      assert.strictEqual(
        validationMessage.textContent,
        'Amount exceeds account balance'
      );

      el.tokenBalanceController.balance = utils.parseUnits('400', 'ether');
      el.requestUpdate(BALANCE_UPDATE_KEY);
      await el.updateComplete;
      assert.isNull(el.shadowRoot!.querySelector('.validationMessage'));
    });

    it('validates input when amount is less than zero', async () => {
      const el = await fixture<AmountSelector>(
        html` <sygma-resource-selector></sygma-resource-selector>`
      );

      // input amount less than zero
      const input = el.shadowRoot!.querySelector(
        '.amountSelectorInput'
      ) as HTMLInputElement;
      input.value = '-2';
      input.dispatchEvent(new Event('input'));
      await el.updateComplete;

      const validationMessage = el.shadowRoot!.querySelector(
        '.validationMessage'
      ) as HTMLDivElement;
      assert.strictEqual(
        validationMessage.textContent,
        'Amount must be greater than 0'
      );
    });

    it('throw error when amount is NOT parseable', async () => {
      const el = await fixture<AmountSelector>(
        html` <sygma-resource-selector></sygma-resource-selector>`
      );

      // input amount with non-numeric value
      const input = el.shadowRoot!.querySelector(
        '.amountSelectorInput'
      ) as HTMLInputElement;
      input.value = 'nonParseableValue';
      input.dispatchEvent(new Event('input'));
      await el.updateComplete;

      const validationMessage = el.shadowRoot!.querySelector(
        '.validationMessage'
      ) as HTMLDivElement;

      assert.strictEqual(el.amount, '0');
      assert.strictEqual(validationMessage.textContent, 'Invalid amount value');
    });
  });
});
