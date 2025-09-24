const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");

const app = express();
const port = 3000;

const jwt = require("jsonwebtoken");
const JWT_SECRET = "your_secret_key_here";

app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: "ucka.veleri.hr",
  user: "pmocibob",
  password: "11",
  database: "pmocibob",
});

db.connect((err) => {
  if (err) {
    console.error("DB connection error:", err);
    return;
  }
  console.log("Connected to MySQL DB");
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ error: "Please provide name, email, and password" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
    db.query(query, [name, email, hashedPassword], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database insert failed" });
      }
      res.json({ message: "Registration successful!" });
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ error: "Please provide both email and password." });
  }

  const query = "SELECT * FROM users WHERE email = ?";
  db.query(query, [email], async (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ error: "Internal server error." });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const user = results[0];

    try {
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(401).json({ error: "Invalid email or password." });
      }

      res.status(200).json({
        message: "Login successful.",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (bcryptError) {
      console.error("Password comparison error:", bcryptError);
      return res.status(500).json({ error: "Internal server error." });
    }
  });
});
