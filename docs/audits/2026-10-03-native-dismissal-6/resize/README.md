# Native paint resize candidate

The prior candidate fixed dismissal and the default fill, but Android paint covered only the initial height after content grew. Root reproduced that with morph enabled and disabled; the sheet/ScrollView bounds reached the screen bottom. The failed candidate remains pinned, not rewritten as success.

Installed react-native-svg15.15.5 source shows cached relative canvas dimensions/Rect paths: outer SvgView size invalidation clears its bitmap, whereas changed rectangle properties invalidate the child path. SurfacePaint now observes its native backing View through public onLayout and supplies numerical width/height to fill and sheen rectangles, leaving layout, shape, tokens, pointer events and web CSS unchanged. No dependency source edits.

Tests drive small→tall→wide→small layout events through the actual component and assert both rectangles resize while explicit alpha/sheens remain correct. RED2 failures; GREEN9suites110PASS, TypeScript/consumer control and fresh same-command build+pack. These mocks prove the geometry boundary, not Android pixels. The next root-operated device check remains required before publication. Earlier touch observations remain separate.
