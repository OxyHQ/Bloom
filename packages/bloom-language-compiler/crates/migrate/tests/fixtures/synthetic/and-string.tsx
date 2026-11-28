// `name && "@${name}"` as a value: the string when `name` is truthy, else `name` itself.
import { Text, view } from '@oxy.so/bloom-language';

function handleOf(name: string | undefined, fallback: string): string {
  return name ?? fallback;
}

export const Handle = view(function Handle({ profile }: { profile?: { username?: string } }) {
  return Text(handleOf(profile?.username && `@${profile.username}`, 'nobody'));
});
