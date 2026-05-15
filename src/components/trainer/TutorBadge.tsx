'use client';

import type { JSX } from 'react';

import { useTrainerStore } from '@/store/trainerStore';

function actionLabel(action: string): string {
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

export function TutorBadge(): JSX.Element | null {
  const mode = useTrainerStore((state) => state.mode);
  const lastDecision = useTrainerStore((state) => state.lastDecision);

  if (mode !== 'tutor' || lastDecision === null) {
    return null;
  }

  if (lastDecision.wasCorrect) {
    return (
      <section className="rounded-md border border-emerald-300/70 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
        ✓ Decisión óptima
      </section>
    );
  }

  return (
    <section className="rounded-md border border-red-300/70 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
      ✗ Lo óptimo era: {actionLabel(lastDecision.recommendedAction)}
    </section>
  );
}
