/**
 * Palos válidos de una carta estándar.
 */
export const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'] as const;

/**
 * Rangos válidos de una carta estándar.
 */
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const;

/**
 * Palo de una carta.
 */
export type Suit = (typeof SUITS)[number];

/**
 * Rango de una carta.
 */
export type Rank = (typeof RANKS)[number];

/**
 * Carta individual de blackjack.
 */
export type Card = Readonly<{
  rank: Rank;
  suit: Suit;
}>;

/**
 * Acciones permitidas para el jugador.
 */
export type Action = 'hit' | 'stand' | 'double' | 'split' | 'surrender' | 'insurance';

/**
 * Regla de rendición disponible en la mesa.
 */
export type SurrenderRule = 'late' | 'early' | 'none';

/**
 * Pago de blackjack (3:2 o 6:5).
 */
export type BlackjackPayout = 1.5 | 1.2;

/**
 * Configuración de reglas de una mesa de blackjack.
 */
export type RulesConfig = Readonly<{
  decks: number;
  dealerHitsSoft17: boolean;
  doubleAfterSplit: boolean;
  surrender: SurrenderRule;
  blackjackPayout: BlackjackPayout;
  maxSplits: number;
  penetration: number;
}>;

/**
 * Estado de una mano del jugador.
 */
export type Hand = Readonly<{
  cards: ReadonlyArray<Card>;
  bet: number;
  isDoubled: boolean;
  isSplit: boolean;
  isSurrendered: boolean;
  isStood: boolean;
}>;

/**
 * Fase actual del flujo principal del juego.
 */
export type GamePhase =
  | 'betting'
  | 'dealing'
  | 'playerTurn'
  | 'dealerTurn'
  | 'resolution'
  | 'gameOver';

/**
 * Resultado final de una mano.
 */
export type HandOutcome = 'win' | 'lose' | 'push' | 'blackjack' | 'surrender';

/**
 * Reglas por defecto de Strip de Las Vegas (PRD).
 */
export const DEFAULT_RULES: RulesConfig = {
  decks: 6,
  dealerHitsSoft17: false,
  doubleAfterSplit: true,
  surrender: 'late',
  blackjackPayout: 1.5,
  maxSplits: 4,
  penetration: 0.75,
};
