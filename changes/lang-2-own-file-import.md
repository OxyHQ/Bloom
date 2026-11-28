---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- A path import of one of the importing module's own files (`import { type ListCardData } from "@/components/ListCard"`, which the codemod keeps from before `ListCard.tsx` was Bloom) no longer hides that file's declarations behind a TS import (B0204 "cannot find type"). It is dropped with a warning (B0901), since a module's files see each other's names. An import that renames a name is kept (Mention: lists, marketplace, SuggestedFeedsInterstitial).
