# 2D Cricket Batting Game

A single-player 2D cricket batting game built with **React**, **CSS Modules**, and **HTML Canvas**.

## Features

- 🏏 Canvas-rendered 2D cricket field with sky, crowd, grass, pitch, stumps, batsman, and ball
- ⚡ Two batting styles: **Aggressive** (high risk/reward) and **Defensive** (low risk/reward)
- 📊 Probability-based **Power Bar** with animated slider — outcome is determined by slider position at click
- 🎯 Segment sizes are proportional to each outcome's probability
- 📋 Dynamic scoreboard showing runs, wickets, overs, and balls remaining
- 🎬 Bowling animation (ball travels toward batsman) before each shot
- 🎬 Batting animation (bat swing) triggered on shot
- 💥 Result overlay with outcome feedback after each ball
- 🔄 Full restart functionality

## Game Rules

| Setting | Value |
|---------|-------|
| Total Overs | 2 (12 balls) |
| Total Wickets | 2 |
| Balls per Over | 6 |

## Probability Distributions

### Aggressive Style
| Outcome | Probability | Bar Share |
|---------|-------------|-----------|
| Wicket  | 0.35        | 35%       |
| 0 Runs  | 0.10        | 10%       |
| 1 Run   | 0.10        | 10%       |
| 2 Runs  | 0.10        | 10%       |
| 3 Runs  | 0.05        | 5%        |
| 4 Runs  | 0.15        | 15%       |
| 6 Runs  | 0.15        | 15%       |
| **Total** | **1.00**  | **100%**  |

### Defensive Style
| Outcome | Probability | Bar Share |
|---------|-------------|-----------|
| Wicket  | 0.15        | 15%       |
| 0 Runs  | 0.30        | 30%       |
| 1 Run   | 0.25        | 25%       |
| 2 Runs  | 0.15        | 15%       |
| 3 Runs  | 0.05        | 5%        |
| 4 Runs  | 0.07        | 7%        |
| 6 Runs  | 0.03        | 3%        |
| **Total** | **1.00**  | **100%**  |

## How the Power Bar Works

1. Each outcome occupies a segment of the bar proportional to its probability
2. A slider continuously moves left-to-right (and bounces back)
3. When the player clicks, the slider stops and the current position (0–1) is checked
4. Whichever segment the slider is in determines the outcome
5. **No random selection** — outcome is strictly positional

## Getting Started

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── App.jsx                  # Root component, game phase orchestration
├── App.module.css
├── index.js
├── index.css                # Global CSS variables & reset
├── gameLogic.js             # Constants, probability tables, resolveOutcome()
├── hooks/
│   └── useGameState.js      # All game state managed via custom hook
└── components/
    ├── CricketField.jsx      # Canvas-based 2D field + animations
    ├── CricketField.module.css
    ├── Scoreboard.jsx        # Live scoreboard
    ├── Scoreboard.module.css
    ├── PowerBar.jsx          # Animated probability bar + slider
    ├── PowerBar.module.css
    ├── BattingStyleSelector.jsx
    ├── BattingStyleSelector.module.css
    ├── ResultDisplay.jsx     # Per-ball outcome overlay
    ├── ResultDisplay.module.css
    ├── GameOver.jsx          # End-of-game stats screen
    └── GameOver.module.css
```

## Technologies

- React 18 (hooks: useState, useEffect, useRef, useCallback)
- CSS Modules
- HTML Canvas (2D rendering context)
- requestAnimationFrame for all animations
