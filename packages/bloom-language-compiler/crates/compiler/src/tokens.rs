//! The Bloom theme tokens the compiler resolves at build time.
//!
//! Spike copy of `src/styles/tokens.ts` (t-shirt spacing and radius) and
//! `src/design-tokens/scales.ts` (`TYPOGRAPHY`). A production compiler would
//! generate this file from `src/design-tokens/tokens.json` with the other
//! `generate:*` scripts, so the two can never drift.
//!
//! Lengths and type are theme-invariant and fold to numbers. Colours are not:
//! presets, light/dark and custom seeds change them at runtime, so a colour
//! token resolves to the name of its CSS variable / theme role, never a value.

pub const SPACE: &[(&str, f64)] =
    &[("none", 0.0), ("xs", 4.0), ("sm", 8.0), ("md", 12.0), ("lg", 16.0), ("xl", 20.0)];

pub const RADIUS: &[(&str, f64)] =
    &[("none", 0.0), ("xs", 4.0), ("sm", 8.0), ("md", 12.0), ("lg", 16.0), ("xl", 20.0), ("full", 9999.0)];

pub struct TypeRole {
    pub size: f64,
    pub line_height: f64,
    pub weight: &'static str,
}

pub const TYPE_ROLES: &[(&str, TypeRole)] = &[
    ("caption", TypeRole { size: 11.0, line_height: 14.0, weight: "400" }),
    ("bodySmall", TypeRole { size: 13.0, line_height: 18.0, weight: "400" }),
    ("body", TypeRole { size: 15.0, line_height: 22.0, weight: "400" }),
    ("subtitle", TypeRole { size: 17.0, line_height: 24.0, weight: "500" }),
    ("sectionTitle", TypeRole { size: 20.0, line_height: 26.0, weight: "600" }),
    ("headerBold", TypeRole { size: 28.0, line_height: 34.0, weight: "700" }),
];

pub const WEIGHTS: &[(&str, &str)] =
    &[("regular", "400"), ("medium", "500"), ("semibold", "600"), ("bold", "700")];

/// Colour roles, named exactly as Bloom's canonical CSS variables
/// (`CANONICAL_TOKENS` in `src/theme/token-registry.ts`); a subset for the spike.
pub const COLORS: &[&str] = &[
    "background",
    "foreground",
    "surface",
    "primary",
    "primary-foreground",
    "secondary",
    "muted",
    "muted-foreground",
    "accent",
    "destructive",
    "border",
    "card",
    "card-foreground",
];

pub fn lookup<'t, T>(table: &'t [(&'static str, T)], name: &str) -> Option<&'t T> {
    table.iter().find(|(key, _)| *key == name).map(|(_, value)| value)
}

pub fn names<T>(table: &[(&'static str, T)]) -> Vec<&'static str> {
    table.iter().map(|(key, _)| *key).collect()
}
