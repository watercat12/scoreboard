import "./style.css";
import {
  applyEdit,
  beginEdit,
  canUndo,
  changeSides,
  clearHistory,
  deleteRecord,
  endEdit,
  finishGame,
  servePlayer,
  swapPlayers,
  tapTeam,
  undo,
  visibleSlot,
} from "./engine";
import type { EditSession } from "./engine";
import { load, save } from "./persistence";
import type { AppState, GameRecord, GameState, MatchState, Player, TeamId } from "./types";

const teamNames: Record<TeamId, string> = { A: "Đội A", B: "Đội B" };

let app: AppState = load();
let game: GameState = app.game;
let edit: EditSession | null = null;
let historyOpen = false;

const appRoot = document.querySelector<HTMLDivElement>("#app");
if (!appRoot) throw new Error("Missing #app root");
const root: HTMLDivElement = appRoot;

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

function isScored(match: MatchState): boolean {
  return match.score.A > 0 || match.score.B > 0;
}

function formatTime(finishedAt: number): string {
  return new Date(finishedAt).toLocaleString("vi-VN");
}

function recordHtml(record: GameRecord): string {
  const winnerText =
    record.winner === null
      ? "Hòa"
      : `${record.teams[record.winner].name} thắng`;
  return `
    <li class="record">
      <div class="record-head">
        <span class="record-score">${record.score.A} - ${record.score.B}</span>
        <span class="record-winner">${escapeHtml(winnerText)}</span>
      </div>
      <div class="record-teams">
        <span>${escapeHtml(record.teams.A.name)}: ${record.teams.A.players.map(escapeHtml).join(", ")}</span>
        <span>${escapeHtml(record.teams.B.name)}: ${record.teams.B.players.map(escapeHtml).join(", ")}</span>
      </div>
      <div class="record-foot">
        <span class="record-time">${escapeHtml(formatTime(record.finishedAt))}</span>
        <button class="record-delete" data-role="delete-record" data-record="${record.id}" type="button">Xóa</button>
      </div>
    </li>`;
}

function historyHtml(): string {
  if (!historyOpen) return "";
  const records = app.history;
  const body =
    records.length === 0
      ? `<p class="history-empty">Chưa có ván nào kết thúc</p>`
      : `<ul class="record-list">${records.map(recordHtml).join("")}</ul>`;
  return `
    <div class="history" data-role="history-panel">
      <div class="history-card" data-role="history-card">
        <div class="history-head">
          <h2>Lịch sử ván đấu</h2>
          <button class="history-close" data-role="close-history" type="button">Đóng</button>
        </div>
        ${body}
        ${
          records.length > 0
            ? `<button class="history-clear" data-role="clear-history" type="button">Xóa tất cả</button>`
            : ""
        }
      </div>
    </div>`;
}

function render(): void {
  const match = app.game.present;
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
        <button data-role="history" type="button">Lịch sử</button>
        <button data-role="undo" type="button" ${canUndo(app.game) ? "" : "disabled"}>Hoàn tác</button>
        <button class="end-game" data-role="end-game" type="button" ${isScored(match) ? "" : "disabled"}>Kết thúc</button>
      </div>
      ${historyHtml()}
    </div>`;

  if (edit) {
    const input = root.querySelector<HTMLInputElement>('[data-role="name-input"]');
    if (input) {
      input.focus();
      input.select();
    }
  }
}

function commit(nextApp: AppState): void {
  app = nextApp;
  game = app.game;
  save(app);
  render();
}

function commitGame(nextGame: GameState): void {
  commit({ game: nextGame, history: app.history });
}

root.addEventListener("click", (event) => {
  const target = event.target as HTMLElement | null;
  if (!target) return;

  const role = target.closest<HTMLElement>("[data-role]");
  if (!role) return;
  const action = role.dataset.role;

  if (action === "name-input") return;

  if (action === "history") {
    if (edit) finishEdit();
    historyOpen = true;
    render();
    return;
  }

  if (action === "close-history") {
    historyOpen = false;
    render();
    return;
  }

  if (action === "delete-record") {
    const id = role.dataset.record;
    if (id) commit(deleteRecord(app, id));
    return;
  }

  if (action === "clear-history") {
    if (window.confirm("Xóa toàn bộ lịch sử ván đấu?")) {
      commit(clearHistory(app));
    }
    return;
  }

  if (historyOpen) return;

  if (edit && action !== "slot") {
    finishEdit();
  }

  switch (action) {
    case "side-change":
      commitGame(changeSides(app.game));
      return;
    case "undo":
      commitGame(undo(app.game));
      return;
    case "end-game":
      if (!isScored(app.game.present)) return;
      if (window.confirm("Kết thúc ván này và bắt đầu ván mới?")) {
        commit(finishGame(app));
      }
      return;
    case "swap": {
      const team = role.dataset.team as TeamId | undefined;
      if (team) commitGame(swapPlayers(app.game, team));
      return;
    }
    case "slot": {
      const playerId = role.dataset.player;
      if (playerId) startEdit(playerId);
      return;
    }
    case "court": {
      const team = role.dataset.team as TeamId | undefined;
      if (team) commitGame(tapTeam(app.game, team));
      return;
    }
    default:
      return;
  }
});

function startEdit(playerId: string): void {
  edit = beginEdit(app.game, playerId);
  render();
}

function finishEdit(): void {
  if (!edit) return;
  const input = appRoot?.querySelector<HTMLInputElement>('[data-role="name-input"]');
  let nextGame = app.game;
  if (input) {
    nextGame = applyEdit(nextGame, edit, input.value);
  }
  nextGame = endEdit(nextGame, edit);
  edit = null;
  commitGame(nextGame);
}

root.addEventListener("input", (event) => {
  const input = event.target as HTMLInputElement | null;
  if (!input || input.dataset.role !== "name-input" || !edit) return;
  game = applyEdit(app.game, edit, input.value);
  app = { game, history: app.history };
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
