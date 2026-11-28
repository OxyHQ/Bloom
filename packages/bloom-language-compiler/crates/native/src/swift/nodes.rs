//! BloomUI's nodes as the Swift backend sees them (generated from the spec).

#[allow(dead_code)]
#[path = "nodes.generated.rs"]
mod table;

/// The 2.0 (SwiftUI) spelling of a modifier, as the spec names it.
fn canonical(modifier: &str) -> &str {
    match modifier {
        "lineLimit" => "lines",
        "foregroundStyle" => "foreground",
        other => other,
    }
}

/// Whether `modifier` is `constructor`'s own (a method of the node in BloomUI, written on
/// the node before any universal modifier).
pub fn is_own(constructor: &str, modifier: &str) -> bool {
    let modifier = canonical(modifier);
    match table::OWN_MODIFIERS.binary_search_by(|(c, _)| c.cmp(&constructor)) {
        Ok(i) => table::OWN_MODIFIERS[i].1.contains(&modifier),
        Err(_) => false,
    }
}

/// The spec's name of a modifier written in its 2.0 (SwiftUI) spelling.
pub fn spec_name(modifier: &str) -> &str {
    canonical(modifier)
}

/// Whether `modifier` is one every node takes (a `View` extension in BloomUI, `bloom`-prefixed).
pub fn is_universal(modifier: &str) -> bool {
    table::UNIVERSAL.contains(&canonical(modifier))
}

/// The modifiers whose meaning is SwiftUI's own, emitted as SwiftUI writes them.
pub fn is_effect(modifier: &str) -> bool {
    matches!(modifier, "task" | "onAppear" | "onDisappear" | "onChange" | "onOpenURL")
}

/// Whether `name` is one of BloomUI's constructors.
pub fn is_node(name: &str) -> bool {
    table::OWN_MODIFIERS.binary_search_by(|(c, _)| c.cmp(&name)).is_ok() || EXTRA.contains(&name)
}

/// BloomUI's SwiftUI spellings that are not spec constructors (lowered for TypeScript by
/// `bloom_lang::bloomui`), and the router's stack.
const EXTRA: &[&str] = &["ProgressView", "Toggle", "ForEach", "NavigationStack", "Label", "VirtualList", "List", "Spacer"];

/// Whether `name`'s trailing closure is a view builder (`VStack { … }`), not an action.
pub fn takes_children(name: &str) -> bool {
    table::CHILDREN.contains(&name) && name != "Button"
        || matches!(name, "NavigationStack" | "ForEach" | "List" | "ScrollView" | "VStack" | "HStack" | "ZStack")
}
