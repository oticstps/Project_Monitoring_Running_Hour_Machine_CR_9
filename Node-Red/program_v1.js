[
    {
        "id": "07aa0fccfde78188",
        "type": "comment",
        "z": "d4d9cebcf0925ff4",
        "name": "14 IMC - EACH MACHINE HAS ITS OWN FUNCTION NODE",
        "info": "Serial -> Parser 14 outputs -> 14 individual Function nodes -> shared MySQL.",
        "x": 700,
        "y": 30,
        "wires": []
    },
    {
        "id": "5e61d00280473bd2",
        "type": "serial in",
        "z": "d4d9cebcf0925ff4",
        "name": "E32 COM4",
        "serial": "fab7db4e7ba2976c",
        "x": 80,
        "y": 45,
        "wires": [
            [
                "ab8d2e0da4f86a2c",
                "ddc1ddb228682cb4"
            ]
        ]
    },
    {
        "id": "ab8d2e0da4f86a2c",
        "type": "debug",
        "z": "d4d9cebcf0925ff4",
        "name": "RAW COM4",
        "active": false,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "payload",
        "targetType": "msg",
        "statusVal": "",
        "statusType": "auto",
        "x": 260,
        "y": 45,
        "wires": []
    },
    {
        "id": "ddc1ddb228682cb4",
        "type": "function",
        "z": "d4d9cebcf0925ff4",
        "name": "Parse 14 IMC -> 14 Outputs",
        "func": "/*\n=========================================================\n PARSER 14 IMC\n=========================================================\nTHRESHOLD : > 2000 = HIGH\n            <= 2000 = LOW\n\nPAKET 28 NILAI:\n[\n IMC40_RUN,  IMC40_TROUBLE,\n IMC10_RUN,  IMC10_TROUBLE,\n IMC28_RUN,  IMC28_TROUBLE,\n IMC29_RUN,  IMC29_TROUBLE,\n IMC19_RUN,  IMC19_TROUBLE,\n IMC20_RUN,  IMC20_TROUBLE,\n IMC21_RUN,  IMC21_TROUBLE,\n IMC23_RUN,  IMC23_TROUBLE,\n IMC45_RUN,  IMC45_TROUBLE,\n IMC61_RUN,  IMC61_TROUBLE,\n IMC94_RUN,  IMC94_TROUBLE,\n IMC103_RUN, IMC103_TROUBLE,\n IMC229_RUN, IMC229_TROUBLE,\n IMC251_RUN, IMC251_TROUBLE\n]\n\nOUTPUT:\n1  = IMC-40\n2  = IMC-10\n3  = IMC-28\n4  = IMC-29\n5  = IMC-19\n6  = IMC-20\n7  = IMC-21\n8  = IMC-23\n9  = IMC-45\n10 = IMC-61\n11 = IMC-94\n12 = IMC-103\n13 = IMC-229\n14 = IMC-251\n\nUntuk masa transisi, paket lama 8 nilai masih diterima.\n=========================================================\n*/\n\nconst THRESHOLD = 2000;\n\nlet raw = msg.payload;\n\nif (Buffer.isBuffer(raw)) {\n    raw = raw.toString(\"utf8\");\n}\n\nraw = String(raw ?? \"\").trim();\n\nlet values;\n\ntry {\n    values = JSON.parse(raw);\n}\ncatch (err) {\n    node.status({\n        fill: \"red\",\n        shape: \"ring\",\n        text: \"Invalid JSON\"\n    });\n    return null;\n}\n\nif (!Array.isArray(values)) {\n    node.status({\n        fill: \"red\",\n        shape: \"ring\",\n        text: \"Payload bukan array\"\n    });\n    return null;\n}\n\nif (values.length !== 8 && values.length !== 28) {\n    node.status({\n        fill: \"yellow\",\n        shape: \"ring\",\n        text: `Length ${values.length}, harus 8/28`\n    });\n    return null;\n}\n\nvalues = values.map(Number);\n\nif (values.some(v => !Number.isFinite(v))) {\n    node.status({\n        fill: \"red\",\n        shape: \"ring\",\n        text: \"Data non-numeric\"\n    });\n    return null;\n}\n\nconst defs28 = [\n    {name:\"IMC-40\",  run:0,  trouble:1},\n    {name:\"IMC-10\",  run:2,  trouble:3},\n    {name:\"IMC-28\",  run:4,  trouble:5},\n    {name:\"IMC-29\",  run:6,  trouble:7},\n    {name:\"IMC-19\",  run:8,  trouble:9},\n    {name:\"IMC-20\",  run:10, trouble:11},\n    {name:\"IMC-21\",  run:12, trouble:13},\n    {name:\"IMC-23\",  run:14, trouble:15},\n    {name:\"IMC-45\",  run:16, trouble:17},\n    {name:\"IMC-61\",  run:18, trouble:19},\n    {name:\"IMC-94\",  run:20, trouble:21},\n    {name:\"IMC-103\", run:22, trouble:23},\n    {name:\"IMC-229\", run:24, trouble:25},\n    {name:\"IMC-251\", run:26, trouble:27}\n];\n\nconst defs = values.length === 8\n    ? defs28.slice(0, 4)\n    : defs28;\n\nconst outputs = Array(14).fill(null);\n\ndefs.forEach((d, outputIndex) => {\n\n    const runningRaw = Number(values[d.run]);\n    const troubleRaw = Number(values[d.trouble]);\n\n    const running = runningRaw > THRESHOLD;\n    const trouble = troubleRaw > THRESHOLD;\n\n    let status = \"STOPPED\";\n\n    if (trouble) {\n        status = \"TROUBLE\";\n    }\n    else if (running) {\n        status = \"RUNNING\";\n    }\n\n    outputs[outputIndex] = {\n        payload: {\n            timestamp: Date.now(),\n            threshold: THRESHOLD,\n            name: d.name,\n            runningRaw,\n            troubleRaw,\n            running,\n            trouble,\n            status\n        }\n    };\n});\n\nnode.status({\n    fill: \"green\",\n    shape: \"dot\",\n    text: values.length === 28 ? \"14 IMC OK\" : \"4 IMC legacy OK\"\n});\n\nreturn outputs;\n",
        "outputs": 14,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 305,
        "y": 185,
        "wires": [
            [
                "54e24242ee9fdccf"
            ],
            [
                "2aceb9f78c29010b"
            ],
            [
                "90f02d51ddc4f014"
            ],
            [
                "0b6458841544975a"
            ],
            [
                "d396f4faefcffae5"
            ],
            [
                "b1ddbcbc15177068"
            ],
            [
                "a84bd8be80a77773"
            ],
            [
                "2857ea9318ff53b6"
            ],
            [
                "cf995623d0fc5090"
            ],
            [
                "dd4f827bfab66519"
            ],
            [
                "6aa2f3ca837eb594"
            ],
            [
                "5fd0996bd9b006a9"
            ],
            [
                "d4776b2c3692959a"
            ],
            [
                "ee2254d0ca5c7b40"
            ]
        ]
    },
    {
        "id": "54e24242ee9fdccf",
        "type": "function",
        "z": "d4d9cebcf0925ff4",
        "name": "IMC-40 | SQL Logger",
        "func": "/*\n=========================================================\n IMC-40 - DATABASE LOGGER\n=========================================================\nMAIN     : rh_imc_40\nRUN      : rh_imc_40_run\nTROUBLE  : rh_imc_40_trouble\n\nMAIN:\n- INSERT setiap paket.\n\nRUN / TROUBLE:\n- INSERT baseline pertama setelah deploy/restart.\n- INSERT hanya ketika status berubah LOW <-> HIGH.\n=========================================================\n*/\n\nconst MACHINE = \"IMC-40\";\nconst MAIN_TABLE = \"rh_imc_40\";\nconst RUN_TABLE = \"rh_imc_40_run\";\nconst TROUBLE_TABLE = \"rh_imc_40_trouble\";\n\nconst p = msg.payload;\n\nif (!p || p.name !== MACHINE) {\n    return null;\n}\n\nconst runStatus = p.running === true ? \"HIGH\" : \"LOW\";\nconst troubleStatus = p.trouble === true ? \"HIGH\" : \"LOW\";\n\nlet mainStatus = \"STOPPED\";\n\nif (p.trouble === true) {\n    mainStatus = \"TROUBLE\";\n}\nelse if (p.running === true) {\n    mainStatus = \"RUNNING\";\n}\n\nfunction escapeSql(value) {\n    return String(value)\n        .replace(/\\\\/g, \"\\\\\\\\\")\n        .replace(/'/g, \"''\");\n}\n\nfunction makeInsert(table, status, type) {\n\n    const sql = `\nINSERT INTO \\`${table}\\`\n    (\\`name_line\\`, \\`status\\`)\nVALUES\n    ('${escapeSql(MACHINE)}', '${escapeSql(status)}');\n    `.trim();\n\n    return {\n        topic: sql,\n        payload: {\n            machine: MACHINE,\n            table_name: table,\n            insert_type: type,\n            inserted_status: status,\n            runningRaw: p.runningRaw,\n            troubleRaw: p.troubleRaw,\n            timestamp: p.timestamp\n        }\n    };\n}\n\nlet previous = context.get(\"state\");\nlet queries = [];\n\n// MAIN selalu disimpan\nqueries.push(\n    makeInsert(\n        MAIN_TABLE,\n        mainStatus,\n        \"MAIN\"\n    )\n);\n\n// RUN baseline/perubahan\nif (!previous || previous.run !== runStatus) {\n    queries.push(\n        makeInsert(\n            RUN_TABLE,\n            runStatus,\n            \"RUN\"\n        )\n    );\n}\n\n// TROUBLE baseline/perubahan\nif (!previous || previous.trouble !== troubleStatus) {\n    queries.push(\n        makeInsert(\n            TROUBLE_TABLE,\n            troubleStatus,\n            \"TROUBLE\"\n        )\n    );\n}\n\ncontext.set(\"state\", {\n    run: runStatus,\n    trouble: troubleStatus\n});\n\nlet fill = \"grey\";\n\nif (mainStatus === \"RUNNING\") {\n    fill = \"green\";\n}\nelse if (mainStatus === \"TROUBLE\") {\n    fill = \"red\";\n}\n\nnode.status({\n    fill,\n    shape: \"dot\",\n    text: `${mainStatus} | R:${runStatus} T:${troubleStatus} | SQL:${queries.length}`\n});\n\nreturn [queries];\n",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 665,
        "y": 70,
        "wires": [
            [
                "7d2154e29dd262fe"
            ]
        ]
    },
    {
        "id": "2aceb9f78c29010b",
        "type": "function",
        "z": "d4d9cebcf0925ff4",
        "name": "IMC-10 | SQL Logger",
        "func": "/*\n=========================================================\n IMC-10 - DATABASE LOGGER\n=========================================================\nMAIN     : rh_imc_10\nRUN      : rh_imc_10_run\nTROUBLE  : rh_imc_10_trouble\n\nMAIN:\n- INSERT setiap paket.\n\nRUN / TROUBLE:\n- INSERT baseline pertama setelah deploy/restart.\n- INSERT hanya ketika status berubah LOW <-> HIGH.\n=========================================================\n*/\n\nconst MACHINE = \"IMC-10\";\nconst MAIN_TABLE = \"rh_imc_10\";\nconst RUN_TABLE = \"rh_imc_10_run\";\nconst TROUBLE_TABLE = \"rh_imc_10_trouble\";\n\nconst p = msg.payload;\n\nif (!p || p.name !== MACHINE) {\n    return null;\n}\n\nconst runStatus = p.running === true ? \"HIGH\" : \"LOW\";\nconst troubleStatus = p.trouble === true ? \"HIGH\" : \"LOW\";\n\nlet mainStatus = \"STOPPED\";\n\nif (p.trouble === true) {\n    mainStatus = \"TROUBLE\";\n}\nelse if (p.running === true) {\n    mainStatus = \"RUNNING\";\n}\n\nfunction escapeSql(value) {\n    return String(value)\n        .replace(/\\\\/g, \"\\\\\\\\\")\n        .replace(/'/g, \"''\");\n}\n\nfunction makeInsert(table, status, type) {\n\n    const sql = `\nINSERT INTO \\`${table}\\`\n    (\\`name_line\\`, \\`status\\`)\nVALUES\n    ('${escapeSql(MACHINE)}', '${escapeSql(status)}');\n    `.trim();\n\n    return {\n        topic: sql,\n        payload: {\n            machine: MACHINE,\n            table_name: table,\n            insert_type: type,\n            inserted_status: status,\n            runningRaw: p.runningRaw,\n            troubleRaw: p.troubleRaw,\n            timestamp: p.timestamp\n        }\n    };\n}\n\nlet previous = context.get(\"state\");\nlet queries = [];\n\n// MAIN selalu disimpan\nqueries.push(\n    makeInsert(\n        MAIN_TABLE,\n        mainStatus,\n        \"MAIN\"\n    )\n);\n\n// RUN baseline/perubahan\nif (!previous || previous.run !== runStatus) {\n    queries.push(\n        makeInsert(\n            RUN_TABLE,\n            runStatus,\n            \"RUN\"\n        )\n    );\n}\n\n// TROUBLE baseline/perubahan\nif (!previous || previous.trouble !== troubleStatus) {\n    queries.push(\n        makeInsert(\n            TROUBLE_TABLE,\n            troubleStatus,\n            \"TROUBLE\"\n        )\n    );\n}\n\ncontext.set(\"state\", {\n    run: runStatus,\n    trouble: troubleStatus\n});\n\nlet fill = \"grey\";\n\nif (mainStatus === \"RUNNING\") {\n    fill = \"green\";\n}\nelse if (mainStatus === \"TROUBLE\") {\n    fill = \"red\";\n}\n\nnode.status({\n    fill,\n    shape: \"dot\",\n    text: `${mainStatus} | R:${runStatus} T:${troubleStatus} | SQL:${queries.length}`\n});\n\nreturn [queries];\n",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 665,
        "y": 125,
        "wires": [
            [
                "7d2154e29dd262fe"
            ]
        ]
    },
    {
        "id": "90f02d51ddc4f014",
        "type": "function",
        "z": "d4d9cebcf0925ff4",
        "name": "IMC-28 | SQL Logger",
        "func": "/*\n=========================================================\n IMC-28 - DATABASE LOGGER\n=========================================================\nMAIN     : rh_imc_28\nRUN      : rh_imc_28_run\nTROUBLE  : rh_imc_28_trouble\n\nMAIN:\n- INSERT setiap paket.\n\nRUN / TROUBLE:\n- INSERT baseline pertama setelah deploy/restart.\n- INSERT hanya ketika status berubah LOW <-> HIGH.\n=========================================================\n*/\n\nconst MACHINE = \"IMC-28\";\nconst MAIN_TABLE = \"rh_imc_28\";\nconst RUN_TABLE = \"rh_imc_28_run\";\nconst TROUBLE_TABLE = \"rh_imc_28_trouble\";\n\nconst p = msg.payload;\n\nif (!p || p.name !== MACHINE) {\n    return null;\n}\n\nconst runStatus = p.running === true ? \"HIGH\" : \"LOW\";\nconst troubleStatus = p.trouble === true ? \"HIGH\" : \"LOW\";\n\nlet mainStatus = \"STOPPED\";\n\nif (p.trouble === true) {\n    mainStatus = \"TROUBLE\";\n}\nelse if (p.running === true) {\n    mainStatus = \"RUNNING\";\n}\n\nfunction escapeSql(value) {\n    return String(value)\n        .replace(/\\\\/g, \"\\\\\\\\\")\n        .replace(/'/g, \"''\");\n}\n\nfunction makeInsert(table, status, type) {\n\n    const sql = `\nINSERT INTO \\`${table}\\`\n    (\\`name_line\\`, \\`status\\`)\nVALUES\n    ('${escapeSql(MACHINE)}', '${escapeSql(status)}');\n    `.trim();\n\n    return {\n        topic: sql,\n        payload: {\n            machine: MACHINE,\n            table_name: table,\n            insert_type: type,\n            inserted_status: status,\n            runningRaw: p.runningRaw,\n            troubleRaw: p.troubleRaw,\n            timestamp: p.timestamp\n        }\n    };\n}\n\nlet previous = context.get(\"state\");\nlet queries = [];\n\n// MAIN selalu disimpan\nqueries.push(\n    makeInsert(\n        MAIN_TABLE,\n        mainStatus,\n        \"MAIN\"\n    )\n);\n\n// RUN baseline/perubahan\nif (!previous || previous.run !== runStatus) {\n    queries.push(\n        makeInsert(\n            RUN_TABLE,\n            runStatus,\n            \"RUN\"\n        )\n    );\n}\n\n// TROUBLE baseline/perubahan\nif (!previous || previous.trouble !== troubleStatus) {\n    queries.push(\n        makeInsert(\n            TROUBLE_TABLE,\n            troubleStatus,\n            \"TROUBLE\"\n        )\n    );\n}\n\ncontext.set(\"state\", {\n    run: runStatus,\n    trouble: troubleStatus\n});\n\nlet fill = \"grey\";\n\nif (mainStatus === \"RUNNING\") {\n    fill = \"green\";\n}\nelse if (mainStatus === \"TROUBLE\") {\n    fill = \"red\";\n}\n\nnode.status({\n    fill,\n    shape: \"dot\",\n    text: `${mainStatus} | R:${runStatus} T:${troubleStatus} | SQL:${queries.length}`\n});\n\nreturn [queries];\n",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 665,
        "y": 180,
        "wires": [
            [
                "7d2154e29dd262fe"
            ]
        ]
    },
    {
        "id": "0b6458841544975a",
        "type": "function",
        "z": "d4d9cebcf0925ff4",
        "name": "IMC-29 | SQL Logger",
        "func": "/*\n=========================================================\n IMC-29 - DATABASE LOGGER\n=========================================================\nMAIN     : rh_imc_29\nRUN      : rh_imc_29_run\nTROUBLE  : rh_imc_29_trouble\n\nMAIN:\n- INSERT setiap paket.\n\nRUN / TROUBLE:\n- INSERT baseline pertama setelah deploy/restart.\n- INSERT hanya ketika status berubah LOW <-> HIGH.\n=========================================================\n*/\n\nconst MACHINE = \"IMC-29\";\nconst MAIN_TABLE = \"rh_imc_29\";\nconst RUN_TABLE = \"rh_imc_29_run\";\nconst TROUBLE_TABLE = \"rh_imc_29_trouble\";\n\nconst p = msg.payload;\n\nif (!p || p.name !== MACHINE) {\n    return null;\n}\n\nconst runStatus = p.running === true ? \"HIGH\" : \"LOW\";\nconst troubleStatus = p.trouble === true ? \"HIGH\" : \"LOW\";\n\nlet mainStatus = \"STOPPED\";\n\nif (p.trouble === true) {\n    mainStatus = \"TROUBLE\";\n}\nelse if (p.running === true) {\n    mainStatus = \"RUNNING\";\n}\n\nfunction escapeSql(value) {\n    return String(value)\n        .replace(/\\\\/g, \"\\\\\\\\\")\n        .replace(/'/g, \"''\");\n}\n\nfunction makeInsert(table, status, type) {\n\n    const sql = `\nINSERT INTO \\`${table}\\`\n    (\\`name_line\\`, \\`status\\`)\nVALUES\n    ('${escapeSql(MACHINE)}', '${escapeSql(status)}');\n    `.trim();\n\n    return {\n        topic: sql,\n        payload: {\n            machine: MACHINE,\n            table_name: table,\n            insert_type: type,\n            inserted_status: status,\n            runningRaw: p.runningRaw,\n            troubleRaw: p.troubleRaw,\n            timestamp: p.timestamp\n        }\n    };\n}\n\nlet previous = context.get(\"state\");\nlet queries = [];\n\n// MAIN selalu disimpan\nqueries.push(\n    makeInsert(\n        MAIN_TABLE,\n        mainStatus,\n        \"MAIN\"\n    )\n);\n\n// RUN baseline/perubahan\nif (!previous || previous.run !== runStatus) {\n    queries.push(\n        makeInsert(\n            RUN_TABLE,\n            runStatus,\n            \"RUN\"\n        )\n    );\n}\n\n// TROUBLE baseline/perubahan\nif (!previous || previous.trouble !== troubleStatus) {\n    queries.push(\n        makeInsert(\n            TROUBLE_TABLE,\n            troubleStatus,\n            \"TROUBLE\"\n        )\n    );\n}\n\ncontext.set(\"state\", {\n    run: runStatus,\n    trouble: troubleStatus\n});\n\nlet fill = \"grey\";\n\nif (mainStatus === \"RUNNING\") {\n    fill = \"green\";\n}\nelse if (mainStatus === \"TROUBLE\") {\n    fill = \"red\";\n}\n\nnode.status({\n    fill,\n    shape: \"dot\",\n    text: `${mainStatus} | R:${runStatus} T:${troubleStatus} | SQL:${queries.length}`\n});\n\nreturn [queries];\n",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 665,
        "y": 235,
        "wires": [
            [
                "7d2154e29dd262fe"
            ]
        ]
    },
    {
        "id": "d396f4faefcffae5",
        "type": "function",
        "z": "d4d9cebcf0925ff4",
        "name": "IMC-19 | SQL Logger",
        "func": "/*\n=========================================================\n IMC-19 - DATABASE LOGGER\n=========================================================\nMAIN     : rh_imc_19\nRUN      : rh_imc_19_run\nTROUBLE  : rh_imc_19_trouble\n\nMAIN:\n- INSERT setiap paket.\n\nRUN / TROUBLE:\n- INSERT baseline pertama setelah deploy/restart.\n- INSERT hanya ketika status berubah LOW <-> HIGH.\n=========================================================\n*/\n\nconst MACHINE = \"IMC-19\";\nconst MAIN_TABLE = \"rh_imc_19\";\nconst RUN_TABLE = \"rh_imc_19_run\";\nconst TROUBLE_TABLE = \"rh_imc_19_trouble\";\n\nconst p = msg.payload;\n\nif (!p || p.name !== MACHINE) {\n    return null;\n}\n\nconst runStatus = p.running === true ? \"HIGH\" : \"LOW\";\nconst troubleStatus = p.trouble === true ? \"HIGH\" : \"LOW\";\n\nlet mainStatus = \"STOPPED\";\n\nif (p.trouble === true) {\n    mainStatus = \"TROUBLE\";\n}\nelse if (p.running === true) {\n    mainStatus = \"RUNNING\";\n}\n\nfunction escapeSql(value) {\n    return String(value)\n        .replace(/\\\\/g, \"\\\\\\\\\")\n        .replace(/'/g, \"''\");\n}\n\nfunction makeInsert(table, status, type) {\n\n    const sql = `\nINSERT INTO \\`${table}\\`\n    (\\`name_line\\`, \\`status\\`)\nVALUES\n    ('${escapeSql(MACHINE)}', '${escapeSql(status)}');\n    `.trim();\n\n    return {\n        topic: sql,\n        payload: {\n            machine: MACHINE,\n            table_name: table,\n            insert_type: type,\n            inserted_status: status,\n            runningRaw: p.runningRaw,\n            troubleRaw: p.troubleRaw,\n            timestamp: p.timestamp\n        }\n    };\n}\n\nlet previous = context.get(\"state\");\nlet queries = [];\n\n// MAIN selalu disimpan\nqueries.push(\n    makeInsert(\n        MAIN_TABLE,\n        mainStatus,\n        \"MAIN\"\n    )\n);\n\n// RUN baseline/perubahan\nif (!previous || previous.run !== runStatus) {\n    queries.push(\n        makeInsert(\n            RUN_TABLE,\n            runStatus,\n            \"RUN\"\n        )\n    );\n}\n\n// TROUBLE baseline/perubahan\nif (!previous || previous.trouble !== troubleStatus) {\n    queries.push(\n        makeInsert(\n            TROUBLE_TABLE,\n            troubleStatus,\n            \"TROUBLE\"\n        )\n    );\n}\n\ncontext.set(\"state\", {\n    run: runStatus,\n    trouble: troubleStatus\n});\n\nlet fill = \"grey\";\n\nif (mainStatus === \"RUNNING\") {\n    fill = \"green\";\n}\nelse if (mainStatus === \"TROUBLE\") {\n    fill = \"red\";\n}\n\nnode.status({\n    fill,\n    shape: \"dot\",\n    text: `${mainStatus} | R:${runStatus} T:${troubleStatus} | SQL:${queries.length}`\n});\n\nreturn [queries];\n",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 665,
        "y": 290,
        "wires": [
            [
                "7d2154e29dd262fe"
            ]
        ]
    },
    {
        "id": "b1ddbcbc15177068",
        "type": "function",
        "z": "d4d9cebcf0925ff4",
        "name": "IMC-20 | SQL Logger",
        "func": "/*\n=========================================================\n IMC-20 - DATABASE LOGGER\n=========================================================\nMAIN     : rh_imc_20\nRUN      : rh_imc_20_run\nTROUBLE  : rh_imc_20_trouble\n\nMAIN:\n- INSERT setiap paket.\n\nRUN / TROUBLE:\n- INSERT baseline pertama setelah deploy/restart.\n- INSERT hanya ketika status berubah LOW <-> HIGH.\n=========================================================\n*/\n\nconst MACHINE = \"IMC-20\";\nconst MAIN_TABLE = \"rh_imc_20\";\nconst RUN_TABLE = \"rh_imc_20_run\";\nconst TROUBLE_TABLE = \"rh_imc_20_trouble\";\n\nconst p = msg.payload;\n\nif (!p || p.name !== MACHINE) {\n    return null;\n}\n\nconst runStatus = p.running === true ? \"HIGH\" : \"LOW\";\nconst troubleStatus = p.trouble === true ? \"HIGH\" : \"LOW\";\n\nlet mainStatus = \"STOPPED\";\n\nif (p.trouble === true) {\n    mainStatus = \"TROUBLE\";\n}\nelse if (p.running === true) {\n    mainStatus = \"RUNNING\";\n}\n\nfunction escapeSql(value) {\n    return String(value)\n        .replace(/\\\\/g, \"\\\\\\\\\")\n        .replace(/'/g, \"''\");\n}\n\nfunction makeInsert(table, status, type) {\n\n    const sql = `\nINSERT INTO \\`${table}\\`\n    (\\`name_line\\`, \\`status\\`)\nVALUES\n    ('${escapeSql(MACHINE)}', '${escapeSql(status)}');\n    `.trim();\n\n    return {\n        topic: sql,\n        payload: {\n            machine: MACHINE,\n            table_name: table,\n            insert_type: type,\n            inserted_status: status,\n            runningRaw: p.runningRaw,\n            troubleRaw: p.troubleRaw,\n            timestamp: p.timestamp\n        }\n    };\n}\n\nlet previous = context.get(\"state\");\nlet queries = [];\n\n// MAIN selalu disimpan\nqueries.push(\n    makeInsert(\n        MAIN_TABLE,\n        mainStatus,\n        \"MAIN\"\n    )\n);\n\n// RUN baseline/perubahan\nif (!previous || previous.run !== runStatus) {\n    queries.push(\n        makeInsert(\n            RUN_TABLE,\n            runStatus,\n            \"RUN\"\n        )\n    );\n}\n\n// TROUBLE baseline/perubahan\nif (!previous || previous.trouble !== troubleStatus) {\n    queries.push(\n        makeInsert(\n            TROUBLE_TABLE,\n            troubleStatus,\n            \"TROUBLE\"\n        )\n    );\n}\n\ncontext.set(\"state\", {\n    run: runStatus,\n    trouble: troubleStatus\n});\n\nlet fill = \"grey\";\n\nif (mainStatus === \"RUNNING\") {\n    fill = \"green\";\n}\nelse if (mainStatus === \"TROUBLE\") {\n    fill = \"red\";\n}\n\nnode.status({\n    fill,\n    shape: \"dot\",\n    text: `${mainStatus} | R:${runStatus} T:${troubleStatus} | SQL:${queries.length}`\n});\n\nreturn [queries];\n",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 665,
        "y": 345,
        "wires": [
            [
                "7d2154e29dd262fe"
            ]
        ]
    },
    {
        "id": "a84bd8be80a77773",
        "type": "function",
        "z": "d4d9cebcf0925ff4",
        "name": "IMC-21 | SQL Logger",
        "func": "/*\n=========================================================\n IMC-21 - DATABASE LOGGER\n=========================================================\nMAIN     : rh_imc_21\nRUN      : rh_imc_21_run\nTROUBLE  : rh_imc_21_trouble\n\nMAIN:\n- INSERT setiap paket.\n\nRUN / TROUBLE:\n- INSERT baseline pertama setelah deploy/restart.\n- INSERT hanya ketika status berubah LOW <-> HIGH.\n=========================================================\n*/\n\nconst MACHINE = \"IMC-21\";\nconst MAIN_TABLE = \"rh_imc_21\";\nconst RUN_TABLE = \"rh_imc_21_run\";\nconst TROUBLE_TABLE = \"rh_imc_21_trouble\";\n\nconst p = msg.payload;\n\nif (!p || p.name !== MACHINE) {\n    return null;\n}\n\nconst runStatus = p.running === true ? \"HIGH\" : \"LOW\";\nconst troubleStatus = p.trouble === true ? \"HIGH\" : \"LOW\";\n\nlet mainStatus = \"STOPPED\";\n\nif (p.trouble === true) {\n    mainStatus = \"TROUBLE\";\n}\nelse if (p.running === true) {\n    mainStatus = \"RUNNING\";\n}\n\nfunction escapeSql(value) {\n    return String(value)\n        .replace(/\\\\/g, \"\\\\\\\\\")\n        .replace(/'/g, \"''\");\n}\n\nfunction makeInsert(table, status, type) {\n\n    const sql = `\nINSERT INTO \\`${table}\\`\n    (\\`name_line\\`, \\`status\\`)\nVALUES\n    ('${escapeSql(MACHINE)}', '${escapeSql(status)}');\n    `.trim();\n\n    return {\n        topic: sql,\n        payload: {\n            machine: MACHINE,\n            table_name: table,\n            insert_type: type,\n            inserted_status: status,\n            runningRaw: p.runningRaw,\n            troubleRaw: p.troubleRaw,\n            timestamp: p.timestamp\n        }\n    };\n}\n\nlet previous = context.get(\"state\");\nlet queries = [];\n\n// MAIN selalu disimpan\nqueries.push(\n    makeInsert(\n        MAIN_TABLE,\n        mainStatus,\n        \"MAIN\"\n    )\n);\n\n// RUN baseline/perubahan\nif (!previous || previous.run !== runStatus) {\n    queries.push(\n        makeInsert(\n            RUN_TABLE,\n            runStatus,\n            \"RUN\"\n        )\n    );\n}\n\n// TROUBLE baseline/perubahan\nif (!previous || previous.trouble !== troubleStatus) {\n    queries.push(\n        makeInsert(\n            TROUBLE_TABLE,\n            troubleStatus,\n            \"TROUBLE\"\n        )\n    );\n}\n\ncontext.set(\"state\", {\n    run: runStatus,\n    trouble: troubleStatus\n});\n\nlet fill = \"grey\";\n\nif (mainStatus === \"RUNNING\") {\n    fill = \"green\";\n}\nelse if (mainStatus === \"TROUBLE\") {\n    fill = \"red\";\n}\n\nnode.status({\n    fill,\n    shape: \"dot\",\n    text: `${mainStatus} | R:${runStatus} T:${troubleStatus} | SQL:${queries.length}`\n});\n\nreturn [queries];\n",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 665,
        "y": 400,
        "wires": [
            [
                "7d2154e29dd262fe"
            ]
        ]
    },
    {
        "id": "2857ea9318ff53b6",
        "type": "function",
        "z": "d4d9cebcf0925ff4",
        "name": "IMC-23 | SQL Logger",
        "func": "/*\n=========================================================\n IMC-23 - DATABASE LOGGER\n=========================================================\nMAIN     : rh_imc_23\nRUN      : rh_imc_23_run\nTROUBLE  : rh_imc_23_trouble\n\nMAIN:\n- INSERT setiap paket.\n\nRUN / TROUBLE:\n- INSERT baseline pertama setelah deploy/restart.\n- INSERT hanya ketika status berubah LOW <-> HIGH.\n=========================================================\n*/\n\nconst MACHINE = \"IMC-23\";\nconst MAIN_TABLE = \"rh_imc_23\";\nconst RUN_TABLE = \"rh_imc_23_run\";\nconst TROUBLE_TABLE = \"rh_imc_23_trouble\";\n\nconst p = msg.payload;\n\nif (!p || p.name !== MACHINE) {\n    return null;\n}\n\nconst runStatus = p.running === true ? \"HIGH\" : \"LOW\";\nconst troubleStatus = p.trouble === true ? \"HIGH\" : \"LOW\";\n\nlet mainStatus = \"STOPPED\";\n\nif (p.trouble === true) {\n    mainStatus = \"TROUBLE\";\n}\nelse if (p.running === true) {\n    mainStatus = \"RUNNING\";\n}\n\nfunction escapeSql(value) {\n    return String(value)\n        .replace(/\\\\/g, \"\\\\\\\\\")\n        .replace(/'/g, \"''\");\n}\n\nfunction makeInsert(table, status, type) {\n\n    const sql = `\nINSERT INTO \\`${table}\\`\n    (\\`name_line\\`, \\`status\\`)\nVALUES\n    ('${escapeSql(MACHINE)}', '${escapeSql(status)}');\n    `.trim();\n\n    return {\n        topic: sql,\n        payload: {\n            machine: MACHINE,\n            table_name: table,\n            insert_type: type,\n            inserted_status: status,\n            runningRaw: p.runningRaw,\n            troubleRaw: p.troubleRaw,\n            timestamp: p.timestamp\n        }\n    };\n}\n\nlet previous = context.get(\"state\");\nlet queries = [];\n\n// MAIN selalu disimpan\nqueries.push(\n    makeInsert(\n        MAIN_TABLE,\n        mainStatus,\n        \"MAIN\"\n    )\n);\n\n// RUN baseline/perubahan\nif (!previous || previous.run !== runStatus) {\n    queries.push(\n        makeInsert(\n            RUN_TABLE,\n            runStatus,\n            \"RUN\"\n        )\n    );\n}\n\n// TROUBLE baseline/perubahan\nif (!previous || previous.trouble !== troubleStatus) {\n    queries.push(\n        makeInsert(\n            TROUBLE_TABLE,\n            troubleStatus,\n            \"TROUBLE\"\n        )\n    );\n}\n\ncontext.set(\"state\", {\n    run: runStatus,\n    trouble: troubleStatus\n});\n\nlet fill = \"grey\";\n\nif (mainStatus === \"RUNNING\") {\n    fill = \"green\";\n}\nelse if (mainStatus === \"TROUBLE\") {\n    fill = \"red\";\n}\n\nnode.status({\n    fill,\n    shape: \"dot\",\n    text: `${mainStatus} | R:${runStatus} T:${troubleStatus} | SQL:${queries.length}`\n});\n\nreturn [queries];\n",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 665,
        "y": 450,
        "wires": [
            [
                "7d2154e29dd262fe"
            ]
        ]
    },
    {
        "id": "cf995623d0fc5090",
        "type": "function",
        "z": "d4d9cebcf0925ff4",
        "name": "IMC-45 | SQL Logger",
        "func": "/*\n=========================================================\n IMC-45 - DATABASE LOGGER\n=========================================================\nMAIN     : rh_imc_45\nRUN      : rh_imc_45_run\nTROUBLE  : rh_imc_45_trouble\n\nMAIN:\n- INSERT setiap paket.\n\nRUN / TROUBLE:\n- INSERT baseline pertama setelah deploy/restart.\n- INSERT hanya ketika status berubah LOW <-> HIGH.\n=========================================================\n*/\n\nconst MACHINE = \"IMC-45\";\nconst MAIN_TABLE = \"rh_imc_45\";\nconst RUN_TABLE = \"rh_imc_45_run\";\nconst TROUBLE_TABLE = \"rh_imc_45_trouble\";\n\nconst p = msg.payload;\n\nif (!p || p.name !== MACHINE) {\n    return null;\n}\n\nconst runStatus = p.running === true ? \"HIGH\" : \"LOW\";\nconst troubleStatus = p.trouble === true ? \"HIGH\" : \"LOW\";\n\nlet mainStatus = \"STOPPED\";\n\nif (p.trouble === true) {\n    mainStatus = \"TROUBLE\";\n}\nelse if (p.running === true) {\n    mainStatus = \"RUNNING\";\n}\n\nfunction escapeSql(value) {\n    return String(value)\n        .replace(/\\\\/g, \"\\\\\\\\\")\n        .replace(/'/g, \"''\");\n}\n\nfunction makeInsert(table, status, type) {\n\n    const sql = `\nINSERT INTO \\`${table}\\`\n    (\\`name_line\\`, \\`status\\`)\nVALUES\n    ('${escapeSql(MACHINE)}', '${escapeSql(status)}');\n    `.trim();\n\n    return {\n        topic: sql,\n        payload: {\n            machine: MACHINE,\n            table_name: table,\n            insert_type: type,\n            inserted_status: status,\n            runningRaw: p.runningRaw,\n            troubleRaw: p.troubleRaw,\n            timestamp: p.timestamp\n        }\n    };\n}\n\nlet previous = context.get(\"state\");\nlet queries = [];\n\n// MAIN selalu disimpan\nqueries.push(\n    makeInsert(\n        MAIN_TABLE,\n        mainStatus,\n        \"MAIN\"\n    )\n);\n\n// RUN baseline/perubahan\nif (!previous || previous.run !== runStatus) {\n    queries.push(\n        makeInsert(\n            RUN_TABLE,\n            runStatus,\n            \"RUN\"\n        )\n    );\n}\n\n// TROUBLE baseline/perubahan\nif (!previous || previous.trouble !== troubleStatus) {\n    queries.push(\n        makeInsert(\n            TROUBLE_TABLE,\n            troubleStatus,\n            \"TROUBLE\"\n        )\n    );\n}\n\ncontext.set(\"state\", {\n    run: runStatus,\n    trouble: troubleStatus\n});\n\nlet fill = \"grey\";\n\nif (mainStatus === \"RUNNING\") {\n    fill = \"green\";\n}\nelse if (mainStatus === \"TROUBLE\") {\n    fill = \"red\";\n}\n\nnode.status({\n    fill,\n    shape: \"dot\",\n    text: `${mainStatus} | R:${runStatus} T:${troubleStatus} | SQL:${queries.length}`\n});\n\nreturn [queries];\n",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 665,
        "y": 505,
        "wires": [
            [
                "7d2154e29dd262fe"
            ]
        ]
    },
    {
        "id": "dd4f827bfab66519",
        "type": "function",
        "z": "d4d9cebcf0925ff4",
        "name": "IMC-61 | SQL Logger",
        "func": "/*\n=========================================================\n IMC-61 - DATABASE LOGGER\n=========================================================\nMAIN     : rh_imc_61\nRUN      : rh_imc_61_run\nTROUBLE  : rh_imc_61_trouble\n\nMAIN:\n- INSERT setiap paket.\n\nRUN / TROUBLE:\n- INSERT baseline pertama setelah deploy/restart.\n- INSERT hanya ketika status berubah LOW <-> HIGH.\n=========================================================\n*/\n\nconst MACHINE = \"IMC-61\";\nconst MAIN_TABLE = \"rh_imc_61\";\nconst RUN_TABLE = \"rh_imc_61_run\";\nconst TROUBLE_TABLE = \"rh_imc_61_trouble\";\n\nconst p = msg.payload;\n\nif (!p || p.name !== MACHINE) {\n    return null;\n}\n\nconst runStatus = p.running === true ? \"HIGH\" : \"LOW\";\nconst troubleStatus = p.trouble === true ? \"HIGH\" : \"LOW\";\n\nlet mainStatus = \"STOPPED\";\n\nif (p.trouble === true) {\n    mainStatus = \"TROUBLE\";\n}\nelse if (p.running === true) {\n    mainStatus = \"RUNNING\";\n}\n\nfunction escapeSql(value) {\n    return String(value)\n        .replace(/\\\\/g, \"\\\\\\\\\")\n        .replace(/'/g, \"''\");\n}\n\nfunction makeInsert(table, status, type) {\n\n    const sql = `\nINSERT INTO \\`${table}\\`\n    (\\`name_line\\`, \\`status\\`)\nVALUES\n    ('${escapeSql(MACHINE)}', '${escapeSql(status)}');\n    `.trim();\n\n    return {\n        topic: sql,\n        payload: {\n            machine: MACHINE,\n            table_name: table,\n            insert_type: type,\n            inserted_status: status,\n            runningRaw: p.runningRaw,\n            troubleRaw: p.troubleRaw,\n            timestamp: p.timestamp\n        }\n    };\n}\n\nlet previous = context.get(\"state\");\nlet queries = [];\n\n// MAIN selalu disimpan\nqueries.push(\n    makeInsert(\n        MAIN_TABLE,\n        mainStatus,\n        \"MAIN\"\n    )\n);\n\n// RUN baseline/perubahan\nif (!previous || previous.run !== runStatus) {\n    queries.push(\n        makeInsert(\n            RUN_TABLE,\n            runStatus,\n            \"RUN\"\n        )\n    );\n}\n\n// TROUBLE baseline/perubahan\nif (!previous || previous.trouble !== troubleStatus) {\n    queries.push(\n        makeInsert(\n            TROUBLE_TABLE,\n            troubleStatus,\n            \"TROUBLE\"\n        )\n    );\n}\n\ncontext.set(\"state\", {\n    run: runStatus,\n    trouble: troubleStatus\n});\n\nlet fill = \"grey\";\n\nif (mainStatus === \"RUNNING\") {\n    fill = \"green\";\n}\nelse if (mainStatus === \"TROUBLE\") {\n    fill = \"red\";\n}\n\nnode.status({\n    fill,\n    shape: \"dot\",\n    text: `${mainStatus} | R:${runStatus} T:${troubleStatus} | SQL:${queries.length}`\n});\n\nreturn [queries];\n",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 665,
        "y": 560,
        "wires": [
            [
                "7d2154e29dd262fe"
            ]
        ]
    },
    {
        "id": "6aa2f3ca837eb594",
        "type": "function",
        "z": "d4d9cebcf0925ff4",
        "name": "IMC-94 | SQL Logger",
        "func": "/*\n=========================================================\n IMC-94 - DATABASE LOGGER\n=========================================================\nMAIN     : rh_imc_94\nRUN      : rh_imc_94_run\nTROUBLE  : rh_imc_94_trouble\n\nMAIN:\n- INSERT setiap paket.\n\nRUN / TROUBLE:\n- INSERT baseline pertama setelah deploy/restart.\n- INSERT hanya ketika status berubah LOW <-> HIGH.\n=========================================================\n*/\n\nconst MACHINE = \"IMC-94\";\nconst MAIN_TABLE = \"rh_imc_94\";\nconst RUN_TABLE = \"rh_imc_94_run\";\nconst TROUBLE_TABLE = \"rh_imc_94_trouble\";\n\nconst p = msg.payload;\n\nif (!p || p.name !== MACHINE) {\n    return null;\n}\n\nconst runStatus = p.running === true ? \"HIGH\" : \"LOW\";\nconst troubleStatus = p.trouble === true ? \"HIGH\" : \"LOW\";\n\nlet mainStatus = \"STOPPED\";\n\nif (p.trouble === true) {\n    mainStatus = \"TROUBLE\";\n}\nelse if (p.running === true) {\n    mainStatus = \"RUNNING\";\n}\n\nfunction escapeSql(value) {\n    return String(value)\n        .replace(/\\\\/g, \"\\\\\\\\\")\n        .replace(/'/g, \"''\");\n}\n\nfunction makeInsert(table, status, type) {\n\n    const sql = `\nINSERT INTO \\`${table}\\`\n    (\\`name_line\\`, \\`status\\`)\nVALUES\n    ('${escapeSql(MACHINE)}', '${escapeSql(status)}');\n    `.trim();\n\n    return {\n        topic: sql,\n        payload: {\n            machine: MACHINE,\n            table_name: table,\n            insert_type: type,\n            inserted_status: status,\n            runningRaw: p.runningRaw,\n            troubleRaw: p.troubleRaw,\n            timestamp: p.timestamp\n        }\n    };\n}\n\nlet previous = context.get(\"state\");\nlet queries = [];\n\n// MAIN selalu disimpan\nqueries.push(\n    makeInsert(\n        MAIN_TABLE,\n        mainStatus,\n        \"MAIN\"\n    )\n);\n\n// RUN baseline/perubahan\nif (!previous || previous.run !== runStatus) {\n    queries.push(\n        makeInsert(\n            RUN_TABLE,\n            runStatus,\n            \"RUN\"\n        )\n    );\n}\n\n// TROUBLE baseline/perubahan\nif (!previous || previous.trouble !== troubleStatus) {\n    queries.push(\n        makeInsert(\n            TROUBLE_TABLE,\n            troubleStatus,\n            \"TROUBLE\"\n        )\n    );\n}\n\ncontext.set(\"state\", {\n    run: runStatus,\n    trouble: troubleStatus\n});\n\nlet fill = \"grey\";\n\nif (mainStatus === \"RUNNING\") {\n    fill = \"green\";\n}\nelse if (mainStatus === \"TROUBLE\") {\n    fill = \"red\";\n}\n\nnode.status({\n    fill,\n    shape: \"dot\",\n    text: `${mainStatus} | R:${runStatus} T:${troubleStatus} | SQL:${queries.length}`\n});\n\nreturn [queries];\n",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 665,
        "y": 615,
        "wires": [
            [
                "7d2154e29dd262fe"
            ]
        ]
    },
    {
        "id": "5fd0996bd9b006a9",
        "type": "function",
        "z": "d4d9cebcf0925ff4",
        "name": "IMC-103 | SQL Logger",
        "func": "/*\n=========================================================\n IMC-103 - DATABASE LOGGER\n=========================================================\nMAIN     : rh_imc_103\nRUN      : rh_imc_103_run\nTROUBLE  : rh_imc_103_trouble\n\nMAIN:\n- INSERT setiap paket.\n\nRUN / TROUBLE:\n- INSERT baseline pertama setelah deploy/restart.\n- INSERT hanya ketika status berubah LOW <-> HIGH.\n=========================================================\n*/\n\nconst MACHINE = \"IMC-103\";\nconst MAIN_TABLE = \"rh_imc_103\";\nconst RUN_TABLE = \"rh_imc_103_run\";\nconst TROUBLE_TABLE = \"rh_imc_103_trouble\";\n\nconst p = msg.payload;\n\nif (!p || p.name !== MACHINE) {\n    return null;\n}\n\nconst runStatus = p.running === true ? \"HIGH\" : \"LOW\";\nconst troubleStatus = p.trouble === true ? \"HIGH\" : \"LOW\";\n\nlet mainStatus = \"STOPPED\";\n\nif (p.trouble === true) {\n    mainStatus = \"TROUBLE\";\n}\nelse if (p.running === true) {\n    mainStatus = \"RUNNING\";\n}\n\nfunction escapeSql(value) {\n    return String(value)\n        .replace(/\\\\/g, \"\\\\\\\\\")\n        .replace(/'/g, \"''\");\n}\n\nfunction makeInsert(table, status, type) {\n\n    const sql = `\nINSERT INTO \\`${table}\\`\n    (\\`name_line\\`, \\`status\\`)\nVALUES\n    ('${escapeSql(MACHINE)}', '${escapeSql(status)}');\n    `.trim();\n\n    return {\n        topic: sql,\n        payload: {\n            machine: MACHINE,\n            table_name: table,\n            insert_type: type,\n            inserted_status: status,\n            runningRaw: p.runningRaw,\n            troubleRaw: p.troubleRaw,\n            timestamp: p.timestamp\n        }\n    };\n}\n\nlet previous = context.get(\"state\");\nlet queries = [];\n\n// MAIN selalu disimpan\nqueries.push(\n    makeInsert(\n        MAIN_TABLE,\n        mainStatus,\n        \"MAIN\"\n    )\n);\n\n// RUN baseline/perubahan\nif (!previous || previous.run !== runStatus) {\n    queries.push(\n        makeInsert(\n            RUN_TABLE,\n            runStatus,\n            \"RUN\"\n        )\n    );\n}\n\n// TROUBLE baseline/perubahan\nif (!previous || previous.trouble !== troubleStatus) {\n    queries.push(\n        makeInsert(\n            TROUBLE_TABLE,\n            troubleStatus,\n            \"TROUBLE\"\n        )\n    );\n}\n\ncontext.set(\"state\", {\n    run: runStatus,\n    trouble: troubleStatus\n});\n\nlet fill = \"grey\";\n\nif (mainStatus === \"RUNNING\") {\n    fill = \"green\";\n}\nelse if (mainStatus === \"TROUBLE\") {\n    fill = \"red\";\n}\n\nnode.status({\n    fill,\n    shape: \"dot\",\n    text: `${mainStatus} | R:${runStatus} T:${troubleStatus} | SQL:${queries.length}`\n});\n\nreturn [queries];\n",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 665,
        "y": 670,
        "wires": [
            [
                "7d2154e29dd262fe"
            ]
        ]
    },
    {
        "id": "d4776b2c3692959a",
        "type": "function",
        "z": "d4d9cebcf0925ff4",
        "name": "IMC-229 | SQL Logger",
        "func": "/*\n=========================================================\n IMC-229 - DATABASE LOGGER\n=========================================================\nMAIN     : rh_imc_229\nRUN      : rh_imc_229_run\nTROUBLE  : rh_imc_229_trouble\n\nMAIN:\n- INSERT setiap paket.\n\nRUN / TROUBLE:\n- INSERT baseline pertama setelah deploy/restart.\n- INSERT hanya ketika status berubah LOW <-> HIGH.\n=========================================================\n*/\n\nconst MACHINE = \"IMC-229\";\nconst MAIN_TABLE = \"rh_imc_229\";\nconst RUN_TABLE = \"rh_imc_229_run\";\nconst TROUBLE_TABLE = \"rh_imc_229_trouble\";\n\nconst p = msg.payload;\n\nif (!p || p.name !== MACHINE) {\n    return null;\n}\n\nconst runStatus = p.running === true ? \"HIGH\" : \"LOW\";\nconst troubleStatus = p.trouble === true ? \"HIGH\" : \"LOW\";\n\nlet mainStatus = \"STOPPED\";\n\nif (p.trouble === true) {\n    mainStatus = \"TROUBLE\";\n}\nelse if (p.running === true) {\n    mainStatus = \"RUNNING\";\n}\n\nfunction escapeSql(value) {\n    return String(value)\n        .replace(/\\\\/g, \"\\\\\\\\\")\n        .replace(/'/g, \"''\");\n}\n\nfunction makeInsert(table, status, type) {\n\n    const sql = `\nINSERT INTO \\`${table}\\`\n    (\\`name_line\\`, \\`status\\`)\nVALUES\n    ('${escapeSql(MACHINE)}', '${escapeSql(status)}');\n    `.trim();\n\n    return {\n        topic: sql,\n        payload: {\n            machine: MACHINE,\n            table_name: table,\n            insert_type: type,\n            inserted_status: status,\n            runningRaw: p.runningRaw,\n            troubleRaw: p.troubleRaw,\n            timestamp: p.timestamp\n        }\n    };\n}\n\nlet previous = context.get(\"state\");\nlet queries = [];\n\n// MAIN selalu disimpan\nqueries.push(\n    makeInsert(\n        MAIN_TABLE,\n        mainStatus,\n        \"MAIN\"\n    )\n);\n\n// RUN baseline/perubahan\nif (!previous || previous.run !== runStatus) {\n    queries.push(\n        makeInsert(\n            RUN_TABLE,\n            runStatus,\n            \"RUN\"\n        )\n    );\n}\n\n// TROUBLE baseline/perubahan\nif (!previous || previous.trouble !== troubleStatus) {\n    queries.push(\n        makeInsert(\n            TROUBLE_TABLE,\n            troubleStatus,\n            \"TROUBLE\"\n        )\n    );\n}\n\ncontext.set(\"state\", {\n    run: runStatus,\n    trouble: troubleStatus\n});\n\nlet fill = \"grey\";\n\nif (mainStatus === \"RUNNING\") {\n    fill = \"green\";\n}\nelse if (mainStatus === \"TROUBLE\") {\n    fill = \"red\";\n}\n\nnode.status({\n    fill,\n    shape: \"dot\",\n    text: `${mainStatus} | R:${runStatus} T:${troubleStatus} | SQL:${queries.length}`\n});\n\nreturn [queries];\n",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 665,
        "y": 725,
        "wires": [
            [
                "7d2154e29dd262fe"
            ]
        ]
    },
    {
        "id": "ee2254d0ca5c7b40",
        "type": "function",
        "z": "d4d9cebcf0925ff4",
        "name": "IMC-251 | SQL Logger",
        "func": "/*\n=========================================================\n IMC-251 - DATABASE LOGGER\n=========================================================\nMAIN     : rh_imc_251\nRUN      : rh_imc_251_run\nTROUBLE  : rh_imc_251_trouble\n\nMAIN:\n- INSERT setiap paket.\n\nRUN / TROUBLE:\n- INSERT baseline pertama setelah deploy/restart.\n- INSERT hanya ketika status berubah LOW <-> HIGH.\n=========================================================\n*/\n\nconst MACHINE = \"IMC-251\";\nconst MAIN_TABLE = \"rh_imc_251\";\nconst RUN_TABLE = \"rh_imc_251_run\";\nconst TROUBLE_TABLE = \"rh_imc_251_trouble\";\n\nconst p = msg.payload;\n\nif (!p || p.name !== MACHINE) {\n    return null;\n}\n\nconst runStatus = p.running === true ? \"HIGH\" : \"LOW\";\nconst troubleStatus = p.trouble === true ? \"HIGH\" : \"LOW\";\n\nlet mainStatus = \"STOPPED\";\n\nif (p.trouble === true) {\n    mainStatus = \"TROUBLE\";\n}\nelse if (p.running === true) {\n    mainStatus = \"RUNNING\";\n}\n\nfunction escapeSql(value) {\n    return String(value)\n        .replace(/\\\\/g, \"\\\\\\\\\")\n        .replace(/'/g, \"''\");\n}\n\nfunction makeInsert(table, status, type) {\n\n    const sql = `\nINSERT INTO \\`${table}\\`\n    (\\`name_line\\`, \\`status\\`)\nVALUES\n    ('${escapeSql(MACHINE)}', '${escapeSql(status)}');\n    `.trim();\n\n    return {\n        topic: sql,\n        payload: {\n            machine: MACHINE,\n            table_name: table,\n            insert_type: type,\n            inserted_status: status,\n            runningRaw: p.runningRaw,\n            troubleRaw: p.troubleRaw,\n            timestamp: p.timestamp\n        }\n    };\n}\n\nlet previous = context.get(\"state\");\nlet queries = [];\n\n// MAIN selalu disimpan\nqueries.push(\n    makeInsert(\n        MAIN_TABLE,\n        mainStatus,\n        \"MAIN\"\n    )\n);\n\n// RUN baseline/perubahan\nif (!previous || previous.run !== runStatus) {\n    queries.push(\n        makeInsert(\n            RUN_TABLE,\n            runStatus,\n            \"RUN\"\n        )\n    );\n}\n\n// TROUBLE baseline/perubahan\nif (!previous || previous.trouble !== troubleStatus) {\n    queries.push(\n        makeInsert(\n            TROUBLE_TABLE,\n            troubleStatus,\n            \"TROUBLE\"\n        )\n    );\n}\n\ncontext.set(\"state\", {\n    run: runStatus,\n    trouble: troubleStatus\n});\n\nlet fill = \"grey\";\n\nif (mainStatus === \"RUNNING\") {\n    fill = \"green\";\n}\nelse if (mainStatus === \"TROUBLE\") {\n    fill = \"red\";\n}\n\nnode.status({\n    fill,\n    shape: \"dot\",\n    text: `${mainStatus} | R:${runStatus} T:${troubleStatus} | SQL:${queries.length}`\n});\n\nreturn [queries];\n",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 665,
        "y": 780,
        "wires": [
            [
                "7d2154e29dd262fe"
            ]
        ]
    },
    {
        "id": "7d2154e29dd262fe",
        "type": "mysql",
        "z": "d4d9cebcf0925ff4",
        "mydb": "19f621ac54f58e61",
        "name": "MySQL IMC",
        "x": 1000,
        "y": 95,
        "wires": [
            []
        ]
    },
    {
        "id": "8f519a5fa3b43c8c",
        "type": "catch",
        "z": "d4d9cebcf0925ff4",
        "name": "Catch Flow Error",
        "scope": null,
        "uncaught": false,
        "x": 105,
        "y": 345,
        "wires": [
            [
                "744a0a40da3f721e"
            ]
        ]
    },
    {
        "id": "744a0a40da3f721e",
        "type": "debug",
        "z": "d4d9cebcf0925ff4",
        "name": "FLOW ERROR",
        "active": true,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "true",
        "targetType": "full",
        "statusVal": "",
        "statusType": "auto",
        "x": 285,
        "y": 345,
        "wires": []
    },
    {
        "id": "fab7db4e7ba2976c",
        "type": "serial-port",
        "name": "COM4 E32 9600",
        "serialport": "COM4",
        "serialbaud": "9600",
        "databits": 8,
        "parity": "none",
        "stopbits": 1,
        "waitfor": "[",
        "dtr": "none",
        "rts": "none",
        "cts": "none",
        "dsr": "none",
        "newline": "]",
        "bin": "false",
        "out": "char",
        "addchar": "",
        "responsetimeout": 10000
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
    }
]
