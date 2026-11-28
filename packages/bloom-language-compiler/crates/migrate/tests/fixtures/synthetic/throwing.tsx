// An async function that returns a value and awaits a TS promise outside a `try`: TS's
// rejection rejects its promise, so it is `async throws` and the await is `try await`; a call
// that hands its promise on is a task of it. A generic function keeps its type parameters, and a
// TS tuple read by a constant index is the tuple's member (`coordinates.0`).
import { Text, view } from '@oxy.so/bloom-language';
import { type Place, fetchJson, query } from './pages';

interface Page<T> {
  rows: T[];
  more: boolean;
}

async function fetchPage<T>(path: string): Promise<Page<T>> {
  const res = await fetchJson<T>(path);
  return { rows: res.data?.rows ?? [], more: res.data?.more ?? false };
}

/** Awaits a throwing function outside a `try`: it throws too. */
async function countRows(path: string): Promise<number> {
  const page = await fetchPage<string>(path);
  return page.rows.length;
}

/** Nothing catches here: the rest of the block is a `do` whose `catch` ends it. */
async function logRows(path: string): Promise<void> {
  const count = await countRows(path);
  console.log(count);
}

function where(place: Place): string {
  const longitude = place.coordinates[0];
  const latitude = place.coordinates[1];
  return `${latitude}, ${longitude}`;
}

export const Rows = view(function Rows({ path, place }: { path: string; place: Place }) {
  const pages = query({ key: path, fn: async () => (await countRows(path)) + 1 });
  return Text(`${pages.count} rows near ${where(place)}`).onPress(() => logRows(path));
});
