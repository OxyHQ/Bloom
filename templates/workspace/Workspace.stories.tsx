import React, { useState } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../../src/button';
import { Card, CardBody } from '../../src/card';
import { ContactProfileCard } from '../../src/contact-card';
import { LeadScoreCard } from '../../src/lead-score';
import { MailList } from '../../src/mail-list';
import type { MailSummary } from '../../src/mail-list';
import { NoteCard } from '../../src/note-card';
import { DealCard } from '../../src/pipeline';
import { SurfaceLevelProvider } from '../../src/styles/surface-levels';
import { useTheme } from '../../src/theme/use-theme';
import { Text } from '../../src/typography';

const messages: MailSummary[] = [
  { id: 'proposal', sender: { name: 'Elena Vidal' }, subject: 'The next chapter', snippet: 'The proposal is ready. A few thoughts before we meet on Thursday…', time: '10:42', unread: true },
  { id: 'studio', sender: { name: 'Studio North' }, subject: 'Autumn collection', snippet: 'Sharing the first direction for the new collection.', time: '09:15', labels: [{ id: 'design', name: 'Design', tone: 'primary' }] },
  { id: 'team', sender: { name: 'Marc Soler' }, subject: 'See you on Thursday', snippet: 'I have added the notes from our last conversation.', time: 'Yesterday' },
];

function Workspace({ compactMail = false, showLeadScore = true }: { compactMail?: boolean; showLeadScore?: boolean }) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const narrow = width < 800;
  const [selectedId, setSelectedId] = useState<string>();
  const [notes, setNotes] = useState(['A little space to think', 'Next steps']);
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: narrow ? 16 : 32, gap: 28, alignItems: 'center' }}>
      <View style={{ width: '100%', maxWidth: 1280, gap: 28 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <View style={{ gap: 6 }}>
            <Text variant="title-1-bold">Your workspace</Text>
            <Text style={{ color: colors.textSecondary }}>Good things start with a conversation.</Text>
          </View>
          <Button tone="action" onPress={() => setNotes((items) => [...items, `New note ${items.length - 1}`])}>New note</Button>
        </View>
        <View style={{ flexDirection: narrow ? 'column' : 'row', alignItems: 'flex-start', gap: 24 }}>
          <View style={{ width: narrow ? '100%' : 340, gap: 24 }}>
            <ContactProfileCard
              name="Elena Vidal"
              role="Creative director"
              company="Studio North"
              channels={[{ kind: 'email', onPress: () => setSelectedId('proposal') }]}
              headline={{ label: 'Open pipeline', value: '€48,000', delta: '+2 projects' }}
              stats={[{ value: '3', label: 'Projects' }, { value: 'Thursday', label: 'Next meeting' }]}
              tags={['Design', 'Partner']}
              owner={{ name: 'Alex Morgan' }}
            />
            {showLeadScore && <LeadScoreCard
              score={82}
              accessibilityLabel="Studio North lead score"
              factors={[{ label: 'A shared direction', contribution: 24 }, { label: 'Proposal reviewed', contribution: 18 }, { label: 'Budget pending', contribution: -6 }]}
              trend={{ label: '+8 this week', direction: 'up' }}
            />}
          </View>
          <View style={{ flex: narrow ? undefined : 1, width: narrow ? '100%' : undefined, minWidth: 0, gap: 24 }}>
            <Card>
              <SurfaceLevelProvider level={1} fill={colors.card}>
                <CardBody style={{ padding: 20, gap: 16 }}>
                  <Text variant="title-3-semibold">Conversations</Text>
                  <MailList mails={messages} selectedId={selectedId} onMailPress={setSelectedId} density={compactMail ? 'compact' : 'comfortable'} accessibilityLabel="Recent conversations" />
                  {selectedId && <Text style={{ color: colors.textSecondary }}>{messages.find((mail) => mail.id === selectedId)?.snippet}</Text>}
                </CardBody>
              </SurfaceLevelProvider>
            </Card>
            <View style={{ gap: 12 }}>
              <Text variant="title-3-semibold">On your mind</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                {notes.map((title, index) => <View key={title} style={{ flexGrow: 1, flexBasis: 240, minWidth: 0 }}>
                  <NoteCard title={title} excerpt={index === 0 ? 'Warm materials, a slower pace, and room for the details that matter.' : 'Bring the latest sketches. Agree on the first milestone and make space for feedback.'} tags={index === 0 ? ['Ideas'] : ['Studio North']} meta={{ edited: 'Just now' }} />
                </View>)}
              </View>
            </View>
            <DealCard title="Autumn identity" account="Studio North" amount="€24,000" stage="Proposal" health="on-track" closeDate="Closes 30 Sep" owner={{ name: 'Alex Morgan' }} />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const meta = {
  title: 'Templates/Workspace',
  component: Workspace,
  parameters: { layout: 'fullscreen' },
  args: { compactMail: false, showLeadScore: true },
  argTypes: { compactMail: { control: 'boolean' }, showLeadScore: { control: 'boolean' } },
} satisfies Meta<typeof Workspace>;
export default meta;
type Story = StoryObj<typeof meta>;
export const TonalOlive: Story = { globals: { theme: 'dark', colorPreset: 'olive' } };
export const TonalCopper: Story = { globals: { theme: 'dark', colorPreset: 'copper-field' } };
export const Light: Story = { globals: { theme: 'light', colorPreset: 'olive' } };
