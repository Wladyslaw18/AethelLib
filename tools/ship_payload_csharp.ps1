# AETHELGRAD PAYLOAD CONSOLIDATOR (INLINE C# ROSLYN ENGINE)
# Compiles and executes C# code directly in memory using built-in Windows .NET!

Clear-Host
Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host "         AETHELGRAD PAYLOAD SHIPPER (INLINE C#)           " -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host "  Press [ENTER] to execute C# payload engine | [Ctrl+C] to cancel" -ForegroundColor DarkGray
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

# Compile inline C# code directly into memory via Add-Type
Add-Type -TypeDefinition @"
using System;
using System.IO;
using System.Text;
using System.Collections.Generic;
using System.Diagnostics;

public static class FastPayloadShipper {
    private static readonly HashSet<string> IgnoreFolders = new HashSet<string>(StringComparer.OrdinalIgnoreCase) {
        "node_modules", ".git", ".gemini", ".vscode", "bin", "dist", "build", "backups", "releases", "BDS", "Output"
    };

    private static readonly HashSet<string> IgnoreFiles = new HashSet<string>(StringComparer.OrdinalIgnoreCase) {
        "RAW_CODE_DUMP.txt", "LLM_SHIPMENT_DUMP.txt", "package-lock.json"
    };

    private static readonly HashSet<string> AllowedExtensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase) {
        ".js", ".json", ".md"
    };

    public static void Execute(string projectRoot, string outputFile) {
        var stopwatch = Stopwatch.StartNew();
        var files = new List<FileInfo>();
        
        ScanDirectory(new DirectoryInfo(projectRoot), files);

        Console.ForegroundColor = ConsoleColor.Green;
        Console.WriteLine(string.Format("[C# Engine] Staging {0} modules for consolidation...", files.Count));
        Console.ResetColor();

        var utf8NoBom = new UTF8Encoding(false);
        using (var writer = new StreamWriter(outputFile, false, utf8NoBom, 65536)) {
            foreach (var file in files) {
                string relPath = file.FullName.Substring(projectRoot.Length);
                writer.WriteLine("================================================================================");
                writer.WriteLine(string.Format("FILE_NODE: {0}", relPath));
                writer.WriteLine("================================================================================");
                writer.WriteLine(File.ReadAllText(file.FullName, Encoding.UTF8));
                writer.WriteLine("\n");
            }
        }

        stopwatch.Stop();
        Console.ForegroundColor = ConsoleColor.Cyan;
        Console.WriteLine(string.Format("[C# Engine] Consolidation successful in {0}ms! Payload: {1}", stopwatch.ElapsedMilliseconds, outputFile));
        Console.ResetColor();
    }

    private static void ScanDirectory(DirectoryInfo dir, List<FileInfo> result) {
        try {
            foreach (var item in dir.EnumerateFileSystemInfos()) {
                if (item is DirectoryInfo) {
                    var subDir = (DirectoryInfo)item;
                    if (!IgnoreFolders.Contains(subDir.Name)) {
                        ScanDirectory(subDir, result);
                    }
                } else if (item is FileInfo) {
                    var file = (FileInfo)item;
                    if (AllowedExtensions.Contains(file.Extension) && !IgnoreFiles.Contains(file.Name)) {
                        result.Add(file);
                    }
                }
            }
        } catch {}
    }
}
"@

[FastPayloadShipper]::Execute($ProjectRoot, $OutputFile)
