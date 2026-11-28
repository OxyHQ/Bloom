// A spread of an optional value (`{ ...cached, ...known }`, `cached` maybe `undefined`): JS spreads
// nothing for `undefined`, so the record has its fields only when it is there.
import { Text, view } from '@oxy.so/bloom-language';

interface Identity {
  name?: string;
  handle?: string;
}

function merged(cached: Identity | undefined, known: Identity): Identity {
  return { ...cached, ...known };
}

export const Byline = view(function Byline(props: { cached?: Identity; known: Identity }) {
  return Text(merged(props.cached, props.known).name ?? '');
});
