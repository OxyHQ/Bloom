import { type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { useAppShell, useAppShellPanel } from '../app-shell/hooks';
import { ButtonGroup, ButtonGroupItem } from '../button-group';
import { PageHeader } from '../page-header';
import { RiCodeSLine } from '../icons/remix/RiCodeSLine';
import { RiMenuLine } from '../icons/remix/RiMenuLine';
import { useControllableState } from '../hooks/use-controllable-state';
import { useMessages } from '../locale/messages';
import { useCommonMessages } from '../locale/common-messages';
import { useCssSafeAreaInsets, NO_SAFE_AREA_INSETS } from '../hooks/use-css-safe-area-insets';
import { BottomBarSlotContext } from '../layout/bottom-bar-slot';
import { AI_CHAT_MESSAGES } from './messages';
import {
  AiChatShellContext,
  useAiChatPlatform,
  useAiChatShell,
  type AiChatShellState,
} from './context';
import type { AiChatHeaderProps, AiChatMobileHeaderProps, AiChatShellProps } from './types';

/** Drawer controls use the same floating islands as every Bloom page header. */
function ShellNavButton({ shell }: { shell: AiChatShellState }) {
  if (!shell.navCollapsed || !shell.hasNav) return null;
  return (
    <ButtonGroup>
      <ButtonGroupItem
        iconOnly
        leadingIcon={RiMenuLine}
        accessibilityLabel={shell.labels.openNavigation}
        onPress={shell.openNav}
      />
    </ButtonGroup>
  );
}

function ShellPanelButton({ shell }: { shell: AiChatShellState }) {
  if (!shell.hasPanel) return null;
  return (
    <ButtonGroup>
      <ButtonGroupItem
        iconOnly
        leadingIcon={shell.panelIcon}
        accessibilityLabel={shell.labels.openPanel(shell.panelLabel)}
        onPress={shell.openPanel}
      />
    </ButtonGroup>
  );
}

/** The compact shell's PageHeader, driven by the container's measured chrome. */
export function AiChatMobileHeader({ title, style, testID }: AiChatMobileHeaderProps) {
  const shell = useAiChatShell();
  if (!shell || !shell.compact) return null;
  return (
    <PageHeader
      testID={testID}
      title={title}
      leading={<ShellNavButton shell={shell} />}
      actions={<ShellPanelButton shell={shell} />}
      sticky={false}
      safeArea={false}
      scrim="none"
      style={style}
    />
  );
}

/** A centered identity that sets its own header height, with the shell's drawer islands. */
export function AiChatHeader({ children, style, testID }: AiChatHeaderProps) {
  const shell = useAiChatShell();
  return (
    <PageHeader
      testID={testID}
      title={children}
      titleAlign="center"
      leading={shell?.compact ? <ShellNavButton shell={shell} /> : undefined}
      actions={shell?.compact ? <ShellPanelButton shell={shell} /> : undefined}
      sticky={false}
      safeArea={false}
      scrim="none"
      style={style}
    />
  );
}

/** Domain adapter to AppShell's panel descriptors; all layout and resizing belongs to AppShell. */
export function AiChatShellBase({
  sidebar,
  sidebarWidth = 260,
  sidebarCollapsed = false,
  collapsedSidebarWidth,
  mobileSidebar,
  children,
  panel,
  panelLabel: panelLabelProp,
  panelIcon = RiCodeSLine,
  defaultPanelWidth = 410,
  minPanelWidth = 320,
  maxPanelWidth = 560,
  navOpen: navOpenProp,
  onNavOpenChange,
  panelOpen: panelOpenProp,
  onPanelOpenChange,
  background,
  surface = true,
  safeArea = false,
  scroll = 'container',
  labels,
  style,
  testID = 'ai-chat-shell',
}: AiChatShellProps) {
  const { AppShell } = useAiChatPlatform();
  const { messages } = useMessages(AI_CHAT_MESSAGES);
  const common = useCommonMessages();
  const l = useMemo(
    () => ({ ...messages.shell, resize: common.resizePanels, ...labels }),
    [messages, common, labels],
  );
  const panelLabel = panelLabelProp ?? messages.code;
  const [navOpen, setNavOpen] = useControllableState({
    value: navOpenProp,
    defaultValue: false,
    onChange: onNavOpenChange,
  });
  const [panelOpen, setPanelOpen] = useControllableState({
    value: panelOpenProp,
    defaultValue: false,
    onChange: onPanelOpenChange,
  });
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const reportVisibility = useCallback((id: string, value: boolean) => {
    setVisible((current) => (current[id] === value ? current : { ...current, [id]: value }));
  }, []);
  const insets = useCssSafeAreaInsets(useContext(SafeAreaInsetsContext) ?? NO_SAFE_AREA_INSETS);
  const ownsInsets = safeArea && Platform.OS !== 'web';
  const inheritedBottomInset = useContext(BottomBarSlotContext);
  const documentScroll = scroll === 'document' && Platform.OS === 'web';
  const hasNav = !!(sidebar || mobileSidebar);
  const value = useMemo<AiChatShellState>(
    () => ({
      compact: !visible.context,
      navCollapsed: !visible.navigation,
      hasNav,
      hasPanel: !!panel,
      navPresented: !!visible.navigation,
      sidebarCollapsed,
      documentScroll,
      openNav: () => {
        setPanelOpen(false);
        setNavOpen(true);
      },
      closeNav: () => setNavOpen(false),
      openPanel: () => {
        setNavOpen(false);
        setPanelOpen(true);
      },
      panelLabel,
      panelIcon,
      labels: { openNavigation: l.openNavigation, openPanel: l.openPanel },
    }),
    [
      visible,
      hasNav,
      panel,
      sidebarCollapsed,
      documentScroll,
      setNavOpen,
      setPanelOpen,
      panelLabel,
      panelIcon,
      l,
    ],
  );
  return (
    <BottomBarSlotContext.Provider value={ownsInsets ? insets.bottom : inheritedBottomInset}>
      <AiChatShellContext.Provider value={value}>
        <View
          style={[
            {
              flex: 1,
              minHeight: 0,
              width: '100%',
              position: 'relative',
              ...(ownsInsets
                ? {
                    paddingTop: insets.top,
                    paddingBottom: insets.bottom,
                    paddingLeft: insets.left,
                    paddingRight: insets.right,
                  }
                : {}),
            },
            style,
          ]}
        >
          {background ? (
            <View pointerEvents="none" style={{ position: 'absolute', inset: 0 }}>
              {background}
            </View>
          ) : null}
          <AppShell
            testID={testID}
            variant="dashboard"
            header={null}
            contentMaxWidth="none"
            panels
            navFrom="lg"
            sidebar={
              hasNav
                ? {
                    variant: 'panel',
                    width: sidebarCollapsed ? (collapsedSidebarWidth ?? 80) : sidebarWidth,
                    collapsed: false,
                    collapseDisabled: true,
                    surface: 'plain',
                    render: (props) => (
                      <View style={[{ flex: 1, minHeight: 0, width: '100%' }, props.style]}>
                        {props.mobile ? (mobileSidebar ?? sidebar) : (sidebar ?? mobileSidebar)}
                      </View>
                    ),
                  }
                : undefined
            }
            drawerOpen={navOpen}
            onDrawerOpenChange={setNavOpen}
            scroll={documentScroll ? 'document' : 'fixed'}
            style={surface ? undefined : { backgroundColor: 'transparent' }}
            panelLayout={{
              mode: 'split',
              flow: documentScroll ? 'document' : 'bounded',
              activePanel: panelOpen ? 'context' : 'conversation',
              panels: [
                {
                  id: 'conversation',
                  minWidth: 320,
                  resizable: !!panel,
                  appearance: surface ? undefined : 'plain',
                  content: (
                    <PanelPresence id="conversation" onVisibility={reportVisibility}>
                      <ShellNavigationPresence hasNav={hasNav} onVisibility={reportVisibility} />
                      {children}
                    </PanelPresence>
                  ),
                },
                {
                  id: 'context',
                  sticky: true,
                  width: defaultPanelWidth,
                  minWidth: minPanelWidth,
                  maxWidth: maxPanelWidth,
                  visible: !!panel,
                  floating: {
                    below: 'xl',
                    open: panelOpen,
                    onOpenChange: setPanelOpen,
                    label: panelLabel,
                  },
                  appearance: surface ? undefined : 'plain',
                  resizeLabel: l.resize,
                  content: (
                    <PanelPresence id="context" onVisibility={reportVisibility}>
                      {panel?.('100%')}
                    </PanelPresence>
                  ),
                },
              ],
            }}
          />
        </View>
      </AiChatShellContext.Provider>
    </BottomBarSlotContext.Provider>
  );
}

function ShellNavigationPresence({
  hasNav,
  onVisibility,
}: {
  hasNav: boolean;
  onVisibility: (id: string, visible: boolean) => void;
}) {
  const shell = useAppShell();
  const visible = hasNav && (!shell.drawerAvailable || shell.drawerOpen);
  useEffect(() => onVisibility('navigation', visible), [visible, onVisibility]);
  return null;
}
function PanelPresence({
  id,
  onVisibility,
  children,
}: {
  id: string;
  onVisibility: (id: string, visible: boolean) => void;
  children: ReactNode;
}) {
  const { visible = true, presentation } = useAppShellPanel();
  const inlineVisible = visible && presentation !== 'floating';
  useEffect(() => {
    onVisibility(id, inlineVisible);
    return () => onVisibility(id, false);
  }, [id, inlineVisible, onVisibility]);
  return children;
}
