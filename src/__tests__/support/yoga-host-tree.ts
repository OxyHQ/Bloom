import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { isHostNode, resolvedStyle, type HostNode } from './rendered-style';

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
      const input = [
        `${nodes.length} ${Number(rtl)}`,
        ...nodes.map(({ node, parent }) => {
          const styles = Object.entries(resolvedStyle(node.props.style))
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
