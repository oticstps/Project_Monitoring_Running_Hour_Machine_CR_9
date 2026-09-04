[
    {
        "id": "59c54395c62872e0",
        "type": "function",
        "z": "7b2681a7fde4633e",
        "name": "Request Modbus ID 1",
        "func": "// =============================================\n// REQUEST PERTAMA KE MODBUS SLAVE ID 1\n// FC2 = Read Discrete Input, Address 0, Quantity 16\n// =============================================\n\nmsg.payload = {\n    fc: 2,\n    unitid: 1,\n    address: 0,\n    quantity: 16\n};\n\nmsg.pollUnit = 1;\nmsg.topic = \"request_unit_1\";\n\n// Dipakai node recovery untuk mengetahui ID yang sedang dibaca\nflow.set(\"lastPollUnit\", 1);\n\nreturn msg;",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 280,
        "y": 185,
        "wires": [
            [
                "6404c29984c816a9"
            ]
        ]
    },
    {
        "id": "53702ac11bba6858",
        "type": "function",
        "z": "7b2681a7fde4633e",
        "name": "Process + Next ID",
        "func": "// =====================================================\n// PROSES RESPONS MODBUS SECARA BERURUTAN\n//\n// ID 1 : R9A + 16 bit data + R9B\n// ID 2 : R9C + 8 bit data  + R9D\n// ID 3 : R9E + 8 bit data  + R9F\n//\n// Urutan polling: ID 1 -> ID 2 -> ID 3 -> ID 1\n// =====================================================\n\nlet inputData = null;\n\nif (Array.isArray(msg.payload)) {\n    inputData = msg.payload;\n} else if (msg.payload && Array.isArray(msg.payload.data)) {\n    inputData = msg.payload.data;\n} else if (Array.isArray(msg.data)) {\n    inputData = msg.data;\n}\n\nif (!inputData) {\n    node.warn(\"Data respons Modbus bukan array\");\n    return [null, null];\n}\n\nlet data = inputData.map(function(value) {\n    if (value === true || value === 1 || value === \"1\") return \"1\";\n    return \"0\";\n});\n\nlet dataString = data.join(\"\");\n\nfunction buatRequest(unitid, quantity) {\n    flow.set(\"lastPollUnit\", unitid);\n    return {\n        payload: {\n            fc: 2,\n            unitid: unitid,\n            address: 0,\n            quantity: quantity\n        },\n        pollUnit: unitid,\n        topic: \"request_unit_\" + unitid\n    };\n}\n\nif (Number(msg.pollUnit) === 1) {\n    dataString = dataString.substring(0, 16);\n\n    let outputMsg = {\n        payload: \"R9A\" + dataString + \"R9B\",\n        topic: \"input_id_1\",\n        unitid: 1,\n        dataLength: data.length\n    };\n\n    node.status({fill: \"green\", shape: \"dot\", text: \"ID1 OK -> ID2\"});\n    return [outputMsg, buatRequest(2, 8)];\n}\n\nif (Number(msg.pollUnit) === 2) {\n    dataString = dataString.substring(0, 8);\n\n    let outputMsg = {\n        payload: \"R9C\" + dataString + \"R9D\",\n        topic: \"input_id_2\",\n        unitid: 2,\n        dataLength: data.length\n    };\n\n    node.status({fill: \"green\", shape: \"dot\", text: \"ID2 OK -> ID3\"});\n    return [outputMsg, buatRequest(3, 8)];\n}\n\nif (Number(msg.pollUnit) === 3) {\n    dataString = dataString.substring(0, 8);\n\n    let outputMsg = {\n        payload: \"R9E\" + dataString + \"R9F\",\n        topic: \"input_id_3\",\n        unitid: 3,\n        dataLength: data.length\n    };\n\n    node.status({fill: \"green\", shape: \"dot\", text: \"ID3 OK -> ID1\"});\n    return [outputMsg, buatRequest(1, 16)];\n}\n\nnode.warn(\"pollUnit tidak diketahui: \" + msg.pollUnit);\nreturn [null, null];",
        "outputs": 2,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 270,
        "y": 240,
        "wires": [
            [
                "b06769c66a47a0b1"
            ],
            [
                "18ab6d78b4fed91d"
            ]
        ]
    },
    {
        "id": "18ab6d78b4fed91d",
        "type": "delay",
        "z": "7b2681a7fde4633e",
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
        "x": 300,
        "y": 280,
        "wires": [
            [
                "6404c29984c816a9"
            ]
        ]
    },
    {
        "id": "b06769c66a47a0b1",
        "type": "switch",
        "z": "7b2681a7fde4633e",
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
        "x": 620,
        "y": 255,
        "wires": [
            [
                "75ca930eb164b944"
            ],
            [
                "15320c5a9aa5d7e4"
            ],
            [
                "98e042f55419bbd1"
            ]
        ]
    },
    {
        "id": "c8bc0f70ee9b4f40",
        "type": "catch",
        "z": "7b2681a7fde4633e",
        "name": "Catch Modbus Error",
        "scope": [
            "6404c29984c816a9"
        ],
        "uncaught": false,
        "x": 365,
        "y": 395,
        "wires": [
            [
                "f9ad10d3ba83eafa"
            ]
        ]
    },
    {
        "id": "f9ad10d3ba83eafa",
        "type": "function",
        "z": "7b2681a7fde4633e",
        "name": "Recovery -> Lanjut ID Berikutnya",
        "func": "// =====================================================\n// RECOVERY TIMEOUT / ERROR MODBUS\n// Jika ID 2 belum tersedia, polling tetap dilanjutkan ke ID 3.\n// ID 2 akan dicoba kembali pada siklus berikutnya.\n// =====================================================\n\nlet now = Date.now();\nlet lastRecovery = context.get(\"lastRecovery\") || 0;\n\nif ((now - lastRecovery) < 1500) {\n    return null;\n}\ncontext.set(\"lastRecovery\", now);\n\nlet failedUnit = Number(msg.pollUnit || flow.get(\"lastPollUnit\") || 1);\nlet nextUnit;\nlet quantity;\n\nif (failedUnit === 1) {\n    nextUnit = 2;\n    quantity = 8;\n} else if (failedUnit === 2) {\n    nextUnit = 3;\n    quantity = 8;\n} else {\n    nextUnit = 1;\n    quantity = 16;\n}\n\nif (msg.error) {\n    node.warn(\"Modbus ID \" + failedUnit + \" gagal: \" + msg.error.message);\n}\n\nmsg.payload = {\n    fc: 2,\n    unitid: nextUnit,\n    address: 0,\n    quantity: quantity\n};\nmsg.pollUnit = nextUnit;\nmsg.topic = \"recovery_after_id_\" + failedUnit + \"_request_unit_\" + nextUnit;\n\nflow.set(\"lastPollUnit\", nextUnit);\ndelete msg.error;\n\nnode.status({\n    fill: \"yellow\",\n    shape: \"ring\",\n    text: \"ID\" + failedUnit + \" gagal -> ID\" + nextUnit\n});\n\nreturn msg;",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 415,
        "y": 440,
        "wires": [
            [
                "aace8e8b9f6f3166"
            ]
        ]
    },
    {
        "id": "aace8e8b9f6f3166",
        "type": "delay",
        "z": "7b2681a7fde4633e",
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
        "x": 385,
        "y": 485,
        "wires": [
            [
                "6404c29984c816a9"
            ]
        ]
    },
    {
        "id": "6af6547324e38efd",
        "type": "link in",
        "z": "7b2681a7fde4633e",
        "name": "link in 1",
        "links": [
            "f77e1153d44190e1"
        ],
        "x": 985,
        "y": 475,
        "wires": [
            [
                "dcd5a66906adccad",
                "08cac353b8f28693"
            ]
        ]
    },
    {
        "id": "dcd5a66906adccad",
        "type": "debug",
        "z": "7b2681a7fde4633e",
        "name": "debug 1",
        "active": false,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "false",
        "statusVal": "",
        "statusType": "auto",
        "x": 1100,
        "y": 435,
        "wires": []
    },
    {
        "id": "6404c29984c816a9",
        "type": "modbus-flex-getter",
        "z": "7b2681a7fde4633e",
        "name": "Modbus Sequential ID 1 + ID 2 + ID 3",
        "showStatusActivities": true,
        "showErrors": true,
        "showWarnings": true,
        "logIOActivities": false,
        "server": "1e2edc22e74a7ab4",
        "useIOFile": false,
        "ioFile": "",
        "useIOForPayload": false,
        "emptyMsgOnFail": false,
        "keepMsgProperties": true,
        "delayOnStart": false,
        "enableDeformedMessages": false,
        "startDelayTime": "",
        "x": 660,
        "y": 190,
        "wires": [
            [
                "53702ac11bba6858"
            ],
            []
        ]
    },
    {
        "id": "3385e9f71cbbaa8a",
        "type": "inject",
        "z": "7b2681a7fde4633e",
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
        "x": 260,
        "y": 145,
        "wires": [
            [
                "59c54395c62872e0"
            ]
        ]
    },
    {
        "id": "75ca930eb164b944",
        "type": "function",
        "z": "7b2681a7fde4633e",
        "name": "parsing id 1",
        "func": "let input = msg.payload.toString().trim();\n\nlet mapping = {\n    \"R9A\": {\n        end: \"R9B\",\n        tag: [\n            \"IMC_21_run\",\n            \"IMC_21_trouble\",\n            \"IMC_20_run\",\n            \"IMC_20_trouble\",\n            \"IMC_19_run\",\n            \"IMC_19_trouble\",\n            \"IMC_103_run\",\n            \"IMC_103_trouble\",\n            \"IMC_94_run\",\n            \"IMC_94_trouble\",\n            \"IMC_61_run\",\n            \"IMC_61_trouble\",\n            \"IMC_251_run\",\n            \"IMC_251_trouble\",\n            \"IDH_23_run\",\n            \"IDH_23_trouble\"\n        ]\n    }\n};\n\n\n// cek awalan\nlet header = input.substring(0, 3);\n\n\nif (mapping[header]) {\n\n    let footer = mapping[header].end;\n\n    // cek akhiran\n    if (input.endsWith(footer)) {\n\n        // ambil data tengah\n        let rawData = input.substring(\n            3,\n            input.length - 3\n        );\n\n\n        // pecah tiap char\n        let bit = rawData.split(\"\");\n\n\n        let result = {};\n\n        mapping[header].tag.forEach((name, index) => {\n\n            result[name] = Number(bit[index] || 0);\n\n        });\n\n\n        msg.payload = {\n            slave: header,\n            raw: rawData,\n            data: result\n        };\n\n\n        return msg;\n\n    }\n\n}\n\n\n// jika tidak cocok\nmsg.payload = {\n    error: \"Format tidak dikenali\",\n    raw: input\n};\n\nreturn msg;",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 875,
        "y": 245,
        "wires": [
            [
                "45f337d2b646aba6"
            ]
        ]
    },
    {
        "id": "15320c5a9aa5d7e4",
        "type": "function",
        "z": "7b2681a7fde4633e",
        "name": "parsing id 2",
        "func": "// =====================================================\n// PARSER ID 2: R9C + 8 BIT + R9D\n// =====================================================\n\nlet input = msg.payload.toString().trim();\nlet header = \"R9C\";\nlet footer = \"R9D\";\n\nlet tags = [\n    \"IMC_29_run\",\n    \"IMC_29_trouble\",\n    \"IMC_40_run\",\n    \"IMC_40_trouble\",\n    \"IMC_28_run\",\n    \"IMC_28_trouble\",\n    \"IMC_10_run\",\n    \"IMC_10_trouble\"\n];\n\nif (input.startsWith(header) && input.endsWith(footer)) {\n    let rawData = input.substring(header.length, input.length - footer.length);\n    let bits = rawData.split(\"\");\n    let result = {};\n\n    tags.forEach(function(tag, index) {\n        result[tag] = Number(bits[index] || 0);\n    });\n\n    msg.payload = {\n        slave: header,\n        raw_data: rawData,\n        jumlah_data: bits.length,\n        device: result\n    };\n    return msg;\n}\n\nmsg.payload = {\n    error: \"Frame ID 2 tidak sesuai\",\n    data_masuk: input\n};\nreturn msg;",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 875,
        "y": 285,
        "wires": [
            [
                "45f337d2b646aba6"
            ]
        ]
    },
    {
        "id": "98e042f55419bbd1",
        "type": "function",
        "z": "7b2681a7fde4633e",
        "name": "parsing id 3",
        "func": "// ===============================\n// NODE RED FUNCTION PARSER\n// MODBUS STRING FRAME PARSER\n// ===============================\n\n\nlet input = msg.payload.toString().trim();\n\n\n// Mapping Slave ID\nlet mapping = {\n\n    // ==========================\n    // SLAVE R9A - R9B\n    // ==========================\n    \"R9A\": {\n        end:\"R9B\",\n        tag:[\n            \"IMC_21_run\",\n            \"IMC_21_trouble\",\n\n            \"IMC_20_run\",\n            \"IMC_20_trouble\",\n\n            \"IMC_19_run\",\n            \"IMC_19_trouble\",\n\n            \"IMC_103_run\",\n            \"IMC_103_trouble\",\n\n            \"IMC_94_run\",\n            \"IMC_94_trouble\",\n\n            \"IMC_61_run\",\n            \"IMC_61_trouble\",\n\n            \"IMC_251_run\",\n            \"IMC_251_trouble\",\n\n            \"IDH_23_run\",\n            \"IDH_23_trouble\"\n        ]\n    },\n\n\n    // ==========================\n    // SLAVE R9E - R9F\n    // ==========================\n    \"R9E\": {\n        end:\"R9F\",\n        tag:[\n            \"IMC_45_run\",\n            \"IMC_45_trouble\",\n\n            \"IMC_229_run\",\n            \"IMC_229_trouble\"\n        ]\n    }\n\n};\n\n\n\n// ===============================\n// AMBIL HEADER\n// ===============================\n\nlet header = input.substring(0,3);\n\n\n// cek slave tersedia\nif(mapping[header]){\n\n\n    let footer = mapping[header].end;\n\n\n    // cek footer\n    if(input.endsWith(footer)){\n\n\n        // ambil data di tengah\n        let rawData = input.substring(\n            3,\n            input.length - 3\n        );\n\n\n        // pecah karakter\n        let bits = rawData.split(\"\");\n\n\n\n        let result = {};\n\n\n\n        // mapping bit ke device\n        mapping[header].tag.forEach((device,index)=>{\n\n\n            result[device] = Number(bits[index] || 0);\n\n\n        });\n\n\n\n        // output\n        msg.payload = {\n\n            slave: header,\n\n            raw_data: rawData,\n\n            jumlah_data: bits.length,\n\n            device: result\n\n        };\n\n\n        return msg;\n\n\n    }\n\n\n}\n\n\n\n// Jika frame salah\n\nmsg.payload = {\n\n    error:\"Frame tidak sesuai\",\n\n    data_masuk:input\n\n};\n\n\nreturn msg;",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 875,
        "y": 325,
        "wires": [
            [
                "45f337d2b646aba6"
            ]
        ]
    },
    {
        "id": "019db8d4751254bb",
        "type": "mysql",
        "z": "7b2681a7fde4633e",
        "mydb": "19f621ac54f58e61",
        "name": "",
        "x": 1965,
        "y": 170,
        "wires": [
            []
        ]
    },
    {
        "id": "811baa8f090a8e85",
        "type": "comment",
        "z": "7b2681a7fde4633e",
        "name": "3 PLC INPUTS + RTC I2C -> 15 MACHINES -> 45 TABLES",
        "info": "R9A/R9C/R9E diparsing menjadi 15 mesin. created_at wajib berasal dari RTC I2C. Logger per mesin mengirim status + waktu RTC ke shared MySQL.",
        "x": 1250,
        "y": 110,
        "wires": []
    },
    {
        "id": "45f337d2b646aba6",
        "type": "function",
        "z": "7b2681a7fde4633e",
        "name": "Parse R9A/R9C/R9E -> 15 Outputs",
        "func": "/*\n=========================================================\n PARSER 3 INPUT PLC -> 15 MESIN / 15 OUTPUT\n=========================================================\nInput yang diterima:\n- R9A: payload.raw      = 16 bit (8 pasang RUN/TROUBLE)\n- R9C: payload.raw_data =  8 bit (4 pasang RUN/TROUBLE)\n- R9E: payload.raw_data =  8 bit (3 pasang + 1 reserved)\n\nUrutan setiap pasangan: RUN lalu TROUBLE.\nNilai 1 = HIGH/aktif, nilai 0 = LOW/tidak aktif.\n\nOUTPUT:\n 1 IMC-40    2 IMC-10    3 IMC-28    4 IMC-29\n 5 IMC-19    6 IMC-20    7 IMC-21    8 IMC-23\n 9 IMC-45   10 IMC-61   11 IMC-94   12 IMC-103\n13 IMC-229  14 IMC-251  15 IDH-23\n=========================================================\n*/\n\nconst ROUTES = {\n    R9A: {\n        expectedLength: 16,\n        outputStart: 0,\n        machines: [\n            \"IMC-40\", \"IMC-10\", \"IMC-28\", \"IMC-29\",\n            \"IMC-19\", \"IMC-20\", \"IMC-21\", \"IMC-23\"\n        ]\n    },\n    R9C: {\n        expectedLength: 8,\n        outputStart: 8,\n        machines: [\"IMC-45\", \"IMC-61\", \"IMC-94\", \"IMC-103\"]\n    },\n    R9E: {\n        expectedLength: 8,\n        outputStart: 12,\n        machines: [\"IMC-229\", \"IMC-251\", \"IDH-23\"]\n    }\n};\n\nlet p = msg.payload;\n\n// Tetap toleran jika objek datang sebagai Buffer/string JSON.\nif (Buffer.isBuffer(p)) {\n    p = p.toString(\"utf8\");\n}\n\nif (typeof p === \"string\") {\n    try {\n        p = JSON.parse(p);\n    }\n    catch (err) {\n        node.status({ fill: \"red\", shape: \"ring\", text: \"Payload bukan JSON valid\" });\n        return null;\n    }\n}\n\nif (!p || typeof p !== \"object\" || Array.isArray(p)) {\n    node.status({ fill: \"red\", shape: \"ring\", text: \"Payload bukan object\" });\n    return null;\n}\n\nconst slave = String(p.slave ?? \"\").trim().toUpperCase();\nconst route = ROUTES[slave];\n\nif (!route) {\n    node.status({ fill: \"yellow\", shape: \"ring\", text: `Slave ${slave || \"kosong\"} tidak dikenal` });\n    return null;\n}\n\nlet raw = p.raw ?? p.raw_data;\n\nif (Buffer.isBuffer(raw)) {\n    raw = raw.toString(\"utf8\");\n}\nelse if (Array.isArray(raw)) {\n    raw = raw.join(\"\");\n}\n\nraw = String(raw ?? \"\").replace(/\\s+/g, \"\");\n\nif (!/^[01]+$/.test(raw)) {\n    node.status({ fill: \"red\", shape: \"ring\", text: `${slave}: data harus biner 0/1` });\n    return null;\n}\n\nif (raw.length !== route.expectedLength) {\n    node.status({\n        fill: \"red\",\n        shape: \"ring\",\n        text: `${slave}: panjang ${raw.length}, harus ${route.expectedLength}`\n    });\n    return null;\n}\n\nconst outputs = Array(15).fill(null);\nconst timestamp = Date.now();\n\nroute.machines.forEach((name, index) => {\n    const bitIndex = index * 2;\n    const runningRaw = Number(raw.charAt(bitIndex));\n    const troubleRaw = Number(raw.charAt(bitIndex + 1));\n    const running = runningRaw === 1;\n    const trouble = troubleRaw === 1;\n\n    let status = \"STOPPED\";\n    if (trouble) {\n        status = \"TROUBLE\";\n    }\n    else if (running) {\n        status = \"RUNNING\";\n    }\n\n    outputs[route.outputStart + index] = {\n        payload: {\n            timestamp,\n            slave,\n            raw_data: raw,\n            name,\n            runningRaw,\n            troubleRaw,\n            running,\n            trouble,\n            status\n        }\n    };\n});\n\nnode.status({\n    fill: \"green\",\n    shape: \"dot\",\n    text: `${slave} OK | ${route.machines.length} mesin`\n});\n\nreturn outputs;\n",
        "outputs": 15,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 1175,
        "y": 245,
        "wires": [
            [
                "cd67e3b38a879726"
            ],
            [
                "6a24a6a20950ee83"
            ],
            [
                "e402791c599832cc"
            ],
            [
                "b05266695d7e6016"
            ],
            [
                "5b793f45444c4192"
            ],
            [
                "a4e86cd8da3a68a2"
            ],
            [
                "0ede89dde9fa0173"
            ],
            [
                "ef747e9525a66c6a"
            ],
            [
                "2d7857a03dd095c3"
            ],
            [
                "1c75cd487e5b1bbf"
            ],
            [
                "20640bd7442593eb"
            ],
            [
                "63fcbea4b8c49b85"
            ],
            [
                "68cd75068302d405"
            ],
            [
                "bfbf5b124cb3d194"
            ],
            [
                "0e39cd68a623ff81"
            ]
        ]
    },
    {
        "id": "cd67e3b38a879726",
        "type": "function",
        "z": "7b2681a7fde4633e",
        "name": "IMC-40 | SQL Logger",
        "func": "/*\n=========================================================\n IMC-40 - DATABASE LOGGER + RTC created_at\n=========================================================\nMAIN     : rh_imc_40\nRUN      : rh_imc_40_run\nTROUBLE  : rh_imc_40_trouble\n\ncreated_at wajib berasal dari RTC I2C.\nJika RTC belum sinkron atau lebih dari 5 detik tidak diperbarui,\nsemua INSERT untuk mesin ini dibatalkan.\n\nMAIN:\n- INSERT setiap paket mesin terkait.\n\nRUN / TROUBLE:\n- INSERT baseline pertama setelah deploy/restart.\n- INSERT hanya ketika status berubah LOW <-> HIGH.\n=========================================================\n*/\n\nconst MACHINE = \"IMC-40\";\nconst MAIN_TABLE = \"rh_imc_40\";\nconst RUN_TABLE = \"rh_imc_40_run\";\nconst TROUBLE_TABLE = \"rh_imc_40_trouble\";\nconst RTC_MAX_AGE_MS = 5000;\n\nconst p = msg.payload;\n\nif (!p || p.name !== MACHINE) {\n    return null;\n}\n\nconst createdAt = global.get(\"rtc_sql_datetime\");\nconst rtcLastReceivedMs = Number(global.get(\"rtc_last_received_ms\"));\nconst rtcAgeMs = Date.now() - rtcLastReceivedMs;\n\nif (\n    typeof createdAt !== \"string\" ||\n    !/^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}$/.test(createdAt) ||\n    !Number.isFinite(rtcLastReceivedMs) ||\n    rtcLastReceivedMs <= 0 ||\n    rtcAgeMs < 0 ||\n    rtcAgeMs > RTC_MAX_AGE_MS\n) {\n    node.status({ fill: \"red\", shape: \"ring\", text: \"INSERT BLOCKED | RTC invalid/stale\" });\n    node.error(`${MACHINE}: INSERT dibatalkan karena RTC belum sinkron atau kedaluwarsa.`, msg);\n    return null;\n}\n\nconst runStatus = p.running === true ? \"HIGH\" : \"LOW\";\nconst troubleStatus = p.trouble === true ? \"HIGH\" : \"LOW\";\n\nlet mainStatus = \"STOPPED\";\nif (p.trouble === true) {\n    mainStatus = \"TROUBLE\";\n}\nelse if (p.running === true) {\n    mainStatus = \"RUNNING\";\n}\n\nfunction escapeSql(value) {\n    return String(value)\n        .replace(/\\\\/g, \"\\\\\\\\\")\n        .replace(/'/g, \"''\");\n}\n\nfunction makeInsert(table, status, type) {\n    const sql = `\nINSERT INTO \\`${table}\\`\n    (\\`name_line\\`, \\`status\\`, \\`created_at\\`)\nVALUES\n    (\n        '${escapeSql(MACHINE)}',\n        '${escapeSql(status)}',\n        '${escapeSql(createdAt)}'\n    );\n    `.trim();\n\n    return {\n        topic: sql,\n        payload: {\n            machine: MACHINE,\n            source_slave: p.slave,\n            table_name: table,\n            insert_type: type,\n            inserted_status: status,\n            created_at: createdAt,\n            rtc_age_ms: rtcAgeMs,\n            runningRaw: p.runningRaw,\n            troubleRaw: p.troubleRaw,\n            timestamp: p.timestamp\n        }\n    };\n}\n\nconst previous = context.get(\"state\");\nconst queries = [];\n\n// Tabel utama selalu menerima status dan waktu RTC terbaru.\n// MAIN TABLE INSERT DIHAPUS\n// Hanya menyimpan perubahan RUN/TROUBLE\n\n// Tabel RUN menerima baseline dan setiap perubahan status.\nif (!previous || previous.run !== runStatus) {\n    queries.push(makeInsert(RUN_TABLE, runStatus, \"RUN\"));\n}\n\n// Tabel TROUBLE menerima baseline dan setiap perubahan status.\nif (!previous || previous.trouble !== troubleStatus) {\n    queries.push(makeInsert(TROUBLE_TABLE, troubleStatus, \"TROUBLE\"));\n}\n\ncontext.set(\"state\", {\n    run: runStatus,\n    trouble: troubleStatus\n});\n\nlet fill = \"grey\";\nif (mainStatus === \"RUNNING\") {\n    fill = \"green\";\n}\nelse if (mainStatus === \"TROUBLE\") {\n    fill = \"red\";\n}\n\nnode.status({\n    fill,\n    shape: \"dot\",\n    text: `${mainStatus} | RTC ${createdAt} | SQL:${queries.length}`\n});\n\n// Array pada output pertama membuat MySQL menerima query satu per satu.\nreturn [queries];\n",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 1550,
        "y": 220,
        "wires": [
            [
                "019db8d4751254bb"
            ]
        ]
    },
    {
        "id": "6a24a6a20950ee83",
        "type": "function",
        "z": "7b2681a7fde4633e",
        "name": "IMC-10 | SQL Logger",
        "func": "/*\n=========================================================\n IMC-10 - DATABASE LOGGER + RTC created_at\n=========================================================\nMAIN     : rh_imc_10\nRUN      : rh_imc_10_run\nTROUBLE  : rh_imc_10_trouble\n\ncreated_at wajib berasal dari RTC I2C.\nJika RTC belum sinkron atau lebih dari 5 detik tidak diperbarui,\nsemua INSERT untuk mesin ini dibatalkan.\n\nMAIN:\n- INSERT setiap paket mesin terkait.\n\nRUN / TROUBLE:\n- INSERT baseline pertama setelah deploy/restart.\n- INSERT hanya ketika status berubah LOW <-> HIGH.\n=========================================================\n*/\n\nconst MACHINE = \"IMC-10\";\nconst MAIN_TABLE = \"rh_imc_10\";\nconst RUN_TABLE = \"rh_imc_10_run\";\nconst TROUBLE_TABLE = \"rh_imc_10_trouble\";\nconst RTC_MAX_AGE_MS = 5000;\n\nconst p = msg.payload;\n\nif (!p || p.name !== MACHINE) {\n    return null;\n}\n\nconst createdAt = global.get(\"rtc_sql_datetime\");\nconst rtcLastReceivedMs = Number(global.get(\"rtc_last_received_ms\"));\nconst rtcAgeMs = Date.now() - rtcLastReceivedMs;\n\nif (\n    typeof createdAt !== \"string\" ||\n    !/^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}$/.test(createdAt) ||\n    !Number.isFinite(rtcLastReceivedMs) ||\n    rtcLastReceivedMs <= 0 ||\n    rtcAgeMs < 0 ||\n    rtcAgeMs > RTC_MAX_AGE_MS\n) {\n    node.status({ fill: \"red\", shape: \"ring\", text: \"INSERT BLOCKED | RTC invalid/stale\" });\n    node.error(`${MACHINE}: INSERT dibatalkan karena RTC belum sinkron atau kedaluwarsa.`, msg);\n    return null;\n}\n\nconst runStatus = p.running === true ? \"HIGH\" : \"LOW\";\nconst troubleStatus = p.trouble === true ? \"HIGH\" : \"LOW\";\n\nlet mainStatus = \"STOPPED\";\nif (p.trouble === true) {\n    mainStatus = \"TROUBLE\";\n}\nelse if (p.running === true) {\n    mainStatus = \"RUNNING\";\n}\n\nfunction escapeSql(value) {\n    return String(value)\n        .replace(/\\\\/g, \"\\\\\\\\\")\n        .replace(/'/g, \"''\");\n}\n\nfunction makeInsert(table, status, type) {\n    const sql = `\nINSERT INTO \\`${table}\\`\n    (\\`name_line\\`, \\`status\\`, \\`created_at\\`)\nVALUES\n    (\n        '${escapeSql(MACHINE)}',\n        '${escapeSql(status)}',\n        '${escapeSql(createdAt)}'\n    );\n    `.trim();\n\n    return {\n        topic: sql,\n        payload: {\n            machine: MACHINE,\n            source_slave: p.slave,\n            table_name: table,\n            insert_type: type,\n            inserted_status: status,\n            created_at: createdAt,\n            rtc_age_ms: rtcAgeMs,\n            runningRaw: p.runningRaw,\n            troubleRaw: p.troubleRaw,\n            timestamp: p.timestamp\n        }\n    };\n}\n\nconst previous = context.get(\"state\");\nconst queries = [];\n\n// Tabel utama selalu menerima status dan waktu RTC terbaru.\n// MAIN TABLE INSERT DIHAPUS\n// Hanya menyimpan perubahan RUN/TROUBLE\n\n// Tabel RUN menerima baseline dan setiap perubahan status.\nif (!previous || previous.run !== runStatus) {\n    queries.push(makeInsert(RUN_TABLE, runStatus, \"RUN\"));\n}\n\n// Tabel TROUBLE menerima baseline dan setiap perubahan status.\nif (!previous || previous.trouble !== troubleStatus) {\n    queries.push(makeInsert(TROUBLE_TABLE, troubleStatus, \"TROUBLE\"));\n}\n\ncontext.set(\"state\", {\n    run: runStatus,\n    trouble: troubleStatus\n});\n\nlet fill = \"grey\";\nif (mainStatus === \"RUNNING\") {\n    fill = \"green\";\n}\nelse if (mainStatus === \"TROUBLE\") {\n    fill = \"red\";\n}\n\nnode.status({\n    fill,\n    shape: \"dot\",\n    text: `${mainStatus} | RTC ${createdAt} | SQL:${queries.length}`\n});\n\n// Array pada output pertama membuat MySQL menerima query satu per satu.\nreturn [queries];\n",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 1550,
        "y": 270,
        "wires": [
            [
                "019db8d4751254bb"
            ]
        ]
    },
    {
        "id": "e402791c599832cc",
        "type": "function",
        "z": "7b2681a7fde4633e",
        "name": "IMC-28 | SQL Logger",
        "func": "/*\n=========================================================\n IMC-28 - DATABASE LOGGER + RTC created_at\n=========================================================\nMAIN     : rh_imc_28\nRUN      : rh_imc_28_run\nTROUBLE  : rh_imc_28_trouble\n\ncreated_at wajib berasal dari RTC I2C.\nJika RTC belum sinkron atau lebih dari 5 detik tidak diperbarui,\nsemua INSERT untuk mesin ini dibatalkan.\n\nMAIN:\n- INSERT setiap paket mesin terkait.\n\nRUN / TROUBLE:\n- INSERT baseline pertama setelah deploy/restart.\n- INSERT hanya ketika status berubah LOW <-> HIGH.\n=========================================================\n*/\n\nconst MACHINE = \"IMC-28\";\nconst MAIN_TABLE = \"rh_imc_28\";\nconst RUN_TABLE = \"rh_imc_28_run\";\nconst TROUBLE_TABLE = \"rh_imc_28_trouble\";\nconst RTC_MAX_AGE_MS = 5000;\n\nconst p = msg.payload;\n\nif (!p || p.name !== MACHINE) {\n    return null;\n}\n\nconst createdAt = global.get(\"rtc_sql_datetime\");\nconst rtcLastReceivedMs = Number(global.get(\"rtc_last_received_ms\"));\nconst rtcAgeMs = Date.now() - rtcLastReceivedMs;\n\nif (\n    typeof createdAt !== \"string\" ||\n    !/^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}$/.test(createdAt) ||\n    !Number.isFinite(rtcLastReceivedMs) ||\n    rtcLastReceivedMs <= 0 ||\n    rtcAgeMs < 0 ||\n    rtcAgeMs > RTC_MAX_AGE_MS\n) {\n    node.status({ fill: \"red\", shape: \"ring\", text: \"INSERT BLOCKED | RTC invalid/stale\" });\n    node.error(`${MACHINE}: INSERT dibatalkan karena RTC belum sinkron atau kedaluwarsa.`, msg);\n    return null;\n}\n\nconst runStatus = p.running === true ? \"HIGH\" : \"LOW\";\nconst troubleStatus = p.trouble === true ? \"HIGH\" : \"LOW\";\n\nlet mainStatus = \"STOPPED\";\nif (p.trouble === true) {\n    mainStatus = \"TROUBLE\";\n}\nelse if (p.running === true) {\n    mainStatus = \"RUNNING\";\n}\n\nfunction escapeSql(value) {\n    return String(value)\n        .replace(/\\\\/g, \"\\\\\\\\\")\n        .replace(/'/g, \"''\");\n}\n\nfunction makeInsert(table, status, type) {\n    const sql = `\nINSERT INTO \\`${table}\\`\n    (\\`name_line\\`, \\`status\\`, \\`created_at\\`)\nVALUES\n    (\n        '${escapeSql(MACHINE)}',\n        '${escapeSql(status)}',\n        '${escapeSql(createdAt)}'\n    );\n    `.trim();\n\n    return {\n        topic: sql,\n        payload: {\n            machine: MACHINE,\n            source_slave: p.slave,\n            table_name: table,\n            insert_type: type,\n            inserted_status: status,\n            created_at: createdAt,\n            rtc_age_ms: rtcAgeMs,\n            runningRaw: p.runningRaw,\n            troubleRaw: p.troubleRaw,\n            timestamp: p.timestamp\n        }\n    };\n}\n\nconst previous = context.get(\"state\");\nconst queries = [];\n\n// Tabel utama selalu menerima status dan waktu RTC terbaru.\n// MAIN TABLE INSERT DIHAPUS\n// Hanya menyimpan perubahan RUN/TROUBLE\n\n// Tabel RUN menerima baseline dan setiap perubahan status.\nif (!previous || previous.run !== runStatus) {\n    queries.push(makeInsert(RUN_TABLE, runStatus, \"RUN\"));\n}\n\n// Tabel TROUBLE menerima baseline dan setiap perubahan status.\nif (!previous || previous.trouble !== troubleStatus) {\n    queries.push(makeInsert(TROUBLE_TABLE, troubleStatus, \"TROUBLE\"));\n}\n\ncontext.set(\"state\", {\n    run: runStatus,\n    trouble: troubleStatus\n});\n\nlet fill = \"grey\";\nif (mainStatus === \"RUNNING\") {\n    fill = \"green\";\n}\nelse if (mainStatus === \"TROUBLE\") {\n    fill = \"red\";\n}\n\nnode.status({\n    fill,\n    shape: \"dot\",\n    text: `${mainStatus} | RTC ${createdAt} | SQL:${queries.length}`\n});\n\n// Array pada output pertama membuat MySQL menerima query satu per satu.\nreturn [queries];\n",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 1550,
        "y": 320,
        "wires": [
            [
                "019db8d4751254bb"
            ]
        ]
    },
    {
        "id": "b05266695d7e6016",
        "type": "function",
        "z": "7b2681a7fde4633e",
        "name": "IMC-29 | SQL Logger",
        "func": "/*\n=========================================================\n IMC-29 - DATABASE LOGGER + RTC created_at\n=========================================================\nMAIN     : rh_imc_29\nRUN      : rh_imc_29_run\nTROUBLE  : rh_imc_29_trouble\n\ncreated_at wajib berasal dari RTC I2C.\nJika RTC belum sinkron atau lebih dari 5 detik tidak diperbarui,\nsemua INSERT untuk mesin ini dibatalkan.\n\nMAIN:\n- INSERT setiap paket mesin terkait.\n\nRUN / TROUBLE:\n- INSERT baseline pertama setelah deploy/restart.\n- INSERT hanya ketika status berubah LOW <-> HIGH.\n=========================================================\n*/\n\nconst MACHINE = \"IMC-29\";\nconst MAIN_TABLE = \"rh_imc_29\";\nconst RUN_TABLE = \"rh_imc_29_run\";\nconst TROUBLE_TABLE = \"rh_imc_29_trouble\";\nconst RTC_MAX_AGE_MS = 5000;\n\nconst p = msg.payload;\n\nif (!p || p.name !== MACHINE) {\n    return null;\n}\n\nconst createdAt = global.get(\"rtc_sql_datetime\");\nconst rtcLastReceivedMs = Number(global.get(\"rtc_last_received_ms\"));\nconst rtcAgeMs = Date.now() - rtcLastReceivedMs;\n\nif (\n    typeof createdAt !== \"string\" ||\n    !/^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}$/.test(createdAt) ||\n    !Number.isFinite(rtcLastReceivedMs) ||\n    rtcLastReceivedMs <= 0 ||\n    rtcAgeMs < 0 ||\n    rtcAgeMs > RTC_MAX_AGE_MS\n) {\n    node.status({ fill: \"red\", shape: \"ring\", text: \"INSERT BLOCKED | RTC invalid/stale\" });\n    node.error(`${MACHINE}: INSERT dibatalkan karena RTC belum sinkron atau kedaluwarsa.`, msg);\n    return null;\n}\n\nconst runStatus = p.running === true ? \"HIGH\" : \"LOW\";\nconst troubleStatus = p.trouble === true ? \"HIGH\" : \"LOW\";\n\nlet mainStatus = \"STOPPED\";\nif (p.trouble === true) {\n    mainStatus = \"TROUBLE\";\n}\nelse if (p.running === true) {\n    mainStatus = \"RUNNING\";\n}\n\nfunction escapeSql(value) {\n    return String(value)\n        .replace(/\\\\/g, \"\\\\\\\\\")\n        .replace(/'/g, \"''\");\n}\n\nfunction makeInsert(table, status, type) {\n    const sql = `\nINSERT INTO \\`${table}\\`\n    (\\`name_line\\`, \\`status\\`, \\`created_at\\`)\nVALUES\n    (\n        '${escapeSql(MACHINE)}',\n        '${escapeSql(status)}',\n        '${escapeSql(createdAt)}'\n    );\n    `.trim();\n\n    return {\n        topic: sql,\n        payload: {\n            machine: MACHINE,\n            source_slave: p.slave,\n            table_name: table,\n            insert_type: type,\n            inserted_status: status,\n            created_at: createdAt,\n            rtc_age_ms: rtcAgeMs,\n            runningRaw: p.runningRaw,\n            troubleRaw: p.troubleRaw,\n            timestamp: p.timestamp\n        }\n    };\n}\n\nconst previous = context.get(\"state\");\nconst queries = [];\n\n// Tabel utama selalu menerima status dan waktu RTC terbaru.\n// MAIN TABLE INSERT DIHAPUS\n// Hanya menyimpan perubahan RUN/TROUBLE\n\n// Tabel RUN menerima baseline dan setiap perubahan status.\nif (!previous || previous.run !== runStatus) {\n    queries.push(makeInsert(RUN_TABLE, runStatus, \"RUN\"));\n}\n\n// Tabel TROUBLE menerima baseline dan setiap perubahan status.\nif (!previous || previous.trouble !== troubleStatus) {\n    queries.push(makeInsert(TROUBLE_TABLE, troubleStatus, \"TROUBLE\"));\n}\n\ncontext.set(\"state\", {\n    run: runStatus,\n    trouble: troubleStatus\n});\n\nlet fill = \"grey\";\nif (mainStatus === \"RUNNING\") {\n    fill = \"green\";\n}\nelse if (mainStatus === \"TROUBLE\") {\n    fill = \"red\";\n}\n\nnode.status({\n    fill,\n    shape: \"dot\",\n    text: `${mainStatus} | RTC ${createdAt} | SQL:${queries.length}`\n});\n\n// Array pada output pertama membuat MySQL menerima query satu per satu.\nreturn [queries];\n",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 1550,
        "y": 370,
        "wires": [
            [
                "019db8d4751254bb"
            ]
        ]
    },
    {
        "id": "5b793f45444c4192",
        "type": "function",
        "z": "7b2681a7fde4633e",
        "name": "IMC-19 | SQL Logger",
        "func": "/*\n=========================================================\n IMC-19 - DATABASE LOGGER + RTC created_at\n=========================================================\nMAIN     : rh_imc_19\nRUN      : rh_imc_19_run\nTROUBLE  : rh_imc_19_trouble\n\ncreated_at wajib berasal dari RTC I2C.\nJika RTC belum sinkron atau lebih dari 5 detik tidak diperbarui,\nsemua INSERT untuk mesin ini dibatalkan.\n\nMAIN:\n- INSERT setiap paket mesin terkait.\n\nRUN / TROUBLE:\n- INSERT baseline pertama setelah deploy/restart.\n- INSERT hanya ketika status berubah LOW <-> HIGH.\n=========================================================\n*/\n\nconst MACHINE = \"IMC-19\";\nconst MAIN_TABLE = \"rh_imc_19\";\nconst RUN_TABLE = \"rh_imc_19_run\";\nconst TROUBLE_TABLE = \"rh_imc_19_trouble\";\nconst RTC_MAX_AGE_MS = 5000;\n\nconst p = msg.payload;\n\nif (!p || p.name !== MACHINE) {\n    return null;\n}\n\nconst createdAt = global.get(\"rtc_sql_datetime\");\nconst rtcLastReceivedMs = Number(global.get(\"rtc_last_received_ms\"));\nconst rtcAgeMs = Date.now() - rtcLastReceivedMs;\n\nif (\n    typeof createdAt !== \"string\" ||\n    !/^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}$/.test(createdAt) ||\n    !Number.isFinite(rtcLastReceivedMs) ||\n    rtcLastReceivedMs <= 0 ||\n    rtcAgeMs < 0 ||\n    rtcAgeMs > RTC_MAX_AGE_MS\n) {\n    node.status({ fill: \"red\", shape: \"ring\", text: \"INSERT BLOCKED | RTC invalid/stale\" });\n    node.error(`${MACHINE}: INSERT dibatalkan karena RTC belum sinkron atau kedaluwarsa.`, msg);\n    return null;\n}\n\nconst runStatus = p.running === true ? \"HIGH\" : \"LOW\";\nconst troubleStatus = p.trouble === true ? \"HIGH\" : \"LOW\";\n\nlet mainStatus = \"STOPPED\";\nif (p.trouble === true) {\n    mainStatus = \"TROUBLE\";\n}\nelse if (p.running === true) {\n    mainStatus = \"RUNNING\";\n}\n\nfunction escapeSql(value) {\n    return String(value)\n        .replace(/\\\\/g, \"\\\\\\\\\")\n        .replace(/'/g, \"''\");\n}\n\nfunction makeInsert(table, status, type) {\n    const sql = `\nINSERT INTO \\`${table}\\`\n    (\\`name_line\\`, \\`status\\`, \\`created_at\\`)\nVALUES\n    (\n        '${escapeSql(MACHINE)}',\n        '${escapeSql(status)}',\n        '${escapeSql(createdAt)}'\n    );\n    `.trim();\n\n    return {\n        topic: sql,\n        payload: {\n            machine: MACHINE,\n            source_slave: p.slave,\n            table_name: table,\n            insert_type: type,\n            inserted_status: status,\n            created_at: createdAt,\n            rtc_age_ms: rtcAgeMs,\n            runningRaw: p.runningRaw,\n            troubleRaw: p.troubleRaw,\n            timestamp: p.timestamp\n        }\n    };\n}\n\nconst previous = context.get(\"state\");\nconst queries = [];\n\n// Tabel utama selalu menerima status dan waktu RTC terbaru.\n// MAIN TABLE INSERT DIHAPUS\n// Hanya menyimpan perubahan RUN/TROUBLE\n\n// Tabel RUN menerima baseline dan setiap perubahan status.\nif (!previous || previous.run !== runStatus) {\n    queries.push(makeInsert(RUN_TABLE, runStatus, \"RUN\"));\n}\n\n// Tabel TROUBLE menerima baseline dan setiap perubahan status.\nif (!previous || previous.trouble !== troubleStatus) {\n    queries.push(makeInsert(TROUBLE_TABLE, troubleStatus, \"TROUBLE\"));\n}\n\ncontext.set(\"state\", {\n    run: runStatus,\n    trouble: troubleStatus\n});\n\nlet fill = \"grey\";\nif (mainStatus === \"RUNNING\") {\n    fill = \"green\";\n}\nelse if (mainStatus === \"TROUBLE\") {\n    fill = \"red\";\n}\n\nnode.status({\n    fill,\n    shape: \"dot\",\n    text: `${mainStatus} | RTC ${createdAt} | SQL:${queries.length}`\n});\n\n// Array pada output pertama membuat MySQL menerima query satu per satu.\nreturn [queries];\n",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 1550,
        "y": 420,
        "wires": [
            [
                "019db8d4751254bb"
            ]
        ]
    },
    {
        "id": "a4e86cd8da3a68a2",
        "type": "function",
        "z": "7b2681a7fde4633e",
        "name": "IMC-20 | SQL Logger",
        "func": "/*\n=========================================================\n IMC-20 - DATABASE LOGGER + RTC created_at\n=========================================================\nMAIN     : rh_imc_20\nRUN      : rh_imc_20_run\nTROUBLE  : rh_imc_20_trouble\n\ncreated_at wajib berasal dari RTC I2C.\nJika RTC belum sinkron atau lebih dari 5 detik tidak diperbarui,\nsemua INSERT untuk mesin ini dibatalkan.\n\nMAIN:\n- INSERT setiap paket mesin terkait.\n\nRUN / TROUBLE:\n- INSERT baseline pertama setelah deploy/restart.\n- INSERT hanya ketika status berubah LOW <-> HIGH.\n=========================================================\n*/\n\nconst MACHINE = \"IMC-20\";\nconst MAIN_TABLE = \"rh_imc_20\";\nconst RUN_TABLE = \"rh_imc_20_run\";\nconst TROUBLE_TABLE = \"rh_imc_20_trouble\";\nconst RTC_MAX_AGE_MS = 5000;\n\nconst p = msg.payload;\n\nif (!p || p.name !== MACHINE) {\n    return null;\n}\n\nconst createdAt = global.get(\"rtc_sql_datetime\");\nconst rtcLastReceivedMs = Number(global.get(\"rtc_last_received_ms\"));\nconst rtcAgeMs = Date.now() - rtcLastReceivedMs;\n\nif (\n    typeof createdAt !== \"string\" ||\n    !/^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}$/.test(createdAt) ||\n    !Number.isFinite(rtcLastReceivedMs) ||\n    rtcLastReceivedMs <= 0 ||\n    rtcAgeMs < 0 ||\n    rtcAgeMs > RTC_MAX_AGE_MS\n) {\n    node.status({ fill: \"red\", shape: \"ring\", text: \"INSERT BLOCKED | RTC invalid/stale\" });\n    node.error(`${MACHINE}: INSERT dibatalkan karena RTC belum sinkron atau kedaluwarsa.`, msg);\n    return null;\n}\n\nconst runStatus = p.running === true ? \"HIGH\" : \"LOW\";\nconst troubleStatus = p.trouble === true ? \"HIGH\" : \"LOW\";\n\nlet mainStatus = \"STOPPED\";\nif (p.trouble === true) {\n    mainStatus = \"TROUBLE\";\n}\nelse if (p.running === true) {\n    mainStatus = \"RUNNING\";\n}\n\nfunction escapeSql(value) {\n    return String(value)\n        .replace(/\\\\/g, \"\\\\\\\\\")\n        .replace(/'/g, \"''\");\n}\n\nfunction makeInsert(table, status, type) {\n    const sql = `\nINSERT INTO \\`${table}\\`\n    (\\`name_line\\`, \\`status\\`, \\`created_at\\`)\nVALUES\n    (\n        '${escapeSql(MACHINE)}',\n        '${escapeSql(status)}',\n        '${escapeSql(createdAt)}'\n    );\n    `.trim();\n\n    return {\n        topic: sql,\n        payload: {\n            machine: MACHINE,\n            source_slave: p.slave,\n            table_name: table,\n            insert_type: type,\n            inserted_status: status,\n            created_at: createdAt,\n            rtc_age_ms: rtcAgeMs,\n            runningRaw: p.runningRaw,\n            troubleRaw: p.troubleRaw,\n            timestamp: p.timestamp\n        }\n    };\n}\n\nconst previous = context.get(\"state\");\nconst queries = [];\n\n// Tabel utama selalu menerima status dan waktu RTC terbaru.\n// MAIN TABLE INSERT DIHAPUS\n// Hanya menyimpan perubahan RUN/TROUBLE\n\n// Tabel RUN menerima baseline dan setiap perubahan status.\nif (!previous || previous.run !== runStatus) {\n    queries.push(makeInsert(RUN_TABLE, runStatus, \"RUN\"));\n}\n\n// Tabel TROUBLE menerima baseline dan setiap perubahan status.\nif (!previous || previous.trouble !== troubleStatus) {\n    queries.push(makeInsert(TROUBLE_TABLE, troubleStatus, \"TROUBLE\"));\n}\n\ncontext.set(\"state\", {\n    run: runStatus,\n    trouble: troubleStatus\n});\n\nlet fill = \"grey\";\nif (mainStatus === \"RUNNING\") {\n    fill = \"green\";\n}\nelse if (mainStatus === \"TROUBLE\") {\n    fill = \"red\";\n}\n\nnode.status({\n    fill,\n    shape: \"dot\",\n    text: `${mainStatus} | RTC ${createdAt} | SQL:${queries.length}`\n});\n\n// Array pada output pertama membuat MySQL menerima query satu per satu.\nreturn [queries];\n",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 1550,
        "y": 470,
        "wires": [
            [
                "019db8d4751254bb"
            ]
        ]
    },
    {
        "id": "0ede89dde9fa0173",
        "type": "function",
        "z": "7b2681a7fde4633e",
        "name": "IMC-21 | SQL Logger",
        "func": "/*\n=========================================================\n IMC-21 - DATABASE LOGGER + RTC created_at\n=========================================================\nMAIN     : rh_imc_21\nRUN      : rh_imc_21_run\nTROUBLE  : rh_imc_21_trouble\n\ncreated_at wajib berasal dari RTC I2C.\nJika RTC belum sinkron atau lebih dari 5 detik tidak diperbarui,\nsemua INSERT untuk mesin ini dibatalkan.\n\nMAIN:\n- INSERT setiap paket mesin terkait.\n\nRUN / TROUBLE:\n- INSERT baseline pertama setelah deploy/restart.\n- INSERT hanya ketika status berubah LOW <-> HIGH.\n=========================================================\n*/\n\nconst MACHINE = \"IMC-21\";\nconst MAIN_TABLE = \"rh_imc_21\";\nconst RUN_TABLE = \"rh_imc_21_run\";\nconst TROUBLE_TABLE = \"rh_imc_21_trouble\";\nconst RTC_MAX_AGE_MS = 5000;\n\nconst p = msg.payload;\n\nif (!p || p.name !== MACHINE) {\n    return null;\n}\n\nconst createdAt = global.get(\"rtc_sql_datetime\");\nconst rtcLastReceivedMs = Number(global.get(\"rtc_last_received_ms\"));\nconst rtcAgeMs = Date.now() - rtcLastReceivedMs;\n\nif (\n    typeof createdAt !== \"string\" ||\n    !/^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}$/.test(createdAt) ||\n    !Number.isFinite(rtcLastReceivedMs) ||\n    rtcLastReceivedMs <= 0 ||\n    rtcAgeMs < 0 ||\n    rtcAgeMs > RTC_MAX_AGE_MS\n) {\n    node.status({ fill: \"red\", shape: \"ring\", text: \"INSERT BLOCKED | RTC invalid/stale\" });\n    node.error(`${MACHINE}: INSERT dibatalkan karena RTC belum sinkron atau kedaluwarsa.`, msg);\n    return null;\n}\n\nconst runStatus = p.running === true ? \"HIGH\" : \"LOW\";\nconst troubleStatus = p.trouble === true ? \"HIGH\" : \"LOW\";\n\nlet mainStatus = \"STOPPED\";\nif (p.trouble === true) {\n    mainStatus = \"TROUBLE\";\n}\nelse if (p.running === true) {\n    mainStatus = \"RUNNING\";\n}\n\nfunction escapeSql(value) {\n    return String(value)\n        .replace(/\\\\/g, \"\\\\\\\\\")\n        .replace(/'/g, \"''\");\n}\n\nfunction makeInsert(table, status, type) {\n    const sql = `\nINSERT INTO \\`${table}\\`\n    (\\`name_line\\`, \\`status\\`, \\`created_at\\`)\nVALUES\n    (\n        '${escapeSql(MACHINE)}',\n        '${escapeSql(status)}',\n        '${escapeSql(createdAt)}'\n    );\n    `.trim();\n\n    return {\n        topic: sql,\n        payload: {\n            machine: MACHINE,\n            source_slave: p.slave,\n            table_name: table,\n            insert_type: type,\n            inserted_status: status,\n            created_at: createdAt,\n            rtc_age_ms: rtcAgeMs,\n            runningRaw: p.runningRaw,\n            troubleRaw: p.troubleRaw,\n            timestamp: p.timestamp\n        }\n    };\n}\n\nconst previous = context.get(\"state\");\nconst queries = [];\n\n// Tabel utama selalu menerima status dan waktu RTC terbaru.\n// MAIN TABLE INSERT DIHAPUS\n// Hanya menyimpan perubahan RUN/TROUBLE\n\n// Tabel RUN menerima baseline dan setiap perubahan status.\nif (!previous || previous.run !== runStatus) {\n    queries.push(makeInsert(RUN_TABLE, runStatus, \"RUN\"));\n}\n\n// Tabel TROUBLE menerima baseline dan setiap perubahan status.\nif (!previous || previous.trouble !== troubleStatus) {\n    queries.push(makeInsert(TROUBLE_TABLE, troubleStatus, \"TROUBLE\"));\n}\n\ncontext.set(\"state\", {\n    run: runStatus,\n    trouble: troubleStatus\n});\n\nlet fill = \"grey\";\nif (mainStatus === \"RUNNING\") {\n    fill = \"green\";\n}\nelse if (mainStatus === \"TROUBLE\") {\n    fill = \"red\";\n}\n\nnode.status({\n    fill,\n    shape: \"dot\",\n    text: `${mainStatus} | RTC ${createdAt} | SQL:${queries.length}`\n});\n\n// Array pada output pertama membuat MySQL menerima query satu per satu.\nreturn [queries];\n",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 1550,
        "y": 520,
        "wires": [
            [
                "019db8d4751254bb"
            ]
        ]
    },
    {
        "id": "ef747e9525a66c6a",
        "type": "function",
        "z": "7b2681a7fde4633e",
        "name": "IMC-23 | SQL Logger",
        "func": "/*\n=========================================================\n IMC-23 - DATABASE LOGGER + RTC created_at\n=========================================================\nMAIN     : rh_imc_23\nRUN      : rh_imc_23_run\nTROUBLE  : rh_imc_23_trouble\n\ncreated_at wajib berasal dari RTC I2C.\nJika RTC belum sinkron atau lebih dari 5 detik tidak diperbarui,\nsemua INSERT untuk mesin ini dibatalkan.\n\nMAIN:\n- INSERT setiap paket mesin terkait.\n\nRUN / TROUBLE:\n- INSERT baseline pertama setelah deploy/restart.\n- INSERT hanya ketika status berubah LOW <-> HIGH.\n=========================================================\n*/\n\nconst MACHINE = \"IMC-23\";\nconst MAIN_TABLE = \"rh_imc_23\";\nconst RUN_TABLE = \"rh_imc_23_run\";\nconst TROUBLE_TABLE = \"rh_imc_23_trouble\";\nconst RTC_MAX_AGE_MS = 5000;\n\nconst p = msg.payload;\n\nif (!p || p.name !== MACHINE) {\n    return null;\n}\n\nconst createdAt = global.get(\"rtc_sql_datetime\");\nconst rtcLastReceivedMs = Number(global.get(\"rtc_last_received_ms\"));\nconst rtcAgeMs = Date.now() - rtcLastReceivedMs;\n\nif (\n    typeof createdAt !== \"string\" ||\n    !/^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}$/.test(createdAt) ||\n    !Number.isFinite(rtcLastReceivedMs) ||\n    rtcLastReceivedMs <= 0 ||\n    rtcAgeMs < 0 ||\n    rtcAgeMs > RTC_MAX_AGE_MS\n) {\n    node.status({ fill: \"red\", shape: \"ring\", text: \"INSERT BLOCKED | RTC invalid/stale\" });\n    node.error(`${MACHINE}: INSERT dibatalkan karena RTC belum sinkron atau kedaluwarsa.`, msg);\n    return null;\n}\n\nconst runStatus = p.running === true ? \"HIGH\" : \"LOW\";\nconst troubleStatus = p.trouble === true ? \"HIGH\" : \"LOW\";\n\nlet mainStatus = \"STOPPED\";\nif (p.trouble === true) {\n    mainStatus = \"TROUBLE\";\n}\nelse if (p.running === true) {\n    mainStatus = \"RUNNING\";\n}\n\nfunction escapeSql(value) {\n    return String(value)\n        .replace(/\\\\/g, \"\\\\\\\\\")\n        .replace(/'/g, \"''\");\n}\n\nfunction makeInsert(table, status, type) {\n    const sql = `\nINSERT INTO \\`${table}\\`\n    (\\`name_line\\`, \\`status\\`, \\`created_at\\`)\nVALUES\n    (\n        '${escapeSql(MACHINE)}',\n        '${escapeSql(status)}',\n        '${escapeSql(createdAt)}'\n    );\n    `.trim();\n\n    return {\n        topic: sql,\n        payload: {\n            machine: MACHINE,\n            source_slave: p.slave,\n            table_name: table,\n            insert_type: type,\n            inserted_status: status,\n            created_at: createdAt,\n            rtc_age_ms: rtcAgeMs,\n            runningRaw: p.runningRaw,\n            troubleRaw: p.troubleRaw,\n            timestamp: p.timestamp\n        }\n    };\n}\n\nconst previous = context.get(\"state\");\nconst queries = [];\n\n// Tabel utama selalu menerima status dan waktu RTC terbaru.\n// MAIN TABLE INSERT DIHAPUS\n// Hanya menyimpan perubahan RUN/TROUBLE\n\n// Tabel RUN menerima baseline dan setiap perubahan status.\nif (!previous || previous.run !== runStatus) {\n    queries.push(makeInsert(RUN_TABLE, runStatus, \"RUN\"));\n}\n\n// Tabel TROUBLE menerima baseline dan setiap perubahan status.\nif (!previous || previous.trouble !== troubleStatus) {\n    queries.push(makeInsert(TROUBLE_TABLE, troubleStatus, \"TROUBLE\"));\n}\n\ncontext.set(\"state\", {\n    run: runStatus,\n    trouble: troubleStatus\n});\n\nlet fill = \"grey\";\nif (mainStatus === \"RUNNING\") {\n    fill = \"green\";\n}\nelse if (mainStatus === \"TROUBLE\") {\n    fill = \"red\";\n}\n\nnode.status({\n    fill,\n    shape: \"dot\",\n    text: `${mainStatus} | RTC ${createdAt} | SQL:${queries.length}`\n});\n\n// Array pada output pertama membuat MySQL menerima query satu per satu.\nreturn [queries];\n",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 1550,
        "y": 570,
        "wires": [
            [
                "019db8d4751254bb"
            ]
        ]
    },
    {
        "id": "2d7857a03dd095c3",
        "type": "function",
        "z": "7b2681a7fde4633e",
        "name": "IMC-45 | SQL Logger",
        "func": "/*\n=========================================================\n IMC-45 - DATABASE LOGGER + RTC created_at\n=========================================================\nMAIN     : rh_imc_45\nRUN      : rh_imc_45_run\nTROUBLE  : rh_imc_45_trouble\n\ncreated_at wajib berasal dari RTC I2C.\nJika RTC belum sinkron atau lebih dari 5 detik tidak diperbarui,\nsemua INSERT untuk mesin ini dibatalkan.\n\nMAIN:\n- INSERT setiap paket mesin terkait.\n\nRUN / TROUBLE:\n- INSERT baseline pertama setelah deploy/restart.\n- INSERT hanya ketika status berubah LOW <-> HIGH.\n=========================================================\n*/\n\nconst MACHINE = \"IMC-45\";\nconst MAIN_TABLE = \"rh_imc_45\";\nconst RUN_TABLE = \"rh_imc_45_run\";\nconst TROUBLE_TABLE = \"rh_imc_45_trouble\";\nconst RTC_MAX_AGE_MS = 5000;\n\nconst p = msg.payload;\n\nif (!p || p.name !== MACHINE) {\n    return null;\n}\n\nconst createdAt = global.get(\"rtc_sql_datetime\");\nconst rtcLastReceivedMs = Number(global.get(\"rtc_last_received_ms\"));\nconst rtcAgeMs = Date.now() - rtcLastReceivedMs;\n\nif (\n    typeof createdAt !== \"string\" ||\n    !/^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}$/.test(createdAt) ||\n    !Number.isFinite(rtcLastReceivedMs) ||\n    rtcLastReceivedMs <= 0 ||\n    rtcAgeMs < 0 ||\n    rtcAgeMs > RTC_MAX_AGE_MS\n) {\n    node.status({ fill: \"red\", shape: \"ring\", text: \"INSERT BLOCKED | RTC invalid/stale\" });\n    node.error(`${MACHINE}: INSERT dibatalkan karena RTC belum sinkron atau kedaluwarsa.`, msg);\n    return null;\n}\n\nconst runStatus = p.running === true ? \"HIGH\" : \"LOW\";\nconst troubleStatus = p.trouble === true ? \"HIGH\" : \"LOW\";\n\nlet mainStatus = \"STOPPED\";\nif (p.trouble === true) {\n    mainStatus = \"TROUBLE\";\n}\nelse if (p.running === true) {\n    mainStatus = \"RUNNING\";\n}\n\nfunction escapeSql(value) {\n    return String(value)\n        .replace(/\\\\/g, \"\\\\\\\\\")\n        .replace(/'/g, \"''\");\n}\n\nfunction makeInsert(table, status, type) {\n    const sql = `\nINSERT INTO \\`${table}\\`\n    (\\`name_line\\`, \\`status\\`, \\`created_at\\`)\nVALUES\n    (\n        '${escapeSql(MACHINE)}',\n        '${escapeSql(status)}',\n        '${escapeSql(createdAt)}'\n    );\n    `.trim();\n\n    return {\n        topic: sql,\n        payload: {\n            machine: MACHINE,\n            source_slave: p.slave,\n            table_name: table,\n            insert_type: type,\n            inserted_status: status,\n            created_at: createdAt,\n            rtc_age_ms: rtcAgeMs,\n            runningRaw: p.runningRaw,\n            troubleRaw: p.troubleRaw,\n            timestamp: p.timestamp\n        }\n    };\n}\n\nconst previous = context.get(\"state\");\nconst queries = [];\n\n// Tabel utama selalu menerima status dan waktu RTC terbaru.\n// MAIN TABLE INSERT DIHAPUS\n// Hanya menyimpan perubahan RUN/TROUBLE\n\n// Tabel RUN menerima baseline dan setiap perubahan status.\nif (!previous || previous.run !== runStatus) {\n    queries.push(makeInsert(RUN_TABLE, runStatus, \"RUN\"));\n}\n\n// Tabel TROUBLE menerima baseline dan setiap perubahan status.\nif (!previous || previous.trouble !== troubleStatus) {\n    queries.push(makeInsert(TROUBLE_TABLE, troubleStatus, \"TROUBLE\"));\n}\n\ncontext.set(\"state\", {\n    run: runStatus,\n    trouble: troubleStatus\n});\n\nlet fill = \"grey\";\nif (mainStatus === \"RUNNING\") {\n    fill = \"green\";\n}\nelse if (mainStatus === \"TROUBLE\") {\n    fill = \"red\";\n}\n\nnode.status({\n    fill,\n    shape: \"dot\",\n    text: `${mainStatus} | RTC ${createdAt} | SQL:${queries.length}`\n});\n\n// Array pada output pertama membuat MySQL menerima query satu per satu.\nreturn [queries];\n",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 1550,
        "y": 620,
        "wires": [
            [
                "019db8d4751254bb"
            ]
        ]
    },
    {
        "id": "1c75cd487e5b1bbf",
        "type": "function",
        "z": "7b2681a7fde4633e",
        "name": "IMC-61 | SQL Logger",
        "func": "/*\n=========================================================\n IMC-61 - DATABASE LOGGER + RTC created_at\n=========================================================\nMAIN     : rh_imc_61\nRUN      : rh_imc_61_run\nTROUBLE  : rh_imc_61_trouble\n\ncreated_at wajib berasal dari RTC I2C.\nJika RTC belum sinkron atau lebih dari 5 detik tidak diperbarui,\nsemua INSERT untuk mesin ini dibatalkan.\n\nMAIN:\n- INSERT setiap paket mesin terkait.\n\nRUN / TROUBLE:\n- INSERT baseline pertama setelah deploy/restart.\n- INSERT hanya ketika status berubah LOW <-> HIGH.\n=========================================================\n*/\n\nconst MACHINE = \"IMC-61\";\nconst MAIN_TABLE = \"rh_imc_61\";\nconst RUN_TABLE = \"rh_imc_61_run\";\nconst TROUBLE_TABLE = \"rh_imc_61_trouble\";\nconst RTC_MAX_AGE_MS = 5000;\n\nconst p = msg.payload;\n\nif (!p || p.name !== MACHINE) {\n    return null;\n}\n\nconst createdAt = global.get(\"rtc_sql_datetime\");\nconst rtcLastReceivedMs = Number(global.get(\"rtc_last_received_ms\"));\nconst rtcAgeMs = Date.now() - rtcLastReceivedMs;\n\nif (\n    typeof createdAt !== \"string\" ||\n    !/^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}$/.test(createdAt) ||\n    !Number.isFinite(rtcLastReceivedMs) ||\n    rtcLastReceivedMs <= 0 ||\n    rtcAgeMs < 0 ||\n    rtcAgeMs > RTC_MAX_AGE_MS\n) {\n    node.status({ fill: \"red\", shape: \"ring\", text: \"INSERT BLOCKED | RTC invalid/stale\" });\n    node.error(`${MACHINE}: INSERT dibatalkan karena RTC belum sinkron atau kedaluwarsa.`, msg);\n    return null;\n}\n\nconst runStatus = p.running === true ? \"HIGH\" : \"LOW\";\nconst troubleStatus = p.trouble === true ? \"HIGH\" : \"LOW\";\n\nlet mainStatus = \"STOPPED\";\nif (p.trouble === true) {\n    mainStatus = \"TROUBLE\";\n}\nelse if (p.running === true) {\n    mainStatus = \"RUNNING\";\n}\n\nfunction escapeSql(value) {\n    return String(value)\n        .replace(/\\\\/g, \"\\\\\\\\\")\n        .replace(/'/g, \"''\");\n}\n\nfunction makeInsert(table, status, type) {\n    const sql = `\nINSERT INTO \\`${table}\\`\n    (\\`name_line\\`, \\`status\\`, \\`created_at\\`)\nVALUES\n    (\n        '${escapeSql(MACHINE)}',\n        '${escapeSql(status)}',\n        '${escapeSql(createdAt)}'\n    );\n    `.trim();\n\n    return {\n        topic: sql,\n        payload: {\n            machine: MACHINE,\n            source_slave: p.slave,\n            table_name: table,\n            insert_type: type,\n            inserted_status: status,\n            created_at: createdAt,\n            rtc_age_ms: rtcAgeMs,\n            runningRaw: p.runningRaw,\n            troubleRaw: p.troubleRaw,\n            timestamp: p.timestamp\n        }\n    };\n}\n\nconst previous = context.get(\"state\");\nconst queries = [];\n\n// Tabel utama selalu menerima status dan waktu RTC terbaru.\n// MAIN TABLE INSERT DIHAPUS\n// Hanya menyimpan perubahan RUN/TROUBLE\n\n// Tabel RUN menerima baseline dan setiap perubahan status.\nif (!previous || previous.run !== runStatus) {\n    queries.push(makeInsert(RUN_TABLE, runStatus, \"RUN\"));\n}\n\n// Tabel TROUBLE menerima baseline dan setiap perubahan status.\nif (!previous || previous.trouble !== troubleStatus) {\n    queries.push(makeInsert(TROUBLE_TABLE, troubleStatus, \"TROUBLE\"));\n}\n\ncontext.set(\"state\", {\n    run: runStatus,\n    trouble: troubleStatus\n});\n\nlet fill = \"grey\";\nif (mainStatus === \"RUNNING\") {\n    fill = \"green\";\n}\nelse if (mainStatus === \"TROUBLE\") {\n    fill = \"red\";\n}\n\nnode.status({\n    fill,\n    shape: \"dot\",\n    text: `${mainStatus} | RTC ${createdAt} | SQL:${queries.length}`\n});\n\n// Array pada output pertama membuat MySQL menerima query satu per satu.\nreturn [queries];\n",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 1550,
        "y": 670,
        "wires": [
            [
                "019db8d4751254bb"
            ]
        ]
    },
    {
        "id": "20640bd7442593eb",
        "type": "function",
        "z": "7b2681a7fde4633e",
        "name": "IMC-94 | SQL Logger",
        "func": "/*\n=========================================================\n IMC-94 - DATABASE LOGGER + RTC created_at\n=========================================================\nMAIN     : rh_imc_94\nRUN      : rh_imc_94_run\nTROUBLE  : rh_imc_94_trouble\n\ncreated_at wajib berasal dari RTC I2C.\nJika RTC belum sinkron atau lebih dari 5 detik tidak diperbarui,\nsemua INSERT untuk mesin ini dibatalkan.\n\nMAIN:\n- INSERT setiap paket mesin terkait.\n\nRUN / TROUBLE:\n- INSERT baseline pertama setelah deploy/restart.\n- INSERT hanya ketika status berubah LOW <-> HIGH.\n=========================================================\n*/\n\nconst MACHINE = \"IMC-94\";\nconst MAIN_TABLE = \"rh_imc_94\";\nconst RUN_TABLE = \"rh_imc_94_run\";\nconst TROUBLE_TABLE = \"rh_imc_94_trouble\";\nconst RTC_MAX_AGE_MS = 5000;\n\nconst p = msg.payload;\n\nif (!p || p.name !== MACHINE) {\n    return null;\n}\n\nconst createdAt = global.get(\"rtc_sql_datetime\");\nconst rtcLastReceivedMs = Number(global.get(\"rtc_last_received_ms\"));\nconst rtcAgeMs = Date.now() - rtcLastReceivedMs;\n\nif (\n    typeof createdAt !== \"string\" ||\n    !/^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}$/.test(createdAt) ||\n    !Number.isFinite(rtcLastReceivedMs) ||\n    rtcLastReceivedMs <= 0 ||\n    rtcAgeMs < 0 ||\n    rtcAgeMs > RTC_MAX_AGE_MS\n) {\n    node.status({ fill: \"red\", shape: \"ring\", text: \"INSERT BLOCKED | RTC invalid/stale\" });\n    node.error(`${MACHINE}: INSERT dibatalkan karena RTC belum sinkron atau kedaluwarsa.`, msg);\n    return null;\n}\n\nconst runStatus = p.running === true ? \"HIGH\" : \"LOW\";\nconst troubleStatus = p.trouble === true ? \"HIGH\" : \"LOW\";\n\nlet mainStatus = \"STOPPED\";\nif (p.trouble === true) {\n    mainStatus = \"TROUBLE\";\n}\nelse if (p.running === true) {\n    mainStatus = \"RUNNING\";\n}\n\nfunction escapeSql(value) {\n    return String(value)\n        .replace(/\\\\/g, \"\\\\\\\\\")\n        .replace(/'/g, \"''\");\n}\n\nfunction makeInsert(table, status, type) {\n    const sql = `\nINSERT INTO \\`${table}\\`\n    (\\`name_line\\`, \\`status\\`, \\`created_at\\`)\nVALUES\n    (\n        '${escapeSql(MACHINE)}',\n        '${escapeSql(status)}',\n        '${escapeSql(createdAt)}'\n    );\n    `.trim();\n\n    return {\n        topic: sql,\n        payload: {\n            machine: MACHINE,\n            source_slave: p.slave,\n            table_name: table,\n            insert_type: type,\n            inserted_status: status,\n            created_at: createdAt,\n            rtc_age_ms: rtcAgeMs,\n            runningRaw: p.runningRaw,\n            troubleRaw: p.troubleRaw,\n            timestamp: p.timestamp\n        }\n    };\n}\n\nconst previous = context.get(\"state\");\nconst queries = [];\n\n// Tabel utama selalu menerima status dan waktu RTC terbaru.\n// MAIN TABLE INSERT DIHAPUS\n// Hanya menyimpan perubahan RUN/TROUBLE\n\n// Tabel RUN menerima baseline dan setiap perubahan status.\nif (!previous || previous.run !== runStatus) {\n    queries.push(makeInsert(RUN_TABLE, runStatus, \"RUN\"));\n}\n\n// Tabel TROUBLE menerima baseline dan setiap perubahan status.\nif (!previous || previous.trouble !== troubleStatus) {\n    queries.push(makeInsert(TROUBLE_TABLE, troubleStatus, \"TROUBLE\"));\n}\n\ncontext.set(\"state\", {\n    run: runStatus,\n    trouble: troubleStatus\n});\n\nlet fill = \"grey\";\nif (mainStatus === \"RUNNING\") {\n    fill = \"green\";\n}\nelse if (mainStatus === \"TROUBLE\") {\n    fill = \"red\";\n}\n\nnode.status({\n    fill,\n    shape: \"dot\",\n    text: `${mainStatus} | RTC ${createdAt} | SQL:${queries.length}`\n});\n\n// Array pada output pertama membuat MySQL menerima query satu per satu.\nreturn [queries];\n",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 1550,
        "y": 720,
        "wires": [
            [
                "019db8d4751254bb"
            ]
        ]
    },
    {
        "id": "63fcbea4b8c49b85",
        "type": "function",
        "z": "7b2681a7fde4633e",
        "name": "IMC-103 | SQL Logger",
        "func": "/*\n=========================================================\n IMC-103 - DATABASE LOGGER + RTC created_at\n=========================================================\nMAIN     : rh_imc_103\nRUN      : rh_imc_103_run\nTROUBLE  : rh_imc_103_trouble\n\ncreated_at wajib berasal dari RTC I2C.\nJika RTC belum sinkron atau lebih dari 5 detik tidak diperbarui,\nsemua INSERT untuk mesin ini dibatalkan.\n\nMAIN:\n- INSERT setiap paket mesin terkait.\n\nRUN / TROUBLE:\n- INSERT baseline pertama setelah deploy/restart.\n- INSERT hanya ketika status berubah LOW <-> HIGH.\n=========================================================\n*/\n\nconst MACHINE = \"IMC-103\";\nconst MAIN_TABLE = \"rh_imc_103\";\nconst RUN_TABLE = \"rh_imc_103_run\";\nconst TROUBLE_TABLE = \"rh_imc_103_trouble\";\nconst RTC_MAX_AGE_MS = 5000;\n\nconst p = msg.payload;\n\nif (!p || p.name !== MACHINE) {\n    return null;\n}\n\nconst createdAt = global.get(\"rtc_sql_datetime\");\nconst rtcLastReceivedMs = Number(global.get(\"rtc_last_received_ms\"));\nconst rtcAgeMs = Date.now() - rtcLastReceivedMs;\n\nif (\n    typeof createdAt !== \"string\" ||\n    !/^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}$/.test(createdAt) ||\n    !Number.isFinite(rtcLastReceivedMs) ||\n    rtcLastReceivedMs <= 0 ||\n    rtcAgeMs < 0 ||\n    rtcAgeMs > RTC_MAX_AGE_MS\n) {\n    node.status({ fill: \"red\", shape: \"ring\", text: \"INSERT BLOCKED | RTC invalid/stale\" });\n    node.error(`${MACHINE}: INSERT dibatalkan karena RTC belum sinkron atau kedaluwarsa.`, msg);\n    return null;\n}\n\nconst runStatus = p.running === true ? \"HIGH\" : \"LOW\";\nconst troubleStatus = p.trouble === true ? \"HIGH\" : \"LOW\";\n\nlet mainStatus = \"STOPPED\";\nif (p.trouble === true) {\n    mainStatus = \"TROUBLE\";\n}\nelse if (p.running === true) {\n    mainStatus = \"RUNNING\";\n}\n\nfunction escapeSql(value) {\n    return String(value)\n        .replace(/\\\\/g, \"\\\\\\\\\")\n        .replace(/'/g, \"''\");\n}\n\nfunction makeInsert(table, status, type) {\n    const sql = `\nINSERT INTO \\`${table}\\`\n    (\\`name_line\\`, \\`status\\`, \\`created_at\\`)\nVALUES\n    (\n        '${escapeSql(MACHINE)}',\n        '${escapeSql(status)}',\n        '${escapeSql(createdAt)}'\n    );\n    `.trim();\n\n    return {\n        topic: sql,\n        payload: {\n            machine: MACHINE,\n            source_slave: p.slave,\n            table_name: table,\n            insert_type: type,\n            inserted_status: status,\n            created_at: createdAt,\n            rtc_age_ms: rtcAgeMs,\n            runningRaw: p.runningRaw,\n            troubleRaw: p.troubleRaw,\n            timestamp: p.timestamp\n        }\n    };\n}\n\nconst previous = context.get(\"state\");\nconst queries = [];\n\n// Tabel utama selalu menerima status dan waktu RTC terbaru.\n// MAIN TABLE INSERT DIHAPUS\n// Hanya menyimpan perubahan RUN/TROUBLE\n\n// Tabel RUN menerima baseline dan setiap perubahan status.\nif (!previous || previous.run !== runStatus) {\n    queries.push(makeInsert(RUN_TABLE, runStatus, \"RUN\"));\n}\n\n// Tabel TROUBLE menerima baseline dan setiap perubahan status.\nif (!previous || previous.trouble !== troubleStatus) {\n    queries.push(makeInsert(TROUBLE_TABLE, troubleStatus, \"TROUBLE\"));\n}\n\ncontext.set(\"state\", {\n    run: runStatus,\n    trouble: troubleStatus\n});\n\nlet fill = \"grey\";\nif (mainStatus === \"RUNNING\") {\n    fill = \"green\";\n}\nelse if (mainStatus === \"TROUBLE\") {\n    fill = \"red\";\n}\n\nnode.status({\n    fill,\n    shape: \"dot\",\n    text: `${mainStatus} | RTC ${createdAt} | SQL:${queries.length}`\n});\n\n// Array pada output pertama membuat MySQL menerima query satu per satu.\nreturn [queries];\n",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 1550,
        "y": 770,
        "wires": [
            [
                "019db8d4751254bb"
            ]
        ]
    },
    {
        "id": "68cd75068302d405",
        "type": "function",
        "z": "7b2681a7fde4633e",
        "name": "IMC-229 | SQL Logger",
        "func": "/*\n=========================================================\n IMC-229 - DATABASE LOGGER + RTC created_at\n=========================================================\nMAIN     : rh_imc_229\nRUN      : rh_imc_229_run\nTROUBLE  : rh_imc_229_trouble\n\ncreated_at wajib berasal dari RTC I2C.\nJika RTC belum sinkron atau lebih dari 5 detik tidak diperbarui,\nsemua INSERT untuk mesin ini dibatalkan.\n\nMAIN:\n- INSERT setiap paket mesin terkait.\n\nRUN / TROUBLE:\n- INSERT baseline pertama setelah deploy/restart.\n- INSERT hanya ketika status berubah LOW <-> HIGH.\n=========================================================\n*/\n\nconst MACHINE = \"IMC-229\";\nconst MAIN_TABLE = \"rh_imc_229\";\nconst RUN_TABLE = \"rh_imc_229_run\";\nconst TROUBLE_TABLE = \"rh_imc_229_trouble\";\nconst RTC_MAX_AGE_MS = 5000;\n\nconst p = msg.payload;\n\nif (!p || p.name !== MACHINE) {\n    return null;\n}\n\nconst createdAt = global.get(\"rtc_sql_datetime\");\nconst rtcLastReceivedMs = Number(global.get(\"rtc_last_received_ms\"));\nconst rtcAgeMs = Date.now() - rtcLastReceivedMs;\n\nif (\n    typeof createdAt !== \"string\" ||\n    !/^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}$/.test(createdAt) ||\n    !Number.isFinite(rtcLastReceivedMs) ||\n    rtcLastReceivedMs <= 0 ||\n    rtcAgeMs < 0 ||\n    rtcAgeMs > RTC_MAX_AGE_MS\n) {\n    node.status({ fill: \"red\", shape: \"ring\", text: \"INSERT BLOCKED | RTC invalid/stale\" });\n    node.error(`${MACHINE}: INSERT dibatalkan karena RTC belum sinkron atau kedaluwarsa.`, msg);\n    return null;\n}\n\nconst runStatus = p.running === true ? \"HIGH\" : \"LOW\";\nconst troubleStatus = p.trouble === true ? \"HIGH\" : \"LOW\";\n\nlet mainStatus = \"STOPPED\";\nif (p.trouble === true) {\n    mainStatus = \"TROUBLE\";\n}\nelse if (p.running === true) {\n    mainStatus = \"RUNNING\";\n}\n\nfunction escapeSql(value) {\n    return String(value)\n        .replace(/\\\\/g, \"\\\\\\\\\")\n        .replace(/'/g, \"''\");\n}\n\nfunction makeInsert(table, status, type) {\n    const sql = `\nINSERT INTO \\`${table}\\`\n    (\\`name_line\\`, \\`status\\`, \\`created_at\\`)\nVALUES\n    (\n        '${escapeSql(MACHINE)}',\n        '${escapeSql(status)}',\n        '${escapeSql(createdAt)}'\n    );\n    `.trim();\n\n    return {\n        topic: sql,\n        payload: {\n            machine: MACHINE,\n            source_slave: p.slave,\n            table_name: table,\n            insert_type: type,\n            inserted_status: status,\n            created_at: createdAt,\n            rtc_age_ms: rtcAgeMs,\n            runningRaw: p.runningRaw,\n            troubleRaw: p.troubleRaw,\n            timestamp: p.timestamp\n        }\n    };\n}\n\nconst previous = context.get(\"state\");\nconst queries = [];\n\n// Tabel utama selalu menerima status dan waktu RTC terbaru.\n// MAIN TABLE INSERT DIHAPUS\n// Hanya menyimpan perubahan RUN/TROUBLE\n\n// Tabel RUN menerima baseline dan setiap perubahan status.\nif (!previous || previous.run !== runStatus) {\n    queries.push(makeInsert(RUN_TABLE, runStatus, \"RUN\"));\n}\n\n// Tabel TROUBLE menerima baseline dan setiap perubahan status.\nif (!previous || previous.trouble !== troubleStatus) {\n    queries.push(makeInsert(TROUBLE_TABLE, troubleStatus, \"TROUBLE\"));\n}\n\ncontext.set(\"state\", {\n    run: runStatus,\n    trouble: troubleStatus\n});\n\nlet fill = \"grey\";\nif (mainStatus === \"RUNNING\") {\n    fill = \"green\";\n}\nelse if (mainStatus === \"TROUBLE\") {\n    fill = \"red\";\n}\n\nnode.status({\n    fill,\n    shape: \"dot\",\n    text: `${mainStatus} | RTC ${createdAt} | SQL:${queries.length}`\n});\n\n// Array pada output pertama membuat MySQL menerima query satu per satu.\nreturn [queries];\n",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 1550,
        "y": 820,
        "wires": [
            [
                "019db8d4751254bb"
            ]
        ]
    },
    {
        "id": "bfbf5b124cb3d194",
        "type": "function",
        "z": "7b2681a7fde4633e",
        "name": "IMC-251 | SQL Logger",
        "func": "/*\n=========================================================\n IMC-251 - DATABASE LOGGER + RTC created_at\n=========================================================\nMAIN     : rh_imc_251\nRUN      : rh_imc_251_run\nTROUBLE  : rh_imc_251_trouble\n\ncreated_at wajib berasal dari RTC I2C.\nJika RTC belum sinkron atau lebih dari 5 detik tidak diperbarui,\nsemua INSERT untuk mesin ini dibatalkan.\n\nMAIN:\n- INSERT setiap paket mesin terkait.\n\nRUN / TROUBLE:\n- INSERT baseline pertama setelah deploy/restart.\n- INSERT hanya ketika status berubah LOW <-> HIGH.\n=========================================================\n*/\n\nconst MACHINE = \"IMC-251\";\nconst MAIN_TABLE = \"rh_imc_251\";\nconst RUN_TABLE = \"rh_imc_251_run\";\nconst TROUBLE_TABLE = \"rh_imc_251_trouble\";\nconst RTC_MAX_AGE_MS = 5000;\n\nconst p = msg.payload;\n\nif (!p || p.name !== MACHINE) {\n    return null;\n}\n\nconst createdAt = global.get(\"rtc_sql_datetime\");\nconst rtcLastReceivedMs = Number(global.get(\"rtc_last_received_ms\"));\nconst rtcAgeMs = Date.now() - rtcLastReceivedMs;\n\nif (\n    typeof createdAt !== \"string\" ||\n    !/^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}$/.test(createdAt) ||\n    !Number.isFinite(rtcLastReceivedMs) ||\n    rtcLastReceivedMs <= 0 ||\n    rtcAgeMs < 0 ||\n    rtcAgeMs > RTC_MAX_AGE_MS\n) {\n    node.status({ fill: \"red\", shape: \"ring\", text: \"INSERT BLOCKED | RTC invalid/stale\" });\n    node.error(`${MACHINE}: INSERT dibatalkan karena RTC belum sinkron atau kedaluwarsa.`, msg);\n    return null;\n}\n\nconst runStatus = p.running === true ? \"HIGH\" : \"LOW\";\nconst troubleStatus = p.trouble === true ? \"HIGH\" : \"LOW\";\n\nlet mainStatus = \"STOPPED\";\nif (p.trouble === true) {\n    mainStatus = \"TROUBLE\";\n}\nelse if (p.running === true) {\n    mainStatus = \"RUNNING\";\n}\n\nfunction escapeSql(value) {\n    return String(value)\n        .replace(/\\\\/g, \"\\\\\\\\\")\n        .replace(/'/g, \"''\");\n}\n\nfunction makeInsert(table, status, type) {\n    const sql = `\nINSERT INTO \\`${table}\\`\n    (\\`name_line\\`, \\`status\\`, \\`created_at\\`)\nVALUES\n    (\n        '${escapeSql(MACHINE)}',\n        '${escapeSql(status)}',\n        '${escapeSql(createdAt)}'\n    );\n    `.trim();\n\n    return {\n        topic: sql,\n        payload: {\n            machine: MACHINE,\n            source_slave: p.slave,\n            table_name: table,\n            insert_type: type,\n            inserted_status: status,\n            created_at: createdAt,\n            rtc_age_ms: rtcAgeMs,\n            runningRaw: p.runningRaw,\n            troubleRaw: p.troubleRaw,\n            timestamp: p.timestamp\n        }\n    };\n}\n\nconst previous = context.get(\"state\");\nconst queries = [];\n\n// Tabel utama selalu menerima status dan waktu RTC terbaru.\n// MAIN TABLE INSERT DIHAPUS\n// Hanya menyimpan perubahan RUN/TROUBLE\n\n// Tabel RUN menerima baseline dan setiap perubahan status.\nif (!previous || previous.run !== runStatus) {\n    queries.push(makeInsert(RUN_TABLE, runStatus, \"RUN\"));\n}\n\n// Tabel TROUBLE menerima baseline dan setiap perubahan status.\nif (!previous || previous.trouble !== troubleStatus) {\n    queries.push(makeInsert(TROUBLE_TABLE, troubleStatus, \"TROUBLE\"));\n}\n\ncontext.set(\"state\", {\n    run: runStatus,\n    trouble: troubleStatus\n});\n\nlet fill = \"grey\";\nif (mainStatus === \"RUNNING\") {\n    fill = \"green\";\n}\nelse if (mainStatus === \"TROUBLE\") {\n    fill = \"red\";\n}\n\nnode.status({\n    fill,\n    shape: \"dot\",\n    text: `${mainStatus} | RTC ${createdAt} | SQL:${queries.length}`\n});\n\n// Array pada output pertama membuat MySQL menerima query satu per satu.\nreturn [queries];\n",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 1550,
        "y": 870,
        "wires": [
            [
                "019db8d4751254bb"
            ]
        ]
    },
    {
        "id": "980fbdc1f5bbcf5c",
        "type": "catch",
        "z": "7b2681a7fde4633e",
        "name": "Catch Flow Error",
        "scope": null,
        "uncaught": false,
        "x": 1120,
        "y": 575,
        "wires": [
            [
                "a0ac190c63e031c0"
            ]
        ]
    },
    {
        "id": "a0ac190c63e031c0",
        "type": "debug",
        "z": "7b2681a7fde4633e",
        "name": "FLOW ERROR",
        "active": false,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "true",
        "targetType": "full",
        "statusVal": "",
        "statusType": "auto",
        "x": 1140,
        "y": 615,
        "wires": []
    },
    {
        "id": "0e39cd68a623ff81",
        "type": "function",
        "z": "7b2681a7fde4633e",
        "name": "IDH-23 | SQL Logger",
        "func": "/*\n=========================================================\n IDH-23 - DATABASE LOGGER + RTC created_at\n=========================================================\nMAIN     : rh_idh_23\nRUN      : rh_idh_23_run\nTROUBLE  : rh_idh_23_trouble\n\ncreated_at wajib berasal dari RTC I2C.\nJika RTC belum sinkron atau lebih dari 5 detik tidak diperbarui,\nsemua INSERT untuk mesin ini dibatalkan.\n\nMAIN:\n- INSERT setiap paket mesin terkait.\n\nRUN / TROUBLE:\n- INSERT baseline pertama setelah deploy/restart.\n- INSERT hanya ketika status berubah LOW <-> HIGH.\n=========================================================\n*/\n\nconst MACHINE = \"IDH-23\";\nconst MAIN_TABLE = \"rh_idh_23\";\nconst RUN_TABLE = \"rh_idh_23_run\";\nconst TROUBLE_TABLE = \"rh_idh_23_trouble\";\nconst RTC_MAX_AGE_MS = 5000;\n\nconst p = msg.payload;\n\nif (!p || p.name !== MACHINE) {\n    return null;\n}\n\nconst createdAt = global.get(\"rtc_sql_datetime\");\nconst rtcLastReceivedMs = Number(global.get(\"rtc_last_received_ms\"));\nconst rtcAgeMs = Date.now() - rtcLastReceivedMs;\n\nif (\n    typeof createdAt !== \"string\" ||\n    !/^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}$/.test(createdAt) ||\n    !Number.isFinite(rtcLastReceivedMs) ||\n    rtcLastReceivedMs <= 0 ||\n    rtcAgeMs < 0 ||\n    rtcAgeMs > RTC_MAX_AGE_MS\n) {\n    node.status({ fill: \"red\", shape: \"ring\", text: \"INSERT BLOCKED | RTC invalid/stale\" });\n    node.error(`${MACHINE}: INSERT dibatalkan karena RTC belum sinkron atau kedaluwarsa.`, msg);\n    return null;\n}\n\nconst runStatus = p.running === true ? \"HIGH\" : \"LOW\";\nconst troubleStatus = p.trouble === true ? \"HIGH\" : \"LOW\";\n\nlet mainStatus = \"STOPPED\";\nif (p.trouble === true) {\n    mainStatus = \"TROUBLE\";\n}\nelse if (p.running === true) {\n    mainStatus = \"RUNNING\";\n}\n\nfunction escapeSql(value) {\n    return String(value)\n        .replace(/\\\\/g, \"\\\\\\\\\")\n        .replace(/'/g, \"''\");\n}\n\nfunction makeInsert(table, status, type) {\n    const sql = `\nINSERT INTO \\`${table}\\`\n    (\\`name_line\\`, \\`status\\`, \\`created_at\\`)\nVALUES\n    (\n        '${escapeSql(MACHINE)}',\n        '${escapeSql(status)}',\n        '${escapeSql(createdAt)}'\n    );\n    `.trim();\n\n    return {\n        topic: sql,\n        payload: {\n            machine: MACHINE,\n            source_slave: p.slave,\n            table_name: table,\n            insert_type: type,\n            inserted_status: status,\n            created_at: createdAt,\n            rtc_age_ms: rtcAgeMs,\n            runningRaw: p.runningRaw,\n            troubleRaw: p.troubleRaw,\n            timestamp: p.timestamp\n        }\n    };\n}\n\nconst previous = context.get(\"state\");\nconst queries = [];\n\n// Tabel utama selalu menerima status dan waktu RTC terbaru.\n// MAIN TABLE INSERT DIHAPUS\n// Hanya menyimpan perubahan RUN/TROUBLE\n\n// Tabel RUN menerima baseline dan setiap perubahan status.\nif (!previous || previous.run !== runStatus) {\n    queries.push(makeInsert(RUN_TABLE, runStatus, \"RUN\"));\n}\n\n// Tabel TROUBLE menerima baseline dan setiap perubahan status.\nif (!previous || previous.trouble !== troubleStatus) {\n    queries.push(makeInsert(TROUBLE_TABLE, troubleStatus, \"TROUBLE\"));\n}\n\ncontext.set(\"state\", {\n    run: runStatus,\n    trouble: troubleStatus\n});\n\nlet fill = \"grey\";\nif (mainStatus === \"RUNNING\") {\n    fill = \"green\";\n}\nelse if (mainStatus === \"TROUBLE\") {\n    fill = \"red\";\n}\n\nnode.status({\n    fill,\n    shape: \"dot\",\n    text: `${mainStatus} | RTC ${createdAt} | SQL:${queries.length}`\n});\n\n// Array pada output pertama membuat MySQL menerima query satu per satu.\nreturn [queries];\n",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 1550,
        "y": 920,
        "wires": [
            [
                "019db8d4751254bb"
            ]
        ]
    },
    {
        "id": "e7965d3a2d7bdab6",
        "type": "comment",
        "z": "7b2681a7fde4633e",
        "name": "RTC I2C WAJIB UPDATE <= 5 DETIK",
        "info": "Hubungkan output RTC I2C ke Function RTC. Seluruh INSERT diblokir jika RTC tidak valid atau lebih dari 5 detik tidak diperbarui.",
        "x": 1190,
        "y": 485,
        "wires": []
    },
    {
        "id": "08cac353b8f28693",
        "type": "function",
        "z": "7b2681a7fde4633e",
        "name": "INPUT RTC I2C | Sync created_at",
        "func": "/*\n=========================================================\n RTC I2C -> created_at MySQL\n=========================================================\nHubungkan output node RTC I2C langsung ke input Function ini.\n\nFormat yang didukung:\n1. Object Indonesia dari RTC pengguna:\n   {tahun:2026, bulan:9, tanggal:1, jam:18, menit:1, detik:33}\n   Properti hariNomor dan hari boleh tetap ada dan akan diabaikan.\n2. Object umum:\n   {year:2026, month:9, day:1, hour:18, minute:1, second:33}\n3. String:\n   \"2026-09-01 17:25:57\" atau ISO datetime\n4. Epoch detik/milidetik\n5. Buffer BCD register DS3231/DS1307 mulai register 0\n\nUntuk format epoch, offset disetel WIB (UTC+7).\nNilai tanggal yang dimasukkan ke database tetap berasal dari RTC.\n=========================================================\n*/\n\nconst EPOCH_OFFSET_MINUTES = 7 * 60; // WIB / UTC+7\n\nfunction pad(value) {\n    return String(value).padStart(2, \"0\");\n}\n\nfunction bcdToNumber(value) {\n    return ((value >> 4) * 10) + (value & 0x0F);\n}\n\nfunction validateParts(parts) {\n    const values = [\n        parts.year, parts.month, parts.day,\n        parts.hour, parts.minute, parts.second\n    ].map(Number);\n\n    if (values.some(value => !Number.isInteger(value))) {\n        return null;\n    }\n\n    const [year, month, day, hour, minute, second] = values;\n    const neutralDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));\n\n    if (\n        year < 2000 || year > 2199 ||\n        neutralDate.getUTCFullYear() !== year ||\n        neutralDate.getUTCMonth() + 1 !== month ||\n        neutralDate.getUTCDate() !== day ||\n        neutralDate.getUTCHours() !== hour ||\n        neutralDate.getUTCMinutes() !== minute ||\n        neutralDate.getUTCSeconds() !== second\n    ) {\n        return null;\n    }\n\n    return { year, month, day, hour, minute, second };\n}\n\nfunction partsFromEpoch(value) {\n    let epochMs = Number(value);\n\n    if (!Number.isFinite(epochMs)) {\n        return null;\n    }\n\n    // Nilai kurang dari 10^12 dianggap epoch detik.\n    if (Math.abs(epochMs) < 1e12) {\n        epochMs *= 1000;\n    }\n\n    const date = new Date(epochMs + (EPOCH_OFFSET_MINUTES * 60000));\n\n    if (!Number.isFinite(date.getTime())) {\n        return null;\n    }\n\n    return validateParts({\n        year: date.getUTCFullYear(),\n        month: date.getUTCMonth() + 1,\n        day: date.getUTCDate(),\n        hour: date.getUTCHours(),\n        minute: date.getUTCMinutes(),\n        second: date.getUTCSeconds()\n    });\n}\n\nfunction partsFromString(value) {\n    const text = String(value ?? \"\").trim();\n\n    const directMatch = text.match(\n        /^(\\d{4})[-/](\\d{1,2})[-/](\\d{1,2})[ T](\\d{1,2}):(\\d{1,2})(?::(\\d{1,2}))?/\n    );\n\n    if (directMatch) {\n        return validateParts({\n            year: Number(directMatch[1]),\n            month: Number(directMatch[2]),\n            day: Number(directMatch[3]),\n            hour: Number(directMatch[4]),\n            minute: Number(directMatch[5]),\n            second: Number(directMatch[6] ?? 0)\n        });\n    }\n\n    if (/^\\d{10,13}$/.test(text)) {\n        return partsFromEpoch(Number(text));\n    }\n\n    const parsed = Date.parse(text);\n    return Number.isFinite(parsed) ? partsFromEpoch(parsed) : null;\n}\n\nfunction partsFromBcdBuffer(buffer) {\n    if (!Buffer.isBuffer(buffer) || buffer.length < 7) {\n        return null;\n    }\n\n    const second = bcdToNumber(buffer[0] & 0x7F);\n    const minute = bcdToNumber(buffer[1] & 0x7F);\n    const hourRegister = buffer[2];\n    let hour;\n\n    if ((hourRegister & 0x40) !== 0) {\n        // Mode 12 jam.\n        hour = bcdToNumber(hourRegister & 0x1F);\n        const isPm = (hourRegister & 0x20) !== 0;\n        hour = (hour % 12) + (isPm ? 12 : 0);\n    }\n    else {\n        // Mode 24 jam.\n        hour = bcdToNumber(hourRegister & 0x3F);\n    }\n\n    const day = bcdToNumber(buffer[4] & 0x3F);\n    const monthRegister = buffer[5];\n    const month = bcdToNumber(monthRegister & 0x1F);\n    const century = (monthRegister & 0x80) !== 0 ? 100 : 0;\n    const year = 2000 + century + bcdToNumber(buffer[6]);\n\n    return validateParts({ year, month, day, hour, minute, second });\n}\n\nfunction partsFromObject(value) {\n    if (!value || typeof value !== \"object\" || Array.isArray(value)) {\n        return null;\n    }\n\n    if (value instanceof Date) {\n        return partsFromEpoch(value.getTime());\n    }\n\n    const year = value.tahun ?? value.year ?? value.years ?? value.fullYear;\n    const month = value.bulan ?? value.month ?? value.months;\n    const day = value.tanggal ?? value.day ?? value.date ?? value.dayOfMonth;\n    const hour = value.jam ?? value.hour ?? value.hours;\n    const minute = value.menit ?? value.minute ?? value.minutes ?? value.min;\n    const second = value.detik ?? value.second ?? value.seconds ?? value.sec ?? 0;\n\n    if (\n        year !== undefined && month !== undefined && day !== undefined &&\n        hour !== undefined && minute !== undefined\n    ) {\n        const normalizedYear = Number(year) < 100 ? 2000 + Number(year) : Number(year);\n        return validateParts({\n            year: normalizedYear,\n            month: Number(month),\n            day: Number(day),\n            hour: Number(hour),\n            minute: Number(minute),\n            second: Number(second)\n        });\n    }\n\n    const nestedKeys = [\n        \"datetime\", \"dateTime\", \"rtc_datetime\", \"rtcDateTime\",\n        \"timestamp\", \"time\", \"value\", \"rtc\", \"data\"\n    ];\n\n    for (const key of nestedKeys) {\n        if (value[key] !== undefined && value[key] !== value) {\n            const nestedParts = extractParts(value[key]);\n            if (nestedParts) {\n                return nestedParts;\n            }\n        }\n    }\n\n    return null;\n}\n\nfunction extractParts(value) {\n    if (Buffer.isBuffer(value)) {\n        const asText = value.toString(\"utf8\").trim();\n        const looksLikeText = asText.length > 0 && /^[\\x20-\\x7E]+$/.test(asText);\n\n        if (looksLikeText) {\n            try {\n                return partsFromObject(JSON.parse(asText)) || partsFromString(asText);\n            }\n            catch (err) {\n                return partsFromString(asText);\n            }\n        }\n\n        return partsFromBcdBuffer(value);\n    }\n\n    if (typeof value === \"number\") {\n        return partsFromEpoch(value);\n    }\n\n    if (typeof value === \"string\") {\n        try {\n            const parsedJson = JSON.parse(value);\n            if (parsedJson !== value) {\n                const jsonParts = extractParts(parsedJson);\n                if (jsonParts) {\n                    return jsonParts;\n                }\n            }\n        }\n        catch (err) {\n            // String biasa diproses di bawah.\n        }\n\n        return partsFromString(value);\n    }\n\n    return partsFromObject(value);\n}\n\nconst parts = extractParts(msg.payload);\n\nif (!parts) {\n    global.set(\"rtc_sql_datetime\", null);\n    global.set(\"rtc_last_received_ms\", null);\n    node.status({ fill: \"red\", shape: \"ring\", text: \"Format RTC tidak dikenali\" });\n    node.error(\"Format payload RTC tidak dikenali. INSERT mesin dihentikan.\", msg);\n    return null;\n}\n\nconst sqlDateTime =\n    `${parts.year}-${pad(parts.month)}-${pad(parts.day)} ` +\n    `${pad(parts.hour)}:${pad(parts.minute)}:${pad(parts.second)}`;\n\nglobal.set(\"rtc_sql_datetime\", sqlDateTime);\nglobal.set(\"rtc_last_received_ms\", Date.now());\n\nnode.status({ fill: \"green\", shape: \"dot\", text: sqlDateTime });\n\nmsg.rtc_created_at = sqlDateTime;\nmsg.payload = {\n    created_at: sqlDateTime,\n    source: \"RTC_I2C\",\n    valid: true\n};\n\nreturn msg;\n",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 1180,
        "y": 520,
        "wires": [
            []
        ]
    },
    {
        "id": "1e2edc22e74a7ab4",
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
        "serialPort": "/dev/ttyUSB0",
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
        "id": "1de0ba59d3850d3e",
        "type": "global-config",
        "env": [],
        "modules": {
            "node-red-contrib-modbus": "5.60.2",
            "node-red-node-mysql": "3.0.3"
        }
    }
]
