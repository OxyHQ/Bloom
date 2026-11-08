import { Platform, StyleSheet, Text } from 'react-native';
import { LinkButton } from '@oxy.so/bloom/button';
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
    <KeepFocus owner={controller} style={styles.popover}>
      <Text style={[styles.what, { color: theme.textMuted }]} numberOfLines={1}>
        {target.kind === 'link' ? target.href : target.text}
      </Text>
      {target.kind === 'link' ? (
        <LinkButton
          href={target.href}
          accessibilityLabel={labels.open}
          onPress={(event) => {
            if (Platform.OS === 'web') {
              const click = event as unknown as MouseEvent;
              if (
                click.metaKey ||
                click.ctrlKey ||
                click.shiftKey ||
                click.altKey ||
                click.button !== 0
              )
                return;
              click.preventDefault();
            }
            open();
          }}
        >
          {labels.open}
        </LinkButton>
      ) : canOpen ? (
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
  popover: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  what: { flexShrink: 1, fontSize: 13, marginRight: 4 },
  word: { fontSize: 13 },
});
