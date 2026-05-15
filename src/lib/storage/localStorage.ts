import { DEFAULT_RULES } from '@/lib/blackjack/types';
import type { Action, RulesConfig } from '@/lib/blackjack/types';

export const DEFAULT_BANKROLL = 1000;
export const DEFAULT_BET = 10;
const BANKROLL_KEY = 'bj:bankroll';
const RULES_KEY = 'bj:rules';
const CURRENT_BET_KEY = 'bj:current-bet';
const TRAINER_MODE_KEY = 'bj:trainer-mode';
const TRAINER_STATS_KEY = 'bj:trainer-stats';

type StoredTrainerMode = 'off' | 'tutor' | 'exam';

export type StoredMistakeEntry = Readonly<{
  handDescription: string;
  yourAction: Action;
  correctAction: Action;
  count: number;
}>;

export type StoredTrainerStats = Readonly<{
  total: number;
  correct: number;
  byAction: Record<Action, { total: number; correct: number }>;
  mistakes: Record<string, StoredMistakeEntry>;
}>;

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

function isAction(value: unknown): value is Action {
  return (
    value === 'hit' ||
    value === 'stand' ||
    value === 'double' ||
    value === 'split' ||
    value === 'surrender' ||
    value === 'insurance'
  );
}

function isValidStoredTrainerMode(value: unknown): value is StoredTrainerMode {
  return value === 'off' || value === 'tutor' || value === 'exam';
}

function isValidStoredMistakeEntry(value: unknown): value is StoredMistakeEntry {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const v = value as Record<string, unknown>;
  return (
    typeof v.handDescription === 'string' &&
    isAction(v.yourAction) &&
    isAction(v.correctAction) &&
    typeof v.count === 'number'
  );
}

function isValidActionStats(value: unknown): value is { total: number; correct: number } {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const v = value as Record<string, unknown>;
  return typeof v.total === 'number' && typeof v.correct === 'number';
}

function isValidStoredTrainerStats(value: unknown): value is StoredTrainerStats {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const v = value as Record<string, unknown>;
  if (typeof v.total !== 'number' || typeof v.correct !== 'number') {
    return false;
  }

  if (typeof v.byAction !== 'object' || v.byAction === null) {
    return false;
  }

  const byAction = v.byAction as Record<string, unknown>;
  const requiredActions: Action[] = ['hit', 'stand', 'double', 'split', 'surrender', 'insurance'];
  const hasAllActions = requiredActions.every((action) => isValidActionStats(byAction[action]));
  if (!hasAllActions) {
    return false;
  }

  if (typeof v.mistakes !== 'object' || v.mistakes === null) {
    return false;
  }

  const mistakes = v.mistakes as Record<string, unknown>;
  return Object.values(mistakes).every(isValidStoredMistakeEntry);
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

export function loadTrainerMode(defaultValue: StoredTrainerMode = 'off'): StoredTrainerMode {
  if (!canUseLocalStorage()) {
    return defaultValue;
  }

  const raw = window.localStorage.getItem(TRAINER_MODE_KEY);
  if (raw === null || !isValidStoredTrainerMode(raw)) {
    return defaultValue;
  }

  return raw;
}

export function saveTrainerMode(mode: StoredTrainerMode): void {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(TRAINER_MODE_KEY, mode);
}

export function loadTrainerStats(defaultValue: StoredTrainerStats): StoredTrainerStats {
  if (!canUseLocalStorage()) {
    return defaultValue;
  }

  const raw = window.localStorage.getItem(TRAINER_STATS_KEY);
  if (raw === null) {
    return defaultValue;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isValidStoredTrainerStats(parsed)) {
      return defaultValue;
    }
    return parsed;
  } catch {
    return defaultValue;
  }
}

export function saveTrainerStats(stats: StoredTrainerStats): void {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(TRAINER_STATS_KEY, JSON.stringify(stats));
}
