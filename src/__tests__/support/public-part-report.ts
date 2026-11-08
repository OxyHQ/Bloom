import classifications from './public-part-classifications.json';
import { derivePublicParts, type PartCensus } from './public-parts';

export const PART_CLASSIFICATIONS = classifications;
export function partClassificationKeys() {
  return Object.values(classifications)
    .flatMap((group) => group.parts)
    .sort();
}
export function renderPublicPartCensus(census: PartCensus = derivePublicParts()) {
  const byPart = new Map(
    Object.entries(classifications).flatMap(([key, group]) =>
      group.parts.map((id) => [id, { key, ...group }] as const),
    ),
  );
  const esc = (value: string) => value.split('|').join('\\|').split('\n').join(' ');
  const out = [
    '---',
    'title: Public React part census',
    'description: Type-resolved public exports and explicit per-part size-contract audit; pending is not adoption.',
    'order: 4',
    '---',
    '',
    '{/* GENERATED: bun run generate:public-parts. Do not edit rows by hand. */}',
    '',
    '# Public React part census',
    '',
    `The TypeScript checker resolves **${census.parts.length} React part-contract identities** through **${census.entrypoints.native.length} native** and **${census.entrypoints.web.length} web** package entrypoints. Aliases/namespaces and wildcard subpaths are retained below; platform implementations with the same normalized source path and symbol share one contract identity, even when their implementations differ. A family count or a hook import cannot establish part adoption.`,
    '',
    'The generator follows exported value symbols, star exports, namespace exports, default exports, callable static members, object-valued parts, memo/forwardRef/factory and class signatures. Cycles terminate by symbol and type; real aliases share identity while inline members retain their lexical owner. External part declarations retain their package provenance and do not establish a Bloom-owned implementation. React-callable exports with component names (including default/underscore names), exotic markers or element-return signatures are component candidates; lower-case aliases retain their resolved identity; ambiguous any/unknown values fail the unresolved-symbol gate. Type-only exports and lower-case scalar-return hooks/utilities are not components. Size vocabularies come from resolved prop types, including aliases, unions and subsets—not spelling patterns.',
    '',
    'Classification is an explicit equality-checked ledger keyed by part-contract identity; each non-pending classification must account for every listed platform declaration. New or removed identities require a ledger change; generated route/type evidence catches alias/platform changes. **Pending rows are unaudited, not known-good or known-bad.** Delegated is justified by direct rendering/prop forwarding, never import reachability. Runtime coverage and device limitations are stated separately.',
    '',
    '## Classification reasons',
    '',
    '| group | status | parts | reason and evidence |',
    '| --- | --- | ---: | --- |',
  ];
  for (const [key, group] of Object.entries(classifications))
    out.push(
      `| ${key} | ${group.status} | ${group.parts.length} | ${esc(group.reason)} Evidence: ${group.evidence.map((file) => `\`${file}\``).join(', ') || 'none yet'}. ${esc(group.verification)}. |`,
    );
  out.push(
    '',
    '## Every exported part',
    '',
    'Routes use `native:` / `web:` followed by the package subpath and export name. `.` means the root package. Namespace paths preserve the public alias; the first column identifies the normalized contract; declarations preserve each physical implementation, not a family-wide verdict. A missing size prop does not automatically mean size is irrelevant.',
    '',
    '| part-contract identity / declarations | public routes | resolved size vocabulary | classification |',
    '| --- | --- | --- | --- |',
  );
  for (const row of census.parts) {
    const size =
      Object.entries(row.props)
        .filter(([key]) => key.endsWith(':size'))
        .map(
          ([key, value]) =>
            `${key}: ${value.literals.length ? value.literals.join('/') : value.type}`,
        )
        .join('; ') ||
      (Object.values(row.propsStatus).some((status) => status === 'any' || status === 'unknown')
        ? 'opaque props: manual audit required'
        : 'no public size prop');
    out.push(
      `| \`${esc(row.id)}\` (${row.declarations.map((path) => `\`${esc(path)}\``).join(', ')}) | ${row.routes.map((route) => `\`${esc(route)}\``).join(' · ')} | ${esc(size)} | ${byPart.get(row.id)?.key ?? '**UNCLASSIFIED**'} |`,
    );
  }
  out.push(
    '',
    '## Acceptance boundaries',
    '',
    'This inventory does not establish full #663 R1/R5/R8 acceptance. The independent document/art scales are intentional classifications, not conversions into control sizes. The indicator tests cover rendered precedence and actual portal context on both module routes; jsdom and native mocks do not establish painted device proportions, hit testing or accessibility behavior. Pending parts require semantic review and applicable default/scope/override/nested/wrapper/portal/submenu tests before their status changes.',
    '',
  );
  return out.join('\n');
}
