const express = require("express");
const cors = require("cors");
const { Chess } = require("chess.js");
const { getBotMove } = require("./bots");

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.post("/bot-move", async (req, res) => {
  const { fen, difficulty } = req.body;

  if (!fen || !difficulty) {
    return res.status(400).json({ error: "Missing FEN or difficulty" });
  }

  const chess = new Chess(fen);

  try {
    const botMove = await getBotMove(fen, difficulty);

    if (!botMove || !chess.move(botMove, { sloppy: true })) {
      console.log("Illegal move attempted or no move found:", botMove);
      return res.status(400).json({ error: "No legal move found from DB" });
    }

    return res.json({
      move: botMove,
      fen: chess.fen(),
    });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Chess bot server running on http://localhost:${PORT}`);
});
