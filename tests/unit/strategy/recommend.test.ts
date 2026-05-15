import { describe, expect, it } from 'vitest';

import { DEFAULT_RULES } from '@/lib/blackjack/types';
import type { Action, Card, Hand, Rank, Suit } from '@/lib/blackjack/types';
import { HARD_STRATEGY } from '@/lib/strategy/basicStrategy';
import { recommendAction } from '@/lib/strategy/recommend';

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

const allLegal: ReadonlyArray<Action> = ['hit', 'stand', 'double', 'split', 'surrender'];

describe('recommendAction', () => {
  it('recommends actions for hard, soft and pair categories', () => {
    expect(recommendAction(hand([card('10'), card('6')]), card('10'), DEFAULT_RULES, allLegal)).toBe('surrender');
    expect(recommendAction(hand([card('A'), card('7')]), card('3'), DEFAULT_RULES, allLegal)).toBe('double');
    expect(recommendAction(hand([card('8'), card('8')]), card('10'), DEFAULT_RULES, allLegal)).toBe('split');
  });

  it('falls back from Dh to hit when double is illegal', () => {
    const legal: ReadonlyArray<Action> = ['hit', 'stand'];
    expect(recommendAction(hand([card('5'), card('6')]), card('2'), DEFAULT_RULES, legal)).toBe('hit');
  });

  it('falls back from Ds to stand when double is illegal', () => {
    const legal: ReadonlyArray<Action> = ['hit', 'stand'];
    expect(recommendAction(hand([card('A'), card('7')]), card('3'), DEFAULT_RULES, legal)).toBe('stand');
  });

  it('falls back from Rh to hit when surrender is illegal', () => {
    const legal: ReadonlyArray<Action> = ['hit', 'stand'];
    expect(recommendAction(hand([card('10'), card('6')]), card('A'), DEFAULT_RULES, legal)).toBe('hit');
  });

  it('falls back from Ph to hit when DAS is disabled', () => {
    const noDasRules = { ...DEFAULT_RULES, doubleAfterSplit: false };
    expect(recommendAction(hand([card('4'), card('4')]), card('5'), noDasRules, allLegal)).toBe('hit');
  });

  it('treats mixed 10-value pairs as TT and recommends stand', () => {
    expect(
      recommendAction(hand([card('10', 'hearts'), card('J', 'spades')]), card('7'), DEFAULT_RULES, allLegal),
    ).toBe('stand');
  });

  it('falls back to hard/soft lookup when pair category cannot split', () => {
    const legal: ReadonlyArray<Action> = ['hit', 'stand', 'double'];
    expect(recommendAction(hand([card('2'), card('2')]), card('6'), DEFAULT_RULES, legal)).toBe('hit');
  });

  it('throws when hand has fewer than two cards', () => {
    expect(() => recommendAction(hand([card('A')]), card('10'), DEFAULT_RULES, allLegal)).toThrow(
      'Cannot recommend action for hand with < 2 cards',
    );
  });

  it('throws for busted hands', () => {
    expect(() =>
      recommendAction(hand([card('10'), card('9'), card('5')]), card('6'), DEFAULT_RULES, ['hit', 'stand']),
    ).toThrow('Cannot recommend action for busted hand');
  });

  it('responds in well under 50ms across 1000 invocations', () => {
    const samplePlayerHand = hand([card('A'), card('7')]);
    const sampleDealerCard = card('6');
    const start = performance.now();
    for (let i = 0; i < 1000; i += 1) {
      recommendAction(samplePlayerHand, sampleDealerCard, DEFAULT_RULES, allLegal);
    }
    const elapsed = performance.now() - start;
    expect(elapsed / 1000).toBeLessThan(50);
  });

  it('handles Ps decision fallback and split path', () => {
    const mutableHard = HARD_STRATEGY as unknown as string[][];
    const original = mutableHard[3][0]; // hard 8 vs 2
    mutableHard[3][0] = 'Ps';
    try {
      const sampleHand = hand([card('5'), card('3')]);
      expect(recommendAction(sampleHand, card('2'), { ...DEFAULT_RULES, doubleAfterSplit: false }, ['stand'])).toBe(
        'stand',
      );
      expect(recommendAction(sampleHand, card('2'), DEFAULT_RULES, ['split', 'stand'])).toBe('split');
    } finally {
      mutableHard[3][0] = original;
    }
  });

  it('handles Rs decision fallback and surrender path', () => {
    const mutableHard = HARD_STRATEGY as unknown as string[][];
    const original = mutableHard[3][1]; // hard 8 vs 3
    mutableHard[3][1] = 'Rs';
    try {
      const sampleHand = hand([card('5'), card('3')]);
      expect(recommendAction(sampleHand, card('3'), DEFAULT_RULES, ['stand'])).toBe('stand');
      expect(recommendAction(sampleHand, card('3'), DEFAULT_RULES, ['surrender', 'stand'])).toBe('surrender');
    } finally {
      mutableHard[3][1] = original;
    }
  });

  it('handles Rp decision with surrender/split/hit fallback order', () => {
    const mutableHard = HARD_STRATEGY as unknown as string[][];
    const original = mutableHard[3][2]; // hard 8 vs 4
    mutableHard[3][2] = 'Rp';
    try {
      const sampleHand = hand([card('5'), card('3')]);
      expect(recommendAction(sampleHand, card('4'), DEFAULT_RULES, ['surrender', 'split', 'hit'])).toBe('surrender');
      expect(recommendAction(sampleHand, card('4'), DEFAULT_RULES, ['split', 'hit'])).toBe('split');
      expect(recommendAction(sampleHand, card('4'), DEFAULT_RULES, ['hit'])).toBe('hit');
    } finally {
      mutableHard[3][2] = original;
    }
  });

  it('handles unexpected P decision fallback when split is unavailable', () => {
    const mutableHard = HARD_STRATEGY as unknown as string[][];
    const original = mutableHard[3][3]; // hard 8 vs 5
    mutableHard[3][3] = 'P';
    try {
      const sampleHand = hand([card('5'), card('3')]);
      expect(recommendAction(sampleHand, card('5'), DEFAULT_RULES, ['hit', 'stand'])).toBe('hit');
    } finally {
      mutableHard[3][3] = original;
    }
  });
});
