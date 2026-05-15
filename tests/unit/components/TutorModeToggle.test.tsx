import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TutorModeToggle } from '@/components/trainer/TutorModeToggle';

type MockState = Readonly<{
  mode: 'off' | 'tutor' | 'exam';
  setMode: (mode: 'off' | 'tutor' | 'exam') => void;
}>;

const setModeSpy = vi.fn();

let mockState: MockState = {
  mode: 'off',
  setMode: setModeSpy,
};

vi.mock('@/store/trainerStore', () => ({
  useTrainerStore: (selector: (state: MockState) => unknown) => selector(mockState),
}));

describe('TutorModeToggle', () => {
  beforeEach(() => {
    setModeSpy.mockReset();
    mockState = { mode: 'off', setMode: setModeSpy };
  });

  it('renders three mode buttons', () => {
    render(<TutorModeToggle />);
    expect(screen.getByRole('button', { name: 'Off' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tutor' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Examen' })).toBeInTheDocument();
  });

  it('calls setMode when selecting another mode', () => {
    render(<TutorModeToggle />);
    fireEvent.click(screen.getByRole('button', { name: 'Tutor' }));
    fireEvent.click(screen.getByRole('button', { name: 'Examen' }));

    expect(setModeSpy).toHaveBeenCalledWith('tutor');
    expect(setModeSpy).toHaveBeenCalledWith('exam');
    expect(setModeSpy).toHaveBeenCalledTimes(2);
  });
});
