import { MAP_CHROME_CASES, MAP_CHROME_CASES_MOVING } from './map-chrome.cases';
import { describeWebParity } from './support/web';

describeWebParity('Map chrome', [...MAP_CHROME_CASES, ...MAP_CHROME_CASES_MOVING]);
