import { useCallback, useContext, useId, useLayoutEffect } from 'react';
import { Platform } from 'react-native';
import type { WebCssStyle } from '../styles/web-view-style';
import { ButtonGroupContext } from './context';
import type { ButtonProps } from './types';

/** Group participation changes joining and material ownership, never button geometry. */
export function useGroupedButton(props: ButtonProps): ButtonProps {
  const group = useContext(ButtonGroupContext);
  const id = useId();
  const { register, unregister, measure } = group ?? {};
  const { pressed, disabled = false, loading = false, onLayout, onPress, onPressedChange } = props;
  useLayoutEffect(() => {
    register?.(id, Boolean(pressed), disabled || loading);
  }, [register, id, pressed, disabled, loading]);
  useLayoutEffect(() => () => unregister?.(id), [unregister, id]);
  const handleLayout = useCallback<NonNullable<ButtonProps['onLayout']>>(
    (event) => {
      measure?.(id, event.nativeEvent.layout);
      onLayout?.(event);
    },
    [id, measure, onLayout],
  );
  const handlePress = useCallback<NonNullable<ButtonProps['onPress']>>(
    (event) => {
      if (disabled || loading || event?.defaultPrevented) return;
      onPressedChange?.(!pressed);
      onPress?.(event);
    },
    [disabled, loading, pressed, onPress, onPressedChange],
  );
  const toggleProps = onPressedChange ? { onPress: handlePress } : {};
  if (!group) return onPressedChange ? { ...props, ...toggleProps } : props;
  const iconOnly = props.iconOnly || (props.icon != null && props.children == null);
  const joining: WebCssStyle = {
    borderWidth: 0,
    boxShadow: 'none',
    ...(group.separated ? { borderRadius: 0, '--bloom-btn-radius': '0px' } : {}),
    ...(group.moving && pressed
      ? { backgroundColor: 'transparent', '--bloom-btn-bg-active': 'transparent' }
      : {}),
    ...(Platform.OS === 'web' ? { outlineOffset: -2 } : {}),
  };
  return {
    ...props,
    ...toggleProps,
    size: props.size ?? group.size,
    appearance: props.appearance ?? (group.separated && !pressed ? 'subtle' : 'outline'),
    tone: props.tone ?? 'neutral',
    material:
      props.material ??
      (group.separated ? 'flat' : pressed && !group.moving ? 'surface' : 'shared'),
    wide: props.wide ?? (group.separated && iconOnly),
    hitSlop: props.hitSlop ?? 0,
    onLayout: handleLayout,
    style: [joining, props.style],
  };
}
