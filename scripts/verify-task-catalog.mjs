import { execFileSync } from 'node:child_process';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
execFileSync(process.execPath, [join(root, 'scripts/generate-task-catalog.mjs'), '--check'], {
  cwd: root,
  stdio: 'inherit',
});
mkdirSync(join(root, '.local'), { recursive: true });
const scratch = mkdtempSync(join(root, '.local/task-catalog-'));
try {
  // A separate package boundary prevents Node/TS self-reference from resolving
  // @oxy.so/bloom back to this repository's package.json.
  writeFileSync(
    join(scratch, 'package.json'),
    JSON.stringify({ name: 'bloom-task-catalog-consumer', private: true, type: 'module' }),
  );
  const packedResult = JSON.parse(
    execFileSync('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', scratch], {
      cwd: root,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    }),
  );
  const packed = Array.isArray(packedResult) ? packedResult[0] : Object.values(packedResult)[0];
  if (!packed?.filename || !Array.isArray(packed.files))
    throw Error('Unrecognized npm pack result');
  execFileSync('tar', ['-xzf', join(scratch, packed.filename), '-C', scratch]);
  const packageRoot = join(scratch, 'package');
  const manifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'));
  const catalog = JSON.parse(readFileSync(join(packageRoot, 'docs/task-catalog.json'), 'utf8'));
  if (catalog.package.version !== manifest.version || catalog.package.name !== manifest.name)
    throw Error('Catalog version differs from packed package');
  mkdirSync(join(scratch, 'node_modules/@oxy.so'), { recursive: true });
  symlinkSync(packageRoot, join(scratch, 'node_modules/@oxy.so/bloom'), 'dir');
  const examples = [];
  for (const task of catalog.tasks) {
    for (const target of [...task.docs, task.example, 'docs/AGENTS.md'])
      readFileSync(join(packageRoot, target));
    const file = join(scratch, `${task.id}.tsx`);
    cpSync(join(packageRoot, task.example), file);
    examples.push(file);
  }
  const control = join(scratch, 'missing-export.ts');
  writeFileSync(
    control,
    "import { CatalogMissingExportControl } from '@oxy.so/bloom/screen';\nvoid CatalogMissingExportControl;\n",
  );
  for (const platform of ['browser', 'react-native']) {
    const options = {
      noEmit: true,
      strict: true,
      skipLibCheck: true,
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
      customConditions: [platform],
      types: [],
    };
    const assertImports = () => {
      for (const task of catalog.tasks)
        for (const item of task.imports) {
          const resolution = ts.resolveModuleName(
            item.from,
            join(scratch, `${task.id}.tsx`),
            options,
            ts.sys,
          ).resolvedModule;
          const file = resolution && realpathSync(resolution.resolvedFileName);
          if (!file?.startsWith(join(packageRoot, 'lib/typescript/')) || !file.endsWith('.d.ts'))
            throw Error(`${platform}: ${item.from} did not resolve packed declarations: ${file}`);
        }
    };
    assertImports();
    if (platform === 'react-native') {
      const original = readFileSync(join(packageRoot, 'package.json'), 'utf8');
      const mutated = JSON.parse(original);
      mutated.exports['./screen']['react-native'].types = './src/screen/index.ts';
      writeFileSync(join(packageRoot, 'package.json'), JSON.stringify(mutated));
      let rejected = false;
      try {
        assertImports();
      } catch (error) {
        if (!String(error).includes('@oxy.so/bloom/screen did not resolve packed declarations'))
          throw error;
        rejected = true;
      } finally {
        writeFileSync(join(packageRoot, 'package.json'), original);
      }
      if (!rejected) throw Error('Packed source-export negative control did not fail');
      console.log('Task catalog: native source-export mutation rejected');
    }
    const program = ts.createProgram([...examples, control], options);
    const diagnostics = ts.getPreEmitDiagnostics(program);
    const controlErrors = diagnostics.filter((error) => error.file?.fileName === control);
    if (!controlErrors.some((error) => error.code === 2305))
      throw Error(`${platform}: missing-export control did not fail`);
    const errors = diagnostics.filter((error) => error.file?.fileName !== control);
    if (errors.length)
      throw Error(
        ts.formatDiagnosticsWithColorAndContext(errors, {
          getCanonicalFileName: (file) => file,
          getCurrentDirectory: () => scratch,
          getNewLine: () => '\n',
        }),
      );
    const files = program.getSourceFiles().map((file) => file.fileName);
    if (!files.some((file) => file.startsWith(join(packageRoot, 'lib/typescript/'))))
      throw Error(`${platform}: no packed declarations resolved`);
    if (
      files.some((file) =>
        [join(root, 'src/'), join(packageRoot, 'src/')].some((source) => file.startsWith(source)),
      )
    )
      throw Error(`${platform}: resolved repository source instead of packed declarations`);
    console.log(
      `Task catalog: ${examples.length} packed examples compile with ${platform}; missing-export control fails`,
    );
  }
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
