export interface BetValidationResult {
  valid: boolean;
  value: number;
  error: string | null;
}

export interface BetPreset {
  label: string;
  value: number | 'all-in';
}

export const BET_STEP = 5;

export const BET_PRESETS: ReadonlyArray<BetPreset> = [
  { label: '$10', value: 10 },
  { label: '$25', value: 25 },
  { label: '$50', value: 50 },
  { label: '$100', value: 100 },
  { label: 'All-in', value: 'all-in' },
];

export function validateBet(input: string, bankroll: number): BetValidationResult {
  const trimmed = input.trim();

  if (trimmed === '') {
    return { valid: false, value: 0, error: 'Ingresa un monto' };
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return { valid: false, value: 0, error: 'Monto invalido' };
  }

  if (!Number.isInteger(parsed)) {
    return { valid: false, value: 0, error: 'Debe ser entero' };
  }

  if (parsed < 1) {
    return { valid: false, value: 0, error: 'Minimo $1' };
  }

  if (parsed > bankroll) {
    return { valid: false, value: 0, error: 'Excede bankroll' };
  }

  return { valid: true, value: parsed, error: null };
}
