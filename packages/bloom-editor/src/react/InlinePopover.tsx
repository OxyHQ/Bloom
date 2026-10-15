import { StyleSheet, Text } from 'react-native';
import { useEditorContext } from './context';
import { BarButton } from './FormatBar';
import type { InlineTarget } from './inline-target';
import { KeepFocus } from './KeepFocus';

/**
 * Under a block whose caret is at a link or a mention: where it goes and a
 * way to follow it (clicking text in an editor places the caret, it does not
 * navigate), and removing a link.
 */
export function InlinePopover({ target }: { target: InlineTarget }) {
  const { theme, labels, controller, onOpenLink, onOpenMention } = useEditorContext();
  const open = () => {
    if (target.kind === 'link') onOpenLink(target.href);
    else onOpenMention?.(target.mention, target.text);
  };
  const canOpen = target.kind === 'link' || onOpenMention !== undefined;
  return (
    <KeepFocus
      style={[styles.popover, { backgroundColor: theme.background, borderColor: theme.border }]}
    >
      <Text style={[styles.what, { color: theme.textMuted }]} numberOfLines={1}>
        {target.kind === 'link' ? target.href : target.text}
      </Text>
      {canOpen ? (
        <BarButton label={labels.open} theme={theme} onPress={open}>
          <Text style={[styles.word, { color: theme.accent }]}>{labels.open}</Text>
        </BarButton>
      ) : null}
      {target.kind === 'link' ? (
        <BarButton label={labels.removeLink} theme={theme} onPress={() => controller.removeLink()}>
          <Text style={[styles.word, { color: theme.textMuted }]}>{labels.removeLink}</Text>
        </BarButton>
      ) : null}
    </KeepFocus>
  );
}

const styles = StyleSheet.create({
  popover: {
    position: 'absolute',
    top: '100%',
    left: 0,
    zIndex: 55,
    marginTop: 4,
    maxWidth: 360,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingLeft: 10,
    paddingRight: 2,
    paddingVertical: 2,
    borderWidth: 1,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  what: { flexShrink: 1, fontSize: 13, marginRight: 4 },
  word: { fontSize: 13 },
});
