import json
import sqlite3
from tqdm import tqdm


json_path = "weak_bot.json"
sqlite_path = "weak.db"


with open(json_path, "r", encoding="utf-8") as f:
    data = json.load(f)


conn = sqlite3.connect(sqlite_path)
cursor = conn.cursor()


cursor.execute("""
CREATE TABLE IF NOT EXISTS moves (
    fen TEXT PRIMARY KEY,
    move_freq TEXT -- Store move-frequency map as JSON string
);
""")


print("Converting to SQLite...")
for fen, move_freq in tqdm(data.items()):
    move_freq_json = json.dumps(move_freq)
    cursor.execute(
        "INSERT OR REPLACE INTO moves (fen, move_freq) VALUES (?, ?)",
        (fen, move_freq_json)
    )


conn.commit()
conn.close()

print(f"✅ Done! SQLite DB saved as {sqlite_path}")
