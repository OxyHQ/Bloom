#!/usr/bin/env bash
# The CLI as an app installs it: the codemod and the language packed as the
# release packs them (`bun pm pack --ignore-scripts`, from their built trees),
# installed with npm in an empty project outside this repository (peers left
# out; nothing published in the last week resolves, as bunfig.toml's
# quarantine holds for bun), and run on Node: `--help`, then a one-file app
# whose one element must convert. npm, not bun: bun resolves a peer from the
# registry even when it is not installed, and neither package is on it yet.
#   scripts/verify-packed-cli.sh   (after `bun run build` here and in ../bloom-language)
set -euo pipefail
HERE=$(cd "$(dirname "$0")/.." && pwd)
REPO=$(cd "$HERE/../.." && pwd)
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

pack() {
  local dir=$1 name version
  name=$(node -p "require('$dir/package.json').name.replace('@', '').replace('/', '-')")
  version=$(node -p "require('$dir/package.json').version")
  (cd "$dir" && bun pm pack --ignore-scripts --quiet --destination "$WORK" >/dev/null)
  echo "$WORK/$name-$version.tgz"
}
codemod=$(pack "$HERE")
language=$(pack "$REPO/packages/bloom-language")

cd "$WORK"
echo '{ "name": "codemod-packed-check", "private": true }' > package.json
npm install --no-audit --no-fund --ignore-scripts --legacy-peer-deps \
  --before "$(node -p 'new Date(Date.now() - 7 * 864e5).toISOString()')" \
  "$codemod" "$language" >/dev/null

cli=node_modules/.bin/bloom-language-codemod
node "$cli" --help | grep -q '^Usage: bloom-language-codemod'

mkdir app
cat > app/Row.tsx <<'TSX'
import { View } from 'react-native';

export function Row() {
  return <View className="flex-row gap-3 p-4" />;
}
TSX
node "$cli" app --out out >/dev/null
grep -q 'Converted: 1 (100.0%)' out/report.md
grep -q 'HStack()' out/files/Row.tsx
echo "The packed CLI runs on Node: --help, and Row.tsx converted:"
grep 'HStack' out/files/Row.tsx
