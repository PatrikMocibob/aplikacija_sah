const express = require("express");
const cors = require("cors");
const { Chess } = require("chess.js");
const fs = require("fs");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const BASE_WEIGHTS = {
  P: 1.0,
  N: 3.0,
  B: 3.0,
  R: 5.0,
  Q: 9.0,
  K: 0.0,
};

function loadWeights(file = "weights.json") {
  try {
    return JSON.parse(fs.readFileSync(file));
  } catch {
    return { ...BASE_WEIGHTS };
  }
}

const weights = loadWeights();

function evaluateBoard(game, weights) {
  let score = 0;
  for (let row of game.board()) {
    for (let piece of row) {
      if (!piece) continue;
      const val = weights[piece.type.toUpperCase()];
      score += piece.color === "w" ? val : -val;
    }
  }
  return score + (Math.random() * 0.2 - 0.1);
}

function getBestMove(game, weights) {
  let bestMove = null;
  let bestScore = game.turn() === "w" ? -Infinity : Infinity;

  for (let move of game.moves()) {
    game.move(move);

    let opponentMoves = game.moves();
    let worstReplyScore;

    if (opponentMoves.length === 0) {
      worstReplyScore = evaluateBoard(game, weights);
    } else {
      for (let reply of opponentMoves) {
        game.move(reply);
        let score = evaluateBoard(game, weights);
        game.undo();

        if (
          worstReplyScore === undefined ||
          (game.turn() === "w" && score < worstReplyScore) ||
          (game.turn() === "b" && score > worstReplyScore)
        ) {
          worstReplyScore = score;
        }
      }
    }

    game.undo();

    if (game.turn() === "w" && worstReplyScore > bestScore) {
      bestScore = worstReplyScore;
      bestMove = move;
    } else if (game.turn() === "b" && worstReplyScore < bestScore) {
      bestScore = worstReplyScore;
      bestMove = move;
    }
  }

  return bestMove;
}

app.post("/move", (req, res) => {
  const { fen } = req.body;

  if (!fen) {
    return res.status(400).json({ error: "FEN string is required." });
  }

  const game = new Chess(fen);

  if (game.isGameOver()) {
    return res.status(200).json({ move: null, message: "Game over." });
  }

  const move = getBestMove(game, weights);

  if (!move) {
    return res.status(500).json({ error: "No valid move found." });
  }

  return res.json({ move });
});

app.listen(PORT, () => {
  console.log(`♟️  Chess bot server running at http://localhost:${PORT}`);
});
