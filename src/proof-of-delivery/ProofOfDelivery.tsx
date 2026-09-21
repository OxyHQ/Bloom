import React, { memo, useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';

import { Admonition } from '../admonition';
import { Button } from '../button';
import { Field } from '../field';
import { useControllableState } from '../hooks/use-controllable-state';
import { InputOtp } from '../input-otp';
import { SortablePhotoGrid } from '../sortable-media';
import { useSurfaceFill } from '../styles/surface-levels';
import { TextFieldInput } from '../text-field';
import { Textarea } from '../textarea';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { SortablePhoto } from '../sortable-media';
import { PROOF_GEOMETRY, PROOF_LABELS, PROOF_ORDER } from './constants';
import { SignaturePad } from './SignaturePad';
import {
  completeProofValue,
  missingProofs,
  orderProofs,
  resolveProofPaint,
} from './shared';
import type { ProofKind, ProofOfDeliveryProps, ProofOfDeliveryValue } from './types';

/**
 * It happened: the proofs an app asks for at the door, and one result.
 *
 *   heading    the title and its line, when the caller gives them
 *   blocks     one `Field` per proof, 20 apart, in the order the door is
 *              worked through (`PROOF_ORDER`) whatever order the caller listed
 *              them in — recipient, signature, code, photo, note
 *   summary    after a confirm that could not go through, an `error`
 *              `Admonition` in a `role="alert"` naming what is still missing
 *   confirm    a primary `Button`, full width
 *
 * Every block is an existing Bloom control asked for one thing:
 *
 *   recipient  `TextFieldInput`
 *   signature  `SignaturePad` (this family's one new surface)
 *   code       `InputOtp` — it already cleans, pads and reports completion
 *   photo      `SortablePhotoGrid` — the app owns the picker, the grid owns
 *              the order, the per-photo upload state and the retry
 *   note       `Textarea`
 *
 * `FileUpload` is deliberately not the photo control. It is a DROP ZONE with an
 * upload lifecycle of its own — right for a document on a desktop, wrong at a
 * door, where the photo comes from a camera the app opens and what has to be on
 * screen afterwards is the picture, its upload state and a way to take another.
 *
 * ## Every proof is a `Field`, so being required is said once
 *
 * The label, the hint, the required mark, the error and the association with
 * the control are the field's (`docs/composition.mdx`). Two of the five draw
 * SEVERAL controls — the signature is a pad and a name, the photo is a grid —
 * so those fields are `multiple`: one id on three inputs is invalid, and one
 * error described by three inputs is announced three times.
 *
 * ## The confirm control is never disabled
 *
 * It fires `onSubmit` on every press, with `missing` filled in. A disabled
 * confirm is the failure mode this avoids: the reader presses, nothing happens,
 * and nothing on screen says why — least of all to a screen reader, which is
 * told only that a button is dimmed. Pressing with something outstanding puts
 * the error on each missing field AND the summary at the bottom, so the answer
 * arrives in the same gesture that asked the question.
 *
 * The errors appear only AFTER the first press. A form that is red before it
 * has been filled in is a form that is wrong about the reader.
 */

function ProofOfDeliveryComponent({
  proofs = PROOF_ORDER,
  required = [],
  value: valueProp,
  defaultValue,
  onChange,
  onSubmit,
  onAddPhoto,
  onRetryPhoto,
  codeLength = 4,
  signatureHeight,
  maxPhotos = 4,
  submitting = false,
  disabled = false,
  title,
  description,
  actions,
  labels: labelOverrides,
  accessibilityLabel = 'Proof of delivery',
  style,
  testID,
}: ProofOfDeliveryProps) {
  const theme = useTheme();
  const surface = useSurfaceFill();
  const paint = useMemo(() => resolveProofPaint(theme, surface), [theme, surface]);
  const labels = useMemo(() => ({ ...PROOF_LABELS, ...labelOverrides }), [labelOverrides]);

  const [partial, setPartial] = useControllableState<Partial<ProofOfDeliveryValue>>({
    value: valueProp,
    defaultValue: defaultValue ?? {},
    onChange: onChange as ((value: Partial<ProofOfDeliveryValue>) => void) | undefined,
  });
  const value = useMemo(() => completeProofValue(partial), [partial]);
  // Errors appear only once a confirm has been refused; see the note above.
  const [asked, setAsked] = useState(false);

  const shown = useMemo(() => orderProofs(proofs), [proofs]);
  const missing = useMemo(
    () => missingProofs(value, required, shown, codeLength),
    [value, required, shown, codeLength],
  );

  const patch = useCallback(
    (next: Partial<ProofOfDeliveryValue>) => setPartial({ ...value, ...next }),
    [setPartial, value],
  );

  const submit = useCallback(() => {
    setAsked(true);
    onSubmit?.({ ...value, missing });
  }, [missing, onSubmit, value]);

  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);
  const errorFor = (kind: ProofKind) =>
    asked && missing.includes(kind) ? labels.missing : undefined;
  const isRequired = (kind: ProofKind) => required.includes(kind);

  const block = (kind: ProofKind): React.ReactNode => {
    switch (kind) {
      case 'recipient':
        return (
          <Field
            key={kind}
            label={labels.recipient}
            required={isRequired(kind)}
            error={errorFor(kind)}
            disabled={disabled}
          >
            <TextFieldInput
              label={labels.recipient}
              placeholder={labels.recipientPlaceholder}
              value={value.recipient}
              onChangeText={(text: string) => patch({ recipient: text })}
              autoCapitalize="words"
              testID={id('recipient')}
            />
          </Field>
        );
      case 'signature':
        return (
          <Field
            key={kind}
            label={labels.signature}
            required={isRequired(kind)}
            error={errorFor(kind)}
            disabled={disabled}
            // The pad AND the typed name: one id on two controls is invalid.
            multiple
          >
            <SignaturePad
              value={value.signature}
              onChange={(signature) => patch({ signature })}
              height={signatureHeight}
              disabled={disabled}
              labels={labelOverrides}
              testID={id('signature')}
            />
          </Field>
        );
      case 'code':
        return (
          <Field
            key={kind}
            label={labels.code}
            description={labels.codeHint}
            required={isRequired(kind)}
            error={errorFor(kind)}
            disabled={disabled}
            multiple
          >
            <InputOtp
              length={codeLength}
              value={value.code}
              onChange={(code: string) => patch({ code })}
              accessibilityLabel={labels.code}
              testID={id('code')}
            />
          </Field>
        );
      case 'photo':
        return (
          <Field
            key={kind}
            label={labels.photo}
            description={labels.photoHint}
            required={isRequired(kind)}
            error={errorFor(kind)}
            disabled={disabled}
            multiple
          >
            <SortablePhotoGrid
              photos={value.photos}
              onReorder={(photos: SortablePhoto[]) => patch({ photos })}
              onRemove={(photoId: string) =>
                patch({ photos: value.photos.filter((photo) => photo.id !== photoId) })
              }
              onRetry={onRetryPhoto}
              onAdd={onAddPhoto}
              maxPhotos={maxPhotos}
              disabled={disabled}
              accessibilityLabel={labels.photo}
              testID={id('photo')}
            />
          </Field>
        );
      case 'note':
        return (
          <Field
            key={kind}
            label={labels.note}
            required={isRequired(kind)}
            error={errorFor(kind)}
            disabled={disabled}
          >
            <Textarea
              // No `label`: `Textarea` DRAWS its own above the box whatever the
              // field says, so passing it here put "Note" on screen twice. The
              // field supplies both the visible label and, through
              // `useFieldMembership`, the announced name.
              placeholder={labels.notePlaceholder}
              value={value.note}
              onChangeText={(text: string) => patch({ note: text })}
              testID={id('note')}
            />
          </Field>
        );
    }
  };

  const summary =
    asked && missing.length > 0 ? (
      // `role="alert"` so the answer reaches a screen reader in the same
      // gesture that asked for it; `Admonition` paints it and says nothing.
      <View role="alert" testID={id('missing')}>
        <Admonition type="error">
          {`${labels.missingSummary(missing.length)}: ${missing
            .map((kind) => labels[kind])
            .join(', ')}.`}
        </Admonition>
      </View>
    ) : null;

  return (
    <View
      role="group"
      accessibilityLabel={accessibilityLabel}
      style={[{ gap: PROOF_GEOMETRY.gap }, style]}
      testID={testID}
    >
      {title || description ? (
        <View style={{ gap: 4 }} testID={id('heading')}>
          {title ? (
            <Text
              variant="title-3-semibold"
              role="heading"
              aria-level={2}
              style={{ color: paint.text }}
            >
              {title}
            </Text>
          ) : null}
          {description ? (
            <Text variant="body-regular" style={{ color: paint.textSecondary }}>
              {description}
            </Text>
          ) : null}
        </View>
      ) : null}

      {shown.map((kind) => block(kind))}

      {summary}

      {actions ?? (
        <Button
          variant="primary"
          size="large"
          fullWidth
          onPress={submit}
          // `submitting` is the ONE thing that stops the press: a second
          // confirm would record the same delivery twice. Something missing
          // does not stop it — it answers it.
          disabled={disabled || submitting}
          accessibilityLabel={labels.submit}
          testID={id('submit')}
        >
          {labels.submit}
        </Button>
      )}
    </View>
  );
}

export const ProofOfDelivery = memo(ProofOfDeliveryComponent);
ProofOfDelivery.displayName = 'ProofOfDelivery';
