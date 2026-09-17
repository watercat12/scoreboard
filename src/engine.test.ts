import { describe, expect, it } from "vitest";
import {
  applyEdit,
  beginEdit,
  canUndo,
  changeSides,
  clearHistory,
  createApp,
  createMatch,
  deleteRecord,
  endEdit,
  findPlayer,
  finishGame,
  freshMatch,
  renamePlayer,
  servePlayer,
  serverCourt,
  swapPlayers,
  tapTeam,
  toRecord,
  undo,
  visibleSlot,
} from "./engine";
import type { AppState, GameState } from "./types";

function tap(game: GameState, team: "A" | "B", times = 1): GameState {
  let next = game;
  for (let i = 0; i < times; i += 1) next = tapTeam(next, team);
  return next;
}

describe("initial state (2.1)", () => {
  it("starts at 0:0 with no serving team and players auto-placed", () => {
    const match = createMatch().present;
    expect(match.score).toEqual({ A: 0, B: 0 });
    expect(match.servingTeam).toBeNull();
    expect(match.teams.A.players.map((p) => p.serviceCourt)).toEqual(["right", "left"]);
    expect(match.teams.B.players.map((p) => p.serviceCourt)).toEqual(["right", "left"]);
  });
});

describe("scoring (2.2)", () => {
  it("first tap selects serve without scoring", () => {
    const game = tap(createMatch(), "A");
    expect(game.present.score).toEqual({ A: 0, B: 0 });
    expect(game.present.servingTeam).toBe("A");
  });

  it("later taps add exactly one point to the tapped team", () => {
    let game = tap(createMatch(), "A");
    game = tap(game, "A");
    expect(game.present.score).toEqual({ A: 1, B: 0 });

    game = tap(game, "B");
    expect(game.present.score).toEqual({ A: 1, B: 1 });
  });

  it("never blocks scores and declares no winner", () => {
    let game = tap(createMatch(), "A");
    game = tap(game, "A", 30);
    expect(game.present.score.A).toBe(30);
    expect(game.present.servingTeam).toBe("A");
  });
});

describe("serve tracking (2.3)", () => {
  it("derives even -> right and odd -> left", () => {
    const match = createMatch().present;
    expect(serverCourt(match, "A")).toBe("right");
    expect(serverCourt({ ...match, score: { A: 1, B: 0 } }, "A")).toBe("left");
    expect(serverCourt({ ...match, score: { A: 2, B: 0 } }, "A")).toBe("right");
  });

  it("returns no serving player for a non-serving team", () => {
    const game = tap(createMatch(), "A");
    expect(servePlayer(game.present, "B")).toBeNull();
  });

  it("serving player follows position, not identity", () => {
    let game = tap(createMatch(), "A");
    const before = servePlayer(game.present, "A");
    expect(before?.id).toBe("A1");
    game = swapPlayers(game, "A");
    const after = servePlayer(game.present, "A");
    expect(after?.id).toBe("A2");
  });
});

describe("rotation (2.4)", () => {
  it("server wins, keeps serve and rotates players", () => {
    let game = tap(createMatch(), "A");
    const server = servePlayer(game.present, "A");
    const courtsBefore = game.present.teams.A.players.map((p) => p.serviceCourt);
    game = tap(game, "A");
    expect(game.present.servingTeam).toBe("A");
    expect(game.present.teams.A.players.map((p) => p.serviceCourt)).toEqual([...courtsBefore].reverse());
    expect(servePlayer(game.present, "A")?.id).toBe(server?.id);
  });

  it("next server is the same player after rotation, back and forth", () => {
    let game = tap(createMatch(), "A");
    const firstServer = servePlayer(game.present, "A")?.id;

    game = tap(game, "A");
    expect(servePlayer(game.present, "A")?.id).toBe(firstServer);
    game = tap(game, "A");
    expect(servePlayer(game.present, "A")?.id).toBe(firstServer);
  });

  it("receiving team gains serve without rotation", () => {
    let game = tap(createMatch(), "A");
    const aBefore = game.present.teams.A.players.map((p) => p.serviceCourt);
    const bBefore = game.present.teams.B.players.map((p) => p.serviceCourt);

    game = tap(game, "B");
    expect(game.present.servingTeam).toBe("B");
    expect(game.present.teams.A.players.map((p) => p.serviceCourt)).toEqual(aBefore);
    expect(game.present.teams.B.players.map((p) => p.serviceCourt)).toEqual(bBefore);
  });

  it("new serving player follows new parity after gaining serve", () => {
    let game = tap(createMatch(), "A");
    game = tap(game, "B");
    expect(servePlayer(game.present, "B")?.id).toBe("B2");
    game = tap(game, "B");
    expect(servePlayer(game.present, "B")?.id).toBe("B2");
  });
});

describe("team setup (2.5)", () => {
  it("swap exchanges the team's two players only", () => {
    const game = swapPlayers(createMatch(), "A");
    expect(game.present.teams.A.players.map((p) => p.serviceCourt)).toEqual(["left", "right"]);
    expect(game.present.teams.B.players.map((p) => p.serviceCourt)).toEqual(["right", "left"]);
  });
});

describe("side change (2.6)", () => {
  it("swaps sides and keeps scores with their teams", () => {
    let game = tap(createMatch(), "A");
    game = tap(game, "A");
    const scoreBefore = { ...game.present.score };
    game = changeSides(game);
    expect(game.present.sides).toEqual({ A: "right", B: "left" });
    expect(game.present.score).toEqual(scoreBefore);
  });

  it("preserves serving team and serving player", () => {
    let game = tap(createMatch(), "A");
    game = tap(game, "A");
    const serverBefore = servePlayer(game.present, "A")?.id;
    game = changeSides(game);
    expect(game.present.servingTeam).toBe("A");
    expect(servePlayer(game.present, "A")?.id).toBe(serverBefore);
  });
});

describe("rename (2.7)", () => {
  it("stores the new name and finds the player", () => {
    const game = renamePlayer(createMatch(), "A1", "Nam");
    expect(findPlayer(game.present, "A1")?.name).toBe("Nam");
  });

  it("ignores blank names", () => {
    const base = createMatch();
    expect(renamePlayer(base, "A1", "   ")).toBe(base);
  });
});

describe("visible slot mapping (3.2)", () => {
  it("maps abstract courts to top/bottom per side", () => {
    const match = createMatch().present;
    const a1 = match.teams.A.players[0];
    const a2 = match.teams.A.players[1];
    expect(visibleSlot(match, "A", a1)).toBe("bottom");
    expect(visibleSlot(match, "A", a2)).toBe("top");

    const swapped = changeSides(createMatch()).present;
    expect(visibleSlot(swapped, "A", a1)).toBe("top");
    expect(visibleSlot(swapped, "A", a2)).toBe("bottom");
  });
});

describe("undo (2.8)", () => {
  it("reverses a point and its rotation", () => {
    let game = tap(createMatch(), "A");
    game = tap(game, "A");
    const snapshot = game.present;
    game = tap(game, "A");
    game = undo(game);
    expect(game.present).toEqual(snapshot);
  });

  it("reverses serve selection back to 0:0 with no server", () => {
    const game = undo(tap(createMatch(), "A"));
    expect(game.present.servingTeam).toBeNull();
    expect(game.present.score).toEqual({ A: 0, B: 0 });
  });

  it("reverses a side change", () => {
    let game = tap(createMatch(), "A");
    const before = game.present;
    game = changeSides(game);
    game = undo(game);
    expect(game.present).toEqual(before);
  });

  it("reverses a swap", () => {
    let game = tap(createMatch(), "A");
    const before = game.present;
    game = swapPlayers(game, "A");
    game = undo(game);
    expect(game.present).toEqual(before);
  });

  it("reverses a rename", () => {
    let game = tap(createMatch(), "A");
    const before = game.present;
    game = renamePlayer(game, "A1", "Nam");
    game = undo(game);
    expect(game.present).toEqual(before);
  });

  it("pushes exactly one snapshot per edit session", () => {
    let game = tap(createMatch(), "A");
    const historyBefore = game.past.length;
    const session = beginEdit(game, "A1");
    game = applyEdit(game, session, "N");
    game = applyEdit(game, session, "Na");
    game = applyEdit(game, session, "Nam");
    expect(game.past.length).toBe(historyBefore);
    game = endEdit(game, session);
    expect(game.past.length).toBe(historyBefore + 1);
    expect(findPlayer(game.present, "A1")?.name).toBe("Nam");
  });

  it("one undo reverses the whole rename", () => {
    let game = tap(createMatch(), "A");
    const before = game.present;
    const session = beginEdit(game, "A1");
    game = applyEdit(game, session, "Na");
    game = applyEdit(game, session, "Nam");
    game = endEdit(game, session);
    expect(findPlayer(game.present, "A1")?.name).toBe("Nam");
    game = undo(game);
    expect(game.present).toEqual(before);
  });

  it("discards an edit that ends unchanged or blank", () => {
    const game = tap(createMatch(), "A");
    const before = game.past.length;
    const blank = beginEdit(game, "A1");
    const afterBlank = endEdit(applyEdit(game, blank, "   "), blank);
    expect(afterBlank.present).toEqual(game.present);
    expect(afterBlank.past.length).toBe(before);
  });

  it("supports unlimited depth back to the initial state", () => {
    let game = tap(createMatch(), "A");
    game = tap(game, "A", 5);
    while (canUndo(game)) game = undo(game);
    expect(game.present.servingTeam).toBeNull();
    expect(game.present.score).toEqual({ A: 0, B: 0 });
    expect(game.past).toEqual([]);
  });

  it("is a safe no-op at the initial state", () => {
    const base = createMatch();
    expect(undo(base)).toBe(base);
  });
});

describe("fresh match (1.2)", () => {
  it("resets score and serving team but preserves names, courts and sides", () => {
    let game = tap(createMatch(), "A");
    game = tap(game, "A", 3);
    game = changeSides(game);
    game = swapPlayers(game, "B");
    const before = game.present;

    const fresh = freshMatch(before);
    expect(fresh.score).toEqual({ A: 0, B: 0 });
    expect(fresh.servingTeam).toBeNull();
    expect(fresh.sides).toEqual(before.sides);
    expect(fresh.teams.A.players.map((p) => p.name)).toEqual(
      before.teams.A.players.map((p) => p.name),
    );
    expect(fresh.teams.A.players.map((p) => p.serviceCourt)).toEqual(
      before.teams.A.players.map((p) => p.serviceCourt),
    );
    expect(fresh.teams.B.players.map((p) => p.serviceCourt)).toEqual(
      before.teams.B.players.map((p) => p.serviceCourt),
    );
  });
});

describe("toRecord (1.3)", () => {
  it("captures final score, snapshot names and derived winner", () => {
    let game = tap(createMatch({ A: ["Nam", "Long"], B: ["Huy", "Tuan"] }), "A");
    game = tap(game, "A", 3);
    game = renamePlayer(game, "A1", "Renamed");
    const record = toRecord(game.present, 1000);
    expect(record.finishedAt).toBe(1000);
    expect(record.score).toEqual({ A: 3, B: 0 });
    expect(record.winner).toBe("A");
    expect(record.teams.A.name).toBe("Đội A");
    expect(record.teams.A.players).toEqual(["Renamed", "Long"]);
    expect(record.teams.B.players).toEqual(["Huy", "Tuan"]);
    expect(typeof record.id).toBe("string");
    expect(record.id.length).toBeGreaterThan(0);
  });

  it("reports no winner on a tie", () => {
    let game = tap(createMatch(), "A");
    game = tap(game, "A");
    game = tap(game, "B");
    expect(toRecord(game.present).winner).toBeNull();
  });
});

describe("finishGame (1.4)", () => {
  it("records the game and starts a fresh one with empty undo stack", () => {
    let app = createApp();
    app = { game: tap(tap(app.game, "A"), "A"), history: [] };
    const recordScore = { ...app.game.present.score };

    const next = finishGame(app);
    expect(next.history).toHaveLength(1);
    expect(next.history[0].score).toEqual(recordScore);
    expect(next.game.present.score).toEqual({ A: 0, B: 0 });
    expect(next.game.present.servingTeam).toBeNull();
    expect(next.game.past).toEqual([]);
  });

  it("prepends newer records first", () => {
    let app = createApp();
    app = finishGame({ game: tap(tap(app.game, "A"), "A"), history: [] });
    app = finishGame({ game: tap(tap(app.game, "B"), "B"), history: app.history });
    expect(app.history).toHaveLength(2);
    expect(app.history[0].score).toEqual({ A: 0, B: 1 });
    expect(app.history[1].score).toEqual({ A: 1, B: 0 });
  });

  it("is a no-op at 0:0", () => {
    const app = createApp();
    expect(finishGame(app)).toBe(app);
  });
});

describe("history deletion (1.5)", () => {
  function appWithHistory(): AppState {
    let app = createApp();
    app = finishGame({ game: tap(tap(app.game, "A"), "A"), history: [] });
    app = finishGame({
      game: tap(tap(app.game, "B"), "B"),
      history: app.history,
    });
    return app;
  }

  it("deleteRecord removes only the given record and leaves game untouched", () => {
    const app = appWithHistory();
    const target = app.history[0];
    const gameBefore = app.game;

    const next = deleteRecord(app, target.id);
    expect(next.history).toHaveLength(1);
    expect(next.history.find((r) => r.id === target.id)).toBeUndefined();
    expect(next.game).toBe(gameBefore);
    expect(next.game.past).toEqual([]);
  });

  it("clearHistory empties history and leaves game untouched", () => {
    const app = appWithHistory();
    const gameBefore = app.game;
    const next = clearHistory(app);
    expect(next.history).toEqual([]);
    expect(next.game).toBe(gameBefore);
  });
});

describe("undo boundary (5.3)", () => {
  it("does not cross an ended game", () => {
    let app = createApp();
    app = finishGame({ game: tap(tap(app.game, "A"), "A"), history: [] });
    const fresh = app.game.present;

    const afterUndo = { game: undo(app.game), history: app.history };
    expect(afterUndo.game.present).toEqual(fresh);
    expect(afterUndo.game.past).toEqual([]);
    expect(afterUndo.history).toHaveLength(1);
  });
});


