# PRD — Blackjack Trainer

**Versión:** 1.0
**Fecha:** Mayo 2026
**Estado:** Activo

## 1. Visión

Una aplicación web que enseña blackjack como disciplina: estrategia básica perfecta primero, luego desviaciones avanzadas, finalmente conteo de cartas Hi-Lo. El usuario sale capaz de jugar con ventaja matemática en un casino real.

## 2. Usuario objetivo

Aprendiz serio de blackjack que quiere dominar el juego matemáticamente. No es un jugador casual buscando entretenimiento.

## 3. Reglas de la mesa (predeterminadas)

- 6 barajas, penetración 75%
- Dealer se planta en soft 17 (S17)
- Doble permitido en cualquier total inicial
- Doble después de split permitido (DAS)
- Rendición tardía permitida (LS)
- Re-split hasta 4 manos. Pares de Ases: una sola carta, sin re-split
- Blackjack paga 3:2
- Insurance ofrecida cuando dealer muestra As

Todas las reglas son configurables en Ajustes.

## 4. Fases del producto

### Fase 1 — Mesa funcional (MVP base)

**Objetivo:** jugar manos de blackjack completas contra el dealer.

**Funcionalidades:**
- Mazo de 6 barajas con barajado Fisher-Yates y cut card al 75%
- Acciones: Hit, Stand, Double, Split, Surrender (cuando aplique)
- Apuesta configurable, bankroll persistente
- Animaciones básicas de reparto
- Resolución completa de la mano (incluye splits múltiples)
- Pago correcto (BJ 3:2, push, win 1:1, loss)

**Criterios de aceptación:**
- 100 manos jugadas sin bugs de cálculo de totales
- Splits con As reciben una sola carta
- Soft/hard hands calculadas correctamente
- Insurance ofrecida y resuelta correctamente

### Fase 2 — Tutor de estrategia básica

**Objetivo:** validar cada decisión del jugador contra la estrategia óptima.

**Funcionalidades:**
- Tabla de estrategia básica completa (hard, soft, pares) para reglas S17 + DAS
- **Modo Tutor (ON/OFF):** antes de cada decisión muestra si tu jugada es la óptima
- **Modo Examen:** sin pistas, solo registra aciertos/errores
- Tabla de estrategia consultable como referencia (vista de matriz)
- Estadísticas: % decisiones correctas, top 5 errores, mapa de calor

**Criterios de aceptación:**
- Tabla validada contra fuente canónica (Wizard of Odds, S17 + DAS + LS)
- Modo Tutor responde en < 50ms
- Stats persisten en LocalStorage

### Fase 3 — Estrategia avanzada (desviaciones)

**Objetivo:** enseñar cuándo desviarse de la estrategia básica según el conteo.

**Funcionalidades:**
- **Illustrious 18:** las 18 desviaciones más rentables
- **Fab 4:** desviaciones de rendición
- Cada desviación se muestra con su índice y explicación
- Drill específico de desviaciones

**Criterios de aceptación:**
- Índices validados (ej. 16 vs 10: stand si TC ≥ 0)
- Drill genera escenarios con conteo conocido

### Fase 4 — Conteo de cartas Hi-Lo

**Objetivo:** practicar conteo en tiempo real y entender ventaja.

**Funcionalidades:**
- Running count y true count calculados en tiempo real
- **Modo entrenamiento:** counts visibles
- **Modo examen:** counts ocultos, pide al jugador su count al final del shoe
- **Drill de velocidad:** muestra cartas a velocidad configurable, pide running count
- **Indicador de ventaja:** muestra unidades de apuesta sugeridas según TC
- Estimación de barajas restantes visible (opcional)

**Criterios de aceptación:**
- Hi-Lo: 2-6 = +1, 7-9 = 0, 10-A = −1
- TC = RC / barajas restantes
- Apuesta sugerida = max(1, TC − 1) × unidad base
- Drill soporta velocidades 1s/carta hasta 0.25s/carta

### Fase 5 — Simulador y análisis

**Objetivo:** ver desempeño en sesiones largas.

**Funcionalidades:**
- Simulación de N manos con tu estrategia actual
- Gráfico de bankroll
- Comparación: básica vs básica+conteo vs aleatorio
- Métricas: EV/hora estimado, varianza, RoR (Risk of Ruin)

## 5. Modelo de datos (core)

```typescript
type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

interface Card { rank: Rank; suit: Suit; }

interface Hand {
  cards: Card[];
  bet: number;
  isDoubled: boolean;
  isSplit: boolean;
  isSurrendered: boolean;
  isStood: boolean;
}

type Action = 'hit' | 'stand' | 'double' | 'split' | 'surrender' | 'insurance';

interface RulesConfig {
  decks: number;
  dealerHitsSoft17: boolean;
  doubleAfterSplit: boolean;
  surrender: 'late' | 'early' | 'none';
  blackjackPayout: 1.5 | 1.2; // 3:2 vs 6:5
  maxSplits: number;
  penetration: number; // 0-1
}

interface CountState {
  runningCount: number;
  trueCount: number;
  decksRemaining: number;
  cardsSeen: number;
}
```

## 6. Estados de UI principales

- **Betting:** jugador define apuesta, no se reparten cartas
- **Dealing:** repartiendo cartas iniciales
- **PlayerTurn:** jugador decide acciones por cada mano
- **DealerTurn:** dealer juega su mano
- **Resolution:** se calculan pagos
- **GameOver:** bankroll = 0 (oferta de reset)

## 7. Persistencia

LocalStorage con keys:
- `bj:bankroll` — número
- `bj:rules` — RulesConfig
- `bj:stats` — historial agregado
- `bj:settings` — preferencias UI (tutor on/off, count visible, etc.)

## 8. No-objetivos (fuera de alcance del MVP)

- Multijugador
- Apuestas con dinero real
- Otros juegos (poker, baccarat)
- App móvil nativa (PWA suficiente)
- Backend / sincronización de cuenta
- Sistemas de conteo distintos a Hi-Lo (KO, Hi-Opt II) — diferido a v2

## 9. Métricas de éxito

- Usuario completa 500 manos en modo Tutor con > 95% de decisiones correctas
- Usuario pasa drill de conteo a 1s/carta con shoe completo sin error
- App responde sin lag perceptible (< 100ms en cualquier acción)