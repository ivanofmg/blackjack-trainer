import { describe, expect, it } from 'vitest';

import { playDealerHand, shouldDealerHit } from '@/lib/blackjack/dealer';
import { DEFAULT_RULES } from '@/lib/blackjack/types';
import type { Card, Rank, RulesConfig, Suit } from '@/lib/blackjack/types';
import type { Shoe } from '@/lib/blackjack/deck';
import type { HandValue } from '@/lib/blackjack/hand';

function makeCard(rank: Rank, suit: Suit): Card {
  return { rank, suit };
}

function makeShoe(ranks: ReadonlyArray<Rank>, suit: Suit = 'clubs'): Shoe {
  return ranks.map((rank) => makeCard(rank, suit));
}

function makeValue(total: number, isSoft: boolean, isBust: boolean): HandValue {
  const hardTotal = isSoft ? total - 10 : total;
  return {
    total,
    isSoft,
    isBust,
    isBlackjack: false,
    hardTotal,
    softTotal: isSoft ? total : null,
  };
}

describe('shouldDealerHit', () => {
  const s17Rules: RulesConfig = { ...DEFAULT_RULES, dealerHitsSoft17: false };
  const h17Rules: RulesConfig = { ...DEFAULT_RULES, dealerHitsSoft17: true };

  it('hits on hard 16 for S17 and H17', () => {
    const value = makeValue(16, false, false);

    expect(shouldDealerHit(value, s17Rules)).toBe(true);
    expect(shouldDealerHit(value, h17Rules)).toBe(true);
  });

  it('stands on hard 17 for S17 and H17', () => {
    const value = makeValue(17, false, false);

    expect(shouldDealerHit(value, s17Rules)).toBe(false);
    expect(shouldDealerHit(value, h17Rules)).toBe(false);
  });

  it('stands on soft 17 in S17 and hits on soft 17 in H17', () => {
    const value = makeValue(17, true, false);

    expect(shouldDealerHit(value, s17Rules)).toBe(false);
    expect(shouldDealerHit(value, h17Rules)).toBe(true);
  });

  it('stands on soft 18 regardless of rule', () => {
    const value = makeValue(18, true, false);

    expect(shouldDealerHit(value, s17Rules)).toBe(false);
    expect(shouldDealerHit(value, h17Rules)).toBe(false);
  });

  it('returns false defensively for bust totals', () => {
    const value = makeValue(22, false, true);

    expect(shouldDealerHit(value, s17Rules)).toBe(false);
    expect(shouldDealerHit(value, h17Rules)).toBe(false);
  });
});

describe('playDealerHand', () => {
  const s17Rules: RulesConfig = { ...DEFAULT_RULES, dealerHitsSoft17: false };
  const h17Rules: RulesConfig = { ...DEFAULT_RULES, dealerHitsSoft17: true };

  it('draws from hard 16 to 21 then stands', () => {
    const initialHand = [makeCard('10', 'spades'), makeCard('6', 'hearts')];
    const shoe = makeShoe(['5', 'K']);

    const result = playDealerHand(initialHand, shoe, s17Rules);

    expect(result.hand).toEqual([...initialHand, makeCard('5', 'clubs')]);
    expect(result.shoe).toEqual([makeCard('K', 'clubs')]);
    expect(result.finalValue).toEqual({
      total: 21,
      isSoft: false,
      isBust: false,
      isBlackjack: false,
      hardTotal: 21,
      softTotal: null,
    });
  });

  it('stands on hard 17 without drawing', () => {
    const initialHand = [makeCard('10', 'spades'), makeCard('7', 'hearts')];
    const shoe = makeShoe(['K']);

    const result = playDealerHand(initialHand, shoe, s17Rules);

    expect(result.hand).toEqual(initialHand);
    expect(result.shoe).toEqual(shoe);
    expect(result.finalValue.total).toBe(17);
  });

  it('stands on soft 17 when using S17', () => {
    const initialHand = [makeCard('A', 'spades'), makeCard('6', 'hearts')];
    const shoe = makeShoe(['5']);

    const result = playDealerHand(initialHand, shoe, s17Rules);

    expect(result.hand).toEqual(initialHand);
    expect(result.shoe).toEqual(shoe);
    expect(result.finalValue).toEqual({
      total: 17,
      isSoft: true,
      isBust: false,
      isBlackjack: false,
      hardTotal: 7,
      softTotal: 17,
    });
  });

  it('hits soft 17 in H17 and continues until bust', () => {
    const initialHand = [makeCard('A', 'spades'), makeCard('6', 'hearts')];
    const shoe = makeShoe(['5', 'K']);

    const result = playDealerHand(initialHand, shoe, h17Rules);

    expect(result.hand).toEqual([
      makeCard('A', 'spades'),
      makeCard('6', 'hearts'),
      makeCard('5', 'clubs'),
      makeCard('K', 'clubs'),
    ]);
    expect(result.shoe).toEqual([]);
    expect(result.finalValue).toEqual({
      total: 22,
      isSoft: false,
      isBust: true,
      isBlackjack: false,
      hardTotal: 22,
      softTotal: null,
    });
  });

  it('stops immediately when dealer busts', () => {
    const initialHand = [makeCard('10', 'spades'), makeCard('6', 'hearts')];
    const shoe = makeShoe(['10', '2']);

    const result = playDealerHand(initialHand, shoe, s17Rules);

    expect(result.hand).toEqual([...initialHand, makeCard('10', 'clubs')]);
    expect(result.shoe).toEqual([makeCard('2', 'clubs')]);
    expect(result.finalValue.isBust).toBe(true);
  });

  it('does not hit on initial blackjack', () => {
    const initialHand = [makeCard('A', 'spades'), makeCard('K', 'hearts')];
    const shoe = makeShoe(['5']);

    const result = playDealerHand(initialHand, shoe, s17Rules);

    expect(result.hand).toEqual(initialHand);
    expect(result.shoe).toEqual(shoe);
    expect(result.finalValue).toEqual({
      total: 21,
      isSoft: true,
      isBust: false,
      isBlackjack: true,
      hardTotal: 11,
      softTotal: 21,
    });
  });

  it('does not mutate initial hand or shoe inputs', () => {
    const initialHand = [makeCard('10', 'spades'), makeCard('6', 'hearts')];
    const shoe = makeShoe(['5', 'K']);
    const initialHandSnapshot = [...initialHand];
    const shoeSnapshot = [...shoe];

    playDealerHand(initialHand, shoe, s17Rules);

    expect(initialHand).toEqual(initialHandSnapshot);
    expect(initialHand).toHaveLength(2);
    expect(shoe).toEqual(shoeSnapshot);
    expect(shoe).toHaveLength(2);
  });
});
