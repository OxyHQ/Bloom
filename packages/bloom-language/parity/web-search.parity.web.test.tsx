import { WEB_SEARCH_CASES, WEB_SEARCH_CASES_MOVING } from './web-search.cases';
import { describeWebParity } from './support/web';

describeWebParity('Web search', [...WEB_SEARCH_CASES, ...WEB_SEARCH_CASES_MOVING]);
