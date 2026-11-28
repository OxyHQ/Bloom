// `.selection([value, onValueChange])` of a prop pair is a `Binding(get:set:)`, and a function
// typed `MenuView` returns a `View`.
import { Item, Menu, Section, type Child, type MenuView } from '@oxy.so/bloom-language';

type Audience = 'public' | 'direct';

export function AudienceMenu(
  trigger: Child,
  { audience, onAudienceChange }: { audience: Audience; onAudienceChange: (a: Audience) => void },
): MenuView {
  return Menu(
    trigger,
    Section(Item('Everyone').tag('public'), Item('Private').tag('direct'))
      .title('Who can see this post')
      .selection([audience, onAudienceChange]),
  );
}
