import type { JSX, ReactNode } from 'react';

import { Card } from '@/components/game/Card';
import { Hand } from '@/components/game/Hand';
import type { CardSize } from '@/components/game/Card.types';
import type { Card as CardData, Hand as HandData, Rank, Suit } from '@/lib/blackjack/types';

function makeCard(rank: Rank, suit: Suit): CardData {
  return { rank, suit };
}

function makeHand(cards: ReadonlyArray<CardData>, overrides?: Partial<HandData>): HandData {
  return {
    cards,
    bet: 10,
    isDoubled: false,
    isSplit: false,
    isSurrendered: false,
    isStood: false,
    ...overrides,
  };
}

function Section({
  title,
  description,
  children,
}: Readonly<{
  title: string;
  description?: string;
  children: ReactNode;
}>): JSX.Element {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        {description ? <p className="text-sm text-slate-400">{description}</p> : null}
      </div>
      <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-6">
        {children}
      </div>
    </section>
  );
}

function cardRowLabel(size: CardSize): string {
  if (size === 'sm') {
    return 'SM 48x67';
  }
  if (size === 'md') {
    return 'MD 80x112';
  }
  return 'LG 112x156';
}

export default function SandboxPage(): JSX.Element {
  const suits: ReadonlyArray<Suit> = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: ReadonlyArray<Rank> = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const sizes: ReadonlyArray<CardSize> = ['sm', 'md', 'lg'];

  const handNormal = makeHand([makeCard('10', 'hearts'), makeCard('7', 'clubs')]);
  const handSoft = makeHand([makeCard('A', 'spades'), makeCard('7', 'hearts')]);
  const handBlackjack = makeHand([makeCard('A', 'spades'), makeCard('K', 'hearts')]);
  const handBust = makeHand([makeCard('10', 'hearts'), makeCard('8', 'clubs'), makeCard('7', 'spades')]);
  const handSurrendered = makeHand([makeCard('10', 'hearts'), makeCard('6', 'clubs')], {
    isSurrendered: true,
  });
  const handActive = makeHand([makeCard('8', 'hearts'), makeCard('8', 'clubs')]);
  const dealerHidden = makeHand([makeCard('10', 'spades'), makeCard('K', 'hearts')]);
  const handLong = makeHand([
    makeCard('2', 'clubs'),
    makeCard('3', 'diamonds'),
    makeCard('2', 'hearts'),
    makeCard('A', 'spades'),
    makeCard('2', 'clubs'),
  ]);

  return (
    <main className="min-h-screen bg-slate-900 px-6 py-10 md:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl space-y-12">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Sandbox - Componentes visuales
          </h1>
          <p className="text-base text-slate-300">
            Vista previa para auditoria visual. No es la mesa de juego.
          </p>
        </header>

        <Section
          title="Sección 1 — Card en sus 3 tamaños"
          description="Comparativa por tamaño con face-up, face-down y highlighted."
        >
          <div className="space-y-8">
            {sizes.map((size) => (
              <div key={size} className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                  {cardRowLabel(size)}
                </p>
                <div className="flex flex-wrap items-end gap-4">
                  {suits.map((suit) => (
                    <Card key={`${size}-A-${suit}`} card={makeCard('A', suit)} size={size} />
                  ))}
                  <Card card={makeCard('A', 'spades')} faceDown size={size} />
                  <Card card={makeCard('10', 'spades')} highlighted size={size} />
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Sección 2 — Card: galería de ranks"
          description="Todos los ranks en picas para revisar proporción tipográfica."
        >
          <div className="flex flex-wrap gap-4">
            {ranks.map((rank) => (
              <Card key={`rank-${rank}`} card={makeCard(rank, 'spades')} size="md" />
            ))}
          </div>
        </Section>

        <Section
          title="Sección 3 — Hand: estados básicos"
          description="Estados de mano del jugador con badge de total y estilos de estado."
        >
          <div className="space-y-7">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-300">Mano normal (hard 17)</p>
              <Hand hand={handNormal} size="md" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-300">Mano soft (soft 18)</p>
              <Hand hand={handSoft} size="md" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-300">Blackjack natural</p>
              <Hand hand={handBlackjack} size="md" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-300">Bust (25)</p>
              <Hand hand={handBust} size="md" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-300">Rendida</p>
              <Hand hand={handSurrendered} size="md" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-300">Mano activa (split context)</p>
              <Hand hand={handActive} size="md" isActive />
            </div>
          </div>
        </Section>

        <Section
          title="Sección 4 — Hand: dealer con hole card"
          description="Comparativa entre playerTurn (oculta) y resolution (revelada)."
        >
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-300">Dealer durante playerTurn</p>
              <Hand hand={dealerHidden} size="md" hideHoleCard showTotal={false} />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-300">Dealer en resolution</p>
              <Hand hand={dealerHidden} size="md" hideHoleCard={false} showTotal />
            </div>
          </div>
        </Section>

        <Section
          title="Sección 5 — Hand: variaciones de tamaño"
          description="Misma mano en sm, md y lg para validar escalado."
        >
          <div className="flex flex-wrap items-end gap-8">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">SM</p>
              <Hand hand={handNormal} size="sm" />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">MD</p>
              <Hand hand={handNormal} size="md" />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">LG</p>
              <Hand hand={handNormal} size="lg" />
            </div>
          </div>
        </Section>

        <Section
          title="Sección 6 — Hand: mano larga (stress test)"
          description="Cinco cartas para validar solapamiento y legibilidad en casos extendidos."
        >
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-300">Mano larga [2♣, 3♦, 2♥, A♠, 2♣]</p>
            <Hand hand={handLong} size="md" />
          </div>
        </Section>
      </div>
    </main>
  );
}
