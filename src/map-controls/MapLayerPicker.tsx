import React, { memo } from 'react';

import { ButtonGroupItem } from '../button-group';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../dropdown-menu';
import { GlassIsland } from '../glass';
import { RiStackLine } from '../icons/remix/RiStackLine';
import { MAP_CONTROL_BOX } from './constants';
import type { MapLayerPickerProps } from './types';

/**
 * What the map is DRAWN as, and what is drawn ON it.
 *
 * Two vocabularies in one menu, because they are two questions a reader asks in
 * the same breath and they answer differently:
 *
 *   map types   exactly one — standard, satellite, transit. A
 *               `DropdownMenuRadioGroup`, so the announced tree is a radio
 *               group and the chosen one carries `aria-checked`.
 *   overlays    any number — traffic, bike lanes. `DropdownMenuCheckboxItem`s,
 *               each its own checkbox.
 *
 * Neither is a control this family wrote. The rows, the indicators, the
 * keyboard handling, the dismissal and the anchoring are `dropdown-menu`'s; the
 * trigger is a `ButtonGroupItem` composed through `asChild`, which is why it
 * announces its own expanded state; and the capsule it sits in is the same
 * `GlassIsland` every other map control sits in, so the picker lands in the
 * stack as one more island rather than as a different kind of thing.
 */
function MapLayerPickerComponent({
  layers,
  layerId,
  onLayerChange,
  overlays,
  activeOverlayIds,
  onOverlayChange,
  icon = RiStackLine,
  disabled = false,
  open,
  defaultOpen,
  onOpenChange,
  labels,
  style,
  testID,
}: MapLayerPickerProps) {
  const triggerLabel = labels?.trigger ?? 'Map layers';
  const layersLabel = labels?.layers ?? 'Map';
  const overlaysLabel = labels?.overlays ?? 'Overlays';
  const active = new Set(activeOverlayIds ?? []);

  return (
    <DropdownMenu open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <GlassIsland style={style} testID={testID}>
        <DropdownMenuTrigger asChild label={triggerLabel} disabled={disabled}>
          <ButtonGroupItem
            iconOnly
            leadingIcon={icon}
            accessibilityLabel={triggerLabel}
            disabled={disabled}
            style={MAP_CONTROL_BOX}
            testID={testID ? `${testID}-trigger` : undefined}
          />
        </DropdownMenuTrigger>
      </GlassIsland>

      <DropdownMenuContent label={triggerLabel} testID={testID ? `${testID}-content` : undefined}>
        <DropdownMenuLabel>{layersLabel}</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={layerId}
          onValueChange={(next) => onLayerChange?.(next)}
        >
          {layers.map((layer) => (
            <DropdownMenuRadioItem
              key={layer.id}
              value={layer.id}
              trailing={layer.icon ? <layer.icon width={16} height={16} /> : undefined}
              testID={testID ? `${testID}-layer-${layer.id}` : undefined}
            >
              {layer.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>

        {overlays && overlays.length > 0 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>{overlaysLabel}</DropdownMenuLabel>
            {overlays.map((overlay) => (
              <DropdownMenuCheckboxItem
                key={overlay.id}
                checked={active.has(overlay.id)}
                onCheckedChange={(next) => onOverlayChange?.(overlay.id, next)}
                trailing={overlay.icon ? <overlay.icon width={16} height={16} /> : undefined}
                testID={testID ? `${testID}-overlay-${overlay.id}` : undefined}
              >
                {overlay.label}
              </DropdownMenuCheckboxItem>
            ))}
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const MapLayerPicker = memo(MapLayerPickerComponent);
MapLayerPicker.displayName = 'MapLayerPicker';
