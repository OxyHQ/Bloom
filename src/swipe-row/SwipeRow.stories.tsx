import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { RiArchiveLine } from '../icons/remix/RiArchiveLine';
import { RiCheckDoubleLine } from '../icons/remix/RiCheckDoubleLine';
import { RiDeleteBinLine } from '../icons/remix/RiDeleteBinLine';
import { RiTimeLine } from '../icons/remix/RiTimeLine';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { SwipeRow } from './SwipeRow';
import type { SwipeRowActions } from './types';

/**
 * A drag is the only way to see these stories work. In a browser, press inside
 * a row and move the pointer sideways — gesture-handler reads real pointer
 * events, so a mouse drag is the same gesture a thumb makes.
 */
const meta: Meta = {
  title: 'Base/Swipe Row',
};

export default meta;

type Story = StoryObj;

const ACTIONS: SwipeRowActions = {
  left: [{ key: 'read', label: 'Read', icon: RiCheckDoubleLine, tone: 'accent' }],
  right: [
    { key: 'snooze', label: 'Snooze', icon: RiTimeLine },
    { key: 'delete', label: 'Delete', icon: RiDeleteBinLine, tone: 'negative' },
  ],
};

function Row({ title, subtitle }: { title: string; subtitle: string }) {
  const theme = useTheme();
  return (
    <View
      style={{
        height: 72,
        justifyContent: 'center',
        paddingLeft: 16,
        paddingRight: 16,
        gap: 2,
        backgroundColor: theme.colors.background,
      }}
    >
      <Text variant="headline-regular" numberOfLines={1} style={{ color: theme.colors.text }}>
        {title}
      </Text>
      <Text
        variant="body-regular"
        numberOfLines={1}
        style={{ color: theme.colors.textSecondary }}
      >
        {subtitle}
      </Text>
    </View>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ width: 390, maxWidth: '100%', backgroundColor: theme.colors.background }}>
      {children}
    </View>
  );
}

export const Rows: Story = {
  render: () => {
    const [last, setLast] = useState<string>('—');
    return (
      <Frame>
        <View style={{ gap: 2 }}>
          {[
            ['Mireia Solans', 'Roof survey — the tiles on the north pitch'],
            ['Bastia Ferrers', 'Invoice 2214 is ready'],
            ['Tordera Studio', 'Are we still on for one o’clock?'],
          ].map(([title, subtitle]) => (
            <SwipeRow
              key={title}
              actions={ACTIONS}
              height={72}
              onAction={setLast}
              testID={`swipe-${title}`}
            >
              <Row title={title as string} subtitle={subtitle as string} />
            </SwipeRow>
          ))}
        </View>
        <Text variant="caption-1-regular" style={{ padding: 16 }}>
          {`Last action: ${last}`}
        </Text>
      </Frame>
    );
  },
};

export const OneSide: Story = {
  render: () => (
    <Frame>
      <SwipeRow
        actions={{ right: [{ key: 'archive', label: 'Archive', icon: RiArchiveLine }] }}
        height={72}
        testID="swipe-one-side"
      >
        <Row title="Vall de Nit Council" subtitle="Permit 8841: decision" />
      </SwipeRow>
    </Frame>
  ),
};

export const OwnPaint: Story = {
  render: () => {
    const theme = useTheme();
    return (
      <Frame>
        <SwipeRow
          actions={ACTIONS}
          height={72}
          radius={0}
          actionWidth={64}
          // A family that already resolved its own pairs passes them, so the
          // panes match the rest of its rows exactly.
          paint={{
            neutral: theme.colors.contrast50,
            onNeutral: theme.colors.text,
            accent: theme.colors.primary,
            onAccent: theme.colors.primaryForeground,
            negative: theme.colors.error,
            onNegative: theme.colors.primaryForeground,
          }}
          testID="swipe-own-paint"
        >
          <Row title="Pere Aguiló" subtitle="Quote for the shutters" />
        </SwipeRow>
      </Frame>
    );
  },
};
