export type PlayerId = string;

export interface Player {
  id: PlayerId;
  name: string;
}

export type Difficulty = 'low' | 'mid' | 'high';

export type WordCategory =
  | 'животни'
  | 'храна'
  | 'овошје и зеленчук'
  | 'пијалаци'
  | 'дом'
  | 'предмети'
  | 'места'
  | 'природа'
  | 'превоз'
  | 'спорт'
  | 'професии'
  | 'тело'
  | 'облека'
  | 'училиште'
  | 'технологија'
  | 'музика и забава';

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  low: 'Тешко',
  mid: 'Средно',
  high: 'Лесно',
};

export const DIFFICULTY_DESCRIPTIONS: Record<Difficulty, string> = {
  low: 'Далечен поврзан збор',
  mid: 'Средно близок поврзан збор',
  high: 'Многу близок поврзан збор',
};

export interface Word {
  word: string;
  category: WordCategory;
  hints: Record<Difficulty, string[]>;
  /** Кратко речничко објаснување што е зборот (без самиот збор во текстот). */
  definition: string;
  /** Пример-реченица во која е употребен зборот. */
  example: string;
}

export type Phase =
  | 'lobby'
  | 'difficultyPick'
  | 'reveal'
  | 'round'
  | 'vote'
  | 'outcome'
  | 'finale';

export type OutcomeKind = 'guessed' | 'survived' | 'caught';

export interface RoundRecord {
  word: Word;
  hintUsed: string;
  difficulty: Difficulty;
  imposterId: PlayerId;
  outcome: OutcomeKind;
  caughtAtSubRound: number | null;
  kickedOutIds: PlayerId[];
  deltas: Record<PlayerId, number>;
}

export interface VoteState {
  kickedId: PlayerId | null;
}

export interface CurrentRound {
  word: Word;
  hintUsed: string;
  difficulty: Difficulty;
  imposterId: PlayerId;
  revealOrder: PlayerId[];
  revealIndex: number;
  subRound: number;
  speakingIndex: number;
  vote: VoteState | null;
  resolvedOutcome: OutcomeKind | null;
  kickedOutIds: PlayerId[];
  startedAt: number;
}

export interface GameStore {
  players: Player[];
  subRoundCapOverride: number | null;

  scores: Record<PlayerId, number>;
  history: RoundRecord[];

  current: CurrentRound | null;
  phase: Phase;
  resumePhase: Phase | null;
  resumeDismissed: boolean;

  addPlayer(name: string): void;
  removePlayer(id: PlayerId): void;
  setSubRoundCapOverride(value: number | null): void;

  startTournament(): void;
  setDifficulty(difficulty: Difficulty): void;
  advanceReveal(): void;

  openVote(): void;
  castKick(id: PlayerId): void;
  imposterGuessed(): void;

  advanceSubRound(): void;
  resolveOutcome(kind: OutcomeKind): void;
  nextRound(): void;

  endTournament(): void;
  restartTournament(): void;
  resumeRound(): void;
  resetAll(): void;
  dismissResume(): void;
}
