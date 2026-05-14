'use client';

import type { JSX } from 'react';

import { Hand } from '@/components/game/Hand';
import { useGameStore } from '@/store/gameStore';

import type { TableHandSize } from './Table.types';

export function DealerArea({ size }: Readonly<{ size: TableHandSize }>): JSX.Element {
  const dealerHand = useGameStore((state) => state.dealerHand);
  const phase = useGameStore((state) => state.phase);

  const hasCards = dealerHand.cards.length > 0;

  return (
    <section className="w-full space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-100">Dealer</h2>
      <div className="min-h-44 rounded-xl border border-white/10 bg-white/5 p-4">
        {phase === 'betting' || !hasCards ? (
          <div className="flex h-full min-h-36 items-center justify-center rounded-lg border border-dashed border-white/20 text-sm text-emerald-200/70">
            Esperando reparto...
          </div>
        ) : (
          <Hand
            hand={dealerHand}
            role="dealer"
            size={size}
            hideHoleCard={phase === 'playerTurn'}
            showTotal={phase !== 'playerTurn'}
          />
        )}
      </div>
    </section>
  );
}
