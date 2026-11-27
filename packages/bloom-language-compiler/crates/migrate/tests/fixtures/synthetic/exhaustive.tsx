// A `switch` whose every case returns a value, with no `default`, is TS's exhaustive
// `switch` on a literal union: a `match` with no `case _`.
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

export const Badge = view(function Badge({ severity }: { severity: Severity }) {
  return Text(label(severity));
});
