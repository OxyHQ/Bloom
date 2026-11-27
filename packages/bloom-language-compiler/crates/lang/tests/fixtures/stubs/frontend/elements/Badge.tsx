import { Text, view } from '@oxy.so/bloom-language';
/** An embedded-language view (`view()`), default-exported, as Mention's UserName. */
const Badge = view(function Badge({ label }: { label: string }) {
  return Text(label);
});
export default Badge;
export const NamedBadge = view(({ label }: { label: string }) => Text(label));
