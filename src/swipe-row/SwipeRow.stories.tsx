import type React from 'react';
import { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { RiArchiveLine } from '../icons/remix/RiArchiveLine';
import { RiCheckDoubleLine } from '../icons/remix/RiCheckDoubleLine';
import { RiDeleteBinLine } from '../icons/remix/RiDeleteBinLine';
import { RiTimeLine } from '../icons/remix/RiTimeLine';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { SwipeRow } from './SwipeRow';
import { Button } from '../button';
import { ListItem } from '../list';
import { alert } from '../surfaces';
import { ChipRow, Chip } from '../chip';
import type { SwipeRowActions } from './types';

/**
 * A drag is the only way to see these stories work. In a browser, press inside
 * a row and move the pointer sideways — gesture-handler reads real pointer
 * events, so a mouse drag is the same gesture a thumb makes.
 */
const meta: Meta = {
  id: 'base-swipe-row',
  title: 'Components/Actions/Swipe Row',
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
  return <ListItem title={title} supporting={subtitle} />;
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
    const [dismissed, setDismissed] = useState<string[]>([]);
    return (
      <Frame>
        <Text variant="body-2-regular" style={{ padding: 16 }}>
          {
            'Drag to reveal the bubbles. Keep dragging to expand an action; release to confirm, or drag back to cancel.'
          }
        </Text>
        <View style={{ gap: 2 }}>
          {[
            ['Mireia Solans', 'Roof survey — the tiles on the north pitch'],
            ['Bastia Ferrers', 'Invoice 2214 is ready'],
            ['Tordera Studio', 'Are we still on for one o’clock?'],
          ]
            .filter(([title]) => !dismissed.includes(title!))
            .map(([title, subtitle]) => (
              <SwipeRow
                actionPresentation="bubbles"
                actionWidth={56}
                radius={28}
                key={title}
                actions={ACTIONS}
                height={56}
                fullSwipeAction={{ left: 'read', right: 'delete' }}
                onAction={(action) => {
                  setLast(`${title}: ${action}`);
                  if (action === 'delete') setDismissed((items) => [...items, title!]);
                }}
                testID={`swipe-${title}`}
              >
                <Row title={title as string} subtitle={subtitle as string} />
              </SwipeRow>
            ))}
        </View>
        <Text variant="caption-1-regular" style={{ padding: 16 }}>
          {`Last action: ${last}`}
        </Text>
        {dismissed.length ? (
          <Button
            appearance="subtle"
            tone="neutral"
            onPress={() => {
              setDismissed([]);
              setLast('—');
            }}
          >
            {'Reset demo'}
          </Button>
        ) : null}
      </Frame>
    );
  },
};

export const OneSide: Story = {
  render: () => (
    <Frame>
      <SwipeRow
        actionPresentation="bubbles"
        actionWidth={56}
        radius={28}
        actions={{ right: [{ key: 'archive', label: 'Archive', icon: RiArchiveLine }] }}
        height={56}
        onAction={(action) => alert('Row action', action)}
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
          actionPresentation="bubbles"
          actionWidth={56}
          radius={28}
          actions={ACTIONS}
          height={56}
          // A family that already resolved its own pairs passes them, so the
          // bubbles match the rest of its rows exactly.
          paint={{
            neutral: theme.colors.contrast50,
            onNeutral: theme.colors.text,
            accent: theme.colors.primary,
            onAccent: theme.colors.primaryForeground,
            negative: theme.colors.error,
            onNegative: theme.colors.primaryForeground,
          }}
          onAction={(action) => alert('Row action', action)}
          testID="swipe-own-paint"
        >
          <Row title="Pere Aguiló" subtitle="Quote for the shutters" />
        </SwipeRow>
      </Frame>
    );
  },
};

export const HorizontalContent: Story = {
  render: () => {
    const [openCount, setOpenCount] = useState(0);
    const [attachmentCount, setAttachmentCount] = useState(0);
    return (
      <Frame>
        <SwipeRow
          actionPresentation="bubbles"
          actionWidth={56}
          radius={28}
          actions={ACTIONS}
          onAction={(action) => alert('Row action', action)}
          onOpenChange={(side) => {
            if (side) setOpenCount((count) => count + 1);
          }}
          testID="scroll-swipe"
        >
          <Row
            title="Drag this header"
            subtitle="The attachment rail keeps its own touch gesture"
          />
          <ChipRow testID="scroll-rail">
            {Array.from({ length: 8 }, (_, index) => `Attachment ${index + 1}.pdf`).map((name) => (
              <Chip
                key={name}
                testID={`scroll-attachment-${name}`}
                onPress={() => setAttachmentCount((count) => count + 1)}
              >
                {name}
              </Chip>
            ))}
          </ChipRow>
        </SwipeRow>
        <Text testID="scroll-open-count">{String(openCount)}</Text>
        <Text testID="scroll-attachment-count">Attachments opened: {attachmentCount}</Text>
        <View style={{ height: 1500 }} />
      </Frame>
    );
  },
};
