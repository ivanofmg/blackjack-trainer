import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TutorHint } from '@/components/trainer/TutorHint';

const recommendActionMock = vi.fn(() => 'stand');

type MockGameState = Readonly<{
  phase: 'betting' | 'playerTurn';
  decisionContext:
    | null
    | {
        playerHand: unknown;
        dealerUpcard: unknown;
        legalActions: ReadonlyArray<'hit' | 'stand' | 'double' | 'split' | 'surrender' | 'insurance'>;
        rules: unknown;
      };
}>;

type MockTrainerState = Readonly<{ mode: 'off' | 'tutor' | 'exam' }>;

let gameState: MockGameState = {
  phase: 'playerTurn',
  decisionContext: {
    playerHand: {},
    dealerUpcard: {},
    legalActions: ['hit', 'stand'],
    rules: {},
  },
};

let trainerState: MockTrainerState = {
  mode: 'tutor',
};

vi.mock('@/lib/strategy', () => ({
  recommendAction: (...args: unknown[]) => recommendActionMock(...args),
}));

vi.mock('@/store/gameStore', () => ({
  useGameStore: (selector: (state: MockGameState) => unknown) => selector(gameState),
  selectDecisionContext: (state: MockGameState) => state.decisionContext,
}));

vi.mock('@/store/trainerStore', () => ({
  useTrainerStore: (selector: (state: MockTrainerState) => unknown) => selector(trainerState),
}));

describe('TutorHint', () => {
  beforeEach(() => {
    recommendActionMock.mockClear();
    gameState = {
      phase: 'playerTurn',
      decisionContext: {
        playerHand: {},
        dealerUpcard: {},
        legalActions: ['hit', 'stand'],
        rules: {},
      },
    };
    trainerState = { mode: 'tutor' };
  });

  it('renders hint only in tutor mode during player turn', () => {
    render(<TutorHint />);
    expect(screen.getByText(/Estrategia óptima:/)).toBeInTheDocument();
    expect(screen.getByText('Stand')).toBeInTheDocument();
    expect(recommendActionMock).toHaveBeenCalledTimes(1);
  });

  it('does not render when mode is exam/off or not player turn', () => {
    trainerState = { mode: 'exam' };
    const examRender = render(<TutorHint />);
    expect(examRender.container).toBeEmptyDOMElement();

    trainerState = { mode: 'off' };
    const offRender = render(<TutorHint />);
    expect(offRender.container).toBeEmptyDOMElement();

    trainerState = { mode: 'tutor' };
    gameState = { ...gameState, phase: 'betting' };
    const phaseRender = render(<TutorHint />);
    expect(phaseRender.container).toBeEmptyDOMElement();
  });

  it('does not render without decision context', () => {
    gameState = { ...gameState, decisionContext: null };
    const { container } = render(<TutorHint />);
    expect(container).toBeEmptyDOMElement();
  });
});
