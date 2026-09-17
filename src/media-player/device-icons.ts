import { RiCarLine } from '../icons/remix/RiCarLine';
import { RiComputerLine } from '../icons/remix/RiComputerLine';
import { RiHeadphoneLine } from '../icons/remix/RiHeadphoneLine';
import { RiSmartphoneLine } from '../icons/remix/RiSmartphoneLine';
import { RiSpeaker3Line } from '../icons/remix/RiSpeaker3Line';
import { RiSpeakerLine } from '../icons/remix/RiSpeakerLine';
import { RiTabletLine } from '../icons/remix/RiTabletLine';
import { RiTvLine } from '../icons/remix/RiTvLine';
import type { PlayerGlyph } from './PlayerIconButton';
import type { PlaybackDeviceKind } from './types';

export const DEVICE_GLYPHS: Record<PlaybackDeviceKind, PlayerGlyph> = {
  computer: RiComputerLine,
  phone: RiSmartphoneLine,
  tablet: RiTabletLine,
  speaker: RiSpeakerLine,
  tv: RiTvLine,
  car: RiCarLine,
  headphones: RiHeadphoneLine,
  group: RiSpeaker3Line,
};
