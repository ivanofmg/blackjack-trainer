'use client';

import type { JSX } from 'react';

import { Hand } from '@/components/game/Hand';
import { useGameStore } from '@/store/gameStore';

import type { TableHandSize } from './Table.types';

export function PlayerArea({ size }: Readonly<{ size: TableHandSize }>): JSX.Element {
  const playerHands = useGameStore((state) => state.playerHands);
  const activeHandIndex = useGameStore((state) => state.activeHandIndex);
  const phase = useGameStore((state) => state.phase);

  return (
    <section className="w-full space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-100">Jugador</h2>
      <div className="min-h-52 rounded-xl border border-white/10 bg-white/5 p-4">
        {playerHands.length === 0 ? (
          <div className="flex h-full min-h-40 items-center justify-center rounded-lg border border-dashed border-white/20 text-sm text-emerald-200/70">
            Sin manos activas
          </div>
        ) : (
          <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:justify-center">
            {playerHands.map((playerHand, index) => {
              const handData = {
                cards: playerHand.cards,
                bet: playerHand.bet,
                isDoubled: playerHand.isDoubled,
                isSplit: playerHand.isSplit,
                isSurrendered: playerHand.isSurrendered,
                isStood: playerHand.isStood,
              };
              return (
                <div key={playerHand.id} className="flex justify-center">
                  <Hand
                    hand={handData}
                    role="player"
                    size={size}
                    isActive={phase === 'playerTurn' && index === activeHandIndex}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
