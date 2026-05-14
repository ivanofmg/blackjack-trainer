import { beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_RULES } from '@/lib/blackjack/types';
import type { Card, Rank, Suit } from '@/lib/blackjack/types';
import { DEFAULT_BANKROLL } from '@/lib/storage';
import {
  selectLegalActions,
  selectShouldOfferInsurance,
  useGameStore,
} from '@/store/gameStore';
import type { GameStoreState } from '@/store/gameStore';
import type { Shoe } from '@/lib/blackjack/deck';

function makeCard(rank: Rank, suit: Suit): Card {
  return { rank, suit };
}

function makeShoe(ranks: ReadonlyArray<Rank>, suit: Suit = 'clubs'): Shoe {
  return ranks.map((rank) => makeCard(rank, suit));
}

function resetStore(): void {
  localStorage.clear();
  useGameStore.getState().__resetForTests();
  useGameStore.setState({
    bankroll: DEFAULT_BANKROLL,
    currentBet: 10,
    phase: 'betting',
    lastRoundResult: null,
    shoe: [],
  });
  useGameStore.getState().updateRules({ decks: 1, penetration: 1 });
}

function setRoundShoe(shoe: Shoe): void {
  useGameStore.getState().__setShoe(shoe);
}

function state(): GameStoreState {
  return useGameStore.getState();
}

describe('gameStore', () => {
  beforeEach(() => {
    resetStore();
  });

  it('initializes with default bankroll, rules and betting phase', () => {
    expect(state().bankroll).toBe(DEFAULT_BANKROLL);
    expect(state().rules).toEqual({
      ...DEFAULT_RULES,
      decks: 1,
      penetration: 1,
    });
    expect(state().phase).toBe('betting');
  });

  it('setBet rejects invalid values', () => {
    const before = state();

    useGameStore.getState().setBet(0);
    useGameStore.getState().setBet(-5);
    useGameStore.getState().setBet(before.bankroll + 1);

    expect(state().currentBet).toBe(before.currentBet);
  });

  it('deal deducts bankroll, deals cards and enters playerTurn', () => {
    setRoundShoe(makeShoe(['10', '6', '7', '9', '5']));

    useGameStore.getState().deal();

    expect(state().bankroll).toBe(DEFAULT_BANKROLL - 10);
    expect(state().phase).toBe('playerTurn');
    expect(state().playerHands).toHaveLength(1);
    expect(state().playerHands[0].cards).toHaveLength(2);
    expect(state().dealerHand.cards).toHaveLength(2);
  });

  it('hit adds card and bust resolves hand/round', () => {
    setRoundShoe(makeShoe(['10', '6', '7', '9', '10']));
    useGameStore.getState().deal();
    useGameStore.getState().hit();

    expect(state().phase).toBe('betting');
    expect(state().playerHands[0].isResolved).toBe(true);
    expect(state().lastRoundResult?.handResults[0].resolution.outcome).toBe('lose');
  });

  it('stand resolves current hand and advances round', () => {
    setRoundShoe(makeShoe(['10', '6', '7', '9', '5']));
    useGameStore.getState().deal();
    useGameStore.getState().stand();

    expect(state().phase).toBe('betting');
    expect(state().playerHands[0].isResolved).toBe(true);
    expect(state().lastRoundResult).not.toBeNull();
  });

  it('double deducts extra bet, draws one card and resolves hand', () => {
    setRoundShoe(makeShoe(['5', '9', '6', '10', 'K']));
    useGameStore.getState().deal();
    useGameStore.getState().double();

    expect(state().playerHands[0].bet).toBe(20);
    expect(state().playerHands[0].isDoubled).toBe(true);
    expect(state().playerHands[0].cards).toHaveLength(3);
    expect(state().phase).toBe('betting');
  });

  it('split creates two hands, one card each and deducts extra bet', () => {
    setRoundShoe(makeShoe(['10', '6', '10', '9', '5', '8', 'K']));
    useGameStore.getState().deal();
    useGameStore.getState().split();

    expect(state().playerHands).toHaveLength(2);
    expect(state().playerHands[0].cards).toHaveLength(2);
    expect(state().playerHands[1].cards).toHaveLength(2);
    expect(state().bankroll).toBe(DEFAULT_BANKROLL - 20);
  });

  it('split aces auto-resolve both hands after one extra card each', () => {
    setRoundShoe(makeShoe(['A', '6', 'A', '9', '10', '8', 'K']));
    useGameStore.getState().deal();
    useGameStore.getState().split();

    expect(state().phase).toBe('betting');
    expect(state().playerHands).toHaveLength(2);
    expect(state().playerHands.every((hand) => hand.isFromSplitAces)).toBe(true);
    expect(state().playerHands.every((hand) => hand.isResolved)).toBe(true);
  });

  it('respects split limit and prevents resplit beyond maxSplits', () => {
    useGameStore.getState().updateRules({ maxSplits: 1 });
    setRoundShoe(makeShoe(['10', '6', '10', '9', '10', '8', 'K']));
    useGameStore.getState().deal();
    useGameStore.getState().split();

    const handCountAfterFirstSplit = state().playerHands.length;
    useGameStore.getState().split();

    expect(state().playerHands.length).toBe(handCountAfterFirstSplit);
  });

  it('surrender refunds half bet and resolves hand', () => {
    setRoundShoe(makeShoe(['10', '6', '7', '9', 'K']));
    useGameStore.getState().deal();
    useGameStore.getState().surrender();

    expect(state().bankroll).toBe(DEFAULT_BANKROLL - 5);
    expect(state().playerHands[0].isSurrendered).toBe(true);
    expect(state().phase).toBe('betting');
  });

  it('insurance is offered only with dealer ace and pays 2:1 when dealer has blackjack', () => {
    setRoundShoe(makeShoe(['10', 'A', '7', 'K', '5']));
    useGameStore.getState().deal();

    expect(selectShouldOfferInsurance(state())).toBe(true);

    useGameStore.getState().takeInsurance();

    expect(state().phase).toBe('betting');
    expect(state().bankroll).toBe(DEFAULT_BANKROLL);
    expect(state().lastRoundResult?.insurancePayout).toBe(15);
  });

  it('pays natural blackjack at 3:2', () => {
    setRoundShoe(makeShoe(['A', '9', 'K', '7']));
    useGameStore.getState().deal();

    expect(state().phase).toBe('betting');
    expect(state().bankroll).toBe(DEFAULT_BANKROLL + 15);
    expect(state().lastRoundResult?.handResults[0].resolution.outcome).toBe('blackjack');
  });

  it('resolves push correctly when totals are equal', () => {
    setRoundShoe(makeShoe(['10', '9', '8', '9', 'K']));
    useGameStore.getState().deal();
    useGameStore.getState().stand();

    expect(state().lastRoundResult?.handResults[0].resolution.outcome).toBe('push');
    expect(state().bankroll).toBe(DEFAULT_BANKROLL);
  });

  it('enters gameOver when bankroll reaches zero', () => {
    useGameStore.setState({ bankroll: 10, currentBet: 10 });
    setRoundShoe(makeShoe(['10', '10', '7', '9']));
    useGameStore.getState().deal();
    useGameStore.getState().stand();

    expect(state().bankroll).toBe(0);
    expect(state().phase).toBe('gameOver');
  });

  it('resetBankroll returns game to betting phase', () => {
    useGameStore.setState({ phase: 'gameOver', bankroll: 0 });
    useGameStore.getState().resetBankroll(500);

    expect(state().phase).toBe('betting');
    expect(state().bankroll).toBe(500);
  });

  it('uses deterministic dealing when rngSeed is provided', () => {
    useGameStore.getState().__setRngSeed(12345);
    useGameStore.getState().deal();
    const firstRunPlayer = state().playerHands[0].cards;
    const firstRunDealer = state().dealerHand.cards;

    resetStore();
    useGameStore.getState().__setRngSeed(12345);
    useGameStore.getState().deal();

    expect(state().playerHands[0].cards).toEqual(firstRunPlayer);
    expect(state().dealerHand.cards).toEqual(firstRunDealer);
  });

  it('does not mutate state when action is called in wrong phase', () => {
    const snapshot = state();
    useGameStore.getState().hit();

    expect(state().phase).toBe(snapshot.phase);
    expect(state().playerHands).toEqual(snapshot.playerHands);
    expect(state().bankroll).toBe(snapshot.bankroll);
  });

  it('persists bankroll and rules, but not phase or shoe', () => {
    useGameStore.setState({ phase: 'gameOver' });
    useGameStore.getState().resetBankroll(777);
    useGameStore.getState().updateRules({ decks: 2, penetration: 0.5 });
    useGameStore.setState({ shoe: makeShoe(['A', 'K']), phase: 'playerTurn' });

    const persistedBankroll = localStorage.getItem('bj:bankroll');
    const persistedRules = localStorage.getItem('bj:rules');
    const persistedStore = localStorage.getItem('bj:game-store');

    expect(persistedBankroll).toBe('777');
    expect(persistedRules).not.toBeNull();
    expect(persistedRules).toContain('"decks":2');
    expect(persistedStore).toBeNull();
  });

  it('selector legal actions delegates to blackjack actions lib', () => {
    setRoundShoe(makeShoe(['10', '6', '7', '9']));
    useGameStore.getState().deal();

    expect(selectLegalActions(state())).toEqual(['hit', 'stand', 'double', 'surrender']);
  });
});
