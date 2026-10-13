import { createContext, useContext } from 'react';

/** `ToolCallList` tells its calls they are list items; a lone `ToolCall` is not one. */
const ToolCallListContext = createContext(false);

export const ToolCallListProvider = ToolCallListContext.Provider;

export function useInToolCallList(): boolean {
  return useContext(ToolCallListContext);
}
