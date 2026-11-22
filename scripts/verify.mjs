// 驗算 data.js + calc.js，並掃描禁止事項（CLAUDE.md §9）。失敗以 exit 1 結束。
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { DATA } = await import(pathToFileURL(join(root, "src/data.js")));
globalThis.DATA = DATA; // calc.js 以全域 DATA 運作（與瀏覽器內嵌一致）
const C = await import(pathToFileURL(join(root, "src/calc.js")));

const failures = [];
const results = [];
function check(name, actual, expected, cmp = (a, e) => a === e) {
  const ok = cmp(actual, expected);
  results.push({ name, actual, ok });
  if (!ok) failures.push(`${name}：實際 ${JSON.stringify(actual)}，預期 ${JSON.stringify(expected)}`);
}
const near = tol => (a, e) => Math.abs(a - e) <= tol;
function assert(name, cond) {
  if (!cond) failures.push(name);
}

// ---- 1. §4 預期驗算表 ----
check("標準案金額", C.standardCaseAmount(), 500_000);
check("標準案 = dealAmount(standard)", C.dealAmount("standard"), 500_000);
check("全自動旗艦", C.dealAmount("flagship"), 1_176_000);
check("入門包（10 人天）", C.dealAmount("starter"), 440_000);
check("入門包（最低授權組合：開發工具 + 半自動）", C.dealAmount("starterLite"), 240_000);
check("既有客戶擴充（15 人天）", C.dealAmount("expansion"), 300_000);

const A = C.versionATotal();
// 2026-11-20 Shack 同意：A 版新增公部門第 10 案（新北市交通事件裁決處），取代 CLAUDE.md §4 的 9 案／5,116,000 種子值
check("A 版合計", A.total, 5_616_000);
check("A 版案數", A.count, 10);
assert("A 版未達目標", A.total >= DATA.meta.target);

const B = C.versionBTotal(0.95);
check("B 版續約（95%）", B.renewal, 3_800_000);
check("B 版新增金額", B.newTotal, 1_840_000);
check("B 版合計", B.total, 5_640_000); // 2026-11-22 Shack 同意新增公部門案（臺中市研考會 1999）；原 4 案 5,140,000
check("B 版新增案數", B.count, 5);

const FA = C.funnelA();
check("A 漏斗 PoC", FA.byKey.poc.ceil, 20);
check("A 漏斗 有效商機", FA.byKey.opp.ceil, 40);
check("A 漏斗 名單", FA.byKey.lead.ceil, 200);
check("A 覆蓋倍數 ≈ 4.49", Math.round(FA.coverage * 100) / 100, 4.49);

const FB = C.funnelB();
check("B 擴充商機（未進位）", FB.existing.byKey.opp.raw, 10 / 3, near(1e-9));
check("B 擴充商機（進位）", FB.existing.byKey.opp.ceil, 4);
check("B 新客商機", FB.fresh.byKey.opp.ceil, 12);
check("B 新客名單", FB.fresh.byKey.lead.ceil, 60);

const expSens = new Map([[1.0, [1_000_000, 2]], [0.95, [1_200_000, 3]], [0.9, [1_400_000, 3]], [0.85, [1_600_000, 4]]]);
for (const s of C.renewalSensitivity()) {
  const [gap, n] = expSens.get(s.rate);
  check(`敏感度 ${Math.round(s.rate * 100)}% 缺口`, s.gap, gap);
  check(`敏感度 ${Math.round(s.rate * 100)}% 約需標準案`, s.standardCases, n);
}

// 組合器 / 正推 一致性
check("組合器預設 = 標準案", C.configure({}).total, 500_000);
check("組合器 旗艦流程（30 人天全自動）", C.configure({ caseId: "skfiber-invoice-3way" }).total, 1_176_000);
check("組合器 既有授權沿用（純人天 15）", C.configure({ caseId: "lin-land-expansion" }).total, 300_000);
check("組合器 加購 1 半自動差距", C.configure({ extraSemi: 1 }).diffFromStandard, 64_000);
const fw = C.funnelForward({ leads: FA.byKey.lead.ceil });
check("正推 200 名單 → 成交案數", fw.wins, 10, near(1e-9));
check("正推金額 = A 版合計", Math.round(fw.amount), A.total);

// 調整轉換率後漏斗須同步（funnelA 接受覆寫值）
const FA2 = C.funnelA({ ...DATA.funnel, leadToOpp: 0.1 });
check("轉換率覆寫：名單 10% → 名單需求加倍", FA2.byKey.lead.ceil, 400);

// ---- 1b. 衍生計算（M1–M4 新增；數值由資料推導並經人工驗算）----
const WD = C.workingDays();
check("Q1 有效工作天（1/1–3/25，扣週末、春節空窗、元旦、228 補假）", WD.days, 51);
check("回簽目標距季末天數", WD.bufferDays, 6);
const FD = C.flagshipDelayImpact();
check("旗艦延後：剩餘金額", FD.without, 4_440_000);
check("旗艦延後：缺口", FD.shortfall, 560_000);
check("旗艦延後：約需標準案", FD.standardCases, 2);
const R90 = C.renewalSensitivity([0.9])[0];
check("續約 90%：扣已規劃新增後仍差", R90.shortfall, 0);
check("續約 90%：再加標準案", R90.extraStandardCases, 0);
const R85 = C.renewalSensitivity([0.85])[0];
check("續約 85%：已規劃新增足夠", R85.shortfall, 0);
const R100 = C.renewalSensitivity([1.0])[0];
check("續約 100%：已規劃新增足夠", R100.shortfall, 0);
const PL = C.pocLoad();
check("PoC 期週數", Math.round(PL.weeks * 100) / 100, 3.71);
check("PoC 每週場次", Math.round(PL.perWeek * 10) / 10, 5.4);
const GD = C.govDelayImpact();
check("公部門延後：剩餘金額", GD.without, 5_116_000);
check("公部門延後：仍達標（缺口 0）", GD.shortfall, 0);
check("公部門延後（B 版）：剩餘金額", GD.b.without, 5_140_000);
check("公部門延後（B 版）：仍達標（缺口 0）", GD.b.shortfall, 0);
const SA = Object.fromEntries(C.scenarioAmounts().map(s => [s.id, s]));
check("情境：入門包首購", SA.starter.main.total, 440_000);
check("情境：入門包最低授權組合", SA.starter.alt.total, 240_000);
check("情境：標準案", SA.standard.main.total, 500_000);
check("情境：全自動升級（全自動 + 15 人天）", SA["full-upgrade"].main.total, 700_000);
check("情境：純人天擴充", SA.expansion.main.total, 300_000);
check("情境：續約 + 加購（半自動 + 5 人天）", SA["renewal-plus"].main.total, 164_000);
check("情境標準案 = 標準案金額", SA.standard.main.total, C.standardCaseAmount());
check("情境入門包 = 案型 starter", SA.starter.main.total, C.dealAmount("starter"));
check("情境擴充 = 案型 expansion", SA.expansion.main.total, C.dealAmount("expansion"));
check("fmtWan(5,116,000)", C.fmtWan(5_116_000), "511.6 萬");
check("fmtWan(5,140,000)", C.fmtWan(5_140_000), "514 萬");

// ---- 2. 卡片完整性 ----
// 具名客戶卡片（Industry.md）：五段式欄位齊全
const ids = new Set();
const industryIds = new Set(DATA.industries.map(i => i.id));
const custSources = new Set(Object.keys(DATA.customerSources));
for (const c of DATA.cases) {
  assert(`卡片 id 重複：${c.id}`, !ids.has(c.id)); ids.add(c.id);
  assert(`卡片 ${c.id} 缺 customer`, typeof c.customer === "string" && c.customer.length > 0);
  assert(`卡片 ${c.id} customerSource 無效`, custSources.has(c.customerSource));
  assert(`卡片 ${c.id} 缺背景（公開事實）`, Array.isArray(c.background) && c.background.length > 0);
  assert(`卡片 ${c.id} 背景每點都要有來源`, c.background.every(b => b.text && b.sourceId));
  assert(`卡片 ${c.id} 缺挑戰（推估）`, Array.isArray(c.challenge) && c.challenge.length > 0);
  assert(`卡片 ${c.id} 缺 human 覆核點`, Array.isArray(c.toBe) && c.toBe.some(s => s.actor === "human"));
  assert(`卡片 ${c.id} 缺效益假設`, c.benefit && ["day", "month", "year"].includes(c.benefit.per) && c.benefit.autoRate > 0 && c.benefit.autoRate <= 1);
  assert(`卡片 ${c.id} 日計效益需有 workDays`, c.benefit.per !== "day" || c.benefit.workDays > 0);
  assert(`卡片 ${c.id} 缺 estDays`, Number.isFinite(c.estDays) && c.estDays > 0);
  assert(`卡片 ${c.id} productType 無效`, ["semi", "full"].includes(c.productType));
  assert(`卡片 ${c.id} 產業不存在`, industryIds.has(c.industry));
}
assert("heroCaseId 不存在於 cases", ids.has(DATA.meta.heroCaseId));

// A／B 版每案都對應一家客戶，且卡片報價 = 案型金額（避免卡片與業績表矛盾）
for (const d of DATA.versionA.deals) {
  assert(`A 版產業不存在：${d.industry}`, industryIds.has(d.industry));
  assert(`A 版 caseId 不存在：${d.caseId}`, ids.has(d.caseId));
  if (ids.has(d.caseId)) {
    check(`A 版卡片報價一致：${d.caseId}`, C.configure({ caseId: d.caseId }).total, C.dealAmount(d.type));
    assert(`A 版產業與卡片不符：${d.caseId}`, DATA.cases.find(c => c.id === d.caseId).industry === d.industry);
  }
}
for (const d of DATA.versionB.deals) {
  assert(`B 版 caseId 不存在：${d.caseId}`, ids.has(d.caseId));
  const c = DATA.cases.find(x => x.id === d.caseId);
  if (!c) continue;
  if (d.type === "expansion") {
    assert(`B 版擴充案須為富士既有 RPA 客戶：${d.caseId}`, c.customerSource === "fuji-rpa");
    check(`B 版擴充卡片報價一致：${d.caseId}`, C.configure({ caseId: d.caseId }).total, C.dealAmount("expansion"));
  }
  if (d.type === "standard") check(`B 版標準案卡片報價一致：${d.caseId}`, C.configure({ caseId: d.caseId }).total, C.dealAmount("standard"));
  if (d.type === "starterLite") assert(`B 版最低授權組合案卡片須標 altDealType：${d.caseId}`, c.altDealType === "starterLite");
}

// 效益試算（Industry.md 第 2–7 節）
const expSaved = {
  "porite-delivery": 98, "teco-drawing-sync": 60, "tpi-stock-alert": 33.6, "skfiber-invoice-3way": 160,
  "yuan-omni-orders": 120, "ginza-store-daily": 31.2, "greattree-pos-recon": 449.4, "ntpc-traffic-adjudication": 212.4, "tc-1999-petition": 269.6, "coretronic-quality-report": 56, "yungda-commission": 48,
  "skm-concession": 40, "lin-land-expansion": 38.9, "lens-dual-erp-recon": 12.8
};
for (const [id, h] of Object.entries(expSaved)) {
  if (ids.has(id)) check(`效益：${id} 每月節省小時`, Math.round(C.benefit(id).savedHours * 10) / 10, h);
}
// 回本試算（2026-11-22 Shack 同意：月薪 5 萬 × 1.3、門檻 18 個月）
const RP = C.roiPlan("porite-delivery");
check("回本：保來得 1 流程月數", RP.base.payback, 20);
check("回本：保來得 2 流程月數", RP.alt && RP.alt.payback, 11);
check("回本：新北裁決處 1 流程月數", C.roi("ntpc-traffic-adjudication").payback, 7);
check("回本：標準案每月需省小時（18 個月）", Math.round(C.hoursNeededForPayback("tpi-stock-alert")), 106);
check("回本：擴充案每月需省小時（18 個月）", Math.round(C.hoursNeededForPayback("lin-land-expansion")), 43);
check("回本：林懇伶 1 流程月數", C.roi("lin-land-expansion").payback, 20);
check("回本：新光合纖 2 流程月數", C.roiPlan("skfiber-invoice-3way").alt.payback, 12);
check("A 版零售第 2 案改為大樹藥局", DATA.versionA.deals.some(d => d.caseId === "greattree-pos-recon"), true);
check("銀座白石卡片報價（只在 B 版最低授權組合）", C.caseQuote("ginza-store-daily").total, 240_000);
check("回本：大樹藥局月數", C.roi("greattree-pos-recon").payback, 3);
check("回本：中強光電複製到第 2 條產線月數", C.roiPlan("coretronic-quality-report").alt.payback, 12);
check("回本：中強光電人力成本覆寫", C.laborMonthlyOf("coretronic-quality-report"), 80_000);
check("回本：永達保經需省時數超過人工總工時", C.hoursNeededForPayback("yungda-commission") > C.benefit("yungda-commission").monthlyHours, true);
check("回本：永達保經月省低於續約每月攤提", C.roi("yungda-commission").monthlySave * 12 < C.caseQuote("yungda-commission").license, true);
check("回本：新光三越複製到 4 館月數", C.roiPlan("skm-concession").alt.payback, 12);
check("回本：新光三越複製館數", C.roiPlan("skm-concession").alt.flows, 4);
const TC = C.roi("tc-1999-petition");
check("回本：臺中研考會三年淨效益（萬，四捨五入一位）", Math.round(TC.net3y / 1000) / 10, 277.5);
check("回本：臺中研考會三年淨效益 = 月省 × 36 － 三年成本", Math.round(TC.net3y), Math.round(TC.monthlySave * 36 - (TC.oneTime + TC.license * 2)));
for (const c of DATA.cases) {
  if (C.hoursNeededForPayback(c.id) > C.benefit(c.id).monthlyHours && !(C.roiPlan(c.id).alt || {}).ok) assert(`回本：${c.id} 全自動也達不到門檻，須有 pilotGoal`, !!c.pilotGoal);
}
for (const c of DATA.cases) {
  const p = C.roiPlan(c.id);
  assert(`回本：${c.id} 月省金額需為正`, p.base.monthlySave > 0);
}
check("主打案例報價 = 標準案", C.configure({ caseId: DATA.meta.heroCaseId }).total, C.standardCaseAmount());

// 列印附錄（情境對照表）
const FP = C.flagshipPhasedImpact();
check("旗艦分階段：A 版業績", FP.total, 4_940_000);
check("旗艦分階段：缺口", FP.shortfall, 60_000);
check("旗艦分階段：補標準案", FP.standardCases, 1);
const GRID = C.leadsNeededGrid([0.1, 0.2], [0.5]);
check("名單量表：預設情境", GRID[1].cells[0].leads, 200);
check("名單量表：名單→商機 10%", GRID[0].cells[0].leads, 400);
check("正向表：200 名單 = A 版業績", Math.round(C.forwardTable([200])[0].amount), 5_616_000);

for (const s of DATA.scenarios) {
  for (const i of s.industries) assert(`情境 ${s.id} 產業不存在：${i}`, industryIds.has(i));
}
const riskCalcs = new Set(["flagshipDelay", "renewalDrop", "pocLoad", "licenseOnly", "govDelay"]);
for (const r of DATA.risks) assert(`風險 ${r.id} calc 無效：${r.calc}`, riskCalcs.has(r.calc));
const phaseIds = new Set(DATA.timeline.phases.map(p => p.id));
assert("時程缺少 poc 階段（pocLoad 需要）", phaseIds.has("poc"));
for (const p of DATA.timeline.phases) assert(`階段 ${p.id} 起訖顛倒`, C.dayNum(p.start) <= C.dayNum(p.end));

// ---- 3. 來源引用 ----
const srcIds = new Set(DATA.sources.map(s => s.id));
for (const c of DATA.cases) {
  for (const b of c.background) {
    assert(`卡片 ${c.id} 引用不存在的來源 ${b.sourceId}`, srcIds.has(b.sourceId));
    const s = DATA.sources.find(x => x.id === b.sourceId);
    assert(`卡片 ${c.id} 的公開事實須引用有網址的來源（${b.sourceId}）`, s && s.urls.length > 0);
  }
}
for (const s of DATA.sources) {
  assert(`來源 ${s.id} 缺 urls 陣列`, Array.isArray(s.urls));
  for (const u of s.urls) assert(`來源 ${s.id} 網址需為 https`, /^https:\/\//.test(u));
}

// ---- 4. 禁止外部資源 ----
const scanFiles = readdirSync(join(root, "src")).map(f => join("src", f));
if (existsSync(join(root, "dist/rpa-plan.html"))) scanFiles.push("dist/rpa-plan.html");
const banned = [
  [/fetch\s*\(/, "fetch("],
  [/XMLHttpRequest/, "XMLHttpRequest"],
  [/<script[^>]*\ssrc\s*=/i, "<script src="],
  [/<link[^>]*href\s*=\s*["']?https?:/i, "<link href=\"http"],
  [/@import/i, "@import"],
  [/cdn/i, "cdn"],
  [/<img[^>]*src\s*=\s*["']?https?:/i, "外部圖片"],
  [/url\(\s*["']?https?:/i, "CSS 外部 url()"]
];
for (const f of scanFiles) {
  const text = readFileSync(join(root, f), "utf8");
  for (const [re, label] of banned) assert(`${f} 出現禁止項目 ${label}`, !re.test(text));
}

// ---- 5. 模板禁止寫死會變動的數字 ----
// 白名單：目前無例外。若未來需要，請在此註明原因。
const tpl = readFileSync(join(root, "src/index.template.html"), "utf8").replace(/<!--(STYLE|DATA|CALC|APP)-->/g, "");
const tplText = tpl.replace(/<[^>]+>/g, " "); // 只看文案，不看標籤屬性
const hardNumbers = ["5,616,000", "5616000", "561.6", "4.49", "5,116,000", "5116000", "511.6", "5,140,000", "5140000", "514", "5,640,000", "5640000", "564", "1,840,000", "180", "36", "4.09",
  "1,176,000", "500,000", "3,800,000", "1,340,000", "51"];
for (const n of hardNumbers) {
  const re = new RegExp(`(?<![\\d.,])${n.replace(/[.,]/g, m => "\\" + m)}(?![\\d.,])`);
  assert(`模板文案寫死數字 ${n}（請改用 data-bind）`, !re.test(tplText));
}
const app = readFileSync(join(root, "src/app.js"), "utf8");
for (const n of ["5,116,000", "511.6", "5,140,000", "1,340,000", "3,800,000", "5,640,000", "1,840,000"]) {
  assert(`app.js 寫死金額 ${n}`, !app.includes(n));
}

// ---- 報告 ----
console.log("驗算結果：");
for (const r of results) {
  const v = typeof r.actual === "number" ? r.actual.toLocaleString("en-US", { maximumFractionDigits: 4 }) : r.actual;
  console.log(`  ${r.ok ? "✔" : "✘"} ${r.name}：${v}`);
}
console.log(`  客戶卡片 ${DATA.cases.length} 張；客戶來源`, C.customerSourceSummary());
console.log(`  假設項目 ${C.collectAssumptions().length} 筆`);
if (failures.length) {
  console.error(`\n✘ verify 失敗（${failures.length} 項）：`);
  for (const f of failures) console.error("  - " + f);
  process.exit(1);
}
console.log("\n✔ verify 全部通過");
