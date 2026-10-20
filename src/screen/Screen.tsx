import { ScrollBar } from '../layout/ScrollBar';
import { BloomColorScope } from '../theme/color-scope/index';
import { useScrollRestoration } from '../scroll/use-scroll-restoration';
import { createScreen } from './ScreenBase';

export const Screen = createScreen(ScrollBar, BloomColorScope, useScrollRestoration);
