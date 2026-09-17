## 1. Domain types and engine commands

- [x] 1.1 Add `GameRecord` and `AppState` types (record with id, finishedAt, score, teams/players snapshot, `winner: TeamId | null`) to `src/types.ts` and verify the project type-checks with `npx tsc --noEmit`
- [x] 1.2 Implement `freshMatch(source: MatchState): MatchState` that resets `score` to 0:0 and `servingTeam` to `null` while keeping team/player names, `serviceCourt`, and `sides`; verify a unit test asserts every preserved and reset field
- [x] 1.3 Implement `toRecord(match: MatchState): GameRecord` deriving `winner` from the final score (`null` when tied) and copying names at finish time; verify tests cover a decided game and a tie
- [x] 1.4 Implement `finishGame(app: AppState): AppState` returning a new game with an empty `past` and the record prepended to `history`, and a no-op guard at 0:0; verify tests cover record creation, newest-first order, and the 0:0 no-op
- [x] 1.5 Implement `deleteRecord(app, id)` and `clearHistory(app)` mutating `history` only; verify tests assert `game` and its undo stack are untouched

## 2. Persistence

- [x] 2.1 Create a persistence module that saves `{ version: 1, game, history }` under one `localStorage` key and loads it back; verify a unit test round-trips a state with records
- [x] 2.2 Make `load` validate the version and shape and fall back to a fresh game with empty history on missing, malformed, or wrong-version data; verify tests cover absent, corrupt JSON, and mismatched version
- [x] 2.3 Wrap `save` in a try/catch so storage failures (quota/disabled) do not throw; verify a test or manual check confirms the app keeps working when `setItem` throws

## 3. UI: end-game control and confirmation

- [ ] 3.1 Render an end-game control in the toolbar, disabled while the score is 0:0; verify it is visible, styled, and disabled at 0:0 and enabled after a point in a phone viewport
- [ ] 3.2 Wire the end-game control to a `window.confirm` prompt and call `finishGame` on accept, leaving state unchanged on cancel; verify confirming resets the score to 0:0 (players/positions/sides kept) and cancelling does nothing

## 4. UI: history panel

- [ ] 4.1 Render a history panel listing records newest-first with final score, winner, team/player names, and finish time, plus an empty-state message; verify visually with zero, one, and several records
- [ ] 4.2 Wire open/close of the panel and ensure panel interactions never reach the court scoring regions; verify opening the panel then tapping inside awards no point
- [ ] 4.3 Add per-record delete and clear-all controls (clear-all behind a confirm) wired to `deleteRecord`/`clearHistory`; verify deleting one removes only that record and clearing empties the list

## 5. Persistence integration and verification

- [ ] 5.1 Load persisted state on startup and call `save` on every commit so game and history survive reload; verify by scoring, ending a game, reloading, and confirming score, players, and history are restored
- [x] 5.2 Verify that after a reload the restored game can keep scoring and that record deletions stay deleted
- [x] 5.3 Verify undo does not cross an ended game: end a game, activate undo, and confirm the ended game is not restored and the new game is unchanged
- [x] 5.4 Run `npm test` and `npx tsc --noEmit` and confirm both pass, then run `npm run build` and confirm the static bundle still loads with no runtime errors
