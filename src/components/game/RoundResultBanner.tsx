'use client';

import { useEffect, useState, type JSX } from 'react';

import { Button } from '@/components/ui/button';
import { useGameStore } from '@/store/gameStore';

import { formatCurrency } from './Table.types';

function describeOutcomeForSplit(outcome: string): string {
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

function getOutcomeHeading(amount: number): string {
  if (amount > 0) {
    return 'Ganaste';
  }
  if (amount < 0) {
    return 'Perdiste';
  }
  return 'Empate';
}

function getAmountClass(amount: number): string {
  if (amount > 0) {
    return 'text-emerald-300';
  }
  if (amount < 0) {
    return 'text-red-300';
  }
  return 'text-slate-200';
}

function getAmountLabel(amount: number): string {
  if (amount > 0) {
    return `+${formatCurrency(amount)}`;
  }
  if (amount < 0) {
    return `-${formatCurrency(Math.abs(amount))}`;
  }
  return formatCurrency(0);
}

function dealerLine(total: number, isBust: boolean, dealerPlayed: boolean): string {
  if (!dealerPlayed) {
    return 'Dealer no jugó';
  }
  return isBust ? `Dealer: ${total} (Bust)` : `Dealer: ${total}`;
}

export function RoundResultBanner(): JSX.Element | null {
  const lastRoundResult = useGameStore((state) => state.lastRoundResult);
  const bankroll = useGameStore((state) => state.bankroll);
  const nextRound = useGameStore((state) => state.nextRound);
  const [canAdvance, setCanAdvance] = useState(false);

  useEffect(() => {
    if (!lastRoundResult) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setCanAdvance(true);
    }, 600);

    return () => window.clearTimeout(timeoutId);
  }, [lastRoundResult]);

  if (!lastRoundResult) {
    return null;
  }

  const hasSplit = lastRoundResult.handResults.length > 1;

  return (
    <section className="w-full rounded-xl border border-white/25 bg-slate-950/80 p-6 text-center">
      <p className="text-2xl font-bold text-white">{getOutcomeHeading(lastRoundResult.netTotal)}</p>
      <p className={`mt-1 text-3xl font-bold ${getAmountClass(lastRoundResult.netTotal)}`}>
        {getAmountLabel(lastRoundResult.netTotal)}
      </p>
      <p className="mt-2 text-base text-slate-300">
        {dealerLine(lastRoundResult.dealerValue.total, lastRoundResult.dealerValue.isBust, lastRoundResult.dealerPlayed)}
      </p>

      {hasSplit ? (
        <ul className="mt-3 space-y-1 text-sm text-slate-400">
          {lastRoundResult.handResults.map(({ handId, resolution }, index) => (
            <li key={handId}>
              Mano {index + 1}: {describeOutcomeForSplit(resolution.outcome)} ({formatCurrency(resolution.netResult)})
            </li>
          ))}
        </ul>
      ) : null}

      {bankroll > 0 ? (
        <Button type="button" className="mt-4 min-h-11 px-6" disabled={!canAdvance} onClick={nextRound}>
          Siguiente mano
        </Button>
      ) : (
        <p className="mt-3 text-sm font-semibold text-red-300">Sin saldo</p>
      )}
    </section>
  );
}
