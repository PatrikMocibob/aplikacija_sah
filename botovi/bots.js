const { Chess } = require("chess.js");
const sqlite3 = require("sqlite3").verbose();

function getDatabase(difficulty) {
  let dbPath;
  switch (difficulty) {
    case "medium":
      dbPath = "./medium.db";
      break;
    case "hard":
      dbPath = "./strong2.db";
      break;
    case "easy":
    default:
      dbPath = "./weak.db";
      break;
  }

  console.log(`📂 Using database: ${dbPath}`);
  return new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);
}

function getBotMove(fen, difficulty = "easy") {
  return new Promise((resolve) => {
    const chess = new Chess(fen);
    const normalizedFen = chess.fen();
    const legalMoves = chess.moves({ verbose: true });

    if (legalMoves.length === 0) return resolve(null);

    const db = getDatabase(difficulty);

    db.get(
      "SELECT move_freq FROM moves WHERE fen = ?",
      [normalizedFen],
      (err, row) => {
        db.close();
        if (err) {
          console.error("❌ DB error:", err.message);
          return resolve(null);
        }

        if (row) {
          const movesFreq = JSON.parse(row.move_freq);
          const legalDBMoves = Object.entries(movesFreq).filter(([uciMove]) =>
            legalMoves.some((m) => m.from + m.to === uciMove)
          );

          if (legalDBMoves.length > 0) {
            let totalWeight = legalDBMoves.reduce((sum, [, w]) => sum + w, 0);
            let rand = Math.random() * totalWeight;

            for (const [uciMove, weight] of legalDBMoves) {
              if (rand < weight) {
                const moveObj = legalMoves.find(
                  (m) => m.from + m.to === uciMove
                );
                console.log(
                  `✅ Picked from DB (${difficulty}): ${uciMove} (SAN: ${moveObj.san})`
                );
                return resolve(moveObj.san);
              }
              rand -= weight;
            }
          }
        }

        const fallbackMove =
          legalMoves[Math.floor(Math.random() * legalMoves.length)];
        console.log(
          `🔁 Fallback random move (no data in ${difficulty} DB): ${fallbackMove.san}`
        );
        resolve(fallbackMove.san);
      }
    );
  });
}

module.exports = { getBotMove };
