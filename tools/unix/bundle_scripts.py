#!/usr/bin/env python3
import os
import sys
import datetime

# Colors
GREEN = "\033[92m"
YELLOW = "\033[93m"
WHITE = "\033[1m\033[37m"
DARK_GRAY = "\033[90m"
RESET = "\033[0m"
BLUE = "\033[94m"
CYAN = "\033[96m"

def clear_screen():
    os.system('clear' if os.name != 'nt' else 'cls')

def prompt_confirm():
    clear_screen()
    border = "=" * 58
    print(f"{GREEN}{border}{RESET}")
    print(f"{GREEN}          AETHELGRAD SCRIPT BUNDLER (UNIX)               {RESET}")
    print(f"{GREEN}{border}{RESET}")
    print("  This script will:")
    print("  1. Scan the tools/unix folder for all Python scripts (*.py).")
    print("  2. Read their contents, including this bundler script.")
    print("  3. Generate a single clean TXT file containing all code.")
    print(f"{DARK_GRAY}----------------------------------------------------------{RESET}")
    print(f"  Press {GREEN}[ENTER]{RESET} to execute bundle creation | \033[91m[Ctrl+C]\033[0m to cancel")
    print(f"{GREEN}{border}{RESET}")
    try:
        input()
    except (KeyboardInterrupt, EOFError):
        print("\n\033[91mOperation cancelled.\033[0m")
        sys.exit(0)

def main():
    prompt_confirm()

    script_dir = os.path.dirname(os.path.abspath(__file__))
    tools_dir = os.path.dirname(script_dir)
    output_dir = os.path.join(tools_dir, "Output")
    os.makedirs(output_dir, exist_ok=True)
    output_file = os.path.join(output_dir, "unix_scripts_bundle.txt")

    print(f"[Bundler] Scanning unix directory: {script_dir}")
    
    # List files and sort them
    files = sorted([f for f in os.listdir(script_dir) if f.endswith('.py') and os.path.isfile(os.path.join(script_dir, f))])
    
    print(f"[Bundler] Found {len(files)} script(s) to process.")
    
    with open(output_file, 'w', encoding='utf-8') as outfile:
        # Write general header
        outfile.write("=" * 80 + "\n")
        outfile.write("AETHELGRAD ESSENTIALS - UNIX TOOLS SCRIPTS BUNDLE\n")
        outfile.write(f"Generated on: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        outfile.write(f"Total Scripts: {len(files)}\n")
        outfile.write("=" * 80 + "\n\n")
        
        for file in files:
            file_path = os.path.join(script_dir, file)
            relative_path = f"tools/unix/{file}"
            print(f"[Bundler] Processing {relative_path}...")
            
            outfile.write("=" * 80 + "\n")
            outfile.write(f"SCRIPT: {file}\n")
            outfile.write(f"PATH: {relative_path}\n")
            outfile.write("=" * 80 + "\n\n")
            
            with open(file_path, 'r', encoding='utf-8') as infile:
                outfile.write(infile.read())
                
            outfile.write("\n\n\n")
            
    border = "=" * 58
    print(f"{GREEN}{border}{RESET}")
    print(f"  {WHITE}SUCCESS: Bundle created at:{RESET}")
    print(f"  {YELLOW}{output_file}{RESET}")
    print(f"{GREEN}{border}{RESET}")

if __name__ == "__main__":
    main()
