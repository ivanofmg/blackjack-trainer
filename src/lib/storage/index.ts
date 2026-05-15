export {
  DEFAULT_BANKROLL,
  DEFAULT_BET,
  loadBankroll,
  loadCurrentBet,
  loadRules,
  loadTrainerMode,
  loadTrainerStats,
  saveBankroll,
  saveCurrentBet,
  saveRules,
  saveTrainerMode,
  saveTrainerStats,
} from '@/lib/storage/localStorage';
export type { StoredMistakeEntry, StoredTrainerStats } from '@/lib/storage/localStorage';
