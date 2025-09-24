import os


def split_pgn(input_pgn_path, output_pgn_paths, split_ratios):
   
    assert len(output_pgn_paths) == len(split_ratios), "Outputs and ratios length mismatch"
    assert abs(sum(split_ratios) - 1.0) < 1e-6, "Ratios must sum to 1"

    
    total_games = 0
    with open(input_pgn_path, 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip() == "":
                continue
            if line.startswith('[Event '):  
                total_games += 1

   
    counts = [int(total_games * ratio) for ratio in split_ratios]
    counts[-1] = total_games - sum(counts[:-1]) 

    print(f"Total games: {total_games}")
    print(f"Splitting into: {counts}")

   
    out_files = [open(path, 'w', encoding='utf-8') for path in output_pgn_paths]
    current_file_index = 0
    games_written_to_current_file = 0

    with open(input_pgn_path, 'r', encoding='utf-8') as f:
        game_lines = []
        for line in f:
            if line.strip() == "" and game_lines:
                
                out_files[current_file_index].writelines(game_lines)
                out_files[current_file_index].write('\n\n')

                games_written_to_current_file += 1
                game_lines = []

                if games_written_to_current_file >= counts[current_file_index]:
                    current_file_index += 1
                    games_written_to_current_file = 0
                    if current_file_index >= len(out_files):
                        break
            else:
                game_lines.append(line)

        
        if game_lines and current_file_index < len(out_files):
            out_files[current_file_index].writelines(game_lines)
            out_files[current_file_index].write('\n\n')

    for f in out_files:
        f.close()


if __name__ == "__main__":
    input_pgn = "games.pgn"
    output_folder = "skripta2"
    outputs = ["weak_bot.pgn", "medium_bot.pgn", "strong2.pgn"]
    ratios = [0.2, 0.3, 0.5]

    
    os.makedirs(output_folder, exist_ok=True)

    
    output_paths = [os.path.join(output_folder, filename) for filename in outputs]

    split_pgn(input_pgn, output_paths, ratios)
