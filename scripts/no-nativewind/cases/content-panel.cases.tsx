import { Text } from 'react-native';
import { ContentPanel } from '@bloom/content-panel';
import type { Cases } from '../support/cases';

export const CASES: Cases = {
  'ContentPanel responsive (phone, unframed)': () => (
    <ContentPanel>
      <Text>Body</Text>
    </ContentPanel>
  ),
  'ContentPanel framed, fill': () => (
    <ContentPanel framed fill>
      <Text>Body</Text>
    </ContentPanel>
  ),
  'ContentPanel framed border, styled': () => (
    <ContentPanel
      framed
      chrome="border"
      surfaceStyle={{ backgroundColor: '#eef0f1' }}
      contentStyle={{ padding: 12 }}
    >
      <Text>Body</Text>
    </ContentPanel>
  ),
  'ContentPanel plain, never framed': () => (
    <ContentPanel appearance="plain" framed={false}>
      <Text>Body</Text>
    </ContentPanel>
  ),
  'ContentPanel framed from 500, chrome none': () => (
    <ContentPanel framed chrome="none" framedFrom={500}>
      <Text>Body</Text>
    </ContentPanel>
  ),
};
