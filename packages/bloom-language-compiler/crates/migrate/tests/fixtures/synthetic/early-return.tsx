// Early returns become the body's `if`/`else`; truthiness is spelled out.
import { Text, VStack, view } from '@oxy.so/bloom-language';

type Tone = 'calm' | 'loud';

interface BadgeProps {
  title: string;
  subtitle?: string;
  tone: Tone;
  count: number;
}

/** A badge: nothing without a title. */
export default view(function Badge(props: BadgeProps) {
  if (!props.title) return null;
  const heading = props.tone === 'loud' ? props.title.toUpperCase() : props.title;
  return VStack(
    Text(heading).font('lg'),
    props.subtitle ? Text(props.subtitle).foreground('muted') : null,
    props.count && Text(`${props.count}`),
  );
});
