import "./style.css";
import {
  applyEdit,
  beginEdit,
  canUndo,
  changeSides,
  createMatch,
  endEdit,
  servePlayer,
  swapPlayers,
  tapTeam,
  undo,
  visibleSlot,
} from "./engine";
import type { EditSession } from "./engine";
import type { GameState, MatchState, Player, TeamId } from "./types";

const teamNames: Record<TeamId, string> = { A: "Đội A", B: "Đội B" };

let game: GameState = createMatch();
let edit: EditSession | null = null;

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("Missing #app root");
const root: HTMLDivElement = app;

function slotFor(match: MatchState, team: TeamId, player: Player): string {
  const server = servePlayer(match, team);
  const isServer = server !== null && server.id === player.id;
  const input =
    edit && edit.playerId === player.id
      ? `<input class="slot-input" data-role="name-input" value="${escapeAttr(player.name)}" maxlength="24" />`
      : escapeHtml(player.name);
  return `<div class="slot${isServer ? " server" : ""}" data-role="slot" data-player="${player.id}" data-team="${team}">${input}</div>`;
}

function sideHtml(match: MatchState, team: TeamId): string {
  const players = [...match.teams[team].players].sort(
    (a, b) => slotIndex(match, team, a) - slotIndex(match, team, b),
  );
  return `
    <section class="side${match.servingTeam === team ? " serving" : ""}" data-role="court" data-team="${team}">
      <span class="side-label">${teamNames[team]}</span>
      <div class="score" data-role="score" data-team="${team}">${match.score[team]}</div>
      <div class="slots">
        ${players.map((player) => slotFor(match, team, player)).join("")}
        <button class="swap" data-role="swap" data-team="${team}" type="button">Đổi vị trí</button>
      </div>
    </section>`;
}

function slotIndex(match: MatchState, team: TeamId, player: Player): number {
  return visibleSlot(match, team, player) === "top" ? 0 : 1;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

function escapeAttr(value: string): string {
  return escapeHtml(value);
}

function render(): void {
  const match = game.present;
  const leftTeam: TeamId = match.sides.A === "left" ? "A" : "B";
  const rightTeam: TeamId = leftTeam === "A" ? "B" : "A";
  const hint =
    match.servingTeam === null
      ? "Chọn đội giao cầu: chạm vào nửa sân của đội đó"
      : "Chạm nửa sân để cộng điểm";

  root.innerHTML = `
    <div class="app">
      <div class="court">
        ${sideHtml(match, leftTeam)}
        <div class="net">
          <button class="side-change" data-role="side-change" type="button">Đổi<br/>sân</button>
        </div>
        ${sideHtml(match, rightTeam)}
      </div>
      <div class="toolbar">
        <div class="hint">${hint}</div>
        <button data-role="undo" type="button" ${canUndo(game) ? "" : "disabled"}>Hoàn tác</button>
      </div>
    </div>`;

  if (edit) {
    const input = root.querySelector<HTMLInputElement>('[data-role="name-input"]');
    if (input) {
      input.focus();
      input.select();
    }
  }
}

function commit(next: GameState): void {
  game = next;
  render();
}

root.addEventListener("click", (event) => {
  const target = event.target as HTMLElement | null;
  if (!target) return;

  const role = target.closest<HTMLElement>("[data-role]");
  if (!role) return;
  const action = role.dataset.role;

  if (action === "name-input") return;

  if (edit && action !== "slot") {
    finishEdit();
  }

  switch (action) {
    case "side-change":
      commit(changeSides(game));
      return;
    case "undo":
      commit(undo(game));
      return;
    case "swap": {
      const team = role.dataset.team as TeamId | undefined;
      if (team) commit(swapPlayers(game, team));
      return;
    }
    case "slot": {
      const playerId = role.dataset.player;
      if (playerId) startEdit(playerId);
      return;
    }
    case "court": {
      const team = role.dataset.team as TeamId | undefined;
      if (team) commit(tapTeam(game, team));
      return;
    }
    default:
      return;
  }
});

function startEdit(playerId: string): void {
  edit = beginEdit(game, playerId);
  render();
}

function finishEdit(): void {
  if (!edit) return;
  const input = app?.querySelector<HTMLInputElement>('[data-role="name-input"]');
  if (input) {
    game = applyEdit(game, edit, input.value);
  }
  game = endEdit(game, edit);
  edit = null;
  render();
}

root.addEventListener("input", (event) => {
  const input = event.target as HTMLInputElement | null;
  if (!input || input.dataset.role !== "name-input" || !edit) return;
  game = applyEdit(game, edit, input.value);
});

root.addEventListener("keydown", (event) => {
  const input = event.target as HTMLInputElement | null;
  if (!input || input.dataset.role !== "name-input") return;
  if (event.key === "Enter") {
    event.preventDefault();
    input.blur();
  }
});

root.addEventListener("focusout", (event) => {
  const input = event.target as HTMLInputElement | null;
  if (!input || input.dataset.role !== "name-input") return;
  finishEdit();
});

render();
