## MODIFIED Requirements

### Requirement: Unlimited undo depth

The system SHALL allow undo repeatedly for every action taken within the current game, with no fixed limit on the number of undo steps, and SHALL treat ending a game as a boundary that cannot be crossed.

#### Scenario: Repeated undo reaches the initial state

- **WHEN** the user activates undo repeatedly within a game
- **THEN** the system continues to reverse actions until the initial pre-match state of that game is reached

#### Scenario: Undo at initial state is safe

- **WHEN** the user activates undo while already at the initial pre-match state
- **THEN** the state is unchanged and no error occurs

#### Scenario: Undo does not cross an ended game

- **WHEN** the user activates undo after ending a game
- **THEN** the previous, ended game is not restored and the new game's state is unchanged

#### Scenario: Undo history is empty in a new game

- **WHEN** a new game begins after ending a game
- **THEN** there is no undo history available until the new game's first action
