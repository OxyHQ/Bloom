# Backends nativos para `.bloom`: resumen

Borrador del 2026-11-28. El detalle y los números están en [ADR 0003](0003-native-backends.md).

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
| Memoria tras recorrer el feed | 417 MB | **112 MB** |
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

## Recomendación: híbrido, en dos pasos, primero Android

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
