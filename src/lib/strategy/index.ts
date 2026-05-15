export { HARD_STRATEGY, PAIR_STRATEGY, SOFT_STRATEGY } from '@/lib/strategy/basicStrategy';
export { categorizeHand, describeHand, upcardToColumn } from '@/lib/strategy/describe';
export { recommendAction } from '@/lib/strategy/recommend';
export { UPCARD_INDEX } from '@/lib/strategy/types';
export type { HandCategory } from '@/lib/strategy/describe';
export type { StrategyDecision, StrategyUpcard } from '@/lib/strategy/types';
