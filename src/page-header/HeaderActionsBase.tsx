import {
  Fragment,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentRef,
} from 'react';
import { Platform, View } from 'react-native';
import { UNSET } from '../styles/animated-style';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import type * as Group from '../button-group';
import type * as Menu from '../dropdown-menu';
import type { ScrollArea as ScrollAreaComponent } from '../layout/ScrollArea';
import { RiMoreFill } from '../icons/remix/RiMoreFill';
import { useCommonMessages } from '../locale/common-messages';
import { pointerEventsStyle } from '../styles/pointer-events';
import type { WebCssStyle } from '../styles/web-view-style';
import { resolveHeaderActionLayout, type HeaderActionMeasurement } from './action-layout';
import { HeaderActionsHostContext } from './context';
import type { HeaderAction, HeaderActionsProps } from './types';

type Parts = { ScrollArea: typeof ScrollAreaComponent } & Pick<
  typeof Group,
  'ButtonGroup' | 'ButtonGroupItem'
> &
  Pick<
    typeof Menu,
    | 'DropdownMenu'
    | 'DropdownMenuTrigger'
    | 'DropdownMenuContent'
    | 'DropdownMenuItem'
    | 'DropdownMenuCheckboxItem'
    | 'DropdownMenuSeparator'
  >;

const AnimatedRoot = Animated.createAnimatedComponent(View);

/** Platform bindings share command identity, packing, measurement and lifecycle. */
export function createHeaderActions({
  ScrollArea,
  ButtonGroup,
  ButtonGroupItem,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
}: Parts) {
  return function HeaderActions({
    actions,
    persistentActions,
    availableWidth,
    accessibilityLabel,
    overflowLabel,
    style,
    testID,
  }: HeaderActionsProps) {
    const common = useCommonMessages();
    const host = useContext(HeaderActionsHostContext);
    const maxWidth = useSharedValue(availableWidth ?? host?.getWidth() ?? 0);
    useLayoutEffect(() => {
      const update = () => {
        maxWidth.value = availableWidth ?? host?.getWidth() ?? 0;
      };
      update();
      return host?.subscribe(update);
    }, [host, availableWidth, maxWidth]);
    const bounded = availableWidth !== undefined || host !== null;
    const boundedStyle = useAnimatedStyle(
      () => ({ maxWidth: bounded ? (availableWidth ?? maxWidth.value) : UNSET }),
      [availableWidth, bounded, maxWidth],
    );
    const measurements = useRef(new Map<string, HeaderActionMeasurement>());
    const [measurementRevision, revise] = useState(0);
    const [ownWidth, setOwnWidth] = useState(0);
    const [triggerWidth, setTriggerWidth] = useState(0);
    const [persistentWidth, setPersistentWidth] = useState(0);
    const [open, setOpen] = useState(false);
    const [retainedMenu, setRetainedMenu] = useState<readonly string[]>([]);
    const trigger = useRef<ComponentRef<typeof View>>(null);
    const root = useRef<ComponentRef<typeof View>>(null);
    const label = overflowLabel ?? common.more;
    const subscribe = host?.subscribe ?? (() => () => {});
    // A snapshot is a packing decision, not a width. A live resize which fits
    // the same commands does not re-render this component or its consumer.
    const snapshot = () =>
      JSON.stringify(
        resolveHeaderActionLayout(
          actions,
          measurements.current,
          Math.max(
            0,
            (availableWidth ?? host?.getWidth() ?? ownWidth) -
              (persistentActions ? persistentWidth + 8 : 0) -
              4,
          ),
          triggerWidth,
          0,
        ),
      );
    const encoded = useSyncExternalStore(subscribe, snapshot, snapshot);
    const plan = useMemo(
      () => JSON.parse(encoded) as ReturnType<typeof resolveHeaderActionLayout>,
      [encoded, measurementRevision],
    );
    const menuIds = new Set(open ? [...retainedMenu, ...plan.overflow] : plan.overflow);
    const menuActions = actions.filter(
      (action) => action.visible !== false && menuIds.has(action.id),
    );
    const compact = new Set(plan.compact);
    const hidden = new Set(
      actions
        .filter((action) => action.visible === false || menuIds.has(action.id))
        .map(({ id }) => id),
    );
    const measuring: WebCssStyle = {
      position: 'absolute',
      top: 0,
      left: 0,
      ...(Platform.OS === 'web' ? { visibility: 'hidden' } : { opacity: 0 }),
    };
    const measure = (id: string, mode: keyof HeaderActionMeasurement, width: number) => {
      if (width <= 0) return;
      const previous = measurements.current.get(id);
      if (previous?.[mode] === width) return;
      measurements.current.set(id, {
        full: previous?.full ?? width,
        compact: previous?.compact ?? width,
        [mode]: width,
      });
      revise((value) => value + 1);
    };
    useLayoutEffect(() => {
      if (!open) return;
      setRetainedMenu((previous) => {
        const next = [...new Set([...previous, ...plan.overflow])];
        return next.length === previous.length ? previous : next;
      });
    }, [open, encoded]);
    const focusedBeforeCommit =
      Platform.OS === 'web'
        ? (root.current as unknown as HTMLElement | null)?.ownerDocument.activeElement
        : null;
    const focusedIdBeforeCommit =
      typeof Element !== 'undefined' && focusedBeforeCommit instanceof Element
        ? focusedBeforeCommit
            .closest('[data-header-action-id]')
            ?.getAttribute('data-header-action-id')
        : null;
    const previousHidden = useRef<ReadonlySet<string>>(new Set());
    useLayoutEffect(() => {
      if (Platform.OS === 'web') {
        const id = focusedIdBeforeCommit;
        if (id && hidden.has(id) && !previousHidden.current.has(id)) {
          (trigger.current as unknown as HTMLElement | null)
            ?.querySelector<HTMLElement>('[role="button"],button')
            ?.focus();
        }
      }
      previousHidden.current = hidden;
    }, [encoded, open]);
    const command = (action: HeaderAction, iconOnly: boolean, measurement = false) => (
      <ButtonGroupItem
        leadingIcon={action.icon}
        iconOnly={Boolean(action.icon) && iconOnly}
        accessibilityLabel={action.label}
        selected={measurement || hidden.has(action.id) ? undefined : action.selected}
        loading={measurement ? false : action.busy}
        disabled={measurement || action.disabled || action.busy}
        onPress={measurement ? undefined : action.onPress}
        testID={!measurement && testID ? `${testID}-${action.id}` : undefined}
      >
        {action.label}
      </ButtonGroupItem>
    );
    if (!persistentActions && actions.every((action) => action.visible === false)) return null;
    return (
      <AnimatedRoot
        ref={root}
        style={[
          { minWidth: 0, flexShrink: 1, maxWidth: '100%' },
          !host && availableWidth === undefined ? { width: '100%' } : undefined,
          boundedStyle,
          style,
        ]}
        onLayout={
          host || availableWidth !== undefined
            ? undefined
            : (event) => setOwnWidth(event.nativeEvent.layout.width)
        }
        testID={testID}
      >
        {/* Only Bloom's stateless controls are measured here, never consumer trees.
            Hidden geometry controls have no callbacks, focus or accessibility. */}
        <View
          aria-hidden
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[measuring, pointerEventsStyle('none')]}
          {...(Platform.OS === 'web' ? { inert: true } : {})}
        >
          {actions
            .filter((action) => action.visible !== false)
            .map((action) => (
              <View key={action.id} style={{ flexDirection: 'row' }}>
                <View
                  testID={testID ? `${testID}-measure-${action.id}-full` : undefined}
                  onLayout={(event) => measure(action.id, 'full', event.nativeEvent.layout.width)}
                >
                  {command(action, false, true)}
                </View>
                <View
                  testID={testID ? `${testID}-measure-${action.id}-compact` : undefined}
                  onLayout={(event) =>
                    measure(action.id, 'compact', event.nativeEvent.layout.width)
                  }
                >
                  {command(action, true, true)}
                </View>
              </View>
            ))}
          <View
            // A column child otherwise stretches to the widest full+compact probe.
            // Packing must reserve this icon button's width, not that column.
            style={{ alignSelf: 'flex-start' }}
            testID={testID ? `${testID}-measure-overflow` : undefined}
            onLayout={(event) => setTriggerWidth(event.nativeEvent.layout.width)}
          >
            <ButtonGroupItem
              iconOnly
              leadingIcon={RiMoreFill}
              accessibilityLabel={label}
              disabled
            />
          </View>
        </View>
        <ScrollArea
          horizontal
          style={{ flexGrow: 0, minWidth: 0, maxWidth: '100%' }}
          contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
        >
          {persistentActions != null ? (
            <View onLayout={(event) => setPersistentWidth(event.nativeEvent.layout.width)}>
              {persistentActions}
            </View>
          ) : null}
          <DropdownMenu
            open={open}
            onOpenChange={(next) => {
              if (next) setRetainedMenu(plan.overflow);
              setOpen(next);
            }}
          >
            <ButtonGroup
              dividers={false}
              material="lens"
              accessibilityLabel={accessibilityLabel ?? common.moreActions}
              testID={testID ? `${testID}-group` : undefined}
            >
              {actions.map((action) => (
                <View
                  key={action.id}
                  {...(Platform.OS === 'web' ? { dataSet: { headerActionId: action.id } } : {})}
                  aria-hidden={hidden.has(action.id)}
                  accessibilityElementsHidden={hidden.has(action.id)}
                  importantForAccessibility={hidden.has(action.id) ? 'no-hide-descendants' : 'auto'}
                  style={hidden.has(action.id) ? { display: 'none' } : undefined}
                >
                  {command(action, compact.has(action.id) || action.labelVisibility === 'hidden')}
                </View>
              ))}
              <View
                ref={trigger}
                collapsable={false}
                style={menuActions.length || open ? undefined : { display: 'none' }}
              >
                <DropdownMenuTrigger asChild label={label}>
                  <ButtonGroupItem
                    iconOnly
                    leadingIcon={RiMoreFill}
                    accessibilityLabel={label}
                    testID={testID ? `${testID}-overflow` : undefined}
                  />
                </DropdownMenuTrigger>
              </View>
            </ButtonGroup>
            <DropdownMenuContent label={label} align="end">
              {menuActions.map((action, index) => (
                <Fragment key={action.id}>
                  {index > 0 && menuActions[index - 1]?.group !== action.group ? (
                    <DropdownMenuSeparator />
                  ) : null}
                  {action.selected !== undefined ? (
                    <DropdownMenuCheckboxItem
                      checked={action.selected}
                      onCheckedChange={action.onPress}
                      disabled={action.disabled || action.busy}
                      aria-busy={action.busy || undefined}
                      accessibilityLabel={action.label}
                      testID={testID ? `${testID}-menu-${action.id}` : undefined}
                    >
                      {action.label}
                    </DropdownMenuCheckboxItem>
                  ) : (
                    <DropdownMenuItem
                      onPress={action.onPress}
                      disabled={action.disabled || action.busy}
                      aria-busy={action.busy || undefined}
                      accessibilityLabel={action.label}
                      leading={action.icon ? <action.icon /> : undefined}
                      testID={testID ? `${testID}-menu-${action.id}` : undefined}
                    >
                      {action.label}
                    </DropdownMenuItem>
                  )}
                </Fragment>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </ScrollArea>
      </AnimatedRoot>
    );
  };
}
