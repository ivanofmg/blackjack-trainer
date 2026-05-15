import { handValue } from '@/lib/blackjack/hand';
import type { Card, Hand } from '@/lib/blackjack/types';

import type { StrategyUpcard } from './types';

export type HandCategory =
  | { kind: 'pair'; key: string }
  | { kind: 'soft'; key: string }
  | { kind: 'hard'; total: number };

function isTenValueRank(rank: Card['rank']): boolean {
  return rank === '10' || rank === 'J' || rank === 'Q' || rank === 'K';
}

function isPairByStrategyRules(hand: Hand): boolean {
  if (hand.cards.length !== 2) {
    return false;
  }

  const [first, second] = hand.cards;
  if (first.rank === second.rank) {
    return true;
  }

  return isTenValueRank(first.rank) && isTenValueRank(second.rank);
}

function pairKey(hand: Hand): string {
  const [first] = hand.cards;
  if (first.rank === 'A') {
    return 'AA';
  }
  if (isTenValueRank(first.rank)) {
    return 'TT';
  }
  return `${first.rank}${first.rank}`;
}

function pairLabelFromKey(key: string): string {
  if (key === 'AA') {
    return 'A,A';
  }
  if (key === 'TT') {
    return '10,10';
  }
  return `${key[0]},${key[1]}`;
}

/**
 * Describe the current hand for feedback and stats.
 * Examples:
 *   "Hard 16 vs 10"
 *   "Soft 18 vs 9"
 *   "Pair 8,8 vs A"
 */
export function describeHand(hand: Hand, dealerUpcard: Card): string {
  const dealerLabel = upcardToColumn(dealerUpcard);

  if (isPairByStrategyRules(hand)) {
    const key = pairKey(hand);
    return `Pair ${pairLabelFromKey(key)} vs ${dealerLabel}`;
  }

  const category = categorizeHand(hand);
  if (category.kind === 'soft') {
    const softTotal = Number(category.key.slice(1)) + 11;
    return `Soft ${softTotal} vs ${dealerLabel}`;
  }

  if (category.kind === 'hard') {
    return `Hard ${category.total} vs ${dealerLabel}`;
  }

  return `Pair ${pairLabelFromKey(category.key)} vs ${dealerLabel}`;
}

export function categorizeHand(hand: Hand): HandCategory {
  if (isPairByStrategyRules(hand)) {
    return { kind: 'pair', key: pairKey(hand) };
  }

  const value = handValue(hand.cards);
  if (value.isSoft) {
    if (value.softTotal === null) {
      throw new Error('Soft hand must have a soft total');
    }
    const nonAcePart = value.softTotal - 11;
    return { kind: 'soft', key: `A${nonAcePart}` };
  }

  return { kind: 'hard', total: value.hardTotal };
}

/**
 * Map upcard rank to strategy columns.
 * J/Q/K -> '10', Ace -> 'A', others keep the rank.
 */
export function upcardToColumn(card: Card): StrategyUpcard {
  if (card.rank === 'A') {
    return 'A';
  }
  if (isTenValueRank(card.rank)) {
    return '10';
  }
  return card.rank as StrategyUpcard;
}
