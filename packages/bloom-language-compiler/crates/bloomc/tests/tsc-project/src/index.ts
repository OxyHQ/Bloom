// A TS module that imports .bloom modules, through `paths` and by a relative path.
import { Pair } from '@/screens/pair.bloom';
import { List } from './screens/list.bloom';

export const screens = [Pair, List];
export const screenCount: number = screens.length;
