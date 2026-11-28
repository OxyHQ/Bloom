// An Axios error read as TS shapes it (`error as { response?: { data?: { error?: string } } }`)
// is the standard library's `HTTPError`: its `response.data` fields are its body decoded once
// into the module's `ServerErrorBody`, `response.data` alone is the body's text and
// `response.status` its status.
import { useState } from 'react';
import { Button, Text, toast, view } from '@oxy.so/bloom-language';
import { save, saveLogger } from './api';

export const SaveButton = view(function SaveButton(props: { id: string }) {
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    setSaving(true);
    try {
      await save(props.id);
    } catch (error) {
      const err = error as { response?: { data?: { error?: string; code?: number } } };
      saveLogger.debug(`${err.response?.data?.code ?? 0}`);
      toast(err?.response?.data?.error || 'Could not save', { type: 'error' });
    }
    setSaving(false);
  };

  const onRetry = async () => {
    try {
      await save(props.id);
    } catch (error) {
      const failure = error as { response?: { data?: unknown; status?: number } };
      saveLogger.debug(`${failure.response?.status ?? 0}: ${failure.response?.data ?? ''}`);
    }
  };

  return Button(Text(saving ? 'Saving' : 'Save'))
    .disabled(saving)
    .onPress(() => {
      void onSave();
      void onRetry();
    });
});
