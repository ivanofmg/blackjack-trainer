import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Hand } from '@/components/game/Hand';
import * as handModule from '@/lib/blackjack/hand';
import type { Card, Hand as HandData, Rank, Suit } from '@/lib/blackjack/types';

function makeCard(rank: Rank, suit: Suit): Card {
  return { rank, suit };
}

function makeHand(cards: ReadonlyArray<Card>, overrides?: Partial<HandData>): HandData {
  return {
    cards,
    bet: 10,
    isDoubled: false,
    isSplit: false,
    isSurrendered: false,
    isStood: false,
    ...overrides,
  };
}

describe('Hand component', () => {
  it('renders the correct number of cards', () => {
    const hand = makeHand([
      makeCard('10', 'hearts'),
      makeCard('7', 'clubs'),
      makeCard('2', 'spades'),
    ]);

    render(<Hand hand={hand} />);

    expect(screen.getAllByRole('img')).toHaveLength(3);
  });

  it('shows first card face-up and second card face-down when hideHoleCard=true', () => {
    const hand = makeHand([
      makeCard('10', 'spades'),
      makeCard('A', 'hearts'),
      makeCard('5', 'diamonds'),
    ]);

    render(<Hand hand={hand} hideHoleCard />);

    expect(screen.getByRole('img', { name: '10 de picas' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Carta boca abajo' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '5 de diamantes' })).toBeInTheDocument();
  });

  it('shows normal total for a hard hand', () => {
    render(<Hand hand={makeHand([makeCard('10', 'hearts'), makeCard('7', 'clubs')])} />);

    const badge = screen.getByTestId('hand-total-badge');
    expect(badge).toHaveTextContent('17');
  });

  it('shows soft total in hard/soft format', () => {
    render(<Hand hand={makeHand([makeCard('A', 'spades'), makeCard('7', 'hearts')])} />);

    expect(screen.getByTestId('hand-total-badge')).toHaveTextContent('8/18');
  });

  it('shows blackjack badge with amber styles for natural blackjack', () => {
    render(<Hand hand={makeHand([makeCard('A', 'spades'), makeCard('K', 'hearts')])} />);

    const badge = screen.getByTestId('hand-total-badge');
    expect(badge).toHaveTextContent('BJ');
    expect(badge).toHaveClass('bg-amber-100', 'text-amber-900', 'border', 'border-amber-300');
  });

  it('shows bust style and total for busted hands', () => {
    render(<Hand hand={makeHand([makeCard('10', 'hearts'), makeCard('8', 'clubs'), makeCard('7', 'spades')])} />);

    const badge = screen.getByTestId('hand-total-badge');
    expect(badge).toHaveTextContent('25');
    expect(badge).toHaveTextContent('Bust');
    expect(badge).toHaveClass('bg-red-50', 'text-red-700');
  });

  it('shows surrendered state when hand is surrendered', () => {
    const hand = makeHand(
      [makeCard('10', 'hearts'), makeCard('6', 'clubs')],
      { isSurrendered: true }
    );
    render(<Hand hand={hand} />);

    const badge = screen.getByTestId('hand-total-badge');
    expect(badge).toHaveTextContent('Rendido');
    expect(badge).toHaveClass('bg-slate-50', 'text-slate-500', 'italic');
  });

  it('applies active highlight styles when isActive=true', () => {
    render(<Hand hand={makeHand([makeCard('9', 'hearts'), makeCard('7', 'clubs')])} isActive />);

    const group = screen.getByRole('group');
    expect(group).toHaveClass('ring-2', 'ring-sky-400/60');
    expect(group).toHaveAttribute('data-active', 'true');
  });

  it('does not render total badge when showTotal=false', () => {
    render(<Hand hand={makeHand([makeCard('10', 'hearts'), makeCard('7', 'clubs')])} showTotal={false} />);

    expect(screen.queryByTestId('hand-total-badge')).not.toBeInTheDocument();
  });

  it('propagates size to inner cards', () => {
    render(<Hand hand={makeHand([makeCard('10', 'hearts'), makeCard('7', 'clubs')])} size="sm" />);

    const cards = screen.getAllByTestId('playing-card');
    for (const card of cards) {
      expect(card).toHaveClass('w-12', 'h-[67px]');
    }
  });

  it('renders descriptive aria-label in Spanish', () => {
    render(<Hand hand={makeHand([makeCard('10', 'hearts'), makeCard('7', 'clubs')])} />);

    expect(
      screen.getByRole('group', {
        name: 'Mano del jugador con 2 cartas, total 17',
      })
    ).toBeInTheDocument();
  });

  it('renders dealer aria-label with hidden hole card', () => {
    render(
      <Hand
        hand={makeHand([makeCard('A', 'spades'), makeCard('K', 'hearts')])}
        role="dealer"
        hideHoleCard
        showTotal={false}
      />
    );

    expect(
      screen.getByRole('group', {
        name: 'Mano del dealer con 2 cartas, carta visible: As de picas',
      })
    ).toBeInTheDocument();
  });

  it('renders dealer aria-label with total when hole card is revealed', () => {
    render(
      <Hand
        hand={makeHand([makeCard('A', 'spades'), makeCard('7', 'hearts')])}
        role="dealer"
        hideHoleCard={false}
        showTotal
      />
    );

    expect(
      screen.getByRole('group', {
        name: 'Mano del dealer con 2 cartas, total 8/18',
      })
    ).toBeInTheDocument();
  });

  it('keeps player aria-label as default when role is omitted', () => {
    render(<Hand hand={makeHand([makeCard('10', 'hearts'), makeCard('7', 'clubs')])} showTotal={false} />);

    expect(
      screen.getByRole('group', {
        name: 'Mano del jugador con 2 cartas',
      })
    ).toBeInTheDocument();
  });

  it('uses hardTotal provided by handValue for soft badge rendering', () => {
    const spy = vi.spyOn(handModule, 'handValue').mockReturnValue({
      total: 18,
      isSoft: true,
      isBust: false,
      isBlackjack: false,
      hardTotal: 9,
      softTotal: 18,
    });

    render(<Hand hand={makeHand([makeCard('A', 'spades'), makeCard('7', 'hearts')])} />);

    expect(screen.getByTestId('hand-total-badge')).toHaveTextContent('9/18');
    spy.mockRestore();
  });
});
