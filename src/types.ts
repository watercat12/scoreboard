export type TeamId = "A" | "B";

export type ServiceCourt = "left" | "right";

export type Side = "left" | "right";

export type VisibleSlot = "top" | "bottom";

export interface Player {
  id: string;
  name: string;
  serviceCourt: ServiceCourt;
}

export interface TeamState {
  id: TeamId;
  players: [Player, Player];
}

export interface MatchState {
  teams: Record<TeamId, TeamState>;
  score: Record<TeamId, number>;
  servingTeam: TeamId | null;
  sides: Record<TeamId, Side>;
}

export interface GameState {
  present: MatchState;
  past: MatchState[];
}

export interface GameRecordTeam {
  name: string;
  players: [string, string];
}

export interface GameRecord {
  id: string;
  finishedAt: number;
  score: Record<TeamId, number>;
  teams: Record<TeamId, GameRecordTeam>;
  winner: TeamId | null;
}

export interface AppState {
  game: GameState;
  history: GameRecord[];
}

export interface TeamNames {
  A: [string, string];
  B: [string, string];
}
