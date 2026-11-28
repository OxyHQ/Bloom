// `<Body {...props} color={c} />` in a view whose props are written out: each stored property
// by name, but those a later prop gives, and the callee's literal defaults are the view's own
// too (Body is below Shell, so they are read before either is written).
import { Text, toElement } from '@oxy.so/bloom-language';
import type { ViewProps } from 'react-native';

interface ShellProps {
  title: string;
  variant?: 'person' | 'channel';
  count?: number;
}

export function Shell(props: ShellProps) {
  const c = props.count ?? 0;
  return <Body {...props} color={c} />;
}

function Body({
  title,
  variant = 'person',
  color,
  style,
}: ShellProps & Pick<ViewProps, 'style'> & { color: number }) {
  return toElement(Text(`${title} ${variant} ${color}`));
}
