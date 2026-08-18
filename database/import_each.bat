@echo off
setlocal enabledelayedexpansion

REM ==============================
REM SETTING MYSQL
REM ==============================
set MYSQL_PATH=C:\xampp\mysql\bin\mysql.exe
set DB_HOST=192.168.137.241
set DB_PORT=3306
set DB_USER=otics_tps
set DB_PASS=sukatno_ali
set DB_NAME=database_tps_energy_listrik

echo =====================================
echo IMPORT SEMUA FILE SQL KE DATABASE
echo Host     : %DB_HOST%
echo Port     : %DB_PORT%
echo Database : %DB_NAME%
echo =====================================
echo.

REM Cek mysql.exe
if not exist "%MYSQL_PATH%" (
    echo ERROR: mysql.exe tidak ditemukan di:
    echo %MYSQL_PATH%
    pause
    exit /b
)

REM Import semua file .sql
for %%f in (*.sql) do (
    echo Mengimport file: %%f

    if "%DB_PASS%"=="" (
        "%MYSQL_PATH%" --host=%DB_HOST% --port=%DB_PORT% --user=%DB_USER% %DB_NAME% < "%%f"
    ) else (
        "%MYSQL_PATH%" --host=%DB_HOST% --port=%DB_PORT% --user=%DB_USER% --password=%DB_PASS% %DB_NAME% < "%%f"
    )

    if errorlevel 1 (
        echo.
        echo GAGAL import: %%f
        echo Cek host, port, username, password, nama database, atau isi file SQL.
        pause
        exit /b
    ) else (
        echo BERHASIL import: %%f
        echo.
    )
)

echo =====================================
echo SEMUA FILE SQL BERHASIL DIIMPORT
echo =====================================
pause
