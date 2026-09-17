import { createApp } from "./engine";
import type { AppState, GameRecord, GameState, MatchState, TeamId } from "./types";

export const STORAGE_KEY = "badminton-scoreboard";
export const STORAGE_VERSION = 1;

interface StoredEnvelope {
  version: number;
  game: GameState;
  history: GameRecord[];
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function defaultStorage(): StorageLike | null {
  try {
    if (typeof localStorage !== "undefined") return localStorage;
  } catch {
    return null;
  }
  return null;
}

function isTeamId(value: unknown): value is TeamId {
  return value === "A" || value === "B";
}

function isPlayer(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  const player = value as Record<string, unknown>;
  return (
    typeof player.id === "string" &&
    typeof player.name === "string" &&
    (player.serviceCourt === "left" || player.serviceCourt === "right")
  );
}

function isMatch(value: unknown): value is MatchState {
  if (typeof value !== "object" || value === null) return false;
  const match = value as Record<string, unknown>;
  const teams = match.teams as Record<string, unknown> | undefined;
  const score = match.score as Record<string, unknown> | undefined;
  const sides = match.sides as Record<string, unknown> | undefined;

  if (!teams || !score || !sides) return false;
  if (typeof score.A !== "number" || typeof score.B !== "number") return false;
  if (match.servingTeam !== null && !isTeamId(match.servingTeam)) return false;
  if (sides.A !== "left" && sides.A !== "right") return false;
  if (sides.B !== "left" && sides.B !== "right") return false;

  for (const team of ["A", "B"] as const) {
    const teamState = teams[team] as Record<string, unknown> | undefined;
    if (!teamState || !Array.isArray(teamState.players)) return false;
    if (teamState.players.length !== 2) return false;
    if (!teamState.players.every(isPlayer)) return false;
  }
  return true;
}

function isGameState(value: unknown): value is GameState {
  if (typeof value !== "object" || value === null) return false;
  const game = value as Record<string, unknown>;
  if (!isMatch(game.present)) return false;
  return Array.isArray(game.past) && game.past.every(isMatch);
}

function isRecord(value: unknown): value is GameRecord {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  if (typeof record.id !== "string") return false;
  if (typeof record.finishedAt !== "number") return false;
  if (record.winner !== null && !isTeamId(record.winner)) return false;

  const score = record.score as Record<string, unknown> | undefined;
  if (!score || typeof score.A !== "number" || typeof score.B !== "number") {
    return false;
  }

  const teams = record.teams as Record<string, unknown> | undefined;
  if (!teams) return false;
  for (const team of ["A", "B"] as const) {
    const teamRecord = teams[team] as Record<string, unknown> | undefined;
    if (!teamRecord || typeof teamRecord.name !== "string") return false;
    const players = teamRecord.players;
    if (!Array.isArray(players) || players.length !== 2) return false;
    if (!players.every((name) => typeof name === "string")) return false;
  }
  return true;
}

export function freshApp(): AppState {
  return createApp();
}

export function load(
  storage: StorageLike | null = defaultStorage(),
): AppState {
  if (!storage) return freshApp();
  let raw: string | null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return freshApp();
  }
  if (!raw) return freshApp();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return freshApp();
  }

  if (typeof parsed !== "object" || parsed === null) return freshApp();
  const envelope = parsed as Record<string, unknown>;
  if (envelope.version !== STORAGE_VERSION) return freshApp();
  if (!isGameState(envelope.game)) return freshApp();
  if (!Array.isArray(envelope.history) || !envelope.history.every(isRecord)) {
    return freshApp();
  }

  return { game: envelope.game, history: envelope.history };
}

export function save(
  app: AppState,
  storage: StorageLike | null = defaultStorage(),
): void {
  if (!storage) return;
  const envelope: StoredEnvelope = {
    version: STORAGE_VERSION,
    game: app.game,
    history: app.history,
  };
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    // Storage may be unavailable or full; keep running in memory.
  }
}
