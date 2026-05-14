import { describe, expect, it } from 'vitest';

import { DEFAULT_RULES, RANKS, SUITS } from '@/lib/blackjack/types';

describe('blackjack domain base types constants', () => {
  it('uses PRD default Strip rules', () => {
    expect(DEFAULT_RULES).toEqual({
      decks: 6,
      dealerHitsSoft17: false,
      doubleAfterSplit: true,
      surrender: 'late',
      blackjackPayout: 1.5,
      maxSplits: 4,
      penetration: 0.75,
    });
  });

  it('exports 4 suits and 13 ranks', () => {
    expect(SUITS).toHaveLength(4);
    expect(RANKS).toHaveLength(13);
  });
});
