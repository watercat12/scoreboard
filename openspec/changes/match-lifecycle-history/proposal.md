## Why

The scoreboard can track and undo a single rally sequence, but there is no way to declare a game over and start the next one: scores accumulate forever and the only way to start fresh is reloading the page, which also wipes the players. Players also lose all results when they move to the next game, so there is no record of who won earlier games. This change adds an explicit end-of-game control, keeps a history of finished games, and persists both the in-progress game and that history across reloads.

## What Changes

- Add an **End game** control that records the finished game and starts a fresh one at 0:0 with no serving team, keeping the current player names, court positions, and side orientation.
- Record each finished game with: an id, the finish time, the final score, the two team names and four player names at finish time, and the winning team derived from the final score (display only, no enforced win condition).
- Add a **history panel** listing finished games newest-first, showing the final score, winner, teams/players, and finish time; support deleting a single record and clearing all records.
- Persist both the in-progress game and the history to `localStorage` so a reload does not lose state or history.
- **BREAKING (spec-level)**: ending a game is a hard boundary - it clears the undo stack and cannot be undone. The existing `undo` capability gains this explicit exception.
- Disable the **End game** control while the score is 0:0 so no empty games are recorded.

## Capabilities

### New Capabilities
- `match-lifecycle`: ending the current game (confirmation, 0:0 guard) and starting a fresh game while preserving players, court positions, and sides.
- `match-history`: the finished-game record shape, the newest-first history list, and deletion of individual or all records.
- `persistence`: saving and restoring the in-progress game and history across reloads, including schema versioning.

### Modified Capabilities
- `undo`: ending a game clears the undo stack and is explicitly not undoable, an exception to the current unlimited-undo requirement.
- `court-layout`: the mobile layout gains an End game control and a history panel entry point while still fitting a phone viewport.

## Impact

- `src/types.ts`: new record type and a persisted-root shape.
- `src/engine.ts`: new commands to finish a game and start a fresh one; a history reducer; explicit handling of the undo-stack boundary.
- `src/main.ts`: End game control, confirmation dialog, history panel rendering, and delete interactions.
- New persistence module (or functions) for `localStorage` read/write with a schema version.
- `src/style.css`: styles for the new controls and history panel.
- `src/engine.test.ts`: new unit tests for lifecycle, history, and the undo boundary.
- No backend, network, or new runtime dependencies; storage stays client-side.
