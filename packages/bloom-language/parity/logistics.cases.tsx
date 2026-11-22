import { Button } from '@oxy.so/bloom/button';
import { CarrierQuoteCard, CarrierQuoteList } from '@oxy.so/bloom/carrier-quote';
import { EarningsBreakdown, EarningsPayoutRow, EarningsSummary } from '@oxy.so/bloom/earnings';
import { RiBikeLine, RiBusLine, RiSofaLine } from '@oxy.so/bloom/icons';
import { JobBoard, JobCard } from '@oxy.so/bloom/job-board';
import { ProofOfDelivery, SignaturePad } from '@oxy.so/bloom/proof-of-delivery';
import {
  ShipmentLoadPicker,
  ShipmentOptionsList,
  ShipmentRequestForm,
} from '@oxy.so/bloom/shipment-request';
import { VehiclePicker } from '@oxy.so/bloom/vehicle-picker';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import { type ParityCase, Themed } from './support/cases';

const press = () => {};
const set = () => {};
const QUOTES = [
  {
    id: 'ivo',
    carrier: {
      id: 'c-ivo',
      name: 'Ivo Brennan',
      rating: 4.92,
      jobs: 214,
      vehicle: 'Van',
      vehicleIcon: RiBusLine,
      verified: true,
      detail: 'Sable Haulage',
    },
    price: '€38.40',
    priceNote: 'All in, VAT included',
    pickupWindow: 'Today, 14:00–16:00',
    eta: '17:40',
    priceValue: 38.4,
    etaMinutes: 210,
    message: 'Happy to take the sofa.',
    priceLines: [
      { label: 'Collection and delivery', sublabel: '11.4 km', amount: '€26.00' },
      { label: 'Stairs', sublabel: 'Third floor, no lift', amount: '€12.40' },
    ],
    priceTotal: { label: 'Total', amount: '€38.40' },
  },
  {
    id: 'marisol',
    carrier: { id: 'c-marisol', name: 'Marisol Adeyemi', rating: 4.71, vehicleIcon: RiBikeLine },
    price: '€24.90',
    pickupWindow: 'Today, 15:30–16:30',
    eta: '18:20',
    priceValue: 24.9,
    etaMinutes: 260,
    expiresIn: 'Expires in 12 min',
  },
] as const;
const PERIODS = [
  {
    id: 'day',
    label: 'Day',
    total: '€96.40',
    deltaRatio: 0.082,
    caption: 'Before the platform fee',
    bars: [
      { label: '09', value: 18.4, amount: '€18.40' },
      { label: '11', value: 24.1, amount: '€24.10' },
      { label: '13', value: 11.7, amount: '€11.70' },
    ],
    stats: [
      { value: '11', label: 'Jobs done' },
      { value: '6 h 10', label: 'Online' },
    ],
    lines: [
      { label: 'Jobs', sublabel: '11 delivered', amount: '€78.90' },
      { label: 'Tips', amount: '€9.50', tone: 'discount' as const },
    ],
    payout: { amount: '€96.40', date: 'Tomorrow', state: 'scheduled' as const },
  },
  { id: 'week', label: 'Week', total: '€612.75' },
];
const LINES = PERIODS[0]?.lines ?? [];
const PAYOUT = {
  amount: '€96.40',
  date: 'Tomorrow',
  state: 'paid' as const,
  destination: 'Account 4417',
};
const JOBS = [
  {
    id: 'sofa',
    load: 'Two-seater sofa',
    loadNote: 'Third floor, no lift',
    pay: '€38.40',
    payNote: 'Fuel included',
    pickup: { title: 'Rua das Amoreiras 12', subtitle: 'Ring the bell' },
    dropoff: { title: 'Travessa do Olival 3' },
    distance: '11.4 km',
    duration: 'about 40 min',
    window: 'Today, 14:00–16:00',
    vehicle: 'Van',
    vehicleKind: 'van' as const,
    expiresIn: 'Open for 12 more minutes',
    tags: ['Two people'],
    payLines: [{ label: 'Collection and delivery', amount: '€38.40' }],
    payTotal: { label: 'You earn', amount: '€38.40' },
  },
  {
    id: 'trays',
    load: 'Six catering trays',
    pay: '€16.80',
    pickup: { title: 'Praça do Feijó 8' },
    dropoff: { title: 'Largo da Bica 41', meta: '2.1 km away' },
    state: 'taken' as const,
  },
];
const VEHICLES = [
  { value: 'bike' as const, label: 'Cargo bike', capacity: 'Up to 40 kg', icon: RiBikeLine },
  {
    value: 'van' as const,
    label: 'Van',
    capacity: 'Up to 800 kg',
    fits: ['A sofa'],
    priceFrom: '€30',
  },
  {
    value: 'car' as const,
    label: 'Car',
    capacity: 'Up to 200 kg',
    disabled: true,
    unavailableReason: 'None nearby',
  },
];
const LOAD = { kind: 'furniture' as const, size: 'large' as const, weight: '40', quantity: 2 };
const KINDS = [
  { value: 'furniture' as const, label: 'Furniture', icon: RiSofaLine },
  { value: 'parcel' as const, label: 'Parcel' },
];
const SIZES = [
  { value: 'medium' as const, label: 'Medium', detail: 'Fits a car' },
  { value: 'large' as const, label: 'Large', detail: 'Needs a van' },
];
const OPTIONS = {
  extras: [{ key: 'help', title: 'Help loading', price: '€9.00' }],
  selectedExtras: ['help'],
  onExtrasChange: set,
  accessOptions: [
    { value: 'stairs' as const, label: 'Stairs', price: '€3.40' },
    { value: 'lift' as const, label: 'Lift' },
  ],
  access: 'stairs' as const,
  onAccessChange: set,
  windows: [
    { id: 'am', label: 'Morning' },
    { id: 'pm', label: 'Afternoon', price: '€2.00' },
  ],
  window: 'am',
  onWindowChange: set,
};
const ROUTE = {
  stops: [
    { id: 'a', title: 'Rua das Amoreiras 12' },
    { id: 'b', title: 'Travessa do Olival 3' },
  ],
  onSwap: press,
};
const SIGNATURE = {
  strokes: [
    [
      { x: 10, y: 20 },
      { x: 40, y: 30 },
      { x: 80, y: 12 },
    ],
  ],
};

export const LOGISTICS_CASES: ParityCase[] = [
  ...ENUMS.density.map((density) => ({
    name: `CarrierQuoteCard ${density}`,
    language: () =>
      toElement(
        L.CarrierQuoteCard(QUOTES[0], {
          onAccept: set,
          onMessage: set,
          onDecline: set,
          breakdown: true,
          selected: true,
        }).density(density),
      ),
    bloom: () => (
      <CarrierQuoteCard
        quote={QUOTES[0]}
        onAccept={set}
        onMessage={set}
        onDecline={set}
        breakdown
        selected
        density={density === 'compact' ? 'compact' : 'comfortable'}
      />
    ),
  })),
  {
    name: 'CarrierQuoteCard disabled, with actions',
    language: () =>
      toElement(
        L.CarrierQuoteCard(QUOTES[1], {
          actions: L.Button(L.Text('Ask')).onPress(press),
        }).disabled(),
      ),
    bloom: () => (
      <CarrierQuoteCard quote={QUOTES[1]} actions={<Button onPress={press}>Ask</Button>} disabled />
    ),
  },
  {
    name: 'CarrierQuoteList',
    language: () =>
      toElement(L.CarrierQuoteList(QUOTES, { onAccept: set, sort: 'price', onSortChange: set })),
    bloom: () => (
      <CarrierQuoteList quotes={QUOTES} onAccept={set} sort="price" onSortChange={set} />
    ),
  },
  {
    name: 'CarrierQuoteList loading, compact',
    language: () =>
      toElement(L.CarrierQuoteList([], { loadingCount: 2 }).loading().density('compact')),
    bloom: () => <CarrierQuoteList quotes={[]} loadingCount={2} loading density="compact" />,
  },
  {
    name: 'CarrierQuoteList empty, with an action',
    language: () =>
      toElement(
        L.CarrierQuoteList([], {
          emptyTitle: 'No quotes yet',
          emptyAction: L.Button(L.Text('Share')).onPress(press),
        }),
      ),
    bloom: () => (
      <CarrierQuoteList
        quotes={[]}
        emptyTitle="No quotes yet"
        emptyAction={<Button onPress={press}>Share</Button>}
      />
    ),
  },
  {
    name: 'EarningsSummary',
    language: () =>
      toElement(
        L.EarningsSummary(PERIODS, {
          period: 'day',
          onPeriodChange: set,
          onPressPayout: press,
          chartHeight: '160',
        }),
      ),
    bloom: () => (
      <EarningsSummary
        periods={PERIODS}
        period="day"
        onPeriodChange={set}
        onPressPayout={press}
        chartHeight={160}
      />
    ),
  },
  {
    name: 'EarningsSummary a payout action',
    language: () =>
      toElement(
        L.EarningsSummary(PERIODS, {
          payoutAction: L.Button(L.Text('Cash out')).onPress(press),
          breakdown: false,
        }),
      ),
    bloom: () => (
      <EarningsSummary
        periods={PERIODS}
        payoutAction={<Button onPress={press}>Cash out</Button>}
        breakdown={false}
      />
    ),
  },
  {
    name: 'EarningsBreakdown',
    language: () =>
      toElement(
        L.EarningsBreakdown(LINES, {
          total: { label: 'Total', amount: '€88.40' },
          collapsible: true,
        }),
      ),
    bloom: () => (
      <EarningsBreakdown lines={LINES} total={{ label: 'Total', amount: '€88.40' }} collapsible />
    ),
  },
  {
    name: 'EarningsPayoutRow pressable',
    language: () => toElement(L.EarningsPayoutRow(PAYOUT, { title: 'Last payout' }).onPress(press)),
    bloom: () => <EarningsPayoutRow payout={PAYOUT} title="Last payout" onPress={press} />,
  },
  {
    name: 'EarningsPayoutRow an action',
    language: () =>
      toElement(
        L.EarningsPayoutRow(PAYOUT, { action: L.Button(L.Text('Details')).onPress(press) }),
      ),
    bloom: () => (
      <EarningsPayoutRow payout={PAYOUT} action={<Button onPress={press}>Details</Button>} />
    ),
  },
  ...ENUMS.density.map((density) => ({
    name: `JobCard ${density}`,
    language: () =>
      toElement(
        L.JobCard(JOBS[0] as (typeof JOBS)[number], {
          onTake: set,
          onPass: set,
          route: true,
          breakdown: true,
        }).density(density),
      ),
    bloom: () => (
      <JobCard
        job={JOBS[0] as (typeof JOBS)[number]}
        onTake={set}
        onPass={set}
        route
        breakdown
        density={density === 'compact' ? 'compact' : 'comfortable'}
      />
    ),
  })),
  {
    name: 'JobCard taken, disabled, with actions',
    language: () =>
      toElement(
        L.JobCard(JOBS[1] as (typeof JOBS)[number], {
          actions: L.Button(L.Text('Call')).onPress(press),
        }).disabled(),
      ),
    bloom: () => (
      <JobCard
        job={JOBS[1] as (typeof JOBS)[number]}
        actions={<Button onPress={press}>Call</Button>}
        disabled
      />
    ),
  },
  {
    name: 'JobBoard',
    language: () =>
      toElement(
        L.JobBoard(JOBS, { onTake: set, sort: 'pay', onSortChange: set, defaultFiltersOpen: true }),
      ),
    bloom: () => (
      <JobBoard jobs={JOBS} onTake={set} sort="pay" onSortChange={set} defaultFiltersOpen />
    ),
  },
  {
    name: 'JobBoard loading, compact',
    language: () => toElement(L.JobBoard([], { loadingCount: 2 }).loading().density('compact')),
    bloom: () => <JobBoard jobs={[]} loadingCount={2} loading density="compact" />,
  },
  {
    name: 'JobBoard empty, with an action',
    language: () =>
      toElement(
        L.JobBoard([], {
          emptyTitle: 'No jobs nearby',
          emptyAction: L.Button(L.Text('Refresh')).onPress(press),
        }),
      ),
    bloom: () => (
      <JobBoard
        jobs={[]}
        emptyTitle="No jobs nearby"
        emptyAction={<Button onPress={press}>Refresh</Button>}
      />
    ),
  },
  {
    name: 'SignaturePad',
    language: () =>
      toElement(L.SignaturePad({ defaultValue: SIGNATURE, onChange: set, height: '160' })),
    bloom: () => <SignaturePad defaultValue={SIGNATURE} onChange={set} height={160} />,
  },
  {
    name: 'SignaturePad inked',
    language: () => toElement(L.SignaturePad({ value: SIGNATURE }).tint('primary')),
    bloom: () => <Themed>{(c) => <SignaturePad value={SIGNATURE} ink={c.primary} />}</Themed>,
  },
  {
    name: 'SignaturePad typed, disabled',
    language: () => toElement(L.SignaturePad({ value: SIGNATURE, typed: true }).disabled()),
    bloom: () => <SignaturePad value={SIGNATURE} typed disabled />,
  },
  {
    name: 'ProofOfDelivery',
    language: () =>
      toElement(
        L.ProofOfDelivery({
          title: 'Proof of delivery',
          required: ['signature', 'code'],
          onSubmit: set,
          onAddPhoto: press,
          signatureHeight: '160',
        }),
      ),
    bloom: () => (
      <ProofOfDelivery
        title="Proof of delivery"
        required={['signature', 'code']}
        onSubmit={set}
        onAddPhoto={press}
        signatureHeight={160}
      />
    ),
  },
  {
    name: 'ProofOfDelivery submitting, with actions',
    language: () =>
      toElement(
        L.ProofOfDelivery({
          proofs: ['recipient', 'note'],
          defaultValue: { recipient: 'Ana' },
          actions: L.Button(L.Text('Skip')).onPress(press),
        }).loading(),
      ),
    bloom: () => (
      <ProofOfDelivery
        proofs={['recipient', 'note']}
        defaultValue={{ recipient: 'Ana' }}
        actions={<Button onPress={press}>Skip</Button>}
        submitting
      />
    ),
  },
  {
    name: 'ProofOfDelivery disabled',
    language: () => toElement(L.ProofOfDelivery({ proofs: ['code'] }).disabled()),
    bloom: () => <ProofOfDelivery proofs={['code']} disabled />,
  },
  {
    name: 'VehiclePicker',
    language: () =>
      toElement(L.VehiclePicker(['van', set], { options: VEHICLES, title: 'Vehicle' })),
    bloom: () => (
      <VehiclePicker value="van" onValueChange={set} options={VEHICLES} title="Vehicle" />
    ),
  },
  {
    name: 'VehiclePicker none chosen, disabled',
    language: () => toElement(L.VehiclePicker([null, set]).disabled()),
    bloom: () => <VehiclePicker value={null} onValueChange={set} disabled />,
  },
  {
    name: 'ShipmentLoadPicker',
    language: () =>
      toElement(
        L.ShipmentLoadPicker([LOAD, set], {
          kinds: KINDS,
          sizes: SIZES,
          notes: true,
          errors: { weight: 'Enter a weight' },
        }),
      ),
    bloom: () => (
      <ShipmentLoadPicker
        value={LOAD}
        onValueChange={set}
        kinds={KINDS}
        sizes={SIZES}
        notes
        errors={{ weight: 'Enter a weight' }}
      />
    ),
  },
  {
    name: 'ShipmentLoadPicker disabled',
    language: () => toElement(L.ShipmentLoadPicker([LOAD, set]).disabled()),
    bloom: () => <ShipmentLoadPicker value={LOAD} onValueChange={set} disabled />,
  },
  {
    name: 'ShipmentOptionsList',
    language: () => toElement(L.ShipmentOptionsList(OPTIONS)),
    bloom: () => <ShipmentOptionsList {...OPTIONS} />,
  },
  {
    name: 'ShipmentOptionsList disabled',
    language: () => toElement(L.ShipmentOptionsList(OPTIONS).disabled()),
    bloom: () => <ShipmentOptionsList {...OPTIONS} disabled />,
  },
  {
    name: 'ShipmentRequestForm',
    language: () =>
      toElement(
        L.ShipmentRequestForm(ROUTE, [LOAD, set], {
          loadProps: { kinds: KINDS, sizes: SIZES },
          options: OPTIONS,
          price: { lines: LINES, total: { label: 'Total', amount: '€38.40' } },
          footer: L.Button(L.Text('Request quotes')).onPress(press),
        }),
      ),
    bloom: () => (
      <ShipmentRequestForm
        route={ROUTE}
        load={LOAD}
        onLoadChange={set}
        loadProps={{ kinds: KINDS, sizes: SIZES }}
        options={OPTIONS}
        price={{ lines: LINES, total: { label: 'Total', amount: '€38.40' } }}
        footer={<Button onPress={press}>Request quotes</Button>}
      />
    ),
  },
  {
    name: 'ShipmentRequestForm disabled',
    language: () => toElement(L.ShipmentRequestForm(ROUTE, [LOAD, set]).disabled()),
    bloom: () => <ShipmentRequestForm route={ROUTE} load={LOAD} onLoadChange={set} disabled />,
  },
];
