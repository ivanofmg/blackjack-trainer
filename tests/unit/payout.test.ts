import { describe, expect, it } from 'vitest';

import { handValue } from '@/lib/blackjack/hand';
import { resolveHand, resolveRound } from '@/lib/blackjack/payout';
import { DEFAULT_RULES } from '@/lib/blackjack/types';
import type { Card, Hand, Rank, RulesConfig, Suit } from '@/lib/blackjack/types';
import type { HandValue } from '@/lib/blackjack/hand';

function makeCard(rank: Rank, suit: Suit): Card {
  return { rank, suit };
}

function makeHand(cards: ReadonlyArray<Card>, bet = 10, overrides: Partial<Hand> = {}): Hand {
  return {
    cards,
    bet,
    isDoubled: false,
    isSplit: false,
    isSurrendered: false,
    isStood: false,
    ...overrides,
  };
}

function makeValue(total: number, isSoft = false, isBust = false, isBlackjack = false): HandValue {
  const hardTotal = isSoft ? total - 10 : total;
  return {
    total,
    isSoft,
    isBust,
    isBlackjack,
    hardTotal,
    softTotal: isSoft ? total : null,
  };
}

describe('resolveHand', () => {
  it('resolves surrender as half loss and half payout', () => {
    const player = makeHand([makeCard('10', 'spades'), makeCard('6', 'hearts')], 10, { isSurrendered: true });
    const dealer = makeValue(18);

    expect(resolveHand(player, dealer, DEFAULT_RULES)).toEqual({
      outcome: 'surrender',
      netResult: -5,
      payout: 5,
    });
  });

  it('resolves player bust as full loss', () => {
    const player = makeHand([makeCard('10', 'spades'), makeCard('7', 'hearts'), makeCard('10', 'clubs')]);
    const dealer = makeValue(18);

    expect(resolveHand(player, dealer, DEFAULT_RULES)).toEqual({
      outcome: 'lose',
      netResult: -10,
      payout: 0,
    });
  });

  it('resolves doubled bust using full doubled bet', () => {
    const player = makeHand(
      [makeCard('5', 'spades'), makeCard('5', 'hearts'), makeCard('J', 'diamonds'), makeCard('5', 'clubs')],
      20,
      { isDoubled: true },
    );
    const dealer = makeValue(18);

    expect(resolveHand(player, dealer, DEFAULT_RULES)).toEqual({
      outcome: 'lose',
      netResult: -20,
      payout: 0,
    });
  });

  it('resolves blackjack vs blackjack as push', () => {
    const player = makeHand([makeCard('A', 'spades'), makeCard('K', 'hearts')]);
    const dealer = makeValue(21, false, false, true);

    expect(resolveHand(player, dealer, DEFAULT_RULES)).toEqual({
      outcome: 'push',
      netResult: 0,
      payout: 10,
    });
  });

  it('resolves player blackjack with 3:2 payout against non-blackjack dealer', () => {
    const player = makeHand([makeCard('A', 'spades'), makeCard('K', 'hearts')]);
    const dealer = makeValue(20);

    expect(resolveHand(player, dealer, DEFAULT_RULES)).toEqual({
      outcome: 'blackjack',
      netResult: 15,
      payout: 25,
    });
  });

  it('resolves player blackjack with 6:5 payout when configured', () => {
    const player = makeHand([makeCard('A', 'spades'), makeCard('K', 'hearts')]);
    const dealer = makeValue(20);
    const sixToFiveRules: RulesConfig = {
      ...DEFAULT_RULES,
      blackjackPayout: 1.2,
    };

    expect(resolveHand(player, dealer, sixToFiveRules)).toEqual({
      outcome: 'blackjack',
      netResult: 12,
      payout: 22,
    });
  });

  it('resolves non-blackjack player hand as loss against dealer blackjack', () => {
    const player = makeHand([makeCard('10', 'spades'), makeCard('10', 'hearts')]);
    const dealer = makeValue(21, false, false, true);

    expect(resolveHand(player, dealer, DEFAULT_RULES)).toEqual({
      outcome: 'lose',
      netResult: -10,
      payout: 0,
    });
  });

  it('resolves player win when dealer busts and player is not bust', () => {
    const player = makeHand([makeCard('10', 'spades'), makeCard('7', 'hearts')]);
    const dealer = makeValue(23, false, true);

    expect(resolveHand(player, dealer, DEFAULT_RULES)).toEqual({
      outcome: 'win',
      netResult: 10,
      payout: 20,
    });
  });

  it('resolves win by total comparison', () => {
    const player = makeHand([makeCard('10', 'spades'), makeCard('K', 'hearts')]);
    const dealer = makeValue(18);

    expect(resolveHand(player, dealer, DEFAULT_RULES)).toEqual({
      outcome: 'win',
      netResult: 10,
      payout: 20,
    });
  });

  it('resolves simple push by equal totals', () => {
    const player = makeHand([makeCard('10', 'spades'), makeCard('8', 'hearts')]);
    const dealer = makeValue(18);

    expect(resolveHand(player, dealer, DEFAULT_RULES)).toEqual({
      outcome: 'push',
      netResult: 0,
      payout: 10,
    });
  });

  it('resolves dealer win by higher total', () => {
    const player = makeHand([makeCard('10', 'spades'), makeCard('7', 'hearts')]);
    const dealer = makeValue(19);

    expect(resolveHand(player, dealer, DEFAULT_RULES)).toEqual({
      outcome: 'lose',
      netResult: -10,
      payout: 0,
    });
  });

  it('resolves doubled win using doubled bet amount', () => {
    const player = makeHand([makeCard('5', 'spades'), makeCard('5', 'hearts'), makeCard('J', 'diamonds')], 20, {
      isDoubled: true,
    });
    const dealer = makeValue(19);

    expect(resolveHand(player, dealer, DEFAULT_RULES)).toEqual({
      outcome: 'win',
      netResult: 20,
      payout: 40,
    });
  });
});

describe('resolveRound', () => {
  it('resolves split hands in order', () => {
    const playerHands = [
      makeHand([makeCard('10', 'spades'), makeCard('8', 'hearts')]),
      makeHand([makeCard('10', 'diamonds'), makeCard('5', 'clubs')]),
    ];
    const dealer = handValue([makeCard('10', 'clubs'), makeCard('8', 'spades')]);

    expect(resolveRound(playerHands, dealer, DEFAULT_RULES)).toEqual([
      { outcome: 'push', netResult: 0, payout: 10 },
      { outcome: 'lose', netResult: -10, payout: 0 },
    ]);
  });
});
