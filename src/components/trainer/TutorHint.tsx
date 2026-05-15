'use client';

import type { JSX } from 'react';

import { recommendAction } from '@/lib/strategy';
import { selectDecisionContext, useGameStore } from '@/store/gameStore';
import { useTrainerStore } from '@/store/trainerStore';

function actionLabel(action: 'hit' | 'stand' | 'double' | 'split' | 'surrender' | 'insurance'): string {
  switch (action) {
    case 'hit':
      return 'Hit';
    case 'stand':
      return 'Stand';
    case 'double':
      return 'Double';
    case 'split':
      return 'Split';
    case 'surrender':
      return 'Surrender';
    case 'insurance':
      return 'Insurance';
    default:
      return action;
  }
}

export function TutorHint(): JSX.Element | null {
  const mode = useTrainerStore((state) => state.mode);
  const phase = useGameStore((state) => state.phase);
  const gameState = useGameStore((state) => state);
  const context = selectDecisionContext(gameState);

  if (mode !== 'tutor' || phase !== 'playerTurn' || !context) {
    return null;
  }

  const optimalAction = recommendAction(
    context.playerHand,
    context.dealerUpcard,
    context.rules,
    context.legalActions,
  );

  return (
    <section className="w-full rounded-md border border-emerald-200/70 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
      💡 Estrategia óptima: <span className="font-semibold">{actionLabel(optimalAction)}</span>
    </section>
  );
}
