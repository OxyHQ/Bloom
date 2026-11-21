/**
 * The layout family's chrome as Bloom's, on every platform: a `Toolbar` its
 * tools before its actions (`.trailing`) and accessory row, a `StickySection`
 * its children docked under the header.
 */
import type { ReactNode } from 'react';
import type { BloomSize } from '@oxy.so/bloom/appearance';
import { StickySection, Toolbar, type ToolbarProps } from '@oxy.so/bloom/layout';

import type { Child } from '../node';
import { valuesOf } from '../platform/values';
import type { NodeHostProps } from '../platform/host.types';
import { defined } from './defined';

type HostProps = NodeHostProps & { children?: ReactNode };

export function ToolbarHost({ node, render, children }: HostProps) {
  const values = valuesOf(node);
  const trailing = values.trailing as readonly Child[] | undefined;
  const accessory = values.accessory as Child;
  const props: ToolbarProps = defined({
    actions: trailing && trailing.length > 0 ? render(trailing) : undefined,
    accessory: accessory ? render(accessory) : undefined,
    size: values.size as BloomSize | undefined,
    testID: values.testID as string | undefined,
  });
  return <Toolbar {...props}>{children}</Toolbar>;
}

export function StickySectionHost({ node, children }: HostProps) {
  const testID = valuesOf(node).testID as string | undefined;
  return <StickySection {...defined({ testID })}>{children}</StickySection>;
}
