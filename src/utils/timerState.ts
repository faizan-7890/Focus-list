export type TimerMode = 'focus' | 'break';

export const FOCUS_DURATION = 25 * 60;
export const BREAK_DURATION = 5 * 60;

export interface PersistedTimerState {
  mode: TimerMode;
  isRunning: boolean;
  targetTimestamp: number | null;
  pausedSecondsLeft: number;
  soundEnabled: boolean;
}

export function getModeDuration(mode: TimerMode): number {
  return mode === 'focus' ? FOCUS_DURATION : BREAK_DURATION;
}

/**
 * Turns the timer state saved in localStorage back into a usable state after
 * a page reload. A running timer resumes with the time still left; one whose
 * interval ended while the page was closed rolls over to the next mode,
 * paused and ready to start, instead of sitting at 00:00.
 */
export function restoreTimerState(
  saved: PersistedTimerState,
  now: number
): PersistedTimerState {
  if (!saved.isRunning || !saved.targetTimestamp) {
    return saved;
  }

  const remaining = Math.max(
    0,
    Math.round((saved.targetTimestamp - now) / 1000)
  );

  if (remaining > 0) {
    return { ...saved, pausedSecondsLeft: remaining };
  }

  const nextMode: TimerMode = saved.mode === 'focus' ? 'break' : 'focus';
  return {
    ...saved,
    mode: nextMode,
    isRunning: false,
    targetTimestamp: null,
    pausedSecondsLeft: getModeDuration(nextMode),
  };
}
