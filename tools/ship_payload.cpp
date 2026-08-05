/*
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  ᚫᛏᚻᛖᛚᚷᚱᚪᛞ  •  A E T H E L G R A D  S T U D I O S  •  ᚫᛏᚻᛖᛚᚷᚱᚪᛞ
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  
 *  Copyright (c) 2026 Aethelgrad Studios (Wladyslaw18).
 *  All Rights Reserved.
 *  
 *  [ LLM SHIPMENT CONSOLIDATOR - HIGH PERFORMANCE C++17 ENGINE ]
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

#include <iostream>
#include <fstream>
#include <filesystem>
#include <string>
#include <vector>
#include <unordered_set>
#include <chrono>
#include <regex>

namespace fs = std::filesystem;

// Set of directory names to skip during recursive traversal
const std::unordered_set<std::string> IGNORE_FOLDERS = {
    "node_modules", ".git", ".gemini", ".vscode", "bin", "dist",
    "build", "backups", "releases", "BDS", "Output"
};

// Set of specific filenames to exclude
const std::unordered_set<std::string> IGNORE_FILES = {
    "RAW_CODE_DUMP.txt", "LLM_SHIPMENT_DUMP.txt", "package-lock.json"
};

// Allowed file extensions (lowercase)
const std::unordered_set<std::string> ALLOWED_EXTENSIONS = {
    ".js", ".json", ".md"
};

// Extract manifest version string from manifest.json
std::string extract_manifest_version(const fs::path& manifest_path) {
    if (!fs::exists(manifest_path)) return "1.0.0";
    try {
        std::ifstream in(manifest_path, std::ios::in | std::ios::binary);
        if (!in) return "1.0.0";
        std::string content((std::istreambuf_iterator<char>(in)), std::istreambuf_iterator<char>());
        
        // Regex to match "version": [1, 1, 4]
        std::regex ver_regex(R"("version"\s*:\s*\[\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\])");
        std::smatch match;
        if (std::regex_search(content, match, ver_regex) && match.size() >= 4) {
            return match[1].str() + "." + match[2].str() + "." + match[3].str();
        }
    } catch (...) {}
    return "1.0.0";
}

// Fast recursive directory traversal
void collect_files(const fs::path& current_dir, std::vector<fs::path>& out_files) {
    std::error_code ec;
    for (const auto& entry : fs::directory_iterator(current_dir, fs::directory_options::skip_permission_denied, ec)) {
        if (ec) continue;
        
        const auto& path = entry.path();
        std::string name = path.filename().string();
        
        if (entry.is_directory(ec)) {
            if (IGNORE_FOLDERS.find(name) == IGNORE_FOLDERS.end()) {
                collect_files(path, out_files);
            }
        } else if (entry.is_regular_file(ec)) {
            std::string ext = path.extension().string();
            // Convert ext to lowercase
            for (auto& c : ext) c = static_cast<char>(std::tolower(static_cast<unsigned char>(c)));
            
            if (ALLOWED_EXTENSIONS.find(ext) != ALLOWED_EXTENSIONS.end() &&
                IGNORE_FILES.find(name) == IGNORE_FILES.end()) {
                out_files.push_back(path);
            }
        }
    }
}

int main() {
    // Optimize I/O operations
    std::ios_base::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::cout << "==========================================================\n";
    std::cout << "        AETHELGRAD PAYLOAD CONSOLIDATOR (C++17)           \n";
    std::cout << "==========================================================\n";

    fs::path tools_dir = fs::current_path();
    if (tools_dir.filename() != "tools") {
        // If run inside dos or unix subfolder
        if (tools_dir.filename() == "dos" || tools_dir.filename() == "unix") {
            tools_dir = tools_dir.parent_path();
        }
    }
    fs::path project_root = tools_dir.parent_path();
    fs::path output_dir = tools_dir / "Output";
    
    fs::create_directories(output_dir);

    fs::path manifest_path = project_root / "manifest.json";
    std::string version = extract_manifest_version(manifest_path);
    
    std::string out_filename = "AethelLib(" + version + ").txt";
    fs::path output_file = output_dir / out_filename;

    std::cout << "[C++ Engine] Scanning workspace root: " << project_root.string() << "\n";

    auto start_time = std::chrono::high_resolution_clock::now();

    std::vector<fs::path> target_files;
    collect_files(project_root, target_files);

    std::cout << "[C++ Engine] Staging " << target_files.size() << " modules for payload shipping...\n";

    // Open output stream with 64KB I/O buffer
    std::ofstream out(output_file, std::ios::out | std::ios::binary);
    std::vector<char> stream_buffer(64 * 1024);
    out.rdbuf()->pubsetbuf(stream_buffer.data(), stream_buffer.size());

    size_t processed = 0;
    std::vector<char> file_buffer(128 * 1024); // 128KB read buffer

    for (const auto& file_path : target_files) {
        std::string rel_path = file_path.string().substr(project_root.string().length());
        
        out << "================================================================================\n";
        out << "FILE_NODE: " << rel_path << "\n";
        out << "================================================================================\n";

        std::ifstream in(file_path, std::ios::in | std::ios::binary);
        if (in) {
            out << in.rdbuf();
        }
        out << "\n\n";
        processed++;
    }

    out.close();

    auto end_time = std::chrono::high_resolution_clock::now();
    auto elapsed_ms = std::chrono::duration_cast<std::chrono::milliseconds>(end_time - start_time).count();

    std::cout << "==========================================================\n";
    std::cout << "  SUCCESS: C++ Consolidation Complete!\n";
    std::cout << "  Time Elapsed: " << elapsed_ms << " ms\n";
    std::cout << "  Modules Processed: " << processed << "\n";
    std::cout << "  Payload Output: " << output_file.string() << "\n";
    std::cout << "==========================================================\n";

    return 0;
}
