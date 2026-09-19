import React, { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Button } from '../button';
import { ACCENT_TABLE, colorRamp, DANGER_TABLE } from '../button/shared';
import { Chip } from '../chip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../dropdown-menu';
import { RiAddLine } from '../icons/remix/RiAddLine';
import { RiMoreFill } from '../icons/remix/RiMoreFill';
import { useControllableState } from '../hooks/use-controllable-state';
import { Switch } from '../switch';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { useSettingsPalette } from './context';
import type { SettingsPalette } from './palette';
import { SettingsCard, SettingsRow, SettingsSection, settingsRingVars, useSettingsRowIsLast } from './SettingsRows';
import type {
  SettingsMcpServer,
  SettingsMenuAction,
  SettingsServerListProps,
  SettingsServerTone,
  SettingsToolsPageProps,
} from './types';
import { useSettingsWebCss } from './web-css';
import { webDataSet } from '../styles/web-data';

/**
 * The Tools page (`settings/settings-tools.tsx`) — MCP server management:
 *
 *   scopes   gray pill tabs (px 8 py 5, radius 10, body-medium; selected
 *            background/tertiary + text/primary on a thumb that slides 300ms
 *            `cubic-bezier(0.34, 1.2, 0.64, 1)`; hover background/primary/hover),
 *            scrolling sideways with a 4px bleed
 *   auth     one Switch row
 *   servers  rows py 10 pr 10 gap 10, hairline except the last: 32px radius-8
 *            letter tile (body-2-medium) with a 10px status dot ringed 2px in
 *            the card colour at its bottom-left; name (body-medium) + quiet
 *            "Logout" (body-2-regular text/tertiary → text/secondary); summary
 *            line with a 16px up/down chevron that expands the tool chips (caption
 *            chips, 6 apart, 42px indent, 300ms ease-out) — or "Error – Show
 *            Output"; a 28px "…" menu (radius 6, icon/secondary, hover
 *            background/secondary/hover)
 *   new      "New MCP Server" row: 32px background/tertiary tile with a 20px plus
 *   team     empty state: background/secondary radius 16, px 24 py 32, gap 12
 *   sections 24 apart, labels inset 8
 */

const EASE_OUT = Easing.bezier(0, 0, 0.2, 1);
const THUMB_EASE = Easing.bezier(0.34, 1.2, 0.64, 1);

const DEFAULT_SERVER_ACTIONS: SettingsMenuAction[] = [
  { id: 'output', label: 'Show output' },
  { id: 'refresh', label: 'Refresh tools' },
  { id: 'remove', label: 'Remove server' },
];

/** The tile swatches (`bg-*-200 text-*-700`), from the theme's hues. */
function tileColors(tone: SettingsServerTone, theme: Theme, palette: SettingsPalette) {
  const pair = (color: string, table = ACCENT_TABLE) => {
    const ramp = colorRamp(color, table);
    return { background: ramp[200], foreground: ramp[700] };
  };
  switch (tone) {
    case 'primary':
      return { background: palette.accent[200], foreground: palette.accent[700] };
    case 'secondary':
      return pair(theme.colors.secondary);
    case 'tertiary':
      return pair(theme.colors.tertiary);
    case 'success':
      return pair(theme.colors.success);
    case 'warning':
      return pair(theme.colors.warning);
    case 'error':
      return pair(theme.colors.error, DANGER_TABLE);
    case 'info':
      return pair(theme.colors.info);
    case 'inverse':
      return { background: palette.neutral[950], foreground: '#ffffff' };
    default:
      return { background: palette.tertiary, foreground: palette.textSecondary };
  }
}

/** A chevron-up-down glyph (16px, 1.5 stroke). */
function ChevronUpDown({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path
        d="M5 9.99934L7.46967 12.469C7.76256 12.7619 8.23744 12.7619 8.53033 12.469L11 9.99934"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M5 5.99934L7.46967 3.52967C7.76256 3.23678 8.23744 3.23678 8.53033 3.52967L11 5.99934"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
//  Collapse — `grid-rows-[0fr → 1fr]` + opacity, 300ms ease-out
// ---------------------------------------------------------------------------

function Collapse({ open, children }: { open: boolean; children: ReactNode }) {
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(open);
  const progress = useSharedValue(open ? 1 : 0);
  const measured = useSharedValue(0);

  useEffect(() => {
    if (open) setMounted(true);
    const target = open ? 1 : 0;
    if (reducedMotion) {
      progress.value = target;
      if (!open) setMounted(false);
      return;
    }
    progress.value = withTiming(target, { duration: 300, easing: EASE_OUT }, (finished) => {
      'worklet';
      if (finished && target === 0) runOnJS(setMounted)(false);
    });
  }, [open, reducedMotion, progress]);

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      measured.value = event.nativeEvent.layout.height;
    },
    [measured],
  );
  const style = useAnimatedStyle(
    () => ({
      opacity: progress.value,
      height: progress.value >= 1 ? 'auto' : progress.value * measured.value,
    }),
    [progress, measured],
  );
  if (!mounted) return null;
  return (
    <Animated.View style={[{ overflow: 'hidden' }, style]}>
      <View onLayout={onLayout}>{children}</View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
//  Pieces
// ---------------------------------------------------------------------------

function InlineAction({ label, onPress, accessibilityLabel }: { label: string; onPress?: () => void; accessibilityLabel: string }) {
  const palette = useSettingsPalette();
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      role="button"
      accessibilityLabel={accessibilityLabel}
      {...webDataSet({ bloomSettingsPress: '' })}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={styles.inlineAction}
    >
      <Text
        variant="body-2-regular"
        numberOfLines={1}
        style={{ color: hovered ? palette.textSecondary : palette.textTertiary }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ServerTile({ server }: { server: SettingsMcpServer }) {
  const theme = useTheme();
  const palette = useSettingsPalette();
  const colors = tileColors(server.tone ?? 'neutral', theme, palette);
  const initial = server.initial ?? server.name.charAt(0).toUpperCase();
  return (
    <View style={styles.tileHost}>
      <View style={[styles.tile, { backgroundColor: colors.background }]}>
        <Text variant="body-2-medium" style={{ color: colors.foreground }}>
          {initial}
        </Text>
      </View>
      <View
        aria-hidden
        style={[
          styles.statusDot,
          {
            borderColor: palette.secondary,
            backgroundColor:
              server.status === 'connected' ? palette.success[500] : palette.danger[600],
          },
        ]}
      />
    </View>
  );
}

function ServerMenu({
  server,
  actions,
  onAction,
}: {
  server: SettingsMcpServer;
  actions: SettingsMenuAction[];
  onAction?: (serverId: string, actionId: string) => void;
}) {
  const palette = useSettingsPalette();
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const label = `Actions for ${server.name}`;
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild label={label} style={CENTERED}>
        <Pressable
          role="button"
          accessibilityLabel={label}
          {...webDataSet({ bloomSettingsPress: '' })}
          onHoverIn={() => setHovered(true)}
          onHoverOut={() => setHovered(false)}
          style={[
            styles.menuTrigger,
            { backgroundColor: open || hovered ? palette.secondaryHover : 'transparent' },
          ]}
        >
          <RiMoreFill width={16} height={16} fill={palette.iconSecondary} />
        </Pressable>
      </DropdownMenuTrigger>
      <DropdownMenuContent label={label} align="end" minWidth={180} maxWidth={180}>
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.id}
            leading={
              action.icon ? <action.icon width={18} height={18} fill={palette.iconSecondary} /> : undefined
            }
            onPress={() => onAction?.(server.id, action.id)}
          >
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ServerRow({
  server,
  actions,
  onServerAction,
  onLogout,
  onShowOutput,
  testID,
}: {
  server: SettingsMcpServer;
  actions: SettingsMenuAction[];
  onServerAction?: (serverId: string, actionId: string) => void;
  onLogout?: (serverId: string) => void;
  onShowOutput?: (serverId: string) => void;
  testID?: string;
}) {
  const palette = useSettingsPalette();
  const last = useSettingsRowIsLast();
  const [expanded, setExpanded] = useState(false);
  const [chevronHovered, setChevronHovered] = useState(false);
  const hasTools = server.tools !== undefined && server.tools.length > 0;
  return (
    <View
      testID={testID}
      style={[
        styles.serverRow,
        { borderBottomWidth: last ? 0 : 1, borderBottomColor: palette.separator },
      ]}
    >
      <View style={styles.serverMain}>
        <ServerTile server={server} />
        <View style={styles.serverText}>
          <View style={styles.serverName}>
            <Text variant="body-medium" numberOfLines={1} style={{ color: palette.text }}>
              {server.name}
            </Text>
            <InlineAction
              label="Logout"
              accessibilityLabel={`Log out of ${server.name}`}
              onPress={() => onLogout?.(server.id)}
            />
          </View>
          {server.status === 'connected' ? (
            <View style={styles.statusLine}>
              <Text
                variant="body-2-regular"
                numberOfLines={1}
                style={[styles.shrink, { color: palette.textSecondary }]}
              >
                {server.summary}
              </Text>
              {hasTools ? (
                <Pressable
                  role="button"
                  accessibilityLabel={`${expanded ? 'Hide' : 'Show'} ${server.name} tools`}
                  aria-expanded={expanded}
                  accessibilityState={{ expanded }}
                  {...webDataSet({ bloomSettingsPress: '' })}
                  onPress={() => setExpanded((v) => !v)}
                  onHoverIn={() => setChevronHovered(true)}
                  onHoverOut={() => setChevronHovered(false)}
                  testID={testID ? `${testID}-expand` : undefined}
                  style={styles.chevron}
                >
                  <ChevronUpDown color={chevronHovered ? palette.iconSecondary : palette.iconTertiary} />
                </Pressable>
              ) : null}
            </View>
          ) : (
            <View style={styles.statusLine}>
              <Text variant="body-2-regular" style={{ color: palette.textSecondary }}>
                Error
              </Text>
              <Text variant="body-2-regular" style={{ color: palette.textTertiary }}>
                –
              </Text>
              <InlineAction
                label="Show Output"
                accessibilityLabel={`Show ${server.name} output`}
                onPress={() => onShowOutput?.(server.id)}
              />
            </View>
          )}
        </View>
        <ServerMenu server={server} actions={actions} onAction={onServerAction} />
      </View>
      {hasTools ? (
        <Collapse open={expanded}>
          <View style={styles.tools} testID={testID ? `${testID}-tools` : undefined}>
            {server.tools?.map((tool) => (
              <Chip
                key={tool}
                size="small"
                style={{ backgroundColor: palette.secondary }}
                textStyle={{ color: palette.textSecondary }}
              >
                {tool}
              </Chip>
            ))}
          </View>
        </Collapse>
      ) : null}
    </View>
  );
}

function NewServerRow({
  label,
  description,
  onPress,
}: {
  label: string;
  description: string;
  onPress?: () => void;
}) {
  const palette = useSettingsPalette();
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      role="button"
      accessibilityLabel={label}
      {...webDataSet({ bloomSettingsPress: '', ringInset: '' })}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={styles.newRow}
    >
      <View style={[styles.tile, { backgroundColor: hovered ? palette.tertiaryHover : palette.tertiary }]}>
        <RiAddLine width={20} height={20} fill={palette.iconSecondary} />
      </View>
      <View style={styles.serverText}>
        <Text variant="body-medium" numberOfLines={1} style={{ color: palette.text }}>
          {label}
        </Text>
        <Text variant="body-2-regular" numberOfLines={1} style={{ color: palette.textSecondary }}>
          {description}
        </Text>
      </View>
    </Pressable>
  );
}

/** A card of MCP server rows, optionally ending in "New MCP Server". */
export function SettingsServerList({
  servers,
  onAddServer,
  addServerLabel = 'New MCP Server',
  addServerDescription = 'Add a Custom MCP Server',
  actions = DEFAULT_SERVER_ACTIONS,
  onServerAction,
  onLogout,
  onShowOutput,
  testID,
}: SettingsServerListProps) {
  return (
    <SettingsCard testID={testID}>
      {servers.map((server) => (
        <ServerRow
          key={server.id}
          server={server}
          actions={actions}
          onServerAction={onServerAction}
          onLogout={onLogout}
          onShowOutput={onShowOutput}
          testID={testID ? `${testID}-${server.id}` : undefined}
        />
      ))}
      {onAddServer ? (
        <NewServerRow label={addServerLabel} description={addServerDescription} onPress={onAddServer} />
      ) : null}
    </SettingsCard>
  );
}

// ---------------------------------------------------------------------------
//  Scope pills — a gray `PillTabList`
// ---------------------------------------------------------------------------

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

function ScopePills({
  scopes,
  value,
  onChange,
}: {
  scopes: SettingsToolsPageProps['scopes'];
  value: string;
  onChange: (id: string) => void;
}) {
  const palette = useSettingsPalette();
  const reducedMotion = useReducedMotion();
  const [boxes, setBoxes] = useState<Record<string, Box>>({});
  const [hovered, setHovered] = useState<string | null>(null);
  const x = useSharedValue(0);
  const w = useSharedValue(0);
  const h = useSharedValue(0);
  const shown = useSharedValue(0);
  const box = boxes[value];

  useEffect(() => {
    if (!box) return;
    const animate = shown.value === 1 && !reducedMotion;
    const cfg = { duration: 300, easing: THUMB_EASE };
    x.value = animate ? withTiming(box.x, cfg) : box.x;
    w.value = animate ? withTiming(box.width, cfg) : box.width;
    h.value = box.height;
    shown.value = 1;
  }, [box, reducedMotion, x, w, h, shown]);

  const thumb = useAnimatedStyle(
    () => ({ opacity: shown.value, width: w.value, height: h.value, transform: [{ translateX: x.value }] }),
    [x, w, h, shown],
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      {...webDataSet({ bloomSettingsScroll: '' })}
      style={styles.pillScroller}
      contentContainerStyle={styles.pillList}
    >
      <View role="group" aria-label="Project scope" style={styles.pillRow}>
        <Animated.View
          pointerEvents="none"
          style={[styles.pillThumb, { backgroundColor: palette.tertiary }, thumb]}
        />
        {scopes.map((scope) => {
          const selected = scope.id === value;
          return (
            <Pressable
              key={scope.id}
              role="button"
              accessibilityLabel={scope.label}
              aria-pressed={selected}
              accessibilityState={{ selected }}
              {...webDataSet({ bloomSettingsPress: '' })}
              onPress={() => onChange(scope.id)}
              onHoverIn={() => setHovered(scope.id)}
              onHoverOut={() => setHovered((cur) => (cur === scope.id ? null : cur))}
              onLayout={(event) => {
                const { x: bx, y, width, height } = event.nativeEvent.layout;
                setBoxes((prev) => ({ ...prev, [scope.id]: { x: bx, y, width, height } }));
              }}
              style={[
                styles.pill,
                { backgroundColor: !selected && hovered === scope.id ? palette.primaryHover : 'transparent' },
              ]}
            >
              <Text
                variant="body-medium"
                numberOfLines={1}
                style={{ color: selected ? palette.text : palette.textSecondary }}
              >
                {scope.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
//  Page
// ---------------------------------------------------------------------------

export function SettingsToolsPage({
  scopes,
  scope: scopeProp,
  defaultScope,
  onScopeChange,
  waitForAuthentication,
  onWaitForAuthenticationChange,
  teamServers = [],
  onManageTeam,
  onConfigureTeam,
  pluginServers,
  onAddServer,
  serverActions = DEFAULT_SERVER_ACTIONS,
  onServerAction,
  onLogout,
  onShowOutput,
  style,
  testID,
}: SettingsToolsPageProps) {
  useSettingsWebCss();
  const palette = useSettingsPalette();
  const [scopeId, setScopeId] = useControllableState<string>({
    value: scopeProp,
    defaultValue: defaultScope ?? scopes[0]?.id ?? '',
    onChange: onScopeChange,
  });
  const scope = scopes.find((s) => s.id === scopeId) ?? scopes[0];
  const listProps = { actions: serverActions, onServerAction, onLogout, onShowOutput };

  return (
    <View testID={testID} style={[styles.page, settingsRingVars(palette), style]}>
      {scopes.length > 0 ? <ScopePills scopes={scopes} value={scope?.id ?? ''} onChange={setScopeId} /> : null}

      <SettingsSection label="Authentication" inset={8}>
        <SettingsCard>
          <SettingsRow
            label="Wait for MCP Authentication"
            description="Wait indefinitely to authenticate when prompted. When off, skip authentication prompts after 30 seconds."
          >
            <Switch
              value={waitForAuthentication}
              onValueChange={onWaitForAuthenticationChange}
              accessibilityLabel="Wait for MCP authentication"
            />
          </SettingsRow>
        </SettingsCard>
      </SettingsSection>

      {scope ? (
        <SettingsSection
          label={`${scope.label} MCP Servers`}
          description={`Servers available from ${scope.label}.`}
          inset={8}
        >
          <SettingsServerList
            servers={scope.servers}
            onAddServer={onAddServer ?? NOOP}
            testID={testID ? `${testID}-scope` : undefined}
            {...listProps}
          />
        </SettingsSection>
      ) : null}

      <SettingsSection
        label="Team MCP Servers"
        description="Configured in the dashboard"
        inset={8}
        action={
          <Button variant="secondary" size="small" onPress={onManageTeam}>
            Manage
          </Button>
        }
      >
        {teamServers.length > 0 ? (
          <SettingsServerList servers={teamServers} {...listProps} />
        ) : (
          <View style={[styles.empty, { backgroundColor: palette.secondary }]}>
            <View style={styles.emptyText}>
              <Text variant="body-medium" style={[styles.center, { color: palette.text }]}>
                No Team MCP Servers
              </Text>
              <Text variant="body-2-regular" style={[styles.center, styles.emptyBody, { color: palette.textSecondary }]}>
                Configure MCP servers in the dashboard to make them available on desktop and in the
                cloud.
              </Text>
            </View>
            <Button variant="secondary" size="small" onPress={onConfigureTeam}>
              Configure Team MCP Servers
            </Button>
          </View>
        )}
      </SettingsSection>

      {pluginServers && pluginServers.length > 0 ? (
        <SettingsSection label="Plugin MCP Servers" inset={8}>
          <SettingsServerList servers={pluginServers} {...listProps} />
        </SettingsSection>
      ) : null}
    </View>
  );
}

function NOOP() {}

const styles = StyleSheet.create({
  page: {
    width: '100%',
    gap: 24,
  },
  pillScroller: {
    marginLeft: -4,
    marginRight: -4,
    flexGrow: 0,
  },
  pillList: {
    paddingLeft: 4,
    paddingRight: 4,
  },
  pillRow: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pillThumb: {
    position: 'absolute',
    left: 0,
    top: 0,
    borderRadius: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 5,
    paddingBottom: 5,
    borderRadius: 10,
    flexShrink: 0,
  },
  inlineAction: {
    borderRadius: 4,
  },
  tileHost: {
    position: 'relative',
    width: 32,
    height: 32,
    flexShrink: 0,
  },
  tile: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statusDot: {
    position: 'absolute',
    // `-bottom-0.5 -left-0.5` for the 10px dot, minus its 2px ring.
    bottom: -4,
    left: -4,
    width: 14,
    height: 14,
    borderRadius: 9999,
    borderWidth: 2,
  },
  serverRow: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingRight: 10,
  },
  serverMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  serverText: {
    flex: 1,
    minWidth: 0,
  },
  serverName: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  statusLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shrink: {
    flexShrink: 1,
  },
  chevron: {
    width: 16,
    height: 16,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  menuTrigger: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tools: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 8,
    paddingLeft: 42,
  },
  newRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    paddingTop: 10,
    paddingBottom: 10,
    paddingRight: 10,
  },
  empty: {
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    paddingLeft: 24,
    paddingRight: 24,
    paddingTop: 32,
    paddingBottom: 32,
  },
  emptyText: {
    alignItems: 'center',
    gap: 4,
  },
  emptyBody: {
    maxWidth: 360,
  },
  center: {
    textAlign: 'center',
  },
});

/** Trigger slots default to `alignSelf: flex-start`; these sit centred in their row. */
const CENTERED = { alignSelf: 'center' } as const;
