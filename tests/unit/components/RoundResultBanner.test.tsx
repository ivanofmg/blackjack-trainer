import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RoundResultBanner } from '@/components/game/RoundResultBanner';

type MockResolution = Readonly<{
  outcome: 'win' | 'lose' | 'push' | 'blackjack' | 'surrender';
  netResult: number;
  payout: number;
}>;

type MockRoundResult = Readonly<{
  handResults: ReadonlyArray<{
    handId: string;
    resolution: MockResolution;
  }>;
  insuranceBet: number;
  insurancePayout: number;
  netTotal: number;
  dealerPlayed: boolean;
  dealerValue: {
    total: number;
    isSoft: boolean;
    isBust: boolean;
    isBlackjack: boolean;
    hardTotal: number;
    softTotal: number | null;
  };
}>;

type MockState = Readonly<{
  lastRoundResult: MockRoundResult | null;
  bankroll: number;
  currentBet: number;
  nextRound: () => void;
  deal: () => void;
}>;

const nextRoundSpy = vi.fn();
const dealSpy = vi.fn();
const clearRoundSpy = vi.fn();

const singleHandBase: MockRoundResult = {
  handResults: [
    {
      handId: 'h-1',
      resolution: { outcome: 'win', netResult: 10, payout: 20 },
    },
  ],
  insuranceBet: 0,
  insurancePayout: 0,
  netTotal: 10,
  dealerPlayed: true,
  dealerValue: {
    total: 19,
    isSoft: false,
    isBust: false,
    isBlackjack: false,
    hardTotal: 19,
    softTotal: null,
  },
};

let mockState: MockState = {
  lastRoundResult: singleHandBase,
  bankroll: 1000,
  currentBet: 10,
  nextRound: nextRoundSpy,
  deal: dealSpy,
};

let trainerState: Readonly<{
  mode: 'off' | 'tutor' | 'exam';
  currentRoundDecisions: ReadonlyArray<{
    handDescription: string;
    chosenAction: 'hit' | 'stand' | 'double' | 'split' | 'surrender' | 'insurance';
    recommendedAction: 'hit' | 'stand' | 'double' | 'split' | 'surrender' | 'insurance';
    wasCorrect: boolean;
  }>;
  clearCurrentRoundDecisions: () => void;
}> = {
  mode: 'off',
  currentRoundDecisions: [],
  clearCurrentRoundDecisions: clearRoundSpy,
};

vi.mock('@/store/gameStore', () => ({
  useGameStore: (selector: (state: MockState) => unknown) => selector(mockState),
}));

vi.mock('@/store/trainerStore', () => ({
  useTrainerStore: (selector: (state: typeof trainerState) => unknown) => selector(trainerState),
}));

describe('RoundResultBanner', () => {
  beforeEach(() => {
    nextRoundSpy.mockReset();
    dealSpy.mockReset();
    clearRoundSpy.mockReset();
    mockState = {
      lastRoundResult: singleHandBase,
      bankroll: 1000,
      currentBet: 10,
      nextRound: nextRoundSpy,
      deal: dealSpy,
    };
    trainerState = {
      mode: 'off',
      currentRoundDecisions: [],
      clearCurrentRoundDecisions: clearRoundSpy,
    };
  });

  it('renders positive outcome with green amount', () => {
    render(<RoundResultBanner />);
    expect(screen.getByText('Ganaste')).toBeInTheDocument();
    expect(screen.getByText('+$10')).toHaveClass('text-emerald-300');
  });

  it('renders negative outcome with red amount', () => {
    mockState = {
      ...mockState,
      lastRoundResult: {
        ...singleHandBase,
        netTotal: -10,
        handResults: [{ handId: 'h-1', resolution: { outcome: 'lose', netResult: -10, payout: 0 } }],
      },
    };

    render(<RoundResultBanner />);
    expect(screen.getByText('Perdiste')).toBeInTheDocument();
    expect(screen.getByText('-$10')).toHaveClass('text-red-300');
  });

  it('renders neutral outcome for push', () => {
    mockState = {
      ...mockState,
      lastRoundResult: {
        ...singleHandBase,
        netTotal: 0,
        handResults: [{ handId: 'h-1', resolution: { outcome: 'push', netResult: 0, payout: 10 } }],
      },
    };

    render(<RoundResultBanner />);
    expect(screen.getByText('Empate')).toBeInTheDocument();
    expect(screen.getByText('$0')).toHaveClass('text-slate-200');
  });

  it('keeps next button disabled for 600ms then enables', async () => {
    vi.useFakeTimers();
    render(<RoundResultBanner />);

    const button = screen.getByRole('button', { name: 'Siguiente mano' });
    expect(button).toBeDisabled();

    await act(async () => {
      vi.advanceTimersByTime(600);
    });
    expect(button).toBeEnabled();
    vi.useRealTimers();
  });

  it('calls nextRound when clicking enabled button', async () => {
    vi.useFakeTimers();
    render(<RoundResultBanner />);

    const button = screen.getByRole('button', { name: 'Siguiente mano' });
    await act(async () => {
      vi.advanceTimersByTime(600);
    });
    fireEvent.click(button);
    expect(nextRoundSpy).toHaveBeenCalledTimes(1);
    expect(dealSpy).toHaveBeenCalledTimes(1);
    expect(clearRoundSpy).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('calls only nextRound when clicking "Cambiar apuesta"', async () => {
    vi.useFakeTimers();
    render(<RoundResultBanner />);
    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Cambiar apuesta' }));
    expect(nextRoundSpy).toHaveBeenCalledTimes(1);
    expect(dealSpy).not.toHaveBeenCalled();
    expect(clearRoundSpy).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('shows split breakdown only when there are multiple hands', () => {
    mockState = {
      ...mockState,
      lastRoundResult: {
        ...singleHandBase,
        handResults: [
          { handId: 'h-1', resolution: { outcome: 'win', netResult: 10, payout: 20 } },
          { handId: 'h-2', resolution: { outcome: 'push', netResult: 0, payout: 10 } },
        ],
      },
    };

    render(<RoundResultBanner />);
    expect(screen.getByText(/Mano 1:/)).toBeInTheDocument();
    expect(screen.getByText(/Mano 2:/)).toBeInTheDocument();
  });

  it('omits split breakdown for a single hand', () => {
    render(<RoundResultBanner />);
    expect(screen.queryByText(/Mano 1:/)).not.toBeInTheDocument();
  });

  it('shows dealer total line when dealer played', () => {
    render(<RoundResultBanner />);
    expect(screen.getByText('Dealer: 19')).toBeInTheDocument();
  });

  it('shows dealer bust line when dealer played and busts', () => {
    mockState = {
      ...mockState,
      lastRoundResult: {
        ...singleHandBase,
        dealerPlayed: true,
        dealerValue: {
          ...singleHandBase.dealerValue,
          total: 24,
          isBust: true,
          hardTotal: 24,
          softTotal: null,
        },
      },
    };

    render(<RoundResultBanner />);
    expect(screen.getByText('Dealer: 24 (Bust)')).toBeInTheDocument();
  });

  it('shows "Dealer no jugó" when dealer did not play', () => {
    mockState = {
      ...mockState,
      lastRoundResult: {
        ...singleHandBase,
        dealerPlayed: false,
        dealerValue: {
          ...singleHandBase.dealerValue,
          total: 14,
          hardTotal: 14,
          softTotal: null,
        },
      },
    };

    render(<RoundResultBanner />);
    expect(screen.getByText('Dealer no jugó')).toBeInTheDocument();
  });

  it('shows disabled auto-deal message when current bet exceeds bankroll', async () => {
    vi.useFakeTimers();
    mockState = {
      ...mockState,
      bankroll: 5,
      currentBet: 10,
    };
    render(<RoundResultBanner />);
    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    const button = screen.getByRole('button', { name: /Apuesta excede bankroll/ });
    expect(button).toBeDisabled();
    expect(screen.getByText('Apuesta actual:')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('renders round decision summary when trainer mode is active', () => {
    trainerState = {
      mode: 'exam',
      currentRoundDecisions: [
        {
          handDescription: 'Hard 16 vs 10',
          chosenAction: 'hit',
          recommendedAction: 'hit',
          wasCorrect: true,
        },
        {
          handDescription: 'Soft 18 vs 3',
          chosenAction: 'stand',
          recommendedAction: 'double',
          wasCorrect: false,
        },
      ],
      clearCurrentRoundDecisions: clearRoundSpy,
    };

    render(<RoundResultBanner />);
    expect(screen.getByText('Decisiones de este round:')).toBeInTheDocument();
    expect(screen.getByText(/✓ Hit/)).toBeInTheDocument();
    expect(screen.getByText(/✗ Stand/)).toBeInTheDocument();
  });
});
