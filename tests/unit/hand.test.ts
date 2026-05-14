import { describe, expect, it } from 'vitest';

import { canSplitByValue, cardValue, handValue, isPair } from '@/lib/blackjack/hand';
import type { Card, Rank, Suit } from '@/lib/blackjack/types';

function makeCard(rank: Rank, suit: Suit): Card {
  return { rank, suit };
}

describe('cardValue', () => {
  it('returns 1 for Ace', () => {
    expect(cardValue(makeCard('A', 'spades'))).toBe(1);
  });

  it('returns numeric values for ranks 2 through 10', () => {
    expect(cardValue(makeCard('2', 'spades'))).toBe(2);
    expect(cardValue(makeCard('3', 'spades'))).toBe(3);
    expect(cardValue(makeCard('4', 'spades'))).toBe(4);
    expect(cardValue(makeCard('5', 'spades'))).toBe(5);
    expect(cardValue(makeCard('6', 'spades'))).toBe(6);
    expect(cardValue(makeCard('7', 'spades'))).toBe(7);
    expect(cardValue(makeCard('8', 'spades'))).toBe(8);
    expect(cardValue(makeCard('9', 'spades'))).toBe(9);
    expect(cardValue(makeCard('10', 'spades'))).toBe(10);
  });

  it('returns 10 for face cards', () => {
    expect(cardValue(makeCard('J', 'spades'))).toBe(10);
    expect(cardValue(makeCard('Q', 'hearts'))).toBe(10);
    expect(cardValue(makeCard('K', 'diamonds'))).toBe(10);
  });
});

describe('handValue', () => {
  it('returns zeroed values for empty hand', () => {
    expect(handValue([])).toEqual({
      total: 0,
      isSoft: false,
      isBust: false,
      isBlackjack: false,
      hardTotal: 0,
      softTotal: null,
    });
  });

  it('handles basic hard hands and busts', () => {
    expect(handValue([makeCard('5', 'spades'), makeCard('6', 'hearts')])).toEqual({
      total: 11,
      isSoft: false,
      isBust: false,
      isBlackjack: false,
      hardTotal: 11,
      softTotal: null,
    });

    expect(handValue([makeCard('10', 'spades'), makeCard('7', 'hearts')])).toEqual({
      total: 17,
      isSoft: false,
      isBust: false,
      isBlackjack: false,
      hardTotal: 17,
      softTotal: null,
    });

    expect(handValue([makeCard('10', 'spades'), makeCard('K', 'hearts')])).toEqual({
      total: 20,
      isSoft: false,
      isBust: false,
      isBlackjack: false,
      hardTotal: 20,
      softTotal: null,
    });

    expect(handValue([makeCard('10', 'spades'), makeCard('K', 'hearts'), makeCard('5', 'diamonds')])).toEqual(
      {
        total: 25,
        isSoft: false,
        isBust: true,
        isBlackjack: false,
        hardTotal: 25,
        softTotal: null,
      },
    );
  });

  it('returns hardTotal and softTotal for [A,7]', () => {
    expect(handValue([makeCard('A', 'spades'), makeCard('7', 'hearts')])).toEqual({
      total: 18,
      isSoft: true,
      isBust: false,
      isBlackjack: false,
      hardTotal: 8,
      softTotal: 18,
    });
  });

  it('returns hard hand when ace cannot stay soft', () => {
    expect(handValue([makeCard('A', 'spades'), makeCard('7', 'hearts'), makeCard('5', 'diamonds')])).toEqual({
      total: 13,
      isSoft: false,
      isBust: false,
      isBlackjack: false,
      hardTotal: 13,
      softTotal: null,
    });
  });

  it('handles [A,A] and [A,A,9] correctly', () => {
    expect(handValue([makeCard('A', 'spades'), makeCard('A', 'hearts')])).toEqual({
      total: 12,
      isSoft: true,
      isBust: false,
      isBlackjack: false,
      hardTotal: 2,
      softTotal: 12,
    });

    expect(handValue([makeCard('A', 'spades'), makeCard('A', 'hearts'), makeCard('9', 'diamonds')])).toEqual({
      total: 21,
      isSoft: true,
      isBust: false,
      isBlackjack: false,
      hardTotal: 11,
      softTotal: 21,
    });
  });

  it('handles key ace transitions into hard totals', () => {
    expect(handValue([makeCard('A', 'spades'), makeCard('5', 'hearts'), makeCard('6', 'diamonds')])).toEqual({
      total: 12,
      isSoft: false,
      isBust: false,
      isBlackjack: false,
      hardTotal: 12,
      softTotal: null,
    });

    expect(handValue([makeCard('A', 'spades'), makeCard('6', 'hearts'), makeCard('J', 'diamonds')])).toEqual({
      total: 17,
      isSoft: false,
      isBust: false,
      isBlackjack: false,
      hardTotal: 17,
      softTotal: null,
    });
  });

  it('handles A+K blackjack and regular bust', () => {
    expect(handValue([makeCard('A', 'spades'), makeCard('K', 'hearts')])).toEqual({
      total: 21,
      isSoft: true,
      isBust: false,
      isBlackjack: true,
      hardTotal: 11,
      softTotal: 21,
    });

    expect(handValue([makeCard('A', 'spades'), makeCard('A', 'hearts'), makeCard('A', 'diamonds')])).toEqual({
      total: 13,
      isSoft: true,
      isBust: false,
      isBlackjack: false,
      hardTotal: 3,
      softTotal: 13,
    });

    expect(handValue([makeCard('10', 'spades'), makeCard('7', 'hearts'), makeCard('5', 'diamonds')])).toEqual({
      total: 22,
      isSoft: false,
      isBust: true,
      isBlackjack: false,
      hardTotal: 22,
      softTotal: null,
    });
  });

  it('distinguishes blackjack from generic 21 and preserves totals', () => {
    expect(handValue([makeCard('A', 'spades'), makeCard('10', 'hearts')]).isBlackjack).toBe(true);
    expect(handValue([makeCard('A', 'spades'), makeCard('K', 'clubs')]).isBlackjack).toBe(true);
    expect(handValue([makeCard('A', 'spades'), makeCard('5', 'hearts'), makeCard('5', 'diamonds')]).isBlackjack).toBe(
      false,
    );
    expect(handValue([makeCard('7', 'spades'), makeCard('7', 'hearts'), makeCard('7', 'diamonds')])).toEqual({
      total: 21,
      isSoft: false,
      isBust: false,
      isBlackjack: false,
      hardTotal: 21,
      softTotal: null,
    });
  });
});

describe('isPair', () => {
  it('returns true only for two cards with same rank', () => {
    expect(isPair([makeCard('5', 'spades'), makeCard('5', 'hearts')])).toBe(true);
    expect(isPair([makeCard('10', 'spades'), makeCard('10', 'hearts')])).toBe(true);
    expect(isPair([makeCard('10', 'spades'), makeCard('J', 'hearts')])).toBe(false);
    expect(isPair([makeCard('5', 'spades'), makeCard('6', 'hearts')])).toBe(false);
    expect(isPair([makeCard('5', 'spades')])).toBe(false);
    expect(isPair([makeCard('5', 'spades'), makeCard('5', 'hearts'), makeCard('5', 'diamonds')])).toBe(false);
    expect(isPair([])).toBe(false);
  });
});

describe('canSplitByValue', () => {
  it('returns true for two cards with same blackjack value', () => {
    expect(canSplitByValue([makeCard('5', 'spades'), makeCard('5', 'hearts')])).toBe(true);
    expect(canSplitByValue([makeCard('10', 'spades'), makeCard('J', 'hearts')])).toBe(true);
    expect(canSplitByValue([makeCard('J', 'spades'), makeCard('Q', 'hearts')])).toBe(true);
    expect(canSplitByValue([makeCard('K', 'spades'), makeCard('10', 'clubs')])).toBe(true);
    expect(canSplitByValue([makeCard('A', 'spades'), makeCard('A', 'hearts')])).toBe(true);
    expect(canSplitByValue([makeCard('9', 'spades'), makeCard('10', 'hearts')])).toBe(false);
    expect(canSplitByValue([makeCard('10', 'spades')])).toBe(false);
    expect(canSplitByValue([])).toBe(false);
  });
});
