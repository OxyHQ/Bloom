import { ICON_CASES, ICON_CASES_EVERY } from './icon.cases';
import { describeWebParity } from './support/web';

describeWebParity('Icon draws the Bloom icon at a size rung, in an ink', ICON_CASES);
describeWebParity('Every Bloom icon as Icon(X)', ICON_CASES_EVERY);
