/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { formatTimerDisplay } from '../utils/todoLogic';
import { playTimerCompleteSound, playTimerStartSound } from '../utils/soundEffects';

export type TimerMode = 'focus' | 'break';

const TIMER_STORAGE_KEY = 'focuslist_timer_state_v1';
export const FOCUS_DURATION = 25 * 60;
export const BREAK_DURATION = 5 * 60;

interface PersistedTimerState {
  mode: TimerMode;
  isRunning: boolean;
  targetTimestamp: number | null;
  pausedSecondsLeft: number;
  soundEnabled: boolean;
}

export function useFocusTimer(onFocusComplete?: (mode: TimerMode) => void) {
  const onFocusCompleteRef = useRef(onFocusComplete);
  useEffect(() => {
    onFocusCompleteRef.current = onFocusComplete;
  }, [onFocusComplete]);

  // Load initial state from LocalStorage or default
  const [timerState, setTimerState] = useState<PersistedTimerState>(() => {
    try {
      const saved = window.localStorage.getItem(TIMER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as PersistedTimerState;
        if (parsed.targetTimestamp && parsed.isRunning) {
          const delta = Math.max(0, Math.round((parsed.targetTimestamp - Date.now()) / 1000));
          return {
            ...parsed,
            pausedSecondsLeft: delta,
            isRunning: delta > 0,
            targetTimestamp: delta > 0 ? parsed.targetTimestamp : null,
          };
        }
        return parsed;
      }
    } catch {
      // Fallback to default
    }

    return {
      mode: 'focus',
      isRunning: false,
      targetTimestamp: null,
      pausedSecondsLeft: FOCUS_DURATION,
      soundEnabled: true,
    };
  });

  const [secondsLeft, setSecondsLeft] = useState<number>(timerState.pausedSecondsLeft);

  const totalSeconds = timerState.mode === 'focus' ? FOCUS_DURATION : BREAK_DURATION;

  // Persist state changes
  useEffect(() => {
    try {
      window.localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timerState));
    } catch {
      // Ignore storage errors in restricted frames
    }
  }, [timerState]);

  // Handle precision countdown
  useEffect(() => {
    if (!timerState.isRunning || !timerState.targetTimestamp) {
      setSecondsLeft(timerState.pausedSecondsLeft);
      return;
    }

    const checkTime = () => {
      const remaining = Math.max(
        0,
        Math.round((timerState.targetTimestamp! - Date.now()) / 1000)
      );

      setSecondsLeft(remaining);

      if (remaining <= 0) {
        // Interval completed!
        if (timerState.soundEnabled) {
          playTimerCompleteSound();
        }

        // Send browser notification if supported
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(
              timerState.mode === 'focus'
                ? '🎯 Focus Session Complete!'
                : '☕ Break Over!',
              {
                body:
                  timerState.mode === 'focus'
                    ? 'Great job! Time for a restorative 5-minute break.'
                    : 'Ready to dive back into deep work?',
                icon: '/favicon.ico',
              }
            );
          } catch {
            // Ignore notification error
          }
        }

        const completedMode = timerState.mode;
        const nextMode: TimerMode = completedMode === 'focus' ? 'break' : 'focus';
        const nextDuration = nextMode === 'focus' ? FOCUS_DURATION : BREAK_DURATION;

        setTimerState((prev) => ({
          ...prev,
          mode: nextMode,
          isRunning: false,
          targetTimestamp: null,
          pausedSecondsLeft: nextDuration,
        }));

        setSecondsLeft(nextDuration);

        if (onFocusCompleteRef.current) {
          onFocusCompleteRef.current(completedMode);
        }
      }
    };

    checkTime();
    const interval = window.setInterval(checkTime, 500);
    return () => window.clearInterval(interval);
  }, [timerState.isRunning, timerState.targetTimestamp, timerState.soundEnabled, timerState.mode]);

  // Synchronize document title with live timer
  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (timerState.isRunning) {
      const icon = timerState.mode === 'focus' ? '🎯' : '☕';
      const label = timerState.mode === 'focus' ? 'Focus' : 'Break';
      document.title = `(${formatTimerDisplay(secondsLeft)}) ${icon} ${label} | Focuslist`;
    } else {
      document.title = 'Focuslist — Task & Priority Manager';
    }

    return () => {
      document.title = 'Focuslist — Task & Priority Manager';
    };
  }, [timerState.isRunning, timerState.mode, secondsLeft]);

  // Actions
  const startTimer = useCallback(() => {
    const target = Date.now() + secondsLeft * 1000;
    setTimerState((prev) => ({
      ...prev,
      isRunning: true,
      targetTimestamp: target,
    }));
    if (timerState.soundEnabled) {
      playTimerStartSound();
    }
  }, [secondsLeft, timerState.soundEnabled]);

  const pauseTimer = useCallback(() => {
    setTimerState((prev) => ({
      ...prev,
      isRunning: false,
      targetTimestamp: null,
      pausedSecondsLeft: secondsLeft,
    }));
  }, [secondsLeft]);

  const toggleTimer = useCallback(() => {
    if (timerState.isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  }, [timerState.isRunning, pauseTimer, startTimer]);

  const resetTimer = useCallback(() => {
    const duration = timerState.mode === 'focus' ? FOCUS_DURATION : BREAK_DURATION;
    setTimerState((prev) => ({
      ...prev,
      isRunning: false,
      targetTimestamp: null,
      pausedSecondsLeft: duration,
    }));
    setSecondsLeft(duration);
  }, [timerState.mode]);

  const switchMode = useCallback((nextMode: TimerMode) => {
    const duration = nextMode === 'focus' ? FOCUS_DURATION : BREAK_DURATION;
    setTimerState((prev) => ({
      ...prev,
      mode: nextMode,
      isRunning: false,
      targetTimestamp: null,
      pausedSecondsLeft: duration,
    }));
    setSecondsLeft(duration);
  }, []);

  const toggleSound = useCallback(() => {
    setTimerState((prev) => ({
      ...prev,
      soundEnabled: !prev.soundEnabled,
    }));
  }, []);

  const requestNotificationPermission = useCallback(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  return {
    mode: timerState.mode,
    secondsLeft,
    totalSeconds,
    isRunning: timerState.isRunning,
    soundEnabled: timerState.soundEnabled,
    startTimer,
    pauseTimer,
    toggleTimer,
    resetTimer,
    switchMode,
    toggleSound,
    requestNotificationPermission,
  };
}
