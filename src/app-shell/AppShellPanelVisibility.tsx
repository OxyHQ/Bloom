import { useContext } from 'react';
import { Platform, type ViewStyle } from 'react-native';
import { StyledView } from '../styles/styled-primitives';
import { AppShellPanelContext } from './context';
import type { AppShellPanelVisibilityProps } from './types';

/** Keep content mounted while the compositor decides whether its panel is alone. */
export function AppShellPanelVisibility({ when, style, ...props }: AppShellPanelVisibilityProps) {
  const panel = useContext(AppShellPanelContext);
  const alone = panel?.alone ?? false;
  const fallback = (when === 'alone' ? alone : !alone) ? 'flex' : 'none';
  // RNW forwards CSS variables; native uses the same compositor context boolean.
  const display =
    Platform.OS === 'web' && panel?.cssVisibility
      ? `var(--bloom-panel-${when}-display, ${fallback})`
      : fallback;
  return <StyledView {...props} style={[style, { display: display as ViewStyle['display'] }]} />;
}
