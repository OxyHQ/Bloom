import { Surface } from '../surface';
import { Loading } from '../loading';
import { createSuggestionList } from './create-suggestion-list';

export const SuggestionList = createSuggestionList({ Surface, Loading });
