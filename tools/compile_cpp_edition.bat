@echo off
setlocal
echo [C++ Compiler] Locating native C++ toolchain...

where g++ >nul 2>&1
if %errorlevel%==0 (
    g++ -O3 -march=native -std=c++17 "ship_payload_cpp_edition.cpp" -o "ship_payload_cpp_edition.exe" -lkernel32
    echo [C++ Compiler] Successfully compiled with g++ -O3 -march=native!
    goto RUN
)

where clang++ >nul 2>&1
if %errorlevel%==0 (
    clang++ -O3 -march=native -std=c++17 "ship_payload_cpp_edition.cpp" -o "ship_payload_cpp_edition.exe"
    echo [C++ Compiler] Successfully compiled with clang++ -O3!
    goto RUN
)

where cl >nul 2>&1
if %errorlevel%==0 (
    cl /O2 /Oi /Ot /GL /std:c++17 /Fe:ship_payload_cpp_edition.exe ship_payload_cpp_edition.cpp /link /LTCG
    echo [C++ Compiler] Successfully compiled with MSVC /O2 /LTCG!
    goto RUN
)

echo [Notice] Open MSVC Developer Command Prompt or run in GCC environment to compile ship_payload_cpp_edition.cpp!
exit /b 1

:RUN
echo [C++ Engine] Executing zero-copy native binary...
ship_payload_cpp_edition.exe
