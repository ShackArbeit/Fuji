// 唯一資料來源。所有金額、案數、漏斗數字都由 calc.js 依此計算。
// 數字種子依 CLAUDE.md §4（已驗算）；調整需經 Shack 同意並更新 scripts/verify.mjs。
// 本檔不得 import 其他檔案（build 會移除 export 前綴後內嵌）。

export const DATA = {
  meta: {
    title: "2027 Q1 業績 500 萬達成規劃",
    target: 5_000_000,
    interviewDate: "2026-11-27",
    heroCaseId: "porite-delivery", // 主打：台灣保來得｜供應商交期追蹤（標準案）
    thesis: "我認為 Pre-Sale 找到潛在商機 & 發掘客戶需求是成功的關鍵"
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

  // A 版：從零 500 萬（共 10 案、561.6 萬；2026-11-20 新增公部門第 10 案）；每案對應一家具名客戶（見 Industry.md）
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
      { industry: "department",    type: "starter",  n: 1, caseId: "skm-concession" },
      { industry: "government",    type: "standard", n: 1, caseId: "ntpc-traffic-adjudication" } // 以決標／簽約日視同回簽
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
      { source: "new",      type: "starterLite", n: 1, caseId: "ginza-store-daily" },    // 入門包（最低授權組合：開發工具 + 半自動）24 萬
      { source: "new",      type: "standard",    n: 1, caseId: "tc-1999-petition" }      // 公部門標準案 50 萬（2026-11-22 新增）；以決標／簽約日視同回簽
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
      pitch: "客單高，但法遵與資安審查期長，Q1 新案不易回簽；以既有客戶擴充為主、新案長線經營。" },
    { id: "government",    name: "政府／公部門",   short: "公部門", role: "單點突破", abm: true,  score: { speed: 2, size: 3, ticket: 3, quantifiable: 4, resistance: 2 },
      pitch: "公文與案件作業量大、規則明確；同性質機關已有導入 RPA 的公開案例。1 月新年度預算可動用，但須走採購程序，以決標／簽約日視同回簽。" }
  ],

  scoreShort: { speed: "週期", size: "規模", ticket: "客單", quantifiable: "可量化", resistance: "低阻力" },

  scoreLabels: {
    speed: "成交週期",
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
      bundle: { dev: 1, semi: 1, days: 13 }, industries: ["manufacturing", "retail", "hightech", "government"],
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
      response: "賣授權與加購機器人、少賣人天；以教育訓練與顧問支援補位" },
    { id: "gov-procurement", title: "公部門採購時程延後", trigger: "預算未編列，或採購程序（報價、決標）拉長到 Q2", calc: "govDelay",
      response: "12 月先確認是否已編列預算；以公開取得報價等簡便程序進行；公部門案列為業績緩衝，不當主力" }
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
      title: "供應商交期追蹤 + 交期異常預警",
      background: [
        { text: "粉末冶金大廠，富士官網形容為全球前三大；2010 年起量產 SOFC 燃料電池連接板", sourceId: "fbtw-mfg" },
        { text: "報導指出 SOFC 連接板主要供應美商 Bloom Energy（約占營收四成），汽車引擎／變速箱粉末冶金件為第二大業務，並規劃產能倍增", sourceId: "porite-news" },
        { text: "富士既有客戶：kintone 處理請購、採購與不良品管制；Apeos 事務機由 130 台減至 30 台以下", sourceId: "fbtw-mfg" }
      ],
      challenge: [
        "產能倍增、料件多，交期延誤會影響下游客戶（國際車廠、SOFC／能源客戶）的交付節奏與排程",
        "許多製造業導入 kintone 後，追交期仍常是半人工：匯出未交單 → 寄信 → 讀回信 → 手動更新（待確認）",
        "系統邊界待確認：ERP 角色、主檔與介面權限未知，先以 kintone 為對接對象",
        "供應商回覆管道與格式多元（Email、EDI、電話、LINE），不能假設全部自動讀懂"
      ],
      toBe: [
        { actor: "robot", text: "每日從 kintone 抓未交貨採購單，依料件交期提前寄確認信（7 天為示範，長交期料件可設 14–30 天）" },
        { actor: "robot", text: "固定格式的回覆自動擷取交期，回填 kintone" },
        { actor: "robot", text: "非制式、模糊或未回覆者歸入「待人工確認」，產生交期異常預警清單" },
        { actor: "human", text: "採購確認異常、以電話／LINE 跟催，並提早與生管調整排程" }
      ],
      benefit: { count: 80, unit: "筆", per: "day", workDays: 21, minutes: 5, autoRate: 0.7,
        quality: "被動追單變主動預警：提早發現延遲、調整排程，降低缺料停線風險" },
      productType: "semi", estDays: 13,
      productNote: "半自動標準案；穩定後可升級全自動排程（第二階段）"
    },
    {
      id: "teco-drawing-sync", industry: "manufacturing", customer: "東元電機", customerSource: "fuji-other",
      title: "ECN 設變發行 → ERP 版次同步與通知",
      background: [
        { text: "1956 年成立，從馬達起家，擴展到重電、家電與資訊產品", sourceId: "fbtw-mfg" },
        { text: "富士既有客戶：DocuWorks 整合多格式設計檔，50 頁圖面處理由約 50 分鐘縮短到 5 分鐘內", sourceId: "fbtw-mfg" }
      ],
      challenge: [
        "DocuWorks 解決整理效率後，瓶頸可能移到「發行之後」：上傳文件庫、ERP 更新版次、寄信通知",
        "多品種、設變頻繁；用錯舊版圖面造成的報廢與重工，遠高於行政工時",
        "最痛的常是採購（發錯圖給供應商）、品保（拿舊圖驗收）與文管（每天手動上傳、改 ERP、寄信）",
        "待確認：是否已有 PLM／PDM 簽核；檔名或文件屬性是否標準化（掃描圖無文字層難讀取）"
      ],
      toBe: [
        { actor: "robot", text: "監看已核准資料夾／DocuWorks 工作區／PLM 匯出清單，依標準化檔名或文件屬性擷取圖號、版次、料號" },
        { actor: "robot", text: "登入 ERP 更新料號版次與圖面連結；讀不到或格式不符者轉人工" },
        { actor: "robot", text: "依料號寄設變通知給採購、生管、品保，附最新唯一版圖面" },
        { actor: "human", text: "在途訂單與半成品如何處置（直接切換、用完再換、報廢重工），由工程與生管判斷" }
      ],
      benefit: { count: 300, unit: "份圖面／ECN", per: "month", minutes: 15, autoRate: 0.8,
        quality: "消除核准到 ERP 同步的時間差與漏改風險：核准後幾分鐘內各部門都拿到最新唯一版本" },
      productType: "semi", estDays: 13,
      productNote: "半自動標準案；先鎖定當初導入 DocuWorks 的工程團隊所屬事業部試點，成功後再橫向擴散"
    },
    {
      id: "tpi-stock-alert", industry: "manufacturing", customer: "東培工業", customerSource: "new",
      title: "每日淨需求低庫存預警（延伸：盤點差異比對）",
      background: [
        { text: "全台最大軸承製造商，年產軸承約 3.5 億只；1966 年由東元電機、日本 NTN 等合資成立，以 TPI 自有品牌行銷全球", sourceId: "tpi-cna" },
        { text: "2016 年起推動智慧製造，導入 T-MES 即時掌握機台稼動與品質狀況", sourceId: "tpi-cna" },
        { text: "2026 年策略：深化南韓、印度等亞洲市場、穩守歐美；已切入新能源車供應鏈，並拓展航太、半導體等高端應用", sourceId: "tpi-ctee" }
      ],
      challenge: [
        "型號多（內外徑、保持器、防塵蓋不同即不同料號），標準品備庫生產；熱門規格斷貨會掉單，鋼材不足會讓熱處理、車削停線",
        "ERP 多半已有安全庫存／MRP 報表；缺的可能是每天撈表、扣掉在途採購與未交訂單算淨需求，再分送負責人",
        "已有 T-MES，也可能有 WMS 或條碼盤點：先用提問確認現況，不假設仍用 Excel",
        "年度盤點差異比對一年 1–2 次，當延伸場景，不當主軸"
      ],
      toBe: [
        { actor: "robot", text: "每日從 ERP 撈庫存、在途採購單、未交客戶訂單，算出淨需求低於安全庫存的料號" },
        { actor: "robot", text: "原料低庫存推播給採購、成品低庫存推播給生管（Email／通訊軟體）" },
        { actor: "robot", text: "延伸：年度盤點時比對系統帳與盤點表，產出差異清單" },
        { actor: "human", text: "倉管查盤差原因、主管決定是否調帳（RPA 不自動調帳）" }
      ],
      benefit: { count: 2, unit: "人次撈表算淨需求（採購、生管）", per: "day", workDays: 21, minutes: 60, autoRate: 0.8,
        quality: "缺料從事後發現變成每日預警；盤點期加班比對 Excel 是加分項" },
      productType: "semi", estDays: 13,
      productNote: "半自動標準案；主軸為每日低庫存預警，盤點差異比對為延伸場景"
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
      id: "ntpc-traffic-adjudication", industry: "government", customer: "新北市政府交通事件裁決處", customerSource: "new",
      title: "線上申辦案件收件入案 + 電子公文點收",
      background: [
        { text: "負責交通違規案件的收件審查、入案、裁罰、申訴與催收；內部設有案件管理、違規裁罰、違規申訴、積案催收等課室", sourceId: "ntpc-org" },
        { text: "2024 年線上申辦（申訴、罰單繳納、裁決書開立、駕照吊扣銷、退款申請等）達 84,975 件，較前一年增加 9,915 件", sourceId: "ntpc-news" },
        { text: "同類型案例：臺北市交通事件裁決所已導入 RPA 處理電子公文點收，報導估計每日省 1–2 小時（廠商相關報導）", sourceId: "tpe-adjudication" }
      ],
      challenge: [
        "線上申辦量逐年成長，收件後仍可能需人工審查、比對車號／駕照資料再入案",
        "每日電子公文需依課室、類型人工篩選點收；量大時易延誤或分錯",
        "裁決作業規則明確、格式固定，適合 RPA；但涉及裁罰判斷的部分必須保留人工"
      ],
      toBe: [
        { actor: "robot", text: "定時讀取線上申辦案件，比對車號、駕照等資料完整性" },
        { actor: "robot", text: "資料齊全者自動入案並分派課室；缺件者產生補件通知草稿" },
        { actor: "robot", text: "依課室、公文類型與標題篩選並點收電子公文" },
        { actor: "human", text: "承辦人審核申訴內容與裁罰判斷（不自動裁決）" }
      ],
      benefit: { count: 84975, unit: "件線上申辦", per: "year", minutes: 3, autoRate: 0.6,
        quality: "尖峰期不必加派人力；同類型機關（臺北市裁決所）已有導入先例，可降低決策阻力" },
      productType: "semi", estDays: 13,
      productNote: "標準案；以決標／簽約日視同回簽；金額低於採購公告金額門檻（程序待確認）"
    },
    {
      id: "tc-1999-petition", industry: "government", customer: "臺中市政府研究發展考核委員會", customerSource: "new",
      industryNote: "公部門（1999 臺中市民一碼通）",
      title: "1999 陳情申訴案件分案 + 逾期追蹤",
      background: [
        { text: "市府統計通報由研考會與主計處共同發布：115 年 1–4 月 1999 便民專線服務 262,406 件，較去年同期增加 8.23%；114 年全年 780,058 件", sourceId: "tc-1999" },
        { text: "同期「陳情申訴」43,140 件（占 16.44%），較去年同期增加 4,931 件（12.91%），是增量最多的項目；換算月均約 10,785 件", sourceId: "tc-1999" },
        { text: "同類型案例：臺北市交通事件裁決所已導入 RPA 處理電子公文點收（廠商相關報導）", sourceId: "tpe-adjudication" }
      ],
      challenge: [
        "陳情申訴量成長最快，受理後要依內容與權責分派到局處；量大時分案、改分容易延誤",
        "各局處回覆期限不同，逾期與即將逾期案件可能靠人工查詢系統再催辦",
        "每月統計與報表可能需從系統匯出再人工整理（以上皆需 Discovery 確認現行系統與分工）"
      ],
      toBe: [
        { actor: "robot", text: "定時讀取新進陳情案件，依關鍵字與分類規則產生建議承辦機關" },
        { actor: "human", text: "研考人員確認分案建議（涉權責爭議、陳情內容判斷不自動決定）" },
        { actor: "robot", text: "每日比對回覆期限，對即將逾期案件寄送提醒並產生催辦清單" },
        { actor: "robot", text: "每月自動匯出並整理件數、結案率、逾期率統計表草稿" }
      ],
      benefit: { count: 10785, unit: "件陳情申訴", per: "month", minutes: 3, autoRate: 0.5,
        quality: "分案與催辦時效一致，尖峰月份不必加派人力；統計報表可直接供施政考核使用" },
      productType: "semi", estDays: 13,
      productNote: "標準案；以決標／簽約日視同回簽；金額低於採購公告金額門檻（程序待確認）；避開個資外流：機器人在市府內網執行"
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
    { id: "tpi-cna", title: "中央社｜全台最大軸承製造商東培（2025-10）", summary: "年產軸承 3.5 億只；1966 年由東元、NTN 等合資；2016 年起推動智慧製造、導入 T-MES",
      urls: ["https://www.cna.com.tw/news/afe/202510070031.aspx"] },
    { id: "tpi-ctee", title: "工商時報｜東培多元布局精密軸承（2026-01）", summary: "數據化管理與 T-MES；2026 年深化南韓、印度市場；切入新能源車供應鏈，拓展航太、半導體",
      urls: ["https://www.ctee.com.tw/news/20260106701807-431203"] },
    { id: "skfiber-news", title: "1111、自由時報｜新光合纖", summary: "公司沿革、產品線、生產基地與減碳聚酯廠",
      urls: ["https://www.1111.com.tw/news/jobns/167846", "https://ec.ltn.com.tw/article/breakingnews/4767947"] },
    { id: "yuan-news", title: "Bella、蕃薯藤｜阿原", summary: "門市據點、官方商城、石門基地 GMP",
      urls: ["https://www.bella.tw/articles/skincare/51003/taiwan-skincare-yuan-yongkang-store-design", "https://n.yam.com/Article/20260310753158"] },
    { id: "yungda-news", title: "經濟日報｜永達保經", summary: "2025 新契約保費約 39 億元、2026 目標 60 億元",
      urls: ["https://money.udn.com/money/amp/story/5613/9306733"] },
    { id: "skm-news", title: "數位時代、旺得富｜新光三越", summary: "15 據點 20 館、2023 營業額約 945 億元、品牌大量汰換",
      urls: ["https://www.bnext.com.tw/article/78195/skm-2024-strategy", "https://wantrich.chinatimes.com/news/20260917900505-420501"] },
    { id: "ntpc-news", title: "Yahoo 股市｜新北交通違規裁決線上服務", summary: "2024 年線上申辦 84,975 件，較前一年增加 9,915 件",
      urls: ["https://tw.stock.yahoo.com/news/%E4%BA%A4%E9%80%9A-%E6%96%B0%E5%8C%97%E4%BA%A4%E9%80%9A%E9%81%95%E8%A6%8F%E8%A3%81%E6%B1%BA%E6%8F%90%E4%BE%9B%E7%B7%9A%E4%B8%8A%E6%9C%8D%E5%8B%99-2024%E5%B9%B4%E6%9C%8D%E5%8B%99%E9%87%8F%E6%BF%80%E5%A2%9E%E8%BF%91%E8%90%AC%E4%BB%B6-052726666.html"] },
    { id: "ntpc-org", title: "新北市政府人事處｜組織職掌資料", summary: "交通事件裁決處各課室職掌（案件管理、裁罰、申訴、催收）",
      urls: ["https://www.personnel.ntpc.gov.tw/userfiles/1190200/files/13-1_1150201.pdf"] },
    { id: "tc-1999", title: "臺中市統計通報｜1999 便民專線服務統計（115 年 6 月）", summary: "115 年 1–4 月服務 262,406 件、年增 8.23%；陳情申訴 43,140 件、年增 12.91%",
      urls: ["https://www.rdec.taichung.gov.tw/media/1421781/1999便民專線服務統計-114年度.pdf"] },
    { id: "tpe-adjudication", title: "科技新報｜臺北市交通事件裁決所導入 RPA", summary: "電子公文點收自動化，報導估計每日省 1–2 小時（廠商相關報導）",
      urls: ["https://technews.tw/?p=1370099"] },
    { id: "tpe-health", title: "INSIDE｜臺北市衛生局 RPA 抗疫", summary: "疫苗預約資料設定由七、八小時縮短到不到一小時（公部門導入背景參考）",
      urls: ["https://www.inside.com.tw/article/29933-UiPATH"] },
    { id: "benq-uipath", title: "INSIDE｜明基材料導入 UiPath", summary: "同仁自行開發，代表大廠自建能力強（高科技風險參考）",
      urls: ["https://www.inside.com.tw/article/35338-MetaAge"] },
    { id: "dept-share", title: "NOWnews｜2025 百貨市占", summary: "市場集中，前三為新光三越、遠東百貨、遠東 SOGO（ABM 參考）",
      urls: ["https://www.nownews.com/news/6866139"] },
    { id: "fbtw-position", title: "商業周刊廣編｜富士軟片資訊自述", summary: "約四分之一企業辦公室使用其事務機；紙本數位化 + RPA 雙軌（公司自述）",
      urls: ["https://www.businessweekly.com.tw/business/indep/1004443"] },
    { id: "rpa-md", title: "自備資料｜RPA.md", summary: "流程盤點與效益試算示範，非客戶實績", urls: [] }
  ]
};
