/** Takes a `RegExp`, which Bloom sees as `Foreign`: only tsc checks what is passed. */
export function formatWhen(when: RegExp): string {
  return when.source;
}

export function greeting(name: string): string {
  return `Hello, ${name}`;
}
