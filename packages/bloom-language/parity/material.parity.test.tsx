import { MATERIAL_CASES } from './material.cases';
import { describeNativeParity } from './support/native';

describeNativeParity(
  'Material: Surface, concentric and smooth corners, Divider, Fill, AspectRatio, Grid',
  MATERIAL_CASES,
);
