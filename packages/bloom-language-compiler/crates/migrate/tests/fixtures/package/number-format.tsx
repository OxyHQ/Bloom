// JS's locale number formatting is FormatStyle (#1065): `toLocaleString()` is 0 to 3 fraction
// digits, an `Intl.NumberFormat` is a closure that formats (and its `format(x)` a call of it), and
// one formatted in place is `x.formatted(…)`.
import { Text, VStack, view } from '@oxy.so/bloom-language';

export const Totals = view(function Totals({ total, price, locale }: { total: number; price: number; locale: string }) {
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  return VStack(
    Text(total.toLocaleString()),
    Text(number.format(total / 7)),
    Text(new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(price)),
  );
});
