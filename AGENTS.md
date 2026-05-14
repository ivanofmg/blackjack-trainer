# AGENTS.md — Blackjack Trainer

Reglas y contexto para agentes de IA (Cursor, Claude Code) trabajando en este proyecto.

## Contexto del proyecto

App web para aprender y practicar blackjack: estrategia básica, desviaciones avanzadas y conteo de cartas Hi-Lo. Reglas predeterminadas: Strip de Las Vegas (6 barajas, dealer se planta en soft 17, doble después de split permitido, rendición tardía, blackjack paga 3:2).

El usuario es un aprendiz de blackjack, no un jugador casual. La precisión matemática es crítica: una tabla de estrategia incorrecta hace inútil la app.

## Stack

- Next.js 14+ con App Router
- TypeScript estricto (`strict: true`)
- Tailwind CSS v4
- shadcn/ui (Radix + Nova preset)
- Zustand para estado global
- Vitest + Testing Library para tests
- LocalStorage para persistencia

## Convenciones de código

- **TypeScript estricto siempre.** Sin `any`. Usar tipos explícitos en signatures públicas.
- **Funciones puras para lógica de negocio.** Toda la lógica de blackjack (mazo, manos, estrategia, conteo) debe ser pura y testeable sin React.
- **Separación clara:** `src/lib/*` no importa de `src/components/*` ni de `src/store/*`. La lógica no conoce la UI.
- **Tests obligatorios** para todo lo que vive en `src/lib/`. Mínimo 90% de cobertura en estrategia y conteo.
- **Nombres en inglés** para código (variables, funciones, archivos). **UI en español.**
- Imports con alias `@/*` (configurado en `tsconfig.json`).
- Componentes en PascalCase, funciones en camelCase, constantes en UPPER_SNAKE_CASE.

## Estructura del proyecto

src/
app/                    # Rutas Next.js (App Router)
components/
game/                 # Mesa, carta, mano, dealer
trainer/              # Tutor, drills, stats
layout/               # Header, nav, shell
ui/                   # shadcn (no editar manualmente)
lib/
blackjack/            # Mazo, hand, dealer logic, reglas
strategy/             # Tablas de estrategia básica + desviaciones
counting/             # Hi-Lo, true count, betting unit
storage/              # LocalStorage helpers
store/                  # Zustand stores
docs/
PRD.md                  # Product Requirements Document
tests/
unit/                   # Tests de lib/
fixtures/               # Manos de ejemplo, escenarios

## Reglas críticas de blackjack (no inventar)

- **Valor de cartas:** A=1 u 11, J/Q/K=10, resto su número.
- **Soft hand:** mano con As contando como 11.
- **Blackjack:** A + 10/J/Q/K con las dos primeras cartas. Paga 3:2 (apuesta 10 → gana 15).
- **Dealer en S17:** se planta en cualquier 17, incluyendo soft 17.
- **Split:** sólo en pares de mismo valor. Pares de Ases reciben una sola carta cada uno.
- **Double:** sólo con las dos primeras cartas de una mano (o tras split si DAS).
- **Surrender (rendición tardía):** sólo antes de cualquier otra acción, recupera 50% de la apuesta. No permitido contra blackjack del dealer.
- **Insurance:** se ofrece sólo cuando el dealer muestra As. Cuesta 50% de la apuesta original, paga 2:1 si dealer tiene blackjack.

## Hi-Lo (sistema de conteo)

- 2,3,4,5,6 → +1
- 7,8,9 → 0
- 10,J,Q,K,A → −1
- **True count = running count / barajas restantes** (estimar barajas con cartas restantes ÷ 52).
- **Apuesta sugerida:** unidades = max(1, true count − 1). Configurable.

## Cómo trabajar (workflow para agentes)

1. **Leer `docs/PRD.md` antes de cualquier feature nueva.** Las decisiones de producto viven ahí.
2. **TDD cuando aplique:** para lógica de `src/lib/`, escribir test primero.
3. **Cambios pequeños y commiteables.** Un commit = una unidad lógica.
4. **No tocar `src/components/ui/`** (shadcn) salvo a través de `shadcn add`.
5. **Si una regla del blackjack no está en este archivo ni en PRD, preguntar antes de implementar.**

## Cosas que NO hacer

- No usar `any` ni `@ts-ignore`.
- No meter lógica de negocio en componentes React.
- No usar `localStorage` directamente — usar helpers en `src/lib/storage/`.
- No instalar librerías nuevas sin justificación (este stack es suficiente).
- No "redondear" matemáticas del blackjack. Las probabilidades son exactas.