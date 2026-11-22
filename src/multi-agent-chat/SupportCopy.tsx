import { createTokenStyles } from '../theme/color-tokens';
import { Text } from '../typography';
import { stepLineHeight } from './web-css';

/** Preserve the source paragraphs’ emphasis without fixing translated word order. */
export function SupportCopy({ text, term }: { text: string; term: string }) {
  const styles = useStyles();
  const index = text.indexOf(term);
  return (
    <Text style={styles.copy}>
      {index < 0 ? (
        text
      ) : (
        <>
          {text.slice(0, index)}
          <Text style={styles.term}>{term}</Text>
          {text.slice(index + term.length)}
        </>
      )}
    </Text>
  );
}

const useStyles = createTokenStyles((t) => ({
  copy: {
    color: t.mutedForeground,
    lineHeight: stepLineHeight(20, 14),
    fontWeight: 400,
  },
  term: { fontWeight: 700, color: t.foreground },
}));
