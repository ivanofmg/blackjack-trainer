import { describe, expect, it } from 'vitest';

import type { Card, Hand, Rank, Suit } from '@/lib/blackjack/types';
import { categorizeHand, describeHand, upcardToColumn } from '@/lib/strategy/describe';

function card(rank: Rank, suit: Suit = 'clubs'): Card {
  return { rank, suit };
}

function hand(cards: ReadonlyArray<Card>): Hand {
  return {
    cards,
    bet: 10,
    isDoubled: false,
    isSplit: false,
    isSurrendered: false,
    isStood: false,
  };
}

describe('strategy describe helpers', () => {
  it('describeHand formats hard, soft and pair descriptions', () => {
    expect(describeHand(hand([card('10'), card('6')]), card('K'))).toBe('Hard 16 vs 10');
    expect(describeHand(hand([card('A'), card('7')]), card('9'))).toBe('Soft 18 vs 9');
    expect(describeHand(hand([card('8'), card('8')]), card('A'))).toBe('Pair 8,8 vs A');
  });

  it('describeHand treats mixed 10-value pair as pair', () => {
    expect(describeHand(hand([card('10', 'hearts'), card('J', 'spades')]), card('Q'))).toBe('Pair 10,10 vs 10');
  });

  it('does not treat post-split multi-card hand as pair', () => {
    expect(describeHand(hand([card('8'), card('8'), card('2')]), card('6'))).toBe('Hard 18 vs 6');
  });

  it('categorizeHand returns expected pair/soft/hard categories', () => {
    expect(categorizeHand(hand([card('A'), card('A')]))).toEqual({ kind: 'pair', key: 'AA' });
    expect(categorizeHand(hand([card('10'), card('Q')]))).toEqual({ kind: 'pair', key: 'TT' });
    expect(categorizeHand(hand([card('A'), card('6')]))).toEqual({ kind: 'soft', key: 'A6' });
    expect(categorizeHand(hand([card('10'), card('6')]))).toEqual({ kind: 'hard', total: 16 });
  });

  it('upcardToColumn maps picture cards to 10 and keeps others', () => {
    expect(upcardToColumn(card('J'))).toBe('10');
    expect(upcardToColumn(card('Q'))).toBe('10');
    expect(upcardToColumn(card('K'))).toBe('10');
    expect(upcardToColumn(card('A'))).toBe('A');
    expect(upcardToColumn(card('7'))).toBe('7');
  });
});
