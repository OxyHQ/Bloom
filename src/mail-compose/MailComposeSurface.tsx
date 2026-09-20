import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';

import { Button, GlyphButton } from '../button';
import { ComposerAttachmentStrip } from '../chat-composer/ComposerAttachmentStrip';
import { useControllableState } from '../hooks/use-controllable-state';
import { RiAttachment2 } from '../icons/remix/RiAttachment2';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { RiDeleteBinLine } from '../icons/remix/RiDeleteBinLine';
import { RiExpandDiagonalSLine } from '../icons/remix/RiExpandDiagonalSLine';
import { RiSendPlaneLine } from '../icons/remix/RiSendPlaneLine';
import { RiSubtractLine } from '../icons/remix/RiSubtractLine';
import { resolveMailPaint } from '../mail-list/shared';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import {
  SurfaceLevelProvider,
  hairlineOn,
  resolveSurfaceLevel,
  useSurfaceFill,
} from '../styles/surface-levels';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  MAIL_COMPOSE_CSS,
  MAIL_COMPOSE_GEOMETRY,
  MAIL_COMPOSE_STYLE_ID,
  mailComposeStrings,
} from './shared';
import type { MailComposeSurfaceProps } from './types';

/**
 * The frame a message is written in: a title bar, the addressing block, the
 * body, and a footer holding send, attach and discard.
 *
 * TWO VARIANTS, ONE COMPONENT. `docked` is the desktop panel — its own surface,
 * its own hairline, its own radius, and a minimise that collapses it to the
 * title bar. `sheet` is the phone: it draws NO frame at all, because whatever
 * presented it already did.
 *
 * IT IS NOT AN OVERLAY AND IT NEVER POSITIONS ITSELF. There is no
 * `position: fixed` here and no portal. On a phone, mount it as a `Dialog`'s or
 * a `BottomSheet`'s child; on a desktop, park the `docked` panel wherever your
 * shell parks panels. A compose window that placed itself would be a compose
 * window that fights the app's layout in one app out of three, and Bloom
 * already owns exactly one overlay stack — this is not a second one.
 *
 * THE FORMATTING TOOLBAR IS A SLOT AND STAYS ONE. Bloom's rich-text toolbar is
 * `note-editor`'s `NoteEditorToolbar`; a second one grown here would be a
 * second one to keep in step with the first, and this family writes no
 * rich-text engine of its own — `children` is a slot for the same reason.
 *
 * THE ATTACHMENT STRIP IS `chat-composer`'s, imported rather than rebuilt. A
 * pending attachment is a pending attachment: a thumbnail, an upload ring and a
 * remove, with the ring drawn from ONE rounded-rect path helper. Two strips
 * mean two rings that close at different angles.
 */
export function MailComposeSurface({
  variant = 'docked',
  title,
  minimized,
  onMinimizedChange,
  onExpand,
  onClose,
  header,
  children,
  toolbar,
  attachments,
  onAttachmentRemove,
  onAttach,
  onSend,
  sending = false,
  sendDisabled = false,
  onDiscard,
  footer,
  strings,
  accessibilityLabel,
  style,
  testID,
}: MailComposeSurfaceProps) {
  const theme = useTheme();
  const parent = useSurfaceFill();
  useEffect(() => {
    adoptStyleSheet(MAIL_COMPOSE_STYLE_ID, MAIL_COMPOSE_CSS);
  }, []);
  const geo = MAIL_COMPOSE_GEOMETRY;
  const docked = variant === 'docked';
  // A docked panel PAINTS the card rung, so it publishes that fill and
  // everything inside it (the chips, the hairlines, the quiet text) steps off
  // what is really behind them. A sheet paints nothing and publishes nothing.
  const fill = docked ? resolveSurfaceLevel(theme, 1).background : parent;
  const paint = useMemo(() => resolveMailPaint(theme, fill), [theme, fill]);
  const text = useMemo(() => mailComposeStrings(strings), [strings]);

  const [collapsed, setCollapsed] = useControllableState<boolean>({
    value: minimized,
    defaultValue: false,
    onChange: onMinimizedChange,
  });
  const folded = docked && collapsed;
  const heading = title ?? text.title;

  const bar = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        height: geo.barHeight,
        paddingLeft: geo.paddingHorizontal,
        paddingRight: 8,
        borderBottomWidth: folded ? 0 : 1,
        borderBottomColor: hairlineOn(theme, fill),
      }}
    >
      <Text
        variant="body-semibold"
        numberOfLines={1}
        style={{ color: paint.text, flex: 1, minWidth: 0 }}
        testID={testID ? `${testID}-title` : undefined}
      >
        {heading}
      </Text>
      {docked && onMinimizedChange !== undefined ? (
        <GlyphButton
          icon={RiSubtractLine}
          size={geo.action}
          accessibilityLabel={text.minimize}
          aria-expanded={!collapsed}
          onPress={() => setCollapsed(!collapsed)}
          testID={testID ? `${testID}-minimize` : undefined}
        />
      ) : null}
      {onExpand === undefined ? null : (
        <GlyphButton
          icon={RiExpandDiagonalSLine}
          size={geo.action}
          accessibilityLabel={text.expand}
          onPress={onExpand}
          testID={testID ? `${testID}-expand` : undefined}
        />
      )}
      {onClose === undefined ? null : (
        <GlyphButton
          icon={RiCloseLine}
          size={geo.action}
          accessibilityLabel={text.close}
          onPress={onClose}
          testID={testID ? `${testID}-close` : undefined}
        />
      )}
    </View>
  );

  const body = (
    <>
      {header}
      <View style={{ flex: 1, minHeight: 0 }} testID={testID ? `${testID}-body` : undefined}>
        {children}
      </View>
      {(attachments ?? []).length > 0 ? (
        <ComposerAttachmentStrip
          attachments={attachments ?? []}
          onRemove={onAttachmentRemove}
          testID={testID ? `${testID}-attachments` : undefined}
        />
      ) : null}
      {toolbar === undefined ? null : (
        <View
          style={{ borderTopWidth: 1, borderTopColor: hairlineOn(theme, fill) }}
          testID={testID ? `${testID}-toolbar` : undefined}
        >
          {toolbar}
        </View>
      )}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingTop: 10,
          paddingBottom: 10,
          paddingLeft: geo.paddingHorizontal,
          paddingRight: geo.paddingHorizontal,
          borderTopWidth: 1,
          borderTopColor: hairlineOn(theme, fill),
        }}
      >
        {onSend === undefined ? null : (
          <Button
            variant="primary"
            size="small"
            icon={RiSendPlaneLine}
            disabled={sending || sendDisabled}
            onPress={onSend}
            testID={testID ? `${testID}-send` : undefined}
          >
            {sending ? text.sending : text.send}
          </Button>
        )}
        {onAttach === undefined ? null : (
          <GlyphButton
            icon={RiAttachment2}
            size={geo.action}
            glyphSize={geo.actionGlyph}
            accessibilityLabel={text.attach}
            onPress={onAttach}
            testID={testID ? `${testID}-attach` : undefined}
          />
        )}
        {footer}
        <View style={{ flex: 1 }} />
        {onDiscard === undefined ? null : (
          <GlyphButton
            icon={RiDeleteBinLine}
            size={geo.action}
            glyphSize={geo.actionGlyph}
            accessibilityLabel={text.discard}
            onPress={onDiscard}
            testID={testID ? `${testID}-discard` : undefined}
          />
        )}
      </View>
    </>
  );

  return (
    <SurfaceLevelProvider level={docked ? 1 : 0} fill={fill}>
      <View
        accessibilityLabel={accessibilityLabel ?? heading}
        style={[
          docked
            ? {
                backgroundColor: fill,
                borderWidth: 1,
                borderColor: hairlineOn(theme, fill),
                borderRadius: geo.radius,
                overflow: 'hidden',
              }
            : { flex: 1, minHeight: 0 },
          style,
        ]}
        testID={testID}
      >
        {bar}
        {folded ? null : body}
      </View>
    </SurfaceLevelProvider>
  );
}
