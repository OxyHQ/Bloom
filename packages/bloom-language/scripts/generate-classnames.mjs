#!/usr/bin/env node
/**
 * The className table: every Tailwind/NativeWind utility the Oxy apps write
 * (`codemod/classname-usage.json`, from `scan-classnames.mjs`), resolved to the
 * language modifier and token it becomes, or flagged.
 *
 * A utility resolves through Bloom's own vocabulary: its Tailwind preset (the
 * spacing, radius and type roles of `src/design-tokens/tokens.json`, the
 * colour roles of `color-roles.ts` and `component-roles.ts`), Tailwind's
 * default scales for the rest, and the language spec's rungs. A value lands on
 * a token only when a rung has exactly that value; anything else is flagged
 * with the raw value, never kept as an arbitrary number.
 *
 * Writes:
 * - `codemod/classnames.generated.json`: the table the app codemods read;
 * - `docs/bloom-language-classnames.mdx`: the table, for people;
 * - the summary between the `GENERATED:classnames` markers of `docs/bloom-language.mdx`.
 *
 * `--check` writes nothing and fails when an output is stale.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const pkg = join(here, '..');
const bloom = join(pkg, '../..');
const check = process.argv.includes('--check');

const spec = JSON.parse(readFileSync(join(pkg, 'spec/language.json'), 'utf8'));
const usage = JSON.parse(readFileSync(join(pkg, 'codemod/classname-usage.json'), 'utf8'));
const designTokens = JSON.parse(readFileSync(join(bloom, 'src/design-tokens/tokens.json'), 'utf8'));
const read = (path) => readFileSync(join(bloom, path), 'utf8');

const { scales } = spec;
const colors = Object.fromEntries(Object.entries(spec.colors).filter(([k]) => k !== '$comment'));
const ramp = Object.fromEntries(Object.entries(spec.typeRamp).filter(([k]) => k !== '$comment'));

// ── Bloom's vocabulary ───────────────────────────────────────────

const px = (text) => Number(String(text).replace(/px$/, ''));
const presetSpace = Object.fromEntries(
  Object.entries(designTokens.spacing)
    .filter(([k]) => !k.startsWith('$'))
    .map(([k, v]) => [k, px(v.$value)]),
);
const presetRadius = Object.fromEntries(
  Object.entries(designTokens.radius)
    .filter(([k]) => !k.startsWith('$'))
    .map(([k, v]) => [k, px(v.$value)]),
);
const presetType = Object.fromEntries(
  Object.entries(designTokens.typography)
    .filter(([k]) => !k.startsWith('$'))
    .map(([k, v]) => [
      k,
      {
        size: px(v.fontSize.$value),
        lineHeight: px(v.lineHeight.$value),
        weight: String(v.fontWeight.$value),
      },
    ]),
);
const firstPreset = Object.keys(designTokens.color).find((k) => !k.startsWith('$'));
const themeVariables = new Set(Object.keys(designTokens.color[firstPreset].light));

/** Bloom's colour utilities: `name: ref('token')` and `'name': 'var(--token)'`. */
const colorUtilities = {};
for (const file of ['src/design-tokens/color-roles.ts', 'src/design-tokens/component-roles.ts']) {
  for (const match of read(file).matchAll(
    /^\s*'?([\w-]+)'?:\s*(?:ref\('([\w-]+)'\)|'var\(--([\w-]+)\)')/gm,
  ))
    colorUtilities[match[1]] = match[2] ?? match[3];
}

/** The language's colour role for a theme variable (or, for a fixed colour, the colour). */
const roleByVariable = Object.fromEntries(
  Object.entries(colors).map(([role, [, css]]) => [css, role]),
);
/** Tailwind's own colours that a fixed role paints exactly. */
const TW_FIXED = { white: '#ffffff', black: '#000000', transparent: 'transparent' };

const rung = (table, value) =>
  Object.entries(table).find(([, v]) => typeof v === 'number' && Math.abs(v - value) < 1e-9)?.[0];

// Tailwind's own defaults, for the utilities the preset does not redefine.
const TW_TEXT = {
  xs: [12, 16],
  sm: [14, 20],
  base: [16, 24],
  lg: [18, 28],
  xl: [20, 28],
  '2xl': [24, 32],
  '3xl': [30, 36],
  '4xl': [36, 40],
  '5xl': [48, 48],
  '6xl': [60, 60],
};
const TW_RADIUS = { none: 0, sm: 2, '': 4, md: 6, lg: 8, xl: 12, '2xl': 16, '3xl': 24, full: 9999 };
const TW_LEADING = { none: 1, tight: 1.25, snug: 1.375, normal: 1.5, relaxed: 1.625, loose: 2 };
const TW_WEIGHT = {
  thin: '100',
  extralight: '200',
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
};
const TW_TRACKING = {
  tighter: -0.05,
  tight: -0.025,
  normal: 0,
  wide: 0.025,
  wider: 0.05,
  widest: 0.1,
};
const TW_PALETTE =
  /^(white|black|transparent|current|inherit|(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3})$/;

/** A spacing value in px: Tailwind's 4px steps, Bloom's `space-N`, or a bracketed `[Npx]`. */
function spaceValue(text) {
  if (text === 'px') return 1;
  if (/^\d+(\.\d+)?$/.test(text)) return Number(text) * 4;
  if (presetSpace[text] !== undefined) return presetSpace[text];
  const arbitrary = /^\[(-?\d+(?:\.\d+)?)px\]$/.exec(text);
  return arbitrary ? Number(arbitrary[1]) : undefined;
}

// ── Resolution ───────────────────────────────────────────────────

const mapped = (language) => ({ status: 'mapped', language });
const token = (scale, value, language) => ({ status: 'token', scale, value, language });
const modifier = (language) => ({ status: 'modifier', language });
const motion = (language) => ({ status: 'motion', language });
const appToken = (scale, value, language) => ({ status: 'appToken', scale, value, language });
const structure = (language) => ({ status: 'structure', language });
const drop = (language) => ({ status: 'drop', language });

/** A space utility to `make(token)`, or the raw value it needs a token for. */
function space(text, make, negative = false) {
  const value = spaceValue(text);
  if (value === undefined) return deadKey(text, 'space');
  if (value === 0) return mapped(make("'none'"));
  const name = rung(scales.space, value);
  if (name) return mapped(make(`'${negative ? '-' : ''}${name}'`));
  return token('space', `${value}px`, make('…'));
}

/**
 * A Bloom-spelled key the preset does not have (`py-space-6`, `rounded-radius-6`)
 * matches no rule: it renders nothing today, so the codemod drops it and the look
 * stays as it is.
 */
const DEAD = 'renders nothing today (no such key in Bloom’s preset): the codemod drops it';
function deadKey(text, prefix) {
  return new RegExp(`^${prefix}-\\d+$`).test(text) ? drop(DEAD) : undefined;
}

const EDGE = {
  '': 'all',
  x: 'horizontal',
  y: 'vertical',
  t: 'top',
  b: 'bottom',
  s: 'leading',
  e: 'trailing',
  l: 'leading',
  r: 'trailing',
};

/** A colour utility's theme variable, or why it has none. */
function colorVariable(name) {
  const [base, alpha] = name.split('/');
  const variable = colorUtilities[base] ?? (themeVariables.has(base) ? base : undefined);
  return { base, alpha, variable };
}

function color(name, make) {
  // A raw hex is an app's brand colour: the app's own token, never a Bloom role.
  const hex = /^\[(#[0-9a-fA-F]{3,8})\](?:\/(.+))?$/.exec(name);
  if (hex)
    return appToken(
      'color',
      hex[2] === undefined ? hex[1] : `${hex[1]} at ${hex[2]}%`,
      make('app.color.<name>'),
    );
  const { base, alpha, variable } = colorVariable(name);
  const fixed = roleByVariable[TW_FIXED[base]];
  if (TW_PALETTE.test(base) && !fixed) return token('color', base, make('…'));
  if (variable === undefined && !fixed) return undefined;
  const role = fixed ?? roleByVariable[variable];
  const label = fixed ? base : `--${variable}`;
  if (alpha !== undefined) {
    // A role at an opacity rung is `'role/opacity'`; any other amount needs a rung.
    const amount = /^\d+$/.test(alpha) ? rung(scales.opacity, Number(alpha) / 100) : undefined;
    if (role && amount) return mapped(make(`'${role}/${amount}'`));
    return token('opacity', `${label} at ${alpha}%`, role ? make(`'${role}/…'`) : make('…'));
  }
  return role ? mapped(make(`'${role}'`)) : token('color', label, make('…'));
}

function fontSize(name) {
  if (ramp[name]) {
    const [, family, weight] = /^(.*)-(regular|medium|semibold|bold)$/.exec(name);
    return mapped(`.font('${family}').weight('${weight}')`);
  }
  const preset = presetType[name];
  const pair = preset ? [preset.size, preset.lineHeight] : TW_TEXT[name];
  const arbitrary = /^\[(\d+(?:\.\d+)?)px\]$/.exec(name);
  if (!pair && !arbitrary) return undefined;
  const [size, lineHeight] = pair ?? [Number(arbitrary[1]), undefined];
  // A ramp step is a size and a line height together; a size alone is a size rung.
  const step =
    lineHeight === undefined
      ? undefined
      : Object.entries(ramp).find(
          ([variant, [s, l]]) => variant.endsWith('-regular') && s === size && l === lineHeight,
        );
  if (step) return mapped(`.font('${step[0].replace(/-regular$/, '')}')`);
  const sizeRung = rung(scales.fontSize, size);
  if (sizeRung && lineHeight === undefined) return mapped(`.font('${sizeRung}')`);
  // Otherwise a size with a named leading whose ratio gives exactly that line height,
  // else with the line height's own px token.
  const leading =
    sizeRung && (rung(scales.leading, lineHeight / size) ?? rung(scales.leadingPx, lineHeight));
  if (leading) return mapped(`.font('${sizeRung}').leading('${leading}')`);
  return token(
    'font',
    lineHeight === undefined ? `${size}px` : `${size}px / ${lineHeight}px`,
    sizeRung ? `.font('${sizeRung}') (line height ${lineHeight}px has no rung)` : '.font(…)',
  );
}

/** Tailwind's corner sides: `t` is the top two, `tl` one; `l`/`r` lead and trail, as the edges do. */
const CORNER_SIDE = {
  t: 'top',
  b: 'bottom',
  l: 'leading',
  r: 'trailing',
  s: 'leading',
  e: 'trailing',
  tl: 'top-leading',
  tr: 'top-trailing',
  bl: 'bottom-leading',
  br: 'bottom-trailing',
  ss: 'top-leading',
  se: 'top-trailing',
  es: 'bottom-leading',
  ee: 'bottom-trailing',
};

function corner(name, side) {
  const value =
    name === '' ? TW_RADIUS[''] : (presetRadius[name] ?? TW_RADIUS[name] ?? spaceValue(name));
  if (value === undefined) return deadKey(name, 'radius');
  const sideArg = side ? `, '${side}'` : '';
  if (value >= 9999) return mapped(`.corner('full'${sideArg})`);
  const name2 = rung(scales.corner, value);
  return name2
    ? mapped(`.corner('${name2}'${sideArg})`)
    : token('corner', `${value}px`, `.corner(…${sideArg})`);
}

/** Tailwind v4's own shadows (theme.css): each is a numeric token named by its exact box-shadow. */
const TW_SHADOW = {
  '2xs': '0 1px rgb(0 0 0 / 0.05)',
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  '': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
};

/**
 * The motion layer (`@oxy.so/bloom/motion`, the language's motion modifiers on
 * feat/bloom-language-motion): what of Tailwind's transitions and tw-animate's
 * enter and exit it plays, and what it has no equivalent for.
 */
const MOTION_LAYER = 'the motion layer';
/**
 * Tailwind's curves (its default `transition-timing-function` and `ease-*`),
 * none of them Bloom's: an app that keeps one declares it as its own motion.
 */
const TW_EASE = {
  DEFAULT: [0.4, 0, 0.2, 1],
  in: [0.4, 0, 1, 1],
  out: [0, 0, 0.2, 1],
  'in-out': [0.4, 0, 0.2, 1],
};
/** An app motion a Tailwind duration or curve is: `defineTokens({ motion })` with Tailwind's own numbers. */
const appMotion = (duration, curve) =>
  appToken(
    'motion',
    duration === undefined ? `ease-${curve}` : `${duration}ms`,
    `.animation(app.motion.<name>): defineTokens({ motion: { <name>: { duration: ${duration ?? 150}, easing: [${TW_EASE[curve].join(', ')}] } } })`,
  );
function motionUtility(utility) {
  let m;
  if (utility === 'transition-none') return drop('a view animates only what it says');
  if (utility === 'transition-opacity' || utility === 'transition-transform')
    return motion(
      `.animation(motion): a change of the view’s ${utility === 'transition-opacity' ? 'opacity' : 'offset, scale or rotation'} plays with motion (${MOTION_LAYER})`,
    );
  if (utility === 'transition-colors')
    return motion(
      `.animation(motion): a change of the view’s colours (fill, border, outline, ink) plays with motion (${MOTION_LAYER})`,
    );
  if (utility === 'transition')
    return motion(
      `.animation(motion): a change of the view’s colours, opacity and geometry plays with motion; a shadow or a filter changes at once (${MOTION_LAYER})`,
    );
  if (utility === 'transition-all')
    return modifier(
      'a transition of every property: .animation(motion) plays colours, opacity and geometry, not a frame or a shadow',
    );
  if (/^transition-\[/.test(utility))
    return modifier(
      'a layout transition (a frame’s width): the motion engine moves views, not frames',
    );
  if ((m = /^duration-(\d+)$/.exec(utility))) return appMotion(Number(m[1]), 'DEFAULT');
  if (utility === 'ease-linear')
    return motion(`easing 'linear' in the view’s motion (Bloom’s linear curve; ${MOTION_LAYER})`);
  if ((m = /^ease-(in|out|in-out)$/.exec(utility))) return appMotion(undefined, m[1]);
  if (utility === 'animate-in')
    return motion(
      `.transition(…): its insertion, the fade, zoom and slide beside it (${MOTION_LAYER})`,
    );
  if (utility === 'animate-out')
    return motion(`.transition(asymmetric(insert, remove)): its removal (${MOTION_LAYER})`);
  if ((m = /^animate-(spin|pulse)$/.exec(utility)))
    return motion(
      `.repeatForever('${m[1]}'): Tailwind’s ${utility}, frame for frame, repeating (${MOTION_LAYER})`,
    );
  if ((m = /^(animate-(?:bounce|ping))$/.exec(utility)))
    return modifier(
      `a looping animation (${m[1]}): the language’s loops are spin and pulse; an app loops its own keyframes with .repeatForever(k)`,
    );
  if ((m = /^delay-(\d+)$/.exec(utility))) {
    const ms = Number(m[1]);
    if (ms === 0) return drop('a view’s motion starts at once unless it says otherwise');
    const name = rung(scales.duration, ms);
    return name
      ? motion(`.delay('${name}'): what the view plays waits ${ms}ms (${MOTION_LAYER})`)
      : token('duration', `${ms}ms`, `.delay(…) (${MOTION_LAYER})`);
  }
  if (/^(animate|transition)(-|$)/.test(utility))
    return modifier('a motion the engine has no name for');
  return undefined;
}

/** tw-animate's enter and exit: a transition's halves. */
function enterExit(utility) {
  let m;
  if ((m = /^fade-(in|out)(?:-(\d+))?$/.exec(utility))) {
    const from = m[2] === undefined ? 0 : Number(m[2]) / 100;
    return from === 0
      ? motion(
          `opacity, the ${m[1] === 'in' ? 'insertion' : 'removal'} of .transition(…) (${MOTION_LAYER})`,
        )
      : token('opacity', `${from}`, 'opacity from a partial value, in .transition(…)');
  }
  if ((m = /^zoom-(in|out)(?:-(\d+))?$/.exec(utility))) {
    const factor = m[2] === undefined ? 0 : Number(m[2]) / 100;
    const name = rung(scales.scale, factor);
    return name
      ? motion(
          `scale('${name}'), the ${m[1] === 'in' ? 'insertion' : 'removal'} of .transition(…) (${MOTION_LAYER})`,
        )
      : token('scale', `${factor}`, `scale(…) in .transition(…)`);
  }
  if (
    (m = /^slide-(in|out)-(?:from|to)-(top|bottom|left|right|start|end)(?:-(.+))?$/.exec(utility))
  ) {
    const edge = {
      top: 'top',
      bottom: 'bottom',
      left: 'leading',
      right: 'trailing',
      start: 'leading',
      end: 'trailing',
    }[m[2]];
    return space(m[3] ?? '0', (t) => `move('${edge}', ${t}) in .transition(…) (${MOTION_LAYER})`);
  }
  return undefined;
}

const ALIGN = {
  start: 'start',
  center: 'center',
  end: 'end',
  stretch: 'stretch',
  baseline: 'baseline',
};
const TEXT_ALIGN = {
  left: 'start',
  start: 'start',
  center: 'center',
  right: 'end',
  end: 'end',
  justify: 'justify',
};
const FRAME = {
  w: 'width',
  h: 'height',
  'min-w': 'minWidth',
  'min-h': 'minHeight',
  'max-w': 'maxWidth',
  'max-h': 'maxHeight',
};

function resolve(utility) {
  let m;
  // Layout: stacks and placement.
  if (utility === 'flex-row') return structure('HStack(…)');
  if (utility === 'flex-col') return structure('VStack(…)');
  if (utility === 'flex' || utility === 'inline-flex')
    return structure('a stack (HStack or VStack)');
  if (utility === 'flex-1' || utility === 'grow' || utility === 'flex-grow')
    return mapped('.grow()');
  if (utility === 'shrink-0' || utility === 'flex-shrink-0') return mapped(".shrink('never')");
  if (utility === 'shrink' || utility === 'flex-shrink') return mapped(".shrink('normal')");
  if ((m = /^items-(start|center|end|stretch|baseline)$/.exec(utility)))
    return mapped(`.align('${ALIGN[m[1]]}')`);
  if ((m = /^justify-(start|center|end|between|around|evenly)$/.exec(utility)))
    return mapped(`.justify('${m[1]}')`);
  if ((m = /^self-(start|center|end|stretch|baseline)$/.exec(utility)))
    return mapped(`.alignSelf('${ALIGN[m[1]]}')`);
  if (utility === 'flex-wrap') return mapped('.wrap()');
  if (utility === 'flex-nowrap') return mapped('.wrap(false)');
  // place-items sets justify-items too, which a stack does not read.
  if ((m = /^place-items-(start|center|end|stretch|baseline)$/.exec(utility)))
    return mapped(`.align('${ALIGN[m[1]]}')`);
  if (/^(justify-items|justify-self|place-self|place-content)-/.test(utility))
    return structure('a Grid(…) cell’s placement');
  if (/^content-/.test(utility)) return modifier('the alignment of wrapped lines (align-content)');
  if (utility === 'relative') return drop('a view is the positioned parent of what it pins');
  if (utility === 'absolute') return mapped('.position(…) (the edges it is pinned at)');
  if (utility === 'inset-0') return structure('Fill(…), or .overlay(view) on the parent');
  if ((m = /^(-?)(inset|inset-x|inset-y|top|bottom|left|right|start|end)-(.+)$/.exec(utility))) {
    const [, negative, side, value] = m;
    if (value.includes('/') || value === 'auto')
      return structure('a view centred on its parent: .overlay(view, alignment) on the parent');
    const edges = {
      inset: ['top', 'bottom', 'leading', 'trailing'],
      'inset-x': ['leading', 'trailing'],
      'inset-y': ['top', 'bottom'],
      top: ['top'],
      bottom: ['bottom'],
      left: ['leading'],
      start: ['leading'],
      right: ['trailing'],
      end: ['trailing'],
    }[side];
    return space(
      value,
      (t) => `.position({ ${edges.map((edge) => `${edge}: ${t}`).join(', ')} })`,
      negative === '-',
    );
  }
  if (utility === 'hidden') return mapped('.hidden() (or a conditional child, `show && view`)');
  if (
    utility === 'block' ||
    utility === 'inline-block' ||
    utility === 'inline' ||
    utility === 'contents'
  )
    return drop('display: views are boxes');
  if ((m = /^aspect-(square|video)$/.exec(utility)))
    return structure(`AspectRatio(${m[1] === 'square' ? '1' : '16 / 9'}, …)`);
  if (/^grid-cols-|^grid$|^col-|^row-|^grid-/.test(utility)) return structure('Grid(…).columns(n)');
  // Spacing.
  if ((m = /^(-?)(p|m)([xytbserl]?)-(.+)$/.exec(utility))) {
    const [, negative, kind, edge, value] = m;
    if (value === 'auto') {
      // In a column (every NativeWind view is one), auto side margins centre the box: its own alignment.
      if (kind === 'm' && edge === 'x') return mapped(".alignSelf('center') (in a column)");
      return structure('Spacer() on the side the auto margin takes');
    }
    // A margin is padding outside the view's fill (SwiftUI has no margin); a negative one pulls outward.
    return space(
      value,
      (t) => `.padding('${EDGE[edge]}', ${t})${kind === 'm' ? ' (outside the fill)' : ''}`,
      negative === '-',
    );
  }
  if ((m = /^(gap|space-[xy])-(.+)$/.exec(utility))) return space(m[2], (t) => `.spacing(${t})`);
  if ((m = /^gap-[xy]-(.+)$/.exec(utility))) return modifier('one spacing per axis (gap-x, gap-y)');
  // Frames.
  if ((m = /^(w|h|min-w|min-h|max-w|max-h|size)-(.+)$/.exec(utility))) {
    const [, kind, value] = m;
    const keys = kind === 'size' ? ['width', 'height'] : [FRAME[kind]];
    const frame = (t) => `.frame({ ${keys.map((k) => `${k}: ${t}`).join(', ')} })`;
    if (value === 'full') return mapped(frame("'full'"));
    if (value.includes('/')) {
      const fraction = scales.length[value] === undefined ? undefined : value;
      return fraction ? mapped(frame(`'${fraction}'`)) : token('length', value, frame('…'));
    }
    if (value === 'auto')
      return drop('a view’s size is its content’s unless a frame says otherwise');
    if (['screen', 'dvh', 'svh'].includes(value)) return structure('a screen() fills the window');
    if (value === 'fit') return mapped(frame("'fit'"));
    if (['min', 'max'].includes(value))
      return modifier(`an intrinsic size (${utility}): min-content and max-content`);
    const out = space(value, frame);
    if (out) return out;
    const container = {
      xs: 320,
      sm: 384,
      md: 448,
      lg: 512,
      xl: 576,
      '2xl': 672,
      '3xl': 768,
      '4xl': 896,
      '5xl': 1024,
      '6xl': 1152,
      '7xl': 1280,
    }[value];
    if (container === undefined) return undefined;
    const name = rung(scales.space, container);
    return name
      ? mapped(`.frame({ ${keys[0]}: '${name}' })`)
      : token('space', `${container}px`, `.frame({ ${keys[0]}: … })`);
  }
  // Type.
  if ((m = /^text-(left|center|right|justify|start|end)$/.exec(utility)))
    return mapped(`.textAlign('${TEXT_ALIGN[m[1]]}')`);
  if (/^text-(wrap|nowrap|balance|pretty|ellipsis|clip)$/.test(utility))
    return utility === 'text-nowrap'
      ? mapped('.noWrap()')
      : modifier('text wrapping (balance, pretty)');
  if ((m = /^text-(.+)$/.exec(utility)))
    return fontSize(m[1]) ?? color(m[1], (r) => `.foreground(${r})`) ?? undefined;
  if (
    (m = /^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/.exec(utility))
  ) {
    const weight = rung(
      Object.fromEntries(Object.entries(scales.weight).map(([k, v]) => [k, Number(v)])),
      Number(TW_WEIGHT[m[1]]),
    );
    return weight ? mapped(`.weight('${weight}')`) : token('weight', TW_WEIGHT[m[1]], '.weight(…)');
  }
  if (utility === 'font-mono') return mapped(".font('mono')");
  if (/^font-/.test(utility)) {
    const role = presetType[utility.slice(5)];
    if (role) return fontSize(utility.slice(5));
    return drop('the family is Bloom’s: Text takes it from its font');
  }
  if ((m = /^leading-(.+)$/.exec(utility))) {
    const ratio = TW_LEADING[m[1]];
    if (ratio === undefined) {
      const value = spaceValue(m[1]);
      if (value === undefined) return undefined;
      const px = rung(scales.leadingPx, value);
      return px ? mapped(`.leading('${px}')`) : token('leading', `${value}px`, '.leading(…)');
    }
    const name = rung(scales.leading, ratio);
    return name ? mapped(`.leading('${name}')`) : token('leading', `${ratio}`, '.leading(…)');
  }
  if ((m = /^tracking-(.+)$/.exec(utility))) {
    const value = TW_TRACKING[m[1]];
    const raw = value === undefined ? m[1].replace(/^\[(.*)\]$/, '$1') : `${value}em`;
    const unit = /^(-?\d*\.?\d+)(em|px)$/.exec(raw);
    const name =
      unit === null
        ? undefined
        : rung(unit[2] === 'em' ? scales.tracking : scales.trackingPx, Number(unit[1]));
    return name ? mapped(`.tracking('${name}')`) : token('tracking', raw, '.tracking(…)');
  }
  if (['uppercase', 'lowercase', 'capitalize'].includes(utility))
    return mapped(`.textCase('${utility}')`);
  if (utility === 'italic') return mapped('.italic()');
  if (utility === 'underline') return mapped('.underline()');
  if (utility === 'line-through') return mapped('.strikethrough()');
  if (utility === 'truncate') return mapped('.lines(1)');
  if ((m = /^line-clamp-(\d+)$/.exec(utility))) return mapped(`.lines(${m[1]})`);
  if (utility === 'whitespace-nowrap') return mapped('.noWrap()');
  if (utility === 'select-none') return mapped('.selectable(false)');
  if (utility === 'select-text' || utility === 'select-all') return mapped('.selectable()');
  // Fills, borders, corners, opacity.
  if ((m = /^bg-(.+)$/.exec(utility))) return color(m[1], (r) => `.background(${r})`);
  if ((m = /^rounded(?:-(tl|tr|bl|br|ss|se|es|ee|t|b|l|r|s|e))?(?:-(.+))?$/.exec(utility)))
    return corner(m[2] ?? '', m[1] && CORNER_SIDE[m[1]]);
  if ((m = /^border(?:-([xytbserl]))?(?:-(\d+|hairline|\[\d+px\]))?$/.exec(utility))) {
    const edge = {
      '': 'all',
      t: 'top',
      b: 'bottom',
      s: 'leading',
      l: 'leading',
      e: 'trailing',
      r: 'trailing',
    }[m[1] ?? ''];
    if (edge === undefined) return modifier('a border on two sides');
    const width = (m[2] ?? '1').replace(/^\[(\d+)px\]$/, '$1');
    if (width === '0') return drop('no border is the default');
    const name = width === 'hairline' ? 'hairline' : rung(scales.borderWidth, Number(width));
    const call = `.border(role, ${name ? `'${name}'` : '…'}${edge === 'all' ? '' : `, '${edge}'`})`;
    return name ? mapped(call) : token('borderWidth', `${width}px`, call);
  }
  if ((m = /^border-(.+)$/.exec(utility))) return color(m[1], (r) => `.border(${r})`);
  if ((m = /^opacity-(\d+)$/.exec(utility))) {
    const value = Number(m[1]) / 100;
    const name = rung(scales.opacity, value);
    return name ? mapped(`.opacity('${name}')`) : token('opacity', `${value}`, '.opacity(…)');
  }
  if (utility === 'overflow-hidden')
    return mapped('.corner(…) clips; alone it needs a clip modifier');
  if (/^overflow-/.test(utility)) return structure('a ScrollView (Embed) for scrolling');
  // What the language says by other means, or does not say.
  if (utility === 'cursor-pointer') return drop('a pressable view takes the pointer');
  if (utility === 'group') return mapped('.hoverGroup()');
  if ((m = /^shadow(?:-(.+))?$/.exec(utility))) {
    const value = m[1] ?? '';
    if (scales.shadow[value] !== undefined) return mapped(`.shadow('${value}')`);
    if (value === 'none') return drop('a view has no shadow unless it says so');
    const exact = TW_SHADOW[value];
    if (exact !== undefined && scales.shadow[exact] !== undefined)
      return mapped(`.shadow('${exact}')`);
    return token('shadow', utility, '.shadow(…)');
  }
  if ((m = /^(ring|outline)(?:-(.+))?$/.exec(utility))) {
    const [, kind, value = ''] = m;
    if (value === 'none' || value === 'hidden' || value === '0') return mapped(".ring('none')");
    if (value === '' || /^\d+$/.test(value)) {
      const width = value === '' ? 1 : Number(value);
      const name = rung(scales.borderWidth, width);
      return name
        ? mapped(`.ring(role, '${name}')`)
        : token('borderWidth', `${width}px`, '.ring(role, …)');
    }
    const arbitrary = /^\[(\d+)px\]$/.exec(value);
    if (arbitrary) {
      const name = rung(scales.borderWidth, Number(arbitrary[1]));
      return name
        ? mapped(`.ring(role, '${name}')`)
        : token('borderWidth', `${arbitrary[1]}px`, '.ring(role, …)');
    }
    if ((m = /^offset-(.+)$/.exec(value))) {
      if (kind === 'outline' || /^\d+$/.test(m[1]))
        return space(m[1], (t) => `.ring(role, width, ${t})`);
      return modifier('a ring’s gap colour (ring-offset-<colour>)');
    }
    return color(value, (r) => `.ring(${r})`) ?? undefined;
  }
  if ((m = /^z-(.+)$/.exec(utility))) {
    if (m[1] === 'auto') return drop('a view stacks in its order unless it says otherwise');
    const level = Number(m[1].replace(/^\[(\d+)\]$/, '$1'));
    const name = rung(scales.zIndex, level);
    return name ? mapped(`.zIndex('${name}')`) : token('zIndex', `${level}`, '.zIndex(…)');
  }
  if ((m = /^(-?)translate-([xy])-(.+)$/.exec(utility))) {
    const [, negative, axis, value] = m;
    if (value.includes('/') || value.includes('['))
      return structure('a view centred on its parent: .overlay(view, alignment) on the parent');
    return space(value, (t) => `.offset({ ${axis}: ${t} })`, negative === '-');
  }
  if (/^(transition|duration|ease|delay|animate)(-|$)/.test(utility)) return motionUtility(utility);
  const entered = enterExit(utility);
  if (entered) return entered;
  // Small modifiers.
  if (utility === 'tabular-nums') return mapped('.monospacedDigit()');
  if (utility === 'pointer-events-none') return mapped('.allowsHitTesting(false)');
  if (utility === 'pointer-events-auto') return mapped('.allowsHitTesting(true)');
  if (utility === 'sr-only') return mapped('.accessibilityOnly()');
  if (utility === 'break-all') return mapped(".wordBreak('all')");
  if (utility === 'break-words' || utility === 'wrap-break-word')
    return mapped(".wordBreak('words')");
  if (utility === 'break-normal')
    return drop('a line breaks between words unless it says otherwise');
  if ((m = /^list-(disc|decimal)$/.exec(utility)))
    return mapped(`.listMarker('${m[1]}') (a stack)`);
  if (utility === 'list-none') return drop('a stack draws no markers unless it says so');
  if ((m = /^(-?)rotate-(\d+)$/.exec(utility))) {
    const degrees = Number(`${m[1]}${m[2]}`);
    const name = rung(scales.rotation, degrees);
    return name
      ? mapped(`.rotation('${name}')`)
      : token('rotation', `${degrees}°`, `.rotation(…) (${MOTION_LAYER})`);
  }
  if ((m = /^origin-(.+)$/.exec(utility))) {
    // Tailwind's named origins are the language's anchors (leading and trailing are left and right).
    const anchor = m[1].replace(/\bleft\b/, 'leading').replace(/\bright\b/, 'trailing');
    if (Object.hasOwn(scales.anchor, anchor))
      return motion(
        `.anchor('${anchor}'): the point the view scales and rotates about (${MOTION_LAYER})`,
      );
    return modifier(
      'a transform origin a library measures (a popover’s anchor): the language’s anchors are named points',
    );
  }
  if ((m = /^scale-(\d+|\[\d*\.?\d+\])$/.exec(utility))) {
    const factor = m[1].startsWith('[') ? Number(m[1].slice(1, -1)) : Number(m[1]) / 100;
    const name = rung(scales.scale, factor);
    return name ? mapped(`.scale('${name}')`) : token('scale', `${factor}`, '.scale(…)');
  }
  if ((m = /^basis-(.+)$/.exec(utility))) {
    const value = m[1];
    if (value === 'auto') return drop('a view’s basis is its size unless it says otherwise');
    if (value === 'full' || scales.length[value] !== undefined) return mapped(`.basis('${value}')`);
    return space(value, (t) => `.basis(${t})`);
  }
  if (
    /^(pointer-events|isolate|sr-only|not-sr-only|tabular-nums|object|fill|stroke|blur|backdrop|scale|rotate|origin|transform|will-change|appearance|resize|list|divide|break|hyphens|indent|align|order|basis|columns|box)(-|$)/.test(
      utility,
    )
  )
    return modifier(`\`${utility.split('-').filter(Boolean)[0]}\` (no modifier)`);
  return undefined;
}

// ── The table ────────────────────────────────────────────────────

const rows = [];
for (const [utility, { count, apps }] of Object.entries(usage.utilities)) {
  const result = resolve(utility) ?? {
    status: 'app',
    language: 'not a Bloom or Tailwind utility (an app’s own class)',
  };
  rows.push({ utility, count, apps: apps.length, ...result });
}

const STATUS = {
  mapped: 'Maps to a modifier and a token',
  structure: 'Expressed by the view’s structure',
  drop: 'Redundant in the language',
  token: 'Needs a named token (raw value)',
  appToken: 'An app’s own token (a brand colour)',
  motion: 'Maps to the motion layer',
  modifier: 'Needs a modifier the language lacks',
  app: 'An app’s own class',
};
const totals = Object.fromEntries(Object.keys(STATUS).map((s) => [s, { utilities: 0, uses: 0 }]));
for (const row of rows) {
  totals[row.status].utilities++;
  totals[row.status].uses += row.count;
}
const allUses = rows.reduce((n, row) => n + row.count, 0);
const pct = (n) => `${((100 * n) / allUses).toFixed(1)}%`;

const HEADER = 'GENERATED by packages/bloom-language/scripts/generate-classnames.mjs. Do not edit.';
/**
 * A bare Bloom icon element with no fill paints `primary`; a language `Icon`
 * follows the foreground around it. The codemods read this to keep the ink.
 */
const ICONS = {
  $comment:
    'A Bloom icon element with no fill and no style colour (`<RiHeartLine />`) paints primary; Icon(X) paints the foreground it is in. The codemod writes `bare` on every icon that relied on that default.',
  bare: ".foreground('primary')",
};

const json = `${JSON.stringify(
  {
    $comment: HEADER,
    icons: ICONS,
    utilities: Object.fromEntries(rows.map(({ utility, ...row }) => [utility, row])),
  },
  null,
  1,
)}\n`;

const cell = (text) => String(text).replace(/\|/g, '\\|');
const table = (list, columns) =>
  [
    `| ${columns.map(([title]) => title).join(' | ')} |`,
    `| ${columns.map(([, , align]) => (align === 'right' ? '---:' : '---')).join(' | ')} |`,
    ...list.map((row) => `| ${columns.map(([, get]) => cell(get(row))).join(' | ')} |`),
  ].join('\n');
const appsLine = Object.entries(usage.apps)
  .map(([name, { commit }]) => `${name} \`${commit}\``)
  .join(', ');
const COMMON = 2; // utilities written in at least this many apps get a row; the JSON has every one.
const byStatus = (status) => rows.filter((row) => row.status === status && row.apps >= COMMON);

const summaryTable = table(
  Object.entries(STATUS).map(([status, title]) => ({ status, title, ...totals[status] })),
  [
    ['', (r) => r.title],
    ['Utilities', (r) => r.utilities, 'right'],
    ['Uses', (r) => r.uses, 'right'],
    ['Share of uses', (r) => pct(r.uses), 'right'],
  ],
);

const tokenGroups = {};
for (const row of rows.filter((r) => r.status === 'token')) {
  const group = (tokenGroups[row.scale] ??= { values: new Map(), uses: 0 });
  group.uses += row.count;
  group.values.set(row.value, (group.values.get(row.value) ?? 0) + row.count);
}
const tokenTable = table(
  Object.entries(tokenGroups)
    .sort((a, b) => b[1].uses - a[1].uses)
    .map(([scale, group]) => ({
      scale,
      uses: group.uses,
      values: [...group.values]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([value, n]) => `${value} (${n})`)
        .join(', '),
    })),
  [
    ['Scale', (r) => r.scale],
    ['Uses', (r) => r.uses, 'right'],
    ['Raw values with no rung (uses)', (r) => r.values],
  ],
);

const columns = [
  ['Utility', (r) => `\`${r.utility}\``],
  ['Language', (r) => r.language],
  ['Uses', (r) => r.count, 'right'],
  ['Apps', (r) => r.apps, 'right'],
];
const tokenColumns = [
  ['Utility', (r) => `\`${r.utility}\``],
  ['Raw value', (r) => r.value],
  ['Becomes', (r) => r.language],
  ['Uses', (r) => r.count, 'right'],
  ['Apps', (r) => r.apps, 'right'],
];

/** A Tailwind variant prefix as the language's `when()` condition, when it has one. */
const CONDITION = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  xl: 'xl',
  '2xl': '2xl',
  dark: 'dark',
  hover: 'hovered',
  active: 'pressed',
  focus: 'focused',
  'focus-visible': 'focused',
  disabled: 'disabled',
  web: 'web',
  native: 'native',
  ios: 'ios',
  android: 'android',
};
const variantUses = Object.values(usage.variants).reduce((n, count) => n + count, 0);
const coveredUses = Object.entries(usage.variants)
  .filter(([variant]) => CONDITION[variant] !== undefined)
  .reduce((n, [, count]) => n + count, 0);
const variantShare = `${((100 * coveredUses) / variantUses).toFixed(1)}%`;
const variantLine = Object.entries(usage.variants)
  .slice(0, 16)
  .map(
    ([variant, n]) =>
      `\`${variant}:\` ${n}${CONDITION[variant] ? ` (\`when('${CONDITION[variant]}')\`)` : ''}`,
  )
  .join(', ');

const page = `---
title: Bloom language and className
description: Every Tailwind/NativeWind utility the Oxy apps write, as the language modifier and token it becomes, or flagged. Generated; it drives the app codemods.
---

{/* ${HEADER} */}

# Bloom language and className

The language replaces NativeWind's \`className\`. This table is every utility
the apps write (variant prefixes such as \`md:\` and \`dark:\` stripped), at each
app's default branch, resolved through Bloom's own vocabulary: its Tailwind
preset (spacing, radius, type roles and colour roles) and Tailwind's default
scales for the rest. A value becomes a token only when a language rung has
exactly that value; any other is flagged with its raw value, never kept as a
number. \`codemod/classnames.generated.json\` holds every row, for the codemods;
this page shows the utilities written in ${COMMON} apps or more.

Sources: \`scripts/scan-classnames.mjs\` (read-only, \`git grep\` at each
default branch) wrote \`codemod/classname-usage.json\` from ${Object.keys(usage.apps).length} apps:
${appsLine}. \`scripts/generate-classnames.mjs\` writes this page.

## Summary

${summaryTable}

${allUses} uses of ${rows.length} utilities. Variant prefixes are \`when(condition, …)\`
over the utility they prefix; ${coveredUses} of their ${variantUses} uses (${variantShare}) have a
condition: ${variantLine}.

## Raw values that need a token

${tokenTable}

## Classes that render nothing

A utility spelled with a Bloom key its preset does not have (\`py-space-6\`,
\`gap-space-6\`, \`pb-space-64\`) matches no rule, so it draws nothing today. The
codemod drops it, which keeps the look exactly as it is; the apps are not
edited for it. These rows are under *Redundant in the language*.

## Icons

A Bloom icon element given no fill and no style colour (\`<RiHeartLine />\`;
a \`text-*\` class is a style colour) paints \`primary\`, wherever it sits. A language \`Icon(X)\` paints the foreground of the view it is
in, as SwiftUI's does (\`foreground\` when nothing sets one). So the codemod
writes \`${ICONS.bare}\` on every icon element that had neither, which keeps
the primary it painted. An icon given a fill keeps it as \`.foreground(role)\`
when the fill is a role's colour.

## Maps to a modifier and a token

${table(byStatus('mapped'), columns)}

## Expressed by the view's structure

${table(byStatus('structure'), columns)}

## Redundant in the language

${table(byStatus('drop'), columns)}

## Needs a named token

${table(byStatus('token'), tokenColumns)}

## Maps to the motion layer

Bloom's motion engine (\`@oxy.so/bloom/motion\`) plays the language's motion
modifiers (\`.animation()\`, \`.transition()\`, \`.keyframes()\`,
\`.repeatForever()\`, \`.delay()\`, \`.anchor()\`). What it plays is here.
Tailwind's durations and curves are none of Bloom's motion tokens (its default
curve is \`cubic-bezier(0.4, 0, 0.2, 1)\`), so each is an app's own motion,
declared with its exact numbers (*An app's own token*); its spin and pulse are
the language's loops, and its delays the duration tokens. What the engine has
no equivalent for (a transition of every property, a layout transition, a
bounce or a ping) is under *Needs a modifier the language lacks*.

${table(byStatus('motion'), columns)}

## Needs a modifier the language lacks

${table(byStatus('modifier'), columns)}

## An app's own token

A raw hex (\`bg-[#0d0d0d]\`, \`text-[#5b6573]\`) is an app's brand colour, not
a Bloom role: it becomes the app's own token, declared once with
\`defineTokens\`, never a Bloom token. Every one is listed, whatever its count.

${table(
  rows.filter((row) => row.status === 'appToken'),
  tokenColumns,
)}

## An app's own class

${table(byStatus('app').slice(0, 60), columns)}
`;

const docPath = join(bloom, 'docs/bloom-language.mdx');
const doc = readFileSync(docPath, 'utf8');
const START = '{/* GENERATED:classnames — scripts/generate-classnames.mjs */}';
const END = '{/* /GENERATED:classnames */}';
const summary = `${START}

${summaryTable}

${allUses} uses of ${rows.length} utilities across ${Object.keys(usage.apps).length} apps. Of the
${variantUses} variant prefixes written over them, ${coveredUses} (${variantShare}) are a \`when()\`
condition. The values with no rung, by scale (the owner names each as a token or keeps it out):

${tokenTable}

${END}`;
const startAt = doc.indexOf(START);
const endAt = doc.indexOf(END);
if (startAt < 0 || endAt < 0) throw new Error(`docs/bloom-language.mdx has no ${START} … ${END}`);
const nextDoc = doc.slice(0, startAt) + summary + doc.slice(endAt + END.length);

const outputs = [
  [join(pkg, 'codemod/classnames.generated.json'), json],
  [join(bloom, 'docs/bloom-language-classnames.mdx'), page],
  [docPath, nextDoc],
];
let stale = 0;
for (const [path, text] of outputs) {
  if (check) {
    let current = '';
    try {
      current = readFileSync(path, 'utf8');
    } catch {}
    if (current !== text) {
      console.error(`stale: ${path} (run: node scripts/generate-classnames.mjs)`);
      stale++;
    }
  } else writeFileSync(path, text);
}
if (stale) process.exit(1);
console.log(
  check
    ? 'className table is current'
    : `className table: ${rows.length} utilities, ${Object.entries(totals)
        .map(([s, t]) => `${s} ${t.utilities}`)
        .join(', ')}`,
);
