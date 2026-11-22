import { WEB_SEARCH_CASES, WEB_SEARCH_CASES_MOVING } from './web-search.cases';
import { describeNativeParity } from './support/native';

describeNativeParity('Web search', [...WEB_SEARCH_CASES, ...WEB_SEARCH_CASES_MOVING]);
