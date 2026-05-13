[README.md](https://github.com/user-attachments/files/27734814/README.md)
# ♟️ Chess Bots Arena

A full-stack web application where players can challenge chess bots of varying skill levels, with user accounts, game statistics tracking, and an AI bot that learns through self-play evolution.

---

## Overview

Chess Bots Arena lets users play chess against four different bots — three trained on real game data at different skill levels, and one AI bot that improves itself through an evolutionary algorithm. Registered users can track their win/loss/draw record against each bot on their profile page.

---

## Features

- **4 playable bots:**
  - **Bot 1500 (Easy)** — trained on weaker game data
  - **Bot 1800 (Medium)** — trained on intermediate game data
  - **Bot 2000 (Hard)** — trained on stronger game data
  - **Bot AI (Learning)** — minimax-based bot with piece weights evolved via self-play
- **User authentication** — register and log in with hashed passwords (bcrypt + JWT)
- **Per-user game statistics** — wins, losses, draws, and win rate per bot, stored and displayed on a profile page
- **Interactive chessboard** — drag-and-drop or click-to-move, legal move highlighting, pawn promotion popup
- **Move history panel** — live-updating list of moves in algebraic notation

---

## Tech Stack

| Layer          | Technology                                                      |
| -------------- | --------------------------------------------------------------- |
| Frontend       | HTML, CSS, Bootstrap 5, chess.js, chessboard.js                 |
| Backend (auth) | Node.js, Express 5, MySQL (`mysql2`), bcryptjs, JSON Web Tokens |
| Backend (bots) | Node.js, Express, chess.js, SQLite3                             |
| Bot training   | Python (chess, sqlite3, tqdm)                                   |
| AI bot         | Node.js — minimax with evolutionary weight optimization         |

---

## Project Structure

```
/
├── index.html              # Landing page (logged-out)
├── loggedin.html           # Home page (logged-in)
├── profile.html            # Player stats profile
├── test.html               # Play vs Bot 1500 (guest)
├── test2.html              # Play vs Bot 1800 (guest)
├── test3.html              # Play vs Bot 2000 (guest)
├── testai.html             # Play vs AI Bot (guest)
├── testlogged.html         # Play vs Bot 1500 (logged-in, stats tracked)
├── testlogged2.html        # Play vs Bot 1800 (logged-in, stats tracked)
├── testlogged3.html        # Play vs Bot 2000 (logged-in, stats tracked)
├── testloggedai.html       # Play vs AI Bot (logged-in, stats tracked)
│
├── backend/
│   ├── server.js           # REST API: /register and /login endpoints
│   └── package.json
│
├── botovi/
│   ├── app.js              # Bot move server (port 4000) — serves easy/medium/hard bots
│   ├── bots.js             # SQLite lookup logic with weighted random move selection
│   ├── ai.js               # AI bot server (port 3001) — minimax engine
│   ├── self_playing_chessbot.js  # Evolutionary training script
│   └── weights.json        # Evolved piece weights for the AI bot
│
└── skripta1/               # Data pipeline scripts
    ├── splitter.py         # Splits a PGN file into weak/medium/strong portions
    └── skripta2/
        ├── splitter2.py    # Converts PGN files into FEN→move frequency JSON
        └── skripta3/
            └── splitter3.py  # Converts JSON move data into SQLite databases
```

---

## How the Bots Work

### Skill-based bots (1500 / 1800 / 2000)

A large PGN dataset of real chess games was split by rating range into three subsets (20% / 30% / 50%). Each subset was processed into a SQLite database mapping board positions (FEN strings) to move frequency tables. When a bot needs to move, it looks up the current position in its database and picks a move weighted by how often strong players played it. If the position isn't in the database, it falls back to a random legal move.

### AI Bot (Learning)

Uses a minimax algorithm (depth 2, with one-ply lookahead) and evaluates positions by summing piece values. Piece weights are evolved through self-play: a mutated set of weights plays against the current best, and the winner's weights are saved. The current evolved weights are stored in `weights.json`.

---

## Data Pipeline

```
games.pgn
  └─ splitter.py → weak_bot.pgn / medium_bot.pgn / strong2.pgn
       └─ splitter2.py → weak_bot.json / medium_bot.json / strong2.json
            └─ splitter3.py → weak.db / medium.db / strong2.db
```

---

## Running Locally

### Prerequisites

- Node.js 18+
- MySQL database
- Python 3 with `chess`, `tqdm` packages (for data pipeline only)

### 1. Backend (auth server)

```bash
cd backend
npm install
# Set up your MySQL DB and update credentials in server.js
node server.js        # Runs on port 3000
```

### 2. Bot server

```bash
npm install
node botovi/app.js    # Runs on port 4000
```

### 3. AI bot server

```bash
node botovi/ai.js     # Runs on port 3001

Run with 'node self_playing_chessbot.js evolve' to start training.  # Runs AI bot training
```

### 4. Frontend

Open `index.html` in a browser (or serve with any static file server).

---

## Notes

- Game stats for logged-in users are currently stored in `localStorage`. A future improvement would be to persist these server-side in the MySQL database.
- The `JWT_SECRET` in `server.js` should be moved to an environment variable before any production use.
- The `.db` files (SQLite databases) are excluded from version control via `.gitignore` due to their size; they must be generated from the PGN source data using the pipeline scripts.
