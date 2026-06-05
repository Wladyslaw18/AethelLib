#!/usr/bin/env python3
import os
import re
import sys
import argparse
import json

# ANSI Colors
RED = "\033[91m"
YELLOW = "\033[93m"
GREEN = "\033[92m"
CYAN = "\033[96m"
WHITE = "\033[97m"
RESET = "\033[0m"

# Path config relative to tools/unix/
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SCRIPTS_DIR = os.path.join(PROJECT_ROOT, "scripts")

def get_source_of_truth_defaults():
    nodemodules_json_path = os.path.join(PROJECT_ROOT, "node_modules", "@minecraft", "server", "package.json")
    manifest_path = os.path.join(PROJECT_ROOT, "manifest.json")
    
    default_channel = "BETA"
    default_version = "2.8.0"
    source_of_truth = "Default Fallback"
    
    if os.path.exists(nodemodules_json_path):
        try:
            with open(nodemodules_json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            raw_ver = data.get("version", "")
            if "-beta" in raw_ver.lower():
                default_channel = "BETA"
                match = re.match(r'^(\d+\.\d+\.\d+)', raw_ver)
                default_version = match.group(1) if match else raw_ver.split("-beta")[0]
            else:
                default_channel = "STABLE"
                match = re.match(r'^(\d+\.\d+\.\d+)', raw_ver)
                default_version = match.group(1) if match else raw_ver
            source_of_truth = "node_modules (@minecraft/server)"
        except Exception:
            pass
    elif os.path.exists(manifest_path):
        try:
            with open(manifest_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            dependencies = data.get("dependencies", [])
            for dep in dependencies:
                if dep.get("module_name") == "@minecraft/server":
                    ver = dep.get("version", "")
                    if "-beta" in ver.lower():
                        default_channel = "BETA"
                        default_version = ver.lower().split("-beta")[0]
                    else:
                        default_channel = "STABLE"
                        default_version = ver
                    source_of_truth = "manifest.json"
                    break
        except Exception:
            pass
            
    return default_channel, default_version, source_of_truth

def parse_typings():
    dts_path = os.path.join(PROJECT_ROOT, "node_modules", "@minecraft", "server", "index.d.ts")
    has_run_command_async = False
    resolved_classes = {}
    
    if os.path.exists(dts_path):
        try:
            # Check if runCommandAsync exists
            with open(dts_path, 'r', encoding='utf-8') as f:
                content = f.read()
            if re.search(r'\brunCommandAsync\b', content):
                has_run_command_async = True
            
            # Parse classes and members
            classes = {}
            current_class = None
            
            # Read line by line
            f.seek(0)
            for line in f:
                trimmed = line.strip()
                class_match = re.match(r'^export (class|interface) (\w+)(?:\s+extends\s+([\w\.]+))?', trimmed)
                if class_match:
                    current_class = class_match.group(2)
                    parent = class_match.group(3)
                    if parent and "." in parent:
                        parent = parent.split(".")[-1]
                    classes[current_class] = {
                        "parent": parent,
                        "members": set()
                    }
                    continue
                
                if current_class:
                    if trimmed == "}":
                        current_class = None
                        continue
                    
                    method_match = re.match(r'^(\w+)(?:<[^>]+>)?\s*\(', trimmed)
                    if method_match:
                        classes[current_class]["members"].add(method_match.group(1))
                        continue
                    
                    prop_match = re.match(r'^(?:readonly\s+)?(\w+)\??\s*:', trimmed)
                    if prop_match:
                        classes[current_class]["members"].add(prop_match.group(1))
                        continue
            
            # Resolve inheritance recursively
            def resolve(cls_name):
                if cls_name not in classes:
                    return set()
                if cls_name in resolved_classes:
                    return resolved_classes[cls_name]
                
                all_members = set(classes[cls_name]["members"])
                parent = classes[cls_name]["parent"]
                if parent:
                    all_members.update(resolve(parent))
                resolved_classes[cls_name] = all_members
                return all_members
            
            for cls in classes:
                resolve(cls)
                
        except Exception:
            pass
            
    return has_run_command_async, resolved_classes

def scan_file(file_path, channel, version, run_command_deprecated, resolved_classes):
    issues = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception as e:
        return [{"type": "ERROR", "line": 0, "desc": f"Failed to read file: {e}"}]

    # Map variable name prefixes to native classes in the typings
    prefix_map = {
        "world": "World",
        "system": "System",
        "player": "Player",
        "pl": "Player",
        "target": "Player",
        "sender": "Player",
        "admin": "Player",
        "entity": "Entity",
        "ent": "Entity",
        "dimension": "Dimension",
        "itemstack": "ItemStack",
        "container": "Container",
        "inventory": "Container"
    }

    for idx, line in enumerate(lines):
        line_num = idx + 1
        
        stripped = line.strip()
        if stripped.startswith("//") or stripped.startswith("*") or stripped.startswith("/*"):
            continue

        # 1. TEST: getComponent Null Check Hazard
        assign_match = re.search(r'(?:const|let|var)\s+(\w+)\s*=\s*(?:.*?\.)?getComponent\((.*?)\)', line)
        if assign_match:
            assigned_var = assign_match.group(1)
            comp_name = assign_match.group(2).strip()
            
            has_check = False
            if f"{assigned_var}?." in line:
                has_check = True
            else:
                for next_line in lines[line_num:line_num+5]:
                    if f"if" in next_line and assigned_var in next_line:
                        has_check = True
                        break
                    if f"{assigned_var}?." in next_line:
                        has_check = True
                        break
            if not has_check:
                issues.append({
                    "type": "WARNING",
                    "line": line_num,
                    "desc": f"getComponent({comp_name}) assigned to '{assigned_var}' without a null check or optional chaining (?.)."
                })
        else:
            direct_match = re.search(r'(\w+)\.getComponent\((.*?)\)\s*\.', line)
            if direct_match and "?." not in line:
                object_var = direct_match.group(1)
                comp_name = direct_match.group(2).strip()
                issues.append({
                    "type": "WARNING",
                    "line": line_num,
                    "desc": f"Direct chain call on getComponent({comp_name}) on '{object_var}' without optional chaining (?.). Potential Null Pointer Hazard."
                })

        # 2. TEST: Deprecated C++ runCommand Call
        if ".runCommand(" in line and "runCommandAsync" not in line:
            if "try" not in line:
                if run_command_deprecated:
                    issues.append({
                        "type": "DEPRECATION",
                        "line": line_num,
                        "desc": f"Synchronous .runCommand() is deprecated in Mojang API {version} ({channel}). Use .runCommandAsync() to protect TPS."
                    })
                else:
                    issues.append({
                        "type": "WARNING",
                        "line": line_num,
                        "desc": f"Synchronous .runCommand() detected. Ensure it does not block main thread TPS on Mojang API {version} ({channel})."
                    })

        # 3. TEST: Dynamic Typings Member Validation Check
        if resolved_classes:
            method_matches = re.finditer(r'(?<!\.)\b(\w+)\.(\w+)\s*\(', line)
            for match in method_matches:
                var_name = match.group(1)
                method_name = match.group(2)
                
                class_name = prefix_map.get(var_name.lower())
                if class_name and class_name in resolved_classes:
                    members_set = resolved_classes[class_name]
                    if method_name not in members_set:
                        issues.append({
                            "type": "WARNING",
                            "line": line_num,
                            "desc": f"Method '{method_name}' called on '{var_name}' ({class_name}) does not exist in target @minecraft/server version."
                        })

    return issues

def safe_print(text):
    try:
        sys.stdout.write(text + "\n")
        sys.stdout.flush()
    except UnicodeEncodeError:
        replacements = {
            "📂": "[FILE]",
            "✔": "[OK]",
            "⚠": "[WARN]"
        }
        for k, v in replacements.items():
            text = text.replace(k, v)
        text = text.encode('ascii', errors='replace').decode('ascii')
        sys.stdout.write(text + "\n")
        sys.stdout.flush()

def main():
    default_channel, default_version, source_of_truth = get_source_of_truth_defaults()

    parser = argparse.ArgumentParser(description="Mojang API Linter")
    parser.add_argument("--channel", default=default_channel, choices=["STABLE", "BETA"], type=str.upper, help="API Channel")
    parser.add_argument("--version", default=None, help="API Version")
    args = parser.parse_args()

    channel = args.channel
    version = args.version
    if version is None:
        version = default_version

    has_run_command_async, resolved_classes = parse_typings()
    
    # If index.d.ts wasn't found/parsed, fallback to hardcoded rule deprecation check
    run_command_deprecated = has_run_command_async
    if not resolved_classes:
        try:
            ver_parts = [int(x) for x in re.findall(r'\d+', version)]
            if len(ver_parts) >= 2:
                major, minor = ver_parts[0], ver_parts[1]
                if channel == "BETA" and (major > 2 or (major == 2 and minor >= 8)):
                    run_command_deprecated = True
                elif channel == "STABLE" and (major > 2 or (major == 2 and minor >= 7)):
                    run_command_deprecated = True
        except Exception:
            if channel == "BETA":
                run_command_deprecated = True

    safe_print(f"{CYAN}=========================================={RESET}")
    safe_print(f"{WHITE}       AETHELGRAD MOJANG API LINTER       {RESET}")
    safe_print(f"{CYAN}------------------------------------------{RESET}")
    safe_print(f"{CYAN} SCAN TARGET: {WHITE}{channel} {version}{RESET}")
    safe_print(f"{CYAN} SOURCE:      {WHITE}{source_of_truth}{RESET}")
    safe_print(f"{CYAN}=========================================={RESET}")
    
    total_warnings = 0
    total_files = 0

    for root, _, files in os.walk(SCRIPTS_DIR):
        if "node_modules" in root or ".git" in root:
            continue
            
        for file in files:
            if file.endswith(".js"):
                total_files += 1
                file_path = os.path.join(root, file)
                relative_path = os.path.relpath(file_path, PROJECT_ROOT)
                
                issues = scan_file(file_path, channel, version, run_command_deprecated, resolved_classes)
                if issues:
                    safe_print(f"\n{YELLOW}📂 File: {relative_path}{RESET}")
                    for issue in issues:
                        color = RED if issue["type"] == "DEPRECATION" else YELLOW
                        safe_print(f"  [{color}{issue['type']}{RESET}] Line {issue['line']}: {issue['desc']}")
                        total_warnings += 1

    safe_print(f"\n{CYAN}------------------------------------------{RESET}")
    if total_warnings == 0:
        safe_print(f"{GREEN}✔ clean build! 0 issues found across {total_files} files.{RESET}")
    else:
        safe_print(f"{RED}⚠ scan finished: {total_warnings} potential issues found.{RESET}")
    safe_print(f"{CYAN}=========================================={RESET}")

if __name__ == "__main__":
    main()
