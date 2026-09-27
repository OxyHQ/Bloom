import React, { Children, createContext, Fragment, isValidElement, memo, useContext, useMemo, type ComponentType } from 'react';
import { Platform, View } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { StyledView } from '../styles/styled-primitives';
import { BUTTON_GEOMETRY, BUTTON_RADIUS, BUTTON_SHADOW } from '../button/shared';
import type { ButtonProps } from '../button/types';
import type { WebCssStyle } from '../styles/web-view-style';
import type { ButtonGroupItemProps, ButtonGroupProps, ButtonGroupSize } from './types';

/** The group owns seams and layout; each item is the actual platform Button. */
export function createButtonGroup(Button: ComponentType<ButtonProps>) {
  const GroupContext = createContext<ButtonGroupSize>('medium');

  const ButtonGroup = memo(function ButtonGroup({
    size = 'medium', children, accessibilityLabel, style, className, testID,
  }: ButtonGroupProps) {
    const { colors, isDark } = useTheme();
    const items = Children.toArray(children).filter(isValidElement);
    return (
      <GroupContext.Provider value={size}>
        <StyledView
          role="group"
          accessibilityLabel={accessibilityLabel}
          className={className}
          testID={testID}
          style={[
            { alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.border,
              borderRadius: BUTTON_RADIUS, backgroundColor: 'transparent',
              boxShadow: BUTTON_SHADOW[isDark ? 'dark' : 'light'] },
            style,
          ]}
        >
          <View testID={testID ? `${testID}-items` : undefined} style={{ flexDirection: 'row', alignItems: 'stretch', borderRadius: BUTTON_RADIUS, overflow: 'hidden' }}>
            {items.map((item, index) => (
              <Fragment key={item.key ?? index}>
                {index > 0 ? <View style={{ width: 1, backgroundColor: colors.border }} /> : null}
                {item}
              </Fragment>
            ))}
          </View>
        </StyledView>
      </GroupContext.Provider>
    );
  });

  const ButtonGroupItem = memo(function ButtonGroupItem({
    size: sizeProp, selected = false, iconOnly = false, style, ...props
  }: ButtonGroupItemProps) {
    const groupSize = useContext(GroupContext);
    const size = sizeProp ?? groupSize;
    // Keep the published outer heights: the group's border adds the other 2px.
    const height = BUTTON_GEOMETRY[size].height - 2;
    const itemStyle = useMemo((): WebCssStyle => ({
      height,
      borderWidth: 0,
      borderRadius: 0,
      boxShadow: 'none',
      paddingLeft: iconOnly ? 0 : 8,
      paddingRight: iconOnly ? 0 : 8,
      gap: 4,
      ...(iconOnly ? { width: height, minWidth: height } : {}),
      ...(Platform.OS === 'web' ? { outlineOffset: -2 } : {}),
    }), [height, iconOnly]);
    return (
      <Button
        {...props}
        variant="secondary"
        size={size}
        iconOnly={iconOnly}
        selected={selected}
        style={[itemStyle, style]}
      />
    );
  });

  return { ButtonGroup, ButtonGroupItem };
}
