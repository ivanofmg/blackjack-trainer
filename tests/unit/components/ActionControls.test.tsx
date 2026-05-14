import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ActionControls } from '@/components/game/ActionControls';

type ActionName = 'hit' | 'stand' | 'double' | 'split' | 'surrender';

type MockStoreState = Readonly<{
  phase: 'betting' | 'playerTurn';
  legalActions: ReadonlyArray<ActionName>;
  hit: () => void;
  stand: () => void;
  double: () => void;
  split: () => void;
  surrender: () => void;
}>;

const actionSpies = {
  hit: vi.fn(),
  stand: vi.fn(),
  double: vi.fn(),
  split: vi.fn(),
  surrender: vi.fn(),
};

let mockState: MockStoreState = {
  phase: 'playerTurn',
  legalActions: ['hit', 'stand'],
  hit: actionSpies.hit,
  stand: actionSpies.stand,
  double: actionSpies.double,
  split: actionSpies.split,
  surrender: actionSpies.surrender,
};

vi.mock('@/store/gameStore', () => {
  return {
    useGameStore: (selector: (state: MockStoreState) => unknown) => selector(mockState),
    selectLegalActions: (state: MockStoreState) => state.legalActions,
  };
});

describe('ActionControls', () => {
  beforeEach(() => {
    actionSpies.hit.mockReset();
    actionSpies.stand.mockReset();
    actionSpies.double.mockReset();
    actionSpies.split.mockReset();
    actionSpies.surrender.mockReset();

    mockState = {
      phase: 'playerTurn',
      legalActions: ['hit', 'stand'],
      hit: actionSpies.hit,
      stand: actionSpies.stand,
      double: actionSpies.double,
      split: actionSpies.split,
      surrender: actionSpies.surrender,
    };
  });

  it('renders all buttons and disables unavailable actions', () => {
    render(<ActionControls />);

    expect(screen.getByRole('button', { name: 'Hit' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Stand' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Double' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Split' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Surrender' })).toBeDisabled();
  });

  it('clicking enabled buttons calls the right store actions', () => {
    mockState = {
      ...mockState,
      legalActions: ['hit', 'stand', 'double', 'split', 'surrender'],
    };

    render(<ActionControls />);

    fireEvent.click(screen.getByRole('button', { name: 'Hit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Stand' }));
    fireEvent.click(screen.getByRole('button', { name: 'Double' }));
    fireEvent.click(screen.getByRole('button', { name: 'Split' }));
    fireEvent.click(screen.getByRole('button', { name: 'Surrender' }));

    expect(actionSpies.hit).toHaveBeenCalledTimes(1);
    expect(actionSpies.stand).toHaveBeenCalledTimes(1);
    expect(actionSpies.double).toHaveBeenCalledTimes(1);
    expect(actionSpies.split).toHaveBeenCalledTimes(1);
    expect(actionSpies.surrender).toHaveBeenCalledTimes(1);
  });

  it('does not render outside playerTurn', () => {
    mockState = {
      ...mockState,
      phase: 'betting',
    };

    const { container } = render(<ActionControls />);
    expect(container).toBeEmptyDOMElement();
  });
});
