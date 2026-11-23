import type { ReactNode } from 'react';
import { StyleSheet, type TextStyle, View } from 'react-native';
import { createTokenStyles } from '../theme/color-tokens';
import { TYPE } from './styles';
import { Text } from '../typography';
import type { ProjectBoardCardContentProps } from './types';

const styles = StyleSheet.create({
  root: { width: '100%', flexDirection: 'column' },
  body: { width: '100%', flexDirection: 'column', gap: 8, padding: 12 },
  header: {
    minHeight: 22,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerText: { flex: 1, minWidth: 0 },
  content: { flexDirection: 'column', alignItems: 'flex-start', gap: 8 },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  copy: { width: '100%', flexDirection: 'column', gap: 5 },
});

const useTextStyles = createTokenStyles((t) => ({
  // body-2-medium, the secondary text colour.
  secondary: { ...TYPE.caption, color: t.mutedForeground },
  // body-medium, the primary text colour; its 14px lost to Text's own 13px.
  primary: { lineHeight: TYPE.body.lineHeight, fontWeight: 500, color: t.foreground },
}));

function text(value: ReactNode, style: TextStyle) {
  return typeof value === 'string' || typeof value === 'number' ? (
    <Text style={style}>{value}</Text>
  ) : (
    value
  );
}

/** The template card's content geometry; the board owns material and dragging. */
export function ProjectBoardCardContent({
  preview,
  header,
  actions,
  badges,
  title,
  description,
  children,
  footer,
  testID,
}: ProjectBoardCardContentProps) {
  const textStyles = useTextStyles();
  return (
    <View testID={testID} style={styles.root}>
      {preview}
      <View style={styles.body}>
        {(header != null || actions != null) && (
          <View style={styles.header}>
            <View style={styles.headerText}>{text(header, textStyles.secondary)}</View>
            {actions}
          </View>
        )}
        <View style={styles.content}>
          {badges != null && <View style={styles.badges}>{badges}</View>}
          {(title != null || description != null) && (
            <View style={styles.copy}>
              {text(title, textStyles.primary)}
              {text(description, textStyles.secondary)}
            </View>
          )}
          {children}
        </View>
        {footer}
      </View>
    </View>
  );
}
