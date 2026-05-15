import { beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_RULES } from '@/lib/blackjack/types';
import type { RulesConfig } from '@/lib/blackjack/types';
import {
  DEFAULT_BANKROLL,
  DEFAULT_BET,
  loadBankroll,
  loadCurrentBet,
  loadRules,
  loadTrainerMode,
  loadTrainerStats,
  saveBankroll,
  saveCurrentBet,
  saveRules,
  saveTrainerMode,
  saveTrainerStats,
} from '@/lib/storage';

describe('localStorage helpers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loadBankroll returns default when storage is empty', () => {
    expect(loadBankroll()).toBe(DEFAULT_BANKROLL);
    expect(loadBankroll(500)).toBe(500);
  });

  it('saveBankroll and loadBankroll roundtrip', () => {
    saveBankroll(1234);
    expect(loadBankroll()).toBe(1234);
  });

  it('saveRules and loadRules roundtrip', () => {
    const customRules: RulesConfig = {
      ...DEFAULT_RULES,
      decks: 8,
      blackjackPayout: 1.2,
    };

    saveRules(customRules);
    expect(loadRules()).toEqual(customRules);
  });

  it('loadCurrentBet returns default when storage is empty', () => {
    expect(loadCurrentBet()).toBe(DEFAULT_BET);
    expect(loadCurrentBet(25)).toBe(25);
  });

  it('saveCurrentBet and loadCurrentBet roundtrip', () => {
    saveCurrentBet(75);
    expect(loadCurrentBet()).toBe(75);
  });

  it('falls back to defaults for invalid persisted bankroll/currentBet values', () => {
    localStorage.setItem('bj:bankroll', 'not-a-number');
    localStorage.setItem('bj:current-bet', '12.5');
    expect(loadBankroll(333)).toBe(333);
    expect(loadCurrentBet(25)).toBe(25);

    localStorage.setItem('bj:current-bet', '-10');
    expect(loadCurrentBet(25)).toBe(25);
  });

  it('falls back to default rules for invalid and malformed JSON', () => {
    localStorage.setItem('bj:rules', JSON.stringify({ decks: 8 }));
    expect(loadRules(DEFAULT_RULES)).toEqual(DEFAULT_RULES);

    localStorage.setItem('bj:rules', '{broken-json');
    expect(loadRules(DEFAULT_RULES)).toEqual(DEFAULT_RULES);
  });

  it('trainer mode and stats roundtrip', () => {
    saveTrainerMode('exam');
    saveTrainerStats({
      total: 5,
      correct: 4,
      byAction: {
        hit: { total: 2, correct: 2 },
        stand: { total: 1, correct: 1 },
        double: { total: 1, correct: 0 },
        split: { total: 1, correct: 1 },
        surrender: { total: 0, correct: 0 },
        insurance: { total: 0, correct: 0 },
      },
      mistakes: {
        'Hard 16 vs 10|stand|surrender': {
          handDescription: 'Hard 16 vs 10',
          yourAction: 'stand',
          correctAction: 'surrender',
          count: 1,
        },
      },
    });

    expect(loadTrainerMode('off')).toBe('exam');
    expect(loadTrainerStats({
      total: 0,
      correct: 0,
      byAction: {
        hit: { total: 0, correct: 0 },
        stand: { total: 0, correct: 0 },
        double: { total: 0, correct: 0 },
        split: { total: 0, correct: 0 },
        surrender: { total: 0, correct: 0 },
        insurance: { total: 0, correct: 0 },
      },
      mistakes: {},
    })).toMatchObject({
      total: 5,
      correct: 4,
    });
  });

  it('trainer mode and stats fall back for invalid persisted values', () => {
    localStorage.setItem('bj:trainer-mode', 'invalid');
    expect(loadTrainerMode('off')).toBe('off');

    localStorage.setItem('bj:trainer-stats', '{"bad":"shape"}');
    expect(
      loadTrainerStats({
        total: 0,
        correct: 0,
        byAction: {
          hit: { total: 0, correct: 0 },
          stand: { total: 0, correct: 0 },
          double: { total: 0, correct: 0 },
          split: { total: 0, correct: 0 },
          surrender: { total: 0, correct: 0 },
          insurance: { total: 0, correct: 0 },
        },
        mistakes: {},
      }),
    ).toMatchObject({ total: 0, correct: 0 });

    localStorage.setItem('bj:trainer-stats', '{broken-json');
    expect(
      loadTrainerStats({
        total: 1,
        correct: 1,
        byAction: {
          hit: { total: 1, correct: 1 },
          stand: { total: 0, correct: 0 },
          double: { total: 0, correct: 0 },
          split: { total: 0, correct: 0 },
          surrender: { total: 0, correct: 0 },
          insurance: { total: 0, correct: 0 },
        },
        mistakes: {},
      }),
    ).toMatchObject({ total: 1, correct: 1 });
  });

  it('returns defaults safely when window is undefined (SSR guard)', () => {
    const originalWindow = globalThis.window;

    Object.defineProperty(globalThis, 'window', {
      value: undefined,
      configurable: true,
      writable: true,
    });

    try {
      expect(loadBankroll(250)).toBe(250);
      expect(loadCurrentBet(15)).toBe(15);
      expect(loadRules(DEFAULT_RULES)).toEqual(DEFAULT_RULES);
      expect(loadTrainerMode('off')).toBe('off');
      expect(
        loadTrainerStats({
          total: 0,
          correct: 0,
          byAction: {
            hit: { total: 0, correct: 0 },
            stand: { total: 0, correct: 0 },
            double: { total: 0, correct: 0 },
            split: { total: 0, correct: 0 },
            surrender: { total: 0, correct: 0 },
            insurance: { total: 0, correct: 0 },
          },
          mistakes: {},
        }),
      ).toMatchObject({ total: 0, correct: 0 });
      expect(() => saveBankroll(100)).not.toThrow();
      expect(() => saveCurrentBet(50)).not.toThrow();
      expect(() => saveRules(DEFAULT_RULES)).not.toThrow();
      expect(() => saveTrainerMode('off')).not.toThrow();
      expect(() =>
        saveTrainerStats({
          total: 0,
          correct: 0,
          byAction: {
            hit: { total: 0, correct: 0 },
            stand: { total: 0, correct: 0 },
            double: { total: 0, correct: 0 },
            split: { total: 0, correct: 0 },
            surrender: { total: 0, correct: 0 },
            insurance: { total: 0, correct: 0 },
          },
          mistakes: {},
        }),
      ).not.toThrow();
    } finally {
      Object.defineProperty(globalThis, 'window', {
        value: originalWindow,
        configurable: true,
        writable: true,
      });
    }
  });
});
