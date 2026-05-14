import { canSplitByValue, handValue } from '@/lib/blackjack/hand';
import type { Action, Card, Hand, RulesConfig } from '@/lib/blackjack/types';

/**
 * Contexto dinámico para evaluar acciones legales de una mano.
 */
export interface ActionContext {
  bankroll: number;
  splitsUsed: number;
  isInitialHand: boolean;
  dealerUpcard: Card;
  isFromSplitAces: boolean;
}

/**
 * Lista de acciones permitidas para la mano y contexto actual.
 */
export function legalActions(
  hand: Hand,
  rules: RulesConfig,
  context: ActionContext,
): ReadonlyArray<Action> {
  const { isBust, isBlackjack } = handValue(hand.cards);
  const isStopped = hand.isStood || hand.isSurrendered || isBust || isBlackjack;

  const canHit =
    !hand.isStood &&
    !hand.isSurrendered &&
    !isBust &&
    !isBlackjack &&
    !hand.isDoubled &&
    !context.isFromSplitAces;

  const canStand = !isStopped;

  const canDouble =
    hand.cards.length === 2 &&
    context.bankroll >= hand.bet &&
    !context.isFromSplitAces &&
    !hand.isStood &&
    !hand.isDoubled &&
    !hand.isSurrendered &&
    !isBust &&
    !isBlackjack &&
    (!hand.isSplit || rules.doubleAfterSplit);

  const canSplit =
    canSplitByValue(hand.cards) &&
    context.bankroll >= hand.bet &&
    context.splitsUsed < rules.maxSplits &&
    !context.isFromSplitAces &&
    !hand.isStood &&
    !hand.isDoubled &&
    !hand.isSurrendered &&
    !isBust &&
    !isBlackjack;

  const canSurrender =
    rules.surrender !== 'none' &&
    context.isInitialHand &&
    hand.cards.length === 2 &&
    !hand.isSplit &&
    !hand.isStood &&
    !hand.isDoubled &&
    !hand.isSurrendered &&
    !isBust &&
    !isBlackjack;

  const canInsurance =
    context.dealerUpcard.rank === 'A' &&
    context.isInitialHand &&
    hand.cards.length === 2 &&
    context.bankroll >= hand.bet * 0.5 &&
    !hand.isStood &&
    !hand.isDoubled &&
    !hand.isSurrendered &&
    !isBust &&
    !isBlackjack;

  const actions: Action[] = [];

  if (canHit) {
    actions.push('hit');
  }
  if (canStand) {
    actions.push('stand');
  }
  if (canDouble) {
    actions.push('double');
  }
  if (canSplit) {
    actions.push('split');
  }
  if (canSurrender) {
    actions.push('surrender');
  }
  if (canInsurance) {
    actions.push('insurance');
  }

  return actions;
}
