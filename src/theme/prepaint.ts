import { APP_COLOR_NAMES, type AppColorName } from './color-presets';
import type { ThemeMode } from './types';
import { getPrepaintPalette } from './prepaint-palettes';
import { presetPaintCss, themePaintCss, themePaintVars } from './paint';
export { themePaintVars } from './paint';

/** Share the same configuration between the document head and root provider. */
export interface BloomThemeBootstrapConfig {
  defaultMode?: ThemeMode;
  defaultColorPreset?: AppColorName;
  /** Existing Bloom JSON theme storage; named presets paint before hydration. */
  persistKey?: string;
  /** Plain mode preference; when valid, takes precedence over the JSON mode. */
  modeStorageKey?: string;
}

export function applyPrepaintMode(mode: 'light' | 'dark', preset?: AppColorName): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-bloom-theme-mode', mode);
  if (preset) root.setAttribute('data-bloom-theme-preset', preset);
}

const presetCss = new Map<string, string>();
function paletteVars(preset: AppColorName, mode: 'light' | 'dark') {
  const palette = getPrepaintPalette(preset, mode);
  return { ...palette.vars, ...themePaintVars(palette.theme.colors), 'color-scheme': mode };
}

/** Engine-derived resources for the document head; hosts authorize their exact CSP bytes. */
export function getThemeBootstrap(config: BloomThemeBootstrapConfig = {}): {
  css: string;
  script: string;
} {
  const preset = config.defaultColorPreset ?? 'oxy';
  const mode = config.defaultMode ?? 'system';
  const key = `${preset}/${mode}/${Boolean(config.persistKey)}`;
  let css = presetCss.get(key);
  if (css === undefined) {
    css = config.persistKey
      ? presetPaintCss(
          APP_COLOR_NAMES.map((name) => ({
            preset: name,
            light: paletteVars(name, 'light'),
            dark: paletteVars(name, 'dark'),
          })),
          preset,
          mode,
        )
      : themePaintCss(':root', paletteVars(preset, 'light'), paletteVars(preset, 'dark'), mode);
    css += 'html,body{background-color:var(--background);color:var(--foreground);}';
    presetCss.set(key, css);
  }
  // JSON is code data, never HTML. Escape delimiters that can close a script.
  const data = JSON.stringify({
    mode,
    preset,
    key: config.modeStorageKey,
    persist: config.persistKey,
    presets: config.persistKey ? APP_COLOR_NAMES : undefined,
  })
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
  const script = `(function(c){var m=c.mode,p=c.preset;function valid(v){return v==='light'||v==='dark'||v==='system'||v==='adaptive'}try{var j=c.persist&&JSON.parse(localStorage.getItem(c.persist)||'null');if(j&&typeof j==='object'){if(valid(j.mode))m=j.mode;if(c.presets.indexOf(j.colorPreset)!==-1)p=j.colorPreset}}catch(e){}try{var s=c.key&&localStorage.getItem(c.key);if(valid(s))m=s}catch(e){}var d=m==='dark';if(m==='system'||m==='adaptive'){try{d=matchMedia('(prefers-color-scheme: dark)').matches}catch(e){}}var r=document.documentElement;r.setAttribute('data-bloom-theme-mode',d?'dark':'light');if(c.persist)r.setAttribute('data-bloom-theme-preset',p);r.classList.toggle('dark',d)})(${data});`;
  return { css, script };
}
