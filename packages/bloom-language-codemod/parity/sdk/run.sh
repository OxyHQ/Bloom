#!/usr/bin/env bash
# Parity of an SDK's className → style conversion (README.md).
#   parity/sdk/run.sh <dir with table.json [and extra.json]> [native|web|both]
set -euo pipefail
W=$(cd "$1" && pwd); MODE=${2:-both}
HERE=$(cd "$(dirname "$0")/../.." && pwd)
cd "$HERE"
node -e 'const fs=require("fs"); const w=process.argv[1]; const t=JSON.parse(fs.readFileSync(w+"/table.json")); const e=fs.existsSync(w+"/extra.json")?JSON.parse(fs.readFileSync(w+"/extra.json")):[]; fs.writeFileSync(w+"/table.all.json", JSON.stringify([...t,...e]))' "$W"
bun parity/sdk/corpus.ts "$W/table.all.json" "$W/corpus"
[ "$MODE" != web ] && CODEMOD_CORPUS=$W/corpus ../../node_modules/.bin/jest --selectProjects 'parity native' --maxWorkers=4 parity/corpus.parity.test.tsx || true
[ "$MODE" != native ] && CODEMOD_CORPUS=$W/corpus ../../node_modules/.bin/jest --selectProjects 'parity web' --maxWorkers=4 parity/corpus.parity.web.test.tsx || true
