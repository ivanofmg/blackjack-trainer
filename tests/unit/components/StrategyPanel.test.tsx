import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { StrategyPanel } from '@/components/trainer/StrategyPanel';

const recommendActionMock = vi.fn(() => 'hit');
const getRationaleMock = vi.fn(() => ({
  short: 'Soft 18 vs 9 NO es stand: el 18 pierde demasiado, pegale.',
  long: 'Texto largo.',
}));

type MockDecision = Readonly<{
  handDescription: string;
  chosenAction: 'hit' | 'stand' | 'double' | 'split' | 'surrender' | 'insurance';
  recommendedAction: 'hit' | 'stand' | 'double' | 'split' | 'surrender' | 'insurance';
  wasCorrect: boolean;
}>;

type MockGameState = Readonly<{
  phase: 'betting' | 'playerTurn' | 'dealerTurn' | 'resolution';
  context: null | {
    playerHand: unknown;
    dealerUpcard: unknown;
    legalActions: ReadonlyArray<'hit' | 'stand' | 'double' | 'split' | 'surrender' | 'insurance'>;
    rules: unknown;
  };
}>;

type MockTrainerState = Readonly<{
  mode: 'off' | 'tutor' | 'exam';
  currentRoundDecisions: ReadonlyArray<MockDecision>;
}>;

let gameState: MockGameState;
let trainerState: MockTrainerState;

vi.mock('@/lib/strategy', () => ({
  categorizeHand: () => ({ kind: 'soft', key: 'A7' }),
  recommendAction: (...args: unknown[]) => recommendActionMock(...args),
  upcardToColumn: () => '9',
}));

vi.mock('@/lib/strategy/rationale', () => ({
  getRationale: (...args: unknown[]) => getRationaleMock(...args),
}));

vi.mock('@/store/gameStore', () => ({
  useGameStore: (selector: (state: MockGameState) => unknown) => selector(gameState),
  selectDecisionContext: (state: MockGameState) => state.context,
}));

vi.mock('@/store/trainerStore', () => ({
  useTrainerStore: (selector: (state: MockTrainerState) => unknown) => selector(trainerState),
}));

describe('StrategyPanel', () => {
  beforeEach(() => {
    recommendActionMock.mockClear();
    getRationaleMock.mockClear();
    gameState = {
      phase: 'playerTurn',
      context: {
        playerHand: {},
        dealerUpcard: {},
        legalActions: ['hit', 'stand'],
        rules: {},
      },
    };
    trainerState = {
      mode: 'tutor',
      currentRoundDecisions: [],
    };
  });

  it('renders rationale short text in tutor mode during player turn', () => {
    render(<StrategyPanel />);

    expect(screen.getByText('¿Por qué esta decisión?')).toBeInTheDocument();
    expect(screen.getByText(/Soft 18 vs 9 NO es stand/)).toBeInTheDocument();
    expect(recommendActionMock).toHaveBeenCalledTimes(1);
    expect(getRationaleMock).toHaveBeenCalledTimes(1);
  });

  it('renders round placeholder when there are no decisions', () => {
    render(<StrategyPanel />);
    expect(screen.getByText('Aún no tomaste decisiones en este round.')).toBeInTheDocument();
  });

  it('renders correct and incorrect decisions with icons', () => {
    trainerState = {
      ...trainerState,
      currentRoundDecisions: [
        {
          handDescription: 'Hard 11 vs 6',
          chosenAction: 'hit',
          recommendedAction: 'hit',
          wasCorrect: true,
        },
        {
          handDescription: 'Hard 12 vs 2',
          chosenAction: 'stand',
          recommendedAction: 'hit',
          wasCorrect: false,
        },
      ],
    };

    render(<StrategyPanel />);
    expect(screen.getByText(/✅/)).toBeInTheDocument();
    expect(screen.getByText(/❌/)).toBeInTheDocument();
    expect(screen.getByText('Hit en Hard 11 vs 6 (óptimo)')).toBeInTheDocument();
    expect(screen.getByText('Stand en Hard 12 vs 2 (óptimo: Hit)')).toBeInTheDocument();
  });
});
