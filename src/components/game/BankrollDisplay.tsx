'use client';

import type { JSX } from 'react';

import { useGameStore } from '@/store/gameStore';

import { formatCurrency } from './Table.types';

function getNetClass(value: number): string {
  if (value > 0) {
    return 'text-emerald-300';
  }
  if (value < 0) {
    return 'text-red-300';
  }
  return 'text-slate-300';
}

function getNetText(value: number): string {
  if (value > 0) {
    return `+${formatCurrency(value)}`;
  }
  if (value < 0) {
    return `-${formatCurrency(Math.abs(value))}`;
  }
  return 'Empate';
}

export function BankrollDisplay(): JSX.Element {
  const bankroll = useGameStore((state) => state.bankroll);
  const currentBet = useGameStore((state) => state.currentBet);
  const phase = useGameStore((state) => state.phase);
  const lastRoundResult = useGameStore((state) => state.lastRoundResult);

  return (
    <section className="w-full rounded-xl border border-emerald-800/50 bg-emerald-950/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-lg font-bold text-white">Bankroll: {formatCurrency(bankroll)}</p>
        <p className="text-sm text-emerald-100">
          Apuesta actual: <span className="font-semibold">{formatCurrency(currentBet)}</span>
        </p>
      </div>

      {phase === 'betting' && lastRoundResult ? (
        <p className={`mt-2 text-sm font-medium ${getNetClass(lastRoundResult.netTotal)}`}>
          Último resultado: {getNetText(lastRoundResult.netTotal)}
        </p>
      ) : null}
    </section>
  );
}
