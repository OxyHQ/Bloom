//! `NavigationStack`'s route table, from the module graph (ADR 0002, section 3: `BloomUI`).
//!
//! The app's root view names its routes once: `NavigationStack(root: Route.feed, tabs: […],
//! sheets: […]) { route in … }`, over a `Routable` enum declared in any module of the
//! package. `bloom build` reads that enum and writes today's router's file routes from it
//! (`.bloom/build/app/`): each case is a route, its associated values the route's typed
//! parameters (`case post(id: String)` is `post/[id]`), so a deep link or a web URL opens
//! the screen the stack's `destination` draws for that case. Phase F's router replaces
//! the files; the table stays.

use std::collections::BTreeMap;
use std::path::Path;

use bloom_lang::analysis::{Node, walk_file};
use bloom_lang::ast::*;
use bloom_lang::package::TargetKind;

use crate::project::{Package, write};

/// One case of the routes enum.
#[derive(Debug, Clone, PartialEq)]
pub struct Case {
    pub name: String,
    /// Its associated values: (label, type name), in order.
    pub params: Vec<(String, String)>,
}

/// A page of the tab bar.
#[derive(Debug, Clone, PartialEq)]
pub struct Tab {
    pub case: String,
    pub title: String,
    pub icon: String,
}

/// The app's navigation, as its root view declares it.
#[derive(Debug, Clone, PartialEq)]
pub struct Table {
    pub enum_name: String,
    pub cases: Vec<Case>,
    pub root: String,
    pub sheets: Vec<String>,
    pub tabs: Vec<Tab>,
}

impl Case {
    /// The route file's path under `app/`, without its extension: `post/[id]`.
    fn file(&self) -> String {
        let mut out = self.name.clone();
        for (label, _) in &self.params {
            out.push_str(&format!("/[{label}]"));
        }
        out
    }
}

/// A case named in an argument: `Route.feed`, `.feed`.
fn case_name(e: &Expr) -> Option<String> {
    match &e.kind {
        ExprKind::Field(_, member) | ExprKind::ImplicitMember(member) => Some(member.name.clone()),
        ExprKind::Paren(inner) => case_name(inner),
        _ => None,
    }
}

fn enum_of(e: &Expr) -> Option<String> {
    match &e.kind {
        ExprKind::Field(object, _) => match &object.kind {
            ExprKind::Name(n) => Some(n.clone()),
            _ => None,
        },
        _ => None,
    }
}

fn string(e: &Expr) -> Option<String> {
    match &e.kind {
        ExprKind::Str { parts, .. } => {
            let mut out = String::new();
            for part in parts {
                match part {
                    StrPart::Text(t) => out.push_str(t),
                    _ => return None,
                }
            }
            Some(out)
        }
        _ => None,
    }
}

fn type_name(t: &TypeExpr) -> String {
    match &t.kind {
        TypeKind::Named { name, .. } => name.name.clone(),
        _ => String::new(),
    }
}

/// The `NavigationStack(…)` call's arguments, from the app target's files.
struct Call {
    root: Expr,
    sheets: Vec<Expr>,
    tabs: Vec<Expr>,
    file: std::path::PathBuf,
}

fn list(e: Option<&Arg>) -> Vec<Expr> {
    match e.map(|a| &a.value.kind) {
        Some(ExprKind::List(xs)) => xs.clone(),
        _ => Vec::new(),
    }
}

fn find_call(package: &Package) -> Option<Call> {
    let app = *package.targets_of(|k| matches!(k, TargetKind::App)).first()?;
    for file in package.files(app) {
        let source = std::fs::read_to_string(&file).unwrap_or_default();
        let (ast, _, _) = bloom_lang::parse(&source, "");
        let mut found = None;
        walk_file(&ast, &mut |node| {
            if found.is_some() {
                return;
            }
            let Node::Expr(e) = node else { return };
            let ExprKind::Call(c) = &e.kind else { return };
            if !matches!(&c.callee.kind, ExprKind::Name(n) if n == "NavigationStack") {
                return;
            }
            let arg = |label: &str| c.args.iter().find(|a| a.label.as_ref().is_some_and(|l| l.name == label));
            if let Some(root) = arg("root") {
                found = Some(Call {
                    root: root.value.clone(),
                    sheets: list(arg("sheets")),
                    tabs: list(arg("tabs")),
                    file: file.clone(),
                });
            }
        });
        if found.is_some() {
            return found;
        }
    }
    None
}

/// Every enum of the package, by name: its cases.
fn enums(package: &Package) -> BTreeMap<String, Vec<Case>> {
    let mut out = BTreeMap::new();
    for index in 0..package.manifest.targets.len() {
        for file in package.files(index) {
            let source = std::fs::read_to_string(&file).unwrap_or_default();
            let (ast, _, _) = bloom_lang::parse(&source, "");
            for item in &ast.items {
                let ItemKind::Enum(e) = &item.kind else { continue };
                let cases = e
                    .variants
                    .iter()
                    .map(|v| Case {
                        name: v.name.name.clone(),
                        params: v
                            .payload
                            .iter()
                            .map(|p| {
                                (
                                    p.name.as_ref().map(|n| n.name.clone()).unwrap_or_default(),
                                    type_name(&p.ty),
                                )
                            })
                            .collect(),
                    })
                    .collect();
                out.insert(e.name.name.clone(), cases);
            }
        }
    }
    out
}

/// The app's route table, when its root view has a `NavigationStack`.
pub fn table(package: &Package) -> Result<Option<Table>, String> {
    let Some(call) = find_call(package) else { return Ok(None) };
    let at = call.file.display();
    let enum_name = enum_of(&call.root)
        .ok_or_else(|| format!("{at}: `NavigationStack(root:)` names its enum: `root: Route.home`"))?;
    let cases = enums(package).remove(&enum_name).ok_or_else(|| {
        format!("{at}: no enum `{enum_name}` in the package for `NavigationStack`'s routes")
    })?;
    let known = |name: &str| cases.iter().find(|c| c.name == name);
    let root = case_name(&call.root).unwrap_or_default();
    match known(&root) {
        Some(c) if c.params.is_empty() => {}
        Some(_) => {
            return Err(format!(
                "{at}: the root route `.{root}` has associated values; the root is a plain case"
            ));
        }
        None => return Err(format!("{at}: `{enum_name}` has no case `.{root}`")),
    }
    for case in &cases {
        if case.params.iter().any(|(label, _)| label.is_empty()) {
            return Err(format!(
                "{at}: `{enum_name}.{}`'s associated values need labels: they are its route's parameters (`case post(id: String)`)",
                case.name
            ));
        }
    }
    let mut sheets = Vec::new();
    for sheet in &call.sheets {
        let name =
            case_name(sheet).ok_or_else(|| format!("{at}: `sheets:` lists cases: `[Route.compose]`"))?;
        known(&name).ok_or_else(|| format!("{at}: `{enum_name}` has no case `.{name}`"))?;
        sheets.push(name);
    }
    let mut tabs = Vec::new();
    for tab in &call.tabs {
        let ExprKind::Call(c) = &tab.kind else {
            return Err(format!("{at}: `tabs:` lists `Tab(route:title:icon:)`s"));
        };
        let arg = |label: &str| c.args.iter().find(|a| a.label.as_ref().is_some_and(|l| l.name == label));
        let (Some(route), Some(title), Some(icon)) = (
            arg("route").and_then(|a| case_name(&a.value)),
            arg("title").and_then(|a| string(&a.value)),
            arg("icon").and_then(|a| string(&a.value)),
        ) else {
            return Err(format!("{at}: a tab is `Tab(route: Route.home, title: \"Home\", icon: \"home\")`"));
        };
        match known(&route) {
            Some(c) if c.params.is_empty() => {}
            _ => {
                return Err(format!(
                    "{at}: a tab's route is a plain case of `{enum_name}`: `.{route}` is not"
                ));
            }
        }
        let glyph = bloom_lang::bloomui::icon_component(&icon);
        if !bloom_lang::bloomui::icon_exists(&glyph) {
            return Err(format!(
                "{at}: the tab icon \"{icon}\" is not an icon of Bloom's set (no `{glyph}`)"
            ));
        }
        tabs.push(Tab { case: route, title, icon });
    }
    if !tabs.is_empty() && !tabs.iter().any(|t| t.case == root) {
        return Err(format!("{at}: with `tabs:`, the root `.{root}` is one of the tabs"));
    }
    Ok(Some(Table { enum_name, cases, root, sheets, tabs }))
}

fn quote(s: &str) -> String {
    crate::json::write(&crate::json::Value::String(s.to_string()))
}

/// The route's value from its URL's parameters (`p`): `{ tag: "post", id: p.id }`.
fn value_of(case: &Case) -> String {
    if case.params.is_empty() {
        return quote(&case.name);
    }
    let fields: Vec<String> = case
        .params
        .iter()
        .map(|(label, ty)| {
            let raw = format!("p[{}]", quote(label));
            let value = match ty.as_str() {
                "Int" | "Double" | "Float" => format!("Number({raw})"),
                "Bool" => format!("{raw} === 'true'"),
                _ => format!("({raw} ?? '')"),
            };
            format!("{}: {value}", quote(label))
        })
        .collect();
    format!("({{ tag: {}, {} }})", quote(&case.name), fields.join(", "))
}

/// Writes the route files under `build/app/`, and returns the root layout's registration.
pub fn write_routes(build: &Path, std_routing: &str, table: &Table) -> Result<String, String> {
    let header =
        "// Generated by bloom from the app's NavigationStack: regenerated on every build, never edited.\n";
    let app = build.join("app");
    let _ = std::fs::remove_dir_all(&app);
    let tabbed = |name: &str| table.tabs.iter().any(|t| t.case == name);
    let depth = |file: &str| "../".repeat(file.matches('/').count());
    for case in &table.cases {
        let mut file = if case.name == table.root { "index".to_string() } else { case.file() };
        if tabbed(&case.name) {
            file = format!("(tabs)/{file}");
        }
        let routing = format!("{}{}", depth(&file), std_routing);
        let params = if case.params.is_empty() { "()" } else { "(p)" };
        write(
            &app.join(format!("{file}.js")),
            &format!(
                "{header}import {{ screen }} from '@oxy.so/bloom-language/router';\nimport {{ routeScreen }} from '{routing}';\n\n// `{}.{}`\nexport default screen(routeScreen({params} => {}));\n",
                table.enum_name,
                case.name,
                value_of(case)
            ),
        )?;
    }
    if !table.tabs.is_empty() {
        write(
            &app.join("(tabs)/_layout.js"),
            &format!(
                "{header}import {{ createElement }} from 'react';\nimport {{ View }} from 'react-native';\nimport {{ TabPagerBottomBar }} from '@oxy.so/bloom/tab-pager';\nimport {{ layout, TabView }} from '@oxy.so/bloom-language/router';\n\n// The tabs' pages (Bloom's tab pager), over the bar.\nconst Pages = layout(() => TabView());\n\nexport default function Tabs() {{\n  return createElement(View, {{ style: {{ flex: 1 }} }}, createElement(Pages), createElement(TabPagerBottomBar));\n}}\n"
            ),
        )?;
    }
    // The stack: the root (or the tabs), then every other route, sheets presented.
    let mut stack = vec![if table.tabs.is_empty() { quote("index") } else { quote("(tabs)") }];
    for case in &table.cases {
        if case.name == table.root || tabbed(&case.name) {
            continue;
        }
        if table.sheets.contains(&case.name) {
            stack.push(format!("Sheet({})", quote(&case.file())));
        } else {
            stack.push(quote(&case.file()));
        }
    }
    let routes: Vec<String> = table
        .cases
        .iter()
        .map(|c| {
            let labels: Vec<String> = c.params.iter().map(|(l, _)| quote(l)).collect();
            format!("{}: [{}]", quote(&c.name), labels.join(", "))
        })
        .collect();
    Ok(format!(
        "registerNavigation({{\n  root: {},\n  routes: {{ {} }},\n  navigator: layout(() => Stack({})),\n}});\n",
        quote(&table.root),
        routes.join(", "),
        stack.join(", ")
    ))
}

/// The tab pager's destinations (its pages and the bar's items).
pub fn destinations(table: &Table) -> (Vec<String>, String) {
    let mut icons = Vec::new();
    let items: Vec<String> = table
        .tabs
        .iter()
        .map(|t| {
            let icon = bloom_lang::bloomui::icon_component(&t.icon);
            let fill = icon
                .strip_suffix("Line")
                .map(|base| format!("{base}Fill"))
                .filter(|f| bloom_lang::bloomui::icon_exists(f));
            icons.push(icon.clone());
            let active = match &fill {
                Some(f) => {
                    icons.push(f.clone());
                    format!(", activeIcon: {f}")
                }
                None => String::new(),
            };
            let name = if t.case == table.root { "index".to_string() } else { t.case.clone() };
            let href = if t.case == table.root { "/".to_string() } else { format!("/{}", t.case) };
            format!(
                "  {{ name: {}, href: {}, label: {}, icon: {icon}{active}, page: true, bar: true }}",
                quote(&name),
                quote(&href),
                quote(&t.title)
            )
        })
        .collect();
    (icons, format!("[\n{},\n]", items.join(",\n")))
}

#[cfg(test)]
mod tests {
    use super::*;

    pub(crate) const APP: &str = r#"public enum Route: Routable {
  case feed
  case post(id: String, page: Int)
  case settings
  case compose
}

public struct App: View {
  var body: some View {
    NavigationStack(
      root: Route.feed,
      tabs: [
        Tab(route: Route.feed, title: "Home", icon: "home"),
        Tab(route: Route.settings, title: "Settings", icon: "settings"),
      ],
      sheets: [Route.compose]
    ) { route in
      switch route {
      case .feed: Text("Feed")
      case .post(let id, let page): Text("Post \(id) \(page)")
      case .settings: Text("Settings")
      case .compose: Text("Compose")
      }
    }
  }
}
"#;

    pub(crate) fn package(name: &str, app: &str) -> Package {
        let root = std::env::temp_dir().join(format!("bloom-nav-{name}-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&root);
        std::fs::create_dir_all(root.join("Sources/Shop")).unwrap();
        std::fs::write(root.join("Sources/Shop/App.bloom"), app).unwrap();
        let source =
            "let package = Package(name: \"Shop\", platforms: [.web, .android(26)], targets: [.app(\"Shop\")])".to_string();
        Package { root, manifest: bloom_lang::package::parse(&source, "x").unwrap(), source }
    }

    /// The routes enum is the router's route table: each case a file, its associated values
    /// the route's typed parameters, the tabs a group, the sheets presented.
    #[test]
    fn the_routes_enum_writes_the_route_files() {
        let package = package("routes", APP);
        let table = table(&package).unwrap().unwrap();
        assert_eq!(table.root, "feed");
        assert_eq!(table.sheets, ["compose"]);
        assert_eq!(table.tabs.len(), 2);
        crate::expo::generate(&package).unwrap();
        let app = package.build_dir().join("app");
        let read = |p: &str| std::fs::read_to_string(app.join(p)).unwrap_or_else(|_| panic!("no app/{p}"));
        assert!(read("(tabs)/index.js").contains("routeScreen(() => \"feed\")"));
        assert!(read("(tabs)/settings.js").contains("routeScreen(() => \"settings\")"));
        assert!(read("(tabs)/_layout.js").contains("TabView()"));
        let post = read("post/[id]/[page].js");
        assert!(
            post.contains("({ tag: \"post\", \"id\": (p[\"id\"] ?? ''), \"page\": Number(p[\"page\"]) })"),
            "{post}"
        );
        assert!(post.contains("from '../../../../std/Bloom/routing'"), "{post}");
        assert!(read("compose.js").contains("\"compose\""));
        let root = read("_layout.js");
        assert!(
            root.contains(
                "navigator: layout(() => Stack(\"(tabs)\", \"post/[id]/[page]\", Sheet(\"compose\")))"
            ),
            "{root}"
        );
        assert!(
            root.contains(
                "routes: { \"feed\": [], \"post\": [\"id\", \"page\"], \"settings\": [], \"compose\": [] }"
            ),
            "{root}"
        );
        assert!(root.contains("import { RiHomeLine } from '@oxy.so/bloom/icons/RiHomeLine'"), "{root}");
        assert!(root.contains("name: \"settings\", href: \"/settings\", label: \"Settings\", icon: RiSettingsLine, page: true"), "{root}");
        assert!(root.contains("TabPagerProvider"), "{root}");
        let index = std::fs::read_to_string(package.build_dir().join("index.js")).unwrap();
        assert_eq!(index.lines().last(), Some("import 'expo-router/entry';"));
        let app_json = std::fs::read_to_string(package.build_dir().join("app.json")).unwrap();
        assert!(app_json.contains("\"scheme\": \"shop\""), "{app_json}");
        let _ = std::fs::remove_dir_all(&package.root);
    }

    #[test]
    fn a_route_without_labels_or_an_unknown_tab_icon_is_reported() {
        let unlabeled = APP.replace("case post(id: String, page: Int)", "case post(String)").replace(
            "case .post(let id, let page): Text(\"Post \\(id) \\(page)\")",
            "case .post(let id): Text(id)",
        );
        let package = package("unlabeled", &unlabeled);
        let error = table(&package).unwrap_err();
        assert!(error.contains("`Route.post`'s associated values need labels"), "{error}");
        let package = self::package("icon", &APP.replace("icon: \"settings\"", "icon: \"noSuchGlyph\""));
        let error = table(&package).unwrap_err();
        assert!(error.contains("\"noSuchGlyph\" is not an icon of Bloom's set"), "{error}");
    }
}
