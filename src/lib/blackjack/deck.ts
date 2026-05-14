import { RANKS, SUITS } from '@/lib/blackjack/types';
import type { Card } from '@/lib/blackjack/types';

/**
 * Shoe inmutable: colección de cartas desde la cual se roba al frente.
 */
export type Shoe = ReadonlyArray<Card>;

/**
 * Crea un shoe sin barajar con el número de barajas indicado.
 */
export function createShoe(decks: number): Shoe {
  if (decks <= 0 || decks > 8) {
    throw new Error('Decks must be between 1 and 8');
  }

  const shoe: Card[] = [];

  for (let deckIndex = 0; deckIndex < decks; deckIndex += 1) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        shoe.push({ rank, suit });
      }
    }
  }

  return shoe;
}

/**
 * Baraja un shoe usando Fisher-Yates moderno sobre una copia.
 */
export function shuffle(shoe: Shoe, rng: () => number = Math.random): Shoe {
  const shuffled = [...shoe];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * Roba la primera carta del shoe y retorna carta + shoe restante.
 */
export function drawCard(shoe: Shoe): { card: Card; shoe: Shoe } {
  if (shoe.length === 0) {
    throw new Error('Shoe is empty');
  }

  return {
    card: shoe[0],
    shoe: shoe.slice(1),
  };
}

/**
 * Indica si se alcanzó la penetración para rebarajar.
 */
export function needsReshuffle(shoe: Shoe, originalSize: number, penetration: number): boolean {
  if (originalSize <= 0) {
    throw new Error('Original size must be greater than 0');
  }

  if (penetration <= 0 || penetration > 1) {
    throw new Error('Penetration must be greater than 0 and less than or equal to 1');
  }

  const consumedCards = originalSize - shoe.length;
  return consumedCards >= originalSize * penetration;
}

/**
 * Estima barajas restantes redondeando al cuarto más cercano.
 */
export function decksRemaining(shoe: Shoe): number {
  const rawDecks = shoe.length / 52;
  return Math.round(rawDecks * 4) / 4;
}
