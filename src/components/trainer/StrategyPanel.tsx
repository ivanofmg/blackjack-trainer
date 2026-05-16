'use client';

import { useMemo, type JSX } from 'react';

import { categorizeHand, recommendAction, upcardToColumn } from '@/lib/strategy';
import { getRationale } from '@/lib/strategy/rationale';
import { selectDecisionContext, useGameStore } from '@/store/gameStore';
import { useTrainerStore } from '@/store/trainerStore';

import type { Action } from '@/lib/blackjack/types';
import type { RationaleKey } from '@/lib/strategy/rationale';

function toActionLabel(action: Action): string {
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

function toRationaleKey(context: NonNullable<ReturnType<typeof selectDecisionContext>>): RationaleKey {
  const category = categorizeHand(context.playerHand);
  const mappedUpcard = upcardToColumn(context.dealerUpcard);
  const upcard = mappedUpcard === '10' ? 'T' : mappedUpcard;

  if (category.kind === 'hard') {
    return {
      category: 'hard',
      totalOrPair: String(category.total),
      upcard,
    };
  }

  if (category.kind === 'soft') {
    return {
      category: 'soft',
      totalOrPair: category.key,
      upcard,
    };
  }

  return {
    category: 'pair',
    totalOrPair: category.key,
    upcard,
  };
}

export function StrategyPanel(): JSX.Element {
  const phase = useGameStore((state) => state.phase);
  const gameState = useGameStore((state) => state);
  const mode = useTrainerStore((state) => state.mode);
  const currentRoundDecisions = useTrainerStore((state) => state.currentRoundDecisions);
  const context = selectDecisionContext(gameState);

  const rationale = useMemo(() => {
    if (mode !== 'tutor' || phase !== 'playerTurn' || !context) {
      return null;
    }
    const optimalAction = recommendAction(
      context.playerHand,
      context.dealerUpcard,
      context.rules,
      context.legalActions,
    );
    return {
      ...getRationale(toRationaleKey(context)),
      optimalAction,
    };
  }, [mode, phase, context]);

  const rationaleBody = (() => {
    if (mode !== 'tutor') {
      return <p className="text-sm text-emerald-100/80">Activá el modo Tutor para ver la explicación.</p>;
    }
    if (phase !== 'playerTurn' || !context || !rationale) {
      return <p className="text-sm text-emerald-100/80">Esperando próxima decisión...</p>;
    }

    return (
      <div className="space-y-3">
        <p className="text-sm text-emerald-100">
          {rationale.short} <span className="font-semibold">({toActionLabel(rationale.optimalAction)})</span>
        </p>
        <details className="group rounded-md border border-emerald-200/20 bg-emerald-950/35 px-3 py-2">
          <summary className="cursor-pointer text-sm text-emerald-200/90 marker:text-emerald-200/80">
            Ver más
          </summary>
          <p className="mt-2 text-sm text-emerald-100/90">{rationale.long}</p>
        </details>
      </div>
    );
  })();

  return (
    <aside aria-label="Panel de estrategia" className="w-full rounded-xl border border-emerald-700/60 bg-emerald-950/55 p-4">
      <section>
        <h2 className="text-base font-semibold text-emerald-100">¿Por qué esta decisión?</h2>
        <div className="mt-3">{rationaleBody}</div>
      </section>

      <section className="mt-5 border-t border-emerald-700/60 pt-4">
        <h3 className="text-base font-semibold text-emerald-100">Decisiones del round</h3>
        {currentRoundDecisions.length === 0 ? (
          <p className="mt-3 text-sm text-emerald-100/80">Aún no tomaste decisiones en este round.</p>
        ) : (
          <ol className="mt-3 space-y-2">
            {currentRoundDecisions.map((decision, index) => (
              <li key={`${decision.handDescription}-${index}`} className="text-sm text-emerald-100/95">
                <span className={decision.wasCorrect ? 'text-emerald-300' : 'text-rose-300'}>
                  {decision.wasCorrect ? '✅' : '❌'}
                </span>{' '}
                <span>
                  {toActionLabel(decision.chosenAction)} en {decision.handDescription}
                  {!decision.wasCorrect ? ` (óptimo: ${toActionLabel(decision.recommendedAction)})` : ' (óptimo)'}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </aside>
  );
}
