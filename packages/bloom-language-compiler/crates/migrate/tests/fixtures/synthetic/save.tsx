// try/catch around one await: a `match` on the `Result`, under a review marker.
import { useState } from 'react';
import { Button, Text, toast, view } from '@oxy.so/bloom-language';
import { save } from './api';

export const SaveButton = view(function SaveButton(props: { id: string }) {
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    setSaving(true);
    try {
      await save(props.id);
    } catch (error) {
      toast('Could not save', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return Button(Text(saving ? 'Saving' : 'Save'))
    .disabled(saving)
    .onPress(() => void onSave());
});
