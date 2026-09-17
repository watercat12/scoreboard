## Purpose

Lets the user declare the current game finished and begin a fresh game, so scores can be reset without reloading the page and without re-entering players.

## ADDED Requirements

### Requirement: End the current game

The system SHALL provide an end-game control that finishes the current game and immediately starts a new one.

#### Scenario: Ending a game records it and resets the score

- **WHEN** the user ends a game that has a non-zero score
- **THEN** the finished game is recorded in history and a new game starts at 0:0 with no serving team selected

#### Scenario: New game preserves players

- **WHEN** a new game starts after ending a game
- **THEN** the two team names, the four player names, each player's court position, and the current side orientation are unchanged

#### Scenario: Ending is a boundary

- **WHEN** the user ends a game and immediately tries to undo
- **THEN** the system does not restore the ended game

### Requirement: Confirm before ending

The system SHALL ask the user to confirm before ending a game, so an accidental tap does not push the game into history.

#### Scenario: Confirmation required

- **WHEN** the user activates the end-game control
- **THEN** the system asks for confirmation before recording the game and resetting

#### Scenario: Cancelling leaves the game intact

- **WHEN** the user dismisses or declines the confirmation
- **THEN** the current game, score, and serving state are unchanged

### Requirement: No empty games

The system SHALL prevent ending a game while there is nothing to record.

#### Scenario: Control disabled at 0:0

- **WHEN** the score is 0:0 and no points have been played
- **THEN** the end-game control is not available for activation
