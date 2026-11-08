import type { ToggleableMark } from '@oxy.so/bloom-text/model';
import { type ComponentRef, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Platform, StyleSheet, Text, type TextInput, type TextStyle, View } from 'react-native';
import { Button } from '@oxy.so/bloom/button';
import { TextFieldInput } from '@oxy.so/bloom/text-field';
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
  { mark: 'code', glyph: '</>', style: {} },
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
  const formatActions = useUi(ui, (s) => s.formatActions);
  const urlInput = useRef<ComponentRef<typeof TextInput>>(null);
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
    setUrl(editingLink ? (controller.linkAtSelection() ?? '') : '');
    setInvalid(false);
  }, [editingLink, controller]);
  // A collapsed selection has nothing to colour.
  useEffect(() => {
    if (!hasRange) setPalette(false);
  }, [hasRange]);

  const closeLink = (refocus: boolean) => {
    // EnrichedTextInput focuses its native host directly, outside RN's
    // TextInputState. Release our URL field first so its unmount cleanup cannot
    // blur/hide the keyboard after the deliberate handoff back to the editor.
    if (refocus && Platform.OS !== 'web') urlInput.current?.blur();
    controller.cancelLinkEditor();
    setUrl('');
    setInvalid(false);
    if (refocus) controller.refocus();
  };

  if (editingLink) {
    const apply = () => {
      if (controller.applyLinkDraft(url)) closeLink(true);
      else setInvalid(true);
    };
    return (
      <KeepFocus owner={controller} style={[styles.row, styles.wrap]}>
        <TextFieldInput
          inputRef={urlInput}
          autoFocus
          label={labels.link}
          invalid={invalid}
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
        <KeepFocus owner={controller} style={styles.row}>
          <BarButton
            label={labels.apply}
            theme={theme}
            textStyle={{ color: theme.accent }}
            onPress={apply}
          >
            {labels.apply}
          </BarButton>
          <BarButton label={labels.cancel} theme={theme} onPress={() => closeLink(true)}>
            {labels.cancel}
          </BarButton>
        </KeepFocus>
      </KeepFocus>
    );
  }

  if (palette && hasRange) {
    const choose = (name: string, kind: 'color' | 'background') => {
      controller.setTextColor(name, kind);
      setPalette(false);
    };
    return (
      <KeepFocus owner={controller} style={styles.palette}>
        <View style={[styles.row, styles.wrap]}>
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
        <View style={[styles.row, styles.wrap]}>
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
    <KeepFocus owner={controller} style={styles.row}>
      {MARKS.map(({ mark, glyph, style }) => (
        <BarButton
          key={mark}
          label={labels[mark]}
          active={marks?.[mark] === true}
          theme={theme}
          textStyle={style}
          onPress={() => controller.toggleMark(mark)}
        >
          {glyph}
        </BarButton>
      ))}
      <BarButton
        label={Platform.OS === 'web' && marks?.link ? labels.removeLink : labels.link}
        active={marks?.link === true}
        disabled={!marks?.link && !hasRange}
        theme={theme}
        onPress={() => {
          if (Platform.OS === 'web' && marks?.link) controller.removeLink();
          else controller.openLinkEditor();
        }}
      >
        {labels.link}
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
      {hasRange && formatActions.length > 0 ? (
        <>
          <View style={[styles.separator, { backgroundColor: theme.border }]} />
          {formatActions.map((action) => (
            <BarButton
              key={action.id}
              label={action.label}
              theme={theme}
              onPress={() => {
                const current = controller.textSelection;
                if (!current || current.start === current.end) return;
                action.onPress({
                  blockId: current.blockId,
                  start: Math.min(current.start, current.end),
                  end: Math.max(current.start, current.end),
                });
              }}
            >
              {action.icon ? action.icon({ color: theme.text, size: ICON_SIZE }) : action.label}
            </BarButton>
          ))}
        </>
      ) : null}
    </KeepFocus>
  );
}

/** The size an application's format action draws its icon at. */
const ICON_SIZE = 16;

export function BarButton({
  label,
  active,
  disabled = false,
  theme,
  textStyle,
  onPress,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  theme: EditorTheme;
  textStyle?: TextStyle;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      appearance="plain"
      material="flat"
      colors={{ background: theme.selection, foreground: theme.text }}
      accessibilityRole="button"
      accessibilityLabel={label}
      numberOfLines={1}
      style={styles.control}
      pressed={active}
      textStyle={textStyle}
      disabled={disabled}
      onPress={onPress}
    >
      {children}
    </Button>
  );
}

const styles = StyleSheet.create({
  control: { maxWidth: '100%' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    minWidth: 0,
    maxWidth: '100%',
  },
  wrap: { flexWrap: 'wrap', gap: 4, minWidth: 0 },
  glyph: { fontSize: 15 },
  colorGlyph: { fontWeight: '600', borderBottomWidth: 2, lineHeight: 18 },
  palette: { gap: 2 },
  paletteLabel: { fontWeight: '600', width: '100%' },
  swatchGlyph: { fontSize: 15, fontWeight: '600' },
  swatch: { width: 18, height: 18, borderRadius: 4, borderWidth: 1 },
  separator: { width: StyleSheet.hairlineWidth, height: 20, marginHorizontal: 4 },
  field: { flexGrow: 1, flexBasis: 160, minWidth: 0 },
});
