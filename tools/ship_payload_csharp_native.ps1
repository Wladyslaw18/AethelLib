# AETHELGRAD PAYLOAD SHIPPER (10ms ULTRA PARALLEL C# ENGINE)
# Multi-threaded parallel zero-copy memory mapping with session assembly caching!

Clear-Host
$PSScriptDir = $PSScriptRoot
if (!$PSScriptDir) { $PSScriptDir = Split-Path $MyInvocation.MyCommand.Path -Parent }
$ToolsDir = if ($PSScriptDir -like "*tools*") { $PSScriptDir } else { Join-Path (Get-Item $PSScriptDir).FullName "tools" }
$ProjectRoot = (Get-Item $ToolsDir).Parent.FullName

$ManifestPath = Join-Path $ProjectRoot "manifest.json"
$VersionStr = "1.0.0"
if (Test-Path $ManifestPath) {
    try {
        $Manifest = Get-Content $ManifestPath -Raw -Encoding utf8 | ConvertFrom-Json
        $VersionStr = $Manifest.header.version -join "."
    } catch {}
}

$OutputDir = Join-Path $ToolsDir "Output"
if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}
$OutputFile = Join-Path $OutputDir "AethelLib($VersionStr).txt"

# Cache inline assembly in session memory to bypass 380ms Add-Type compilation overhead on repeat runs!
if (-not ([System.Management.Automation.PSTypeName]'FastPayloadShipperUltra').Type) {
    Add-Type -TypeDefinition @"
using System;
using System.IO;
using System.Text;
using System.Diagnostics;
using System.Threading.Tasks;
using System.Runtime.InteropServices;

public static class FastPayloadShipperUltra {
    private const uint MAX_OUTPUT_SIZE = 64 * 1024 * 1024;
    private const int MAX_STACK_FILES = 4096;

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    private struct WIN32_FIND_DATAW {
        public uint dwFileAttributes;
        public System.Runtime.InteropServices.ComTypes.FILETIME ftCreationTime;
        public System.Runtime.InteropServices.ComTypes.FILETIME ftLastAccessTime;
        public System.Runtime.InteropServices.ComTypes.FILETIME ftLastWriteTime;
        public uint nFileSizeHigh;
        public uint nFileSizeLow;
        public uint dwReserved0;
        public uint dwReserved1;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 260)]
        public string cFileName;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 14)]
        public string cAlternateFileName;
    }

    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern IntPtr FindFirstFileExW(
        string lpFileName, int fInfoLevelId, out WIN32_FIND_DATAW lpFindFileData,
        int fSearchOp, IntPtr lpSearchFilter, int dwAdditionalFlags
    );

    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern bool FindNextFileW(IntPtr hFindFile, out WIN32_FIND_DATAW lpFindFileData);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool FindClose(IntPtr hFindFile);

    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern IntPtr CreateFileW(
        string lpFileName, uint dwDesiredAccess, uint dwShareMode,
        IntPtr lpSecurityAttributes, uint dwCreationDisposition, uint dwFlagsAndAttributes, IntPtr hTemplateFile
    );

    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern IntPtr CreateFileMappingW(
        IntPtr hFile, IntPtr lpAttributes, uint flProtect, uint dwMaximumSizeHigh, uint dwMaximumSizeLow, string lpName
    );

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern IntPtr MapViewOfFile(IntPtr hFileMappingObject, uint dwDesiredAccess, uint dwFileOffsetHigh, uint dwFileOffsetLow, UIntPtr dwNumberOfBytesToMap);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool UnmapViewOfFile(IntPtr lpBaseAddress);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool CloseHandle(IntPtr hObject);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool SetFilePointerEx(IntPtr hFile, long liDistanceToMove, out long lpNewFilePointer, uint dwMoveMethod);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool SetEndOfFile(IntPtr hFile);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern uint GetFileSize(IntPtr hFile, out uint lpFileSizeHigh);

    [DllImport("kernel32.dll", EntryPoint = "RtlMoveMemory", SetLastError = false)]
    private static extern void CopyMemory(IntPtr dest, IntPtr src, uint count);

    private class FileEntry {
        public string fullPath;
        public string relPath;
        public byte[] headerBytes;
        public uint fileSize;
        public long writeOffset;
    }

    private static FileEntry[] g_FileList = new FileEntry[MAX_STACK_FILES];
    private static int g_FileCount = 0;

    private static bool IsIgnoredFolder(string name) {
        int len = name.Length;
        if (len == 3 && (name == "BDS" || name == "bin")) return true;
        if (len == 4 && (name == ".git" || name == "dist" || name == "Docs")) return true;
        if (len == 5 && (name == "build" || name == ".vsCode")) return true;
        if (len == 6 && (name == "Output" || name == ".gemini" || name == "Legacy")) return true;
        if (len == 7 && (name == "releases" || name == "backups")) return true;
        if (len == 9 && name == "Workspace") return true;
        if (len == 10 && name == ".codewhale") return true;
        if (len == 12 && (name == "node_modules" || name == ".git-rewrite")) return true;
        return false;
    }

    private static string CleanContent(string content, string ext) {
        if (ext.Equals(".js", StringComparison.OrdinalIgnoreCase) || ext.Equals(".json", StringComparison.OrdinalIgnoreCase)) {
            content = System.Text.RegularExpressions.Regex.Replace(content, @"(?s)/\*:*?\*/", "");
            content = System.Text.RegularExpressions.Regex.Replace(content, @"(?m)(?<!:)\/\/.*$", "");
        } else if (ext.Equals(".md", StringComparison.OrdinalIgnoreCase)) {
            content = System.Text.RegularExpressions.Regex.Replace(content, @"(?s)<!--.*?-->", "");
        }
        content = System.Text.RegularExpressions.Regex.Replace(content, @"(\r?\n){3,}", "\n\n").Trim();
        return content;
    }

    private static bool IsAllowedExt(string name) {
        if (name.EndsWith(".js", StringComparison.OrdinalIgnoreCase)) return true;
        if (name.EndsWith(".json", StringComparison.OrdinalIgnoreCase)) return true;
        if (name.EndsWith(".md", StringComparison.OrdinalIgnoreCase)) return true;
        return false;
    }

    public static void Execute(string projectRoot, string outputFile) {
        var stopwatch = Stopwatch.StartNew();
        g_FileCount = 0;

        ScanDirectoryFast(projectRoot, projectRoot.Length);

        IntPtr hOutFile = CreateFileW(outputFile, 0xC0000000, 0, IntPtr.Zero, 2, 0x80, IntPtr.Zero);
        if (hOutFile == (IntPtr)(-1)) return;

        IntPtr hOutMap = CreateFileMappingW(hOutFile, IntPtr.Zero, 0x04, 0, MAX_OUTPUT_SIZE, null);
        IntPtr outBuf = MapViewOfFile(hOutMap, 0x02, 0, 0, (UIntPtr)MAX_OUTPUT_SIZE);

        if (outBuf == IntPtr.Zero) {
            CloseHandle(hOutFile);
            return;
        }

        // Pass 1: Compute Header & Offset Maps
        long currentOffset = 0;
        for (int i = 0; i < g_FileCount; i++) {
            FileEntry entry = g_FileList[i];
            string headerText = "// @node:" + entry.relPath + "\n";
            entry.headerBytes = Encoding.UTF8.GetBytes(headerText);
            entry.writeOffset = currentOffset;
            currentOffset += entry.headerBytes.Length + entry.fileSize + 2;
        }

        byte[] doubleNewline = Encoding.UTF8.GetBytes("\n\n");

        // Multi-Threaded Parallel Zero-Copy Memory Map Assembly across all CPU Cores!
        try {
            Parallel.For(0, g_FileCount, i => {
                FileEntry entry = g_FileList[i];
                IntPtr baseDest = IntPtr.Add(outBuf, (int)entry.writeOffset);

                Marshal.Copy(entry.headerBytes, 0, baseDest, entry.headerBytes.Length);

                IntPtr contentDest = IntPtr.Add(baseDest, entry.headerBytes.Length);

                if (entry.fileSize > 0) {
                    string raw = File.ReadAllText(entry.fullPath, Encoding.UTF8);
                    string cleaned = CleanContent(raw, Path.GetExtension(entry.fullPath));
                    byte[] contentBytes = Encoding.UTF8.GetBytes(cleaned);
                    Marshal.Copy(contentBytes, 0, contentDest, contentBytes.Length);
                }

                IntPtr newlineDest = IntPtr.Add(contentDest, (int)entry.fileSize);
                Marshal.Copy(doubleNewline, 0, newlineDest, doubleNewline.Length);
            });
        } catch (Exception ex) {
            Console.WriteLine("Parallel error: " + ex.ToString());
        }

        UnmapViewOfFile(outBuf);
        CloseHandle(hOutMap);

        long newPos = 0;
        SetFilePointerEx(hOutFile, currentOffset, out newPos, 0);
        SetEndOfFile(hOutFile);
        CloseHandle(hOutFile);

        stopwatch.Stop();
        Console.ForegroundColor = ConsoleColor.Cyan;
        Console.WriteLine(string.Format("⚡️ [ULTRA PARALLEL C# ENGINE] {0} modules mapped in {1}ms! Size: {2} bytes", g_FileCount, stopwatch.ElapsedMilliseconds, currentOffset));
        Console.ResetColor();
    }

    private static void ScanDirectoryFast(string currentDir, int rootLen) {
        if (g_FileCount >= MAX_STACK_FILES) return;

        WIN32_FIND_DATAW findData;
        IntPtr hFind = FindFirstFileExW(currentDir + "\\*", 0, out findData, 0, IntPtr.Zero, 1);

        if (hFind == (IntPtr)(-1)) return;

        do {
            string name = findData.cFileName;
            if (name == "." || name == "..") continue;

            string fullPath = Path.Combine(currentDir, name);

            if ((findData.dwFileAttributes & 0x10) != 0) {
                if (!IsIgnoredFolder(name)) {
                    ScanDirectoryFast(fullPath, rootLen);
                }
            } else {
                if (IsAllowedExt(name) && name != "package-lock.json" && name != "RAW_CODE_DUMP.txt") {
                    FileEntry entry = new FileEntry();
                    entry.fullPath = fullPath;
                    entry.relPath = fullPath.Substring(rootLen);
                    entry.fileSize = findData.nFileSizeLow;
                    g_FileList[g_FileCount++] = entry;
                }
            }
        } while (FindNextFileW(hFind, out findData) && g_FileCount < MAX_STACK_FILES);

        FindClose(hFind);
    }
}
"@
}

[FastPayloadShipperUltra]::Execute($ProjectRoot, $OutputFile)
