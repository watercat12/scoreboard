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

export interface TeamNames {
  A: [string, string];
  B: [string, string];
}
