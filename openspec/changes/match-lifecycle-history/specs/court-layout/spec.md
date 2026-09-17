## ADDED Requirements

### Requirement: Game controls in the layout

The system SHALL include an end-game control and a history entry point in the mobile layout, in addition to the existing controls, without breaking the single-screen fit.

#### Scenario: Controls visible on a phone

- **WHEN** the app is viewed on a phone-sized viewport
- **THEN** the end-game control and the history entry point are visible and reachable without horizontal scrolling

#### Scenario: End-game control disabled state

- **WHEN** the score is 0:0 and no points have been played
- **THEN** the end-game control is shown as unavailable

### Requirement: History panel presentation

The system SHALL present the finished-game history as an overlay panel that can be opened and closed and that does not itself accept scoring taps.

#### Scenario: Open and close the panel

- **WHEN** the user opens the history panel and then closes it
- **THEN** the panel is dismissed and the current game is unchanged

#### Scenario: Panel taps do not score

- **WHEN** the user interacts with the history panel
- **THEN** no point is awarded to either team
