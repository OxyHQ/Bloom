import { HOME_SEARCH_CASES, HOME_SEARCH_CASES_FOCUSED } from './home-search.cases';
import { describeWebParity } from './support/web';

describeWebParity('Home search', [...HOME_SEARCH_CASES, ...HOME_SEARCH_CASES_FOCUSED]);
