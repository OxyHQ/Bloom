// A plain arrow component drawn as JSX (`<Row … />`) that reads a hook and builds its UI with a
// module function is a view: its hook is a member, as React's component held it.
import { Embed, HStack, RawText, VStack, view } from '@oxy.so/bloom-language';
import { useTheme } from '@/lib/theme';

function row(body: ReturnType<typeof RawText>) {
  return HStack(body).spacing('md');
}

const Row = ({ label }: { label: string }) => {
  const theme = useTheme();
  return row(RawText(label).foreground(theme.primary));
};

export const Rows = view(function Rows({ labels }: { labels: string[] }) {
  return VStack(Embed(<Row label={labels[0] ?? ''} />));
});
