// A boolean const of a trimmed optional (`hasName`) narrows `name` where it holds (TS's aliased conditions):
// `hasName ? name : …` reads `name!`. A function whose returns (in a `switch` too) are strings or
// i18next's `t(…)` returns a `String`.
import { useTranslation } from 'react-i18next';
import { Text, VStack, view } from '@oxy.so/bloom-language';

export const Name = view(function Name({ name, handle, tab }: { name?: string; handle: string; tab: string }) {
  const { t } = useTranslation();
  const hasName = !!name?.trim();
  const primary = hasName ? name : `@${handle}`;
  const empty = () => {
    switch (tab) {
      case 'followers':
        return t('connections.emptyFollowers');
      default:
        return '';
    }
  };
  return VStack(Text(primary), Text(empty()));
});
