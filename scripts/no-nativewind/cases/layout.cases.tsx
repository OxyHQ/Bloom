import { Text } from 'react-native';
import { ResizeHandle, ScrollArea, ScrollSurface, Toolbar } from '@bloom/layout';
import type { Cases } from '../support/cases';

export const CASES: Cases = {
  'ScrollArea plain': () => (
    <ScrollArea style={{ height: 200 }} contentContainerStyle={{ gap: 8, padding: 16 }}>
      <Text>Row</Text>
    </ScrollArea>
  ),
  'ScrollSurface with chrome': () => (
    <ScrollSurface
      testID="surface"
      hostStyle={{ height: 300 }}
      stickyHeader={<Text>Head</Text>}
      fadeBottom
      contentContainerStyle={{ padding: 12 }}
    >
      <Text>Body</Text>
    </ScrollSurface>
  ),
  Toolbar: () => (
    <Toolbar actions={<Text>Act</Text>} accessory={<Text>Sum</Text>} testID="tb">
      <Text>Tool</Text>
    </Toolbar>
  ),
  'ResizeHandle grip and pill': () => (
    <>
      <ResizeHandle testID="grip" onResize={() => {}} />
      <ResizeHandle testID="grip-h" orientation="horizontal" onResize={() => {}} />
      <ResizeHandle testID="pill" variant="pill" onResize={() => {}} />
    </>
  ),
};
