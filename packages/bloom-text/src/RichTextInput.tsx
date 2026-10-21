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
import { segmentsToPlainText } from './segments';
import { measureRanges } from './text-geometry';
import { containsFocus, useKeyCapture } from './key-capture';
import { InputSync } from './input-sync';
import { usePasteCapture } from './paste-capture';
import { useInputAccessibility } from './input-accessibility';
import type { ActiveMarks, RichTextInputHandle, RichTextInputProps, ToggleableMark } from './types';

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
    onPasteImages,
    onPaste,
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
  useKeyCapture(wrapperRef, editable ? onKeyCommand : undefined);
  usePasteCapture(wrapperRef, editable ? onPaste : undefined);
  useInputAccessibility(wrapperRef, props);
  // Mounted with the first value only; later values arrive through setValue.
  const [defaultHtml] = useState(() => segmentsToHtml(value));
  const [sync] = useState(
    () =>
      new InputSync(value, {
        setValue: (next) => inputRef.current?.setValue(segmentsToHtml(next)),
        setSelection: ({ start, end }) => inputRef.current?.setSelection(start, end),
      }),
  );

  // A value from outside (another collaborator, an undo, a programmatic edit).
  useEffect(() => {
    sync.update(value);
  }, [sync, value]);

  const handleHtml = useCallback(
    (html: string) => {
      const change = sync.report(htmlToSegments(html));
      if (change && editable) onChange(change);
    },
    [sync, onChange, editable],
  );

  useImperativeHandle(
    ref,
    (): RichTextInputHandle => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      isFocused: () => focusedRef.current || containsFocus(wrapperRef),
      setSelection: (start, end) => {
        sync.select({ start, end });
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
      measureRanges: (ranges) =>
        measureRanges(wrapperRef.current, segmentsToPlainText(sync.current), ranges),
    }),
    [sync],
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
        accessibilityState={{ expanded: props['aria-expanded'] }}
        testID={testID}
        onChangeHtml={(e) => handleHtml(e.nativeEvent.value)}
        onChangeSelection={(e) => {
          const { start, end } = e.nativeEvent;
          sync.select({ start, end });
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
                if (editable && Platform.OS !== 'web')
                  onKeyCommand?.({ key, shift: false, alt: false, mod: false });
              }
            : undefined
        }
        onSubmitEditing={onSubmit && editable ? () => onSubmit() : undefined}
        onPasteImages={
          onPasteImages
            ? (e) => onPasteImages(e.nativeEvent.images.map((i) => ({ ...i })))
            : undefined
        }
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
