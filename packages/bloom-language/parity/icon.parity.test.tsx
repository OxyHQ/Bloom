import { ICON_CASES, ICON_CASES_EVERY } from './icon.cases';
import { describeNativeParity } from './support/native';

describeNativeParity('Icon draws the Bloom icon at a size rung, in an ink', ICON_CASES);
describeNativeParity('Every Bloom icon as Icon(X)', ICON_CASES_EVERY);
