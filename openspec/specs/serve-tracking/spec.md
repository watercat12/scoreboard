# serve-tracking Specification

## Purpose
Tracks which doubles team serves and derives which player serves next from that player's court position and the serving team's score parity, applying the doubles rotation rules as rallies are won.

## Requirements

### Requirement: Track the serving team
The system SHALL maintain the serving team, initialized when the user makes the first tap at 0:0 and updated as rallies are won.

#### Scenario: Serving team set at first selection
- **WHEN** the user taps a team's court background at 0:0 with no serving team selected
- **THEN** that team becomes the serving team

#### Scenario: Serving team is always defined after selection
- **WHEN** rally play is in progress
- **THEN** the system reports exactly one serving team

### Requirement: Derive serving player from court and parity
The system SHALL derive the serving player as the player of the serving team who occupies the right service court when the serving team's score is even and the left service court when the serving team's score is odd.

#### Scenario: Even score serves from the right court
- **WHEN** the serving team's score is even
- **THEN** the serving player is the one occupying the right service court of that team

#### Scenario: Odd score serves from the left court
- **WHEN** the serving team's score is odd
- **THEN** the serving player is the one occupying the left service court of that team

#### Scenario: Serving player follows position not identity
- **WHEN** the players of the serving team change court positions
- **THEN** the serving player is whichever player now occupies the court required by the score parity

### Requirement: Serving team retains serve and rotates
When the serving team wins a rally, the system SHALL keep that team as the serving team and swap the two players of that team between the left and right service courts.

#### Scenario: Server wins and keeps serve
- **WHEN** the serving team wins a rally
- **THEN** its score increases by one and it remains the serving team

#### Scenario: Server wins and rotates players
- **WHEN** the serving team wins a rally
- **THEN** the two players of the serving team exchange court positions

#### Scenario: Next server is the same player after rotation
- **WHEN** the serving team wins a rally and its two players exchange court positions
- **THEN** the player who served the previous rally is the derived serving player for the next rally

### Requirement: Receiving team wins gains serve without rotation
When the receiving team wins a rally, the system SHALL make that team the serving team and SHALL NOT change either team's player court positions.

#### Scenario: Receiver wins gains serve
- **WHEN** the receiving team wins a rally
- **THEN** its score increases by one and it becomes the serving team

#### Scenario: No rotation on gaining serve
- **WHEN** the receiving team wins a rally
- **THEN** neither team's players change court positions

#### Scenario: New serving player follows new parity
- **WHEN** the receiving team wins a rally and becomes the serving team
- **THEN** its serving player is the player occupying the court required by its new score parity
