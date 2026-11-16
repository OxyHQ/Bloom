import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { classNamesOn, isHostNode, resolvedStyle, type HostNode } from './rendered-style';
import { buildTailwindCss } from './tailwind-css';

type NativeRule = { s: number[]; d?: unknown[]; m?: unknown; cq?: unknown; p?: unknown };
const compiledClasses = new Map<string, Map<string, NativeRule[]>>();

/** Compile authored classes through the actual Tailwind and native compilers.
 * The Yoga fixture only models unconditional static geometry; responsive and
 * interaction rules require the real native runtime, exercised on-device. */
function nativeClasses(candidates: string[]): Map<string, NativeRule[]> {
  const key = candidates.sort().join(' ');
  const cached = compiledClasses.get(key);
  if (cached) return cached;
  const css = buildTailwindCss(candidates);
  const output = execFileSync(
    process.execPath,
    [
      '-e',
      `
    const { compile } = require('react-native-css/compiler');
    const css = require('node:fs').readFileSync(0, 'utf8');
    process.stdout.write(JSON.stringify(compile(css).stylesheet().s ?? []));
  `,
    ],
    { input: css, encoding: 'utf8' },
  );
  const rules = new Map(JSON.parse(output) as [string, NativeRule[]][]);
  compiledClasses.set(key, rules);
  return rules;
}

const geometry =
  /^(width|height|minWidth|maxWidth|minHeight|maxHeight|flex|flexGrow|flexShrink|flexBasis|flexDirection|flexWrap|justifyContent|alignItems|alignSelf|alignContent|gap|rowGap|columnGap|position|top|bottom|left|right|start|end|display|overflow|padding(?:Horizontal|Vertical|Left|Right|Top|Bottom|Start|End)?|margin(?:Horizontal|Vertical|Left|Right|Top|Bottom|Start|End)?|border(?:Left|Right|Top|Bottom|Start|End)?Width)$/;
export interface NativeBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * A ScrollView as React Native lays it out natively: a viewport that
 * scrolls (`overflow: scroll`, its base style), holding a content container —
 * a view carrying `contentContainerStyle` — that Yoga sizes to its children
 * rather than to the viewport. The test renderer draws neither, and without
 * them a track that only fits by shrinking measured as fitting here while it
 * overflowed on the device.
 */
function nativeScroller(node: HostNode): { view: HostNode; content: HostNode } | null {
  if (node.type !== 'ScrollView') return null;
  const horizontal = node.props.horizontal === true;
  const direction = horizontal ? 'row' : 'column';
  return {
    view: {
      ...node,
      props: {
        ...node.props,
        style: [
          horizontal ? undefined : { flexGrow: 1, flexShrink: 1 },
          node.props.style,
          { flexDirection: direction, overflow: 'scroll' },
        ],
      },
    },
    content: {
      type: 'View',
      props: {
        testID: node.props.testID ? `${node.props.testID}-content-layout` : undefined,
        style: [{ flexDirection: direction }, node.props.contentContainerStyle],
      },
      children: [],
    },
  };
}

/** Real Yoga layout, not TestRenderer's geometry-free host mocks. Text metrics
 * are explicit fixture inputs; this does not claim to measure a platform font. */
export function createYogaHostRenderer() {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'bloom-yoga-host-'));
  const binary = path.join(directory, 'layout');
  const yoga =
    process.env.BLOOM_NATIVE_YOGA_PATH ??
    path.join(path.dirname(require.resolve('react-native/package.json')), 'ReactCommon/yoga');
  const sources = (root: string): string[] =>
    readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
      const file = path.join(root, entry.name);
      return entry.isDirectory() ? sources(file) : file.endsWith('.cpp') ? [file] : [];
    });
  execFileSync(
    process.env.CXX ?? 'g++',
    [
      '-std=c++20',
      '-O0',
      `-I${yoga}`,
      path.resolve('scripts/native-layout/yoga-host-tree.cpp'),
      ...sources(path.join(yoga, 'yoga')),
      '-o',
      binary,
    ],
    { timeout: 120_000 },
  );
  return {
    dispose: () => rmSync(directory, { recursive: true, force: true }),
    /** Absolute coordinates allow assertions across nested scroll and content hosts. */
    layout(tree: HostNode, rtl = false, textWidth = 40, absolute = false): Map<string, NativeBox> {
      const nodes: Array<{ node: HostNode; parent: number }> = [];
      const visit = (node: HostNode, parent: number) => {
        const index = nodes.length;
        const scroller = nativeScroller(node);
        nodes.push({ node: scroller?.view ?? node, parent });
        // Native Text is one measured leaf, including any nested spans.
        if (node.type === 'Text') return;
        // The scroller's content container sits between it and its children.
        const into = scroller ? nodes.push({ node: scroller.content, parent: index }) - 1 : index;
        for (const child of node.children ?? []) if (isHostNode(child)) visit(child, into);
      };
      visit(tree, -1);
      const tokens = (node: HostNode) =>
        classNamesOn(node.props.style).flatMap((value) => value.split(/\s+/).filter(Boolean));
      const classes = nativeClasses([...new Set(nodes.flatMap(({ node }) => tokens(node)))]);
      const input = [
        `${nodes.length} ${Number(rtl)}`,
        ...nodes.map(({ node, parent }) => {
          const rules = tokens(node)
            .flatMap((token) => classes.get(token) ?? [])
            .filter((rule) => !rule.m && !rule.cq && !rule.p)
            .sort((left, right) => {
              for (let index = Math.max(left.s.length, right.s.length) - 1; index >= 0; index--) {
                const difference = (left.s[index] ?? 0) - (right.s[index] ?? 0);
                if (difference) return difference;
              }
              return 0;
            });
          const classStyle = Object.assign(
            {},
            ...rules
              .flatMap((rule) => rule.d ?? [])
              .filter(
                (declaration) =>
                  declaration !== null &&
                  typeof declaration === 'object' &&
                  !Array.isArray(declaration),
              ),
          );
          const styles = Object.entries({ ...classStyle, ...resolvedStyle(node.props.style) })
            // React Native's logical inline edges are Yoga's start and end.
            .map(
              ([key, value]) =>
                [
                  key === 'insetInlineStart'
                    ? 'start'
                    : key === 'insetInlineEnd'
                      ? 'end'
                      : key.replace(/Inline(Start|End)$/, '$1'),
                  value,
                ] as const,
            )
            .filter(([key, value]) => geometry.test(key) && value != null);
          return `${parent} ${node.type === 'Text' ? textWidth : -1} 20 ${styles.length}\n${styles.map(([key, value]) => `${key} ${value}`).join('\n')}`;
        }),
      ].join('\n');
      const lines = execFileSync(binary, { input, encoding: 'utf8' }).trim().split('\n');
      const boxes = new Map<string, NativeBox>();
      const positions = lines.map((line): NativeBox => {
        const [x, y, width, height] = line.split(' ').map(Number);
        if (x == null || y == null || width == null || height == null)
          throw new Error('Incomplete Yoga layout result');
        return { x, y, width, height };
      });
      nodes.forEach(({ node, parent }, index) => {
        const position = positions[index];
        if (!position) throw new Error('Missing Yoga node layout');
        if (absolute && parent >= 0) {
          const ancestor = positions[parent];
          if (!ancestor) throw new Error('Missing Yoga parent layout');
          position.x += ancestor.x;
          position.y += ancestor.y;
        }
        if (typeof node.props.testID === 'string') boxes.set(node.props.testID, position);
      });
      return boxes;
    },
  };
}
