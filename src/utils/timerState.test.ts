import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BREAK_DURATION,
  FOCUS_DURATION,
  restoreTimerState,
  type PersistedTimerState,
} from './timerState.ts';

const NOW = 1_800_000_000_000;

const running = (
  overrides: Partial<PersistedTimerState> = {}
): PersistedTimerState => ({
  mode: 'focus',
  isRunning: true,
  targetTimestamp: NOW + 90_000,
  pausedSecondsLeft: FOCUS_DURATION,
  soundEnabled: true,
  ...overrides,
});

test('restoreTimerState resumes a running timer with the time still left', () => {
  const restored = restoreTimerState(running(), NOW);
  assert.equal(restored.isRunning, true);
  assert.equal(restored.mode, 'focus');
  assert.equal(restored.pausedSecondsLeft, 90);
  assert.equal(restored.targetTimestamp, NOW + 90_000);
});

test('restoreTimerState rolls over to a break when focus ended while closed', () => {
  const restored = restoreTimerState(
    running({ targetTimestamp: NOW - 60_000 }),
    NOW
  );
  assert.equal(restored.mode, 'break');
  assert.equal(restored.isRunning, false);
  assert.equal(restored.targetTimestamp, null);
  assert.equal(restored.pausedSecondsLeft, BREAK_DURATION);
});

test('restoreTimerState rolls over to focus when a break ended while closed', () => {
  const restored = restoreTimerState(
    running({ mode: 'break', targetTimestamp: NOW - 1 }),
    NOW
  );
  assert.equal(restored.mode, 'focus');
  assert.equal(restored.isRunning, false);
  assert.equal(restored.pausedSecondsLeft, FOCUS_DURATION);
});

test('restoreTimerState leaves a paused timer untouched', () => {
  const paused = running({
    isRunning: false,
    targetTimestamp: null,
    pausedSecondsLeft: 432,
    soundEnabled: false,
  });
  assert.deepEqual(restoreTimerState(paused, NOW), paused);
});
