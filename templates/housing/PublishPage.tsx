import React, { useMemo, useRef, useState } from 'react';
import { View } from 'react-native';

import { Admonition, AdmonitionText } from '../../src/admonition';
import { Button } from '../../src/button';
import {
  AddressPrecisionPicker,
  ListingPreviewPane,
  ListingQualityMeter,
  OfferingEditor,
  PropertyTypeSelector,
  type AddressPrecision,
  type ListingPreviewData,
  type ListingQualityItem,
  type OfferingErrors,
  type OfferingValue,
} from '../../src/listing-editor';
import type { Offering } from '../../src/listing-card';
import { SortablePhotoGrid, type SortablePhoto } from '../../src/sortable-media';
import type { PropertyType } from '../../src/stay-filters';
import { StepperRow } from '../../src/stepper';
import { TextField, TextFieldInput, TextFieldLabel } from '../../src/text-field';
import { Textarea } from '../../src/textarea';
import { useTheme } from '../../src/theme/use-theme';
import { Text } from '../../src/typography';
import { WizardFooter, WizardProgress } from '../../src/wizard';
import { PUBLISH_PHOTOS, PUBLISH_STEPS, TYPE_LABELS, bathFact, bedFact, areaFact, picsum } from './data';
import { Hairline, HousingFrame, IS_WEB, PageColumn, useHousingLayout, useHousingNav, webSticky } from './HousingHeader';

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

const INITIAL_DRAFT: Draft = {
  type: null,
  address: '',
  precision: 'street',
  bedrooms: 2,
  bathrooms: 1,
  beds: 2,
  area: 78,
  offering: { kinds: [] },
  photos: PUBLISH_PHOTOS,
  title: '',
  description: '',
};

const OFFERING_FOR_KIND: Record<OfferingValue['kinds'][number], Offering> = {
  rent: 'long_term_rent',
  sale: 'sale',
  stay: 'short_term_rent',
  swap: 'exchange',
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

const money = (digits: string) => `€${Number(digits).toLocaleString('en-US')}`;

function previewData(draft: Draft): ListingPreviewData {
  const { kinds, rent, sale, stay } = draft.offering;
  const priceLines = [
    kinds.includes('rent') && rent?.amount ? { price: money(rent.amount), unit: '/ month' } : null,
    kinds.includes('sale') && sale?.price ? { price: money(sale.price), secondary: `${money(String(Math.round(Number(sale.price) / draft.area)))}/m²` } : null,
    kinds.includes('stay') && stay?.nightlyRate ? { price: money(stay.nightlyRate), unit: 'night' } : null,
  ].filter((line): line is NonNullable<typeof line> => line != null);
  const typeLabel = draft.type ? TYPE_LABELS[draft.type] : 'Home';
  return {
    photos: draft.photos.filter((p) => p.status !== 'error').map((p) => p.uri),
    title: draft.title || `${typeLabel} in Varnholm`,
    offerings: kinds.map((kind) => OFFERING_FOR_KIND[kind]),
    priceLines: priceLines.length ? priceLines : undefined,
    address: draft.precision === 'approximate' ? undefined : 'Calle Lirio, Varnholm',
    approximateLocation: draft.precision === 'approximate',
    facts: [bedFact(draft.bedrooms), bathFact(draft.bathrooms), areaFact(draft.area)],
    rating: null,
    location: draft.precision === 'approximate' ? 'Near the old harbour, Varnholm' : 'Calle Lirio, Varnholm',
    description: draft.description || undefined,
  };
}

/**
 * The listing wizard: the progress bar, one step at a time, the live preview
 * beside it from `lg`, and the sticky footer with Back and Next. The document
 * scrolls; each step returns to the top.
 */
export function PublishPage({ initialStep = 0 }: { initialStep?: number }) {
  const theme = useTheme();
  const go = useHousingNav();
  const { lg } = useHousingLayout();
  const [step, setStep] = useState(initialStep);
  const [draft, setDraft] = useState<Draft>(INITIAL_DRAFT);
  const [showErrors, setShowErrors] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const uploads = useRef(0);
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  const last = PUBLISH_STEPS.length - 1;
  const errors = showErrors ? offeringErrors(draft.offering) : {};
  const goTo = (next: number) => {
    setShowErrors(false);
    setStep(next);
    if (IS_WEB) (globalThis as { scrollTo?: (x: number, y: number) => void }).scrollTo?.(0, 0);
  };
  const canContinue = [draft.type != null, draft.address.trim().length > 0, true, true, draft.photos.length > 0, draft.title.length > 0, true, true][step];

  const onNext = () => {
    if (step === 3 && Object.keys(offeringErrors(draft.offering)).length > 0) {
      setShowErrors(true);
      return;
    }
    if (step === last) {
      if (published) {
        go('my-home');
        return;
      }
      setPublishing(true);
      setTimeout(() => {
        setPublishing(false);
        setPublished(true);
      }, 1200);
      return;
    }
    goTo(step + 1);
  };

  const preview = useMemo(() => previewData(draft), [draft]);
  const quality: ListingQualityItem[] = [
    { key: 'photos', label: 'Add at least 5 photos', tip: `You have ${draft.photos.length}. Listings with more photos are saved twice as often.`, done: draft.photos.length >= 5, weight: 2, onPress: () => goTo(4) },
    { key: 'kitchen', label: 'Describe the kitchen', tip: 'Mention the appliances and how many it seats.', done: /kitchen/i.test(draft.description), onPress: () => goTo(5) },
    { key: 'length', label: 'Write at least 120 characters', done: draft.description.length >= 120, onPress: () => goTo(5) },
    { key: 'energy', label: 'Add energy certificate', tip: 'Required to publish a rental in most regions.', done: false },
    { key: 'precision', label: 'Choose the map precision', done: true },
  ];

  const body = (() => {
    switch (step) {
      case 0:
        return <PropertyTypeSelector value={draft.type} onValueChange={(type) => set({ type })} testID="housing-publish-type" />;
      case 1:
        return (
          <View style={{ gap: 24 }}>
            <View style={{ gap: 6 }}>
              <TextFieldLabel>Address</TextFieldLabel>
              <TextField>
                <TextFieldInput
                  label="Address"
                  placeholder="Street, number, town"
                  value={draft.address}
                  onChangeText={(address) => set({ address })}
                  testID="housing-publish-address"
                />
              </TextField>
            </View>
            <AddressPrecisionPicker value={draft.precision} onValueChange={(precision) => set({ precision })} />
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
        return <OfferingEditor value={draft.offering} onValueChange={(offering) => set({ offering })} area={draft.area} errors={errors} testID="housing-publish-offering" />;
      case 4:
        return (
          <SortablePhotoGrid
            photos={draft.photos}
            onReorder={(photos) => set({ photos })}
            onRemove={(id) => set({ photos: draft.photos.filter((p) => p.id !== id) })}
            onAdd={() => {
              uploads.current += 1;
              set({ photos: [...draft.photos, { id: `added-${uploads.current}`, uri: picsum(`publish-added-${uploads.current}`) }] });
            }}
            maxPhotos={20}
            addHint="JPG or PNG"
            testID="housing-publish-photos"
          />
        );
      case 5:
        return (
          <View style={{ gap: 20 }}>
            <View style={{ gap: 6 }}>
              <TextFieldLabel>Title</TextFieldLabel>
              <TextField>
                <TextFieldInput label="Title" value={draft.title} onChangeText={(title) => set({ title })} maxLength={60} testID="housing-publish-title" />
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
            />
          </View>
        );
      case 6:
        return <ListingQualityMeter items={quality} tips={['Photos taken in daylight make rooms look larger.', 'Mention the distance to transport.']} />;
      default:
        return published ? (
          <Admonition type="tip">
            <AdmonitionText>Your listing is live. People can now find it in search.</AdmonitionText>
          </Admonition>
        ) : (
          <View style={{ gap: 16 }}>
            <Text variant="body-regular" style={{ color: theme.colors.textSecondary }}>
              Check the preview. You can edit the listing at any time after publishing.
            </Text>
            {!lg ? <ListingPreviewPane listing={preview} /> : null}
          </View>
        );
    }
  })();

  return (
    <HousingFrame testID="housing-publish">
      <View style={{ backgroundColor: theme.colors.background }}>
        <PageColumn style={{ height: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="title-3-semibold" style={{ color: theme.colors.text }}>
            List your home
          </Text>
          <Button variant="secondary" size="small" onPress={() => go('explore')} testID="housing-publish-exit">
            Save and exit
          </Button>
        </PageColumn>
        <Hairline />
      </View>
      <PageColumn maxWidth={1120} style={{ flexGrow: 1, paddingTop: 32, paddingBottom: 32 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', gap: 48 }}>
          <View style={{ flex: 1, maxWidth: 680, gap: 32, minWidth: 0 }}>
            <WizardProgress steps={PUBLISH_STEPS} current={step} currentProgress={published ? 1 : canContinue ? 1 : 0.5} testID="housing-publish-progress" />
            {body}
          </View>
          {lg ? (
            <View style={[{ width: 360 }, webSticky(24)]}>
              <ListingPreviewPane listing={preview} testID="housing-publish-preview" />
            </View>
          ) : null}
        </View>
      </PageColumn>
      <WizardFooter
        onBack={step > 0 && !published ? () => goTo(step - 1) : undefined}
        onNext={onNext}
        nextLabel={step === last ? (published ? 'Go to my home' : 'Publish') : 'Next'}
        nextDisabled={!canContinue}
        loading={publishing}
        status={step > 0 ? 'Draft saved' : undefined}
        testID="housing-publish-footer"
      />
    </HousingFrame>
  );
}
