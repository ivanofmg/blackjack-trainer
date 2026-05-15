import { create } from 'zustand';

import type { Action, Card, Hand, RulesConfig } from '@/lib/blackjack/types';
import { describeHand, recommendAction } from '@/lib/strategy';
import { loadTrainerMode, loadTrainerStats, saveTrainerMode, saveTrainerStats } from '@/lib/storage';
import type { StoredMistakeEntry, StoredTrainerStats } from '@/lib/storage';

export type TrainerMode = 'off' | 'tutor' | 'exam';

interface RoundDecision {
  handDescription: string;
  chosenAction: Action;
  recommendedAction: Action;
  wasCorrect: boolean;
}

interface MistakeEntry {
  handDescription: string;
  yourAction: Action;
  correctAction: Action;
  count: number;
}

interface TrainerStats {
  total: number;
  correct: number;
  byAction: Record<Action, { total: number; correct: number }>;
  mistakes: Record<string, MistakeEntry>;
}

interface TrainerStoreState {
  mode: TrainerMode;
  stats: TrainerStats;
  currentRoundDecisions: ReadonlyArray<RoundDecision>;
  lastDecision: RoundDecision | null;
}

interface TrainerStoreActions {
  setMode: (mode: TrainerMode) => void;
  recordDecision: (params: {
    playerHand: Hand;
    dealerUpcard: Card;
    legalActions: ReadonlyArray<Action>;
    chosenAction: Action;
    rules: RulesConfig;
  }) => void;
  clearCurrentRoundDecisions: () => void;
  resetStats: () => void;
  topMistakes: () => ReadonlyArray<MistakeEntry>;
  __resetForTests: () => void;
}

export type TrainerStore = TrainerStoreState & TrainerStoreActions;

function createEmptyStats(): TrainerStats {
  return {
    total: 0,
    correct: 0,
    byAction: {
      hit: { total: 0, correct: 0 },
      stand: { total: 0, correct: 0 },
      double: { total: 0, correct: 0 },
      split: { total: 0, correct: 0 },
      surrender: { total: 0, correct: 0 },
      insurance: { total: 0, correct: 0 },
    },
    mistakes: {},
  };
}

function initialState(): Omit<TrainerStore, keyof TrainerStoreActions> {
  const defaultStats = createEmptyStats();
  const mode = loadTrainerMode('off');
  const persistedStats = loadTrainerStats(defaultStats);

  return {
    mode,
    stats: persistedStats as TrainerStats,
    currentRoundDecisions: [],
    lastDecision: null,
  };
}

function toStoredStats(stats: TrainerStats): StoredTrainerStats {
  return stats;
}

function toMistakeEntry(value: StoredMistakeEntry): MistakeEntry {
  return {
    handDescription: value.handDescription,
    yourAction: value.yourAction,
    correctAction: value.correctAction,
    count: value.count,
  };
}

export const useTrainerStore = create<TrainerStore>()((set, get) => ({
  ...initialState(),
  setMode: (mode) => {
    saveTrainerMode(mode);
    set({ mode });
  },
  recordDecision: ({ playerHand, dealerUpcard, legalActions, chosenAction, rules }) => {
    const current = get();
    if (current.mode === 'off') {
      return;
    }

    const recommendedAction = recommendAction(playerHand, dealerUpcard, rules, legalActions);
    const handDescription = describeHand(playerHand, dealerUpcard);
    const wasCorrect = chosenAction === recommendedAction;
    const decision: RoundDecision = {
      handDescription,
      chosenAction,
      recommendedAction,
      wasCorrect,
    };

    const stats: TrainerStats = {
      ...current.stats,
      total: current.stats.total + 1,
      correct: current.stats.correct + (wasCorrect ? 1 : 0),
      byAction: {
        ...current.stats.byAction,
        [chosenAction]: {
          total: current.stats.byAction[chosenAction].total + 1,
          correct: current.stats.byAction[chosenAction].correct + (wasCorrect ? 1 : 0),
        },
      },
      mistakes: { ...current.stats.mistakes },
    };

    if (!wasCorrect) {
      const key = `${handDescription}|${chosenAction}|${recommendedAction}`;
      const previous = stats.mistakes[key];
      const nextMistake: MistakeEntry = previous
        ? { ...previous, count: previous.count + 1 }
        : {
            handDescription,
            yourAction: chosenAction,
            correctAction: recommendedAction,
            count: 1,
          };
      stats.mistakes[key] = nextMistake;
    }

    saveTrainerStats(toStoredStats(stats));
    set({
      stats,
      currentRoundDecisions: [...current.currentRoundDecisions, decision],
      lastDecision: decision,
    });
  },
  clearCurrentRoundDecisions: () => {
    set({
      currentRoundDecisions: [],
      lastDecision: null,
    });
  },
  resetStats: () => {
    const stats = createEmptyStats();
    saveTrainerStats(toStoredStats(stats));
    set({ stats });
  },
  topMistakes: () => {
    const mistakes = Object.values(get().stats.mistakes).map(toMistakeEntry);
    return mistakes.sort((a, b) => b.count - a.count).slice(0, 5);
  },
  __resetForTests: () => {
    set({
      ...initialState(),
    });
  },
}));
