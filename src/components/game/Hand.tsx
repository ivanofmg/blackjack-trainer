import type { JSX } from 'react';

import { handValue } from '@/lib/blackjack/hand';
import { cn } from '@/lib/utils';
import type { Rank, Suit } from '@/lib/blackjack/types';

import { Card } from './Card';
import type { CardSize } from './Card.types';
import type { HandProps } from './Hand.types';

type HandSizeStyles = Readonly<{
  overlap: string;
  edgePadding: string;
  badgeText: string;
  badgePadding: string;
  gap: string;
}>;

type HandStatus = 'normal' | 'soft' | 'blackjack' | 'bust' | 'surrender';

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

const HAND_SIZE_STYLES: Record<CardSize, HandSizeStyles> = {
  sm: {
    overlap: '-ml-4',
    edgePadding: 'pl-4',
    badgeText: 'text-sm font-semibold',
    badgePadding: 'px-2 py-0.5',
    gap: 'gap-1.5',
  },
  md: {
    overlap: '-ml-6',
    edgePadding: 'pl-6',
    badgeText: 'text-lg font-bold',
    badgePadding: 'px-2.5 py-1',
    gap: 'gap-2',
  },
  lg: {
    overlap: '-ml-8',
    edgePadding: 'pl-8',
    badgeText: 'text-xl font-bold',
    badgePadding: 'px-3 py-1.5',
    gap: 'gap-2.5',
  },
};

type StatusPresentation = Readonly<{
  badgeClassName: string;
  content: JSX.Element;
  ariaText: string;
}>;

function getCardLabel(rank: Rank, suit: Suit): string {
  return `${RANK_NAME_ES[rank]} de ${SUIT_NAME_ES[suit]}`;
}

function getStatus(hand: HandProps['hand'], value: ReturnType<typeof handValue>): HandStatus {
  if (hand.isSurrendered) {
    return 'surrender';
  }
  if (value.isBust) {
    return 'bust';
  }
  if (value.isBlackjack) {
    return 'blackjack';
  }
  if (value.isSoft) {
    return 'soft';
  }
  return 'normal';
}

function getStatusPresentation(status: HandStatus, total: number): StatusPresentation {
  switch (status) {
    case 'surrender':
      return {
        badgeClassName: 'bg-slate-50 text-slate-500 italic',
        content: <span>Rendido</span>,
        ariaText: 'Rendido',
      };
    case 'bust':
      return {
        badgeClassName: 'bg-red-50 text-red-700',
        content: (
          <span className="inline-flex items-center gap-2">
            <span className="line-through">{total}</span>
            <span>Bust</span>
          </span>
        ),
        ariaText: `Bust con ${total}`,
      };
    case 'blackjack':
      return {
        badgeClassName: 'border border-amber-300 bg-amber-100 text-amber-900',
        content: <span>BJ</span>,
        ariaText: 'BJ',
      };
    case 'soft': {
      const hardTotal = total - 10;
      const softLabel = `${hardTotal}/${total}`;
      return {
        badgeClassName: 'bg-slate-100 text-slate-900',
        content: <span>{softLabel}</span>,
        ariaText: softLabel,
      };
    }
    default:
      return {
        badgeClassName: 'bg-slate-100 text-slate-900',
        content: <span>{total}</span>,
        ariaText: String(total),
      };
  }
}

function getGroupAriaLabel({
  cardCount,
  hideHoleCard,
  showTotal,
  visibleUpcardLabel,
  status,
  statusText,
}: Readonly<{
  cardCount: number;
  hideHoleCard: boolean;
  showTotal: boolean;
  visibleUpcardLabel: string | null;
  status: HandStatus;
  statusText: string;
}>): string {
  if (hideHoleCard) {
    if (visibleUpcardLabel) {
      return `Mano del dealer con ${cardCount} cartas, carta visible: ${visibleUpcardLabel}`;
    }
    return `Mano del dealer con ${cardCount} cartas`;
  }

  if (showTotal) {
    if (status === 'surrender' || status === 'bust' || status === 'blackjack') {
      return `Mano del jugador con ${cardCount} cartas, estado ${statusText}`;
    }
    return `Mano del jugador con ${cardCount} cartas, total ${statusText}`;
  }

  return `Mano del jugador con ${cardCount} cartas`;
}

export function Hand({
  hand,
  size = 'md',
  isActive = false,
  hideHoleCard = false,
  showTotal = true,
  className,
}: HandProps): JSX.Element {
  const value = handValue(hand.cards);
  const styles = HAND_SIZE_STYLES[size];
  const status = getStatus(hand, value);
  const statusPresentation = getStatusPresentation(status, value.total);
  const upcard = hand.cards[0];
  const visibleUpcardLabel = upcard ? getCardLabel(upcard.rank, upcard.suit) : null;
  const groupAriaLabel = getGroupAriaLabel({
    cardCount: hand.cards.length,
    hideHoleCard,
    showTotal,
    visibleUpcardLabel,
    status,
    statusText: statusPresentation.ariaText,
  });

  return (
    <section
      role="group"
      aria-label={groupAriaLabel}
      data-active={isActive ? 'true' : 'false'}
      className={cn(
        'inline-flex flex-col items-start rounded-xl p-2',
        styles.gap,
        isActive && 'ring-2 ring-sky-400/60',
        className
      )}
    >
      <div className={cn('flex flex-row items-center', styles.edgePadding)}>
        {hand.cards.map((card, index) => (
          <div
            key={`${card.rank}-${card.suit}-${index}`}
            className={cn(index > 0 && styles.overlap)}
          >
            <Card card={card} faceDown={hideHoleCard && index === 1} size={size} />
          </div>
        ))}
      </div>

      {showTotal ? (
        <div
          aria-live="polite"
          data-testid="hand-total-badge"
          className={cn(
            'inline-flex items-center rounded-md',
            styles.badgeText,
            styles.badgePadding,
            statusPresentation.badgeClassName
          )}
        >
          {statusPresentation.content}
        </div>
      ) : null}
    </section>
  );
}
