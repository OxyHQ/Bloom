import { buildTheme } from '../src/theme/build-theme';
import { resolveButtonRamps } from '../src/button/shared';
import { contrastRatio } from '../src/styles/color-contrast';
const t = buildTheme('blue', 'dark');
console.log(t.colors.background, '|', t.colors.backgroundSecondary, '|', t.colors.card);
const { neutral } = resolveButtonRamps(t);
console.log(neutral[800], neutral[900]);
console.log(contrastRatio(neutral[600], neutral[900]));
