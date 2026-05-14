# Bitácora del proyecto

Registro de progreso para retomar en sesiones futuras con Cursor/Claude.

## Estado actual

**Fecha último avance:** 14 mayo 2026
**Fase activa:** Fase 1 — Mesa funcional
**Progreso Fase 1:** 7/12 issues cerrados (lógica de negocio completa, falta store + UI)

## Issues cerrados

- **#1** Setup Vitest — `vitest.config.ts`, jsdom, plugin React, coverage v8 con thresholds 90%
- **#2** Tipos base del dominio — `src/lib/blackjack/types.ts`
- **#3** Mazo (deck) — `src/lib/blackjack/deck.ts`: Fisher-Yates seedable, cut card, drawCard inmutable
- **#4** Valor de mano — `src/lib/blackjack/hand.ts`: handValue (soft/hard), isPair, canSplitByValue, cardValue
- **#5** Acciones legales — `src/lib/blackjack/actions.ts`: legalActions con DAS, split-aces lockdown, insurance
- **#6** Dealer — `src/lib/blackjack/dealer.ts`: shouldDealerHit (S17/H17), playDealerHand
- **#7** Resolución de pagos — `src/lib/blackjack/payout.ts`: resolveHand, resolveRound (BJ 3:2/6:5, surrender)

## Issues abiertos en Fase 1

- **#8** Estado: store de Zustand para el juego (siguiente, el más complejo)
- **#9** UI: componente Card (carta visual)
- **#10** UI: componente Hand (mano visible)
- **#11** UI: mesa principal con dealer + jugador + controles
- **#12** UI: pantalla de apuestas

## Métricas actuales

- **Tests:** 68 pasando en 7 archivos
- **Coverage:** 100% en statements/branches/functions/lines para todos los archivos de `src/lib/blackjack/*`
- **Lint:** 0 errores, 0 warnings
- **TypeScript:** estricto, sin `any`

## Convenciones establecidas

- Lógica de negocio en `src/lib/blackjack/*`, todo funciones puras, sin React
- Tests en `tests/unit/*.test.ts`
- Imports con alias `@/*`
- Helpers de test: `makeCard`, `makeHand`, `makeContext`, `makeShoe` (pattern usado en actions/dealer tests)
- `mulberry32` para RNG determinístico en tests de shuffle
- Commits siguiendo conventional commits con `(#N)` para vincular issues
- Cierre de issue con `gh issue close N --comment "..."` después de push

## Ritual de verificación tras cada issue

```powershell
git status
git diff
npm test
npm run lint
npm run test:coverage
```

Pasar los 4 antes de commit + push + close issue.

## Decisiones técnicas relevantes

- **`isBust` NO se almacena en Hand**: se calcula vía `handValue()`. Fuente única de verdad: `cards`.
- **`Shoe = ReadonlyArray<Card>`**: no es clase, es array inmutable. Draw devuelve nuevo shoe.
- **`canSplitByValue` vs `isPair`**: split por valor (10-J cuenta) según regla común Strip; isPair es por rank exacto.
- **`isFromSplitAces`**: contexto que bloquea hit/double/split en manos de split-aces (solo 1 carta, solo stand).
- **`utils.ts` (helper shadcn `cn()`) excluido de coverage**: no es lógica de negocio.

## Reglas de la mesa (DEFAULT_RULES — Strip de Las Vegas)

- 6 barajas
- Dealer se planta en soft 17 (`dealerHitsSoft17: false`)
- Doble después de split permitido (`doubleAfterSplit: true`)
- Rendición tardía (`surrender: 'late'`)
- Blackjack paga 3:2 (`blackjackPayout: 1.5`)
- Máximo 4 splits (`maxSplits: 4`)
- Penetración 75% (`penetration: 0.75`)

## Stack confirmado

- Next.js 16.2.6 (App Router, TypeScript)
- Tailwind CSS v4
- shadcn/ui (preset Nova, color base Neutral)
- Zustand (instalado, sin usar todavía — se usa en Issue #8)
- Vitest 4 + Testing Library + jsdom
- @vitest/coverage-v8

## Comandos clave

```powershell
npm run dev              # Servidor de desarrollo
npm test                 # Correr tests una vez
npm run test:watch       # Watch mode
npm run test:coverage    # Tests con reporte de coverage
npm run lint             # ESLint
npm run build            # Build de producción (no ejecutado aún)
```

## Cómo retomar en próxima sesión

1. Leer `AGENTS.md`, `docs/PRD.md`, y este `BITACORA.md`.
2. Abrir el repo en Cursor: `cursor C:\dev\blackjack-trainer`
3. Verificar que todo sigue verde:
```powershell
   git pull
   npm install
   npm test
```
4. Confirmar que estás en branch `main` y sincronizado con `origin/main`.
5. Continuar con Issue #8 (store de Zustand). Pedirle al asistente
   el prompt detallado para este issue antes de empezar.

## Próximo paso

**Issue #8 — Store de Zustand.** Este conecta toda la lógica de negocio
en un solo estado reactivo. Será el más complejo de Fase 1 porque
maneja el ciclo de vida completo del round: betting → dealing →
playerTurn (con manos múltiples por split) → dealerTurn → resolution.
Pedir al asistente el prompt detallado al inicio de la próxima sesión.

## Repo

https://github.com/ivanofmg/blackjack-trainer