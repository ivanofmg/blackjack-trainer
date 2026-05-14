import type { Card as CardData } from '@/lib/blackjack/types';

export type CardSize = 'sm' | 'md' | 'lg';

export type CardProps = Readonly<{
  card: CardData;
  faceDown?: boolean;
  highlighted?: boolean;
  size?: CardSize;
  className?: string;
}>;
