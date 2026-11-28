// `const ok = await tsCall(); if (!ok) return; await other();` is `match await`: the `.ok` case's
// last statement, a TS `await` nothing reads, is discarded (`let _ = await other()`), so both
// cases give nothing.
import { Button, Text, view } from '@oxy.so/bloom-language';
import { alertDialog, confirmDialog } from './dialogs';

export const ClearCache = view(function ClearCache() {
  const clear = async () => {
    const confirmed = await confirmDialog({ title: 'Clear the cache?' });
    if (!confirmed) return;
    await alertDialog({ title: 'Cleared', message: 'The cache is empty.' });
  };
  return Button(Text('Clear')).onPress(clear);
});
