'use client';

import type { JSX } from 'react';

import { Button } from '@/components/ui/button';
import { useGameStore } from '@/store/gameStore';

import { formatCurrency } from './Table.types';

export function InsurancePrompt(): JSX.Element {
  const currentBet = useGameStore((state) => state.currentBet);
  const takeInsurance = useGameStore((state) => state.takeInsurance);
  const declineInsurance = useGameStore((state) => state.declineInsurance);
  const insuranceCost = currentBet * 0.5;

  return (
    <section className="w-full rounded-xl border border-amber-500/40 bg-amber-900/35 p-4">
      <p className="text-sm font-semibold text-amber-100">
        El dealer muestra As. ¿Tomás seguro?
      </p>
      <p className="mt-1 text-sm text-amber-200">
        Sí ({formatCurrency(insuranceCost)} - 50% de tu apuesta)
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={takeInsurance}>
          Sí, tomar seguro
        </Button>
        <Button type="button" variant="outline" onClick={declineInsurance}>
          No, continuar
        </Button>
      </div>
    </section>
  );
}
