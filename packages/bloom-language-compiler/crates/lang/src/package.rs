//! `Package.bloom`: the package manifest (ADR 0002, section 2).
//!
//! The manifest is a declarative subset of Bloom: one `let package = Package(…)`
//! whose arguments are string, integer and boolean literals, arrays, and calls
//! of `Package` and the leading-dot members (`.app`, `.module`, `.iOS`, …). The
//! compiler evaluates it with no arbitrary code: there are no variables, no
//! functions, no interpolation and no imports, so reading a manifest can never
//! run anything.
//!
//! ```swift
//! let package = Package(
//!   name: "Mention",
//!   platforms: [.iOS(17), .android(26), .web],
//!   dependencies: [.package("BloomData", from: "2.0.0")],
//!   targets: [
//!     .app("Mention", dependencies: ["Posts"]),
//!     .module("Posts"),
//!     .bindings("Sentry", npm: "@sentry/react-native@6.2.0"),
//!     .tests("PostsTests", dependencies: ["Posts"]),
//!   ]
//! )
//! ```

use std::fmt;
use std::path::PathBuf;

use crate::ast::Span;
use crate::diagnostic::{Diagnostic, closest};
use crate::lexer::{self, P, RawPart, Tok, Token};

/// The manifest's file name, at the package root.
pub const MANIFEST: &str = "Package.bloom";
/// The lockfile beside it.
pub const RESOLVED: &str = "Package.resolved";

/// An evaluated `Package.bloom`.
#[derive(Debug, Clone, PartialEq)]
pub struct Manifest {
    pub name: String,
    pub name_span: Span,
    pub platforms: Vec<Platform>,
    pub dependencies: Vec<PackageDependency>,
    pub targets: Vec<Target>,
    /// `app: App(…)`: what the platform builds say about the app (its id, version, icon,
    /// splash, URL schemes and permissions). Every field has a default.
    pub app: AppSettings,
    /// Where a new `.package(…)` goes: the `dependencies:` array's `]`, or,
    /// without one, the `Package(` call's `)`.
    pub insert_dependency_at: InsertAt,
}

/// `app: App(id: "so.oxy.mention", version: "1.2.0", build: 42, displayName: "Mention",
/// schemes: ["mention"], icon: "Resources/AppIcon.png", splash: "#FFFFFF",
/// splashImage: "Resources/Splash.png", permissions: [.camera, .notifications])`.
/// `bloom build` writes the native projects' manifests from it (ADR 0002, section 7).
#[derive(Debug, Clone, Default, PartialEq)]
pub struct AppSettings {
    /// The application id (bundle identifier); by default `so.bloom.<name>`.
    pub id: Option<String>,
    /// The version people see; by default "1.0.0".
    pub version: Option<String>,
    /// The build number (Android's version code); by default 1.
    pub build: Option<u32>,
    /// The name under the icon; by default the package's name.
    pub display_name: Option<String>,
    /// The URL schemes deep links use (`demo://post/2`); by default the package's name, lowercased.
    pub schemes: Vec<String>,
    /// A square PNG, relative to the package root; by default Bloom's icon.
    pub icon: Option<String>,
    /// The launch background, `#RRGGBB`; by default white.
    pub splash: Option<String>,
    /// An image centered on the launch background, relative to the package root.
    pub splash_image: Option<String>,
    pub permissions: Vec<Permission>,
}

/// A permission the app asks for. Each names the platforms' own: `.camera` is Android's
/// `CAMERA` and iOS's camera usage; a string is an Android permission as written.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Permission {
    Camera,
    Microphone,
    Location,
    Notifications,
    Contacts,
    Photos,
    Biometrics,
    Vibrate,
    Android(String),
}

/// The leading-dot permissions, by name.
pub const PERMISSIONS: &[&str] =
    &["camera", "microphone", "location", "notifications", "contacts", "photos", "biometrics", "vibrate"];

impl Permission {
    /// The Android permissions it is.
    pub fn android(&self) -> Vec<String> {
        let names: &[&str] = match self {
            Permission::Camera => &["CAMERA"],
            Permission::Microphone => &["RECORD_AUDIO"],
            Permission::Location => &["ACCESS_COARSE_LOCATION", "ACCESS_FINE_LOCATION"],
            Permission::Notifications => &["POST_NOTIFICATIONS"],
            Permission::Contacts => &["READ_CONTACTS"],
            Permission::Photos => &["READ_MEDIA_IMAGES", "READ_MEDIA_VIDEO"],
            Permission::Biometrics => &["USE_BIOMETRIC"],
            Permission::Vibrate => &["VIBRATE"],
            Permission::Android(name) => return vec![name.clone()],
        };
        names.iter().map(|n| format!("android.permission.{n}")).collect()
    }
}

/// A place in the manifest's source where `bloom add` inserts text.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum InsertAt {
    /// Before the `]` at this offset, into an array with this many elements.
    Array { close: u32, len: usize },
    /// Before the `)` at this offset: a new `dependencies:` argument.
    Call { close: u32 },
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Platform {
    Ios(u32),
    Android(u32),
    Web,
}

impl fmt::Display for Platform {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Platform::Ios(v) => write!(f, "iOS {v}"),
            Platform::Android(v) => write!(f, "Android API {v}"),
            Platform::Web => f.write_str("web"),
        }
    }
}

/// `.package("BloomData", from: "2.0.0")`: another Bloom package.
#[derive(Debug, Clone, PartialEq)]
pub struct PackageDependency {
    pub name: String,
    pub requirement: Requirement,
    /// The npm package that carries it (`npm:`), when it is not one the toolchain knows.
    pub npm: Option<String>,
    pub span: Span,
}

impl PackageDependency {
    /// The npm package underneath: `npm:`, or the toolchain's own mapping.
    pub fn npm_name(&self) -> Option<String> {
        self.npm.clone().or_else(|| known_package(&self.name).map(|k| k.npm.to_string()))
    }
}

/// A version requirement.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Requirement {
    /// `from: "2.0.0"`: that version or a later one with the same major.
    From(Version),
    /// `exact: "2.0.0"`.
    Exact(Version),
    /// `path: "../BloomData"`: a package on disk.
    Path(String),
}

impl Requirement {
    pub fn allows(&self, version: &Version) -> bool {
        match self {
            Requirement::From(min) => {
                version >= min && version.major == min.major && (version.pre.is_none() || min.pre.is_some())
            }
            Requirement::Exact(v) => v == version,
            Requirement::Path(_) => true,
        }
    }
}

impl fmt::Display for Requirement {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Requirement::From(v) => write!(f, "from: {v}"),
            Requirement::Exact(v) => write!(f, "exact: {v}"),
            Requirement::Path(p) => write!(f, "path: {p}"),
        }
    }
}

/// `major.minor.patch[-pre]`, ordered as semver orders them.
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct Version {
    pub major: u64,
    pub minor: u64,
    pub patch: u64,
    pub pre: Option<String>,
}

impl Version {
    pub fn parse(text: &str) -> Option<Version> {
        let text = text.trim().trim_start_matches('v');
        let (core, pre) = match text.split_once('-') {
            Some((core, pre)) => (core, Some(pre.to_string())),
            None => (text.split('+').next().unwrap_or(text), None),
        };
        let mut parts = core.split('.').map(|p| p.parse::<u64>().ok());
        let version = Version { major: parts.next()??, minor: parts.next()??, patch: parts.next()??, pre };
        parts.next().is_none().then_some(version)
    }
}

impl PartialOrd for Version {
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for Version {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        (self.major, self.minor, self.patch).cmp(&(other.major, other.minor, other.patch)).then_with(
            || match (&self.pre, &other.pre) {
                (None, None) => std::cmp::Ordering::Equal,
                (None, Some(_)) => std::cmp::Ordering::Greater,
                (Some(_), None) => std::cmp::Ordering::Less,
                (Some(a), Some(b)) => a.cmp(b),
            },
        )
    }
}

impl fmt::Display for Version {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}.{}.{}", self.major, self.minor, self.patch)?;
        if let Some(pre) = &self.pre {
            write!(f, "-{pre}")?;
        }
        Ok(())
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TargetKind {
    /// `.app`: the app, its entry point. Nothing depends on it.
    App,
    /// `.module`: a library module of the package.
    Module,
    /// `.bindings(…, npm: "pkg@version")`: an `extern` binding module, the only
    /// place a JS package crosses into Bloom (ADR 0002, section 4).
    Bindings { npm: String },
    /// `.tests`: test files, run by `bloom test`.
    Tests,
    /// `.native("Haptics", kotlin: "…", swift: "…")`: a Bloom native module (ADR 0002,
    /// section 7). Its Bloom interface is the target's `.bloom` files (an `extern native`
    /// block); its implementations are Kotlin (Android) and Swift (iOS) sources, by
    /// default `Native/<Name>/android` and `Native/<Name>/ios`.
    Native { kotlin: Option<String>, swift: Option<String> },
}

impl TargetKind {
    pub fn word(&self) -> &'static str {
        match self {
            TargetKind::App => "app",
            TargetKind::Module => "module",
            TargetKind::Bindings { .. } => "bindings",
            TargetKind::Tests => "tests",
            TargetKind::Native { .. } => "native",
        }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct Target {
    pub kind: TargetKind,
    pub name: String,
    pub name_span: Span,
    pub dependencies: Vec<(String, Span)>,
    /// `path:`: the directory, relative to the package root, when not the default.
    pub path: Option<String>,
    pub span: Span,
    /// Where a new dependency goes (as [`Manifest::insert_dependency_at`]).
    pub insert_dependency_at: InsertAt,
}

impl Target {
    /// The target's directory, relative to the package root: `Sources/<Name>`,
    /// `Bindings/<Name>` or `Tests/<Name>` unless `path:` says otherwise.
    pub fn dir(&self) -> PathBuf {
        if let Some(path) = &self.path {
            return PathBuf::from(path);
        }
        let base = match self.kind {
            TargetKind::App | TargetKind::Module => "Sources",
            TargetKind::Bindings { .. } => "Bindings",
            TargetKind::Tests => "Tests",
            TargetKind::Native { .. } => "Native",
        };
        PathBuf::from(base).join(&self.name)
    }

    /// A `.native` target's Kotlin and Swift source directories, relative to the package root.
    pub fn native_sources(&self) -> Option<(PathBuf, PathBuf)> {
        let TargetKind::Native { kotlin, swift } = &self.kind else { return None };
        let dir = self.dir();
        Some((
            kotlin.as_ref().map(PathBuf::from).unwrap_or_else(|| dir.join("android")),
            swift.as_ref().map(PathBuf::from).unwrap_or_else(|| dir.join("ios")),
        ))
    }

    /// The npm package and version of a `.bindings` target.
    pub fn npm(&self) -> Option<(&str, Option<&str>)> {
        let TargetKind::Bindings { npm } = &self.kind else { return None };
        Some(split_npm_spec(npm))
    }
}

/// `@scope/name@1.2.3` as name and version.
pub fn split_npm_spec(spec: &str) -> (&str, Option<&str>) {
    let at = spec.char_indices().skip(1).find(|&(_, c)| c == '@').map(|(i, _)| i);
    match at {
        Some(i) => (&spec[..i], Some(&spec[i + 1..])),
        None => (spec, None),
    }
}

/// A Bloom package the toolchain ships or knows, and the npm packages it
/// stands on (ADR 0002: `Bloom` and `BloomData` map to today's runtime).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct KnownPackage {
    pub name: &'static str,
    pub npm: &'static str,
    /// Further npm packages it needs at runtime.
    pub runtime: &'static [&'static str],
    /// Its import specifier in emitted code (what `import Name` maps to), when
    /// its names are imported from a module rather than built into the language.
    pub specifier: Option<&'static str>,
}

pub const KNOWN_PACKAGES: &[KnownPackage] = &[
    KnownPackage {
        name: "Bloom",
        npm: "@oxy.so/bloom",
        runtime: &["@oxy.so/bloom-language"],
        // The UI nodes and modifiers are the language's own: nothing to import.
        specifier: None,
    },
    KnownPackage {
        name: "BloomData",
        npm: "@oxy.so/bloom-data",
        runtime: &[],
        specifier: Some("bloom/data"),
    },
    KnownPackage {
        name: "BloomRouter",
        npm: "@oxy.so/bloom-language",
        runtime: &[],
        specifier: Some("bloom/router"),
    },
];

pub fn known_package(name: &str) -> Option<&'static KnownPackage> {
    KNOWN_PACKAGES.iter().find(|k| k.name == name)
}

// ---- reading ---------------------------------------------------------------

/// Reads and evaluates a manifest. Errors are rendered against `source` and `filename`.
pub fn parse(source: &str, filename: &str) -> Result<Manifest, Vec<Diagnostic>> {
    let mut errors = Vec::new();
    let manifest = read(source, &mut errors);
    for diagnostic in &mut errors {
        diagnostic.render(source, filename);
    }
    match manifest {
        Some(manifest) if errors.is_empty() => Ok(manifest),
        _ => Err(errors),
    }
}

/// A value of the manifest's subset.
#[derive(Debug, Clone)]
enum Value {
    Str(String),
    Int(i64),
    Array(Vec<Spanned>, Span),
    /// `Package(…)` or `.app(…)` (`member` is true for the leading dot); `.web` has no arguments.
    Call {
        name: String,
        member: bool,
        args: Option<(Vec<Arg>, Span)>,
    },
}

#[derive(Debug, Clone)]
struct Spanned {
    value: Value,
    span: Span,
}

#[derive(Debug, Clone)]
struct Arg {
    label: Option<(String, Span)>,
    value: Spanned,
}

struct Reader<'s> {
    tokens: Vec<Token>,
    at: usize,
    source: &'s str,
}

const SPEC: &str = "packagebloom";

fn syntax(span: Span, message: impl Into<String>) -> Diagnostic {
    Diagnostic::error("B0810", span, message).toolchain(SPEC)
}

// The first syntax error ends a manifest's read, so the error path is cold.
#[allow(clippy::result_large_err)]
impl Reader<'_> {
    fn peek(&self) -> &Token {
        &self.tokens[self.at.min(self.tokens.len() - 1)]
    }

    fn bump(&mut self) -> Token {
        let token = self.peek().clone();
        if self.at < self.tokens.len() - 1 {
            self.at += 1;
        }
        token
    }

    fn eat(&mut self, p: P) -> bool {
        if self.peek().tok == Tok::P(p) {
            self.bump();
            true
        } else {
            false
        }
    }

    fn expect(&mut self, p: P, what: &str) -> Result<Span, Diagnostic> {
        let token = self.peek().clone();
        if token.tok == Tok::P(p) {
            self.bump();
            Ok(token.span)
        } else {
            Err(syntax(token.span, format!("expected {what}, found {}", self.describe(&token)))
                .label(format!("expected `{}`", p.text())))
        }
    }

    fn describe(&self, token: &Token) -> String {
        match &token.tok {
            Tok::Eof => "the end of the file".into(),
            _ => format!("`{}`", &self.source[token.span.start as usize..token.span.end as usize]),
        }
    }

    /// A name: an identifier, or a keyword used as one (`from:`, `default`).
    fn name(&mut self) -> Option<(String, Span)> {
        let token = self.peek().clone();
        let name = match &token.tok {
            Tok::Ident(name) => name.clone(),
            Tok::Kw(kw) => kw.word().to_string(),
            _ => return None,
        };
        self.bump();
        Some((name, token.span))
    }

    fn value(&mut self) -> Result<Spanned, Diagnostic> {
        let token = self.peek().clone();
        let start = token.span;
        let value = match &token.tok {
            Tok::Str { parts, .. } => {
                self.bump();
                let mut text = String::new();
                for part in parts {
                    match part {
                        RawPart::Text(t) => text.push_str(t),
                        RawPart::Interp(span) => {
                            return Err(syntax(*span, "a manifest has no interpolation")
                                .label("write the text out")
                                .help("Package.bloom is evaluated without running code: only literals, arrays and calls"));
                        }
                    }
                }
                Value::Str(text)
            }
            Tok::Int(n) => {
                self.bump();
                Value::Int(*n)
            }
            Tok::P(P::LBracket) => {
                self.bump();
                let mut items = Vec::new();
                loop {
                    if let Tok::P(P::RBracket) = self.peek().tok {
                        break;
                    }
                    items.push(self.value()?);
                    if !self.eat(P::Comma) {
                        break;
                    }
                }
                let close = self.expect(P::RBracket, "`,` or `]`")?;
                return Ok(Spanned { value: Value::Array(items, close), span: start.to(close) });
            }
            Tok::P(P::Dot) => {
                self.bump();
                let Some((name, span)) = self.name() else {
                    let found = self.peek().clone();
                    return Err(syntax(
                        found.span,
                        format!("expected a member after `.`, found {}", self.describe(&found)),
                    )
                    .label("such as `.app(\"Name\")` or `.web`"));
                };
                let args = self.args()?;
                let end = args.as_ref().map_or(span, |(_, close)| *close);
                return Ok(Spanned { value: Value::Call { name, member: true, args }, span: start.to(end) });
            }
            Tok::Ident(name) => {
                let name = name.clone();
                self.bump();
                let args = self.args()?;
                let Some(args) = args else {
                    return Err(syntax(start, format!("`{name}` is not a value here"))
                        .label("a manifest has no variables")
                        .help("write a string (\"…\"), a number, an array or a call such as `.module(\"Name\")`"));
                };
                let end = args.1;
                return Ok(Spanned {
                    value: Value::Call { name, member: false, args: Some(args) },
                    span: start.to(end),
                });
            }
            _ => {
                return Err(syntax(start, format!("expected a value, found {}", self.describe(&token)))
                    .label("a string, number, array or call"));
            }
        };
        Ok(Spanned { value, span: start })
    }

    /// `(label: value, value, …)`, when there is a `(`.
    fn args(&mut self) -> Result<Option<(Vec<Arg>, Span)>, Diagnostic> {
        if !self.eat(P::LParen) {
            return Ok(None);
        }
        let mut args = Vec::new();
        loop {
            if let Tok::P(P::RParen) = self.peek().tok {
                break;
            }
            let save = self.at;
            let label = match self.name() {
                Some(name) if self.eat(P::Colon) => Some(name),
                _ => {
                    self.at = save;
                    None
                }
            };
            let value = self.value()?;
            args.push(Arg { label, value });
            if !self.eat(P::Comma) {
                break;
            }
        }
        let close = self.expect(P::RParen, "`,` or `)`")?;
        Ok(Some((args, close)))
    }
}

fn read(source: &str, errors: &mut Vec<Diagnostic>) -> Option<Manifest> {
    let lexed = lexer::lex(source, 0, source.len());
    errors.extend(lexed.diagnostics);
    if !errors.is_empty() {
        return None;
    }
    let tokens: Vec<Token> = lexed.tokens.into_iter().filter(|t| t.tok != Tok::Newline).collect();
    let mut reader = Reader { tokens, at: 0, source };
    let head = reader.peek().clone();
    let is_let = matches!(&head.tok, Tok::Kw(kw) if kw.word() == "let");
    let name = if is_let {
        reader.bump();
        reader.name()
    } else {
        None
    };
    if name.as_ref().map(|(n, _)| n.as_str()) != Some("package") || !reader.eat(P::Eq) {
        errors.push(
            syntax(head.span, "a manifest is `let package = Package(…)`")
                .label("expected `let package =` here")
                .help("start Package.bloom with `let package = Package(name: \"MyApp\", targets: [.app(\"MyApp\")])`"),
        );
        return None;
    }
    let value = match reader.value() {
        Ok(value) => value,
        Err(error) => {
            errors.push(error);
            return None;
        }
    };
    let trailing = reader.peek().clone();
    if trailing.tok != Tok::Eof {
        errors.push(
            syntax(trailing.span, "a manifest declares only `package`")
                .label("nothing may follow `Package(…)`")
                .help("Package.bloom is evaluated without running code"),
        );
        return None;
    }
    let mut eval = Eval { errors };
    eval.package(value)
}

struct Eval<'e> {
    errors: &'e mut Vec<Diagnostic>,
}

/// A call's arguments by label, checked against the labels it takes.
struct Labeled {
    args: Vec<Arg>,
    close: Span,
    span: Span,
}

impl Eval<'_> {
    fn error(&mut self, diagnostic: Diagnostic) {
        self.errors.push(diagnostic);
    }

    /// The arguments of `call`, each label one of `labels` (the unlabeled first
    /// one, when `positional` names it, is given that label).
    fn labeled(
        &mut self,
        call: Spanned,
        what: &str,
        positional: Option<&str>,
        labels: &[&str],
    ) -> Option<Labeled> {
        let span = call.span;
        let Value::Call { args: Some((args, close)), .. } = call.value else {
            self.error(
                Diagnostic::error("B0811", span, format!("`{what}` takes arguments"))
                    .label(format!("write `{what}(…)`"))
                    .toolchain(SPEC),
            );
            return None;
        };
        let mut out = Vec::new();
        for (index, mut arg) in args.into_iter().enumerate() {
            match &arg.label {
                None if index == 0 && positional.is_some() => {
                    arg.label = Some((positional.unwrap_or_default().to_string(), arg.value.span));
                }
                None => {
                    let expected: Vec<String> = labels.iter().map(|l| format!("`{l}:`")).collect();
                    self.error(
                        Diagnostic::error(
                            "B0811",
                            arg.value.span,
                            format!("this argument of `{what}` needs a label"),
                        )
                        .label(format!("one of {}", expected.join(", ")))
                        .toolchain(SPEC),
                    );
                    continue;
                }
                Some((label, label_span)) => {
                    if !labels.contains(&label.as_str()) {
                        let help =
                            closest(label, labels.iter().copied()).map(|n| format!("did you mean `{n}:`?"));
                        let expected: Vec<String> = labels.iter().map(|l| format!("`{l}:`")).collect();
                        self.error(
                            Diagnostic::error(
                                "B0811",
                                *label_span,
                                format!("`{what}` has no argument `{label}:`"),
                            )
                            .label(format!("it takes {}", expected.join(", ")))
                            .maybe_help(help)
                            .toolchain(SPEC),
                        );
                        continue;
                    }
                    if out.iter().any(|a: &Arg| a.label.as_ref().map(|l| &l.0) == Some(label)) {
                        self.error(
                            Diagnostic::error("B0811", *label_span, format!("`{label}:` is given twice"))
                                .label("remove one")
                                .toolchain(SPEC),
                        );
                        continue;
                    }
                }
            }
            out.push(arg);
        }
        Some(Labeled { args: out, close, span })
    }

    fn take(&mut self, args: &mut Labeled, label: &str) -> Option<Spanned> {
        let at = args.args.iter().position(|a| a.label.as_ref().is_some_and(|l| l.0 == label))?;
        Some(args.args.remove(at).value)
    }

    fn required(&mut self, args: &mut Labeled, label: &str, what: &str) -> Option<Spanned> {
        let value = self.take(args, label);
        if value.is_none() {
            self.error(
                Diagnostic::error("B0812", args.span, format!("`{what}` needs `{label}:`"))
                    .label(format!("missing `{label}:`"))
                    .toolchain(SPEC),
            );
        }
        value
    }

    fn string(&mut self, value: Spanned, what: &str) -> Option<(String, Span)> {
        match value.value {
            Value::Str(s) => Some((s, value.span)),
            _ => {
                self.error(
                    Diagnostic::error("B0811", value.span, format!("{what} is a string"))
                        .label("expected \"…\"")
                        .toolchain(SPEC),
                );
                None
            }
        }
    }

    fn array(&mut self, value: Spanned, what: &str) -> Option<(Vec<Spanned>, Span)> {
        match value.value {
            Value::Array(items, close) => Some((items, close)),
            _ => {
                self.error(
                    Diagnostic::error("B0811", value.span, format!("{what} is an array"))
                        .label("expected `[…]`")
                        .toolchain(SPEC),
                );
                None
            }
        }
    }

    /// A non-empty Bloom name: `Feed`, `MentionAPI`.
    fn module_name(&mut self, name: &str, span: Span, what: &str) -> bool {
        let valid = name.chars().next().is_some_and(|c| c.is_ascii_uppercase())
            && name.chars().all(|c| c.is_ascii_alphanumeric() || c == '_');
        if !valid {
            self.error(
                Diagnostic::error("B0813", span, format!("`{name}` is not a {what} name"))
                    .label("a name starts with a capital letter and has letters, digits and `_`")
                    .help("module names are imported as written: `import Feed`")
                    .toolchain(SPEC),
            );
        }
        valid
    }

    fn package(&mut self, value: Spanned) -> Option<Manifest> {
        let call_name = match &value.value {
            Value::Call { name, member: false, .. } => name.clone(),
            _ => String::new(),
        };
        if call_name != "Package" {
            self.error(
                Diagnostic::error("B0811", value.span, "`package` is a `Package(…)`")
                    .label("expected `Package(name: …, targets: […])`")
                    .toolchain(SPEC),
            );
            return None;
        }
        let mut args =
            self.labeled(value, "Package", None, &["name", "platforms", "dependencies", "targets", "app"])?;
        let name = self.required(&mut args, "name", "Package").and_then(|v| self.string(v, "`name:`"));
        let platforms = match self.take(&mut args, "platforms") {
            Some(v) => {
                self.array(v, "`platforms:`").map(|(items, _)| self.platforms(items)).unwrap_or_default()
            }
            None => vec![Platform::Ios(17), Platform::Android(26), Platform::Web],
        };
        let mut insert = InsertAt::Call { close: args.close.start };
        let mut dependencies = Vec::new();
        if let Some(v) = self.take(&mut args, "dependencies")
            && let Some((items, close)) = self.array(v, "`dependencies:`")
        {
            insert = InsertAt::Array { close: close.start, len: items.len() };
            for item in items {
                if let Some(dep) = self.dependency(item) {
                    dependencies.push(dep);
                }
            }
        }
        let mut targets = Vec::new();
        if let Some(v) = self.required(&mut args, "targets", "Package")
            && let Some((items, _)) = self.array(v, "`targets:`")
        {
            for item in items {
                if let Some(target) = self.target(item) {
                    targets.push(target);
                }
            }
        }
        let app = match self.take(&mut args, "app") {
            Some(v) => self.app(v).unwrap_or_default(),
            None => AppSettings::default(),
        };
        let (name, name_span) = name?;
        self.module_name(&name, name_span, "package");
        let manifest = Manifest {
            name,
            name_span,
            platforms,
            dependencies,
            targets,
            app,
            insert_dependency_at: insert,
        };
        self.validate(&manifest);
        Some(manifest)
    }

    /// `App(id:version:build:displayName:schemes:icon:splash:splashImage:permissions:)`.
    fn app(&mut self, value: Spanned) -> Option<AppSettings> {
        if !matches!(&value.value, Value::Call { name, member: false, .. } if name == "App") {
            self.error(
                Diagnostic::error("B0811", value.span, "`app:` is an `App(…)`")
                    .label("expected `App(id: \"so.example.app\", version: \"1.0.0\")`")
                    .toolchain(SPEC),
            );
            return None;
        }
        let labels = [
            "id",
            "version",
            "build",
            "displayName",
            "schemes",
            "icon",
            "splash",
            "splashImage",
            "permissions",
        ];
        let mut args = self.labeled(value, "App", None, &labels)?;
        let mut text = |eval: &mut Self, label: &str| {
            eval.take(&mut args, label).and_then(|v| eval.string(v, &format!("`{label}:`"))).map(|(s, _)| s)
        };
        let id = text(self, "id");
        let version = text(self, "version");
        let display_name = text(self, "displayName");
        let icon = text(self, "icon");
        let splash = text(self, "splash");
        let splash_image = text(self, "splashImage");
        let mut settings =
            AppSettings { id, version, display_name, icon, splash, splash_image, ..AppSettings::default() };
        if let Some(v) = self.take(&mut args, "build") {
            match v.value {
                Value::Int(n) if n > 0 && n <= i64::from(u32::MAX) => settings.build = Some(n as u32),
                _ => self.error(
                    Diagnostic::error("B0811", v.span, "`build:` is a positive integer")
                        .label("such as `build: 42`")
                        .toolchain(SPEC),
                ),
            }
        }
        if let Some(v) = self.take(&mut args, "schemes")
            && let Some((items, _)) = self.array(v, "`schemes:`")
        {
            for item in items {
                if let Some((scheme, span)) = self.string(item, "a URL scheme") {
                    let valid = scheme.chars().next().is_some_and(|c| c.is_ascii_lowercase())
                        && scheme.chars().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || "+.-".contains(c));
                    if !valid {
                        self.error(
                            Diagnostic::error("B0811", span, format!("\"{scheme}\" is not a URL scheme"))
                                .label("a scheme is lowercase letters, digits, `+`, `.` and `-`, starting with a letter")
                                .toolchain(SPEC),
                        );
                    }
                    settings.schemes.push(scheme);
                }
            }
        }
        if let Some(splash) = &settings.splash
            && !(splash.len() == 7 && splash.starts_with('#') && splash[1..].chars().all(|c| c.is_ascii_hexdigit()))
        {
            self.error(
                Diagnostic::error("B0811", args.span, format!("`splash:` \"{splash}\" is not a colour"))
                    .label("expected \"#RRGGBB\"")
                    .toolchain(SPEC),
            );
        }
        if let Some(v) = self.take(&mut args, "permissions")
            && let Some((items, _)) = self.array(v, "`permissions:`")
        {
            for item in items {
                if let Value::Str(name) = &item.value {
                    settings.permissions.push(Permission::Android(name.clone()));
                    continue;
                }
                let Some(name) = self.member(&item, "permission", PERMISSIONS) else { continue };
                settings.permissions.push(match name.as_str() {
                    "camera" => Permission::Camera,
                    "microphone" => Permission::Microphone,
                    "location" => Permission::Location,
                    "notifications" => Permission::Notifications,
                    "contacts" => Permission::Contacts,
                    "photos" => Permission::Photos,
                    "biometrics" => Permission::Biometrics,
                    _ => Permission::Vibrate,
                });
            }
        }
        Some(settings)
    }

    fn member(&mut self, value: &Spanned, what: &str, members: &[&str]) -> Option<String> {
        if let Value::Call { name, member: true, .. } = &value.value {
            if members.contains(&name.as_str()) {
                return Some(name.clone());
            }
            let help = closest(name, members.iter().copied()).map(|n| format!("did you mean `.{n}`?"));
            let listed: Vec<String> = members.iter().map(|m| format!("`.{m}`")).collect();
            self.error(
                Diagnostic::error("B0811", value.span, format!("`.{name}` is not a {what}"))
                    .label(format!("expected {}", listed.join(", ")))
                    .maybe_help(help)
                    .toolchain(SPEC),
            );
            return None;
        }
        let listed: Vec<String> = members.iter().map(|m| format!("`.{m}`")).collect();
        self.error(
            Diagnostic::error("B0811", value.span, format!("expected a {what}"))
                .label(format!("one of {}", listed.join(", ")))
                .toolchain(SPEC),
        );
        None
    }

    fn platforms(&mut self, items: Vec<Spanned>) -> Vec<Platform> {
        let mut out = Vec::new();
        for item in items {
            let Some(name) = self.member(&item, "platform", &["iOS", "android", "web"]) else { continue };
            let span = item.span;
            let version = match &item.value {
                Value::Call { args: Some((args, _)), .. } => match args.as_slice() {
                    [Arg { label: None, value: Spanned { value: Value::Int(n), .. } }] if *n > 0 => {
                        Some(*n as u32)
                    }
                    _ => {
                        self.error(
                            Diagnostic::error("B0811", span, format!("`.{name}` takes one version number"))
                                .label(format!("such as `.{name}({})`", if name == "iOS" { 17 } else { 26 }))
                                .toolchain(SPEC),
                        );
                        continue;
                    }
                },
                _ => None,
            };
            let platform = match (name.as_str(), version) {
                ("web", None) => Platform::Web,
                ("web", Some(_)) => {
                    self.error(
                        Diagnostic::error("B0811", span, "`.web` has no version")
                            .label("write `.web`")
                            .toolchain(SPEC),
                    );
                    continue;
                }
                ("iOS", v) => Platform::Ios(v.unwrap_or(17)),
                (_, v) => Platform::Android(v.unwrap_or(26)),
            };
            if out.iter().any(|p: &Platform| std::mem::discriminant(p) == std::mem::discriminant(&platform)) {
                self.error(
                    Diagnostic::error("B0811", span, format!("{platform} is listed twice"))
                        .label("remove one")
                        .toolchain(SPEC),
                );
                continue;
            }
            out.push(platform);
        }
        out
    }

    fn version(&mut self, value: Spanned, label: &str) -> Option<Version> {
        let (text, span) = self.string(value, &format!("`{label}:`"))?;
        let version = Version::parse(&text);
        if version.is_none() {
            self.error(
                Diagnostic::error("B0814", span, format!("\"{text}\" is not a version"))
                    .label("expected major.minor.patch, such as \"2.0.0\"")
                    .toolchain(SPEC),
            );
        }
        version
    }

    fn dependency(&mut self, value: Spanned) -> Option<PackageDependency> {
        let span = value.span;
        self.member(&value, "dependency", &["package"])?;
        let mut args =
            self.labeled(value, ".package", Some("name"), &["name", "from", "exact", "path", "npm"])?;
        let name =
            self.required(&mut args, "name", ".package").and_then(|v| self.string(v, "the package name"));
        let from = self.take(&mut args, "from");
        let exact = self.take(&mut args, "exact");
        let path = self.take(&mut args, "path");
        let npm = self.take(&mut args, "npm").and_then(|v| self.string(v, "`npm:`")).map(|(s, _)| s);
        let requirement = match (from, exact, path) {
            (Some(v), None, None) => Requirement::From(self.version(v, "from")?),
            (None, Some(v), None) => Requirement::Exact(self.version(v, "exact")?),
            (None, None, Some(v)) => Requirement::Path(self.string(v, "`path:`")?.0),
            (None, None, None) => {
                self.error(
                    Diagnostic::error("B0812", span, "a package dependency needs a version")
                        .label("add `from: \"1.0.0\"`, `exact:` or `path:`")
                        .help("`bloom add <package>` writes it with the newest version past the quarantine")
                        .toolchain(SPEC),
                );
                return None;
            }
            _ => {
                self.error(
                    Diagnostic::error("B0811", span, "`from:`, `exact:` and `path:` exclude each other")
                        .label("keep one")
                        .toolchain(SPEC),
                );
                return None;
            }
        };
        let (name, name_span) = name?;
        self.module_name(&name, name_span, "package");
        if npm.is_none() && known_package(&name).is_none() && !matches!(requirement, Requirement::Path(_)) {
            let known: Vec<&str> = KNOWN_PACKAGES.iter().map(|k| k.name).collect();
            let help = closest(&name, known.iter().copied())
                .map(|n| format!("did you mean `{n}`?"))
                .unwrap_or_else(|| format!("name the npm package that carries it: `.package(\"{name}\", npm: \"@scope/name\", from: …)`"));
            self.error(
                Diagnostic::error("B0815", name_span, format!("no Bloom package `{name}` is known"))
                    .label(format!("the toolchain knows {}", known.join(", ")))
                    .help(help)
                    .toolchain(SPEC),
            );
            return None;
        }
        Some(PackageDependency { name, requirement, npm, span })
    }

    fn target(&mut self, value: Spanned) -> Option<Target> {
        let span = value.span;
        let kind = self.member(&value, "target", &["app", "module", "bindings", "tests", "native"])?;
        let what = format!(".{kind}");
        let labels: &[&str] = match kind.as_str() {
            "bindings" => &["name", "npm", "path"],
            "native" => &["name", "dependencies", "path", "kotlin", "swift"],
            _ => &["name", "dependencies", "path"],
        };
        let mut args = self.labeled(value, &what, Some("name"), labels)?;
        let name = self.required(&mut args, "name", &what).and_then(|v| self.string(v, "the target name"));
        let kind = match kind.as_str() {
            "app" => TargetKind::App,
            "module" => TargetKind::Module,
            "tests" => TargetKind::Tests,
            "native" => {
                let kotlin = self.take(&mut args, "kotlin").and_then(|v| self.string(v, "`kotlin:`")).map(|(s, _)| s);
                let swift = self.take(&mut args, "swift").and_then(|v| self.string(v, "`swift:`")).map(|(s, _)| s);
                TargetKind::Native { kotlin, swift }
            }
            _ => {
                let (npm, npm_span) =
                    self.required(&mut args, "npm", &what).and_then(|v| self.string(v, "`npm:`"))?;
                let (package, version) = split_npm_spec(&npm);
                if package.is_empty() || version.and_then(Version::parse).is_none() {
                    self.error(
                        Diagnostic::error(
                            "B0814",
                            npm_span,
                            format!("\"{npm}\" does not name an exact npm version"),
                        )
                        .label("expected \"package@1.2.3\"")
                        .help("a binding module is generated from one exact version's declarations")
                        .toolchain(SPEC),
                    );
                    return None;
                }
                TargetKind::Bindings { npm }
            }
        };
        let mut dependencies = Vec::new();
        let mut insert = InsertAt::Call { close: args.close.start };
        if let Some(v) = self.take(&mut args, "dependencies")
            && let Some((items, close)) = self.array(v, "`dependencies:`")
        {
            insert = InsertAt::Array { close: close.start, len: items.len() };
            for item in items {
                if let Some(dep) = self.string(item, "a target dependency") {
                    dependencies.push(dep);
                }
            }
        }
        let path = self.take(&mut args, "path").and_then(|v| self.string(v, "`path:`")).map(|(s, _)| s);
        let (name, name_span) = name?;
        self.module_name(&name, name_span, "target");
        Some(Target { kind, name, name_span, dependencies, path, span, insert_dependency_at: insert })
    }

    /// Unique names, known dependencies, nothing depends on an app or tests, and no cycles.
    fn validate(&mut self, manifest: &Manifest) {
        for (i, target) in manifest.targets.iter().enumerate() {
            if let Some(first) = manifest.targets[..i].iter().find(|t| t.name == target.name) {
                self.error(
                    Diagnostic::error(
                        "B0813",
                        target.name_span,
                        format!("two targets are named `{}`", target.name),
                    )
                    .label("the second")
                    .with_label(first.name_span, "the first")
                    .toolchain(SPEC),
                );
            }
            if manifest.dependencies.iter().any(|d| d.name == target.name) {
                self.error(
                    Diagnostic::error(
                        "B0813",
                        target.name_span,
                        format!("`{}` is also a package dependency", target.name),
                    )
                    .label("rename the target")
                    .help("`import` would not know which one it means")
                    .toolchain(SPEC),
                );
            }
        }
        if !manifest.targets.iter().any(|t| t.kind == TargetKind::App)
            && manifest.targets.iter().all(|t| t.kind != TargetKind::Module)
        {
            self.error(
                Diagnostic::error(
                    "B0812",
                    manifest.name_span,
                    "the package has no `.app` or `.module` target",
                )
                .label("add `.app(\"Name\")` or `.module(\"Name\")` to `targets:`")
                .toolchain(SPEC),
            );
        }
        for target in &manifest.targets {
            for (dep, span) in &target.dependencies {
                if manifest.dependencies.iter().any(|d| &d.name == dep) || known_package(dep).is_some() {
                    continue;
                }
                match manifest.targets.iter().find(|t| &t.name == dep) {
                    None => {
                        let names = manifest
                            .targets
                            .iter()
                            .map(|t| t.name.as_str())
                            .chain(manifest.dependencies.iter().map(|d| d.name.as_str()));
                        let help = closest(dep, names).map(|n| format!("did you mean \"{n}\"?"));
                        self.error(
                            Diagnostic::error("B0816", *span, format!("no target or package `{dep}`"))
                                .label("not declared in this manifest")
                                .maybe_help(help)
                                .toolchain(SPEC),
                        );
                    }
                    Some(t) if t.name == target.name => {
                        self.error(
                            Diagnostic::error("B0805", *span, format!("`{dep}` depends on itself"))
                                .label("remove it")
                                .toolchain(SPEC),
                        );
                    }
                    Some(t) if matches!(t.kind, TargetKind::App | TargetKind::Tests) => {
                        self.error(
                            Diagnostic::error(
                                "B0816",
                                *span,
                                format!("`{dep}` is an `.{}` target", t.kind.word()),
                            )
                            .label("nothing depends on an app or a test target")
                            .help(format!("move what is shared into a `.module(\"{dep}Core\")`"))
                            .toolchain(SPEC),
                        );
                    }
                    Some(t)
                        if matches!(target.kind, TargetKind::Bindings { .. })
                            && !matches!(t.kind, TargetKind::Bindings { .. }) =>
                    {
                        self.error(
                            Diagnostic::error(
                                "B0816",
                                *span,
                                "a binding module depends only on other binding modules",
                            )
                            .label(format!("`{dep}` is an app module"))
                            .toolchain(SPEC),
                        );
                    }
                    Some(_) => {}
                }
            }
        }
        if let Some(cycle) = find_cycle(manifest) {
            let first = &manifest.targets[cycle[0]];
            let names: Vec<&str> = cycle.iter().map(|&i| manifest.targets[i].name.as_str()).collect();
            let span = first
                .dependencies
                .iter()
                .find(|(d, _)| *d == manifest.targets[cycle[1 % cycle.len()]].name)
                .map_or(first.name_span, |(_, s)| *s);
            self.error(
                Diagnostic::error(
                    "B0805",
                    span,
                    format!("the modules depend on each other: {} → {}", names.join(" → "), names[0]),
                )
                .label("this dependency closes the cycle")
                .help("modules form a graph without cycles: move what both need into a module they both depend on")
                .toolchain(SPEC),
            );
        }
    }
}

/// A dependency cycle among the targets, as target indices in order.
pub fn find_cycle(manifest: &Manifest) -> Option<Vec<usize>> {
    #[derive(Clone, Copy, PartialEq)]
    enum Mark {
        New,
        Open,
        Done,
    }
    fn visit(
        manifest: &Manifest,
        at: usize,
        marks: &mut [Mark],
        stack: &mut Vec<usize>,
    ) -> Option<Vec<usize>> {
        marks[at] = Mark::Open;
        stack.push(at);
        for (dep, _) in &manifest.targets[at].dependencies {
            let Some(next) = manifest.targets.iter().position(|t| &t.name == dep) else { continue };
            if next == at {
                continue;
            }
            match marks[next] {
                Mark::Open => {
                    let from = stack.iter().position(|&i| i == next).unwrap_or(0);
                    return Some(stack[from..].to_vec());
                }
                Mark::New => {
                    if let Some(cycle) = visit(manifest, next, marks, stack) {
                        return Some(cycle);
                    }
                }
                Mark::Done => {}
            }
        }
        stack.pop();
        marks[at] = Mark::Done;
        None
    }
    let mut marks = vec![Mark::New; manifest.targets.len()];
    for start in 0..manifest.targets.len() {
        if marks[start] == Mark::New
            && let Some(cycle) = visit(manifest, start, &mut marks, &mut Vec::new())
        {
            return Some(cycle);
        }
    }
    None
}

/// The targets in dependency order (each after what it depends on), grouped in
/// levels whose targets can compile in parallel.
pub fn levels(manifest: &Manifest) -> Vec<Vec<usize>> {
    let n = manifest.targets.len();
    let mut level = vec![usize::MAX; n];
    fn depth(manifest: &Manifest, at: usize, level: &mut [usize], guard: usize) -> usize {
        if level[at] != usize::MAX {
            return level[at];
        }
        if guard > manifest.targets.len() {
            return 0;
        }
        let mut d = 0;
        for (dep, _) in &manifest.targets[at].dependencies {
            if let Some(next) = manifest.targets.iter().position(|t| &t.name == dep)
                && next != at
            {
                d = d.max(depth(manifest, next, level, guard + 1) + 1);
            }
        }
        level[at] = d;
        d
    }
    for i in 0..n {
        depth(manifest, i, &mut level, 0);
    }
    let max = level.iter().copied().max().unwrap_or(0);
    let mut out = vec![Vec::new(); if n == 0 { 0 } else { max + 1 }];
    for (i, &l) in level.iter().enumerate() {
        out[l].push(i);
    }
    out
}

// ---- editing ---------------------------------------------------------------

/// `source` with `.package("<name>", from: "<version>")` added to the package's
/// dependencies (in place when it is there with another requirement).
pub fn with_dependency(source: &str, manifest: &Manifest, entry: &str) -> String {
    insert_into(source, manifest.insert_dependency_at, entry, "dependencies")
}

/// `source` with `"<dep>"` added to the dependencies of `target`.
pub fn with_target_dependency(source: &str, target: &Target, dep: &str) -> String {
    insert_into(source, target.insert_dependency_at, &format!("\"{dep}\""), "dependencies")
}

/// `source` with `.target` added at the end of the `targets:` array.
pub fn with_target(source: &str, entry: &str) -> Option<String> {
    let lexed = lexer::lex(source, 0, source.len());
    // The `]` closing the array that follows `targets:`.
    let tokens: Vec<&Token> = lexed.tokens.iter().filter(|t| t.tok != Tok::Newline).collect();
    let start = tokens.windows(3).position(|w| {
        matches!(&w[0].tok, Tok::Ident(n) if n == "targets")
            && w[1].tok == Tok::P(P::Colon)
            && w[2].tok == Tok::P(P::LBracket)
    })? + 2;
    let mut depth = 0usize;
    let mut items = 0usize;
    for (i, token) in tokens.iter().enumerate().skip(start) {
        match token.tok {
            Tok::P(P::LBracket | P::LParen) => depth += 1,
            Tok::P(P::RBracket | P::RParen) => {
                depth -= 1;
                if depth == 0 {
                    let len = if i == start + 1 { 0 } else { items + 1 };
                    return Some(insert_into(
                        source,
                        InsertAt::Array { close: token.span.start, len },
                        entry,
                        "targets",
                    ));
                }
            }
            // A trailing comma before `]` does not start another element.
            Tok::P(P::Comma)
                if depth == 1 && tokens.get(i + 1).is_some_and(|t| t.tok != Tok::P(P::RBracket)) =>
            {
                items += 1;
            }
            _ => {}
        }
    }
    None
}

fn insert_into(source: &str, at: InsertAt, entry: &str, label: &str) -> String {
    match at {
        InsertAt::Array { close, len } => {
            let close = close as usize;
            let before = &source[..close];
            let trimmed = before.trim_end();
            let multiline = before[trimmed.len()..].contains('\n');
            let indent = line_indent(source, close);
            let needs_comma = len > 0 && !trimmed.ends_with(',') && !trimmed.ends_with('[');
            let comma = if needs_comma { "," } else { "" };
            if multiline {
                format!("{trimmed}{comma}\n{indent}  {entry},\n{indent}{}", &source[close..])
            } else {
                let sep = if len > 0 { " " } else { "" };
                format!("{trimmed}{comma}{sep}{entry}{}", &source[close..])
            }
        }
        InsertAt::Call { close } => {
            let close = close as usize;
            let before = &source[..close];
            let trimmed = before.trim_end();
            let comma = if trimmed.ends_with(',') || trimmed.ends_with('(') { "" } else { "," };
            if before[trimmed.len()..].contains('\n') {
                let indent = line_indent(source, close);
                format!("{trimmed}{comma}\n{indent}  {label}: [{entry}],\n{indent}{}", &source[close..])
            } else {
                let sep = if trimmed.ends_with('(') { "" } else { " " };
                format!("{trimmed}{comma}{sep}{label}: [{entry}]{}", &source[close..])
            }
        }
    }
}

fn line_indent(source: &str, at: usize) -> String {
    let line_start = source[..at].rfind('\n').map_or(0, |i| i + 1);
    source[line_start..].chars().take_while(|c| *c == ' ' || *c == '\t').collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    const MENTION: &str = r#"// The manifest of ADR 0002, section 2.
let package = Package(
  name: "Mention",
  platforms: [.iOS(17), .android(26), .web],
  dependencies: [
    .package("Bloom", from: "24.0.0"),
    .package("BloomData", from: "2.0.0"),
  ],
  targets: [
    .app("Mention", dependencies: ["Feed", "Posts", "Settings"]),
    .module("Feed", dependencies: ["Posts"]),
    .module("Settings"),
    .module("Posts", dependencies: ["MentionAPI"]),
    .module("MentionAPI"),
    .bindings("Sentry", npm: "@sentry/react-native@6.2.0"),
    .tests("PostsTests", dependencies: ["Posts"]),
  ]
)
"#;

    fn errors(source: &str) -> Vec<String> {
        match parse(source, "Package.bloom") {
            Ok(_) => Vec::new(),
            Err(errors) => errors.iter().map(|d| format!("{}: {}", d.code, d.message)).collect(),
        }
    }

    #[test]
    fn reads_the_adr_manifest() {
        let m = parse(MENTION, "Package.bloom").unwrap();
        assert_eq!(m.name, "Mention");
        assert_eq!(m.platforms, [Platform::Ios(17), Platform::Android(26), Platform::Web]);
        assert_eq!(m.dependencies.len(), 2);
        assert_eq!(m.dependencies[1].requirement, Requirement::From(Version::parse("2.0.0").unwrap()));
        assert_eq!(m.dependencies[1].npm_name().as_deref(), Some("@oxy.so/bloom-data"));
        let kinds: Vec<&str> = m.targets.iter().map(|t| t.kind.word()).collect();
        assert_eq!(kinds, ["app", "module", "module", "module", "module", "bindings", "tests"]);
        assert_eq!(m.targets[5].npm(), Some(("@sentry/react-native", Some("6.2.0"))));
        assert_eq!(m.targets[5].dir(), PathBuf::from("Bindings/Sentry"));
        assert_eq!(m.targets[6].dir(), PathBuf::from("Tests/PostsTests"));
        let levels: Vec<Vec<&str>> = levels(&m)
            .into_iter()
            .map(|l| l.into_iter().map(|i| m.targets[i].name.as_str()).collect())
            .collect();
        assert_eq!(levels[0], ["Settings", "MentionAPI", "Sentry"]);
        assert_eq!(levels[1], ["Posts"]);
        assert_eq!(levels[2], ["Feed", "PostsTests"]);
        assert_eq!(levels[3], ["Mention"]);
    }

    #[test]
    fn reads_the_app_settings_and_native_targets() {
        let m = parse(
            r##"let package = Package(
  name: "Demo",
  app: App(id: "so.oxy.demo", version: "2.1.0", build: 7, schemes: ["demo"], splash: "#101820", permissions: [.camera, "android.permission.NFC"]),
  targets: [.app("Demo"), .native("Haptics", kotlin: "Native/Haptics/kt")]
)"##,
            "Package.bloom",
        )
        .unwrap();
        assert_eq!(m.app.id.as_deref(), Some("so.oxy.demo"));
        assert_eq!(m.app.build, Some(7));
        assert_eq!(m.app.schemes, ["demo"]);
        assert_eq!(m.app.permissions[0].android(), ["android.permission.CAMERA"]);
        assert_eq!(m.app.permissions[1], Permission::Android("android.permission.NFC".into()));
        let (kotlin, swift) = m.targets[1].native_sources().unwrap();
        assert_eq!((kotlin, swift), (PathBuf::from("Native/Haptics/kt"), PathBuf::from("Native/Haptics/ios")));
        let e = errors("let package = Package(name: \"A\", app: App(splash: \"white\", schemes: [\"Demo\"]), targets: [.app(\"A\")])");
        assert!(e.iter().any(|e| e.contains("\"Demo\" is not a URL scheme")), "{e:?}");
        assert!(e.iter().any(|e| e.contains("\"white\" is not a colour")), "{e:?}");
    }

    #[test]
    fn evaluates_no_code() {
        let e = errors("let package = Package(name: name, targets: [])");
        assert!(e[0].contains("`name` is not a value here"), "{e:?}");
        let e = errors("let package = Package(name: \"A${x}\", targets: [.app(\"A\")])");
        assert!(e[0].contains("no interpolation"), "{e:?}");
        let e = errors("let package = Package(name: \"A\", targets: [.app(\"A\")])\nprint(1)");
        assert!(e[0].contains("declares only `package`"), "{e:?}");
        let e = errors("import Foo");
        assert!(e[0].contains("`let package = Package(…)`"), "{e:?}");
    }

    #[test]
    fn names_the_mistake() {
        let e = errors("let package = Package(name: \"A\", target: [.app(\"A\")])");
        assert!(e.iter().any(|e| e.contains("no argument `target:`")), "{e:?}");
        let rendered = parse("let package = Package(name: \"A\", target: [])", "Package.bloom").unwrap_err();
        assert!(rendered.iter().any(|d| d.help.as_deref() == Some("did you mean `targets:`?")));
        let e = errors("let package = Package(name: \"A\", targets: [.ap(\"A\")])");
        assert!(e.iter().any(|e| e.contains("`.ap` is not a target")), "{e:?}");
        let e = errors(
            "let package = Package(name: \"A\", targets: [.app(\"A\", dependencies: [\"Feeds\"]), .module(\"Feed\")])",
        );
        assert!(e.iter().any(|e| e.contains("B0816: no target or package `Feeds`")), "{e:?}");
        let e = errors(
            "let package = Package(name: \"A\", dependencies: [.package(\"BloomDta\", from: \"2.0.0\")], targets: [.app(\"A\")])",
        );
        assert!(e.iter().any(|e| e.contains("B0815")), "{e:?}");
        let e = errors(
            "let package = Package(name: \"A\", dependencies: [.package(\"BloomData\", from: \"two\")], targets: [.app(\"A\")])",
        );
        assert!(e.iter().any(|e| e.contains("B0814")), "{e:?}");
        let e = errors(
            "let package = Package(name: \"A\", targets: [.bindings(\"S\", npm: \"@sentry/react-native\")])",
        );
        assert!(e.iter().any(|e| e.contains("exact npm version")), "{e:?}");
        let e = errors("let package = Package(name: \"a\", targets: [.app(\"A\"), .module(\"A\")])");
        assert!(e.iter().any(|e| e.contains("not a package name")), "{e:?}");
        assert!(e.iter().any(|e| e.contains("two targets are named `A`")), "{e:?}");
    }

    #[test]
    fn rejects_cycles_and_app_dependencies() {
        let e = errors(
            "let package = Package(name: \"A\", targets: [.module(\"X\", dependencies: [\"Y\"]), .module(\"Y\", dependencies: [\"Z\"]), .module(\"Z\", dependencies: [\"X\"])])",
        );
        assert!(
            e.iter().any(|e| e.contains("B0805: the modules depend on each other: X → Y → Z → X")),
            "{e:?}"
        );
        let e = errors(
            "let package = Package(name: \"A\", targets: [.app(\"A\"), .module(\"M\", dependencies: [\"A\"])])",
        );
        assert!(e.iter().any(|e| e.contains("is an `.app` target")), "{e:?}");
    }

    #[test]
    fn versions_order_as_semver() {
        let v = |s| Version::parse(s).unwrap();
        assert!(v("1.10.0") > v("1.9.9"));
        assert!(v("2.0.0-rc.1") < v("2.0.0"));
        let from = Requirement::From(v("2.0.0"));
        assert!(from.allows(&v("2.3.1")));
        assert!(!from.allows(&v("3.0.0")));
        assert!(!from.allows(&v("2.1.0-beta.1")));
        assert!(Version::parse("1.2").is_none());
        assert_eq!(split_npm_spec("@a/b@1.0.0"), ("@a/b", Some("1.0.0")));
        assert_eq!(split_npm_spec("left-pad"), ("left-pad", None));
    }

    #[test]
    fn adds_dependencies_and_targets_in_the_authors_layout() {
        let m = parse(MENTION, "Package.bloom").unwrap();
        let out = with_dependency(MENTION, &m, ".package(\"BloomRouter\", from: \"1.0.0\")");
        assert!(out.contains("    .package(\"BloomData\", from: \"2.0.0\"),\n    .package(\"BloomRouter\", from: \"1.0.0\"),\n  ],"), "{out}");
        assert!(parse(&out, "Package.bloom").is_ok());
        let one = "let package = Package(name: \"A\", targets: [.app(\"A\")])";
        let m = parse(one, "Package.bloom").unwrap();
        let out = with_dependency(one, &m, ".package(\"BloomData\", from: \"2.0.0\")");
        assert_eq!(
            out,
            "let package = Package(name: \"A\", targets: [.app(\"A\")], dependencies: [.package(\"BloomData\", from: \"2.0.0\")])"
        );
        assert!(parse(&out, "Package.bloom").is_ok());
        let out = with_target(one, ".bindings(\"Sentry\", npm: \"@sentry/react-native@6.2.0\")").unwrap();
        assert_eq!(
            out,
            "let package = Package(name: \"A\", targets: [.app(\"A\"), .bindings(\"Sentry\", npm: \"@sentry/react-native@6.2.0\")])"
        );
        let out = with_target(MENTION, ".bindings(\"X\", npm: \"x@1.0.0\")").unwrap();
        assert!(out.contains("    .tests(\"PostsTests\", dependencies: [\"Posts\"]),\n    .bindings(\"X\", npm: \"x@1.0.0\"),\n  ]"), "{out}");
        let app = &parse(&out, "Package.bloom").unwrap().targets[0];
        let out2 = with_target_dependency(&out, app, "X");
        assert!(
            out2.contains(".app(\"Mention\", dependencies: [\"Feed\", \"Posts\", \"Settings\", \"X\"])"),
            "{out2}"
        );
    }
}
