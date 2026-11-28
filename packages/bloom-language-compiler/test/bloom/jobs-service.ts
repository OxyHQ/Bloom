/** A TS service a view's handler calls, recording what it was given. */
export const recorded: string[] = [];
export function recordJobMetric(jobId: string, metric: string): void {
  recorded.push(`${jobId} ${metric}`);
}
