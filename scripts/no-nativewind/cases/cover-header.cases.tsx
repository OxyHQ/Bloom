import { Text } from 'react-native';
import { CoverHeader } from '@bloom/cover-header';
import type { Cases } from '../support/cases';

export const CASES: Cases = {
  'CoverHeader without a cover': () => (
    <CoverHeader coverHeight={160}>
      <Text>Profile</Text>
    </CoverHeader>
  ),
};
