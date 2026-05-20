#!/usr/bin/env python3
import os
import sys
import shutil

# Colors
YELLOW = "\033[93m"
WHITE = "\033[1m\033[37m"
DARK_GRAY = "\033[90m"
RESET = "\033[0m"
GREEN = "\033[92m"

def clear_screen():
    os.system('clear' if os.name != 'nt' else 'cls')

def prompt_confirm():
    clear_screen()
    border = "=" * 58
    print(f"{YELLOW}{border}{RESET}")
    print(f"{YELLOW}          AETHELGRAD DUAL-DEPLOYER (UNIX)                {RESET}")
    print(f"{YELLOW}{border}{RESET}")
    print("  This script will:")
    print("  1. Sync Behavior Pack files directly into local BDS development folders.")
    print("  2. Sync Resource Pack files directly into local BDS development folders.")
    print(f"{DARK_GRAY}----------------------------------------------------------{RESET}")
    print(f"  Press {YELLOW}[ENTER]{RESET} to execute deployment | \033[91m[Ctrl+C]\033[0m to cancel")
    print(f"{YELLOW}{border}{RESET}")
    try:
        input()
    except (KeyboardInterrupt, EOFError):
        print("\n\033[91mOperation cancelled.\033[0m")
        sys.exit(0)

def main():
    prompt_confirm()

    bp_name = "Aethelgrad Essentials"
    rp_name = "AethelLib (RP)"

    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(script_dir))
    source_path = project_root
    bds_path = os.path.join(project_root, "BDS")

    bp_dest = os.path.join(bds_path, "development_behavior_packs", bp_name)
    rp_dest = os.path.join(bds_path, "development_resource_packs", rp_name)

    print("[Aethelgrad] Syncing BP to BDS...")
    if os.path.exists(bp_dest):
        shutil.rmtree(bp_dest)
    os.makedirs(bp_dest, exist_ok=True)

    bp_files = ["manifest.json", "pack_icon.png", "scripts", "entities"]
    for item in bp_files:
        src = os.path.join(source_path, item)
        if os.path.exists(src):
            dst = os.path.join(bp_dest, item)
            if os.path.isdir(src):
                shutil.copytree(src, dst)
            else:
                shutil.copy2(src, dst)

    print("[Aethelgrad] Syncing RP to BDS...")
    if os.path.exists(rp_dest):
        shutil.rmtree(rp_dest)
    os.makedirs(rp_dest, exist_ok=True)

    rp_source = os.path.join(source_path, rp_name)
    if os.path.exists(rp_source):
        for item in os.listdir(rp_source):
            src = os.path.join(rp_source, item)
            dst = os.path.join(rp_dest, item)
            if os.path.isdir(src):
                shutil.copytree(src, dst)
            else:
                shutil.copy2(src, dst)

    print(f"{GREEN}[Aethelgrad] Dual-Sync Complete! Packs deployed.{RESET}")

if __name__ == "__main__":
    main()
