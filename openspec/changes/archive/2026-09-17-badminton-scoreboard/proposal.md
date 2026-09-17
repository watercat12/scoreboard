## Why

Scoring a badminton doubles match on a phone is clumsy with generic score apps: the tap targets are small, the court/serve context is missing, and keeping track of who serves next is something players must do in their heads. This change delivers a mobile-first web app that mirrors a real court, lets a user add a point by tapping a team's half, and always shows which team serves and which player serves next according to court position and score parity.

## What Changes

- New court-style layout: the screen is split left/right by a vertical net line, each team occupying one side with two stacked player slots.
- Tap a team's court background to award that team one rally (a point). Scores are unlimited; there is no automatic win condition and the user decides when a side has won.
- Serve tracking: at 0:0 the first tap on a team's half _selects that team to serve_ (does not add a point); every later tap awards a point and updates the serve according to doubles rules.
- Serve derivation: the serving court is the right service court when the serving team's score is even and the left service court when odd; the serving player is whoever currently occupies that court.
- Automatic rotation: when the serving team wins a rally it keeps serve and its two players swap courts; when the receiving team wins it gains serve and neither team changes courts.
- Player setup: enter two names per team; the app places each into a slot automatically, and a per-team swap control exchanges the two players' court positions (used for initial correction).
- Side change: a control on the center net swaps the two teams' sides and their displayed scores while preserving the identity of the serving player.
- Other controls: rename any player, and undo the previous action without limit.
- Target is a static single-page app deployed to Cloudflare Pages.

## Capabilities

### New Capabilities
- `court-layout`: the doubles court presentation, its left/right sides, per-team stacked player slots, and the tap regions for scoring versus editing.
- `team-setup`: entering and editing player names, automatic initial slot placement, and the per-team player swap control.
- `scoring`: awarding points by tapping a team's court half, unlimited scores, and the 0:0 serve-selection first tap.
- `serve-tracking`: tracking the serving team and deriving which player serves next from court position and score parity, including automatic rotation on serve retention.
- `side-change`: swapping the two teams' court sides and scores while preserving serving identity.
- `undo`: unlimited undo across every state-changing action.

### Modified Capabilities
<!-- None: this is a greenfield project with no existing specs. -->

## Impact

- New greenfield codebase; no existing code, APIs, or specs are affected.
- Introduces a static Vite (vanilla TypeScript) front end; no backend or server-side state.
- Deployment target: Cloudflare Pages/static hosting.
- Match state persists no further than the browser session unless later specified; no external dependencies or integrations.
