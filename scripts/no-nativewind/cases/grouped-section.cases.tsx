import { GroupedSection, GroupedSectionItem } from '@bloom/grouped-section';
import type { Cases } from '../support/cases';

const noop = () => {};

export const CASES: Cases = {
  'GroupedSection rows': () => (
    <GroupedSection title="Account" footer="Changes apply on every device.">
      <GroupedSectionItem title="Language" value="English" onPress={noop} />
      <GroupedSectionItem title="Backups" description="Every night" showChevron />
      <GroupedSectionItem title="Sign out" destructive onPress={noop} />
    </GroupedSection>
  ),
  'GroupedSection compact': () => (
    <GroupedSection title="General" density="compact" footer="Shown in the menu bar.">
      <GroupedSectionItem title="Appearance" description="Follows the system" onPress={noop} />
    </GroupedSection>
  ),
};
