# Bloom language codemod: parity/sample-app

- Files: 2 read, 2 changed
- Elements considered (React Native View, Pressable, Text, Image; Bloom Text, Button, icons and mapped components): 51
- Converted: 50 (98.0%), in 14 regions
- Classes the app's theme draws differently from Bloom's: 0

## Why elements stayed JSX

| Reason | Elements | Most frequent |
| --- | ---: | --- |
| prop:style | 1 | `style` 1 |

## Bloom components left as JSX

Not mapped by the codemod yet (each needs its prop rules and parity first):

| Component | Elements |
| --- | ---: |
| `@oxy.so/bloom/text-field` `TextFieldIcon` | 1 |

## Each element

- components/Rows.tsx:70 `<View>`: `style` (prop:style: the prop `style` has no mapping)
