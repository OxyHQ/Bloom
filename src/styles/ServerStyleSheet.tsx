import { useInsertionEffect, useSyncExternalStore } from 'react';
import { Platform } from 'react-native';
import { adoptStyleSheet, dropStyleSheet } from './adopt-style-sheet';
import { useServerStylePolicy } from './context';

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

/** Preserve the server sheet through hydration; adopt before removing its DOM node. */
export function ServerStyleSheet({
  id,
  css,
  owned = false,
}: {
  id: string;
  css: string;
  owned?: boolean;
}) {
  const policy = useServerStylePolicy();
  const hydrated = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  useInsertionEffect(() => {
    if (css) adoptStyleSheet(id, css);
  }, [id, css]);
  useInsertionEffect(() => {
    if (owned) return () => dropStyleSheet(id);
    return undefined;
  }, [id, owned]);
  if (Platform.OS !== 'web' || !policy || hydrated || !css) return null;
  return (
    <style
      data-bloom-server-style={id}
      nonce={typeof policy === 'object' ? policy.nonce : undefined}
    >
      {css}
    </style>
  );
}
