# Bitácora del proyecto

Registro de progreso para retomar en sesiones futuras con Cursor/Claude.

## Estado actual

**Fecha último avance:** 14 mayo 2026
**Fase activa:** Fase 2 — Tutor de estrategia básica
**Progreso Fase 1:** COMPLETADA ✅ (12 issues principales + 4 sub-issues de refinamiento)
**Progreso Fase 2:** 1/N issues (#13 cerrado)

## Hitos cerrados

### Fase 1 — Mesa funcional ✅ COMPLETADA

Issues principales (12): #1 setup Vitest, #2 tipos del dominio, #3 mazo, #4 hand value, #5 acciones legales, #6 dealer, #7 payout, #8 store de Zustand, #9 componente Card, #10 componente Hand, #11 mesa principal, #12 BetSelector.

Sub-issues de refinamiento (4):

- **#10b (GH #13):** aria-label dealer + extraer hardTotal a handValue
- **#11b (GH #14):** ritmo en dealer turn + banner reforzado
- **#11c (GH #15):** persistir cartas tras round + dealer no jugó en banner
- **#11d (GH #16):** pausa antes del banner en dealer BJ natural

**Resultado de Fase 1:** mesa funcional jugable end-to-end con todas las reglas correctas, persistencia de bankroll/rules/bet, ritmo visible del dealer, banner pedagógico, sandbox de componentes validado en producción, deploy en Vercel.

## Fase 2 — En curso

Issues cerrados:

- **#13:** Tutor de estrategia básica (S17/DAS/LS) + auto-deal entre manos.

## Métricas al cierre de Fase 1

- **Tests:** 183 pasando en 16 archivos
- **Coverage:** global > 90%, `src/lib/blackjack/*` 100%, `src/lib/storage/*` cubierto
- **Lint:** 0 errores, 0 warnings
- **TypeScript:** estricto, sin `any`
- **Deploy:** [https://blackjack-trainer-two-silk.vercel.app/](https://blackjack-trainer-two-silk.vercel.app/)
- **Sandbox visual:** [https://blackjack-trainer-two-silk.vercel.app/sandbox](https://blackjack-trainer-two-silk.vercel.app/sandbox)

## Cómo retomar en próxima sesión

1. Leer en orden: `AGENTS.md` → `docs/PRD.md` → `docs/BITACORA.md`.
2. Abrir el repo: `cursor C:\dev\blackjack-trainer`
3. Verificar sincronización:

```powershell
git pull
npm install
npm test
```

Deberías ver 231 tests pasando y `main` sincronizado con `origin/main`.

1. Próximo issue: **#14 — Vista de matriz de estrategia consultable**.
   Si no se conserva el contexto, pedir al asistente regenerar el prompt referenciando:
   - PRD sección 4.2 (Fase 2 — Tutor de estrategia básica)
   - PRD sección 9 (métricas: <50ms respuesta del tutor)
   - Bloque "Auto-deal entre manos" en este archivo (ya implementado como decisión técnica)

## Decisiones técnicas relevantes (acumuladas)

- `isBust` NO se almacena en Hand; se calcula vía `handValue()`. Fuente única de verdad: `cards`.
- `Shoe = ReadonlyArray<Card>`: array inmutable. Draw devuelve nuevo shoe.
- `canSplitByValue` vs `isPair`: split por valor (10-J cuenta) según regla Strip; isPair es por rank exacto.
- `isFromSplitAces`: contexto que bloquea hit/double/split en manos de split-aces.
- `utils.ts` (helper shadcn `cn()`) excluido de coverage.
- `handValue` expone `hardTotal` y `softTotal` explícitos (#10b). Componentes UI no calculan aritmética del As.
- `Hand` recibe `role: 'player' | 'dealer'` explícito para aria-labels correctos (#10b).
- `playDealerHand` retorna `steps: Card[]` además del estado final (#11b). Permite UI orquestar ritmo.
- Store granular para dealer turn: `revealHoleCard`, `dealerDrawNext`, `finishDealerTurn` (#11b).
- `DEALER_RHYTHM` constante en `Table.tsx`: beforeReveal 600ms, betweenCards 500ms, beforeFinish 400ms (#11b).
- `nextRound` solo limpia `lastRoundResult`. Cartas persisten hasta próximo `deal()` (#11c).
- `RoundResult.dealerPlayed: boolean` para comunicar "Dealer no jugó" cuando aplica (#11c).
- `playDealer` con 3 rutas: cascadeo directo (nadie vivo), ritmo corto (dealer BJ con jugador vivo), ritmo normal (#11d).
- `currentBet` persistido en localStorage (#12). `BetSelector` con presets + input + validación.
- **Auto-deal entre manos:** botón principal "Siguiente mano" ejecuta `nextRound()` + `deal()` con `currentBet` persistido. Botón secundario "Cambiar apuesta" hace solo `nextRound()`. **Implementado en #13**.
- **Estrategia básica:** tablas S17/DAS/LS en `src/lib/strategy/basicStrategy.ts`, con notación `Dh/Ds/P/Ph/Ps/Rh/Rs/Rp` para resolver fallbacks limpios según acciones legales.
- **Separación de stores:** `trainerStore` separado de `gameStore` para aislar feedback pedagógico de la lógica de mesa.
- **Timing de tracking:** captura de decisión antes de ejecutar la acción de `gameStore` (crítico para no registrar estado mutado).
- **Pares de valor 10:** manos 10/J, J/Q, etc. se categorizan como `'TT'` y siguen la tabla de pares (stand), consistente con `canSplitByValue`.
- **Histórico de errores:** `stats.mistakes` guarda todos los errores históricos; `topMistakes()` es solo selector top 5.
- **Estado efímero de round:** `currentRoundDecisions` y `lastDecision` no se persisten; se limpian con `clearCurrentRoundDecisions` al avanzar de mano.

## Deuda técnica registrada

### UI / UX

- **Estado "Rendido" visualmente sutil:** el badge actual usa fondo `slate-50` + cursiva + texto `slate-500`. En auditoría visual del sandbox (deploy de Vercel) se confirmó que se distingue poco del estado normal. No bloqueante para Fase 1, pero conviene revisarlo antes de Fase 2 (Tutor de estrategia básica), donde el feedback inmediato sobre decisiones del jugador es central. Opciones a evaluar: fondo naranja/amarillo apagado, icono prepended (ej. `🏳️`), peso de fuente más alto.
- **Cartas numéricas sin pip layout:** el centro de cada carta muestra un único símbolo grande del palo en lugar del layout tradicional de pips (ej. siete corazones distribuidos para el `7♥`). Funciona para reconocimiento general pero la diferencia entre cartas numéricas depende exclusivamente de la lectura del rank en la esquina. Evaluar antes de Fase 4 (drill de conteo Hi-Lo a `0.25s/carta`) porque la velocidad de reconocimiento podría no ser suficiente con el diseño actual.
- **Velocidad del dealer turn configurable:** hoy hardcodeada en `DEALER_RHYTHM` (`beforeReveal: 600`, `betweenCards: 500`, `beforeFinish: 400`). Implementar en Ajustes como preset (`lento`/`medio`/`rápido`) cuando exista esa pantalla.
- **Animación de flip de carta pendiente:** la hole card se revela de forma instantánea (sin transición). Evaluar flip CSS 3D en etapa de pulido visual.

### Validaciones pendientes

- **Performance en móvil real:** sandbox validado solo en desktop. Probar en dispositivo físico (no DevTools responsive) antes de Issue #11.

### Persistencia del round en F5

Comportamiento actual: si el usuario refresca la página durante un round, pierde el round entero (incluido el bet ya descontado del bankroll). El bankroll persistido refleja el descuento del bet pero no se devuelve.

Esto es coherente con la decisión arquitectónica original (#8): el round en curso no se persiste para evitar complejidad de hidratación con un state machine a mitad de transición.

**Justificación de no arreglarlo ahora:** la mayoría de apps de casino online se comportan igual. F5 durante una mano es responsabilidad del usuario.

**Si se decide cambiar:** la opción más simple es persistir `roundStartBankroll` y, al detectar al cargar que había un round en curso (presencia de cartas en `playerHands`), restituir el bet al bankroll antes de inicializar como `betting`. Esto trata el round abandonado como "nunca pasó". Cambio estimado: ~30 líneas, riesgo bajo si se hace con tests.

### Velocidad del dealer turn imperceptible en ritmo corto

El ritmo corto del dealer turn (caso de BJ natural, ~1s total) implementado en #11d es tecnicamente correcto pero perceptualmente sutil; en validacion visual el usuario puede no notarlo de forma consciente.

**Propuesta:** cuando exista la pantalla de Ajustes (Fase 2 o issue independiente), exponer `DEALER_RHYTHM` como configurable con presets:

- Lento (pedagogico): reveal `1200ms`, between `800ms`, finish `600ms`.
- Medio (actual): reveal `600ms`, between `500ms`, finish `400ms`.
- Rapido: reveal `300ms`, between `250ms`, finish `200ms`.

Default recomendado: **Medio**. El preset Lento ayuda especialmente para principiantes en Fase 2 (Tutor).

## Ideas para Fase 4 (conteo)

### Contador Hi-Lo con modos de visibilidad

Cuando se implemente el contador, soportar 3 modos:

- **Siempre visible:** entrenamiento inicial.
- **Oculto + hover/tap para revelar:** el usuario lleva cuenta mental y revela para verificar. Modo intermedio entre entrenamiento y examen.
- **Siempre oculto + quiz al final del shoe:** modo examen puro.

Selector en Ajustes para elegir el modo.

### Probabilidades de la próxima carta

Calcular y mostrar (en el drawer de auditoría, tab dedicado):

- Distribución de cartas restantes en el shoe (qué quedó después de descartes).
- Probabilidades por rango Hi-Lo: P(carta baja 2-6), P(carta neutra 7-9), P(carta alta 10-A).
- Top 3 cartas más probables para próxima saca del dealer.
- Top 3 cartas más probables para próxima saca del jugador.

Pedagógicamente útil para calibrar intuición sin contar carta por carta.

Encaja en el drawer de auditoría planificado (Issue #15) como tab adicional junto a "Cartas jugadas" e "Historial de manos".

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

## Métricas al avance de Fase 2 (#13)

- **Tests:** 231 pasando
- **Coverage:** global 94.44% (branches 93.23%)
- **Lint:** 0 errores
- **Build:** `next build` verde

## Próximo paso sugerido

- **Issue #14:** Vista de matriz de estrategia consultable.
- Alternativa: saltar a desviaciones (Illustrious 18 / Fab 4) según preferencia del usuario.
