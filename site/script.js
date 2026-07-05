const sizeOptions = [2, 4, 8, 16];

const state = {
  selectedSize: 8,
  stage: "setup",
  competitors: [],
  rounds: [],
  currentRoundIndex: 0,
  currentMatchIndex: 0,
  standings: [],
  podium: null,
};

const elements = {
  setupScreen: document.querySelector("#setup-screen"),
  tournamentScreen: document.querySelector("#tournament-screen"),
  resultsScreen: document.querySelector("#results-screen"),
  sizeOptions: document.querySelector("#size-options"),
  nameGrid: document.querySelector("#name-grid"),
  setupError: document.querySelector("#setup-error"),
  startBtn: document.querySelector("#start-btn"),
  advanceBtn: document.querySelector("#advance-btn"),
  restartBtn: document.querySelector("#restart-btn"),
  matchTitle: document.querySelector("#match-title"),
  matchSubtitle: document.querySelector("#match-subtitle"),
  scoreDisplay: document.querySelector("#score-display"),
  fighterA: document.querySelector("#fighter-a"),
  fighterB: document.querySelector("#fighter-b"),
  commentaryText: document.querySelector("#commentary-text"),
  progressDots: document.querySelector("#progress-dots"),
  roundList: document.querySelector("#round-list"),
  podium: document.querySelector("#podium"),
  standingsList: document.querySelector("#standings-list"),
};

function createCompetitor(name) {
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    rating: 1000,
    wins: 0,
    losses: 0,
  };
}

function shuffle(items) {
  const clone = [...items];

  for (let index = clone.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]];
  }

  return clone;
}

function initials(name) {
  return name
    .split(" ")
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function labelForRound(playerCount) {
  if (playerCount === 2) {
    return "Championship Final";
  }

  if (playerCount === 4) {
    return "Semifinals";
  }

  if (playerCount === 8) {
    return "Quarterfinals";
  }

  return "Opening Round";
}

function createMatch(playerA, playerB, roundLabel, stage = "round") {
  return {
    id: crypto.randomUUID(),
    roundLabel,
    stage,
    playerA,
    playerB,
    status: "pending",
    events: [],
    currentStepIndex: -1,
    winnerId: null,
    loserId: null,
  };
}

function pickWinner(playerA, playerB) {
  const total = playerA.rating + playerB.rating;
  const probabilityA = Math.min(0.78, Math.max(0.22, playerA.rating / total));
  return Math.random() < probabilityA ? playerA : playerB;
}

function buildEvents(playerA, playerB, winner) {
  const loser = winner.id === playerA.id ? playerB : playerA;
  const winnerIsA = winner.id === playerA.id;
  const frames = winnerIsA
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

  return [
    {
      label: `${playerA.name} and ${playerB.name} step into the arena.`,
      scoreA: frames[0][0],
      scoreB: frames[0][1],
    },
    {
      label: `${winner.name} strikes first and sets the pace.`,
      scoreA: frames[1][0],
      scoreB: frames[1][1],
    },
    {
      label: `${loser.name} answers back and keeps the match alive.`,
      scoreA: frames[2][0],
      scoreB: frames[2][1],
    },
    {
      label: `${winner.name} takes control in the late game.`,
      scoreA: frames[3][0],
      scoreB: frames[3][1],
    },
    {
      label: `${winner.name} closes it out and moves on.`,
      scoreA: frames[4][0],
      scoreB: frames[4][1],
    },
  ];
}

function updateRatings(winner, loser) {
  winner.rating += 24;
  winner.wins += 1;
  loser.rating = Math.max(900, loser.rating - 10);
  loser.losses += 1;
}

function currentRound() {
  return state.rounds[state.currentRoundIndex] || null;
}

function currentMatch() {
  const round = currentRound();
  return round ? round.matches[state.currentMatchIndex] || null : null;
}

function renderSizeOptions() {
  elements.sizeOptions.innerHTML = "";

  sizeOptions.forEach((size) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `size-btn${state.selectedSize === size ? " active" : ""}`;
    button.textContent = `${size} Players`;
    button.addEventListener("click", () => {
      state.selectedSize = size;
      renderSizeOptions();
      renderNameFields();
    });
    elements.sizeOptions.appendChild(button);
  });
}

function renderNameFields() {
  elements.nameGrid.innerHTML = "";

  for (let index = 0; index < state.selectedSize; index += 1) {
    const card = document.createElement("article");
    card.className = "name-card";

    const label = document.createElement("label");
    label.className = "section-kicker";
    label.setAttribute("for", `player-${index}`);
    label.textContent = `Player ${index + 1}`;

    const input = document.createElement("input");
    input.className = "name-input";
    input.id = `player-${index}`;
    input.type = "text";
    input.placeholder = "Enter a name";

    card.append(label, input);
    elements.nameGrid.appendChild(card);
  }
}

function collectNames() {
  const inputs = [...elements.nameGrid.querySelectorAll(".name-input")];
  return inputs.map((input) => input.value.trim()).filter(Boolean);
}

function buildTournament(names) {
  const competitors = shuffle(names.map((name) => createCompetitor(name)));
  const openingLabel = labelForRound(competitors.length);
  const openingRound = {
    label: openingLabel,
    matches: [],
  };

  for (let index = 0; index < competitors.length; index += 2) {
    openingRound.matches.push(
      createMatch(
        competitors[index],
        competitors[index + 1],
        openingLabel,
        competitors.length === 2 ? "final" : "round",
      ),
    );
  }

  state.competitors = competitors;
  state.rounds = [openingRound];
  state.currentRoundIndex = 0;
  state.currentMatchIndex = 0;
  state.standings = [];
  state.podium = null;
  state.stage = "tournament";
}

function ensureMatchSimulation(match) {
  if (match.events.length > 0) {
    return;
  }

  const winner = pickWinner(match.playerA, match.playerB);
  match.events = buildEvents(match.playerA, match.playerB, winner);
}

function finishMatch(match) {
  const lastEvent = match.events[match.events.length - 1];
  const winner = lastEvent.scoreA > lastEvent.scoreB ? match.playerA : match.playerB;
  const loser = winner.id === match.playerA.id ? match.playerB : match.playerA;

  match.winnerId = winner.id;
  match.loserId = loser.id;
  match.status = "completed";
  updateRatings(winner, loser);
}

function collectRoundResults(round) {
  const winners = [];
  const losers = [];

  round.matches.forEach((match) => {
    const winner = match.winnerId === match.playerA.id ? match.playerA : match.playerB;
    const loser = match.loserId === match.playerA.id ? match.playerA : match.playerB;
    winners.push(winner);
    losers.push(loser);
  });

  return { winners, losers };
}

function finishTournamentFromRound(round) {
  const finalMatch = round.matches.find((match) => match.stage === "final") || round.matches[0];
  const champion = finalMatch.winnerId === finalMatch.playerA.id ? finalMatch.playerA : finalMatch.playerB;
  const runnerUp = finalMatch.loserId === finalMatch.playerA.id ? finalMatch.playerA : finalMatch.playerB;
  const thirdPlaceMatch = round.matches.find((match) => match.stage === "third_place");
  const thirdPlaceCompetitor = thirdPlaceMatch
    ? thirdPlaceMatch.winnerId === thirdPlaceMatch.playerA.id
      ? thirdPlaceMatch.playerA
      : thirdPlaceMatch.playerB
    : null;

  state.podium = {
    champion,
    runnerUp,
    thirdPlace: thirdPlaceCompetitor,
  };
  state.standings = [...state.competitors].sort(
    (left, right) => right.wins - left.wins || right.rating - left.rating || left.losses - right.losses,
  );
  state.stage = "results";
}

function buildNextRound() {
  const round = currentRound();

  if (!round) {
    return;
  }

  const { winners, losers } = collectRoundResults(round);
  const finalMatch = round.matches.find((match) => match.stage === "final");

  if (finalMatch) {
    finishTournamentFromRound(round);
    return;
  }

  if (winners.length === 2 && round.label === "Semifinals") {
    const nextRound = {
      label: "Final Stage",
      matches: [
        createMatch(losers[0], losers[1], "Third Place Match", "third_place"),
        createMatch(winners[0], winners[1], "Championship Final", "final"),
      ],
    };

    state.rounds.push(nextRound);
    state.currentRoundIndex += 1;
    state.currentMatchIndex = 0;
    return;
  }

  const nextLabel = labelForRound(winners.length);
  const nextStage = winners.length === 2 ? "final" : "round";
  const nextRound = {
    label: nextLabel,
    matches: [],
  };

  for (let index = 0; index < winners.length; index += 2) {
    nextRound.matches.push(
      createMatch(
        winners[index],
        winners[index + 1],
        nextLabel,
        nextStage,
      ),
    );
  }

  state.rounds.push(nextRound);
  state.currentRoundIndex += 1;
  state.currentMatchIndex = 0;
}

function advanceTournament() {
  const match = currentMatch();

  if (!match) {
    return;
  }

  ensureMatchSimulation(match);

  if (match.status === "pending") {
    match.status = "in_progress";
    match.currentStepIndex = 0;
    render();
    return;
  }

  if (match.status === "in_progress") {
    if (match.currentStepIndex < match.events.length - 1) {
      match.currentStepIndex += 1;
      render();
      return;
    }

    finishMatch(match);
    render();
    return;
  }

  const round = currentRound();
  const nextUnfinishedMatch = round.matches.findIndex((item) => item.status !== "completed");

  if (nextUnfinishedMatch !== -1) {
    state.currentMatchIndex = nextUnfinishedMatch;
    render();
    return;
  }

  buildNextRound();
  render();
}

function renderFighter(container, player, role, currentMatchData) {
  const isWinner = currentMatchData?.winnerId === player.id;
  const isLoser = currentMatchData?.loserId === player.id;

  container.className = `fighter${isWinner ? " winner" : ""}${isLoser ? " loser" : ""}`;
  container.innerHTML = `
    <div class="avatar-badge">${initials(player.name)}</div>
    <div>
      <p class="fighter-name">${player.name}</p>
      <div class="fighter-stats">
        <span class="stat-pill">Rating ${player.rating}</span>
        <span class="stat-pill">${player.wins}W / ${player.losses}L</span>
        <span class="stat-pill">${role}</span>
      </div>
    </div>
  `;
}

function renderProgressDots(match) {
  elements.progressDots.innerHTML = "";

  match.events.forEach((_, index) => {
    const dot = document.createElement("span");
    if (index <= match.currentStepIndex) {
      dot.classList.add("active");
    }
    elements.progressDots.appendChild(dot);
  });
}

function renderRounds() {
  elements.roundList.innerHTML = "";

  state.rounds.forEach((round, roundIndex) => {
    const card = document.createElement("article");
    card.className = `round-card${roundIndex === state.currentRoundIndex ? " current" : ""}`;

    const title = document.createElement("p");
    title.className = "section-kicker";
    title.textContent = round.label;
    card.appendChild(title);

    round.matches.forEach((match) => {
      const row = document.createElement("div");
      row.className = "match-row";

      const names = document.createElement("p");
      names.innerHTML = `<strong>${match.playerA.name}</strong> vs <strong>${match.playerB.name}</strong>`;

      const meta = document.createElement("p");
      if (match.winnerId) {
        const winner = match.winnerId === match.playerA.id ? match.playerA.name : match.playerB.name;
        meta.textContent = `Winner: ${winner}`;
      } else if (match.status === "in_progress") {
        meta.textContent = "Live now";
      } else {
        meta.textContent = "Pending";
      }

      row.append(names, meta);
      card.appendChild(row);
    });

    elements.roundList.appendChild(card);
  });
}

function renderTournament() {
  const match = currentMatch();

  if (!match) {
    return;
  }

  const event = match.currentStepIndex >= 0 ? match.events[match.currentStepIndex] : null;
  const roundNumber = state.currentRoundIndex + 1;

  elements.matchTitle.textContent = `${match.playerA.name} vs ${match.playerB.name}`;
  elements.matchSubtitle.textContent = `${match.roundLabel} - Round ${roundNumber}`;
  elements.scoreDisplay.textContent = event ? `${event.scoreA} - ${event.scoreB}` : "0 - 0";
  elements.commentaryText.textContent =
    event?.label || "Press Next to start the match simulation.";

  elements.advanceBtn.textContent =
    match.status === "completed" ? "Move To Next Match" : match.status === "pending" ? "Start Match" : "Next";

  renderFighter(elements.fighterA, match.playerA, "Left Side", match);
  renderFighter(elements.fighterB, match.playerB, "Right Side", match);
  renderProgressDots(match);
  renderRounds();
}

function renderResults() {
  const slots = [
    { key: "champion", label: "1st Place", tone: "gold" },
    { key: "runnerUp", label: "2nd Place", tone: "silver" },
    { key: "thirdPlace", label: "3rd Place", tone: "bronze" },
  ];

  elements.podium.innerHTML = "";

  slots.forEach((slot) => {
    const competitor = state.podium?.[slot.key] || null;
    const card = document.createElement("article");
    card.className = `podium-card ${slot.tone}`;
    card.innerHTML = competitor
      ? `
        <p class="podium-rank">${slot.label}</p>
        <p class="podium-name">${competitor.name}</p>
        <p class="podium-meta">Rating ${competitor.rating}<br>${competitor.wins} wins - ${competitor.losses} losses</p>
      `
      : `
        <p class="podium-rank">${slot.label}</p>
        <p class="podium-name">Unavailable</p>
      `;
    elements.podium.appendChild(card);
  });

  elements.standingsList.innerHTML = "";
  state.standings.forEach((competitor, index) => {
    const item = document.createElement("div");
    item.className = "standing-item";
    item.innerHTML = `
      <p><strong>#${index + 1} ${competitor.name}</strong></p>
      <p class="standing-meta">Rating ${competitor.rating} - ${competitor.wins} wins - ${competitor.losses} losses</p>
    `;
    elements.standingsList.appendChild(item);
  });
}

function render() {
  elements.setupScreen.classList.toggle("hidden", state.stage !== "setup");
  elements.tournamentScreen.classList.toggle("hidden", state.stage !== "tournament");
  elements.resultsScreen.classList.toggle("hidden", state.stage !== "results");

  if (state.stage === "tournament") {
    renderTournament();
  }

  if (state.stage === "results") {
    renderResults();
  }
}

function startTournament() {
  const names = collectNames();

  if (names.length !== state.selectedSize) {
    elements.setupError.textContent = `Please enter exactly ${state.selectedSize} names.`;
    return;
  }

  const uniqueNames = new Set(names.map((name) => name.toLowerCase()));

  if (uniqueNames.size !== names.length) {
    elements.setupError.textContent = "Each player name must be unique.";
    return;
  }

  elements.setupError.textContent = "";
  buildTournament(names);
  render();
}

function restartGame() {
  state.stage = "setup";
  state.competitors = [];
  state.rounds = [];
  state.currentRoundIndex = 0;
  state.currentMatchIndex = 0;
  state.standings = [];
  state.podium = null;
  elements.setupError.textContent = "";
  renderNameFields();
  render();
}

elements.startBtn.addEventListener("click", startTournament);
elements.advanceBtn.addEventListener("click", advanceTournament);
elements.restartBtn.addEventListener("click", restartGame);

renderSizeOptions();
renderNameFields();
render();
