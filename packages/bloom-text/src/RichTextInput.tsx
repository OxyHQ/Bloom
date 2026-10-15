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
import { Platform, StyleSheet, View } from 'react-native';
import {
  EnrichedTextInput,
  type EnrichedInputStyle,
  type EnrichedTextInputInstance,
  type HtmlStyle,
  type OnChangeStateEvent,
} from 'react-native-enriched-html';
import { htmlToSegments, segmentsToHtml } from './html';
import { containsFocus, useKeyCapture } from './key-capture';
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
    onKeyCommand,
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
  const wrapperRef = useRef<View | null>(null);
  const focusedRef = useRef(false);
  useKeyCapture(wrapperRef, onKeyCommand);
  // The value the input currently shows, as last reported by it or pushed to it.
  const shownRef = useRef<Segment[]>(value);
  /** Whether the input has loaded `shownRef`'s value since it was last set. */
  const loadedRef = useRef(false);
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
    loadedRef.current = false;
    input.setValue(segmentsToHtml(value));
    const next = edit ? transformSelection(selectionRef.current, edit) : selectionRef.current;
    selectionRef.current = next;
    input.setSelection(next.start, next.end);
  }, [value]);

  const handleHtml = useCallback(
    (html: string) => {
      const reported = htmlToSegments(html);
      // Until the input shows the value it was given (on mount, after
      // setValue), what it reports is its own transient state — an empty
      // document before the content loads — not an edit.
      if (!loadedRef.current) {
        if (segmentsEqual(reported, shownRef.current)) loadedRef.current = true;
        return;
      }
      const { segments, edit } = reconcileInputValue(shownRef.current, reported);
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
      isFocused: () => focusedRef.current || containsFocus(wrapperRef),
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
    <View ref={wrapperRef}>
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
          onActiveMarksChange
            ? (e) => onActiveMarksChange(activeMarksFrom(e.nativeEvent))
            : undefined
        }
        onKeyPress={
          onKeyPress || (onKeyCommand && Platform.OS !== 'web')
            ? (e) => {
                const { key } = e.nativeEvent;
                onKeyPress?.(key);
                // Web reports key commands from the capture listener instead.
                if (Platform.OS !== 'web')
                  onKeyCommand?.({ key, shift: false, alt: false, mod: false });
              }
            : undefined
        }
        onSubmitEditing={onSubmit ? () => onSubmit() : undefined}
        onFocus={() => {
          focusedRef.current = true;
          onFocus?.();
        }}
        onBlur={() => {
          focusedRef.current = false;
          onBlur?.();
        }}
        onStartMention={
          onMentionQuery ? (indicator) => onMentionQuery({ indicator, text: '' }) : undefined
        }
        onChangeMention={
          onMentionQuery
            ? (e) => onMentionQuery({ indicator: e.indicator, text: e.text })
            : undefined
        }
        onEndMention={onMentionQuery ? () => onMentionQuery(null) : undefined}
      />
    </View>
  );
}

/**
 * A rich text input on each platform's own text engine (iOS and Android
 * native views, the browser's editing surface on web), driven by `Segment[]`.
 */
export const RichTextInput = forwardRef(RichTextInputImpl);
RichTextInput.displayName = 'RichTextInput';
