// A TS component a row draws over a thread (lang-mention-9's narrowed-dep).
export function Overlay({ sliceKey, owner }: { sliceKey: string; owner: object }) {
  return (
    <>
      {sliceKey}
      {String(!!owner)}
    </>
  );
}
