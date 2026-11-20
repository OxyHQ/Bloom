import { AppRegistry } from 'react-native';
import { Hello } from '../fixtures/hello';
import { PostRow } from '../fixtures/post-row';

const post = { author: { name: 'Ada' }, text: 'Hello', pinned: true };

AppRegistry.registerComponent('main', () => () => [Hello(), PostRow({ post, gap: 'sm' })]);
