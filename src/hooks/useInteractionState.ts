import { useCallback, useState } from 'react';

export function useInteractionState() {
  const [state, setState] = useState(false);

  const onIn = useCallback(() => {
    setState(true);
  }, []);
  const onOut = useCallback(() => {
    setState(false);
  }, []);

  return { state, onIn, onOut };
}
