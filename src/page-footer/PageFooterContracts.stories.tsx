import { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button';
import { ChatComposer } from '../chat-composer/ChatComposer.web';
import { RiSearchLine } from '../icons/remix';
import { BottomEdgeProvider } from '../layout';
import { Text } from '../typography';
import { PageFooter, PageFooterProvider, usePageFooterInset } from './index';

/** Standalone anchor/input measurements, deliberately outside Screen's placement contract. */
const meta: Meta = {
  id: 'page-footer-contracts',
  title: 'Labs/Layout/Page Footer Contracts',
  parameters: { layout: 'fullscreen', bloomScroll: 'document', controls: { disable: true } },
};
export default meta;
type Story = StoryObj;

/** Document scrolling and a focus-controlled composer in a resizable column. */
function DocumentComposerPage() {
  const [wideRail, setWideRail] = useState(false);
  const [rtl, setRtl] = useState(false);
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState('');
  const [picked, setPicked] = useState('');
  const clearance = usePageFooterInset();
  return (
    <View style={{ flexDirection: rtl ? 'row-reverse' : 'row', minHeight: 1800 }}>
      <View style={{ width: wideRail ? 160 : 56, flexShrink: 0 }} testID="document-rail">
        <Button onPress={() => setWideRail((value) => !value)}>Resize rail</Button>
        <Button onPress={() => setRtl((value) => !value)}>Mirror layout</Button>
      </View>
      <View style={{ flex: 1, minWidth: 0 }} testID="document-column">
        <View style={{ minHeight: 1800, paddingBottom: clearance }}>
          <Text>Selected: {picked}</Text>
          <Text testID="document-clearance">{clearance}</Text>
        </View>
        <PageFooter position="document" scrim="none" testID="document-footer">
          <ChatComposer
            testID="document-composer"
            value={draft}
            onValueChange={setDraft}
            barStyle={{ borderRadius: 32, minHeight: 64, paddingLeft: 16, paddingRight: 16 }}
            inputStyle={{ fontSize: 16, lineHeight: 24 }}
            maxLines={4}
            sendIcon={RiSearchLine}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onSend={setPicked}
            suggestions={focused ? [{ id: 'one', label: 'First choice' }] : []}
            onSelectSuggestion={(suggestion) => {
              setPicked(suggestion.label);
              setDraft(suggestion.label);
            }}
          />
        </PageFooter>
      </View>
    </View>
  );
}
export const DocumentComposer: Story = {
  parameters: { layout: 'fullscreen', bloomScroll: 'document' },
  render: () => (
    <BottomEdgeProvider>
      <PageFooterProvider>
        <DocumentComposerPage />
      </PageFooterProvider>
    </BottomEdgeProvider>
  ),
};
