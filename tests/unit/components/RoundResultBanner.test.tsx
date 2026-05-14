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
  nextRound: () => void;
}>;

const nextRoundSpy = vi.fn();

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
  nextRound: nextRoundSpy,
};

vi.mock('@/store/gameStore', () => ({
  useGameStore: (selector: (state: MockState) => unknown) => selector(mockState),
}));

describe('RoundResultBanner', () => {
  beforeEach(() => {
    nextRoundSpy.mockReset();
    mockState = {
      lastRoundResult: singleHandBase,
      bankroll: 1000,
      nextRound: nextRoundSpy,
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
});
