import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Card } from '@/components/game/Card';
import type { Card as CardData, Rank, Suit } from '@/lib/blackjack/types';

function makeCard(rank: Rank, suit: Suit): CardData {
  return { rank, suit };
}

describe('Card component', () => {
  it.each([
    { card: makeCard('A', 'hearts'), symbol: '♥' },
    { card: makeCard('10', 'diamonds'), symbol: '♦' },
    { card: makeCard('J', 'clubs'), symbol: '♣' },
    { card: makeCard('Q', 'spades'), symbol: '♠' },
  ])('renders rank and suit for face-up card ($card.rank of $card.suit)', ({ card, symbol }) => {
    render(<Card card={card} />);

    expect(screen.getAllByText(card.rank).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(symbol).length).toBeGreaterThanOrEqual(3);
  });

  it('hides rank and suit for face-down card', () => {
    render(<Card card={makeCard('A', 'hearts')} faceDown />);

    expect(screen.queryByText('A')).not.toBeInTheDocument();
    expect(screen.queryByText('♥')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Carta boca abajo')).toBeInTheDocument();
  });

  it('sets aria-label in Spanish for face-up and face-down states', () => {
    const { rerender } = render(<Card card={makeCard('A', 'hearts')} />);
    expect(screen.getByRole('img', { name: 'As de corazones' })).toBeInTheDocument();

    rerender(<Card card={makeCard('10', 'spades')} />);
    expect(screen.getByRole('img', { name: '10 de picas' })).toBeInTheDocument();

    rerender(<Card card={makeCard('10', 'spades')} faceDown />);
    expect(screen.getByRole('img', { name: 'Carta boca abajo' })).toBeInTheDocument();
  });

  it.each([
    { size: 'sm', expectedClasses: ['w-12', 'h-[67px]'] },
    { size: 'md', expectedClasses: ['w-20', 'h-28'] },
    { size: 'lg', expectedClasses: ['w-28', 'h-[156px]'] },
  ] as const)('applies size classes for $size', ({ size, expectedClasses }) => {
    render(<Card card={makeCard('K', 'clubs')} size={size} />);

    const card = screen.getByTestId('playing-card');
    expect(card).toHaveClass(...expectedClasses);
  });

  it('applies highlighted styles when highlighted=true', () => {
    render(<Card card={makeCard('Q', 'diamonds')} highlighted />);

    const card = screen.getByTestId('playing-card');
    expect(card).toHaveClass('ring-2', 'ring-amber-400/60', 'shadow-lg');
  });

  it.each([
    { suit: 'hearts', symbol: '♥', expectedColorClass: 'text-red-700' },
    { suit: 'diamonds', symbol: '♦', expectedColorClass: 'text-red-700' },
    { suit: 'clubs', symbol: '♣', expectedColorClass: 'text-slate-900' },
    { suit: 'spades', symbol: '♠', expectedColorClass: 'text-slate-900' },
  ] as const)('applies suit color classes for $suit', ({ suit, symbol, expectedColorClass }) => {
    render(<Card card={makeCard('A', suit)} />);

    const suitSymbols = screen.getAllByText(symbol);
    for (const element of suitSymbols) {
      expect(element).toHaveClass(expectedColorClass);
    }
  });
});
