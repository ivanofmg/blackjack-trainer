import { describe, expect, it } from 'vitest';

import { createShoe, decksRemaining, drawCard, needsReshuffle, shuffle } from '@/lib/blackjack/deck';
import { RANKS, SUITS } from '@/lib/blackjack/types';
import type { Card } from '@/lib/blackjack/types';

function cardKey(card: Card): string {
  return `${card.rank}-${card.suit}`;
}

function countByRank(cards: ReadonlyArray<Card>): Map<string, number> {
  const counts = new Map<string, number>();

  for (const card of cards) {
    const current = counts.get(card.rank) ?? 0;
    counts.set(card.rank, current + 1);
  }

  return counts;
}

function countBySuit(cards: ReadonlyArray<Card>): Map<string, number> {
  const counts = new Map<string, number>();

  for (const card of cards) {
    const current = counts.get(card.suit) ?? 0;
    counts.set(card.suit, current + 1);
  }

  return counts;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('createShoe', () => {
  it('creates 1 deck with 52 cards and expected composition', () => {
    const shoe = createShoe(1);
    const rankCounts = countByRank(shoe);
    const suitCounts = countBySuit(shoe);

    expect(shoe).toHaveLength(52);
    for (const rank of RANKS) {
      expect(rankCounts.get(rank)).toBe(4);
    }
    for (const suit of SUITS) {
      expect(suitCounts.get(suit)).toBe(13);
    }
  });

  it('creates 6 decks with 312 cards and 24 of each rank', () => {
    const shoe = createShoe(6);
    const rankCounts = countByRank(shoe);

    expect(shoe).toHaveLength(312);
    for (const rank of RANKS) {
      expect(rankCounts.get(rank)).toBe(24);
    }
  });

  it('keeps deterministic initial order by suit then rank for each deck', () => {
    const shoe = createShoe(1);

    expect(shoe[0]).toEqual({ suit: 'hearts', rank: 'A' });
    expect(shoe[12]).toEqual({ suit: 'hearts', rank: 'K' });
    expect(shoe[13]).toEqual({ suit: 'diamonds', rank: 'A' });
    expect(shoe[51]).toEqual({ suit: 'spades', rank: 'K' });
  });

  it('throws for decks outside valid range', () => {
    expect(() => createShoe(0)).toThrowError('Decks must be between 1 and 8');
    expect(() => createShoe(9)).toThrowError('Decks must be between 1 and 8');
  });
});

describe('shuffle', () => {
  it('returns same cards and length, usually in different order', () => {
    const shoe = createShoe(1);
    const shuffled = shuffle(shoe);

    expect(shuffled).toHaveLength(shoe.length);
    expect(shuffled.map(cardKey).sort()).toEqual(shoe.map(cardKey).sort());
    expect(shuffled.map(cardKey)).not.toEqual(shoe.map(cardKey));
  });

  it('is deterministic when using seeded rng across multiple runs', () => {
    const shoe = createShoe(1);
    const first = shuffle(shoe, mulberry32(12345));
    const second = shuffle(shoe, mulberry32(12345));
    const third = shuffle(shoe, mulberry32(12345));

    expect(first).toEqual(second);
    expect(second).toEqual(third);
  });

  it('does not mutate the input shoe', () => {
    const original = createShoe(1);
    const snapshot = original.map(cardKey);

    const shuffled = shuffle(original, mulberry32(7));

    expect(original.map(cardKey)).toEqual(snapshot);
    expect(original[0]).toEqual({ suit: 'hearts', rank: 'A' });
    expect(shuffled).not.toBe(original);
  });

  it('shows near-uniform position frequencies over many shuffles', () => {
    const base: ReadonlyArray<Card> = [
      { rank: 'A', suit: 'hearts' },
      { rank: '2', suit: 'hearts' },
      { rank: '3', suit: 'hearts' },
      { rank: '4', suit: 'hearts' },
    ];

    const iterations = 10000;
    const expected = iterations / base.length;
    const tolerance = expected * 0.1;
    const counts = base.map(() => base.map(() => 0));

    for (let i = 0; i < iterations; i += 1) {
      const shuffled = shuffle(base, mulberry32(i + 1));

      for (let position = 0; position < shuffled.length; position += 1) {
        const cardIndex = base.findIndex((card) => cardKey(card) === cardKey(shuffled[position]));
        counts[cardIndex][position] += 1;
      }
    }

    for (const row of counts) {
      for (const cell of row) {
        expect(cell).toBeGreaterThanOrEqual(expected - tolerance);
        expect(cell).toBeLessThanOrEqual(expected + tolerance);
      }
    }
  });
});

describe('drawCard', () => {
  it('draws the first card and returns remaining shoe', () => {
    const shoe = createShoe(1);
    const result = drawCard(shoe);

    expect(result.card).toEqual({ rank: 'A', suit: 'hearts' });
    expect(result.shoe).toHaveLength(51);
    expect(result.shoe[0]).toEqual({ rank: '2', suit: 'hearts' });
  });

  it('throws when shoe is empty', () => {
    expect(() => drawCard([])).toThrowError('Shoe is empty');
  });

  it('does not mutate original shoe', () => {
    const shoe = createShoe(1);
    const firstCardBefore = shoe[0];

    const { shoe: nextShoe } = drawCard(shoe);

    expect(shoe).toHaveLength(52);
    expect(shoe[0]).toEqual(firstCardBefore);
    expect(nextShoe).toHaveLength(51);
  });
});

describe('needsReshuffle', () => {
  it('returns true at 75% penetration for 6 decks', () => {
    const originalSize = 312;
    const shoeAtCut = new Array<Card>(78).fill({ rank: 'A', suit: 'hearts' });
    const shoeBeforeCut = new Array<Card>(79).fill({ rank: 'A', suit: 'hearts' });

    expect(needsReshuffle(shoeAtCut, originalSize, 0.75)).toBe(true);
    expect(needsReshuffle(shoeBeforeCut, originalSize, 0.75)).toBe(false);
  });

  it('throws for invalid penetration values', () => {
    const shoe = createShoe(1);

    expect(() => needsReshuffle(shoe, 52, 0)).toThrowError(
      'Penetration must be greater than 0 and less than or equal to 1',
    );
    expect(() => needsReshuffle(shoe, 52, -0.1)).toThrowError(
      'Penetration must be greater than 0 and less than or equal to 1',
    );
    expect(() => needsReshuffle(shoe, 52, 1.1)).toThrowError(
      'Penetration must be greater than 0 and less than or equal to 1',
    );
  });

  it('throws for invalid original size', () => {
    const shoe = createShoe(1);

    expect(() => needsReshuffle(shoe, 0, 0.75)).toThrowError('Original size must be greater than 0');
    expect(() => needsReshuffle(shoe, -1, 0.75)).toThrowError('Original size must be greater than 0');
  });
});

describe('decksRemaining', () => {
  it('rounds remaining decks to nearest quarter', () => {
    expect(decksRemaining(new Array<Card>(312).fill({ rank: 'A', suit: 'hearts' }))).toBe(6);
    expect(decksRemaining(new Array<Card>(286).fill({ rank: 'A', suit: 'hearts' }))).toBe(5.5);
    expect(decksRemaining(new Array<Card>(78).fill({ rank: 'A', suit: 'hearts' }))).toBe(1.5);
    expect(decksRemaining(new Array<Card>(13).fill({ rank: 'A', suit: 'hearts' }))).toBe(0.25);
  });
});
