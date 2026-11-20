// 唯一資料來源。所有金額、案數、漏斗數字都由 calc.js 依此計算。
// 數字種子依 CLAUDE.md §4（已驗算）；調整需經 Shack 同意並更新 scripts/verify.mjs。
// 本檔不得 import 其他檔案（build 會移除 export 前綴後內嵌）。

export const DATA = {
  meta: {
    title: "2027 Q1 業績 500 萬達成規劃",
    target: 5_000_000,
    interviewDate: "2026-11-27",
    heroCaseId: "porite-delivery", // 主打：台灣保來得｜供應商交期追蹤（標準案）
    thesis: "這個職位的關鍵，是先找到產業既定流程裡的痛點；計價、業績拆解與漏斗回推，則用來證明這份規劃有數字、可執行。"
  },

  price: { dev: 176_000, semi: 64_000, full: 400_000, day: 20_000 },

  // 標準案拆解：授權 24 萬 + 13 人天 26 萬 = 50 萬
  standardCase: { semiCount: 1, devToolCount: 1, days: 13 },

  // 案型（供組合器與 A/B 使用）；days 為假設
  dealTypes: {
    starter:     { label: "入門包",               fullAuto: false, days: 10 },  // 24 萬授權 + 10 人天 = 44 萬（A 版百貨用）
    starterLite: { label: "入門包（最低授權組合）", fullAuto: false, days: 0 },   // 開發工具 + 半自動 = 24 萬（必要組合，不含開發；B 版新客用）
    standard:    { label: "標準案",               fullAuto: false, days: 13 },  // 50 萬
    flagship:    { label: "全自動旗艦",           fullAuto: true,  days: 30 },  // 57.6 萬授權 + 60 萬 = 117.6 萬
    expansion:   { label: "既有客戶擴充（純人天）", fullAuto: false, days: 15, noLicense: true } // 30 萬
  },

  // A 版：從零 500 萬（共 9 案、511.6 萬）；每案對應一家具名客戶（見 Industry.md）
  versionA: {
    deals: [
      { industry: "manufacturing", type: "standard", n: 1, caseId: "porite-delivery" },
      { industry: "manufacturing", type: "standard", n: 1, caseId: "teco-drawing-sync" },
      { industry: "manufacturing", type: "standard", n: 1, caseId: "tpi-stock-alert" },
      { industry: "manufacturing", type: "flagship", n: 1, caseId: "skfiber-invoice-3way" },
      { industry: "retail",        type: "standard", n: 1, caseId: "yuan-omni-orders" },
      { industry: "retail",        type: "standard", n: 1, caseId: "ginza-store-daily" },
      { industry: "hightech",      type: "standard", n: 1, caseId: "coretronic-quality-report" },
      { industry: "finance",       type: "standard", n: 1, caseId: "yungda-commission" },
      { industry: "department",    type: "starter",  n: 1, caseId: "skm-concession" }
    ]
  },

  // B 版：續約 + 新增
  versionB: {
    renewalBase: 4_000_000,
    renewalRate: 0.95,                  // 基準情境（假設）；UI 可調 85%–100%
    renewalRange: [0.85, 1.0],
    sensitivityRates: [1.0, 0.95, 0.9, 0.85],
    deals: [
      { source: "existing", type: "expansion",   n: 1, caseId: "lin-land-expansion" },   // 既有 RPA 客戶擴充 30 萬
      { source: "existing", type: "expansion",   n: 1, caseId: "lens-dual-erp-recon" },  // 既有 RPA 客戶擴充 30 萬
      { source: "new",      type: "standard",    n: 1, caseId: "porite-delivery" },      // 新 RPA 客戶標準案 50 萬
      { source: "new",      type: "starterLite", n: 1, caseId: "ginza-store-daily" }     // 入門包（最低授權組合：開發工具 + 半自動）24 萬
    ]
  },

  // 漏斗假設（全部為「假設」，UI 需標示）
  funnel: {
    leadToOpp: 0.20,        // 名單 → 有效商機
    oppToPoc:  0.50,        // 商機 → Demo/PoC
    pocToWin:  0.50,        // PoC → 回簽
    existingOppToWin: 0.60, // 既有客戶擴充：商機 → 回簽
    coverageTarget: 4,      // 商機加權覆蓋倍數（目標 3–4 倍）
    abmAccounts: [10, 15]   // 百貨／金融 ABM 鎖定家數
  },

  // score 為主觀假設（1–5，resistance 越高代表阻力越低）；pitch 為推論，需 Discovery 驗證
  industries: [
    { id: "manufacturing", name: "製造業供應鏈",   short: "製造",   role: "主攻",       abm: false, score: { speed: 4, size: 5, ticket: 4, quantifiable: 5, resistance: 4 },
      pitch: "跨 ERP、Email、Excel 的重複作業多，效益容易量化；富士既有文件方案客戶多（保來得、東元、新纖），RPA 是它們數位化的下一步，交叉銷售成交最快。" },
    { id: "retail",        name: "傳統零售／電商", short: "零售",   role: "副攻",       abm: false, score: { speed: 4, size: 4, ticket: 2, quantifiable: 4, resistance: 4 },
      pitch: "多通路、多門市的資料搬運量大、決策快；客單偏低，以標準案與入門包為主。" },
    { id: "hightech",      name: "高科技",         short: "高科技", role: "選擇性",     abm: false, score: { speed: 2, size: 3, ticket: 5, quantifiable: 3, resistance: 2 },
      pitch: "客單潛力高，但大廠常有自建 RPA 團隊；切入點是授權與特定報表流程，少賣人天。" },
    { id: "department",    name: "百貨",           short: "百貨",   role: "單點 ABM",   abm: true,  score: { speed: 3, size: 1, ticket: 3, quantifiable: 4, resistance: 3 },
      pitch: "市場集中、家數少，適合鎖定少數目標的 ABM；以專櫃營業額與抽成結算切入。" },
    { id: "finance",       name: "金融／保險",     short: "金融",   role: "長線／擴充", abm: true,  score: { speed: 1, size: 2, ticket: 5, quantifiable: 4, resistance: 1 },
      pitch: "客單高，但法遵與資安審查期長，Q1 新案不易回簽；以既有客戶擴充為主、新案長線經營。" }
  ],

  scoreShort: { speed: "速度", size: "規模", ticket: "客單", quantifiable: "可量化", resistance: "低阻力" },

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
    otherHolidays: ["2027-01-01", "2027-03-01"], // 暫定：元旦、228 補假（以公告為準）
    signTargetDate: "2027-03-25", // 內部回簽目標（距季末 6 天緩衝；2026-11-20 由 3/20 改為 3/25）
    phases: [
      { id: "warm",  label: "暖名單啟動（Q1 前）", start: "2026-12-01", end: "2026-12-31",
        tasks: ["盤點既有客戶與暖名單", "名單分級，預約 1 月 Discovery"] },
      { id: "disc",  label: "Discovery + Demo",   start: "2027-01-04", end: "2027-01-29",
        tasks: ["訪談：筆數、工時、例外比例", "標準範本 Demo，篩選 PoC 流程"] },
      { id: "push",  label: "春節前簽核推進",       start: "2027-02-01", end: "2027-02-03",
        tasks: ["送出報價、確認預算", "鎖定簽核關係人"] },
      { id: "poc",   label: "PoC 與報價",           start: "2027-02-15", end: "2027-03-12",
        tasks: ["真實資料 PoC（建議付費可抵扣）", "效益試算與正式報價"] },
      { id: "close", label: "回簽衝刺",             start: "2027-03-08", end: "2027-03-31",
        tasks: ["追蹤法務／採購流程", "內部回簽目標日前完成主要案件"] }
    ]
  },

  // 特定情境／產品組合攻略（§7-8）；bundle 為「這一筆」報價內容，人天為假設
  scenarios: [
    { id: "starter", title: "入門包首購", when: "第一次接觸 RPA、預算未編列，先證明一個流程有效",
      bundle: { dev: 1, semi: 1, days: 10 }, alt: { label: "最低授權組合（開發工具＋半自動，客戶自行開發）", bundle: { dev: 1, semi: 1, days: 0 } },
      industries: ["department", "retail"], note: "降低首購門檻，之後以人天擴充第二個流程" },
    { id: "standard", title: "標準案", when: "流程明確、每日筆數多、跨兩套以上系統",
      bundle: { dev: 1, semi: 1, days: 13 }, industries: ["manufacturing", "retail", "hightech"],
      note: "業績主力；Discovery 先確認筆數、工時、例外比例" },
    { id: "full-upgrade", title: "全自動升級", when: "既有半自動流程已穩定，需要無人值守排程（夜間批次、每日報表）",
      bundle: { full: 1, days: 15 }, industries: ["manufacturing", "finance"],
      note: "客戶已有開發工具，只加購全自動機器人與人天" },
    { id: "expansion", title: "既有客戶純人天擴充", when: "既有客戶已有授權，想把機器人用到第二、第三個流程",
      bundle: { days: 15 }, industries: ["manufacturing", "finance"],
      note: "不需新授權採購流程，回簽速度快" },
    { id: "renewal-plus", title: "續約 + 加購", when: "年約到期續約時，順勢盤點新流程",
      bundle: { semi: 1, days: 5 }, industries: ["manufacturing", "retail", "finance"], addOnRenewal: true,
      note: "金額為續約以外的加購部分" }
  ],

  // 風險與備援（§7-9）；calc 指定影響試算方式
  risks: [
    { id: "flagship-delay", title: "全自動旗艦延後", trigger: "新纖三方比對例外多、客戶內部審查拉長", calc: "flagshipDelay",
      response: "以標準案補位；旗艦改為分階段（先半自動上線，Q2 升級全自動）" },
    { id: "renewal-drop", title: "續約率下滑", trigger: "既有客戶預算縮減或流程停用", calc: "renewalDrop", rate: 0.9,
      response: "續約前 60 天盤點使用率；以既有客戶擴充 + 新客標準案補缺口" },
    { id: "poc-capacity", title: "PoC 產能不足", trigger: "同時進行的 PoC 超過團隊可支援場次", calc: "pocLoad",
      response: "Demo 用標準範本；PoC 只給高意願案件，採付費可抵扣" },
    { id: "hightech-diy", title: "高科技大廠自建能力強", trigger: "客戶已有 RPA 團隊，傾向自行開發", calc: "licenseOnly",
      response: "賣授權與加購機器人、少賣人天；以教育訓練與顧問支援補位" }
  ],

  // 資訊標示（取代原證據等級）：每一段內容標明可信度
  infoTags: {
    fact:   "公開事實",   // 有公開來源（富士官網、新聞、公司官網）
    guess:  "推估",       // 依產業常見痛點 × 該公司營運型態推論，需 Discovery 驗證
    assume: "試算假設"    // 效益數字為假設，非客戶實績
  },

  // 客戶來源
  customerSources: {
    "fuji-rpa":   "富士既有 RPA 客戶",
    "fuji-other": "富士既有客戶（非 RPA）",
    "new":        "集團外新客"
  },

  // 具名客戶案例卡片（內容來源：Industry.md）。
  // background = 公開事實（附 sourceId）；challenge = 推估；toBe = 解決方案（human = 人工覆核點）；
  // benefit = 效益試算假設：月工時 = count × minutes ÷ 60 × 每月次數（per: day×workDays／month×1／year÷12），節省 = 月工時 × autoRate
  cases: [
    {
      id: "porite-delivery", industry: "manufacturing", customer: "台灣保來得", customerSource: "fuji-other",
      title: "供應商交期追蹤",
      background: [
        { text: "粉末冶金大廠，富士官網形容為全球前三大；2010 年起量產 SOFC 燃料電池連接板", sourceId: "fbtw-mfg" },
        { text: "報導指出 SOFC 連接板主要供應美商 Bloom Energy（約占營收四成），汽車引擎／變速箱粉末冶金件為第二大業務，並規劃產能倍增", sourceId: "porite-news" },
        { text: "富士既有客戶：kintone 處理請購、採購與不良品管制；Apeos 事務機由 130 台減至 30 台以下", sourceId: "fbtw-mfg" }
      ],
      challenge: [
        "產能倍增、料件多（粉末原料、模具、外包加工），交期延誤直接影響出貨給國際車廠",
        "請購、採購已上 kintone，但「追交期」可能仍是：匯出未交單 → 逐家寄信 → 讀回信 → 手動更新",
        "資料已數位化、規則明確，正是 RPA 最容易接手的一段"
      ],
      toBe: [
        { actor: "robot", text: "每日抓取未交貨採購單，對 7 天內到期項目批次寄送交期確認信" },
        { actor: "robot", text: "擷取回覆交期，回填 kintone／ERP" },
        { actor: "robot", text: "標記逾期與未回覆項目" },
        { actor: "human", text: "採購只處理延後、未回覆的異常，並與生管協調排程" }
      ],
      benefit: { count: 80, unit: "筆", per: "day", workDays: 21, minutes: 5, autoRate: 0.7,
        quality: "逾期提早 7 天預警，降低缺料停線風險" },
      productType: "semi", estDays: 13,
      productNote: "半自動標準案；穩定後可升級全自動排程（第二階段）"
    },
    {
      id: "teco-drawing-sync", industry: "manufacturing", customer: "東元電機", customerSource: "fuji-other",
      title: "工程圖面發行 → ERP 料號同步與通知",
      background: [
        { text: "1956 年成立，從馬達起家，擴展到重電、家電與資訊產品", sourceId: "fbtw-mfg" },
        { text: "富士既有客戶：DocuWorks 整合多格式設計檔，50 頁圖面處理由約 50 分鐘縮短到 5 分鐘內", sourceId: "fbtw-mfg" }
      ],
      challenge: [
        "圖面數位化後，瓶頸移到「發行之後」：上傳文件庫、ERP 更新料號版次、寄信通知各部門",
        "料號多、版次變更頻繁，人工更新易漏改，造成用錯舊版圖面"
      ],
      toBe: [
        { actor: "robot", text: "監看已核准資料夾，讀取圖號、版次、料號" },
        { actor: "robot", text: "登入 ERP 更新料號版次與圖面連結" },
        { actor: "robot", text: "依料號寄送變更通知給採購、生管、品保" },
        { actor: "human", text: "變更影響在途訂單或庫存時，由工程與生管判斷" }
      ],
      benefit: { count: 300, unit: "份圖面／ECN", per: "month", minutes: 15, autoRate: 0.8,
        quality: "版次錯誤歸零；延伸既有 DocuWorks 投資" },
      productType: "semi", estDays: 13,
      productNote: "半自動標準案；與既有 DocuWorks 串接"
    },
    {
      id: "tpi-stock-alert", industry: "manufacturing", customer: "東培工業", customerSource: "new",
      title: "安全庫存警示 + 盤點差異比對",
      background: [
        { text: "主要製造銷售滾動軸承與碳鉻鋼珠；與日本 NTN 合作，自稱東南亞最大軸承製造商之一", sourceId: "tpi-reg" },
        { text: "規模：員工約 950 人、實收資本額約 12.57 億元（資料年份較早，待更新）", sourceId: "tpi-reg" }
      ],
      challenge: [
        "軸承規格、料號多，原料鋼材與成品都要控管安全庫存，常靠經驗或週報才發現低庫存",
        "1 月年度盤點後，帳面與實盤差異要用 Excel 逐料號比對"
      ],
      toBe: [
        { actor: "robot", text: "每日匯出 ERP 庫存，比對安全庫存設定" },
        { actor: "robot", text: "寄送低庫存清單給採購與倉管" },
        { actor: "robot", text: "盤點期比對盤點表與帳面，產出差異清單" },
        { actor: "human", text: "倉管確認盤差原因，主管決定是否調帳（不自動調帳）" }
      ],
      benefit: { count: 6, unit: "人天（2 人 × 3 天）", per: "month", minutes: 480, autoRate: 0.75,
        quality: "Q1 正逢年度盤點，是切入時機" },
      productType: "semi", estDays: 13,
      productNote: "半自動標準案"
    },
    {
      id: "skfiber-invoice-3way", industry: "manufacturing", customer: "台灣新光合成纖維", customerSource: "fuji-other",
      title: "供應商發票 OCR + 三方比對（旗艦）",
      background: [
        { text: "1967 年成立，隸屬新光集團；產品涵蓋 PET 粒、聚酯絲／棉、工程塑膠、薄膜與再生聚酯，生產基地含中壢、觀音、泰國、揚州", sourceId: "skfiber-news" },
        { text: "富士既有客戶：DocuWorks 整合採購文件與多種電子簽章格式（可串接 DocuSign、Adobe Sign）", sourceId: "fbtw-mfg" }
      ],
      challenge: [
        "原料與耗材供應商多、發票量大，會計須比對發票、採購單、收貨單三份資料",
        "有差異就在採購、倉庫、供應商之間來回確認；採購文件已數位化，代表資料拿得到"
      ],
      toBe: [
        { actor: "robot", text: "收取發票並以 OCR 擷取欄位" },
        { actor: "robot", text: "從 ERP 取得採購單與收貨紀錄，三方比對" },
        { actor: "robot", text: "相符項目標記待付款；差異自動分派採購／倉儲" },
        { actor: "human", text: "會計確認後才放行付款（不自動付款）" }
      ],
      benefit: { count: 3000, unit: "張發票", per: "month", minutes: 4, autoRate: 0.8,
        quality: "付款前把關，減少溢付與重複付款" },
      productType: "full", estDays: 30,
      productNote: "全自動旗艦（含 OCR 與例外處理）；延後時可先半自動上線"
    },
    {
      id: "yuan-omni-orders", industry: "retail", customer: "阿原（YUAN）", customerSource: "new",
      title: "多通路訂單彙整 → ERP + 物流單號回填",
      background: [
        { text: "台灣手工皂與保養品牌，淡水、永康街、台南等地設有門市，並經營官方線上商城；momo 亦有販售", sourceId: "yuan-news" },
        { text: "自有製造：新北石門「北海明珠創生基地」2026 年 3 月取得化妝品 GMP 證明", sourceId: "yuan-news" }
      ],
      challenge: [
        "官網、電商平台、門市訂單分散在多個後台，每天分別下載、轉成 ERP 格式",
        "出貨後要把物流單號逐筆貼回各平台；檔期活動訂單暴增時易延遲出錯"
      ],
      toBe: [
        { actor: "robot", text: "定時下載各通路訂單，轉成 ERP 格式匯入" },
        { actor: "robot", text: "出貨後回填物流單號到各平台" },
        { actor: "robot", text: "產出每日各通路銷售彙整" },
        { actor: "human", text: "客服處理取消、退款、地址異常（不自動退款）" }
      ],
      benefit: { count: 150, unit: "筆訂單", per: "day", workDays: 30, minutes: 2, autoRate: 0.8,
        quality: "檔期不必加派人手，出貨延遲減少" },
      productType: "semi", estDays: 13,
      productNote: "半自動標準案；通路超過 4 個時人天可能增加"
    },
    {
      id: "ginza-store-daily", industry: "retail", customer: "銀座白石", customerSource: "fuji-other",
      title: "門市銷售／庫存日報彙整",
      background: [
        { text: "日本集團旗下婚戒珠寶品牌，台灣 6 間分店，販售半訂製鑽戒、對戒與飾品", sourceId: "fbtw-retail" },
        { text: "富士既有客戶：原用試算表 + Email 彙總庫存，導入 Ragic 雲端資料庫後可即時查庫存、簽核電子化", sourceId: "fbtw-retail" }
      ],
      challenge: [
        "庫存已上雲，但每日銷售日報可能仍要人工：POS 匯出 → 對應 Ragic 庫存 → 整理給總部與會計",
        "婚戒訂製有「訂金 → 製作 → 尾款」時間差，對帳較複雜"
      ],
      toBe: [
        { actor: "robot", text: "每晚匯出各店 POS 銷售，寫入 Ragic 並比對庫存異動" },
        { actor: "robot", text: "產出總部日報與會計分錄底稿" },
        { actor: "human", text: "會計確認訂金、尾款等特殊交易後才入帳" }
      ],
      benefit: { count: 6, unit: "店", per: "day", workDays: 26, minutes: 15, autoRate: 0.8,
        quality: "重點是日報準時、帳實一致；B 版可只賣最低授權組合（開發工具＋半自動）讓客戶自建" },
      productType: "semi", estDays: 13,
      productNote: "A 版含開發；B 版改賣入門包（最低授權組合：開發工具＋半自動，不含開發）",
      altDealType: "starterLite"
    },
    {
      id: "coretronic-quality-report", industry: "hightech", customer: "中強光電", customerSource: "fuji-other",
      title: "每日品質／測試報表彙整與異常通報（首期）",
      background: [
        { text: "台灣首家 LCD 背光模組廠，以投影機、顯示器與背光模組聞名，旗下有奧圖碼及多家中光電智能子公司", sourceId: "fbtw-it" },
        { text: "富士既有客戶：導入設備集中管理、影像備份（追蹤文件處理防個資外洩）與無紙化傳真", sourceId: "fbtw-it" }
      ],
      challenge: [
        "測試站多，品質工程師每天先從 MES／測試系統匯出資料、用 Excel 做良率報表再寄出",
        "大廠常有自建 IT 能力，切入點選「單一報表、唯讀系統」的小範圍首期"
      ],
      toBe: [
        { actor: "robot", text: "唯讀擷取前一日測試資料（不寫回生產系統）" },
        { actor: "robot", text: "產出良率／不良分類報表" },
        { actor: "robot", text: "超出門檻時通報負責工程師" },
        { actor: "human", text: "工程師判斷異常原因與處置" }
      ],
      benefit: { count: 5, unit: "份報表", per: "day", workDays: 21, minutes: 40, autoRate: 0.8,
        quality: "釋放工程師做真正的異常分析" },
      productType: "semi", estDays: 13,
      productNote: "首期半自動驗證；後續以加購機器人授權為主，少賣人天"
    },
    {
      id: "yungda-commission", industry: "finance", customer: "永達保險經紀人", customerSource: "new",
      title: "多家保險公司佣金明細對帳",
      background: [
        { text: "台灣大型保險經紀人公司；報導指出 2025 年新契約保費約 39 億元，2026 年目標 60 億元", sourceId: "yungda-news" }
      ],
      challenge: [
        "代理多家保險公司商品，各家佣金明細格式不同（Excel、PDF、系統下載）",
        "每月人工整理成統一格式、與應收佣金比對，差異逐家追討；業績成長代表對帳量跟著上升"
      ],
      toBe: [
        { actor: "robot", text: "首期 3–5 家：收取明細、辨識格式轉統一欄位" },
        { actor: "robot", text: "與內部應收佣金比對，標記差異並產出追討清單" },
        { actor: "human", text: "財務確認差異後才入帳、分配業務員佣金" }
      ],
      benefit: { count: 20, unit: "家保險公司", per: "month", minutes: 180, autoRate: 0.8,
        quality: "月結提早 2–3 天，業務員佣金發放更準時" },
      productType: "semi", estDays: 13,
      productNote: "半自動標準案（首期）；金融資安審查期長，Q1 回簽有風險"
    },
    {
      id: "skm-concession", industry: "department", customer: "新光三越（單一館試點）", customerSource: "new",
      title: "專櫃營業額彙整 + 抽成試算",
      background: [
        { text: "台灣百貨龍頭之一，全台 15 個據點（20 館），2023 年營業額約 945 億元", sourceId: "skm-news" },
        { text: "品牌汰換頻繁，報導指出上半年完成 530 個品牌調整與替換", sourceId: "skm-news" }
      ],
      challenge: [
        "專櫃多、各品牌合約抽成條件不同（保底、級距、檔期折扣分攤）",
        "每月從 POS 匯出營業額、對照合約用 Excel 試算、產出對帳單；品牌常汰換，條件常變"
      ],
      toBe: [
        { actor: "robot", text: "彙整單一館各櫃 POS 營業額" },
        { actor: "robot", text: "套用合約抽成規則試算，產出對帳單草稿" },
        { actor: "human", text: "財務覆核保底、檔期分攤等特殊條件後才寄出" }
      ],
      benefit: { count: 300, unit: "櫃", per: "month", minutes: 10, autoRate: 0.8,
        quality: "試點成功可複製到其他館（ABM 擴充故事）" },
      productType: "semi", estDays: 10,
      productNote: "入門包：先拿一館試點"
    },
    {
      id: "lin-land-expansion", industry: "finance", customer: "林懇伶地政士事務所", customerSource: "fuji-rpa",
      industryNote: "專業服務（地政士）",
      title: "第二流程：謄本調閱 + 案件進度通知",
      background: [
        { text: "民國 71 年成立，服務上市建設公司、土地開發商與建築融資業者，每年平均約 4,000 件案件", sourceId: "fbtw-consult" },
        { text: "富士既有 RPA 客戶：資料登打導入 RPA + AI／OCR 後，流程由 5 個步驟簡化為 2 個步驟", sourceId: "fbtw-consult" }
      ],
      challenge: [
        "第一個流程（資料登打）已自動化；每件案子仍要多次上地政系統查進度、調謄本，再通知客戶",
        "案件量逐年增加，這段仍是人工"
      ],
      toBe: [
        { actor: "robot", text: "每日依案件清單查詢進度、下載最新謄本並歸檔" },
        { actor: "robot", text: "狀態變更時寄送進度通知給客戶窗口" },
        { actor: "human", text: "登記補正、異常狀態由地政士判斷處理" }
      ],
      benefit: { count: 4000, unit: "件案件", per: "year", minutes: 10, autoRate: 0.7,
        quality: "客戶已看到第一個機器人的效益，擴充阻力低" },
      productType: "semi", estDays: 15, existingLicense: true,
      productNote: "既有授權沿用，純人天擴充"
    },
    {
      id: "lens-dual-erp-recon", industry: "manufacturing", customer: "工業鏡頭廠（富士官網案例）", customerSource: "fuji-rpa",
      title: "第二流程：雙 ERP 月結庫存差異比對",
      background: [
        { text: "世界級工業鏡頭廠，美洲、歐洲、亞洲共 24 個據點；客戶名稱未公開，不臆測身分", sourceId: "fbtw-it" },
        { text: "富士既有 RPA 客戶：在地 ERP 單據同步到日本母公司 ERP，節省約 80% 訂單處理時間", sourceId: "fbtw-it" }
      ],
      challenge: [
        "單據已同步，但月結時兩套 ERP 的庫存與金額可能仍需人工核對",
        "任一筆同步失敗都會造成差異，月結時才發現"
      ],
      toBe: [
        { actor: "robot", text: "月結前匯出兩邊庫存與交易明細" },
        { actor: "robot", text: "比對差異並產出差異報告" },
        { actor: "human", text: "會計與倉管確認差異原因、決定調整" }
      ],
      benefit: { count: 1, unit: "次月結核對（約 16 小時）", per: "month", minutes: 960, autoRate: 0.8,
        quality: "月結提早 1–2 天" },
      productType: "semi", estDays: 15, existingLicense: true,
      productNote: "既有授權沿用，純人天擴充"
    }
  ],

  // 額外手動假設（其餘由 calc.collectAssumptions() 自動彙整）
  assumptions: [
    { key: "poc-capacity", label: "PoC 團隊產能", value: "Q1 可同時支援的 PoC 場次需與主管確認", note: "Demo 用標準範本；PoC 用真實資料，建議付費並可抵扣" },
    { key: "warm-start", label: "暖名單啟動", value: "A 版以 12 月啟動暖名單為前提", note: "" },
    { key: "fte-hours", label: "1 人力當量", value: "每月 168 小時", note: "效益試算換算人力用" }
  ],

  // 資料來源（paraphrase 摘要；urls 可多個）
  sources: [
    { id: "fbtw-mfg", title: "富士官網｜製造業案例", summary: "台灣保來得、東元電機、台灣新光合成纖維（文件與流程方案）",
      urls: ["https://www.fujifilm.com/fbtw/zh-tw/solutions/case-studies/manufacturing"] },
    { id: "fbtw-it", title: "富士官網｜IT 案例", summary: "中強光電（設備管理）；工業鏡頭廠（RPA 雙 ERP 同步，省約 80% 時間）",
      urls: ["https://www.fujifilm.com/fbtw/zh-tw/solutions/case-studies/it"] },
    { id: "fbtw-retail", title: "富士官網｜零售案例", summary: "銀座白石 6 店，Ragic 雲端庫存與電子簽核",
      urls: ["https://www.fujifilm.com/fbtw/zh-tw/solutions/case-studies/retail"] },
    { id: "fbtw-consult", title: "富士官網｜專業服務案例", summary: "林懇伶地政士事務所，RPA + AI／OCR，流程 5 步驟變 2 步驟",
      urls: ["https://www.fujifilm.com/fbtw/zh-tw/solutions/case-studies/consultancy"] },
    { id: "porite-news", title: "經濟日報、工商時報｜台灣保來得", summary: "SOFC 連接板供應 Bloom Energy、產能倍增與擴廠",
      urls: ["https://money.udn.com/money/story/8521/8954654", "https://www.ctee.com.tw/news/20240823700194-439901"] },
    { id: "tpi-reg", title: "公司登記資料｜東培工業", summary: "軸承與鋼珠製造；員工與資本額資料年份較早",
      urls: ["https://twincn.com/item.aspx?no=07220508"] },
    { id: "skfiber-news", title: "1111、自由時報｜新光合纖", summary: "公司沿革、產品線、生產基地與減碳聚酯廠",
      urls: ["https://www.1111.com.tw/news/jobns/167846", "https://ec.ltn.com.tw/article/breakingnews/4767947"] },
    { id: "yuan-news", title: "Bella、蕃薯藤｜阿原", summary: "門市據點、官方商城、石門基地 GMP",
      urls: ["https://www.bella.tw/articles/skincare/51003/taiwan-skincare-yuan-yongkang-store-design", "https://n.yam.com/Article/20260310753158"] },
    { id: "yungda-news", title: "經濟日報｜永達保經", summary: "2025 新契約保費約 39 億元、2026 目標 60 億元",
      urls: ["https://money.udn.com/money/amp/story/5613/9306733"] },
    { id: "skm-news", title: "數位時代、旺得富｜新光三越", summary: "15 據點 20 館、2023 營業額約 945 億元、品牌大量汰換",
      urls: ["https://www.bnext.com.tw/article/78195/skm-2024-strategy", "https://wantrich.chinatimes.com/news/20260917900505-420501"] },
    { id: "benq-uipath", title: "INSIDE｜明基材料導入 UiPath", summary: "同仁自行開發，代表大廠自建能力強（高科技風險參考）",
      urls: ["https://www.inside.com.tw/article/35338-MetaAge"] },
    { id: "dept-share", title: "NOWnews｜2025 百貨市占", summary: "市場集中，前三為新光三越、遠東百貨、遠東 SOGO（ABM 參考）",
      urls: ["https://www.nownews.com/news/6866139"] },
    { id: "fbtw-position", title: "商業周刊廣編｜富士軟片資訊自述", summary: "約四分之一企業辦公室使用其事務機；紙本數位化 + RPA 雙軌（公司自述）",
      urls: ["https://www.businessweekly.com.tw/business/indep/1004443"] },
    { id: "rpa-md", title: "自備資料｜RPA.md", summary: "流程盤點與效益試算示範，非客戶實績", urls: [] }
  ]
};
