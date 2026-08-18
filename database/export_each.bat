@echo off
setlocal enabledelayedexpansion

REM ==============================
REM SETTING MYSQL EXPORT PER TABLE
REM ==============================
set MYSQL_PATH=C:\xampp\mysql\bin\mysql.exe
set MYSQLDUMP_PATH=C:\xampp\mysql\bin\mysqldump.exe

set DB_HOST=192.168.137.131
set DB_PORT=3306
set DB_USER=otics_tps
set DB_PASS=sukatno_ali
set DB_NAME=database_tps_energy_listrik

REM Tujuan penyimpanan hasil export
set OUTPUT_DIR=D:\on\Project_Server\Database
set TABLE_LIST=%TEMP%\tables_%DB_NAME%.txt

echo =====================================
echo EXPORT SEMUA TABEL KE FILE TERPISAH
echo Host     : %DB_HOST%
echo Port     : %DB_PORT%
echo Database : %DB_NAME%
echo Folder   : %OUTPUT_DIR%
echo =====================================
echo.

if not exist "%MYSQL_PATH%" (
    echo ERROR: mysql.exe tidak ditemukan di:
    echo %MYSQL_PATH%
    pause
    exit /b
)

if not exist "%MYSQLDUMP_PATH%" (
    echo ERROR: mysqldump.exe tidak ditemukan di:
    echo %MYSQLDUMP_PATH%
    pause
    exit /b
)

if not exist "%OUTPUT_DIR%" (
    mkdir "%OUTPUT_DIR%"
)

echo Mengambil daftar tabel dari database...

"%MYSQL_PATH%" ^
--host=%DB_HOST% ^
--port=%DB_PORT% ^
--user=%DB_USER% ^
--password=%DB_PASS% ^
--batch ^
--skip-column-names ^
-e "SHOW TABLES FROM `%DB_NAME%`;" > "%TABLE_LIST%"

if errorlevel 1 (
    echo.
    echo GAGAL mengambil daftar tabel.
    echo Cek host, port, username, password, atau nama database.
    pause
    exit /b
)

for %%A in ("%TABLE_LIST%") do (
    if %%~zA==0 (
        echo.
        echo GAGAL: daftar tabel kosong.
        echo Kemungkinan database tidak ada, tidak punya tabel, atau user tidak punya akses.
        pause
        exit /b
    )
)

echo Daftar tabel berhasil diambil.
echo.

for /f "usebackq delims=" %%t in ("%TABLE_LIST%") do (
    echo Export tabel: %%t

    "%MYSQLDUMP_PATH%" ^
    --host=%DB_HOST% ^
    --port=%DB_PORT% ^
    --user=%DB_USER% ^
    --password=%DB_PASS% ^
    --single-transaction ^
    --triggers ^
    %DB_NAME% %%t > "%OUTPUT_DIR%\%%t.sql"

    if errorlevel 1 (
        echo.
        echo GAGAL export tabel: %%t
        del "%TABLE_LIST%"
        pause
        exit /b
    ) else (
        echo BERHASIL: %OUTPUT_DIR%\%%t.sql
        echo.
    )
)

del "%TABLE_LIST%"

echo =====================================
echo SEMUA TABEL BERHASIL DIEXPORT
echo Folder hasil:
echo %OUTPUT_DIR%
echo =====================================
pause
