import { createContext } from 'react';

/**
 * The map's heading, in degrees clockwise from north, for the compass needle.
 *
 * WHY A CONTEXT FOR ONE NUMBER: `ButtonGroupItem` takes its glyph as a
 * COMPONENT (`leadingIcon={RiCompass3Line}`), and a needle has to rotate. A
 * component built from the heading would be a new component TYPE on every
 * degree, so React would unmount and remount the SVG on every frame of a map
 * rotation. A module-scope component reading the heading from here keeps one
 * identity for the life of the control, and only the needle re-renders.
 */
export const MapHeadingContext = createContext(0);
