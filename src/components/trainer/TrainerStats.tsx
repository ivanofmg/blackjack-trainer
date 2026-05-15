'use client';

import type { JSX } from 'react';

import { Button } from '@/components/ui/button';
import { useTrainerStore } from '@/store/trainerStore';

function formatPercentage(correct: number, total: number): number {
  if (total === 0) {
    return 0;
  }
  return Math.round((correct / total) * 100);
}

export function TrainerStats(): JSX.Element {
  const stats = useTrainerStore((state) => state.stats);
  const resetStats = useTrainerStore((state) => state.resetStats);

  const handleReset = (): void => {
    if (window.confirm('¿Resetear estadísticas del tutor?')) {
      resetStats();
    }
  };

  return (
    <section className="flex items-center gap-2 text-sm text-emerald-100">
      {stats.total === 0 ? (
        <span>Sin decisiones aún</span>
      ) : (
        <span>
          Decisiones: {stats.correct}/{stats.total} ({formatPercentage(stats.correct, stats.total)}%)
        </span>
      )}
      <Button type="button" size="sm" variant="outline" onClick={handleReset}>
        Reset
      </Button>
    </section>
  );
}
