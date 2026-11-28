import { memo } from 'react';

interface ListProps {
  kind: string;
}

/** An arrow component, memoised with a comparator and named, as Mention's Feed.web.tsx. */
const List = (props: ListProps) => {
  return <>{props.kind}</>;
};

const MemoizedList = memo(List, (a: ListProps, b: ListProps) => a.kind === b.kind);
MemoizedList.displayName = 'List';
export default MemoizedList;
