// 純函式：只讀全域 DATA，不碰 DOM。
// 瀏覽器：build 內嵌在 DATA 之後；Node：verify.mjs 先設定 globalThis.DATA 再 import。
// 本檔不得 import 其他檔案。

export function standardCaseAmount() {
  const { price, standardCase: s } = DATA;
  return price.dev * s.devToolCount + price.semi * s.semiCount + price.day * s.days;
}

export function dealBreakdown(typeKey) {
  const t = DATA.dealTypes[typeKey];
  if (!t) throw new Error("未知案型：" + typeKey);
  const { price } = DATA;
  const license = t.noLicense ? 0 : price.dev + (t.fullAuto ? price.full : price.semi);
  const service = t.days * price.day;
  return { typeKey, label: t.label, license, service, days: t.days, fullAuto: t.fullAuto, noLicense: !!t.noLicense, total: license + service };
}

export function dealAmount(typeKey) {
  return dealBreakdown(typeKey).total;
}

// 任意組合：{ dev, semi, full, days }
export function bundleAmount(b = {}) {
  const { price } = DATA;
  const dev = b.dev || 0, semi = b.semi || 0, full = b.full || 0, days = b.days || 0;
  const license = dev * price.dev + semi * price.semi + full * price.full;
  const service = days * price.day;
  return { dev, semi, full, days, license, service, total: license + service };
}

function sumDeals(deals, groupKey) {
  const rows = deals.map(d => {
    const unit = dealAmount(d.type);
    return { ...d, label: DATA.dealTypes[d.type].label, unit, amount: unit * d.n };
  });
  const groups = {};
  for (const r of rows) {
    const k = r[groupKey];
    if (!groups[k]) groups[k] = { n: 0, amount: 0 };
    groups[k].n += r.n;
    groups[k].amount += r.amount;
  }
  const total = rows.reduce((a, r) => a + r.amount, 0);
  const count = rows.reduce((a, r) => a + r.n, 0);
  return { rows, groups, total, count };
}

export function versionATotal() {
  const { rows, groups, total, count } = sumDeals(DATA.versionA.deals, "industry");
  return {
    total,
    count,
    deals: rows,
    byIndustry: groups,
    avgTicket: total / count,
    gapToTarget: DATA.meta.target - total // 負值 = 超出目標
  };
}

export function versionBTotal(rate = DATA.versionB.renewalRate) {
  const renewal = Math.round(DATA.versionB.renewalBase * rate);
  const { rows, groups, total: newTotal, count } = sumDeals(DATA.versionB.deals, "source");
  const total = renewal + newTotal;
  return {
    rate,
    renewal,
    newTotal,
    total,
    count,
    deals: rows,
    bySource: groups,
    byIndustry: groups, // B 版以來源（既有／新客）分組
    gapToTarget: DATA.meta.target - total
  };
}

function defaultStages(f = DATA.funnel) {
  return [
    { key: "poc",  label: "Demo／PoC", rate: f.pocToWin },
    { key: "opp",  label: "有效商機",  rate: f.oppToPoc },
    { key: "lead", label: "名單",      rate: f.leadToOpp }
  ];
}

const ceil = v => Math.ceil(v - 1e-9);

// 由成交案數反推各階段所需量。rates 由「最接近成交」往上排；預設用 DATA.funnel。
// 每層同時給未進位（raw）與進位（ceil）值；鏈式計算使用 raw，避免進位誤差累積。
export function funnelBack({ deals, rates }) {
  const stages = rates || defaultStages();
  let raw = deals;
  const out = [];
  for (const s of stages) {
    raw = raw / s.rate;
    out.push({ key: s.key, label: s.label, rate: s.rate, raw, ceil: ceil(raw) });
  }
  return { deals, stages: out, byKey: Object.fromEntries(out.map(o => [o.key, o])) };
}

export function funnelA(f = DATA.funnel) {
  const a = versionATotal();
  const back = funnelBack({ deals: a.count, rates: defaultStages(f) });
  const opp = back.byKey.opp.raw;
  const coverage = (opp * a.avgTicket) / DATA.meta.target;
  return { ...back, avgTicket: a.avgTicket, coverage, coverageTarget: f.coverageTarget };
}

export function funnelB(f = DATA.funnel) {
  const nOf = src => DATA.versionB.deals.filter(d => d.source === src).reduce((a, d) => a + d.n, 0);
  const existing = funnelBack({
    deals: nOf("existing"),
    rates: [{ key: "opp", label: "擴充商機", rate: f.existingOppToWin }]
  });
  const fresh = funnelBack({ deals: nOf("new"), rates: defaultStages(f) });
  return { existing, fresh };
}

// 由名單正推（供滑桿）；客單價由 A 版案型組合帶出，不自由調整
export function funnelForward({ leads, rates = {}, avgTicket }) {
  const f = { ...DATA.funnel, ...rates };
  const ticket = avgTicket ?? versionATotal().avgTicket;
  const opp = leads * f.leadToOpp;
  const poc = opp * f.oppToPoc;
  const wins = poc * f.pocToWin;
  const amount = wins * ticket;
  return { leads, opp, poc, wins, winsFloor: Math.floor(wins + 1e-9), amount, avgTicket: ticket, rates: f, gapToTarget: DATA.meta.target - amount };
}

export function renewalSensitivity(rates = DATA.versionB.sensitivityRates) {
  const std = standardCaseAmount();
  const planned = versionBTotal().newTotal;
  return rates.map(rate => {
    const renewal = Math.round(DATA.versionB.renewalBase * rate);
    const gap = Math.max(0, DATA.meta.target - renewal);
    const shortfall = Math.max(0, gap - planned); // 已規劃新增之外仍不足
    return {
      rate, renewal, gap,
      standardCasesRaw: gap / std,
      standardCases: ceil(gap / std),
      planned,
      shortfall,
      extraStandardCases: ceil(shortfall / std)
    };
  });
}

// 報價組合器
export function configure({ caseId, productType, extraSemi = 0, days, existingLicense } = {}) {
  const c = caseId ? DATA.cases.find(x => x.id === caseId) : null;
  if (caseId && !c) throw new Error("未知流程：" + caseId);
  const type = productType || (c ? c.productType : "semi");
  const d = days ?? (c ? c.estDays : DATA.standardCase.days);
  const reuse = existingLicense ?? !!(c && c.existingLicense); // 既有授權沿用 → 只算人天與加購
  const base = reuse ? 0 : 1;
  const { price } = DATA;
  const lines = [
    { key: "dev",   label: "RPA 開發工具使用者", qty: base, unit: price.dev, kind: "license" },
    { key: "robot", label: type === "full" ? "全自動機器人" : "半自動機器人", qty: base, unit: type === "full" ? price.full : price.semi, kind: "license" },
    { key: "extra", label: "加購半自動機器人", qty: extraSemi, unit: price.semi, kind: "license" },
    { key: "days",  label: "流程開發（人天）", qty: d, unit: price.day, kind: "service" }
  ].map(l => ({ ...l, amount: l.qty * l.unit }));
  const license = lines.filter(l => l.kind === "license").reduce((a, l) => a + l.amount, 0);
  const service = lines.filter(l => l.kind === "service").reduce((a, l) => a + l.amount, 0);
  const total = license + service;
  const std = standardCaseAmount();
  return { caseId: c ? c.id : null, productType: type, days: d, extraSemi, existingLicense: reuse, lines, license, service, total, standard: std, diffFromStandard: total - std };
}

// 客戶來源統計（取代原證據等級統計）
export function customerSourceSummary() {
  const out = Object.fromEntries(Object.keys(DATA.customerSources).map(k => [k, 0]));
  for (const c of DATA.cases) out[c.customerSource] = (out[c.customerSource] || 0) + 1;
  return out;
}

// 效益試算（皆為假設）：月工時 = count × minutes ÷ 60 × 每月次數；節省 = 月工時 × autoRate
export const FTE_HOURS = 168;
export function benefit(caseId) {
  const c = DATA.cases.find(x => x.id === caseId);
  if (!c) throw new Error("未知案例：" + caseId);
  const b = c.benefit;
  const perMonth = b.per === "day" ? b.workDays : b.per === "year" ? 1 / 12 : 1;
  const monthlyHours = (b.count * b.minutes / 60) * perMonth;
  const savedHours = monthlyHours * b.autoRate;
  return { ...b, perMonth, monthlyHours, savedHours, fte: savedHours / FTE_HOURS };
}

const PER_LABEL = { day: "日", month: "月", year: "年" };
export function benefitFormula(caseId) {
  const b = benefit(caseId);
  const per = b.per === "day" ? `／日（${b.workDays} 天／月）` : `／${PER_LABEL[b.per]}`;
  return `${b.count} ${b.unit}${per} × ${b.minutes} 分 × 自動化 ${Math.round(b.autoRate * 100)}%`;
}

// 此案例在 A／B 版被列為哪些案型
export function dealsForCase(caseId) {
  const out = [];
  for (const [version, deals] of [["A", DATA.versionA.deals], ["B", DATA.versionB.deals]]) {
    for (const d of deals) {
      if (d.caseId === caseId) out.push({ version, type: d.type, label: DATA.dealTypes[d.type].label, amount: dealAmount(d.type) * d.n });
    }
  }
  return out;
}

// ---- 日期（以 UTC 日序計，避免時區誤差）----
export function dayNum(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
}
export function isoOf(n) {
  return new Date(n * 86_400_000).toISOString().slice(0, 10);
}

// Q1 有效工作天：季初 → 內部回簽目標，扣除週末、春節空窗與其他假日（皆為暫定假設）
export function workingDays({ start, end } = {}) {
  const t = DATA.timeline;
  const s = dayNum(start || t.quarter[0]);
  const e = dayNum(end || t.signTargetDate);
  const hw = [dayNum(t.holidayWindow[0]), dayNum(t.holidayWindow[1])];
  const off = new Set((t.otherHolidays || []).map(dayNum));
  let days = 0;
  for (let n = s; n <= e; n++) {
    const dow = new Date(n * 86_400_000).getUTCDay();
    if (dow === 0 || dow === 6) continue;
    if (n >= hw[0] && n <= hw[1]) continue;
    if (off.has(n)) continue;
    days++;
  }
  return { days, calendarDays: e - s + 1, bufferDays: dayNum(t.quarter[1]) - e };
}

export function phaseWeeks(phaseId) {
  const p = DATA.timeline.phases.find(x => x.id === phaseId);
  return (dayNum(p.end) - dayNum(p.start) + 1) / 7;
}

// ---- 風險影響試算 ----
export function flagshipDelayImpact() {
  const a = versionATotal();
  const flagship = a.deals.filter(d => d.type === "flagship").reduce((s, d) => s + d.amount, 0);
  const without = a.total - flagship;
  const shortfall = Math.max(0, DATA.meta.target - without);
  return { flagship, without, shortfall, standardCases: ceil(shortfall / standardCaseAmount()), share: flagship / a.total };
}

// 公部門案延後到 Q2（Q1 不認列）
export function govDelayImpact() {
  const a = versionATotal();
  const gov = a.deals.filter(d => d.industry === "government").reduce((s, d) => s + d.amount, 0);
  const without = a.total - gov;
  const shortfall = Math.max(0, DATA.meta.target - without);
  return { gov, without, shortfall, standardCases: ceil(shortfall / standardCaseAmount()), surplus: Math.max(0, without - DATA.meta.target) };
}

// 旗艦改分階段：先以半自動標準案上線（Q1 只認列標準案金額）
export function flagshipPhasedImpact() {
  const a = versionATotal();
  const flagship = a.deals.filter(d => d.type === "flagship").reduce((s, d) => s + d.amount, 0);
  const phased = a.deals.filter(d => d.type === "flagship").reduce((s, d) => s + dealAmount("standard") * d.n, 0);
  const total = a.total - flagship + phased;
  const shortfall = Math.max(0, DATA.meta.target - total);
  return { total, phased, shortfall, standardCases: ceil(shortfall / standardCaseAmount()) };
}

// 列印附錄：轉換率情境（A 版所需名單量），其餘轉換率維持預設
export function leadsNeededGrid(leadRates, winRates) {
  return leadRates.map(lr => ({
    leadToOpp: lr,
    cells: winRates.map(wr => ({ pocToWin: wr, leads: funnelA({ ...DATA.funnel, leadToOpp: lr, pocToWin: wr }).byKey.lead.ceil }))
  }));
}

// 列印附錄：名單數 → 預期回簽與業績（預設轉換率、A 版平均客單）
export function forwardTable(leadsList) {
  const avgTicket = versionATotal().avgTicket;
  return leadsList.map(leads => funnelForward({ leads, avgTicket }));
}

export function pocLoad(f = DATA.funnel) {
  const poc = funnelA(f).byKey.poc;
  const weeks = phaseWeeks("poc");
  return { poc: poc.ceil, pocRaw: poc.raw, weeks, perWeek: poc.raw / weeks };
}

export function scenarioAmounts() {
  return DATA.scenarios.map(s => ({
    id: s.id,
    main: bundleAmount(s.bundle),
    alt: s.alt ? { label: s.alt.label, ...bundleAmount(s.alt.bundle) } : null
  }));
}

// 自動彙整所有「假設」；overrides 可帶入 UI 目前調整值（funnel、renewalRate）
export function collectAssumptions(overrides = {}) {
  const f = { ...DATA.funnel, ...(overrides.funnel || {}) };
  const rr = overrides.renewalRate ?? DATA.versionB.renewalRate;
  const pct = v => Math.round(v * 100) + "%";
  const changed = (k, v) => DATA.funnel[k] !== v;
  const list = [
    { group: "漏斗轉換率", label: "名單 → 有效商機", value: pct(f.leadToOpp), changed: changed("leadToOpp", f.leadToOpp) },
    { group: "漏斗轉換率", label: "商機 → Demo／PoC", value: pct(f.oppToPoc), changed: changed("oppToPoc", f.oppToPoc) },
    { group: "漏斗轉換率", label: "PoC → 回簽", value: pct(f.pocToWin), changed: changed("pocToWin", f.pocToWin) },
    { group: "漏斗轉換率", label: "既有客戶擴充：商機 → 回簽", value: pct(f.existingOppToWin), changed: changed("existingOppToWin", f.existingOppToWin) },
    { group: "漏斗轉換率", label: "商機加權覆蓋倍數目標", value: f.coverageTarget + " 倍" },
    { group: "續約", label: "續約率（基準）", value: pct(rr), changed: rr !== DATA.versionB.renewalRate }
  ];
  for (const t of Object.values(DATA.dealTypes)) {
    list.push({ group: "案型人天", label: t.label, value: t.days + " 人天" });
  }
  for (const s of DATA.scenarios) {
    if (s.bundle.days) list.push({ group: "情境組合人天", label: s.title, value: s.bundle.days + " 人天" });
  }
  for (const c of DATA.cases) {
    list.push({ group: "個案人天與效益假設", label: c.customer.replace(/（.*）/, ""), value: `${c.estDays} 人天｜${benefitFormula(c.id)}`, wrap: true });
  }
  const scoreGroup = "產業評分（" + Object.values(DATA.scoreShort).join("・") + "，主觀 1–5）";
  for (const ind of DATA.industries) {
    list.push({ group: scoreGroup, label: ind.name, value: Object.values(ind.score).join("・") });
  }
  const t = DATA.timeline;
  const md = iso => { const p = iso.split("-"); return `${+p[1]}/${+p[2]}`; };
  const g = "時程（暫定，以公告為準）";
  list.push({ group: g, label: "春節初一", value: md(t.lunarNewYearDay1) });
  list.push({ group: g, label: "春節空窗", value: `${md(t.holidayWindow[0])}–${md(t.holidayWindow[1])}` });
  list.push({ group: g, label: "其他假日", value: (t.otherHolidays || []).map(md).join("、") });
  list.push({ group: g, label: "內部回簽目標", value: md(t.signTargetDate) });
  for (const p of t.phases) list.push({ group: g, label: p.label, value: `${md(p.start)}–${md(p.end)}` });
  for (const a of DATA.assumptions) list.push({ group: "其他", label: a.label, value: a.value, note: a.note, wrap: true });
  return list;
}

// 格式化工具（純函式，UI 共用）
export function fmtMoney(n) {
  return Math.round(n).toLocaleString("en-US");
}
export function fmtWan(n, digits = 1) {
  const v = Math.round(n) / 10_000;
  return (Number.isInteger(v) ? String(v) : v.toFixed(digits)) + " 萬";
}
export function fmtPct(v, digits = 0) {
  return (v * 100).toFixed(digits) + "%";
}
export function fmtNum(v, digits = 1) {
  return Number.isInteger(v) ? String(v) : (Math.round(v * 10 ** digits) / 10 ** digits).toFixed(digits);
}
