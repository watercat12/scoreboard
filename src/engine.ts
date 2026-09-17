import type {
  GameState,
  MatchState,
  Player,
  ServiceCourt,
  TeamId,
  TeamNames,
  VisibleSlot,
} from "./types";

export const TEAM_IDS: TeamId[] = ["A", "B"];

const DEFAULT_NAMES: TeamNames = { A: ["A1", "A2"], B: ["B1", "B2"] };

function cloneMatch(match: MatchState): MatchState {
  return {
    teams: {
      A: { id: "A", players: [clonePlayer(match.teams.A.players[0]), clonePlayer(match.teams.A.players[1])] },
      B: { id: "B", players: [clonePlayer(match.teams.B.players[0]), clonePlayer(match.teams.B.players[1])] },
    },
    score: { A: match.score.A, B: match.score.B },
    servingTeam: match.servingTeam,
    sides: { A: match.sides.A, B: match.sides.B },
  };
}

function clonePlayer(player: Player): Player {
  return { id: player.id, name: player.name, serviceCourt: player.serviceCourt };
}

export function createMatchState(names?: Partial<TeamNames>): MatchState {
  const resolved: TeamNames = {
    A: names?.A ?? DEFAULT_NAMES.A,
    B: names?.B ?? DEFAULT_NAMES.B,
  };
  return {
    teams: {
      A: {
        id: "A",
        players: [
          { id: "A1", name: resolved.A[0], serviceCourt: "right" },
          { id: "A2", name: resolved.A[1], serviceCourt: "left" },
        ],
      },
      B: {
        id: "B",
        players: [
          { id: "B1", name: resolved.B[0], serviceCourt: "right" },
          { id: "B2", name: resolved.B[1], serviceCourt: "left" },
        ],
      },
    },
    score: { A: 0, B: 0 },
    servingTeam: null,
    sides: { A: "left", B: "right" },
  };
}

export function createMatch(names?: Partial<TeamNames>): GameState {
  return { present: createMatchState(names), past: [] };
}

function commit(game: GameState, next: MatchState): GameState {
  return { present: next, past: [...game.past, game.present] };
}

export function serverCourt(match: MatchState, team: TeamId): ServiceCourt {
  return match.score[team] % 2 === 0 ? "right" : "left";
}

export function servePlayer(match: MatchState, team: TeamId): Player | null {
  if (match.servingTeam !== team) return null;
  const court = serverCourt(match, team);
  return match.teams[team].players.find((player) => player.serviceCourt === court) ?? null;
}

export function visibleSlot(match: MatchState, team: TeamId, player: Player): VisibleSlot {
  const onLeftSide = match.sides[team] === "left";
  if (player.serviceCourt === "left") return onLeftSide ? "top" : "bottom";
  return onLeftSide ? "bottom" : "top";
}

export function selectServe(game: GameState, team: TeamId): GameState {
  if (game.present.servingTeam !== null) return game;
  const next = cloneMatch(game.present);
  next.servingTeam = team;
  return commit(game, next);
}

export function tapTeam(game: GameState, team: TeamId): GameState {
  if (game.present.servingTeam === null) return selectServe(game, team);

  const next = cloneMatch(game.present);
  next.score[team] += 1;

  if (team === game.present.servingTeam) {
    const [first, second] = next.teams[team].players;
    const court = first.serviceCourt;
    first.serviceCourt = second.serviceCourt;
    second.serviceCourt = court;
  } else {
    next.servingTeam = team;
  }

  return commit(game, next);
}

export function swapPlayers(game: GameState, team: TeamId): GameState {
  const next = cloneMatch(game.present);
  const [first, second] = next.teams[team].players;
  const court = first.serviceCourt;
  first.serviceCourt = second.serviceCourt;
  second.serviceCourt = court;
  return commit(game, next);
}

export function changeSides(game: GameState): GameState {
  const next = cloneMatch(game.present);
  const left = next.sides.A;
  next.sides.A = next.sides.B;
  next.sides.B = left;
  return commit(game, next);
}

export function renamePlayer(game: GameState, playerId: string, name: string): GameState {
  const trimmed = name.trim();
  if (trimmed.length === 0) return game;

  const existing = findPlayer(game.present, playerId);
  if (!existing || existing.name === trimmed) return game;

  const next = cloneMatch(game.present);
  const target = findPlayer(next, playerId);
  if (!target) return game;
  target.name = trimmed;
  return commit(game, next);
}

export function findPlayer(match: MatchState, playerId: string): Player | null {
  for (const team of TEAM_IDS) {
    const found = match.teams[team].players.find((player) => player.id === playerId);
    if (found) return found;
  }
  return null;
}

export interface EditSession {
  base: GameState;
  playerId: string;
}

export function beginEdit(game: GameState, playerId: string): EditSession | null {
  if (!findPlayer(game.present, playerId)) return null;
  return { base: game, playerId };
}

export function applyEdit(game: GameState, session: EditSession | null, name: string): GameState {
  if (!session) return game;
  const current = findPlayer(game.present, session.playerId);
  if (!current || current.name === name) return game;
  const next = cloneMatch(game.present);
  const target = findPlayer(next, session.playerId);
  if (!target) return game;
  target.name = name;
  return { present: next, past: game.past };
}

export function endEdit(game: GameState, session: EditSession | null): GameState {
  if (!session) return game;
  const stored = findPlayer(session.base.present, session.playerId)?.name;
  const current = findPlayer(game.present, session.playerId)?.name ?? "";
  const trimmed = current.trim();
  if (trimmed.length === 0 || trimmed === stored) return session.base;

  const next = cloneMatch(game.present);
  const target = findPlayer(next, session.playerId);
  if (!target) return session.base;
  target.name = trimmed;
  return { present: next, past: [...session.base.past, session.base.present] };
}

export function canUndo(game: GameState): boolean {
  return game.past.length > 0;
}

export function undo(game: GameState): GameState {
  if (game.past.length === 0) return game;
  const past = game.past.slice(0, -1);
  return { present: game.past[game.past.length - 1], past };
}
