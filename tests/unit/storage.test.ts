import { beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_RULES } from '@/lib/blackjack/types';
import type { RulesConfig } from '@/lib/blackjack/types';
import {
  DEFAULT_BANKROLL,
  DEFAULT_BET,
  loadBankroll,
  loadCurrentBet,
  loadRules,
  saveBankroll,
  saveCurrentBet,
  saveRules,
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
      expect(() => saveBankroll(100)).not.toThrow();
      expect(() => saveCurrentBet(50)).not.toThrow();
      expect(() => saveRules(DEFAULT_RULES)).not.toThrow();
    } finally {
      Object.defineProperty(globalThis, 'window', {
        value: originalWindow,
        configurable: true,
        writable: true,
      });
    }
  });
});
