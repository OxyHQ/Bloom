/** The codemod's report: what converted, and every element that did not, with why. */
import { relative } from 'node:path';
import type { FileResult } from './transform';

export interface ReportOptions {
  readonly app: string;
  readonly overridden: ReadonlySet<string>;
}

export function report(
  results: readonly { file: string; result: FileResult }[],
  options: ReportOptions,
) {
  let candidates = 0;
  let converted = 0;
  let regions = 0;
  const components = new Map<string, number>();
  const byCode = new Map<string, { elements: number; subjects: Map<string, number> }>();
  const elements: {
    file: string;
    line: number;
    element: string;
    reasons: { subject: string; code: string; why: string }[];
  }[] = [];
  for (const { file, result } of results) {
    candidates += result.candidates;
    converted += result.converted;
    regions += result.regions;
    for (const [key, count] of Object.entries(result.bloomComponents))
      components.set(key, (components.get(key) ?? 0) + count);
    for (const u of result.unconverted) {
      elements.push({ file, line: u.line, element: u.element, reasons: [...u.reasons] });
      for (const code of new Set(u.reasons.map((r) => r.code))) {
        const entry = byCode.get(code) ?? { elements: 0, subjects: new Map() };
        entry.elements++;
        byCode.set(code, entry);
      }
      for (const r of u.reasons) {
        const entry = byCode.get(r.code);
        if (entry) entry.subjects.set(r.subject, (entry.subjects.get(r.subject) ?? 0) + 1);
      }
    }
  }
  const rate = candidates ? (100 * converted) / candidates : 0;
  const patterns = [...byCode]
    .sort((a, b) => b[1].elements - a[1].elements)
    .map(([code, { elements: count, subjects }]) => ({
      code,
      elements: count,
      top: [...subjects].sort((a, b) => b[1] - a[1]).slice(0, 6),
    }));
  const json = {
    app: relative(process.cwd(), options.app) || '.',
    files: results.length,
    changedFiles: results.filter((r) => r.result.changed).length,
    candidates,
    converted,
    regions,
    rate: Number(rate.toFixed(1)),
    overridden: [...options.overridden].sort(),
    bloomComponents: Object.fromEntries([...components].sort((a, b) => b[1] - a[1])),
    patterns: patterns.map((p) => ({
      code: p.code,
      elements: p.elements,
      top: Object.fromEntries(p.top),
    })),
    unconverted: elements,
  };
  const lines = [
    `# Bloom language codemod: ${relative(process.cwd(), options.app) || '.'}`,
    '',
    `- Files: ${json.files} read, ${json.changedFiles} changed`,
    `- Elements considered (React Native View, Pressable, Text, Image; Bloom Text, Button, icons): ${candidates}`,
    `- Converted: ${converted} (${rate.toFixed(1)}%), in ${regions} regions`,
    `- Classes the app's theme draws differently from Bloom's: ${options.overridden.size}`,
    '',
    '## Why elements stayed JSX',
    '',
    '| Reason | Elements | Most frequent |',
    '| --- | ---: | --- |',
    ...patterns.map(
      (p) => `| ${p.code} | ${p.elements} | ${p.top.map(([s, c]) => `\`${s}\` ${c}`).join(', ')} |`,
    ),
    '',
    '## Bloom components left as JSX',
    '',
    'Not mapped by the codemod yet (each needs its prop rules and parity first):',
    '',
    '| Component | Elements |',
    '| --- | ---: |',
    ...[...components]
      .sort((a, b) => b[1] - a[1])
      .map(([key, count]) => `| \`${key.replace('#', '` `')}\` | ${count} |`),
    '',
    '## Each element',
    '',
    ...elements.map(
      (e) =>
        `- ${e.file}:${e.line} \`<${e.element}>\`: ${e.reasons.map((r) => `\`${r.subject}\` (${r.code}${r.why ? `: ${r.why}` : ''})`).join('; ')}`,
    ),
    '',
  ];
  return { json, markdown: lines.join('\n') };
}
