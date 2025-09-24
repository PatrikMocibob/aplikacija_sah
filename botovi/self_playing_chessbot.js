const { Chess } = require("chess.js");
const fs = require("fs");

const BASE_WEIGHTS = {
  P: 1.0,
  N: 3.0,
  B: 3.0,
  R: 5.0,
  Q: 9.0,
  K: 0.0,
};

function evaluateBoard(game, weights) {
  let board = game.board();
  let score = 0;
  for (let row of board) {
    for (let piece of row) {
      if (!piece) continue;
      let val = weights[piece.type.toUpperCase()];
      score += piece.color === "w" ? val : -val;
    }
  }
  return score + (Math.random() * 0.2 - 0.1);
}

function getGameResult(game) {
  if (game.isCheckmate()) {
    return game.turn() === "w" ? "0-1" : "1-0";
  } else if (
    game.isDraw() ||
    game.isStalemate() ||
    game.isInsufficientMaterial() ||
    game.isThreefoldRepetition()
  ) {
    return "1/2-1/2";
  } else {
    return "*";
  }
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

function playGame(weightsWhite, weightsBlack) {
  const game = new Chess();

  while (!game.isGameOver()) {
    const currentWeights = game.turn() === "w" ? weightsWhite : weightsBlack;
    const move = getBestMove(game, currentWeights);
    if (!move) break;
    game.move(move);
  }

  return getGameResult(game);
}

function mutateWeights(weights) {
  const newWeights = JSON.parse(JSON.stringify(weights));
  for (let piece in newWeights) {
    if (piece === "K") continue;
    let change = Math.random() * 0.4 - 0.2;
    newWeights[piece] = Math.max(0.1, newWeights[piece] + change);
  }
  return newWeights;
}

function saveWeights(weights, file = "weights.json") {
  fs.writeFileSync(file, JSON.stringify(weights, null, 2));
}

function loadWeights(file = "weights.json") {
  try {
    return JSON.parse(fs.readFileSync(file));
  } catch {
    return { ...BASE_WEIGHTS };
  }
}

function printProgress(current, total, prefix = "") {
  const barLength = 30;
  const progress = current / total;
  const filledLength = Math.round(barLength * progress);
  const bar = "█".repeat(filledLength) + "-".repeat(barLength - filledLength);
  process.stdout.write(`\r${prefix} [${bar}] ${(progress * 100).toFixed(1)}%`);
  if (current === total) {
    process.stdout.write("\n");
  }
}

function evolveWeights(generations = 50, gamesPerGen = 10) {
  let weights = loadWeights();
  for (let gen = 0; gen < generations; gen++) {
    let challenger = mutateWeights(weights);
    let score = 0;

    for (let i = 0; i < gamesPerGen; i++) {
      let result = playGame(challenger, weights);
      if (result === "1-0") score++;
      else if (result === "0-1") score--;

      printProgress(i + 1, gamesPerGen, `Gen ${gen + 1}/${generations} Games`);
    }

    console.log(`Generation ${gen}: Score = ${score}`);

    if (score > 0) {
      console.log("  ✅ New weights accepted.");
      weights = challenger;
      saveWeights(weights);
    } else {
      console.log("  ❌ New weights rejected.");
    }
  }

  console.log("\nFinal Weights:", weights);
  saveWeights(weights);
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.includes("evolve")) {
    evolveWeights();
  } else {
    console.log(
      "Run with 'node self_playing_chessbot.js evolve' to start training."
    );
  }
}
