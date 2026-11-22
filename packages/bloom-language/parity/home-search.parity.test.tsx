import { HOME_SEARCH_CASES, HOME_SEARCH_CASES_FOCUSED } from './home-search.cases';
import { describeNativeParity } from './support/native';

describeNativeParity('Home search', [...HOME_SEARCH_CASES, ...HOME_SEARCH_CASES_FOCUSED]);
