#!/usr/bin/env python3
import os
import sys
import time
import shutil
import subprocess
import threading

# ANSI Colors
CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
DARK_GRAY = "\033[90m"
WHITE = "\033[1m\033[37m"
RESET = "\033[0m"

def info(m):
    print(f"{CYAN}[AE {time.strftime('%H:%M:%S')}]{RESET} {m}")

def ok(m):
    print(f"{GREEN}[AE {time.strftime('%H:%M:%S')}]{RESET} {m}")

def warn(m):
    print(f"{YELLOW}[AE {time.strftime('%H:%M:%S')}]{RESET} {m}")

def err(m):
    print(f"{RED}[AE {time.strftime('%H:%M:%S')}]{RESET} {m}")

def clear_screen():
    os.system('clear' if os.name != 'nt' else 'cls')

def get_project_paths():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    # Go up from tools/unix to workspace root
    project_root = os.path.dirname(os.path.dirname(script_dir))
    return script_dir, project_root

def resolve_bds_directory(path):
    if not path:
        return None
    path = os.path.expanduser(os.path.expandvars(path))
    if os.path.exists(path):
        if os.path.isdir(path):
            return os.path.abspath(path)
        else:
            return os.path.abspath(os.path.dirname(path))
    return None

def test_valid_bds_directory(path):
    resolved = resolve_bds_directory(path)
    if resolved:
        exe_name = "bedrock_server.exe" if os.name == 'nt' else "bedrock_server"
        exe_path = os.path.join(resolved, exe_name)
        if os.path.exists(exe_path):
            return resolved
    return None

def kill_bds_processes():
    exe_name = "bedrock_server.exe" if os.name == 'nt' else "bedrock_server"
    warn("Checking for running bedrock_server instances...")
    if os.name == 'nt':
        try:
            # Check and kill on Windows
            subprocess.run(["taskkill", "/F", "/IM", exe_name, "/T"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception:
            pass
    else:
        try:
            # Kill on UNIX
            subprocess.run(["pkill", "-f", exe_name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception:
            pass
    time.sleep(1)

def resolve_bds_path(project_root):
    config_path = os.path.join(project_root, ".bds_path")
    
    # 1. Check environment variables
    bds_path = os.environ.get("BDS_PATH") or os.environ.get("BDS_ROOT")
    resolved = test_valid_bds_directory(bds_path)
    if resolved:
        return resolved
    
    # 2. Check local config file
    if os.path.exists(config_path):
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                cached = f.read().strip().replace('"', '').replace("'", "")
                resolved = test_valid_bds_directory(cached)
                if resolved:
                    return resolved
        except Exception:
            pass

    # 3. Check default BDS folder in project root
    default_bds = os.path.join(project_root, "BDS")
    resolved = test_valid_bds_directory(default_bds)
    if resolved:
        return resolved

    # 4. Prompt user if still not found
    while True:
        warn("BDS directory (containing bedrock_server) not automatically detected or invalid.")
        print(f"{WHITE}Please enter the absolute path to your Bedrock Dedicated Server directory (or drag-and-drop bedrock_server):{RESET}")
        try:
            input_path = input().strip().replace('"', '').replace("'", "")
        except (KeyboardInterrupt, EOFError):
            print("\nOperation cancelled.")
            sys.exit(0)
            
        resolved = test_valid_bds_directory(input_path)
        if resolved:
            try:
                with open(config_path, "w", encoding="utf-8") as f:
                    f.write(resolved)
                ok(f"BDS path cached to .bds_path")
                return resolved
            except Exception as e:
                warn(f"Could not save BDS path cache: {e}")
                return resolved
        else:
            err(f"Path is invalid, does not exist, or does not contain bedrock_server: {input_path}")

def sync_packs(project_root, bds_root):
    try:
        bp_dest = os.path.join(bds_root, "development_behavior_packs", "Aethelgrad Essentials")
        rp_dest = os.path.join(bds_root, "development_resource_packs", "AethelLib (RP)")

        # Sync Behavior Pack
        if os.path.exists(bp_dest):
            shutil.rmtree(bp_dest, ignore_errors=True)
        os.makedirs(bp_dest, exist_ok=True)
        
        bp_files = ["manifest.json", "pack_icon.png", "scripts", "entities"]
        for item in bp_files:
            src = os.path.join(project_root, item)
            dst = os.path.join(bp_dest, item)
            if os.path.exists(src):
                if os.path.isdir(src):
                    shutil.copytree(src, dst)
                else:
                    shutil.copy2(src, dst)
                    
        # Sync Resource Pack
        rp_name = "AethelLib (RP)"
        rp_source = os.path.join(project_root, rp_name)
        if os.path.exists(rp_source):
            if os.path.exists(rp_dest):
                shutil.rmtree(rp_dest, ignore_errors=True)
            os.makedirs(rp_dest, exist_ok=True)
            for item in os.listdir(rp_source):
                src = os.path.join(rp_source, item)
                dst = os.path.join(rp_dest, item)
                if os.path.isdir(src):
                    shutil.copytree(src, dst)
                else:
                    shutil.copy2(src, dst)
                    
        ok("Packs (BP + RP) synced to BDS")
    except Exception as e:
        err(f"Sync failed: {e}")

def get_watched_files(project_root):
    watched = {}
    
    # 1. Behavior Pack files
    bp_files = ["manifest.json", "pack_icon.png", "scripts", "entities"]
    for item in bp_files:
        src = os.path.join(project_root, item)
        if not os.path.exists(src):
            continue
        if os.path.isdir(src):
            for root, dirs, files in os.walk(src):
                if any(x in root.split(os.sep) for x in ["build", "backups", "releases", "BDS", "node_modules", ".git"]):
                    continue
                for file in files:
                    if file.endswith(('.tmp', '.swp', '.bak')):
                        continue
                    full_path = os.path.join(root, file)
                    try:
                        watched[full_path] = os.path.getmtime(full_path)
                    except OSError:
                        pass
        else:
            try:
                watched[src] = os.path.getmtime(src)
            except OSError:
                pass
                
    # 2. Resource Pack files
    rp_source = os.path.join(project_root, "AethelLib (RP)")
    if os.path.exists(rp_source):
        for root, dirs, files in os.walk(rp_source):
            if any(x in root.split(os.sep) for x in ["build", "backups", "releases", "BDS", "node_modules", ".git"]):
                continue
            for file in files:
                if file.endswith(('.tmp', '.swp', '.bak')):
                    continue
                full_path = os.path.join(root, file)
                try:
                    watched[full_path] = os.path.getmtime(full_path)
                except OSError:
                    pass
                    
    return watched

def read_stream(stream, prefix, is_error=False):
    for line in iter(stream.readline, ''):
        line = line.strip()
        if not line:
            continue
        # Filter relevant lines
        if any(x in line.lower() for x in ["script", "error", "warn", "[ae]", "pack stack", "server started", "exception", "scripting"]):
            color = RED if any(x in line.lower() for x in ["error", "exception"]) else (
                YELLOW if "warn" in line.lower() else (
                    GREEN if any(x in line.lower() for x in ["server started", "pack stack"]) else RESET
                )
            )
            print(f"  {prefix} {color}{line}{RESET}")

def main():
    script_dir, project_root = get_project_paths()
    
    # 1. Resolve BDS Directory (Prompt if not found/invalid)
    bds_root = resolve_bds_path(project_root)
    
    # 2. Kill existing running instances of bedrock_server
    kill_bds_processes()
    
    # 3. Interactive confirmation
    clear_screen()
    print(f"{GREEN}=========================================================={RESET}")
    print(f"{WHITE}             AETHELGRAD HOT-RELOAD WATCHER (UNIX)         {RESET}")
    print(f"{GREEN}=========================================================={RESET}")
    print(f"  BDS Path:  {bds_root}")
    print(f"  Project:   {project_root}")
    print(f"{DARK_GRAY}----------------------------------------------------------{RESET}")
    print("  This script will:")
    print("  1. Monitor behavior & resource pack files recursively.")
    print("  2. Automatically sync file changes to BDS upon save.")
    print("  3. Force-restart the bedrock server console dynamically.")
    print(f"{DARK_GRAY}----------------------------------------------------------{RESET}")
    print(f"  Press {GREEN}[ENTER]{RESET} to start hot-watcher | {RED}[Ctrl+C]{RESET} to cancel")
    print(f"{GREEN}=========================================================={RESET}")
    
    # Check if run with autostart argument or env var
    autostart = "--autostart" in sys.argv or os.environ.get("AUTOSTART") == "true"
    if not autostart:
        try:
            input()
        except (KeyboardInterrupt, EOFError):
            print(f"\n{RED}Operation cancelled.{RESET}")
            sys.exit(0)

    # Executable naming differs by OS
    bds_exe = os.path.join(bds_root, "bedrock_server.exe" if os.name == 'nt' else "bedrock_server")

    if not os.path.exists(bds_exe):
        err(f"BDS executable not found: {bds_exe}")
        sys.exit(1)

    print("")
    print(f"  {GREEN}+------------------------------------------+{RESET}")
    print(f"  {GREEN}|  Aethelgrad Essentials - Dev Watcher     |{RESET}")
    print(f"  {GREEN}|                                          |{RESET}")
    print(f"  {GREEN}|  Save any file -> BDS auto restarts      |{RESET}")
    print(f"  {GREEN}|  Script errors appear here instantly     |{RESET}")
    print(f"  {GREEN}|                                          |{RESET}")
    print(f"  {GREEN}|  Connect: 127.0.0.1:19132               |{RESET}")
    print(f"  {GREEN}|  Ctrl+C to stop everything               |{RESET}")
    print(f"  {GREEN}|  Platform: UNIX/Python                   |{RESET}")
    print(f"  {GREEN}+------------------------------------------+{RESET}")
    print("")

    # Initial sync
    sync_packs(project_root, bds_root)

    # Initialize watch states
    watched_files = get_watched_files(project_root)
    
    process = None
    last_restart = 0
    pending_restart = False
    last_change = 0
    DEBOUNCE_MS = 0.8
    RESTART_COOLDOWN = 5

    def start_bds():
        nonlocal process, last_restart
        if process and process.poll() is None:
            info("Stopping BDS...")
            try:
                process.terminate()
                process.wait(timeout=3)
            except Exception:
                try:
                    process.kill()
                except Exception:
                    pass
        
        info("Starting BDS...")
        # On Unix, the executable needs permissions and should be run in its working directory
        if os.name != 'nt':
            try:
                os.chmod(bds_exe, 0o755)
            except Exception:
                pass
        
        process = subprocess.Popen(
            [bds_exe],
            cwd=bds_root,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1
        )
        
        # Spawn threads to capture stdout and stderr non-blocking
        t_out = threading.Thread(target=read_stream, args=(process.stdout, "[BDS]"), daemon=True)
        t_err = threading.Thread(target=read_stream, args=(process.stderr, "[BDS ERR]", True), daemon=True)
        t_out.start()
        t_err.start()
        
        last_restart = time.time()
        ok(f"BDS started (PID {process.pid})")

    # Start first time
    start_bds()

    try:
        while True:
            time.sleep(0.2)
            
            # Check for file changes
            current_files = get_watched_files(project_root)
            changed = False
            
            # Check for modified or deleted files
            for path, mtime in watched_files.items():
                if path not in current_files:
                    # File was deleted
                    changed = True
                    rel_path = os.path.relpath(path, project_root)
                    print(f"  [DELETED] {rel_path}")
                elif current_files[path] != mtime:
                    # File was modified
                    changed = True
                    rel_path = os.path.relpath(path, project_root)
                    print(f"  [CHANGED] {rel_path}")
            
            # Check for new files
            for path in current_files:
                if path not in watched_files:
                    changed = True
                    rel_path = os.path.relpath(path, project_root)
                    print(f"  [CREATED] {rel_path}")

            if changed:
                watched_files = current_files
                pending_restart = True
                last_change = time.time()

            # Debounced restart logic
            if pending_restart:
                now = time.time()
                if (now - last_change) >= DEBOUNCE_MS:
                    if (now - last_restart) >= RESTART_COOLDOWN:
                        pending_restart = False
                        warn("Change detected - syncing and restarting BDS...")
                        sync_packs(project_root, bds_root)
                        start_bds()

            # Auto-recover if BDS crashes
            if process and process.poll() is not None and not pending_restart:
                code = process.returncode
                err(f"BDS exited (code {code}) - check errors above")
                warn("Restarting in 3s...")
                time.sleep(3)
                start_bds()

    except KeyboardInterrupt:
        warn("Shutting down...")
        if process and process.poll() is None:
            try:
                process.terminate()
                process.wait(timeout=2)
            except Exception:
                try:
                    process.kill()
                except Exception:
                    pass
        warn("Done.")

if __name__ == "__main__":
    main()
