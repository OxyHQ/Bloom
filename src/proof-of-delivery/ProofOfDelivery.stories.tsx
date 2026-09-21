import React, { useContext, useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { BloomThemeContext, BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { ProofOfDelivery } from './ProofOfDelivery';
import { SignaturePad } from './SignaturePad';
import type { ProofOfDeliveryResult, ProofOfDeliveryValue, SignatureValue } from './types';

const meta: Meta = {
  title: 'Blocks/Fulfilment/ProofOfDelivery',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

const noop = () => undefined;

/**
 * A stand-in for a camera. A story takes no photograph, so the "photo" it adds
 * is a drawn data URI — no network, and nothing that needs cleaning up.
 */
const SWATCH =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240">' +
      '<rect width="240" height="240" fill="#8a7f6d"/>' +
      '<rect x="40" y="120" width="160" height="96" rx="6" fill="#c8b89a"/>' +
      '<rect x="0" y="200" width="240" height="40" fill="#5f5648"/>' +
      '</svg>',
  );

function Page({ children, maxWidth = 560 }: { children: React.ReactNode; maxWidth?: number }) {
  const theme = useTheme();
  return (
    <View style={{ backgroundColor: theme.colors.background, padding: 20, gap: 16 }}>
      <View style={{ width: '100%', maxWidth, gap: 16 }}>{children}</View>
    </View>
  );
}

function Caption({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text variant="caption-1-medium" style={{ color: theme.colors.textSecondary }}>
      {children}
    </Text>
  );
}

function BothModes({ children }: { children: React.ReactNode }) {
  const preset = useContext(BloomThemeContext)?.colorPreset;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      <BloomThemeProvider mode="light" colorPreset={preset}>
        <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 380, minWidth: 0, maxWidth: 560 }}>
          <Page>{children}</Page>
        </View>
      </BloomThemeProvider>
      <BloomThemeProvider mode="dark" colorPreset={preset}>
        <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 380, minWidth: 0, maxWidth: 560 }}>
          <Page>{children}</Page>
        </View>
      </BloomThemeProvider>
    </View>
  );
}

/** The pad on its own. Draw on it with a mouse, a finger or a pen. */
export const Signature: Story = {
  render: function SignatureStory() {
    const [value, setValue] = useState<SignatureValue>({ strokes: [], typedName: '' });
    return (
      <Page maxWidth={420}>
        <SignaturePad value={value} onChange={setValue} testID="pad" />
        <Caption>
          {value.strokes.length === 0
            ? 'Nothing drawn yet'
            : `${value.strokes.length} stroke${value.strokes.length === 1 ? '' : 's'}`}
        </Caption>
      </Page>
    );
  },
};

/** The pad already signed, so the hint, the clear control and the ink are all on. */
export const SignatureSigned: Story = {
  render: () => (
    <Page maxWidth={420}>
      <SignaturePad
        defaultValue={{
          strokes: [
            [
              { x: 30, y: 110 },
              { x: 52, y: 62 },
              { x: 70, y: 118 },
              { x: 96, y: 54 },
              { x: 118, y: 120 },
              { x: 150, y: 70 },
              { x: 186, y: 104 },
              { x: 222, y: 76 },
            ],
            [
              { x: 232, y: 120 },
              { x: 268, y: 98 },
            ],
          ],
        }}
        testID="pad"
      />
    </Page>
  ),
};

/** The whole thing, with everything the app can ask for and nothing required. */
export const Everything: Story = {
  render: function EverythingStory() {
    const [value, setValue] = useState<Partial<ProofOfDeliveryValue>>({});
    const [result, setResult] = useState<ProofOfDeliveryResult | null>(null);
    return (
      <Page>
        <ProofOfDelivery
          title="Proof of delivery"
          description="Two-seater sofa and a footstool, to Travessa do Olival 3."
          value={value}
          onChange={setValue}
          onSubmit={setResult}
          onAddPhoto={() =>
            setValue((current) => ({
              ...current,
              photos: [
                ...(current.photos ?? []),
                { id: `photo-${(current.photos ?? []).length + 1}`, uri: SWATCH, alt: 'Left at the door' },
              ],
            }))
          }
          testID="pod"
        />
        <Caption>
          {result === null
            ? 'Not confirmed yet'
            : result.missing.length === 0
              ? 'Confirmed'
              : `Still missing: ${result.missing.join(', ')}`}
        </Caption>
      </Page>
    );
  },
};

/**
 * Three proofs, all of them required, confirmed before anything was given —
 * the errors and the summary are the answer to the press, not a wall in front
 * of it.
 */
export const Required: Story = {
  render: function RequiredStory() {
    const [value, setValue] = useState<Partial<ProofOfDeliveryValue>>({});
    return (
      <Page>
        <ProofOfDelivery
          proofs={['recipient', 'signature', 'code']}
          required={['recipient', 'signature', 'code']}
          value={value}
          onChange={setValue}
          onSubmit={noop}
          testID="pod"
        />
      </Page>
    );
  },
};

/** Just the code, for an app whose whole proof is four digits. */
export const CodeOnly: Story = {
  render: () => (
    <Page maxWidth={420}>
      <ProofOfDelivery
        proofs={['code']}
        required={['code']}
        codeLength={6}
        defaultValue={{ code: '8214' }}
        onSubmit={noop}
        testID="pod"
      />
    </Page>
  ),
};

/** Filled in and saving: the one state that stops the press. */
export const Submitting: Story = {
  render: () => (
    <Page>
      <ProofOfDelivery
        proofs={['recipient', 'signature', 'photo']}
        required={['recipient']}
        defaultValue={{
          recipient: 'Nuno Peralta',
          signature: { strokes: [], typedName: 'Nuno Peralta' },
          photos: [{ id: 'photo-1', uri: SWATCH, alt: 'Left inside the porch' }],
        }}
        submitting
        onSubmit={noop}
        testID="pod"
      />
    </Page>
  ),
};

/** Every control stopped. */
export const Disabled: Story = {
  render: () => (
    <Page>
      <ProofOfDelivery
        proofs={['recipient', 'signature', 'note']}
        defaultValue={{ recipient: 'Nuno Peralta', note: 'Left with the neighbour at number 5.' }}
        disabled
        onSubmit={noop}
        testID="pod"
      />
    </Page>
  ),
};

/** Both modes side by side. */
export const Modes: Story = {
  render: () => (
    <BothModes>
      <ProofOfDelivery proofs={['recipient', 'signature']} onSubmit={noop} />
    </BothModes>
  ),
};
