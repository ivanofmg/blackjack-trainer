import { drawCard } from '@/lib/blackjack/deck';
import type { Shoe } from '@/lib/blackjack/deck';
import { handValue } from '@/lib/blackjack/hand';
import type { HandValue } from '@/lib/blackjack/hand';
import type { Card, RulesConfig } from '@/lib/blackjack/types';

/**
 * Resultado final del juego automático del dealer.
 */
export interface DealerPlayResult {
  hand: ReadonlyArray<Card>;
  shoe: Shoe;
  finalValue: HandValue;
}

/**
 * Determina si el dealer debe pedir otra carta según reglas H17/S17.
 */
export function shouldDealerHit(value: HandValue, rules: RulesConfig): boolean {
  if (value.isBust) {
    return false;
  }

  if (value.total < 17) {
    return true;
  }

  if (value.total === 17 && value.isSoft && rules.dealerHitsSoft17) {
    return true;
  }

  return false;
}

/**
 * Juega la mano del dealer hasta plantarse o bustearse.
 */
export function playDealerHand(
  initialHand: ReadonlyArray<Card>,
  shoe: Shoe,
  rules: RulesConfig,
): DealerPlayResult {
  let currentHand: ReadonlyArray<Card> = [...initialHand];
  let currentShoe = shoe;
  let currentValue = handValue(currentHand);

  while (shouldDealerHit(currentValue, rules)) {
    const draw = drawCard(currentShoe);
    currentHand = [...currentHand, draw.card];
    currentShoe = draw.shoe;
    currentValue = handValue(currentHand);
  }

  return {
    hand: currentHand,
    shoe: currentShoe,
    finalValue: currentValue,
  };
}
