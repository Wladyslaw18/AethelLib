#define WIN32_LEAN_AND_MEAN
#define NOMINMAX
#include <windows.h>
#include <cstdint>
#include <cstdio>

#define MAX_OUTPUT_SIZE (64 * 1024 * 1024)
#define MAX_STACK_FILES 4096
#define MAX_PATH_LEN 260

struct FileEntry {
    wchar_t fullPath[MAX_PATH_LEN];
    uint16_t pathLen;
    uint16_t relOffset;
};

static FileEntry g_FileList[MAX_STACK_FILES];
static uint32_t g_FileCount = 0;

static inline bool IsIgnoredFolder(const wchar_t* name, uint32_t len) {
    if (len == 4 && (
        (name[0]=='B'&&name[1]=='D'&&name[2]=='S') ||
        (name[0]=='.'&&name[1]=='g'&&name[2]=='i'&&name[3]=='t') ||
        (name[0]=='b'&&name[1]=='i'&&name[2]=='n') ||
        (name[0]=='d'&&name[1]=='i'&&name[2]=='s'&&name[3]=='t') ||
        (name[0]=='D'&&name[1]=='o'&&name[2]=='c'&&name[3]=='s')
    )) return true;

    if (len == 5 && (
        (name[0]=='b'&&name[1]=='u'&&name[2]=='i'&&name[3]=='l'&&name[4]=='d') ||
        (name[0]=='.'&&name[1]=='v'&&name[2]=='s'&&name[3]=='c'&&name[4]=='o')
    )) return true;

    if (len == 6 && (
        (name[0]=='O'&&name[1]=='u'&&name[2]=='t'&&name[3]=='p'&&name[4]=='u'&&name[5]=='t') ||
        (name[0]=='.'&&name[1]=='g'&&name[2]=='e'&&name[3]=='m'&&name[4]=='i') ||
        (name[0]=='L'&&name[1]=='e'&&name[2]=='g'&&name[3]=='a'&&name[4]=='c'&&name[5]=='y')
    )) return true;

    if (len == 7 && (
        (name[0]=='r'&&name[1]=='e'&&name[2]=='l'&&name[3]=='e'&&name[4]=='a'&&name[5]=='s') ||
        (name[0]=='b'&&name[1]=='a'&&name[2]=='c'&&name[3]=='k'&&name[4]=='u'&&name[5]=='p')
    )) return true;

    if (len == 9 && (name[0]=='W'&&name[1]=='o'&&name[2]=='r'&&name[3]=='k'&&name[4]=='s')) return true;

    if (len == 10 && (name[0]=='.'&&name[1]=='c'&&name[2]=='o'&&name[3]=='d'&&name[4]=='e')) return true;

    if (len == 12 && (
        (name[0]=='n'&&name[1]=='o'&&name[2]=='d'&&name[3]=='e'&&name[4]=='_') ||
        (name[0]=='.'&&name[1]=='g'&&name[2]=='i'&&name[3]=='t'&&name[4]=='-')
    )) return true;

    return false;
}

static inline bool IsAllowedExt(const wchar_t* name, uint32_t len) {
    if (len < 4) return false;
    const wchar_t* ext = name + len - 3;
    if (ext[0] == L'.' && ext[1] == L'j' && ext[2] == L's') return true;
    if (ext[0] == L'.' && ext[1] == L'm' && ext[2] == L'd') return true;
    
    if (len >= 5) {
        const wchar_t* ext4 = name + len - 5;
        if (ext4[0] == L'.' && ext4[1] == L'j' && ext4[2] == L's' && ext4[3] == L'o' && ext4[4] == L'n') return true;
    }
    return false;
}

static void ScanDirectoryFast(wchar_t* pathBuffer, uint32_t currentLen, uint32_t rootLen) {
    if (g_FileCount >= MAX_STACK_FILES) return;

    pathBuffer[currentLen] = L'\\';
    pathBuffer[currentLen + 1] = L'*';
    pathBuffer[currentLen + 2] = L'\0';

    WIN32_FIND_DATAW findData;
    HANDLE hFind = FindFirstFileExW(
        pathBuffer,
        FindExInfoBasic,
        &findData,
        FindExSearchNameMatch,
        NULL,
        FIND_FIRST_EX_LARGE_FETCH
    );

    if (hFind == INVALID_HANDLE_VALUE) return;

    do {
        const wchar_t* name = findData.cFileName;
        if (name[0] == L'.' && (name[1] == L'\0' || (name[1] == L'.' && name[2] == L'\0'))) continue;

        uint32_t nameLen = (uint32_t)wcslen(name);

        if (findData.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) {
            if (!IsIgnoredFolder(name, nameLen)) {
                wcsncpy_s(pathBuffer + currentLen + 1, MAX_PATH_LEN - currentLen - 1, name, nameLen);
                pathBuffer[currentLen + 1 + nameLen] = L'\0';
                ScanDirectoryFast(pathBuffer, currentLen + 1 + nameLen, rootLen);
            }
        } else {
            if (IsAllowedExt(name, nameLen)) {
                FileEntry& entry = g_FileList[g_FileCount++];
                uint32_t fullLen = currentLen + 1 + nameLen;
                wcsncpy_s(entry.fullPath, MAX_PATH_LEN, pathBuffer, currentLen);
                entry.fullPath[currentLen] = L'\\';
                wcsncpy_s(entry.fullPath + currentLen + 1, MAX_PATH_LEN - currentLen - 1, name, nameLen);
                entry.fullPath[fullLen] = L'\0';
                entry.pathLen = (uint16_t)fullLen;
                entry.relOffset = (uint16_t)rootLen;
            }
        }
    } while (FindNextFileW(hFind, &findData) && g_FileCount < MAX_STACK_FILES);

    FindClose(hFind);
}

static inline uint32_t FastMemcpy(char* dest, const char* src, uint32_t len) {
    __movsb((unsigned char*)dest, (const unsigned char*)src, len);
    return len;
}

int main() {
    LARGE_INTEGER qpcStart, qpcEnd, freq;
    QueryPerformanceFrequency(&freq);
    QueryPerformanceCounter(&qpcStart);

    wchar_t toolsDir[MAX_PATH_LEN];
    GetModuleFileNameW(NULL, toolsDir, MAX_PATH_LEN);
    wchar_t* lastSlash = wcsrchr(toolsDir, L'\\');
    if (lastSlash) *lastSlash = L'\0';

    wchar_t projectRoot[MAX_PATH_LEN];
    wcscpy_s(projectRoot, MAX_PATH_LEN, toolsDir);
    wchar_t* parentSlash = wcsrchr(projectRoot, L'\\');
    if (parentSlash) *parentSlash = L'\0';

    wchar_t outputDir[MAX_PATH_LEN];
    swprintf_s(outputDir, MAX_PATH_LEN, L"%s\\Output", toolsDir);
    CreateDirectoryW(outputDir, NULL);

    wchar_t outputFile[MAX_PATH_LEN];
    swprintf_s(outputFile, MAX_PATH_LEN, L"%s\\AethelLib(1.1.4).txt", outputDir);

    HANDLE hOutFile = CreateFileW(
        outputFile, GENERIC_READ | GENERIC_WRITE, 0, NULL,
        CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL, NULL
    );

    if (hOutFile == INVALID_HANDLE_VALUE) {
        printf("Error: Failed to create output file handle.\n");
        return 1;
    }

    HANDLE hOutMap = CreateFileMappingW(
        hOutFile, NULL, PAGE_READWRITE, 0, MAX_OUTPUT_SIZE, NULL
    );

    char* outBuf = (char*)MapViewOfFile(hOutMap, FILE_MAP_WRITE, 0, 0, MAX_OUTPUT_SIZE);
    if (!outBuf) {
        CloseHandle(hOutFile);
        return 1;
    }

    wchar_t scanBuf[MAX_PATH_LEN];
    uint32_t rootLen = (uint32_t)wcslen(projectRoot);
    wcscpy_s(scanBuf, MAX_PATH_LEN, projectRoot);
    
    ScanDirectoryFast(scanBuf, rootLen, rootLen);

    char* writePtr = outBuf;
    const char headerBorder[] = "================================================================================\n";
    const uint32_t borderLen = sizeof(headerBorder) - 1;

    for (uint32_t i = 0; i < g_FileCount; ++i) {
        const FileEntry& entry = g_FileList[i];

        writePtr += FastMemcpy(writePtr, headerBorder, borderLen);
        writePtr += FastMemcpy(writePtr, "FILE_NODE: ", 11);

        int relLen = WideCharToMultiByte(
            CP_UTF8, 0, entry.fullPath + entry.relOffset, entry.pathLen - entry.relOffset,
            writePtr, 512, NULL, NULL
        );
        writePtr += relLen;
        *writePtr++ = '\n';
        writePtr += FastMemcpy(writePtr, headerBorder, borderLen);

        HANDLE hInFile = CreateFileW(
            entry.fullPath, GENERIC_READ, FILE_SHARE_READ, NULL,
            OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL | FILE_FLAG_SEQUENTIAL_SCAN, NULL
        );

        if (hInFile != INVALID_HANDLE_VALUE) {
            DWORD fileSizeHigh = 0;
            DWORD fileSizeLow = GetFileSize(hInFile, &fileSizeHigh);
            if (fileSizeLow > 0 && fileSizeHigh == 0) {
                HANDLE hInMap = CreateFileMappingW(hInFile, NULL, PAGE_READONLY, 0, 0, NULL);
                if (hInMap) {
                    const char* inBuf = (const char*)MapViewOfFile(hInMap, FILE_MAP_READ, 0, 0, fileSizeLow);
                    if (inBuf) {
                        writePtr += FastMemcpy(writePtr, inBuf, fileSizeLow);
                        UnmapViewOfFile(inBuf);
                    }
                    CloseHandle(hInMap);
                }
            }
            CloseHandle(hInFile);
        }
        *writePtr++ = '\n';
        *writePtr++ = '\n';
    }

    uint64_t totalBytesWritten = (uint64_t)(writePtr - outBuf);

    UnmapViewOfFile(outBuf);
    CloseHandle(hOutMap);

    LARGE_INTEGER newSize;
    newSize.QuadPart = totalBytesWritten;
    SetFilePointerEx(hOutFile, newSize, NULL, FILE_BEGIN);
    SetEndOfFile(hOutFile);
    CloseHandle(hOutFile);

    QueryPerformanceCounter(&qpcEnd);
    double elapsedUs = (double)(qpcEnd.QuadPart - qpcStart.QuadPart) * 1000000.0 / (double)freq.QuadPart;
    double elapsedMs = elapsedUs / 1000.0;

    printf("\n==========================================================\n");
    printf("     AETHELGRAD PAYLOAD SHIPPER (C++ EDITION)             \n");
    printf("==========================================================\n");
    printf("  Modules Processed: %u files\n", g_FileCount);
    printf("  Payload Output Size: %llu bytes\n", totalBytesWritten);
    printf("  Execution Time: %.3f ms (%.1f us)\n", elapsedMs, elapsedUs);
    printf("==========================================================\n\n");

    return 0;
}
