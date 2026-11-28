// A `switch` whose every case returns a value, with no `default`, is TS's exhaustive
// `switch` on a literal union: a `match` with no `case _`. So is one whose `default` is TS's
// exhaustiveness check (`const unhandled: never = x; throw …`): bloomc checks it.
import { Text, view } from '@oxy.so/bloom-language';

type Severity = 'suspend' | 'silence';

function label(severity: Severity): string {
  switch (severity) {
    case 'suspend':
      return 'Suspended';
    case 'silence':
      return 'Silenced';
  }
}

export function act(severity: Severity, log: (s: string) => void) {
  switch (severity) {
    case 'suspend':
      log('suspend');
      return;
    case 'silence':
      log('silence');
      return;
    default: {
      const unhandled: never = severity;
      throw new Error(`Unhandled: ${String(unhandled)}`);
    }
  }
}

export const Badge = view(function Badge({ severity }: { severity: Severity }) {

  return Text(label(severity));
});
