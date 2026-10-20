import { ScrollBar } from '../layout/ScrollBar.web';
import { BloomColorScope } from '../theme/color-scope/index.web';
import { useScrollRestoration } from '../scroll/use-scroll-restoration.web';
import { createScreen } from './ScreenBase';

export const Screen = createScreen(ScrollBar, BloomColorScope, useScrollRestoration, null);
