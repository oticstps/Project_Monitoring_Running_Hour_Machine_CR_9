[
    {
        "id": "6dd221a23079eec7",
        "type": "function",
        "z": "a64f6aa777a995f8",
        "name": "Request Modbus ID 1",
        "func": "// =====================================================\n// REQUEST AWAL - MODBUS SLAVE ID 1\n// ID 1 = FC2 Read Discrete Inputs, address 0, quantity 16\n// =====================================================\n\nmsg.payload = {\n    fc: 2,\n    unitid: 1,\n    address: 0,\n    quantity: 16\n};\n\nmsg.pollUnit = 1;\nmsg.topic = \"request_unit_1\";\nflow.set(\"lastPollUnit\", 1);\n\nreturn msg;",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 220,
        "y": 185,
        "wires": [
            [
                "95fe4fef1643b1f3"
            ]
        ]
    },
    {
        "id": "0ba97532d5ad78b4",
        "type": "function",
        "z": "a64f6aa777a995f8",
        "name": "Process Output Baru + Next ID",
        "func": "// =====================================================================\n// PROSES OUTPUT BARU MODBUS SECARA BERURUTAN\n//\n// ID 1 : FC2  Discrete Input,  16 nilai boolean\n// ID 2 : FC4  Input Register,   8 nilai register\n// ID 3 : FC2  Discrete Input,   8 nilai boolean\n//\n// Frame internal dipertahankan agar kompatibel dengan parser berikutnya:\n// ID1 -> R9A + 16 bit + R9B\n// ID2 -> R9C +  8 bit + R9D\n// ID3 -> R9E +  8 bit + R9F\n//\n// KHUSUS ID2:\n// Dari data aktual, level LOW berada sekitar 0..12 dan level HIGH sekitar\n// 9734..9769. Threshold 5000 dipakai untuk mengubah register menjadi 0/1.\n// Raw register asli tetap disimpan pada msg.rawRegisters.\n//\n// Urutan polling: ID1 -> ID2 -> ID3 -> ID1\n// =====================================================================\n\nconst ID2_HIGH_THRESHOLD = 5000;\n\nfunction ambilArray(msg) {\n    if (Array.isArray(msg.payload)) return msg.payload;\n    if (msg.payload && Array.isArray(msg.payload.data)) return msg.payload.data;\n    if (Array.isArray(msg.data)) return msg.data;\n    return null;\n}\n\nfunction configUnit(unitid) {\n    if (unitid === 1) return { fc: 2, quantity: 16 };\n    if (unitid === 2) return { fc: 4, quantity: 8 };\n    if (unitid === 3) return { fc: 2, quantity: 8 };\n    return null;\n}\n\nfunction buatRequest(unitid) {\n    const cfg = configUnit(unitid);\n    if (!cfg) return null;\n\n    flow.set(\"lastPollUnit\", unitid);\n\n    return {\n        payload: {\n            fc: cfg.fc,\n            unitid: unitid,\n            address: 0,\n            quantity: cfg.quantity\n        },\n        pollUnit: unitid,\n        topic: \"request_unit_\" + unitid\n    };\n}\n\nconst unit = Number(msg.pollUnit);\nconst inputData = ambilArray(msg);\n\nif (!inputData) {\n    node.warn(\"Data respons Modbus bukan array untuk ID \" + unit);\n    return [null, null];\n}\n\nlet bits = [];\nlet outputMsg = null;\n\nif (unit === 1) {\n    if (inputData.length < 16) {\n        node.warn(\"ID1: data kurang dari 16 item\");\n        return [null, buatRequest(2)];\n    }\n\n    bits = inputData.slice(0, 16).map(v =>\n        (v === true || v === 1 || v === \"1\") ? \"1\" : \"0\"\n    );\n\n    outputMsg = {\n        payload: \"R9A\" + bits.join(\"\") + \"R9B\",\n        topic: \"input_id_1\",\n        unitid: 1,\n        pollUnit: 1,\n        dataLength: inputData.length,\n        rawInput: inputData.slice(0, 16)\n    };\n\n    node.status({ fill: \"green\", shape: \"dot\", text: \"ID1 FC2 OK -> ID2 FC4\" });\n    return [outputMsg, buatRequest(2)];\n}\n\nif (unit === 2) {\n    if (inputData.length < 8) {\n        node.warn(\"ID2: data kurang dari 8 register\");\n        return [null, buatRequest(3)];\n    }\n\n    const registers = inputData.slice(0, 8).map(v => Number(v) || 0);\n\n    bits = registers.map(v =>\n        v >= ID2_HIGH_THRESHOLD ? \"1\" : \"0\"\n    );\n\n    outputMsg = {\n        payload: \"R9C\" + bits.join(\"\") + \"R9D\",\n        topic: \"input_id_2\",\n        unitid: 2,\n        pollUnit: 2,\n        dataLength: registers.length,\n        rawRegisters: registers,\n        threshold: ID2_HIGH_THRESHOLD\n    };\n\n    node.status({\n        fill: \"green\",\n        shape: \"dot\",\n        text: \"ID2 FC4 OK \" + bits.join(\"\") + \" -> ID3 FC2\"\n    });\n\n    return [outputMsg, buatRequest(3)];\n}\n\nif (unit === 3) {\n    if (inputData.length < 8) {\n        node.warn(\"ID3: data kurang dari 8 item\");\n        return [null, buatRequest(1)];\n    }\n\n    bits = inputData.slice(0, 8).map(v =>\n        (v === true || v === 1 || v === \"1\") ? \"1\" : \"0\"\n    );\n\n    outputMsg = {\n        payload: \"R9E\" + bits.join(\"\") + \"R9F\",\n        topic: \"input_id_3\",\n        unitid: 3,\n        pollUnit: 3,\n        dataLength: inputData.length,\n        rawInput: inputData.slice(0, 8)\n    };\n\n    node.status({ fill: \"green\", shape: \"dot\", text: \"ID3 FC2 OK -> ID1 FC2\" });\n    return [outputMsg, buatRequest(1)];\n}\n\nnode.warn(\"pollUnit tidak diketahui: \" + msg.pollUnit);\nreturn [null, null];",
        "outputs": 2,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 210,
        "y": 240,
        "wires": [
            [
                "5b99f5b3019e27a2"
            ],
            [
                "7b07aa801bbf7883"
            ]
        ]
    },
    {
        "id": "7b07aa801bbf7883",
        "type": "delay",
        "z": "a64f6aa777a995f8",
        "name": "Jeda antar Slave 333.33 ms",
        "pauseType": "delay",
        "timeout": "333.33",
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
        "x": 240,
        "y": 280,
        "wires": [
            [
                "95fe4fef1643b1f3"
            ]
        ]
    },
    {
        "id": "5b99f5b3019e27a2",
        "type": "switch",
        "z": "a64f6aa777a995f8",
        "name": "Pisahkan ID 1 / ID 2 / ID 3",
        "property": "unitid",
        "propertyType": "msg",
        "rules": [
            {
                "t": "eq",
                "v": "1",
                "vt": "num"
            },
            {
                "t": "eq",
                "v": "2",
                "vt": "num"
            },
            {
                "t": "eq",
                "v": "3",
                "vt": "num"
            }
        ],
        "checkall": "true",
        "repair": false,
        "outputs": 3,
        "x": 560,
        "y": 255,
        "wires": [
            [
                "8558205d6b1e1e62"
            ],
            [
                "dab3e3a9e4c0b9ea"
            ],
            [
                "72427c994d277dab"
            ]
        ]
    },
    {
        "id": "0de1ed2e99fb8f1c",
        "type": "catch",
        "z": "a64f6aa777a995f8",
        "name": "Catch Modbus Error",
        "scope": [
            "95fe4fef1643b1f3"
        ],
        "uncaught": false,
        "x": 305,
        "y": 395,
        "wires": [
            [
                "5e7128ffcbd648ee"
            ]
        ]
    },
    {
        "id": "5e7128ffcbd648ee",
        "type": "function",
        "z": "a64f6aa777a995f8",
        "name": "Recovery -> Lanjut ID Berikutnya",
        "func": "// ===============================================================\n// RECOVERY TIMEOUT / ERROR MODBUS\n// Tetap lanjut ke slave berikutnya dengan FC yang benar:\n// ID1 = FC2 qty16, ID2 = FC4 qty8, ID3 = FC2 qty8\n// ===============================================================\n\nlet now = Date.now();\nlet lastRecovery = context.get(\"lastRecovery\") || 0;\n\nif ((now - lastRecovery) < 1500) {\n    return null;\n}\ncontext.set(\"lastRecovery\", now);\n\nconst failedUnit = Number(msg.pollUnit || flow.get(\"lastPollUnit\") || 1);\nlet nextUnit = 1;\n\nif (failedUnit === 1) nextUnit = 2;\nelse if (failedUnit === 2) nextUnit = 3;\nelse nextUnit = 1;\n\nfunction configUnit(unitid) {\n    if (unitid === 1) return { fc: 2, quantity: 16 };\n    if (unitid === 2) return { fc: 4, quantity: 8 };\n    return { fc: 2, quantity: 8 };\n}\n\nconst cfg = configUnit(nextUnit);\n\nif (msg.error) {\n    node.warn(\"Modbus ID \" + failedUnit + \" gagal: \" + (msg.error.message || msg.error));\n}\n\nmsg.payload = {\n    fc: cfg.fc,\n    unitid: nextUnit,\n    address: 0,\n    quantity: cfg.quantity\n};\n\nmsg.pollUnit = nextUnit;\nmsg.topic = \"recovery_after_id_\" + failedUnit + \"_request_unit_\" + nextUnit;\n\nflow.set(\"lastPollUnit\", nextUnit);\ndelete msg.error;\n\nnode.status({\n    fill: \"yellow\",\n    shape: \"ring\",\n    text: \"ID\" + failedUnit + \" gagal -> ID\" + nextUnit + \" FC\" + cfg.fc\n});\n\nreturn msg;",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 355,
        "y": 440,
        "wires": [
            [
                "0ea4cc7fb68f0710"
            ]
        ]
    },
    {
        "id": "0ea4cc7fb68f0710",
        "type": "delay",
        "z": "a64f6aa777a995f8",
        "name": "Recovery Delay 2 detik",
        "pauseType": "delay",
        "timeout": "2",
        "timeoutUnits": "seconds",
        "rate": "1",
        "nbRateUnits": "1",
        "rateUnits": "second",
        "randomFirst": "1",
        "randomLast": "5",
        "randomUnits": "seconds",
        "drop": false,
        "allowrate": false,
        "outputs": 1,
        "x": 325,
        "y": 485,
        "wires": [
            [
                "95fe4fef1643b1f3"
            ]
        ]
    },
    {
        "id": "24dd8dacb6e47151",
        "type": "link in",
        "z": "a64f6aa777a995f8",
        "name": "link in 1",
        "links": [
            "f77e1153d44190e1"
        ],
        "x": 925,
        "y": 475,
        "wires": [
            [
                "6de453c2929181a4",
                "1c2196d3176dda2a"
            ]
        ]
    },
    {
        "id": "6de453c2929181a4",
        "type": "debug",
        "z": "a64f6aa777a995f8",
        "name": "debug 1",
        "active": false,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "false",
        "statusVal": "",
        "statusType": "auto",
        "x": 1040,
        "y": 435,
        "wires": []
    },
    {
        "id": "95fe4fef1643b1f3",
        "type": "modbus-flex-getter",
        "z": "a64f6aa777a995f8",
        "name": "",
        "showStatusActivities": true,
        "showErrors": true,
        "showWarnings": true,
        "logIOActivities": false,
        "server": "17ad98e120fc22d4",
        "useIOFile": false,
        "ioFile": "",
        "useIOForPayload": false,
        "emptyMsgOnFail": false,
        "keepMsgProperties": true,
        "delayOnStart": false,
        "enableDeformedMessages": false,
        "startDelayTime": "",
        "x": 540,
        "y": 190,
        "wires": [
            [
                "0ba97532d5ad78b4"
            ],
            []
        ]
    },
    {
        "id": "bddaf1bad6f217f0",
        "type": "inject",
        "z": "a64f6aa777a995f8",
        "name": "START Polling",
        "props": [
            {
                "p": "payload"
            },
            {
                "p": "topic",
                "vt": "str"
            }
        ],
        "repeat": "",
        "crontab": "",
        "once": true,
        "onceDelay": "1",
        "topic": "",
        "payload": "",
        "payloadType": "date",
        "x": 220,
        "y": 120,
        "wires": [
            [
                "6dd221a23079eec7"
            ]
        ]
    },
    {
        "id": "8558205d6b1e1e62",
        "type": "function",
        "z": "a64f6aa777a995f8",
        "name": "parsing id 1",
        "func": "let input = msg.payload.toString().trim();\n\nlet mapping = {\n    \"R9A\": {\n        end: \"R9B\",\n        tag: [\n            \"IMC_21_run\",\n            \"IMC_21_trouble\",\n            \"IMC_20_run\",\n            \"IMC_20_trouble\",\n            \"IMC_19_run\",\n            \"IMC_19_trouble\",\n            \"IMC_103_run\",\n            \"IMC_103_trouble\",\n            \"IMC_94_run\",\n            \"IMC_94_trouble\",\n            \"IMC_61_run\",\n            \"IMC_61_trouble\",\n            \"IMC_251_run\",\n            \"IMC_251_trouble\",\n            \"IDH_23_run\",\n            \"IDH_23_trouble\"\n        ]\n    }\n};\n\n\n// cek awalan\nlet header = input.substring(0, 3);\n\n\nif (mapping[header]) {\n\n    let footer = mapping[header].end;\n\n    // cek akhiran\n    if (input.endsWith(footer)) {\n\n        // ambil data tengah\n        let rawData = input.substring(\n            3,\n            input.length - 3\n        );\n\n\n        // pecah tiap char\n        let bit = rawData.split(\"\");\n\n\n        let result = {};\n\n        mapping[header].tag.forEach((name, index) => {\n\n            result[name] = Number(bit[index] || 0);\n\n        });\n\n\n        msg.payload = {\n            slave: header,\n            raw: rawData,\n            data: result\n        };\n\n\n        return msg;\n\n    }\n\n}\n\n\n// jika tidak cocok\nmsg.payload = {\n    error: \"Format tidak dikenali\",\n    raw: input\n};\n\nreturn msg;",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 815,
        "y": 245,
        "wires": [
            [
                "1d4ab3c607c1ab5c"
            ]
        ]
    },
    {
        "id": "dab3e3a9e4c0b9ea",
        "type": "function",
        "z": "a64f6aa777a995f8",
        "name": "parsing id 2",
        "func": "// =====================================================\n// PARSER ID 2\n// R9C + 8 bit hasil konversi Input Register + R9D\n// rawRegisters berisi delapan nilai register asli ID2.\n// =====================================================\n\nlet input = msg.payload.toString().trim();\nconst header = \"R9C\";\nconst footer = \"R9D\";\n\nconst tags = [\n    \"IMC_29_run\",\n    \"IMC_29_trouble\",\n    \"IMC_40_run\",\n    \"IMC_40_trouble\",\n    \"IMC_28_run\",\n    \"IMC_28_trouble\",\n    \"IMC_10_run\",\n    \"IMC_10_trouble\"\n];\n\nif (input.startsWith(header) && input.endsWith(footer)) {\n    const rawData = input.substring(header.length, input.length - footer.length);\n    const bits = rawData.split(\"\");\n    const result = {};\n\n    tags.forEach((tag, index) => {\n        result[tag] = Number(bits[index] || 0);\n    });\n\n    msg.payload = {\n        slave: header,\n        raw_data: rawData,\n        jumlah_data: bits.length,\n        raw_registers: Array.isArray(msg.rawRegisters) ? msg.rawRegisters : [],\n        threshold: msg.threshold,\n        device: result\n    };\n\n    return msg;\n}\n\nmsg.payload = {\n    error: \"Frame ID 2 tidak sesuai\",\n    data_masuk: input\n};\nreturn msg;",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 815,
        "y": 285,
        "wires": [
            [
                "1d4ab3c607c1ab5c"
            ]
        ]
    },
    {
        "id": "72427c994d277dab",
        "type": "function",
        "z": "a64f6aa777a995f8",
        "name": "parsing id 3",
        "func": "// =====================================================\n// PARSER ID 3\n// R9E + 8 bit + R9F\n//\n// Bit 0-1 : IMC-45  RUN / TROUBLE\n// Bit 2-3 : IMC-229 RUN / TROUBLE\n// Bit 4-7 : RESERVED (tetap disimpan, tidak dipetakan ke mesin)\n// =====================================================\n\nlet input = msg.payload.toString().trim();\nconst header = \"R9E\";\nconst footer = \"R9F\";\n\nif (input.startsWith(header) && input.endsWith(footer)) {\n    const rawData = input.substring(header.length, input.length - footer.length);\n    const bits = rawData.split(\"\");\n\n    msg.payload = {\n        slave: header,\n        raw_data: rawData,\n        jumlah_data: bits.length,\n        reserved: rawData.substring(4, 8),\n        device: {\n            IMC_45_run: Number(bits[0] || 0),\n            IMC_45_trouble: Number(bits[1] || 0),\n            IMC_229_run: Number(bits[2] || 0),\n            IMC_229_trouble: Number(bits[3] || 0)\n        }\n    };\n\n    return msg;\n}\n\nmsg.payload = {\n    error: \"Frame ID 3 tidak sesuai\",\n    data_masuk: input\n};\nreturn msg;",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 815,
        "y": 325,
        "wires": [
            [
                "1d4ab3c607c1ab5c"
            ]
        ]
    },
    {
        "id": "9ff362f6bc229855",
        "type": "mysql",
        "z": "a64f6aa777a995f8",
        "mydb": "19f621ac54f58e61",
        "name": "",
        "x": 1905,
        "y": 170,
        "wires": [
            []
        ]
    },
    {
        "id": "23bf20b93e855b4f",
        "type": "comment",
        "z": "a64f6aa777a995f8",
        "name": "MODBUS IDs + RTC + SERIAL STATUS",
        "info": "Tidak ada IMC-23. Setiap perubahan RUN HIGH/LOW dan TROUBLE HIGH/LOW dikirim melalui serial /dev/ttyUSB1.",
        "x": 1190,
        "y": 110,
        "wires": []
    },
    {
        "id": "1d4ab3c607c1ab5c",
        "type": "function",
        "z": "a64f6aa777a995f8",
        "name": "Route ID1/ID2/ID3 -> SQL Logger",
        "func": "/*\n========================================================================\n ROUTER OUTPUT BARU 3 MODBUS SLAVE -> LOGGER MESIN\n========================================================================\n\nMapping berdasarkan parser per-ID yang ada pada flow:\n\nID1 / R9A (16 discrete bits, 8 pasangan RUN/TROUBLE):\n  0 IMC-21\n  1 IMC-20\n  2 IMC-19\n  3 IMC-103\n  4 IMC-94\n  5 IMC-61\n  6 IMC-251\n  7 IDH-23\n\nID2 / R9C (8 Input Registers -> 8 bit via threshold, 4 pasangan):\n  0 IMC-29\n  1 IMC-40\n  2 IMC-28\n  3 IMC-10\n\nID3 / R9E (8 discrete bits):\n  0 IMC-45\n  1 IMC-229\n  bit 4..7 RESERVED\n\nUrutan OUTPUT dipertahankan agar wiring SQL logger lama tetap kompatibel:\n 1 IMC-40\n 2 IMC-10\n 3 IMC-28\n 4 IMC-29\n 5 IMC-19\n 6 IMC-20\n 7 IMC-21\n 9 IMC-45\n10 IMC-61\n11 IMC-94\n12 IMC-103\n13 IMC-229\n14 IMC-251\n15 IDH-23\n========================================================================\n*/\n\nconst OUTPUT_INDEX = {\n    \"IMC-40\": 0,\n    \"IMC-10\": 1,\n    \"IMC-28\": 2,\n    \"IMC-29\": 3,\n    \"IMC-19\": 4,\n    \"IMC-20\": 5,\n    \"IMC-21\": 6,\n        \"IMC-45\": 8,\n    \"IMC-61\": 9,\n    \"IMC-94\": 10,\n    \"IMC-103\": 11,\n    \"IMC-229\": 12,\n    \"IMC-251\": 13,\n    \"IDH-23\": 14\n};\n\nconst ROUTES = {\n    R9A: {\n        expectedLength: 16,\n        machines: [\n            \"IMC-21\", \"IMC-20\", \"IMC-19\", \"IMC-103\",\n            \"IMC-94\", \"IMC-61\", \"IMC-251\", \"IDH-23\"\n        ]\n    },\n    R9C: {\n        expectedLength: 8,\n        machines: [\"IMC-29\", \"IMC-40\", \"IMC-28\", \"IMC-10\"]\n    },\n    R9E: {\n        expectedLength: 8,\n        machines: [\"IMC-45\", \"IMC-229\"]\n    }\n};\n\nlet p = msg.payload;\n\nif (!p || typeof p !== \"object\" || Array.isArray(p)) {\n    node.status({ fill: \"red\", shape: \"ring\", text: \"Payload bukan object\" });\n    return null;\n}\n\nconst slave = String(p.slave || \"\").trim().toUpperCase();\nconst route = ROUTES[slave];\n\nif (!route) {\n    node.status({\n        fill: \"yellow\",\n        shape: \"ring\",\n        text: \"Slave \" + (slave || \"kosong\") + \" tidak dikenal\"\n    });\n    return null;\n}\n\nlet raw = p.raw ?? p.raw_data;\n\nif (Buffer.isBuffer(raw)) raw = raw.toString(\"utf8\");\nelse if (Array.isArray(raw)) raw = raw.join(\"\");\n\nraw = String(raw ?? \"\").replace(/\\s+/g, \"\");\n\nif (!/^[01]+$/.test(raw)) {\n    node.status({ fill: \"red\", shape: \"ring\", text: slave + \": data harus 0/1\" });\n    return null;\n}\n\nif (raw.length !== route.expectedLength) {\n    node.status({\n        fill: \"red\",\n        shape: \"ring\",\n        text: slave + \": panjang \" + raw.length + \", harus \" + route.expectedLength\n    });\n    return null;\n}\n\nconst outputs = Array(15).fill(null);\nconst timestamp = Date.now();\n\nroute.machines.forEach((name, pairIndex) => {\n    const bitIndex = pairIndex * 2;\n    const runningRaw = Number(raw.charAt(bitIndex));\n    const troubleRaw = Number(raw.charAt(bitIndex + 1));\n\n    const running = runningRaw === 1;\n    const trouble = troubleRaw === 1;\n\n    let status = \"STOPPED\";\n    if (trouble) status = \"TROUBLE\";\n    else if (running) status = \"RUNNING\";\n\n    const outIndex = OUTPUT_INDEX[name];\n\n    outputs[outIndex] = {\n        payload: {\n            timestamp,\n            slave,\n            raw_data: raw,\n            raw_registers: Array.isArray(p.raw_registers) ? p.raw_registers : undefined,\n            name,\n            runningRaw,\n            troubleRaw,\n            running,\n            trouble,\n            status\n        }\n    };\n});\n\nnode.status({\n    fill: \"green\",\n    shape: \"dot\",\n    text: slave + \" OK | \" + route.machines.length + \" mesin\"\n});\n\nreturn outputs;",
        "outputs": 15,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 1115,
        "y": 245,
        "wires": [
            [
                "3a3be3b975393831",
                "61c0e617a21b1322"
            ],
            [
                "64db14cacca6df37",
                "61c0e617a21b1322"
            ],
            [
                "1bb2529c90f85300",
                "61c0e617a21b1322"
            ],
            [
                "276d53083f93b60a",
                "61c0e617a21b1322"
            ],
            [
                "b77dd5b2df202366",
                "61c0e617a21b1322"
            ],
            [
                "2f2757cd37523025",
                "61c0e617a21b1322"
            ],
            [
                "67cbbaf585381caf",
                "61c0e617a21b1322"
            ],
            [
                "08e9083834e8a9e7",
                "61c0e617a21b1322"
            ],
            [
                "074d72e8f3f36356",
                "61c0e617a21b1322"
            ],
            [
                "45b97ec1b9d8e566",
                "61c0e617a21b1322"
            ],
            [
                "3319cbe135f088c6",
                "61c0e617a21b1322"
            ],
            [
                "141814035e2da581",
                "61c0e617a21b1322"
            ],
            [
                "1918d76be17e8ca2",
                "61c0e617a21b1322"
            ],
            [
                "8ff3e26f6a0f2731",
                "61c0e617a21b1322"
            ],
            [
                "d36ade32c37ecb72",
                "61c0e617a21b1322"
            ]
        ]
    },
    {
        "id": "3a3be3b975393831",
        "type": "function",
        "z": "a64f6aa777a995f8",
        "name": "IMC-40 | SQL Logger",
        "func": "/*\n=========================================================\n IMC-40 - DATABASE LOGGER + RTC created_at\n=========================================================\nMAIN     : rh_imc_40\nRUN      : rh_imc_40_run\nTROUBLE  : rh_imc_40_trouble\n\ncreated_at wajib berasal dari RTC I2C.\nJika RTC belum sinkron atau lebih dari 5 detik tidak diperbarui,\nsemua INSERT untuk mesin ini dibatalkan.\n\nMAIN:\n- INSERT setiap paket mesin terkait.\n\nRUN / TROUBLE:\n- INSERT baseline pertama setelah deploy/restart.\n- INSERT hanya ketika status berubah LOW <-> HIGH.\n=========================================================\n*/\n\nconst MACHINE = \"IMC-40\";\nconst MAIN_TABLE = \"rh_imc_40\";\nconst RUN_TABLE = \"rh_imc_40_run\";\nconst TROUBLE_TABLE = \"rh_imc_40_trouble\";\nconst RTC_MAX_AGE_MS = 5000;\n\nconst p = msg.payload;\n\nif (!p || p.name !== MACHINE) {\n    return null;\n}\n\nconst createdAt = global.get(\"rtc_sql_datetime\");\nconst rtcLastReceivedMs = Number(global.get(\"rtc_last_received_ms\"));\nconst rtcAgeMs = Date.now() - rtcLastReceivedMs;\n\nif (\n    typeof createdAt !== \"string\" ||\n    !/^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}$/.test(createdAt) ||\n    !Number.isFinite(rtcLastReceivedMs) ||\n    rtcLastReceivedMs <= 0 ||\n    rtcAgeMs < 0 ||\n    rtcAgeMs > RTC_MAX_AGE_MS\n) {\n    node.status({ fill: \"red\", shape: \"ring\", text: \"INSERT BLOCKED | RTC invalid/stale\" });\n    node.error(`${MACHINE}: INSERT dibatalkan karena RTC belum sinkron atau kedaluwarsa.`, msg);\n    return null;\n}\n\nconst runStatus = p.running === true ? \"HIGH\" : \"LOW\";\nconst troubleStatus = p.trouble === true ? \"HIGH\" : \"LOW\";\n\nlet mainStatus = \"STOPPED\";\nif (p.trouble === true) {\n    mainStatus = \"TROUBLE\";\n}\nelse if (p.running === true) {\n    mainStatus = \"RUNNING\";\n}\n\nfunction escapeSql(value) {\n    return String(value)\n        .replace(/\\\\/g, \"\\\\\\\\\")\n        .replace(/'/g, \"''\");\n}\n\nfunction makeInsert(table, status, type) {\n    const sql = `\nINSERT INTO \\`${table}\\`\n    (\\`name_line\\`, \\`status\\`, \\`created_at\\`)\nVALUES\n    (\n        '${escapeSql(MACHINE)}',\n        '${escapeSql(status)}',\n        '${escapeSql(createdAt)}'\n    );\n    `.trim();\n\n    return {\n        topic: sql,\n        payload: {\n            machine: MACHINE,\n            source_slave: p.slave,\n            table_name: table,\n            insert_type: type,\n            inserted_status: status,\n            created_at: createdAt,\n            rtc_age_ms: rtcAgeMs,\n            runningRaw: p.runningRaw,\n            troubleRaw: p.troubleRaw,\n            timestamp: p.timestamp\n        }\n    };\n}\n\nconst previous = context.get(\"state\");\nconst queries = [];\n\n// Tabel utama selalu menerima status dan waktu RTC terbaru.\n// MAIN TABLE INSERT DIHAPUS\n// Hanya menyimpan perubahan RUN/TROUBLE\n\n// Tabel RUN menerima baseline dan setiap perubahan status.\nif (!previous || previous.run !== runStatus) {\n    queries.push(makeInsert(RUN_TABLE, runStatus, \"RUN\"));\n}\n\n// Tabel TROUBLE menerima baseline dan setiap perubahan status.\nif (!previous || previous.trouble !== troubleStatus) {\n    queries.push(makeInsert(TROUBLE_TABLE, troubleStatus, \"TROUBLE\"));\n}\n\ncontext.set(\"state\", {\n    run: runStatus,\n    trouble: troubleStatus\n});\n\nlet fill = \"grey\";\nif (mainStatus === \"RUNNING\") {\n    fill = \"green\";\n}\nelse if (mainStatus === \"TROUBLE\") {\n    fill = \"red\";\n}\n\nnode.status({\n    fill,\n    shape: \"dot\",\n    text: `${mainStatus} | RTC ${createdAt} | SQL:${queries.length}`\n});\n\n// Array pada output pertama membuat MySQL menerima query satu per satu.\nreturn [queries];\n",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 1490,
        "y": 220,
        "wires": [
            [
                "9ff362f6bc229855"
            ]
        ]
    },
    {
        "id": "64db14cacca6df37",
        "type": "function",
        "z": "a64f6aa777a995f8",
        "name": "IMC-10 | SQL Logger",
        "func": "/*\n=========================================================\n IMC-10 - DATABASE LOGGER + RTC created_at\n=========================================================\nMAIN     : rh_imc_10\nRUN      : rh_imc_10_run\nTROUBLE  : rh_imc_10_trouble\n\ncreated_at wajib berasal dari RTC I2C.\nJika RTC belum sinkron atau lebih dari 5 detik tidak diperbarui,\nsemua INSERT untuk mesin ini dibatalkan.\n\nMAIN:\n- INSERT setiap paket mesin terkait.\n\nRUN / TROUBLE:\n- INSERT baseline pertama setelah deploy/restart.\n- INSERT hanya ketika status berubah LOW <-> HIGH.\n=========================================================\n*/\n\nconst MACHINE = \"IMC-10\";\nconst MAIN_TABLE = \"rh_imc_10\";\nconst RUN_TABLE = \"rh_imc_10_run\";\nconst TROUBLE_TABLE = \"rh_imc_10_trouble\";\nconst RTC_MAX_AGE_MS = 5000;\n\nconst p = msg.payload;\n\nif (!p || p.name !== MACHINE) {\n    return null;\n}\n\nconst createdAt = global.get(\"rtc_sql_datetime\");\nconst rtcLastReceivedMs = Number(global.get(\"rtc_last_received_ms\"));\nconst rtcAgeMs = Date.now() - rtcLastReceivedMs;\n\nif (\n    typeof createdAt !== \"string\" ||\n    !/^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}$/.test(createdAt) ||\n    !Number.isFinite(rtcLastReceivedMs) ||\n    rtcLastReceivedMs <= 0 ||\n    rtcAgeMs < 0 ||\n    rtcAgeMs > RTC_MAX_AGE_MS\n) {\n    node.status({ fill: \"red\", shape: \"ring\", text: \"INSERT BLOCKED | RTC invalid/stale\" });\n    node.error(`${MACHINE}: INSERT dibatalkan karena RTC belum sinkron atau kedaluwarsa.`, msg);\n    return null;\n}\n\nconst runStatus = p.running === true ? \"HIGH\" : \"LOW\";\nconst troubleStatus = p.trouble === true ? \"HIGH\" : \"LOW\";\n\nlet mainStatus = \"STOPPED\";\nif (p.trouble === true) {\n    mainStatus = \"TROUBLE\";\n}\nelse if (p.running === true) {\n    mainStatus = \"RUNNING\";\n}\n\nfunction escapeSql(value) {\n    return String(value)\n        .replace(/\\\\/g, \"\\\\\\\\\")\n        .replace(/'/g, \"''\");\n}\n\nfunction makeInsert(table, status, type) {\n    const sql = `\nINSERT INTO \\`${table}\\`\n    (\\`name_line\\`, \\`status\\`, \\`created_at\\`)\nVALUES\n    (\n        '${escapeSql(MACHINE)}',\n        '${escapeSql(status)}',\n        '${escapeSql(createdAt)}'\n    );\n    `.trim();\n\n    return {\n        topic: sql,\n        payload: {\n            machine: MACHINE,\n            source_slave: p.slave,\n            table_name: table,\n            insert_type: type,\n            inserted_status: status,\n            created_at: createdAt,\n            rtc_age_ms: rtcAgeMs,\n            runningRaw: p.runningRaw,\n            troubleRaw: p.troubleRaw,\n            timestamp: p.timestamp\n        }\n    };\n}\n\nconst previous = context.get(\"state\");\nconst queries = [];\n\n// Tabel utama selalu menerima status dan waktu RTC terbaru.\n// MAIN TABLE INSERT DIHAPUS\n// Hanya menyimpan perubahan RUN/TROUBLE\n\n// Tabel RUN menerima baseline dan setiap perubahan status.\nif (!previous || previous.run !== runStatus) {\n    queries.push(makeInsert(RUN_TABLE, runStatus, \"RUN\"));\n}\n\n// Tabel TROUBLE menerima baseline dan setiap perubahan status.\nif (!previous || previous.trouble !== troubleStatus) {\n    queries.push(makeInsert(TROUBLE_TABLE, troubleStatus, \"TROUBLE\"));\n}\n\ncontext.set(\"state\", {\n    run: runStatus,\n    trouble: troubleStatus\n});\n\nlet fill = \"grey\";\nif (mainStatus === \"RUNNING\") {\n    fill = \"green\";\n}\nelse if (mainStatus === \"TROUBLE\") {\n    fill = \"red\";\n}\n\nnode.status({\n    fill,\n    shape: \"dot\",\n    text: `${mainStatus} | RTC ${createdAt} | SQL:${queries.length}`\n});\n\n// Array pada output pertama membuat MySQL menerima query satu per satu.\nreturn [queries];\n",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 1490,
        "y": 270,
        "wires": [
            [
                "9ff362f6bc229855"
            ]
        ]
    },
    {
        "id": "1bb2529c90f85300",
        "type": "function",
        "z": "a64f6aa777a995f8",
        "name": "IMC-28 | SQL Logger",
        "func": "/*\n=========================================================\n IMC-28 - DATABASE LOGGER + RTC created_at\n=========================================================\nMAIN     : rh_imc_28\nRUN      : rh_imc_28_run\nTROUBLE  : rh_imc_28_trouble\n\ncreated_at wajib berasal dari RTC I2C.\nJika RTC belum sinkron atau lebih dari 5 detik tidak diperbarui,\nsemua INSERT untuk mesin ini dibatalkan.\n\nMAIN:\n- INSERT setiap paket mesin terkait.\n\nRUN / TROUBLE:\n- INSERT baseline pertama setelah deploy/restart.\n- INSERT hanya ketika status berubah LOW <-> HIGH.\n=========================================================\n*/\n\nconst MACHINE = \"IMC-28\";\nconst MAIN_TABLE = \"rh_imc_28\";\nconst RUN_TABLE = \"rh_imc_28_run\";\nconst TROUBLE_TABLE = \"rh_imc_28_trouble\";\nconst RTC_MAX_AGE_MS = 5000;\n\nconst p = msg.payload;\n\nif (!p || p.name !== MACHINE) {\n    return null;\n}\n\nconst createdAt = global.get(\"rtc_sql_datetime\");\nconst rtcLastReceivedMs = Number(global.get(\"rtc_last_received_ms\"));\nconst rtcAgeMs = Date.now() - rtcLastReceivedMs;\n\nif (\n    typeof createdAt !== \"string\" ||\n    !/^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}$/.test(createdAt) ||\n    !Number.isFinite(rtcLastReceivedMs) ||\n    rtcLastReceivedMs <= 0 ||\n    rtcAgeMs < 0 ||\n    rtcAgeMs > RTC_MAX_AGE_MS\n) {\n    node.status({ fill: \"red\", shape: \"ring\", text: \"INSERT BLOCKED | RTC invalid/stale\" });\n    node.error(`${MACHINE}: INSERT dibatalkan karena RTC belum sinkron atau kedaluwarsa.`, msg);\n    return null;\n}\n\nconst runStatus = p.running === true ? \"HIGH\" : \"LOW\";\nconst troubleStatus = p.trouble === true ? \"HIGH\" : \"LOW\";\n\nlet mainStatus = \"STOPPED\";\nif (p.trouble === true) {\n    mainStatus = \"TROUBLE\";\n}\nelse if (p.running === true) {\n    mainStatus = \"RUNNING\";\n}\n\nfunction escapeSql(value) {\n    return String(value)\n        .replace(/\\\\/g, \"\\\\\\\\\")\n        .replace(/'/g, \"''\");\n}\n\nfunction makeInsert(table, status, type) {\n    const sql = `\nINSERT INTO \\`${table}\\`\n    (\\`name_line\\`, \\`status\\`, \\`created_at\\`)\nVALUES\n    (\n        '${escapeSql(MACHINE)}',\n        '${escapeSql(status)}',\n        '${escapeSql(createdAt)}'\n    );\n    `.trim();\n\n    return {\n        topic: sql,\n        payload: {\n            machine: MACHINE,\n            source_slave: p.slave,\n            table_name: table,\n            insert_type: type,\n            inserted_status: status,\n            created_at: createdAt,\n            rtc_age_ms: rtcAgeMs,\n            runningRaw: p.runningRaw,\n            troubleRaw: p.troubleRaw,\n            timestamp: p.timestamp\n        }\n    };\n}\n\nconst previous = context.get(\"state\");\nconst queries = [];\n\n// Tabel utama selalu menerima status dan waktu RTC terbaru.\n// MAIN TABLE INSERT DIHAPUS\n// Hanya menyimpan perubahan RUN/TROUBLE\n\n// Tabel RUN menerima baseline dan setiap perubahan status.\nif (!previous || previous.run !== runStatus) {\n    queries.push(makeInsert(RUN_TABLE, runStatus, \"RUN\"));\n}\n\n// Tabel TROUBLE menerima baseline dan setiap perubahan status.\nif (!previous || previous.trouble !== troubleStatus) {\n    queries.push(makeInsert(TROUBLE_TABLE, troubleStatus, \"TROUBLE\"));\n}\n\ncontext.set(\"state\", {\n    run: runStatus,\n    trouble: troubleStatus\n});\n\nlet fill = \"grey\";\nif (mainStatus === \"RUNNING\") {\n    fill = \"green\";\n}\nelse if (mainStatus === \"TROUBLE\") {\n    fill = \"red\";\n}\n\nnode.status({\n    fill,\n    shape: \"dot\",\n    text: `${mainStatus} | RTC ${createdAt} | SQL:${queries.length}`\n});\n\n// Array pada output pertama membuat MySQL menerima query satu per satu.\nreturn [queries];\n",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 1490,
        "y": 320,
        "wires": [
            [
                "9ff362f6bc229855"
            ]
        ]
    },
    {
        "id": "276d53083f93b60a",
        "type": "function",
        "z": "a64f6aa777a995f8",
        "name": "IMC-29 | SQL Logger",
        "func": "/*\n=========================================================\n IMC-29 - DATABASE LOGGER + RTC created_at\n=========================================================\nMAIN     : rh_imc_29\nRUN      : rh_imc_29_run\nTROUBLE  : rh_imc_29_trouble\n\ncreated_at wajib berasal dari RTC I2C.\nJika RTC belum sinkron atau lebih dari 5 detik tidak diperbarui,\nsemua INSERT untuk mesin ini dibatalkan.\n\nMAIN:\n- INSERT setiap paket mesin terkait.\n\nRUN / TROUBLE:\n- INSERT baseline pertama setelah deploy/restart.\n- INSERT hanya ketika status berubah LOW <-> HIGH.\n=========================================================\n*/\n\nconst MACHINE = \"IMC-29\";\nconst MAIN_TABLE = \"rh_imc_29\";\nconst RUN_TABLE = \"rh_imc_29_run\";\nconst TROUBLE_TABLE = \"rh_imc_29_trouble\";\nconst RTC_MAX_AGE_MS = 5000;\n\nconst p = msg.payload;\n\nif (!p || p.name !== MACHINE) {\n    return null;\n}\n\nconst createdAt = global.get(\"rtc_sql_datetime\");\nconst rtcLastReceivedMs = Number(global.get(\"rtc_last_received_ms\"));\nconst rtcAgeMs = Date.now() - rtcLastReceivedMs;\n\nif (\n    typeof createdAt !== \"string\" ||\n    !/^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}$/.test(createdAt) ||\n    !Number.isFinite(rtcLastReceivedMs) ||\n    rtcLastReceivedMs <= 0 ||\n    rtcAgeMs < 0 ||\n    rtcAgeMs > RTC_MAX_AGE_MS\n) {\n    node.status({ fill: \"red\", shape: \"ring\", text: \"INSERT BLOCKED | RTC invalid/stale\" });\n    node.error(`${MACHINE}: INSERT dibatalkan karena RTC belum sinkron atau kedaluwarsa.`, msg);\n    return null;\n}\n\nconst runStatus = p.running === true ? \"HIGH\" : \"LOW\";\nconst troubleStatus = p.trouble === true ? \"HIGH\" : \"LOW\";\n\nlet mainStatus = \"STOPPED\";\nif (p.trouble === true) {\n    mainStatus = \"TROUBLE\";\n}\nelse if (p.running === true) {\n    mainStatus = \"RUNNING\";\n}\n\nfunction escapeSql(value) {\n    return String(value)\n        .replace(/\\\\/g, \"\\\\\\\\\")\n        .replace(/'/g, \"''\");\n}\n\nfunction makeInsert(table, status, type) {\n    const sql = `\nINSERT INTO \\`${table}\\`\n    (\\`name_line\\`, \\`status\\`, \\`created_at\\`)\nVALUES\n    (\n        '${escapeSql(MACHINE)}',\n        '${escapeSql(status)}',\n        '${escapeSql(createdAt)}'\n    );\n    `.trim();\n\n    return {\n        topic: sql,\n        payload: {\n            machine: MACHINE,\n            source_slave: p.slave,\n            table_name: table,\n            insert_type: type,\n            inserted_status: status,\n            created_at: createdAt,\n            rtc_age_ms: rtcAgeMs,\n            runningRaw: p.runningRaw,\n            troubleRaw: p.troubleRaw,\n            timestamp: p.timestamp\n        }\n    };\n}\n\nconst previous = context.get(\"state\");\nconst queries = [];\n\n// Tabel utama selalu menerima status dan waktu RTC terbaru.\n// MAIN TABLE INSERT DIHAPUS\n// Hanya menyimpan perubahan RUN/TROUBLE\n\n// Tabel RUN menerima baseline dan setiap perubahan status.\nif (!previous || previous.run !== runStatus) {\n    queries.push(makeInsert(RUN_TABLE, runStatus, \"RUN\"));\n}\n\n// Tabel TROUBLE menerima baseline dan setiap perubahan status.\nif (!previous || previous.trouble !== troubleStatus) {\n    queries.push(makeInsert(TROUBLE_TABLE, troubleStatus, \"TROUBLE\"));\n}\n\ncontext.set(\"state\", {\n    run: runStatus,\n    trouble: troubleStatus\n});\n\nlet fill = \"grey\";\nif (mainStatus === \"RUNNING\") {\n    fill = \"green\";\n}\nelse if (mainStatus === \"TROUBLE\") {\n    fill = \"red\";\n}\n\nnode.status({\n    fill,\n    shape: \"dot\",\n    text: `${mainStatus} | RTC ${createdAt} | SQL:${queries.length}`\n});\n\n// Array pada output pertama membuat MySQL menerima query satu per satu.\nreturn [queries];\n",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 1490,
        "y": 370,
        "wires": [
            [
                "9ff362f6bc229855"
            ]
        ]
    },
    {
        "id": "b77dd5b2df202366",
        "type": "function",
        "z": "a64f6aa777a995f8",
        "name": "IMC-19 | SQL Logger",
        "func": "/*\n=========================================================\n IMC-19 - DATABASE LOGGER + RTC created_at\n=========================================================\nMAIN     : rh_imc_19\nRUN      : rh_imc_19_run\nTROUBLE  : rh_imc_19_trouble\n\ncreated_at wajib berasal dari RTC I2C.\nJika RTC belum sinkron atau lebih dari 5 detik tidak diperbarui,\nsemua INSERT untuk mesin ini dibatalkan.\n\nMAIN:\n- INSERT setiap paket mesin terkait.\n\nRUN / TROUBLE:\n- INSERT baseline pertama setelah deploy/restart.\n- INSERT hanya ketika status berubah LOW <-> HIGH.\n=========================================================\n*/\n\nconst MACHINE = \"IMC-19\";\nconst MAIN_TABLE = \"rh_imc_19\";\nconst RUN_TABLE = \"rh_imc_19_run\";\nconst TROUBLE_TABLE = \"rh_imc_19_trouble\";\nconst RTC_MAX_AGE_MS = 5000;\n\nconst p = msg.payload;\n\nif (!p || p.name !== MACHINE) {\n    return null;\n}\n\nconst createdAt = global.get(\"rtc_sql_datetime\");\nconst rtcLastReceivedMs = Number(global.get(\"rtc_last_received_ms\"));\nconst rtcAgeMs = Date.now() - rtcLastReceivedMs;\n\nif (\n    typeof createdAt !== \"string\" ||\n    !/^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}$/.test(createdAt) ||\n    !Number.isFinite(rtcLastReceivedMs) ||\n    rtcLastReceivedMs <= 0 ||\n    rtcAgeMs < 0 ||\n    rtcAgeMs > RTC_MAX_AGE_MS\n) {\n    node.status({ fill: \"red\", shape: \"ring\", text: \"INSERT BLOCKED | RTC invalid/stale\" });\n    node.error(`${MACHINE}: INSERT dibatalkan karena RTC belum sinkron atau kedaluwarsa.`, msg);\n    return null;\n}\n\nconst runStatus = p.running === true ? \"HIGH\" : \"LOW\";\nconst troubleStatus = p.trouble === true ? \"HIGH\" : \"LOW\";\n\nlet mainStatus = \"STOPPED\";\nif (p.trouble === true) {\n    mainStatus = \"TROUBLE\";\n}\nelse if (p.running === true) {\n    mainStatus = \"RUNNING\";\n}\n\nfunction escapeSql(value) {\n    return String(value)\n        .replace(/\\\\/g, \"\\\\\\\\\")\n        .replace(/'/g, \"''\");\n}\n\nfunction makeInsert(table, status, type) {\n    const sql = `\nINSERT INTO \\`${table}\\`\n    (\\`name_line\\`, \\`status\\`, \\`created_at\\`)\nVALUES\n    (\n        '${escapeSql(MACHINE)}',\n        '${escapeSql(status)}',\n        '${escapeSql(createdAt)}'\n    );\n    `.trim();\n\n    return {\n        topic: sql,\n        payload: {\n            machine: MACHINE,\n            source_slave: p.slave,\n            table_name: table,\n            insert_type: type,\n            inserted_status: status,\n            created_at: createdAt,\n            rtc_age_ms: rtcAgeMs,\n            runningRaw: p.runningRaw,\n            troubleRaw: p.troubleRaw,\n            timestamp: p.timestamp\n        }\n    };\n}\n\nconst previous = context.get(\"state\");\nconst queries = [];\n\n// Tabel utama selalu menerima status dan waktu RTC terbaru.\n// MAIN TABLE INSERT DIHAPUS\n// Hanya menyimpan perubahan RUN/TROUBLE\n\n// Tabel RUN menerima baseline dan setiap perubahan status.\nif (!previous || previous.run !== runStatus) {\n    queries.push(makeInsert(RUN_TABLE, runStatus, \"RUN\"));\n}\n\n// Tabel TROUBLE menerima baseline dan setiap perubahan status.\nif (!previous || previous.trouble !== troubleStatus) {\n    queries.push(makeInsert(TROUBLE_TABLE, troubleStatus, \"TROUBLE\"));\n}\n\ncontext.set(\"state\", {\n    run: runStatus,\n    trouble: troubleStatus\n});\n\nlet fill = \"grey\";\nif (mainStatus === \"RUNNING\") {\n    fill = \"green\";\n}\nelse if (mainStatus === \"TROUBLE\") {\n    fill = \"red\";\n}\n\nnode.status({\n    fill,\n    shape: \"dot\",\n    text: `${mainStatus} | RTC ${createdAt} | SQL:${queries.length}`\n});\n\n// Array pada output pertama membuat MySQL menerima query satu per satu.\nreturn [queries];\n",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 1490,
        "y": 420,
        "wires": [
            [
                "9ff362f6bc229855"
            ]
        ]
    },
    {
        "id": "2f2757cd37523025",
        "type": "function",
        "z": "a64f6aa777a995f8",
        "name": "IMC-20 | SQL Logger",
        "func": "/*\n=========================================================\n IMC-20 - DATABASE LOGGER + RTC created_at\n=========================================================\nMAIN     : rh_imc_20\nRUN      : rh_imc_20_run\nTROUBLE  : rh_imc_20_trouble\n\ncreated_at wajib berasal dari RTC I2C.\nJika RTC belum sinkron atau lebih dari 5 detik tidak diperbarui,\nsemua INSERT untuk mesin ini dibatalkan.\n\nMAIN:\n- INSERT setiap paket mesin terkait.\n\nRUN / TROUBLE:\n- INSERT baseline pertama setelah deploy/restart.\n- INSERT hanya ketika status berubah LOW <-> HIGH.\n=========================================================\n*/\n\nconst MACHINE = \"IMC-20\";\nconst MAIN_TABLE = \"rh_imc_20\";\nconst RUN_TABLE = \"rh_imc_20_run\";\nconst TROUBLE_TABLE = \"rh_imc_20_trouble\";\nconst RTC_MAX_AGE_MS = 5000;\n\nconst p = msg.payload;\n\nif (!p || p.name !== MACHINE) {\n    return null;\n}\n\nconst createdAt = global.get(\"rtc_sql_datetime\");\nconst rtcLastReceivedMs = Number(global.get(\"rtc_last_received_ms\"));\nconst rtcAgeMs = Date.now() - rtcLastReceivedMs;\n\nif (\n    typeof createdAt !== \"string\" ||\n    !/^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}$/.test(createdAt) ||\n    !Number.isFinite(rtcLastReceivedMs) ||\n    rtcLastReceivedMs <= 0 ||\n    rtcAgeMs < 0 ||\n    rtcAgeMs > RTC_MAX_AGE_MS\n) {\n    node.status({ fill: \"red\", shape: \"ring\", text: \"INSERT BLOCKED | RTC invalid/stale\" });\n    node.error(`${MACHINE}: INSERT dibatalkan karena RTC belum sinkron atau kedaluwarsa.`, msg);\n    return null;\n}\n\nconst runStatus = p.running === true ? \"HIGH\" : \"LOW\";\nconst troubleStatus = p.trouble === true ? \"HIGH\" : \"LOW\";\n\nlet mainStatus = \"STOPPED\";\nif (p.trouble === true) {\n    mainStatus = \"TROUBLE\";\n}\nelse if (p.running === true) {\n    mainStatus = \"RUNNING\";\n}\n\nfunction escapeSql(value) {\n    return String(value)\n        .replace(/\\\\/g, \"\\\\\\\\\")\n        .replace(/'/g, \"''\");\n}\n\nfunction makeInsert(table, status, type) {\n    const sql = `\nINSERT INTO \\`${table}\\`\n    (\\`name_line\\`, \\`status\\`, \\`created_at\\`)\nVALUES\n    (\n        '${escapeSql(MACHINE)}',\n        '${escapeSql(status)}',\n        '${escapeSql(createdAt)}'\n    );\n    `.trim();\n\n    return {\n        topic: sql,\n        payload: {\n            machine: MACHINE,\n            source_slave: p.slave,\n            table_name: table,\n            insert_type: type,\n            inserted_status: status,\n            created_at: createdAt,\n            rtc_age_ms: rtcAgeMs,\n            runningRaw: p.runningRaw,\n            troubleRaw: p.troubleRaw,\n            timestamp: p.timestamp\n        }\n    };\n}\n\nconst previous = context.get(\"state\");\nconst queries = [];\n\n// Tabel utama selalu menerima status dan waktu RTC terbaru.\n// MAIN TABLE INSERT DIHAPUS\n// Hanya menyimpan perubahan RUN/TROUBLE\n\n// Tabel RUN menerima baseline dan setiap perubahan status.\nif (!previous || previous.run !== runStatus) {\n    queries.push(makeInsert(RUN_TABLE, runStatus, \"RUN\"));\n}\n\n// Tabel TROUBLE menerima baseline dan setiap perubahan status.\nif (!previous || previous.trouble !== troubleStatus) {\n    queries.push(makeInsert(TROUBLE_TABLE, troubleStatus, \"TROUBLE\"));\n}\n\ncontext.set(\"state\", {\n    run: runStatus,\n    trouble: troubleStatus\n});\n\nlet fill = \"grey\";\nif (mainStatus === \"RUNNING\") {\n    fill = \"green\";\n}\nelse if (mainStatus === \"TROUBLE\") {\n    fill = \"red\";\n}\n\nnode.status({\n    fill,\n    shape: \"dot\",\n    text: `${mainStatus} | RTC ${createdAt} | SQL:${queries.length}`\n});\n\n// Array pada output pertama membuat MySQL menerima query satu per satu.\nreturn [queries];\n",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 1490,
        "y": 470,
        "wires": [
            [
                "9ff362f6bc229855"
            ]
        ]
    },
    {
        "id": "67cbbaf585381caf",
        "type": "function",
        "z": "a64f6aa777a995f8",
        "name": "IMC-21 | SQL Logger",
        "func": "/*\n=========================================================\n IMC-21 - DATABASE LOGGER + RTC created_at\n=========================================================\nMAIN     : rh_imc_21\nRUN      : rh_imc_21_run\nTROUBLE  : rh_imc_21_trouble\n\ncreated_at wajib berasal dari RTC I2C.\nJika RTC belum sinkron atau lebih dari 5 detik tidak diperbarui,\nsemua INSERT untuk mesin ini dibatalkan.\n\nMAIN:\n- INSERT setiap paket mesin terkait.\n\nRUN / TROUBLE:\n- INSERT baseline pertama setelah deploy/restart.\n- INSERT hanya ketika status berubah LOW <-> HIGH.\n=========================================================\n*/\n\nconst MACHINE = \"IMC-21\";\nconst MAIN_TABLE = \"rh_imc_21\";\nconst RUN_TABLE = \"rh_imc_21_run\";\nconst TROUBLE_TABLE = \"rh_imc_21_trouble\";\nconst RTC_MAX_AGE_MS = 5000;\n\nconst p = msg.payload;\n\nif (!p || p.name !== MACHINE) {\n    return null;\n}\n\nconst createdAt = global.get(\"rtc_sql_datetime\");\nconst rtcLastReceivedMs = Number(global.get(\"rtc_last_received_ms\"));\nconst rtcAgeMs = Date.now() - rtcLastReceivedMs;\n\nif (\n    typeof createdAt !== \"string\" ||\n    !/^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}$/.test(createdAt) ||\n    !Number.isFinite(rtcLastReceivedMs) ||\n    rtcLastReceivedMs <= 0 ||\n    rtcAgeMs < 0 ||\n    rtcAgeMs > RTC_MAX_AGE_MS\n) {\n    node.status({ fill: \"red\", shape: \"ring\", text: \"INSERT BLOCKED | RTC invalid/stale\" });\n    node.error(`${MACHINE}: INSERT dibatalkan karena RTC belum sinkron atau kedaluwarsa.`, msg);\n    return null;\n}\n\nconst runStatus = p.running === true ? \"HIGH\" : \"LOW\";\nconst troubleStatus = p.trouble === true ? \"HIGH\" : \"LOW\";\n\nlet mainStatus = \"STOPPED\";\nif (p.trouble === true) {\n    mainStatus = \"TROUBLE\";\n}\nelse if (p.running === true) {\n    mainStatus = \"RUNNING\";\n}\n\nfunction escapeSql(value) {\n    return String(value)\n        .replace(/\\\\/g, \"\\\\\\\\\")\n        .replace(/'/g, \"''\");\n}\n\nfunction makeInsert(table, status, type) {\n    const sql = `\nINSERT INTO \\`${table}\\`\n    (\\`name_line\\`, \\`status\\`, \\`created_at\\`)\nVALUES\n    (\n        '${escapeSql(MACHINE)}',\n        '${escapeSql(status)}',\n        '${escapeSql(createdAt)}'\n    );\n    `.trim();\n\n    return {\n        topic: sql,\n        payload: {\n            machine: MACHINE,\n            source_slave: p.slave,\n            table_name: table,\n            insert_type: type,\n            inserted_status: status,\n            created_at: createdAt,\n            rtc_age_ms: rtcAgeMs,\n            runningRaw: p.runningRaw,\n            troubleRaw: p.troubleRaw,\n            timestamp: p.timestamp\n        }\n    };\n}\n\nconst previous = context.get(\"state\");\nconst queries = [];\n\n// Tabel utama selalu menerima status dan waktu RTC terbaru.\n// MAIN TABLE INSERT DIHAPUS\n// Hanya menyimpan perubahan RUN/TROUBLE\n\n// Tabel RUN menerima baseline dan setiap perubahan status.\nif (!previous || previous.run !== runStatus) {\n    queries.push(makeInsert(RUN_TABLE, runStatus, \"RUN\"));\n}\n\n// Tabel TROUBLE menerima baseline dan setiap perubahan status.\nif (!previous || previous.trouble !== troubleStatus) {\n    queries.push(makeInsert(TROUBLE_TABLE, troubleStatus, \"TROUBLE\"));\n}\n\ncontext.set(\"state\", {\n    run: runStatus,\n    trouble: troubleStatus\n});\n\nlet fill = \"grey\";\nif (mainStatus === \"RUNNING\") {\n    fill = \"green\";\n}\nelse if (mainStatus === \"TROUBLE\") {\n    fill = \"red\";\n}\n\nnode.status({\n    fill,\n    shape: \"dot\",\n    text: `${mainStatus} | RTC ${createdAt} | SQL:${queries.length}`\n});\n\n// Array pada output pertama membuat MySQL menerima query satu per satu.\nreturn [queries];\n",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 1490,
        "y": 520,
        "wires": [
            [
                "9ff362f6bc229855"
            ]
        ]
    },
    {
        "id": "08e9083834e8a9e7",
        "type": "function",
        "z": "a64f6aa777a995f8",
        "name": "IMC-23 | SQL Logger",
        "func": "/*\n=========================================================\n IMC-23 - DATABASE LOGGER + RTC created_at\n=========================================================\nMAIN     : rh_imc_23\nRUN      : rh_imc_23_run\nTROUBLE  : rh_imc_23_trouble\n\ncreated_at wajib berasal dari RTC I2C.\nJika RTC belum sinkron atau lebih dari 5 detik tidak diperbarui,\nsemua INSERT untuk mesin ini dibatalkan.\n\nMAIN:\n- INSERT setiap paket mesin terkait.\n\nRUN / TROUBLE:\n- INSERT baseline pertama setelah deploy/restart.\n- INSERT hanya ketika status berubah LOW <-> HIGH.\n=========================================================\n*/\n\nconst MACHINE = \"IMC-23\";\nconst MAIN_TABLE = \"rh_imc_23\";\nconst RUN_TABLE = \"rh_imc_23_run\";\nconst TROUBLE_TABLE = \"rh_imc_23_trouble\";\nconst RTC_MAX_AGE_MS = 5000;\n\nconst p = msg.payload;\n\nif (!p || p.name !== MACHINE) {\n    return null;\n}\n\nconst createdAt = global.get(\"rtc_sql_datetime\");\nconst rtcLastReceivedMs = Number(global.get(\"rtc_last_received_ms\"));\nconst rtcAgeMs = Date.now() - rtcLastReceivedMs;\n\nif (\n    typeof createdAt !== \"string\" ||\n    !/^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}$/.test(createdAt) ||\n    !Number.isFinite(rtcLastReceivedMs) ||\n    rtcLastReceivedMs <= 0 ||\n    rtcAgeMs < 0 ||\n    rtcAgeMs > RTC_MAX_AGE_MS\n) {\n    node.status({ fill: \"red\", shape: \"ring\", text: \"INSERT BLOCKED | RTC invalid/stale\" });\n    node.error(`${MACHINE}: INSERT dibatalkan karena RTC belum sinkron atau kedaluwarsa.`, msg);\n    return null;\n}\n\nconst runStatus = p.running === true ? \"HIGH\" : \"LOW\";\nconst troubleStatus = p.trouble === true ? \"HIGH\" : \"LOW\";\n\nlet mainStatus = \"STOPPED\";\nif (p.trouble === true) {\n    mainStatus = \"TROUBLE\";\n}\nelse if (p.running === true) {\n    mainStatus = \"RUNNING\";\n}\n\nfunction escapeSql(value) {\n    return String(value)\n        .replace(/\\\\/g, \"\\\\\\\\\")\n        .replace(/'/g, \"''\");\n}\n\nfunction makeInsert(table, status, type) {\n    const sql = `\nINSERT INTO \\`${table}\\`\n    (\\`name_line\\`, \\`status\\`, \\`created_at\\`)\nVALUES\n    (\n        '${escapeSql(MACHINE)}',\n        '${escapeSql(status)}',\n        '${escapeSql(createdAt)}'\n    );\n    `.trim();\n\n    return {\n        topic: sql,\n        payload: {\n            machine: MACHINE,\n            source_slave: p.slave,\n            table_name: table,\n            insert_type: type,\n            inserted_status: status,\n            created_at: createdAt,\n            rtc_age_ms: rtcAgeMs,\n            runningRaw: p.runningRaw,\n            troubleRaw: p.troubleRaw,\n            timestamp: p.timestamp\n        }\n    };\n}\n\nconst previous = context.get(\"state\");\nconst queries = [];\n\n// Tabel utama selalu menerima status dan waktu RTC terbaru.\n// MAIN TABLE INSERT DIHAPUS\n// Hanya menyimpan perubahan RUN/TROUBLE\n\n// Tabel RUN menerima baseline dan setiap perubahan status.\nif (!previous || previous.run !== runStatus) {\n    queries.push(makeInsert(RUN_TABLE, runStatus, \"RUN\"));\n}\n\n// Tabel TROUBLE menerima baseline dan setiap perubahan status.\nif (!previous || previous.trouble !== troubleStatus) {\n    queries.push(makeInsert(TROUBLE_TABLE, troubleStatus, \"TROUBLE\"));\n}\n\ncontext.set(\"state\", {\n    run: runStatus,\n    trouble: troubleStatus\n});\n\nlet fill = \"grey\";\nif (mainStatus === \"RUNNING\") {\n    fill = \"green\";\n}\nelse if (mainStatus === \"TROUBLE\") {\n    fill = \"red\";\n}\n\nnode.status({\n    fill,\n    shape: \"dot\",\n    text: `${mainStatus} | RTC ${createdAt} | SQL:${queries.length}`\n});\n\n// Array pada output pertama membuat MySQL menerima query satu per satu.\nreturn [queries];\n",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 1490,
        "y": 570,
        "wires": [
            [
                "9ff362f6bc229855"
            ]
        ]
    },
    {
        "id": "074d72e8f3f36356",
        "type": "function",
        "z": "a64f6aa777a995f8",
        "name": "IMC-45 | SQL Logger",
        "func": "/*\n=========================================================\n IMC-45 - DATABASE LOGGER + RTC created_at\n=========================================================\nMAIN     : rh_imc_45\nRUN      : rh_imc_45_run\nTROUBLE  : rh_imc_45_trouble\n\ncreated_at wajib berasal dari RTC I2C.\nJika RTC belum sinkron atau lebih dari 5 detik tidak diperbarui,\nsemua INSERT untuk mesin ini dibatalkan.\n\nMAIN:\n- INSERT setiap paket mesin terkait.\n\nRUN / TROUBLE:\n- INSERT baseline pertama setelah deploy/restart.\n- INSERT hanya ketika status berubah LOW <-> HIGH.\n=========================================================\n*/\n\nconst MACHINE = \"IMC-45\";\nconst MAIN_TABLE = \"rh_imc_45\";\nconst RUN_TABLE = \"rh_imc_45_run\";\nconst TROUBLE_TABLE = \"rh_imc_45_trouble\";\nconst RTC_MAX_AGE_MS = 5000;\n\nconst p = msg.payload;\n\nif (!p || p.name !== MACHINE) {\n    return null;\n}\n\nconst createdAt = global.get(\"rtc_sql_datetime\");\nconst rtcLastReceivedMs = Number(global.get(\"rtc_last_received_ms\"));\nconst rtcAgeMs = Date.now() - rtcLastReceivedMs;\n\nif (\n    typeof createdAt !== \"string\" ||\n    !/^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}$/.test(createdAt) ||\n    !Number.isFinite(rtcLastReceivedMs) ||\n    rtcLastReceivedMs <= 0 ||\n    rtcAgeMs < 0 ||\n    rtcAgeMs > RTC_MAX_AGE_MS\n) {\n    node.status({ fill: \"red\", shape: \"ring\", text: \"INSERT BLOCKED | RTC invalid/stale\" });\n    node.error(`${MACHINE}: INSERT dibatalkan karena RTC belum sinkron atau kedaluwarsa.`, msg);\n    return null;\n}\n\nconst runStatus = p.running === true ? \"HIGH\" : \"LOW\";\nconst troubleStatus = p.trouble === true ? \"HIGH\" : \"LOW\";\n\nlet mainStatus = \"STOPPED\";\nif (p.trouble === true) {\n    mainStatus = \"TROUBLE\";\n}\nelse if (p.running === true) {\n    mainStatus = \"RUNNING\";\n}\n\nfunction escapeSql(value) {\n    return String(value)\n        .replace(/\\\\/g, \"\\\\\\\\\")\n        .replace(/'/g, \"''\");\n}\n\nfunction makeInsert(table, status, type) {\n    const sql = `\nINSERT INTO \\`${table}\\`\n    (\\`name_line\\`, \\`status\\`, \\`created_at\\`)\nVALUES\n    (\n        '${escapeSql(MACHINE)}',\n        '${escapeSql(status)}',\n        '${escapeSql(createdAt)}'\n    );\n    `.trim();\n\n    return {\n        topic: sql,\n        payload: {\n            machine: MACHINE,\n            source_slave: p.slave,\n            table_name: table,\n            insert_type: type,\n            inserted_status: status,\n            created_at: createdAt,\n            rtc_age_ms: rtcAgeMs,\n            runningRaw: p.runningRaw,\n            troubleRaw: p.troubleRaw,\n            timestamp: p.timestamp\n        }\n    };\n}\n\nconst previous = context.get(\"state\");\nconst queries = [];\n\n// Tabel utama selalu menerima status dan waktu RTC terbaru.\n// MAIN TABLE INSERT DIHAPUS\n// Hanya menyimpan perubahan RUN/TROUBLE\n\n// Tabel RUN menerima baseline dan setiap perubahan status.\nif (!previous || previous.run !== runStatus) {\n    queries.push(makeInsert(RUN_TABLE, runStatus, \"RUN\"));\n}\n\n// Tabel TROUBLE menerima baseline dan setiap perubahan status.\nif (!previous || previous.trouble !== troubleStatus) {\n    queries.push(makeInsert(TROUBLE_TABLE, troubleStatus, \"TROUBLE\"));\n}\n\ncontext.set(\"state\", {\n    run: runStatus,\n    trouble: troubleStatus\n});\n\nlet fill = \"grey\";\nif (mainStatus === \"RUNNING\") {\n    fill = \"green\";\n}\nelse if (mainStatus === \"TROUBLE\") {\n    fill = \"red\";\n}\n\nnode.status({\n    fill,\n    shape: \"dot\",\n    text: `${mainStatus} | RTC ${createdAt} | SQL:${queries.length}`\n});\n\n// Array pada output pertama membuat MySQL menerima query satu per satu.\nreturn [queries];\n",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 1490,
        "y": 620,
        "wires": [
            [
                "9ff362f6bc229855"
            ]
        ]
    },
    {
        "id": "45b97ec1b9d8e566",
        "type": "function",
        "z": "a64f6aa777a995f8",
        "name": "IMC-61 | SQL Logger",
        "func": "/*\n=========================================================\n IMC-61 - DATABASE LOGGER + RTC created_at\n=========================================================\nMAIN     : rh_imc_61\nRUN      : rh_imc_61_run\nTROUBLE  : rh_imc_61_trouble\n\ncreated_at wajib berasal dari RTC I2C.\nJika RTC belum sinkron atau lebih dari 5 detik tidak diperbarui,\nsemua INSERT untuk mesin ini dibatalkan.\n\nMAIN:\n- INSERT setiap paket mesin terkait.\n\nRUN / TROUBLE:\n- INSERT baseline pertama setelah deploy/restart.\n- INSERT hanya ketika status berubah LOW <-> HIGH.\n=========================================================\n*/\n\nconst MACHINE = \"IMC-61\";\nconst MAIN_TABLE = \"rh_imc_61\";\nconst RUN_TABLE = \"rh_imc_61_run\";\nconst TROUBLE_TABLE = \"rh_imc_61_trouble\";\nconst RTC_MAX_AGE_MS = 5000;\n\nconst p = msg.payload;\n\nif (!p || p.name !== MACHINE) {\n    return null;\n}\n\nconst createdAt = global.get(\"rtc_sql_datetime\");\nconst rtcLastReceivedMs = Number(global.get(\"rtc_last_received_ms\"));\nconst rtcAgeMs = Date.now() - rtcLastReceivedMs;\n\nif (\n    typeof createdAt !== \"string\" ||\n    !/^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}$/.test(createdAt) ||\n    !Number.isFinite(rtcLastReceivedMs) ||\n    rtcLastReceivedMs <= 0 ||\n    rtcAgeMs < 0 ||\n    rtcAgeMs > RTC_MAX_AGE_MS\n) {\n    node.status({ fill: \"red\", shape: \"ring\", text: \"INSERT BLOCKED | RTC invalid/stale\" });\n    node.error(`${MACHINE}: INSERT dibatalkan karena RTC belum sinkron atau kedaluwarsa.`, msg);\n    return null;\n}\n\nconst runStatus = p.running === true ? \"HIGH\" : \"LOW\";\nconst troubleStatus = p.trouble === true ? \"HIGH\" : \"LOW\";\n\nlet mainStatus = \"STOPPED\";\nif (p.trouble === true) {\n    mainStatus = \"TROUBLE\";\n}\nelse if (p.running === true) {\n    mainStatus = \"RUNNING\";\n}\n\nfunction escapeSql(value) {\n    return String(value)\n        .replace(/\\\\/g, \"\\\\\\\\\")\n        .replace(/'/g, \"''\");\n}\n\nfunction makeInsert(table, status, type) {\n    const sql = `\nINSERT INTO \\`${table}\\`\n    (\\`name_line\\`, \\`status\\`, \\`created_at\\`)\nVALUES\n    (\n        '${escapeSql(MACHINE)}',\n        '${escapeSql(status)}',\n        '${escapeSql(createdAt)}'\n    );\n    `.trim();\n\n    return {\n        topic: sql,\n        payload: {\n            machine: MACHINE,\n            source_slave: p.slave,\n            table_name: table,\n            insert_type: type,\n            inserted_status: status,\n            created_at: createdAt,\n            rtc_age_ms: rtcAgeMs,\n            runningRaw: p.runningRaw,\n            troubleRaw: p.troubleRaw,\n            timestamp: p.timestamp\n        }\n    };\n}\n\nconst previous = context.get(\"state\");\nconst queries = [];\n\n// Tabel utama selalu menerima status dan waktu RTC terbaru.\n// MAIN TABLE INSERT DIHAPUS\n// Hanya menyimpan perubahan RUN/TROUBLE\n\n// Tabel RUN menerima baseline dan setiap perubahan status.\nif (!previous || previous.run !== runStatus) {\n    queries.push(makeInsert(RUN_TABLE, runStatus, \"RUN\"));\n}\n\n// Tabel TROUBLE menerima baseline dan setiap perubahan status.\nif (!previous || previous.trouble !== troubleStatus) {\n    queries.push(makeInsert(TROUBLE_TABLE, troubleStatus, \"TROUBLE\"));\n}\n\ncontext.set(\"state\", {\n    run: runStatus,\n    trouble: troubleStatus\n});\n\nlet fill = \"grey\";\nif (mainStatus === \"RUNNING\") {\n    fill = \"green\";\n}\nelse if (mainStatus === \"TROUBLE\") {\n    fill = \"red\";\n}\n\nnode.status({\n    fill,\n    shape: \"dot\",\n    text: `${mainStatus} | RTC ${createdAt} | SQL:${queries.length}`\n});\n\n// Array pada output pertama membuat MySQL menerima query satu per satu.\nreturn [queries];\n",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 1490,
        "y": 670,
        "wires": [
            [
                "9ff362f6bc229855"
            ]
        ]
    },
    {
        "id": "3319cbe135f088c6",
        "type": "function",
        "z": "a64f6aa777a995f8",
        "name": "IMC-94 | SQL Logger",
        "func": "/*\n=========================================================\n IMC-94 - DATABASE LOGGER + RTC created_at\n=========================================================\nMAIN     : rh_imc_94\nRUN      : rh_imc_94_run\nTROUBLE  : rh_imc_94_trouble\n\ncreated_at wajib berasal dari RTC I2C.\nJika RTC belum sinkron atau lebih dari 5 detik tidak diperbarui,\nsemua INSERT untuk mesin ini dibatalkan.\n\nMAIN:\n- INSERT setiap paket mesin terkait.\n\nRUN / TROUBLE:\n- INSERT baseline pertama setelah deploy/restart.\n- INSERT hanya ketika status berubah LOW <-> HIGH.\n=========================================================\n*/\n\nconst MACHINE = \"IMC-94\";\nconst MAIN_TABLE = \"rh_imc_94\";\nconst RUN_TABLE = \"rh_imc_94_run\";\nconst TROUBLE_TABLE = \"rh_imc_94_trouble\";\nconst RTC_MAX_AGE_MS = 5000;\n\nconst p = msg.payload;\n\nif (!p || p.name !== MACHINE) {\n    return null;\n}\n\nconst createdAt = global.get(\"rtc_sql_datetime\");\nconst rtcLastReceivedMs = Number(global.get(\"rtc_last_received_ms\"));\nconst rtcAgeMs = Date.now() - rtcLastReceivedMs;\n\nif (\n    typeof createdAt !== \"string\" ||\n    !/^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}$/.test(createdAt) ||\n    !Number.isFinite(rtcLastReceivedMs) ||\n    rtcLastReceivedMs <= 0 ||\n    rtcAgeMs < 0 ||\n    rtcAgeMs > RTC_MAX_AGE_MS\n) {\n    node.status({ fill: \"red\", shape: \"ring\", text: \"INSERT BLOCKED | RTC invalid/stale\" });\n    node.error(`${MACHINE}: INSERT dibatalkan karena RTC belum sinkron atau kedaluwarsa.`, msg);\n    return null;\n}\n\nconst runStatus = p.running === true ? \"HIGH\" : \"LOW\";\nconst troubleStatus = p.trouble === true ? \"HIGH\" : \"LOW\";\n\nlet mainStatus = \"STOPPED\";\nif (p.trouble === true) {\n    mainStatus = \"TROUBLE\";\n}\nelse if (p.running === true) {\n    mainStatus = \"RUNNING\";\n}\n\nfunction escapeSql(value) {\n    return String(value)\n        .replace(/\\\\/g, \"\\\\\\\\\")\n        .replace(/'/g, \"''\");\n}\n\nfunction makeInsert(table, status, type) {\n    const sql = `\nINSERT INTO \\`${table}\\`\n    (\\`name_line\\`, \\`status\\`, \\`created_at\\`)\nVALUES\n    (\n        '${escapeSql(MACHINE)}',\n        '${escapeSql(status)}',\n        '${escapeSql(createdAt)}'\n    );\n    `.trim();\n\n    return {\n        topic: sql,\n        payload: {\n            machine: MACHINE,\n            source_slave: p.slave,\n            table_name: table,\n            insert_type: type,\n            inserted_status: status,\n            created_at: createdAt,\n            rtc_age_ms: rtcAgeMs,\n            runningRaw: p.runningRaw,\n            troubleRaw: p.troubleRaw,\n            timestamp: p.timestamp\n        }\n    };\n}\n\nconst previous = context.get(\"state\");\nconst queries = [];\n\n// Tabel utama selalu menerima status dan waktu RTC terbaru.\n// MAIN TABLE INSERT DIHAPUS\n// Hanya menyimpan perubahan RUN/TROUBLE\n\n// Tabel RUN menerima baseline dan setiap perubahan status.\nif (!previous || previous.run !== runStatus) {\n    queries.push(makeInsert(RUN_TABLE, runStatus, \"RUN\"));\n}\n\n// Tabel TROUBLE menerima baseline dan setiap perubahan status.\nif (!previous || previous.trouble !== troubleStatus) {\n    queries.push(makeInsert(TROUBLE_TABLE, troubleStatus, \"TROUBLE\"));\n}\n\ncontext.set(\"state\", {\n    run: runStatus,\n    trouble: troubleStatus\n});\n\nlet fill = \"grey\";\nif (mainStatus === \"RUNNING\") {\n    fill = \"green\";\n}\nelse if (mainStatus === \"TROUBLE\") {\n    fill = \"red\";\n}\n\nnode.status({\n    fill,\n    shape: \"dot\",\n    text: `${mainStatus} | RTC ${createdAt} | SQL:${queries.length}`\n});\n\n// Array pada output pertama membuat MySQL menerima query satu per satu.\nreturn [queries];\n",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 1490,
        "y": 720,
        "wires": [
            [
                "9ff362f6bc229855"
            ]
        ]
    },
    {
        "id": "141814035e2da581",
        "type": "function",
        "z": "a64f6aa777a995f8",
        "name": "IMC-103 | SQL Logger",
        "func": "/*\n=========================================================\n IMC-103 - DATABASE LOGGER + RTC created_at\n=========================================================\nMAIN     : rh_imc_103\nRUN      : rh_imc_103_run\nTROUBLE  : rh_imc_103_trouble\n\ncreated_at wajib berasal dari RTC I2C.\nJika RTC belum sinkron atau lebih dari 5 detik tidak diperbarui,\nsemua INSERT untuk mesin ini dibatalkan.\n\nMAIN:\n- INSERT setiap paket mesin terkait.\n\nRUN / TROUBLE:\n- INSERT baseline pertama setelah deploy/restart.\n- INSERT hanya ketika status berubah LOW <-> HIGH.\n=========================================================\n*/\n\nconst MACHINE = \"IMC-103\";\nconst MAIN_TABLE = \"rh_imc_103\";\nconst RUN_TABLE = \"rh_imc_103_run\";\nconst TROUBLE_TABLE = \"rh_imc_103_trouble\";\nconst RTC_MAX_AGE_MS = 5000;\n\nconst p = msg.payload;\n\nif (!p || p.name !== MACHINE) {\n    return null;\n}\n\nconst createdAt = global.get(\"rtc_sql_datetime\");\nconst rtcLastReceivedMs = Number(global.get(\"rtc_last_received_ms\"));\nconst rtcAgeMs = Date.now() - rtcLastReceivedMs;\n\nif (\n    typeof createdAt !== \"string\" ||\n    !/^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}$/.test(createdAt) ||\n    !Number.isFinite(rtcLastReceivedMs) ||\n    rtcLastReceivedMs <= 0 ||\n    rtcAgeMs < 0 ||\n    rtcAgeMs > RTC_MAX_AGE_MS\n) {\n    node.status({ fill: \"red\", shape: \"ring\", text: \"INSERT BLOCKED | RTC invalid/stale\" });\n    node.error(`${MACHINE}: INSERT dibatalkan karena RTC belum sinkron atau kedaluwarsa.`, msg);\n    return null;\n}\n\nconst runStatus = p.running === true ? \"HIGH\" : \"LOW\";\nconst troubleStatus = p.trouble === true ? \"HIGH\" : \"LOW\";\n\nlet mainStatus = \"STOPPED\";\nif (p.trouble === true) {\n    mainStatus = \"TROUBLE\";\n}\nelse if (p.running === true) {\n    mainStatus = \"RUNNING\";\n}\n\nfunction escapeSql(value) {\n    return String(value)\n        .replace(/\\\\/g, \"\\\\\\\\\")\n        .replace(/'/g, \"''\");\n}\n\nfunction makeInsert(table, status, type) {\n    const sql = `\nINSERT INTO \\`${table}\\`\n    (\\`name_line\\`, \\`status\\`, \\`created_at\\`)\nVALUES\n    (\n        '${escapeSql(MACHINE)}',\n        '${escapeSql(status)}',\n        '${escapeSql(createdAt)}'\n    );\n    `.trim();\n\n    return {\n        topic: sql,\n        payload: {\n            machine: MACHINE,\n            source_slave: p.slave,\n            table_name: table,\n            insert_type: type,\n            inserted_status: status,\n            created_at: createdAt,\n            rtc_age_ms: rtcAgeMs,\n            runningRaw: p.runningRaw,\n            troubleRaw: p.troubleRaw,\n            timestamp: p.timestamp\n        }\n    };\n}\n\nconst previous = context.get(\"state\");\nconst queries = [];\n\n// Tabel utama selalu menerima status dan waktu RTC terbaru.\n// MAIN TABLE INSERT DIHAPUS\n// Hanya menyimpan perubahan RUN/TROUBLE\n\n// Tabel RUN menerima baseline dan setiap perubahan status.\nif (!previous || previous.run !== runStatus) {\n    queries.push(makeInsert(RUN_TABLE, runStatus, \"RUN\"));\n}\n\n// Tabel TROUBLE menerima baseline dan setiap perubahan status.\nif (!previous || previous.trouble !== troubleStatus) {\n    queries.push(makeInsert(TROUBLE_TABLE, troubleStatus, \"TROUBLE\"));\n}\n\ncontext.set(\"state\", {\n    run: runStatus,\n    trouble: troubleStatus\n});\n\nlet fill = \"grey\";\nif (mainStatus === \"RUNNING\") {\n    fill = \"green\";\n}\nelse if (mainStatus === \"TROUBLE\") {\n    fill = \"red\";\n}\n\nnode.status({\n    fill,\n    shape: \"dot\",\n    text: `${mainStatus} | RTC ${createdAt} | SQL:${queries.length}`\n});\n\n// Array pada output pertama membuat MySQL menerima query satu per satu.\nreturn [queries];\n",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 1490,
        "y": 770,
        "wires": [
            [
                "9ff362f6bc229855"
            ]
        ]
    },
    {
        "id": "1918d76be17e8ca2",
        "type": "function",
        "z": "a64f6aa777a995f8",
        "name": "IMC-229 | SQL Logger",
        "func": "/*\n=========================================================\n IMC-229 - DATABASE LOGGER + RTC created_at\n=========================================================\nMAIN     : rh_imc_229\nRUN      : rh_imc_229_run\nTROUBLE  : rh_imc_229_trouble\n\ncreated_at wajib berasal dari RTC I2C.\nJika RTC belum sinkron atau lebih dari 5 detik tidak diperbarui,\nsemua INSERT untuk mesin ini dibatalkan.\n\nMAIN:\n- INSERT setiap paket mesin terkait.\n\nRUN / TROUBLE:\n- INSERT baseline pertama setelah deploy/restart.\n- INSERT hanya ketika status berubah LOW <-> HIGH.\n=========================================================\n*/\n\nconst MACHINE = \"IMC-229\";\nconst MAIN_TABLE = \"rh_imc_229\";\nconst RUN_TABLE = \"rh_imc_229_run\";\nconst TROUBLE_TABLE = \"rh_imc_229_trouble\";\nconst RTC_MAX_AGE_MS = 5000;\n\nconst p = msg.payload;\n\nif (!p || p.name !== MACHINE) {\n    return null;\n}\n\nconst createdAt = global.get(\"rtc_sql_datetime\");\nconst rtcLastReceivedMs = Number(global.get(\"rtc_last_received_ms\"));\nconst rtcAgeMs = Date.now() - rtcLastReceivedMs;\n\nif (\n    typeof createdAt !== \"string\" ||\n    !/^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}$/.test(createdAt) ||\n    !Number.isFinite(rtcLastReceivedMs) ||\n    rtcLastReceivedMs <= 0 ||\n    rtcAgeMs < 0 ||\n    rtcAgeMs > RTC_MAX_AGE_MS\n) {\n    node.status({ fill: \"red\", shape: \"ring\", text: \"INSERT BLOCKED | RTC invalid/stale\" });\n    node.error(`${MACHINE}: INSERT dibatalkan karena RTC belum sinkron atau kedaluwarsa.`, msg);\n    return null;\n}\n\nconst runStatus = p.running === true ? \"HIGH\" : \"LOW\";\nconst troubleStatus = p.trouble === true ? \"HIGH\" : \"LOW\";\n\nlet mainStatus = \"STOPPED\";\nif (p.trouble === true) {\n    mainStatus = \"TROUBLE\";\n}\nelse if (p.running === true) {\n    mainStatus = \"RUNNING\";\n}\n\nfunction escapeSql(value) {\n    return String(value)\n        .replace(/\\\\/g, \"\\\\\\\\\")\n        .replace(/'/g, \"''\");\n}\n\nfunction makeInsert(table, status, type) {\n    const sql = `\nINSERT INTO \\`${table}\\`\n    (\\`name_line\\`, \\`status\\`, \\`created_at\\`)\nVALUES\n    (\n        '${escapeSql(MACHINE)}',\n        '${escapeSql(status)}',\n        '${escapeSql(createdAt)}'\n    );\n    `.trim();\n\n    return {\n        topic: sql,\n        payload: {\n            machine: MACHINE,\n            source_slave: p.slave,\n            table_name: table,\n            insert_type: type,\n            inserted_status: status,\n            created_at: createdAt,\n            rtc_age_ms: rtcAgeMs,\n            runningRaw: p.runningRaw,\n            troubleRaw: p.troubleRaw,\n            timestamp: p.timestamp\n        }\n    };\n}\n\nconst previous = context.get(\"state\");\nconst queries = [];\n\n// Tabel utama selalu menerima status dan waktu RTC terbaru.\n// MAIN TABLE INSERT DIHAPUS\n// Hanya menyimpan perubahan RUN/TROUBLE\n\n// Tabel RUN menerima baseline dan setiap perubahan status.\nif (!previous || previous.run !== runStatus) {\n    queries.push(makeInsert(RUN_TABLE, runStatus, \"RUN\"));\n}\n\n// Tabel TROUBLE menerima baseline dan setiap perubahan status.\nif (!previous || previous.trouble !== troubleStatus) {\n    queries.push(makeInsert(TROUBLE_TABLE, troubleStatus, \"TROUBLE\"));\n}\n\ncontext.set(\"state\", {\n    run: runStatus,\n    trouble: troubleStatus\n});\n\nlet fill = \"grey\";\nif (mainStatus === \"RUNNING\") {\n    fill = \"green\";\n}\nelse if (mainStatus === \"TROUBLE\") {\n    fill = \"red\";\n}\n\nnode.status({\n    fill,\n    shape: \"dot\",\n    text: `${mainStatus} | RTC ${createdAt} | SQL:${queries.length}`\n});\n\n// Array pada output pertama membuat MySQL menerima query satu per satu.\nreturn [queries];\n",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 1490,
        "y": 820,
        "wires": [
            [
                "9ff362f6bc229855"
            ]
        ]
    },
    {
        "id": "8ff3e26f6a0f2731",
        "type": "function",
        "z": "a64f6aa777a995f8",
        "name": "IMC-251 | SQL Logger",
        "func": "/*\n=========================================================\n IMC-251 - DATABASE LOGGER + RTC created_at\n=========================================================\nMAIN     : rh_imc_251\nRUN      : rh_imc_251_run\nTROUBLE  : rh_imc_251_trouble\n\ncreated_at wajib berasal dari RTC I2C.\nJika RTC belum sinkron atau lebih dari 5 detik tidak diperbarui,\nsemua INSERT untuk mesin ini dibatalkan.\n\nMAIN:\n- INSERT setiap paket mesin terkait.\n\nRUN / TROUBLE:\n- INSERT baseline pertama setelah deploy/restart.\n- INSERT hanya ketika status berubah LOW <-> HIGH.\n=========================================================\n*/\n\nconst MACHINE = \"IMC-251\";\nconst MAIN_TABLE = \"rh_imc_251\";\nconst RUN_TABLE = \"rh_imc_251_run\";\nconst TROUBLE_TABLE = \"rh_imc_251_trouble\";\nconst RTC_MAX_AGE_MS = 5000;\n\nconst p = msg.payload;\n\nif (!p || p.name !== MACHINE) {\n    return null;\n}\n\nconst createdAt = global.get(\"rtc_sql_datetime\");\nconst rtcLastReceivedMs = Number(global.get(\"rtc_last_received_ms\"));\nconst rtcAgeMs = Date.now() - rtcLastReceivedMs;\n\nif (\n    typeof createdAt !== \"string\" ||\n    !/^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}$/.test(createdAt) ||\n    !Number.isFinite(rtcLastReceivedMs) ||\n    rtcLastReceivedMs <= 0 ||\n    rtcAgeMs < 0 ||\n    rtcAgeMs > RTC_MAX_AGE_MS\n) {\n    node.status({ fill: \"red\", shape: \"ring\", text: \"INSERT BLOCKED | RTC invalid/stale\" });\n    node.error(`${MACHINE}: INSERT dibatalkan karena RTC belum sinkron atau kedaluwarsa.`, msg);\n    return null;\n}\n\nconst runStatus = p.running === true ? \"HIGH\" : \"LOW\";\nconst troubleStatus = p.trouble === true ? \"HIGH\" : \"LOW\";\n\nlet mainStatus = \"STOPPED\";\nif (p.trouble === true) {\n    mainStatus = \"TROUBLE\";\n}\nelse if (p.running === true) {\n    mainStatus = \"RUNNING\";\n}\n\nfunction escapeSql(value) {\n    return String(value)\n        .replace(/\\\\/g, \"\\\\\\\\\")\n        .replace(/'/g, \"''\");\n}\n\nfunction makeInsert(table, status, type) {\n    const sql = `\nINSERT INTO \\`${table}\\`\n    (\\`name_line\\`, \\`status\\`, \\`created_at\\`)\nVALUES\n    (\n        '${escapeSql(MACHINE)}',\n        '${escapeSql(status)}',\n        '${escapeSql(createdAt)}'\n    );\n    `.trim();\n\n    return {\n        topic: sql,\n        payload: {\n            machine: MACHINE,\n            source_slave: p.slave,\n            table_name: table,\n            insert_type: type,\n            inserted_status: status,\n            created_at: createdAt,\n            rtc_age_ms: rtcAgeMs,\n            runningRaw: p.runningRaw,\n            troubleRaw: p.troubleRaw,\n            timestamp: p.timestamp\n        }\n    };\n}\n\nconst previous = context.get(\"state\");\nconst queries = [];\n\n// Tabel utama selalu menerima status dan waktu RTC terbaru.\n// MAIN TABLE INSERT DIHAPUS\n// Hanya menyimpan perubahan RUN/TROUBLE\n\n// Tabel RUN menerima baseline dan setiap perubahan status.\nif (!previous || previous.run !== runStatus) {\n    queries.push(makeInsert(RUN_TABLE, runStatus, \"RUN\"));\n}\n\n// Tabel TROUBLE menerima baseline dan setiap perubahan status.\nif (!previous || previous.trouble !== troubleStatus) {\n    queries.push(makeInsert(TROUBLE_TABLE, troubleStatus, \"TROUBLE\"));\n}\n\ncontext.set(\"state\", {\n    run: runStatus,\n    trouble: troubleStatus\n});\n\nlet fill = \"grey\";\nif (mainStatus === \"RUNNING\") {\n    fill = \"green\";\n}\nelse if (mainStatus === \"TROUBLE\") {\n    fill = \"red\";\n}\n\nnode.status({\n    fill,\n    shape: \"dot\",\n    text: `${mainStatus} | RTC ${createdAt} | SQL:${queries.length}`\n});\n\n// Array pada output pertama membuat MySQL menerima query satu per satu.\nreturn [queries];\n",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 1490,
        "y": 870,
        "wires": [
            [
                "9ff362f6bc229855"
            ]
        ]
    },
    {
        "id": "87a231a37125fced",
        "type": "catch",
        "z": "a64f6aa777a995f8",
        "name": "Catch Flow Error",
        "scope": null,
        "uncaught": false,
        "x": 1060,
        "y": 575,
        "wires": [
            [
                "492ac3cb146f4401"
            ]
        ]
    },
    {
        "id": "492ac3cb146f4401",
        "type": "debug",
        "z": "a64f6aa777a995f8",
        "name": "FLOW ERROR",
        "active": false,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "true",
        "targetType": "full",
        "statusVal": "",
        "statusType": "auto",
        "x": 1080,
        "y": 615,
        "wires": []
    },
    {
        "id": "d36ade32c37ecb72",
        "type": "function",
        "z": "a64f6aa777a995f8",
        "name": "IDH-23 | SQL Logger",
        "func": "/*\n=========================================================\n IDH-23 - DATABASE LOGGER + RTC created_at\n=========================================================\nMAIN     : rh_idh_23\nRUN      : rh_idh_23_run\nTROUBLE  : rh_idh_23_trouble\n\ncreated_at wajib berasal dari RTC I2C.\nJika RTC belum sinkron atau lebih dari 5 detik tidak diperbarui,\nsemua INSERT untuk mesin ini dibatalkan.\n\nMAIN:\n- INSERT setiap paket mesin terkait.\n\nRUN / TROUBLE:\n- INSERT baseline pertama setelah deploy/restart.\n- INSERT hanya ketika status berubah LOW <-> HIGH.\n=========================================================\n*/\n\nconst MACHINE = \"IDH-23\";\nconst MAIN_TABLE = \"rh_idh_23\";\nconst RUN_TABLE = \"rh_idh_23_run\";\nconst TROUBLE_TABLE = \"rh_idh_23_trouble\";\nconst RTC_MAX_AGE_MS = 5000;\n\nconst p = msg.payload;\n\nif (!p || p.name !== MACHINE) {\n    return null;\n}\n\nconst createdAt = global.get(\"rtc_sql_datetime\");\nconst rtcLastReceivedMs = Number(global.get(\"rtc_last_received_ms\"));\nconst rtcAgeMs = Date.now() - rtcLastReceivedMs;\n\nif (\n    typeof createdAt !== \"string\" ||\n    !/^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}$/.test(createdAt) ||\n    !Number.isFinite(rtcLastReceivedMs) ||\n    rtcLastReceivedMs <= 0 ||\n    rtcAgeMs < 0 ||\n    rtcAgeMs > RTC_MAX_AGE_MS\n) {\n    node.status({ fill: \"red\", shape: \"ring\", text: \"INSERT BLOCKED | RTC invalid/stale\" });\n    node.error(`${MACHINE}: INSERT dibatalkan karena RTC belum sinkron atau kedaluwarsa.`, msg);\n    return null;\n}\n\nconst runStatus = p.running === true ? \"HIGH\" : \"LOW\";\nconst troubleStatus = p.trouble === true ? \"HIGH\" : \"LOW\";\n\nlet mainStatus = \"STOPPED\";\nif (p.trouble === true) {\n    mainStatus = \"TROUBLE\";\n}\nelse if (p.running === true) {\n    mainStatus = \"RUNNING\";\n}\n\nfunction escapeSql(value) {\n    return String(value)\n        .replace(/\\\\/g, \"\\\\\\\\\")\n        .replace(/'/g, \"''\");\n}\n\nfunction makeInsert(table, status, type) {\n    const sql = `\nINSERT INTO \\`${table}\\`\n    (\\`name_line\\`, \\`status\\`, \\`created_at\\`)\nVALUES\n    (\n        '${escapeSql(MACHINE)}',\n        '${escapeSql(status)}',\n        '${escapeSql(createdAt)}'\n    );\n    `.trim();\n\n    return {\n        topic: sql,\n        payload: {\n            machine: MACHINE,\n            source_slave: p.slave,\n            table_name: table,\n            insert_type: type,\n            inserted_status: status,\n            created_at: createdAt,\n            rtc_age_ms: rtcAgeMs,\n            runningRaw: p.runningRaw,\n            troubleRaw: p.troubleRaw,\n            timestamp: p.timestamp\n        }\n    };\n}\n\nconst previous = context.get(\"state\");\nconst queries = [];\n\n// Tabel utama selalu menerima status dan waktu RTC terbaru.\n// MAIN TABLE INSERT DIHAPUS\n// Hanya menyimpan perubahan RUN/TROUBLE\n\n// Tabel RUN menerima baseline dan setiap perubahan status.\nif (!previous || previous.run !== runStatus) {\n    queries.push(makeInsert(RUN_TABLE, runStatus, \"RUN\"));\n}\n\n// Tabel TROUBLE menerima baseline dan setiap perubahan status.\nif (!previous || previous.trouble !== troubleStatus) {\n    queries.push(makeInsert(TROUBLE_TABLE, troubleStatus, \"TROUBLE\"));\n}\n\ncontext.set(\"state\", {\n    run: runStatus,\n    trouble: troubleStatus\n});\n\nlet fill = \"grey\";\nif (mainStatus === \"RUNNING\") {\n    fill = \"green\";\n}\nelse if (mainStatus === \"TROUBLE\") {\n    fill = \"red\";\n}\n\nnode.status({\n    fill,\n    shape: \"dot\",\n    text: `${mainStatus} | RTC ${createdAt} | SQL:${queries.length}`\n});\n\n// Array pada output pertama membuat MySQL menerima query satu per satu.\nreturn [queries];\n",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 1490,
        "y": 920,
        "wires": [
            [
                "9ff362f6bc229855"
            ]
        ]
    },
    {
        "id": "2dfe3534e622a524",
        "type": "comment",
        "z": "a64f6aa777a995f8",
        "name": "MODBUS IDs + RTC + SERIAL STATUS",
        "info": "Tidak ada IMC-23. Setiap perubahan RUN HIGH/LOW dan TROUBLE HIGH/LOW dikirim melalui serial /dev/ttyUSB1.",
        "x": 1130,
        "y": 485,
        "wires": []
    },
    {
        "id": "1c2196d3176dda2a",
        "type": "function",
        "z": "a64f6aa777a995f8",
        "name": "INPUT RTC I2C | Sync created_at",
        "func": "/*\n=========================================================\n RTC I2C -> created_at MySQL\n=========================================================\nHubungkan output node RTC I2C langsung ke input Function ini.\n\nFormat yang didukung:\n1. Object Indonesia dari RTC pengguna:\n   {tahun:2026, bulan:9, tanggal:1, jam:18, menit:1, detik:33}\n   Properti hariNomor dan hari boleh tetap ada dan akan diabaikan.\n2. Object umum:\n   {year:2026, month:9, day:1, hour:18, minute:1, second:33}\n3. String:\n   \"2026-09-01 17:25:57\" atau ISO datetime\n4. Epoch detik/milidetik\n5. Buffer BCD register DS3231/DS1307 mulai register 0\n\nUntuk format epoch, offset disetel WIB (UTC+7).\nNilai tanggal yang dimasukkan ke database tetap berasal dari RTC.\n=========================================================\n*/\n\nconst EPOCH_OFFSET_MINUTES = 7 * 60; // WIB / UTC+7\n\nfunction pad(value) {\n    return String(value).padStart(2, \"0\");\n}\n\nfunction bcdToNumber(value) {\n    return ((value >> 4) * 10) + (value & 0x0F);\n}\n\nfunction validateParts(parts) {\n    const values = [\n        parts.year, parts.month, parts.day,\n        parts.hour, parts.minute, parts.second\n    ].map(Number);\n\n    if (values.some(value => !Number.isInteger(value))) {\n        return null;\n    }\n\n    const [year, month, day, hour, minute, second] = values;\n    const neutralDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));\n\n    if (\n        year < 2000 || year > 2199 ||\n        neutralDate.getUTCFullYear() !== year ||\n        neutralDate.getUTCMonth() + 1 !== month ||\n        neutralDate.getUTCDate() !== day ||\n        neutralDate.getUTCHours() !== hour ||\n        neutralDate.getUTCMinutes() !== minute ||\n        neutralDate.getUTCSeconds() !== second\n    ) {\n        return null;\n    }\n\n    return { year, month, day, hour, minute, second };\n}\n\nfunction partsFromEpoch(value) {\n    let epochMs = Number(value);\n\n    if (!Number.isFinite(epochMs)) {\n        return null;\n    }\n\n    // Nilai kurang dari 10^12 dianggap epoch detik.\n    if (Math.abs(epochMs) < 1e12) {\n        epochMs *= 1000;\n    }\n\n    const date = new Date(epochMs + (EPOCH_OFFSET_MINUTES * 60000));\n\n    if (!Number.isFinite(date.getTime())) {\n        return null;\n    }\n\n    return validateParts({\n        year: date.getUTCFullYear(),\n        month: date.getUTCMonth() + 1,\n        day: date.getUTCDate(),\n        hour: date.getUTCHours(),\n        minute: date.getUTCMinutes(),\n        second: date.getUTCSeconds()\n    });\n}\n\nfunction partsFromString(value) {\n    const text = String(value ?? \"\").trim();\n\n    const directMatch = text.match(\n        /^(\\d{4})[-/](\\d{1,2})[-/](\\d{1,2})[ T](\\d{1,2}):(\\d{1,2})(?::(\\d{1,2}))?/\n    );\n\n    if (directMatch) {\n        return validateParts({\n            year: Number(directMatch[1]),\n            month: Number(directMatch[2]),\n            day: Number(directMatch[3]),\n            hour: Number(directMatch[4]),\n            minute: Number(directMatch[5]),\n            second: Number(directMatch[6] ?? 0)\n        });\n    }\n\n    if (/^\\d{10,13}$/.test(text)) {\n        return partsFromEpoch(Number(text));\n    }\n\n    const parsed = Date.parse(text);\n    return Number.isFinite(parsed) ? partsFromEpoch(parsed) : null;\n}\n\nfunction partsFromBcdBuffer(buffer) {\n    if (!Buffer.isBuffer(buffer) || buffer.length < 7) {\n        return null;\n    }\n\n    const second = bcdToNumber(buffer[0] & 0x7F);\n    const minute = bcdToNumber(buffer[1] & 0x7F);\n    const hourRegister = buffer[2];\n    let hour;\n\n    if ((hourRegister & 0x40) !== 0) {\n        // Mode 12 jam.\n        hour = bcdToNumber(hourRegister & 0x1F);\n        const isPm = (hourRegister & 0x20) !== 0;\n        hour = (hour % 12) + (isPm ? 12 : 0);\n    }\n    else {\n        // Mode 24 jam.\n        hour = bcdToNumber(hourRegister & 0x3F);\n    }\n\n    const day = bcdToNumber(buffer[4] & 0x3F);\n    const monthRegister = buffer[5];\n    const month = bcdToNumber(monthRegister & 0x1F);\n    const century = (monthRegister & 0x80) !== 0 ? 100 : 0;\n    const year = 2000 + century + bcdToNumber(buffer[6]);\n\n    return validateParts({ year, month, day, hour, minute, second });\n}\n\nfunction partsFromObject(value) {\n    if (!value || typeof value !== \"object\" || Array.isArray(value)) {\n        return null;\n    }\n\n    if (value instanceof Date) {\n        return partsFromEpoch(value.getTime());\n    }\n\n    const year = value.tahun ?? value.year ?? value.years ?? value.fullYear;\n    const month = value.bulan ?? value.month ?? value.months;\n    const day = value.tanggal ?? value.day ?? value.date ?? value.dayOfMonth;\n    const hour = value.jam ?? value.hour ?? value.hours;\n    const minute = value.menit ?? value.minute ?? value.minutes ?? value.min;\n    const second = value.detik ?? value.second ?? value.seconds ?? value.sec ?? 0;\n\n    if (\n        year !== undefined && month !== undefined && day !== undefined &&\n        hour !== undefined && minute !== undefined\n    ) {\n        const normalizedYear = Number(year) < 100 ? 2000 + Number(year) : Number(year);\n        return validateParts({\n            year: normalizedYear,\n            month: Number(month),\n            day: Number(day),\n            hour: Number(hour),\n            minute: Number(minute),\n            second: Number(second)\n        });\n    }\n\n    const nestedKeys = [\n        \"datetime\", \"dateTime\", \"rtc_datetime\", \"rtcDateTime\",\n        \"timestamp\", \"time\", \"value\", \"rtc\", \"data\"\n    ];\n\n    for (const key of nestedKeys) {\n        if (value[key] !== undefined && value[key] !== value) {\n            const nestedParts = extractParts(value[key]);\n            if (nestedParts) {\n                return nestedParts;\n            }\n        }\n    }\n\n    return null;\n}\n\nfunction extractParts(value) {\n    if (Buffer.isBuffer(value)) {\n        const asText = value.toString(\"utf8\").trim();\n        const looksLikeText = asText.length > 0 && /^[\\x20-\\x7E]+$/.test(asText);\n\n        if (looksLikeText) {\n            try {\n                return partsFromObject(JSON.parse(asText)) || partsFromString(asText);\n            }\n            catch (err) {\n                return partsFromString(asText);\n            }\n        }\n\n        return partsFromBcdBuffer(value);\n    }\n\n    if (typeof value === \"number\") {\n        return partsFromEpoch(value);\n    }\n\n    if (typeof value === \"string\") {\n        try {\n            const parsedJson = JSON.parse(value);\n            if (parsedJson !== value) {\n                const jsonParts = extractParts(parsedJson);\n                if (jsonParts) {\n                    return jsonParts;\n                }\n            }\n        }\n        catch (err) {\n            // String biasa diproses di bawah.\n        }\n\n        return partsFromString(value);\n    }\n\n    return partsFromObject(value);\n}\n\nconst parts = extractParts(msg.payload);\n\nif (!parts) {\n    global.set(\"rtc_sql_datetime\", null);\n    global.set(\"rtc_last_received_ms\", null);\n    node.status({ fill: \"red\", shape: \"ring\", text: \"Format RTC tidak dikenali\" });\n    node.error(\"Format payload RTC tidak dikenali. INSERT mesin dihentikan.\", msg);\n    return null;\n}\n\nconst sqlDateTime =\n    `${parts.year}-${pad(parts.month)}-${pad(parts.day)} ` +\n    `${pad(parts.hour)}:${pad(parts.minute)}:${pad(parts.second)}`;\n\nglobal.set(\"rtc_sql_datetime\", sqlDateTime);\nglobal.set(\"rtc_last_received_ms\", Date.now());\n\nnode.status({ fill: \"green\", shape: \"dot\", text: sqlDateTime });\n\nmsg.rtc_created_at = sqlDateTime;\nmsg.payload = {\n    created_at: sqlDateTime,\n    source: \"RTC_I2C\",\n    valid: true\n};\n\nreturn msg;\n",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 1120,
        "y": 520,
        "wires": [
            []
        ]
    },
    {
        "id": "a052877a38d8aedc",
        "type": "serial out",
        "z": "a64f6aa777a995f8",
        "name": "",
        "serial": "f51caeaae1ac2d4a",
        "x": 1890,
        "y": 400,
        "wires": []
    },
    {
        "id": "61c0e617a21b1322",
        "type": "function",
        "z": "a64f6aa777a995f8",
        "name": "Detect RUN TROUBLE HIGH LOW",
        "func": "// Kirim perubahan status ke /dev/ttyUSB1\n// Format:\n// NAMA_MESIN,RUN,HIGH\n// NAMA_MESIN,RUN,LOW\n// NAMA_MESIN,TROUBLE,HIGH\n// NAMA_MESIN,TROUBLE,LOW\n\nlet p = msg.payload;\n\nif (!p || !p.name) {\n    return null;\n}\n\nlet old = context.get(p.name) || {};\nlet result = [];\n\nlet run = p.running ? \"HIGH\" : \"LOW\";\nlet trouble = p.trouble ? \"HIGH\" : \"LOW\";\n\nif (old.run !== run) {\n    result.push({\n        payload: p.name + \",RUN,\" + run + \"\\n\"\n    });\n}\n\nif (old.trouble !== trouble) {\n    result.push({\n        payload: p.name + \",TROUBLE,\" + trouble + \"\\n\"\n    });\n}\n\ncontext.set(p.name, {\n    run: run,\n    trouble: trouble\n});\n\nreturn [result];",
        "outputs": 1,
        "x": 1540,
        "y": 520,
        "wires": [
            [
                "a052877a38d8aedc"
            ]
        ]
    },
    {
        "id": "17ad98e120fc22d4",
        "type": "modbus-client",
        "name": "",
        "clienttype": "serial",
        "bufferCommands": true,
        "stateLogEnabled": false,
        "queueLogEnabled": false,
        "failureLogEnabled": true,
        "tcpHost": "127.0.0.1",
        "tcpPort": 502,
        "tcpType": "DEFAULT",
        "serialPort": "/dev/ttyUSB1",
        "serialType": "RTU-BUFFERD",
        "serialBaudrate": 9600,
        "serialDatabits": 8,
        "serialStopbits": 1,
        "serialParity": "none",
        "serialConnectionDelay": 100,
        "serialAsciiResponseStartDelimiter": "0x3A",
        "unit_id": 1,
        "commandDelay": 1,
        "clientTimeout": 1000,
        "reconnectOnTimeout": true,
        "reconnectTimeout": 2000,
        "parallelUnitIdsAllowed": true,
        "showErrors": false,
        "showWarnings": true,
        "showLogs": true
    },
    {
        "id": "19f621ac54f58e61",
        "type": "MySQLdatabase",
        "name": "",
        "host": "localhost",
        "port": "3306",
        "db": "database_tps_running_hour_machine",
        "tz": "",
        "charset": "UTF8"
    },
    {
        "id": "f51caeaae1ac2d4a",
        "type": "serial-port",
        "name": "",
        "serialport": "/dev/ttyUSB0",
        "serialbaud": "9600",
        "databits": 8,
        "parity": "none",
        "stopbits": 1,
        "waitfor": "",
        "dtr": "none",
        "rts": "none",
        "cts": "none",
        "dsr": "none",
        "newline": "\\n",
        "bin": "false",
        "out": "char",
        "addchar": "",
        "responsetimeout": 10000
    },
    {
        "id": "db85a9e341121f9d",
        "type": "global-config",
        "env": [],
        "modules": {
            "node-red-contrib-modbus": "5.60.2",
            "node-red-node-mysql": "3.0.3",
            "node-red-node-serialport": "2.0.3"
        }
    }
]
