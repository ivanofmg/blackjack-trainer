/**
 * Tablas de estrategia básica para reglas: 4-8 decks, S17, DAS, LS.
 * Fuente canónica: https://wizardofodds.com/games/blackjack/strategy/4-decks/
 *
 * NO MODIFICAR sin validar contra la fuente. Una entrada incorrecta hace
 * inútil el modo Tutor.
 *
 * Notación de decisiones (ver types.ts):
 *   H, S, Dh, Ds, P, Ph, Ps, Rh, Rs, Rp
 */

import type { StrategyDecision } from './types';

export const HARD_STRATEGY: ReadonlyArray<ReadonlyArray<StrategyDecision>> = [
  // Index 0 = total 5, index 16 = total 21.
  // Columns: '2','3','4','5','6','7','8','9','10','A'
  ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 5
  ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 6
  ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 7
  ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 8
  ['H', 'Dh', 'Dh', 'Dh', 'Dh', 'H', 'H', 'H', 'H', 'H'], // 9
  ['Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'H', 'H'], // 10
  ['Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'H'], // 11
  ['H', 'H', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'], // 12
  ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'], // 13
  ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'], // 14
  ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'Rh', 'H'], // 15
  ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'Rh', 'Rh', 'Rh'], // 16
  ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // 17
  ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // 18
  ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // 19
  ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // 20
  ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // 21
];

export const SOFT_STRATEGY: Readonly<Record<string, ReadonlyArray<StrategyDecision>>> = {
  A2: ['H', 'H', 'H', 'Dh', 'Dh', 'H', 'H', 'H', 'H', 'H'],
  A3: ['H', 'H', 'H', 'Dh', 'Dh', 'H', 'H', 'H', 'H', 'H'],
  A4: ['H', 'H', 'Dh', 'Dh', 'Dh', 'H', 'H', 'H', 'H', 'H'],
  A5: ['H', 'H', 'Dh', 'Dh', 'Dh', 'H', 'H', 'H', 'H', 'H'],
  A6: ['H', 'Dh', 'Dh', 'Dh', 'Dh', 'H', 'H', 'H', 'H', 'H'],
  A7: ['S', 'Ds', 'Ds', 'Ds', 'Ds', 'S', 'S', 'H', 'H', 'H'],
  A8: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
  A9: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
};

export const PAIR_STRATEGY: Readonly<Record<string, ReadonlyArray<StrategyDecision>>> = {
  '22': ['Ph', 'Ph', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H'],
  '33': ['Ph', 'Ph', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H'],
  '44': ['H', 'H', 'H', 'Ph', 'Ph', 'H', 'H', 'H', 'H', 'H'],
  '55': ['Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'H', 'H'],
  '66': ['Ph', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H', 'H'],
  '77': ['P', 'P', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H'],
  '88': ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
  '99': ['P', 'P', 'P', 'P', 'P', 'S', 'P', 'P', 'S', 'S'],
  TT: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
  AA: ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
};
