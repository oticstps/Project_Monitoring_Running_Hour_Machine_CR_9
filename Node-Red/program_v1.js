[
    {
        "id": "a61e79f2f957125e",
        "type": "serial in",
        "z": "99c302ef46ac3089",
        "name": "E32 COM4",
        "serial": "imc_serial_port",
        "x": 110,
        "y": 95,
        "wires": [
            [
                "edf229840272ccaa",
                "0e85f589e15aeabe"
            ]
        ]
    },
    {
        "id": "edf229840272ccaa",
        "type": "debug",
        "z": "99c302ef46ac3089",
        "name": "RAW COM4",
        "active": false,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "payload",
        "targetType": "msg",
        "statusVal": "",
        "statusType": "auto",
        "x": 280,
        "y": 95,
        "wires": []
    },
    {
        "id": "0e85f589e15aeabe",
        "type": "function",
        "z": "99c302ef46ac3089",
        "name": "Parse 8 Signal IMC",
        "func": "// Expected packet:\n// [IMC40_RUN, IMC40_FAULT,\n//  IMC10_RUN, IMC10_FAULT,\n//  IMC28_RUN, IMC28_FAULT,\n//  IMC29_RUN, IMC29_FAULT]\n//\n// Rule: value > 2000 = HIGH, value <= 2000 = LOW\n\nconst THRESHOLD = 2000;\n\nlet raw = msg.payload;\n\nif (Buffer.isBuffer(raw)) {\n    raw = raw.toString(\"utf8\");\n}\n\nraw = String(raw ?? \"\").trim();\n\nlet values;\ntry {\n    values = JSON.parse(raw);\n} catch (err) {\n    node.status({fill:\"red\", shape:\"ring\", text:\"invalid JSON\"});\n    return null;\n}\n\nif (!Array.isArray(values) || values.length !== 8) {\n    node.status({\n        fill:\"yellow\",\n        shape:\"ring\",\n        text:`invalid length: ${Array.isArray(values) ? values.length : \"not array\"}`\n    });\n    return null;\n}\n\nvalues = values.map(Number);\n\nif (values.some(v => !Number.isFinite(v))) {\n    node.status({fill:\"red\", shape:\"ring\", text:\"non-numeric data\"});\n    return null;\n}\n\nconst isHigh = (v) => v > THRESHOLD;\n\nconst defs = [\n    { name: \"IMC-40\", run: 0, fault: 1 },\n    { name: \"IMC-10\", run: 2, fault: 3 },\n    { name: \"IMC-28\", run: 4, fault: 5 },\n    { name: \"IMC-29\", run: 6, fault: 7 }\n];\n\nconst machines = defs.map(d => {\n    const runningRaw = values[d.run];\n    const faultRaw   = values[d.fault];\n    const running    = isHigh(runningRaw);\n    const fault      = isHigh(faultRaw);\n\n    let status = \"STOPPED\";\n    if (fault) {\n        status = \"FAULT\";\n    } else if (running) {\n        status = \"RUNNING\";\n    }\n\n    return {\n        name: d.name,\n        runningRaw,\n        faultRaw,\n        running,\n        fault,\n        status\n    };\n});\n\nmsg.payload = {\n    timestamp: Date.now(),\n    threshold: THRESHOLD,\n    rawText: raw,\n    raw: values,\n    machines\n};\n\nnode.status({\n    fill:\"green\",\n    shape:\"dot\",\n    text:`OK ${values.join(\",\")}`\n});\n\nreturn msg;",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 300,
        "y": 130,
        "wires": [
            [
                "03955501f7d594e7",
                "25c6a7308be74e38",
                "6b057977285b97f9",
                "aa37610d5e121016"
            ]
        ]
    },
    {
        "id": "25c6a7308be74e38",
        "type": "debug",
        "z": "99c302ef46ac3089",
        "name": "PARSED IMC",
        "active": false,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "payload",
        "targetType": "msg",
        "statusVal": "",
        "statusType": "auto",
        "x": 515,
        "y": 80,
        "wires": []
    },
    {
        "id": "03955501f7d594e7",
        "type": "ui-template",
        "z": "99c302ef46ac3089",
        "group": "imc_ui_group",
        "page": "",
        "ui": "",
        "name": "IMC Overview - Bright",
        "order": 1,
        "width": 12,
        "height": 7,
        "head": "",
        "format": "<template>\n  <div class=\"imc-wrap\">\n    <div class=\"imc-header\">\n      <div>\n        <div class=\"imc-kicker\">E32 / SERIAL MACHINE MONITOR</div>\n        <h2>Production Machine Status</h2>\n        <div class=\"imc-sub\">HIGH jika nilai &gt; {{ threshold }}</div>\n      </div>\n\n      <div class=\"comm-box\">\n        <div :class=\"['comm-dot', online ? 'online' : 'offline']\"></div>\n        <div>\n          <b>{{ online ? 'DATA ONLINE' : 'NO DATA' }}</b>\n          <small>{{ ageText }}</small>\n        </div>\n      </div>\n    </div>\n\n    <div v-if=\"machines.length\" class=\"machine-grid\">\n      <div v-for=\"m in machines\" :key=\"m.name\"\n           :class=\"['machine-card', machineClass(m)]\">\n\n        <div class=\"machine-top\">\n          <div>\n            <div class=\"machine-name\">{{ m.name }}</div>\n            <div :class=\"['main-status', machineClass(m)]\">\n              {{ m.status }}\n            </div>\n          </div>\n          <div :class=\"['status-orb', machineClass(m)]\"></div>\n        </div>\n\n        <div class=\"signal-row\">\n          <div class=\"signal-block\">\n            <div class=\"signal-label\">RUNNING</div>\n            <div class=\"signal-value\">\n              <span :class=\"['lamp', m.running ? 'high-green' : 'low']\"></span>\n              <b>{{ m.running ? 'HIGH' : 'LOW' }}</b>\n            </div>\n            <div class=\"raw-value\">{{ m.runningRaw }}</div>\n          </div>\n\n          <div class=\"signal-block\">\n            <div class=\"signal-label\">MACHINE FAULT</div>\n            <div class=\"signal-value\">\n              <span :class=\"['lamp', m.fault ? 'high-red' : 'low']\"></span>\n              <b>{{ m.fault ? 'HIGH' : 'LOW' }}</b>\n            </div>\n            <div class=\"raw-value\">{{ m.faultRaw }}</div>\n          </div>\n        </div>\n\n        <div class=\"machine-footer\">\n          <span>RUN {{ m.runningRaw }}</span>\n          <span>FAULT {{ m.faultRaw }}</span>\n        </div>\n      </div>\n    </div>\n\n    <div v-else class=\"waiting\">\n      Menunggu paket 8 data dari COM4...\n    </div>\n\n    <div class=\"raw-panel\">\n      <div>\n        <span class=\"raw-title\">LAST PACKET</span>\n        <code>{{ rawText || '-' }}</code>\n      </div>\n      <div class=\"legend\">\n        <span><i class=\"legend-dot green\"></i> Running</span>\n        <span><i class=\"legend-dot gray\"></i> Low / Stop</span>\n        <span><i class=\"legend-dot red\"></i> Fault</span>\n      </div>\n    </div>\n  </div>\n</template>\n\n<script>\nexport default {\n  data () {\n    return {\n      dataPacket: null,\n      lastRx: 0,\n      now: Date.now(),\n      timer: null\n    }\n  },\n\n  computed: {\n    machines () {\n      return this.dataPacket?.machines || []\n    },\n    threshold () {\n      return this.dataPacket?.threshold ?? 2000\n    },\n    rawText () {\n      return this.dataPacket?.rawText || ''\n    },\n    online () {\n      return this.lastRx > 0 && (this.now - this.lastRx) < 5000\n    },\n    ageText () {\n      if (!this.lastRx) return 'waiting for serial data'\n      const sec = Math.floor((this.now - this.lastRx) / 1000)\n      return sec <= 0 ? 'updated now' : `updated ${sec}s ago`\n    }\n  },\n\n  watch: {\n    msg: {\n      handler (m) {\n        if (m?.payload?.machines) {\n          this.dataPacket = m.payload\n          this.lastRx = Date.now()\n          this.now = Date.now()\n        }\n      },\n      deep: true\n    }\n  },\n\n  mounted () {\n    if (this.msg?.payload?.machines) {\n      this.dataPacket = this.msg.payload\n      this.lastRx = Date.now()\n    }\n    this.timer = setInterval(() => {\n      this.now = Date.now()\n    }, 1000)\n  },\n\n  beforeUnmount () {\n    if (this.timer) clearInterval(this.timer)\n  },\n\n  methods: {\n    machineClass (m) {\n      if (m.fault) return 'fault'\n      if (m.running) return 'running'\n      return 'stopped'\n    }\n  }\n}\n</script>\n\n\n<style>\n.imc-wrap {\n  width: 100%;\n  box-sizing: border-box;\n  font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif;\n  padding: 6px;\n  color: #172033;\n}\n\n.imc-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 16px;\n  margin-bottom: 18px;\n}\n\n.imc-kicker {\n  font-size: 11px;\n  font-weight: 900;\n  letter-spacing: 1.4px;\n  color: #2563eb;\n  margin-bottom: 4px;\n}\n\n.imc-header h2 {\n  margin: 0;\n  color: #172033;\n  font-size: 25px;\n  line-height: 1.15;\n  font-weight: 850;\n}\n\n.imc-sub {\n  margin-top: 6px;\n  color: #667085;\n  font-size: 12px;\n}\n\n.comm-box {\n  min-width: 165px;\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  padding: 11px 14px;\n  border-radius: 14px;\n  background: #f8fbff;\n  border: 1px solid #dce7f3;\n  box-shadow: 0 4px 14px rgba(31, 41, 55, .05);\n}\n\n.comm-box b {\n  display: block;\n  color: #172033;\n  font-size: 12px;\n  letter-spacing: .4px;\n}\n\n.comm-box small {\n  display: block;\n  margin-top: 2px;\n  color: #7b8798;\n  font-size: 10px;\n}\n\n.comm-dot {\n  width: 11px;\n  height: 11px;\n  border-radius: 50%;\n  flex: 0 0 auto;\n}\n\n.comm-dot.online {\n  background: #16a34a;\n  box-shadow: 0 0 0 5px rgba(22,163,74,.10), 0 0 14px rgba(22,163,74,.25);\n}\n\n.comm-dot.offline {\n  background: #dc2626;\n  box-shadow: 0 0 0 5px rgba(220,38,38,.08);\n}\n\n.machine-grid {\n  display: grid;\n  grid-template-columns: repeat(2, minmax(0, 1fr));\n  gap: 14px;\n}\n\n.machine-card {\n  position: relative;\n  overflow: hidden;\n  border: 1px solid #dbe4ef;\n  border-radius: 16px;\n  padding: 16px;\n  background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);\n  box-shadow: 0 5px 18px rgba(31, 41, 55, .05);\n  transition: .2s ease;\n}\n\n.machine-card.running {\n  border-color: #bfe7cc;\n  box-shadow: inset 4px 0 0 #16a34a, 0 5px 18px rgba(31, 41, 55, .05);\n}\n\n.machine-card.fault {\n  border-color: #f2c4c4;\n  box-shadow: inset 4px 0 0 #dc2626, 0 5px 18px rgba(31, 41, 55, .05);\n}\n\n.machine-card.stopped {\n  border-color: #dbe4ef;\n  box-shadow: inset 4px 0 0 #94a3b8, 0 5px 18px rgba(31, 41, 55, .05);\n}\n\n.machine-top {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  margin-bottom: 15px;\n}\n\n.machine-name {\n  color: #172033;\n  font-size: 19px;\n  font-weight: 850;\n  letter-spacing: .3px;\n}\n\n.main-status {\n  margin-top: 5px;\n  display: inline-flex;\n  border-radius: 999px;\n  padding: 4px 9px;\n  font-size: 10px;\n  font-weight: 900;\n  letter-spacing: .7px;\n}\n\n.main-status.running {\n  color: #15803d;\n  background: #eaf8ef;\n}\n\n.main-status.fault {\n  color: #b91c1c;\n  background: #fff0f0;\n}\n\n.main-status.stopped {\n  color: #64748b;\n  background: #f1f5f9;\n}\n\n.status-orb {\n  width: 20px;\n  height: 20px;\n  border-radius: 50%;\n}\n\n.status-orb.running {\n  background: #16a34a;\n  box-shadow: 0 0 16px rgba(22,163,74,.35);\n}\n\n.status-orb.fault {\n  background: #dc2626;\n  box-shadow: 0 0 16px rgba(220,38,38,.35);\n  animation: imcPulse 1s infinite;\n}\n\n.status-orb.stopped {\n  background: #94a3b8;\n}\n\n@keyframes imcPulse {\n  0%,100% { opacity: 1; transform: scale(1); }\n  50% { opacity: .45; transform: scale(.82); }\n}\n\n.signal-row {\n  display: grid;\n  grid-template-columns: repeat(2, minmax(0, 1fr));\n  gap: 10px;\n}\n\n.signal-block {\n  border: 1px solid #e2e8f0;\n  border-radius: 12px;\n  padding: 11px;\n  background: #f8fafc;\n}\n\n.signal-label {\n  min-height: 28px;\n  color: #667085;\n  font-size: 10px;\n  line-height: 1.25;\n  font-weight: 850;\n  letter-spacing: .7px;\n}\n\n.signal-value {\n  display: flex;\n  align-items: center;\n  gap: 7px;\n  margin-top: 5px;\n  color: #172033;\n  font-size: 13px;\n}\n\n.lamp {\n  width: 9px;\n  height: 9px;\n  border-radius: 50%;\n  display: inline-block;\n}\n\n.lamp.high-green {\n  background: #16a34a;\n  box-shadow: 0 0 8px rgba(22,163,74,.35);\n}\n\n.lamp.high-red {\n  background: #dc2626;\n  box-shadow: 0 0 8px rgba(220,38,38,.35);\n}\n\n.lamp.low {\n  background: #94a3b8;\n}\n\n.raw-value {\n  margin-top: 7px;\n  color: #0f172a;\n  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;\n  font-size: 20px;\n  font-weight: 850;\n}\n\n.machine-footer {\n  display: flex;\n  gap: 12px;\n  margin-top: 11px;\n  color: #7b8798;\n  font-size: 9px;\n  letter-spacing: .4px;\n}\n\n.raw-panel {\n  margin-top: 14px;\n  border-radius: 13px;\n  border: 1px solid #dbe4ef;\n  background: #f8fbff;\n  padding: 12px 14px;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 12px;\n  flex-wrap: wrap;\n}\n\n.raw-title {\n  display: block;\n  color: #667085;\n  font-size: 9px;\n  font-weight: 850;\n  letter-spacing: .8px;\n  margin-bottom: 4px;\n}\n\n.raw-panel code {\n  color: #0f172a;\n  font-size: 12px;\n  word-break: break-all;\n}\n\n.legend {\n  display: flex;\n  gap: 12px;\n  flex-wrap: wrap;\n  color: #667085;\n  font-size: 10px;\n}\n\n.legend span {\n  display: flex;\n  align-items: center;\n  gap: 5px;\n}\n\n.legend-dot {\n  width: 7px;\n  height: 7px;\n  display: inline-block;\n  border-radius: 50%;\n}\n\n.legend-dot.green { background: #16a34a; }\n.legend-dot.gray  { background: #94a3b8; }\n.legend-dot.red   { background: #dc2626; }\n\n.waiting {\n  padding: 40px 20px;\n  text-align: center;\n  border-radius: 14px;\n  border: 1px dashed #cbd5e1;\n  background: #f8fafc;\n  color: #64748b;\n  font-weight: 750;\n}\n\n@media (max-width: 720px) {\n  .machine-grid {\n    grid-template-columns: 1fr;\n  }\n\n  .imc-header {\n    align-items: flex-start;\n    flex-direction: column;\n  }\n\n  .comm-box {\n    min-width: 0;\n  }\n}\n</style>\n",
        "storeOutMessages": true,
        "passthru": false,
        "resendOnRefresh": true,
        "templateScope": "local",
        "className": "",
        "x": 535,
        "y": 45,
        "wires": [
            []
        ]
    },
    {
        "id": "6b057977285b97f9",
        "type": "function",
        "z": "99c302ef46ac3089",
        "name": "Split Chart Per Machine",
        "func": "// Input packet:\n// [IMC40_RUN, IMC40_FAULT,\n//  IMC10_RUN, IMC10_FAULT,\n//  IMC28_RUN, IMC28_FAULT,\n//  IMC29_RUN, IMC29_FAULT]\n//\n// Output 1 = IMC-40\n// Output 2 = IMC-10\n// Output 3 = IMC-28\n// Output 4 = IMC-29\n\nconst p = msg.payload;\n\nif (!p || !Array.isArray(p.raw) || p.raw.length !== 8) {\n    return null;\n}\n\nconst threshold = Number(p.threshold ?? 2000);\nconst ts = Number(p.timestamp ?? Date.now());\n\nconst defs = [\n    { run: 0, fault: 1 }, // IMC-40\n    { run: 2, fault: 3 }, // IMC-10\n    { run: 4, fault: 5 }, // IMC-28\n    { run: 6, fault: 7 }  // IMC-29\n];\n\nconst outputs = defs.map((d) => [\n    {\n        topic: \"RUNNING\",\n        payload: Number(p.raw[d.run]),\n        timestamp: ts\n    },\n    {\n        topic: \"MACHINE FAULT\",\n        payload: Number(p.raw[d.fault]),\n        timestamp: ts\n    },\n    {\n        topic: \"THRESHOLD\",\n        payload: threshold,\n        timestamp: ts\n    }\n]);\n\nreturn outputs;",
        "outputs": 4,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 545,
        "y": 130,
        "wires": [
            [
                "ec9b351bbf27efa3",
                "d34df9bf7278b54f"
            ],
            [
                "f9a93888fafac866",
                "54f3e955235cbfed"
            ],
            [
                "ec8ad88838922847",
                "3a9f91b932f7cdb6"
            ],
            [
                "c319da68dbebe6b2",
                "138023bdecd64dff"
            ]
        ]
    },
    {
        "id": "c319da68dbebe6b2",
        "type": "ui-chart",
        "z": "99c302ef46ac3089",
        "group": "7a81874c0242fa78",
        "name": "IMC-29 — Time Chart",
        "label": "IMC-29 — Time Chart",
        "order": 1,
        "chartType": "line",
        "category": "topic",
        "categoryType": "msg",
        "xAxisLabel": "Time",
        "xAxisProperty": "timestamp",
        "xAxisPropertyType": "property",
        "xAxisType": "time",
        "xAxisFormat": "{HH}:{mm}:{ss}",
        "xAxisFormatType": "custom",
        "xmin": "",
        "xmax": "",
        "yAxisLabel": "Signal Value",
        "yAxisProperty": "payload",
        "yAxisPropertyType": "msg",
        "ymin": "0",
        "ymax": "5500",
        "bins": 10,
        "action": "append",
        "stackSeries": false,
        "pointShape": "circle",
        "pointRadius": "1",
        "showLegend": true,
        "removeOlder": "10",
        "removeOlderUnit": "60",
        "removeOlderPoints": "",
        "colors": [
            "#16a34a",
            "#dc2626",
            "#2563eb"
        ],
        "textColor": [
            "#334155"
        ],
        "textColorDefault": false,
        "gridColor": [
            "#dbe4ef"
        ],
        "gridColorDefault": false,
        "width": 6,
        "height": "6",
        "className": "",
        "interpolation": "step",
        "x": 1170,
        "y": 135,
        "wires": [
            []
        ]
    },
    {
        "id": "ec9b351bbf27efa3",
        "type": "ui-chart",
        "z": "99c302ef46ac3089",
        "group": "bc07865425439d78",
        "name": "IMC-40 — Time Chart",
        "label": "IMC-40 — Time Chart",
        "order": 1,
        "chartType": "line",
        "category": "topic",
        "categoryType": "msg",
        "xAxisLabel": "Time",
        "xAxisProperty": "timestamp",
        "xAxisPropertyType": "property",
        "xAxisType": "time",
        "xAxisFormat": "{HH}:{mm}:{ss}",
        "xAxisFormatType": "custom",
        "xmin": "",
        "xmax": "",
        "yAxisLabel": "Signal Value",
        "yAxisProperty": "payload",
        "yAxisPropertyType": "msg",
        "ymin": "0",
        "ymax": "5500",
        "bins": 10,
        "action": "append",
        "stackSeries": false,
        "pointShape": "circle",
        "pointRadius": "1",
        "showLegend": true,
        "removeOlder": "10",
        "removeOlderUnit": "60",
        "removeOlderPoints": "",
        "colors": [
            "#16a34a",
            "#dc2626",
            "#2563eb"
        ],
        "textColor": [
            "#334155"
        ],
        "textColorDefault": false,
        "gridColor": [
            "#dbe4ef"
        ],
        "gridColorDefault": false,
        "width": 6,
        "height": "6",
        "className": "",
        "interpolation": "step",
        "x": 1170,
        "y": 45,
        "wires": [
            []
        ]
    },
    {
        "id": "ec8ad88838922847",
        "type": "ui-chart",
        "z": "99c302ef46ac3089",
        "group": "241a4ca1b8d34eec",
        "name": "IMC-28 — Time Chart",
        "label": "IMC-28 — Time Chart",
        "order": 1,
        "chartType": "line",
        "category": "topic",
        "categoryType": "msg",
        "xAxisLabel": "Time",
        "xAxisProperty": "timestamp",
        "xAxisPropertyType": "property",
        "xAxisType": "time",
        "xAxisFormat": "{HH}:{mm}:{ss}",
        "xAxisFormatType": "custom",
        "xmin": "",
        "xmax": "",
        "yAxisLabel": "Signal Value",
        "yAxisProperty": "payload",
        "yAxisPropertyType": "msg",
        "ymin": "0",
        "ymax": "5500",
        "bins": 10,
        "action": "append",
        "stackSeries": false,
        "pointShape": "circle",
        "pointRadius": "1",
        "showLegend": true,
        "removeOlder": "10",
        "removeOlderUnit": "60",
        "removeOlderPoints": "",
        "colors": [
            "#16a34a",
            "#dc2626",
            "#2563eb"
        ],
        "textColor": [
            "#334155"
        ],
        "textColorDefault": false,
        "gridColor": [
            "#dbe4ef"
        ],
        "gridColorDefault": false,
        "width": 6,
        "height": "6",
        "className": "",
        "interpolation": "step",
        "x": 1170,
        "y": 105,
        "wires": [
            []
        ]
    },
    {
        "id": "f9a93888fafac866",
        "type": "ui-chart",
        "z": "99c302ef46ac3089",
        "group": "ab49fa1b6350d6fc",
        "name": "IMC-10 — Time Chart",
        "label": "IMC-10 — Time Chart",
        "order": 1,
        "chartType": "line",
        "category": "topic",
        "categoryType": "msg",
        "xAxisLabel": "Time",
        "xAxisProperty": "timestamp",
        "xAxisPropertyType": "property",
        "xAxisType": "time",
        "xAxisFormat": "{HH}:{mm}:{ss}",
        "xAxisFormatType": "custom",
        "xmin": "",
        "xmax": "",
        "yAxisLabel": "Signal Value",
        "yAxisProperty": "payload",
        "yAxisPropertyType": "msg",
        "ymin": "0",
        "ymax": "5500",
        "bins": 10,
        "action": "append",
        "stackSeries": false,
        "pointShape": "circle",
        "pointRadius": "1",
        "showLegend": true,
        "removeOlder": "10",
        "removeOlderUnit": "60",
        "removeOlderPoints": "",
        "colors": [
            "#16a34a",
            "#dc2626",
            "#2563eb"
        ],
        "textColor": [
            "#334155"
        ],
        "textColorDefault": false,
        "gridColor": [
            "#dbe4ef"
        ],
        "gridColorDefault": false,
        "width": 6,
        "height": "6",
        "className": "",
        "interpolation": "step",
        "x": 1170,
        "y": 75,
        "wires": [
            []
        ]
    },
    {
        "id": "79a0d20baccabf9b",
        "type": "comment",
        "z": "99c302ef46ac3089",
        "name": "MAPPING: 40, 10, 28, 29",
        "info": "Packet mapping revised to: [IMC-40 RUNNING, IMC-40 FAULT, IMC-10 RUNNING, IMC-10 FAULT, IMC-28 RUNNING, IMC-28 FAULT, IMC-29 RUNNING, IMC-29 FAULT].",
        "x": 1055,
        "y": 250,
        "wires": []
    },
    {
        "id": "d34df9bf7278b54f",
        "type": "debug",
        "z": "99c302ef46ac3089",
        "name": "debug 1",
        "active": false,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "false",
        "statusVal": "",
        "statusType": "auto",
        "x": 1010,
        "y": 290,
        "wires": []
    },
    {
        "id": "54f3e955235cbfed",
        "type": "debug",
        "z": "99c302ef46ac3089",
        "name": "debug 2",
        "active": false,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "false",
        "statusVal": "",
        "statusType": "auto",
        "x": 1010,
        "y": 320,
        "wires": []
    },
    {
        "id": "3a9f91b932f7cdb6",
        "type": "debug",
        "z": "99c302ef46ac3089",
        "name": "debug 3",
        "active": false,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "false",
        "statusVal": "",
        "statusType": "auto",
        "x": 1010,
        "y": 350,
        "wires": []
    },
    {
        "id": "138023bdecd64dff",
        "type": "debug",
        "z": "99c302ef46ac3089",
        "name": "debug 4",
        "active": false,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "false",
        "statusVal": "",
        "statusType": "auto",
        "x": 1010,
        "y": 380,
        "wires": []
    },
    {
        "id": "aa37610d5e121016",
        "type": "function",
        "z": "99c302ef46ac3089",
        "name": "build_insert",
        "func": "/*\n=========================================================\n INSERT DATA IMC\n=========================================================\n\nINPUT dari \"Parse 8 Signal IMC\":\n\nmsg.payload = {\n    timestamp: ...,\n    threshold: 2000,\n    raw: [...],\n    machines: [\n        {\n            name: \"IMC-40\",\n            runningRaw: 4868,\n            faultRaw: 0,\n            running: true,\n            fault: false,\n            status: \"RUNNING\"\n        },\n        ...\n    ]\n}\n\nATURAN:\n---------------------------------------------------------\n1. TABLE UTAMA\n   rh_imc_xx\n\n   INSERT SETIAP signal/paket masuk.\n\n2. TABLE RUN\n   rh_imc_xx_run\n\n   INSERT hanya jika:\n   LOW  -> HIGH\n   HIGH -> LOW\n\n3. TABLE TROUBLE\n   rh_imc_xx_trouble\n\n   INSERT hanya jika:\n   LOW  -> HIGH\n   HIGH -> LOW\n\n4. Pada signal pertama setelah Node-RED start/deploy,\n   status awal HIGH/LOW juga disimpan sebagai baseline.\n=========================================================\n*/\n\n\n// =====================================================\n// KONFIGURASI TABLE\n// =====================================================\n\nconst TABLES = {\n    \"IMC-40\": {\n        main: \"rh_imc_40\",\n        run: \"rh_imc_40_run\",\n        trouble: \"rh_imc_40_trouble\"\n    },\n\n    \"IMC-10\": {\n        main: \"rh_imc_10\",\n        run: \"rh_imc_10_run\",\n        trouble: \"rh_imc_10_trouble\"\n    },\n\n    \"IMC-28\": {\n        main: \"rh_imc_28\",\n        run: \"rh_imc_28_run\",\n        trouble: \"rh_imc_28_trouble\"\n    },\n\n    \"IMC-29\": {\n        main: \"rh_imc_29\",\n        run: \"rh_imc_29_run\",\n        trouble: \"rh_imc_29_trouble\"\n    }\n};\n\n\n// =====================================================\n// VALIDASI INPUT\n// =====================================================\n\nif (\n    !msg.payload ||\n    !Array.isArray(msg.payload.machines)\n) {\n    node.status({\n        fill: \"red\",\n        shape: \"ring\",\n        text: \"Invalid machines data\"\n    });\n\n    return null;\n}\n\n\n// =====================================================\n// AMBIL STATE SEBELUMNYA\n// =====================================================\n\n// Digunakan untuk mengetahui perubahan HIGH / LOW.\n//\n// Contoh:\n//\n// sebelumnya : HIGH\n// sekarang   : HIGH\n// -> TIDAK INSERT ke table run\n//\n// sebelumnya : HIGH\n// sekarang   : LOW\n// -> INSERT LOW\n//\n// sebelumnya : LOW\n// sekarang   : HIGH\n// -> INSERT HIGH\n\nlet previousStates = context.get(\"machineStates\") || {};\n\n\n// Array query yang akan dikirim ke MySQL\nlet outputMessages = [];\n\n\n// =====================================================\n// HELPER SQL\n// =====================================================\n\nfunction escapeSql(value) {\n    return String(value)\n        .replace(/\\\\/g, \"\\\\\\\\\")\n        .replace(/'/g, \"''\");\n}\n\n\nfunction createInsert(table, nameLine, status, type) {\n\n    const sql = `\nINSERT INTO \\`${table}\\`\n    (\\`name_line\\`, \\`status\\`)\nVALUES\n    ('${escapeSql(nameLine)}', '${escapeSql(status)}');\n    `.trim();\n\n    return {\n        topic: sql,\n\n        // informasi tambahan untuk debug\n        machine: nameLine,\n        table_name: table,\n        insert_type: type,\n        inserted_status: status\n    };\n}\n\n\n// =====================================================\n// PROCESS MASING-MASING MESIN\n// =====================================================\n\nfor (const machine of msg.payload.machines) {\n\n    const config = TABLES[machine.name];\n\n    // Kalau machine tidak terdaftar, skip\n    if (!config) {\n        continue;\n    }\n\n\n    // =================================================\n    // STATUS RUN\n    // =================================================\n\n    const runStatus =\n        machine.running === true\n            ? \"HIGH\"\n            : \"LOW\";\n\n\n    // =================================================\n    // STATUS TROUBLE\n    // =================================================\n\n    const troubleStatus =\n        machine.fault === true\n            ? \"HIGH\"\n            : \"LOW\";\n\n\n    // =================================================\n    // STATUS UTAMA\n    // =================================================\n    //\n    // Prioritas:\n    //\n    // TROUBLE HIGH -> TROUBLE\n    // RUN HIGH     -> RUNNING\n    // selain itu   -> STOPPED\n    //\n\n    let mainStatus = \"STOPPED\";\n\n    if (machine.fault === true) {\n        mainStatus = \"TROUBLE\";\n    }\n    else if (machine.running === true) {\n        mainStatus = \"RUNNING\";\n    }\n\n\n    // =================================================\n    // 1. TABLE UTAMA\n    // =================================================\n    //\n    // WAJIB INSERT SETIAP SIGNAL MASUK\n    //\n\n    outputMessages.push(\n        createInsert(\n            config.main,\n            machine.name,\n            mainStatus,\n            \"MAIN\"\n        )\n    );\n\n\n    // =================================================\n    // AMBIL STATUS SEBELUMNYA\n    // =================================================\n\n    const previous = previousStates[machine.name];\n\n\n    // =================================================\n    // 2. TABLE RUN\n    // =================================================\n    //\n    // Insert pertama sebagai baseline\n    // ATAU\n    // jika ada perubahan HIGH <-> LOW\n    //\n\n    if (\n        !previous ||\n        previous.run !== runStatus\n    ) {\n\n        outputMessages.push(\n            createInsert(\n                config.run,\n                machine.name,\n                runStatus,\n                \"RUN\"\n            )\n        );\n    }\n\n\n    // =================================================\n    // 3. TABLE TROUBLE\n    // =================================================\n    //\n    // Insert pertama sebagai baseline\n    // ATAU\n    // jika ada perubahan HIGH <-> LOW\n    //\n\n    if (\n        !previous ||\n        previous.trouble !== troubleStatus\n    ) {\n\n        outputMessages.push(\n            createInsert(\n                config.trouble,\n                machine.name,\n                troubleStatus,\n                \"TROUBLE\"\n            )\n        );\n    }\n\n\n    // =================================================\n    // SIMPAN STATE TERBARU\n    // =================================================\n\n    previousStates[machine.name] = {\n        run: runStatus,\n        trouble: troubleStatus\n    };\n}\n\n\n// =====================================================\n// SIMPAN STATE KE NODE CONTEXT\n// =====================================================\n\ncontext.set(\n    \"machineStates\",\n    previousStates\n);\n\n\n// =====================================================\n// STATUS NODE\n// =====================================================\n\nnode.status({\n    fill: \"green\",\n    shape: \"dot\",\n    text: `SQL: ${outputMessages.length}`\n});\n\n\n// =====================================================\n// KIRIM SEMUA QUERY KE SATU OUTPUT\n// =====================================================\n//\n// Karena function ini hanya memiliki 1 output,\n// array di dalam array berarti semua message\n// dikirim berurutan ke output yang sama.\n//\n\nreturn [outputMessages];",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 505,
        "y": 185,
        "wires": [
            [
                "3585eb219ea08fd9"
            ]
        ]
    },
    {
        "id": "3585eb219ea08fd9",
        "type": "mysql",
        "z": "99c302ef46ac3089",
        "mydb": "19f621ac54f58e61",
        "name": "",
        "x": 745,
        "y": 185,
        "wires": [
            []
        ]
    },
    {
        "id": "imc_serial_port",
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
        "id": "imc_ui_group",
        "type": "ui-group",
        "name": "Machine Overview",
        "page": "imc_ui_page",
        "width": "12",
        "height": "1",
        "order": 1,
        "showTitle": false,
        "className": "",
        "visible": "true",
        "disabled": "false",
        "groupType": "default"
    },
    {
        "id": "7a81874c0242fa78",
        "type": "ui-group",
        "name": "IMC-29",
        "page": "imc_ui_page",
        "width": "6",
        "height": "1",
        "order": 5,
        "showTitle": true,
        "className": "",
        "visible": "true",
        "disabled": "false",
        "groupType": "default"
    },
    {
        "id": "bc07865425439d78",
        "type": "ui-group",
        "name": "IMC-40",
        "page": "imc_ui_page",
        "width": "6",
        "height": "1",
        "order": 2,
        "showTitle": true,
        "className": "",
        "visible": "true",
        "disabled": "false",
        "groupType": "default"
    },
    {
        "id": "241a4ca1b8d34eec",
        "type": "ui-group",
        "name": "IMC-28",
        "page": "imc_ui_page",
        "width": "6",
        "height": "1",
        "order": 4,
        "showTitle": true,
        "className": "",
        "visible": "true",
        "disabled": "false",
        "groupType": "default"
    },
    {
        "id": "ab49fa1b6350d6fc",
        "type": "ui-group",
        "name": "IMC-10",
        "page": "imc_ui_page",
        "width": "6",
        "height": "1",
        "order": 3,
        "showTitle": true,
        "className": "",
        "visible": "true",
        "disabled": "false",
        "groupType": "default"
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
        "id": "imc_ui_page",
        "type": "ui-page",
        "name": "IMC Monitor",
        "ui": "8d83dc24c753d0d1",
        "path": "/monitor",
        "icon": "monitor_heart",
        "layout": "grid",
        "theme": "imc_ui_theme",
        "breakpoints": [
            {
                "name": "Default",
                "px": "0",
                "cols": "4"
            },
            {
                "name": "Tablet",
                "px": "576",
                "cols": "6"
            },
            {
                "name": "Small Desktop",
                "px": "768",
                "cols": "9"
            },
            {
                "name": "Desktop",
                "px": "1024",
                "cols": "12"
            }
        ],
        "order": 1,
        "className": "",
        "visible": "true",
        "disabled": "false"
    },
    {
        "id": "8d83dc24c753d0d1",
        "type": "ui-base",
        "name": "My Dashboard",
        "path": "/dashboard",
        "appIcon": "",
        "includeClientData": true,
        "acceptsClientConfig": [
            "ui-notification",
            "ui-control"
        ],
        "showPathInSidebar": false,
        "headerContent": "page",
        "navigationStyle": "default",
        "titleBarStyle": "default",
        "showReconnectNotification": true,
        "notificationDisplayTime": 1,
        "showDisconnectNotification": true,
        "allowInstall": false
    },
    {
        "id": "imc_ui_theme",
        "type": "ui-theme",
        "name": "IMC Industrial Dark",
        "colors": {
            "surface": "#151922",
            "primary": "#22c55e",
            "bgPage": "#0b0f15",
            "groupBg": "#11161f",
            "groupOutline": "#27303d"
        },
        "sizes": {
            "density": "default",
            "pagePadding": "14px",
            "groupGap": "12px",
            "groupBorderRadius": "14px",
            "widgetGap": "12px"
        }
    }
]
