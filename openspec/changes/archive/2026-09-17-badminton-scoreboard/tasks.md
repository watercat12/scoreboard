## 1. Project setup

- [x] 1.1 Scaffold a Vite vanilla TypeScript app at the repo root (`npm create vite@latest . -- --template vanilla-ts`) and verify `npm install` succeeds and `npm run dev` serves the default page
- [x] 1.2 Add a test runner (Vitest) and verify an example test passes with `npm test`
- [x] 1.3 Configure a base `index.html` with a mobile viewport meta tag and verify no horizontal scroll occurs at a phone viewport width in devtools
- [x] 1.4 Define the shared domain types (`TeamId`, `ServiceCourt`, `Player`, `TeamState`, `MatchState`) and verify the project type-checks with `npx tsc --noEmit`

## 2. Pure match engine (no DOM)

- [x] 2.1 Create the engine module with an initial-match factory (`0:0`, a chosen serving team `null`, players auto-placed) and verify a unit test asserts the initial state, including `servingTeam === null`
- [x] 2.2 Implement `selectServe` and `tapTeam` so the first tap at `0:0` with no server selects serve without scoring, and later taps add one point; verify unit tests from the `scoring` spec pass
- [x] 2.3 Implement `serverCourt` and `servePlayer` derivations (even -> right, odd -> left) and verify unit tests from the `serve-tracking` spec pass
- [x] 2.4 Implement rotation on serve retention and no rotation on gaining serve inside `tapTeam`, and verify the spec scenarios "server wins and keeps serve", "server wins and rotates players", "next server is the same player after rotation", and "no rotation on gaining serve" pass as unit tests
- [x] 2.5 Implement `swapPlayers` for one team and verify the `team-setup` swap scenarios pass and the other team is unchanged
- [x] 2.6 Implement `changeSides` as swapping team sides plus displayed scores while rotating team-relative positions so the derived server is unchanged, and verify the `side-change` scenarios pass as unit tests
- [x] 2.7 Implement `renamePlayer` and verify a unit test asserts the stored name and derived state update
- [x] 2.8 Implement the snapshot stack (`push` before every mutation, `undo` pops) with unlimited depth and a safe no-op at the initial state; verify tests covering undo of a point, serve selection, side change, swap, and rename all pass

## 3. Court rendering and interaction

- [x] 3.1 Render the court: two team sides split by a vertical center net, with two stacked player slots per side and each team's score; verify visually in a phone viewport from `court-layout`
- [x] 3.2 Implement the abstract-court-to-slot mapping (team on left: left=top/right=bottom; team on right: left=bottom/right=top) and verify a unit test asserts the mapping for both sides
- [x] 3.3 Wire delegated tap handling so tapping a team's court background triggers a scoring action and tapping a player slot opens name editing without scoring; verify both interactions manually in a phone viewport
- [x] 3.4 Highlight the serving team with a distinct color and show no highlight while `servingTeam` is `null`; verify both states in the running app
- [x] 3.5 Render the per-team swap control and the center-net side-change control, wire them to `swapPlayers` and `changeSides`, and verify each changes the expected on-screen state

## 4. Editing and controls integration

- [x] 4.1 Build inline name editing that pushes exactly one snapshot when an edit session starts, so one undo reverses the whole rename; verify by renaming a player then undoing once
- [x] 4.2 Add an undo control wired to the snapshot stack and verify undoing point, serve selection, swap, side change, and rename each restore the previous state, including repeated undo back to `0:0` with no server
- [x] 4.3 Verify the full `undo` spec scenarios pass end-to-end in the app, including that undo at the initial state is a safe no-op

## 5. Verification and deploy

- [x] 5.1 Run the full test suite (`npm test`) and type-check (`npx tsc --noEmit`) and confirm both pass cleanly
- [x] 5.2 Walk the `serve-tracking` rotation example end-to-end in the app (A serves, A wins twice, then B wins twice) and confirm the highlighted player matches the derived server each time
- [x] 5.3 Build the static output (`npm run build`) and verify the `dist/` bundle has no backend dependency and loads without runtime errors
- [x] 5.4 Document the Cloudflare Pages deploy settings (build command `npm run build`, output directory `dist`) in the project README and verify a local `npm run preview` matches the built output
