import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import {
  AnimatedCheck,
  type AnimatedCheckProps,
  type AnimatedCheckRef,
} from '@oxy.so/bloom/animated-check';

import * as L from '../src/index';
import { toElement } from '../src/render';
import { type ParityCase, Themed } from './support/cases';

/** What an app writes: the check played as it mounts, through its ref. */
function PlayedCheck(props: AnimatedCheckProps) {
  const check = useRef<AnimatedCheckRef>(null);
  useEffect(() => {
    check.current?.play();
  }, []);
  return <AnimatedCheck ref={check} {...props} />;
}

export const ANIMATED_CHECK_CASES: readonly ParityCase[] = [
  {
    name: 'an animated check',
    language: () => toElement(L.AnimatedCheck()),
    bloom: () => <PlayedCheck />,
  },
  {
    name: 'a large animated check',
    language: () => toElement(L.AnimatedCheck('paired').size('64')),
    bloom: () => <PlayedCheck size={64} />,
  },
  ...(['primary', 'error', 'muted'] as const).map((tint) => ({
    name: `an animated check tinted ${tint}`,
    language: () => toElement(L.AnimatedCheck().tint(tint).size('48')),
    bloom: () => (
      <Themed>
        {(c) => (
          <PlayedCheck
            size={48}
            color={tint === 'primary' ? c.primary : tint === 'error' ? c.error : c.textSecondary}
          />
        )}
      </Themed>
    ),
  })),
  {
    name: 'an animated check in a padded box',
    language: () => toElement(L.AnimatedCheck().padding('md').background('surface')),
    bloom: () => (
      <Themed>
        {(c) => (
          <View
            style={{
              paddingTop: 12,
              paddingBottom: 12,
              paddingStart: 12,
              paddingEnd: 12,
              backgroundColor: c.backgroundSecondary,
            }}
          >
            <PlayedCheck />
          </View>
        )}
      </Themed>
    ),
  },
];
