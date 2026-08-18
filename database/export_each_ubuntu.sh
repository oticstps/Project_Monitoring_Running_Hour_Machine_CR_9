#!/bin/bash

# =====================================
# SETTING MYSQL
# =====================================
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

# =====================================
# CEK MYSQL CLIENT
# =====================================
if [ ! -x "$MYSQL_PATH" ]; then
    echo "ERROR: mysql client tidak ditemukan di:"
    echo "$MYSQL_PATH"
    echo
    echo "Install dengan:"
    echo "sudo apt update"
    echo "sudo apt install mysql-client -y"
    exit 1
fi

# =====================================
# CEK FILE SQL
# =====================================
shopt -s nullglob
sql_files=(*.sql)

if [ ${#sql_files[@]} -eq 0 ]; then
    echo "ERROR: Tidak ada file .sql di folder:"
    pwd
    exit 1
fi

echo "Ditemukan ${#sql_files[@]} file SQL."
echo

# =====================================
# IMPORT SEMUA FILE SQL
# =====================================
for file in "${sql_files[@]}"; do

    echo "-------------------------------------"
    echo "Mengimport file: $file"
    echo "-------------------------------------"

    if [ -z "$DB_PASS" ]; then

        "$MYSQL_PATH" \
            --host="$DB_HOST" \
            --port="$DB_PORT" \
            --user="$DB_USER" \
            "$DB_NAME" < "$file"

    else

        "$MYSQL_PATH" \
            --host="$DB_HOST" \
            --port="$DB_PORT" \
            --user="$DB_USER" \
            --password="$DB_PASS" \
            "$DB_NAME" < "$file"

    fi

    if [ $? -ne 0 ]; then
        echo
        echo "====================================="
        echo "GAGAL IMPORT: $file"
        echo "====================================="
        echo
        echo "Cek:"
        echo "- Host database"
        echo "- Port database"
        echo "- Username"
        echo "- Password"
        echo "- Nama database"
        echo "- Koneksi jaringan"
        echo "- Isi file SQL"
        exit 1
    else
        echo
        echo "BERHASIL import: $file"
        echo
    fi

done

echo "====================================="
echo "SEMUA FILE SQL BERHASIL DIIMPORT"
echo "====================================="
