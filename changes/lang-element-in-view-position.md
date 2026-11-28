---
package: '@oxy.so/bloom-language'
bump: patch
section: Fixed
---

- **A React element where a view goes is drawn, not dropped:** a TS caller that hands a Bloom view's `View`/`View?`/`[View]` prop a React element (`slot={<Text>Scheduled</Text>}`, Mention's composer handing PostHeader its schedule label) got nothing drawn, silently, as the runtime skipped any child that was not a node. Such an element is drawn in place, as an `Embed` of it (mention14 element-to-view-prop).
