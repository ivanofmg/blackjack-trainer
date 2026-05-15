import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ActionControls } from '@/components/game/ActionControls';
import { DEFAULT_RULES } from '@/lib/blackjack/types';

type ActionName = 'hit' | 'stand' | 'double' | 'split' | 'surrender';

type MockStoreState = Readonly<{
  phase: 'betting' | 'playerTurn';
  legalActions: ReadonlyArray<ActionName>;
  decisionContext: null | {
    playerHand: {
      cards: ReadonlyArray<{ rank: '10' | '6'; suit: 'clubs' }>;
      bet: number;
      isDoubled: boolean;
      isSplit: boolean;
      isSurrendered: boolean;
      isStood: boolean;
    };
    dealerUpcard: { rank: 'A'; suit: 'clubs' };
    legalActions: ReadonlyArray<ActionName>;
    rules: typeof DEFAULT_RULES;
  };
  hit: () => void;
  stand: () => void;
  double: () => void;
  split: () => void;
  surrender: () => void;
}>;

type MockTrainerState = Readonly<{
  mode: 'off' | 'tutor' | 'exam';
  recordDecision: (params: unknown) => void;
}>;

const actionSpies = {
  hit: vi.fn(),
  stand: vi.fn(),
  double: vi.fn(),
  split: vi.fn(),
  surrender: vi.fn(),
};
const recordDecisionSpy = vi.fn();

let mockState: MockStoreState = {
  phase: 'playerTurn',
  legalActions: ['hit', 'stand'],
  decisionContext: {
    playerHand: {
      cards: [
        { rank: '10', suit: 'clubs' },
        { rank: '6', suit: 'clubs' },
      ],
      bet: 10,
      isDoubled: false,
      isSplit: false,
      isSurrendered: false,
      isStood: false,
    },
    dealerUpcard: { rank: 'A', suit: 'clubs' },
    legalActions: ['hit', 'stand'],
    rules: DEFAULT_RULES,
  },
  hit: actionSpies.hit,
  stand: actionSpies.stand,
  double: actionSpies.double,
  split: actionSpies.split,
  surrender: actionSpies.surrender,
};
let trainerState: MockTrainerState = {
  mode: 'off',
  recordDecision: recordDecisionSpy,
};

vi.mock('@/store/gameStore', () => {
  return {
    useGameStore: (selector: (state: MockStoreState) => unknown) => selector(mockState),
    selectLegalActions: (state: MockStoreState) => state.legalActions,
    selectDecisionContext: (state: MockStoreState) => state.decisionContext,
  };
});

vi.mock('@/store/trainerStore', () => ({
  useTrainerStore: (selector: (state: MockTrainerState) => unknown) => selector(trainerState),
}));

describe('ActionControls', () => {
  beforeEach(() => {
    actionSpies.hit.mockReset();
    actionSpies.stand.mockReset();
    actionSpies.double.mockReset();
    actionSpies.split.mockReset();
    actionSpies.surrender.mockReset();
    recordDecisionSpy.mockReset();

    mockState = {
      phase: 'playerTurn',
      legalActions: ['hit', 'stand'],
      decisionContext: {
        playerHand: {
          cards: [
            { rank: '10', suit: 'clubs' },
            { rank: '6', suit: 'clubs' },
          ],
          bet: 10,
          isDoubled: false,
          isSplit: false,
          isSurrendered: false,
          isStood: false,
        },
        dealerUpcard: { rank: 'A', suit: 'clubs' },
        legalActions: ['hit', 'stand'],
        rules: DEFAULT_RULES,
      },
      hit: actionSpies.hit,
      stand: actionSpies.stand,
      double: actionSpies.double,
      split: actionSpies.split,
      surrender: actionSpies.surrender,
    };
    trainerState = {
      mode: 'off',
      recordDecision: recordDecisionSpy,
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

  it('records decisions in tutor/exam mode before executing action', () => {
    trainerState = { mode: 'tutor', recordDecision: recordDecisionSpy };
    render(<ActionControls />);

    fireEvent.click(screen.getByRole('button', { name: 'Hit' }));
    expect(recordDecisionSpy).toHaveBeenCalledTimes(1);
    expect(actionSpies.hit).toHaveBeenCalledTimes(1);

    const payload = recordDecisionSpy.mock.calls[0][0] as { chosenAction: ActionName };
    expect(payload.chosenAction).toBe('hit');
  });

  it('does not record decisions when trainer mode is off', () => {
    trainerState = { mode: 'off', recordDecision: recordDecisionSpy };
    render(<ActionControls />);
    fireEvent.click(screen.getByRole('button', { name: 'Hit' }));

    expect(recordDecisionSpy).not.toHaveBeenCalled();
    expect(actionSpies.hit).toHaveBeenCalledTimes(1);
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
