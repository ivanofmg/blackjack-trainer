import { HARD_STRATEGY, PAIR_STRATEGY, SOFT_STRATEGY } from '@/lib/strategy/basicStrategy';
import type { Action } from '@/lib/blackjack/types';
import type { StrategyDecision } from '@/lib/strategy/types';

export interface Rationale {
  short: string;
  long: string;
}

export interface RationaleKey {
  category: 'hard' | 'soft' | 'pair';
  totalOrPair: string;
  upcard: '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'A';
}

const FALLBACK_RATIONALES: Readonly<Record<Action, Rationale>> = {
  hit: {
    short: 'La carta esperada mejora más de lo que te arriesgás a pasarte.',
    long: 'Tu total actual pierde más manos que las que ganaría plantándose. Aceptar una carta más, en promedio, mejora la expectativa frente a esta carta del dealer.',
  },
  stand: {
    short: 'Plantarse es lo menos malo: pegar te hace explotar más veces de las que ganarías.',
    long: 'Frente a esta carta del dealer, las cartas que te pasarían de 21 son demasiadas. El dealer todavía puede romper su mano, y esa probabilidad es mejor que la de mejorar la tuya pegando.',
  },
  double: {
    short: 'Tu mano es lo bastante fuerte frente a una carta débil del dealer: vale duplicar.',
    long: 'Doblar es rentable cuando una sola carta mejora tu mano de forma decisiva y el dealer está en posición débil. El valor esperado de la apuesta duplicada supera al de pegar normal.',
  },
  split: {
    short: 'Dividir convierte una mano floja en dos manos con mejor expectativa.',
    long: 'Mantener este par como una sola mano tiene expectativa pobre. Dividir aprovecha la debilidad del dealer y crea dos manos cuyo valor esperado conjunto supera al de jugar la mano original.',
  },
  surrender: {
    short: 'Rendirse acá te ahorra dinero: ninguna jugada gana más de la mitad de las veces.',
    long: 'En esta combinación, todas las acciones tienen valor esperado peor que recuperar la mitad de la apuesta. Surrender no es debilidad: es la jugada óptima cuando nada gana.',
  },
  insurance: {
    short: 'Este caso no tiene rationale de seguro en este flujo.',
    long: 'El razonamiento de insurance se resuelve en un flujo separado. Acá solo se explica la decisión principal de estrategia básica.',
  },
};

const RATIONALE_TABLE: Readonly<Record<string, Rationale>> = {
  // Soft A2-A7
  'soft|A2|5': {
    short: 'Tu A,2 frente a carta débil del dealer es momento de presionar doblando.',
    long: 'A,2 todavía es una mano flexible: no te pasás con una carta alta. Contra 5 o 6 el dealer rompe seguido, así que conviene aumentar la apuesta en ese spot. El extra de valor al doblar supera al de jugar hit normal.',
  },
  'soft|A2|6': {
    short: 'Tu A,2 frente a carta débil del dealer es momento de presionar doblando.',
    long: 'A,2 todavía es una mano flexible: no te pasás con una carta alta. Contra 5 o 6 el dealer rompe seguido, así que conviene aumentar la apuesta en ese spot. El extra de valor al doblar supera al de jugar hit normal.',
  },
  'soft|A3|5': {
    short: 'A,3 contra 5 o 6: doblás aunque tu total parezca bajo.',
    long: 'Con A,3 el total aparente engaña: el As te protege de bustear. Frente a 5 o 6, el dealer queda en zona de alta ruptura. Por eso doblar captura más valor que quedarse con apuesta simple.',
  },
  'soft|A3|6': {
    short: 'A,3 contra 5 o 6: doblás aunque tu total parezca bajo.',
    long: 'Con A,3 el total aparente engaña: el As te protege de bustear. Frente a 5 o 6, el dealer queda en zona de alta ruptura. Por eso doblar captura más valor que quedarse con apuesta simple.',
  },
  'soft|A4|4': {
    short: 'El As te protege de pasarte: doblá con A,4 vs carta débil.',
    long: 'A,4 tiene varianza controlada porque una carta alta no te rompe la mano. Contra 4-6, el dealer arranca en un tramo débil y sufre más busts. Duplicar en este punto maximiza tu EV.',
  },
  'soft|A4|5': {
    short: 'El As te protege de pasarte: doblá con A,4 vs carta débil.',
    long: 'A,4 tiene varianza controlada porque una carta alta no te rompe la mano. Contra 4-6, el dealer arranca en un tramo débil y sufre más busts. Duplicar en este punto maximiza tu EV.',
  },
  'soft|A4|6': {
    short: 'El As te protege de pasarte: doblá con A,4 vs carta débil.',
    long: 'A,4 tiene varianza controlada porque una carta alta no te rompe la mano. Contra 4-6, el dealer arranca en un tramo débil y sufre más busts. Duplicar en este punto maximiza tu EV.',
  },
  'soft|A5|4': {
    short: 'A,5 vs carta débil: doblar es mejor que pegar simple.',
    long: 'A,5 tiene buen potencial de terminar en 18-21 con una sola carta. Frente a 4-6, el dealer está forzado a completar una mano frágil. Aprovechar esa debilidad con doble produce mejor expectativa.',
  },
  'soft|A5|5': {
    short: 'A,5 vs carta débil: doblar es mejor que pegar simple.',
    long: 'A,5 tiene buen potencial de terminar en 18-21 con una sola carta. Frente a 4-6, el dealer está forzado a completar una mano frágil. Aprovechar esa debilidad con doble produce mejor expectativa.',
  },
  'soft|A5|6': {
    short: 'A,5 vs carta débil: doblar es mejor que pegar simple.',
    long: 'A,5 tiene buen potencial de terminar en 18-21 con una sola carta. Frente a 4-6, el dealer está forzado a completar una mano frágil. Aprovechar esa debilidad con doble produce mejor expectativa.',
  },
  'soft|A6|2': {
    short: 'Soft 17 vs 2 se pega en S17. Doblar acá no rinde matemáticamente.',
    long: "En S17 (dealer planta soft 17) soft 17 vs 2 es Hit, no Double. La intuición de 'ya tengo 17, planto' es el error clásico, pero el 17 frente a 2 pierde más manos de las que gana. Doblar tampoco rinde porque el upside es demasiado chico contra una carta que rompe poco. En H17 sigue siendo Hit. Pegale.",
  },
  'soft|A6|3': {
    short: 'Soft 17 no es para plantarse: doblar contra 3-6 es lo óptimo.',
    long: 'Soft 17 parece cómodo, pero su valor real contra cartas bajas del dealer es atacar. El As te permite mejorar sin explotar y terminar seguido en 18-21. Ese perfil hace que doblar supere a hit o stand.',
  },
  'soft|A6|4': {
    short: 'Soft 17 no es para plantarse: doblar contra 3-6 es lo óptimo.',
    long: 'Soft 17 parece cómodo, pero su valor real contra cartas bajas del dealer es atacar. El As te permite mejorar sin explotar y terminar seguido en 18-21. Ese perfil hace que doblar supere a hit o stand.',
  },
  'soft|A6|5': {
    short: 'Soft 17 no es para plantarse: doblar contra 3-6 es lo óptimo.',
    long: 'Soft 17 parece cómodo, pero su valor real contra cartas bajas del dealer es atacar. El As te permite mejorar sin explotar y terminar seguido en 18-21. Ese perfil hace que doblar supere a hit o stand.',
  },
  'soft|A6|6': {
    short: 'Soft 17 no es para plantarse: doblar contra 3-6 es lo óptimo.',
    long: 'Soft 17 parece cómodo, pero su valor real contra cartas bajas del dealer es atacar. El As te permite mejorar sin explotar y terminar seguido en 18-21. Ese perfil hace que doblar supere a hit o stand.',
  },
  'soft|A7|2': {
    short: 'Soft 18 vs 2: te plantás, no es momento de arriesgar.',
    long: 'Con 18 soft ya estás por delante de muchos resultados finales del dealer 2. Pegar agrega valor marginal y sube la varianza sin compensar suficiente EV. Stand domina como decisión estable.',
  },
  'soft|A7|3': {
    short: 'Soft 18 vs 3-6: doblás. Si no podés doblar, plantate.',
    long: 'Soft 18 contra 3-6 combina mano fuerte y flexibilidad por el As. En ese contexto, una sola carta extra con apuesta duplicada rinde más. Cuando double no está disponible, el fallback correcto es stand.',
  },
  'soft|A7|4': {
    short: 'Soft 18 vs 3-6: doblás. Si no podés doblar, plantate.',
    long: 'Soft 18 contra 3-6 combina mano fuerte y flexibilidad por el As. En ese contexto, una sola carta extra con apuesta duplicada rinde más. Cuando double no está disponible, el fallback correcto es stand.',
  },
  'soft|A7|5': {
    short: 'Soft 18 vs 3-6: doblás. Si no podés doblar, plantate.',
    long: 'Soft 18 contra 3-6 combina mano fuerte y flexibilidad por el As. En ese contexto, una sola carta extra con apuesta duplicada rinde más. Cuando double no está disponible, el fallback correcto es stand.',
  },
  'soft|A7|6': {
    short: 'Soft 18 vs 3-6: doblás. Si no podés doblar, plantate.',
    long: 'Soft 18 contra 3-6 combina mano fuerte y flexibilidad por el As. En ese contexto, una sola carta extra con apuesta duplicada rinde más. Cuando double no está disponible, el fallback correcto es stand.',
  },
  'soft|A7|7': {
    short: 'Soft 18 vs 7 u 8: plantate, tu 18 suele ir adelante.',
    long: 'Frente a 7 u 8, tu 18 compite bien contra los finales típicos del dealer. Pegar tiene mejora limitada y empeora la distribución de resultados. Stand conserva mejor expectativa.',
  },
  'soft|A7|8': {
    short: 'Soft 18 vs 7 u 8: plantate, tu 18 suele ir adelante.',
    long: 'Frente a 7 u 8, tu 18 compite bien contra los finales típicos del dealer. Pegar tiene mejora limitada y empeora la distribución de resultados. Stand conserva mejor expectativa.',
  },
  'soft|A7|9': {
    short: 'Soft 18 vs 9 NO es stand: el 18 pierde demasiado, pegale.',
    long: 'Contra 9, plantarte con 18 deja demasiados escenarios donde el dealer te supera. Como tu mano es soft, podés pedir sin riesgo de bust inmediato. Por eso hit mejora la expectativa.',
  },
  'soft|A7|T': {
    short: 'Soft 18 vs 10: pegar mejora más que plantarse con 18.',
    long: 'El 10 del dealer presiona tu 18: stand gana menos de lo que parece. En soft 18, una carta adicional puede convertir mano media en mano fuerte con riesgo controlado. Esa mejora esperada vuelve correcto el hit.',
  },
  'soft|A7|A': {
    short: 'Soft 18 vs As: pegar es la salida con mejor expectativa.',
    long: 'Contra As, el dealer tiene una distribución final fuerte y castiga plantarse liviano. La ventaja del As en tu mano es que podés mejorar sin quedar roto. Hit minimiza pérdida esperada frente a ese upcard.',
  },
  // Hard totals
  'hard|9|2': {
    short: 'Hard 9 vs 2 en S17 NO se dobla: solo se pega.',
    long: 'Tu 9 necesita contexto extra para que doble sea rentable y acá no alcanza. En S17, el dealer planta soft 17 y reduce la presión que sí existe en H17. Por eso la línea correcta es hit y no double.',
  },
  'hard|9|3': {
    short: 'Hard 9 vs 3-6: doblá. Una carta de 10 te deja en 19.',
    long: 'Con 9 tenés alta chance de terminar en 18-19 con una sola carta. Frente a 3-6 el dealer parte débil y rompe más seguido. Es una ventana clásica para capturar EV con doble.',
  },
  'hard|9|4': {
    short: 'Hard 9 vs 3-6: doblá. Una carta de 10 te deja en 19.',
    long: 'Con 9 tenés alta chance de terminar en 18-19 con una sola carta. Frente a 3-6 el dealer parte débil y rompe más seguido. Es una ventana clásica para capturar EV con doble.',
  },
  'hard|9|5': {
    short: 'Hard 9 vs 3-6: doblá. Una carta de 10 te deja en 19.',
    long: 'Con 9 tenés alta chance de terminar en 18-19 con una sola carta. Frente a 3-6 el dealer parte débil y rompe más seguido. Es una ventana clásica para capturar EV con doble.',
  },
  'hard|9|6': {
    short: 'Hard 9 vs 3-6: doblá. Una carta de 10 te deja en 19.',
    long: 'Con 9 tenés alta chance de terminar en 18-19 con una sola carta. Frente a 3-6 el dealer parte débil y rompe más seguido. Es una ventana clásica para capturar EV con doble.',
  },
  'hard|11|A': {
    short: 'Hard 11 vs As en S17 se pega, no se dobla.',
    long: 'En reglas H17 esta celda suele jugarse con double. En S17, el dealer se planta en soft 17 y la presión baja lo justo para quitar rentabilidad al doble. Confundir tablas H17/S17 acá genera errores recurrentes.',
  },
  'hard|12|2': {
    short: 'Hard 12 vs 2 se pega, no se planta.',
    long: 'Plantarte con 12 contra 2 parece prudente, pero el dealer rompe menos de lo que se cree en ese upcard. Necesitás mejorar tu mano para recuperar EV. Por eso hit es superior a stand.',
  },
  'hard|12|3': {
    short: 'Hard 12 vs 3 también se pega. Plantarse acá es error clásico.',
    long: 'Con 12 frente a 3, esperar el bust del dealer no compensa la debilidad de tu total. Una carta adicional mejora tu distribución más de lo que empeora el riesgo. Hit gana a stand por expectativa.',
  },
  'hard|12|4': {
    short: 'Hard 12 vs 4-6: plantate. Acá sí el dealer rompe lo suficiente.',
    long: 'El 4-6 del dealer sí entra en la zona donde el bust del crupier pesa mucho. Pegar 12 en ese contexto te expone más de lo que te ayuda. Stand maximiza EV.',
  },
  'hard|12|5': {
    short: 'Hard 12 vs 4-6: plantate. Acá sí el dealer rompe lo suficiente.',
    long: 'El 4-6 del dealer sí entra en la zona donde el bust del crupier pesa mucho. Pegar 12 en ese contexto te expone más de lo que te ayuda. Stand maximiza EV.',
  },
  'hard|12|6': {
    short: 'Hard 12 vs 4-6: plantate. Acá sí el dealer rompe lo suficiente.',
    long: 'El 4-6 del dealer sí entra en la zona donde el bust del crupier pesa mucho. Pegar 12 en ese contexto te expone más de lo que te ayuda. Stand maximiza EV.',
  },
  'hard|13|2': {
    short: 'Hard 13 vs 2: ya plantás. El umbral cambia en 13, no en 12.',
    long: 'A partir de 13, la frecuencia de bust al pegar sube y cambia la frontera óptima contra 2. A diferencia de hard 12, acá sí conviene ceder iniciativa al dealer. Stand queda arriba en EV.',
  },
  'hard|14|2': {
    short: 'Hard 14 vs 2: plantate. Pegar te hace explotar demasiado.',
    long: 'Con 14, las cartas que te rompen son demasiadas para justificar hit contra 2. El dealer todavía puede terminar en bust o en totales alcanzables. Stand minimiza pérdida esperada.',
  },
  'hard|15|T': {
    short: 'Hard 15 vs 10: rendirse es la jugada óptima. Si no podés, pegá.',
    long: 'Tu 15 contra 10 queda muy por detrás y rara vez mejora lo suficiente. Recuperar media apuesta pierde menos que jugar toda la mano. Si surrender no está habilitado, el fallback es hit.',
  },
  'hard|16|9': {
    short: 'Hard 16 vs 9: rendirse ahorra plata. Fallback: pegar.',
    long: 'Hard 16 es una mano frágil y 9 del dealer ejerce presión alta. Surrender reduce la pérdida media frente al resto de acciones. Sin esa opción, hit es el mal menor.',
  },
  'hard|16|T': {
    short: 'Hard 16 vs 10: rendirse. La jugada matemáticamente menos mala.',
    long: 'Esta es una de las peores combinaciones de toda la tabla básica. Ninguna acción tiene EV positivo, pero surrender recorta daño de forma consistente. Sin surrender disponible, corresponde hit.',
  },
  'hard|16|A': {
    short: 'Hard 16 vs As: rendirse. Ninguna otra jugada gana lo suficiente.',
    long: 'El As del dealer concentra demasiadas secuencias ganadoras contra tu 16. Jugar la mano completa suele perder más que media apuesta. Surrender domina como decisión de mínima pérdida.',
  },
  // Pairs
  'pair|22|2': {
    short: 'Par de 2 vs 2-3: dividís porque DAS aumenta tu expectativa.',
    long: 'Jugar 4 como mano única deja un desarrollo pobre. Con DAS, dividir habilita líneas de doble rentables en manos derivadas y sube el EV total. Por eso split supera a hit.',
  },
  'pair|22|3': {
    short: 'Par de 2 vs 2-3: dividís porque DAS aumenta tu expectativa.',
    long: 'Jugar 4 como mano única deja un desarrollo pobre. Con DAS, dividir habilita líneas de doble rentables en manos derivadas y sube el EV total. Por eso split supera a hit.',
  },
  'pair|33|2': {
    short: 'Par de 3 vs 2-3: con DAS dividir es positivo.',
    long: 'Seis como bloque tiene expectativa limitada frente a 2-3. Dividir crea dos manos pequeñas con mejor capacidad de capturar valor, sobre todo por DAS. El conjunto rinde más que quedarse con 6.',
  },
  'pair|33|3': {
    short: 'Par de 3 vs 2-3: con DAS dividir es positivo.',
    long: 'Seis como bloque tiene expectativa limitada frente a 2-3. Dividir crea dos manos pequeñas con mejor capacidad de capturar valor, sobre todo por DAS. El conjunto rinde más que quedarse con 6.',
  },
  'pair|44|5': {
    short: 'Par de 4 vs 5-6: único caso en que se divide. DAS lo hace rentable.',
    long: '8 como mano única es mediocre, pero no siempre conviene separar 4,4. Contra 5-6, el dealer está en tramo débil y DAS agrega upside a las manos resultantes. Esa combinación vuelve correcto el split.',
  },
  'pair|44|6': {
    short: 'Par de 4 vs 5-6: único caso en que se divide. DAS lo hace rentable.',
    long: '8 como mano única es mediocre, pero no siempre conviene separar 4,4. Contra 5-6, el dealer está en tramo débil y DAS agrega upside a las manos resultantes. Esa combinación vuelve correcto el split.',
  },
  'pair|66|2': {
    short: 'Par de 6 vs 2: dividís. 12 vs 2 es mano pésima como bloque.',
    long: 'Mantener 6,6 te deja en hard 12 contra 2, un spot muy incómodo. Al dividir, cada 6 arranca con más rutas para construir 17-20. Con DAS, esa transición mejora aún más el EV.',
  },
  'pair|66|7': {
    short: 'Par de 6 vs 7: NO se divide. Pegale, tu 12 vs 7 va mejor solo.',
    long: 'Contra 7, dividir 6,6 crea dos manos que arrancan en desventaja estructural. Jugar 12 como mano única con hit tiene menor pérdida esperada. Por eso no se divide en esta columna.',
  },
  'pair|77|8': {
    short: 'Par de 7 vs 8: pegar es mejor que dividir.',
    long: 'El impulso de separar 7,7 no siempre aplica. Contra 8, dos manos nuevas no compensan el costo de abrirlas y su EV cae. La mejor línea es tratarlo como 14 y pedir.',
  },
  'pair|77|T': {
    short: 'Par de 7 vs 10: pegale al 14. Dividir empeora la expectativa.',
    long: 'Separar 7,7 frente a 10 expone dos manos débiles contra upcard fuerte. Conservar el 14 y jugar hit pierde menos en promedio. El split acá amplifica la desventaja inicial.',
  },
  'pair|88|T': {
    short: 'Par de 8 vs 10: dividís igual. 16 sólido pierde más que dos manos nuevas.',
    long: 'Hard 16 vs 10 es uno de los peores escenarios posibles. Al dividir 8,8 evitás ese pozo EV y ganás dos oportunidades de mejora. Por eso split sigue siendo correcto incluso contra 10.',
  },
  'pair|88|A': {
    short: 'Par de 8 vs As: dividir. 16 vs As es desastre; dos 8s tienen chance.',
    long: '16 contra As queda fuertemente dominado por la distribución del dealer. Dividir no garantiza ventaja, pero reduce daño esperado al generar dos manos con salida. Split es la mejor opción disponible.',
  },
  'pair|99|7': {
    short: 'Par de 9 vs 7: plantate. 18 le gana al 17 forzado del dealer.',
    long: 'Con 9,9 ya tenés 18, un total fuerte frente al 7 del dealer. Dividir rompería una mano buena para crear dos manos más volátiles. Stand conserva mejor expectativa.',
  },
  'pair|99|T': {
    short: 'Par de 9 vs 10: NO dividir. Plantate con 18.',
    long: 'Aunque 10 es upcard fuerte, 18 sigue siendo un total competitivo. Abrir dos manos desde 9,9 en este spot deteriora la expectativa global. Stand es más rentable que split.',
  },
  'pair|99|A': {
    short: 'Par de 9 vs As en S17: plantate. En H17 dividirías.',
    long: 'En H17 esta celda cambia porque el dealer debe pegar soft 17 y eso abre valor al split. En S17, al plantarse antes, ese extra desaparece y conviene sostener 18. Diferenciar S17/H17 acá es clave.',
  },
};

const UPCARD_INDEX: Readonly<Record<RationaleKey['upcard'], number>> = {
  '2': 0,
  '3': 1,
  '4': 2,
  '5': 3,
  '6': 4,
  '7': 5,
  '8': 6,
  '9': 7,
  T: 8,
  A: 9,
};

function normalizeSoftKey(totalOrPair: string): string {
  return totalOrPair.toUpperCase().replace(',', '');
}

function primaryActionForDecision(decision: StrategyDecision): Action {
  switch (decision) {
    case 'H':
      return 'hit';
    case 'S':
      return 'stand';
    case 'Dh':
    case 'Ds':
      return 'double';
    case 'P':
    case 'Ph':
    case 'Ps':
      return 'split';
    case 'Rh':
    case 'Rs':
    case 'Rp':
      return 'surrender';
    default:
      return 'hit';
  }
}

function getPrimaryActionFromTables(key: RationaleKey): Action {
  const upcardIndex = UPCARD_INDEX[key.upcard];

  if (key.category === 'hard') {
    const total = Number.parseInt(key.totalOrPair, 10);
    if (Number.isNaN(total) || total <= 4) {
      return 'hit';
    }
    const row = HARD_STRATEGY[total - 5];
    if (!row) {
      return 'hit';
    }
    return primaryActionForDecision(row[upcardIndex]);
  }

  if (key.category === 'soft') {
    const row = SOFT_STRATEGY[normalizeSoftKey(key.totalOrPair)];
    if (!row) {
      return 'hit';
    }
    return primaryActionForDecision(row[upcardIndex]);
  }

  const row = PAIR_STRATEGY[key.totalOrPair.toUpperCase()];
  if (!row) {
    return 'hit';
  }
  return primaryActionForDecision(row[upcardIndex]);
}

function rationaleId(key: RationaleKey): string {
  return `${key.category}|${key.totalOrPair}|${key.upcard}`;
}

export function getRationale(key: RationaleKey): Rationale {
  const explicitRationale = RATIONALE_TABLE[rationaleId(key)];
  if (explicitRationale) {
    return explicitRationale;
  }

  const action = getPrimaryActionFromTables(key);
  return FALLBACK_RATIONALES[action] ?? FALLBACK_RATIONALES.hit;
}

export const __internal = {
  FALLBACK_RATIONALES,
  RATIONALE_TABLE,
  getPrimaryActionFromTables,
};
