import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BetSelector } from '@/components/game/BetSelector';
import { DEFAULT_BANKROLL } from '@/lib/storage';
import { useGameStore } from '@/store/gameStore';

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
}

describe('BetSelector', () => {
  beforeEach(() => {
    resetStore();
  });

  it('renders initial state with current bet, presets and deal button', () => {
    render(<BetSelector />);

    expect(screen.getByRole('textbox')).toHaveValue('10');
    expect(screen.getByRole('button', { name: '$10' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '$25' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '$50' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '$100' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All-in' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Repartir' })).toBeEnabled();
  });

  it('updates store when typing a valid bet', () => {
    render(<BetSelector />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '25' } });
    expect(useGameStore.getState().currentBet).toBe(25);
  });

  it('applies numeric preset and syncs store', () => {
    render(<BetSelector />);

    fireEvent.click(screen.getByRole('button', { name: '$50' }));
    expect(screen.getByRole('textbox')).toHaveValue('50');
    expect(useGameStore.getState().currentBet).toBe(50);
  });

  it('applies all-in preset to bankroll', () => {
    useGameStore.setState({ bankroll: 420 });
    render(<BetSelector />);

    fireEvent.click(screen.getByRole('button', { name: 'All-in' }));
    expect(screen.getByRole('textbox')).toHaveValue('420');
    expect(useGameStore.getState().currentBet).toBe(420);
  });

  it('disables presets that exceed bankroll', () => {
    useGameStore.setState({ bankroll: 30, currentBet: 10 });
    render(<BetSelector />);

    expect(screen.getByRole('button', { name: '$50' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '$100' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'All-in' })).toBeEnabled();
  });

  it('shows errors and disables deal for invalid input values', () => {
    render(<BetSelector />);
    const input = screen.getByRole('textbox');
    const dealButton = screen.getByRole('button', { name: 'Repartir' });

    fireEvent.change(input, { target: { value: '-5' } });
    expect(screen.getByText('Minimo $1')).toBeInTheDocument();
    expect(dealButton).toBeDisabled();

    fireEvent.change(input, { target: { value: '12.5' } });
    expect(screen.getByText('Debe ser entero')).toBeInTheDocument();
    expect(dealButton).toBeDisabled();

    fireEvent.change(input, { target: { value: '' } });
    expect(screen.getByText('Ingresa un monto')).toBeInTheDocument();
    expect(dealButton).toBeDisabled();

    fireEvent.change(input, { target: { value: '9999' } });
    expect(screen.getByText('Excede bankroll')).toBeInTheDocument();
    expect(dealButton).toBeDisabled();
  });

  it('increments and decrements bet by $5', () => {
    render(<BetSelector />);
    const buttons = screen.getAllByRole('button', { name: /^[+-]$/ });
    const plus = buttons.find((button) => button.textContent === '+');
    const minus = buttons.find((button) => button.textContent === '-');

    expect(plus).toBeDefined();
    expect(minus).toBeDefined();

    fireEvent.click(plus!);
    expect(screen.getByRole('textbox')).toHaveValue('15');

    fireEvent.click(minus!);
    expect(screen.getByRole('textbox')).toHaveValue('10');
  });

  it('calls deal when clicking Repartir with valid bet', () => {
    const dealSpy = vi.spyOn(useGameStore.getState(), 'deal');
    render(<BetSelector />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '25' } });
    fireEvent.click(screen.getByRole('button', { name: 'Repartir' }));

    expect(dealSpy).toHaveBeenCalledTimes(1);
    dealSpy.mockRestore();
  });

  it('shows bankroll preview after current bet', () => {
    render(<BetSelector />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '25' } });
    expect(screen.getByText('Bankroll tras apostar: $975')).toBeInTheDocument();
  });

  it('restores last bet after store reset and component remount', async () => {
    const { unmount } = render(<BetSelector />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '50' } });

    unmount();
    useGameStore.getState().__resetForTests();

    render(<BetSelector />);
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toHaveValue('50');
    });
  });

  it('submits with Enter when bet is valid', () => {
    const dealSpy = vi.spyOn(useGameStore.getState(), 'deal');
    render(<BetSelector />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '40' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(dealSpy).toHaveBeenCalledTimes(1);
    dealSpy.mockRestore();
  });
});
