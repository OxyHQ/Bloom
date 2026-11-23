# Bloom language codemod: parity/sample-app

- Files: 8 read, 8 changed
- Elements considered (React Native View, Pressable, Text, Image; Bloom Text, Button, icons and mapped components): 160
- Converted: 159 (99.4%), in 57 regions
- Classes the app's theme draws differently from Bloom's: 0

## Why elements stayed JSX

| Reason | Elements | Most frequent |
| --- | ---: | --- |
| style | 1 | `style` 1 |

## Bloom components left as JSX

Not mapped by the codemod yet (each needs its prop rules and parity first):

| Component | Elements |
| --- | ---: |
| `@oxy.so/bloom/segmented-control` `SegmentedControlItemText` | 5 |
| `@oxy.so/bloom/dropdown-menu` `DropdownMenuItem` | 2 |
| `@oxy.so/bloom/text-field` `TextFieldIcon` | 1 |
| `@oxy.so/bloom/dropdown-menu` `DropdownMenuTrigger` | 1 |
| `@oxy.so/bloom/dropdown-menu` `DropdownMenuContent` | 1 |
| `@oxy.so/bloom/dropdown-menu` `DropdownMenuSeparator` | 1 |

## Each element

- components/Insets.tsx:11 `<View>`: `style` (style: a style that is no object literal)
