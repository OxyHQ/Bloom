import React, { Children, createContext, Fragment, isValidElement, memo, useContext, useMemo, type ComponentType } from 'react';
import { Platform, View } from 'react-native';
import { useBloomAppearance } from '../appearance';
import { useInheritedControl } from '../control-surface';
import type { ControlMaterial } from '../control-surface/types';
import { GlassIsland } from '../glass';
import { useTheme } from '../theme/use-theme';
import { StyledView } from '../styles/styled-primitives';
import type { WebCssStyle } from '../styles/web-view-style';
import { BUTTON_RADIUS, BUTTON_SHADOW } from '../button/shared';
import type { ButtonProps } from '../button/types';
import type { ButtonGroupItemProps, ButtonGroupProps } from './types';

/** The group owns joining and inheritance; Button owns each actual control. */
export function createButtonGroup(Button: ComponentType<ButtonProps>) {
  const GroupContext = createContext<{ size: 'sm' | 'md'; material: ControlMaterial } | null>(null);
  const ButtonGroup = memo(function ButtonGroup({ material: materialProp, variant, size: sizeProp, dividers,
    children, accessibilityLabel, style, testID }: ButtonGroupProps) {
    const theme = useTheme();
    const material = useInheritedControl('material', materialProp ?? variant, 'solid');
    const canonicalSize = sizeProp === 'small' ? 'sm' : sizeProp === 'medium' ? 'md' : sizeProp;
    const { size: scopedSize } = useBloomAppearance({ size: canonicalSize }, { size: 'md', tone: 'neutral' });
    const inheritedSize = useInheritedControl('density', canonicalSize, scopedSize);
    const size: 'sm' | 'md' = inheritedSize === 'xs' || inheritedSize === 'sm' ? 'sm' : 'md';
    const context = useMemo(() => ({ size, material }), [size, material]);
    const items = Children.toArray(children).filter(isValidElement);
    const showDividers = dividers ?? material === 'solid';
    const row = items.map((item, index) => <Fragment key={item.key ?? index}>
      {showDividers && index > 0 ? <View style={{ width: 1, backgroundColor: theme.colors.borderLight }} /> : null}
      {item}
    </Fragment>);
    if (material === 'glass') return <GroupContext.Provider value={context}>
      <GlassIsland material="glass" role="group" accessibilityLabel={accessibilityLabel} style={style} testID={testID}>{row}</GlassIsland>
    </GroupContext.Provider>;
    return <GroupContext.Provider value={context}>
      <StyledView role="group" accessibilityLabel={accessibilityLabel} testID={testID}
        style={[{ alignSelf: 'flex-start', borderWidth: 1, borderColor: theme.colors.border,
          borderRadius: BUTTON_RADIUS, backgroundColor: 'transparent', boxShadow: BUTTON_SHADOW[theme.isDark ? 'dark' : 'light'] }, style]}>
        <View testID={testID ? `${testID}-items` : undefined} style={{ flexDirection: 'row', alignItems: 'stretch', borderRadius: BUTTON_RADIUS, overflow: 'hidden' }}>
          {row}
        </View>
      </StyledView>
    </GroupContext.Provider>;
  });
  const ButtonGroupItem = memo(function ButtonGroupItem({ onPress, onCheckedChange, checked: checkedProp, selected,
    size: sizeProp, material: materialProp, variant, iconOnly = false, disabled = false, style, hitSlop,
    ...props }: ButtonGroupItemProps) {
    const group = useContext(GroupContext);
    const inheritedMaterial = useInheritedControl('material', undefined, 'solid');
    const canonicalSize = sizeProp === 'small' ? 'sm' : sizeProp === 'medium' ? 'md' : sizeProp;
    const { size: scopedSize } = useBloomAppearance({ size: canonicalSize }, { size: 'md', tone: 'neutral' });
    const inheritedDensity = useInheritedControl('density', undefined, scopedSize);
    const rawSize = canonicalSize ?? group?.size ?? inheritedDensity;
    const size = rawSize === 'xs' || rawSize === 'sm' ? 'sm' : 'md';
    const material = materialProp ?? variant ?? group?.material ?? inheritedMaterial;
    const height = size === 'sm' ? 30 : 34;
    const checked = checkedProp ?? selected;
    const itemStyle: WebCssStyle = { height, minWidth: iconOnly ? height : undefined, width: iconOnly ? height : undefined,
      borderWidth: 0, borderRadius: material === 'glass' ? BUTTON_RADIUS : 0,
      boxShadow: 'none', paddingLeft: iconOnly ? 0 : 8, paddingRight: iconOnly ? 0 : 8, gap: 4,
      ...(Platform.OS === 'web' ? { outlineOffset: -2 } : {}) };
    return <Button {...props} appearance={material === 'glass' ? 'plain' : 'outline'} tone="neutral" size={size} iconOnly={iconOnly}
      pressed={checked} disabled={disabled} hitSlop={typeof hitSlop === 'object' ? { top: 0, bottom: 0, left: 0, right: 0, ...hitSlop } : hitSlop ?? 0}
      onPress={(event) => { if (disabled) return; onCheckedChange?.(!checked); onPress?.(event); }}
      style={[itemStyle, style]} />;
  });
  return { ButtonGroup, ButtonGroupItem };
}
