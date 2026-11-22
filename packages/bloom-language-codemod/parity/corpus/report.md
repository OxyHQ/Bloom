# Bloom language codemod: parity/sample-app

- Files: 1 read, 1 changed
- Elements considered (React Native View, Pressable, Text, Image; Bloom Text, Button, icons): 16
- Converted: 12 (75.0%), in 4 regions
- Classes the app's theme draws differently from Bloom's: 0

## Why elements stayed JSX

| Reason | Elements | Most frequent |
| --- | ---: | --- |
| measured-difference | 2 | `text-xs` 1, `flex-1` 1 |
| annotated | 1 | `mt-2` 1 |
| react-native-text | 1 | `Text` 1 |
| prop:style | 1 | `style` 1 |
| corner-without-clip | 1 | `rounded-xl` 1 |

## Bloom components left as JSX

Not mapped by the codemod yet (each needs its prop rules and parity first):

| Component | Elements |
| --- | ---: |

## Each element

- components/Rows.tsx:49 `<Text>`: `text-xs` (measured-difference: .font('caption-1') brings the ramp’s letter spacing, which text-xs does not write)
- components/Rows.tsx:58 `<View>`: `flex-1` (measured-difference: NativeWind writes flexGrow 1, flexShrink 1, flexBasis 0%; .grow() is React Native’s flex: 1 (flexShrink 0 on native)); `mt-2` (annotated: .padding('top', 'sm') (outside the fill))
- components/Rows.tsx:59 `<NativeText>`: `Text` (react-native-text: React Native’s Text, not Bloom’s: the language’s Text draws Bloom’s family, size and ink where this draws the platform’s)
- components/Rows.tsx:60 `<View>`: `style` (prop:style: the prop `style` has no mapping); `rounded-xl` (corner-without-clip: a corner clips in the language; this className does not clip (no overflow-hidden))
