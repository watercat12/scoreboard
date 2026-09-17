## Context

See `proposal.md` - Why. The app is a static Vite + vanilla TypeScript SPA with a pure engine module (`src/engine.ts`) that owns an immutable `GameState` (`{ present: MatchState, past: MatchState[] }`) and a DOM layer (`src/main.ts`) that re-renders from that state. All state currently lives in a module variable; there is no persistence and no notion of a finished game. The previously archived `badminton-scoreboard` change deliberately excluded match structure, so this change adds lifecycle without touching the doubles scoring/serve rules. Specs in `specs/` define the required behavior; this document records the technical decisions.

## Goals / Non-Goals

**Goals:**
- Add finish-game and new-game behavior as pure engine commands, keeping the undo stack semantics explicit.
- Capture a self-contained, immutable snapshot per finished game so history is independent of later renames or edits.
- Persist game + history to `localStorage` behind a small, testable module with a schema version.
- Keep the DOM layer thin: controls dispatch commands, persistence is a side effect of committing state.

**Non-Goals:**
- No multi-game match structure, best-of-N, or aggregate match score.
- No editing a finished record beyond delete (no rename of history entries).
- No cross-device sync, backend, or accounts; storage is per-browser.
- No change to scoring, serve derivation, rotation, or side-change rules.
- No history pagination/search; a flat newest-first list is sufficient at this scale.

## Decisions

### Decision: History lives outside `GameState`
Keep `GameState` (present + undo `past`) exactly as it is, and introduce a separate top-level app state:

```
AppState = {
  game: GameState,        // current game + its undo stack
  history: GameRecord[],  // finished games, newest first
}
```

- Rationale: `GameState` is the undoable unit. History is append-only and must survive an undo of the new game's first action. Folding history into `GameState.past` would make undo resurrect deleted records and corrupt the boundary semantics.
- Alternative considered: store history inside the snapshot so undo could reverse a finish. Rejected; the spec makes ending a game a hard boundary, so history must be outside the undoable tree.

### Decision: `GameRecord` is a denormalized snapshot

```
GameRecord = {
  id: string,            // crypto.randomUUID() when available, else timestamp+random
  finishedAt: number,    // epoch ms
  score: { A: number, B: number },
  teams: {
    A: { name: string, players: [string, string] },
    B: { name: string, players: [string, string] },
  },
  winner: TeamId | null, // derived at finish; null when tied
}
```

- Rationale: the history requirement says a record keeps the names as they were at finish time. Copying strings, not player ids, guarantees the record is immutable and independent of later renames. The team label ("Đội A"/"Đội B") is derived in the UI, as today.
- Alternative considered: store `MatchState` and render from it. Rejected: it drags `serviceCourt`, `sides`, and ids into history that the spec does not require and that would tempt later editing.

### Decision: Finish is a command that produces `{ game, record }`
Model the transition as a pure function rather than mutating two modules:

```
finishGame(app: AppState): AppState
  if score.A === 0 && score.B === 0        -> return app (guarded; UI also disables)
  record = toRecord(app.game.present)
  next   = freshMatch(app.game.present)     // keep teams/names/courts/sides
  return { game: { present: next, past: [] }, history: [record, ...app.history] }
```

`freshMatch` is a new engine factory that resets only `score` to 0:0 and `servingTeam` to `null`, cloning players' names and `serviceCourt` and the existing `sides`.

- Rationale: the entire lifecycle is one pure transition, so it is unit-testable without a DOM and the undo boundary (`past: []`) is explicit in one place.
- Alternative considered: reuse `createMatch` and then re-apply names/courts/sides. Rejected: more mutation and easy to forget a field; a dedicated `freshMatch(source)` documents the preserved set precisely.

### Decision: Ending clears the undo stack; history deletes are separate actions
After `finishGame`, `past` is empty, so undo cannot cross the boundary. Deleting a record mutates `history` only and does not touch `game` or `past`.

- Rationale: matches the spec's hard boundary and keeps "undo" about the current game's actions, while history maintenance is its own concern.

### Decision: `localStorage` via a versioned envelope, restored defensively

```
key:   "badminton-scoreboard:v1"
value: { version: 1, game: GameState, history: GameRecord[] }

load(): AppState
  try parse; if version !== 1 or shape invalid -> return fresh empty AppState
save(app): void
  try setItem(JSON.stringify(...)); ignore quota/serialization errors
```

- Rationale: one key with a version field makes future migrations a single branch; validating shape on load satisfies the persistence spec's "corrupt data falls back to a fresh game" requirement. Because `GameState` and `GameRecord` are already plain JSON-safe objects, serialization needs no custom encoders.
- Alternative considered: separate keys for game and history, or a library (idb, localforage). Rejected: overkill for a few kilobytes of plain data; one synchronous key is simplest.

### Decision: Persist on every commit
Route all state changes through the existing `commit`/`render` path and call `save(app)` there, so a reload always reflects the last action.

- Rationale: no debounce needed at human tap rates; guaranteed consistency is worth the trivial write cost. The spec requires deletions to persist, and this covers them uniformly.

### Decision: History as an overlay panel with its own click scope
Render the history in an overlay element outside the court. The existing root click delegation must ignore events inside the panel (or the panel handles/`stopPropagation`s its own events) so panel taps never reach scoring regions, per the `court-layout` delta.

- Rationale: reuses the existing delegation pattern while satisfying "panel taps do not score"; an overlay also keeps the phone single-screen fit.

### Decision: Confirmation via `window.confirm`
Use the native confirm dialog for "End game?", and a second confirm for "Clear all history".

- Rationale: zero UI code, blocks reliably on mobile, and satisfies the confirmation requirement. A custom modal is deferred as unnecessary polish.

## Risks / Trade-offs

- [Undo boundary surprises users] A user may end a game, notice a scoring mistake, and expect undo to recover it -> Mitigated by the confirmation dialog; once confirmed the record is in history and the game restarts. Documented as intended behavior.
- [`window.confirm` UX] Native dialogs feel abrupt and are not stylable -> Acceptable for this scope; a custom modal can replace it without spec changes.
- [localStorage unavailable or full] Private-mode or quota errors could break loading -> `load`/`save` are wrapped and failures degrade to in-memory operation, matching the "no error" persistence scenario.
- [Stale schema after future change] A record shape change would invalidate stored data -> The `version` field lets a future change migrate or discard; for v1, an unknown version resets cleanly.
- [Unbounded history growth] Hundreds of records slowly grow storage -> Each record is small; a cap can be added later without spec changes. Noted, not scoped.
- [Panel overlap with court] A large overlay could hide the score -> Panel is dismissible and does not mutate the game; verify the single-screen fit in a phone viewport.

## Migration Plan

- Additive change on top of the archived app; no data exists to migrate (v1 is the first persisted schema).
- Deploy is the existing static build; no server or config changes.
- Rollback: remove the persistence call and the panel; the app returns to in-memory behavior. Stored data is ignored if the key is unused.

## Open Questions

- Should the history cap the number of retained records (e.g., last 50)? Deferrable: does not change specs, approach, or tasks.
