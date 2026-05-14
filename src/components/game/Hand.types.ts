import type { CardSize } from '@/components/game/Card.types';
import type { Hand as HandData } from '@/lib/blackjack/types';

export type HandProps = Readonly<{
  hand: HandData;
  size?: CardSize;
  isActive?: boolean;
  hideHoleCard?: boolean;
  showTotal?: boolean;
  className?: string;
}>;
