/**
 * COPIED FROM react-native-teleport 1.2.0 — `src/hooks/useId.ts`
 * MIT, Copyright (c) 2025 Kiryl Ziusko. Full licence in `NOTICE` at the root.
 *
 * Changed: nothing — byte-for-byte, only its path.
 */
import { useRef } from "react";

let __idCounter = 0;

export default function useId(prefix = "uid"): string {
  const idRef = useRef<string>("");
  if (!idRef.current) {
    const n = ++__idCounter;
    idRef.current = `${prefix}-${n}`;
  }
  return idRef.current;
}
