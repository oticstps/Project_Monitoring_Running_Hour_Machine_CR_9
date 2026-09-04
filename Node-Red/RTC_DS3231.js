[
    {
        "id": "cmt_main",
        "type": "comment",
        "z": "a1rtcflow",
        "name": "DS3231 I2C address 0x68 / 104, bus 1",
        "info": "",
        "x": 225,
        "y": 60,
        "wires": []
    },
    {
        "id": "inj_read",
        "type": "inject",
        "z": "a1rtcflow",
        "name": "Baca RTC setiap 1 detik",
        "props": [
            {
                "p": "payload"
            },
            {
                "p": "topic",
                "vt": "str"
            }
        ],
        "repeat": "1",
        "crontab": "",
        "once": true,
        "onceDelay": 0.5,
        "topic": "",
        "payload": "",
        "payloadType": "date",
        "x": 1155,
        "y": 215,
        "wires": [
            [
                "i2c_read"
            ]
        ]
    },
    {
        "id": "i2c_read",
        "type": "i2c in",
        "z": "a1rtcflow",
        "name": "Baca DS3231",
        "busno": "1",
        "address": "104",
        "command": "0",
        "count": "7",
        "x": 1125,
        "y": 260,
        "wires": [
            [
                "fn_decode"
            ]
        ]
    },
    {
        "id": "fn_decode",
        "type": "function",
        "z": "a1rtcflow",
        "name": "Decode + Simpan RTC",
        "func": "function bcdToDec(bcd) {\n    return ((bcd >> 4) * 10) + (bcd & 0x0F);\n}\n\nlet data = msg.payload;\n\nif (Buffer.isBuffer(data)) {\n    data = Array.from(data);\n}\n\nif (!Array.isArray(data) || data.length < 7) {\n    node.status({fill:\"red\", shape:\"ring\", text:\"data RTC tidak lengkap\"});\n    node.error(\"Data DS3231 tidak lengkap\", msg);\n    return null;\n}\n\nconst detik = bcdToDec(data[0] & 0x7F);\nconst menit = bcdToDec(data[1] & 0x7F);\n\nlet jam;\nif (data[2] & 0x40) {\n    // Jika RTC berada pada mode 12 jam, konversikan ke 24 jam.\n    const isPM = (data[2] & 0x20) !== 0;\n    let h12 = bcdToDec(data[2] & 0x1F);\n    if (h12 === 12) h12 = 0;\n    jam = h12 + (isPM ? 12 : 0);\n} else {\n    jam = bcdToDec(data[2] & 0x3F);\n}\n\nconst hariNomor = bcdToDec(data[3] & 0x07);\nconst tanggal = bcdToDec(data[4] & 0x3F);\nconst bulan = bcdToDec(data[5] & 0x1F);\nconst tahun = bcdToDec(data[6]) + 2000;\n\nconst namaHari = [\"\", \"Minggu\", \"Senin\", \"Selasa\", \"Rabu\", \"Kamis\", \"Jumat\", \"Sabtu\"];\nconst dua = n => String(n).padStart(2, \"0\");\n\nconst rtc = {\n    tahun,\n    bulan,\n    tanggal,\n    hariNomor,\n    hari: namaHari[hariNomor] || \"Tidak diketahui\",\n    jam,\n    menit,\n    detik,\n    tanggalFormat: `${tahun}-${dua(bulan)}-${dua(tanggal)}`,\n    waktuFormat: `${dua(jam)}:${dua(menit)}:${dua(detik)}`,\n    datetime: `${tahun}-${dua(bulan)}-${dua(tanggal)} ${dua(jam)}:${dua(menit)}:${dua(detik)}`\n};\n\nflow.set(\"rtcData\", rtc);\nmsg.payload = rtc;\n\nnode.status({\n    fill: \"green\",\n    shape: \"dot\",\n    text: rtc.datetime\n});\n\nreturn msg;",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 1350,
        "y": 265,
        "wires": [
            [
                "dbg_rtc",
                "f77e1153d44190e1"
            ]
        ]
    },
    {
        "id": "dbg_rtc",
        "type": "debug",
        "z": "a1rtcflow",
        "name": "Data RTC",
        "active": false,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "payload",
        "targetType": "msg",
        "statusVal": "",
        "statusType": "auto",
        "x": 1510,
        "y": 220,
        "wires": []
    },
    {
        "id": "inj_sync",
        "type": "inject",
        "z": "a1rtcflow",
        "name": "SET RTC dari waktu Raspberry Pi",
        "props": [
            {
                "p": "payload"
            }
        ],
        "repeat": "",
        "crontab": "",
        "once": false,
        "onceDelay": 0.1,
        "topic": "",
        "payload": "",
        "payloadType": "date",
        "x": 350,
        "y": 110,
        "wires": [
            [
                "fn_set_system"
            ]
        ]
    },
    {
        "id": "fn_set_system",
        "type": "function",
        "z": "a1rtcflow",
        "name": "Waktu Pi → BCD",
        "func": "function decToBCD(dec) {\n    return ((Math.floor(dec / 10) << 4) | (dec % 10));\n}\n\nconst now = new Date();\n\n// JavaScript getDay(): 0=Minggu ... 6=Sabtu.\n// Konvensi yang digunakan pada RTC: 1=Minggu ... 7=Sabtu.\nconst hari = now.getDay() + 1;\n\nmsg.payload = [\n    decToBCD(now.getSeconds()),\n    decToBCD(now.getMinutes()),\n    decToBCD(now.getHours()),\n    decToBCD(hari),\n    decToBCD(now.getDate()),\n    decToBCD(now.getMonth() + 1),\n    decToBCD(now.getFullYear() - 2000)\n];\n\nmsg.setText = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,\"0\")}-${String(now.getDate()).padStart(2,\"0\")} ${String(now.getHours()).padStart(2,\"0\")}:${String(now.getMinutes()).padStart(2,\"0\")}:${String(now.getSeconds()).padStart(2,\"0\")}`;\n\nnode.status({fill:\"blue\", shape:\"dot\", text:msg.setText});\nreturn msg;",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 400,
        "y": 150,
        "wires": [
            [
                "i2c_write_system"
            ]
        ]
    },
    {
        "id": "i2c_write_system",
        "type": "i2c out",
        "z": "a1rtcflow",
        "name": "Tulis RTC dari Pi",
        "busno": "1",
        "address": "104",
        "command": "0",
        "payload": "payload",
        "payloadType": "msg",
        "count": "7",
        "x": 610,
        "y": 150,
        "wires": [
            [
                "delay_verify_system",
                "dbg_set_system"
            ]
        ]
    },
    {
        "id": "dbg_set_system",
        "type": "debug",
        "z": "a1rtcflow",
        "name": "RTC disinkronkan dari Pi",
        "active": false,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "setText",
        "targetType": "msg",
        "statusVal": "",
        "statusType": "auto",
        "x": 840,
        "y": 130,
        "wires": []
    },
    {
        "id": "delay_verify_system",
        "type": "delay",
        "z": "a1rtcflow",
        "name": "Verifikasi 500 ms",
        "pauseType": "delay",
        "timeout": "500",
        "timeoutUnits": "milliseconds",
        "rate": "1",
        "nbRateUnits": "1",
        "rateUnits": "second",
        "randomFirst": "1",
        "randomLast": "5",
        "randomUnits": "seconds",
        "drop": false,
        "allowrate": false,
        "outputs": 1,
        "x": 820,
        "y": 170,
        "wires": [
            [
                "i2c_read"
            ]
        ]
    },
    {
        "id": "http_get",
        "type": "http in",
        "z": "a1rtcflow",
        "name": "Halaman RTC",
        "url": "/rtc",
        "method": "get",
        "upload": false,
        "swaggerDoc": "",
        "x": 115,
        "y": 210,
        "wires": [
            [
                "fn_page"
            ]
        ]
    },
    {
        "id": "fn_page",
        "type": "function",
        "z": "a1rtcflow",
        "name": "Buat Halaman Web",
        "func": "const rtc = flow.get(\"rtcData\");\nconst now = new Date();\n\nconst dua = n => String(n).padStart(2, \"0\");\n\nlet tahun = now.getFullYear();\nlet bulan = now.getMonth() + 1;\nlet tanggal = now.getDate();\nlet jam = now.getHours();\nlet menit = now.getMinutes();\nlet detik = now.getSeconds();\n\nlet rtcText = \"Belum ada data. Tunggu pembacaan RTC.\";\nlet rtcHari = \"-\";\n\nif (rtc) {\n    rtcText = rtc.datetime;\n    rtcHari = rtc.hari;\n    tahun = rtc.tahun;\n    bulan = rtc.bulan;\n    tanggal = rtc.tanggal;\n    jam = rtc.jam;\n    menit = rtc.menit;\n    detik = rtc.detik;\n}\n\nconst systemText =\n    `${now.getFullYear()}-${dua(now.getMonth()+1)}-${dua(now.getDate())} ` +\n    `${dua(now.getHours())}:${dua(now.getMinutes())}:${dua(now.getSeconds())}`;\n\nmsg.headers = {\"Content-Type\":\"text/html; charset=utf-8\"};\n\nmsg.payload = `<!DOCTYPE html>\n<html lang=\"id\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<title>RTC DS3231</title>\n<style>\nbody {\n    font-family: Arial, sans-serif;\n    background: #f3f5f7;\n    margin: 0;\n    padding: 24px;\n}\n.container {\n    max-width: 720px;\n    margin: auto;\n}\n.card {\n    background: white;\n    border-radius: 14px;\n    padding: 22px;\n    margin-bottom: 18px;\n    box-shadow: 0 2px 10px rgba(0,0,0,.08);\n}\nh1 { margin-top: 0; }\n.clock {\n    font-size: 30px;\n    font-weight: bold;\n    margin: 8px 0;\n}\n.small {\n    color: #555;\n}\n.grid {\n    display: grid;\n    grid-template-columns: repeat(2, 1fr);\n    gap: 12px;\n}\nlabel {\n    display: block;\n    font-size: 13px;\n    font-weight: bold;\n    margin-bottom: 5px;\n}\ninput {\n    width: 100%;\n    box-sizing: border-box;\n    padding: 10px;\n    font-size: 16px;\n}\nbutton {\n    border: 0;\n    border-radius: 8px;\n    padding: 12px 18px;\n    font-size: 16px;\n    cursor: pointer;\n    margin-top: 14px;\n}\n.primary {\n    background: #146cff;\n    color: white;\n}\n.secondary {\n    background: #222;\n    color: white;\n}\n@media (max-width:600px) {\n    .grid { grid-template-columns: 1fr; }\n}\n</style>\n</head>\n<body>\n<div class=\"container\">\n    <div class=\"card\">\n        <h1>RTC DS3231</h1>\n        <div class=\"small\">Waktu RTC</div>\n        <div class=\"clock\" id=\"rtcClock\">${rtcText}</div>\n        <div>Hari: <strong id=\"rtcHari\">${rtcHari}</strong></div>\n        <p class=\"small\">Waktu sistem Raspberry Pi: <span id=\"systemClock\">${systemText}</span></p>\n\n        <form action=\"/rtc/sync\" method=\"post\">\n            <button class=\"secondary\" type=\"submit\">Sinkronkan dari Raspberry Pi</button>\n        </form>\n    </div>\n\n    <div class=\"card\">\n        <h2>Setting Waktu Manual</h2>\n        <form action=\"/rtc/set\" method=\"post\">\n            <div class=\"grid\">\n                <div>\n                    <label>Tahun</label>\n                    <input type=\"number\" name=\"tahun\" min=\"2000\" max=\"2099\" value=\"${tahun}\" required>\n                </div>\n                <div>\n                    <label>Bulan</label>\n                    <input type=\"number\" name=\"bulan\" min=\"1\" max=\"12\" value=\"${bulan}\" required>\n                </div>\n                <div>\n                    <label>Tanggal</label>\n                    <input type=\"number\" name=\"tanggal\" min=\"1\" max=\"31\" value=\"${tanggal}\" required>\n                </div>\n                <div>\n                    <label>Jam</label>\n                    <input type=\"number\" name=\"jam\" min=\"0\" max=\"23\" value=\"${jam}\" required>\n                </div>\n                <div>\n                    <label>Menit</label>\n                    <input type=\"number\" name=\"menit\" min=\"0\" max=\"59\" value=\"${menit}\" required>\n                </div>\n                <div>\n                    <label>Detik</label>\n                    <input type=\"number\" name=\"detik\" min=\"0\" max=\"59\" value=\"${detik}\" required>\n                </div>\n            </div>\n            <button class=\"primary\" type=\"submit\">Simpan ke RTC</button>\n        </form>\n    </div>\n</div>\n<script>\nasync function updateStatus() {\n    try {\n        const r = await fetch(\"/rtc/data\", {cache:\"no-store\"});\n        const d = await r.json();\n        if (d.rtc) {\n            document.getElementById(\"rtcClock\").textContent = d.rtc.datetime;\n            document.getElementById(\"rtcHari\").textContent = d.rtc.hari;\n        }\n        document.getElementById(\"systemClock\").textContent = d.system;\n    } catch (e) {}\n}\nsetInterval(updateStatus, 1000);\nupdateStatus();\n</script>\n</body>\n</html>`;\n\nreturn msg;",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 335,
        "y": 210,
        "wires": [
            [
                "http_resp_page"
            ]
        ]
    },
    {
        "id": "http_resp_page",
        "type": "http response",
        "z": "a1rtcflow",
        "name": "Kirim halaman",
        "statusCode": "",
        "headers": {},
        "x": 595,
        "y": 205,
        "wires": []
    },
    {
        "id": "http_post_manual",
        "type": "http in",
        "z": "a1rtcflow",
        "name": "Set Manual",
        "url": "/rtc/set",
        "method": "post",
        "upload": false,
        "swaggerDoc": "",
        "x": 115,
        "y": 250,
        "wires": [
            [
                "fn_manual"
            ]
        ]
    },
    {
        "id": "fn_manual",
        "type": "function",
        "z": "a1rtcflow",
        "name": "Validasi Manual → BCD",
        "func": "function decToBCD(dec) {\n    return ((Math.floor(dec / 10) << 4) | (dec % 10));\n}\n\nfunction parseForm(data) {\n    if (Buffer.isBuffer(data)) data = data.toString(\"utf8\");\n    if (typeof data !== \"string\") return data || {};\n\n    const obj = {};\n    data.split(\"&\").forEach(pair => {\n        const p = pair.split(\"=\");\n        const key = decodeURIComponent((p[0] || \"\").replace(/\\+/g, \" \"));\n        const val = decodeURIComponent((p.slice(1).join(\"=\") || \"\").replace(/\\+/g, \" \"));\n        if (key) obj[key] = val;\n    });\n    return obj;\n}\n\nconst p = parseForm(msg.payload);\n\nconst tahun = Number(p.tahun);\nconst bulan = Number(p.bulan);\nconst tanggal = Number(p.tanggal);\nconst jam = Number(p.jam);\nconst menit = Number(p.menit);\nconst detik = Number(p.detik);\n\nfunction gagal(teks) {\n    msg.statusCode = 400;\n    msg.headers = {\"Content-Type\":\"text/html; charset=utf-8\"};\n    msg.payload = `<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>RTC Error</title></head>\n    <body style=\"font-family:Arial;padding:30px\">\n    <h2>Setting RTC gagal</h2>\n    <p>${teks}</p>\n    <p><a href=\"/rtc\">Kembali</a></p>\n    </body></html>`;\n    return [null, msg];\n}\n\nif (![tahun,bulan,tanggal,jam,menit,detik].every(Number.isInteger)) {\n    return gagal(\"Semua nilai harus berupa angka bulat.\");\n}\n\nif (tahun < 2000 || tahun > 2099) return gagal(\"Tahun harus 2000 sampai 2099.\");\nif (bulan < 1 || bulan > 12) return gagal(\"Bulan harus 1 sampai 12.\");\nif (jam < 0 || jam > 23) return gagal(\"Jam harus 0 sampai 23.\");\nif (menit < 0 || menit > 59) return gagal(\"Menit harus 0 sampai 59.\");\nif (detik < 0 || detik > 59) return gagal(\"Detik harus 0 sampai 59.\");\n\nconst cek = new Date(tahun, bulan - 1, tanggal, jam, menit, detik);\n\nif (\n    cek.getFullYear() !== tahun ||\n    cek.getMonth() !== bulan - 1 ||\n    cek.getDate() !== tanggal\n) {\n    return gagal(\"Tanggal kalender tidak valid.\");\n}\n\nconst hari = cek.getDay() + 1;\n\nmsg.payload = [\n    decToBCD(detik),\n    decToBCD(menit),\n    decToBCD(jam),\n    decToBCD(hari),\n    decToBCD(tanggal),\n    decToBCD(bulan),\n    decToBCD(tahun - 2000)\n];\n\nmsg.setText =\n    `${tahun}-${String(bulan).padStart(2,\"0\")}-${String(tanggal).padStart(2,\"0\")} ` +\n    `${String(jam).padStart(2,\"0\")}:${String(menit).padStart(2,\"0\")}:${String(detik).padStart(2,\"0\")}`;\n\nreturn [msg, null];",
        "outputs": 2,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 355,
        "y": 250,
        "wires": [
            [
                "i2c_write_manual"
            ],
            [
                "http_resp_error"
            ]
        ]
    },
    {
        "id": "http_resp_error",
        "type": "http response",
        "z": "a1rtcflow",
        "name": "Respons error",
        "statusCode": "",
        "headers": {},
        "x": 595,
        "y": 275,
        "wires": []
    },
    {
        "id": "i2c_write_manual",
        "type": "i2c out",
        "z": "a1rtcflow",
        "name": "Tulis RTC Manual",
        "busno": "1",
        "address": "104",
        "command": "0",
        "payload": "payload",
        "payloadType": "msg",
        "count": "7",
        "x": 605,
        "y": 240,
        "wires": [
            [
                "fn_success_manual",
                "delay_verify_manual"
            ]
        ]
    },
    {
        "id": "fn_success_manual",
        "type": "function",
        "z": "a1rtcflow",
        "name": "Respons Manual Berhasil",
        "func": "msg.statusCode = 200;\nmsg.headers = {\"Content-Type\":\"text/html; charset=utf-8\"};\nmsg.payload = `<!DOCTYPE html>\n<html><head>\n<meta charset=\"utf-8\">\n<meta http-equiv=\"refresh\" content=\"1;url=/rtc\">\n<title>RTC tersimpan</title>\n</head>\n<body style=\"font-family:Arial;padding:30px\">\n<h2>Waktu RTC berhasil disimpan</h2>\n<p>${msg.setText}</p>\n<p>Halaman akan kembali ke status RTC.</p>\n<p><a href=\"/rtc\">Kembali sekarang</a></p>\n</body></html>`;\nreturn msg;",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 850,
        "y": 215,
        "wires": [
            [
                "http_resp_manual"
            ]
        ]
    },
    {
        "id": "http_resp_manual",
        "type": "http response",
        "z": "a1rtcflow",
        "name": "Kirim respons manual",
        "statusCode": "",
        "headers": {},
        "x": 1135,
        "y": 160,
        "wires": []
    },
    {
        "id": "delay_verify_manual",
        "type": "delay",
        "z": "a1rtcflow",
        "name": "Baca ulang 300 ms",
        "pauseType": "delay",
        "timeout": "300",
        "timeoutUnits": "milliseconds",
        "rate": "1",
        "nbRateUnits": "1",
        "rateUnits": "second",
        "randomFirst": "1",
        "randomLast": "5",
        "randomUnits": "seconds",
        "drop": false,
        "allowrate": false,
        "outputs": 1,
        "x": 830,
        "y": 250,
        "wires": [
            [
                "i2c_read"
            ]
        ]
    },
    {
        "id": "http_post_sync",
        "type": "http in",
        "z": "a1rtcflow",
        "name": "Sync dari Web",
        "url": "/rtc/sync",
        "method": "post",
        "upload": false,
        "swaggerDoc": "",
        "x": 125,
        "y": 290,
        "wires": [
            [
                "fn_sync_web"
            ]
        ]
    },
    {
        "id": "fn_sync_web",
        "type": "function",
        "z": "a1rtcflow",
        "name": "Waktu Pi → BCD (Web)",
        "func": "function decToBCD(dec) {\n    return ((Math.floor(dec / 10) << 4) | (dec % 10));\n}\n\nconst now = new Date();\nconst hari = now.getDay() + 1;\n\nmsg.payload = [\n    decToBCD(now.getSeconds()),\n    decToBCD(now.getMinutes()),\n    decToBCD(now.getHours()),\n    decToBCD(hari),\n    decToBCD(now.getDate()),\n    decToBCD(now.getMonth() + 1),\n    decToBCD(now.getFullYear() - 2000)\n];\n\nmsg.setText =\n    `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,\"0\")}-${String(now.getDate()).padStart(2,\"0\")} ` +\n    `${String(now.getHours()).padStart(2,\"0\")}:${String(now.getMinutes()).padStart(2,\"0\")}:${String(now.getSeconds()).padStart(2,\"0\")}`;\n\nreturn msg;",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 355,
        "y": 290,
        "wires": [
            [
                "i2c_write_websync"
            ]
        ]
    },
    {
        "id": "i2c_write_websync",
        "type": "i2c out",
        "z": "a1rtcflow",
        "name": "Tulis RTC Sync Web",
        "busno": "1",
        "address": "104",
        "command": "0",
        "payload": "payload",
        "payloadType": "msg",
        "count": "7",
        "x": 615,
        "y": 310,
        "wires": [
            [
                "fn_success_sync",
                "delay_verify_web"
            ]
        ]
    },
    {
        "id": "fn_success_sync",
        "type": "function",
        "z": "a1rtcflow",
        "name": "Respons Sync Berhasil",
        "func": "msg.statusCode = 200;\nmsg.headers = {\"Content-Type\":\"text/html; charset=utf-8\"};\nmsg.payload = `<!DOCTYPE html>\n<html><head>\n<meta charset=\"utf-8\">\n<meta http-equiv=\"refresh\" content=\"1;url=/rtc\">\n<title>RTC sinkron</title>\n</head>\n<body style=\"font-family:Arial;padding:30px\">\n<h2>RTC berhasil disinkronkan</h2>\n<p>Waktu Raspberry Pi: ${msg.setText}</p>\n<p><a href=\"/rtc\">Kembali</a></p>\n</body></html>`;\nreturn msg;",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 850,
        "y": 295,
        "wires": [
            [
                "http_resp_sync"
            ]
        ]
    },
    {
        "id": "http_resp_sync",
        "type": "http response",
        "z": "a1rtcflow",
        "name": "Kirim respons sync",
        "statusCode": "",
        "headers": {},
        "x": 1140,
        "y": 330,
        "wires": []
    },
    {
        "id": "delay_verify_web",
        "type": "delay",
        "z": "a1rtcflow",
        "name": "Verifikasi sync 300 ms",
        "pauseType": "delay",
        "timeout": "300",
        "timeoutUnits": "milliseconds",
        "rate": "1",
        "nbRateUnits": "1",
        "rateUnits": "second",
        "randomFirst": "1",
        "randomLast": "5",
        "randomUnits": "seconds",
        "drop": false,
        "allowrate": false,
        "outputs": 1,
        "x": 840,
        "y": 330,
        "wires": [
            [
                "i2c_read"
            ]
        ]
    },
    {
        "id": "http_get_data",
        "type": "http in",
        "z": "a1rtcflow",
        "name": "Data RTC JSON",
        "url": "/rtc/data",
        "method": "get",
        "upload": false,
        "swaggerDoc": "",
        "x": 125,
        "y": 330,
        "wires": [
            [
                "fn_data_json"
            ]
        ]
    },
    {
        "id": "fn_data_json",
        "type": "function",
        "z": "a1rtcflow",
        "name": "Buat JSON Status",
        "func": "const rtc = flow.get(\"rtcData\") || null;\nconst now = new Date();\nconst dua = n => String(n).padStart(2, \"0\");\nconst system =\n    `${now.getFullYear()}-${dua(now.getMonth()+1)}-${dua(now.getDate())} ` +\n    `${dua(now.getHours())}:${dua(now.getMinutes())}:${dua(now.getSeconds())}`;\n\nmsg.headers = {\n    \"Content-Type\":\"application/json; charset=utf-8\",\n    \"Cache-Control\":\"no-store\"\n};\nmsg.payload = JSON.stringify({rtc, system});\nreturn msg;",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 335,
        "y": 330,
        "wires": [
            [
                "http_resp_data"
            ]
        ]
    },
    {
        "id": "http_resp_data",
        "type": "http response",
        "z": "a1rtcflow",
        "name": "Kirim JSON",
        "statusCode": "",
        "headers": {},
        "x": 585,
        "y": 345,
        "wires": []
    },
    {
        "id": "f77e1153d44190e1",
        "type": "link out",
        "z": "a1rtcflow",
        "name": "date_time_rtc",
        "mode": "link",
        "links": [
            "ae0134d5355f9f6b",
            "6af6547324e38efd"
        ],
        "x": 1465,
        "y": 305,
        "wires": []
    },
    {
        "id": "61122eaeee8b6ffa",
        "type": "global-config",
        "env": [],
        "modules": {
            "node-red-contrib-i2c": "0.9.0"
        }
    }
]
