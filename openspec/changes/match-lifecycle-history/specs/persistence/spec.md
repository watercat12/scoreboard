## Purpose

Keeps the in-progress game and the finished-game history on the device so a reload or accidental closure does not lose the match or earlier results.

## ADDED Requirements

### Requirement: Persist the in-progress game

The system SHALL save the current game state to device storage as it changes and restore it on load.

#### Scenario: Reload restores the game

- **WHEN** the user reloads the app during a game
- **THEN** the score, serving team, sides, player names, and court positions are restored as they were

#### Scenario: Restored game can continue

- **WHEN** a game is restored after a reload
- **THEN** further scoring and gameplay continue from the restored state

### Requirement: Persist the history

The system SHALL save the finished-game history to device storage and restore it on load.

#### Scenario: Reload restores history

- **WHEN** the user reloads the app after finishing one or more games
- **THEN** those finished games are still listed in the history panel

#### Scenario: Deletions are persisted

- **WHEN** the user deletes a record or clears all records and then reloads
- **THEN** the deleted records do not reappear

### Requirement: Stored data versioning

The system SHALL version its stored data and tolerate stored data that is missing, unreadable, or from an incompatible version.

#### Scenario: First run with no stored data

- **WHEN** the app loads with no stored data
- **THEN** it starts a fresh game with an empty history and no error

#### Scenario: Corrupt stored data

- **WHEN** stored data cannot be read or does not match the expected shape
- **THEN** the system falls back to a fresh game and empty history without crashing
