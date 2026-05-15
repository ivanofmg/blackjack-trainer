'use client';

import type { JSX } from 'react';

import { Button } from '@/components/ui/button';
import { useTrainerStore } from '@/store/trainerStore';
import type { TrainerMode } from '@/store/trainerStore';

const OPTIONS: ReadonlyArray<Readonly<{ mode: TrainerMode; label: string }>> = [
  { mode: 'off', label: 'Off' },
  { mode: 'tutor', label: 'Tutor' },
  { mode: 'exam', label: 'Examen' },
];

export function TutorModeToggle(): JSX.Element {
  const mode = useTrainerStore((state) => state.mode);
  const setMode = useTrainerStore((state) => state.setMode);

  return (
    <section className="flex items-center gap-2">
      <span className="text-sm font-medium text-emerald-100">Modo:</span>
      <div className="flex flex-wrap gap-1">
        {OPTIONS.map((option) => (
          <Button
            key={option.mode}
            type="button"
            size="sm"
            variant={mode === option.mode ? 'default' : 'outline'}
            onClick={() => setMode(option.mode)}
            aria-pressed={mode === option.mode}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </section>
  );
}
