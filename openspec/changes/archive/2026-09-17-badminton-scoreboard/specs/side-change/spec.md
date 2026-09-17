## Purpose

Lets a user swap the two teams' court sides and displayed scores, matching a real change of ends, while keeping the correct serving player identity.

## ADDED Requirements

### Requirement: Side change swaps teams and scores
The system SHALL exchange the two teams' court sides and their displayed scores when the user activates the side-change control.

#### Scenario: Teams switch sides
- **WHEN** the user activates the side-change control
- **THEN** each team is displayed on the side previously occupied by the other team

#### Scenario: Displayed scores follow their teams
- **WHEN** the user activates the side-change control
- **THEN** each displayed score remains associated with its own team after the sides exchange

### Requirement: Serving identity preserved across side change
The system SHALL preserve which player serves next when the user activates the side-change control, by rotating each team's court positions so that the serving player's identity is unchanged.

#### Scenario: Same player serves after side change
- **WHEN** the user activates the side-change control
- **THEN** the serving player before the change is still the serving player after the change

#### Scenario: Serving team retained
- **WHEN** the user activates the side-change control
- **THEN** the serving team is unchanged
