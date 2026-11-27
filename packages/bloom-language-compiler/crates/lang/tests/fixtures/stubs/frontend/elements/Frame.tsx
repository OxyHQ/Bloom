import type { ReactNode } from 'react';
export function Frame(props: { header?: ReactNode; footer?: ReactNode; children?: ReactNode }) {
  return (
    <>
      {props.header}
      {props.children}
      {props.footer}
    </>
  );
}
