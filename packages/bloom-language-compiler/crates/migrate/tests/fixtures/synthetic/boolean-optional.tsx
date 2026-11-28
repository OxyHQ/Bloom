// `Boolean(x?.trim())`: an optional string's truthiness, `(x?.trimmed() ?? "") != ""`.
import { Text, view } from '@oxy.so/bloom-language';

export const Alt = view(function Alt({ alt }: { alt?: string }) {
  return Text(Boolean(alt?.trim()) ? 'Has alt text' : 'No alt text');
});
