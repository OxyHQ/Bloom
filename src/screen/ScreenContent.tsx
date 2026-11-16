import { useContext, useId } from 'react';
import { Platform, View, type ViewProps } from 'react-native';
import { StyledView } from '../styles/styled-primitives';
import { useMeasuredSizeClass } from '../hooks/use-width-class';
import { ServerStyleSheet } from '../styles/ServerStyleSheet';
import type { WebCssStyle } from '../styles/web-view-style';
import { ScreenKindContext, screenContentStyle, type ScreenKind } from './content';

export interface ScreenContentProps extends ViewProps {
  /** Defaults to the enclosing Screen's body kind. */
  kind?: ScreenKind;
  /** Full removes the reading measure, preserving the body's edge inset. */
  width?: 'readable' | 'full';
  className?: string;
}

/** A body column in the existing scroller; never adds a viewport or a surface. */
export function ScreenContent({ kind, width = 'readable', style, ...props }: ScreenContentProps) {
  const inherited = useContext(ScreenKindContext);
  const resolvedKind = kind ?? inherited;
  const reading = resolvedKind === 'document' || resolvedKind === 'form';
  const available = useMeasuredSizeClass([768]);
  const scope = `bloom-body-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const web = Platform.OS === 'web';
  const css = reading
    ? `@container ${scope} (min-width:768px){[data-bloom-body="${scope}"]{--bloom-body-inset:40px}}`
    : '';
  return (
    <View
      onLayout={web ? undefined : available.onLayout}
      style={
        {
          width: '100%',
          minWidth: 0,
          ...(web ? { containerType: 'inline-size', containerName: scope } : {}),
        } as WebCssStyle
      }
    >
      {web ? <ServerStyleSheet id={scope} css={css} owned /> : null}
      <StyledView
        {...props}
        {...(web ? { dataSet: { bloomBody: scope } } : {})}
        style={[
          {
            ...screenContentStyle(resolvedKind, width === 'full', !web && available.width >= 768),
            ...(web && reading
              ? {
                  paddingLeft: 'var(--bloom-body-inset, 24px)',
                  paddingRight: 'var(--bloom-body-inset, 24px)',
                }
              : {}),
          } as WebCssStyle,
          style,
        ]}
      />
    </View>
  );
}
