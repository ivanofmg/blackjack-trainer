import type { JSX } from 'react';

import { cn } from '@/lib/utils';
import type { Rank, Suit } from '@/lib/blackjack/types';

import type { CardProps, CardSize } from './Card.types';

type SizeStyles = Readonly<{
  card: string;
  corner: string;
  center: string;
  padding: string;
}>;

const SUIT_SYMBOL: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const SUIT_NAME_ES: Record<Suit, string> = {
  hearts: 'corazones',
  diamonds: 'diamantes',
  clubs: 'tréboles',
  spades: 'picas',
};

const RANK_NAME_ES: Record<Rank, string> = {
  A: 'As',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  '10': '10',
  J: 'Jota',
  Q: 'Reina',
  K: 'Rey',
};

const SIZE_STYLES: Record<CardSize, SizeStyles> = {
  sm: {
    card: 'w-12 h-[67px]',
    corner: 'text-xs leading-none',
    center: 'text-2xl',
    padding: 'p-1.5',
  },
  md: {
    card: 'w-20 h-28',
    corner: 'text-base leading-none',
    center: 'text-4xl',
    padding: 'p-2',
  },
  lg: {
    card: 'w-28 h-[156px]',
    corner: 'text-2xl leading-none',
    center: 'text-6xl',
    padding: 'p-2.5',
  },
};

function getSuitColorClass(suit: Suit): string {
  return suit === 'hearts' || suit === 'diamonds' ? 'text-red-700' : 'text-slate-900';
}

function getCardAriaLabel(card: CardProps['card'], faceDown: boolean): string {
  if (faceDown) {
    return 'Carta boca abajo';
  }

  return `${RANK_NAME_ES[card.rank]} de ${SUIT_NAME_ES[card.suit]}`;
}

export function Card({
  card,
  faceDown = false,
  highlighted = false,
  size = 'md',
  className,
}: CardProps): JSX.Element {
  const styles = SIZE_STYLES[size];
  const suitSymbol = SUIT_SYMBOL[card.suit];
  const suitColorClass = getSuitColorClass(card.suit);
  const ariaLabel = getCardAriaLabel(card, faceDown);

  return (
    <article
      role="img"
      aria-label={ariaLabel}
      data-testid="playing-card"
      className={cn(
        'relative select-none overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-md',
        styles.card,
        highlighted && 'ring-2 ring-amber-400/60 shadow-lg',
        className
      )}
    >
      {faceDown ? (
        <div className="flex h-full w-full items-center justify-center bg-slate-800 bg-[repeating-linear-gradient(45deg,rgba(148,163,184,0.12)_0px,rgba(148,163,184,0.12)_6px,rgba(30,41,59,0.45)_6px,rgba(30,41,59,0.45)_12px)]">
          <span className={cn('font-bold text-slate-600/80', styles.center)}>{SUIT_SYMBOL.spades}</span>
        </div>
      ) : (
        <>
          <div className={cn('absolute left-0 top-0 flex flex-col items-start font-bold', styles.padding, styles.corner)}>
            <span>{card.rank}</span>
            <span className={suitColorClass}>{suitSymbol}</span>
          </div>

          <div
            className={cn(
              'absolute bottom-0 right-0 flex rotate-180 flex-col items-end font-bold',
              styles.padding,
              styles.corner
            )}
          >
            <span>{card.rank}</span>
            <span className={suitColorClass}>{suitSymbol}</span>
          </div>

          <div className="flex h-full w-full items-center justify-center">
            <span className={cn('font-semibold', suitColorClass, styles.center)}>{suitSymbol}</span>
          </div>
        </>
      )}
    </article>
  );
}
