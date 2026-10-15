import type { ToggleableMark } from '@oxy.so/bloom-text/model';
import { useState, useSyncExternalStore } from 'react';
import { Pressable, StyleSheet, Text, type TextStyle, TextInput, View } from 'react-native';
import type { EditorController } from './controller';
import { KeepFocus } from './KeepFocus';
import type { EditorLabels } from './labels';
import type { EditorTheme } from './theme';
import { useUi } from './ui-store';

const MARKS: readonly { mark: ToggleableMark; glyph: string; style: TextStyle }[] = [
  { mark: 'bold', glyph: 'B', style: { fontWeight: '700' } },
  { mark: 'italic', glyph: 'I', style: { fontStyle: 'italic' } },
  { mark: 'underline', glyph: 'U', style: { textDecorationLine: 'underline' } },
  { mark: 'strike', glyph: 'S', style: { textDecorationLine: 'line-through' } },
  { mark: 'code', glyph: '</>', style: { fontSize: 12 } },
];

export interface FormatBarProps {
  controller: EditorController;
  theme: EditorTheme;
  labels: EditorLabels;
}

/**
 * The marks and the link of the selected text: buttons that show what is
 * active and toggle it, and the link field. Used by the bubble over a
 * selection (web) and by `EditorToolbar`.
 */
export function FormatBar({ controller, theme, labels }: FormatBarProps) {
  const { ui, store } = controller;
  const selection = useSyncExternalStore(store.subscribe, () => controller.textSelection);
  const marks = useUi(ui, (s) =>
    s.marks && s.marks.blockId === selection?.blockId ? s.marks.marks : null,
  );
  const linking = useUi(ui, (s) => s.linking);
  const [url, setUrl] = useState('');
  const [invalid, setInvalid] = useState(false);

  const closeLink = (refocus: boolean) => {
    ui.set({ linking: null });
    setUrl('');
    setInvalid(false);
    if (refocus) controller.refocus();
  };

  if (linking && selection?.blockId === linking) {
    const apply = () => {
      if (controller.setLink(url)) closeLink(true);
      else setInvalid(true);
    };
    return (
      <View style={styles.row}>
        <TextInput
          autoFocus
          value={url}
          onChangeText={(next) => {
            setUrl(next);
            setInvalid(false);
          }}
          onSubmitEditing={apply}
          onKeyPress={(e) => {
            if (e.nativeEvent.key === 'Escape') closeLink(true);
          }}
          placeholder={labels.linkPlaceholder}
          placeholderTextColor={theme.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          inputMode="url"
          accessibilityLabel={labels.link}
          aria-invalid={invalid}
          style={[
            styles.field,
            { color: theme.text, borderColor: invalid ? theme.colors.red?.text : theme.border },
          ]}
        />
        <KeepFocus style={styles.row}>
          <BarButton label={labels.apply} theme={theme} onPress={apply}>
            <Text style={[styles.word, { color: theme.accent }]}>{labels.apply}</Text>
          </BarButton>
          <BarButton label={labels.cancel} theme={theme} onPress={() => closeLink(true)}>
            <Text style={[styles.word, { color: theme.textMuted }]}>{labels.cancel}</Text>
          </BarButton>
        </KeepFocus>
      </View>
    );
  }

  const hasRange = selection !== null && selection.start !== selection.end;
  return (
    <KeepFocus style={styles.row}>
      {MARKS.map(({ mark, glyph, style }) => (
        <BarButton
          key={mark}
          label={labels[mark]}
          active={marks?.[mark] === true}
          theme={theme}
          onPress={() => controller.toggleMark(mark)}
        >
          <Text style={[styles.glyph, style, { color: theme.text }]}>{glyph}</Text>
        </BarButton>
      ))}
      <BarButton
        label={marks?.link ? labels.removeLink : labels.link}
        active={marks?.link === true}
        disabled={!marks?.link && !hasRange}
        theme={theme}
        onPress={() => {
          if (marks?.link) controller.removeLink();
          else if (selection) ui.set({ linking: selection.blockId });
        }}
      >
        <Text style={[styles.word, { color: theme.text }]}>{labels.link}</Text>
      </BarButton>
    </KeepFocus>
  );
}

export function BarButton({
  label,
  active = false,
  disabled = false,
  theme,
  onPress,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  theme: EditorTheme;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active, disabled }}
      aria-pressed={active}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        (active || pressed) && { backgroundColor: theme.selection },
        disabled && styles.disabled,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  button: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.4 },
  glyph: { fontSize: 15 },
  word: { fontSize: 14 },
  field: {
    minWidth: 200,
    height: 32,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderRadius: 6,
    fontSize: 14,
    marginRight: 4,
  },
});
