# Bloom, lenguaje propio (`.bloom`): resumen de la fase 0

Decisión completa en [ADR 0001](0001-bloom-own-language.md); especificación en
[`docs/bloom-lang-spec.mdx`](../bloom-lang-spec.mdx). Nada está publicado ni fusionado: son PRs en
borrador para que lo revises.

## Cómo se ve

Es la pantalla real de Mention (Ajustes → Notificaciones), lógica incluida, ya funcionando en la
web y en Jest.

**Datos: tipos, enums, `match` exhaustivo.** Sin `null` y sin `any`.

```bloom
struct Prefs {
  likes: Bool = true
  quotes: Bool = true
}

enum PrefKey { likes, quotes }

fn isOn(prefs: Prefs, key: PrefKey) -> Bool {
  match key {
    case .likes => prefs.likes
    case .quotes => prefs.quotes
  }
}
```

**Lógica: estado, async y errores como valores.** No hay `try`/`catch`; `defer` se ejecuta pase lo que pase.

```bloom
@state saving = false

async fn updatePreference(key: PrefKey, value: Bool) {
  saving = true
  defer { saving = false }
  match await update(patch(key, value)) {
    case .ok(_) => {}
    case .err(error) => toast(t("settings.notifications.saveError"), type: "error")
  }
}
```

**UI: estilo SwiftUI, un hijo por línea, modificadores encadenados.**

```bloom
body {
  if loading {
    VStack { SettingsSkeleton() }.spacing("lg")
  } else {
    VStack {
      if saving { Loading().style("inline").size("sm") }
      SettingsSection(t("settings.notifications.sections.types")) {
        GroupedSection { toggleRow(.likes, t("…likes"), t("…likesDesc")) }
      }
    }
    .spacing("lg")
  }
}
```

Los errores dicen qué escribir, al estilo de Rust:

```text
error[B0502]: `"medium"` is not a space token
   |       .padding("medium")
   |                ^^^^^^^^ expected one of: none 2xs xs sm md lg xl 2xl …
help: did you mean `"md"`?
```

## Por qué es rápido

- **Reactividad en tiempo de compilación.** El compilador (Rust) sabe exactamente de qué depende
  cada parte de la pantalla. Escribe él mismo la caché de memoización (la misma que usa el React
  Compiler), con dependencias exactas. No hay proxies, suscripciones ni intérprete en tiempo de
  ejecución.
- **Inmutable por defecto.** No hace falta adivinar mutaciones. El React Compiler, en cambio, se
  rinde ante `try`/`finally`, y por eso la versión en TS de esta pantalla no estaba memoizada ni
  en producción.
- **Lo estático, en compilación.** Los árboles fijos se crean una vez, a nivel de módulo.
- **Coste cero.** Structs como objetos planos, enums sin datos como strings, `T?` como `undefined`.
  Una fibra por `view`, y los mismos hooks que escribiría una persona.

## Números medidos

Comparación entre el TS original, el mejor TS escrito a mano y `.bloom`:

| | TS original | TS limpio | `.bloom` |
|---|---|---|---|
| Píxeles (4 estados, 1x y 2x) | — | idénticos | **idénticos** |
| Fibras / hooks / contextos | 413 / 535 / 273 | 396 / 534 / 257 | **396 / 534 / 257** |
| Montaje, mediana | 25,9 ms | 24,4 ms | 23,5 ms |
| Actualización completa (toggle + guardado), mediana | 27,3 ms | 26,7 ms | **19,4 ms (−27 %)** |
| Bytes del módulo (gzip) | 1.282 | 1.173 | 1.745 (+572 B) |
| Compilar el archivo (solo bloomc) | — | — | **0,94 ms** |

- **1000 archivos:** se compilan en 73 ms en frío (en paralelo) y en 23 ms con caché.
- **Tipado:** el TS generado pasa `tsc` con 0 errores contra los tipos reales de Mention.
- **Depuración:** un error dentro de un handler apunta a la línea del `.bloom`.

Pendiente de mejorar:

- **Bytes:** `.bloom` ocupa algo más, por su caché y un helper de `await`; en la fase 1 se elimina
  el helper.
- **Compilación por archivo:** es 10–20 veces el pase actual del lenguaje embebido. Aun así es
  menos de 1 ms, y Babel sigue siendo lo que domina.
- **Aún no medido:** el rendimiento en nativo/Android, que es trabajo del agente de dispositivos.

## Hoja de ruta hacia el 100 %

1. **Fase 1, lenguaje completo para la lógica (4–6 semanas-agente).**
   - **Lenguaje:** key paths, `==` estructural, `onChange`, `all`/`race`, y bloom-data con tipos propios.
   - **Herramientas:** `bloomc check --tsc`, LSP con ir-a-definición y autocompletado, y binarios para las 6 plataformas.
   - **Compilador y gates:** el compilador como mucho 3 veces más lento que hoy, y los gates de Mention leyendo `.bloom`.
   - **Dispositivo:** prueba en dispositivo.
2. **Fase 2, migrar Mention (6–10 semanas-agente).**
   - Un codemod de TSX a `.bloom` para la UI, y un port asistido para la lógica.
   - Rutas tipadas.
   - Orden: filas (`PostItem`), luego listas, compose y ajustes.
   - Cada pantalla, igual o mejor en coste, bytes y píxeles.
3. **Fase 3, el resto de apps** y los stores en `.bloom`. Más adelante, emitir JS + `.d.ts` directamente.

**Riesgos principales:**

- **Mantener un lenguaje para siempre.** Mitigación: una gramática pequeña y un solo código en Rust.
- **Que los agentes de IA no lo conozcan.** Mitigación: la chuleta y los errores que enseñan; se medirá en la fase 2.
- **Cobertura de tipos de los `.d.ts` de npm.** Lo que no se entiende lo verifica `tsc`.
- **Expo Router.** Aún no acepta rutas `.bloom`; hoy basta una línea en `.tsx` por ruta.

**PRs:**

- **Bloom:** [#963](https://github.com/OxyHQ/Bloom/pull/963) (diseño), [#967](https://github.com/OxyHQ/Bloom/pull/967) (compilador) y [#964](https://github.com/OxyHQ/Bloom/pull/964) (herramientas).
- **Mention:** [#2046](https://github.com/OxyHQ/Mention/pull/2046) (la prueba).
