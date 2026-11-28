// JS's `Date` is the standard library's (#1066), a JS `Date` itself: `new Date()` is `Date.now`, a
// number of milliseconds `Date(millisecondsSince1970:)`, and an ISO string `try? Date(s, strategy:
// .iso8601)`, JS's Invalid Date where it is not one. `toLocale…String` and `Intl.DateTimeFormat`
// are FormatStyle with ECMA-402's defaults written out; JS prints "Invalid Date" where Intl throws.
import { Text, VStack, view } from '@oxy.so/bloom-language';
import { formatRelativeTime } from '@/utils/time';

function isPast(at: string): boolean {
  return new Date(at).getTime() <= Date.now();
}

function dayKey(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${now.getDate()}`;
}

function sameDay(a: Date, b: Date): boolean {
  return new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime() === b.getTime();
}

function isYesterday(d: Date): boolean {
  const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() === yesterday.getTime();
}

function tomorrow(): string {
  return new Date(Date.now() + 86400000).toISOString();
}

function drafted(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString();
}

export const When = view(function When({ at, locale }: { at: string; locale: string }) {
  const short = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' });
  return VStack(
    Text(new Date(at).toLocaleString()),
    Text(new Date(at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })),
    Text(new Date(at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })),
    Text(short.format(new Date(at))),
    Text(new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(at))),
    Text(formatRelativeTime(new Date(at), locale)),
  );
});
