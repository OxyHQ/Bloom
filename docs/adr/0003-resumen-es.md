# Backends nativos para `.bloom`: resumen

Aceptado el 2026-11-28. El detalle y los números están en [ADR 0003](0003-native-backends.md);
el código del prototipo está en el PR #1067, que se revisa aparte.

## La decisión: nativo del todo, Android e iOS

- `.bloom` se compila directamente a **Kotlin + Jetpack Compose en Android** y a **Swift +
  SwiftUI en iOS**. En un destino nativo no hay JavaScript en el dispositivo: ni Hermes, ni
  React Native, ni bundle. **La web sigue con el backend de TypeScript.**
- Un solo parser y un solo checker; tres backends (TypeScript, Kotlin, Swift) sobre el mismo
  programa comprobado, con una sola batería de conformidad para los tres.
- **Android e iOS en paralelo.** iOS refleja la API del runtime de Android, acordada en un
  documento compartido (`docs/native-runtime-api.mdx`).
- Cada plataforma recibe: el backend para todo el lenguaje 2.0, BloomUI completo con paridad de
  píxeles, la biblioteca estándar (HTTP, `Codable`, almacenamiento, navegación y deep links,
  imágenes y vídeo, fechas y formatos idénticos a `Intl`, temporizadores, `.task`) y
  `bloom build android|ios --target native`, una app Gradle o Xcode sin React Native.
- **Migración por islas:** una pantalla nativa vive dentro de la app de React Native actual hasta
  que toda la app es `.bloom`. Mention va primero, y su feed el primero de todo.
- **Hitos (Android; iOS los replica en el Mac):**
  - **M1:** el feed de Mention como isla Compose con paridad de píxeles, medido en el Pixel 8a.
  - **M2:** Notificaciones, Perfil y el detalle de un post como islas.
  - **M3:** Mention nativa entera, cuando sus módulos sean 100 % `.bloom`. Para eso el SDK de
    servicios de Oxy (`@oxyhq/services`) también tiene que existir en Bloom.
- **Decidido a la vez:** `Int` de 64 bits con desbordamiento que se detiene, los efectos corren
  tras aplicar el cambio y antes del siguiente fotograma, y la fila de `VirtualList` se tipa
  `VirtualListRow<T>`.

## La pregunta

¿Compilamos `.bloom` directamente a código nativo (SwiftUI en iOS, Kotlin + Jetpack Compose en
Android), sin JavaScript en medio, para que Bloom vaya tan rápido como Swift o Rust?

## Qué se construyó

- **Un backend experimental**, `bloom-native emit --target kotlin-compose`, aparte del
  compilador principal (`crates/native`). Lee el programa ya comprobado por el checker de siempre
  y escribe Kotlin y Compose: los `struct` son `data class`, los `enum` son `enum class` o
  `sealed interface`, las vistas son `@Composable`, `@State` es `remember`, `.task` y `.onChange`
  son efectos, y los modificadores se invierten al orden de Compose.
- **Un runtime pequeño** de BloomUI para Compose (sin Material): tokens, pilas, texto, iconos de
  Bloom, toggles, secciones agrupadas, la barra de acciones del post, una lista perezosa, imágenes.
- **Dos pantallas con el mismo `.bloom` para los dos caminos:** Ajustes → Notificaciones
  (Mention #2046) y un feed de 500 PostItem con texto e imagen (Mention #2049).
- **iOS no se construyó:** el Mac aún no está en hangar y no hay toolchain de Swift aquí.

## Lo medido (Pixel 8a, versiones release, mediana de 5 ejecuciones)

| | Hoy (React Native + Hermes) | Kotlin + Compose |
|---|---|---|
| Arranque en frío hasta ver el feed | 320 ms | **118 ms** |
| Fotogramas con retraso al hacer scroll rápido (120 Hz) | 0,64 % | **0,06 %** |
| Tiempo de fotograma p90 | 12 ms | **7 ms** |
| Memoria en reposo | 266 MB | **58 MB** |
| Memoria tras recorrer las 500 filas | 412 MB | **129 MB** |
| Latencia de un toggle (mediana / p95) | 42 / 53 ms | **7 / 12 ms** |
| Tamaño del APK | 44,9 MB | **1,4 MB** |

El coste está en React Native en sí (Hermes, el bundle de 19 MB, React, Fabric), no en el código
de la app; por eso Static Hermes no lo arreglaba (ADR 0002).

## Lo que cuesta

- El compilador es la parte pequeña (unas 1.400 líneas de Rust para dos pantallas).
- Lo grande es **BloomUI dos veces más** (Compose y SwiftUI, con paridad de píxeles) y la
  **biblioteca estándar** en Kotlin y Swift: unas 50–70 semanas-agente para las dos plataformas,
  28–38 solo para Android.
- El `.bloom` de Mention hoy importa mucho TypeScript (PostItem importa unos 90 módulos): solo
  se compila nativo lo que es 100 % Bloom.
- Las pantallas nativas no se actualizan por OTA, solo por las tiendas.

## La recomendación del prototipo (superada por la decisión)

Se conserva tal cual; la decisión va más allá: las dos plataformas ya, y la app nativa entera como
objetivo.

1. **Sí al backend nativo como destino**, no como reescritura. La web y React Native siguen con
   TypeScript.
2. **Primero «islas» nativas dentro de la app de React Native** (el feed, Notificaciones): dan
   el scroll y la respuesta rápidos.
3. **App entera nativa cuando sus módulos sean 100 % Bloom:** ahí llegan el arranque 2,7× más
   rápido, la memoria ÷4 y el APK ÷33.
4. **Medir SwiftUI en el Mac antes de comprometer iOS.**
5. **Punto de decisión:** el feed de Mention como isla Compose con paridad de píxeles, medido en
   el Pixel 8a. Si las ganancias se mantienen con un BloomUI completo, seguimos; si no, nos
   quedamos en las islas.
