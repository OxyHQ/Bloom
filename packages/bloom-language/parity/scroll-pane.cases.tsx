import { createRef } from 'react';
import { ScrollView, type ScrollViewInstance, Text } from 'react-native';

import * as L from '../src/__tests__/support/language.generated';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

/** A height the view computes as it renders (Allo's sticker picker's, from its prop). */
const HEIGHT = 280;
/** Allo's poll composer's body, at most this tall inside its dialog. */
const BODY_MAX_HEIGHT = 340;

const onScroll = () => {};
const onScrollBeginDrag = () => {};
const onContentSizeChange = () => {};
const scroller = createRef<ScrollViewInstance>();

/** React Native's `ScrollView` as Allo and Mention write one inside a dialog or a panel. */
export const SCROLL_PANE_CASES: readonly ParityCase[] = [
  {
    name: 'a plain scroll',
    language: () => toElement(L.ScrollPane(L.RawText('One'), L.RawText('Two'))),
    bloom: () => (
      <ScrollView>
        <Text>One</Text>
        <Text>Two</Text>
      </ScrollView>
    ),
  },
  {
    // Allo's poll composer: bounded in its dialog, its fields apart, taps reaching them.
    name: 'a bounded scroll with spaced content that keeps taps',
    language: () =>
      toElement(
        L.ScrollPane(L.RawText('Question'), L.RawText('Option'))
          .frame({ maxHeight: BODY_MAX_HEIGHT })
          .spacing('md')
          .contentMargins('bottom', 'xs')
          .keyboardTaps('handled'),
      ),
    bloom: () => (
      <ScrollView
        style={{ maxHeight: BODY_MAX_HEIGHT }}
        contentContainerStyle={{ gap: 12, paddingBottom: 4 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text>Question</Text>
        <Text>Option</Text>
      </ScrollView>
    ),
  },
  {
    // Allo's sticker picker: a height from its prop.
    name: 'a scroll of a computed height',
    language: () =>
      toElement(
        L.ScrollPane(L.RawText('Pack'))
          .frame({ height: HEIGHT })
          .spacing('md')
          .contentMargins('bottom', 'sm'),
      ),
    bloom: () => (
      <ScrollView style={{ height: HEIGHT }} contentContainerStyle={{ gap: 12, paddingBottom: 8 }}>
        <Text>Pack</Text>
      </ScrollView>
    ),
  },
  {
    // Allo's transcript: its ref, its scroll followed, the keyboard dragged away, the
    // content at its end while it is short.
    name: 'a followed scroll whose short content sits at its end',
    language: () =>
      toElement(
        L.ScrollPane(L.RawText('Hello'))
          .ref(scroller)
          .grow()
          .frame({ minHeight: 0 })
          .contentGrows()
          .justify('end')
          .scrollDismissesKeyboard('interactively')
          .keyboardTaps('handled')
          .scrollEvents({
            onScroll,
            scrollEventThrottle: 64,
            onScrollBeginDrag,
            onContentSizeChange,
          }),
      ),
    bloom: () => (
      <ScrollView
        ref={scroller}
        style={{ flex: 1, minHeight: 0 }}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
        onScroll={onScroll}
        scrollEventThrottle={64}
        onScrollBeginDrag={onScrollBeginDrag}
        onContentSizeChange={onContentSizeChange}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      >
        <Text>Hello</Text>
      </ScrollView>
    ),
  },
  {
    // Mention's article: its bar shown, bouncing.
    name: 'a scroll with its bar shown and bouncing',
    language: () =>
      toElement(
        L.ScrollPane(L.RawText('Body')).grow().scrollIndicators('visible', 'vertical').bounces(),
      ),
    bloom: () => (
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator bounces>
        <Text>Body</Text>
      </ScrollView>
    ),
  },
  {
    name: 'a scroll across, its bar hidden, centred',
    language: () =>
      toElement(
        L.ScrollPane(L.RawText('A'), L.RawText('B'))
          .axis('horizontal')
          .scrollIndicators('hidden')
          .align('center')
          .spacing('sm')
          .bounces(false),
      ),
    bloom: () => (
      <ScrollView
        horizontal
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, alignItems: 'center' }}
        bounces={false}
      >
        <Text>A</Text>
        <Text>B</Text>
      </ScrollView>
    ),
  },
];
