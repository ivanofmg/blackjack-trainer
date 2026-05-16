export { HARD_STRATEGY, PAIR_STRATEGY, SOFT_STRATEGY } from '@/lib/strategy/basicStrategy';
export { categorizeHand, describeHand, upcardToColumn } from '@/lib/strategy/describe';
export { recommendAction } from '@/lib/strategy/recommend';
export { getRationale } from '@/lib/strategy/rationale';
export { UPCARD_INDEX } from '@/lib/strategy/types';
export type { HandCategory } from '@/lib/strategy/describe';
export type { DecisionLogEntry } from '@/lib/strategy/decisionLog';
export type { Rationale, RationaleKey } from '@/lib/strategy/rationale';
export type { StrategyDecision, StrategyUpcard } from '@/lib/strategy/types';
