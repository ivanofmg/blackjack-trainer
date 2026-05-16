'use client';

import { useEffect, useState, type JSX } from 'react';

import { Button } from '@/components/ui/button';
import { selectShouldOfferInsurance, useGameStore, useHydratedGameStore } from '@/store/gameStore';

import { ActionControls } from './ActionControls';
import { BankrollDisplay } from './BankrollDisplay';
import { BetSelector } from './BetSelector';
import { DealerArea } from './DealerArea';
import { InsurancePrompt } from './InsurancePrompt';
import { PlayerArea } from './PlayerArea';
import { RoundResultBanner } from './RoundResultBanner';
import { type TableHandSize } from './Table.types';
import { TrainerStats } from '@/components/trainer/TrainerStats';
import { TutorBadge } from '@/components/trainer/TutorBadge';
import { TutorHint } from '@/components/trainer/TutorHint';
import { TutorModeToggle } from '@/components/trainer/TutorModeToggle';
import { StrategyPanel } from '@/components/trainer/StrategyPanel';

const DEALER_RHYTHM = {
  beforeReveal: 600,
  betweenCards: 500,
  beforeFinish: 400,
} as const;

function TableSkeleton(): JSX.Element {
  return (
    <main className="min-h-screen bg-emerald-900 p-6 md:p-8">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="h-16 animate-pulse rounded-xl bg-white/10" />
        <div className="h-40 animate-pulse rounded-xl bg-white/10" />
        <div className="h-48 animate-pulse rounded-xl bg-white/10" />
      </div>
    </main>
  );
}

function useTableHandSize(): TableHandSize {
  const [size, setSize] = useState<TableHandSize>(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return 'lg';
    }
    return window.matchMedia('(max-width: 767px)').matches ? 'md' : 'lg';
  });

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return;
    }

    const media = window.matchMedia('(max-width: 767px)');
    const update = () => {
      setSize(media.matches ? 'md' : 'lg');
    };

    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return size;
}

function GameOverScreen(): JSX.Element {
  const resetBankroll = useGameStore((state) => state.resetBankroll);

  return (
    <section className="w-full rounded-xl border border-red-400/30 bg-red-950/60 p-4">
      <p className="text-lg font-bold text-red-100">Te quedaste sin saldo.</p>
      <Button type="button" className="mt-3" onClick={() => resetBankroll(1000)}>
        Reiniciar bankroll ($1,000)
      </Button>
    </section>
  );
}

export function Table(): JSX.Element {
  const hydratedPhase = useHydratedGameStore((state) => state.phase);
  const phase = useGameStore((state) => state.phase);
  const bankroll = useGameStore((state) => state.bankroll);
  const lastRoundResult = useGameStore((state) => state.lastRoundResult);
  const shouldOfferInsurance = useGameStore(selectShouldOfferInsurance);
  const revealHoleCard = useGameStore((state) => state.revealHoleCard);
  const dealerDrawNext = useGameStore((state) => state.dealerDrawNext);
  const finishDealerTurn = useGameStore((state) => state.finishDealerTurn);
  const handSize = useTableHandSize();

  useEffect(() => {
    if (phase !== 'dealerTurn') {
      return;
    }

    let cancelled = false;
    const timeouts: number[] = [];

    const schedule = (callback: () => void, delayMs: number): void => {
      const timeoutId = window.setTimeout(() => {
        if (cancelled) {
          return;
        }
        callback();
      }, delayMs);
      timeouts.push(timeoutId);
    };

    const runDealerDrawLoop = (): void => {
      const { pendingDealerSteps } = useGameStore.getState();
      if (pendingDealerSteps.length === 0) {
        schedule(() => {
          finishDealerTurn();
        }, DEALER_RHYTHM.beforeFinish);
        return;
      }

      schedule(() => {
        dealerDrawNext();
        runDealerDrawLoop();
      }, DEALER_RHYTHM.betweenCards);
    };

    schedule(() => {
      revealHoleCard();
      runDealerDrawLoop();
    }, DEALER_RHYTHM.beforeReveal);

    return () => {
      cancelled = true;
      for (const timeoutId of timeouts) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [phase, revealHoleCard, dealerDrawNext, finishDealerTurn]);

  if (hydratedPhase === undefined) {
    return <TableSkeleton />;
  }

  const showRoundResultBanner = lastRoundResult !== null && phase !== 'playerTurn' && phase !== 'dealerTurn';

  return (
    <main className="min-h-screen bg-emerald-900 p-6 md:p-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] xl:items-start">
          <div className="flex flex-col gap-6">
            <BankrollDisplay />
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-800/40 bg-emerald-950/45 px-4 py-3">
              <TutorModeToggle />
              <TrainerStats />
            </div>
            <DealerArea size={handSize} />
            <PlayerArea size={handSize} />
            <TutorBadge />

            {phase === 'playerTurn' && !shouldOfferInsurance ? <TutorHint /> : null}
            {phase === 'playerTurn' && !shouldOfferInsurance ? <ActionControls /> : null}
            {phase === 'playerTurn' && shouldOfferInsurance ? <InsurancePrompt /> : null}
            {showRoundResultBanner ? <RoundResultBanner /> : null}
            {phase === 'betting' && bankroll > 0 && !lastRoundResult ? <BetSelector /> : null}
            {phase === 'gameOver' ? <GameOverScreen /> : null}
          </div>
          <div className="xl:sticky xl:top-8">
            <StrategyPanel />
          </div>
        </div>
      </div>
    </main>
  );
}
