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
