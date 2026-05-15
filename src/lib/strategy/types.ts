export type StrategyUpcard = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'A';

// Decision tokens from the strategy tables. They are resolved into concrete
// actions using legal actions and table rules.
export type StrategyDecision =
  | 'H'
  | 'S'
  | 'Dh'
  | 'Ds'
  | 'P'
  | 'Ph'
  | 'Ps'
  | 'Rh'
  | 'Rs'
  | 'Rp';

export const UPCARD_INDEX: Readonly<Record<StrategyUpcard, number>> = {
  '2': 0,
  '3': 1,
  '4': 2,
  '5': 3,
  '6': 4,
  '7': 5,
  '8': 6,
  '9': 7,
  '10': 8,
  A: 9,
};
