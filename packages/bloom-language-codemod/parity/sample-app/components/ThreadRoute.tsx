// A route whose Screen holds several views and a bottom bar: a Group as the screen() body's root.
import { PageHeader } from '@oxy.so/bloom/page-header';
import { Screen, ScreenScrollView } from '@oxy.so/bloom/screen';
import { Text } from '@oxy.so/bloom/typography';
import { View } from 'react-native';

declare const t: (key: string) => string;

export default function ThreadRoute({ open }: { open: boolean }) {
  if (!open)
    return (
      <Screen header={<PageHeader title={t('thread.title')} />}>
        <>
          <Text className="text-sm">{t('thread.closed')}</Text>
          <View className="p-4" />
        </>
      </Screen>
    );
  return (
    <Screen
      scroll="content"
      bottomBar={<View className="px-4 py-2 bg-card" />}
      bottomBarPlacement="overlay"
      bottomBarKeyboardBehavior="follow"
    >
      {/* The messages, then a note under them. */}
      <ScreenScrollView>
        <Text>{t('thread.first')}</Text>
      </ScreenScrollView>
      {open ? <Text className="text-xs text-muted-foreground">{t('thread.note')}</Text> : null}
    </Screen>
  );
}
