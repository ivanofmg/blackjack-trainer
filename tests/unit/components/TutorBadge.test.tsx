import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TutorBadge } from '@/components/trainer/TutorBadge';

type MockTrainerState = Readonly<{
  mode: 'off' | 'tutor' | 'exam';
  lastDecision: null | {
    handDescription: string;
    chosenAction: 'hit' | 'stand' | 'double' | 'split' | 'surrender' | 'insurance';
    recommendedAction: 'hit' | 'stand' | 'double' | 'split' | 'surrender' | 'insurance';
    wasCorrect: boolean;
  };
}>;

let mockState: MockTrainerState = {
  mode: 'tutor',
  lastDecision: {
    handDescription: 'Hard 16 vs 10',
    chosenAction: 'stand',
    recommendedAction: 'surrender',
    wasCorrect: false,
  },
};

vi.mock('@/store/trainerStore', () => ({
  useTrainerStore: (selector: (state: MockTrainerState) => unknown) => selector(mockState),
}));

describe('TutorBadge', () => {
  beforeEach(() => {
    mockState = {
      mode: 'tutor',
      lastDecision: {
        handDescription: 'Hard 16 vs 10',
        chosenAction: 'stand',
        recommendedAction: 'surrender',
        wasCorrect: false,
      },
    };
  });

  it('renders incorrect badge in tutor mode', () => {
    render(<TutorBadge />);
    expect(screen.getByText(/Lo óptimo era:/)).toBeInTheDocument();
    expect(screen.getByText(/Surrender/)).toBeInTheDocument();
  });

  it('renders correct badge in tutor mode', () => {
    mockState = {
      ...mockState,
      lastDecision: {
        handDescription: 'Hard 16 vs 10',
        chosenAction: 'surrender',
        recommendedAction: 'surrender',
        wasCorrect: true,
      },
    };
    render(<TutorBadge />);
    expect(screen.getByText('✓ Decisión óptima')).toBeInTheDocument();
  });

  it('does not render in exam/off modes or when there is no decision', () => {
    mockState = { ...mockState, mode: 'exam' };
    const examRender = render(<TutorBadge />);
    expect(examRender.container).toBeEmptyDOMElement();

    mockState = { ...mockState, mode: 'off' };
    const offRender = render(<TutorBadge />);
    expect(offRender.container).toBeEmptyDOMElement();

    mockState = { ...mockState, mode: 'tutor', lastDecision: null };
    const nullRender = render(<TutorBadge />);
    expect(nullRender.container).toBeEmptyDOMElement();
  });
});
