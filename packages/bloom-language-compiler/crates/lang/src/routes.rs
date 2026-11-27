//! Typed routes (spec 9): the app's Expo Router tree (`app/`) as a route
//! table, so `navigate("/settings/notifications")` is checked at compile time.
//!
//! A file is a route: groups (`(tabs)`) are dropped, `index` is its folder,
//! `[id]` is a parameter and `[...rest]` a catch-all; `_layout` and the `+`
//! files (`+not-found`, `+html`) are not routes. The tree is read once and
//! read again when a folder's modified time changes (a file added, removed
//! or renamed), and its folders are a compile's dependencies, so a cache
//! keyed on them invalidates when `app/` changes.

use std::path::{Path, PathBuf};
use std::rc::Rc;
use std::time::{Duration, SystemTime};

use rustc_hash::FxHashMap as HashMap;

use crate::Options;

/// The routes of one `app/` tree.
#[derive(Debug)]
pub struct Routes {
    /// Each route's pattern (`/`, `/settings/notifications`, `/posts/[id]`), sorted.
    pub patterns: Vec<String>,
    /// Every folder of the tree, with its modified time when read.
    pub folders: Vec<(PathBuf, Option<SystemTime>)>,
    /// When the tree was read.
    pub read_at: SystemTime,
}

/// How long after a folder changes its modified time may still not show the next change:
/// file times come from the kernel's coarse clock, a tick of a few milliseconds, so two
/// writes in one tick leave one time. A folder that changed this close to the read is read
/// again (git's "racily clean" rule).
const RACY: Duration = Duration::from_secs(2);

/// Whether `folder` is as the read at `read_at` saw it, at `modified`.
fn unchanged(folder: &Path, modified: Option<SystemTime>, read_at: SystemTime) -> bool {
    let settled = modified.is_none_or(|m| read_at.duration_since(m).is_ok_and(|age| age >= RACY));
    settled && modified_time(folder) == modified
}

thread_local! {
    static TREES: crate::ts::ThreadCache<HashMap<PathBuf, Rc<Routes>>> = crate::ts::thread_cache(HashMap::default());
}

/// The app's routes: from `Options::app`, else `app/` or `src/app/` under the root.
pub fn routes(options: &Options) -> Option<Rc<Routes>> {
    let dir = match &options.app {
        Some(app) => options.root.as_ref().map_or_else(|| app.clone(), |root| root.join(app)),
        None => {
            let root = options.root.as_ref()?;
            ["app", "src/app"].iter().map(|dir| root.join(dir)).find(|dir| dir.is_dir())?
        }
    };
    let cached = TREES.with(|trees| trees.borrow().get(&dir).cloned());
    if let Some(routes) = cached
        && routes.folders.iter().all(|(folder, modified)| unchanged(folder, *modified, routes.read_at))
    {
        return Some(routes);
    }
    let mut routes = Routes { patterns: Vec::new(), folders: Vec::new(), read_at: SystemTime::now() };
    scan(&dir, &mut Vec::new(), &mut routes);
    routes.patterns.sort();
    routes.patterns.dedup();
    let routes = Rc::new(routes);
    TREES.with(|trees| trees.borrow_mut().insert(dir, routes.clone()));
    Some(routes)
}

/// Forgets every tree read (an editor's `clear_caches`).
pub fn clear() {
    TREES.with(|trees| trees.borrow_mut().clear());
}

fn modified_time(path: &Path) -> Option<SystemTime> {
    std::fs::metadata(path).and_then(|m| m.modified()).ok()
}

const EXTENSIONS: &[&str] = &["tsx", "ts", "jsx", "js", "bloom"];

fn scan(dir: &Path, segments: &mut Vec<String>, routes: &mut Routes) {
    routes.folders.push((dir.to_path_buf(), modified_time(dir)));
    let Ok(entries) = std::fs::read_dir(dir) else { return };
    let mut entries: Vec<_> = entries.flatten().collect();
    entries.sort_by_key(|entry| entry.file_name());
    for entry in entries {
        let name = entry.file_name().to_string_lossy().into_owned();
        if name.starts_with('.') {
            continue;
        }
        let path = entry.path();
        if path.is_dir() {
            let group = name.starts_with('(') && name.ends_with(')');
            if !group {
                segments.push(name);
            }
            scan(&path, segments, routes);
            if !group {
                segments.pop();
            }
            continue;
        }
        let Some((stem, extension)) = name.rsplit_once('.') else { continue };
        if !EXTENSIONS.contains(&extension) || stem.ends_with(".d") {
            continue;
        }
        // `settings.web.tsx` is `settings` on one platform.
        let stem = ["web", "native", "ios", "android"]
            .iter()
            .find_map(|platform| stem.strip_suffix(&format!(".{platform}")))
            .unwrap_or(stem);
        if stem.starts_with('_') || stem.starts_with('+') {
            continue;
        }
        let mut route: Vec<&str> = segments.iter().map(String::as_str).collect();
        if stem != "index" {
            route.push(stem);
        }
        routes.patterns.push(format!("/{}", route.join("/")));
    }
}

/// A route's parameters (`id` in `/posts/[id]`, `rest` in `/[...rest]`).
pub fn params(pattern: &str) -> Vec<&str> {
    pattern
        .split('/')
        .filter_map(|segment| segment.strip_prefix('[')?.strip_suffix(']'))
        .map(|param| param.trim_start_matches("..."))
        .collect()
}

/// The route `path` names: the pattern itself, or a concrete path one matches
/// (`/posts/42` is `/posts/[id]`). A query or a fragment is not the route's.
pub fn find<'r>(routes: &'r Routes, path: &str) -> Option<&'r str> {
    let path = path.split(['?', '#']).next().unwrap_or_default();
    let path = if path.len() > 1 { path.trim_end_matches('/') } else { path };
    if let Some(exact) = routes.patterns.iter().find(|pattern| *pattern == path) {
        return Some(exact);
    }
    let wanted: Vec<&str> = path.split('/').filter(|s| !s.is_empty()).collect();
    routes.patterns.iter().map(String::as_str).find(|pattern| {
        let segments: Vec<&str> = pattern.split('/').filter(|s| !s.is_empty()).collect();
        matches(&segments, &wanted)
    })
}

fn matches(pattern: &[&str], path: &[&str]) -> bool {
    match (pattern.first(), path.first()) {
        (None, None) => true,
        (Some(segment), _) if segment.starts_with("[...") => !path.is_empty(),
        (Some(segment), Some(part)) => {
            (segment == part || (segment.starts_with('[') && segment.ends_with(']')))
                && matches(&pattern[1..], &path[1..])
        }
        _ => false,
    }
}
