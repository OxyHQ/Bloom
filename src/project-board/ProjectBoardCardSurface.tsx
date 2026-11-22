import type { ReactNode } from 'react';
import { View } from 'react-native';
import { IS_WEB } from '../styles/platform';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import { createTokenStyles } from '../theme/color-tokens';
import { useTheme } from '../theme/use-theme';
import { CARD_SHADOW } from './styles';
import { useProjectBoardWebCss } from './web-css';

const useStyles = createTokenStyles((t) => ({
  card: {
    position: 'relative',
    width: '100%',
    flexDirection: 'column',
    borderRadius: 12,
    backgroundColor: t.card,
    // The web's shadow and its hover are the adopted sheet's.
    ...(IS_WEB ? null : { boxShadow: [CARD_SHADOW] }),
  },
  /** The lifted card's `dark:backdrop-blur-[12px]` (web). */
  darkOverlayWeb: { backdropFilter: 'blur(12px)' } as WebCssStyle,
}));

/** ProjectBoard's original card material, shared by ticket and product-owned content. */
export function ProjectBoardCardSurface({
  children,
  overlay = false,
  wholeCardDrag = true,
}: {
  children: ReactNode;
  overlay?: boolean;
  wholeCardDrag?: boolean;
}) {
  useProjectBoardWebCss();
  const styles = useStyles();
  const { isDark } = useTheme();
  const dark = IS_WEB && isDark;
  return (
    <View
      style={[styles.card, dark && overlay && styles.darkOverlayWeb]}
      {...webDataSet({
        bloomBoardCard: overlay ? 'overlay' : wholeCardDrag ? 'drag' : 'handle',
        // `dark:bg-background-primary-default/60`, a `color-mix()` the sheet
        // draws. Native drew it opaque: its fallback is the unmixed token.
        ...(dark ? { bloomBoardCardDark: '' } : null),
      })}
    >
      {children}
    </View>
  );
}
