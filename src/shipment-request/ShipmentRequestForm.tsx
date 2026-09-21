import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { PriceSummary } from '../price-breakdown';
import { RouteStops } from '../route-stops';
import { SortablePhotoGrid } from '../sortable-media';
import { FilterSection } from '../stay-filters/FilterSection';
import { ShipmentLoadPicker } from './ShipmentLoadPicker';
import { ShipmentOptionsList } from './ShipmentOptionsList';
import { SHIPMENT_REQUEST_LABELS } from './constants';
import type { ShipmentRequestFormProps } from './types';

/**
 * Describing a job: where it goes, what is being moved, what it looks like,
 * what changes the price, and what that price currently is.
 *
 * It is the REGISTER a Bloom multi-part form is written in — one column of
 * sections, each a heading over its controls with a hairline under it, no card
 * per section and no step counter. The one decision it makes is the ORDER, and
 * the order is the order of the questions a carrier needs answered:
 *
 *   1  route    `RouteStops` — the origin, the destination, the stops between
 *   2  load     `ShipmentLoadPicker` — kind, size, weight, quantity, notes
 *   3  photos   `SortablePhotoGrid` — drawn only when `photos` is given
 *   4  options  `ShipmentOptionsList` — the answers that move the number
 *   5  price    `PriceSummary` — last, so the options and the number they move
 *               are on one screen
 *
 * **IT DRAWS NOTHING OF ITS OWN.** Every section is an existing Bloom family
 * handed its props unchanged: there is one component that knows what a route
 * looks like, one that knows what a photo grid looks like, one that knows what
 * an itemised price looks like, and a form that redrew any of them would be a
 * copy that drifts. A section whose props are absent is not drawn — a job that
 * needs no photograph should not be asked for one.
 *
 * **THE LAST SECTION HAS NO RULE UNDER IT**, and the footer sits below it with
 * none either: a divider is a separator between two things, and there is
 * nothing after the last one.
 */

function ShipmentRequestFormComponent({
  route,
  load,
  onLoadChange,
  loadProps,
  photos,
  options,
  price,
  footer,
  labels: labelOverrides,
  disabled = false,
  accessibilityLabel = 'Shipment request',
  style,
  testID,
}: ShipmentRequestFormProps) {
  const labels = useMemo(
    () => ({ ...SHIPMENT_REQUEST_LABELS, ...labelOverrides }),
    [labelOverrides],
  );
  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);

  // Which sections exist, so the LAST one can drop its rule without every
  // section having to know what follows it.
  const sections: { key: string; title: string; description?: string; content: React.ReactNode }[] = [
    {
      key: 'route',
      title: labels.route,
      description: labels.routeDescription,
      content: <RouteStops {...route} testID={route.testID ?? id('route')} />,
    },
    {
      key: 'load',
      title: labels.load,
      description: labels.loadDescription,
      content: (
        <ShipmentLoadPicker
          {...loadProps}
          value={load}
          onValueChange={onLoadChange}
          disabled={disabled || loadProps?.disabled}
          testID={id('load')}
        />
      ),
    },
  ];

  if (photos) {
    sections.push({
      key: 'photos',
      title: labels.photos,
      description: labels.photosDescription,
      content: <SortablePhotoGrid {...photos} disabled={disabled || photos.disabled} testID={id('photos')} />,
    });
  }

  if (options) {
    sections.push({
      key: 'options',
      title: labels.options,
      description: labels.optionsDescription,
      content: (
        <ShipmentOptionsList
          {...options}
          disabled={disabled || options.disabled}
          testID={id('options')}
        />
      ),
    });
  }

  if (price) {
    sections.push({
      key: 'price',
      title: labels.price,
      description: labels.priceDescription,
      content: <PriceSummary {...price} testID={id('price')} />,
    });
  }

  return (
    <View
      testID={testID}
      role="form"
      accessibilityLabel={accessibilityLabel}
      style={style}
    >
      {sections.map((section, index) => (
        <FilterSection
          key={section.key}
          title={section.title}
          description={section.description === '' ? undefined : section.description}
          divider={index < sections.length - 1}
          testID={id(`section-${section.key}`)}
        >
          {section.content}
        </FilterSection>
      ))}
      {footer ? (
        <View style={{ paddingTop: 24 }} testID={id('footer')}>
          {footer}
        </View>
      ) : null}
    </View>
  );
}

export const ShipmentRequestForm = memo(ShipmentRequestFormComponent);
ShipmentRequestForm.displayName = 'ShipmentRequestForm';
