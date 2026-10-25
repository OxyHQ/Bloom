/**
 * Holding any part of a message opens its menu on native.
 *
 * Measured on Android (Allo, Bloom 15.50.1, RN 0.88 Fabric, Pixel 8a): holding
 * a message opened nothing at all.
 *
 *   - Text: the body was `selectable` on every platform, and a selectable text
 *     view takes the long press for its own selection, so the bubble never saw
 *     it. It is selectable on web only; native copies from the menu.
 *   - Media: a picture's frame, a file row, a play button are pressables deeper
 *     than the bubble, so they took the touch and had no long press. They now
 *     hand on the bubble's (`message-media/context.ts`).
 *
 * Rendered through the `react-native` mock (`Platform.OS === 'ios'`).
 */
import { render } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

import { MessageBubble } from '../message-bubble';
import { ImageMessage, VoiceMessage } from '../message-media';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

function mount(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('holding a message on native', () => {
  it('leaves the body text unselectable, so the hold reaches the bubble', () => {
    const screen = mount(
      <MessageBubble direction="outgoing" text="Segunda prueba" onLongPress={() => {}} />,
    );
    const body = screen
      .UNSAFE_getAllByType(Text)
      .find((node) => node.props.selectable !== undefined);
    expect(body?.props.selectable).toBe(false);
  });

  it("hands the bubble's long press to a picture's own pressable", () => {
    const hold = jest.fn();
    const screen = mount(
      <MessageBubble
        direction="outgoing"
        onLongPress={hold}
        media={<ImageMessage source={{ uri: 'file:///a.jpg' }} onPress={() => {}} testID="pic" />}
      />,
    );
    const frame = screen
      .UNSAFE_getAllByType(Pressable)
      .find((node) => node.props.testID === 'pic-frame');
    expect(frame?.props.onLongPress).toBe(hold);
  });

  it("hands it to a voice note's play button too", () => {
    const hold = jest.fn();
    const screen = mount(
      <MessageBubble
        direction="incoming"
        onLongPress={hold}
        mediaFit="inset"
        media={
          <VoiceMessage samples={[0.2, 0.5]} duration={3} onPlayPress={() => {}} testID="voice" />
        }
      />,
    );
    const play = screen
      .UNSAFE_getAllByType(Pressable)
      .find((node) => node.props.testID === 'voice-play');
    expect(play?.props.onLongPress).toBe(hold);
  });

  it('gives a media pressable no long press outside a bubble', () => {
    const screen = mount(
      <ImageMessage source={{ uri: 'file:///a.jpg' }} onPress={() => {}} testID="pic" />,
    );
    const frame = screen
      .UNSAFE_getAllByType(Pressable)
      .find((node) => node.props.testID === 'pic-frame');
    expect(frame?.props.onLongPress).toBeUndefined();
  });
});
