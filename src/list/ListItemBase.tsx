import { ListPerson } from './ListPerson';
import { DISABLED_OPACITY } from '../styles/tokens';
import { ListCall } from './ListCall';
import { ListConversation } from './ListConversation';
import { ListMail } from './ListMail';
import { ChipRow } from '../chip';
import { memo, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View, type PressableProps } from 'react-native';
import { Checkbox } from '../checkbox';
import { openHref } from '../hooks/link-activation';
import { RiMore2Line } from '../icons/remix/RiMore2Line';
import { useCommonMessages } from '../locale/common-messages';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { mixColors } from '../styles/color-contrast';
import { IS_WEB } from '../styles/platform';
import { useTouchInput } from '../styles/pointer';
import { useSurfaceFill } from '../styles/surface-levels';
import { webDataSet } from '../styles/web-data';
import type { WebCssStyle } from '../styles/web-view-style';
import { SwipeRow, useSwipeAvailable } from '../swipe-row';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  LIST_CSS,
  LIST_STYLE_ID,
  LIST_ROW_COMPACT_GAP,
  LIST_ROW_COMPACT_INSET,
  LIST_ROW_COMPACT_MIN_HEIGHT,
  LIST_ROW_INSET,
  LIST_ROW_MIN_HEIGHT,
} from './list-style';
import type { ListAction, ListItemProps, ListItemShellProps } from './types';

type Bindings = Pick<
  typeof import('../context-menu'),
  'ContextMenu' | 'ContextMenuTrigger' | 'ContextMenuContent' | 'ContextMenuItem'
> &
  Pick<
    typeof import('../dropdown-menu'),
    'DropdownMenu' | 'DropdownMenuTrigger' | 'DropdownMenuContent' | 'DropdownMenuItem'
  > & { Button: typeof import('../button')['Button'] };

export function createListItem({
  Button,
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
}: Bindings) {
  const Shell = memo(function ListItemShell({
    density = 'comfortable',
    compactPadding = 4,
    label: labelProp,
    contextMenu,
    role,
    accessibilityHint,
    title,
    supporting,
    supportingLines = 1,
    content,
    leading,
    trailing,
    trailingMetadata = false,
    footer,
    attachments,
    disabled = false,
    active = false,
    onPress,
    onPrefetch,
    href,
    onLongPress,
    trigger,
    checked = false,
    onCheckedChange,
    selectionLabel,
    selecting = false,
    actions = [],
    swipeActions,
    fullSwipeAction,
    onAction,
    swipeEnabled,
    style,
    testID,
  }: ListItemShellProps) {
    const label = labelProp ?? (typeof title === 'string' ? title : '');
    const theme = useTheme();
    const surface = useSurfaceFill();
    const touch = useTouchInput();
    const consumedLongPress = useRef(false);
    const swipeAvailable = useSwipeAvailable();
    const common = useCommonMessages();
    useEffect(() => {
      adoptStyleSheet(LIST_STYLE_ID, LIST_CSS);
    }, []);
    const selectedFill = mixColors(surface, theme.colors.text, theme.isDark ? 0.09 : 0.06);
    // First occurrence wins: explicit commands retain their callbacks when also exposed by swipe.
    const commands = [
      ...actions,
      ...(swipeActions?.left ?? []),
      ...(swipeActions?.right ?? []),
    ].filter(
      (action, index, all) => all.findIndex((candidate) => candidate.key === action.key) === index,
    );
    const interactive = Boolean(
      onPress ||
        href ||
        onLongPress ||
        onCheckedChange ||
        trigger ||
        commands.length ||
        contextMenu,
    );
    const perform = (action: ListAction) => {
      if (disabled) return;
      action.onPress?.();
      onAction?.(action.key);
    };
    const menuLabel = common.labelFor(
      common.moreActions,
      typeof title === 'string' ? title : label,
    );
    const selection = onCheckedChange ? (
      <View
        {...webDataSet({ bloomListIdentity: '' })}
        style={{ width: 36, height: 36 }}
        testID={testID ? `${testID}-avatar` : undefined}
      >
        <View
          {...webDataSet({ bloomListSelection: '' })}
          style={{
            position: 'absolute',
            top: -4,
            left: -4,
            width: 44,
            height: 44,
            opacity: checked || !leading ? 1 : 0,
          }}
        >
          <Checkbox
            checked={checked}
            disabled={disabled}
            onCheckedChange={onCheckedChange}
            accessibilityLabel={selectionLabel ?? label}
            testID={testID ? `${testID}-check` : undefined}
            style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
          />
        </View>
        {!checked && leading ? (
          <View {...webDataSet({ bloomListPortrait: '' })} pointerEvents="none" aria-hidden>
            {leading}
          </View>
        ) : null}
      </View>
    ) : (
      leading
    );
    const compactDecorativeLeading =
      density === 'compact' && Boolean(selection) && !onCheckedChange;
    const triggerProps: PressableProps & { href?: string; 'aria-current'?: 'true' } = {
      ...webDataSet({ bloomListLink: '' }),
      ...(IS_WEB && href && !selecting ? { href } : {}),
      role: role ?? (href && !selecting ? 'link' : 'button'),
      accessibilityHint,
      'aria-checked': role === 'radio' || role === 'checkbox' ? checked : undefined,
      'aria-selected': role === 'option' ? checked : undefined,
      accessibilityLabel: label,
      disabled,
      'aria-disabled': disabled || undefined,
      accessibilityState: {
        selected: active || checked,
        checked: role === 'radio' || role === 'checkbox' ? checked : undefined,
        disabled,
      },
      'aria-current': active ? 'true' : undefined,
      accessibilityActions: commands.length
        ? commands.map((action) => ({ name: action.key, label: action.label }))
        : undefined,
      onAccessibilityAction: (event) => {
        const action = commands.find((item) => item.key === event.nativeEvent.actionName);
        if (action) perform(action);
      },
      onHoverIn: disabled ? undefined : onPrefetch,
      onFocus: disabled ? undefined : onPrefetch,
      onPressIn: disabled ? undefined : onPrefetch,
      onPress: (event) => {
        if (disabled) return;
        if (selecting && onCheckedChange) {
          event.preventDefault();
          onCheckedChange(!checked);
        } else if (onPress) {
          if (href) event.preventDefault();
          onPress();
        } else if (!IS_WEB && href) openHref(href);
      },
      // Cancel the browser's compatibility click at its touch source. A consumed
      // long press can move the layout before release, retargeting that click to
      // another row whose RNW responder never received the long press.
      ...(IS_WEB
        ? {
            onTouchStart: () => {
              consumedLongPress.current = false;
            },
            onTouchCancel: () => {
              consumedLongPress.current = false;
            },
            onTouchEnd: (event: import('react-native').GestureResponderEvent) => {
              if (consumedLongPress.current) event.preventDefault();
              consumedLongPress.current = false;
            },
          }
        : {}),
      // Keep this mounted throughout selection for RNW's own responder lifecycle.
      onLongPress: touch
        ? () => {
            if (disabled) return;
            if (IS_WEB && (onCheckedChange || onLongPress)) consumedLongPress.current = true;
            if (onCheckedChange) {
              if (!selecting) onCheckedChange(true);
            } else onLongPress?.();
          }
        : undefined,
      style: ({ pressed }) => [
        StyleSheet.absoluteFill,
        { borderRadius: 28 },
        !IS_WEB && pressed && !active && !checked ? { backgroundColor: selectedFill } : undefined,
      ],
      testID: testID ? `${testID}-link` : undefined,
    };
    const row = (
      <View
        {...webDataSet({
          bloomListRow: '',
          hasActions: String(commands.length > 0 || !!contextMenu),
          interactive: String(interactive),
          active: String(active || checked),
        })}
        testID={testID}
        style={[
          {
            opacity: disabled ? DISABLED_OPACITY : 1,
            minHeight: density === 'compact' ? LIST_ROW_COMPACT_MIN_HEIGHT : LIST_ROW_MIN_HEIGHT,
            borderRadius: 28,
            '--bloom-list-selected': selectedFill,
            '--bloom-list-ring': theme.colors.primary,
            ...(!IS_WEB
              ? { backgroundColor: active || checked ? selectedFill : 'transparent' }
              : {}),
          } as WebCssStyle,
        ]}
      >
        {(typeof trigger === 'function' ? trigger(triggerProps) : trigger) ??
          (interactive ? (
            <Pressable {...triggerProps} />
          ) : labelProp && label ? (
            <View
              accessible
              accessibilityLabel={label}
              aria-disabled={disabled || undefined}
              pointerEvents="none"
              style={StyleSheet.absoluteFill}
              testID={testID ? `${testID}-link` : undefined}
            />
          ) : null)}
        <View
          pointerEvents="box-none"
          style={{
            minHeight: density === 'compact' ? LIST_ROW_COMPACT_MIN_HEIGHT : LIST_ROW_MIN_HEIGHT,
            flexDirection: 'row',
            alignItems: 'center',
            gap: density === 'compact' ? LIST_ROW_COMPACT_GAP : 10,
            paddingHorizontal: density === 'compact' ? LIST_ROW_COMPACT_INSET : LIST_ROW_INSET,
            paddingVertical: density === 'compact' ? compactPadding : 8,
          }}
        >
          {selection ? (
            <View
              pointerEvents="box-none"
              style={{
                flexShrink: 0,
                minWidth: compactDecorativeLeading ? 0 : 36,
                // Compact decorative content gets a smaller leading column;
                // a selectable identity keeps its 36px touch target.
                minHeight: compactDecorativeLeading ? 0 : 36,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {selection}
            </View>
          ) : null}
          <View pointerEvents="box-none" style={{ flex: 1, minWidth: 0 }}>
            {content ?? (
              <View
                pointerEvents="none"
                aria-hidden={interactive || Boolean(labelProp) || undefined}
                style={{ gap: 2 }}
              >
                {typeof title === 'string' ? (
                  <Text variant="body-medium" numberOfLines={1}>
                    {title}
                  </Text>
                ) : (
                  title
                )}
                {typeof supporting === 'string' ? (
                  <Text
                    {...webDataSet({ bloomListSupporting: String(supportingLines) })}
                    variant="body-2-regular"
                    numberOfLines={supportingLines === 'adaptive' ? 3 : supportingLines}
                    style={{ color: theme.colors.textSecondary }}
                  >
                    {supporting}
                  </Text>
                ) : (
                  supporting
                )}
              </View>
            )}
          </View>
          {trailing ? (
            <View
              {...(trailingMetadata ? webDataSet({ bloomListMeta: '' }) : {})}
              pointerEvents="box-none"
            >
              {trailing}
            </View>
          ) : null}
          {(commands.length || contextMenu) && !touch && !disabled ? (
            <View
              {...webDataSet({
                bloomListActions: trailing && !trailingMetadata ? 'persistent' : '',
              })}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild label={menuLabel}>
                  <Button
                    icon={RiMore2Line}
                    iconOnly
                    tone="neutral"
                    appearance="plain"
                    accessibilityLabel={menuLabel}
                    testID={testID ? `${testID}-menu` : undefined}
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {contextMenu ??
                    commands.map((action) => (
                      <DropdownMenuItem
                        key={action.key}
                        tone={action.tone === 'negative' ? 'danger' : 'neutral'}
                        onPress={() => perform(action)}
                      >
                        {action.label}
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </View>
          ) : null}
        </View>
        {attachments ? (
          <ChipRow
            contentInset={{ start: selection ? 56 : 10, end: 10 }}
            fadeMode="mask"
            testID={testID ? `${testID}-attachments` : undefined}
          >
            {attachments}
          </ChipRow>
        ) : null}
        {footer ? (
          <View
            pointerEvents="box-none"
            style={{ paddingBottom: 8, paddingLeft: selection ? 56 : 10, paddingRight: 10 }}
            testID={testID ? `${testID}-footer` : undefined}
          >
            {footer}
          </View>
        ) : null}
      </View>
    );
    const contextual =
      touch || (!commands.length && !contextMenu) ? (
        row
      ) : (
        <ContextMenu>
          <ContextMenuTrigger
            asChild
            disabled={selecting || disabled}
            style={{ width: '100%', alignSelf: 'stretch' }}
          >
            <View role="presentation">{row}</View>
          </ContextMenuTrigger>
          <ContextMenuContent label={menuLabel} testID={testID ? `${testID}-context` : undefined}>
            {contextMenu ??
              commands.map((action) => (
                <ContextMenuItem
                  key={action.key}
                  tone={action.tone === 'negative' ? 'danger' : 'neutral'}
                  onPress={() => perform(action)}
                >
                  {action.label}
                </ContextMenuItem>
              ))}
          </ContextMenuContent>
        </ContextMenu>
      );
    // Never remount the row when selection begins: it would lose gesture ownership.
    return (
      <SwipeRow
        style={style}
        actionPresentation="bubbles"
        actions={
          disabled || selecting || !(swipeEnabled ?? swipeAvailable) ? {} : (swipeActions ?? {})
        }
        fullSwipeAction={fullSwipeAction}
        onAction={onAction}
        actionWidth={56}
        radius={28}
        background="transparent"
        testID={testID ? `${testID}-swipe` : undefined}
      >
        {contextual}
      </SwipeRow>
    );
  });
  return memo(function ListItem(props: ListItemProps) {
    if (props.person)
      return <ListPerson {...props} person={props.person} Shell={Shell} Button={Button} />;
    if (props.call) return <ListCall {...props} call={props.call} Shell={Shell} Button={Button} />;
    if (props.conversation)
      return <ListConversation {...props} conversation={props.conversation} Shell={Shell} />;
    if (props.mail) return <ListMail {...props} mail={props.mail} Shell={Shell} />;
    return <Shell {...props} />;
  });
}
