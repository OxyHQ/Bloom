import { Text } from '../typography';

/** Preserve the source paragraphs’ emphasis without fixing translated word order. */
export function SupportCopy({ text, term }: { text: string; term: string }) {
  const index = text.indexOf(term);
  return (
    <Text className="text-body-regular text-text-secondary">
      {index < 0 ? (
        text
      ) : (
        <>
          {text.slice(0, index)}
          <Text className="text-text-primary font-bold">{term}</Text>
          {text.slice(index + term.length)}
        </>
      )}
    </Text>
  );
}
