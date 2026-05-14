# Bitácora del proyecto

Registro de progreso para retomar en sesiones futuras con Cursor/Claude.

## Estado actual

**Fecha último avance:** 14 mayo 2026
**Fase activa:** Fase 1 — Mesa funcional
**Progreso Fase 1:** 11/12 issues cerrados (mesa principal integrada; falta UI completa de apuesta)

## Issues cerrados

- **#1** Setup Vitest — `vitest.config.ts`, jsdom, plugin React, coverage v8 con thresholds 90%
- **#2** Tipos base del dominio — `src/lib/blackjack/types.ts`
- **#3** Mazo (deck) — `src/lib/blackjack/deck.ts`: Fisher-Yates seedable, cut card, drawCard inmutable
- **#4** Valor de mano — `src/lib/blackjack/hand.ts`: handValue (soft/hard), isPair, canSplitByValue, cardValue
- **#5** Acciones legales — `src/lib/blackjack/actions.ts`: legalActions con DAS, split-aces lockdown, insurance
- **#6** Dealer — `src/lib/blackjack/dealer.ts`: shouldDealerHit (S17/H17), playDealerHand
- **#7** Resolución de pagos — `src/lib/blackjack/payout.ts`: resolveHand, resolveRound (BJ 3:2/6:5, surrender)
- **#8** Store de juego — `src/store/gameStore.ts`: state machine completa del round, acciones de juego, selectores, persistencia parcial y soporte deterministic seed para tests
- **#9** UI: componente Card — `src/components/game/Card.tsx`: carta visual presentacional con estados face-up/face-down, tamaños `sm|md|lg`, resaltado opcional y accesibilidad en español
- **#10** UI: componente Hand — `src/components/game/Hand.tsx`: composición de múltiples `Card` con solapamiento horizontal, estado activo y badge de total (normal/soft/BJ/bust/surrender)
- **#10b** Fix post-review de Hand — `src/lib/blackjack/hand.ts` ahora expone `hardTotal`/`softTotal`; `Hand` recibe `role` para aria-label correcto de dealer en playerTurn y resolution
- **#11** UI: mesa principal — `src/components/game/Table.tsx` + áreas dealer/jugador + controles + insurance prompt + banner de resultado + game over, todo conectado a `src/store/gameStore.ts`

## Issues abiertos en Fase 1

- **#12** UI: pantalla de apuestas

## Métricas actuales

- **Tests:** 136 pasando en 13 archivos
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
- **Componente `Card` puramente presentacional**: sin estado interno, sin conexión a store y sin lógica de blackjack.
- **Diseño de naipe con proporción real (2.5:3.5)**: tamaños fijos `sm` (48x67), `md` (80x112), `lg` (112x156) para consistencia visual en mesa y drill.
- **Palos Unicode como fuente única de render (`♥ ♦ ♣ ♠`)**: evita assets externos y mantiene legibilidad/accesibilidad.
- **Sin animaciones en `Card`**: flips y reparto quedan reservados para componentes padre (`Hand`/mesa).
- **Propagación de `size` por props explícitos (no Context)**: decisión vigente para toda la capa UI (`Mesa -> Area -> Hand -> Card`).
- **Solapamiento horizontal ~30% entre cartas en `Hand`**: layout en fila con margen negativo por tamaño para mantener legibilidad.
- **Badge de total en `Hand` con `aria-live="polite"`**: anuncia cambios de total sin depender de animaciones.
- **`hideHoleCard` no oculta total automáticamente**: el padre decide visibilidad del badge con `showTotal`.
- **Página `/sandbox` para preview visual de componentes UI sin conectar al store**: útil para auditoría visual y deploys de validación temprana.
- **`handValue` expone `hardTotal` y `softTotal` explícitos**: UI deja de inferir matemática de Ases; el componente `Hand` solo consume datos de dominio.
- **`Hand` usa prop `role` (`player`/`dealer`) para accesibilidad**: el aria-label ya no depende de `hideHoleCard` para distinguir actor de la mano.
- **Mesa principal en `/` como Server Component + `Table` client wrapper**: evita mismatch SSR al encapsular Zustand en componentes cliente.
- **Hidratación controlada con `useHydratedGameStore` en `Table`**: se renderiza `TableSkeleton` hasta terminar hydration de persist para evitar inconsistencias iniciales.
- **Mapeo explícito `PlayerHand -> HandData` en `PlayerArea`**: se eliminan campos extra (`id`, `isResolved`, `isFromSplitAces`) antes de pasar props a `Hand`, manteniendo contrato de presentación estable.

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

- Leer `AGENTS.md`, `docs/PRD.md`, y este `BITACORA.md`.
- Abrir el repo en Cursor: `cursor C:\dev\blackjack-trainer`
- Verificar que todo sigue verde:

```powershell
git pull
npm install
npm test
```

- Confirmar que estás en branch `main` y sincronizado con `origin/main`.
- Continuar con Issue #12 (UI de apuestas completa). Pedirle al asistente
  el prompt detallado para este issue antes de empezar.

## Próximo paso

**Issue #12 — UI de apuestas completa.** Reemplazar placeholder de "Repartir"
por selector completo de apuesta (chips/input/validaciones) integrado con bankroll
y fases del round.

## Lecciones aprendidas

### Issue #8 — Store de Zustand

- **Qué funcionó:** Delegar todo el cálculo a `src/lib/blackjack/*` evitó duplicar reglas en el store; en `src/store/gameStore.ts` quedó claro qué era orquestación de fases y qué era matemática (`legalActions`, `playDealerHand`, `resolveRound`). También funcionó bien exponer selectores (`selectLegalActions`, `selectActiveHand`, `selectDealerUpcard`) para no meter lógica de negocio en componentes.
- **Qué costó más de lo esperado:** El flujo de `deal()` cuando el jugador tiene blackjack natural fue más delicado de lo previsto, especialmente para no forzar `playDealerHand()` innecesariamente cuando el resultado podía resolverse directo. También hubo fricción en la política de hidratación (`useHydratedGameStore`) por una regla de lint de React (`set-state-in-effect`) y en mantener transiciones automáticas coherentes entre `playerTurn -> dealerTurn -> resolution`.
- **Decisiones que reevaluaría:** `RoundResult` quedó útil, pero podría separarse en un tipo compartido en `src/lib/` para evitar que su forma viva solo en el store. El ID con contador interno (`hand-1`, `hand-2`) funcionó para tests y round local, pero en UI compleja sería más robusto usar `crypto.randomUUID()` para evitar colisiones en escenarios de montaje/desmontaje.
- **Para próximos issues:** En UI usar siempre `selectLegalActions()` y `selectShouldOfferInsurance()` en lugar de recalcular desde estado crudo. Evitar disparar acciones del store fuera de fase (por ejemplo llamar `hit()` en `betting`) y respetar que `phase` es la fuente de verdad del flujo. Para tests futuros, seguir inyectando shoe determinístico con `__setShoe()` y seed con `__setRngSeed()` porque redujo muchísimo la fragilidad de casos de split/insurance/BJ.

### Issue #8b — Cierre de agujeros de cobertura

- **Qué funcionó:** Los tres escenarios se pudieron expresar con el harness actual de `tests/unit/gameStore.test.ts` (`setRoundShoe`, `state`, `beforeEach(resetStore)`) sin tocar producción; eso confirma que el store ya era testeable de forma determinista.
- **Qué costó más de lo esperado:** Nada notable. Los tres casos (push BJ mutuo, `declineInsurance` sin BJ dealer y bloqueo de re-split en split-aces) pasaron al primer intento.
- **Decisiones que reevaluaría:** Mantener `setRoundShoe`/`__setShoe` como mecanismo de inyección para pruebas fue correcto; por ahora no cambiaría esa decisión porque evita flaky tests sin contaminar la API de runtime.
- **Para próximos issues:** Para UI conviene cubrir primero rutas de estado no triviales con tests de store (seguros, BJ automático, split-aces) y recién después renderizar componentes; reduce muchísimo debugging visual al integrar `Issue #9` en adelante.

### Issue #9 — Componente Card

- **Qué funcionó:** Separar `CardProps` en `Card.types.ts` evitó fricción de nombres con el tipo de dominio (`Card` vs `CardData`) y dejó clara la frontera entre contrato visual y modelo de blackjack.
- **Qué costó más de lo esperado:** Ajustar tamaños exactos de naipe real (`48x67`, `80x112`, `112x156`) sin romper legibilidad de esquinas obligó a escalar tipografía/padding por tamaño; un único set de clases no funcionaba bien en los tres casos.
- **Decisiones que reevaluaría:** El símbolo central del palo en face-up aporta balance visual, pero en `sm` podría competir con el contenido de esquinas; para iteración futura evaluaría reducirlo un paso o hacerlo opcional por contexto.
- **Para próximos issues:** En `Hand` conviene definir una estrategia de `size` consistente (prop único heredado o context visual) para que dealer/jugador/historial no mezclen escalas arbitrarias al componer varias cartas.

### Issue #10 — Componente Hand

- **Qué funcionó:** Reutilizar `Card` sin estado y propagar `size` por props explícitos permitió mantener una composición limpia y predecible; el test de propagación evitó romper esta decisión arquitectónica al primer refactor.
- **Qué costó más de lo esperado:** Definir un `aria-label` de grupo útil en español fue más delicado de lo previsto, especialmente para distinguir contexto de dealer con hole card oculta sin filtrar información sensible del total por defecto.
- **Decisiones que reevaluaría:** El badge de total resuelve bien estados, pero en mesas con muchas manos simultáneas podría competir visualmente con controles; en iteración futura evaluaría compactarlo a un formato más corto en `sm`.
- **Para próximos issues:** En la mesa principal (#11), decidir explícitamente cuándo usar `hideHoleCard=true` y `showTotal=false` en dealer durante `playerTurn`; no dejar que el contenedor "adivine" estas reglas porque genera inconsistencias de información.

### Sandbox visual — preview de Card y Hand

- **Qué funcionó:** La ruta `/sandbox` permitió contrastar rápidamente tamaños, estados y composiciones reales (`Card` y `Hand`) sin depender de mocks del store ni montar la mesa completa.
- **Qué costó más de lo esperado:** Nada notable en implementación; la única fricción real es que la evaluación visual final depende de revisar en navegador real y viewport variados.
- **Decisiones que reevaluaría:** Si el sandbox crece con más componentes, convendría mover bloques repetidos a `src/app/sandbox/_components/` para mantener `page.tsx` corto y más mantenible.
- **Para próximos issues:** Verificar en navegador real spacing horizontal de manos largas y legibilidad de badges sobre fondos oscuros; estas sutilezas no aparecen en tests de jsdom aunque todo pase.

## Deuda técnica registrada

### UI / UX

- **Estado "Rendido" visualmente sutil:** el badge actual usa fondo `slate-50` + cursiva + texto `slate-500`. En auditoría visual del sandbox (deploy de Vercel) se confirmó que se distingue poco del estado normal. No bloqueante para Fase 1, pero conviene revisarlo antes de Fase 2 (Tutor de estrategia básica), donde el feedback inmediato sobre decisiones del jugador es central. Opciones a evaluar: fondo naranja/amarillo apagado, icono prepended (ej. `🏳️`), peso de fuente más alto.
- **Cartas numéricas sin pip layout:** el centro de cada carta muestra un único símbolo grande del palo en lugar del layout tradicional de pips (ej. siete corazones distribuidos para el `7♥`). Funciona para reconocimiento general pero la diferencia entre cartas numéricas depende exclusivamente de la lectura del rank en la esquina. Evaluar antes de Fase 4 (drill de conteo Hi-Lo a `0.25s/carta`) porque la velocidad de reconocimiento podría no ser suficiente con el diseño actual.

### Validaciones pendientes

- **Performance en móvil real:** sandbox validado solo en desktop. Probar en dispositivo físico (no DevTools responsive) antes de Issue #11.

## Resultado de auditoría visual post-deploy (sandbox)

**Fecha:** 14 mayo 2026  
**URL:** [https://blackjack-trainer-two-silk.vercel.app/sandbox](https://blackjack-trainer-two-silk.vercel.app/sandbox)

- Card en 3 tamaños: `✅` diferenciados, colores correctos, highlight visible.
- Galería de ranks: `✅` los 13 ranks renderizan correctamente.
- Estados de Hand: `✅` normal (17), soft (8/18), BJ, Bust (25 tachado + Bust), mano activa con ring `sky-400`.
- Soft hand muestra `hardTotal/softTotal` correctamente (validación del fix #10b en producción).
- Sección 6 (mano larga `[2♣, 3♦, 2♥, A♠, 2♣]`) muestra badge `10/20` — confirma cálculo correcto de `softTotal` en `handValue` para manos extendidas.
- Dealer con hole card: `✅` aria-label "Mano del dealer..." en ambos casos (oculta y revelada). Bug de accesibilidad de #10b resuelto en producción.
- Hole card: aria-label `"Carta boca abajo"`, no hay leak de palo o rank al screen reader.

## Repo

[https://github.com/ivanofmg/blackjack-trainer](https://github.com/ivanofmg/blackjack-trainer)
