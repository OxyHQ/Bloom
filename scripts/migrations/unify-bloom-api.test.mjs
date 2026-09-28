import { test } from 'node:test';
import assert from 'node:assert/strict';
import { migrateSource } from './unify-bloom-api.mjs';

test('migrates only imported Bloom controls, preserving explicit semantic axes', () => {
  const input = `import {Button as Action} from '@oxy.so/bloom/button';
import {Button} from 'other-ui';
const a = <Action variant="secondary" tone="danger" size="small">Save</Action>;
const b = <Button variant="primary" size="small"/>;`;
  const output = migrateSource(input).source;
  assert.match(output, /<Action\s+tone="danger" size="sm" appearance="outline">/);
  assert.match(output, /<Button variant="primary" size="small"\/>/);
  assert.equal(migrateSource(output).source, output);
});

test('maps card plain to material plus no elevation; leaves explicit appearance authoritative', () => {
  const result = migrateSource(`import {Card} from '@oxy.so/bloom'; const a=<Card variant="plain"/>; const b=<Card variant="plain" appearance="outline"/>;`).source;
  assert.match(result, /elevation="none" appearance="solid"/);
  assert.equal((result.match(/elevation=/g) ?? []).length,1);
});

test('moves links to existing semantic component and preserves closing tag', () => {
  const output = migrateSource(`import {Button} from '@oxy.so/bloom/button'; const a=<Button variant="link">Read</Button>;`).source;
  assert.match(output, /import \{Button, LinkButton \}/);
  assert.match(output, /<LinkButton\s*>Read<\/LinkButton>/);
  assert.equal(migrateSource(output).source,output);
});

test('joins scope imports, preserves alias, and canonicalizes boolean change events', () => {
  const output = migrateSource(`import {ControlSurface as Scope} from '@oxy.so/bloom/control-surface'; import {Switch} from '@oxy.so/bloom'; const a=<Scope density="small"><Switch value={on} onValueChange={setOn}/></Scope>;`).source;
  assert.match(output, /BloomScope as Scope/);
  assert.match(output, /@oxy.so\/bloom\/appearance/);
  assert.match(output, /<Scope size="sm">/);
  assert.match(output, /checked=\{on\} onCheckedChange=\{setOn\}/);
});

test('reports dynamic variants without guessing or evaluating them twice', () => {
  const input=`import {Button} from '@oxy.so/bloom'; const a=<Button variant={chooseVariant()}/>;`;
  const result=migrateSource(input);
  assert.equal(result.source,input);
  assert.equal(result.warnings.length,1);
});


test('preserves the smaller Fab geometry and reports parent coordination work', () => {
  const result = migrateSource(`import {Fab} from '@oxy.so/bloom'; const a=<Fab size="small" placement="bottom-right" variant="surface"/>;`);
  assert.match(result.source, /size="xs"/);
  assert.match(result.source, /tone="neutral"/);
  assert.match(result.source, /appearance="subtle"/);
  assert.equal(result.warnings.length, 1);
  assert.match(result.warnings[0].reason, /Screen/);
});


test('does not override semantic values hidden in spread props', () => {
  const input = `import {Button} from '@oxy.so/bloom'; const a=<Button {...props} variant="secondary"/>;`;
  const result = migrateSource(input);
  assert.equal(result.source, input);
  assert.equal(result.warnings.length, 1);
});

test('reports link and inverse conflicts with explicit visual axes', () => {
  for (const variant of ['link', 'inverse']) {
    const input = `import {Button} from '@oxy.so/bloom'; const a=<Button variant="${variant}" appearance="solid" tone="danger"/>;`;
    const result = migrateSource(input);
    assert.equal(result.source, input);
    assert.equal(result.warnings.length, 1);
  }
});

test('does not collide with unrelated named imports', () => {
  const input = `import {Button} from '@oxy.so/bloom'; import {LinkButton} from 'other-ui'; const a=<Button variant="link"/>;`;
  const result = migrateSource(input);
  assert.equal(result.source, input);
  assert.equal(result.warnings.length, 1);
});

test('does not rewrite mixed legacy scope imports into a nonexistent API', () => {
  const input = `import {ControlSurface, useControlSurface} from '@oxy.so/bloom/control-surface'; const a=<ControlSurface density="small"/>;`;
  const result = migrateSource(input);
  assert.equal(result.source, input);
  assert.equal(result.warnings.length, 1);
});


test('external mode leaves application-owned relative components alone', () => {
  const input = `import {Button} from './button'; const a=<Button variant="secondary"/>;`;
  assert.equal(migrateSource(input).source, input);
  assert.notEqual(migrateSource(input, 'file.tsx', false, true).source, input);
});

test('namespace imports are reported instead of claiming a complete migration', () => {
  const result = migrateSource(`import * as Bloom from '@oxy.so/bloom'; const a=<Bloom.Button variant="primary"/>;`);
  assert.equal(result.warnings.length, 1);
});
