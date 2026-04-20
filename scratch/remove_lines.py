import sys

def remove_lines(filename, start_line, end_line):
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Lines are 1-indexed, so start_line-1
    # We want to keep lines from 0 to start_line-2 and end_line to finish
    new_lines = lines[:start_line-1] + lines[end_line:]
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print(f"Removed lines {start_line} to {end_line}")

if __name__ == "__main__":
    remove_lines(sys.argv[1], int(sys.argv[2]), int(sys.argv[3]))
