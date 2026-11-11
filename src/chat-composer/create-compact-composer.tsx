import {
  type ComponentRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { View as NativeView } from 'react-native';
import type { Button as ButtonComponent } from '../button/Button';
import { GlyphButton } from '../button/GlyphButton';
import type { Collapsible as CollapsibleComponent } from '../collapsible/Collapsible';
import { RiExpandDiagonalSLine } from '../icons/remix/RiExpandDiagonalSLine';
import type { ScrollArea as ScrollAreaComponent } from '../layout/ScrollArea';
import { Toolbar } from '../layout/Toolbar';
import { useCommonMessages } from '../locale/common-messages';
import { useMessages } from '../locale/messages';
import { MeterRing } from '../stat-bar/MeterRing';
import { IS_WEB } from '../styles/platform';
import { StyledView as View } from '../styles/styled-primitives';
import type { Surface as SurfaceComponent } from '../surface/Surface';
import { Textarea } from '../textarea/Textarea';
import { COMPACT_COMPOSER_MESSAGES } from './messages';
import { acceptsComposerText } from './compact-text';
import type { CompactComposerProps } from './compact-types';

/** Bind platform surfaces once. Both renderers share the same editor and behavior. */
export function createCompactComposer({
  Button,
  Collapsible,
  ScrollArea,
  Surface,
}: {
  Button: typeof ButtonComponent;
  Collapsible: typeof CollapsibleComponent;
  ScrollArea: typeof ScrollAreaComponent;
  Surface: typeof SurfaceComponent;
}) {
  function CompactComposer({
    value,
    onChangeText,
    maxLength,
    inputRef,
    placeholder,
    avatar,
    attachments,
    attachmentActions = [],
    onExpand,
    onSubmit,
    onFocusChange,
    disabled = false,
    busy = false,
    canSubmit = true,
    labels,
    className,
    style,
    testID,
  }: CompactComposerProps) {
    const { messages } = useMessages(COMPACT_COMPOSER_MESSAGES);
    const common = useCommonMessages();
    const capsule = useRef<ComponentRef<typeof NativeView>>(null);
    const [focused, setFocused] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const focusCallback = useRef(onFocusChange);
    useLayoutEffect(() => {
      focusCallback.current = onFocusChange;
    }, [onFocusChange]);
    useEffect(() => () => focusCallback.current?.(false), []);
    const updateFocus = useCallback((next: boolean) => {
      setFocused(next);
      focusCallback.current?.(next);
    }, []);
    const handleBlur = useCallback(
      (event: unknown) => {
        const next = (event as { relatedTarget?: Node }).relatedTarget;
        const node = capsule.current as unknown as { contains?: (target: Node) => boolean } | null;
        if (IS_WEB && next && node?.contains?.(next)) return;
        updateFocus(false);
      },
      [updateFocus],
    );
    const hasAttachments = attachments != null && attachments !== false;
    const blocked = disabled || busy;
    const expanded = focused || value.length > 0 || busy || hasAttachments;
    const submitEnabled =
      !blocked &&
      canSubmit &&
      value.length <= maxLength &&
      (value.trim().length > 0 || hasAttachments);
    const id = (part: string) => (testID ? `${testID}-${part}` : undefined);
    const inputLabel = labels?.input ?? placeholder ?? messages.input;
    const actions = (location: string) =>
      attachmentActions.map((action) => (
        <Button
          key={action.id}
          appearance="plain"
          tone="neutral"
          size="sm"
          iconOnly
          icon={action.icon}
          iconSize={24}
          accessibilityLabel={action.label}
          onPress={action.onPress}
          onBlur={handleBlur}
          disabled={blocked || action.disabled}
          testID={action.testID ?? id(`${location}-${action.id}`)}
        />
      ));
    return (
      <Surface
        ref={capsule}
        radius={28}
        className={['overflow-hidden', className].filter(Boolean).join(' ')}
        style={style}
        testID={testID}
      >
        <ScrollArea
          className="max-h-64 md:max-h-80"
          containerClassName="max-h-64 md:max-h-80"
          contentContainerClassName="px-3 py-1.5"
          scrollbar="always"
          keyboardShouldPersistTaps="handled"
          testID={id('scroll')}
        >
          {attachments}
          <View className="min-h-11 flex-row items-center gap-3">
            {avatar}
            <Textarea
              inputRef={inputRef}
              onFocus={() => updateFocus(true)}
              onBlur={handleBlur}
              value={value}
              onChangeText={(next) => {
                if (disabled) return;
                if (acceptsComposerText(value, next, maxLength)) onChangeText(next);
                else setAttempt((current) => current + 1);
              }}
              disabled={disabled}
              placeholder={placeholder ?? messages.input}
              accessibilityLabel={inputLabel}
              size="sm"
              rows={1}
              autoResize
              scrollEnabled={false}
              className="min-w-0 flex-1"
              fieldClassName="bg-transparent"
              inputClassName="overflow-hidden p-0 text-base leading-5 text-foreground"
              testID={id('input')}
            />
            <View className="flex-row items-center">
              {!expanded ? actions('inline') : null}
              {onExpand ? (
                <GlyphButton
                  onBlur={handleBlur}
                  size={32}
                  glyphSize={32}
                  hitSlop={6}
                  attention={attempt}
                  accessibilityHint={labels?.limitHint ?? messages.limitHint(maxLength)}
                  icon={RiExpandDiagonalSLine}
                  accessibilityLabel={labels?.expand ?? messages.expand}
                  disabled={blocked}
                  testID={id('maximize')}
                  onPress={onExpand}
                />
              ) : null}
            </View>
          </View>
        </ScrollArea>
        <Collapsible open={expanded}>
          <Toolbar
            size="sm"
            style={{ paddingLeft: 8, paddingRight: 12, paddingTop: 8, paddingBottom: 8 }}
            testID={id('toolbar')}
            actions={
              <View className="flex-row items-center gap-3">
                <MeterRing
                  value={value.length}
                  max={maxLength}
                  size={20}
                  thickness={2}
                  accessibilityLabel={labels?.characterCount ?? messages.characterCount}
                  valueText={(labels?.characterCountValue ?? messages.characterCountValue)(
                    value.length,
                    maxLength,
                  )}
                  testID={id('count')}
                />
                <Button
                  onBlur={handleBlur}
                  tone="action"
                  size="md"
                  className="min-w-20"
                  onPress={() => {
                    if (submitEnabled) onSubmit();
                  }}
                  disabled={!submitEnabled}
                  loading={busy}
                  testID={id('submit')}
                >
                  {labels?.submit ?? common.send}
                </Button>
              </View>
            }
          >
            <View className="flex-row items-center">{actions('toolbar')}</View>
          </Toolbar>
        </Collapsible>
      </Surface>
    );
  }
  return CompactComposer;
}
