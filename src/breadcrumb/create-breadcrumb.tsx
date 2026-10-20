import React, {
  Children,
  cloneElement,
  forwardRef,
  Fragment,
  isValidElement,
  memo,
  useState,
} from 'react';
import { View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import { BloomScope, useBloomAppearance } from '../appearance';
import { CONTROL_LABEL_TYPE, MENU_GEOMETRY } from '../appearance/control-geometry';
import type { Button as ButtonComponent } from '../button';
import type * as Dropdown from '../dropdown-menu';
import type { ScrollArea as ScrollAreaComponent } from '../layout/ScrollArea';
import { useContainerWidth } from '../hooks/use-container-width';
import { isPlainLinkActivation } from '../hooks/link-activation';
import { useDirectionProps, useIsRtl } from '../hooks/use-is-rtl';
import { useCommonMessages } from '../locale/common-messages';
import { useMessages } from '../locale/messages';
import { useTouchInput } from '../styles/pointer';
import { IS_WEB } from '../styles/platform';
import { surfaceTextOn, useSurfaceFill } from '../styles/surface-levels';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { RiArrowRightSLine } from '../icons/remix/RiArrowRightSLine';
import { RiMoreLine } from '../icons/remix/RiMoreLine';
import { BREADCRUMB_MESSAGES } from './messages';
import { collapsedAncestorCount } from './shared';
import type { MemoRefComponent, ViewRef } from '../styles/native-refs';
import type { BreadcrumbItemProps, BreadcrumbProps } from './types';

type Dependencies = Pick<
  typeof Dropdown,
  'DropdownMenu' | 'DropdownMenuTrigger' | 'DropdownMenuContent' | 'DropdownMenuItem'
> & {
  Button: typeof ButtonComponent;
  ScrollArea: typeof ScrollAreaComponent;
};

/** Platform bindings share labels, fitting and selection; only existing primitives fork. */
export function createBreadcrumb({
  Button,
  ScrollArea,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
}: Dependencies) {
  function useGeometry(sizeProp?: BreadcrumbProps['size']) {
    const { size } = useBloomAppearance({ size: sizeProp }, { size: 'md', tone: 'neutral' });
    const touch = useTouchInput();
    return {
      size,
      height: Math.max(MENU_GEOMETRY[size].height, touch ? 44 : 0),
      icon: size === 'xs' ? 14 : size === 'lg' ? 20 : 16,
      gap: size === 'xs' ? 2 : 4,
      type: CONTROL_LABEL_TYPE[size],
    };
  }

  function Label({
    item,
    color,
    geometry,
  }: {
    item: BreadcrumbItemProps;
    color: string;
    geometry: ReturnType<typeof useGeometry>;
  }) {
    const Icon = item.icon;
    return (
      <>
        {item.leading}
        {Icon ? <Icon width={geometry.icon} height={geometry.icon} fill={color} /> : null}
        {typeof item.children === 'string' || typeof item.children === 'number' ? (
          <Text
            selectable={false}
            numberOfLines={1}
            variant={geometry.type}
            style={[{ color, flexShrink: 1, minWidth: 0 }, item.textStyle]}
          >
            {item.children}
          </Text>
        ) : (
          item.children
        )}
      </>
    );
  }

  function OverflowIcon({ icon: Icon }: { icon: NonNullable<BreadcrumbItemProps['icon']> }) {
    const geometry = useGeometry();
    const paint = surfaceTextOn(useTheme(), useSurfaceFill());
    return <Icon width={geometry.icon} height={geometry.icon} fill={paint.text} />;
  }

  function Measurement({
    item,
    onLayout,
    testID,
  }: {
    item: BreadcrumbItemProps;
    onLayout: (event: LayoutChangeEvent) => void;
    testID?: string;
  }) {
    const geometry = useGeometry(item.size);
    const paint = surfaceTextOn(useTheme(), useSurfaceFill());
    return (
      <View
        onLayout={onLayout}
        testID={testID}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingLeft: 4,
          paddingRight: 4,
          flexShrink: 0,
        }}
      >
        <Label item={item} color={paint.text} geometry={geometry} />
      </View>
    );
  }

  const BreadcrumbItem: MemoRefComponent<BreadcrumbItemProps> = memo(
    forwardRef<ViewRef, BreadcrumbItemProps>(function BreadcrumbItem(item, ref) {
      const {
        children,
        href,
        onPress,
        current = false,
        size: sizeProp,
        accessibilityLabel,
        style,
        textStyle,
        testID,
        disabled,
        trigger,
        'aria-expanded': expanded,
        'aria-haspopup': hasPopup,
      } = item;
      const geometry = useGeometry(sizeProp);
      const theme = useTheme();
      const fill = useSurfaceFill();
      const paint = surfaceTextOn(theme, fill);
      const name =
        accessibilityLabel ??
        (typeof children === 'string' || typeof children === 'number'
          ? String(children)
          : undefined);
      const rowStyle = {
        minWidth: 0,
        minHeight: geometry.height,
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 6,
        paddingLeft: 4,
        paddingRight: 4,
      };
      if (href == null && onPress == null && trigger == null) {
        return (
          <View
            ref={ref}
            role="listitem"
            {...(IS_WEB && current ? { 'aria-current': 'page' as const } : {})}
            accessibilityLabel={accessibilityLabel}
            style={[rowStyle, style]}
            testID={testID}
          >
            <Label
              item={item}
              color={current ? paint.text : paint.textSecondary}
              geometry={geometry}
            />
          </View>
        );
      }
      const control = (
        <Button
          ref={ref}
          disabled={disabled}
          aria-current={current ? 'page' : undefined}
          aria-expanded={expanded}
          aria-haspopup={hasPopup}
          appearance="plain"
          tone="neutral"
          href={href}
          underline="none"
          size={geometry.size}
          numberOfLines={1}
          textVariant={geometry.type}
          textStyle={[{ paddingLeft: 0, paddingRight: 0 }, textStyle]}
          leading={item.leading}
          leadingIcon={item.icon}
          iconSize={geometry.icon}
          accessibilityLabel={name}
          testID={testID}
          style={[
            rowStyle,
            {
              height: geometry.height,
              justifyContent: 'flex-start',
              paddingTop: 0,
              paddingBottom: 0,
            },
            style,
          ]}
          onPress={
            onPress
              ? (event: GestureResponderEvent) => {
                  if (href != null && IS_WEB) {
                    if (!isPlainLinkActivation(event)) return;
                    event.preventDefault();
                  }
                  onPress();
                }
              : undefined
          }
        >
          {children}
        </Button>
      );
      return (
        <View role="listitem" style={{ minWidth: 0, flexShrink: 1 }}>
          {trigger
            ? cloneElement(trigger, {
                asChild: true,
                style: [{ minWidth: 0, alignSelf: 'stretch' }, trigger.props.style],
                children: control,
              })
            : control}
        </View>
      );
    }),
  );

  const Breadcrumb = memo(function Breadcrumb({
    children,
    separator,
    accessibilityLabel: labelProp,
    overflow = 'scroll',
    overflowLabel,
    size: sizeProp,
    style,
    testID,
  }: BreadcrumbProps) {
    const { messages } = useMessages(BREADCRUMB_MESSAGES);
    const common = useCommonMessages();
    const label = labelProp ?? messages.breadcrumb;
    const moreLabel = overflowLabel ?? common.showMore;
    const geometry = useGeometry(sizeProp);
    const rtl = useIsRtl();
    const direction = useDirectionProps();
    const theme = useTheme();
    const fill = useSurfaceFill();
    const paint = surfaceTextOn(theme, fill);
    const { width, onLayout } = useContainerWidth();
    const [separatorWidth, setSeparatorWidth] = useState(12);
    const [measures, setMeasures] = useState<Record<string, number>>({});
    const items = Children.toArray(children).filter(isValidElement<BreadcrumbItemProps>);
    // Opaque custom children remain supported by the original scrolling composition.
    // Collapse introspects only this family's documented BreadcrumbItem children.
    const collapse =
      overflow === 'collapse' &&
      items.every(
        (item, index) =>
          item.type === BreadcrumbItem &&
          (item.props.trigger == null || index === items.length - 1) &&
          (typeof item.props.children === 'string' || typeof item.props.children === 'number'),
      );
    const keys = items.map(
      (item, index) =>
        `${item.key ?? index}:${String(item.props.children)}:${item.props.size ?? geometry.size}:${geometry.height}`,
    );
    const widths = keys.map((key) => measures[key] ?? 0);
    // At very narrow widths the decorative separator yields its space to the
    // current label; the independently focusable overflow action retains its target.
    const showSeparator = !collapse || width == null || width >= 100;
    const betweenWidth = showSeparator ? separatorWidth + geometry.gap * 2 : geometry.gap;
    const hidden = collapse
      ? collapsedAncestorCount(widths, width ?? 0, geometry.height, betweenWidth)
      : 0;
    const between = (
      <View
        aria-hidden
        onLayout={(event) => setSeparatorWidth(Math.ceil(event.nativeEvent.layout.width))}
        style={{
          width: separator == null ? 12 : undefined,
          flexShrink: 0,
          alignItems: 'center',
          ...(separator == null && rtl ? { transform: [{ scaleX: -1 }] } : {}),
        }}
      >
        {typeof separator === 'string' || typeof separator === 'number' ? (
          <Text variant={geometry.type} style={{ color: paint.textSecondary }}>
            {separator}
          </Text>
        ) : (
          (separator ?? <RiArrowRightSLine width={12} height={12} fill={paint.textSecondary} />)
        )}
      </View>
    );
    const list = (
      <View
        role="list"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          minWidth: 0,
          gap: geometry.gap,
          ...(collapse ? { flex: 1 } : {}),
        }}
      >
        {hidden > 0 ? (
          <View role="listitem" style={{ flexShrink: 0 }}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  iconOnly
                  icon={RiMoreLine}
                  appearance="plain"
                  tone="neutral"
                  accessibilityLabel={moreLabel}
                  style={{
                    width: geometry.height,
                    height: geometry.height,
                    minWidth: geometry.height,
                    minHeight: geometry.height,
                  }}
                  testID={testID ? `${testID}-overflow` : undefined}
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent label={moreLabel}>
                {items.slice(0, hidden).map((item) => (
                  <DropdownMenuItem
                    key={item.key}
                    href={item.props.href}
                    onPress={item.props.onPress}
                    disabled={
                      item.props.disabled || (item.props.href == null && item.props.onPress == null)
                    }
                    accessibilityLabel={item.props.accessibilityLabel}
                    leading={
                      item.props.leading ??
                      (item.props.icon ? <OverflowIcon icon={item.props.icon} /> : undefined)
                    }
                  >
                    {item.props.children}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </View>
        ) : null}
        {items.slice(hidden).map((item, index) => (
          <Fragment key={item.key ?? index}>
            {showSeparator && (hidden > 0 || index > 0) ? between : null}
            {collapse ? (
              <View
                style={{
                  minWidth: 0,
                  // The current control may shrink, but never grows into an
                  // empty action-sized hit area. Its trigger anchors to the label.
                  flexShrink: index === items.length - hidden - 1 ? 1 : 0,
                  flexGrow: 0,
                }}
              >
                {item}
              </View>
            ) : (
              item
            )}
          </Fragment>
        ))}
      </View>
    );
    return (
      <BloomScope size={geometry.size}>
        <View
          {...direction}
          role="navigation"
          accessibilityLabel={label}
          onLayout={onLayout}
          testID={testID}
          style={[
            { width: '100%', minWidth: 0, flexDirection: 'row', alignItems: 'center' },
            style,
          ]}
        >
          {collapse ? (
            list
          ) : (
            <ScrollArea
              horizontal
              scrollbar="never"
              style={{ minWidth: 0, flex: 1 }}
              contentContainerStyle={{ alignItems: 'center' }}
            >
              {list}
            </ScrollArea>
          )}
          {collapse ? (
            <View
              aria-hidden
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              {...(IS_WEB ? { inert: true } : {})}
              pointerEvents="none"
              style={{
                position: 'absolute',
                opacity: 0,
                top: 0,
                width: 0,
                height: 0,
                overflow: 'hidden',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {items.map((item, index) => (
                  <Measurement
                    item={item.props}
                    key={keys[index]}
                    onLayout={(event) => {
                      const next = Math.ceil(event.nativeEvent.layout.width);
                      setMeasures((prev) =>
                        prev[keys[index] ?? String(index)] === next
                          ? prev
                          : { ...prev, [keys[index] ?? String(index)]: next },
                      );
                    }}
                    testID={testID ? `${testID}-measure-${index}` : undefined}
                  />
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </BloomScope>
    );
  });
  return { Breadcrumb, BreadcrumbItem };
}
