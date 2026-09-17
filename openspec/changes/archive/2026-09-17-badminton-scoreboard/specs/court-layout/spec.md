## Purpose

Presents a badminton doubles court on a mobile screen so a user can read the match at a glance and tap a team's half to score, organized as two sides split by a center net with two stacked player slots per side.

## ADDED Requirements

### Requirement: Court sides and net
The system SHALL present the court as two team sides separated by a vertical center net, with one team on the left side and the other on the right side.

#### Scenario: Initial court orientation
- **WHEN** the match screen is shown
- **THEN** one team is displayed on the left of the net and the other team on the right

#### Scenario: Side labels follow side change
- **WHEN** the user performs a side change
- **THEN** the two teams exchange sides and each team's panel renders on the opposite side of the net

### Requirement: Player slots per team
The system SHALL display two player slots stacked within each team's half, one slot per doubles player.

#### Scenario: Two slots per team
- **WHEN** a team panel is displayed
- **THEN** it contains exactly two player slots, one for each player of that team

### Requirement: Tap regions within a team half
The system SHALL treat a team's court background as a scoring tap region and each player slot as a separate name-editing hit region, so that tapping a name does not award a point.

#### Scenario: Tap court background scores
- **WHEN** the user taps the court background of a team's half outside any player slot
- **THEN** the action is interpreted as a scoring action for that team

#### Scenario: Tap player slot edits name
- **WHEN** the user taps a player slot
- **THEN** the system opens name editing for that player and does not award a point

### Requirement: Score display
The system SHALL display the current score of each team clearly on that team's side of the court.

#### Scenario: Score reflects current value
- **WHEN** a team's score changes
- **THEN** the displayed score for that team updates to the new value

### Requirement: Next server highlight
The system SHALL indicate which team serves next using a clear visual color distinction on that team's side.

#### Scenario: Serving team highlighted
- **WHEN** a team is the serving team
- **THEN** that team's side is visually highlighted with a serve color and the other team's side is not

#### Scenario: No serve selected yet
- **WHEN** the match is at 0:0 and no serving team has been selected
- **THEN** neither team is shown as the serving team

### Requirement: Mobile-first layout
The system SHALL lay out the court to fit a mobile viewport without horizontal scrolling and keep tap targets large enough for one-handed use.

#### Scenario: Single-screen fit
- **WHEN** the app is viewed on a phone-sized viewport
- **THEN** both team sides, both scores, and all controls are visible without horizontal scrolling
