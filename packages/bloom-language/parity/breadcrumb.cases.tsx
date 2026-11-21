import { Avatar } from '@oxy.so/bloom/avatar';
import { Breadcrumb, BreadcrumbItem } from '@oxy.so/bloom/breadcrumb';
import { RiFolderLine } from '@oxy.so/bloom/icons';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const open = () => {};

export const BREADCRUMB_CASES: readonly ParityCase[] = [
  {
    name: 'a trail',
    language: () =>
      toElement(
        L.Breadcrumb(
          L.BreadcrumbItem('Home').link('/'),
          L.BreadcrumbItem('Projects').onPress(open),
          L.BreadcrumbItem('Bloom').active(true),
        ).label('Breadcrumb'),
      ),
    bloom: () => (
      <Breadcrumb accessibilityLabel="Breadcrumb">
        <BreadcrumbItem href="/">Home</BreadcrumbItem>
        <BreadcrumbItem onPress={open}>Projects</BreadcrumbItem>
        <BreadcrumbItem current>Bloom</BreadcrumbItem>
      </Breadcrumb>
    ),
  },
  ...ENUMS.controlSize.map((size) => ({
    name: `a ${size} trail that collapses`,
    language: () =>
      toElement(
        L.Breadcrumb(
          L.BreadcrumbItem('Home').link('/'),
          L.BreadcrumbItem('Docs').link('/docs'),
          L.BreadcrumbItem('Guide').active(true),
        )
          .size(size)
          .collapses()
          .labels({ overflow: 'More pages' }),
      ),
    bloom: () => (
      <Breadcrumb size={size} overflow="collapse" overflowLabel="More pages">
        <BreadcrumbItem href="/">Home</BreadcrumbItem>
        <BreadcrumbItem href="/docs">Docs</BreadcrumbItem>
        <BreadcrumbItem current>Guide</BreadcrumbItem>
      </Breadcrumb>
    ),
  })),
  {
    name: 'items with glyphs, a leading view, disabled, a separator of its own',
    language: () =>
      toElement(
        L.Breadcrumb(
          L.BreadcrumbItem('Files').icon(RiFolderLine).size('sm').link('/files'),
          L.BreadcrumbItem('Ana')
            .prefix(L.Avatar(null, { name: 'Ana' }).size('xs'))
            .disabled(),
          L.BreadcrumbItem(L.Text('Notes').weight('semibold')).active(true),
        ).separatorView(L.Text('/')),
      ),
    bloom: () => (
      <Breadcrumb separator={<Text>/</Text>}>
        <BreadcrumbItem icon={RiFolderLine} size="sm" href="/files">
          Files
        </BreadcrumbItem>
        <BreadcrumbItem leading={<Avatar name="Ana" size={20} />} disabled>
          Ana
        </BreadcrumbItem>
        <BreadcrumbItem current>
          <Text style={{ fontWeight: '600' }}>Notes</Text>
        </BreadcrumbItem>
      </Breadcrumb>
    ),
  },
];
