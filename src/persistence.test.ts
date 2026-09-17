import { beforeEach, describe, expect, it } from "vitest";
import { createApp, deleteRecord, finishGame, tapTeam } from "./engine";
import {
  STORAGE_KEY,
  STORAGE_VERSION,
  freshApp,
  load,
  save,
  type StorageLike,
} from "./persistence";
import type { AppState } from "./types";

function memoryStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => (data.has(key) ? (data.get(key) as string) : null),
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

function appWithHistory(): AppState {
  let app = createApp();
  app = finishGame({ game: tapTeam(tapTeam(app.game, "A"), "A"), history: [] });
  return app;
}

describe("persistence (2.1)", () => {
  it("round-trips a state with records through one key", () => {
    const storage = memoryStorage();
    const app = appWithHistory();

    save(app, storage);
    const raw = storage.data.get(STORAGE_KEY);
    expect(raw).toBeDefined();

    const restored = load(storage);
    expect(restored.game).toEqual(app.game);
    expect(restored.history).toEqual(app.history);
  });
});

describe("persistence fallbacks (2.2)", () => {
  it("returns a fresh app when nothing is stored", () => {
    const storage = memoryStorage();
    const app = load(storage);
    expect(app.history).toEqual([]);
    expect(app.game.present.score).toEqual({ A: 0, B: 0 });
    expect(app.game.present.servingTeam).toBeNull();
    expect(app.game.past).toEqual([]);
  });

  it("returns a fresh app on malformed JSON", () => {
    const storage = memoryStorage();
    storage.data.set(STORAGE_KEY, "{not json");
    expect(load(storage).history).toEqual([]);
    expect(load(storage).game.present.score).toEqual({ A: 0, B: 0 });
  });

  it("returns a fresh app on a mismatched version", () => {
    const storage = memoryStorage();
    const app = appWithHistory();
    storage.data.set(
      STORAGE_KEY,
      JSON.stringify({ version: STORAGE_VERSION + 1, ...app }),
    );
    const restored = load(storage);
    expect(restored.history).toEqual([]);
    expect(restored.game.present.servingTeam).toBeNull();
  });

  it("returns a fresh app on a structurally invalid game", () => {
    const storage = memoryStorage();
    storage.data.set(
      STORAGE_KEY,
      JSON.stringify({ version: STORAGE_VERSION, game: { present: {} }, history: [] }),
    );
    expect(load(storage).game.present.score).toEqual({ A: 0, B: 0 });
  });

  it("freshApp starts empty", () => {
    expect(freshApp().history).toEqual([]);
    expect(freshApp().game.past).toEqual([]);
  });
});

describe("persistence reload continuation (5.2)", () => {
  it("keeps scoring after a reload and keeps deletions deleted", () => {
    const storage = memoryStorage();
    let app = createApp();
    app = finishGame({ game: tapTeam(tapTeam(app.game, "A"), "A"), history: [] });
    app = finishGame({ game: tapTeam(tapTeam(app.game, "B"), "B"), history: app.history });
    save(app, storage);

    const restored = load(storage);
    expect(restored.history).toHaveLength(2);

    const scored = tapTeam(tapTeam(restored.game, "A"), "A");
    const withScore: AppState = { game: scored, history: restored.history };
    save(withScore, storage);

    const deleted = deleteRecord(app, app.history[0].id);
    save({ ...deleted, game: withScore.game }, storage);

    const finalState = load(storage);
    expect(finalState.game.present.score).toEqual({ A: 1, B: 0 });
    expect(finalState.game.present.servingTeam).toBe("A");
    expect(finalState.history).toHaveLength(1);
    expect(finalState.history[0].score).toEqual({ A: 1, B: 0 });
  });
});

describe("persistence save safety (2.3)", () => {
  let storage: StorageLike;
  let app: AppState;

  beforeEach(() => {
    storage = {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    };
    app = createApp();
  });

  it("does not throw when setItem throws", () => {
    expect(() => save(app, storage)).not.toThrow();
  });

  it("does not throw when storage is unavailable", () => {
    expect(() => save(app, null)).not.toThrow();
    expect(() => load(null)).not.toThrow();
  });
});
