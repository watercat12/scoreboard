# team-setup Specification

## Purpose
Lets a user enter the players of both doubles teams and control each player's court position, so the court layout can be set up before a match and corrected during it.

## Requirements

### Requirement: Enter player names
The system SHALL allow the user to enter a name for each of the two players on each team.

#### Scenario: Enter names for both teams
- **WHEN** the user provides two names for a team
- **THEN** the system stores those names and displays each in a player slot on that team's side

#### Scenario: Edit a player name
- **WHEN** the user edits a player's name
- **THEN** the system stores the new name and the slot displays the updated name

### Requirement: Automatic initial slot placement
The system SHALL automatically place each player of a team into one of the two court slots when names are entered, without requiring the user to position them.

#### Scenario: Names placed automatically
- **WHEN** the user enters names for a team
- **THEN** the system assigns each player to a distinct court slot automatically

### Requirement: Per-team player swap
The system SHALL provide a per-team swap control that exchanges the court positions of that team's two players.

#### Scenario: Swap exchanges players' positions
- **WHEN** the user activates the swap control for a team
- **THEN** the two players of that team exchange court positions and the slot contents update accordingly

#### Scenario: Swap is per-team
- **WHEN** the user activates the swap control for one team
- **THEN** the other team's player positions are unchanged
