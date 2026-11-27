// A state setter in a statement's `?:` or `&&` (a handler's body): an `if`.
import { useState } from 'react';
import { Button, VStack, view } from '@oxy.so/bloom-language';

export const Steps = view(function Steps({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<'edit' | 'review'>('edit');
  const [seen, setSeen] = useState(false);
  return VStack(
    Button('Back').onPress(() => (step === 'review' ? setStep('edit') : onClose())),
    Button('Seen').onPress(() => {
      !seen && setSeen(true);
    }),
  );
});
