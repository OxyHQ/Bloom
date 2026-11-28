// An `Embed` render prop's `render(x)` handed to a TS component's prop is the view `x`, as
// `toElement(x)` is; React's `<Activity>` is a component (a value import), as `<Suspense>` is.
import { Activity } from 'react';
import { Embed, Text, VStack, toElement, view } from '@oxy.so/bloom-language';
import { Slot } from './slots';

export const Titled = view(function Titled({ title, visible }: { title: string; visible: boolean }) {
  return VStack(
    Embed((render) => <Slot title={title} leading={render(Text('•').foreground('muted'))} />),
    Embed(<Activity mode={visible ? 'visible' : 'hidden'}>{toElement(Text(title))}</Activity>),
  );
});
