// A module `let` of this file alone (a registry its one host fills) is Swift's file-scope
// `private var`; an exported one stays refused.
import { useEffect, useState } from 'react';
import { Text, view } from '@oxy.so/bloom-language';

let globalShowInfo: (() => void) | null = null;

export function showInfo() {
  globalShowInfo?.();
}

export const InfoHost = view(function InfoHost() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    globalShowInfo = () => {
      setOpen(true);
    };
    return () => {
      globalShowInfo = null;
    };
  }, []);
  return Text(open ? 'Open' : 'Closed');
});
