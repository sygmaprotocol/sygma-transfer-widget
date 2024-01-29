import { css } from 'lit';

export const styles = css`
  .selectorContainer {
    border-radius: 24px;
    border: 1px solid var(--zinc-200);
    display: flex;
    width: 314px;
    padding: 12px 16px;
    flex-direction: column;
    justify-content: center;
    align-items: stretch;
    gap: 4px;
  }

  .directionLabel {
    color: var(--zinc-400);
    font-size: 14px;
    font-weight: 500;
    line-height: 20px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .baseSelector {
    width: 100%;
  }

  .selector {
    width: 100%;
    color: var(--neutral-600);
    font-size: 18px;
    font-weight: 500;
    line-height: 26px;
    border: none;
  }

  .selectorSection {
    display: flex;
    align-items: center;
    gap: 12px;
  }
`;
