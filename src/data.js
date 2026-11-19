// 唯一資料來源。所有金額、案數、漏斗數字都由 calc.js 依此計算。
// 數字種子依 CLAUDE.md §4（已驗算）；調整需經 Shack 同意並更新 scripts/verify.mjs。
// 本檔不得 import 其他檔案（build 會移除 export 前綴後內嵌）。

export const DATA = {
  meta: {
    title: "2027 Q1 業績 500 萬達成規劃",
    target: 5_000_000,
    interviewDate: "2026-11-27",
    heroCaseId: "mfg-delivery-followup" // 預設主打流程；Shack 尚無偏好，隨時可改這一行
  },

  price: { dev: 176_000, semi: 64_000, full: 400_000, day: 20_000 },

  // 標準案拆解：授權 24 萬 + 13 人天 26 萬 = 50 萬
  standardCase: { semiCount: 1, devToolCount: 1, days: 13 },

  // 案型（供組合器與 A/B 使用）；days 為假設
  dealTypes: {
    starter:     { label: "入門包",               fullAuto: false, days: 10 },  // 24 萬授權 + 10 人天 = 44 萬（A 版百貨用）
    starterLite: { label: "入門包（純授權）",     fullAuto: false, days: 0 },   // 24 萬（B 版新客用）
    standard:    { label: "標準案",               fullAuto: false, days: 13 },  // 50 萬
    flagship:    { label: "全自動旗艦",           fullAuto: true,  days: 30 },  // 57.6 萬授權 + 60 萬 = 117.6 萬
    expansion:   { label: "既有客戶擴充（純人天）", fullAuto: false, days: 15, noLicense: true } // 30 萬
  },

  // A 版：從零 500 萬（共 9 案、511.6 萬）
  versionA: {
    deals: [
      { industry: "manufacturing", type: "standard", n: 3 },
      { industry: "manufacturing", type: "flagship", n: 1, caseId: "mfg-invoice-3way" },
      { industry: "retail",        type: "standard", n: 2 },
      { industry: "hightech",      type: "standard", n: 1 },
      { industry: "finance",       type: "standard", n: 1 },
      { industry: "department",    type: "starter",  n: 1 }
    ]
  },

  // B 版：續約 + 新增
  versionB: {
    renewalBase: 4_000_000,
    renewalRate: 0.95,                  // 基準情境（假設）；UI 可調 85%–100%
    renewalRange: [0.85, 1.0],
    sensitivityRates: [1.0, 0.95, 0.9, 0.85],
    deals: [
      { source: "existing", type: "expansion",   n: 2 }, // 既有客戶擴充 2 × 30 萬
      { source: "new",      type: "standard",    n: 1 }, // 新客標準案 50 萬
      { source: "new",      type: "starterLite", n: 1 }  // 新客入門包 24 萬
    ]
  },

  // 漏斗假設（全部為「假設」，UI 需標示）
  funnel: {
    leadToOpp: 0.20,        // 名單 → 有效商機
    oppToPoc:  0.50,        // 商機 → Demo/PoC
    pocToWin:  0.50,        // PoC → 回簽
    existingOppToWin: 0.60, // 既有客戶擴充：商機 → 回簽
    coverageTarget: 4       // 商機加權覆蓋倍數（目標 3–4 倍）
  },

  industries: [
    { id: "manufacturing", name: "製造業供應鏈",   role: "主攻",       score: { speed: 4, size: 5, ticket: 4, quantifiable: 5, resistance: 4 } },
    { id: "retail",        name: "傳統零售／電商", role: "副攻",       score: { speed: 4, size: 4, ticket: 2, quantifiable: 4, resistance: 4 } },
    { id: "hightech",      name: "高科技",         role: "選擇性",     score: { speed: 2, size: 3, ticket: 5, quantifiable: 3, resistance: 2 } },
    { id: "department",    name: "百貨",           role: "單點 ABM",   score: { speed: 3, size: 1, ticket: 3, quantifiable: 4, resistance: 3 } },
    { id: "finance",       name: "金融／保險",     role: "長線／擴充", score: { speed: 1, size: 2, ticket: 5, quantifiable: 4, resistance: 1 } }
  ], // score 為主觀假設（1–5，resistance 越高代表阻力越低）

  scoreLabels: {
    speed: "成交速度",
    size: "市場規模",
    ticket: "客單潛力",
    quantifiable: "效益可量化",
    resistance: "導入阻力（越高越低阻力）"
  },

  timeline: {
    // 日期為假設／預設，春節放假日以人事行政總處公告為準，務必可在資料中修改
    quarter: ["2027-01-01", "2027-03-31"],
    lunarNewYearDay1: "2027-02-06",
    holidayWindow: ["2027-02-04", "2027-02-14"], // 暫定
    signTargetDate: "2027-03-20", // 內部回簽目標（留 10 天緩衝）
    phases: [
      { id: "warm",  label: "暖名單啟動（Q1 前）", start: "2026-12-01", end: "2026-12-31" },
      { id: "disc",  label: "Discovery + Demo",   start: "2027-01-04", end: "2027-01-29" },
      { id: "push",  label: "春節前簽核推進",       start: "2027-02-01", end: "2027-02-03" },
      { id: "poc",   label: "PoC 與報價",           start: "2027-02-15", end: "2027-03-12" },
      { id: "close", label: "回簽衝刺",             start: "2027-03-08", end: "2027-03-31" }
    ]
  },

  // 證據等級說明（§6.1）
  evidenceLevels: {
    "A":  "有公開 RPA 案例，該流程痛點有文字證據",
    "A-": "有公開案例，但解法非 RPA（僅作痛點佐證）",
    "B":  "只有產業結構資料或自備流程清單，痛點為推論，需 Discovery 驗證"
  },

  // 痛點卡片（§6.3）。內容為 Claude Code 草擬、待 Shack 審；estDays 皆為假設。
  // 公開案例一律以「同類型案例」措辭引用，不代表特定潛在客戶一定有此痛點。
  cases: [
    {
      id: "mfg-delivery-followup",
      industry: "manufacturing",
      title: "供應商交期追蹤",
      painStory: "採購每天早上逐一寄信問交期，再把回覆抄回 Excel 和 ERP，逾期常常是產線缺料時才發現。",
      asIs: [
        "從 ERP 匯出未交貨採購單",
        "依供應商整理待追蹤清單",
        "逐封寄送交期確認信",
        "讀回信、手動回填新交期",
        "人工判斷逾期並通知生管"
      ],
      toBe: [
        { actor: "robot", text: "每日定時抓取未交貨採購單" },
        { actor: "robot", text: "依供應商批次寄送確認信" },
        { actor: "robot", text: "擷取回覆日期並回填追蹤表／ERP" },
        { actor: "robot", text: "標記逾期與未回覆項目" },
        { actor: "human", text: "採購確認異常交期、與生管協調排程" }
      ],
      productType: "full",
      productNote: "全自動候選：每日排程無人值守執行",
      estDays: 13,
      evidence: {
        level: "A",
        why: "同類型案例（亞旭電腦）有公開 RPA 導入報導，痛點與流程相符。",
        refs: [{ sourceId: "ithome-asia", note: "採購交期變更人工約 3 小時，人機協作約 35 分鐘（年份待核對）" }]
      },
      existingCustomerCandidate: false
    },
    {
      id: "mfg-order-to-sales",
      industry: "manufacturing",
      title: "請購／訂單 → ERP 轉單",
      painStory: "業助一天要把上百筆訂單一筆筆轉成銷貨單，同樣的點選動作重複數百次，月底還容易漏單。",
      asIs: [
        "收到客戶訂單或內部請購",
        "人工核對品項、數量、價格",
        "在 ERP 逐筆建立 PO／銷貨單",
        "回頭標記已處理"
      ],
      toBe: [
        { actor: "robot", text: "讀取訂單／請購資料" },
        { actor: "robot", text: "依規則在 ERP 建立 PO 或銷貨單" },
        { actor: "robot", text: "產出轉單結果與異常清單" },
        { actor: "human", text: "業助覆核價格或數量異常的單據" }
      ],
      productType: "semi",
      productNote: "半自動：由業助觸發、在旁覆核",
      estDays: 13,
      evidence: {
        level: "A",
        why: "同類型案例（隆輝）有公開 RPA 報導，量化描述轉單重複操作。",
        refs: [{ sourceId: "cio-zeus", note: "一天 200 筆訂單轉銷貨，需重複 600 次以上操作" }]
      },
      existingCustomerCandidate: false
    },
    {
      id: "mfg-dual-erp-sync",
      industry: "manufacturing",
      title: "兩套 ERP 資料同步",
      painStory: "集團內兩套 ERP 不互通，同一張訂單要在兩邊各打一次，打錯就對不起帳。",
      asIs: [
        "在 A 系統建立訂單",
        "人工在 B 系統重打一次",
        "定期人工比對兩邊差異",
        "發現不一致再回頭修正"
      ],
      toBe: [
        { actor: "robot", text: "偵測 A 系統新增／異動訂單" },
        { actor: "robot", text: "自動在 B 系統建立對應資料" },
        { actor: "robot", text: "每日產出兩系統差異報表" },
        { actor: "human", text: "承辦人處理差異與主檔不一致" }
      ],
      productType: "semi",
      productNote: "半自動：承辦人觸發同步並處理差異",
      estDays: 13,
      evidence: {
        level: "A",
        why: "台灣富士軟片資訊官網有同類型 RPA 案例（工業鏡頭廠）。",
        refs: [{ sourceId: "fbtw-lens", note: "兩套 ERP 重複登打，節省約 80% 訂單處理時間" }]
      },
      existingCustomerCandidate: false
    },
    {
      id: "mfg-stock-alert",
      industry: "manufacturing",
      title: "安全庫存警示 + 盤點差異比對",
      painStory: "1 月年度盤點後，帳面與實盤差異要人工逐料號比對；平時低於安全庫存也常靠經驗發現。",
      asIs: [
        "匯出 ERP 庫存與盤點表",
        "用 Excel 逐料號比對差異",
        "人工檢查是否低於安全庫存",
        "寄信通知採購與倉管"
      ],
      toBe: [
        { actor: "robot", text: "定時匯出庫存與盤點資料" },
        { actor: "robot", text: "比對差異並標記低於安全庫存料號" },
        { actor: "robot", text: "寄送警示清單給負責人" },
        { actor: "human", text: "倉管確認盤差原因、決定是否調帳" }
      ],
      productType: "semi",
      productNote: "半自動起步，穩定後可升級全自動排程",
      estDays: 9,
      evidence: {
        level: "B",
        why: "僅有自備流程清單（RPA.md 優先順序第 7），痛點為推論，需 Discovery 驗證。",
        refs: [{ sourceId: "rpa-md", note: "§3.6 庫存資料同步與安全庫存警示" }]
      },
      existingCustomerCandidate: true
    },
    {
      id: "mfg-invoice-3way",
      industry: "manufacturing",
      title: "發票 OCR + 三方比對（旗艦）",
      painStory: "會計每月要把供應商發票、採購單、收貨單三份資料對齊，數量或單價差一點就得來回追。",
      asIs: [
        "從 Email／紙本取得供應商發票",
        "人工登打發票欄位",
        "到 ERP 調閱 PO 與收貨紀錄",
        "逐項比對料號、數量、單價",
        "差異案件寄信給採購或倉庫"
      ],
      toBe: [
        { actor: "robot", text: "收取發票並以 OCR 擷取欄位" },
        { actor: "robot", text: "從 ERP 取得 PO 與收貨紀錄" },
        { actor: "robot", text: "三方比對，相符項目標記待付款" },
        { actor: "robot", text: "差異案件分派給採購／倉儲" },
        { actor: "human", text: "會計覆核後才放行付款（不自動付款）" }
      ],
      productType: "full",
      productNote: "全自動旗艦：需例外處理與 OCR 搭配",
      estDays: 30,
      evidence: {
        level: "B",
        why: "自備流程清單（RPA.md）列為優先順序第 1，但尚無具名公開案例，需 Discovery 驗證。",
        refs: [{ sourceId: "rpa-md", note: "§3.12 供應商發票與三方比對；§8 優先順序第 1" }]
      },
      existingCustomerCandidate: false
    },
    {
      id: "retail-multiplatform-orders",
      industry: "retail",
      title: "多平台訂單彙整 + 物流單號回填",
      painStory: "訂單分散在多個電商平台，每天要下載、整理格式再匯入 ERP，出貨後還得把物流單號一個個貼回平台。",
      asIs: [
        "逐一登入各平台下載訂單",
        "人工轉換成 ERP 匯入格式",
        "匯入 ERP 並處理錯誤",
        "出貨後手動回填物流單號"
      ],
      toBe: [
        { actor: "robot", text: "定時下載各平台訂單" },
        { actor: "robot", text: "轉換格式並匯入 ERP" },
        { actor: "robot", text: "出貨後回填物流單號到各平台" },
        { actor: "human", text: "客服處理異常訂單、取消與退款" }
      ],
      productType: "full",
      productNote: "全自動或半自動，視訂單量與平台數決定",
      estDays: 14,
      evidence: {
        level: "B",
        why: "自備流程清單列為優先順序第 3，但無具名公開案例，痛點為推論。",
        refs: [{ sourceId: "rpa-md", note: "§4.1 多平台訂單彙整、§4.5 物流單號回寫" }]
      },
      existingCustomerCandidate: false
    },
    {
      id: "retail-store-inventory",
      industry: "retail",
      title: "門市庫存／盤點彙整",
      painStory: "各分店用試算表回報庫存，總部再靠 Email 收齊、手動合併，數字常常慢一天又對不上。",
      asIs: [
        "各門市填寫庫存試算表",
        "Email 寄回總部",
        "總部人工合併多份檔案",
        "比對異常再回頭詢問門市"
      ],
      toBe: [
        { actor: "robot", text: "收取各門市回報檔案" },
        { actor: "robot", text: "合併成總表並檢查缺報門市" },
        { actor: "robot", text: "標記庫存異常品項" },
        { actor: "human", text: "營運人員確認異常並決定調撥" }
      ],
      productType: "semi",
      productNote: "半自動：總部人員觸發彙整",
      estDays: 10,
      evidence: {
        level: "A-",
        why: "富士官網同類型案例證實痛點存在，但當時解法是雲端資料庫而非 RPA。",
        refs: [{ sourceId: "fbtw-retail", note: "銀座白石 6 間分店庫存用試算表 + Email 彙總" }]
      },
      existingCustomerCandidate: false
    },
    {
      id: "hightech-yield-report",
      industry: "hightech",
      title: "每日良率／OEE 報表與異常通報",
      painStory: "工程師每天早上先花時間從 MES 撈資料做良率報表，真正分析異常的時間反而被壓縮。",
      asIs: [
        "登入 MES 匯出前一日資料",
        "Excel 整理良率與 OEE",
        "人工判斷是否超出管制界限",
        "寄報表與異常通知"
      ],
      toBe: [
        { actor: "robot", text: "每日唯讀擷取 MES 資料" },
        { actor: "robot", text: "產出良率／OEE 報表" },
        { actor: "robot", text: "超出門檻自動通報負責工程師" },
        { actor: "human", text: "工程師判斷異常原因與處置" }
      ],
      productType: "full",
      productNote: "全自動：唯讀 MES，不寫回生產系統",
      estDays: 25,
      evidence: {
        level: "B",
        why: "僅有自備流程清單；大廠自建能力強（見明基材料案例），需 Discovery 驗證是否外包。",
        refs: [
          { sourceId: "rpa-md", note: "§6.3 良率及不良品資料彙整" },
          { sourceId: "benq-uipath", note: "大廠自建 RPA 能力強的背景參考" }
        ]
      },
      existingCustomerCandidate: false
    },
    {
      id: "fin-reconciliation",
      industry: "finance",
      title: "外匯／交易對帳",
      painStory: "對帳單一天上萬筆，人工逐筆勾稽，差異要層層追；量大又不能錯。",
      asIs: [
        "下載或收取對帳單",
        "人工登打或整理欄位",
        "與內部交易紀錄逐筆勾稽",
        "整理差異並通知承辦"
      ],
      toBe: [
        { actor: "robot", text: "收取對帳單並 OCR 擷取" },
        { actor: "robot", text: "依規則與內部紀錄比對" },
        { actor: "robot", text: "產出差異清單並通知承辦" },
        { actor: "human", text: "承辦人判斷差異、執行調整（風險判斷不自動化）" }
      ],
      productType: "full",
      productNote: "全自動：量大、規則明確",
      estDays: 25,
      evidence: {
        level: "A",
        why: "台灣富士軟片資訊官網有同類型 RPA 案例（國際商業銀行）。",
        refs: [{ sourceId: "fbtw-bank", note: "外匯對帳單日處理最高 14,000 筆，降低約 85% 工時" }]
      },
      existingCustomerCandidate: true
    },
    {
      id: "ins-commission-check",
      industry: "finance",
      title: "保經代佣金對帳",
      painStory: "每家保險公司的佣金明細格式都不一樣，每月要人工整理成同一張表，再跟應收對帳。",
      asIs: [
        "收取多家保險公司佣金明細",
        "人工轉換成統一格式",
        "與內部保單應收比對",
        "整理差異並追討"
      ],
      toBe: [
        { actor: "robot", text: "收取並辨識各家明細格式" },
        { actor: "robot", text: "轉換成統一格式彙整" },
        { actor: "robot", text: "與應收比對、標記差異" },
        { actor: "human", text: "財務確認差異後才入帳" }
      ],
      productType: "full",
      productNote: "全自動：每月固定批次",
      estDays: 20,
      evidence: {
        level: "B",
        why: "推論：保險業有導入 RPA 的公開報導，但無此流程的具名案例，需 Discovery 驗證。",
        refs: [{ sourceId: "fubon-like", note: "保險業 RPA 應用於保單資料處理與報表（背景參考）" }]
      },
      existingCustomerCandidate: false
    },
    {
      id: "dept-concession-settlement",
      industry: "department",
      title: "專櫃營業額彙整 + 抽成計算",
      painStory: "櫃位多、合約抽成條件各不相同，每月結算要人工套公式，一個條件看錯就要重算。",
      asIs: [
        "匯出 POS 各櫃營業額",
        "對照合約抽成條件",
        "Excel 逐櫃計算抽成",
        "產出對帳單寄給品牌"
      ],
      toBe: [
        { actor: "robot", text: "彙整各櫃 POS 營業額" },
        { actor: "robot", text: "套用合約抽成規則試算" },
        { actor: "robot", text: "產出對帳單草稿" },
        { actor: "human", text: "財務覆核特殊合約條件後才寄出" }
      ],
      productType: "semi",
      productNote: "半自動：月結時由財務觸發",
      estDays: 20,
      evidence: {
        level: "B",
        why: "無公開案例；自備流程清單列為優先順序第 5，需 Discovery 驗證。",
        refs: [
          { sourceId: "rpa-md", note: "§5.1 專櫃營業額彙整、§5.2 抽成計算" },
          { sourceId: "dept-share", note: "百貨市場集中，適合單點 ABM（背景參考）" }
        ]
      },
      existingCustomerCandidate: false
    }
  ],

  // 額外手動假設（其餘由 calc.collectAssumptions() 自動彙整）
  assumptions: [
    { key: "poc-capacity", label: "PoC 團隊產能", value: "Q1 可同時支援的 PoC 場次需與主管確認", note: "Demo 用標準範本；PoC 用真實資料，建議付費並可抵扣" },
    { key: "warm-start", label: "暖名單啟動", value: "A 版以 12 月啟動暖名單為前提", note: "" }
  ],

  // 證據來源（paraphrase 摘要）
  sources: [
    { id: "ithome-asia",   title: "iThome：亞旭電腦 RPA 人機協作",      summary: "採購交期變更在 B2B 平台與 ERP 間來回，人工約 3 小時、RPA 人機協作約 35 分鐘（年份待核對）", url: "https://www.ithome.com.tw/news/140424" },
    { id: "cio-zeus",      title: "CIO Taiwan：隆輝訂單轉銷貨",          summary: "一天 200 筆訂單轉銷貨，需重複 600 次以上操作", url: "https://www.cio.com.tw/the-xinli-information-systalk-rpa-helps-taiwans-zeus-safety-helmet-operating-process-automation-more-intelligent/" },
    { id: "fbtw-lens",     title: "富士軟片資訊案例：工業鏡頭廠",        summary: "兩套 ERP 重複登打，節省約 80% 訂單處理時間", url: "https://www.fujifilm.com/fbtw/zh-tw/solutions/case-studies/it" },
    { id: "fbtw-bank",     title: "富士軟片資訊案例：國際商業銀行",      summary: "外匯對帳單日處理最高 14,000 筆，降低約 85% 工時", url: "https://www.fujifilm.com/fbtw/zh-tw/solutions/case-studies/banking-finance-and-insurance" },
    { id: "fbtw-retail",   title: "富士軟片資訊案例：銀座白石",          summary: "6 間分店庫存用試算表 + Email 彙總（解法為雲端資料庫，非 RPA）", url: "https://www.fujifilm.com/fbtw/zh-tw/solutions/case-studies/retail" },
    { id: "benq-uipath",   title: "INSIDE：明基材料導入 UiPath",         summary: "讓同仁自行開發，標題載六成部門導入（代表大廠自建能力強）", url: "https://www.inside.com.tw/article/35338-MetaAge" },
    { id: "cathay-rpa",    title: "數位時代：國泰金控 RPA",              summary: "2018 年於銀行、人壽、產險導入 RPA，並設機器人管理辦公室", url: "https://www.bnext.com.tw/article/65346/cathay-financial-low-code-no-code" },
    { id: "fubon-like",    title: "經濟日報：遠雄人壽 RPA",              summary: "RPA 用於保單資料處理、文件審核、報表，採公民開發", url: "https://money.udn.com/money/story/5613/9273082" },
    { id: "iii-survey",    title: "INSIDE：資策會 RPA 調查",             summary: "67% 企業電子化系統搭配人工；採購 27% 仍用傳真電話（年份較早）", url: "https://www.inside.com.tw/article/14830-iii-robotic-process-automation" },
    { id: "dept-share",    title: "NOWnews：2025 百貨市占",              summary: "市占前三為新光三越、遠東百貨、遠東 SOGO；三井升至第四", url: "https://www.nownews.com/news/6866139" },
    { id: "fbtw-position", title: "商業周刊廣編：富士軟片資訊自述",      summary: "約四分之一企業辦公室使用其事務機；紙本數位化 + RPA 雙軌（2024 廣編企劃，公司自述）", url: "https://www.businessweekly.com.tw/business/indep/1004443" },
    { id: "rpa-md",        title: "自備資料：五大產業 RPA 流程盤點（RPA.md）", summary: "自行整理的流程清單與優先順序，非客戶實績；用於推論，需 Discovery 驗證", url: "" }
  ]
};
