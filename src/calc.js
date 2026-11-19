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
  return { typeKey, label: t.label, license, service, days: t.days, total: license + service };
}

export function dealAmount(typeKey) {
  return dealBreakdown(typeKey).total;
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

// 由成交案數反推各階段所需量。stages 由「最接近成交」往上排。
// 每層同時給未進位（raw）與進位（ceil）值；鏈式計算使用 raw，避免進位誤差累積。
export function funnelBack({ deals, rates }) {
  const stages = rates || defaultStages();
  let raw = deals;
  const out = [];
  for (const s of stages) {
    raw = raw / s.rate;
    out.push({ key: s.key, label: s.label, rate: s.rate, raw, ceil: Math.ceil(raw - 1e-9) });
  }
  return { deals, stages: out, byKey: Object.fromEntries(out.map(o => [o.key, o])) };
}

function defaultStages() {
  const f = DATA.funnel;
  return [
    { key: "poc",  label: "Demo／PoC", rate: f.pocToWin },
    { key: "opp",  label: "有效商機",  rate: f.oppToPoc },
    { key: "lead", label: "名單",      rate: f.leadToOpp }
  ];
}

export function funnelA() {
  const a = versionATotal();
  const back = funnelBack({ deals: a.count });
  const opp = back.byKey.opp.raw;
  const coverage = (opp * a.avgTicket) / DATA.meta.target;
  return { ...back, avgTicket: a.avgTicket, coverage, coverageTarget: DATA.funnel.coverageTarget };
}

export function funnelB() {
  const f = DATA.funnel;
  const nOf = src => DATA.versionB.deals.filter(d => d.source === src).reduce((a, d) => a + d.n, 0);
  const existing = funnelBack({
    deals: nOf("existing"),
    rates: [{ key: "opp", label: "擴充商機", rate: f.existingOppToWin }]
  });
  const fresh = funnelBack({ deals: nOf("new") });
  return { existing, fresh };
}

// 由名單正推（供滑桿）
export function funnelForward({ leads, rates = {}, avgTicket }) {
  const f = { ...DATA.funnel, ...rates };
  const ticket = avgTicket ?? versionATotal().avgTicket;
  const opp = leads * f.leadToOpp;
  const poc = opp * f.oppToPoc;
  const wins = poc * f.pocToWin;
  return { leads, opp, poc, wins, winsFloor: Math.floor(wins + 1e-9), amount: wins * ticket, avgTicket: ticket, rates: f };
}

export function renewalSensitivity(rates = DATA.versionB.sensitivityRates) {
  const std = standardCaseAmount();
  return rates.map(rate => {
    const renewal = Math.round(DATA.versionB.renewalBase * rate);
    const gap = Math.max(0, DATA.meta.target - renewal);
    return { rate, renewal, gap, standardCasesRaw: gap / std, standardCases: Math.ceil(gap / std - 1e-9) };
  });
}

// 報價組合器
export function configure({ caseId, productType, extraSemi = 0, days } = {}) {
  const c = caseId ? DATA.cases.find(x => x.id === caseId) : null;
  if (caseId && !c) throw new Error("未知流程：" + caseId);
  const type = productType || (c ? c.productType : "semi");
  const d = days ?? (c ? c.estDays : DATA.standardCase.days);
  const { price } = DATA;
  const lines = [
    { key: "dev",   label: "RPA 開發工具使用者", qty: 1, unit: price.dev, kind: "license" },
    { key: "robot", label: type === "full" ? "全自動機器人" : "半自動機器人", qty: 1, unit: type === "full" ? price.full : price.semi, kind: "license" },
    { key: "extra", label: "加購半自動機器人", qty: extraSemi, unit: price.semi, kind: "license" },
    { key: "days",  label: "流程開發（人天）", qty: d, unit: price.day, kind: "service" }
  ].map(l => ({ ...l, amount: l.qty * l.unit }));
  const license = lines.filter(l => l.kind === "license").reduce((a, l) => a + l.amount, 0);
  const service = lines.filter(l => l.kind === "service").reduce((a, l) => a + l.amount, 0);
  const total = license + service;
  const std = standardCaseAmount();
  return { caseId: c ? c.id : null, productType: type, days: d, extraSemi, lines, license, service, total, standard: std, diffFromStandard: total - std };
}

export function evidenceSummary() {
  const out = { "A": 0, "A-": 0, "B": 0 };
  for (const c of DATA.cases) out[c.evidence.level] = (out[c.evidence.level] || 0) + 1;
  return out;
}

// 自動彙整所有「假設」
export function collectAssumptions() {
  const f = DATA.funnel;
  const pct = v => Math.round(v * 100) + "%";
  const list = [
    { group: "漏斗轉換率", label: "名單 → 有效商機", value: pct(f.leadToOpp) },
    { group: "漏斗轉換率", label: "商機 → Demo／PoC", value: pct(f.oppToPoc) },
    { group: "漏斗轉換率", label: "PoC → 回簽", value: pct(f.pocToWin) },
    { group: "漏斗轉換率", label: "既有客戶擴充：商機 → 回簽", value: pct(f.existingOppToWin) },
    { group: "漏斗轉換率", label: "商機加權覆蓋倍數目標", value: f.coverageTarget + " 倍" },
    { group: "續約", label: "基準續約率", value: pct(DATA.versionB.renewalRate) }
  ];
  for (const [k, t] of Object.entries(DATA.dealTypes)) {
    list.push({ group: "案型人天", label: t.label, value: t.days + " 人天" });
  }
  for (const c of DATA.cases) {
    list.push({ group: "流程預估人天", label: c.title, value: c.estDays + " 人天" });
  }
  for (const ind of DATA.industries) {
    const s = Object.entries(ind.score).map(([k, v]) => `${DATA.scoreLabels[k]} ${v}`).join("、");
    list.push({ group: "產業評分（主觀 1–5）", label: ind.name, value: s });
  }
  const t = DATA.timeline;
  list.push({ group: "時程", label: "春節初一", value: t.lunarNewYearDay1 });
  list.push({ group: "時程", label: "春節空窗（暫定）", value: t.holidayWindow.join(" ～ ") });
  list.push({ group: "時程", label: "內部回簽目標", value: t.signTargetDate });
  for (const p of t.phases) list.push({ group: "時程", label: p.label, value: `${p.start} ～ ${p.end}` });
  for (const a of DATA.assumptions) list.push({ group: "其他", label: a.label, value: a.value, note: a.note });
  return list;
}

// 格式化工具（純函式，UI 共用）
export function fmtMoney(n) {
  return Math.round(n).toLocaleString("en-US");
}
export function fmtWan(n, digits = 1) {
  const v = n / 10_000;
  return (Number.isInteger(v) ? String(v) : v.toFixed(digits)) + " 萬";
}
