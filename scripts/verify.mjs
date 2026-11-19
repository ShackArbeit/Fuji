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
check("入門包（純授權）", C.dealAmount("starterLite"), 240_000);
check("既有客戶擴充（15 人天）", C.dealAmount("expansion"), 300_000);

const A = C.versionATotal();
check("A 版合計", A.total, 5_116_000);
check("A 版案數", A.count, 9);
assert("A 版未達目標", A.total >= DATA.meta.target);

const B = C.versionBTotal(0.95);
check("B 版續約（95%）", B.renewal, 3_800_000);
check("B 版新增金額", B.newTotal, 1_340_000);
check("B 版合計", B.total, 5_140_000);
check("B 版新增案數", B.count, 4);

const FA = C.funnelA();
check("A 漏斗 PoC", FA.byKey.poc.ceil, 18);
check("A 漏斗 有效商機", FA.byKey.opp.ceil, 36);
check("A 漏斗 名單", FA.byKey.lead.ceil, 180);
check("A 覆蓋倍數 ≈ 4.09", Math.round(FA.coverage * 100) / 100, 4.09);

const FB = C.funnelB();
check("B 擴充商機（未進位）", FB.existing.byKey.opp.raw, 10 / 3, near(1e-9));
check("B 擴充商機（進位）", FB.existing.byKey.opp.ceil, 4);
check("B 新客商機", FB.fresh.byKey.opp.ceil, 8);
check("B 新客名單", FB.fresh.byKey.lead.ceil, 40);

const expSens = new Map([[1.0, [1_000_000, 2]], [0.95, [1_200_000, 3]], [0.9, [1_400_000, 3]], [0.85, [1_600_000, 4]]]);
for (const s of C.renewalSensitivity()) {
  const [gap, n] = expSens.get(s.rate);
  check(`敏感度 ${Math.round(s.rate * 100)}% 缺口`, s.gap, gap);
  check(`敏感度 ${Math.round(s.rate * 100)}% 約需標準案`, s.standardCases, n);
}

// 組合器 / 正推 一致性
check("組合器預設 = 標準案", C.configure({}).total, 500_000);
check("組合器 旗艦流程（30 人天全自動）", C.configure({ caseId: "mfg-invoice-3way" }).total, 1_176_000);
check("組合器 加購 1 半自動差距", C.configure({ extraSemi: 1 }).diffFromStandard, 64_000);
const fw = C.funnelForward({ leads: FA.byKey.lead.ceil });
check("正推 180 名單 → 成交案數", fw.wins, 9, near(1e-9));
check("正推金額 = A 版合計", Math.round(fw.amount), A.total);

// ---- 2. 卡片完整性 ----
const ids = new Set();
const levels = Object.keys(DATA.evidenceLevels);
const industryIds = new Set(DATA.industries.map(i => i.id));
for (const c of DATA.cases) {
  assert(`卡片 id 重複：${c.id}`, !ids.has(c.id)); ids.add(c.id);
  assert(`卡片 ${c.id} 缺 evidence.level`, c.evidence && levels.includes(c.evidence.level));
  assert(`卡片 ${c.id} 缺 evidence.why`, c.evidence && !!c.evidence.why);
  assert(`卡片 ${c.id} 缺 human 覆核點`, Array.isArray(c.toBe) && c.toBe.some(s => s.actor === "human"));
  assert(`卡片 ${c.id} 缺 estDays`, Number.isFinite(c.estDays) && c.estDays > 0);
  assert(`卡片 ${c.id} productType 無效`, ["semi", "full"].includes(c.productType));
  assert(`卡片 ${c.id} 產業不存在`, industryIds.has(c.industry));
  assert(`卡片 ${c.id} As-Is 應為 3–5 步`, c.asIs.length >= 3 && c.asIs.length <= 5);
}
const required = ["mfg-delivery-followup", "mfg-order-to-sales", "mfg-dual-erp-sync", "mfg-stock-alert", "mfg-invoice-3way",
  "retail-multiplatform-orders", "retail-store-inventory", "hightech-yield-report", "fin-reconciliation", "ins-commission-check", "dept-concession-settlement"];
for (const id of required) assert(`缺少必要卡片 ${id}`, ids.has(id));
assert("heroCaseId 不存在於 cases", ids.has(DATA.meta.heroCaseId));
for (const d of DATA.versionA.deals) {
  assert(`A 版產業不存在：${d.industry}`, industryIds.has(d.industry));
  if (d.caseId) assert(`A 版 caseId 不存在：${d.caseId}`, ids.has(d.caseId));
}

// ---- 3. 來源引用 ----
const srcIds = new Set(DATA.sources.map(s => s.id));
for (const c of DATA.cases) {
  for (const r of c.evidence.refs || []) assert(`卡片 ${c.id} 引用不存在的來源 ${r.sourceId}`, srcIds.has(r.sourceId));
  if (c.evidence.level === "A" || c.evidence.level === "A-") {
    const external = (c.evidence.refs || []).filter(r => r.sourceId !== "rpa-md");
    assert(`卡片 ${c.id} 等級 ${c.evidence.level} 但無外部來源`, external.length > 0);
  }
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
const hardNumbers = ["5,116,000", "5116000", "511.6", "5,140,000", "5140000", "514", "180", "36", "4.09",
  "1,176,000", "500,000", "3,800,000", "1,340,000"];
for (const n of hardNumbers) {
  const re = new RegExp(`(?<![\\d.,])${n.replace(/[.,]/g, m => "\\" + m)}(?![\\d.,])`);
  assert(`模板文案寫死數字 ${n}（請改用 data-bind）`, !re.test(tplText));
}
const app = readFileSync(join(root, "src/app.js"), "utf8");
for (const n of ["5,116,000", "511.6", "5,140,000", "1,340,000", "3,800,000"]) {
  assert(`app.js 寫死金額 ${n}`, !app.includes(n));
}

// ---- 報告 ----
console.log("驗算結果：");
for (const r of results) {
  const v = typeof r.actual === "number" ? r.actual.toLocaleString("en-US", { maximumFractionDigits: 4 }) : r.actual;
  console.log(`  ${r.ok ? "✔" : "✘"} ${r.name}：${v}`);
}
console.log(`  卡片 ${DATA.cases.length} 張；證據等級`, C.evidenceSummary());
console.log(`  假設項目 ${C.collectAssumptions().length} 筆`);
if (failures.length) {
  console.error(`\n✘ verify 失敗（${failures.length} 項）：`);
  for (const f of failures) console.error("  - " + f);
  process.exit(1);
}
console.log("\n✔ verify 全部通過");
