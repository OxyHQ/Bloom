import type { RichTextInputHandle, TextRect } from '@oxy.so/bloom-text';
import { type ComponentRef, type RefObject, useLayoutEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { type RangeMark, rangeMarks } from './range-decorations';
import type { TextRangeDecoration } from './decorations';

const CARET_WIDTH = 2;
/** The text of the web caret's span: gives it a line box to draw its border down. */
const ZERO_WIDTH_SPACE = '\u200b';

/** A collaborator's name over their caret. */
export function CaretFlag({ label, color, textColor, left = 0 }: CaretFlagProps) {
  return (
    <View style={[styles.flagBox, { left }]}>
      <Text numberOfLines={1} style={[styles.flag, { backgroundColor: color, color: textColor }]}>
        {label}
      </Text>
    </View>
  );
}

interface CaretFlagProps {
  label: string;
  color: string;
  /** The flag's text: the page's background colour, which caret colours are chosen against. */
  textColor: string;
  /** Where the flag starts, from the left of the box it hangs from. */
  left?: number;
}

/**
 * A caret inside drawn text (`RunsText`), at its place in the line. On web,
 * a span of no width whose left border is the caret, as tall as the text
 * around it; on native, an inline view (React Native lays views out inside
 * text), as tall as the font.
 */
export function InlineCaret({
  color,
  label,
  fontSize,
  textColor,
}: {
  color: string;
  label?: string;
  fontSize: number;
  textColor: string;
}) {
  if (Platform.OS === 'web') {
    return (
      <Text style={[styles.inlineCaretWeb, { borderLeftColor: color }]}>
        {ZERO_WIDTH_SPACE}
        {/* Positioned from inside the border, which is the caret. */}
        {label ? (
          <CaretFlag label={label} color={color} textColor={textColor} left={-CARET_WIDTH} />
        ) : null}
      </Text>
    );
  }
  return (
    <View style={[styles.inlineCaretNative, { height: fontSize, backgroundColor: color }]}>
      {label ? <CaretFlag label={label} color={color} textColor={textColor} /> : null}
    </View>
  );
}

/** A measured mark: its boxes on the input. */
interface MeasuredMark {
  mark: RangeMark;
  rects: readonly TextRect[];
}

/**
 * Web: the decorations of a block being edited, measured on its input — on
 * every change to them or to the text, and whenever the block's box changes
 * size (its lines wrap again). Empty on native, where the input measures
 * nothing, and whenever the input does not show the text the decorations
 * were made for.
 */
export function useMeasuredMarks(
  input: RefObject<RichTextInputHandle | null>,
  host: RefObject<ComponentRef<typeof View> | null>,
  ranges: readonly TextRangeDecoration[] | undefined,
  text: string,
  active: boolean,
): readonly MeasuredMark[] {
  const marks = useMemo(
    () => (active ? rangeMarks(ranges, text.length) : []),
    [active, ranges, text.length],
  );
  const [measured, setMeasured] = useState<readonly MeasuredMark[]>([]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new text moves what is measured.
  useLayoutEffect(() => {
    if (marks.length === 0 || Platform.OS !== 'web') {
      setMeasured((current) => (current.length === 0 ? current : []));
      return;
    }
    let frame = 0;
    let live = true;
    const measure = () => {
      cancelAnimationFrame(frame);
      // After the input has taken the value this render gave it.
      frame = requestAnimationFrame(() => {
        const rects = input.current?.measureRanges(marks);
        setMeasured(rects ? marks.map((mark, i) => ({ mark, rects: rects[i] ?? [] })) : []);
      });
    };
    measure();
    const node = host.current as unknown as Element | null;
    const observer =
      typeof ResizeObserver !== 'undefined' && node instanceof Element
        ? new ResizeObserver(measure)
        : null;
    if (node && observer) observer.observe(node);
    // Text drawn in a font that loads later wraps differently.
    document.fonts?.ready.then(() => {
      if (live) measure();
    });
    return () => {
      live = false;
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [marks, text, input, host]);
  return measured;
}

/** Highlights measured on an input, drawn under its text. */
export function MeasuredHighlights({ marks }: { marks: readonly MeasuredMark[] }) {
  return (
    <>
      {marks.map(({ mark, rects }, i) =>
        mark.kind === 'highlight'
          ? rects.map((rect, j) => (
              <View
                // biome-ignore lint/suspicious/noArrayIndexKey: marks and their boxes are positional.
                key={`${i}:${j}`}
                style={[
                  styles.measured,
                  {
                    left: rect.x,
                    top: rect.y,
                    width: rect.width,
                    height: rect.height,
                    backgroundColor: mark.color,
                  },
                ]}
              />
            ))
          : null,
      )}
    </>
  );
}

/** Carets measured on an input, drawn over its text. */
export function MeasuredCarets({
  marks,
  textColor,
}: {
  marks: readonly MeasuredMark[];
  textColor: string;
}) {
  return (
    <>
      {marks.map(({ mark, rects }, i) => {
        const rect = rects[0];
        if (mark.kind !== 'caret' || !rect) return null;
        return (
          <View
            // biome-ignore lint/suspicious/noArrayIndexKey: marks are positional.
            key={i}
            style={[
              styles.measured,
              {
                left: rect.x - CARET_WIDTH / 2,
                top: rect.y,
                width: CARET_WIDTH,
                height: rect.height,
                backgroundColor: mark.color,
              },
            ]}
          >
            {mark.label ? (
              <CaretFlag label={mark.label} color={mark.color} textColor={textColor} />
            ) : null}
          </View>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  // Its border is the caret; the negative margins give its width back.
  inlineCaretWeb: {
    position: 'relative',
    borderLeftWidth: CARET_WIDTH,
    marginLeft: -CARET_WIDTH / 2,
    marginRight: -CARET_WIDTH / 2,
  },
  inlineCaretNative: { width: CARET_WIDTH },
  // Wide enough for a name on one line; the flag inside is as wide as its text.
  flagBox: {
    position: 'absolute',
    bottom: '100%',
    width: 240,
    flexDirection: 'row',
    pointerEvents: 'none',
  },
  flag: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    paddingHorizontal: 4,
    borderRadius: 3,
    borderBottomLeftRadius: 0,
    overflow: 'hidden',
  },
  measured: { position: 'absolute', pointerEvents: 'none' },
});
