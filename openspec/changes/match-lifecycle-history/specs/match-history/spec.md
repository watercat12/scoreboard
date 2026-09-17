## Purpose

Keeps a record of every finished game so users can review earlier results, and lets them remove records they no longer want.

## ADDED Requirements

### Requirement: Finished-game record

The system SHALL create a record for each finished game containing an identifier, the finish time, the final score, the two team names and four player names as they were at finish time, and the winning team derived from the final score.

#### Scenario: Record captures the final result

- **WHEN** a game is ended
- **THEN** a record is created with the final score, the finish time, and the team and player names at finish time

#### Scenario: Record captures a snapshot of names

- **WHEN** a game is ended and the players are later renamed for the next game
- **THEN** the earlier record still shows the names as they were when that game finished

#### Scenario: Winner reflects the final score

- **WHEN** a record is created
- **THEN** it reports the team with the higher final score as the winner and does not enforce or alter the score

#### Scenario: Tied score reports no winner

- **WHEN** a game ends with equal scores
- **THEN** the record reports no winner

### Requirement: History list

The system SHALL provide a history panel that lists finished games newest first, showing at least the final score, the winner, the teams and players, and the finish time.

#### Scenario: Newest first

- **WHEN** the history panel is opened after several games have finished
- **THEN** the most recently finished game appears before older games

#### Scenario: History survives a new game

- **WHEN** a new game is started after ending a previous game
- **THEN** the previous game remains visible in the history panel

### Requirement: Delete history records

The system SHALL let the user delete an individual record or all records.

#### Scenario: Delete one record

- **WHEN** the user deletes a single record
- **THEN** only that record is removed and the others remain

#### Scenario: Clear all records

- **WHEN** the user clears all records
- **THEN** the history panel becomes empty and no records remain

### Requirement: Empty history

The system SHALL handle an empty history without error.

#### Scenario: No finished games

- **WHEN** the history panel is opened before any game has finished
- **THEN** the panel indicates there are no finished games
