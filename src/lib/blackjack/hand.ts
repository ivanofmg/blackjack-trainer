import type { Card } from '@/lib/blackjack/types';

/**
 * Valor calculado de una mano de blackjack.
 */
export interface HandValue {
  total: number;
  isSoft: boolean;
  isBust: boolean;
  isBlackjack: boolean;
}

/**
 * Valor base de una carta para suma hard (As siempre vale 1 aquí).
 */
export function cardValue(card: Card): number {
  if (card.rank === 'A') {
    return 1;
  }

  if (card.rank === 'J' || card.rank === 'Q' || card.rank === 'K') {
    return 10;
  }

  return Number(card.rank);
}

/**
 * Calcula total, soft/hard, bust y blackjack de una mano.
 */
export function handValue(cards: ReadonlyArray<Card>): HandValue {
  if (cards.length === 0) {
    return {
      total: 0,
      isSoft: false,
      isBust: false,
      isBlackjack: false,
    };
  }

  let total = 0;
  let hasAce = false;

  for (const card of cards) {
    total += cardValue(card);
    if (card.rank === 'A') {
      hasAce = true;
    }
  }

  const isSoft = hasAce && total <= 11;
  const finalTotal = isSoft ? total + 10 : total;
  const isBust = finalTotal > 21;
  const isBlackjack = cards.length === 2 && finalTotal === 21;

  return {
    total: finalTotal,
    isSoft,
    isBust,
    isBlackjack,
  };
}

/**
 * Indica si una mano de 2 cartas es pareja por rank exacto.
 */
export function isPair(cards: ReadonlyArray<Card>): boolean {
  return cards.length === 2 && cards[0].rank === cards[1].rank;
}

/**
 * Indica si una mano puede dividirse por valor (regla común del Strip).
 */
export function canSplitByValue(cards: ReadonlyArray<Card>): boolean {
  return cards.length === 2 && cardValue(cards[0]) === cardValue(cards[1]);
}
