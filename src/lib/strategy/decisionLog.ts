import type { Action, Card, Rank } from '@/lib/blackjack/types';

/**
 * Entrada del log de decisiones del modo tutor.
 *
 * TODO(#15): implementar logging granular + persistencia en LocalStorage
 * vía src/lib/storage/. Vista mínima de últimas N decisiones también en #15.
 *
 * Separación crítica:
 * - wasCorrect: objetivo, vs tabla de estrategia básica S17/DAS/LS.
 * - handOutcome: sujeto a varianza. Denormalizado al resolverse la sub-mano.
 *
 * El cuadrante (wasCorrect=false, handOutcome='win') es el caso a señalar
 * en UI: refuerzo positivo equivocado.
 *
 * Granularidad: handId identifica sub-manos post-split, no el round entero.
 */
export interface DecisionLogEntry {
  // Identidad
  id: string;
  handId: string;
  timestamp: number;
  // Contexto
  playerCards: readonly Card[];
  playerTotal: number;
  isSoft: boolean;
  isPair: boolean;
  dealerUpcard: Rank;
  // Decisión
  actionTaken: Action;
  optimalAction: Action;
  wasCorrect: boolean;
  // Pedagogía
  pedagogicalCellId: string | null;
  // Outcome (denormalizado al resolverse la sub-mano; null hasta entonces)
  handOutcome: 'win' | 'loss' | 'push' | 'blackjack' | 'surrender' | null;
  netPayout: number | null;
}
