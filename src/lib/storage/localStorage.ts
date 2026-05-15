import { DEFAULT_RULES } from '@/lib/blackjack/types';
import type { RulesConfig } from '@/lib/blackjack/types';

export const DEFAULT_BANKROLL = 1000;
export const DEFAULT_BET = 10;
const BANKROLL_KEY = 'bj:bankroll';
const RULES_KEY = 'bj:rules';
const CURRENT_BET_KEY = 'bj:current-bet';

function canUseLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function isValidRulesConfig(value: unknown): value is RulesConfig {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const v = value as Record<string, unknown>;

  return (
    typeof v.decks === 'number' &&
    typeof v.dealerHitsSoft17 === 'boolean' &&
    typeof v.doubleAfterSplit === 'boolean' &&
    (v.surrender === 'late' || v.surrender === 'early' || v.surrender === 'none') &&
    (v.blackjackPayout === 1.5 || v.blackjackPayout === 1.2) &&
    typeof v.maxSplits === 'number' &&
    typeof v.penetration === 'number'
  );
}

export function loadBankroll(defaultValue = DEFAULT_BANKROLL): number {
  if (!canUseLocalStorage()) {
    return defaultValue;
  }

  const raw = window.localStorage.getItem(BANKROLL_KEY);
  if (raw === null) {
    return defaultValue;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return defaultValue;
  }

  return parsed;
}

export function saveBankroll(bankroll: number): void {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(BANKROLL_KEY, String(bankroll));
}

export function loadCurrentBet(defaultValue = DEFAULT_BET): number {
  if (!canUseLocalStorage()) {
    return defaultValue;
  }

  const raw = window.localStorage.getItem(CURRENT_BET_KEY);
  if (raw === null) {
    return defaultValue;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 1) {
    return defaultValue;
  }

  return parsed;
}

export function saveCurrentBet(bet: number): void {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(CURRENT_BET_KEY, String(bet));
}

export function loadRules(defaultValue: RulesConfig = DEFAULT_RULES): RulesConfig {
  if (!canUseLocalStorage()) {
    return defaultValue;
  }

  const raw = window.localStorage.getItem(RULES_KEY);
  if (raw === null) {
    return defaultValue;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isValidRulesConfig(parsed)) {
      return defaultValue;
    }
    return parsed;
  } catch {
    return defaultValue;
  }
}

export function saveRules(rules: RulesConfig): void {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(RULES_KEY, JSON.stringify(rules));
}
