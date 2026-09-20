import React, { memo } from 'react';
import { Pressable, View, type GestureResponderEvent } from 'react-native';

import type { WebCssStyle } from '../styles/web-view-style';
import { Text } from '../typography';
import { useSidebarPalette } from './palette';
import { Collapsible, IS_WEB, useSidebarWebCss } from './parts';
import type { SidebarLogoViewProps } from './types';

/** The mark's box: the collapsed column's width, and the header row's height. */
export const SIDEBAR_LOGO_SIZE = 36;

/**
 * The brand at the top of the sidebar: a mark and a wordmark.
 *
 *   mark      centred in a 36 × 36 box — the collapsed column — so it stays
 *             put while the rail morphs; sized by the caller (a 24–28px glyph
 *             reads right)
 *   wordmark  8 to the right, in a collapse slot; a string renders as
 *             headline-semibold text-primary, anything else as given (an SVG
 *             wordmark, an image)
 *   link      with `href` a real anchor on web, with `onPress` a button; the
 *             focus ring is the sidebar's. Without either it is decoration
 *             and stays out of the tab order
 */
const SidebarLogoViewComponent: React.FC<SidebarLogoViewProps> = ({
  logo,
  collapsed = false,
  showWordmark = true,
  testID,
}) => {
  const palette = useSidebarPalette();
  useSidebarWebCss();
  const { icon, wordmark, href, onPress, accessibilityLabel } = logo;
  const label = accessibilityLabel ?? (typeof wordmark === 'string' ? wordmark : undefined);

  const content = (
    <View style={{ flexDirection: 'row', alignItems: 'center', minWidth: 0 }}>
      {icon != null ? (
        <View
          style={{ width: SIDEBAR_LOGO_SIZE, height: SIDEBAR_LOGO_SIZE, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          testID={testID ? `${testID}-icon` : undefined}
        >
          {icon}
        </View>
      ) : null}
      {wordmark != null && showWordmark ? (
        <Collapsible collapsed={collapsed}>
          <View style={{ minHeight: SIDEBAR_LOGO_SIZE, paddingLeft: icon != null ? 8 : 0, justifyContent: 'center' }} testID={testID ? `${testID}-wordmark` : undefined}>
            {typeof wordmark === 'string' ? (
              <Text variant="headline-semibold" numberOfLines={1} style={{ color: palette.text }}>
                {wordmark}
              </Text>
            ) : (
              wordmark
            )}
          </View>
        </Collapsible>
      ) : null}
    </View>
  );

  if (!href && !onPress) {
    return (
      <View accessibilityLabel={label} role={label ? 'img' : undefined} style={{ minWidth: 0, flexShrink: 1 }} testID={testID}>
        {content}
      </View>
    );
  }

  const ringStyle: WebCssStyle = { minWidth: 0, flexShrink: 1, borderRadius: 10, '--bloom-sidebar-ring': palette.ring };
  return (
    <Pressable
      {...(IS_WEB ? { dataSet: { bloomSidebar: 'ring' }, ...(href ? { href } : null) } : {})}
      role={href ? 'link' : 'button'}
      accessibilityLabel={label}
      onPress={(event: GestureResponderEvent) => {
        if (!onPress) return;
        // A router takes over the anchor's navigation.
        if (IS_WEB && href) event.preventDefault();
        onPress();
      }}
      style={ringStyle}
      testID={testID}
    >
      {content}
    </Pressable>
  );
};

export const SidebarLogoView = memo(SidebarLogoViewComponent);
SidebarLogoView.displayName = 'SidebarLogoView';
