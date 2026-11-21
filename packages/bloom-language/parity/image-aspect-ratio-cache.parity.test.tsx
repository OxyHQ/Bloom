import { IMAGE_ASPECT_RATIO_CASES } from './image-aspect-ratio-cache.cases';
import { describeNativeParity } from './support/native';

describeNativeParity('Image aspect ratios', IMAGE_ASPECT_RATIO_CASES);
