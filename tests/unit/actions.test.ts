import { describe, expect, it } from 'vitest';

import { legalActions } from '@/lib/blackjack/actions';
import type { ActionContext } from '@/lib/blackjack/actions';
import { DEFAULT_RULES } from '@/lib/blackjack/types';
import type { Card, Hand, Rank, RulesConfig, Suit } from '@/lib/blackjack/types';

function makeCard(rank: Rank, suit: Suit): Card {
  return { rank, suit };
}

function makeHand(cards: ReadonlyArray<Card>, overrides: Partial<Hand> = {}): Hand {
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

function makeContext(overrides: Partial<ActionContext> = {}): ActionContext {
  return {
    bankroll: 100,
    splitsUsed: 0,
    isInitialHand: true,
    dealerUpcard: makeCard('6', 'clubs'),
    isFromSplitAces: false,
    ...overrides,
  };
}

describe('legalActions', () => {
  it('returns hit/stand/double/surrender for basic 10-7 opening hand', () => {
    const hand = makeHand([makeCard('10', 'spades'), makeCard('7', 'hearts')]);

    expect(legalActions(hand, DEFAULT_RULES, makeContext())).toEqual(['hit', 'stand', 'double', 'surrender']);
  });

  it('allows split on pair of tens', () => {
    const hand = makeHand([makeCard('10', 'spades'), makeCard('10', 'hearts')]);

    expect(legalActions(hand, DEFAULT_RULES, makeContext())).toEqual([
      'hit',
      'stand',
      'double',
      'split',
      'surrender',
    ]);
  });

  it('handles split aces hand and then lock-down after split', () => {
    const openingAces = makeHand([makeCard('A', 'spades'), makeCard('A', 'hearts')]);
    expect(legalActions(openingAces, DEFAULT_RULES, makeContext())).toEqual([
      'hit',
      'stand',
      'double',
      'split',
      'surrender',
    ]);

    const splitAceHand = makeHand([makeCard('A', 'spades'), makeCard('9', 'hearts')], { isSplit: true });
    expect(
      legalActions(
        splitAceHand,
        DEFAULT_RULES,
        makeContext({
          isInitialHand: false,
          isFromSplitAces: true,
        }),
      ),
    ).toEqual(['stand']);
  });

  it('returns hit/stand/double/surrender for 5-6 opening hand', () => {
    const hand = makeHand([makeCard('5', 'spades'), makeCard('6', 'hearts')]);

    expect(legalActions(hand, DEFAULT_RULES, makeContext())).toEqual(['hit', 'stand', 'double', 'surrender']);
  });

  it('offers insurance only with dealer ace on initial two-card hand', () => {
    const hand = makeHand([makeCard('10', 'spades'), makeCard('7', 'hearts')]);

    expect(
      legalActions(
        hand,
        DEFAULT_RULES,
        makeContext({
          dealerUpcard: makeCard('A', 'diamonds'),
        }),
      ),
    ).toEqual(['hit', 'stand', 'double', 'surrender', 'insurance']);
  });

  it('does not offer insurance when player has blackjack against dealer ace', () => {
    const hand = makeHand([makeCard('A', 'spades'), makeCard('K', 'hearts')]);
    const ctx = makeContext({ dealerUpcard: makeCard('A', 'diamonds') });

    expect(legalActions(hand, DEFAULT_RULES, ctx)).toEqual([]);
  });

  it('allows hit and stand on hard 21 with three cards', () => {
    const hand = makeHand([makeCard('10', 'spades'), makeCard('7', 'hearts'), makeCard('4', 'diamonds')]);

    expect(legalActions(hand, DEFAULT_RULES, makeContext({ isInitialHand: false }))).toEqual(['hit', 'stand']);
  });

  it('returns empty actions for bust hand', () => {
    const hand = makeHand([makeCard('10', 'spades'), makeCard('7', 'hearts'), makeCard('10', 'clubs')]);

    expect(legalActions(hand, DEFAULT_RULES, makeContext({ isInitialHand: false }))).toEqual([]);
  });

  it('returns empty actions for blackjack hand', () => {
    const hand = makeHand([makeCard('A', 'spades'), makeCard('K', 'hearts')]);

    expect(legalActions(hand, DEFAULT_RULES, makeContext())).toEqual([]);
  });

  it('disables double and split when bankroll is insufficient', () => {
    const hand = makeHand([makeCard('10', 'spades'), makeCard('10', 'hearts')]);

    expect(legalActions(hand, DEFAULT_RULES, makeContext({ bankroll: 5 }))).toEqual(['hit', 'stand', 'surrender']);
  });

  it('disables split when max splits is reached', () => {
    const hand = makeHand([makeCard('10', 'spades'), makeCard('10', 'hearts')]);
    const rules: RulesConfig = {
      ...DEFAULT_RULES,
      maxSplits: 2,
    };

    expect(legalActions(hand, rules, makeContext({ splitsUsed: 2 }))).toEqual(['hit', 'stand', 'double', 'surrender']);
  });

  it('allows double after split only when rule enables it', () => {
    const hand = makeHand([makeCard('10', 'spades'), makeCard('10', 'hearts')], { isSplit: true });

    const allowDas: RulesConfig = {
      ...DEFAULT_RULES,
      doubleAfterSplit: true,
    };
    expect(legalActions(hand, allowDas, makeContext({ isInitialHand: false }))).toEqual([
      'hit',
      'stand',
      'double',
      'split',
    ]);

    const disallowDas: RulesConfig = {
      ...DEFAULT_RULES,
      doubleAfterSplit: false,
    };
    expect(legalActions(hand, disallowDas, makeContext({ isInitialHand: false }))).toEqual(['hit', 'stand', 'split']);
  });

  it('disables surrender when table rules do not allow it', () => {
    const hand = makeHand([makeCard('10', 'spades'), makeCard('7', 'hearts')]);
    const rules: RulesConfig = {
      ...DEFAULT_RULES,
      surrender: 'none',
    };

    expect(legalActions(hand, rules, makeContext())).toEqual(['hit', 'stand', 'double']);
  });

  it('keeps hit/stand but disallows double/surrender with non-initial 3-card 21', () => {
    const hand = makeHand([makeCard('10', 'spades'), makeCard('7', 'hearts'), makeCard('4', 'diamonds')]);

    expect(legalActions(hand, DEFAULT_RULES, makeContext({ isInitialHand: false }))).toEqual(['hit', 'stand']);
  });
});
