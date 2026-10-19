/**
 * A stand-in for `react-native-enriched-html` in component suites: jsdom has
 * no editing surface to run the real one on. It draws the paragraphs it is
 * given in an editable element, as the web input does, and acts on nothing.
 */
import { createElement, forwardRef, useImperativeHandle, useRef } from 'react';

interface Props {
  defaultValue?: string;
  testID?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

function paragraphs(html: string): string[] {
  return [...html.matchAll(/<p>(.*?)<\/p>/gs)].map((m) => (m[1] ?? '').replace(/<[^>]+>/g, ''));
}

export const EnrichedTextInput = forwardRef(function EnrichedTextInput(
  { defaultValue = '', testID, onFocus, onBlur }: Props,
  ref,
) {
  const surface = useRef<HTMLDivElement | null>(null);
  useImperativeHandle(ref, () => {
    const noop = () => {};
    return new Proxy(
      {
        focus: () => surface.current?.focus(),
        blur: () => surface.current?.blur(),
      },
      { get: (target, name) => (target as Record<string | symbol, unknown>)[name] ?? noop },
    );
  });
  return createElement(
    'div',
    {
      ref: surface,
      contentEditable: true,
      suppressContentEditableWarning: true,
      'data-testid': testID,
      onFocus,
      onBlur,
    },
    paragraphs(defaultValue).map((text, i) => createElement('p', { key: i }, text)),
  );
});
