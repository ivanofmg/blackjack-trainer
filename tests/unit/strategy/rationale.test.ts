import { describe, expect, it } from 'vitest';

import { DEFAULT_RULES } from '@/lib/blackjack/types';
import type { Action, Card, Hand, Rank } from '@/lib/blackjack/types';
import { getRationale } from '@/lib/strategy/rationale';
import { __internal } from '@/lib/strategy/rationale';
import type { RationaleKey } from '@/lib/strategy/rationale';
import { recommendAction } from '@/lib/strategy/recommend';

const ALL_LEGAL_ACTIONS: ReadonlyArray<Action> = ['hit', 'stand', 'double', 'split', 'surrender'];

function card(rank: Rank, suit: Card['suit'] = 'clubs'): Card {
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

type Cell = Readonly<{
  key: RationaleKey;
  optimalAction: Action;
}>;

const PEDAGOGICAL_CELLS: ReadonlyArray<Cell> = [
  { key: { category: 'soft', totalOrPair: 'A2', upcard: '5' }, optimalAction: 'double' },
  { key: { category: 'soft', totalOrPair: 'A2', upcard: '6' }, optimalAction: 'double' },
  { key: { category: 'soft', totalOrPair: 'A3', upcard: '5' }, optimalAction: 'double' },
  { key: { category: 'soft', totalOrPair: 'A3', upcard: '6' }, optimalAction: 'double' },
  { key: { category: 'soft', totalOrPair: 'A4', upcard: '4' }, optimalAction: 'double' },
  { key: { category: 'soft', totalOrPair: 'A4', upcard: '5' }, optimalAction: 'double' },
  { key: { category: 'soft', totalOrPair: 'A4', upcard: '6' }, optimalAction: 'double' },
  { key: { category: 'soft', totalOrPair: 'A5', upcard: '4' }, optimalAction: 'double' },
  { key: { category: 'soft', totalOrPair: 'A5', upcard: '5' }, optimalAction: 'double' },
  { key: { category: 'soft', totalOrPair: 'A5', upcard: '6' }, optimalAction: 'double' },
  { key: { category: 'soft', totalOrPair: 'A6', upcard: '3' }, optimalAction: 'double' },
  { key: { category: 'soft', totalOrPair: 'A6', upcard: '4' }, optimalAction: 'double' },
  { key: { category: 'soft', totalOrPair: 'A6', upcard: '5' }, optimalAction: 'double' },
  { key: { category: 'soft', totalOrPair: 'A6', upcard: '6' }, optimalAction: 'double' },
  { key: { category: 'soft', totalOrPair: 'A6', upcard: '2' }, optimalAction: 'hit' },
  { key: { category: 'soft', totalOrPair: 'A7', upcard: '2' }, optimalAction: 'stand' },
  { key: { category: 'soft', totalOrPair: 'A7', upcard: '3' }, optimalAction: 'double' },
  { key: { category: 'soft', totalOrPair: 'A7', upcard: '4' }, optimalAction: 'double' },
  { key: { category: 'soft', totalOrPair: 'A7', upcard: '5' }, optimalAction: 'double' },
  { key: { category: 'soft', totalOrPair: 'A7', upcard: '6' }, optimalAction: 'double' },
  { key: { category: 'soft', totalOrPair: 'A7', upcard: '7' }, optimalAction: 'stand' },
  { key: { category: 'soft', totalOrPair: 'A7', upcard: '8' }, optimalAction: 'stand' },
  { key: { category: 'soft', totalOrPair: 'A7', upcard: '9' }, optimalAction: 'hit' },
  { key: { category: 'soft', totalOrPair: 'A7', upcard: 'T' }, optimalAction: 'hit' },
  { key: { category: 'soft', totalOrPair: 'A7', upcard: 'A' }, optimalAction: 'hit' },
  { key: { category: 'hard', totalOrPair: '9', upcard: '3' }, optimalAction: 'double' },
  { key: { category: 'hard', totalOrPair: '9', upcard: '4' }, optimalAction: 'double' },
  { key: { category: 'hard', totalOrPair: '9', upcard: '5' }, optimalAction: 'double' },
  { key: { category: 'hard', totalOrPair: '9', upcard: '6' }, optimalAction: 'double' },
  { key: { category: 'hard', totalOrPair: '9', upcard: '2' }, optimalAction: 'hit' },
  { key: { category: 'hard', totalOrPair: '11', upcard: 'A' }, optimalAction: 'hit' },
  { key: { category: 'hard', totalOrPair: '12', upcard: '2' }, optimalAction: 'hit' },
  { key: { category: 'hard', totalOrPair: '12', upcard: '3' }, optimalAction: 'hit' },
  { key: { category: 'hard', totalOrPair: '12', upcard: '4' }, optimalAction: 'stand' },
  { key: { category: 'hard', totalOrPair: '12', upcard: '5' }, optimalAction: 'stand' },
  { key: { category: 'hard', totalOrPair: '12', upcard: '6' }, optimalAction: 'stand' },
  { key: { category: 'hard', totalOrPair: '13', upcard: '2' }, optimalAction: 'stand' },
  { key: { category: 'hard', totalOrPair: '14', upcard: '2' }, optimalAction: 'stand' },
  { key: { category: 'hard', totalOrPair: '15', upcard: 'T' }, optimalAction: 'surrender' },
  { key: { category: 'hard', totalOrPair: '16', upcard: '9' }, optimalAction: 'surrender' },
  { key: { category: 'hard', totalOrPair: '16', upcard: 'T' }, optimalAction: 'surrender' },
  { key: { category: 'hard', totalOrPair: '16', upcard: 'A' }, optimalAction: 'surrender' },
  { key: { category: 'pair', totalOrPair: '22', upcard: '2' }, optimalAction: 'split' },
  { key: { category: 'pair', totalOrPair: '22', upcard: '3' }, optimalAction: 'split' },
  { key: { category: 'pair', totalOrPair: '33', upcard: '2' }, optimalAction: 'split' },
  { key: { category: 'pair', totalOrPair: '33', upcard: '3' }, optimalAction: 'split' },
  { key: { category: 'pair', totalOrPair: '44', upcard: '5' }, optimalAction: 'split' },
  { key: { category: 'pair', totalOrPair: '44', upcard: '6' }, optimalAction: 'split' },
  { key: { category: 'pair', totalOrPair: '66', upcard: '2' }, optimalAction: 'split' },
  { key: { category: 'pair', totalOrPair: '66', upcard: '7' }, optimalAction: 'hit' },
  { key: { category: 'pair', totalOrPair: '77', upcard: '8' }, optimalAction: 'hit' },
  { key: { category: 'pair', totalOrPair: '77', upcard: 'T' }, optimalAction: 'hit' },
  { key: { category: 'pair', totalOrPair: '88', upcard: 'T' }, optimalAction: 'split' },
  { key: { category: 'pair', totalOrPair: '88', upcard: 'A' }, optimalAction: 'split' },
  { key: { category: 'pair', totalOrPair: '99', upcard: '7' }, optimalAction: 'stand' },
  { key: { category: 'pair', totalOrPair: '99', upcard: 'T' }, optimalAction: 'stand' },
  { key: { category: 'pair', totalOrPair: '99', upcard: 'A' }, optimalAction: 'stand' },
];

function upcardRank(upcard: RationaleKey['upcard']): Rank {
  return upcard === 'T' ? '10' : upcard;
}

function handFromKey(key: RationaleKey): Hand {
  if (key.category === 'soft') {
    const second = key.totalOrPair.replace('A', '') as Rank;
    return hand([card('A', 'clubs'), card(second, 'diamonds')]);
  }

  if (key.category === 'pair') {
    const pair = key.totalOrPair.toUpperCase();
    if (pair === 'AA') {
      return hand([card('A', 'clubs'), card('A', 'diamonds')]);
    }
    if (pair === 'TT') {
      return hand([card('10', 'clubs'), card('K', 'diamonds')]);
    }
    const rank = pair[0] as Rank;
    return hand([card(rank, 'clubs'), card(rank, 'diamonds')]);
  }

  const total = Number.parseInt(key.totalOrPair, 10);
  const hardMap: Readonly<Record<number, readonly [Rank, Rank]>> = {
    8: ['5', '3'],
    9: ['5', '4'],
    10: ['6', '4'],
    11: ['6', '5'],
    12: ['10', '2'],
    13: ['10', '3'],
    14: ['10', '4'],
    15: ['10', '5'],
    16: ['10', '6'],
    17: ['10', '7'],
  };
  const cards = hardMap[total] ?? ['10', '2'];
  return hand([card(cards[0], 'clubs'), card(cards[1], 'diamonds')]);
}

describe('getRationale', () => {
  it('returns non-empty rationale for all 36 pedagogical cells', () => {
    expect(PEDAGOGICAL_CELLS.length).toBeGreaterThan(0);

    for (const entry of PEDAGOGICAL_CELLS) {
      const rationale = getRationale(entry.key);
      expect(rationale.short.length).toBeGreaterThan(0);
      expect(rationale.long.length).toBeGreaterThan(0);
      expect(rationale.short.length).toBeLessThanOrEqual(80);
    }
  });

  it('returns generic fallback rationale by optimal action when cell has no explicit rationale', () => {
    const hitFallback = getRationale({ category: 'hard', totalOrPair: '8', upcard: '2' });
    const standFallback = getRationale({ category: 'hard', totalOrPair: '17', upcard: '2' });
    const doubleFallback = getRationale({ category: 'hard', totalOrPair: '10', upcard: '2' });
    const splitFallback = getRationale({ category: 'pair', totalOrPair: 'AA', upcard: '6' });
    const surrenderFallback = getRationale({ category: 'hard', totalOrPair: '016', upcard: 'A' });

    expect(hitFallback).toEqual(__internal.FALLBACK_RATIONALES.hit);
    expect(standFallback).toEqual(__internal.FALLBACK_RATIONALES.stand);
    expect(doubleFallback).toEqual(__internal.FALLBACK_RATIONALES.double);
    expect(splitFallback).toEqual(__internal.FALLBACK_RATIONALES.split);
    expect(surrenderFallback).toEqual(__internal.FALLBACK_RATIONALES.surrender);
  });

  it('never throws and always returns a valid rationale', () => {
    const unknownKeys: ReadonlyArray<RationaleKey> = [
      { category: 'hard', totalOrPair: '0', upcard: '2' },
      { category: 'hard', totalOrPair: '99', upcard: 'T' },
      { category: 'soft', totalOrPair: 'A1', upcard: '3' },
      { category: 'pair', totalOrPair: '11', upcard: 'A' },
    ];

    for (const key of unknownKeys) {
      expect(() => getRationale(key)).not.toThrow();
      const rationale = getRationale(key);
      expect(typeof rationale.short).toBe('string');
      expect(typeof rationale.long).toBe('string');
      expect(rationale.short.length).toBeGreaterThan(0);
      expect(rationale.long.length).toBeGreaterThan(0);
    }
  });

  it('keeps pedagogical cells aligned with current basicStrategy optimal actions', () => {
    const mismatches: Array<{ index: number; key: RationaleKey; expected: Action; received: Action }> = [];

    for (const [index, entry] of PEDAGOGICAL_CELLS.entries()) {
      const playerHand = handFromKey(entry.key);
      const dealerUpcard = card(upcardRank(entry.key.upcard), 'spades');
      const action = recommendAction(playerHand, dealerUpcard, DEFAULT_RULES, ALL_LEGAL_ACTIONS);
      if (action !== entry.optimalAction) {
        mismatches.push({
          index: index + 1,
          key: entry.key,
          expected: entry.optimalAction,
          received: action,
        });
      }
    }

    expect(mismatches).toEqual([]);
  });
});
