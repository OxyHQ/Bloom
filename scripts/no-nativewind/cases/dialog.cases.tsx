import { Text } from 'react-native';
import { DetailDialogSection, DetailDialogSectionGroup } from '@bloom/dialog';
import type { Cases } from '../support/cases';

export const CASES: Cases = {
  'DetailDialogSection group': () => (
    <DetailDialogSectionGroup testID="group">
      <DetailDialogSection label="Status">
        <Text>Open</Text>
      </DetailDialogSection>
      <DetailDialogSection label="Owner">
        <Text>Ana</Text>
        <Text>Ben</Text>
      </DetailDialogSection>
    </DetailDialogSectionGroup>
  ),
};
