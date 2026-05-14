import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Table } from '@/components/game/Table';
import type { Card, Rank, Suit } from '@/lib/blackjack/types';
import { DEFAULT_BANKROLL } from '@/lib/storage';
import { useGameStore } from '@/store/gameStore';
import type { Shoe } from '@/lib/blackjack/deck';

function makeCard(rank: Rank, suit: Suit): Card {
  return { rank, suit };
}

function makeShoe(ranks: ReadonlyArray<Rank>, suit: Suit = 'clubs'): Shoe {
  return ranks.map((rank) => makeCard(rank, suit));
}

function resetStore(): void {
  localStorage.clear();
  useGameStore.getState().__resetForTests();
  useGameStore.setState({
    bankroll: DEFAULT_BANKROLL,
    currentBet: 10,
    phase: 'betting',
    lastRoundResult: null,
    shoe: [],
  });
  useGameStore.getState().updateRules({ decks: 1, penetration: 1 });
}

describe('Table', () => {
  beforeEach(() => {
    resetStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows betting phase with deal button and no cards', async () => {
    render(<Table />);

    expect(await screen.findByRole('button', { name: 'Repartir' })).toBeInTheDocument();
    expect(screen.queryAllByRole('img')).toHaveLength(0);
  });

  it('renders dealer/player cards after deal, hiding dealer hole card', async () => {
    useGameStore.getState().__setShoe(makeShoe(['10', '6', '7', '9', '5']));
    render(<Table />);

    fireEvent.click(await screen.findByRole('button', { name: 'Repartir' }));

    await waitFor(() => {
      expect(screen.getAllByRole('img')).toHaveLength(4);
    });
    expect(screen.getByRole('img', { name: 'Carta boca abajo' })).toBeInTheDocument();
  });

  it('shows ActionControls only during playerTurn', async () => {
    useGameStore.getState().__setShoe(makeShoe(['10', '6', '7', '9', '5', '10']));
    render(<Table />);

    expect(screen.queryByRole('button', { name: 'Hit' })).not.toBeInTheDocument();

    fireEvent.click(await screen.findByRole('button', { name: 'Repartir' }));
    expect(await screen.findByRole('button', { name: 'Hit' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Stand' }));
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Hit' })).not.toBeInTheDocument();
    });
  });

  it('hit button triggers hit flow in the store', async () => {
    useGameStore.getState().__setShoe(makeShoe(['10', '6', '7', '9', '5']));
    render(<Table />);

    fireEvent.click(await screen.findByRole('button', { name: 'Repartir' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Hit' }));

    await waitFor(() => {
      expect(useGameStore.getState().playerHands[0].cards).toHaveLength(3);
    });
  });

  it('updates bankroll after deal', async () => {
    useGameStore.getState().__setShoe(makeShoe(['10', '6', '7', '9']));
    render(<Table />);

    fireEvent.click(await screen.findByRole('button', { name: 'Repartir' }));

    await waitFor(() => {
      expect(screen.getByText('Bankroll: $990')).toBeInTheDocument();
    });
  });

  it('shows round result banner and hides it after nextRound', async () => {
    useGameStore.getState().__setShoe(makeShoe(['10', '9', '7', '9', '10']));
    render(<Table />);

    fireEvent.click(await screen.findByRole('button', { name: 'Repartir' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Stand' }));

    const nextRoundButton = await screen.findByRole(
      'button',
      { name: 'Siguiente mano' },
      { timeout: 3000 },
    );
    expect(nextRoundButton).toBeInTheDocument();
    await waitFor(() => {
      expect(nextRoundButton).toBeEnabled();
    });

    fireEvent.click(nextRoundButton);
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Siguiente mano' })).not.toBeInTheDocument();
    });
  });

  it('shows game over screen and allows bankroll reset', async () => {
    useGameStore.setState({ bankroll: 10, currentBet: 10 });
    useGameStore.getState().__setShoe(makeShoe(['10', '10', '7', '9']));
    render(<Table />);

    fireEvent.click(await screen.findByRole('button', { name: 'Repartir' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Stand' }));

    expect(await screen.findByText('Te quedaste sin saldo.', {}, { timeout: 3000 })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reiniciar bankroll ($1,000)' }));

    await waitFor(() => {
      expect(screen.getByText('Bankroll: $1,000')).toBeInTheDocument();
    });
  });

  it('shows insurance prompt and hides it after decision', async () => {
    useGameStore.getState().__setShoe(makeShoe(['10', 'A', '7', '9', '5']));
    render(<Table />);

    fireEvent.click(await screen.findByRole('button', { name: 'Repartir' }));
    expect(await screen.findByText('El dealer muestra As. ¿Tomás seguro?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'No, continuar' }));
    await waitFor(() => {
      expect(screen.queryByText('El dealer muestra As. ¿Tomás seguro?')).not.toBeInTheDocument();
    });
  });

  it('orchestrates dealer rhythm in order using timers', async () => {
    useGameStore.getState().__setShoe(makeShoe(['10', '6', '7', '9', '5']));
    render(<Table />);

    fireEvent.click(await screen.findByRole('button', { name: 'Repartir' }));
    await screen.findByRole('button', { name: 'Stand' });
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole('button', { name: 'Stand' }));

    expect(useGameStore.getState().phase).toBe('dealerTurn');
    expect(useGameStore.getState().isHoleCardRevealed).toBe(false);
    expect(useGameStore.getState().pendingDealerSteps.length).toBe(1);

    await act(async () => {
      vi.advanceTimersByTime(600);
    });
    expect(useGameStore.getState().isHoleCardRevealed).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(useGameStore.getState().pendingDealerSteps.length).toBe(0);

    await act(async () => {
      vi.advanceTimersByTime(400);
    });
    expect(useGameStore.getState().phase).toBe('betting');
    expect(useGameStore.getState().lastRoundResult).not.toBeNull();
  });

  it('cancels pending dealer timers when table unmounts', async () => {
    useGameStore.getState().__setShoe(makeShoe(['10', '6', '7', '9', '5']));
    const { unmount } = render(<Table />);

    fireEvent.click(await screen.findByRole('button', { name: 'Repartir' }));
    await screen.findByRole('button', { name: 'Stand' });
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole('button', { name: 'Stand' }));

    unmount();

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect(useGameStore.getState().isHoleCardRevealed).toBe(false);
    expect(useGameStore.getState().phase).toBe('dealerTurn');
  });
});
