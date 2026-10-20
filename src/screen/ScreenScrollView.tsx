import { ScrollBar } from '../layout/ScrollBar';
import { createScreenScrollView } from './ScreenScrollViewBase';
import { getScreenKeyboardComponents } from './keyboard-components';

export const ScreenScrollView = createScreenScrollView(ScrollBar, getScreenKeyboardComponents);
