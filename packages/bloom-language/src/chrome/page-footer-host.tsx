/**
 * A `PageFooter` as Bloom's `PageFooter`, on every platform: its children
 * before its actions (`.toolbar`), on its scrim.
 */
import type { ReactNode } from 'react';
import { PageFooter, type PageFooterProps } from '@oxy.so/bloom/page-footer';

import type { Child } from '../node';
import { valuesOf } from '../platform/values';
import type { NodeHostProps } from '../platform/host.types';
import type { FooterPinning, ScrollEdge } from '../tokens';
import { defined } from './defined';

export function PageFooterHost({
  node,
  render,
  children,
}: NodeHostProps & { children?: ReactNode }) {
  const values = valuesOf(node);
  const toolbar = values.toolbar as readonly Child[] | undefined;
  const ignores = values.ignoresSafeArea as boolean | undefined;
  const props: PageFooterProps = defined({
    actions: toolbar && toolbar.length > 0 ? render(toolbar) : undefined,
    position: values.pinning as FooterPinning | undefined,
    scrim: values.scrollEdge as ScrollEdge | undefined,
    safeArea: ignores === undefined ? undefined : !ignores,
    testID: values.testID as string | undefined,
  });
  return <PageFooter {...props}>{children}</PageFooter>;
}
