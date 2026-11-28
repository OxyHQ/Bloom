// try shapes: state writes before the first await, a destructured await, and a
// block of several awaits (a `Result` closure, each await propagating).
import { useState } from 'react';
import { Button, Text, view } from '@oxy.so/bloom-language';
import { confirm, load, save, saveLogger, unsave } from './api';

async function resolveUrl(id: string): Promise<string> {
  try {
    const { data } = await load(id);
    return data.url;
  } catch {
    return id;
  }
}

/** Outside a `try`, a rejection stops the block; a global regex is the stdlib `Regex`. */
async function warm(id: string): Promise<void> {
  const { data } = await load(id);
  saveLogger.debug(data.url.replace(/^https?:\/\//g, ''));
}

async function confirmUnsave(id: string): Promise<void> {
  if (!(await confirm('Remove?'))) return;
  saveLogger.debug(id);
}

export const SaveToggle = view(function SaveToggle(props: { id: string; saved: boolean }) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const onToggle = async () => {
    try {
      setBusy(true);
      saveLogger.debug('toggling');
      if (props.saved) {
        await unsave(props.id);
      } else {
        await save(props.id);
      }
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  const onLoad = async () => {
    try {
      setBusy(true);
      const url = await resolveUrl(props.id);
      saveLogger.debug(url);
    } catch {
      setFailed(true);
    }
  };

  return Button(Text(failed ? 'Retry' : props.saved ? 'Saved' : 'Save'))
    .disabled(busy)
    .onPress(() => void onToggle())
    .onLongPress(() => void onLoad());
});
