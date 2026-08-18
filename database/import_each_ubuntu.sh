#!/bin/bash

# ==============================
# SETTING MYSQL
# ==============================
MYSQL_PATH="/usr/bin/mysql"
DB_HOST="192.168.137.241"
DB_PORT="3306"
DB_USER="otics_tps"
DB_PASS="sukatno_ali"
DB_NAME="database_tps_energy_listrik"

echo "====================================="
echo "IMPORT SEMUA FILE SQL KE DATABASE"
echo "Host     : $DB_HOST"
echo "Port     : $DB_PORT"
echo "Database : $DB_NAME"
echo "====================================="
echo

# Cek mysql
if [ ! -x "$MYSQL_PATH" ]; then
    echo "ERROR: mysql tidak ditemukan di:"
    echo "$MYSQL_PATH"
    echo
    echo "Coba cek dengan:"
    echo "which mysql"
    exit 1
fi

# Supaya *.sql tidak dianggap sebagai nama file
# jika tidak ada file SQL
shopt -s nullglob

SQL_FILES=(*.sql)

if [ ${#SQL_FILES[@]} -eq 0 ]; then
    echo "ERROR: Tidak ada file .sql di folder ini."
    echo "Folder saat ini:"
    pwd
    exit 1
fi

# Import semua file .sql
for f in "${SQL_FILES[@]}"; do

    echo "Mengimport file: $f"

    if [ -z "$DB_PASS" ]; then

        "$MYSQL_PATH" \
            --host="$DB_HOST" \
            --port="$DB_PORT" \
            --user="$DB_USER" \
            "$DB_NAME" < "$f"

    else

        "$MYSQL_PATH" \
            --host="$DB_HOST" \
            --port="$DB_PORT" \
            --user="$DB_USER" \
            --password="$DB_PASS" \
            "$DB_NAME" < "$f"

    fi

    if [ $? -ne 0 ]; then
        echo
        echo "GAGAL import: $f"
        echo "Cek host, port, username, password, nama database, atau isi file SQL."
        exit 1
    else
        echo "BERHASIL import: $f"
        echo
    fi

done

echo "====================================="
echo "SEMUA FILE SQL BERHASIL DIIMPORT"
echo "====================================="
