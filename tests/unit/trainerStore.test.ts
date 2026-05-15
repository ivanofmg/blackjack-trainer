import { beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_RULES } from '@/lib/blackjack/types';
import type { Action, Card, Hand, Rank, Suit } from '@/lib/blackjack/types';
import { useTrainerStore } from '@/store/trainerStore';

function card(rank: Rank, suit: Suit = 'clubs'): Card {
  return { rank, suit };
}

function hand(cards: ReadonlyArray<Card>): Hand {
  return {
    cards,
    bet: 10,
    isDoubled: false,
    isSplit: false,
    isSurrendered: false,
    isStood: false,
  };
}

const legalActions: ReadonlyArray<Action> = ['hit', 'stand', 'double', 'split', 'surrender'];

function resetStore(): void {
  localStorage.clear();
  useTrainerStore.getState().__resetForTests();
}

describe('trainerStore', () => {
  beforeEach(() => {
    resetStore();
  });

  it('setMode updates state and persists value', () => {
    useTrainerStore.getState().setMode('exam');

    expect(useTrainerStore.getState().mode).toBe('exam');
    expect(localStorage.getItem('bj:trainer-mode')).toBe('exam');
  });

  it('recordDecision marks correct answers and tracks round decision + lastDecision', () => {
    useTrainerStore.getState().setMode('tutor');
    useTrainerStore.getState().recordDecision({
      playerHand: hand([card('10'), card('6')]),
      dealerUpcard: card('A'),
      legalActions,
      chosenAction: 'surrender',
      rules: DEFAULT_RULES,
    });

    const state = useTrainerStore.getState();
    expect(state.stats.total).toBe(1);
    expect(state.stats.correct).toBe(1);
    expect(state.currentRoundDecisions).toHaveLength(1);
    expect(state.lastDecision).not.toBeNull();
    expect(state.lastDecision?.wasCorrect).toBe(true);
  });

  it('recordDecision stores mistakes and incorrect totals', () => {
    useTrainerStore.getState().setMode('tutor');
    useTrainerStore.getState().recordDecision({
      playerHand: hand([card('10'), card('6')]),
      dealerUpcard: card('A'),
      legalActions,
      chosenAction: 'stand',
      rules: DEFAULT_RULES,
    });

    const state = useTrainerStore.getState();
    expect(state.stats.total).toBe(1);
    expect(state.stats.correct).toBe(0);
    expect(Object.keys(state.stats.mistakes)).toHaveLength(1);
    expect(state.currentRoundDecisions).toHaveLength(1);
  });

  it('topMistakes returns the top 5 by count in descending order', () => {
    useTrainerStore.getState().setMode('exam');

    const scenarios: ReadonlyArray<Readonly<{ cards: [Rank, Rank]; upcard: Rank; action: Action; repeats: number }>> = [
      { cards: ['10', '6'], upcard: 'A', action: 'stand', repeats: 6 },
      { cards: ['10', '5'], upcard: '10', action: 'stand', repeats: 5 },
      { cards: ['9', '7'], upcard: '10', action: 'hit', repeats: 4 },
      { cards: ['8', '8'], upcard: '10', action: 'stand', repeats: 3 },
      { cards: ['A', '7'], upcard: '3', action: 'stand', repeats: 2 },
      { cards: ['4', '4'], upcard: '5', action: 'stand', repeats: 1 },
    ];

    for (const scenario of scenarios) {
      for (let i = 0; i < scenario.repeats; i += 1) {
        useTrainerStore.getState().recordDecision({
          playerHand: hand([card(scenario.cards[0]), card(scenario.cards[1])]),
          dealerUpcard: card(scenario.upcard),
          legalActions,
          chosenAction: scenario.action,
          rules: DEFAULT_RULES,
        });
      }
    }

    const top = useTrainerStore.getState().topMistakes();
    expect(top).toHaveLength(5);
    expect(top[0].count).toBeGreaterThanOrEqual(top[1].count);
    expect(top[4].count).toBe(2);
    expect(Object.keys(useTrainerStore.getState().stats.mistakes)).toHaveLength(6);
  });

  it('persists stats across re-initialization', () => {
    useTrainerStore.getState().setMode('exam');
    useTrainerStore.getState().recordDecision({
      playerHand: hand([card('10'), card('6')]),
      dealerUpcard: card('A'),
      legalActions,
      chosenAction: 'surrender',
      rules: DEFAULT_RULES,
    });

    useTrainerStore.getState().__resetForTests();
    expect(useTrainerStore.getState().stats.total).toBe(1);
    expect(useTrainerStore.getState().stats.correct).toBe(1);
  });

  it('clearCurrentRoundDecisions clears round decisions and lastDecision only', () => {
    useTrainerStore.getState().setMode('tutor');
    useTrainerStore.getState().recordDecision({
      playerHand: hand([card('10'), card('6')]),
      dealerUpcard: card('A'),
      legalActions,
      chosenAction: 'stand',
      rules: DEFAULT_RULES,
    });

    useTrainerStore.getState().clearCurrentRoundDecisions();
    expect(useTrainerStore.getState().currentRoundDecisions).toEqual([]);
    expect(useTrainerStore.getState().lastDecision).toBeNull();
    expect(useTrainerStore.getState().stats.total).toBe(1);
  });

  it('resetStats clears all trainer stats', () => {
    useTrainerStore.getState().setMode('exam');
    useTrainerStore.getState().recordDecision({
      playerHand: hand([card('10'), card('6')]),
      dealerUpcard: card('A'),
      legalActions,
      chosenAction: 'stand',
      rules: DEFAULT_RULES,
    });

    useTrainerStore.getState().resetStats();
    expect(useTrainerStore.getState().stats.total).toBe(0);
    expect(useTrainerStore.getState().stats.correct).toBe(0);
    expect(Object.keys(useTrainerStore.getState().stats.mistakes)).toHaveLength(0);
  });

  it('mode off no-ops recordDecision (caller should prevent calling it)', () => {
    expect(useTrainerStore.getState().mode).toBe('off');

    useTrainerStore.getState().recordDecision({
      playerHand: hand([card('10'), card('6')]),
      dealerUpcard: card('A'),
      legalActions,
      chosenAction: 'stand',
      rules: DEFAULT_RULES,
    });

    expect(useTrainerStore.getState().stats.total).toBe(0);
    expect(useTrainerStore.getState().currentRoundDecisions).toEqual([]);
    expect(useTrainerStore.getState().lastDecision).toBeNull();
  });
});
