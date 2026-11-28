// `push(c ? { pathname, params } : "/search")` as a statement: a TS union argument whose
// branches have no one Bloom type, so the call is made in each branch.
import { Button, view } from '@oxy.so/bloom-language';
import { push } from './nav';


export const Search = view(function Search({ query }: { query: string }) {
  const submit = () => {
    const term = query.trim();
    push(term ? { pathname: '/search', params: { q: term } } : '/search');
  };
  return Button('Search').onPress(submit);
});
