#!/usr/bin/env bash
# Type-checks the standard library's emitted TS with tsc, with its runtime.ts.
# `cargo test -p bloom_lang --test stdlib` writes it (target/tmp/stdlib/compiles/.bloom/std/Bloom).
# Run from anywhere: crates/lang/tests/tsc/check-stdlib.sh
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
compiler="$(cd "$here/../../../.." && pwd)"
std="${CARGO_TARGET_TMPDIR:-${CARGO_TARGET_DIR:-$compiler/target}/tmp}/stdlib/compiles/.bloom/std/Bloom"
if [ ! -f "$std/Core.ts" ]; then
  echo "no emitted standard library at $std: run cargo test -p bloom_lang --test stdlib first" >&2
  exit 1
fi
out="$here/out-stdlib"
rm -rf "$out" && mkdir -p "$out"
# The runtime files (runtime.ts, routing.ts, router.ts, …) as written, the emitted files beside them.
cp "$compiler"/stdlib/Bloom/*.ts "$out/"
# The language's string helpers the standard library carries (`text.ts`, embedded: the source
# tree's `text.ts` is a re-export for checks in place) and their break table.
cp "$std/text.ts" "$out/text.ts"
mkdir -p "$out/generated" && cp "$std"/generated/*.ts "$out/generated/"
# The language's runtime, as far as the standard library names it.
cat > "$out/bloom-language.d.ts" <<'TS'
declare module '@oxy.so/bloom-language' {
  export type Child = { readonly kind: string } | string | number | null | undefined;
  export type Binding<T> = readonly [value: T, set: (value: T) => void];
  export function Embed(content: unknown): Child;
  export function toElement(view: Child): import('react').ReactElement | null;
  export function characterCount(s: string): number;
  export function characterSlice(s: string, start: number, end?: number): string;
  export function characters(s: string): string[];
  export function characterOffset(s: string, u: number): number;
  export function utf16Offset(s: string, n: number): number;
  export class Observable {
    $set(field: string, value: unknown): void;
    $subscribe(fields: readonly string[], listener: () => void): () => void;
  }
}
declare module '@oxy.so/bloom-language/video-view' {
  export function videoAttach(model: object, url?: string): void;
  export function videoPlay(model: object): void;
  export function videoPause(model: object): void;
  export function videoSeek(model: object, seconds: number): void;
}
TS
# What the Bloom router (router.ts) draws with beyond React and React Native, as far as it
# names it.
cat > "$out/router-deps.d.ts" <<'TS'
declare module 'react-native-pager-view' {
  import { Component } from 'react';
  export default class PagerView extends Component<Record<string, unknown>> {
    setPage(index: number): void;
  }
}
declare module 'react-native-reanimated' {
  export function useSharedValue<T>(initial: T): { value: T };
}
declare module 'react-native-screens' {
  import type { ComponentType } from 'react';
  export const ScreenStack: ComponentType<Record<string, unknown>>;
  export const ScreenStackItem: ComponentType<Record<string, unknown>>;
}
declare module '@oxy.so/bloom/bottom-bar' {
  import type { ComponentType } from 'react';
  export const BottomBar: ComponentType<Record<string, unknown>>;
}
declare module '@oxy.so/bloom-language/screen-host' {
  import type { ReactNode } from 'react';
  import type { Child } from '@oxy.so/bloom-language';
  export function drawScreen(
    root: Child,
    options?: { readonly back?: () => void; readonly throughViews?: boolean },
  ): ReactNode;
}
declare module '@oxy.so/bloom/theme' {
  export function useThemeColor(key: string): string;
}
TS
for ts in "$std"/*.ts; do
  name="$(basename "$ts")"
  [ -f "$compiler/stdlib/Bloom/$name" ] && continue
  # tsc reads `./Core.bloom` as the module `./Core`, which the copy is.
  sed -E 's/from "\.\/([A-Za-z]+)\.bloom"/from ".\/\1"/' "$ts" > "$out/$name"
done
tsc="${TSC:-$(cd "$compiler/../.." && pwd)/node_modules/.bin/tsc}"
# `data.ts` is checked against the data layer's own sources (`packages/bloom-data`).
data="$(cd "$compiler/../bloom-data" && pwd)/src"
cat > "$out/tsconfig.json" <<JSON
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "paths": {
      "@oxy.so/bloom-data": ["$data/index.ts"],
      "@oxy.so/bloom-data/sqlite": ["$data/sqlite.ts"]
    },
    "strict": true,
    "noEmit": true,
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "module": "ES2022",
    "moduleResolution": "bundler",
    "skipLibCheck": true,
    "isolatedModules": true,
    "noUncheckedIndexedAccess": true,
    "types": []
  },
  "include": ["*.ts"]
}
JSON
if (cd "$out" && "$tsc" -p tsconfig.json); then
  echo "tsc: the standard library's $(ls "$out"/*.ts | wc -l) files type-check"
else
  exit 1
fi
