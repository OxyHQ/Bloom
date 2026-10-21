/**
 * A stand-in for `react-native-enriched-html` in component suites: jsdom has
 * no editing surface to run the real one on. It draws the paragraphs it is
 * given in an editable element, as the web input does, and acts on nothing.
 */
import { createElement, forwardRef, useImperativeHandle, useRef, useEffect } from 'react';

interface Props {
  defaultValue?: string;
  testID?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  editable?: boolean;
  onChangeHtml?: (event: { nativeEvent: { value: string } }) => void;
  onChangeSelection?: (event: { nativeEvent: { start: number; end: number } }) => void;
  onStartMention?: (indicator: string) => void;
  onChangeMention?: (query: { indicator: string; text: string }) => void;
  onEndMention?: () => void;
}

export const inputProps = new Map<string, Props>();
export const mentionInsertions: unknown[][] = [];

function paragraphs(html: string): string[] {
  return [...html.matchAll(/<p>(.*?)<\/p>/gs)].map((m) => (m[1] ?? '').replace(/<[^>]+>/g, ''));
}

export const EnrichedTextInput = forwardRef(function EnrichedTextInput(props: Props, ref) {
  const { defaultValue = '', testID, onFocus, onBlur, editable = true } = props;
  const latest = useRef(props);
  latest.current = props;
  useEffect(() => {
    latest.current.onChangeHtml?.({ nativeEvent: { value: defaultValue } });
  }, [defaultValue]);
  useEffect(() => {
    if (!testID) return;
    inputProps.set(testID, props);
    return () => {
      inputProps.delete(testID);
    };
  });
  const surface = useRef<HTMLDivElement | null>(null);
  useImperativeHandle(ref, () => {
    const noop = () => {};
    return new Proxy(
      {
        focus: () => surface.current?.focus(),
        blur: () => surface.current?.blur(),
        setValue: (value: string) => {
          if (surface.current) surface.current.innerHTML = value;
          latest.current.onChangeHtml?.({ nativeEvent: { value } });
        },
        setMention: (...args: unknown[]) => mentionInsertions.push(args),
      },
      { get: (target, name) => (target as Record<string | symbol, unknown>)[name] ?? noop },
    );
  });
  return createElement(
    'div',
    {
      ref: surface,
      contentEditable: editable,
      suppressContentEditableWarning: true,
      'data-testid': testID,
      onFocus,
      onBlur,
    },
    paragraphs(defaultValue).map((text, i) => createElement('p', { key: i }, text)),
  );
});
