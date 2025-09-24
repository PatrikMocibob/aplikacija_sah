import chess
import chess.pgn
import json
import os
from collections import defaultdict
from tqdm import tqdm

def count_games(pgn_path):
    count = 0
    with open(pgn_path, 'r', encoding='utf-8') as pgn_file:
        while chess.pgn.read_game(pgn_file):
            count += 1
    return count

def pgn_to_move_index(pgn_path, output_folder):
    
    os.makedirs(output_folder, exist_ok=True)

    
    base_name = os.path.splitext(os.path.basename(pgn_path))[0]
    output_path = os.path.join(output_folder, f"{base_name}.json")

    move_index = defaultdict(lambda: defaultdict(int))
    total_games = count_games(pgn_path)

    with open(pgn_path, 'r', encoding='utf-8') as pgn_file:
        with tqdm(total=total_games, desc=f"Processing {base_name}", unit="game") as pbar:
            while True:
                game = chess.pgn.read_game(pgn_file)
                if game is None:
                    break

                board = game.board()
                for move in game.mainline_moves():
                    fen = board.fen()
                    uci_move = move.uci()
                    move_index[fen][uci_move] += 1
                    board.push(move)

                pbar.update(1)

    
    move_index_dict = {fen: dict(moves) for fen, moves in move_index.items()}

    with open(output_path, 'w', encoding='utf-8') as json_file:
        json.dump(move_index_dict, json_file, indent=2)

    print(f"\n✅ Move index saved to {output_path}")


output_folder = "skripta3"
pgn_to_move_index('weak_bot.pgn', output_folder)
pgn_to_move_index('medium_bot.pgn', output_folder)
pgn_to_move_index('strong2.pgn', output_folder)
