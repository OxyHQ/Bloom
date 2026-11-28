//! An adopted app's file routes: the route tree an Expo Router app declares in `app/`, read
//! by `bloom` so the Bloom router can draw it (ADR 0002, section 7, "Next" 3).
//!
//! The rules are Expo Router's, so an adopted app keeps its files as they are:
//!
//! - **Files.** Each `.tsx`/`.ts`/`.jsx`/`.js` file under `app/` is a route, except
//!   `_layout` (its directory's layout), `+html`, `+middleware` and `+api` files (web and
//!   server), `.d.ts` files, and tests (`__tests__/`, `*.test.*`, `*.spec.*`, which Metro's
//!   block list leaves out of the bundle).
//! - **Segments.** `index` adds none; `(group)` adds none (a group only shares a layout);
//!   `[name]` is a parameter; `[...name]` takes the rest of the path; `+not-found` takes
//!   whatever its directory's routes do not.
//! - **Platforms.** `name.android.tsx` beats `name.native.tsx`, which beats `name.tsx`, on
//!   Android (`.ios` likewise on iOS); `name.web.tsx` is the web's. A route with only another
//!   platform's file is not one of this platform's.
//! - **Layouts.** A route is drawn inside every `_layout` from `app/` down to its directory.
//! - **Matching.** Of the routes a path matches, the one whose segments are most specific,
//!   from the first: a name beats a parameter, which beats the rest of the path, which beats
//!   `+not-found`. Two routes equally specific for a path are ambiguous (Mention's `(app)`
//!   and `(auth)` groups both have an index, and its auth gate redirects between them):
//!   `bloom routes` reports them, and the first by file name is the one matched.

use std::collections::BTreeMap;
use std::path::Path;

/// The platform whose files are read.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Platform {
    Android,
    Ios,
    Web,
}

impl Platform {
    pub fn parse(name: &str) -> Result<Platform, String> {
        match name {
            "android" => Ok(Platform::Android),
            "ios" => Ok(Platform::Ios),
            "web" => Ok(Platform::Web),
            other => Err(format!("{other}: not a platform (android, ios or web)")),
        }
    }

    /// The platform extensions this platform reads, the most specific first ("" is none).
    fn extensions(self) -> &'static [&'static str] {
        match self {
            Platform::Android => &["android", "native", ""],
            Platform::Ios => &["ios", "native", ""],
            Platform::Web => &["web", ""],
        }
    }
}

/// One segment of a route's path.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Segment {
    Static(String),
    Param(String),
    /// `[...name]`: the rest of the path, one segment or more.
    Rest(String),
}

impl Segment {
    /// How specific the segment is: lower wins.
    fn rank(&self) -> u8 {
        match self {
            Segment::Static(_) => 0,
            Segment::Param(_) => 1,
            Segment::Rest(_) => 2,
        }
    }
}

/// One route of the tree.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FileRoute {
    /// The file under `app/`, as written (`(app)/p/[id].tsx`).
    pub file: String,
    pub segments: Vec<Segment>,
    /// `+not-found`: what its directory's routes do not take.
    pub not_found: bool,
    /// The layouts it is drawn in, outermost first (`_layout.tsx`, `(app)/_layout.tsx`).
    pub layouts: Vec<String>,
}

impl FileRoute {
    /// The route's path pattern, as Expo Router writes it: `/p/[id]`, `/[...rest]`.
    pub fn pattern(&self) -> String {
        let parts: Vec<String> = self
            .segments
            .iter()
            .map(|s| match s {
                Segment::Static(n) => n.clone(),
                Segment::Param(n) => format!("[{n}]"),
                Segment::Rest(n) => format!("[...{n}]"),
            })
            .collect();
        let mut out = format!("/{}", parts.join("/"));
        if self.not_found {
            out.push_str(if parts.is_empty() { "+not-found" } else { "/+not-found" });
        }
        out
    }

    /// The parameters `path`'s segments give this route, when it matches them.
    fn match_segments(&self, path: &[&str]) -> Option<BTreeMap<String, String>> {
        let mut params = BTreeMap::new();
        let mut i = 0;
        for segment in &self.segments {
            match segment {
                Segment::Static(name) => {
                    if path.get(i) != Some(&name.as_str()) {
                        return None;
                    }
                    i += 1;
                }
                Segment::Param(name) => {
                    params.insert(name.clone(), decode(path.get(i)?));
                    i += 1;
                }
                Segment::Rest(name) => {
                    if i >= path.len() {
                        return None;
                    }
                    let rest: Vec<String> = path[i..].iter().map(|s| decode(s)).collect();
                    params.insert(name.clone(), rest.join("/"));
                    i = path.len();
                }
            }
        }
        // `+not-found` takes anything under its directory.
        if i == path.len() || self.not_found { Some(params) } else { None }
    }

    /// How specific the route is for a path it matches: compared from the first segment.
    fn rank(&self) -> Vec<u8> {
        let mut rank: Vec<u8> = self.segments.iter().map(Segment::rank).collect();
        rank.push(if self.not_found { 3 } else { 0 });
        rank
    }
}

/// The app's route tree for one platform.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RouteTree {
    /// In Expo Router's order: by file name.
    pub routes: Vec<FileRoute>,
    /// `+native-intent`: the app's rewrite of incoming links (native only).
    pub native_intent: Option<String>,
}

/// What a path opens.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Match<'a> {
    pub route: &'a FileRoute,
    pub params: BTreeMap<String, String>,
    /// Other routes as specific for this path (an ambiguity `bloom routes` reports).
    pub ties: Vec<&'a FileRoute>,
}

impl RouteTree {
    /// The route a path (`/p/42`, `p/42?x=1`) opens, and its parameters.
    pub fn match_path(&self, path: &str) -> Option<Match<'_>> {
        let path = path.split(['?', '#']).next().unwrap_or_default();
        let segments: Vec<&str> = path.split('/').filter(|s| !s.is_empty()).collect();
        let mut best: Option<(Vec<u8>, &FileRoute, BTreeMap<String, String>)> = None;
        let mut ties = Vec::new();
        for route in &self.routes {
            let Some(params) = route.match_segments(&segments) else { continue };
            let rank = route.rank();
            match &best {
                Some((r, _, _)) if *r < rank => {}
                Some((r, _, _)) if *r == rank => ties.push(route),
                _ => {
                    ties.clear();
                    best = Some((rank, route, params));
                }
            }
        }
        best.map(|(_, route, params)| Match { route, params, ties })
    }

    /// The patterns two or more routes share, with their files (the first is the one matched).
    pub fn ambiguities(&self) -> Vec<(String, Vec<String>)> {
        let mut by_pattern: BTreeMap<String, Vec<String>> = BTreeMap::new();
        for route in &self.routes {
            by_pattern.entry(route.pattern()).or_default().push(route.file.clone());
        }
        by_pattern.into_iter().filter(|(_, files)| files.len() > 1).collect()
    }
}

const SOURCE_EXTENSIONS: &[&str] = &["tsx", "ts", "jsx", "js"];

/// A file under `app/`, split: `(app)/p/[id]`, its platform extension, its source extension.
fn split_file(rel: &str) -> Option<(String, String)> {
    let (stem, ext) = rel.rsplit_once('.')?;
    if !SOURCE_EXTENSIONS.contains(&ext) || stem.ends_with(".d") {
        return None;
    }
    match stem.rsplit_once('.') {
        Some((base, platform)) if ["android", "ios", "native", "web"].contains(&platform) => {
            Some((base.to_string(), platform.to_string()))
        }
        _ => Some((stem.to_string(), String::new())),
    }
}

fn is_test(rel: &str) -> bool {
    rel.split('/').any(|part| part == "__tests__") || rel.contains(".test.") || rel.contains(".spec.")
}

fn collect(dir: &Path, prefix: &str, out: &mut Vec<String>) -> Result<(), String> {
    let mut entries: Vec<_> = std::fs::read_dir(dir)
        .map_err(|e| format!("{}: {e}", dir.display()))?
        .filter_map(Result::ok)
        .collect();
    entries.sort_by_key(|e| e.file_name());
    for entry in entries {
        let name = entry.file_name().to_string_lossy().into_owned();
        let rel = if prefix.is_empty() { name.clone() } else { format!("{prefix}/{name}") };
        if entry.file_type().map(|t| t.is_dir()).unwrap_or(false) {
            if name != "node_modules" && !name.starts_with('.') {
                collect(&entry.path(), &rel, out)?;
            }
        } else {
            out.push(rel);
        }
    }
    Ok(())
}

/// The route tree of the `app/` directory at `app`, for `platform`.
pub fn read(app: &Path, platform: Platform) -> Result<RouteTree, String> {
    let mut files = Vec::new();
    collect(app, "", &mut files)?;
    // Each base (`(app)/deck`) and the file this platform reads for it.
    let mut bases: BTreeMap<String, (usize, String)> = BTreeMap::new();
    for rel in files.iter().filter(|f| !is_test(f)) {
        let Some((base, ext)) = split_file(rel) else { continue };
        let Some(order) = platform.extensions().iter().position(|e| *e == ext) else { continue };
        match bases.get(&base) {
            Some((o, _)) if *o <= order => {}
            _ => {
                bases.insert(base, (order, rel.clone()));
            }
        }
    }
    let layouts: BTreeMap<String, String> = bases
        .iter()
        .filter_map(|(base, (_, file))| {
            let (dir, name) = base.rsplit_once('/').unwrap_or(("", base.as_str()));
            (name == "_layout").then(|| (dir.to_string(), file.clone()))
        })
        .collect();
    let mut routes = Vec::new();
    let mut native_intent = None;
    for (base, (_, file)) in &bases {
        let parts: Vec<&str> = base.split('/').collect();
        let (dirs, name) = parts.split_at(parts.len() - 1);
        let name = name[0];
        if name == "_layout" {
            continue;
        }
        if base == "+native-intent" {
            if platform != Platform::Web {
                native_intent = Some(file.clone());
            }
            continue;
        }
        if name == "+html" || name == "+middleware" || name.ends_with("+api") {
            continue;
        }
        let mut segments = Vec::new();
        for part in dirs.iter().copied().chain(std::iter::once(name)) {
            if part == "index" || part == "+not-found" || (part.starts_with('(') && part.ends_with(')')) {
                continue;
            }
            segments.push(segment(part).map_err(|e| format!("app/{file}: {e}"))?);
        }
        let mut chain = Vec::new();
        if let Some(root) = layouts.get("") {
            chain.push(root.clone());
        }
        for depth in 1..=dirs.len() {
            if let Some(layout) = layouts.get(&dirs[..depth].join("/")) {
                chain.push(layout.clone());
            }
        }
        routes.push(FileRoute {
            file: file.clone(),
            segments,
            not_found: name == "+not-found",
            layouts: chain,
        });
    }
    Ok(RouteTree { routes, native_intent })
}

fn segment(part: &str) -> Result<Segment, String> {
    if let Some(inner) = part.strip_prefix('[').and_then(|p| p.strip_suffix(']')) {
        let (rest, name) = match inner.strip_prefix("...") {
            Some(name) => (true, name),
            None => (false, inner),
        };
        if name.is_empty() || !name.chars().all(|c| c.is_alphanumeric() || c == '_' || c == '-') {
            return Err(format!("`{part}`: not a parameter name"));
        }
        return Ok(if rest { Segment::Rest(name.to_string()) } else { Segment::Param(name.to_string()) });
    }
    if part.contains('[') || part.contains(']') {
        return Err(format!("`{part}`: a segment is a name, `[param]` or `[...rest]`"));
    }
    Ok(Segment::Static(part.to_string()))
}

fn decode(s: &str) -> String {
    let hex = |b: u8| (b as char).to_digit(16).map(|d| d as u8);
    let bytes = s.as_bytes();
    let mut out = Vec::with_capacity(bytes.len());
    let mut i = 0;
    while i < bytes.len() {
        if let (b'%', Some(&hi), Some(&lo)) = (bytes[i], bytes.get(i + 1), bytes.get(i + 2))
            && let (Some(hi), Some(lo)) = (hex(hi), hex(lo))
        {
            out.push(hi * 16 + lo);
            i += 3;
            continue;
        }
        out.push(bytes[i]);
        i += 1;
    }
    String::from_utf8(out).unwrap_or_else(|_| s.to_string())
}

/// `bloom routes [app-dir] [--platform android|ios|web] [paths…]`: the route tree, its
/// ambiguities, and what each given path opens.
pub fn print(app: &Path, platform: Platform, paths: &[String]) -> Result<bool, String> {
    let tree = read(app, platform)?;
    for route in &tree.routes {
        let layouts = route.layouts.len();
        println!(
            "{:<40} {}  ({} layout{})",
            route.pattern(),
            route.file,
            layouts,
            if layouts == 1 { "" } else { "s" }
        );
    }
    if let Some(intent) = &tree.native_intent {
        println!("links rewritten by {intent}");
    }
    let ambiguities = tree.ambiguities();
    for (pattern, files) in &ambiguities {
        println!("ambiguous {pattern}: {} (the first is matched)", files.join(", "));
    }
    for path in paths {
        match tree.match_path(path) {
            Some(m) => println!("{path} -> {} {:?}", m.route.file, m.params),
            None => println!("{path} -> no route"),
        }
    }
    println!("{} routes", tree.routes.len());
    Ok(true)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn tree(files: &[&str], platform: Platform) -> RouteTree {
        let dir = std::env::temp_dir().join(format!(
            "bloom-file-routes-{}-{}",
            std::process::id(),
            files.join("|").len() + files.len() * 1000 + platform as usize
        ));
        let _ = std::fs::remove_dir_all(&dir);
        for f in files {
            let path = dir.join(f);
            std::fs::create_dir_all(path.parent().unwrap()).unwrap();
            std::fs::write(path, "export default function Screen() { return null; }\n").unwrap();
        }
        let out = read(&dir, platform).unwrap();
        let _ = std::fs::remove_dir_all(&dir);
        out
    }

    fn opens(tree: &RouteTree, path: &str) -> Option<(String, Vec<(String, String)>)> {
        tree.match_path(path).map(|m| (m.route.file.clone(), m.params.into_iter().collect()))
    }

    #[test]
    fn groups_and_index_add_no_segment_and_layouts_chain_down() {
        let t = tree(
            &[
                "_layout.tsx",
                "(app)/_layout.tsx",
                "(app)/(tabs)/_layout.tsx",
                "(app)/(tabs)/(home)/index.tsx",
                "(app)/settings/index.tsx",
                "(app)/settings/privacy.tsx",
            ],
            Platform::Android,
        );
        let home = t.routes.iter().find(|r| r.file == "(app)/(tabs)/(home)/index.tsx").unwrap();
        assert_eq!(home.pattern(), "/");
        assert_eq!(home.layouts, ["_layout.tsx", "(app)/_layout.tsx", "(app)/(tabs)/_layout.tsx"]);
        assert_eq!(opens(&t, "/settings").unwrap().0, "(app)/settings/index.tsx");
        assert_eq!(opens(&t, "/settings/privacy?x=1").unwrap().0, "(app)/settings/privacy.tsx");
        assert_eq!(opens(&t, "/settings/nope"), None);
    }

    #[test]
    fn a_name_beats_a_parameter_which_beats_the_rest_then_not_found() {
        let t = tree(
            &[
                "(app)/[username]/index.tsx",
                "(app)/[username]/about.tsx",
                "(app)/c/[username].tsx",
                "(app)/mention.tsx",
                "(app)/docs/[...path].tsx",
                "(app)/+not-found.tsx",
            ],
            Platform::Android,
        );
        assert_eq!(opens(&t, "/mention").unwrap().0, "(app)/mention.tsx");
        assert_eq!(
            opens(&t, "/nate").unwrap(),
            ("(app)/[username]/index.tsx".into(), vec![("username".into(), "nate".into())])
        );
        assert_eq!(opens(&t, "/c/oxy").unwrap().0, "(app)/c/[username].tsx");
        assert_eq!(opens(&t, "/nate/about").unwrap().0, "(app)/[username]/about.tsx");
        assert_eq!(
            opens(&t, "/docs/a/b%20c%C3%A9%zz").unwrap(),
            ("(app)/docs/[...path].tsx".into(), vec![("path".into(), "a/b cé%zz".into())])
        );
        assert_eq!(opens(&t, "/a/b/c").unwrap().0, "(app)/+not-found.tsx");
        assert_eq!(t.routes.iter().find(|r| r.not_found).unwrap().pattern(), "/+not-found");
    }

    #[test]
    fn each_platform_reads_its_most_specific_file() {
        let files =
            ["(app)/deck.tsx", "(app)/deck.web.tsx", "you/index.native.tsx", "you/index.tsx", "only.ios.tsx"];
        let android = tree(&files, Platform::Android);
        let files_of = |t: &RouteTree| t.routes.iter().map(|r| r.file.clone()).collect::<Vec<_>>();
        assert_eq!(files_of(&android), ["(app)/deck.tsx", "you/index.native.tsx"]);
        let web = tree(&files, Platform::Web);
        assert_eq!(files_of(&web), ["(app)/deck.web.tsx", "you/index.tsx"]);
        let ios = tree(&files, Platform::Ios);
        assert_eq!(files_of(&ios), ["(app)/deck.tsx", "only.ios.tsx", "you/index.native.tsx"]);
    }

    #[test]
    fn tests_layouts_and_web_files_are_not_routes() {
        let t = tree(
            &[
                "_layout.tsx",
                "+html.tsx",
                "+native-intent.tsx",
                "api/hello+api.ts",
                "(app)/__tests__/a.test.tsx",
                "(app)/b.test.tsx",
                "types.d.ts",
                "index.tsx",
            ],
            Platform::Android,
        );
        assert_eq!(t.routes.iter().map(|r| r.file.as_str()).collect::<Vec<_>>(), ["index.tsx"]);
        assert_eq!(t.native_intent.as_deref(), Some("+native-intent.tsx"));
    }

    #[test]
    fn two_routes_of_one_pattern_are_ambiguous_and_the_first_is_matched() {
        let t = tree(&["(app)/index.tsx", "(auth)/index.tsx"], Platform::Android);
        assert_eq!(
            t.ambiguities(),
            vec![("/".to_string(), vec!["(app)/index.tsx".into(), "(auth)/index.tsx".into()])]
        );
        let m = t.match_path("/").unwrap();
        assert_eq!(m.route.file, "(app)/index.tsx");
        assert_eq!(m.ties.len(), 1);
    }

    #[test]
    fn a_malformed_segment_names_its_file() {
        let dir = std::env::temp_dir().join(format!("bloom-file-routes-bad-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(dir.join("p")).unwrap();
        std::fs::write(dir.join("p/[id.tsx"), "").unwrap();
        let err = read(&dir, Platform::Android).unwrap_err();
        let _ = std::fs::remove_dir_all(&dir);
        assert!(err.contains("app/p/[id.tsx"), "{err}");
    }
}
