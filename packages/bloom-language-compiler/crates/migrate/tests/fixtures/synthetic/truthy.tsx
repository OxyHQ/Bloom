// JS truthiness of values the codemod cannot type is spelled from bloomc's types.
import { Text, VStack, view } from '@oxy.so/bloom-language';
import { useSession } from './session';

function initial(nick?: string): string {
  if (!nick) return '';
  return nick.slice(0, 1);
}

function trimmedNick(nick?: string): string {
  return typeof nick === 'string' ? nick.trim() : '';
}

function titleOf(raw: string): string {
  const parsed = JSON.parse(raw);
  return parsed.title || 'Untitled';
}

export const Greeting = view(function Greeting() {
  const session = useSession();
  const signedIn = Boolean(session.user);
  const nick = session.nick;
  return VStack(
    session.title ? Text(session.title) : null,
    signedIn && !session.count ? Text('Welcome') : null,
    nick ? Text(nick) : null,
    Text(initial(nick) + trimmedNick(nick) + titleOf(session.title)),
  );
});
