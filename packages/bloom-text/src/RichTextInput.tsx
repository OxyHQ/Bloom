import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ForwardedRef,
} from 'react';
import { StyleSheet } from 'react-native';
import {
  EnrichedTextInput,
  type EnrichedInputStyle,
  type EnrichedTextInputInstance,
  type HtmlStyle,
  type OnChangeStateEvent,
} from 'react-native-enriched-html';
import { htmlToSegments, segmentsToHtml } from './html';
import { reconcileInputValue } from './reconcile';
import { segmentsEqual, segmentsToPlainText, diffText } from './segments';
import { transformSelection } from './selection';
import type {
  ActiveMarks,
  RichTextInputHandle,
  RichTextInputProps,
  Segment,
  TextSelection,
  ToggleableMark,
} from './types';

/** Block-level shortcuts belong to the block editor, never to one input. */
const NO_TEXT_SHORTCUTS: [] = [];

function activeMarksFrom(state: OnChangeStateEvent): ActiveMarks {
  return {
    bold: state.bold.isActive,
    italic: state.italic.isActive,
    underline: state.underline.isActive,
    strike: state.strikeThrough.isActive,
    code: state.inlineCode.isActive,
    link: state.link.isActive,
    mention: state.mention.isActive,
  };
}

function RichTextInputImpl(props: RichTextInputProps, ref: ForwardedRef<RichTextInputHandle>) {
  const {
    value,
    onChange,
    onSelectionChange,
    onActiveMarksChange,
    onFocus,
    onBlur,
    onKeyPress,
    onSubmit,
    mentionIndicators,
    onMentionQuery,
    placeholder,
    placeholderTextColor,
    editable = true,
    autoFocus,
    textStyle,
    style,
    accessibilityLabel,
    testID,
  } = props;

  const inputRef = useRef<EnrichedTextInputInstance | null>(null);
  // The value the input currently shows, as last reported by it or pushed to it.
  const shownRef = useRef<Segment[]>(value);
  const selectionRef = useRef<TextSelection>({ start: 0, end: 0 });
  // Mounted with the first value only; later values arrive through setValue.
  const [defaultHtml] = useState(() => segmentsToHtml(value));

  // A value that differs from what the input shows came from outside (another
  // collaborator, an undo, a programmatic edit): replace the content and keep
  // the caret where the same text still is.
  useEffect(() => {
    if (segmentsEqual(value, shownRef.current)) return;
    const edit = diffText(segmentsToPlainText(shownRef.current), segmentsToPlainText(value));
    shownRef.current = value;
    const input = inputRef.current;
    if (!input) return;
    input.setValue(segmentsToHtml(value));
    const next = edit ? transformSelection(selectionRef.current, edit) : selectionRef.current;
    selectionRef.current = next;
    input.setSelection(next.start, next.end);
  }, [value]);

  const handleHtml = useCallback(
    (html: string) => {
      const { segments, edit } = reconcileInputValue(shownRef.current, htmlToSegments(html));
      if (segmentsEqual(segments, shownRef.current)) return;
      shownRef.current = segments;
      onChange({ segments, text: segmentsToPlainText(segments), edit });
    },
    [onChange],
  );

  useImperativeHandle(
    ref,
    (): RichTextInputHandle => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      setSelection: (start, end) => {
        selectionRef.current = { start, end };
        inputRef.current?.setSelection(start, end);
      },
      toggleMark: (mark: ToggleableMark) => {
        const input = inputRef.current;
        if (!input) return;
        if (mark === 'bold') input.toggleBold();
        else if (mark === 'italic') input.toggleItalic();
        else if (mark === 'underline') input.toggleUnderline();
        else if (mark === 'strike') input.toggleStrikeThrough();
        else input.toggleInlineCode();
      },
      setLink: (start, end, text, url) => inputRef.current?.setLink(start, end, text, url),
      removeLink: (start, end) => inputRef.current?.removeLink(start, end),
      startMention: (indicator) => inputRef.current?.startMention(indicator),
      insertMention: (indicator, text, attributes) =>
        inputRef.current?.setMention(indicator, text, attributes),
    }),
    [],
  );

  const inputStyle = useMemo((): EnrichedInputStyle => {
    const flat = (StyleSheet.flatten(style) ?? {}) as EnrichedInputStyle;
    return {
      ...flat,
      ...(textStyle?.color !== undefined && { color: textStyle.color }),
      ...(textStyle?.fontSize !== undefined && { fontSize: textStyle.fontSize }),
      ...(textStyle?.lineHeight !== undefined && { lineHeight: textStyle.lineHeight }),
      ...(textStyle?.fontFamily !== undefined && { fontFamily: textStyle.fontFamily }),
      ...(textStyle?.fontWeight !== undefined && { fontWeight: textStyle.fontWeight }),
    };
  }, [style, textStyle]);

  const htmlStyle = useMemo(
    (): HtmlStyle => ({
      a: { color: textStyle?.linkColor, textDecorationLine: 'underline' },
      code: { color: textStyle?.codeColor, backgroundColor: textStyle?.codeBackgroundColor },
      mention: {
        color: textStyle?.mentionColor,
        backgroundColor: textStyle?.mentionBackgroundColor,
      },
    }),
    [
      textStyle?.linkColor,
      textStyle?.codeColor,
      textStyle?.codeBackgroundColor,
      textStyle?.mentionColor,
      textStyle?.mentionBackgroundColor,
    ],
  );

  return (
    <EnrichedTextInput
      ref={inputRef}
      defaultValue={defaultHtml}
      editable={editable}
      autoFocus={autoFocus}
      placeholder={placeholder}
      placeholderTextColor={placeholderTextColor}
      mentionIndicators={mentionIndicators ?? []}
      textShortcuts={NO_TEXT_SHORTCUTS}
      scrollEnabled={false}
      submitBehavior={onSubmit ? 'submit' : 'newline'}
      style={inputStyle}
      htmlStyle={htmlStyle}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      onChangeHtml={(e) => handleHtml(e.nativeEvent.value)}
      onChangeSelection={(e) => {
        const { start, end } = e.nativeEvent;
        selectionRef.current = { start, end };
        onSelectionChange?.({ start, end });
      }}
      onChangeState={
        onActiveMarksChange ? (e) => onActiveMarksChange(activeMarksFrom(e.nativeEvent)) : undefined
      }
      onKeyPress={onKeyPress ? (e) => onKeyPress(e.nativeEvent.key) : undefined}
      onSubmitEditing={onSubmit ? () => onSubmit() : undefined}
      onFocus={onFocus ? () => onFocus() : undefined}
      onBlur={onBlur ? () => onBlur() : undefined}
      onStartMention={
        onMentionQuery ? (indicator) => onMentionQuery({ indicator, text: '' }) : undefined
      }
      onChangeMention={
        onMentionQuery ? (e) => onMentionQuery({ indicator: e.indicator, text: e.text }) : undefined
      }
      onEndMention={onMentionQuery ? () => onMentionQuery(null) : undefined}
    />
  );
}

/**
 * A rich text input on each platform's own text engine (iOS and Android
 * native views, the browser's editing surface on web), driven by `Segment[]`.
 */
export const RichTextInput = forwardRef(RichTextInputImpl);
RichTextInput.displayName = 'RichTextInput';
