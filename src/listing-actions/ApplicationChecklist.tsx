import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { ActionCardShell } from '../booking/ActionCard';
import { Badge } from '../badge';
import { Button, type ButtonIconComponent } from '../button';
import { resolveButtonRamps } from '../button/shared';
import { RiCheckboxBlankCircleLine } from '../icons/remix/RiCheckboxBlankCircleLine';
import { RiCheckboxCircleFill } from '../icons/remix/RiCheckboxCircleFill';
import { RiCloseCircleFill } from '../icons/remix/RiCloseCircleFill';
import { RiEyeLine } from '../icons/remix/RiEyeLine';
import { RiTimeLine } from '../icons/remix/RiTimeLine';
import { RiUploadLine } from '../icons/remix/RiUploadLine';
import { resolveAccentColors } from '../theme/accent-colors';
import { Text } from '../typography';
import { APPLICATION_CHECKLIST_MAX_WIDTH, APPLICATION_ITEM_STATUS } from './constants';
import { useActionPalette } from './parts';
import type { ApplicationChecklistProps, ApplicationItem, ApplicationItemStatus } from './types';

const STATUS_ICON: Record<ApplicationItemStatus, ButtonIconComponent> = {
  missing: RiCheckboxBlankCircleLine,
  uploaded: RiTimeLine,
  verified: RiCheckboxCircleFill,
  rejected: RiCloseCircleFill,
};

/** An item counts towards progress once it is uploaded or verified. */
export function isApplicationItemReady(item: ApplicationItem): boolean {
  return item.status === 'uploaded' || item.status === 'verified';
}

/**
 * The documents a rental application needs, and where each one stands.
 *
 *   header     title headline-semibold; "{done} of {total} ready"
 *              body-2-regular text-secondary on the right
 *   progress   12 below; 6 tall, radius 3, neutral-200 / 700 track, accent-500
 *              fill — a `progressbar` over uploaded + verified items
 *   rows       16 below, 1px hairlines between; each: a 20 status glyph
 *              (missing neutral, in review accent, verified success, rejected
 *              error), title body-medium + subtle status `Badge`, the
 *              description body-2-regular text-secondary — or the rejection
 *              reason in the error colour — and a small secondary action
 *              (Upload / View / Replace) on the right
 */
function ApplicationChecklistComponent({
  title = 'Your application',
  items,
  onItemAction,
  formatProgress = (done, total) => `${done} of ${total} ready`,
  statusLabels,
  footer,
  maxWidth = APPLICATION_CHECKLIST_MAX_WIDTH,
  style,
  testID,
}: ApplicationChecklistProps) {
  const palette = useActionPalette();
  const { theme } = palette;
  const { accent, neutral } = useMemo(() => resolveButtonRamps(theme), [theme]);
  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);
  const done = items.filter(isApplicationItemReady).length;
  const total = items.length;
  const progressText = formatProgress(done, total);

  const glyphColor = (status: ApplicationItemStatus) =>
    status === 'missing'
      ? palette.textSecondary
      : resolveAccentColors(
          theme.colors,
          status === 'uploaded' ? 'primary' : status === 'verified' ? 'success' : 'error',
          'outlined',
        ).foreground;
  const errorText = resolveAccentColors(theme.colors, 'error', 'outlined').foreground;

  return (
    <ActionCardShell testID={testID} maxWidth={maxWidth} style={style}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 12 }}>
        {title != null ? (
          <Text
            variant="headline-semibold"
            accessibilityRole="header"
            style={{ flex: 1, minWidth: 0, color: palette.text }}
          >
            {title}
          </Text>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        <Text
          variant="body-2-regular"
          importantForAccessibility="no"
          accessibilityElementsHidden
          testID={id('progress-text')}
          style={{ color: palette.textSecondary, fontVariant: ['tabular-nums'] }}
        >
          {progressText}
        </Text>
      </View>

      <View
        accessibilityRole="progressbar"
        accessibilityLabel={title ?? 'Application progress'}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-valuetext={progressText}
        testID={id('progress')}
        style={{
          marginTop: 12,
          height: 6,
          borderRadius: 3,
          overflow: 'hidden',
          backgroundColor: theme.isDark ? neutral[700] : neutral[200],
        }}
      >
        <View
          testID={id('progress-fill')}
          style={{
            width: `${total > 0 ? (done / total) * 100 : 0}%`,
            height: '100%',
            borderRadius: 3,
            backgroundColor: accent[500],
          }}
        />
      </View>

      <View style={{ marginTop: 8 }}>
        {items.map((item, index) => {
          const info = APPLICATION_ITEM_STATUS[item.status];
          const Glyph = STATUS_ICON[item.status];
          const actionLabel = item.actionLabel === undefined ? info.action : item.actionLabel;
          const onAction = item.onAction ?? (onItemAction ? () => onItemAction(item) : undefined);
          const rejected = item.status === 'rejected';
          const detail = rejected && item.reason ? item.reason : item.description;
          return (
            <View
              key={item.key}
              testID={id(`item-${item.key}`)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingTop: 14,
                paddingBottom: 14,
                borderTopWidth: index === 0 ? 0 : 1,
                borderTopColor: palette.border,
              }}
            >
              <View style={{ alignSelf: 'flex-start', paddingTop: 1 }}>
                <Glyph width={20} height={20} fill={glyphColor(item.status)} />
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 8, rowGap: 4 }}>
                  <Text variant="body-medium" style={{ color: palette.text, flexShrink: 1 }}>
                    {item.title}
                  </Text>
                  <Badge
                    variant="subtle"
                    color={info.tone}
                    size="small"
                    content={statusLabels?.[item.status] ?? info.label}
                    testID={id(`item-${item.key}-status`)}
                  />
                </View>
                {detail ? (
                  <Text
                    variant="body-2-regular"
                    testID={id(`item-${item.key}-detail`)}
                    style={{ color: rejected && item.reason ? errorText : palette.textSecondary }}
                  >
                    {detail}
                  </Text>
                ) : null}
              </View>
              {actionLabel ? (
                <Button
                  variant={item.status === 'missing' || rejected ? 'primary' : 'secondary'}
                  size="small"
                  leadingIcon={item.status === 'missing' || rejected ? RiUploadLine : RiEyeLine}
                  onPress={onAction}
                  accessibilityLabel={`${actionLabel} ${item.title}`}
                  testID={id(`item-${item.key}-action`)}
                >
                  {actionLabel}
                </Button>
              ) : null}
            </View>
          );
        })}
      </View>

      {footer != null ? <View style={{ marginTop: 16 }}>{footer}</View> : null}
    </ActionCardShell>
  );
}

export const ApplicationChecklist = memo(ApplicationChecklistComponent);
ApplicationChecklist.displayName = 'ApplicationChecklist';
