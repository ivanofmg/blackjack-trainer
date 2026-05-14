# Bitácora del proyecto

Registro de progreso para retomar en sesiones futuras con Cursor/Claude.

## Estado actual

**Fecha último avance:** 14 mayo 2026
**Fase activa:** Fase 1 — Mesa funcional
**Progreso Fase 1:** 8/12 issues cerrados (store completo + falta UI)

## Issues cerrados

- **#1** Setup Vitest — `vitest.config.ts`, jsdom, plugin React, coverage v8 con thresholds 90%
- **#2** Tipos base del dominio — `src/lib/blackjack/types.ts`
- **#3** Mazo (deck) — `src/lib/blackjack/deck.ts`: Fisher-Yates seedable, cut card, drawCard inmutable
- **#4** Valor de mano — `src/lib/blackjack/hand.ts`: handValue (soft/hard), isPair, canSplitByValue, cardValue
- **#5** Acciones legales — `src/lib/blackjack/actions.ts`: legalActions con DAS, split-aces lockdown, insurance
- **#6** Dealer — `src/lib/blackjack/dealer.ts`: shouldDealerHit (S17/H17), playDealerHand
- **#7** Resolución de pagos — `src/lib/blackjack/payout.ts`: resolveHand, resolveRound (BJ 3:2/6:5, surrender)
- **#8** Store de juego — `src/store/gameStore.ts`: state machine completa del round, acciones de juego, selectores, persistencia parcial y soporte deterministic seed para tests

## Issues abiertos en Fase 1

- **#9** UI: componente Card (carta visual)
- **#10** UI: componente Hand (mano visible)
- **#11** UI: mesa principal con dealer + jugador + controles
- **#12** UI: pantalla de apuestas

## Métricas actuales

- **Tests:** 91 pasando en 9 archivos
- **Coverage:** 100% en `src/lib/blackjack/*` y >90% global
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
- **Store con `persist` parcial (`bankroll`, `rules`)**: round en curso no se persiste para evitar estados inconsistentes tras reload.
- **Persistencia centralizada en `src/lib/storage/*`** con guard SSR (`window` undefined) para Next.js.
- **`RoundResult` en store**: guarda resoluciones por mano, neto total de la ronda e impacto de insurance para UI.

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

**Issue #9 — Componente Card.** Empezar capa UI usando el store ya cerrado
como fuente única de estado para renderizar cartas/manos en mesa.

## Lecciones aprendidas

### Issue #8 — Store de Zustand
- **Qué funcionó:** Delegar todo el cálculo a `src/lib/blackjack/*` evitó duplicar reglas en el store; en `src/store/gameStore.ts` quedó claro qué era orquestación de fases y qué era matemática (`legalActions`, `playDealerHand`, `resolveRound`). También funcionó bien exponer selectores (`selectLegalActions`, `selectActiveHand`, `selectDealerUpcard`) para no meter lógica de negocio en componentes.
- **Qué costó más de lo esperado:** El flujo de `deal()` cuando el jugador tiene blackjack natural fue más delicado de lo previsto, especialmente para no forzar `playDealerHand()` innecesariamente cuando el resultado podía resolverse directo. También hubo fricción en la política de hidratación (`useHydratedGameStore`) por una regla de lint de React (`set-state-in-effect`) y en mantener transiciones automáticas coherentes entre `playerTurn -> dealerTurn -> resolution`.
- **Decisiones que reevaluaría:** `RoundResult` quedó útil, pero podría separarse en un tipo compartido en `src/lib/` para evitar que su forma viva solo en el store. El ID con contador interno (`hand-1`, `hand-2`) funcionó para tests y round local, pero en UI compleja sería más robusto usar `crypto.randomUUID()` para evitar colisiones en escenarios de montaje/desmontaje.
- **Para próximos issues:** En UI usar siempre `selectLegalActions()` y `selectShouldOfferInsurance()` en lugar de recalcular desde estado crudo. Evitar disparar acciones del store fuera de fase (por ejemplo llamar `hit()` en `betting`) y respetar que `phase` es la fuente de verdad del flujo. Para tests futuros, seguir inyectando shoe determinístico con `__setShoe()` y seed con `__setRngSeed()` porque redujo muchísimo la fragilidad de casos de split/insurance/BJ.

## Repo

https://github.com/ivanofmg/blackjack-trainer