import React, { useContext, useMemo, useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { RiShakeHandsLine, RiShieldCheckLine, RiFlashlightLine, RiPaintBrushLine } from '../icons/remix';
import { OfferingEditor } from '../listing-editor';
import type { OfferingValue } from '../listing-editor';
import type { RouteStop } from '../route-stops';
import type { SortablePhoto } from '../sortable-media';
import { BloomThemeContext, BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { SHIPMENT_ACCESS_OPTIONS } from './constants';
import { isShipmentLoadComplete } from './shared';
import { ShipmentLoadPicker } from './ShipmentLoadPicker';
import { ShipmentOptionsList } from './ShipmentOptionsList';
import { ShipmentRequestForm } from './ShipmentRequestForm';
import type { ShipmentAccess, ShipmentExtra, ShipmentLoad, ShipmentTimeWindow } from './types';

const meta: Meta = {
  title: 'Blocks/Freight/ShipmentRequest',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

const noop = () => undefined;

// ---------------------------------------------------------------------------
//  Demo data — invented places, invented amounts.
// ---------------------------------------------------------------------------

const STOPS: RouteStop[] = [
  { id: 'a', title: 'Vellmar Passage 9', subtitle: 'Pick-up, third floor, no lift' },
  { id: 'b', title: 'Ashgrove Depot, Unit 4', subtitle: 'Drop-off at the loading bay' },
];

const EXTRAS: readonly ShipmentExtra[] = [
  {
    key: 'loading',
    title: 'Help loading',
    description: 'Two people at both ends.',
    icon: RiShakeHandsLine,
    price: '+€9.00',
  },
  {
    key: 'insurance',
    title: 'Insurance',
    description: 'Cover up to €2,000 for the whole journey.',
    icon: RiShieldCheckLine,
    price: '+€4.50',
  },
  {
    key: 'express',
    title: 'Express',
    description: 'Straight there, no other jobs on the way.',
    icon: RiFlashlightLine,
    price: '+€15.00',
  },
  {
    key: 'assembly',
    title: 'Disassembly and reassembly',
    description: 'Not available for this load.',
    icon: RiPaintBrushLine,
    disabled: true,
  },
];

const WINDOWS: readonly ShipmentTimeWindow[] = [
  { id: 'asap', label: 'As soon as possible' },
  { id: 'today-pm', label: 'Today, 14:00–16:00' },
  { id: 'tomorrow-am', label: 'Tomorrow morning', price: '−€3.00' },
  { id: 'weekend', label: 'This weekend', price: '+€6.00' },
];

const PHOTOS: SortablePhoto[] = [
  { id: 'p1', uri: 'https://picsum.photos/seed/bloom-load-1/480/360', alt: 'The sofa' },
  { id: 'p2', uri: 'https://picsum.photos/seed/bloom-load-2/480/360', alt: 'The stairwell' },
];

const EMPTY_LOAD: ShipmentLoad = { kind: null, size: null, weight: '', quantity: 1 };

const A_SOFA: ShipmentLoad = {
  kind: 'furniture',
  size: 'large',
  weight: '60',
  quantity: 1,
  notes: 'Three-seat sofa, the legs come off.',
};

function Page({ children, maxWidth = 640 }: { children: React.ReactNode; maxWidth?: number }) {
  const theme = useTheme();
  return (
    <View style={{ backgroundColor: theme.colors.background, padding: 20 }}>
      <View style={{ width: '100%', maxWidth }}>{children}</View>
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
        <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 420, minWidth: 0, maxWidth: 600 }}>
          <Page>{children}</Page>
        </View>
      </BloomThemeProvider>
      <BloomThemeProvider mode="dark" colorPreset={preset}>
        <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 420, minWidth: 0, maxWidth: 600 }}>
          <Page>{children}</Page>
        </View>
      </BloomThemeProvider>
    </View>
  );
}

/** Everything the load picker draws, with the notes field on. */
export const LoadPicker: Story = {
  render: function LoadPickerStory() {
    const [load, setLoad] = useState<ShipmentLoad>(A_SOFA);
    return (
      <Page>
        <ShipmentLoadPicker value={load} onValueChange={setLoad} notes testID="load" />
      </Page>
    );
  },
};

/** Nothing answered yet, with the app's own messages under each control. */
export const LoadPickerWithErrors: Story = {
  render: function LoadPickerErrorsStory() {
    const [load, setLoad] = useState<ShipmentLoad>(EMPTY_LOAD);
    return (
      <Page>
        <ShipmentLoadPicker
          value={load}
          onValueChange={setLoad}
          errors={{
            kind: 'Tell us what we are moving.',
            size: 'Pick a size so carriers know which vehicle to send.',
            weight: 'A rough weight is enough.',
          }}
          testID="load"
        />
      </Page>
    );
  },
};

/** The three option groups: switches, then two single choices. */
export const Options: Story = {
  render: function OptionsStory() {
    const [extras, setExtras] = useState<string[]>(['loading']);
    const [access, setAccess] = useState<ShipmentAccess | null>('stairs');
    const [pickupWindow, setPickupWindow] = useState<string | null>('today-pm');
    return (
      <Page>
        <ShipmentOptionsList
          extras={EXTRAS}
          selectedExtras={extras}
          onExtrasChange={setExtras}
          accessOptions={SHIPMENT_ACCESS_OPTIONS}
          access={access}
          onAccessChange={setAccess}
          windows={WINDOWS}
          window={pickupWindow}
          onWindowChange={setPickupWindow}
          testID="options"
        />
      </Page>
    );
  },
};

function FullForm({ maxWidth = 640, photos = true }: { maxWidth?: number; photos?: boolean }) {
  const [stops, setStops] = useState<RouteStop[]>(STOPS);
  const [load, setLoad] = useState<ShipmentLoad>(A_SOFA);
  const [extras, setExtras] = useState<string[]>(['loading']);
  const [access, setAccess] = useState<ShipmentAccess | null>('stairs');
  const [pickupWindow, setPickupWindow] = useState<string | null>('today-pm');
  const [grid, setGrid] = useState<SortablePhoto[]>(PHOTOS);

  const lines = useMemo(
    () => [
      { id: 'base', label: 'Collection and delivery', sublabel: '11.4 km', amount: '€26.00' },
      ...(extras.includes('loading')
        ? [{ id: 'loading', label: 'Help loading', amount: '€9.00' }]
        : []),
      ...(extras.includes('insurance')
        ? [{ id: 'insurance', label: 'Insurance', amount: '€4.50' }]
        : []),
      ...(extras.includes('express')
        ? [{ id: 'express', label: 'Express', amount: '€15.00' }]
        : []),
      ...(access === 'stairs'
        ? [{ id: 'stairs', label: 'Stairs', sublabel: 'Third floor, no lift', amount: '€3.40' }]
        : []),
    ],
    [extras, access],
  );

  return (
    <Page maxWidth={maxWidth}>
      <ShipmentRequestForm
        route={{
          stops,
          onSwap: () => setStops([...stops].reverse()),
          onAddStop: () => setStops([...stops, { id: `s${stops.length}`, title: 'A new stop' }]),
          onRemoveStop: (id) => setStops(stops.filter((stop) => stop.id !== id)),
        }}
        load={load}
        onLoadChange={setLoad}
        loadProps={{ notes: true }}
        photos={
          photos
            ? {
                photos: grid,
                onReorder: setGrid,
                onRemove: (id) => setGrid(grid.filter((photo) => photo.id !== id)),
                onAdd: noop,
                addHint: 'JPG or PNG, up to 20 MB',
              }
            : undefined
        }
        options={{
          extras: EXTRAS,
          selectedExtras: extras,
          onExtrasChange: setExtras,
          accessOptions: SHIPMENT_ACCESS_OPTIONS,
          access,
          onAccessChange: setAccess,
          windows: WINDOWS,
          window: pickupWindow,
          onWindowChange: setPickupWindow,
        }}
        price={{
          lines,
          total: { label: 'Estimated total', amount: '€38.40', state: 'estimated' },
        }}
        footer={
          <Button
            variant="primary"
            size="large"
            fullWidth
            disabled={!isShipmentLoadComplete(load)}
            onPress={noop}
          >
            Ask for quotes
          </Button>
        }
        testID="request"
      />
    </Page>
  );
}

/** The whole form: five sections, in the order a carrier needs them answered. */
export const Form: Story = {
  render: () => <FullForm />,
};

/** Phone width. Every paired control stacks; nothing overflows. */
export const Narrow: Story = {
  render: () => <FullForm maxWidth={358} />,
};

/** No photos section at all — a job that needs no picture is not asked for one. */
export const WithoutPhotos: Story = {
  render: () => <FullForm photos={false} />,
};

/** Both modes in one shot. */
export const Modes: Story = {
  parameters: { controls: { disable: true } },
  render: function ModesStory() {
    const [load, setLoad] = useState<ShipmentLoad>(A_SOFA);
    const [extras, setExtras] = useState<string[]>(['loading', 'insurance']);
    return (
      <BothModes>
        <View style={{ gap: 20 }}>
          <ShipmentLoadPicker value={load} onValueChange={setLoad} />
          <ShipmentOptionsList
            extras={EXTRAS}
            selectedExtras={extras}
            onExtrasChange={setExtras}
            accessOptions={SHIPMENT_ACCESS_OPTIONS}
            access="stairs"
            onAccessChange={noop}
          />
        </View>
      </BothModes>
    );
  },
};

/**
 * Beside the reference this family was drawn to match: `listing-editor`'s
 * `OfferingEditor`. The same selectable cards, the same label-over-control
 * rhythm, the same error line under the control it belongs to.
 */
export const BesideTheReference: Story = {
  render: function BesideTheReferenceStory() {
    const [offering, setOffering] = useState<OfferingValue>({ kinds: ['rent'], rent: { amount: '1200' } });
    const [load, setLoad] = useState<ShipmentLoad>(A_SOFA);
    return (
      <Page maxWidth={640}>
        <View style={{ gap: 16 }}>
          <Caption>Bloom reference — listing-editor / OfferingEditor</Caption>
          <OfferingEditor value={offering} onValueChange={setOffering} kinds={['rent', 'sale']} />
          <Caption>This family — shipment-request / ShipmentLoadPicker</Caption>
          <ShipmentLoadPicker
            value={load}
            onValueChange={setLoad}
            kinds={[
              {
                value: 'furniture',
                label: 'Furniture',
                description: 'A sofa, a table, a mattress — two people at both ends.',
              },
              {
                value: 'pallet',
                label: 'Pallet',
                description: 'Wrapped and stacked, moved with a tail lift.',
              },
            ]}
            testID="load-beside"
          />
        </View>
      </Page>
    );
  },
};
