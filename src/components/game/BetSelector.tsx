'use client';

import { useMemo, useState, type ChangeEvent, type FormEvent, type JSX, type KeyboardEvent } from 'react';

import { Button } from '@/components/ui/button';
import { useGameStore } from '@/store/gameStore';

import { formatCurrency } from './Table.types';
import { BET_PRESETS, BET_STEP, validateBet } from './BetSelector.types';

function clampBet(value: number, bankroll: number): number {
  return Math.min(Math.max(1, value), bankroll);
}

export function BetSelector(): JSX.Element {
  const currentBet = useGameStore((state) => state.currentBet);
  const bankroll = useGameStore((state) => state.bankroll);
  const setBet = useGameStore((state) => state.setBet);
  const deal = useGameStore((state) => state.deal);

  const [betInput, setBetInput] = useState<string>(String(currentBet));
  const [error, setError] = useState<string | null>(null);

  const validation = useMemo(() => validateBet(betInput, bankroll), [betInput, bankroll]);
  const canDeal = validation.valid && bankroll > 0;
  const bankrollAfterBet = validation.valid ? bankroll - validation.value : bankroll;

  const updateInput = (inputValue: string): void => {
    setBetInput(inputValue);
    const nextValidation = validateBet(inputValue, bankroll);
    setError(nextValidation.error);
    if (nextValidation.valid) {
      setBet(nextValidation.value);
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    updateInput(event.target.value);
  };

  const handleInputBlur = (): void => {
    if (validation.valid) {
      const clamped = clampBet(validation.value, bankroll);
      if (clamped !== validation.value) {
        setBet(clamped);
      }
      setBetInput(String(clamped));
      setError(null);
      return;
    }

    if (error === 'Excede bankroll' && bankroll > 0) {
      const clamped = clampBet(Number(betInput), bankroll);
      setBet(clamped);
      setBetInput(String(clamped));
      setError(null);
    }
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key !== 'Enter') {
      return;
    }
    event.preventDefault();
    if (!validation.valid) {
      setError(validation.error);
      return;
    }
    deal();
  };

  const adjustByStep = (delta: number): void => {
    const baseline = validation.valid ? validation.value : currentBet;
    const candidate = baseline + delta;
    const clamped = clampBet(candidate, bankroll);
    updateInput(String(clamped));
  };

  const applyPreset = (presetValue: number | 'all-in'): void => {
    const value = presetValue === 'all-in' ? bankroll : presetValue;
    updateInput(String(value));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!validation.valid) {
      setError(validation.error);
      return;
    }
    deal();
  };

  const plusDisabled = bankroll <= 0 || !validation.valid || validation.value + BET_STEP > bankroll;
  const minusDisabled = !validation.valid || validation.value - BET_STEP < 1;

  return (
    <section className="w-full rounded-xl border border-white/20 bg-slate-950/75 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-100">Apuesta</h2>

      <form className="mt-3 space-y-4" onSubmit={handleSubmit}>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="bet-input" className="text-sm text-slate-200">
            Monto
          </label>
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-white/20 bg-white/5 px-2 py-2 text-slate-200">$</span>
            <input
              id="bet-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={betInput}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              className="w-28 rounded-md border border-white/25 bg-white/10 px-3 py-2 text-white outline-none focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-400/40"
            />
            <Button type="button" size="icon" variant="outline" onClick={() => adjustByStep(BET_STEP)} disabled={plusDisabled}>
              +
            </Button>
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() => adjustByStep(-BET_STEP)}
              disabled={minusDisabled}
            >
              -
            </Button>
          </div>
        </div>

        {error ? <p className="text-sm text-red-300">{error}</p> : null}

        <div className="flex flex-wrap gap-2">
          {BET_PRESETS.map((preset) => {
            const presetValue = preset.value === 'all-in' ? bankroll : preset.value;
            const isDisabled = preset.value === 'all-in' ? bankroll <= 0 : presetValue > bankroll;
            const isActive = validation.valid && validation.value === presetValue;

            return (
              <Button
                key={preset.label}
                type="button"
                variant={isActive ? 'default' : 'outline'}
                onClick={() => applyPreset(preset.value)}
                disabled={isDisabled}
              >
                {preset.label}
              </Button>
            );
          })}
        </div>

        <p className={`text-sm ${validation.valid ? 'text-slate-200' : 'text-red-300'}`}>
          {validation.valid
            ? `Bankroll tras apostar: ${formatCurrency(bankrollAfterBet)}`
            : validation.error === 'Excede bankroll'
              ? 'Apuesta excede bankroll'
              : `Bankroll tras apostar: ${formatCurrency(bankroll)}`}
        </p>

        <Button type="submit" size="lg" className="min-h-11 px-8" disabled={!canDeal}>
          Repartir
        </Button>
      </form>
    </section>
  );
}
