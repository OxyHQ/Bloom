import { DropZone } from '@oxy.so/bloom/drop-zone';
import { Text } from '@oxy.so/bloom/typography';

import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const drop = () => {};
const IMAGES = ['image/png', 'image/*'] as const;

export const DROP_ZONE_CASES: readonly ParityCase[] = [
  {
    name: 'a zone that takes files',
    language: () => toElement(L.DropZone(['files'], drop, L.Text('Drop files here'))),
    bloom: () => (
      <DropZone accept={['files']} onDrop={drop}>
        <Text>Drop files here</Text>
      </DropZone>
    ),
  },
  {
    name: 'images, moved by preference, into a folder, followed',
    language: () =>
      toElement(
        L.DropZone(['files', 'url'], drop, L.Text('Photos'))
          .fileTypes(IMAGES)
          .dragActions(['copy', 'move'], 'move')
          .folder('Inbox')
          .onDragEnter(drop)
          .onDragOver(drop)
          .onDragLeave(drop)
          .testID('photos'),
      ),
    bloom: () => (
      <DropZone
        accept={['files', 'url']}
        onDrop={drop}
        acceptFileTypes={IMAGES}
        actions={['copy', 'move']}
        preferredAction="move"
        folder="Inbox"
        onDragEnter={drop}
        onDragOver={drop}
        onDragLeave={drop}
        testID="photos"
      >
        <Text>Photos</Text>
      </DropZone>
    ),
  },
  {
    name: 'a disabled zone',
    language: () => toElement(L.DropZone(['text'], drop, L.Text('Notes')).disabled()),
    bloom: () => (
      <DropZone accept={['text']} onDrop={drop} disabled>
        <Text>Notes</Text>
      </DropZone>
    ),
  },
  {
    name: 'a zone with a box',
    language: () =>
      toElement(
        L.DropZone(['html'], drop, L.Text('Paste'), L.Text('or drop'))
          .padding('md')
          .frame({ height: '200' }),
      ),
    bloom: () => (
      <DropZone
        accept={['html']}
        onDrop={drop}
        style={{ height: 200, paddingTop: 12, paddingBottom: 12, paddingStart: 12, paddingEnd: 12 }}
      >
        <Text>Paste</Text>
        <Text>or drop</Text>
      </DropZone>
    ),
  },
];
