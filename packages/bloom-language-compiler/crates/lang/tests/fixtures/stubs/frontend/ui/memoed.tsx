// Components as an app writes them: memo of a named function, of an inline one, and a
// lazily loaded module.
import { memo, type ReactNode } from 'react';

export interface CardProps {
  readonly title: string;
  readonly count?: number;
}

function CardInner({ title, count }: CardProps): ReactNode {
  return `${title} ${count ?? 0}`;
}

export const Card = memo(CardInner);

export const Tag = memo(function Tag(props: { label: string }): ReactNode {
  return props.label;
});

export default function Panel(props: { heading: string }): ReactNode {
  return props.heading;
}
