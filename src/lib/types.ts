export type SessionStatus = "active" | "ended";
export type TournamentStatus = "setup" | "active" | "completed";
export type MatchStatus = "pending" | "in_progress" | "completed";
export type MatchStage = "round" | "third_place" | "final";

export type SessionRecord = {
  id: string;
  createdAt: string;
  expiresAt: string;
  status: SessionStatus;
};

export type TournamentRecord = {
  id: string;
  sessionId: string;
  size: 2 | 4 | 8 | 16 | 32;
  status: TournamentStatus;
  currentRound: number;
  currentMatchId: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type CompetitorRecord = {
  id: string;
  tournamentId: string;
  sessionId: string;
  name: string;
  rating: number;
  wins: number;
  losses: number;
  previousPerformanceScore: number;
};

export type MatchEvent = {
  label: string;
  scoreA: number;
  scoreB: number;
};

export type MatchRecord = {
  id: string;
  tournamentId: string;
  round: number;
  matchIndex: number;
  stage: MatchStage;
  roundLabel: string;
  competitorAId: string;
  competitorBId: string;
  winnerId: string | null;
  loserId: string | null;
  status: MatchStatus;
  simulationStep: number;
  events: MatchEvent[];
};

export type StoredTournamentState = {
  session: SessionRecord;
  tournament: TournamentRecord | null;
  competitors: CompetitorRecord[];
  matches: MatchRecord[];
};

export type EditableCompetitor = {
  id: string;
  name: string;
};

export type MatchView = {
  id: string;
  round: number;
  roundLabel: string;
  matchIndex: number;
  stage: MatchStage;
  status: MatchStatus;
  simulationStep: number;
  totalSteps: number;
  currentEvent: MatchEvent | null;
  competitorA: CompetitorRecord;
  competitorB: CompetitorRecord;
  winnerId: string | null;
  loserId: string | null;
};

export type TournamentSummary = {
  tournament: TournamentRecord | null;
  session: SessionRecord | null;
  competitors: CompetitorRecord[];
  matches: MatchView[];
  currentMatch: MatchView | null;
  podium: {
    champion: CompetitorRecord | null;
    runnerUp: CompetitorRecord | null;
    thirdPlace: CompetitorRecord | null;
  };
};
