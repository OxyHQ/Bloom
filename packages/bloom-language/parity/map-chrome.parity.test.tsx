import { MAP_CHROME_CASES, MAP_CHROME_CASES_MOVING } from './map-chrome.cases';
import { describeNativeParity } from './support/native';

describeNativeParity('Map chrome', [...MAP_CHROME_CASES, ...MAP_CHROME_CASES_MOVING]);
