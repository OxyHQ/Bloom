// A sample of the patterns the codemod meets in apps, for its own parity suite.
import { Button } from '@oxy.so/bloom/button';
import { Switch } from '@oxy.so/bloom/switch';
import { RiArrowRightLine } from '@oxy.so/bloom/icons/RiArrowRightLine';
import { RiHeart3Line } from '@oxy.so/bloom/icons/RiHeart3Line';
import { Text } from '@oxy.so/bloom/typography';
import { Pressable, Text as NativeText, View } from 'react-native';

export function Row({
  title,
  count,
  onOpen,
}: {
  title: string;
  count: number;
  onOpen: () => void;
}) {
  return (
    <Pressable onPress={onOpen} className="flex-row items-center gap-3 px-4 py-3 active:opacity-70">
      <RiHeart3Line size="sm" />
      <View className="gap-1">
        <Text variant="body-semibold" numberOfLines={1}>
          {title}
        </Text>
        <Text className="text-sm text-muted-foreground">{count} likes</Text>
      </View>
    </Pressable>
  );
}

export function Card({
  children,
  on,
  setOn,
}: {
  children: React.ReactNode;
  on: boolean;
  setOn: (on: boolean) => void;
}) {
  return (
    <View className="rounded-2xl overflow-hidden border border-border bg-surface p-4 md:p-6">
      <Text className="font-semibold text-foreground">Card</Text>
      {children}
      <Switch checked={on} onCheckedChange={setOn} size="sm" accessibilityLabel="Notify" />
      <Button appearance="subtle" size="sm" trailingIcon={RiArrowRightLine} onPress={() => {}}>
        {'Next'}
      </Button>
    </View>
  );
}

export function Section({ items, open }: { items: string[]; open: boolean }) {
  return (
    <View className="gap-2 border-b border-border pb-3">
      {open ? <View className="h-10 w-full bg-muted" /> : null}
      {items.length > 0 && <View className="h-px bg-border" />}
      {items.map((item) => (
        <View key={item} className="flex-row justify-between">
          <Text className="text-xs uppercase tracking-wide text-muted-foreground">{item}</Text>
        </View>
      ))}
    </View>
  );
}

export function Unconverted() {
  return (
    <View className="flex-1 mt-2">
      <NativeText className="text-sm">{"React Native's own Text"}</NativeText>
      <View className="rounded-xl bg-card" style={{ height: 4 }} />
    </View>
  );
}

export function Tab({
  label,
  active,
  onSelect,
}: {
  label: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <Pressable
      onPress={onSelect}
      className={
        active ? 'rounded-full bg-primary px-3 py-1.5' : 'rounded-full bg-muted px-3 py-1.5'
      }
    >
      <Text
        className={`text-sm ${active ? 'font-semibold text-primary-foreground' : 'font-medium text-foreground'}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Scrim() {
  return <View pointerEvents="none" className="h-10 w-full rounded-lg bg-muted" />;
}

export function PassThrough({ children }: { children: React.ReactNode }) {
  return (
    <View pointerEvents="box-none" className="p-2">
      <View pointerEvents="box-only" className="h-10 w-full rounded-lg bg-muted" />
      {children}
    </View>
  );
}
