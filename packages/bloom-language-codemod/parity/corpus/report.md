# Bloom language codemod: parity/sample-app

- Files: 18 read, 18 changed
- Elements considered (React Native View, Pressable, Text, Image; Bloom Text, Button, icons and mapped components): 223
- Converted: 222 (99.6%), in 84 regions
- Classes the app's theme draws differently from Bloom's: 0

## Why elements stayed JSX

| Reason | Elements | Most frequent |
| --- | ---: | --- |
| style | 1 | `backgroundColor` 1 |

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

- components/Surfaces.tsx:20 `<View>`: `backgroundColor` (style: a style `backgroundColor` whose value no Tailwind utility writes exactly)
