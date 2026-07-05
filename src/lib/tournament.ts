import { randomUUID } from "crypto";
import {
  CompetitorRecord,
  EditableCompetitor,
  MatchEvent,
  MatchRecord,
  MatchStage,
  MatchView,
  StoredTournamentState,
  TournamentSummary,
} from "@/lib/types";

const MIN_PROBABILITY = 0.2;
const MAX_PROBABILITY = 0.8;

function shuffle<T>(items: T[]) {
  const clone = [...items];

  for (let index = clone.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]];
  }

  return clone;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function labelForRound(remainingCompetitors: number) {
  if (remainingCompetitors === 2) {
    return "Final";
  }

  if (remainingCompetitors === 4) {
    return "Semifinals";
  }

  if (remainingCompetitors === 8) {
    return "Quarterfinals";
  }

  if (remainingCompetitors === 16) {
    return "Round of 16";
  }

  return "Opening Round";
}

function createMatch(
  tournamentId: string,
  round: number,
  matchIndex: number,
  stage: MatchStage,
  competitorAId: string,
  competitorBId: string,
  roundLabel: string,
): MatchRecord {
  return {
    id: randomUUID(),
    tournamentId,
    round,
    matchIndex,
    stage,
    roundLabel,
    competitorAId,
    competitorBId,
    winnerId: null,
    loserId: null,
    status: "pending",
    simulationStep: -1,
    events: [],
  };
}

function scoreFrames(winnerIsA: boolean) {
  return winnerIsA
    ? [
        [0, 0],
        [1, 0],
        [1, 1],
        [2, 1],
        [3, 1],
      ]
    : [
        [0, 0],
        [0, 1],
        [1, 1],
        [1, 2],
        [1, 3],
      ];
}

function buildEvents(a: CompetitorRecord, b: CompetitorRecord, winnerIsA: boolean): MatchEvent[] {
  const frames = scoreFrames(winnerIsA);

  return [
    {
      label: `${a.name} and ${b.name} enter with everything on the line.`,
      scoreA: frames[0][0],
      scoreB: frames[0][1],
    },
    {
      label: winnerIsA
        ? `${a.name} lands the first clean advantage.`
        : `${b.name} explodes out of the gate.`,
      scoreA: frames[1][0],
      scoreB: frames[1][1],
    },
    {
      label: `${winnerIsA ? b.name : a.name} answers back to keep the duel alive.`,
      scoreA: frames[2][0],
      scoreB: frames[2][1],
    },
    {
      label: `${winnerIsA ? a.name : b.name} finds a late burst and starts to separate.`,
      scoreA: frames[3][0],
      scoreB: frames[3][1],
    },
    {
      label: `${winnerIsA ? a.name : b.name} closes the match and moves on.`,
      scoreA: frames[4][0],
      scoreB: frames[4][1],
    },
  ];
}

function pickWinner(a: CompetitorRecord, b: CompetitorRecord) {
  const base = a.rating / (a.rating + b.rating);
  const performanceBias = clamp(
    (a.previousPerformanceScore - b.previousPerformanceScore) / 20,
    -0.08,
    0.08,
  );
  const swing = (Math.random() - 0.5) * 0.22;
  const probabilityA = clamp(base + performanceBias + swing, MIN_PROBABILITY, MAX_PROBABILITY);

  return Math.random() < probabilityA ? "A" : "B";
}

function applyMatchOutcome(
  state: StoredTournamentState,
  match: MatchRecord,
  winnerId: string,
  loserId: string,
) {
  const winner = state.competitors.find((competitor) => competitor.id === winnerId);
  const loser = state.competitors.find((competitor) => competitor.id === loserId);

  if (!winner || !loser) {
    return;
  }

  winner.rating += 25;
  winner.wins += 1;
  winner.previousPerformanceScore = winner.rating + winner.wins * 6 - winner.losses * 2;

  loser.rating = Math.max(0, loser.rating - 10);
  loser.losses += 1;
  loser.previousPerformanceScore = loser.rating + loser.wins * 6 - loser.losses * 2;

  match.winnerId = winnerId;
  match.loserId = loserId;
}

function roundMatches(matches: MatchRecord[], round: number) {
  return matches
    .filter((match) => match.round === round)
    .sort((a, b) => a.matchIndex - b.matchIndex);
}

function findCurrentMatch(state: StoredTournamentState) {
  return state.matches.find((match) => match.id === state.tournament?.currentMatchId) ?? null;
}

function buildNextRound(state: StoredTournamentState, round: number) {
  const tournament = state.tournament;

  if (!tournament) {
    return null;
  }

  const currentRoundMatches = roundMatches(state.matches, round);
  const orderedCompleted = currentRoundMatches.filter((match) => match.winnerId && match.loserId);

  if (orderedCompleted.some((match) => !match.winnerId || !match.loserId)) {
    return null;
  }

  const winners = orderedCompleted.map((match) => match.winnerId as string);
  const losers = orderedCompleted.map((match) => match.loserId as string);

  if (currentRoundMatches.some((match) => match.stage === "final")) {
    tournament.status = "completed";
    tournament.completedAt = new Date().toISOString();
    tournament.currentMatchId = null;
    return null;
  }

  if (winners.length > 2) {
    const nextRound = round + 1;
    const label = labelForRound(winners.length);
    const nextMatches = [];

    for (let index = 0; index < winners.length; index += 2) {
      nextMatches.push(
        createMatch(
          tournament.id,
          nextRound,
          nextMatches.length,
          winners.length === 2 ? "final" : "round",
          winners[index],
          winners[index + 1],
          label,
        ),
      );
    }

    state.matches.push(...nextMatches);
    tournament.currentRound = nextRound;
    tournament.currentMatchId = nextMatches[0]?.id ?? null;
    return nextMatches[0] ?? null;
  }

  if (winners.length === 2) {
    const nextRound = round + 1;
    const placementMatch = createMatch(
      tournament.id,
      nextRound,
      0,
      "third_place",
      losers[0],
      losers[1],
      "Third Place Playoff",
    );
    const finalMatch = createMatch(
      tournament.id,
      nextRound,
      1,
      "final",
      winners[0],
      winners[1],
      "Championship Final",
    );

    state.matches.push(placementMatch, finalMatch);
    tournament.currentRound = nextRound;
    tournament.currentMatchId = placementMatch.id;
    return placementMatch;
  }

  tournament.status = "completed";
  tournament.completedAt = new Date().toISOString();
  tournament.currentMatchId = null;
  return null;
}

export function startTournament(
  state: StoredTournamentState,
  size: 2 | 4 | 8 | 16 | 32,
  editableCompetitors: EditableCompetitor[],
) {
  const tournamentId = randomUUID();
  const shuffled = shuffle(editableCompetitors);
  const label = size === 2 ? "Championship Final" : labelForRound(size);

  state.tournament = {
    id: tournamentId,
    sessionId: state.session.id,
    size,
    status: "active",
    currentRound: 1,
    currentMatchId: null,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };

  state.competitors = shuffled.map((competitor) => ({
    id: competitor.id,
    tournamentId,
    sessionId: state.session.id,
    name: competitor.name,
    photoUrl: competitor.photoUrl || "/placeholder-avatar.svg",
    photoStoragePath: competitor.photoStoragePath,
    rating: 1000,
    wins: 0,
    losses: 0,
    previousPerformanceScore: 1000,
  }));

  state.matches = [];

  for (let index = 0; index < shuffled.length; index += 2) {
    state.matches.push(
      createMatch(
        tournamentId,
        1,
        state.matches.length,
        size === 2 ? "final" : "round",
        shuffled[index].id,
        shuffled[index + 1].id,
        label,
      ),
    );
  }

  state.tournament.currentMatchId = state.matches[0]?.id ?? null;
}

export function stepTournament(state: StoredTournamentState) {
  const tournament = state.tournament;

  if (!tournament) {
    throw new Error("Tournament not found.");
  }

  if (tournament.status === "completed") {
    return getTournamentSummary(state);
  }

  const current = findCurrentMatch(state);

  if (!current) {
    buildNextRound(state, tournament.currentRound);
    return getTournamentSummary(state);
  }

  const competitorA = state.competitors.find((competitor) => competitor.id === current.competitorAId);
  const competitorB = state.competitors.find((competitor) => competitor.id === current.competitorBId);

  if (!competitorA || !competitorB) {
    throw new Error("Match competitors are missing.");
  }

  if (current.status === "pending") {
    const winnerSide = pickWinner(competitorA, competitorB);
    current.events = buildEvents(competitorA, competitorB, winnerSide === "A");
    current.simulationStep = 0;
    current.status = "in_progress";
    return getTournamentSummary(state);
  }

  if (current.status === "in_progress") {
    const finalStep = current.events.length - 1;

    if (current.simulationStep < finalStep) {
      current.simulationStep += 1;
    }

    if (current.simulationStep >= finalStep && !current.winnerId && !current.loserId) {
      const winnerIsA = current.events[finalStep]?.scoreA > current.events[finalStep]?.scoreB;
      const winnerId = winnerIsA ? competitorA.id : competitorB.id;
      const loserId = winnerIsA ? competitorB.id : competitorA.id;
      applyMatchOutcome(state, current, winnerId, loserId);
      current.status = "completed";
    }

    return getTournamentSummary(state);
  }

  const currentRoundMatches = roundMatches(state.matches, current.round);
  const nextPendingInRound = currentRoundMatches.find((match) => match.status !== "completed");

  if (nextPendingInRound) {
    tournament.currentMatchId = nextPendingInRound.id;
    return getTournamentSummary(state);
  }

  buildNextRound(state, current.round);
  return getTournamentSummary(state);
}

export function getTournamentSummary(state: StoredTournamentState): TournamentSummary {
  const competitorsById = new Map(state.competitors.map((competitor) => [competitor.id, competitor]));
  const matches = state.matches
    .slice()
    .sort((a, b) => (a.round === b.round ? a.matchIndex - b.matchIndex : a.round - b.round))
    .map((match) => {
      const competitorA = competitorsById.get(match.competitorAId);
      const competitorB = competitorsById.get(match.competitorBId);
      const currentEvent =
        match.simulationStep >= 0 && match.events[match.simulationStep]
          ? match.events[match.simulationStep]
          : null;

      if (!competitorA || !competitorB) {
        return null;
      }

      const view: MatchView = {
        id: match.id,
        round: match.round,
        roundLabel: match.roundLabel,
        matchIndex: match.matchIndex,
        stage: match.stage,
        status: match.status,
        simulationStep: match.simulationStep,
        totalSteps: match.events.length || 5,
        currentEvent,
        competitorA,
        competitorB,
        winnerId: match.winnerId,
        loserId: match.loserId,
      };

      return view;
    })
    .filter(Boolean) as MatchView[];

  const currentMatch = matches.find((match) => match.id === state.tournament?.currentMatchId) ?? null;
  const finalMatch = state.matches.find((match) => match.stage === "final" && match.status === "completed");
  const thirdPlaceMatch = state.matches.find(
    (match) => match.stage === "third_place" && match.status === "completed",
  );

  return {
    session: state.session,
    tournament: state.tournament,
    competitors: state.competitors
      .slice()
      .sort((a, b) => b.rating - a.rating || b.wins - a.wins || a.losses - b.losses),
    matches,
    currentMatch,
    podium: {
      champion: finalMatch?.winnerId ? competitorsById.get(finalMatch.winnerId) ?? null : null,
      runnerUp: finalMatch?.loserId ? competitorsById.get(finalMatch.loserId) ?? null : null,
      thirdPlace: thirdPlaceMatch?.winnerId
        ? competitorsById.get(thirdPlaceMatch.winnerId) ?? null
        : null,
    },
  };
}
