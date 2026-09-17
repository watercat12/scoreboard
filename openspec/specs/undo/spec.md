# undo Specification

## Purpose
Lets a user reverse any previous action without limit, so a mis-tap during fast scoring never traps the match in a wrong state.

## Requirements

### Requirement: Undo the previous action
The system SHALL provide an undo control that restores the state that existed before the most recent state-changing action.

#### Scenario: Undo reverses a point
- **WHEN** the user activates undo after a point was awarded
- **THEN** the score returns to its value before that point and the derived serving player reflects the restored state

#### Scenario: Undo reverses serve selection
- **WHEN** the user activates undo after the first tap selected a serving team
- **THEN** the state returns to 0:0 with no serving team selected

#### Scenario: Undo reverses side change
- **WHEN** the user activates undo after a side change
- **THEN** the teams return to their previous sides with their previous scores and serving identity

#### Scenario: Undo reverses player swap
- **WHEN** the user activates undo after a per-team player swap
- **THEN** the two players return to their previous court positions

#### Scenario: Undo reverses a name edit
- **WHEN** the user activates undo after editing a player's name
- **THEN** the player's name returns to its previous value

### Requirement: Unlimited undo depth
The system SHALL allow undo repeatedly for every action taken in the match, with no fixed limit on the number of undo steps.

#### Scenario: Repeated undo reaches the initial state
- **WHEN** the user activates undo repeatedly
- **THEN** the system continues to reverse actions until the initial pre-match state is reached

#### Scenario: Undo at initial state is safe
- **WHEN** the user activates undo while already at the initial pre-match state
- **THEN** the state is unchanged and no error occurs
