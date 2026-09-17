# scoring Specification

## Purpose
Lets the user award a rally to a team by tapping that team's court half, with unlimited scores and no automatic win condition, and lets the first tap at 0:0 select the serving team instead of awarding a point.

## Requirements

### Requirement: Award a point by tapping a team half
The system SHALL add exactly one point to a team when the user taps that team's court background.

#### Scenario: Tap adds one point
- **WHEN** the user taps a team's court background during rally play
- **THEN** that team's score increases by exactly one

#### Scenario: Tap on the other half does not score
- **WHEN** the user taps one team's court background
- **THEN** the other team's score is unchanged

### Requirement: First tap selects the serving team
The system SHALL treat the first tap of the match, while the score is 0:0 and no serving team has been selected, as selecting the serving team rather than awarding a point.

#### Scenario: First tap selects serve only
- **WHEN** the score is 0:0, no serving team has been selected, and the user taps a team's court background
- **THEN** that team becomes the serving team and neither score changes

#### Scenario: Later taps award points
- **WHEN** a serving team has already been selected and the user taps a team's court background
- **THEN** that team's score increases by exactly one

### Requirement: Unlimited score
The system SHALL not impose a maximum score or automatically declare a winner; the user decides when a side has won.

#### Scenario: Score can exceed common game totals
- **WHEN** a team's score continues to increase past any typical game total
- **THEN** the system keeps accepting points and never blocks, resets, or ends the game automatically

#### Scenario: No automatic winner
- **WHEN** a team reaches any score
- **THEN** the system does not announce or enforce a winner by itself
