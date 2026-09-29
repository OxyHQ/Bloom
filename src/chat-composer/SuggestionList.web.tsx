import { Surface } from '../surface/index.web';
import { Loading } from '../loading/index.web';
import { createSuggestionList } from './create-suggestion-list';

export const SuggestionList = createSuggestionList({ Surface, Loading });
