'use client';

import type { JSX } from 'react';

import { Button } from '@/components/ui/button';
import { useGameStore } from '@/store/gameStore';

import { formatCurrency } from './Table.types';

function describeOutcome(outcome: string): string {
  switch (outcome) {
    case 'blackjack':
      return 'Blackjack';
    case 'win':
      return 'Ganada';
    case 'lose':
      return 'Perdida';
    case 'push':
      return 'Empate';
    case 'surrender':
      return 'Rendida';
    default:
      return outcome;
  }
}

function netLine(amount: number): string {
  if (amount > 0) {
    return `Ganaste ${formatCurrency(amount)}`;
  }
  if (amount < 0) {
    return `Perdiste ${formatCurrency(Math.abs(amount))}`;
  }
  return 'Empate';
}

export function RoundResultBanner(): JSX.Element | null {
  const lastRoundResult = useGameStore((state) => state.lastRoundResult);
  const bankroll = useGameStore((state) => state.bankroll);
  const nextRound = useGameStore((state) => state.nextRound);

  if (!lastRoundResult) {
    return null;
  }

  return (
    <section className="w-full rounded-xl border border-white/20 bg-slate-950/70 p-4">
      <p className="text-base font-bold text-white">{netLine(lastRoundResult.netTotal)}</p>
      <ul className="mt-2 space-y-1 text-sm text-slate-200">
        {lastRoundResult.handResults.map(({ handId, resolution }, index) => (
          <li key={handId}>
            Mano {index + 1}: {describeOutcome(resolution.outcome)} ({formatCurrency(resolution.netResult)})
          </li>
        ))}
      </ul>

      {bankroll > 0 ? (
        <Button type="button" className="mt-3" onClick={nextRound}>
          Siguiente mano
        </Button>
      ) : (
        <p className="mt-3 text-sm font-semibold text-red-300">Sin saldo</p>
      )}
    </section>
  );
}
