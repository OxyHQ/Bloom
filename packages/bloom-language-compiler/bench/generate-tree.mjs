#!/usr/bin/env node
// Write a synthetic app tree twice, as `.bloom` and as the equivalent
// hand-written embedded-language TSX, for the compiler benchmarks:
//
//   node bench/generate-tree.mjs <out-dir> [files=1000] [seed=1]
//
// writes <out-dir>/bloom/** and <out-dir>/tsx/**. The mix is what an app holds:
// models (structs, enums with a match, list logic), rows (a view with params,
// a derived let, a conditional child, a modifier chain) and screens (@state,
// derived lets, a handler, a list built with `for`, a match in the body),
// importing each other.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const [outDir, filesArg = '1000', seedArg = '1'] = process.argv.slice(2);
if (!outDir) {
  console.error('usage: generate-tree.mjs <out-dir> [files=1000] [seed=1]');
  process.exit(2);
}
const total = Number(filesArg);
let seed = Number(seedArg) >>> 0 || 1;
/** A small deterministic PRNG (xorshift32), so a seed always gives the same tree. */
function random() {
  seed ^= seed << 13;
  seed ^= seed >>> 17;
  seed ^= seed << 5;
  return (seed >>> 0) / 0x1_0000_0000;
}
const pick = (items) => items[Math.floor(random() * items.length)];

const SPACES = ['xs', 'sm', 'md', 'lg'];
const FONTS = ['headline', 'body', 'caption-1', 'title-3'];
const COLORS = ['muted', 'primary', 'foreground', 'textTertiary'];
const FILLS = ['card', 'surface', 'background', 'primary/10'];

const models = Math.round(total * 0.3);
const rows = Math.round(total * 0.4);
const screens = total - models - rows;

const written = { bloom: 0, tsx: 0 };
function write(kind, path, text) {
  const file = join(outDir, kind, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text);
  written[kind]++;
}

rmSync(outDir, { recursive: true, force: true });

for (let i = 0; i < models; i++) {
  const extra = pick(['note', 'author', 'tag']);
  write(
    'bloom',
    `models/Model${i}.bloom`,
    `/// Model ${i}: an item, its load state and the logic over them.
pub struct Item${i} {
  id: String
  title: String
  ${extra}: String = ""
  count: Int = 0
  pinned: Bool = false
}

pub enum Status${i} {
  idle
  loading
  failed(message: String)
  ready(count: Int)
}

pub fn label${i}(status: Status${i}) -> String {
  match status {
    case .idle => "Idle"
    case .loading => "Loading"
    case .failed(message) => "Failed: \${message}"
    case .ready(count) => "\${count} ready"
  }
}

pub fn score${i}(items: [Item${i}]) -> Int {
  let pinned = items.filter { it in it.pinned }
  pinned.count * ${2 + (i % 5)} + items.count
}

pub fn rename${i}(item: Item${i}, title: String) -> Item${i} {
  item.with(title: title.trimmed())
}
`,
  );
  write(
    'tsx',
    `models/Model${i}.ts`,
    `/** Model ${i}: an item, its load state and the logic over them. */
export interface Item${i} {
  readonly id: string;
  readonly title: string;
  readonly ${extra}: string;
  readonly count: number;
  readonly pinned: boolean;
}

export type Status${i} =
  | 'idle'
  | 'loading'
  | { readonly tag: 'failed'; readonly message: string }
  | { readonly tag: 'ready'; readonly count: number };

export function label${i}(status: Status${i}): string {
  if (status === 'idle') return 'Idle';
  if (status === 'loading') return 'Loading';
  if (status.tag === 'failed') return \`Failed: \${status.message}\`;
  return \`\${status.count} ready\`;
}

export function score${i}(items: readonly Item${i}[]): number {
  const pinned = items.filter((it) => it.pinned);
  return pinned.length * ${2 + (i % 5)} + items.length;
}

export function rename${i}(item: Item${i}, title: string): Item${i} {
  return { ...item, title: title.trim() };
}
`,
  );
}

for (let i = 0; i < rows; i++) {
  const m = i % models;
  const [gap, pad, font, color, fill] = [
    pick(SPACES),
    pick(SPACES),
    pick(FONTS),
    pick(COLORS),
    pick(FILLS),
  ];
  write(
    'bloom',
    `rows/Row${i}.bloom`,
    `import { Item${m} } from "../models/Model${m}.bloom"

pub view Row${i}(item: Item${m}, compact: Bool = false) {
  let subtitle = item.pinned ? "Pinned" : "\${item.count} items"

  body {
    HStack {
      VStack {
        Text(item.title).font("${font}").lines(1)
        if !compact {
          Text(subtitle).foreground("${color}").font("caption-1")
        }
      }
      .spacing("2xs")
      Spacer()
      Text("\${item.count}").foreground("muted")
    }
    .spacing("${gap}")
    .padding("${pad}")
    .background("${fill}")
    .corner("lg")
  }
}
`,
  );
  write(
    'tsx',
    `rows/Row${i}.tsx`,
    `import { HStack, Spacer, Text, VStack, view } from '@oxy.so/bloom-language';
import type { Item${m} } from '../models/Model${m}';

export const Row${i} = view(function Row${i}({ item, compact = false }: { item: Item${m}; compact?: boolean }) {
  const subtitle = item.pinned ? 'Pinned' : \`\${item.count} items\`;
  return HStack(
    VStack(
      Text(item.title).font('${font}').lines(1),
      !compact ? Text(subtitle).foreground('${color}').font('caption-1') : null,
    ).spacing('2xs'),
    Spacer(),
    Text(\`\${item.count}\`).foreground('muted'),
  )
    .spacing('${gap}')
    .padding('${pad}')
    .background('${fill}')
    .corner('lg');
});
`,
  );
}

for (let i = 0; i < screens; i++) {
  const m = i % models;
  const r = i % rows;
  const rm = r % models;
  const [gap, pad] = [pick(SPACES), pick(SPACES)];
  const bloomModelImports =
    m === rm
      ? `import { Item${rm}, Status${m}, label${m} } from "../models/Model${m}.bloom"`
      : `import { Status${m}, label${m} } from "../models/Model${m}.bloom"\nimport { Item${rm} } from "../models/Model${rm}.bloom"`;
  write(
    'bloom',
    `screens/Screen${i}.bloom`,
    `${bloomModelImports}
import { Row${r} } from "../rows/Row${r}.bloom"

pub view Screen${i}(items: [Item${rm}], title: String = "Screen ${i}") {
  @state query = ""
  @state compact = false
  @state status: Status${m} = .idle

  let visible = items.filter { it in it.title.lowercased().contains(query.lowercased()) }
  let total = visible.count
  let heading = total == 0 ? "Nothing yet" : "\${title}: \${total}"

  fn toggle() {
    compact = !compact
  }

  fn reload() {
    status = Status${m}.ready(count: total)
  }

  body {
    VStack {
      Text(heading).font("title-3")
      TextField($query, "Search")
      Text(label${m}(status)).foreground("muted")
      for item in visible {
        Row${r}(item: item, compact: compact)
      }
      match status {
        case .failed(message) => Text(message).foreground("error")
        case _ => Spacer()
      }
      HStack {
        Button(Text(compact ? "Expand" : "Compact")).onPress { toggle() }
        Button(Text("Reload")).onPress { reload() }
      }
      .spacing("sm")
    }
    .spacing("${gap}")
    .padding("${pad}")
  }
}
`,
  );
  const modelImports =
    m === rm
      ? `import { label${m}, type Item${rm}, type Status${m} } from '../models/Model${m}';`
      : `import { label${m}, type Status${m} } from '../models/Model${m}';\nimport type { Item${rm} } from '../models/Model${rm}';`;
  write(
    'tsx',
    `screens/Screen${i}.tsx`,
    `import { useCallback, useMemo, useState } from 'react';
import { Button, HStack, Spacer, Text, TextField, VStack, view } from '@oxy.so/bloom-language';
${modelImports}
import { Row${r} } from '../rows/Row${r}';

export const Screen${i} = view(function Screen${i}({ items, title = 'Screen ${i}' }: { items: readonly Item${rm}[]; title?: string }) {
  const query = useState('');
  const [compact, setCompact] = useState(false);
  const [status, setStatus] = useState<Status${m}>('idle');

  const visible = useMemo(
    () => items.filter((it) => it.title.toLowerCase().includes(query[0].toLowerCase())),
    [items, query[0]],
  );
  const total = visible.length;
  const heading = total === 0 ? 'Nothing yet' : \`\${title}: \${total}\`;

  const toggle = useCallback(() => setCompact((c) => !c), []);
  const reload = useCallback(() => setStatus({ tag: 'ready', count: total }), [total]);

  return VStack(
    Text(heading).font('title-3'),
    TextField(query, 'Search'),
    Text(label${m}(status)).foreground('muted'),
    visible.map((item) => Row${r}({ item, compact })),
    typeof status === 'object' && status.tag === 'failed' ? Text(status.message).foreground('error') : Spacer(),
    HStack(
      Button(Text(compact ? 'Expand' : 'Compact')).onPress(toggle),
      Button(Text('Reload')).onPress(reload),
    ).spacing('sm'),
  )
    .spacing('${gap}')
    .padding('${pad}');
});
`,
  );
}

console.log(JSON.stringify({ outDir, files: total, models, rows, screens, written }));
