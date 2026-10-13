import { useEffect } from 'react';
import { useFrameCallback, useSharedValue, type SharedValue } from 'react-native-reanimated';

import { WAVE_SMOOTHING_MS } from './constants';
import { isLevelsArray, resampleLevels } from './levels';
import type { AudioLevels } from './types';

/**
 * The levels the bars draw, as a shared value: `levels` resampled to `bars` and
 * eased toward on a frame clock, so a producer writing ten times a second reads
 * as a wave rather than a flicker.
 *
 * ONE source, two spellings. A shared value is read where it lives; a plain
 * array is copied into a shared value of our own when it changes. Either way
 * the frame clock reads a shared value, so a meter writing `levels.value` costs
 * the UI thread and no React render. `running` false parks the clock and rests
 * every bar.
 */
export function useWaveLevels(
  levels: AudioLevels,
  bars: number,
  running: boolean,
): SharedValue<readonly number[]> {
  const plain = isLevelsArray(levels);
  const copy = useSharedValue<readonly number[]>(plain ? levels : []);
  useEffect(() => {
    if (plain) copy.value = levels;
  }, [plain, levels, copy]);
  const source = plain ? copy : levels;

  const eased = useSharedValue<readonly number[]>(new Array<number>(bars).fill(0));
  const clock = useFrameCallback((frame) => {
    const target = resampleLevels(source.value, bars);
    const previous = eased.value;
    const blend = 1 - Math.exp(-(frame.timeSincePreviousFrame ?? 16) / WAVE_SMOOTHING_MS);
    eased.value = target.map((level, bar) => {
      const from = previous[bar] ?? 0;
      return from + (level - from) * blend;
    });
  }, false);

  useEffect(() => {
    clock.setActive(running);
    if (!running) eased.value = new Array<number>(bars).fill(0);
  }, [running, bars, clock, eased]);

  return eased;
}
