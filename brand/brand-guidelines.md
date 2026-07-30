# ContaFácil — Guía de identidad de marca

_Fuente: [Claude Design — ContaFácil brand identity](https://claude.ai/design/p/7e390511-60b2-4023-89ae-a4af3c836b36)_

## 1. Variantes del logo

| Variante | Archivo | Uso |
|---|---|---|
| Horizontal | `logo/logo-horizontal.svg` | Lockup principal, headers |
| Vertical / apilado | `logo/logo-vertical.svg` | Splash screens, portadas |
| Solo ícono | `logo/icon-mark.svg` | Espacios reducidos, app icon |
| Monocromo blanco | `logo/logo-mono-white.svg` | Sobre fondos oscuros (#0D1B2A, #1E3A8A) |
| Monocromo negro | `logo/logo-mono-black.svg` | Sobre fondos muy claros |
| Favicon / app icon | `logo/favicon.svg` | Favicon del navegador, PWA |
| Mascota completa | `mascot/mascot-full-256.png` | Onboarding, bienvenida, empty states |

## 2. Reglas de uso

**Espacio de protección** — Deja un margen libre alrededor del logo equivalente a la altura de la "C" del ícono (medida X). Ningún texto, borde o imagen debe invadir ese espacio.

**Tamaño mínimo** — Horizontal: 120px de ancho. Ícono solo: 24px (favicon/app icon). Por debajo de esto, usar solo el ícono simplificado.

**Fondos permitidos** — Logo a color: sobre `#F4F6F8` o blanco. Monocromo blanco: sobre `#0D1B2A` o `#1E3A8A`. Monocromo negro: sobre fondos muy claros.

**Combinaciones prohibidas** — No recolorear el ícono fuera de la paleta. No estirar ni distorsionar. No usar el logo a color sobre fondos con imagen o bajo contraste. No separar el ícono del wordmark en el lockup horizontal.

## 3. Tipografía

- **Títulos: Poppins** (pesos 600/700/800) — fallback `'Segoe UI', sans-serif`
- **Texto de cuerpo: Inter** (pesos 400/500/600) — fallback `'Segoe UI', sans-serif`, para párrafos e interfaz

## 4. Tono visual de la mascota

- **Mascota completa** — onboarding, pantallas de bienvenida y empty states: momentos donde se presenta o acompaña al usuario con calidez.
- **Solo ícono "C"** — loading states, favicon, notificaciones y navegación: contextos funcionales y de espacio reducido.
- **Errores** — usar el ícono o una versión reducida de la mascota con expresión neutra, nunca la escena completa de escritorio: mantiene el tono profesional y confiable.

## 5. Paleta y tokens

| Token | Hex | Uso sugerido |
|---|---|---|
| `navy900` | `#0D1B2A` | Texto principal, fondos oscuros |
| `indigo700` | `#1E3A8A` | Texto secundario, acentos oscuros |
| `blue600` | `#2563EB` | Links, acciones primarias |
| `emerald500` | `#10B981` | Marca (ícono), estados positivos |
| `lime400` | `#84CC16` | Acentos, resaltados |
| `gray50` | `#F4F6F8` | Fondo de la app |

Valores completos (color, tipografía, spacing, radius) en [`tokens.json`](tokens.json) y [`tokens.css`](tokens.css).

## Notas de importación

- Assets importados desde el proyecto de Claude Design el 2026-07-30.
- `mascot-full-512.png` supera el límite de lectura del MCP de diseño (256 KiB); se usó la variante `mascot-full-256.png`. Si se necesita mayor resolución, exportar manualmente desde Claude Design.
- Variantes PNG adicionales (múltiples tamaños de cada logo) existen en el proyecto de origen pero no se importaron — las versiones SVG son preferibles para uso web y se re-exportan on-demand si hace falta un raster.
