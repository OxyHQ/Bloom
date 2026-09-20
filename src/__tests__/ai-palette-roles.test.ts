import { resolveCodePalette } from '../code/shared';
import { resolveAiChatPalette } from '../ai-chat/shared';
import { resolveAgentChatPalette } from '../agent-chat/shared';
import { contrastRatio, mixColors } from '../styles/color-contrast';
import { buildTheme } from '../theme/build-theme';
import { APP_COLOR_NAMES } from '../theme/color-presets';
import { parseRgba } from '../theme/color-utils';

it('keeps AI template text readable on each tonal surface and filled chip', () => {
  const failures: unknown[] = [];
  for (const preset of APP_COLOR_NAMES) {
    for (const mode of ['light', 'dark'] as const) {
      const theme = buildTheme(preset, mode);
      const chat = resolveAiChatPalette(theme);
      const agent = resolveAgentChatPalette(theme);
      const code = resolveCodePalette(theme);
      const pairs: [string, string, string, string[]?][] = [];
      for (const [name, surface] of Object.entries({ page: chat.full, card: chat.primary, secondary: chat.secondary, tertiary: chat.tertiary, agent: agent.chatSurface })) {
        for (const [role, foreground] of Object.entries({ text: chat.text, secondary: chat.textSecondary, tertiary: chat.textTertiary })) {
          pairs.push([`${name}/${role}`, surface, foreground]);
        }
      }
      for (const [role, foreground] of Object.entries({ plain: code.plain, punctuation: code.punctuation, string: code.string, filename: code.filename, lineNumber: code.lineNumber, addition: code.addition, deletion: code.deletion })) {
        pairs.push([`code/${role}`, code.surface, foreground]);
      }
      pairs.push(['code language chip', code.chipBackground, code.chipText, [code.surface]]);
      // User bubbles paint card; assistant messages inherit the shell background.
      pairs.push(['link chip', chat.linkChipBackground, chat.linkChipText, [chat.primary, chat.full]]);
      // AiProfileCard is transparent over the template Screen, not its stat tiles.
      pairs.push(['profile delta', theme.colors.secondarySubtle, theme.colors.secondarySubtleForeground, [theme.colors.background]]);
      for (const [role, background, foreground, hosts] of pairs) {
        const rgba = parseRgba(background);
        const backdrops = hosts ?? [background];
        for (const backdrop of backdrops) {
          const surface = rgba && rgba.a < 1 ? mixColors(backdrop, background, rgba.a) : background;
          const ratio = contrastRatio(foreground, surface);
          if (ratio < 4.5) failures.push({ preset, mode, role, backdrop, ratio });
        }
      }
    }
  }
  expect(failures).toEqual([]);
});
