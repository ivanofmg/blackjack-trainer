import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { legalActions } from '@/lib/blackjack/actions';
import type { ActionContext } from '@/lib/blackjack/actions';
import { createShoe, drawCard, needsReshuffle, shuffle } from '@/lib/blackjack/deck';
import type { Shoe } from '@/lib/blackjack/deck';
import { playDealerHand } from '@/lib/blackjack/dealer';
import { handValue } from '@/lib/blackjack/hand';
import type { HandValue } from '@/lib/blackjack/hand';
import { resolveRound as resolveRoundPayout } from '@/lib/blackjack/payout';
import type { HandResolution } from '@/lib/blackjack/payout';
import { DEFAULT_RULES } from '@/lib/blackjack/types';
import type { Action, Card, GamePhase, Hand, RulesConfig } from '@/lib/blackjack/types';
import { DEFAULT_BANKROLL, loadBankroll, loadRules, saveBankroll, saveRules } from '@/lib/storage';

interface PersistedState {
  bankroll: number;
  rules: RulesConfig;
}

let handIdCounter = 0;

function nextHandId(): string {
  handIdCounter += 1;
  return `hand-${handIdCounter}`;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function emptyDealerHand(cards: ReadonlyArray<Card> = []): Hand {
  return {
    cards,
    bet: 0,
    isDoubled: false,
    isSplit: false,
    isSurrendered: false,
    isStood: false,
  };
}

function createPlayerHand(cards: ReadonlyArray<Card>, bet: number, isSplit = false, isFromSplitAces = false): PlayerHand {
  return {
    id: nextHandId(),
    cards,
    bet,
    isDoubled: false,
    isSplit,
    isSurrendered: false,
    isStood: false,
    isFromSplitAces,
    isResolved: false,
  };
}

function shouldUseFreshShoe(state: GameStoreState): boolean {
  if (state.shoe.length === 0 || state.forceNewShoe) {
    return true;
  }
  return needsReshuffle(state.shoe, state.rules.decks * 52, state.rules.penetration);
}

function buildShuffledShoe(rules: RulesConfig, rngSeed?: number): Shoe {
  if (rngSeed === undefined) {
    return shuffle(createShoe(rules.decks));
  }
  return shuffle(createShoe(rules.decks), mulberry32(rngSeed));
}

function isDev(): boolean {
  return process.env.NODE_ENV !== 'production';
}

function warnInvalid(actionName: string): void {
  if (isDev()) {
    console.warn(`[gameStore] Ignored invalid action: ${actionName}`);
  }
}

function initialState(): Omit<GameStoreState, keyof GameStoreActions> {
  const bankroll = loadBankroll(DEFAULT_BANKROLL);
  const rules = loadRules(DEFAULT_RULES);

  return {
    bankroll,
    rules,
    phase: 'betting',
    shoe: [],
    dealerHand: emptyDealerHand(),
    playerHands: [],
    activeHandIndex: 0,
    currentBet: 10,
    insuranceBet: 0,
    lastRoundResult: null,
    rngSeed: undefined,
    splitsUsed: 0,
    isInsuranceOffered: false,
    forceNewShoe: false,
    roundStartBankroll: null,
    pendingDealerSteps: [],
    isHoleCardRevealed: false,
  };
}

export interface PlayerHand extends Hand {
  id: string;
  isFromSplitAces: boolean;
  isResolved: boolean;
}

export interface RoundResult {
  handResults: ReadonlyArray<{
    handId: string;
    resolution: HandResolution;
  }>;
  insuranceBet: number;
  insurancePayout: number;
  netTotal: number;
  dealerValue: HandValue;
  dealerPlayed: boolean;
}

export interface GameStoreState {
  bankroll: number;
  rules: RulesConfig;
  phase: GamePhase;
  shoe: Shoe;
  dealerHand: Hand;
  playerHands: PlayerHand[];
  activeHandIndex: number;
  currentBet: number;
  insuranceBet: number;
  lastRoundResult: RoundResult | null;
  rngSeed?: number;
  splitsUsed: number;
  isInsuranceOffered: boolean;
  forceNewShoe: boolean;
  roundStartBankroll: number | null;
  pendingDealerSteps: ReadonlyArray<Card>;
  isHoleCardRevealed: boolean;
}

interface GameStoreActions {
  setBet: (amount: number) => void;
  deal: () => void;
  offerInsurance: () => void;
  takeInsurance: () => void;
  declineInsurance: () => void;
  hit: () => void;
  stand: () => void;
  double: () => void;
  split: () => void;
  surrender: () => void;
  playDealer: () => void;
  revealHoleCard: () => void;
  dealerDrawNext: () => void;
  finishDealerTurn: () => void;
  resolveRound: () => void;
  nextRound: () => void;
  resetBankroll: (amount: number) => void;
  updateRules: (rules: Partial<RulesConfig>) => void;
  __setShoe: (shoe: Shoe) => void;
  __setRngSeed: (seed?: number) => void;
  __resetForTests: () => void;
}

export type GameStore = GameStoreState & GameStoreActions;

function getActiveHand(state: GameStoreState): PlayerHand | null {
  return state.playerHands[state.activeHandIndex] ?? null;
}

function isInitialDecision(hand: PlayerHand): boolean {
  return hand.cards.length === 2 && !hand.isDoubled && !hand.isSurrendered && !hand.isStood;
}

function getLegalActionsForState(state: GameStoreState): ReadonlyArray<Action> {
  if (state.phase !== 'playerTurn' || state.isInsuranceOffered) {
    return [];
  }

  const activeHand = getActiveHand(state);
  const dealerUpcard = state.dealerHand.cards[0];

  if (!activeHand || !dealerUpcard) {
    return [];
  }

  const context: ActionContext = {
    bankroll: state.bankroll,
    splitsUsed: state.splitsUsed,
    isInitialHand: isInitialDecision(activeHand),
    dealerUpcard,
    isFromSplitAces: activeHand.isFromSplitAces,
  };

  return legalActions(activeHand, state.rules, context);
}

function getPersistStorage() {
  return createJSONStorage<PersistedState>(() => ({
    getItem: () => {
      const payload = {
        state: {
          bankroll: loadBankroll(DEFAULT_BANKROLL),
          rules: loadRules(DEFAULT_RULES),
        },
        version: 0,
      };
      return JSON.stringify(payload);
    },
    setItem: (_name, value) => {
      const parsed = JSON.parse(value) as { state?: PersistedState };
      if (!parsed.state) {
        return;
      }
      saveBankroll(parsed.state.bankroll);
      saveRules(parsed.state.rules);
    },
    removeItem: () => {
      if (typeof window === 'undefined') {
        return;
      }
      window.localStorage.removeItem('bj:bankroll');
      window.localStorage.removeItem('bj:rules');
    },
  }));
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialState(),
      setBet: (amount) => {
        const state = get();
        if (state.phase !== 'betting' || amount <= 0 || amount > state.bankroll) {
          warnInvalid('setBet');
          return;
        }
        set({ currentBet: amount });
      },
      deal: () => {
        const state = get();
        if (state.phase !== 'betting' || state.currentBet <= 0 || state.currentBet > state.bankroll) {
          warnInvalid('deal');
          return;
        }

        const shoeForRound = shouldUseFreshShoe(state) ? buildShuffledShoe(state.rules, state.rngSeed) : state.shoe;

        let workingShoe = shoeForRound;
        const firstPlayer = drawCard(workingShoe);
        workingShoe = firstPlayer.shoe;
        const firstDealer = drawCard(workingShoe);
        workingShoe = firstDealer.shoe;
        const secondPlayer = drawCard(workingShoe);
        workingShoe = secondPlayer.shoe;
        const secondDealer = drawCard(workingShoe);
        workingShoe = secondDealer.shoe;

        const playerHand = createPlayerHand([firstPlayer.card, secondPlayer.card], state.currentBet);
        const dealerCards = [firstDealer.card, secondDealer.card];
        const dealerUpcardIsAce = dealerCards[0].rank === 'A';
        const playerNatural = handValue(playerHand.cards).isBlackjack;
        const hasInsuranceOffer = dealerUpcardIsAce && !playerNatural;
        const bankroll = state.bankroll - state.currentBet;

        saveBankroll(bankroll);

        set({
          bankroll,
          phase: playerNatural ? 'dealerTurn' : 'playerTurn',
          shoe: workingShoe,
          dealerHand: emptyDealerHand(dealerCards),
          playerHands: [playerHand],
          activeHandIndex: 0,
          insuranceBet: 0,
          isInsuranceOffered: hasInsuranceOffer,
          splitsUsed: 0,
          forceNewShoe: false,
          roundStartBankroll: state.bankroll,
          lastRoundResult: null,
          pendingDealerSteps: [],
          isHoleCardRevealed: false,
        });

        if (playerNatural) {
          set((current) => ({
            playerHands: current.playerHands.map((hand) => ({ ...hand, isResolved: true, isStood: true })),
            phase: 'resolution',
          }));
          get().resolveRound();
        }
      },
      offerInsurance: () => {
        const state = get();
        const activeHand = getActiveHand(state);
        if (
          state.phase !== 'playerTurn' ||
          !activeHand ||
          state.dealerHand.cards[0]?.rank !== 'A' ||
          !isInitialDecision(activeHand)
        ) {
          warnInvalid('offerInsurance');
          return;
        }
        set({ isInsuranceOffered: true });
      },
      takeInsurance: () => {
        const state = get();
        if (state.phase !== 'playerTurn' || !state.isInsuranceOffered) {
          warnInvalid('takeInsurance');
          return;
        }
        const insuranceCost = state.currentBet * 0.5;
        if (state.bankroll < insuranceCost) {
          warnInvalid('takeInsurance');
          return;
        }

        const bankroll = state.bankroll - insuranceCost;
        saveBankroll(bankroll);
        set({
          bankroll,
          insuranceBet: insuranceCost,
          isInsuranceOffered: false,
        });

        if (handValue(get().dealerHand.cards).isBlackjack) {
          set((current) => ({
            playerHands: current.playerHands.map((hand) => ({ ...hand, isResolved: true })),
            phase: 'dealerTurn',
            pendingDealerSteps: [],
            isHoleCardRevealed: false,
          }));
          get().playDealer();
        }
      },
      declineInsurance: () => {
        const state = get();
        if (state.phase !== 'playerTurn' || !state.isInsuranceOffered) {
          warnInvalid('declineInsurance');
          return;
        }

        set({
          insuranceBet: 0,
          isInsuranceOffered: false,
        });

        if (handValue(get().dealerHand.cards).isBlackjack) {
          set((current) => ({
            playerHands: current.playerHands.map((hand) => ({ ...hand, isResolved: true })),
            phase: 'dealerTurn',
            pendingDealerSteps: [],
            isHoleCardRevealed: false,
          }));
          get().playDealer();
        }
      },
      hit: () => {
        const state = get();
        const activeHand = getActiveHand(state);
        if (!activeHand || !getLegalActionsForState(state).includes('hit')) {
          warnInvalid('hit');
          return;
        }

        const draw = drawCard(state.shoe);
        const updatedCards = [...activeHand.cards, draw.card];
        const value = handValue(updatedCards);
        const updatedHand: PlayerHand = {
          ...activeHand,
          cards: updatedCards,
          isResolved: value.isBust,
        };

        set((current) => {
          const playerHands = current.playerHands.map((hand, index) =>
            index === current.activeHandIndex ? updatedHand : hand,
          );

          if (!updatedHand.isResolved) {
            return {
              playerHands,
              shoe: draw.shoe,
            };
          }

          const nextIndex = playerHands.findIndex((hand) => !hand.isResolved);
          if (nextIndex >= 0) {
            return {
              playerHands,
              shoe: draw.shoe,
              activeHandIndex: nextIndex,
            };
          }

          return {
            playerHands,
            shoe: draw.shoe,
            phase: 'dealerTurn',
            pendingDealerSteps: [],
            isHoleCardRevealed: false,
          };
        });

        if (get().phase === 'dealerTurn') {
          get().playDealer();
        }
      },
      stand: () => {
        const state = get();
        const activeHand = getActiveHand(state);
        if (!activeHand || !getLegalActionsForState(state).includes('stand')) {
          warnInvalid('stand');
          return;
        }

        set((current) => {
          const playerHands = current.playerHands.map((hand, index) =>
            index === current.activeHandIndex ? { ...hand, isStood: true, isResolved: true } : hand,
          );
          const nextIndex = playerHands.findIndex((hand) => !hand.isResolved);

          if (nextIndex >= 0) {
            return {
              playerHands,
              activeHandIndex: nextIndex,
            };
          }

          return {
            playerHands,
            phase: 'dealerTurn',
            pendingDealerSteps: [],
            isHoleCardRevealed: false,
          };
        });

        if (get().phase === 'dealerTurn') {
          get().playDealer();
        }
      },
      double: () => {
        const state = get();
        const activeHand = getActiveHand(state);
        if (!activeHand || !getLegalActionsForState(state).includes('double')) {
          warnInvalid('double');
          return;
        }

        const draw = drawCard(state.shoe);
        const bankroll = state.bankroll - activeHand.bet;
        const doubledBet = activeHand.bet * 2;
        const updatedHand: PlayerHand = {
          ...activeHand,
          cards: [...activeHand.cards, draw.card],
          bet: doubledBet,
          isDoubled: true,
          isResolved: true,
          isStood: true,
        };

        saveBankroll(bankroll);

        set((current) => {
          const playerHands = current.playerHands.map((hand, index) =>
            index === current.activeHandIndex ? updatedHand : hand,
          );
          const nextIndex = playerHands.findIndex((hand) => !hand.isResolved);

          if (nextIndex >= 0) {
            return {
              bankroll,
              playerHands,
              shoe: draw.shoe,
              activeHandIndex: nextIndex,
            };
          }

          return {
            bankroll,
            playerHands,
            shoe: draw.shoe,
            phase: 'dealerTurn',
            pendingDealerSteps: [],
            isHoleCardRevealed: false,
          };
        });

        if (get().phase === 'dealerTurn') {
          get().playDealer();
        }
      },
      split: () => {
        const state = get();
        const activeHand = getActiveHand(state);
        if (!activeHand || !getLegalActionsForState(state).includes('split')) {
          warnInvalid('split');
          return;
        }

        let workingShoe = state.shoe;
        const firstDraw = drawCard(workingShoe);
        workingShoe = firstDraw.shoe;
        const secondDraw = drawCard(workingShoe);
        workingShoe = secondDraw.shoe;

        const isSplitAces = activeHand.cards[0].rank === 'A' && activeHand.cards[1].rank === 'A';
        const firstHand = createPlayerHand([activeHand.cards[0], firstDraw.card], activeHand.bet, true, isSplitAces);
        const secondHand = createPlayerHand([activeHand.cards[1], secondDraw.card], activeHand.bet, true, isSplitAces);

        const normalizedFirst = isSplitAces ? { ...firstHand, isResolved: true, isStood: true } : firstHand;
        const normalizedSecond = isSplitAces ? { ...secondHand, isResolved: true, isStood: true } : secondHand;
        const bankroll = state.bankroll - activeHand.bet;
        saveBankroll(bankroll);

        set((current) => {
          const playerHands = [...current.playerHands];
          playerHands.splice(current.activeHandIndex, 1, normalizedFirst, normalizedSecond);
          const nextIndex = playerHands.findIndex((hand) => !hand.isResolved);

          return {
            bankroll,
            playerHands,
            shoe: workingShoe,
            splitsUsed: current.splitsUsed + 1,
            activeHandIndex: nextIndex >= 0 ? nextIndex : current.activeHandIndex,
            phase: nextIndex >= 0 ? current.phase : 'dealerTurn',
            pendingDealerSteps: nextIndex >= 0 ? current.pendingDealerSteps : [],
            isHoleCardRevealed: nextIndex >= 0 ? current.isHoleCardRevealed : false,
          };
        });

        if (get().phase === 'dealerTurn') {
          get().playDealer();
        }
      },
      surrender: () => {
        const state = get();
        const activeHand = getActiveHand(state);
        if (!activeHand || !getLegalActionsForState(state).includes('surrender')) {
          warnInvalid('surrender');
          return;
        }

        const refund = activeHand.bet * 0.5;
        const bankroll = state.bankroll + refund;
        saveBankroll(bankroll);

        set((current) => {
          const playerHands = current.playerHands.map((hand, index) =>
            index === current.activeHandIndex
              ? { ...hand, isSurrendered: true, isResolved: true, isStood: true }
              : hand,
          );
          const nextIndex = playerHands.findIndex((hand) => !hand.isResolved);

          if (nextIndex >= 0) {
            return {
              bankroll,
              playerHands,
              activeHandIndex: nextIndex,
            };
          }

          return {
            bankroll,
            playerHands,
            phase: 'dealerTurn',
            pendingDealerSteps: [],
            isHoleCardRevealed: false,
          };
        });

        if (get().phase === 'dealerTurn') {
          get().playDealer();
        }
      },
      playDealer: () => {
        const state = get();
        if (state.phase !== 'dealerTurn') {
          warnInvalid('playDealer');
          return;
        }

        const dealerValue = handValue(state.dealerHand.cards);
        const shouldPlayDealer = state.playerHands.some((hand) => !hand.isSurrendered && !handValue(hand.cards).isBust);

        if (!shouldPlayDealer || dealerValue.isBlackjack) {
          set({ phase: 'resolution' });
          get().resolveRound();
          return;
        }

        const result = playDealerHand(state.dealerHand.cards, state.shoe, state.rules);
        set({
          dealerHand: {
            ...state.dealerHand,
            isStood: result.steps.length === 0,
          },
          shoe: result.shoe,
          pendingDealerSteps: result.steps,
          isHoleCardRevealed: false,
        });
      },
      revealHoleCard: () => {
        const state = get();
        if (state.phase !== 'dealerTurn') {
          warnInvalid('revealHoleCard');
          return;
        }

        set({ isHoleCardRevealed: true });
      },
      dealerDrawNext: () => {
        const state = get();
        if (state.phase !== 'dealerTurn') {
          warnInvalid('dealerDrawNext');
          return;
        }
        if (state.pendingDealerSteps.length === 0) {
          return;
        }

        const [nextCard, ...remainingSteps] = state.pendingDealerSteps;
        set({
          dealerHand: {
            ...state.dealerHand,
            cards: [...state.dealerHand.cards, nextCard],
            isStood: remainingSteps.length === 0,
          },
          pendingDealerSteps: remainingSteps,
        });
      },
      finishDealerTurn: () => {
        const state = get();
        if (state.phase !== 'dealerTurn' || state.pendingDealerSteps.length > 0) {
          warnInvalid('finishDealerTurn');
          return;
        }

        set({
          phase: 'resolution',
          dealerHand: {
            ...state.dealerHand,
            isStood: true,
          },
        });
        get().resolveRound();
      },
      resolveRound: () => {
        const state = get();
        if (state.phase !== 'resolution') {
          warnInvalid('resolveRound');
          return;
        }

        const dealerValue = handValue(state.dealerHand.cards);
        const dealerWouldPlay = state.playerHands.some((hand) => !hand.isSurrendered && !handValue(hand.cards).isBust);
        const allPlayerHandsBlackjack =
          state.playerHands.length > 0 && state.playerHands.every((hand) => handValue(hand.cards).isBlackjack);
        const dealerPlayed = dealerWouldPlay && !dealerValue.isBlackjack && !allPlayerHandsBlackjack;
        const resolutions = resolveRoundPayout(state.playerHands, dealerValue, state.rules);
        const handPayout = resolutions.reduce((sum, resolution, index) => {
          if (state.playerHands[index].isSurrendered) {
            return sum;
          }
          return sum + resolution.payout;
        }, 0);
        const insurancePayout = state.insuranceBet > 0 && dealerValue.isBlackjack ? state.insuranceBet * 3 : 0;
        const bankroll = state.bankroll + handPayout + insurancePayout;
        const netTotal = state.roundStartBankroll === null ? 0 : bankroll - state.roundStartBankroll;
        const handResults = state.playerHands.map((hand, index) => ({
          handId: hand.id,
          resolution: resolutions[index],
        }));

        saveBankroll(bankroll);

        set({
          bankroll,
          lastRoundResult: {
            handResults,
            insuranceBet: state.insuranceBet,
            insurancePayout,
            netTotal,
            dealerValue,
            dealerPlayed,
          },
          phase: bankroll === 0 ? 'gameOver' : 'betting',
          isInsuranceOffered: false,
          insuranceBet: 0,
          roundStartBankroll: null,
          currentBet: bankroll === 0 ? state.currentBet : Math.min(state.currentBet, bankroll),
          pendingDealerSteps: [],
          isHoleCardRevealed: false,
        });
      },
      nextRound: () => {
        const state = get();
        if (state.phase !== 'betting') {
          warnInvalid('nextRound');
          return;
        }

        set({
          lastRoundResult: null,
          phase: 'betting',
        });
      },
      resetBankroll: (amount) => {
        const state = get();
        if (state.phase !== 'gameOver' || amount <= 0) {
          warnInvalid('resetBankroll');
          return;
        }

        saveBankroll(amount);
        set({
          bankroll: amount,
          phase: 'betting',
          currentBet: Math.min(state.currentBet, amount),
          dealerHand: emptyDealerHand(),
          playerHands: [],
          activeHandIndex: 0,
          insuranceBet: 0,
          isInsuranceOffered: false,
          lastRoundResult: null,
          splitsUsed: 0,
          roundStartBankroll: null,
          pendingDealerSteps: [],
          isHoleCardRevealed: false,
        });
      },
      updateRules: (rules) => {
        const state = get();
        if (state.phase !== 'betting') {
          warnInvalid('updateRules');
          return;
        }

        const nextRules: RulesConfig = {
          ...state.rules,
          ...rules,
        };
        const mustResetShoe =
          rules.decks !== undefined || rules.penetration !== undefined || state.shoe.length === 0;

        saveRules(nextRules);
        set({
          rules: nextRules,
          forceNewShoe: mustResetShoe || state.forceNewShoe,
        });
      },
      __setShoe: (shoe) => {
        set({ shoe, forceNewShoe: false });
      },
      __setRngSeed: (seed) => {
        set({ rngSeed: seed });
      },
      __resetForTests: () => {
        set({
          ...initialState(),
        });
      },
    }),
    {
      name: 'bj:game-store',
      storage: getPersistStorage(),
      partialize: (state) => ({
        bankroll: state.bankroll,
        rules: state.rules,
      }),
    },
  ),
);

export const selectActiveHand = (state: GameStoreState): PlayerHand | null => getActiveHand(state);

export const selectDealerUpcard = (state: GameStoreState): Card | null => state.dealerHand.cards[0] ?? null;

export const selectLegalActions = (state: GameStoreState): Action[] => [...getLegalActionsForState(state)];

export const selectCanDoubleDown = (state: GameStoreState): boolean => selectLegalActions(state).includes('double');

export const selectIsDealerShowingAce = (state: GameStoreState): boolean => selectDealerUpcard(state)?.rank === 'A';

export const selectShouldOfferInsurance = (state: GameStoreState): boolean => state.isInsuranceOffered;

export const selectIsDealerTurnInProgress = (state: GameStoreState): boolean =>
  state.phase === 'dealerTurn' && (!state.isHoleCardRevealed || state.pendingDealerSteps.length > 0);

export function useHydratedGameStore<T>(selector: (state: GameStore) => T): T | undefined {
  const selected = useGameStore(selector);
  const [hydrated, setHydrated] = useState(useGameStore.persist.hasHydrated());

  useEffect(() => {
    const unsubscribe = useGameStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    return unsubscribe;
  }, []);

  if (!hydrated) {
    return undefined;
  }

  return selected;
}
