# Bloom 2.0: un lenguaje al nivel de Swift, con sus propias herramientas

Propuesta para revisar antes de construirla. El detalle está en
[ADR 0002](0002-swift-grade-language-and-toolchain.md).

## Qué cambia

- **Nada de npm, `react-native` ni `"js"` en el código de la app.** Solo se importan módulos Bloom:
  `import Bloom`, `import BloomData`, `import Mention.Posts`. Cada módulo es una carpeta, con
  `public`, `internal` y `private`.
- **Una sola herramienta, `bloom`**, como `swift` o `cargo`: `bloom new`, `bloom build ios|android|web`,
  `bloom run`, `bloom test`, `bloom fmt`, `bloom check` y `bloom add`. El manifiesto es
  `Package.bloom`. Expo, Metro y Gradle siguen debajo, pero su configuración se genera y nadie la ve.
- **Una biblioteca estándar**, como Foundation:
  - `String`, colecciones, `Date`, `Duration` y `URL`;
  - `JSON` con `Codable`, que se deriva al compilar, sin reflexión;
  - un cliente HTTP `async`, almacenamiento, tareas, `Regex`, `Logger` e i18n con claves comprobadas al compilar;
  - la navegación con rutas tipadas, la UI (Bloom) y los datos (BloomData).
- **La interoperabilidad es la excepción.** Un paquete JS o nativo se usa a través de un módulo de
  *bindings* generado con `bloom bind`, como los `-sys` de Rust o el puente ObjC de Swift. La app
  importa `import Sentry`, nunca un nombre de JS.
- **Superficie de Swift:**
  - `struct`, `enum`, `class` y `protocol` con `extension` y genéricos con restricciones;
  - `@Observable`, `@State`, `@Binding` y `@Environment`;
  - `async`/`await` con `throws`/`try`;
  - `guard`, `if let`, `switch`, *trailing closures* y la interpolación `"\(x)"`.
- **Lo que desaparece:** `memo`, `lazy`, `@ref`, `effect`, `..props` y los tokens como strings.
  - El compilador decide la memoización; `Equatable` sirve como comparador.
  - La división del bundle es automática por módulo.
  - Los efectos se escriben con `.task`, `.onChange` y `.onAppear`.
  - Los tokens son miembros tipados: `.padding(.md)`.

## Tres ejemplos reales de Mention

**1. Un modelo con red: el feed, con «me gusta» optimista.**

```swift
import Bloom
import Mention.API

public struct Post: Codable, Identifiable, Equatable {
  public let id: String
  public let text: String
  public let author: User
  public let createdAt: Date
  public var likes: Int
  public var isLiked: Bool
}

@Observable
public final class FeedModel {
  public private(set) var posts: [Post] = []
  public private(set) var isLoading = false
  private var cursor: String?
  private let api: MentionAPI

  public init(api: MentionAPI) { self.api = api }

  public func refresh() async throws {
    isLoading = true
    defer { isLoading = false }
    let page: Page<Post> = try await api.get("/feeds/home")
    posts = page.items
    cursor = page.cursor
  }

  public func like(_ post: Post) async {
    guard let i = posts.firstIndex(where: { $0.id == post.id }) else { return }
    posts[i].isLiked = true
    posts[i].likes += 1
    do {
      try await api.post("/posts/\(post.id)/like")
    } catch {
      posts[i].isLiked = false
      posts[i].likes -= 1
      Toast.show("feed.likeFailed", style: .error)
    }
  }
}
```

**2. Una vista: Ajustes → Notificaciones** (la pantalla que ya medimos).

```swift
import Bloom
import Mention.Settings

struct NotificationSettings: View {
  @Environment(\.session) private var session
  @State private var model = NotificationPrefsModel()

  var body: some View {
    switch model.state {
    case .loading:
      SettingsSkeleton()
    case .signedOut:
      SignInPrompt("settings.notifications.signInRequired")
    case .ready:
      VStack(spacing: .lg) {
        if model.isSaving { ProgressView().controlSize(.sm) }
        SettingsSection("settings.notifications.sections.types") {
          ForEach(PrefKey.allCases) { key in
            Toggle(key.title, isOn: model.binding(for: key))
              .description(key.detail)
          }
        }
      }
    }
    .task { await model.load(session) }
  }
}
```

**3. Una fila de lista: un post del feed.**

```swift
struct PostRow: View, Equatable {
  let post: Post
  let onLike: () async -> Void

  var body: some View {
    HStack(alignment: .top, spacing: .sm) {
      Avatar(post.author.avatar).size(.md)
      VStack(alignment: .leading, spacing: .xs) {
        HStack(spacing: .xs) {
          Text(post.author.name).weight(.semibold).lineLimit(1)
          if post.author.isVerified { Icon(.verified).foregroundStyle(.primary) }
          Spacer()
          Text(post.createdAt, format: .relative).foregroundStyle(.muted)
        }
        Text(post.text)
        Button { Task { await onLike() } } label: {
          Label("\(post.likes)", icon: post.isLiked ? .heartFill : .heart)
        }
        .tint(post.isLiked ? .danger : .neutral)
      }
    }
    .padding(.md)
  }

  static func == (a: Self, b: Self) -> Bool { a.post == b.post }
}

// En la pantalla del feed:
List(model.posts) { post in
  PostRow(post: post) { await model.like(post) }
}
.refreshable { try? await model.refresh() }
```

## Por qué será rápido

- **Lo que ya tenemos se mantiene:** reactividad y estilos resueltos al compilar, y cada nodo no
  cuesta más que su JSX. En Android, la pantalla en `.bloom` ya monta en 71 ms frente a 85, y
  actualiza en 18 ms de React frente a 46.
- **`@Observable` sin proxies:** el compilador sabe qué campos lee cada vista, así que la vista solo
  se vuelve a pintar cuando cambia algo que lee.
- **Static Hermes:** el código ya sale completamente tipado, que es lo que necesita Static Hermes
  para compilar a código máquina en iOS y Android. Lo mediremos módulo a módulo y lo adoptaremos
  donde gane.
- **Web y wasm:** la web sigue en JS; wasm solo donde se note, por ejemplo en JSON o `Regex`.

## Plan

1. **A. Superficie 2.0:** gramática, módulos, `Package.bloom` y la herramienta `bloom`. Hecha
   cuando estos tres ejemplos compilen y funcionen en web y en el emulador de Android.
2. **B. Biblioteca estándar.**
3. **C. Backends:** Static Hermes y wasm.
4. **D. Mention entera en Bloom 2.0.**
5. **E. El resto de apps**, empezando por Allo.

Lo ya construido se conserva: el parser, el comprobador de tipos, el emisor, el LSP y el codemod.
El port de Mention espera a que apruebes esta superficie.
