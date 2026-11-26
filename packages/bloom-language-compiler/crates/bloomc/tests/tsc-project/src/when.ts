/** Takes a `Date`, which Bloom sees as `Foreign`: only tsc checks what is passed. */
export function formatWhen(when: Date): string {
  return when.toISOString();
}

export function greeting(name: string): string {
  return `Hello, ${name}`;
}
