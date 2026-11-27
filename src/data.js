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

  // A 版：從零 500 萬（共 11 案、611.6 萬；2026-11-20 新增公部門第 10 案；2026-11-23 新增寶雅第 11 案）；每案對應一家具名客戶（見 Industry.md）
  versionA: {
    deals: [
      { industry: "manufacturing", type: "standard", n: 1, caseId: "porite-delivery" },
      { industry: "manufacturing", type: "standard", n: 1, caseId: "teco-drawing-sync" },
      { industry: "manufacturing", type: "standard", n: 1, caseId: "tpi-stock-alert" },
      { industry: "manufacturing", type: "flagship", n: 1, caseId: "skfiber-invoice-3way" },
      { industry: "retail",        type: "standard", n: 1, caseId: "yuan-omni-orders" },
      { industry: "retail",        type: "standard", n: 1, caseId: "greattree-pos-recon" }, // 2026-11-22 由銀座白石改為大樹藥局（量體與回本較成立）
      { industry: "retail",        type: "standard", n: 1, caseId: "poya-omo-pickup" },     // 2026-11-23 新增：補足保守版（只計回本成立）缺口
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

  // 回本試算假設（2026-11-22 Shack 同意：月薪 5 萬 × 1.3 雇主成本）；皆為試算假設，非客戶實績
  roi: {
    monthlySalary: 50_000, // 每人月薪
    loadFactor: 1.3,       // 雇主實際成本倍數（勞健保、勞退、年終）
    horizonMonths: 36,     // 淨效益計算期間（3 年；授權每 12 個月續約一次）
    paybackLimit: 18,      // 回本超過此月數，提出「同一套授權多流程攤提」
    maxFlows: 3            // 攤提試算最多幾個流程（第 2 個起每個以既有客戶擴充人天計價，效益假設與首個流程同量級）
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
        tasks: ["先從富士既有客戶找起：已經在用 RPA、事務機或文件系統的客戶，最好開口", "把名單分級：痛點明確、有預算的排最前面", "12 月就先約好 1 月的訪談，不要等過完年才開始排"] },
      { id: "disc",  label: "Discovery + Demo",   start: "2027-01-04", end: "2027-01-29",
        tasks: ["到客戶現場問清楚：一天幾筆、每筆做多久、多少要人工處理", "用標準範本 Demo，讓客戶當場看懂機器人會幫他做什麼", "挑出量大、規則清楚的流程來做 PoC"] },
      { id: "push",  label: "春節前簽核推進",       start: "2027-02-01", end: "2027-02-03",
        tasks: ["春節前先送出報價，讓客戶把預算排進年後的簽核", "確認誰拍板、誰簽字（部門主管、IT、採購）", "先約好年後一開工就跑 PoC"] },
      { id: "poc",   label: "PoC 與報價",           start: "2027-02-15", end: "2027-03-12",
        tasks: ["用客戶自己的真實資料跑 PoC，親眼看到能省多少時間", "建議收費 PoC、簽約時可抵扣，客戶會比較認真投入", "把 PoC 結果換算成每月省下的工時與回本時間，再出正式報價"] },
      { id: "close", label: "回簽衝刺",             start: "2027-03-08", end: "2027-03-31",
        tasks: ["每週追蹤法務、採購進度，卡在哪就主動協助排除", "在內部回簽目標日前，拿到主要案件的回簽報價單", "季末前留幾天緩衝，處理最後的用印與請款流程"] }
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
  // benefit = 效益試算假設（minutes＝人工處理一個 measure 的分鐘數；measure 預設取 unit 第一個字）：月工時 = count × minutes ÷ 60 × 每月次數（per: day×workDays／month×1／year÷12），節省 = 月工時 × autoRate
  cases: [
    {
      id: "porite-delivery", industry: "manufacturing", customer: "台灣保來得", customerSource: "fuji-other",
      title: "供應商交期追蹤 + 交期異常預警",
      background: [
        { text: "粉末冶金大廠，富士官網形容為全球前三大；2010 年起量產 SOFC 燃料電池連接板", sourceId: "fbtw-mfg" },
        { text: "報導指出 SOFC 連接板主要供應美商 Bloom Energy（約占營收四成），汽車引擎／變速箱粉末冶金件為第二大業務，並規劃產能倍增", sourceId: "porite-news" },
        { text: "富士既有客戶：kintone 處理請購、採購與不良品管制；Apeos 事務機由 130 台減至 30 台以下", sourceId: "fbtw-mfg" }
      ],
      plain: "保來得跟很多供應商買料。採購單下了之後，採購要一直確認「料會不會準時到」。現在的做法是從 kintone 撈出還沒交貨的單、寫信問供應商、等回信、再把交期打回系統。沒人發現延誤，產線就會缺料。",
      challenge: [
        "供應商、料件都多，採購要一直盯每張採購單的交貨進度，料才能準時到",
        "沒有統一追交期的方式，就得定期查未交單，再寄信、打電話一家家問",
        "供應商回了還要整理、更新系統，再追沒回的；資料一慢，生產排程就跟著延誤"
      ],
      toBe: [
        { actor: "robot", text: "採購每天點一下啟動，機器人從 kintone 找出未交貨的採購單，提前寄信問交期" },
        { actor: "robot", text: "請供應商改用 kintone 回覆表單；照表單回的，機器人讀出交期、填回系統" },
        { actor: "robot", text: "沒回、用電話或 LINE 回的，自動列進「交期異常清單」" },
        { actor: "human", text: "採購看清單打電話或 LINE 追，提早通知生管調整排程" }
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
      plain: "研發工程師修改設計圖、走完 ECN（設計變更通知）簽核後，文管或工程人員必須手動完成三個跨系統動作：① 把新版圖面傳進文件庫 → ② 進 ERP 把對應料號的圖面版次（例如從 A 版改成 B 版）更新 → ③ 發信通知採購、生管、品保切換新版。",
      challenge: [
        "設計、規格常因客戶需求或產品改良而變，要常發 ECN",
        "ECN 核准後，要人工更新文件庫和 ERP 的圖面版次，再通知採購、生管、品保",
        "更新或通知只要沒同步，各部門就可能拿不同版本的圖做事：採購買錯、規格不一，甚至報廢重工"
      ],
      toBe: [
        { actor: "robot", text: "文管每天點一下啟動，機器人抓出新核准圖面的圖號、版次、料號" },
        { actor: "robot", text: "自動登入 ERP 更新版次和圖面連結；讀不到的轉給人處理" },
        { actor: "robot", text: "寄設變通知給採購、生管、品保，附最新版圖面，舊版自動標記「作廢」" },
        { actor: "human", text: "已下單或做到一半的料件要怎麼處理，由工程與生管決定" }
      ],
      benefit: { count: 300, unit: "份圖面／ECN", per: "month", minutes: 15, autoRate: 0.8,
        quality: "用錯舊圖的報廢重工沒有數據，保守不計，工時是下限" },
      productType: "semi", estDays: 13,
      productNote: "半自動標準案；先在導入 DocuWorks 的事業部驗證，再複製到其他事業部（Q2 起擴充）",
      replicate: { days: 5, label: "其他事業部", unit: "事業部", maxCopies: 3, extraRobot: true, robotNote: "各事業部使用者不同，每處加購 1 個半自動" }
    },
    {
      id: "tpi-stock-alert", industry: "manufacturing", customer: "東培工業", customerSource: "new",
      title: "每日淨需求低庫存預警（延伸：盤點差異比對）",
      background: [
        { text: "全台最大軸承製造商，年產軸承約 3.5 億只；1966 年由東元電機、日本 NTN 等合資成立，以 TPI 自有品牌行銷全球", sourceId: "tpi-cna" },
        { text: "2016 年起推動智慧製造，導入 T-MES 即時掌握機台稼動與品質狀況", sourceId: "tpi-cna" },
        { text: "2026 年策略：深化南韓、印度，穩守歐美；已切入新能源車供應鏈，拓展航太、半導體", sourceId: "tpi-ctee" }
      ],
      plain: "東培做軸承，型號非常多。每天要知道哪些料快不夠了，算法是：手上庫存 + 已下單還沒到的（在途）− 已答應客戶還沒出的（未交訂單）＝ 真正可用的量。低於安全水位就要通知採購（原料）或生管（成品）。",
      challenge: [
        "軸承原料、零件規格非常多，每種料的庫存、交期、需求都不一樣",
        "生管、採購從 ERP 撈庫存，加減在途、未交訂單，算出實際可用量",
        "資料散在各單據報表，算起來繁瑣；低庫存晚發現，排程就受影響"
      ],
      roiNote: "先評估實際流程，可先導入 DocuWorks（品質文件）、kintone（請購、盤點表單），用一段時間再推 RPA",
      toBe: [
        { actor: "robot", text: "生管每天點一下啟動，機器人撈 ERP，找出快不夠的料號" },
        { actor: "robot", text: "原料不夠通知採購，成品不夠通知生管" },
        { actor: "robot", text: "延伸（不計效益）：年度盤點比對系統帳和盤點表" },
        { actor: "human", text: "盤點差異的原因由倉管查、主管決定要不要調帳" }
      ],
      benefit: { count: 2, unit: "人次撈表算淨需求（採購、生管）", measure: "人次", per: "day", workDays: 21, minutes: 60, autoRate: 0.8,
        quality: "缺料從事後發現變成每日預警；盤點期加班比對 Excel 是加分項" },
      pilotGoal: "缺料每日預警，降低停線與掉單風險",
      productType: "semi", estDays: 13,
      productNote: "半自動標準案；主軸為每日低庫存預警，盤點差異比對為延伸場景"
    },
    {
      id: "skfiber-invoice-3way", industry: "manufacturing", customer: "台灣新光合成纖維", customerSource: "fuji-other",
      short: "新光合纖",
      title: "供應商發票 OCR + 三方比對（旗艦）",
      background: [
        { text: "1967 年成立，隸屬新光集團；產品涵蓋 PET 粒、聚酯絲／棉、工程塑膠、薄膜與再生聚酯，生產基地含中壢、觀音、泰國、揚州", sourceId: "skfiber-news" },
        { text: "富士既有客戶：DocuWorks 整合採購文件與多種電子簽章格式（可串接 DocuSign、Adobe Sign）", sourceId: "fbtw-mfg" }
      ],
      plain: "付款給供應商之前，會計要做「三方比對」：發票、採購單、驗收單三份對起來，單價、數量、稅額都一致才付錢。一張採購單可能分好幾批交貨、開好幾張發票，會計要一張張對。",
      challenge: [
        "供應商多、分批交貨請款，一張採購單常對到多張發票和驗收單",
        "付款前，會計要逐筆對發票、採購單、收貨紀錄：品項、數量、單價、金額都一致才付",
        "格式不同、分批交貨或單據對不上，就得翻原始紀錄，找採購、倉庫或供應商確認，月底特別累"
      ],
      toBe: [
        { actor: "robot", text: "電子發票直接讀取；紙本和國外發票用 OCR 辨識" },
        { actor: "robot", text: "以採購單項次累計收貨和開票數量，分批交貨也對得起來；單價、稅額相符才標「可付款」" },
        { actor: "robot", text: "對不上的自動分給負責的人：價格問題給採購、數量問題給倉庫、發票開錯通知供應商重開" },
        { actor: "human", text: "會計確認後才付款，機器人不會自己付錢" }
      ],
      benefit: { count: 3000, unit: "張發票", per: "month", minutes: 4, autoRate: 0.8,
        quality: "付款前把關，減少溢付與重複付款；台灣成功後作為集團標竿複製到海外廠" },
      productType: "full", estDays: 30,
      productNote: "全自動＝高直通率（STP）：標準發票自動標記待付、異常件分流；延後可先半自動上線"
    },
    {
      id: "yuan-omni-orders", industry: "retail", customer: "阿原（YUAN）", customerSource: "new",
      title: "多通路訂單彙整 → ERP + 物流單號回填",
      background: [
        { text: "台灣手工皂與保養品牌，淡水、永康街、台南等地設有門市，並經營官方線上商城；momo 亦有販售", sourceId: "yuan-news" },
        { text: "自有製造：新北石門「北海明珠創生基地」2026 年 3 月取得化妝品 GMP 證明", sourceId: "yuan-news" }
      ],
      plain: "客人在官網、momo 下單，訂單散在各平台後台。員工每天要把訂單抓下來匯入 ERP，倉庫才知道要出什麼貨；出貨後再把物流單號填回平台，客人才查得到。組合包、贈品要拆成單品，庫存才扣得對。",
      challenge: [
        "官方商城、電商平台、門市同時經營，訂單和銷售資料散在不同系統",
        "每天從各平台下載訂單，整理品項、數量、贈品後匯入 ERP；出貨後再回填物流單號",
        "各平台格式和規則不一樣，碰到促銷、組合商品或贈品更繁瑣，也容易漏單、資料對不上"
      ],
      toBe: [
        { actor: "robot", text: "客服每天點一下啟動，機器人抓下各平台訂單，拆好組合與贈品，匯入 ERP" },
        { actor: "robot", text: "出貨後自動把物流單號填回各平台" },
        { actor: "robot", text: "和門市 POS 的銷售合併，每天產出全通路銷售與對帳報表" },
        { actor: "human", text: "取消、退款、地址有問題的，由客服處理，機器人不會自己退款" }
      ],
      benefit: { count: 150, unit: "筆訂單", per: "day", workDays: 30, minutes: 2, autoRate: 0.8,
        quality: "檔期爆單不必加派人手；不改各平台與 ERP 的 API 就能串起資料流" },
      productType: "semi", estDays: 13,
      productNote: "半自動標準案；先確認既有 OMS 串接範圍，通路超過 4 個時人天可能增加"
    },
    {
      id: "ginza-store-daily", industry: "retail", customer: "銀座白石", customerSource: "fuji-other",
      title: "門市銷售／庫存日報彙整",
      background: [
        { text: "日本集團旗下婚戒珠寶品牌，台灣 6 間分店，販售半訂製鑽戒、對戒與飾品", sourceId: "fbtw-retail" },
        { text: "富士既有客戶：原用試算表 + Email 彙總庫存，導入 Ragic 雲端資料庫後可即時查庫存、簽核電子化", sourceId: "fbtw-retail" }
      ],
      plain: "6 家店的婚戒品牌。每天要把各店 POS 銷售彙整給總部和會計；客製婚戒是「先付訂金 → 製作 → 交貨收尾款」，要追誰還沒付尾款、誰逾期沒來取。",
      challenge: [
        "台灣有好幾家門市，每天都有銷售和庫存異動，總部要掌握各店狀況",
        "銷售資料在各店 POS，總部要定期彙整，再和庫存、帳務對起來",
        "客製婚戒還有訂金、製作進度、尾款好幾個階段，沒有一致的追法，查詢和對帳就更花工夫"
      ],
      toBe: [
        { actor: "robot", text: "會計每天點一下啟動，機器人匯出各店 POS 銷售，寫進 Ragic 並核對庫存" },
        { actor: "robot", text: "自動比對訂金和尾款，列出還沒收尾款、逾期沒來取的訂製單" },
        { actor: "robot", text: "自動產出總部日報和會計入帳用的底稿" },
        { actor: "human", text: "特殊交易（訂金、尾款）由會計確認後才入帳" }
      ],
      benefit: { count: 6, unit: "店", per: "day", workDays: 26, minutes: 15, autoRate: 0.8,
        quality: "價值主張改為降低漏帳與客訴風險；量體小，先輕量訪談驗證再決定是否推進" },
      pilotGoal: "降低訂金尾款漏帳與客訴風險",
      productType: "semi", estDays: 13,
      productNote: "B 版：入門包（最低授權組合，客戶以 Ragic 能力自建）；含開發 50 萬僅供參考，量體驗證後再議",
      altDealType: "starterLite"
    },
    {
      id: "greattree-pos-recon", industry: "retail", customer: "大樹藥局", customerSource: "new",
      title: "門市 POS × 多元支付撥款對帳（含線上訂單門市取貨）",
      background: [
        { text: "連鎖藥局，2025 年底全台門市 428 家、2025 年營收約 188.9 億元；目標 2027 年 520 家、2030 年 700 家", sourceId: "greattree-fugle" },
        { text: "策略不是純零售電商，而是 OMO 的「精準健康交易平台」：2025 年建置完成，2026 年下半年起陸續公布營運數據", sourceId: "greattree-fugle" },
        { text: "2025 年 6 月底門市 407 家，年增約 14%；大型商圈據點導入寵物、自有品牌保健品等高毛利商品", sourceId: "greattree-uanalyze" }
      ],
      plain: "每家門市每天的營收裡，有一部分是刷卡、行動支付。這些錢不會當天進帳，支付業者過幾天才撥款，還會扣掉手續費。財務要逐店、逐一種支付方式確認「POS 記錄收了多少，支付業者就撥了多少」，有差異就要查。",
      challenge: [
        "門市多，收現金、刷卡、行動支付，各有不同的交易和撥款紀錄",
        "財務要把各店 POS 日結和刷卡、行動支付撥款明細對起來：金額、手續費、實際入帳是否一致",
        "門市和交易量一直增加，對帳量跟著變多；人工逐筆比對既花時間，也更晚發現漏帳或差異"
      ],
      toBe: [
        { actor: "robot", text: "財務每天點一下啟動，機器人下載刷卡、行動支付撥款和 POS 日結，逐店對帳" },
        { actor: "robot", text: "自動比對線上訂單和門市取貨，找出沒取件或金額不對" },
        { actor: "robot", text: "差異清單自動分給門市和財務，並產出全通路日報" },
        { actor: "human", text: "差異原因由財務確認後才調帳，機器人不會自己改帳" }
      ],
      benefit: { count: 428, unit: "店", per: "day", workDays: 30, minutes: 3, autoRate: 0.7,
        quality: "展店不必等比例增加對帳人力；差異隔天就知道，降低漏帳" },
      productType: "semi", estDays: 13,
      productNote: "總部集中操作，1 套授權涵蓋全部門市；先一區驗證再全開，不用加購"
    },
    {
      id: "poya-omo-pickup", industry: "retail", customer: "寶雅", customerSource: "new",
      title: "線上訂單門市取貨：到貨通知 + 逾期未取件追蹤",
      background: [
        { text: "2025 年底門市 470 店，長期目標 800 店；美妝店型 POYA Beauty 占比 2025 年 35%", sourceId: "poya-bnext" },
        { text: "電商 2025 前三季營收年增近五成、占營收約 2.2%；線上訂購門市取貨比例約五成", sourceId: "poya-fugle" },
        { text: "北、中、南三大物流中心，可支援約 720 家門市", sourceId: "poya-fugle" }
      ],
      plain: "客人在寶雅官網下單、選門市取貨（約一半訂單）。貨從物流中心送到門市後，要通知客人來取；超過期限沒取要再提醒，最後退回；客人來取時，門市在 POS 核銷。這幾件事分在不同系統，要人來回對。",
      challenge: [
        "網路下單可選門市取貨，訂單在電商、物流中心、門市間流轉",
        "貨到門市要更新狀態、通知取貨；逾期沒取還要追蹤、照規則退回",
        "訂單、物流、POS 核銷分在不同系統，要一直比對，免得到貨沒通知、取貨沒核銷"
      ],
      toBe: [
        { actor: "robot", text: "客服每天點一下啟動，機器人依到貨狀態更新訂單、通知客人來取" },
        { actor: "robot", text: "逾期沒取自動再提醒，還是沒來就列入退回清單" },
        { actor: "robot", text: "自動比對門市 POS 取件紀錄和線上訂單，找出沒核銷或金額不對的" },
        { actor: "human", text: "缺貨、換門市、退款由客服處理，機器人不會自己退款" }
      ],
      benefit: { count: 28000, unit: "筆店取訂單", per: "month", minutes: 1, autoRate: 0.7,
        countNote: "2.8 萬筆＝前三季營收 187 億 × 電商 2.2% ÷ 9 個月 × 店取五成 ÷ 客單約 800 元（假設）",
        quality: "店取量變多也不必等比例加人力；未取件提早追回" },
      productType: "semi", estDays: 13,
      productNote: "總部集中操作，1 套授權涵蓋全部門市；先一區驗證再全開，不用加購"
    },
    {
      id: "coretronic-quality-report", industry: "hightech", customer: "中強光電", customerSource: "fuji-other",
      title: "每日品質／測試報表彙整與異常通報（首期一條產線）",
      background: [
        { text: "台灣首家 LCD 背光模組廠，以投影機、顯示器與背光模組聞名，旗下有奧圖碼及多家中光電智能子公司", sourceId: "fbtw-it" },
        { text: "富士既有客戶：導入設備集中管理、影像備份（追蹤文件處理防個資外洩）與無紙化傳真", sourceId: "fbtw-it" }
      ],
      plain: "中強做投影機和背光模組。產線上有很多測試站，每台測試機會記錄每個產品過不過。品保工程師每天早會前，要把前一天各站的資料撈出來，用 Excel 算良率（合格數 ÷ 總數）、畫圖、寄給主管。",
      challenge: [
        "生產時各測試站和設備不斷產生品質數據，每天都要掌握良率和製程狀況",
        "品質工程師要從 MES 或各測試系統撈資料，用 Excel 整理、算良率、做圖表，再給主管和相關單位",
        "資料來源多、報表天天要更新，工程師時間花在整理報表，做品質分析、查異常原因的時間就被壓縮"
      ],
      toBe: [
        { actor: "robot", text: "工程師上班點一下啟動，機器人讀取前一天測試紀錄和 MES（只讀不改）" },
        { actor: "robot", text: "算好良率、做好圖表，早會前寄出" },
        { actor: "robot", text: "數字超標就馬上通知負責的工程師" },
        { actor: "human", text: "異常原因和怎麼處理，由工程師判斷" }
      ],
      benefit: { count: 5, unit: "份報表", per: "day", workDays: 21, minutes: 40, autoRate: 0.8,
        quality: "釋放工程師做真正的異常分析；稽核軌跡符合既有資安與防外洩規範" },
      productType: "semi", estDays: 13,
      productNote: "首期一條產線驗證；再複製到其他產線、廠區與子公司（如奧圖碼）",
      roiOverride: { laborMonthly: 80_000, note: "工程師含分紅" },
      replicate: { days: 5, label: "第 2 條產線", extraRobot: false, robotNote: "同一品保團隊操作，沿用授權" }
    },
    {
      id: "yungda-commission", industry: "finance", customer: "永達保險經紀人", customerSource: "new",
      title: "多家保險公司佣金明細對帳",
      background: [
        { text: "台灣大型保險經紀人公司；報導指出 2025 年新契約保費約 39 億元，2026 年目標 60 億元", sourceId: "yungda-news" }
      ],
      plain: "永達是保經公司，幫很多家保險公司賣保單，保險公司每月付佣金給永達。每家保險公司給的佣金明細格式都不一樣（Excel、PDF、欄位不同），財務要一家家下載，對照公司系統「應該收到」的佣金，看有沒有少給、扣錯，再發給業務員。",
      challenge: [
        "合作的保險公司多，每家依保單、商品和佣金規則給各自的明細",
        "財務要定期登入各家系統下載佣金報表，再和公司內部的保單、應收佣金資料對起來",
        "各家格式、欄位都不同，要人工整理、比金額、追差異；合作家數越多越吃力"
      ],
      toBe: [
        { actor: "robot", text: "先從格式固定、佣金量最大的 3–5 家保險公司做，把明細轉成同一種格式" },
        { actor: "robot", text: "PDF 明細用 OCR 辨識，沒把握的轉給人看" },
        { actor: "robot", text: "自動和公司應收的佣金比對，列出差異和要追討的清單" },
        { actor: "human", text: "財務確認後才入帳、發給業務員，機器人不會自己入帳" }
      ],
      benefit: { count: 20, unit: "家保險公司", per: "month", minutes: 180, autoRate: 0.8,
        quality: "價值在減少對帳出錯與漏追、縮短結算週期；效益以擴到 20 家計" },
      pilotGoal: "降低對帳出錯與漏追、縮短佣金結算週期",
      productType: "semi", estDays: 13,
      productNote: "先導模組（PoV）：首期 3–5 家，效益以同一套授權擴到 20 家計；需約定格式改版的維護範圍；金融資安審查期長，Q1 回簽有風險"
    },
    {
      id: "skm-concession", industry: "department", customer: "新光三越（單一館試點）", customerSource: "new",
      short: "新光三越",
      title: "專櫃營業額彙整 + 抽成試算",
      background: [
        { text: "台灣百貨龍頭之一，全台 15 個據點（20 館），2023 年營業額約 945 億元", sourceId: "skm-news" },
        { text: "品牌汰換頻繁，報導指出上半年完成 530 個品牌調整與替換", sourceId: "skm-news" }
      ],
      plain: "百貨大部分是專櫃。品牌在百貨裡賣東西，錢由百貨的 POS 收，月底百貨扣掉抽成再把錢付給品牌。每個品牌的抽成條件不同：基本抽成比例、保底、級距、週年慶折扣誰負擔。財務每月要一櫃一櫃算、出對帳單。",
      challenge: [
        "專櫃品牌多，各家合約不同：固定租金、營業額抽成、保底或級距",
        "每月結帳，財務要從 POS 拿各櫃銷售資料，再照每個品牌的合約算出應收租金和抽成",
        "合約和促銷條件各不相同，要人工確認條件、調整計算、核對金額，每月結帳很吃工夫"
      ],
      toBe: [
        { actor: "robot", text: "自動彙整單一館各櫃 POS 營業額，套用一般抽成先算好，產出對帳單草稿" },
        { actor: "robot", text: "保底、級距等條件常隨品牌換約改變，不寫進程式，只標記出來給人看" },
        { actor: "human", text: "財務核對特殊條件後才寄給品牌" }
      ],
      benefit: { count: 300, unit: "櫃", per: "month", minutes: 10, autoRate: 0.8,
        quality: "縮短每月關帳天數、減少算錯抽成的帳務爭議；驗證可複製到其他分館的模板" },
      productType: "semi", estDays: 10,
      productNote: "入門包：先拿一館試點；模板驗證後複製到其他分館",
      pilotGoal: "縮短關帳天數、減少抽成算錯爭議，驗證可複製的分館模板",
      replicate: { days: 5, label: "其他分館", unit: "館", maxCopies: 4, extraRobot: false, robotNote: "總部財務集中操作，沿用授權" }
    },
    {
      id: "ntpc-traffic-adjudication", industry: "government", customer: "新北市政府交通事件裁決處", customerSource: "new",
      short: "新北市交通裁決處",
      title: "線上申辦案件收件入案 + 電子公文點收",
      background: [
        { text: "負責交通違規案件的收件審查、入案、裁罰、申訴與催收；內部設有案件管理、違規裁罰、違規申訴、積案催收等課室", sourceId: "ntpc-org" },
        { text: "2024 年線上申辦（申訴、罰單繳納、裁決書開立、駕照吊扣銷、退款申請等）達 84,975 件，較前一年增加 9,915 件", sourceId: "ntpc-news" },
        { text: "同類型案例：臺北市交通事件裁決所已用 RPA 點收電子公文，報導估計每日省 1–2 小時", sourceId: "tpe-adjudication" }
      ],
      plain: "民眾在網路上申訴罰單、繳罰款、申請退款。裁決處收到後，承辦人要審查資料齊不齊、比對車號和駕照資料，再建成一筆案件（入案）。另外，每天收到的電子公文要人工分到負責的課室。",
      challenge: [
        "民眾可以在網路上申訴罰單、申請退款等，裁決處每天都有一定量的線上申辦案件",
        "線上申辦：收件後要確認資料齊不齊、核對車號、身分和附件，再依類型登錄、分案",
        "電子公文：每天大量公文要依業務分送課室；件數一多，檢查、登錄、分文就吃掉承辦人不少時間"
      ],
      toBe: [
        { actor: "robot", text: "承辦人憑證登入後，機器人批次讀申辦、比對車號駕照" },
        { actor: "robot", text: "資料齊全就入案；缺件產生補件通知，承辦人確認再寄" },
        { actor: "robot", text: "每天的電子公文，自動依課室和類型分好、點收" },
        { actor: "human", text: "申訴內容和裁罰由承辦人判斷，機器人不會自己裁決" }
      ],
      benefit: { count: 84975, unit: "件線上申辦", per: "year", minutes: 3, autoRate: 0.6,
        quality: "不增編制就能吸收年增近萬件、縮短申訴與退費天數；公文點收效益未計入（保守）" },
      productType: "semi", estDays: 13,
      productNote: "標準案；決標日視同回簽；低於公告金額門檻（待確認）"
    },
    {
      id: "tc-1999-petition", industry: "government", customer: "臺中市政府研究發展考核委員會", customerSource: "new",
      short: "臺中市研考會",
      industryNote: "公部門（1999 臺中市民一碼通）",
      title: "1999 陳情申訴案件分案 + 逾期追蹤",
      background: [
        { text: "市府統計通報（研考會、主計處）：115 年 1–4 月 1999 服務 262,406 件，年增 8.23%", sourceId: "tc-1999" },
        { text: "同期「陳情申訴」43,140 件（占 16.44%），較去年同期增加 4,931 件（12.91%），是增量最多的項目；換算月均約 10,785 件", sourceId: "tc-1999" },
        { text: "同類型案例：臺北市交通事件裁決所已用 RPA 點收電子公文", sourceId: "tpe-adjudication" }
      ],
      plain: "市民打 1999 或上網陳情（例如路燈壞了、噪音），研考會受理後要判斷這件事歸哪個局處管，分案過去，然後追蹤局處有沒有在期限內回覆，每月還要整理統計給首長。",
      challenge: [
        "1999 每天接到大量通報和陳情，內容橫跨各種業務，要分給對應的局處處理",
        "受理後，承辦人要讀內容、判斷權責單位再分案，之後還要追各局處的進度和回覆期限",
        "案件一多，閱讀、分類、分案跟著變多，還要定期整理逾期、催辦紀錄和統計，時間都花在重複管理上"
      ],
      toBe: [
        { actor: "robot", text: "AI 依關鍵字和過去派案紀錄建議承辦局處，機器人把建議填進系統（RPA + AI）" },
        { actor: "human", text: "研考人員確認後才分案；權責有爭議的，由人決定" },
        { actor: "robot", text: "自動列出快逾期、改分多次、展延的案件，提醒催辦" },
        { actor: "robot", text: "每月自動整理統計，產出給首長的月報草稿" }
      ],
      benefit: { count: 10785, unit: "件陳情申訴", per: "month", minutes: 3, autoRate: 0.5,
        quality: "分案與催辦時效一致；統計報表可直接供施政考核" },
      productType: "semi", estDays: 13,
      productNote: "50 萬屬公開取得報價／企劃書級距；或先拆 15 萬以下小額先導加快成案（待確認）"
    },
    {
      id: "lin-land-expansion", industry: "finance", customer: "林懇伶地政士事務所", customerSource: "fuji-rpa",
      short: "林懇伶地政士",
      industryNote: "專業服務（地政士）",
      title: "第二流程：謄本調閱 + 案件進度通知",
      background: [
        { text: "民國 71 年成立，服務上市建設公司、土地開發商與建築融資業者，每年平均約 4,000 件案件", sourceId: "fbtw-consult" },
        { text: "富士既有 RPA 客戶：資料登打導入 RPA + AI／OCR 後，流程由 5 個步驟簡化為 2 個步驟", sourceId: "fbtw-consult" }
      ],
      plain: "地政士幫建商、銀行辦土地和房屋登記（過戶、設定抵押）。送件到地政事務所後，要一直上地政系統查「辦到哪了」；登記完成後下載謄本（證明登記結果的文件），再通知建商或銀行。",
      challenge: [
        "資料登打已自動化；但案件量大，每件都還要盯地政機關辦理進度",
        "同仁要照案件清單一件件登入地政系統查狀態，登記完成後再調最新謄本、整理歸檔",
        "查完還要回報建商、銀行；案子一多，重複登入、查詢、下載、通知就吃掉大量行政時間"
      ],
      toBe: [
        { actor: "robot", text: "同仁插卡登入後，機器人依案件清單批次查進度" },
        { actor: "robot", text: "狀態變成「登記完畢」才下載謄本歸檔，不重複下載浪費規費" },
        { actor: "robot", text: "自動寄進度通知；大客戶要的指定格式報表也自動產出" },
        { actor: "human", text: "需要補正或狀態異常的，由地政士判斷處理" }
      ],
      benefit: { count: 4000, unit: "件案件", per: "year", minutes: 10, autoRate: 0.7,
        quality: "登記一完成就通知建商與銀行，掌握撥款與交屋時程；第一流程已見效，擴充阻力低" },
      productType: "semi", estDays: 15, existingLicense: true,
      productNote: "既有授權沿用（續約本來就在付，不計入本案），30 萬為一次性開發；未含後續維運費"
    },
    {
      id: "lens-dual-erp-recon", industry: "manufacturing", customer: "工業鏡頭廠（富士官網案例）", customerSource: "fuji-rpa",
      title: "第二流程：雙 ERP 同步異常每日監控 + 月結差異比對",
      background: [
        { text: "世界級工業鏡頭廠，美洲、歐洲、亞洲共 24 個據點；客戶名稱未公開，不臆測身分", sourceId: "fbtw-it" },
        { text: "富士既有 RPA 客戶：在地 ERP 單據同步到日本母公司 ERP，節省約 80% 訂單處理時間", sourceId: "fbtw-it" }
      ],
      plain: "這家鏡頭廠的台灣公司有自己的 ERP，日本母公司有另一套 ERP。台灣的單據要同步到日本那套，富士已經用 RPA 做好了（省約 80% 時間）。但同步偶爾會失敗，常常要到月底結帳、兩邊數字對不上才發現，得回頭翻一整個月的單據。",
      challenge: [
        "台灣和日本母公司各用一套 ERP，部分訂單和交易資料要在兩套系統間同步",
        "同步雖然已經自動化，但還是要有人定期檢查：兩邊的單據、數量、金額有沒有一致",
        "同步失敗沒即時發現，常拖到月結才集中查，得回頭比對大量舊單據，財務和倉管月結更吃力"
      ],
      toBe: [
        { actor: "robot", text: "會計每天點一下啟動，機器人檢查前一天同步紀錄，失敗或數量不對當天通知" },
        { actor: "robot", text: "月結前自動匯出兩邊的庫存和交易明細，產出差異報告" },
        { actor: "human", text: "差異原因由會計和倉管確認，機器人不會自己調帳" }
      ],
      benefit: { count: 1, unit: "次月結核對", measure: "次", per: "month", minutes: 960, autoRate: 0.8,
        quality: "同步異常當天發現，不必月底回頭追；月結提早 1–2 天" },
      pilotGoal: "同步異常當天發現、月結提早 1–2 天，降低兩套 ERP 的庫存差異",
      productType: "semi", estDays: 15, existingLicense: true,
      productNote: "既有授權沿用（續約不計入本案），30 萬為一次性開發；未含維運費"
    }
  ],

  // 額外手動假設（其餘由 calc.collectAssumptions() 自動彙整）
  assumptions: [
    { key: "poc-capacity", label: "PoC 團隊產能", value: "Q1 可同時支援的 PoC 場次需與主管確認", note: "Demo 用標準範本；PoC 用真實資料，建議付費並可抵扣" },
    { key: "warm-start", label: "暖名單啟動", value: "A 版以 12 月啟動暖名單為前提", note: "" },
    { key: "fte-hours", label: "1 人力當量", value: "每月 168 小時", note: "效益試算換算人力用" }
  ],

  // 資料來源（paraphrase 摘要；urls 可多個）
  // 卡片第 2 段「挑戰流程圖：現況困境 → 導入後」（2026-11-27 由 rpa-plan2.html 原樣搬入；節點文字不變，
  // ①②③ 改對應目前的挑戰）。皆為【推估】，需 Discovery 驗證。
  // asIs＝現況人工步驟（who＝誰在做；pain＝對應第幾條挑戰）；asIsOut＝現況結果；toBe＝導入後（solves＝解決第幾條）；toBeOut＝效果
  flows: {
    "porite-delivery": {
      asIs: [
        { who: "採購", text: "從 kintone 匯出未交單", pain: [2] },
        { who: "採購", text: "逐家寄信問交期", pain: [2] },
        { who: "採購", text: "讀 Email、LINE、電話回覆", pain: [3] },
        { who: "採購", text: "手動把交期打回系統", pain: [3] }
      ],
      asIsOut: { text: "延誤太晚發現，拖到下游出貨", pain: [3] },
      toBe: [
        { actor: "robot", text: "找出未交單，提前寄信問交期", solves: [2] },
        { actor: "robot", text: "讀表單回覆，交期填回 kintone", solves: [3] },
        { actor: "robot", text: "沒回、非表單回覆列進異常清單", solves: [3] },
        { actor: "human", text: "採購只追清單上的例外", solves: [1] }
      ],
      toBeOut: { text: "提早看到延誤，生管及早調排程" }
    },
    "teco-drawing-sync": {
      asIs: [
        { who: "工程", text: "設計變更圖面核准" },
        { who: "文管", text: "人工上傳文件庫", pain: [2] },
        { who: "文管", text: "登入 ERP 改版次", pain: [2] },
        { who: "文管", text: "寄信通知各部門", pain: [2] }
      ],
      asIsOut: { text: "時間差內有人拿舊圖：發錯圖、報廢重工", pain: [3] },
      toBe: [
        { actor: "robot", text: "抓出新核准圖面的圖號、版次、料號", solves: [2] },
        { actor: "robot", text: "自動更新 ERP 版次與圖面連結", solves: [2] },
        { actor: "robot", text: "通知各部門，舊版標記「作廢」", solves: [3] },
        { actor: "human", text: "在製料件怎麼處理，由工程與生管決定", solves: [3] }
      ],
      toBeOut: { text: "各部門幾分鐘內拿到唯一新版" }
    },
    "tpi-stock-alert": {
      asIs: [
        { who: "生管", text: "從 ERP 撈庫存報表", pain: [2] },
        { who: "生管", text: "另撈在途採購、未交訂單", pain: [2, 3] },
        { who: "生管", text: "用 Excel 手算真正缺多少", pain: [2] },
        { who: "生管", text: "一個個通知採購、生管", pain: [3] }
      ],
      asIsOut: { text: "缺料晚一步發現：掉單、停線", pain: [3] },
      toBe: [
        { actor: "robot", text: "撈庫存、在途、未交訂單", solves: [2, 3] },
        { actor: "robot", text: "算出快不夠的料號", solves: [2] },
        { actor: "robot", text: "原料通知採購、成品通知生管", solves: [3] },
        { actor: "human", text: "要不要補料、調排程，由採購與生管決定", solves: [] }
      ],
      toBeOut: { text: "缺料從事後發現變成每日預警" }
    },
    "skfiber-invoice-3way": {
      asIs: [
        { who: "會計", text: "收紙本、電子、國外發票" },
        { who: "會計", text: "人工登打紙本與國外發票", pain: [3] },
        { who: "會計", text: "逐張對採購單、驗收單", pain: [2] },
        { who: "會計", text: "分批交貨要回頭翻單", pain: [1, 3] },
        { who: "會計", text: "對不上打電話問各單位", pain: [3] }
      ],
      asIsOut: { text: "付款慢，且有溢付、重複付款風險", pain: [2, 3] },
      toBe: [
        { actor: "robot", text: "電子發票直讀，紙本與國外發票 OCR", solves: [3] },
        { actor: "robot", text: "依採購單項次累計比對三方", solves: [1, 2] },
        { actor: "robot", text: "相符標「可付款」，異常分派給負責人", solves: [3] },
        { actor: "human", text: "會計確認後才付款", solves: [] }
      ],
      toBeOut: { text: "會計只看例外，付款前把關" }
    },
    "yuan-omni-orders": {
      asIs: [
        { who: "客服", text: "到各平台後台下載訂單", pain: [1, 2] },
        { who: "客服", text: "手動拆組合品、贈品", pain: [3] },
        { who: "客服", text: "匯入 ERP", pain: [2] },
        { who: "客服", text: "出貨後回填物流單號", pain: [2] },
        { who: "客服", text: "和門市 POS 資料手動併報表", pain: [1] }
      ],
      asIsOut: { text: "檔期爆單：漏單、對不上", pain: [3] },
      toBe: [
        { actor: "robot", text: "抓各平台訂單，依對照表拆單", solves: [2, 3] },
        { actor: "robot", text: "匯入 ERP，出貨後回填單號", solves: [2] },
        { actor: "robot", text: "合併 POS，產出全通路報表", solves: [1] },
        { actor: "human", text: "取消、退款、地址問題由客服處理", solves: [] }
      ],
      toBeOut: { text: "檔期爆單也不必臨時加人" }
    },
    "ginza-store-daily": {
      asIs: [
        { who: "會計", text: "各店 POS 匯出銷售", pain: [2] },
        { who: "會計", text: "整理日報給總部與會計", pain: [2] },
        { who: "門市", text: "人工記訂金、尾款", pain: [3] },
        { who: "門市", text: "憑記憶追尾款與取件", pain: [3] }
      ],
      asIsOut: { text: "漏收尾款、逾期未取，引發客訴", pain: [3] },
      toBe: [
        { actor: "robot", text: "匯出 POS 銷售寫進 Ragic", solves: [2] },
        { actor: "robot", text: "比對訂金尾款，列出未收、逾期", solves: [3] },
        { actor: "robot", text: "產出總部日報與入帳底稿", solves: [2] },
        { actor: "human", text: "訂金、尾款由會計確認後入帳", solves: [] }
      ],
      toBeOut: { text: "不漏帳、不漏追，降低客訴" }
    },
    "greattree-pos-recon": {
      asIs: [
        { who: "財務", text: "下載各支付業者撥款明細", pain: [1, 2] },
        { who: "財務", text: "匯出各店 POS 日結", pain: [2] },
        { who: "財務", text: "逐店逐筆比對", pain: [2, 3] },
        { who: "財務", text: "線上訂單再跨系統對一次" }
      ],
      asIsOut: { text: "店越開越多，對帳人力等比例增加", pain: [3] },
      toBe: [
        { actor: "robot", text: "下載撥款明細與 POS 日結", solves: [1, 2] },
        { actor: "robot", text: "扣掉時間差與手續費，逐店對帳", solves: [2, 3] },
        { actor: "robot", text: "比對線上訂單與門市取貨", solves: [] },
        { actor: "human", text: "差異原因由財務確認才調帳", solves: [] }
      ],
      toBeOut: { text: "展店不必等比例增加對帳人力" }
    },
    "poya-omo-pickup": {
      asIs: [
        { who: "客服", text: "查物流到貨狀態", pain: [1] },
        { who: "客服", text: "通知客人來取貨", pain: [2] },
        { who: "客服", text: "追逾期未取件", pain: [2] },
        { who: "門市", text: "對 POS 核銷與線上訂單", pain: [3] }
      ],
      asIsOut: { text: "店取量越大，越容易漏通知、漏核銷", pain: [3] },
      toBe: [
        { actor: "robot", text: "依到貨狀態更新訂單、通知取貨", solves: [2] },
        { actor: "robot", text: "逾期再提醒，列入退回清單", solves: [2] },
        { actor: "robot", text: "比對 POS 取件紀錄與線上訂單", solves: [3] },
        { actor: "human", text: "缺貨、換店、退款由客服處理", solves: [] }
      ],
      toBeOut: { text: "店取量成長，不必等比例加人" }
    },
    "coretronic-quality-report": {
      asIs: [
        { who: "工程師", text: "到各測試站撈資料", pain: [2] },
        { who: "工程師", text: "用 Excel 算良率、做圖", pain: [2] },
        { who: "工程師", text: "早會前寄出報表", pain: [2] }
      ],
      asIsOut: { text: "報表一晚，產線異常就晚一步發現", pain: [3] },
      toBe: [
        { actor: "robot", text: "讀測試紀錄與 MES（只讀不改）", solves: [2] },
        { actor: "robot", text: "算良率、做好圖表", solves: [2] },
        { actor: "robot", text: "早會前寄出，標出異常站點", solves: [2] },
        { actor: "human", text: "異常原因與處置由工程師判斷", solves: [3] }
      ],
      toBeOut: { text: "工程師把時間花在根因分析" }
    },
    "yungda-commission": {
      asIs: [
        { who: "財務", text: "登入各保險公司下載明細", pain: [2] },
        { who: "財務", text: "各種格式手動整理", pain: [3] },
        { who: "財務", text: "對照公司應收佣金", pain: [2] },
        { who: "財務", text: "對不上回頭追", pain: [3] }
      ],
      asIsOut: { text: "業績成長，對帳人力越來越吃緊", pain: [3] },
      toBe: [
        { actor: "robot", text: "主力 3–5 家明細轉成同一格式", solves: [3] },
        { actor: "robot", text: "PDF 用 OCR，沒把握的轉人工", solves: [3] },
        { actor: "robot", text: "比對應收，列出差異與追討清單", solves: [2, 3] },
        { actor: "human", text: "財務確認後才入帳、發佣", solves: [] }
      ],
      toBeOut: { text: "不漏追，對帳量增加也撐得住" }
    },
    "skm-concession": {
      asIs: [
        { who: "財務", text: "POS 匯出各櫃營業額", pain: [2] },
        { who: "財務", text: "翻合約查抽成條件", pain: [1] },
        { who: "財務", text: "用 Excel 一櫃一櫃算", pain: [2] },
        { who: "財務", text: "出對帳單寄給品牌", pain: [3] }
      ],
      asIsOut: { text: "算錯就要跟品牌來回溝通", pain: [3] },
      toBe: [
        { actor: "robot", text: "彙整單一館各櫃營業額", solves: [2] },
        { actor: "robot", text: "套一般抽成，產出對帳單草稿", solves: [2] },
        { actor: "robot", text: "保底、級距等特殊條件只標記", solves: [1, 3] },
        { actor: "human", text: "財務核對特殊條件後才寄出", solves: [3] }
      ],
      toBeOut: { text: "關帳更快，抽成爭議更少" }
    },
    "ntpc-traffic-adjudication": {
      asIs: [
        { who: "承辦人", text: "逐件開線上申辦", pain: [2] },
        { who: "承辦人", text: "比對車號、駕照資料", pain: [2] },
        { who: "承辦人", text: "手動入案", pain: [2] },
        { who: "承辦人", text: "缺件一封封寫補件通知", pain: [2] },
        { who: "承辦人", text: "電子公文一件件分課室", pain: [3] }
      ],
      asIsOut: { text: "案件逐年增加，處理天數拉長", pain: [3] },
      toBe: [
        { actor: "robot", text: "承辦人登入後，批次讀申辦、比對", solves: [2] },
        { actor: "robot", text: "齊全就入案，缺件產生通知草稿", solves: [2] },
        { actor: "robot", text: "電子公文依課室分好、點收", solves: [3] },
        { actor: "human", text: "申訴與裁罰由承辦人判斷", solves: [] }
      ],
      toBeOut: { text: "不增編制，也能吸收案件增量" }
    },
    "tc-1999-petition": {
      asIs: [
        { who: "研考", text: "讀陳情內容", pain: [2] },
        { who: "研考", text: "判斷該分給哪個局處", pain: [2] },
        { who: "局處", text: "分錯退回、改分", pain: [2] },
        { who: "研考", text: "人工追逾期、催辦", pain: [3] },
        { who: "研考", text: "人工整理首長月報", pain: [3] }
      ],
      asIsOut: { text: "量一大，分案延誤，民眾等更久", pain: [3] },
      toBe: [
        { actor: "robot", text: "AI 建議承辦局處，機器人填進系統", solves: [2] },
        { actor: "human", text: "研考人員確認後才分案", solves: [2] },
        { actor: "robot", text: "列出快逾期、多次改分的案件", solves: [2, 3] },
        { actor: "robot", text: "產出首長月報草稿", solves: [3] }
      ],
      toBeOut: { text: "分案與催辦時效一致" }
    },
    "lin-land-expansion": {
      asIs: [
        { who: "同仁", text: "插卡登入地政系統" },
        { who: "同仁", text: "逐件查進度（一件查好幾次）", pain: [2] },
        { who: "同仁", text: "登記完畢後下載謄本", pain: [2] },
        { who: "同仁", text: "一封封通知建商、銀行", pain: [3] }
      ],
      asIsOut: { text: "同仁大半時間花在查進度、回報進度", pain: [3] },
      toBe: [
        { actor: "robot", text: "同仁登入後，批次查案件進度", solves: [2] },
        { actor: "robot", text: "登記完畢才下載謄本，不重複下載", solves: [2] },
        { actor: "robot", text: "自動寄通知，產出大客戶指定報表", solves: [3] },
        { actor: "human", text: "補正、狀態異常由地政士處理", solves: [] }
      ],
      toBeOut: { text: "登記一完成，建商和銀行馬上知道" }
    },
    "lens-dual-erp-recon": {
      asIs: [
        { who: "系統", text: "兩套 ERP 背景自動同步" },
        { who: "系統", text: "同步失敗，沒有人發現", pain: [3] },
        { who: "會計", text: "月結對不上才察覺", pain: [3] },
        { who: "會計", text: "回頭翻一整個月單據", pain: [3] },
        { who: "會計", text: "人工核對兩邊庫存與金額", pain: [2] }
      ],
      asIsOut: { text: "月結拖長，中間庫存數字失真", pain: [3] },
      toBe: [
        { actor: "robot", text: "每天檢查前一天同步紀錄", solves: [2] },
        { actor: "robot", text: "失敗或數量不對，當天通知", solves: [3] },
        { actor: "robot", text: "月結前自動產出差異報告", solves: [2, 3] },
        { actor: "human", text: "差異原因由會計與倉管確認", solves: [] }
      ],
      toBeOut: { text: "異常不過夜，月結提早完成" }
    }
  },

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
    { id: "greattree-fugle", title: "富果｜大樹藥局法說會重點（2026-03，AI 摘要）", summary: "2025 年底門市 428 家、營收約 188.9 億；2027 年目標 520 家；精準健康交易平台 2025 年建置完成",
      urls: ["https://blog.fugle.tw/post/earnings-call-6469-2026-03-26"] },
    { id: "greattree-uanalyze", title: "優分析｜大樹藥局展店年增 14%（2025-07）", summary: "2025 年 6 月底門市 407 家、上半年營收年增 12%；商圈據點導入高毛利商品",
      urls: ["https://uanalyze.com.tw/articles/6847825635"] },
    { id: "poya-bnext", title: "數位時代｜寶雅 2025 年報解析（2026-02）", summary: "2025 年底達 470 店、目標 800 店；POYA Beauty 店型占比 35%；營收與純益連三年新高",
      urls: ["https://www.bnext.com.tw/article/90144/poya-2025fiscalreport"] },
    { id: "poya-fugle", title: "富果｜寶雅法說會重點（2025-10／12，AI 摘要）", summary: "電商前三季年增近五成、占營收 2.2%；門市取貨比例約五成；三大物流中心可支援 720 店",
      urls: ["https://blog.fugle.tw/post/earnings-call-5904-2025-12-22", "https://blog.fugle.tw/post/earnings-call-5904-2025-10-30"] },
    { id: "dept-share", title: "NOWnews｜2025 百貨市占", summary: "市場集中，前三為新光三越、遠東百貨、遠東 SOGO（ABM 參考）",
      urls: ["https://www.nownews.com/news/6866139"] },
    { id: "fbtw-position", title: "商業周刊廣編｜富士軟片資訊自述", summary: "約四分之一企業辦公室使用其事務機；紙本數位化 + RPA 雙軌（公司自述）",
      urls: ["https://www.businessweekly.com.tw/business/indep/1004443"] },
    { id: "rpa-md", title: "自備資料｜RPA.md", summary: "流程盤點與效益試算示範，非客戶實績", urls: [] }
  ]
};
