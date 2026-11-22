// A route whose every return is a Bloom Screen: the codemod's screen() body.
import { PageHeader } from '@oxy.so/bloom/page-header';
import { Screen, ScreenScrollView } from '@oxy.so/bloom/screen';
import { Text } from '@oxy.so/bloom/typography';
import { useState } from 'react';

declare const t: (key: string) => string;

export default function SettingsRoute() {
  const [ready] = useState(true);
  if (!ready)
    return (
      <Screen>
        <Text className="text-sm text-muted-foreground">{t('settings.loading')}</Text>
      </Screen>
    );
  const header = <PageHeader title={t('settings.title')} />;
  return (
    <Screen header={header} scroll="content">
      <ScreenScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text className="text-sm">{t('settings.intro')}</Text>
      </ScreenScrollView>
    </Screen>
  );
}
