# CLAUDE.md — RPA Pre-Sales 二面「Q1 500 萬業績規劃」靜態網頁

> 給 Claude Code 的工作說明。你是 Shack（林采翔）的協作夥伴，一起做出一個**可離線開啟的單一 HTML 簡報網頁**，用於 2026/11/27 富士軟片（台灣富士軟片資訊）台北分公司「Solution Pre-Sales (RPA)」第二次面試。
> 語言：UI 與文案一律**繁體中文**；程式識別字用英文。

---

## 0. 一句話目標

用互動網頁展示「從痛點出發、到有數字的業績規劃」：**產業痛點 → 對應 RPA 解法 → 計價拆解 → A/B 兩版業績拆解 → 成案率回推 → Q1 時程**。
Shack 的核心觀點：這個職位「找到產業既定流程與痛點」比「如何開發」更重要；但計價、業績、漏斗回推是證明「有實際規劃能力」的必備內容，兩者都要有。

## 1. 面試題目（原文重點，不可改動）

- 製作明年（2027）**1–3 月業績 500 萬**達成規劃簡報；含業績拆解、規劃依據、產業攻略、特定情境／產品組合攻略；可用成案率回推所需機會案件量。
- **案件業績以「回簽報價單」即計入。**
- 計價：
  - 授權（年訂閱）：半自動機器人 64,000／全自動機器人 400,000／RPA 開發工具使用者 176,000。
  - 規則：必要組合 = 開發工具 1 套 +（全自動或半自動 擇 1），其餘依使用量加購。
  - 開發專案（一次性）：20,000／人天。
  - 平均標準專案：開發工具 1 + 半自動 1 + 一項中小規模流程開發 ≈ **500,000／案**。
- 其他：每季既有續約案件約 4,000,000。
- 兩個版本都要呈現：**A 版（從零 500 萬）**、**B 版（400 萬續約 + 100 萬新增）**。

## 2. 硬性限制（違反即視為 bug）

1. **單一 HTML 檔可離線開啟**（雙擊 `dist/rpa-plan.html` 即可，無伺服器）。
2. **禁止外部資源**：不用 CDN、不載入外部字型／圖片／腳本、不用 `fetch`／`XMLHttpRequest`、不用 `import url(http...)`。字型用系統字型。
3. **資料集中、數字只由程式算出**：所有金額、案數、漏斗數字都來自 `src/data.js` + `src/calc.js`。**HTML 文案中禁止手寫會變動的數字**（以 `data-bind` 或模板字串填入）。
4. **不捏造數字與事實**：
   - 轉換率、人天、產業評分、時程皆為「假設」，UI 必須標示「假設」並可在「假設面板」檢視。（2026-11-22 Shack 要求：簡報移除假設面板，改放 PDF 列印附錄 C；第 10 章改為「資料來源」，保留所有來源連結。）
   - **（2026-11-20 改版，Shack 同意）客戶卡片改為具名公司**，規格見根目錄 `Industry.md`。每段內容須標示：【公開事實】（附來源連結）／【推估】（依產業痛點 × 公司營運型態推論，需 Discovery 驗證）／【試算假設】（效益數字，非客戶實績）。**禁止**把推估寫成「該公司一定有此問題」。原「證據等級 A/A-/B」已移除（§6 保留作歷史參考）。
   - 富士官網未具名的案例客戶（如工業鏡頭廠）不得臆測其身分。
   - 不使用真實人物照片；不暗示知道富士軟片的內部客戶名單或內部數據。
5. **簡報模式優先**：整頁以「章節 = 一張投影片」呈現，可用鍵盤翻頁；動畫須尊重 `prefers-reduced-motion`，且**不自動播放**（需使用者操作才觸發）。
6. 效能與相容：Chrome 最新版為主；1920×1080 投影可讀（內文 ≥ 18px）；最終檔案建議 < 500KB。

## 3. 技術選擇與專案結構

預設**原生 HTML/CSS/JS + 一支 Node build 腳本**（零依賴）。理由：最不容易在現場出錯，且資料／計算可被 Node 單獨驗算。
（若 Shack 明確要求 React，再改用 Vite + `vite-plugin-singlefile`；**不要用 Next.js 靜態輸出**，`file://` 下資源路徑常出問題。）

```
rpa-plan/
├─ CLAUDE.md
├─ src/
│  ├─ index.template.html   # 含佔位註解：<!--STYLE--> <!--DATA--> <!--CALC--> <!--APP-->
│  ├─ style.css
│  ├─ data.js               # export const DATA = {...}（唯一資料來源）
│  ├─ calc.js               # 純函式，export function ...
│  └─ app.js                # DOM 與互動；只讀 DATA / calc 的結果
├─ scripts/
│  ├─ build.mjs             # 把 style/data/calc/app 內嵌進 template → dist/rpa-plan.html
│  └─ verify.mjs            # Node 直接 import data.js + calc.js 驗算，並掃描禁止事項
└─ dist/
   └─ rpa-plan.html         # 面試用成品（build 產物，勿手改）
```

- `build.mjs` 規則：內嵌時把 `export const` / `export function` 的 `export ` 前綴移除；`src/*.js` 之間**不使用 `import`**（`verify.mjs` 例外，它可 import 原始檔）。
- `package.json` scripts：`"build": "node scripts/build.mjs"`、`"verify": "node scripts/verify.mjs"`、`"check": "npm run verify && npm run build"`。
- **每次修改後先跑 `npm run check`**，通過才算完成。

## 4. 資料模型（`src/data.js` 種子）

以下數字已驗算，請直接使用，勿自行更動（調整需經 Shack 同意並更新 `verify.mjs`）。

```js
// 2026-11-22 依目前網頁（dist/rpa-plan.html）同步；完整內容以 src/data.js 為準
export const DATA = {
  meta: {
    title: "2027 Q1 業績 500 萬達成規劃",
    target: 5_000_000,
    interviewDate: "2026-11-27",
    heroCaseId: "porite-delivery", // 主打：台灣保來得｜供應商交期追蹤 + 交期異常預警（標準案）；開場頁不另列主打行，僅卡片標示
    thesis: "我認為 Pre-Sale 找到潛在商機 & 發掘客戶需求是成功的關鍵"
  },

  price: { dev: 176_000, semi: 64_000, full: 400_000, day: 20_000 },

  // 標準案拆解：授權 24 萬（工具授權加上半自動化）+ 13 人天 26 萬 = 50 萬
  standardCase: { semiCount: 1, devToolCount: 1, days: 13 },

  // 案型（供組合器與 A/B 使用）
  dealTypes: {
    starter:     { label: "入門包",                 fullAuto: false, days: 10 }, // 24 萬授權 + 10 人天 = 44 萬（A 版百貨用）
    starterLite: { label: "入門包（最低授權組合）", fullAuto: false, days: 0 },  // 開發工具 + 半自動 = 24 萬（B 版新客用）
    standard:    { label: "標準案",                 fullAuto: false, days: 13 }, // 50 萬
    flagship:    { label: "全自動旗艦",             fullAuto: true,  days: 30 }, // 57.6 萬授權 + 60 萬 = 117.6 萬
    expansion:   { label: "既有客戶擴充（純人天）", fullAuto: false, days: 15, noLicense: true } // 30 萬
  },

  // A 版：從零 500 萬（共 11 案、611.6 萬；每案對應一家具名客戶，見 Industry.md）
  versionA: {
    deals: [
      { industry: "manufacturing", type: "standard", n: 1, caseId: "porite-delivery" },
      { industry: "manufacturing", type: "standard", n: 1, caseId: "teco-drawing-sync" },
      { industry: "manufacturing", type: "standard", n: 1, caseId: "tpi-stock-alert" },
      { industry: "manufacturing", type: "flagship", n: 1, caseId: "skfiber-invoice-3way" },
      { industry: "retail",        type: "standard", n: 1, caseId: "yuan-omni-orders" },
      { industry: "retail",        type: "standard", n: 1, caseId: "greattree-pos-recon" }, // 2026-11-22 由銀座白石改為大樹藥局
      { industry: "retail",        type: "standard", n: 1, caseId: "poya-omo-pickup" },     // 2026-11-23 新增寶雅，補足保守版
      { industry: "hightech",      type: "standard", n: 1, caseId: "coretronic-quality-report" },
      { industry: "finance",       type: "standard", n: 1, caseId: "yungda-commission" },
      { industry: "department",    type: "starter",  n: 1, caseId: "skm-concession" },
      { industry: "government",    type: "standard", n: 1, caseId: "ntpc-traffic-adjudication" } // 以決標／簽約日視同回簽
    ]
  },

  // B 版：續約 + 新增（新增 5 案、184 萬）
  versionB: {
    renewalBase: 4_000_000,
    renewalRate: 0.95,                  // 基準情境；UI 可調 85%–100%
    renewalRange: [0.85, 1.0],
    sensitivityRates: [1.0, 0.95, 0.9, 0.85],
    deals: [
      { source: "existing", type: "expansion",   n: 1, caseId: "lin-land-expansion" },  // 既有 RPA 客戶擴充 30 萬
      { source: "existing", type: "expansion",   n: 1, caseId: "lens-dual-erp-recon" }, // 既有 RPA 客戶擴充 30 萬
      { source: "new",      type: "standard",    n: 1, caseId: "porite-delivery" },     // 新客標準案 50 萬
      { source: "new",      type: "starterLite", n: 1, caseId: "ginza-store-daily" },   // 最低授權組合 24 萬
      { source: "new",      type: "standard",    n: 1, caseId: "tc-1999-petition" }     // 公部門標準案 50 萬
    ]
  },

  // 回本試算假設（2026-11-22 Shack 同意）：月薪 5 萬 × 1.3；門檻 18 個月；超過門檻試算同一套授權多流程攤提
  roi: { monthlySalary: 50_000, loadFactor: 1.3, horizonMonths: 36, paybackLimit: 18, maxFlows: 3 },

  // 漏斗假設（全部為「假設」，UI 需標示）
  funnel: {
    leadToOpp: 0.20,        // 名單 → 有效商機
    oppToPoc:  0.50,        // 商機 → Demo/PoC
    pocToWin:  0.50,        // PoC → 回簽
    existingOppToWin: 0.60, // 既有客戶擴充：商機 → 回簽
    coverageTarget: 4,      // 商機加權覆蓋倍數（目標 3–4 倍）
    abmAccounts: [10, 15]   // 百貨／金融 ABM 鎖定家數
  },

  industries: [ // 另有 short、abm、pitch 欄位（見 src/data.js）
    { id: "manufacturing", name: "製造業供應鏈",   role: "主攻",       score: { speed:4, size:5, ticket:4, quantifiable:5, resistance:4 } },
    { id: "retail",        name: "傳統零售／電商", role: "副攻",       score: { speed:4, size:4, ticket:2, quantifiable:4, resistance:4 } },
    { id: "hightech",      name: "高科技",         role: "選擇性",     score: { speed:2, size:3, ticket:5, quantifiable:3, resistance:2 } },
    { id: "department",    name: "百貨",           role: "單點 ABM",   score: { speed:3, size:1, ticket:3, quantifiable:4, resistance:3 } },
    { id: "finance",       name: "金融／保險",     role: "長線／擴充", score: { speed:1, size:2, ticket:5, quantifiable:4, resistance:1 } },
    { id: "government",    name: "政府／公部門",   role: "單點突破",   score: { speed:2, size:3, ticket:3, quantifiable:4, resistance:2 } }
  ], // score 為主觀假設（1–5，分數越高越有利：speed＝成交週期越短，resistance＝導入阻力越低）

  scoreLabels: { speed: "成交週期", size: "市場規模", ticket: "客單潛力", quantifiable: "效益可量化", resistance: "導入阻力（越高越低阻力）" },
  scoreShort:  { speed: "週期", size: "規模", ticket: "客單", quantifiable: "可量化", resistance: "低阻力" },

  timeline: {
    // 日期為假設／預設，春節放假日以人事行政總處公告為準，務必可在資料中修改
    quarter: ["2027-01-01", "2027-03-31"],
    lunarNewYearDay1: "2027-02-06",
    holidayWindow: ["2027-02-04", "2027-02-14"], // 暫定
    otherHolidays: ["2027-01-01", "2027-03-01"], // 暫定：元旦、228 補假
    signTargetDate: "2027-03-25", // 內部回簽目標（距季末 6 天緩衝；2026-11-20 由 3/20 改為 3/25）
    phases: [ // 每個階段另有 tasks（見 src/data.js）
      { id: "warm",  label: "暖名單啟動（Q1 前）", start: "2026-12-01", end: "2026-12-31" },
      { id: "disc",  label: "Discovery + Demo",   start: "2027-01-04", end: "2027-01-29" },
      { id: "push",  label: "春節前簽核推進",       start: "2027-02-01", end: "2027-02-03" },
      { id: "poc",   label: "PoC 與報價",           start: "2027-02-15", end: "2027-03-12" },
      { id: "close", label: "回簽衝刺",             start: "2027-03-08", end: "2027-03-31" }
    ]
  },

  scenarios: [], // 5 種情境：入門包首購（含最低授權組合替代）、標準案、全自動升級、既有客戶純人天擴充、續約 + 加購
  risks: [],     // 5 項：旗艦延後、續約率下滑、PoC 產能不足、高科技自建、公部門採購時程延後
  infoTags: {},  // 公開事實／推估／試算假設
  customerSources: {}, // 富士既有 RPA／富士既有非 RPA／集團外新客
  cases: [],     // 15 張具名客戶卡片（五段式），規格見 Industry.md
  sources: []    // 客戶公開資料來源
};
```

### 預期驗算結果（`verify.mjs` 必須斷言）

| 項目 | 預期值 |
|---|---|
| 標準案金額 | 176,000 + 64,000 + 13×20,000 = **500,000** |
| 全自動旗艦 | 176,000 + 400,000 + 30×20,000 = **1,176,000** |
| 入門包（10 人天） | 240,000 + 200,000 = **440,000** |
| 入門包（純授權） | **240,000** |
| 既有客戶擴充（15 人天） | **300,000** |
| A 版合計（完整版） | **6,116,000**，11 案（2026-11-23 Shack 同意新增寶雅第 11 案；原 10 案 5,616,000、9 案 5,116,000） |
| 保守版／完整版 | A：保守 5,116,000（缺口 0）／完整 6,116,000；B（95%）：保守 4,800,000（缺口 200,000 → 1 個擴充案）／完整 5,640,000；東元、寶雅列主力 |
| B 版（續約率 95%） | 3,800,000 + 1,840,000 = **5,640,000**，新增 5 案（2026-11-22 Shack 同意新增公部門案：臺中市研考會 1999 陳情分案標準案；原 4 案 1,340,000／5,140,000） |
| A 版漏斗 | PoC 22、有效商機 44、名單 220、覆蓋倍數 ≈ 4.89（原 10 案：20／40／200／4.49） |
| B 版漏斗 | 擴充商機 ≈ 3.33（進位 4）、新客商機 12、新客名單 60（原 4 案：8／40） |
| 回本試算（月薪 5 萬 × 1.3） | 保來得 1 流程 20 個月、2 流程 11 個月；新北裁決處 7 個月；標準案 18 個月內回本需每月省約 106 小時 |
| B 敏感度（缺口 → 約需標準案，進位） | 100%：100 萬→2；95%：120 萬→3；90%：140 萬→3；85%：160 萬→4 |

## 5. `src/calc.js` 規格（純函式）

- `dealAmount(typeKey)`：依 `price` 與 `dealTypes` 計算單案金額（`noLicense` 只算人天；`fullAuto` 用全自動，否則半自動）。
- `versionATotal()`、`versionBTotal(rate)`：回傳 `{ total, deals, byIndustry, gapToTarget }`。
- `funnelBack({ deals, rates })`：由成交案數**反推** PoC → 商機 → 名單（進位用 `Math.ceil`，顯示時同時給出未進位值）。
- `funnelForward({ leads, rates, avgTicket })`：由名單**正推**預期成交案數與金額（供滑桿）。
- `renewalSensitivity(rates)`：回傳每個續約率的缺口與約需標準案數。
- `configure({ caseId, productType, extraSemi, days, existingLicense })`：報價組合器，回傳明細（開發工具／機器人／加購／人天）與總額，並標示「與標準案差距」；`existingLicense`（或案例的 `existingLicense: true`）= 既有授權沿用、只算人天與加購。
- `customerSourceSummary()`：統計客戶來源（富士既有 RPA／富士既有非 RPA／集團外新客）。（取代原 `evidenceSummary()`）
- `benefit(caseId)`、`benefitFormula(caseId)`、`measureOf(b)`：效益試算（月工時、節省工時、人力當量），皆為假設。`minutes` 是**人工**處理一個計量單位（`measure`，預設取 `unit` 第一個字）的分鐘數，RPA 執行時間不計；卡片第 4 段逐步標註「人工現況 → 導入後（機器人處理 X%，其餘例外仍人工）」。
- `dealsForCase(caseId)`：該客戶在 A／B 版對應的案型與金額。
- `laborMonthlyOf(caseId)`、`addFlowCostOf(caseId)`：回本試算的個案覆寫——卡片可設 `roiOverride.laborMonthly`（該職務實際月成本，如中強光電工程師 8 萬）與 `replicate.days`（同一報表複製到下一條產線的人天，如 5 人天），未設定則用共用規則（月薪 5 萬 × 1.3；每多一個流程 15 人天）。`replicate.maxCopies` 可覆寫最多複製處數（新光三越 4 館）；`pilotGoal` 為「全自動也達不到回本門檻」時卡片顯示的單點目標。
- `dealTier(caseId)`、`tiersA()`、`tiersB(rate)`：保守版／完整版分層。主力＝回本成立（單一流程或擴大後在門檻內），計入保守版；待驗證＝工時回本不成立，只計入完整版。回傳保守／完整金額、缺口與補法（約需擴充案／標準案數）。
- `caseQuote(caseId)`：卡片報價；只出現在 B 版最低授權組合的客戶（銀座白石）以不含開發的 24 萬計，回本試算也用此報價。
- `roi(caseId, flows)`、`roiPlan(caseId)`、`hoursNeededForPayback(caseId)`：回本試算（月省金額、回本月數、三年淨效益；超過門檻時找出多流程攤提方案，仍不達標則回傳所需每月省時），皆為試算假設。
- 所有函式不碰 DOM；`verify.mjs` 直接呼叫。

## 6. 內容：痛點卡片與證據（種子）

> **2026-11-20 起改版**：卡片已改為具名客戶（2026-11-23 起共 15 張，含公部門 2 家；A 版零售由銀座白石改為大樹藥局，並新增寶雅）（五段式：客戶名稱 & 背景／挑戰／解決方案／預估效益／報價試算），以 `Industry.md` 為準；`verify.mjs` 會檢查每張卡片的欄位、來源連結、A／B 版報價一致性與效益試算。以下 §6.1–6.4 為原始種子，僅供歷史參考。

### 6.1 證據等級

- **A**：有公開 RPA 案例（含台灣富士軟片資訊官網案例），該流程痛點有文字證據。
- **A-**：有公開案例，但解法非 RPA（僅作痛點佐證）。
- **B**：只有產業結構資料或自備流程清單（RPA.md），痛點為**推論，需 Discovery 驗證**。
- UI 上每張卡片必須顯示等級徽章，並提供「為什麼是 A／B」的一句說明。

### 6.2 案例資料欄位

```js
{
  id, industry, title,
  painStory,            // 一句人話痛點
  asIs: [ "步驟…" ],     // 現況人工步驟（3–5 步）
  toBe: [ { actor: "robot"|"human", text: "…" } ], // 目標流程；人工覆核點用 human 標示
  productType: "semi"|"full",
  estDays,              // 預估開發人天（假設）
  evidence: { level: "A"|"A-"|"B", refs: [ { sourceId, note } ] },
  existingCustomerCandidate: false
}
```

### 6.3 要建立的卡片（至少這些，內容由 Claude Code 草擬、Shack 審）

| id | 產業 | 流程 | 型態 / 預估人天（假設） | 證據 |
|---|---|---|---|---|
| mfg-delivery-followup | 製造 | 供應商交期追蹤（每日寄信、回填、標記逾期） | 全自動候選 / 13 | A（亞旭電腦） |
| mfg-order-to-sales | 製造 | 請購／訂單 → ERP 轉單（PR→PO、訂單轉銷貨） | 半自動 / 13 | A（隆輝） |
| mfg-dual-erp-sync | 製造 | 兩套 ERP 資料同步 | 半自動 / 13 | A（工業鏡頭廠，富士案例） |
| mfg-stock-alert | 製造 | 安全庫存警示 + 盤點差異比對（1 月盤點時機） | 半／全 / 9 | B |
| mfg-invoice-3way | 製造 | 發票 OCR + 三方比對（旗艦，需例外處理） | 全自動 / 30 | B（RPA.md 優先順序第 1） |
| retail-multiplatform-orders | 零售 | 多平台訂單彙整匯入 ERP + 物流單號回填 | 全／半 / 14 | B（無具名公開案例） |
| retail-store-inventory | 零售 | 門市庫存／盤點彙整 | 半自動 / 10 | A-（銀座白石，富士案例，解法非 RPA） |
| hightech-yield-report | 高科技 | 每日良率／OEE 報表與異常通報（唯讀 MES） | 全自動 / 25 | B |
| fin-reconciliation | 金融 | 外匯／交易對帳（OCR + 比對 + 差異通知） | 全自動 / 25 | A（國際商業銀行，富士案例） |
| ins-commission-check | 保險 | 保經代佣金對帳（多家保險公司格式不同） | 全自動 / 20 | B（推論） |
| dept-concession-settlement | 百貨 | 專櫃營業額彙整 + 抽成計算 | 半自動 / 20 | B（無公開案例） |

每張 To-Be 流程至少標示一個 `human` 覆核點（付款、退款、風險判斷等不自動放行）。

### 6.4 證據來源（paraphrase 摘要，勿大段複製原文）

| sourceId | 內容摘要 | URL |
|---|---|---|
| ithome-asia | 亞旭電腦：採購交期變更在 B2B 平台與 ERP 間來回，人工約 3 小時、RPA 人機協作約 35 分鐘（年份待核對） | https://www.ithome.com.tw/news/140424 |
| cio-zeus | 隆輝：一天 200 筆訂單轉銷貨，需重複 600 次以上操作 | https://www.cio.com.tw/the-xinli-information-systalk-rpa-helps-taiwans-zeus-safety-helmet-operating-process-automation-more-intelligent/ |
| fbtw-lens | 富士案例：工業鏡頭廠兩套 ERP 重複登打，節省約 80% 訂單處理時間 | https://www.fujifilm.com/fbtw/zh-tw/solutions/case-studies/it |
| fbtw-bank | 富士案例：國際商業銀行外匯對帳單日處理最高 14,000 筆，降低約 85% 工時 | https://www.fujifilm.com/fbtw/zh-tw/solutions/case-studies/banking-finance-and-insurance |
| fbtw-retail | 富士案例：銀座白石 6 間分店庫存用試算表 + Email 彙總（解法為雲端資料庫） | https://www.fujifilm.com/fbtw/zh-tw/solutions/case-studies/retail |
| benq-uipath | 明基材料：導入 UiPath 讓同仁自行開發，標題載六成部門導入（代表大廠自建能力強） | https://www.inside.com.tw/article/35338-MetaAge |
| cathay-rpa | 國泰金控 2018 年於銀行、人壽、產險導入 RPA，並設機器人管理辦公室 | https://www.bnext.com.tw/article/65346/cathay-financial-low-code-no-code |
| fubon-like | 遠雄人壽：RPA 用於保單資料處理、文件審核、報表，採公民開發 | https://money.udn.com/money/story/5613/9273082 |
| iii-survey | 資策會調查：67% 企業電子化系統搭配人工；採購 27% 仍用傳真電話（年份較早，須註明） | https://www.inside.com.tw/article/14830-iii-robotic-process-automation |
| dept-share | 2025 百貨市占前三：新光三越、遠東百貨、遠東 SOGO；三井升至第四 | https://www.nownews.com/news/6866139 |
| fbtw-position | 富士自述：約四分之一企業辦公室使用其事務機；紙本數位化 + RPA 雙軌（2024 廣編企劃，公司自述） | https://www.businessweekly.com.tw/business/indep/1004443 |

## 7. 頁面結構（章節 = 投影片）

1. **開場摘要**：副標「我先假設該產業潛在可被 RPA 優化的流程，再用「標準案」組合與成案率回推，逐步達成 500 萬業績目標」；A 版 11 案：保守版 511.6 萬／完整版 611.6 萬；B 版續約保底 + 5 案：保守版 480 萬／完整版 564 萬（保守版只計回本成立的主力）；三個關鍵數字（標準案拆解：授權 24 萬（工具授權加上半自動化）+ 開發 13 人天 26 萬、所需名單量（含各段轉換率：→（20%）商機 →（50%）Demo／PoC →（50%）回簽，數字由 data-bind 帶入）、Q1 有效時程）；一句話主張「我認為 Pre-Sale 找到潛在商機 & 發掘客戶需求是成功的關鍵」。（開場頁已不列「主打案例／回簽報價單即計入」一行）
2. **產業與痛點地圖**：6 個產業（含政府／公部門）評分表（成交週期、市場規模、客單、效益可量化、導入阻力）+ 角色徽章；右側「怎麼看這張表」說明框與評分表等高；點產業看切入理由、A／B 版規劃與目標客戶，並篩選卡片。
3. **客戶案例卡片**（核心）：15 家具名客戶，點卡片展開五段式內容：① 客戶名稱 & 背景【公開事實】② 挑戰／流程現況【推估】③ 解決方案（機器人／人工覆核步驟，人工覆核以不同顏色標示）④ 預估成果／效益【試算假設】⑤ 報價試算；左欄另有「回本試算」（18 個月內回本顯示三年淨效益；否則顯示多流程攤提，或標「量體待驗證」，不顯示負數）。預設突出 `meta.heroCaseId`（台灣保來得）。
4. **計價與組合器**：選流程 → 自動帶出「開發工具 + 機器人 + 人天」→ 顯示明細與總額；可加購半自動（64K／套）、調整人天；顯示與標準案（50 萬）的差距；內建「標準案怎麼拆」說明。**取代原本的「訂單→庫存→出貨→應收」動畫**（該動畫易過度承諾，已刪除；如需，只做成單一流程靜態圖放進卡片）。
5. **A / B 業績拆解**：A/B 切換（同一版面）。顯示各產業案數與金額、案型組成、成交案數、風險說明；每列標示「主力／待驗證」，目標條分主力與待驗證兩段，下方列保守版／完整版與保守版缺口補法。標題列有「保守版（只計主力）／完整版（含待驗證）」切換按鈕，切到保守版時客戶列表只列主力，合計、案數、各產業金額與目標條同步改為保守版數字（預設完整版）。B 版置頂顯示**續約率敏感度表**與續約率滑桿（85%–100%）。
6. **成案率回推與漏斗**：
   - 反向模式（預設）：輸入／固定目標 → 回推 PoC、商機、名單；顯示覆蓋倍數。
   - 正向模式：滑桿（名單數、三段轉換率）→ 即時預期成交案數與金額；漏斗圖逐層收窄（靜態即可，動畫為選配且需手動觸發）。
   - 客單價**不自由調整**，由案型組合帶出。
   - （2026-11-22 依 Shack 要求移除本章底部三則備註：百貨／金融走 ABM、PoC 團隊產能、Demo ≠ PoC。PoC 產能仍見第 9 章風險，說法保留在口說稿。）
7. **Q1 時間軸**：以回簽日倒推；標示暖名單（12 月）、Discovery（1 月）、春節前後簽核空窗、PoC、3 月衝刺、內部回簽目標。須在文案說明：「A 版以 12 月啟動暖名單為前提」。
8. **特定情境／產品組合攻略**：入門包首購、標準案、全自動升級、既有客戶加購／純人天擴充、續約 + 加購。每項給「適用情境、組合、金額、對應產業」。
9. **風險與備援**：全自動旗艦延後 → 以標準案補（缺口與案數由程式算出）或分階段；續約率下滑 → 擴充 + 新客補；PoC 產能不足 → 付費 PoC／標準範本 Demo；高科技大廠自建能力強 → 賣授權、少賣人天；公部門採購時程延後 → 12 月確認預算，公部門案列為 A／B 版緩衝。
10. **資料來源**：客戶公開資料來源連結列表（含資訊標示說明與引用客戶）。（2026-11-22 依 Shack 要求，原「假設與來源」的假設面板移到 PDF 列印附錄 C；鍵盤 1–9、0 跳章。）

## 8. 互動與簡報模式規格

- 全頁 `scroll-snap`，每章一屏；`←/→`、`PageUp/PageDown`、`Space` 翻頁；`1–9` 跳章；`?` 顯示快捷鍵說明；頁面右側顯示章節導覽點。
- 所有互動元件可鍵盤操作（卡片用 `button` + `aria-expanded`，滑桿用 `input[type=range]` 並顯示數值）。
- 滑桿改動即時重算，**同頁所有相關數字同步更新**（例如漏斗與摘要不得矛盾）。
- 列印樣式（`@media print`）：橫向、每章一頁、隱藏導覽與控制項，方便匯出 **PDF 備援**。
- 視覺：克制、專業、高對比；一個主色 + 兩個語意色（機器人／人工覆核）；避免炫技動畫；大字級與留白，投影可讀。
- 色彩不單獨承載資訊（搭配文字或圖示）；支援 `prefers-reduced-motion`。

## 9. `scripts/verify.mjs` 必做檢查

1. 載入 `src/data.js`、`src/calc.js`，斷言 §4 預期驗算表全部成立。
2. 每張 `cases` 都有 `evidence.level`、至少一個 `human` 覆核點、`estDays`。
3. 每個 `sourceId` 引用都能在 `sources` 找到；等級 A/A- 的卡片必須有至少一個來源。
4. 掃描 `src/` 與 `dist/rpa-plan.html`：不得出現 `fetch(`、`XMLHttpRequest`、`<script src=`、`<link href="http`、`@import`、`cdn`（來源連結文字用 `<a href>` 允許，但不得載入資源）。
5. 掃描模板文案，禁止出現寫死的 `5,116,000`、`5,140,000`、`180`、`36` 等會變動的數字（以 `data-bind` 或模板字串取代）；若有例外需在檢查腳本白名單註明原因。
6. 失敗時以非 0 exit code 結束，並印出哪個斷言失敗。

## 10. 驗收清單（每個里程碑與最終凍結版都要過）

- [ ] `npm run check` 全綠。
- [ ] 關閉網路，雙擊 `dist/rpa-plan.html`，所有章節與互動正常。
- [ ] 瀏覽器 Console 無錯誤／警告。
- [ ] 1920×1080 與 1366×768 皆不破版；內文 ≥ 18px。
- [ ] 鍵盤可完整操作；`prefers-reduced-motion` 下無強制動畫。
- [ ] 改動任一假設（如續約率、轉換率）後，全頁數字同步且與 `verify.mjs` 結果一致。
- [ ] 列印成 PDF，每章一頁、內容完整、無切斷。
- [ ] 所有「假設」與【公開事實／推估／試算假設】標示在畫面上可見；沒有未標示的推論被寫成事實。
- [ ] 檔案大小 < 500KB。

## 11. 里程碑（面試 2026/11/27；今天 11/19）

| 日期 | 里程碑 | 產出 |
|---|---|---|
| 11/19–11/20 | M0 資料與計算 | `data.js`、`calc.js`、`verify.mjs`、`build.mjs`，驗算全綠 |
| 11/21 | M1 骨架 | 簡報模式導覽、開場摘要、計價與組合器 |
| 11/22 | M2 痛點卡片 | 11 張卡片內容（含流程圖、證據徽章） |
| 11/23 | M3 業績與漏斗 | A/B 拆解、續約敏感度、漏斗（反向 + 正向滑桿） |
| 11/24 | M4 時程與收尾章節 | 時間軸、情境攻略、風險備援、假設與來源 |
| 11/25 | M5 打磨 | 視覺、列印／PDF、離線與解析度測試 |
| 11/26 | M6 凍結 | 排練、Q&A 預演；**功能凍結**，只修 bug |
| 11/27 | 面試 | 帶 `dist/rpa-plan.html` + PDF 備援（先向 HR 確認簡報時間、設備、檔案格式） |

> 優先順序（時間不夠時依序捨棄）：先確保 M0–M3；M4 的情境攻略與風險章節可精簡；動畫與視覺細節最後做。

## 12. 協作規則（給 Claude Code）

1. **小步前進**：一次只做一個章節或元件；每步完成後跑 `npm run check`，再向 Shack 回報變更重點。
2. **先讀資料再寫 UI**：任何數字或文案若不在 `data.js` 中，先提案新增欄位，經 Shack 同意再用。
3. **不確定就標示假設，不要自行補事實**；遇到需要查證的公開資訊，列出待核對清單，不要直接寫成確定語氣。
4. 文案風格：給「懂業務但非技術」的面試官看；短句、具體、有數字；避免行話堆疊。
5. 保持 Git 歷史清晰：每個里程碑一個 commit，訊息用繁體中文簡述。
6. 若 Shack 提到面試官的新要求（時間、格式、設備），立即回頭檢查 §2 與 §8 是否需調整。

## 13. 口說稿與 Q&A（M5–M6 一起準備，存放 `docs/talk-track.md`）

- 3–5 分鐘主線：痛點（為何這個流程值得做）→ 方案（RPA 做什麼、人做什麼）→ 計價（標準案怎麼拆）→ A/B 業績 → 回推所需名單 → 時程與風險。
- 主動提問（展現 Pre-Sales 的 Discovery 能力）：準備 5 個挖需求問題，例如「這個流程每天幾筆？每筆多久？例外比例大約多少？」「目前跨幾套系統？有沒有 API？」「出錯時誰負責接手？」
- 預期被問：轉換率從哪來？續約掉到 90% 怎麼辦？PoC 產能怎麼配置？為何不是金融優先？如何判斷一個流程值得做 RPA？（回答框架：重複性、規則明確、資料可取得、例外可辨識、效益可衡量，參考 RPA.md §9）

## 14. 第一次啟動指令範本（Shack 可直接貼給 Claude Code）

> 請依 CLAUDE.md 建立專案骨架（§3），先完成 M0：實作 `src/data.js`（用 §4 種子）、`src/calc.js`（§5）、`scripts/verify.mjs`（§9）與 `scripts/build.mjs`，讓 `npm run check` 全綠。完成後回報驗算結果表，再等我確認進入 M1。

## 附：參考資料

- 使用者提供的 `RPA.md`（五大產業流程盤點、導入評估、效益試算範例）：效益試算示範可引用「每日 500 張發票 × 每張 3 分鐘 → 每月約 550 小時，80% 自動化約節省 440 小時（約 2.5 人力當量）」，但**必須標示為示範數字，非客戶實績**。
- 面試題目 PDF：計價規則與題目要求（§1）。
