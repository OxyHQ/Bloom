/**
 * COPIED FROM react-native-teleport 1.2.0 — `src/contexts/ScrollViewContext/index.native.ts`
 * MIT, Copyright (c) 2025 Kiryl Ziusko. Full licence in `NOTICE` at the root.
 *
 * Changed: import paths, and `ScrollView.Context` is reached through a cast
 * because Bloom does not compile with their `react-native-strict-api` condition,
 * which is the only place that property is declared.
 */
import type { Context } from "react";
import { ScrollView } from "react-native";
import type { ScrollViewContextValue } from "./types";

// Bloom does not compile with their `react-native-strict-api` condition, and
// `ScrollView.Context` is only declared there. Reached through the shape it has
// at runtime instead; the value and the behaviour are theirs, unchanged.
const ScrollViewContext = (ScrollView as unknown as { Context: Context<ScrollViewContextValue> })
  .Context;

export default ScrollViewContext;
