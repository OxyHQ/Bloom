import React, { useMemo } from 'react';
import { ScrollView, View } from 'react-native';

import { useControllableState } from '../hooks/use-controllable-state';
import { RiCornerUpLeftLine } from '../icons/remix/RiCornerUpLeftLine';
import { RiExpandDiagonalSLine } from '../icons/remix/RiExpandDiagonalSLine';
import { RiGlobalLine } from '../icons/remix/RiGlobalLine';
import { RiInfinityLine } from '../icons/remix/RiInfinityLine';
import { RiSideBarLine } from '../icons/remix/RiSideBarLine';
import { RiTerminalFill } from '../icons/remix/RiTerminalFill';
import { CodeLines } from '../code';
import { Tabs, TabsTrigger } from '../tabs';
import { Text } from '../typography';
import { GlyphAction } from './AiChatControls';
import { dataHook, ROW_RADIUS, useAiChatPalette, useAiChatWebCss, type AiChatPalette } from './shared';
import type { AiChatCodePanelProps, AiChatPanelAction, AiChatPanelTab } from './types';

/**
 * The header row both right-hand panels share: the `PillTabList` (blue
 * pills, 20px glyphs) on the left and the panel actions on the right, 30 tall.
 */
export function PanelHeader({
  tabs,
  value,
  onValueChange,
  label,
  children,
}: {
  tabs: ReadonlyArray<AiChatPanelTab>;
  value: string;
  onValueChange: (value: string) => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ width: '100%', height: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View accessibilityLabel={label} style={{ flexShrink: 1, minWidth: 0 }}>
        <Tabs variant="pill" value={value} onValueChange={onValueChange}>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} label={tab.label} leadingIcon={tab.icon} />
          ))}
        </Tabs>
      </View>
      <View style={{ flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 1 }}>{children}</View>
    </View>
  );
}

const DEFAULT_LABELS = {
  changes: 'Changes',
  browser: 'Browser',
  tabs: 'Panel view',
  uncommitted: (count: number) => `${count} Uncomitted changes`,
  undo: 'Undo changes',
  browserPreview: 'Browser preview',
};

export const DEFAULT_CODE_PANEL_ACTIONS: ReadonlyArray<AiChatPanelAction> = [
  { key: 'terminal', label: 'Open terminal', icon: RiTerminalFill },
  { key: 'expand', label: 'Expand panel', icon: RiExpandDiagonalSLine },
  { key: 'toggle', label: 'Toggle panel', icon: RiSideBarLine },
];

/** A panel-wide placeholder on the secondary surface (the Browser / Styles tabs). */
export function PanelPlaceholder({ label, palette }: { label: string; palette: AiChatPalette }) {
  return (
    <View
      style={{
        width: '100%',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: ROW_RADIUS,
        backgroundColor: palette.secondary,
      }}>
      <Text variant="body-medium" style={{ color: palette.textTertiary }}>
        {label}
      </Text>
    </View>
  );
}

/**
 * The code panel:
 * the right-hand column of the AI chat template, straight on the page background.
 *
 *   column    `width` wide (410), full height, pt 8, gap 10, clipped
 *   header    Changes (∞) / Browser (globe) pills + terminal / expand / sidebar
 *             16px glyphs, 8 apart
 *   summary   a strip with a 1px background-secondary frame on three sides
 *             (radius 10 on top), px 10 / pt 6 / pb 14: "12 Uncomitted changes"
 *             body-2-medium text-secondary, `+156` / `-23` body-regular
 *             emerald-700 / red-600 (6 apart) and the 16px undo glyph
 *   file row  tucked 7px up under the strip: radius 10, background-secondary,
 *             py 4 / pr 5 / pl 6; a 16px mark, the path body-regular text-primary
 *             (truncating) with its `+74`, and the `New` chip (radius 4,
 *             background-tertiary, px 4 / py 1, caption-1-medium text-secondary)
 *   code      3px down, scrolls: pl 6, JetBrains Mono 13/23; each line a
 *             20-wide right-aligned text-tertiary number, 13 gap, then the code
 *             soft-wrapping under itself
 */
export function AiChatCodePanel({
  code,
  language,
  changedFiles = [],
  changeCount,
  additions,
  deletions,
  onUndo,
  tab,
  defaultTab = 'changes',
  onTabChange,
  browser,
  actions = DEFAULT_CODE_PANEL_ACTIONS,
  width = 410,
  labels,
  style,
  testID,
}: AiChatCodePanelProps) {
  useAiChatWebCss();
  const palette = useAiChatPalette();
  const l = useMemo(() => ({ ...DEFAULT_LABELS, ...labels }), [labels]);
  const [current, setCurrent] = useControllableState<'changes' | 'browser'>({
    value: tab,
    defaultValue: defaultTab,
    onChange: onTabChange,
  });
  const tabs: AiChatPanelTab[] = [
    { value: 'changes', label: l.changes, icon: RiInfinityLine },
    { value: 'browser', label: l.browser, icon: RiGlobalLine },
  ];

  return (
    <View
      role="complementary"
      testID={testID}
      style={[
        {
          width,
          minWidth: width,
          maxWidth: width,
          height: '100%',
          flexShrink: 0,
          flexDirection: 'column',
          gap: 10,
          overflow: 'hidden',
          paddingTop: 8,
        },
        style,
      ]}>
      <PanelHeader tabs={tabs} value={current} onValueChange={(next) => setCurrent(next as 'changes' | 'browser')} label={l.tabs}>
        {actions.map((action) => (
          <GlyphAction key={action.key} icon={action.icon} label={action.label} onPress={action.onPress} palette={palette} />
        ))}
      </PanelHeader>

      {current === 'changes' ? (
        <>
          {changeCount !== undefined || changedFiles.length > 0 ? (
            <View style={{ width: '100%', flexDirection: 'column' }}>
              {changeCount !== undefined ? (
                <View
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    borderTopLeftRadius: ROW_RADIUS,
                    borderTopRightRadius: ROW_RADIUS,
                    borderLeftWidth: 1,
                    borderRightWidth: 1,
                    borderTopWidth: 1,
                    borderColor: palette.secondary,
                    paddingLeft: 10,
                    paddingRight: 10,
                    paddingTop: 6,
                    paddingBottom: 14,
                  }}>
                  <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ minWidth: 0, flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text variant="body-2-medium" numberOfLines={1} style={{ color: palette.textSecondary }}>
                        {l.uncommitted(changeCount)}
                      </Text>
                      {additions !== undefined ? (
                        <Text variant="body-regular" style={{ color: palette.addition }}>{`+${additions}`}</Text>
                      ) : null}
                      {deletions !== undefined ? (
                        <Text variant="body-regular" style={{ color: palette.deletion }}>{`-${deletions}`}</Text>
                      ) : null}
                    </View>
                    <GlyphAction icon={RiCornerUpLeftLine} label={l.undo} onPress={onUndo} palette={palette} hover={false} />
                  </View>
                </View>
              ) : null}
              {changedFiles.map((file, index) => (
                <View
                  key={`${file.path}-${index}`}
                  style={{
                    zIndex: 10,
                    marginTop: index === 0 && changeCount !== undefined ? -7 : index === 0 ? 0 : 4,
                    width: '100%',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderRadius: ROW_RADIUS,
                    backgroundColor: palette.secondary,
                    paddingTop: 4,
                    paddingBottom: 4,
                    paddingRight: 5,
                    paddingLeft: 6,
                  }}>
                  <View style={{ minWidth: 0, flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    {file.icon ? <View style={{ flexShrink: 0 }}>{file.icon}</View> : null}
                    <Text variant="body-regular" numberOfLines={1} style={{ flexShrink: 1, color: palette.text }}>
                      {file.path}
                      {file.additions !== undefined ? (
                        <Text style={{ color: palette.addition }}>{` +${file.additions}`}</Text>
                      ) : null}
                    </Text>
                  </View>
                  {file.status ? (
                    <View
                      style={{
                        flexShrink: 0,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 4,
                        backgroundColor: palette.tertiary,
                        paddingLeft: 4,
                        paddingRight: 4,
                        paddingTop: 1,
                        paddingBottom: 1,
                      }}>
                      <Text variant="caption-1-medium" numberOfLines={1} style={{ color: palette.textSecondary }}>
                        {file.status}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}
          <View style={{ paddingTop: 3 }} />
          <ScrollView
            {...dataHook('bloomAiChatScroll', 'thin')}
            style={{ minHeight: 0, width: '100%', flex: 1 }}
            contentContainerStyle={{ paddingLeft: 6 }}>
            <CodeLines code={code} language={language} size="md" wrap />
          </ScrollView>
        </>
      ) : (
        (browser ?? <PanelPlaceholder label={l.browserPreview} palette={palette} />)
      )}
    </View>
  );
}
