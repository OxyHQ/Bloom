// A TS error class (Mention's `services/pollService.ts`): a value and a type.
export declare class PollContractError extends Error {
  readonly code: string;
}
export declare class PollClosedError extends TypeError {}
export declare function vote(id: string): Promise<void>;
