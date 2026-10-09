import React, { useRef } from 'react';
import { ScrollView, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ViewportProvider, useViewportBinding, useInView } from './index';
import { RatingBar } from '../rating';
import { Text } from '../typography';

export default { title: 'Layout/Viewport', component: ViewportProvider } satisfies Meta;
type Story = StoryObj;
function Histogram() {
  const { inView, targetProps } = useInView({ threshold: 1, once: true });
  return <View {...targetProps} testID="observed-histogram" style={{ height: 80, width: 320 }}>
    <Text testID="histogram-visible">{String(inView)}</Text>
    <RatingBar label="Five stars" labelWidth={60} value={75} max={100} display="75%" testID="revealed-rating"
      reveal={{ visible: inView, once: true, duration: 1000, delay: 300, easing: [.4, 0, .2, 1] }} />
  </View>;
}
export const DocumentReveal: Story = {
  render: () => <View style={{ padding: 24 }}>
    <View style={{ height: 1200 }} />
    <Histogram />
    <View style={{ height: 1200 }} />
  </View>,
};
function BoundScroll() {
  const viewportRef = useRef<ScrollView>(null);
  const binding = useViewportBinding({ viewportRef });
  return <ScrollView {...binding} ref={viewportRef} testID="reveal-scroll" style={{ height: 300, width: 360 }}>
    <View style={{ height: 600 }} />
    <Histogram />
    <View style={{ height: 600 }} />
  </ScrollView>;
}
export const ClippedReveal: Story = {
  render: () => <ViewportProvider root><BoundScroll /></ViewportProvider>,
};
