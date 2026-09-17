import React, { useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Admonition } from '../admonition';
import type { SortablePhoto } from '../sortable-media';
import { SortablePhotoGrid } from '../sortable-media';
import { StepperRow } from '../stepper';
import { WEB_VIEWPORT_HEIGHT } from '../styles/web-view-style';
import { TextField, TextFieldInput, TextFieldLabel } from '../text-field';
import { Textarea } from '../textarea';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { WizardFooter, WizardProgress } from '../wizard';
import type { WizardStep } from '../wizard';
import { AddressPrecisionPicker } from './AddressPrecisionPicker';
import { ListingPreviewPane } from './ListingPreviewPane';
import { ListingQualityMeter } from './ListingQualityMeter';
import { OfferingEditor } from './OfferingEditor';
import { PropertyTypeSelector } from './PropertyTypeSelector';
import type {
  AddressPrecision,
  ListingPreviewData,
  ListingQualityItem,
  OfferingErrors,
  OfferingValue,
  PropertyType,
} from './types';

const meta: Meta = {
  title: 'Blocks/Housing/Listing Editor',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

// ---------------------------------------------------------------------------
//  Demo data (invented)
// ---------------------------------------------------------------------------

const photo = (seed: string) => `https://picsum.photos/seed/${seed}/800/760`;

const PHOTOS: SortablePhoto[] = [
  { id: 'living', uri: photo('orvel-living'), alt: 'Living room' },
  { id: 'kitchen', uri: photo('orvel-kitchen'), alt: 'Kitchen' },
  { id: 'bedroom', uri: photo('orvel-bedroom'), alt: 'Bedroom' },
  { id: 'balcony', uri: photo('orvel-balcony'), alt: 'Balcony' },
];

const TYPE_LABELS: Record<PropertyType, string> = {
  apartment: 'Apartment',
  house: 'House',
  room: 'Room',
  studio: 'Studio',
  duplex: 'Duplex',
  penthouse: 'Penthouse',
  coliving: 'Coliving',
  hostel: 'Hostel',
  other: 'Home',
};

const STEPS: WizardStep[] = [
  { key: 'type', title: 'What kind of home is it?', description: 'Pick the closest match. You can change it later.' },
  { key: 'address', title: 'Where is it?', description: 'Choose how precisely the listing shows the location.' },
  { key: 'details', title: 'The basics', description: 'Rooms, beds and floor area.' },
  { key: 'offerings', title: 'How is it offered?', description: 'Pick every way you would like to offer the home.' },
  { key: 'photos', title: 'Add photos', description: 'Add at least five. The first one is the cover — drag to reorder.' },
  { key: 'description', title: 'Describe the home' },
  { key: 'quality', title: 'Quality check', description: 'Complete listings get more replies.' },
  { key: 'publish', title: 'Ready to publish' },
];

interface Draft {
  type: PropertyType | null;
  address: string;
  precision: AddressPrecision;
  bedrooms: number;
  bathrooms: number;
  beds: number;
  area: number;
  offering: OfferingValue;
  photos: SortablePhoto[];
  title: string;
  description: string;
}

const EMPTY_DRAFT: Draft = {
  type: null,
  address: '',
  precision: 'street',
  bedrooms: 2,
  bathrooms: 1,
  beds: 2,
  area: 78,
  offering: { kinds: [] },
  photos: PHOTOS,
  title: '',
  description: '',
};

const FILLED_DRAFT: Draft = {
  type: 'apartment',
  address: '14 Calle Lirio, Varnholm',
  precision: 'street',
  bedrooms: 3,
  bathrooms: 2,
  beds: 3,
  area: 96,
  offering: {
    kinds: ['rent', 'stay'],
    rent: { amount: '1450', depositMonths: 2, minimumMonths: 12 },
    stay: { nightlyRate: '96', cleaningFee: '35', minimumNights: 2 },
  },
  photos: PHOTOS,
  title: 'Bright corner flat by the old harbour',
  description:
    'A quiet third-floor flat with light from two sides, a long balcony over the square and a kitchen that seats six. The harbour is a four-minute walk.',
};

function offeringErrors(value: OfferingValue): OfferingErrors {
  const errors: OfferingErrors = {};
  if (value.kinds.length === 0) errors.kinds = 'Pick at least one way to offer the home.';
  if (value.kinds.includes('rent') && !value.rent?.amount) errors['rent.amount'] = 'Enter the monthly rent.';
  if (value.kinds.includes('sale') && !value.sale?.price) errors['sale.price'] = 'Enter the asking price.';
  if (value.kinds.includes('stay') && !value.stay?.nightlyRate) errors['stay.nightlyRate'] = 'Enter the nightly rate.';
  if (value.kinds.includes('swap') && !value.swap?.mode) errors['swap.mode'] = 'Choose how you would like to exchange.';
  return errors;
}

function qualityItems(draft: Draft, goTo: (step: number) => void): ListingQualityItem[] {
  return [
    {
      key: 'photos',
      label: 'Add at least 5 photos',
      tip: `You have ${draft.photos.length}. Listings with more photos are saved twice as often.`,
      done: draft.photos.length >= 5,
      weight: 2,
      onPress: () => goTo(4),
    },
    {
      key: 'kitchen',
      label: 'Describe the kitchen',
      tip: 'Mention the appliances and how many it seats.',
      done: /kitchen/i.test(draft.description),
      onPress: () => goTo(5),
    },
    {
      key: 'length',
      label: 'Write at least 120 characters',
      done: draft.description.length >= 120,
      onPress: () => goTo(5),
    },
    { key: 'energy', label: 'Add energy certificate', tip: 'Required to publish a rental in most regions.', done: false },
    { key: 'precision', label: 'Choose the map precision', done: true },
  ];
}

function previewData(draft: Draft): ListingPreviewData {
  const rent = draft.offering.kinds.includes('rent') ? draft.offering.rent?.amount : undefined;
  const nightly = draft.offering.kinds.includes('stay') ? draft.offering.stay?.nightlyRate : undefined;
  const sale = draft.offering.kinds.includes('sale') ? draft.offering.sale?.price : undefined;
  const typeLabel = draft.type ? TYPE_LABELS[draft.type] : 'Home';
  return {
    photos: draft.photos.filter((p) => p.status !== 'error').map((p) => p.uri),
    title: draft.title || `${typeLabel} in Varnholm`,
    subtitle: `${draft.bedrooms} bedrooms · ${draft.area} m²`,
    rating: null,
    price: rent ? `€${rent}` : nightly ? `€${nightly}` : sale ? `€${sale}` : undefined,
    priceUnit: rent ? 'month' : nightly ? 'night' : undefined,
    badge: draft.offering.kinds.includes('swap') ? 'Open to swaps' : undefined,
    location: draft.precision === 'approximate' ? 'Near the old harbour, Varnholm' : 'Calle Lirio, Varnholm',
    facts: [
      { label: `${draft.bedrooms}`, accessibilityLabel: `${draft.bedrooms} bedrooms` },
      { label: `${draft.bathrooms}`, accessibilityLabel: `${draft.bathrooms} baths` },
      { label: `${draft.beds}`, accessibilityLabel: `${draft.beds} beds` },
      { label: `${draft.area} m²` },
    ],
    description: draft.description || undefined,
  };
}

// ---------------------------------------------------------------------------
//  The composed flow
// ---------------------------------------------------------------------------

function useWidth() {
  const [width, setWidth] = useState(0);
  return { width, onLayout: (e: { nativeEvent: { layout: { width: number } } }) => setWidth(e.nativeEvent.layout.width) };
}

function PublishFlow({ initial = EMPTY_DRAFT, initialStep = 0 }: { initial?: Draft; initialStep?: number }) {
  const theme = useTheme();
  const { width, onLayout } = useWidth();
  const wide = width >= 1024;
  const gutter = width > 0 && width < 480 ? 16 : 24;
  const [step, setStep] = useState(initialStep);
  const [draft, setDraft] = useState<Draft>(initial);
  const [showErrors, setShowErrors] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const uploadCounter = useRef(0);
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  const errors = showErrors ? offeringErrors(draft.offering) : {};
  const goTo = (next: number) => {
    setShowErrors(false);
    setStep(next);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };
  const canContinue = [draft.type != null, draft.address.trim().length > 0, true, true, draft.photos.length > 0, draft.title.length > 0, true, true][step];

  const onNext = () => {
    if (step === 3 && Object.keys(offeringErrors(draft.offering)).length > 0) {
      setShowErrors(true);
      return;
    }
    if (step === STEPS.length - 1) {
      setPublishing(true);
      setTimeout(() => {
        setPublishing(false);
        setPublished(true);
      }, 1600);
      return;
    }
    goTo(step + 1);
  };

  const items = qualityItems(draft, goTo);
  const preview = useMemo(() => previewData(draft), [draft]);

  const body = (() => {
    switch (step) {
      case 0:
        return <PropertyTypeSelector value={draft.type} onValueChange={(type) => set({ type })} testID="flow-type" />;
      case 1:
        return (
          <View style={{ gap: 24 }}>
            <View style={{ gap: 6 }}>
              <TextFieldLabel>Address</TextFieldLabel>
              <TextField>
                <TextFieldInput
                  label="Address"
                  placeholder="Street, number, city"
                  value={draft.address}
                  onChangeText={(address) => set({ address })}
                  testID="flow-address"
                />
              </TextField>
            </View>
            <AddressPrecisionPicker value={draft.precision} onValueChange={(precision) => set({ precision })} testID="flow-precision" />
          </View>
        );
      case 2:
        return (
          <View>
            <StepperRow title="Bedrooms" value={draft.bedrooms} onValueChange={(bedrooms) => set({ bedrooms })} max={12} divider />
            <StepperRow title="Bathrooms" value={draft.bathrooms} onValueChange={(bathrooms) => set({ bathrooms })} min={1} max={8} divider />
            <StepperRow title="Beds" value={draft.beds} onValueChange={(beds) => set({ beds })} max={20} divider />
            <StepperRow
              title="Floor area"
              description="Used to show the price per m²"
              value={draft.area}
              onValueChange={(area) => set({ area })}
              min={10}
              max={1000}
              step={2}
              formatValue={(n) => `${n} m²`}
            />
          </View>
        );
      case 3:
        return (
          <OfferingEditor
            value={draft.offering}
            onValueChange={(offering) => set({ offering })}
            area={draft.area}
            errors={errors}
            testID="flow-offering"
          />
        );
      case 4:
        return (
          <SortablePhotoGrid
            photos={draft.photos}
            onReorder={(photos) => set({ photos })}
            onRemove={(id) => set({ photos: draft.photos.filter((p) => p.id !== id) })}
            onAdd={() => {
              uploadCounter.current += 1;
              set({ photos: [...draft.photos, { id: `added-${uploadCounter.current}`, uri: photo(`orvel-added-${uploadCounter.current}`) }] });
            }}
            maxPhotos={20}
            addHint="JPG or PNG"
            testID="flow-photos"
          />
        );
      case 5:
        return (
          <View style={{ gap: 20 }}>
            <View style={{ gap: 6 }}>
              <TextFieldLabel>Title</TextFieldLabel>
              <TextField>
                <TextFieldInput label="Title" value={draft.title} onChangeText={(title) => set({ title })} maxLength={60} testID="flow-title" />
              </TextField>
            </View>
            <Textarea
              label="Description"
              hint="What makes the home and the neighbourhood worth it?"
              value={draft.description}
              onChangeText={(description) => set({ description })}
              maxLength={500}
              showCount
              rows={6}
              testID="flow-description"
            />
          </View>
        );
      case 6:
        return (
          <ListingQualityMeter
            items={items}
            tips={['Photos taken in daylight make rooms look larger.', 'Mention the distance to transport.']}
            testID="flow-quality"
          />
        );
      default:
        return published ? (
          <Admonition type="tip">Your listing is live. People can now find it in search.</Admonition>
        ) : (
          <View style={{ gap: 16 }}>
            <Text variant="body-regular" style={{ color: theme.colors.textSecondary }}>
              Check the preview. You can edit the listing at any time after publishing.
            </Text>
            {!wide ? <ListingPreviewPane listing={preview} testID="flow-preview-inline" /> : null}
          </View>
        );
    }
  })();

  return (
    <View onLayout={onLayout} style={{ alignSelf: 'stretch', height: WEB_VIEWPORT_HEIGHT, backgroundColor: theme.colors.background }}>
      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 48,
            paddingTop: 32,
            paddingBottom: 32,
            paddingLeft: gutter,
            paddingRight: gutter,
            flexGrow: 1,
          }}
        >
          <View style={{ flex: 1, maxWidth: 680, gap: 32 }}>
            <WizardProgress steps={STEPS} current={step} currentProgress={published ? 1 : 0.5} testID="flow-progress" />
            {width > 0 ? body : null}
          </View>
          {wide ? (
            <View style={{ width: 360 }}>
              <ListingPreviewPane listing={preview} testID="flow-preview" />
            </View>
          ) : null}
        </View>
        <WizardFooter
          onBack={step > 0 && !published ? () => goTo(step - 1) : undefined}
          onNext={onNext}
          nextLabel={step === STEPS.length - 1 ? (published ? 'Done' : 'Publish') : 'Next'}
          nextDisabled={!canContinue || published}
          loading={publishing}
          status={step > 0 ? 'Draft saved' : undefined}
          testID="flow-footer"
        />
      </ScrollView>
    </View>
  );
}

/** The whole publish flow: type → address → basics → offerings → photos → description → quality → publish. */
export const PublishFlowStory: Story = {
  name: 'Publish Flow',
  render: () => <PublishFlow />,
};

/** The same flow, filled in and opened at the offerings step. */
export const PublishFlowFilled: Story = {
  name: 'Publish Flow (filled)',
  render: () => <PublishFlow initial={FILLED_DRAFT} initialStep={3} />,
};

// ---------------------------------------------------------------------------
//  Parts alone
// ---------------------------------------------------------------------------

function Page({ children, width }: { children: React.ReactNode; width?: number }) {
  const theme = useTheme();
  return (
    <View style={{ alignSelf: 'stretch', alignItems: 'center', paddingTop: 32, paddingBottom: 32, paddingLeft: 16, paddingRight: 16, backgroundColor: theme.colors.background }}>
      <View style={{ width: '100%', maxWidth: width ?? 720, gap: 16 }}>{children}</View>
    </View>
  );
}

export const PropertyTypes: Story = {
  render: function PropertyTypesStory() {
    const [value, setValue] = useState<PropertyType | null>('apartment');
    return (
      <Page>
        <PropertyTypeSelector value={value} onValueChange={setValue} testID="types" />
      </Page>
    );
  },
};

export const PropertyTypesError: Story = {
  name: 'Property Types (error)',
  render: () => (
    <Page>
      <PropertyTypeSelector value={null} onValueChange={() => undefined} error="Choose a property type to continue." testID="types-error" />
    </Page>
  ),
};

export const AddressPrecisionCards: Story = {
  render: function AddressPrecisionStory() {
    const [value, setValue] = useState<AddressPrecision>('street');
    return (
      <Page width={960}>
        <AddressPrecisionPicker value={value} onValueChange={setValue} testID="precision" />
      </Page>
    );
  },
};

export const Offerings: Story = {
  render: function OfferingsStory() {
    const [value, setValue] = useState<OfferingValue>({
      kinds: ['rent', 'sale'],
      rent: { amount: '1450', depositMonths: 2, minimumMonths: 12 },
      sale: { price: '385000' },
    });
    return (
      <Page>
        <OfferingEditor value={value} onValueChange={setValue} area={96} testID="offering" />
      </Page>
    );
  },
};

export const OfferingsErrors: Story = {
  name: 'Offerings (errors)',
  render: function OfferingsErrorsStory() {
    const [value, setValue] = useState<OfferingValue>({ kinds: ['rent', 'stay', 'swap'] });
    return (
      <Page>
        <OfferingEditor value={value} onValueChange={setValue} area={96} errors={offeringErrors(value)} testID="offering-errors" />
      </Page>
    );
  },
};

export const OfferingsNone: Story = {
  name: 'Offerings (nothing picked)',
  render: () => (
    <Page>
      <OfferingEditor value={{ kinds: [] }} onValueChange={() => undefined} errors={{ kinds: 'Pick at least one way to offer the home.' }} testID="offering-none" />
    </Page>
  ),
};

export const Photos: Story = {
  render: function PhotosStory() {
    const [photos, setPhotos] = useState<SortablePhoto[]>([
      ...PHOTOS,
      { id: 'bath', uri: photo('orvel-bath'), status: 'uploading', progress: 64 },
      { id: 'hall', uri: photo('orvel-hall'), status: 'error', error: 'File too large' },
    ]);
    return (
      <Page>
        <SortablePhotoGrid
          photos={photos}
          onReorder={setPhotos}
          onRemove={(id) => setPhotos((list) => list.filter((p) => p.id !== id))}
          onRetry={(id) => setPhotos((list) => list.map((p) => (p.id === id ? { ...p, status: 'uploading', progress: 10 } : p)))}
          onAdd={() => undefined}
          testID="photos"
        />
      </Page>
    );
  },
};

export const Description: Story = {
  render: function DescriptionStory() {
    const [text, setText] = useState(FILLED_DRAFT.description);
    return (
      <Page>
        <Textarea label="Description" value={text} onChangeText={setText} maxLength={500} showCount rows={6} testID="description" />
      </Page>
    );
  },
};

export const Quality: Story = {
  render: () => (
    <Page width={480}>
      <ListingQualityMeter
        items={qualityItems(FILLED_DRAFT, () => undefined)}
        tips={['Photos taken in daylight make rooms look larger.', 'Mention the distance to transport.']}
        testID="quality"
      />
    </Page>
  ),
};

export const QualityComplete: Story = {
  name: 'Quality (complete)',
  render: () => (
    <Page width={480}>
      <ListingQualityMeter
        items={qualityItems(FILLED_DRAFT, () => undefined).map((item) => ({ ...item, done: true }))}
        testID="quality-complete"
      />
    </Page>
  ),
};

export const Preview: Story = {
  render: () => (
    <Page width={360}>
      <ListingPreviewPane listing={previewData(FILLED_DRAFT)} testID="preview" />
    </Page>
  ),
};

export const PreviewPage: Story = {
  name: 'Preview (page)',
  render: () => (
    <Page width={400}>
      <ListingPreviewPane listing={previewData(FILLED_DRAFT)} defaultMode="page" testID="preview-page" />
    </Page>
  ),
};

/** Loading: the preview card's skeleton, a photo uploading without a known progress, and a publishing footer. */
export const Loading: Story = {
  render: () => (
    <Page width={560}>
      <ListingPreviewPane listing={{ ...previewData(FILLED_DRAFT), loading: true }} testID="preview-loading" />
      <SortablePhotoGrid
        photos={[
          { id: 'a', uri: photo('orvel-living'), status: 'uploading' },
          { id: 'b', uri: photo('orvel-kitchen'), status: 'uploading', progress: 12 },
        ]}
        onReorder={() => undefined}
        testID="photos-loading"
      />
      <WizardFooter onBack={() => undefined} onNext={() => undefined} nextLabel="Publish" loading sticky={false} testID="footer-loading" />
    </Page>
  ),
};
