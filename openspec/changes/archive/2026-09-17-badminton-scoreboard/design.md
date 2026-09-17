## Context

See `proposal.md` - Why. The project is greenfield: an empty repository with an OpenSpec root and no source. The app must run as a static single-page application on Cloudflare Pages, so all logic lives client-side with no backend. The specs in `specs/` define the required behavior; this document records the technical decisions that make that behavior implementable and testable.

## Goals / Non-Goals

**Goals:**
- Keep match state small, serializable, and fully derivable so undo is a trivial snapshot restore.
- Make serve derivation a pure function of state, so it can never drift out of sync with the court.
- Separate abstract court position from on-screen vertical position so a side change cannot corrupt serving identity.
- Keep the score engine independent of rendering, so it can be unit-tested without a DOM.

**Non-Goals:**
- No win condition, deuce, multi-game, or match structure (scores are unlimited by spec).
- No backend, accounts, persistence across devices, or real-time share (static hosting only).
- No singles mode; the court and rotation rules target doubles.
- No framework choice beyond Vite + vanilla TypeScript; no React/Vue.

## Decisions

### Decision: Single immutable state tree plus a snapshot stack for undo
Keep one plain-object state value. Every command returns a new state and pushes the previous state onto a history array. Undo pops the most recent snapshot.

- Rationale: the specs require undo across *every* action (points, serve selection, side change, swap, rename). A snapshot stack satisfies all of them with one mechanism and no per-action inverse logic.
- Alternative considered: command/inverse pairs (event sourcing). Rejected as more code and more places to get the inverse wrong for a small app.
- Consequence: name editing pushes one snapshot at the *start* of an edit session, so a single undo reverses the whole rename rather than one keystroke.

### Decision: Represent court position abstractly as `left` / `right`, not screen-top / screen-bottom
Persist each player's service court as a team-relative value (`left` or `right`). Map it to a vertical slot at render time based on which side of the net the team occupies.

```
render mapping
  team on LEFT side of screen  -> abstract left  = top slot,    right = bottom slot
  team on RIGHT side of screen -> abstract left  = bottom slot, right = top slot
```

- Rationale: a real change of ends is a 180-degree rotation. Modeling position team-relative makes side change preserve both the abstract positions and therefore the derived server, exactly as `side-change` requires. If position were stored as screen position, a side change would silently swap who serves.
- Alternative considered: store screen position and rotate positions on every side change. Rejected: rotation logic would be duplicated and easy to get wrong.

### Decision: Derive the serving player; never store it
The serving *team* is stored (`null | 'A' | 'B'`). The serving court is computed from the serving team's score parity (even -> right, odd -> left); the serving player is whoever occupies that court.

```
serverCourt(team) = score[team] % 2 === 0 ? 'right' : 'left'
server(team)      = the player of team whose court === serverCourt(team)
```

- Rationale: storing the serving player as well would create two sources of truth that the swap and side-change controls could desynchronize. Deriving keeps serve correct under every mutation, including undo.
- Alternative considered: store serving player id. Rejected for the above reason.

### Decision: `servingTeam === null` is the match phase marker
At 0:0 with `servingTeam === null`, a tap on a team half sets `servingTeam` and adds no point. Once a serving team exists, taps add points and apply rotation.

- Rationale: the spec requires a distinct first tap that selects serve without scoring. Using the existing `null` sentinel avoids a separate phase enum and is naturally undone by the snapshot stack.
- Note: because undo can return the state to 0:0 with `null`, the serve-selection tap is itself undoable with no special case.

### Decision: Score rotation on serve retention, none on gaining serve
On a tap for team X:
```
snapshot()
score[X] += 1
if X === servingTeam:
    swap court positions of X's two players   // server retains serve, changes service court
else:
    servingTeam = X                            // receiving team gains serve, no positions change
```

- Rationale: matches doubles rules and the `serve-tracking` scenarios; combined with derivation it guarantees the same player serves again after a retained rally.
- Alternative considered: rotate on every point. Rejected: incorrect for doubles receiving-team wins.

### Decision: Event delegation with explicit hit regions
Render the court as DOM with a scoring region (the team's court background) and separate player-slot elements. A single delegated listener dispatches based on the clicked element's role attribute, and slot clicks stop propagation so they never reach the scoring region.

- Rationale: guarantees "tap a name edits it, tap the court scores", and keeps large one-handed tap targets. Avoids per-element listener bookkeeping.
- Alternative considered: canvas/SVG rendering. Rejected: harder for accessible hit regions and text editing.

### Decision: Vite + vanilla TypeScript, no UI framework
- Rationale: the whole app is one screen with a handful of controls; a framework adds bundle size and indirection without benefit. Vite gives fast dev server, TS, and a static `dist/` for Cloudflare Pages.
- Alternative considered: React/Vite. Rejected as unnecessary for this surface.

### Decision: Separate pure engine module from rendering
Put state shape, commands (`tapTeam`, `selectServe`, `swapPlayers`, `changeSides`, `renamePlayer`, `undo`) and derivations (`serverCourt`, `servePlayer`, `visibleSlot`) in a framework-free module. Rendering subscribes to state changes.

- Rationale: the doubles logic is the risky part and is fully unit-testable without a DOM.

## Risks / Trade-offs

- [Tap misclassification] A tap near a player slot may score instead of opening the editor, or vice versa -> Keep slot hitboxes clearly inset with generous court background around and below them; stop propagation on slots; test both in a phone viewport.
- [Ambiguous "left/right" naming] Team-relative `left`/`right` may be confused with screen left/right in code -> Name the state fields `serviceCourt: 'left' | 'right'` and the display concept `slotTop/slotBottom`; centralize the mapping in one function.
- [Undo of name edits] Snapshotting only at edit start can surprise a user wanting per-keystroke undo -> Simple, predictable behavior (one undo = one rename); documented and easily changed if feedback says otherwise.
- [State loss on reload] No persistence specified, so a reload mid-match loses the game -> Acceptable for this change; state persistence is deferred (see Open Questions).
- [Screen wake during a match] A phone may sleep while scoring -> Not required by specs; noted as a possible enhancement, not scoped.

## Open Questions

- Should match state persist to `localStorage` so an accidental reload does not lose an in-progress match? Deferrable: does not change specs, approach, or tasks.
- Should the app keep the screen awake during a match (Screen Wake Lock API)? Deferrable enhancement.
