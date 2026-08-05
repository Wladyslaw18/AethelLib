# AETHELGRAD PAYLOAD SHIPPER (UNSAFE ZERO-HEAP C# ENGINE)
# Compiles inline unsafe C# with Win32 P/Invoke & memory-mapped zero-copy I/O directly in Windows memory!

Clear-Host
Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host "     AETHELGRAD PAYLOAD SHIPPER (UNSAFE C# ZERO-HEAP)     " -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host "  Press [ENTER] to execute unsafe C# engine | [Ctrl+C] to cancel" -ForegroundColor DarkGray
Write-Host "==========================================================" -ForegroundColor Yellow
Read-Host | Out-Null

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

# Compile inline C# via Add-Type
Add-Type -TypeDefinition @"
using System;
using System.IO;
using System.Text;
using System.Diagnostics;
using System.Runtime.InteropServices;

public static unsafe class FastPayloadShipperUnsafe {
    private const uint MAX_OUTPUT_SIZE = 64 * 1024 * 1024;
    private const int MAX_STACK_FILES = 4096;
    private const int MAX_PATH_LEN = 260;

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
    private static extern byte* MapViewOfFile(IntPtr hFileMappingObject, uint dwDesiredAccess, uint dwFileOffsetHigh, uint dwFileOffsetLow, UIntPtr dwNumberOfBytesToMap);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool UnmapViewOfFile(byte* lpBaseAddress);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool CloseHandle(IntPtr hObject);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool SetFilePointerEx(IntPtr hFile, long liDistanceToMove, out long lpNewFilePointer, uint dwMoveMethod);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool SetEndOfFile(IntPtr hFile);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern uint GetFileSize(IntPtr hFile, out uint lpFileSizeHigh);

    private struct FileEntry {
        public fixed char fullPath[MAX_PATH_LEN];
        public ushort pathLen;
        public ushort relOffset;
    }

    private static FileEntry[] g_FileList = new FileEntry[MAX_STACK_FILES];
    private static uint g_FileCount = 0;

    private static bool IsIgnoredFolder(string name) {
        int len = name.Length;
        if (len == 3 && (name == "BDS" || name == "bin")) return true;
        if (len == 4 && (name == ".git" || name == "dist")) return true;
        if (len == 5 && (name == "build" || name == ".vsCode")) return true;
        if (len == 6 && (name == "Output" || name == ".gemini")) return true;
        if (len == 7 && (name == "releases" || name == "backups")) return true;
        if (len == 12 && name == "node_modules") return true;
        return false;
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

        Console.ForegroundColor = ConsoleColor.Green;
        Console.WriteLine(string.Format("[Unsafe C# Engine] Staging {0} modules for zero-copy consolidation...", g_FileCount));
        Console.ResetColor();

        IntPtr hOutFile = CreateFileW(
            outputFile, 0xC0000000, 0, IntPtr.Zero, 2, 0x80, IntPtr.Zero
        );

        if (hOutFile == (IntPtr)(-1)) {
            Console.WriteLine("Error opening output handle.");
            return;
        }

        IntPtr hOutMap = CreateFileMappingW(hOutFile, IntPtr.Zero, 0x04, 0, MAX_OUTPUT_SIZE, null);
        byte* outBuf = MapViewOfFile(hOutMap, 0x02, 0, 0, (UIntPtr)MAX_OUTPUT_SIZE);

        if (outBuf == null) {
            CloseHandle(hOutFile);
            return;
        }

        byte* writePtr = outBuf;
        byte[] headerBorder = Encoding.UTF8.GetBytes("================================================================================\n");
        byte[] fileNodePrefix = Encoding.UTF8.GetBytes("FILE_NODE: ");

        fixed (byte* borderPtr = headerBorder)
        fixed (byte* prefixPtr = fileNodePrefix) {
            for (uint i = 0; i < g_FileCount; i++) {
                fixed (FileEntry* entry = &g_FileList[i]) {
                    // Fast pointer copy for header
                    Buffer.MemoryCopy(borderPtr, writePtr, headerBorder.Length, headerBorder.Length);
                    writePtr += headerBorder.Length;

                    Buffer.MemoryCopy(prefixPtr, writePtr, fileNodePrefix.Length, fileNodePrefix.Length);
                    writePtr += fileNodePrefix.Length;

                    // Relative path copy
                    string fullPathStr = new string(entry->fullPath, 0, entry->pathLen);
                    string relPathStr = fullPathStr.Substring(entry->relOffset);
                    byte[] relPathBytes = Encoding.UTF8.GetBytes(relPathStr + "\n");
                    fixed (byte* relPtr = relPathBytes) {
                        Buffer.MemoryCopy(relPtr, writePtr, relPathBytes.Length, relPathBytes.Length);
                        writePtr += relPathBytes.Length;
                    }

                    Buffer.MemoryCopy(borderPtr, writePtr, headerBorder.Length, headerBorder.Length);
                    writePtr += headerBorder.Length;

                    // Read source file via memory map
                    IntPtr hInFile = CreateFileW(
                        fullPathStr, 0x80000000, 1, IntPtr.Zero, 3, 0x80 | 0x10000000, IntPtr.Zero
                    );

                    if (hInFile != (IntPtr)(-1)) {
                        uint fileSizeHigh = 0;
                        uint fileSizeLow = GetFileSize(hInFile, out fileSizeHigh);
                        if (fileSizeLow > 0 && fileSizeHigh == 0) {
                            IntPtr hInMap = CreateFileMappingW(hInFile, IntPtr.Zero, 0x02, 0, 0, null);
                            if (hInMap != IntPtr.Zero) {
                                byte* inBuf = MapViewOfFile(hInMap, 0x04, 0, 0, (UIntPtr)fileSizeLow);
                                if (inBuf != null) {
                                    Buffer.MemoryCopy(inBuf, writePtr, fileSizeLow, fileSizeLow);
                                    writePtr += fileSizeLow;
                                    UnmapViewOfFile(inBuf);
                                }
                                CloseHandle(hInMap);
                            }
                        }
                        CloseHandle(hInFile);
                    }

                    *writePtr++ = (byte)'\n';
                    *writePtr++ = (byte)'\n';
                }
            }
        }

        long totalBytesWritten = writePtr - outBuf;

        UnmapViewOfFile(outBuf);
        CloseHandle(hOutMap);

        long newPos = 0;
        SetFilePointerEx(hOutFile, totalBytesWritten, out newPos, 0);
        SetEndOfFile(hOutFile);
        CloseHandle(hOutFile);

        stopwatch.Stop();
        Console.ForegroundColor = ConsoleColor.Cyan;
        Console.WriteLine(string.Format("[Unsafe C# Engine] Zero-copy consolidation complete in {0}ms! Size: {1} bytes", stopwatch.ElapsedMilliseconds, totalBytesWritten));
        Console.ResetColor();
    }

    private static void ScanDirectoryFast(string currentDir, int rootLen) {
        if (g_FileCount >= MAX_STACK_FILES) return;

        WIN32_FIND_DATAW findData;
        IntPtr hFind = FindFirstFileExW(
            currentDir + "\\*", 0, out findData, 0, IntPtr.Zero, 1
        );

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
                    fixed (FileEntry* entry = &g_FileList[g_FileCount++]) {
                        entry->pathLen = (ushort)fullPath.Length;
                        entry->relOffset = (ushort)rootLen;
                        fixed (char* srcPtr = fullPath) {
                            for (int k = 0; k < fullPath.Length && k < MAX_PATH_LEN; k++) {
                                entry->fullPath[k] = srcPtr[k];
                            }
                        }
                    }
                }
            }
        } while (FindNextFileW(hFind, out findData) && g_FileCount < MAX_STACK_FILES);

        FindClose(hFind);
    }
}
"@

[FastPayloadShipperUnsafe]::Execute($ProjectRoot, $OutputFile)
