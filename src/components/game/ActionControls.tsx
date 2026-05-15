'use client';

import type { JSX } from 'react';

import { Button } from '@/components/ui/button';
import { selectDecisionContext, selectLegalActions, useGameStore } from '@/store/gameStore';
import { useTrainerStore } from '@/store/trainerStore';

import type { ActionButtonConfig } from './Table.types';

const ACTION_BUTTONS: ReadonlyArray<ActionButtonConfig> = [
  { action: 'hit', label: 'Hit' },
  { action: 'stand', label: 'Stand' },
  { action: 'double', label: 'Double' },
  { action: 'split', label: 'Split' },
  { action: 'surrender', label: 'Surrender' },
];

export function ActionControls(): JSX.Element | null {
  const phase = useGameStore((state) => state.phase);
  const hit = useGameStore((state) => state.hit);
  const stand = useGameStore((state) => state.stand);
  const double = useGameStore((state) => state.double);
  const split = useGameStore((state) => state.split);
  const surrender = useGameStore((state) => state.surrender);
  const gameState = useGameStore((state) => state);
  const trainerMode = useTrainerStore((state) => state.mode);
  const recordDecision = useTrainerStore((state) => state.recordDecision);
  const canHit = useGameStore((state) => selectLegalActions(state).includes('hit'));
  const canStand = useGameStore((state) => selectLegalActions(state).includes('stand'));
  const canDouble = useGameStore((state) => selectLegalActions(state).includes('double'));
  const canSplit = useGameStore((state) => selectLegalActions(state).includes('split'));
  const canSurrender = useGameStore((state) => selectLegalActions(state).includes('surrender'));

  if (phase !== 'playerTurn') {
    return null;
  }

  const withTutorTracking = (chosenAction: ActionButtonConfig['action'], handler: () => void): (() => void) => {
    return () => {
      const decisionContext = selectDecisionContext(gameState);
      if (trainerMode !== 'off' && decisionContext !== null) {
        recordDecision({
          playerHand: decisionContext.playerHand,
          dealerUpcard: decisionContext.dealerUpcard,
          legalActions: decisionContext.legalActions,
          chosenAction,
          rules: decisionContext.rules,
        });
      }
      handler();
    };
  };

  const handlers: Record<ActionButtonConfig['action'], () => void> = {
    hit: withTutorTracking('hit', hit),
    stand: withTutorTracking('stand', stand),
    double: withTutorTracking('double', double),
    split: withTutorTracking('split', split),
    surrender: withTutorTracking('surrender', surrender),
  };
  const enabledByAction: Record<ActionButtonConfig['action'], boolean> = {
    hit: canHit,
    stand: canStand,
    double: canDouble,
    split: canSplit,
    surrender: canSurrender,
  };

  return (
    <section className="w-full space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-100">Acciones</h3>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {ACTION_BUTTONS.map(({ action, label }) => {
          const enabled = enabledByAction[action];
          return (
            <Button
              key={action}
              type="button"
              variant={enabled ? 'default' : 'outline'}
              disabled={!enabled}
              onClick={handlers[action]}
              className="w-full"
            >
              {label}
            </Button>
          );
        })}
      </div>
    </section>
  );
}
