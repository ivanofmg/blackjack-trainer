import { handValue } from '@/lib/blackjack/hand';
import type { Action, Card, Hand, RulesConfig } from '@/lib/blackjack/types';

import { HARD_STRATEGY, PAIR_STRATEGY, SOFT_STRATEGY } from './basicStrategy';
import { categorizeHand, upcardToColumn } from './describe';
import { UPCARD_INDEX } from './types';
import type { HandCategory } from './describe';
import type { StrategyDecision } from './types';

function hasAction(legalActions: ReadonlyArray<Action>, action: Action): boolean {
  return legalActions.includes(action);
}

function fallbackCategoryWithoutPair(hand: Hand): HandCategory {
  const value = handValue(hand.cards);
  if (value.isSoft && value.softTotal !== null) {
    const key = `A${value.softTotal - 11}`;
    if (SOFT_STRATEGY[key]) {
      return { kind: 'soft', key };
    }
  }
  return { kind: 'hard', total: value.hardTotal };
}

function lookupDecision(category: HandCategory, upcardIndex: number): StrategyDecision {
  if (category.kind === 'pair') {
    const row = PAIR_STRATEGY[category.key];
    if (!row) {
      throw new Error(`Missing pair strategy row for key "${category.key}"`);
    }
    return row[upcardIndex];
  }

  if (category.kind === 'soft') {
    const row = SOFT_STRATEGY[category.key];
    if (!row) {
      throw new Error(`Missing soft strategy row for key "${category.key}"`);
    }
    return row[upcardIndex];
  }

  if (category.total <= 4) {
    return 'H';
  }

  const hardIndex = category.total - 5;
  const row = HARD_STRATEGY[hardIndex];
  if (!row) {
    throw new Error(`Missing hard strategy row for total "${category.total}"`);
  }
  return row[upcardIndex];
}

export function recommendAction(
  playerHand: Hand,
  dealerUpcard: Card,
  rules: RulesConfig,
  legalActions: ReadonlyArray<Action>,
): Action {
  if (playerHand.cards.length < 2) {
    throw new Error('Cannot recommend action for hand with < 2 cards');
  }

  const value = handValue(playerHand.cards);
  if (value.hardTotal > 21) {
    throw new Error('Cannot recommend action for busted hand');
  }

  const upcard = upcardToColumn(dealerUpcard);
  const upcardIndex = UPCARD_INDEX[upcard];
  let category = categorizeHand(playerHand);

  // If split is no longer legal (e.g. split cap reached), continue with hard/soft rules.
  if (category.kind === 'pair' && !hasAction(legalActions, 'split')) {
    category = fallbackCategoryWithoutPair(playerHand);
  }

  const decision = lookupDecision(category, upcardIndex);
  return resolveDecision(decision, legalActions, rules);
}

function resolveDecision(
  decision: StrategyDecision,
  legalActions: ReadonlyArray<Action>,
  rules: RulesConfig,
): Action {
  switch (decision) {
    case 'H':
      return 'hit';
    case 'S':
      return 'stand';
    case 'Dh':
      return hasAction(legalActions, 'double') ? 'double' : 'hit'; // fallback to hit when double unavailable.
    case 'Ds':
      return hasAction(legalActions, 'double') ? 'double' : 'stand'; // fallback to stand when double unavailable.
    case 'P':
      return hasAction(legalActions, 'split') ? 'split' : 'hit'; // split should be legal for pure pair rows.
    case 'Ph':
      return hasAction(legalActions, 'split') && rules.doubleAfterSplit ? 'split' : 'hit'; // fallback to hit when DAS split is unavailable.
    case 'Ps':
      return hasAction(legalActions, 'split') && rules.doubleAfterSplit ? 'split' : 'stand'; // fallback to stand when DAS split is unavailable.
    case 'Rh':
      return hasAction(legalActions, 'surrender') ? 'surrender' : 'hit'; // fallback to hit when surrender unavailable.
    case 'Rs':
      return hasAction(legalActions, 'surrender') ? 'surrender' : 'stand'; // fallback to stand when surrender unavailable.
    case 'Rp':
      if (hasAction(legalActions, 'surrender')) {
        return 'surrender';
      }
      return hasAction(legalActions, 'split') ? 'split' : 'hit'; // fallback to split, then hit if split unavailable.
    default:
      return 'hit';
  }
}
