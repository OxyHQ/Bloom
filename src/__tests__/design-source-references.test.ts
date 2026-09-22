/**
 * @jest-environment node
 */

/**
 * Bloom never names the external design source it was ported from — not the
 * product, not its author, not its file paths or its internal constant names.
 *
 * This is the only check on that class of leak. `tsc` cannot see a doc
 * comment, a story's fixture string or an `.mdx` line, and every instance this
 * gate was written for lived in exactly those places: a panel's doc comment
 * citing a module that does not exist in this repo, a story rendering the
 * source product's name and email as sample data, a constant named after
 * theirs. A reader who greps a dangling name finds nothing, which is worse
 * than no reference at all.
 *
 * It scans the same surface `icon-references.test.ts` does — `src/`, `docs/`,
 * `README.md` and `AGENTS.md` — and it deliberately does NOT strip comments,
 * because the comments ARE the surface under test.
 *
 * Two self-reference traps, both closed the way `icon-references` closes its:
 *
 *  1. This file necessarily SPELLS every term it forbids. It is therefore the
 *     one exclusion, pinned to exactly one path in the first assertion, so the
 *     list can neither grow quietly nor become a silent no-op through a typo.
 *  2. `AGENTS.md` is inside the scan. The rule recorded there must POINT at
 *     this file rather than repeat the terms, or the repo's own rulebook
 *     fails the rule.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const SRC = join(__dirname, '..');
const REPO_ROOT = join(SRC, '..');
const SCANNED_EXTENSIONS = ['.ts', '.tsx', '.mdx', '.md'];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    // Agent worktrees under `.claude/` and `.worktrees/` are full copies of
    // this repo — scanning them would double every file and report another
    // checkout's problems as this one's.
    if (entry === 'node_modules' || entry === 'lib' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (SCANNED_EXTENSIONS.includes(extname(full))) out.push(full);
  }
  return out;
}

const SCANNED = [
  ...walk(SRC),
  ...walk(join(REPO_ROOT, 'docs')),
  join(REPO_ROOT, 'README.md'),
  join(REPO_ROOT, 'AGENTS.md'),
];

const EXCLUDED = [join(__dirname, 'design-source-references.test.ts')];
const CHECKED = SCANNED.filter((file) => !EXCLUDED.includes(file));

interface Term {
  /** What it matches. */
  pattern: RegExp;
  /** Why it has no legitimate use here, and what to write instead. */
  why: string;
}

/**
 * Every term has ZERO legitimate uses in this repo, so the list needs no
 * exemptions and the assertion below is an equality against an empty array.
 * A term that WOULD need exemptions does not belong here: an exemption list
 * only grows, and a gate whose list of known leaks grows is not a gate.
 *
 * The author's name is deliberately absent. Adding it would write it into the
 * repo, which is the thing the rule exists to prevent; the product name covers
 * the realistic leak.
 */
const TERMS: Term[] = [
  {
    // `\b` before `board` leaves `dashboard ui` and `keyboard UI` alone.
    pattern: /\bboard[-\s]?ui\b/i,
    why: 'the source product. Say what the thing IS — "the floating panels", "Bloom\'s floating surface".',
  },
  {
    pattern: /\bMENU_POPOVER_SURFACE\b/,
    why: "their constant. Bloom's is resolved by `popover/surface.ts`.",
  },
  {
    pattern: /\bMENU_POPOVER_WIDTH\b/,
    why: "their constant. Bloom's is `POPOVER_WIDTH`.",
  },
  {
    pattern: /\bDropdownPopover\b/,
    why: "their component. Bloom's is `Popover` / `DropdownMenu`.",
  },
  {
    pattern: /\bmenu-styles\.ts\b/,
    why: 'their module path — no such file exists under `src/`, so the reference is dangling.',
  },
];

interface Finding {
  file: string;
  line: number;
  term: string;
}

function findingsIn(file: string, source: string): Finding[] {
  const found: Finding[] = [];
  source.split('\n').forEach((text, index) => {
    for (const { pattern } of TERMS) {
      const hit = pattern.exec(text);
      if (hit) found.push({ file, line: index + 1, term: hit[0] });
    }
  });
  return found;
}

const format = (f: Finding) => `${relative(REPO_ROOT, f.file)}:${f.line}  ${f.term}`;

describe('the external design source is never named', () => {
  it('reads a plausible repo, and exempts exactly itself', () => {
    // Without these floors a broken traversal makes every assertion below pass
    // by finding nothing at all.
    expect(CHECKED.length).toBeGreaterThan(300);
    expect(CHECKED).toContain(join(SRC, 'popover', 'Popover.stories.tsx'));
    expect(CHECKED).toContain(join(REPO_ROOT, 'docs', 'popover.mdx'));
    expect(CHECKED).toContain(join(REPO_ROOT, 'AGENTS.md'));

    // A misspelled path here would make the exemption a no-op and this suite
    // fail on ITSELF, rather than quietly stop covering the file it forbids.
    expect(EXCLUDED).toHaveLength(1);
    expect(SCANNED).toContain(EXCLUDED[0]);
    expect(CHECKED).not.toContain(EXCLUDED[0]);
  });

  it('has a non-empty, non-duplicated term list, each with a reason', () => {
    expect(TERMS.length).toBeGreaterThanOrEqual(5);
    const sources = TERMS.map((t) => t.pattern.source);
    expect(new Set(sources).size).toBe(sources.length);
    for (const term of TERMS) expect(term.why.length).toBeGreaterThan(20);
  });

  it('detects every term it forbids', () => {
    // A gate whose only evidence is the ABSENCE of its subject cannot be told
    // from one that stopped working. This probe keeps the detector measured
    // after the tree is clean — the same reason `web-fork-reachability` keeps
    // a hardcoded positive control.
    const probe = [
      ' * ported from BoardUI, which spells it',
      " * (`dropdown/menu-styles.ts`'s `MENU_POPOVER_SURFACE`)",
      ' * `w-[266px]` — `MENU_POPOVER_WIDTH`',
      ' * the `DropdownPopover` call-site shape',
      ' * <PopoverDescription>hi@boardui.com</PopoverDescription>',
    ].join('\n');

    expect(findingsIn('probe', probe).map((f) => `${f.line}`)).toEqual(['1', '2', '2', '3', '4', '5']);
  });

  it('does not fire on Bloom’s own adjacent vocabulary', () => {
    const compliant = [
      ' * the dashboard ui, and the keyboard UI beside it',
      " * colours from `floating/menu-palette.ts`, geometry from `constants.ts`",
      ' * `MENU_PANEL_CLASS` / `LISTBOX_PANEL_CLASS`',
      ' * `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuItem`',
      ' * a menu row as the floating panels draw it',
    ].join('\n');

    expect(findingsIn('probe', compliant)).toEqual([]);
  });

  it('names the external design source nowhere in src, docs, README or AGENTS', () => {
    const findings = CHECKED.flatMap((file) => findingsIn(file, readFileSync(file, 'utf8')));
    expect(findings.map(format)).toEqual([]);
  });
});
