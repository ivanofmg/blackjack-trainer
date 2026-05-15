import { describe, expect, it } from 'vitest';

import { HARD_STRATEGY, PAIR_STRATEGY, SOFT_STRATEGY } from '@/lib/strategy/basicStrategy';
import { UPCARD_INDEX } from '@/lib/strategy/types';
import type { StrategyUpcard } from '@/lib/strategy/types';

const hard = (total: number, upcard: StrategyUpcard) => HARD_STRATEGY[total - 5][UPCARD_INDEX[upcard]];
const soft = (key: string, upcard: StrategyUpcard) => SOFT_STRATEGY[key][UPCARD_INDEX[upcard]];
const pair = (key: string, upcard: StrategyUpcard) => PAIR_STRATEGY[key][UPCARD_INDEX[upcard]];

describe('basic strategy tables', () => {
  it('has complete hard/soft/pair dimensions with no undefined cells', () => {
    expect(HARD_STRATEGY.length).toBe(17);
    for (const row of HARD_STRATEGY) {
      expect(row).toHaveLength(10);
      for (const cell of row) {
        expect(cell).toBeDefined();
      }
    }

    expect(Object.keys(SOFT_STRATEGY).sort()).toEqual(['A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9']);
    for (const row of Object.values(SOFT_STRATEGY)) {
      expect(row).toHaveLength(10);
      for (const cell of row) {
        expect(cell).toBeDefined();
      }
    }

    expect(Object.keys(PAIR_STRATEGY).sort()).toEqual(['22', '33', '44', '55', '66', '77', '88', '99', 'AA', 'TT']);
    for (const row of Object.values(PAIR_STRATEGY)) {
      expect(row).toHaveLength(10);
      for (const cell of row) {
        expect(cell).toBeDefined();
      }
    }
  });

  it('matches canonical hard strategy samples', () => {
    expect(hard(16, 'A')).toBe('Rh');
    expect(hard(16, '10')).toBe('Rh');
    expect(hard(16, '9')).toBe('Rh');
    expect(hard(15, '10')).toBe('Rh');
    expect(hard(15, 'A')).toBe('H');
    expect(hard(13, '2')).toBe('S');
    expect(hard(12, '4')).toBe('S');
    expect(hard(12, '3')).toBe('H');
    expect(hard(11, '2')).toBe('Dh');
    expect(hard(11, 'A')).toBe('H');
    expect(hard(10, '9')).toBe('Dh');
    expect(hard(10, '10')).toBe('H');
    expect(hard(9, '6')).toBe('Dh');
    expect(hard(9, '2')).toBe('H');
    expect(hard(8, '6')).toBe('H');
    expect(hard(17, 'A')).toBe('S');
  });

  it('matches canonical soft strategy samples', () => {
    expect(soft('A7', '3')).toBe('Ds');
    expect(soft('A7', '6')).toBe('Ds');
    expect(soft('A7', '2')).toBe('S');
    expect(soft('A7', '9')).toBe('H');
    expect(soft('A2', '5')).toBe('Dh');
    expect(soft('A2', '4')).toBe('H');
    expect(soft('A3', '6')).toBe('Dh');
    expect(soft('A4', '4')).toBe('Dh');
    expect(soft('A5', '3')).toBe('H');
    expect(soft('A6', '3')).toBe('Dh');
    expect(soft('A6', '2')).toBe('H');
    expect(soft('A8', '6')).toBe('S');
    expect(soft('A8', 'A')).toBe('S');
    expect(soft('A9', '10')).toBe('S');
  });

  it('matches canonical pair strategy samples', () => {
    expect(pair('AA', '5')).toBe('P');
    expect(pair('88', '10')).toBe('P');
    expect(pair('TT', '7')).toBe('S');
    expect(pair('99', '7')).toBe('S');
    expect(pair('99', '9')).toBe('P');
    expect(pair('77', '7')).toBe('P');
    expect(pair('77', '8')).toBe('H');
    expect(pair('66', '2')).toBe('Ph');
    expect(pair('66', '3')).toBe('P');
    expect(pair('55', '5')).toBe('Dh');
    expect(pair('55', 'A')).toBe('H');
    expect(pair('44', '5')).toBe('Ph');
    expect(pair('44', '4')).toBe('H');
    expect(pair('33', '2')).toBe('Ph');
    expect(pair('33', '4')).toBe('P');
    expect(pair('22', '8')).toBe('H');
  });
});
