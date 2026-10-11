import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { isHostNode, resolvedStyle, type HostNode } from './rendered-style';

const geometry =
  /^(width|height|minWidth|maxWidth|minHeight|maxHeight|flex|flexGrow|flexShrink|flexBasis|flexDirection|flexWrap|justifyContent|alignItems|alignSelf|alignContent|gap|rowGap|columnGap|position|top|bottom|left|right|overflow|padding(?:Horizontal|Vertical|Left|Right|Top|Bottom|Start|End)?|margin(?:Horizontal|Vertical|Left|Right|Top|Bottom|Start|End)?|border(?:Left|Right|Top|Bottom|Start|End)?Width)$/;
export interface NativeBox {
  x: number;
  y: number;
  width: number;
  height: number;
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
    layout(tree: HostNode, rtl = false, textWidth = 40): Map<string, NativeBox> {
      const nodes: Array<{ node: HostNode; parent: number }> = [];
      const visit = (node: HostNode, parent: number) => {
        const index = nodes.length;
        nodes.push({ node, parent });
        // Native Text is one measured leaf, including any nested spans.
        if (node.type !== 'Text')
          for (const child of node.children ?? []) if (isHostNode(child)) visit(child, index);
      };
      visit(tree, -1);
      const input = [
        `${nodes.length} ${Number(rtl)}`,
        ...nodes.map(({ node, parent }) => {
          const styles = Object.entries(resolvedStyle(node.props.style)).filter(
            ([key, value]) => geometry.test(key) && value != null,
          );
          return `${parent} ${node.type === 'Text' ? textWidth : -1} 20 ${styles.length}\n${styles.map(([key, value]) => `${key} ${value}`).join('\n')}`;
        }),
      ].join('\n');
      const lines = execFileSync(binary, { input, encoding: 'utf8' }).trim().split('\n');
      const boxes = new Map<string, NativeBox>();
      nodes.forEach(({ node }, index) => {
        const [x, y, width, height] = lines[index]!.split(' ').map(Number);
        if (typeof node.props.testID === 'string')
          boxes.set(node.props.testID, { x: x!, y: y!, width: width!, height: height! });
      });
      return boxes;
    },
  };
}
