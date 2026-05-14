import { handValue } from '@/lib/blackjack/hand';
import type { HandValue } from '@/lib/blackjack/hand';
import type { Hand, HandOutcome, RulesConfig } from '@/lib/blackjack/types';

/**
 * Resolución de una mano con resultado neto y pago total entregado.
 */
export interface HandResolution {
  outcome: HandOutcome;
  netResult: number;
  payout: number;
}

function resolution(outcome: HandOutcome, netResult: number, payout: number): HandResolution {
  return { outcome, netResult, payout };
}

/**
 * Resuelve el resultado principal de una mano contra la mano final del dealer.
 */
export function resolveHand(playerHand: Hand, dealerValue: HandValue, rules: RulesConfig): HandResolution {
  const bet = playerHand.bet;
  const playerValue = handValue(playerHand.cards);

  if (playerHand.isSurrendered) {
    return resolution('surrender', -0.5 * bet, 0.5 * bet);
  }

  if (playerValue.isBust) {
    return resolution('lose', -bet, 0);
  }

  if (playerValue.isBlackjack && dealerValue.isBlackjack) {
    return resolution('push', 0, bet);
  }

  if (playerValue.isBlackjack && !dealerValue.isBlackjack) {
    const win = bet * rules.blackjackPayout;
    return resolution('blackjack', win, bet + win);
  }

  if (!playerValue.isBlackjack && dealerValue.isBlackjack) {
    return resolution('lose', -bet, 0);
  }

  if (dealerValue.isBust) {
    return resolution('win', bet, bet * 2);
  }

  if (playerValue.total > dealerValue.total) {
    return resolution('win', bet, bet * 2);
  }

  if (playerValue.total === dealerValue.total) {
    return resolution('push', 0, bet);
  }

  return resolution('lose', -bet, 0);
}

/**
 * Resuelve múltiples manos del jugador (por ejemplo tras split) en orden.
 */
export function resolveRound(
  playerHands: ReadonlyArray<Hand>,
  dealerValue: HandValue,
  rules: RulesConfig,
): ReadonlyArray<HandResolution> {
  return playerHands.map((hand) => resolveHand(hand, dealerValue, rules));
}
