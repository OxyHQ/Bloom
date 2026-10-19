import type { ToggleableMark } from '@oxy.so/bloom-text/model';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Pressable, StyleSheet, Text, type TextStyle, TextInput, View } from 'react-native';
import type { EditorController } from './controller';
import { KeepFocus } from './KeepFocus';
import type { EditorLabels } from './labels';
import { BLOCK_COLOR_NAMES, type EditorTheme } from './theme';
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
  const [palette, setPalette] = useState(false);
  // The colours where the selection starts, for the palette to show.
  const colors = useSyncExternalStore(store.subscribe, () => {
    const { color, background } = controller.textColors();
    return `${color ?? 'default'}|${background ?? 'default'}`;
  });
  const [currentColor, currentBackground] = colors.split('|');
  const hasRange = selection !== null && selection.start !== selection.end;
  const editingLink = linking !== null && selection?.blockId === linking;

  // The link field opens on the link already there (⌘K on a link edits it).
  useEffect(() => {
    if (editingLink) setUrl(controller.linkAtSelection() ?? '');
  }, [editingLink, controller]);
  // A collapsed selection has nothing to colour.
  useEffect(() => {
    if (!hasRange) setPalette(false);
  }, [hasRange]);

  const closeLink = (refocus: boolean) => {
    ui.set({ linking: null });
    setUrl('');
    setInvalid(false);
    if (refocus) controller.refocus();
  };

  if (editingLink) {
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

  if (palette && hasRange) {
    const choose = (name: string, kind: 'color' | 'background') => {
      controller.setTextColor(name, kind);
      setPalette(false);
    };
    return (
      <KeepFocus style={styles.palette}>
        <View style={styles.row}>
          <Text style={[styles.paletteLabel, { color: theme.textMuted }]}>{labels.color}</Text>
          {BLOCK_COLOR_NAMES.map((name) => (
            <BarButton
              key={`c-${name}`}
              label={`${labels.color}: ${labels.colorNames[name] ?? name}`}
              active={currentColor === name}
              theme={theme}
              onPress={() => choose(name, 'color')}
            >
              <Text
                style={[
                  styles.swatchGlyph,
                  { color: name === 'default' ? theme.text : theme.colors[name]?.text },
                ]}
              >
                A
              </Text>
            </BarButton>
          ))}
        </View>
        <View style={styles.row}>
          <Text style={[styles.paletteLabel, { color: theme.textMuted }]}>{labels.background}</Text>
          {BLOCK_COLOR_NAMES.map((name) => (
            <BarButton
              key={`b-${name}`}
              label={`${labels.background}: ${labels.colorNames[name] ?? name}`}
              active={currentBackground === name}
              theme={theme}
              onPress={() => choose(name, 'background')}
            >
              <View
                style={[
                  styles.swatch,
                  {
                    borderColor: theme.border,
                    backgroundColor: theme.colors[name]?.background ?? theme.background,
                  },
                ]}
              />
            </BarButton>
          ))}
        </View>
      </KeepFocus>
    );
  }

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
      <BarButton
        label={labels.textColor}
        active={currentColor !== 'default' || currentBackground !== 'default'}
        disabled={!hasRange}
        theme={theme}
        onPress={() => setPalette(true)}
      >
        <Text
          style={[
            styles.glyph,
            styles.colorGlyph,
            {
              color:
                currentColor !== undefined && currentColor !== 'default'
                  ? theme.colors[currentColor]?.text
                  : theme.text,
              borderBottomColor:
                currentBackground !== undefined && currentBackground !== 'default'
                  ? theme.colors[currentBackground]?.text
                  : theme.textMuted,
            },
          ]}
        >
          A
        </Text>
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
  colorGlyph: { fontWeight: '600', borderBottomWidth: 2, lineHeight: 18 },
  palette: { gap: 2 },
  paletteLabel: { fontSize: 11, fontWeight: '600', width: 72, paddingLeft: 6 },
  swatchGlyph: { fontSize: 15, fontWeight: '600' },
  swatch: { width: 18, height: 18, borderRadius: 4, borderWidth: 1 },
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
