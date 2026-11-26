// JS truthiness of values the codemod cannot type is spelled from bloomc's types.
import { Text, VStack, view } from '@oxy.so/bloom-language';
import { useSession } from './session';

export const Greeting = view(function Greeting() {
  const session = useSession();
  const signedIn = Boolean(session.user);
  const nick = session.nick;
  return VStack(
    session.title ? Text(session.title) : null,
    signedIn && !session.count ? Text('Welcome') : null,
    nick ? Text(nick) : null,
  );
});
