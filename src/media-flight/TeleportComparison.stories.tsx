/**
 * EVALUATION ONLY — not part of Bloom. Lives on `eval/teleport` and is never
 * merged.
 *
 * `react-native-teleport@1.2.0` against the case Bloom's media flight exists
 * for: the ORIGIN ROUTE UNMOUNTS mid-transition, which is what expo-router does
 * on web the moment the URL changes.
 *
 * Two arms, because a fair evaluation has to include the case the library was
 * designed for:
 *
 *  - `TeleportOriginUnmounts` — the origin goes away, as it does under
 *    expo-router web. This is Bloom's case.
 *  - `TeleportOriginStays` — the origin stays mounted, which is what their
 *    Instagram recipe arranges with `presentation: 'transparentModal'`. This is
 *    THEIR case, and it is here so a failure in the first arm cannot be read as
 *    the harness being rigged: if this one also failed, the harness would be
 *    wrong, not the library.
 *
 * Both stamp every `<video>` on creation, so the question is the same one
 * Bloom's own gate asks: is it the SAME element at the end?
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Portal, PortalHost, PortalProvider } from 'react-native-teleport';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta = { title: 'Eval/Teleport' };
export default meta;
type Story = StoryObj;

const TINY_MP4 = 'data:video/mp4;base64,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';

const STAMP = { n: 0 };

/** A real `<video>`, stamped when the DOM node is created. */
function StampedVideo() {
  return React.createElement('video', {
    'data-testid': 'media',
    ref: (node: HTMLVideoElement | null) => {
      if (node === null || node.dataset.elId !== undefined) return;
      STAMP.n += 1;
      node.dataset.elId = String(STAMP.n);
    },
    src: TINY_MP4,
    autoPlay: true,
    muted: true,
    loop: true,
    playsInline: true,
    style: { width: '100%', height: '100%', objectFit: 'contain' },
  });
}

const ORIGIN_BOX = { width: 120, height: 90, overflow: 'hidden' } as const;
const DEST_BOX = { width: 320, height: 240, overflow: 'hidden' } as const;

/** @param originSurvives their recipe's arrangement; false is expo-router web. */
function TeleportDemo({ originSurvives }: { originSurvives: boolean }) {
  const [stage, setStage] = React.useState<'origin' | 'gap' | 'destination'>('origin');
  const host = stage === 'origin' ? undefined : stage === 'gap' ? 'overlay' : 'reels';

  const go = React.useCallback(() => {
    setStage('gap');
    setTimeout(() => setStage('destination'), 140);
  }, []);

  // The origin's OWNER. Under expo-router on web this unmounts with the route;
  // in their recipe `transparentModal` keeps it mounted.
  const originMounted = originSurvives || stage === 'origin';

  return (
    <PortalProvider>
      <View style={{ gap: 16 }}>
        <Pressable onPress={go} testID={originSurvives ? 'teleport-stays' : 'teleport-unmounts'}>
          <Text>Open (route change)</Text>
        </Pressable>

        {originMounted ? (
          <View style={ORIGIN_BOX}>
            <Portal hostName={host} name="media">
              <StampedVideo />
            </Portal>
          </View>
        ) : null}

        {/* The layer every transition passes through mid-flight. */}
        <PortalHost name="overlay" style={{ width: 200, height: 150 }} />

        <View style={DEST_BOX}>
          {stage === 'destination' ? (
            <PortalHost name="reels" style={{ width: '100%', height: '100%' }} />
          ) : null}
        </View>
      </View>
    </PortalProvider>
  );
}

export const TeleportOriginUnmounts: Story = {
  render: () => <TeleportDemo originSurvives={false} />,
};

export const TeleportOriginStays: Story = {
  render: () => <TeleportDemo originSurvives />,
};
