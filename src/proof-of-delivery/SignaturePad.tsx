import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import { PanResponder, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';

import { Button } from '../button';
import { Field } from '../field';
import { useControllableState } from '../hooks/use-controllable-state';
import { RiDeleteBinLine } from '../icons/remix/RiDeleteBinLine';
import { SurfaceLevelProvider, useSurfaceFill } from '../styles/surface-levels';
import { DISABLED_OPACITY } from '../styles/tokens';
import { TextFieldInput } from '../text-field';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { PROOF_GEOMETRY, PROOF_LABELS } from './constants';
import {
  EMPTY_SIGNATURE,
  hasSignatureInk,
  resolveProofPaint,
  shouldKeepSignaturePoint,
  signaturePath,
} from './shared';
import type { SignaturePadProps, SignaturePoint, SignatureStroke } from './types';

/**
 * A signature, drawn with a finger — and the same signature typed, for everyone
 * who cannot draw one.
 *
 *   pad      a filled surface at the next level up, radius 12, with a baseline
 *            hairline at 72% of its height: a signature is written ON a line,
 *            and without one a finger starts wherever it lands
 *   ink      one `<Path>` per stroke, quadratic through the midpoints of the
 *            samples (`signaturePath`), round caps and joins, painted in the
 *            TEXT colour — a signature is writing, not a brand mark
 *   hint     under the pad, replaced by "Signed" once there is ink
 *   clear    a `text` `Button`, drawn only once there is something to clear
 *   typed    a `TextFieldInput` under it all, always present
 *
 * ## The typed field is not a fallback, it is the other half of the control
 *
 * A pad is a pointer affordance: there is no keyboard gesture for it, a screen
 * reader has nothing to announce but an empty box, and a motor impairment makes
 * it unusable. So both paths are drawn AT ONCE rather than behind a mode
 * switch — a mode a reader has to find is a mode most readers never find — and
 * `isSignatureGiven` treats ink and a typed name as the same answer.
 *
 * `typed={false}` removes it. That is a deliberate escape hatch for an app that
 * collects the name in a field of its own on the same screen, and it is the
 * only way to ship this control with no accessible path at all.
 *
 * ## The pointer
 *
 * One `PanResponder`, which react-native-web routes from real mouse, touch and
 * pen events through its own responder system — so the same file draws on both
 * platforms and there is no `.web` fork to keep in step. Points arrive in the
 * pad's own coordinates (`locationX` / `locationY`, which RNW measures against
 * the responder node), so a scrolled or transformed page needs no correction.
 *
 * Samples closer together than 2px are dropped (`shouldKeepSignaturePoint`):
 * a resting finger reports the same coordinate many times a second, and every
 * repeat is a zero-length curve the smoothing then has to average out.
 *
 * **A jest test cannot see any of this.** The path geometry is pure and pinned
 * in `src/__tests__/ProofOfDelivery.test.tsx`; that ink actually lands under a
 * real pointer is pinned in `scripts/verify-signature-pad.mjs`, with
 * `page.mouse.down/move/up` and the emitted `<path d>`.
 */

const asPoint = (event: GestureResponderEvent): SignaturePoint => ({
  x: event.nativeEvent.locationX,
  y: event.nativeEvent.locationY,
});

function SignaturePadComponent({
  value: valueProp,
  defaultValue,
  onChange,
  onStrokeEnd,
  height = PROOF_GEOMETRY.padHeight,
  ink,
  strokeWidth = PROOF_GEOMETRY.strokeWidth,
  typed = true,
  disabled = false,
  labels: labelOverrides,
  accessibilityLabel,
  style,
  testID,
}: SignaturePadProps) {
  const theme = useTheme();
  const surface = useSurfaceFill();
  const paint = useMemo(() => resolveProofPaint(theme, surface), [theme, surface]);
  const labels = useMemo(() => ({ ...PROOF_LABELS, ...labelOverrides }), [labelOverrides]);

  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue: defaultValue ?? EMPTY_SIGNATURE,
    onChange,
  });
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  /** The stroke under the finger, kept in state so the ink follows it. */
  const [live, setLive] = useState<SignaturePoint[]>([]);

  // The responder is created ONCE — its handlers close over the first render —
  // so everything they need goes through a ref that every render refreshes.
  const latest = useRef({ value, setValue, onStrokeEnd, disabled });
  latest.current = { value, setValue, onStrokeEnd, disabled };
  const liveRef = useRef<SignaturePoint[]>([]);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !latest.current.disabled,
        onMoveShouldSetPanResponder: () => !latest.current.disabled,
        // The pad KEEPS the gesture once it has it: a signature crosses a
        // scroller and an ancestor that could steal it mid-word would break the
        // stroke in half and leave the second half unrecorded.
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          if (latest.current.disabled) return;
          const point = asPoint(event);
          liveRef.current = [point];
          setLive(liveRef.current);
        },
        onPanResponderMove: (event) => {
          if (latest.current.disabled) return;
          const point = asPoint(event);
          const last = liveRef.current[liveRef.current.length - 1];
          if (!shouldKeepSignaturePoint(last, point)) return;
          liveRef.current = [...liveRef.current, point];
          setLive(liveRef.current);
        },
        onPanResponderRelease: () => {
          const stroke: SignatureStroke = liveRef.current;
          liveRef.current = [];
          setLive([]);
          if (stroke.length === 0) return;
          const current = latest.current.value;
          latest.current.setValue({ ...current, strokes: [...current.strokes, stroke] });
          latest.current.onStrokeEnd?.(stroke);
        },
        onPanResponderTerminate: () => {
          liveRef.current = [];
          setLive([]);
        },
      }),
    [],
  );

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height: measured } = event.nativeEvent.layout;
    setSize((prev) =>
      prev && prev.width === width && prev.height === measured
        ? prev
        : { width, height: measured },
    );
  }, []);

  const clear = useCallback(() => {
    liveRef.current = [];
    setLive([]);
    setValue({ ...value, strokes: [] });
  }, [setValue, value]);

  const strokes = value.strokes;
  const hasInk = hasSignatureInk(value) || live.length > 0;
  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);
  const inkColor = ink ?? paint.padText.text;
  const padName = accessibilityLabel ?? labels.signaturePad;

  return (
    <View style={[{ gap: PROOF_GEOMETRY.blockGap, opacity: disabled ? DISABLED_OPACITY : 1 }, style]} testID={testID}>
      <SurfaceLevelProvider level={1} fill={paint.pad}>
        <View
          onLayout={onLayout}
          {...responder.panHandlers}
          // The drawn signature IS an image: it is not operable by keyboard and
          // holds no state ARIA can read, so it announces what it is and the
          // typed field below carries the input semantics.
          role="img"
          accessibilityLabel={hasInk ? `${padName}, ${labels.signed}` : padName}
          style={{
            height,
            width: '100%',
            overflow: 'hidden',
            borderRadius: PROOF_GEOMETRY.padRadius,
            // A hairline as well as the fill: one surface step up from the page
            // is a small step by design, and without an EDGE the pad reads as a
            // gap in the form rather than as somewhere to write. Every other
            // control around it draws one.
            borderWidth: 1,
            borderColor: paint.hairline,
            backgroundColor: paint.pad,
          }}
          testID={id('pad')}
        >
          {size ? (
            <Svg width={size.width} height={size.height} pointerEvents="none">
              <Line
                x1={PROOF_GEOMETRY.baselineInset}
                x2={Math.max(PROOF_GEOMETRY.baselineInset, size.width - PROOF_GEOMETRY.baselineInset)}
                y1={size.height * PROOF_GEOMETRY.baseline}
                y2={size.height * PROOF_GEOMETRY.baseline}
                stroke={paint.hairline}
                strokeWidth={1}
                testID={id('baseline')}
              />
              {strokes.map((stroke, index) => (
                <Path
                  key={index}
                  d={signaturePath(stroke)}
                  stroke={inkColor}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  testID={id(`stroke-${index}`)}
                />
              ))}
              {live.length > 0 ? (
                <Path
                  d={signaturePath(live)}
                  stroke={inkColor}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  testID={id('stroke-live')}
                />
              ) : null}
            </Svg>
          ) : null}
        </View>
      </SurfaceLevelProvider>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <Text
          variant="body-2-regular"
          numberOfLines={1}
          style={{ flexShrink: 1, color: paint.textSecondary }}
          testID={id('hint')}
        >
          {hasInk ? labels.signed : labels.signatureHint}
        </Text>
        {hasInk ? (
          <Button
            variant="text"
            size="small"
            leadingIcon={RiDeleteBinLine}
            onPress={clear}
            disabled={disabled}
            accessibilityLabel={labels.clear}
            testID={id('clear')}
          >
            {labels.clear}
          </Button>
        ) : null}
      </View>

      {typed ? (
        // Its OWN `Field`, nested inside whatever field the pad is in. Without
        // it the typed input inherits the outer field's label — `TextFieldInput`
        // resolves its name as `field.labelText ?? label` and offers the caller
        // no override — so the words "Or type your name" would be drawn nowhere
        // and announced as "Signature", the same as the pad beside it.
        <Field label={labels.typeName} disabled={disabled}>
          <TextFieldInput
            label={labels.typeName}
            placeholder={labels.typeNamePlaceholder}
            value={value.typedName ?? ''}
            onChangeText={(text: string) => setValue({ ...value, typedName: text })}
            disabled={disabled}
            autoCapitalize="words"
            testID={id('typed')}
          />
        </Field>
      ) : null}
    </View>
  );
}

export const SignaturePad = memo(SignaturePadComponent);
SignaturePad.displayName = 'SignaturePad';
