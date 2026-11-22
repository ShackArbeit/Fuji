// DOM 與互動；只讀 DATA 與 calc.js 的結果。所有數字皆由 calc 算出，不在此寫死。
(function () {
  "use strict";

  // ---------- 工具 ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = v => String(v).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const IND = Object.fromEntries(DATA.industries.map(i => [i.id, i]));
  const CASE = Object.fromEntries(DATA.cases.map(c => [c.id, c]));
  const SRC = Object.fromEntries(DATA.sources.map(s => [s.id, s]));
  const ROBOT = { semi: "半自動機器人", full: "全自動機器人" };
  const ASSUME = '<span class="tag-assume">假設</span>';
  const shortDate = iso => { const p = iso.split("-"); return `${+p[1]}/${+p[2]}`; };
  const pct = v => fmtPct(v);
  const P = DATA.price;

  function vsTarget(total) {
    const gap = DATA.meta.target - total;
    return gap <= 0
      ? { text: `✔ 達標，超出目標 ${fmtWan(-gap)}`, ok: true }
      : { text: `✘ 距目標尚差 ${fmtWan(gap)}`, ok: false };
  }
  const statusHtml = s => `<p class="status" data-state="${s.ok ? "ok" : "bad"}">${esc(s.text)}</p>`;
  const srcBadge = k => `<span class="badge cs cs-${k}">${esc(DATA.customerSources[k])}</span>`;
  const infoTag = k => `<span class="info-tag info-${k}">${esc(DATA.infoTags[k])}</span>`;
  const srcLinks = id => {
    const s = SRC[id];
    if (!s) return "";
    return s.urls.length
      ? s.urls.map((u, i) => `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(i === 0 ? s.title : "另一篇")}</a>`).join("、")
      : esc(s.title);
  };
  const customerName = c => c.customer;
  const prodBadge = t => `<span class="badge prod-${t}">${t === "full" ? "全自動" : "半自動"}</span>`;
  const roleBadge = ind => `<span class="badge role${ind.role === "主攻" ? " role-main" : ""}">${esc(ind.role)}</span>`;

  // ---------- 狀態 ----------
  const defaultCfg = () => ({ caseId: "", productType: "semi", extraSemi: 0, days: DATA.standardCase.days, existingLicense: false });
  const cfgFromCase = c => ({ caseId: c.id, productType: c.productType, extraSemi: 0, days: c.estDays, existingLicense: !!c.existingLicense });
  const state = {
    version: "A",
    funnelMode: "back",
    industry: "all",
    openCase: DATA.meta.heroCaseId,
    renewalRate: DATA.versionB.renewalRate,
    funnel: { ...DATA.funnel },
    leads: null, // null = 跟隨反推所需名單
    cfg: defaultCfg()
  };

  // ---------- data-bind ----------
  function computeBinds() {
    const a = versionATotal();
    const b = versionBTotal(state.renewalRate);
    const fa = funnelA(state.funnel);
    const std = dealBreakdown("standard");
    const wd = workingDays();
    const mix = Object.entries(a.byIndustry).map(([k, v]) => `${IND[k].short} ${v.n} 案`).join("、");
    return {
      "meta.title": DATA.meta.title,
      "meta.thesis": DATA.meta.thesis,
      "target.wan": fmtWan(DATA.meta.target),
      "a.count": a.count,
      "a.totalWan": fmtWan(a.total),
      "a.mix": mix,
      "a.status": vsTarget(a.total),
      "b.totalWan": fmtWan(b.total),
      "b.renewalWan": fmtWan(b.renewal),
      "b.rate": pct(state.renewalRate),
      "b.count": b.count,
      "b.status": vsTarget(b.total),
      "std.totalWan": fmtWan(std.total),
      "std.licenseWan": fmtWan(std.license),
      "std.serviceWan": fmtWan(std.service),
      "std.days": std.days,
      "fa.leads": fa.byKey.lead.ceil,
      "fa.opp": fa.byKey.opp.ceil,
      "fa.poc": fa.byKey.poc.ceil,
      "fa.rLead": pct(state.funnel.leadToOpp),
      "fa.rOpp": pct(state.funnel.oppToPoc),
      "fa.rPoc": pct(state.funnel.pocToWin),
      "wd.days": wd.days,
      "time.sign": shortDate(DATA.timeline.signTargetDate),
      "time.buffer": wd.bufferDays
    };
  }
  function renderBinds() {
    const B = computeBinds();
    $$("[data-bind]").forEach(el => {
      const v = B[el.getAttribute("data-bind")];
      if (v === undefined) return;
      if (typeof v === "object") {
        el.textContent = v.text;
        el.setAttribute("data-state", v.ok ? "ok" : "bad");
      } else {
        el.textContent = v;
      }
    });
  }

  // ---------- 1. 章節編號 ----------
  const sections = $$(".slide");
  function decorateSections() {
    sections.forEach((s, i) => {
      const eb = $(".eyebrow", s);
      if (eb) eb.insertAdjacentHTML("afterbegin", `<span class="no">${String(i + 1).padStart(2, "0")}</span>`);
    });
  }

  // ---------- 2. 產業地圖 ----------
  function renderIndustries() {
    const a = versionATotal();
    const keys = Object.keys(DATA.scoreLabels);
    const head = keys.map(k => `<th scope="col">${esc(DATA.scoreLabels[k].split("（")[0])}</th>`).join("");
    const rows = DATA.industries.map(ind => {
      const sel = state.industry === ind.id;
      const total = keys.reduce((s, k) => s + ind.score[k], 0);
      const nCases = DATA.cases.filter(c => c.industry === ind.id).length;
      const nDeals = (a.byIndustry[ind.id] || { n: 0 }).n;
      const cells = keys.map(k => {
        const v = ind.score[k];
        return `<td><span class="meter" aria-hidden="true"><span style="width:${(v / 5) * 100}%"></span></span><span class="meter-num">${v}</span></td>`;
      }).join("");
      return `<tr class="${sel ? "is-selected" : ""}">
        <th scope="row"><button type="button" class="ind-btn" data-industry="${ind.id}" aria-pressed="${sel}">
          <span class="ind-name">${esc(ind.name)}</span>${roleBadge(ind)}</button></th>
        ${cells}<td class="num"><strong>${total}</strong></td><td class="num">${nDeals}</td><td class="num">${nCases}</td></tr>`;
    }).join("");
    $("#industry-map").innerHTML = `
      <table class="tbl">
        <thead><tr><th scope="col">產業（角色）</th>${head}<th scope="col" class="num">合計</th><th scope="col" class="num">A 版案數</th><th scope="col" class="num">客戶卡</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
    $("#industry-note").textContent = "評分 1–5 為主觀假設，分數越高越有利（成交週期越短、導入阻力越低)";

    const ind = IND[state.industry];
    const det = $("#industry-detail");
    if (!ind) {
      det.innerHTML = `<h3>怎麼看這張表</h3>
        <ul class="plain">
          <li style="margin-bottom:40px">製造業：分數最高，作為主攻，A 版最多案數與金額在這裡。</li>
          <li style="margin-bottom:40px">零售：決策快，但客單偏低，作為副攻。</li>
          <li style="margin-bottom:40px">百貨、金融：家數少或審查長，走 ABM 單點突破與既有客戶擴充。</li>
          <li style="margin-bottom:40px">公部門：作業量大、規則明確，但須走採購程序，A、B 版各放 1 案當業績緩衝。</li>
        </ul>`;
      return;
    }
    const cases = DATA.cases.filter(c => c.industry === ind.id);
    const nDeals = (a.byIndustry[ind.id] || { n: 0, amount: 0 });
    const bIn = versionBTotal().deals.filter(d => CASE[d.caseId]?.industry === ind.id);
    const bDeals = { n: bIn.reduce((s, d) => s + d.n, 0), amount: bIn.reduce((s, d) => s + d.amount, 0), names: bIn.map(d => CASE[d.caseId].customer) };
    det.innerHTML = `<h3>${esc(ind.name)} ${roleBadge(ind)}</h3>
      <p>${esc(ind.pitch)} <span class="tag-assume">推論</span></p>
      <h4>A 版規劃</h4>
      <p>${nDeals.n} 案、${fmtWan(nDeals.amount)}${ind.abm ? "（ABM：鎖定少數目標客戶）" : ""}</p>
      ${bDeals.n ? `<h4>B 版規劃</h4><p>${bDeals.n} 案、${fmtWan(bDeals.amount)}（${esc(bDeals.names.join("、"))}）</p>` : ""}
      <h4>目標客戶（${cases.length}）</h4>
      <ul>${cases.map(c => `<li><button type="button" class="link-btn" data-open-case="${c.id}">${esc(customerName(c))}｜${esc(c.title)}</button> ${srcBadge(c.customerSource)}</li>`).join("")}</ul>`;
  }

  // ---------- 3. 痛點卡片 ----------
  function filteredCases() {
    return state.industry === "all" ? DATA.cases : DATA.cases.filter(c => c.industry === state.industry);
  }
  function renderCaseFilter() {
    const opts = [{ id: "all", short: "全部" }, ...DATA.industries];
    $("#case-filter").innerHTML = opts.map(o =>
      `<button type="button" class="chip" data-filter="${o.id}" aria-pressed="${state.industry === o.id}">${esc(o.short)}</button>`
    ).join("");
  }
  function renderCaseGrid() {
    $("#case-grid").innerHTML = filteredCases().map(c => {
      const hero = c.id === DATA.meta.heroCaseId;
      const q = configure({ caseId: c.id });
      return `<button type="button" class="case-card${hero ? " is-hero" : ""}" data-case="${c.id}" aria-expanded="${state.openCase === c.id}" aria-controls="case-detail">
        <span class="case-row1"><span class="case-title">${esc(customerName(c))}</span>${hero ? '<span class="badge hero-badge">主打</span>' : ""}<span class="case-amt">${fmtWan(q.total)}</span></span>
        <span class="case-sub">${esc(c.industryNote || IND[c.industry].short)}｜${esc(c.title)}</span>
      </button>`;
    }).join("");
  }
  function quoteTable(q) {
    const SHORT = { dev: "開發工具", robot: q.productType === "full" ? "全自動" : "半自動", extra: "加購半自動" };
    const parts = q.lines.filter(l => l.qty).map(l =>
      l.key === "days" ? `${l.qty} 人天 ${fmtMoney(l.amount)}` : `${SHORT[l.key]}${l.qty > 1 ? " ×" + l.qty : ""} ${fmtMoney(l.amount)}`);
    return `<p class="quote-line">${parts.join(" + ")}</p>
      <p class="quote-total">${fmtMoney(q.total)}<span class="muted">${q.existingLicense ? "（既有授權沿用，純人天）" : ""}</span></p>`;
  }
  function renderCaseDetail() {
    const c = CASE[state.openCase];
    const el = $("#case-detail");
    if (!c) {
      el.innerHTML = `<p class="muted">點左側任一客戶卡片，展開背景、挑戰、解決方案、效益與報價。</p>`;
      return;
    }
    el.innerHTML = caseDetailHtml(c);
  }
  // 回本試算（試算假設）：達標顯示回本月數與三年淨效益；未達標改提多流程攤提或量體門檻，不顯示負數
  function roiHtml(c) {
    const r = DATA.roi;
    const { base, alt } = roiPlan(c.id);
    const wan = v => fmtNum(v / 10000, 1) + " 萬";
    const pb = x => x.payback === null ? "回本需 60 個月以上" : `約 ${x.payback} 個月回本`;
    const head = `人力成本以月薪 ${fmtNum(r.monthlySalary / 10000, 0)} 萬 × ${r.loadFactor} 計：月省約 ${wan(base.monthlySave)}，${pb(base)}`;
    if (base.ok) return `<p class="roi-line">${head}<br><span class="roi-ok">✔ 三年淨效益約 ${wan(base.net3y)}</span></p>`;
    if (alt && alt.ok) return `<p class="roi-line">${head}<br><span class="roi-alt">→ 同一套授權加 ${alt.flows - 1} 個流程（${fmtWan(dealAmount("expansion"))}／${DATA.dealTypes.expansion.days} 人天）：約 ${alt.payback} 個月回本、三年淨效益約 ${wan(alt.net3y)}</span></p>`;
    const need = hoursNeededForPayback(c.id);
    const q = configure({ caseId: c.id });
    const renew = q.license * (Math.ceil(r.paybackLimit / 12) - 1);
    const costTxt = renew ? `(${fmtWan(q.total)} + 續約 ${fmtWan(renew)})` : `${fmtWan(q.total)}`;
    const now = benefit(c.id).savedHours;
    return `<p class="roi-line">${head}<br><span class="roi-warn">⚠ 量體待驗證：每月需省 ${fmtNum(need, 0)} 小時（目前 ${fmtNum(now, 0)}，差 ${fmtNum(need - now, 0)}）</span><br><span class="roi-calc">算法：${costTxt} ÷ ${r.paybackLimit} 個月 ÷ ${fmtWan(r.monthlySalary * r.loadFactor)} × ${FTE_HOURS} 小時</span></p>`;
  }

  function caseDetailHtml(c) {
    const q = configure({ caseId: c.id });
    const bf = benefit(c.id);
    const hero = c.id === DATA.meta.heroCaseId;
    const deals = dealsForCase(c.id);
    const dealText = deals.map(d => `${d.version} 版：${d.label} ${fmtWan(d.amount)}`).join("；");
    return `
      <div class="detail-head">
        <h3>${esc(customerName(c))}</h3>${srcBadge(c.customerSource)}${prodBadge(c.productType)}
        <span class="muted">${esc(c.industryNote || IND[c.industry].name)}｜${esc(c.title)}${hero ? "｜主打" : ""}</span>
      </div>
      <div class="case-sections">
        <section class="sec">
          <h4><span class="sec-no">1</span>客戶名稱 & 背景 ${infoTag("fact")}</h4>
          <ul class="plain">${c.background.map(b => `<li>${esc(b.text)} <span class="src-ref">（${srcLinks(b.sourceId)}）</span></li>`).join("")}</ul>
        </section>
        <section class="sec">
          <h4><span class="sec-no">2</span>挑戰／流程現況 ${infoTag("guess")}</h4>
          <ul class="plain">${c.challenge.map(t => `<li>${esc(t)}</li>`).join("")}</ul>
        </section>
        <div class="sec-stack">
        <section class="sec">
          <h4><span class="sec-no">3</span>解決方案</h4>
          <ol class="flow-list">${c.toBe.map(s => `<li class="step step-${s.actor}"><span class="actor">${s.actor === "robot" ? "機器人" : "人工覆核"}</span><span>${esc(s.text)}</span></li>`).join("")}</ol>
        </section>
        <section class="sec sec-roi">
          <h4>回本試算 ${infoTag("assume")}<span class="muted roi-sub">（接第 4 段效益 × 第 5 段報價）</span></h4>
          ${roiHtml(c)}
        </section>
        </div>
        <div class="sec-stack">
        <section class="sec">
          <h4><span class="sec-no">4</span>預估成果／效益 ${infoTag("assume")}</h4>
          <p class="benefit-big">每月約省 <strong>${fmtNum(bf.savedHours, 0)}</strong> 小時<span class="muted">（約 ${fmtNum(bf.fte, 1)} 人力）</span></p>
          <p class="muted">${esc(benefitFormula(c.id))}：月工時 ${fmtNum(bf.monthlyHours, 0)} 小時</p>
          <p>${esc(bf.quality)}</p>
        </section>
        <section class="sec sec-quote">
          <h4><span class="sec-no">5</span>報價試算</h4>
          ${quoteTable(q)}
          <p class="muted">${esc(c.productNote || "")}${dealText ? `<br>業績對應：${esc(dealText)}` : ""}</p>
          <p><button type="button" class="btn btn-ghost" data-goto-cfg="${c.id}">在組合器調整 →</button></p>
        </section>
        </div>
      </div>`;
  }

  // ---------- 4. 組合器 ----------
  function buildConfigurator() {
    const groups = DATA.industries.map(ind => {
      const opts = DATA.cases.filter(c => c.industry === ind.id).map(c => `<option value="${c.id}">${esc(customerName(c))}｜${esc(c.title)}</option>`).join("");
      return opts ? `<optgroup label="${esc(ind.name)}">${opts}</optgroup>` : "";
    }).join("");
    $("#cfg-form").innerHTML = `
      <h3>報價組合器</h3>
      <div class="field">
        <label for="cfg-case">選擇客戶案例</label>
        <select id="cfg-case"><option value="">標準案（不指定客戶）</option>${groups}</select>
      </div>
      <label class="check"><input type="checkbox" id="cfg-reuse"> 既有授權沿用（只報人天與加購）</label>
      <fieldset>
        <legend>機器人（擇 1，必要）</legend>
        <label><input type="radio" name="cfg-prod" value="semi"> 半自動　${fmtWan(P.semi)}／年</label>
        <label><input type="radio" name="cfg-prod" value="full"> 全自動　${fmtWan(P.full)}／年</label>
      </fieldset>
      <div class="field">
        <label for="cfg-extra">加購半自動機器人：<output id="cfg-extra-out" for="cfg-extra"></output> 套</label>
        <input type="range" id="cfg-extra" min="0" max="5" step="1">
      </div>
      <div class="field">
        <label for="cfg-days">開發人天：<output id="cfg-days-out" for="cfg-days"></output> 人天 ${ASSUME}</label>
        <input type="range" id="cfg-days" min="0" max="60" step="1">
      </div>
      <button type="button" class="btn btn-ghost" id="cfg-reset">回到標準案</button>`;

    $("#cfg-case").addEventListener("change", e => {
      const c = CASE[e.target.value];
      state.cfg = c ? cfgFromCase(c) : defaultCfg();
      update();
    });
    $("#cfg-reuse").addEventListener("change", e => { state.cfg.existingLicense = e.target.checked; update(); });
    $$('input[name="cfg-prod"]').forEach(r => r.addEventListener("change", e => { state.cfg.productType = e.target.value; update(); }));
    $("#cfg-extra").addEventListener("input", e => { state.cfg.extraSemi = +e.target.value; update(); });
    $("#cfg-days").addEventListener("input", e => { state.cfg.days = +e.target.value; update(); });
    $("#cfg-reset").addEventListener("click", () => { state.cfg = defaultCfg(); update(); });
  }
  function syncConfiguratorControls() {
    $("#cfg-case").value = state.cfg.caseId;
    $("#cfg-reuse").checked = !!state.cfg.existingLicense;
    $$('input[name="cfg-prod"]').forEach(r => { r.checked = r.value === state.cfg.productType; });
    $("#cfg-extra").value = state.cfg.extraSemi;
    $("#cfg-days").value = state.cfg.days;
    $("#cfg-extra-out").textContent = state.cfg.extraSemi;
    $("#cfg-days-out").textContent = state.cfg.days;
  }
  function renderConfigurator() {
    syncConfiguratorControls();
    const q = configure(state.cfg);
    const c = CASE[q.caseId];
    const rows = q.lines.map(l => `<tr class="${l.qty ? "" : "zero"}"><td>${esc(l.label)}</td><td class="num">${l.qty}</td><td class="num">${fmtMoney(l.unit)}</td><td class="num">${fmtMoney(l.amount)}</td></tr>`).join("");
    const d = q.diffFromStandard;
    const diff = d === 0 ? `<p class="diff">＝ 與標準案相同</p>`
      : d > 0 ? `<p class="diff up">▲ 比標準案多 ${fmtMoney(d)}</p>`
      : `<p class="diff down">▼ 比標準案少 ${fmtMoney(-d)}</p>`;
    $("#cfg-result").innerHTML = `
      <h3>${c ? `${esc(customerName(c))}` : "標準案"}${c ? " " + srcBadge(c.customerSource) : ""}</h3>
      ${c ? `<p class="muted">${esc(c.title)}</p>` : ""}
      <table class="tbl">
        <thead><tr><th>品項</th><th class="num">數量</th><th class="num">單價</th><th class="num">小計</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr><td colspan="3">授權小計（年訂閱）</td><td class="num">${fmtMoney(q.license)}</td></tr>
          <tr><td colspan="3">開發小計（一次性）</td><td class="num">${fmtMoney(q.service)}</td></tr>
        </tfoot>
      </table>
      <div class="total-row"><span class="kpi-label">報價合計（回簽即計入業績）</span><strong class="big">${fmtMoney(q.total)}</strong></div>
      ${diff}
      <p class="muted">約等於 ${fmtNum(q.total / q.standard, 2)} 個標準案${c ? `；人天依流程預估（假設）` : ""}</p>`;
  }
  function renderStdExplain() {
    const s = DATA.standardCase;
    const dev = P.dev * s.devToolCount, semi = P.semi * s.semiCount, days = P.day * s.days;
    const total = standardCaseAmount();
    $("#std-explain").innerHTML = `
      <h3>標準案怎麼拆</h3>
      <div class="stack" role="img" aria-label="標準案組成：開發工具 ${fmtWan(dev)}、半自動 ${fmtWan(semi)}、開發 ${s.days} 人天 ${fmtWan(days)}">
        <span class="seg-dev" style="flex:${dev}"></span><span class="seg-semi" style="flex:${semi}"></span><span class="seg-days" style="flex:${days}"></span>
      </div>
      <ul class="legend">
        <li><span><span class="sw seg-dev"></span>開發工具 × ${s.devToolCount}</span><strong>${fmtMoney(dev)}</strong></li>
        <li><span><span class="sw seg-semi"></span>半自動機器人 × ${s.semiCount}</span><strong>${fmtMoney(semi)}</strong></li>
        <li><span><span class="sw seg-days"></span>中小規模流程 ${s.days} 人天 × ${fmtMoney(P.day)}</span><strong>${fmtMoney(days)}</strong></li>
        <li class="sum"><span>標準案合計</span><span>${fmtMoney(total)}</span></li>
      </ul>
      <h4>價目表</h4>
      <table class="tbl">
        <tbody>
          <tr><td>RPA 開發工具使用者（年）</td><td class="num">${fmtMoney(P.dev)}</td></tr>
          <tr><td>半自動機器人（年）</td><td class="num">${fmtMoney(P.semi)}</td></tr>
          <tr><td>全自動機器人（年）</td><td class="num">${fmtMoney(P.full)}</td></tr>
          <tr><td>開發專案（每人天）</td><td class="num">${fmtMoney(P.day)}</td></tr>
        </tbody>
      </table>`;
  }

  // ---------- 5. A／B ----------
  function bars(items, max) {
    return `<div class="bars">${items.map(it => `
      <div class="bar-row"><span>${esc(it.label)}</span>
        <span class="bar-track" aria-hidden="true"><span class="bar-fill" style="display:block;width:${(it.value / max) * 100}%"></span></span>
        <span class="num">${esc(it.text)}</span></div>`).join("")}</div>`;
  }
  function targetBar(parts, total) {
    const scale = Math.max(total, DATA.meta.target) * 1.04;
    const segs = parts.map(p => `<span class="target-fill ${p.cls || ""}" style="display:block;width:${(p.value / scale) * 100}%"></span>`).join("");
    return `<div class="target-bar" role="img" aria-label="合計 ${fmtWan(total)}，目標 ${fmtWan(DATA.meta.target)}">${segs}
      <span class="target-marker" style="left:${(DATA.meta.target / scale) * 100}%"><span>目標 ${fmtWan(DATA.meta.target)}</span></span></div>`;
  }
  function renderA() {
    const a = versionATotal();
    const fd = flagshipDelayImpact();
    const rows = a.deals.map(d => `<tr><td>${esc(IND[d.industry].short)}</td><td>${d.caseId ? `<button type="button" class="link-btn" data-open-case="${d.caseId}">${esc(CASE[d.caseId].customer)}</button>` : ""}</td><td>${esc(d.label)}</td><td class="num">${d.n}</td><td class="num">${fmtWan(d.amount)}</td></tr>`).join("");
    const inds = Object.entries(a.byIndustry).map(([k, v]) => ({ label: IND[k].short, value: v.amount, text: `${fmtWan(v.amount)}｜${fmtPct(v.amount / a.total)}` }));
    const maxInd = Math.max(...inds.map(i => i.value));
    const mfg = a.byIndustry.manufacturing || { amount: 0 };
    $("#ab-a").innerHTML = `
      <div class="ab-grid">
        <div class="panel">
          <h3>A 版：從零開始，新簽 ${a.count} 案</h3>
          <table class="tbl">
            <thead><tr><th>產業</th><th>客戶</th><th>案型</th><th class="num">案數</th><th class="num">金額</th></tr></thead>
            <tbody>${rows}</tbody>
            <tfoot><tr><td colspan="3">合計</td><td class="num">${a.count}</td><td class="num">${fmtMoney(a.total)}</td></tr></tfoot>
          </table>
        </div>
        <div class="panel">
          <h3>各產業金額</h3>
          ${bars(inds, maxInd)}
          ${targetBar([{ value: a.total }], a.total)}
          ${statusHtml(vsTarget(a.total))}
          <h4>風險說明</h4>
          <ul class="plain">
            <li>全自動旗艦 ${a.deals.filter(d => d.type === "flagship").reduce((s, d) => s + d.n, 0)} 案佔 ${fmtPct(fd.share)}；若延後，需約 ${fd.standardCases} 個標準案補位。</li>
            <li>製造業佔 ${fmtPct(mfg.amount / a.total)}，集中度高；以零售、高科技分散。</li>
            <li>A 版以 12 月啟動暖名單為前提（見時間軸）。</li>
          </ul>
        </div>
      </div>`;
  }
  function buildB() {
    const [lo, hi] = DATA.versionB.renewalRange;
    $("#ab-b").innerHTML = `
      <div class="ab-grid">
        <div class="panel">
          <h3>續約率敏感度 ${ASSUME}</h3>
          <div class="field">
            <label for="rr">續約率：<output id="rr-out" for="rr"></output>（基準 ${pct(DATA.versionB.renewalRate)}）</label>
            <input type="range" id="rr" min="${Math.round(lo * 100)}" max="${Math.round(hi * 100)}" step="1">
          </div>
          <div id="b-sens"></div>
        </div>
        <div class="panel" id="b-comp"></div>
      </div>`;
    $("#rr").addEventListener("input", e => { state.renewalRate = +e.target.value / 100; update(); });
  }
  function renderB() {
    const b = versionBTotal(state.renewalRate);
    $("#rr").value = Math.round(state.renewalRate * 100);
    $("#rr-out").textContent = pct(state.renewalRate);
    const rates = [...new Set([...DATA.versionB.sensitivityRates, state.renewalRate])].sort((x, y) => y - x);
    const sens = renewalSensitivity(rates);
    const rows = sens.map(s => {
      const cur = Math.abs(s.rate - state.renewalRate) < 1e-9;
      const after = s.shortfall === 0 ? `<span data-state="ok">✔ 已規劃足夠</span>` : `<span data-state="bad">差 ${fmtWan(s.shortfall)} → +${s.extraStandardCases} 標準案</span>`;
      return `<tr class="${cur ? "is-current" : ""}"><td>${pct(s.rate)}</td><td class="num">${fmtWan(s.renewal)}</td><td class="num">${fmtWan(s.gap)}</td><td class="num">${s.standardCases} 案</td><td>${after}</td></tr>`;
    }).join("");
    $("#b-sens").innerHTML = `
      <table class="tbl sens">
        <thead><tr><th>續約率</th><th class="num">續約金額</th><th class="num">缺口</th><th class="num">約需標準案</th><th>加上已規劃新增 ${fmtWan(b.newTotal)} 後</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p class="foot-note">缺口 = 目標 − 續約金額；「約需標準案」= 缺口 ÷ 標準案金額，無條件進位。</p>`;

    const SRC_LABEL = { existing: "既有客戶", new: "新客" };
    const dealRows = b.deals.map(d => `<tr><td>${SRC_LABEL[d.source]}</td><td>${d.caseId ? `<button type="button" class="link-btn" data-open-case="${d.caseId}">${esc(CASE[d.caseId].customer)}</button>` : ""}</td><td>${esc(d.label)}</td><td class="num">${d.n}</td><td class="num">${fmtWan(d.amount)}</td></tr>`).join("");
    $("#b-comp").innerHTML = `
      <h3>B 版：續約保底 + 新增 ${b.count} 案</h3>
      <table class="tbl">
        <thead><tr><th>來源</th><th>客戶</th><th>案型</th><th class="num">案數</th><th class="num">金額</th></tr></thead>
        <tbody>
          <tr><td>既有續約</td><td colspan="3">${fmtWan(DATA.versionB.renewalBase)} × ${pct(state.renewalRate)}</td><td class="num">${fmtWan(b.renewal)}</td></tr>
          ${dealRows}
        </tbody>
        <tfoot><tr><td colspan="4">合計</td><td class="num">${fmtMoney(b.total)}</td></tr></tfoot>
      </table>
      ${targetBar([{ value: b.renewal, cls: "renewal" }, { value: b.newTotal, cls: "newbiz" }], b.total)}
      <ul class="legend">
        <li><span><span class="sw seg-semi"></span>續約 ${fmtWan(b.renewal)}</span><span><span class="sw seg-dev"></span>新增 ${fmtWan(b.newTotal)}</span></li>
      </ul>
      ${statusHtml(vsTarget(b.total))}
      <ul class="plain">
        <li>擴充案免新授權採購、回簽快；公部門案以決標日視同回簽，當緩衝。</li>
        <li>續約率每降 5 個百分點，續約少 ${fmtWan(DATA.versionB.renewalBase * 0.05)}，約等於 ${fmtNum((DATA.versionB.renewalBase * 0.05) / standardCaseAmount(), 1)} 個標準案。</li>
      </ul>`;
  }
  function renderABToggle() {
    $$("[data-version]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.version === state.version)));
    $("#ab-a").classList.toggle("is-hidden", state.version !== "A");
    $("#ab-b").classList.toggle("is-hidden", state.version !== "B");
  }

  // ---------- 6. 漏斗 ----------
  const RATE_DEFS = [
    { key: "leadToOpp", label: "名單 → 有效商機", min: 5, max: 50, step: 1 },
    { key: "oppToPoc", label: "商機 → Demo／PoC", min: 20, max: 90, step: 5 },
    { key: "pocToWin", label: "PoC → 回簽", min: 20, max: 90, step: 5 },
    { key: "existingOppToWin", label: "既有客戶擴充：商機 → 回簽", min: 30, max: 90, step: 5 }
  ];
  function buildFunnel() {
    $("#funnel-rates").innerHTML = `
      <h3>轉換率 ${ASSUME}</h3>
      ${RATE_DEFS.map(r => `<div class="field">
        <label for="rate-${r.key}">${esc(r.label)}：<output id="rate-${r.key}-out" for="rate-${r.key}"></output></label>
        <input type="range" id="rate-${r.key}" data-rate="${r.key}" min="${r.min}" max="${r.max}" step="${r.step}">
      </div>`).join("")}
      <button type="button" class="btn btn-ghost" id="rate-reset">回到預設假設</button>
      <p class="foot-note">調整後，摘要、漏斗、風險與假設表同步更新。客單價由案型組合帶出，不可調。</p>`;
    $$("[data-rate]").forEach(inp => inp.addEventListener("input", e => {
      state.funnel[e.target.dataset.rate] = +e.target.value / 100;
      update();
    }));
    $("#rate-reset").addEventListener("click", () => { state.funnel = { ...DATA.funnel }; state.leads = null; update(); });

    $("#funnel-fwd").innerHTML = `
      <div class="panel">
        <div class="field">
          <label for="leads">名單數：<output id="leads-out" for="leads"></output> 份</label>
          <input type="range" id="leads" min="0" max="1000" step="5">
        </div>
        <div id="fwd-result"></div>
      </div>`;
    $("#leads").addEventListener("input", e => { state.leads = +e.target.value; update(); });
  }
  function funnelRows(items) {
    const top = Math.max(...items.map(i => i.value), 1);
    return `<div class="funnel">${items.map((it, i) => `
      ${i > 0 && it.rate != null ? `<p class="f-rate" aria-hidden="true">↓ ${pct(it.rate)}</p>` : ""}
      <div class="f-row${it.win ? " win" : ""}">
        <span><strong>${esc(it.label)}</strong></span>
        <span class="f-bar-wrap" aria-hidden="true"><span class="f-bar" style="width:${Math.max(2, (it.value / top) * 100)}%"></span></span>
        <span class="f-val">${esc(it.text)}${it.sub ? `<small>${esc(it.sub)}</small>` : ""}</span>
      </div>`).join("")}</div>`;
  }
  const rawSub = s => (Number.isInteger(+s.raw.toFixed(9)) ? "" : `未進位 ${fmtNum(s.raw, 2)}`);
  function renderFunnel() {
    const f = state.funnel;
    RATE_DEFS.forEach(r => {
      $(`#rate-${r.key}`).value = Math.round(f[r.key] * 100);
      $(`#rate-${r.key}-out`).textContent = pct(f[r.key]);
    });
    $$("[data-funnel-mode]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.funnelMode === state.funnelMode)));
    $("#funnel-back").classList.toggle("is-hidden", state.funnelMode !== "back");
    $("#funnel-fwd").classList.toggle("is-hidden", state.funnelMode !== "fwd");

    const a = versionATotal();
    const fa = funnelA(f);
    const fb = funnelB(f);
    const k = fa.byKey;
    const cov = { text: `${fmtNum(fa.coverage, 2)} 倍`, ok: fa.coverage >= fa.coverageTarget };
    const bk = fb.fresh.byKey;
    $("#funnel-back").innerHTML = `
      <div class="funnel-cols">
        <div class="panel">
          <h3>A 版：回簽 ${a.count} 案，需要…</h3>
          ${funnelRows([
            { label: "名單", value: k.lead.raw, text: `${k.lead.ceil} 份`, sub: rawSub(k.lead) },
            { label: "有效商機", value: k.opp.raw, text: `${k.opp.ceil} 個`, sub: rawSub(k.opp), rate: f.leadToOpp },
            { label: "Demo／PoC", value: k.poc.raw, text: `${k.poc.ceil} 場`, sub: rawSub(k.poc), rate: f.oppToPoc },
            { label: "回簽", value: a.count, text: `${a.count} 案`, rate: f.pocToWin, win: true }
          ])}
          <p class="coverage">商機加權覆蓋：${fmtNum(k.opp.raw, 1)} 個商機 × 平均客單 ${fmtWan(fa.avgTicket)} ÷ 目標 ${fmtWan(DATA.meta.target)} =
            <strong data-state="${cov.ok ? "ok" : "bad"}">${cov.text}</strong>（目標 ${fa.coverageTarget} 倍 ${ASSUME}）</p>
        </div>
        <div class="panel">
          <h3>B 版：新增案件需要…</h3>
          <h4>既有客戶擴充</h4>
          ${funnelRows([
            { label: "擴充商機", value: fb.existing.byKey.opp.raw, text: `${fb.existing.byKey.opp.ceil} 個`, sub: rawSub(fb.existing.byKey.opp) },
            { label: "回簽", value: fb.existing.deals, text: `${fb.existing.deals} 案`, rate: f.existingOppToWin, win: true }
          ])}
          <h4>新客</h4>
          ${funnelRows([
            { label: "名單", value: bk.lead.raw, text: `${bk.lead.ceil} 份`, sub: rawSub(bk.lead) },
            { label: "有效商機", value: bk.opp.raw, text: `${bk.opp.ceil} 個`, sub: rawSub(bk.opp), rate: f.leadToOpp },
            { label: "Demo／PoC", value: bk.poc.raw, text: `${bk.poc.ceil} 場`, sub: rawSub(bk.poc), rate: f.oppToPoc },
            { label: "回簽", value: fb.fresh.deals, text: `${fb.fresh.deals} 案`, rate: f.pocToWin, win: true }
          ])}
        </div>
      </div>`;

    // 正向
    const leads = state.leads ?? k.lead.ceil;
    $("#leads").value = leads;
    $("#leads-out").textContent = leads;
    const fw = funnelForward({ leads, rates: f, avgTicket: a.avgTicket });
    $("#fwd-result").innerHTML = `
      ${funnelRows([
        { label: "名單", value: fw.leads, text: `${fw.leads} 份` },
        { label: "有效商機", value: fw.opp, text: `${fmtNum(fw.opp, 1)} 個`, rate: f.leadToOpp },
        { label: "Demo／PoC", value: fw.poc, text: `${fmtNum(fw.poc, 1)} 場`, rate: f.oppToPoc },
        { label: "預期回簽", value: fw.wins, text: `${fmtNum(fw.wins, 1)} 案`, rate: f.pocToWin, win: true }
      ])}
      <div class="total-row"><span class="kpi-label">預期業績（× 平均客單 ${fmtWan(fw.avgTicket)}，由 A 版案型組合帶出）</span><strong class="big">${fmtWan(fw.amount)}</strong></div>
      ${statusHtml(vsTarget(fw.amount))}`;

    // 備註
    const pl = pocLoad(f);
    const [abLo, abHi] = DATA.funnel.abmAccounts;
    $("#funnel-notes").innerHTML = `
      <div class="note"><h4>百貨／金融走 ABM</h4><p>鎖定 ${abLo}–${abHi} 家目標客戶，名單量不是重點，重點是關係人地圖與單點突破。</p></div>
      <div class="note"><h4>PoC 團隊產能 ${ASSUME}</h4><p>A 版需 ${pl.poc} 場 Demo／PoC；若集中在 PoC 期約 ${fmtNum(pl.weeks, 1)} 週，平均每週 ${fmtNum(pl.perWeek, 1)} 場，需與團隊確認可支援量。</p></div>
      <div class="note"><h4>Demo ≠ PoC</h4><p>Demo 用標準範本、半天內完成；PoC 用客戶真實資料，建議付費並可抵扣正式報價，篩出高意願案件。</p></div>`;
  }

  // ---------- 7. 時間軸 ----------
  function renderTimeline() {
    const t = DATA.timeline;
    const start = Math.min(...t.phases.map(p => dayNum(p.start)));
    const end = dayNum(t.quarter[1]) + 1;
    const span = end - start;
    const x = iso => ((dayNum(iso) - start) / span) * 100;
    const xEnd = iso => ((dayNum(iso) + 1 - start) / span) * 100;

    const months = [];
    for (let n = start; n < end; n++) {
      const iso = isoOf(n);
      if (iso.endsWith("-01")) months.push(iso);
    }
    const monthHead = months.map(m => `<span style="left:${x(m)}%">${+m.slice(5, 7)} 月</span>`).join("");
    const monthLines = months.map(m => `<span class="tl-month" style="left:${x(m)}%"></span>`).join("");
    const rows = t.phases.map(p => `
      <div class="tl-row"><span class="tl-label">${esc(p.label)}</span>
        <span class="tl-track"><span class="tl-bar phase-${p.id}" title="${esc(p.label)} ${shortDate(p.start)}–${shortDate(p.end)}" style="left:${x(p.start)}%;width:${xEnd(p.end) - x(p.start)}%">${shortDate(p.start)}–${shortDate(p.end)}</span></span>
      </div>`).join("");
    const hw = t.holidayWindow;
    $("#timeline").innerHTML = `
      <div class="tl-body">
        <div class="tl-row tl-head"><span class="tl-label muted">階段</span><span class="tl-track">${monthHead}</span></div>
        ${rows}
        <div class="tl-row tl-marks"><span class="tl-label muted">關鍵日</span><span class="tl-track">
          <span class="tl-mark holiday" style="left:${x(hw[0])}%;top:0">春節空窗（暫定）<br>${shortDate(hw[0])}–${shortDate(hw[1])}・初一 ${shortDate(t.lunarNewYearDay1)}</span>
          <span class="tl-mark align-right" style="left:${xEnd(t.signTargetDate)}%;top:0">內部回簽目標 ${shortDate(t.signTargetDate)}</span>
          <span class="tl-mark align-right" style="left:100%;top:2.3rem">季末 ${shortDate(t.quarter[1])}</span>
        </span></div>
        <div class="tl-overlay" aria-hidden="true">
          ${monthLines}
          <span class="tl-holiday" style="left:${x(hw[0])}%;width:${xEnd(hw[1]) - x(hw[0])}%"></span>
          <span class="tl-line" style="left:${xEnd(t.signTargetDate)}%"></span>
          <span class="tl-line dashed" style="left:${x(t.quarter[0])}%"></span>
        </div>
      </div>
      <p class="foot-note">虛線＝Q1 開始；斜線區＝春節空窗；粗線＝內部回簽目標。Q1 有效工作天 ${workingDays().days} 天（扣週末、春節與暫定假日）。</p>`;

    $("#phase-cards").innerHTML = t.phases.map(p => `
      <div class="phase-card"><h4>${esc(p.label)}</h4><p class="muted">${shortDate(p.start)}–${shortDate(p.end)}</p>
        <ul>${(p.tasks || []).map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>`).join("");
  }

  // ---------- 8. 情境攻略 ----------
  function comboText(b) {
    const parts = [];
    if (b.dev) parts.push(`開發工具 ×${b.dev}`);
    if (b.semi) parts.push(`半自動 ×${b.semi}`);
    if (b.full) parts.push(`全自動 ×${b.full}`);
    if (b.days) parts.push(`${b.days} 人天`);
    return parts.join(" + ");
  }
  function renderScenarios() {
    const amts = Object.fromEntries(scenarioAmounts().map(s => [s.id, s]));
    $("#scenarios").innerHTML = DATA.scenarios.map(s => {
      const m = amts[s.id];
      return `<article class="scn">
        <h3>${esc(s.title)}</h3>
        <p class="amount">${fmtWan(m.main.total)}</p>
        <dl>
          <dt>適用情境</dt><dd>${esc(s.when)}</dd>
          <dt>組合 ${ASSUME}</dt><dd>${esc(comboText(m.main))}${s.addOnRenewal ? "（續約之外）" : ""}</dd>
          ${m.alt ? `<dt>替代方案</dt><dd>${esc(m.alt.label)}：${fmtWan(m.alt.total)}</dd>` : ""}
          <dt>對應產業</dt><dd class="badges">${s.industries.map(i => `<span class="badge role">${esc(IND[i].short)}</span>`).join("")}</dd>
          <dt>重點</dt><dd>${esc(s.note)}</dd>
        </dl>
      </article>`;
    }).join("");
  }

  // ---------- 9. 風險 ----------
  function riskImpact(r) {
    if (r.calc === "flagshipDelay") {
      const f = flagshipDelayImpact();
      return `A 版少 ${fmtWan(f.flagship)}，剩 ${fmtWan(f.without)}，距目標差 ${fmtWan(f.shortfall)} → 約需 ${f.standardCases} 個標準案補位`;
    }
    if (r.calc === "renewalDrop") {
      const s = renewalSensitivity([r.rate])[0];
      const exp = dealAmount("expansion");
      return s.shortfall === 0
        ? `續約率 ${pct(r.rate)}：續約 ${fmtWan(s.renewal)}，已規劃新增足以補上`
        : `續約率 ${pct(r.rate)}：續約 ${fmtWan(s.renewal)}，加上已規劃新增仍差 ${fmtWan(s.shortfall)} → 再 +${s.extraStandardCases} 個標準案或 ${Math.ceil(s.shortfall / exp)} 個擴充案`;
    }
    if (r.calc === "pocLoad") {
      const p = pocLoad(state.funnel);
      return `A 版需 ${p.poc} 場 Demo／PoC，PoC 期約 ${fmtNum(p.weeks, 1)} 週，平均每週 ${fmtNum(p.perWeek, 1)} 場`;
    }
    if (r.calc === "licenseOnly") {
      const lite = dealAmount("starterLite");
      return `只賣最低授權組合（開發工具＋半自動）每案約 ${fmtWan(lite)}，只有標準案的 ${fmtPct(lite / standardCaseAmount())}，同樣目標需要更多案數`;
    }
    if (r.calc === "govDelay") {
      const g = govDelayImpact();
      const line = (v, x) => x.shortfall === 0
        ? `${v}少 ${fmtWan(x.gov)}，剩 ${fmtWan(x.without)}，仍達標（超出 ${fmtWan(x.surplus)}）`
        : `${v}少 ${fmtWan(x.gov)}，剩 ${fmtWan(x.without)}，距目標差 ${fmtWan(x.shortfall)} → 約需 ${x.standardCases} 個標準案補位`;
      const ok = g.shortfall === 0 && g.b.shortfall === 0;
      return `${line("A 版", g)}；${line(`B 版（續約率 ${pct(g.b.rate)}）`, g.b)}${ok ? "：公部門案是緩衝，不是主力" : ""}`;
    }
    return "";
  }
  function renderRisks() {
    $("#risks").innerHTML = DATA.risks.map(r => `
      <article class="risk">
        <h3>${esc(r.title)}</h3>
        <dl class="risk-dl"><dt>觸發</dt><dd>${esc(r.trigger)}</dd>
        <dt>影響</dt><dd class="impact">${esc(riskImpact(r))}</dd>
        <dt>備援</dt><dd class="response">${esc(r.response)}</dd></dl>
      </article>`).join("");
  }

  // ---------- 10. 假設與來源 ----------
  function renderSources() {
    const list = collectAssumptions({ funnel: state.funnel, renewalRate: state.renewalRate });
    const groups = {};
    list.forEach(a => { (groups[a.group] = groups[a.group] || []).push(a); });
    $("#assumptions").innerHTML = `<h3>假設面板（${list.length} 項）</h3><div class="as-cols">${
      Object.entries(groups).map(([g, items]) => `<div class="as-group"><h4>${esc(g)}</h4><dl>${
        items.map(a => `<dt>${esc(a.label)}</dt><dd class="${a.wrap ? "wrap" : ""}">${esc(a.value)}${a.changed ? '<span class="tag-changed">已調整</span>' : ""}</dd>`).join("")
      }</dl></div>`).join("")}</div>`;

    const cs = customerSourceSummary();
    const citedBy = id => DATA.cases.filter(c => c.background.some(b => b.sourceId === id));
    $("#sources").innerHTML = `
      <h3>資訊標示與來源</h3>
      <div class="ev-legend">
        <p>${infoTag("fact")} 有公開來源可查（附連結）</p>
        <p>${infoTag("guess")} 依產業常見痛點 × 該公司營運型態推論，需 Discovery 驗證</p>
        <p>${infoTag("assume")} 效益數字為假設，非客戶實績</p>
        <p>客戶來源：${Object.entries(cs).map(([k, n]) => `${srcBadge(k)} ${n} 家`).join("　")}</p>
      </div>
      <ul class="src-list">${DATA.sources.map(s => {
        const cited = citedBy(s.id);
        return `<li>${srcLinks(s.id)}：${esc(s.summary)}${cited.length ? ` <span class="cited">→ ${cited.map(c => esc(c.customer)).join("、")}</span>` : ""}</li>`;
      }).join("")}</ul>
      <p class="foot-note">客戶背景皆取自公開資訊；「挑戰／流程現況」為外部觀察推估，不代表該公司一定有此問題，亦不涉及富士軟片內部客戶資料。</p>`;
  }

  // ---------- 列印附錄（PDF 備援，以預設假設計算）----------
  function renderAppendix() {
    const T = DATA.meta.target;
    const b = versionBTotal();
    const sensRates = [1.0, 0.98, 0.95, 0.93, 0.9, 0.88, 0.85];
    const sens = renewalSensitivity(sensRates).map(s => {
      const total = s.renewal + s.planned;
      const st = vsTarget(total);
      return `<tr><td>${pct(s.rate)}</td><td class="num">${fmtWan(s.renewal)}</td><td class="num">${fmtWan(total)}</td>
        <td><span data-state="${st.ok ? "ok" : "bad"}">${st.ok ? "✔ 達標" : `差 ${fmtWan(s.shortfall)} → +${s.extraStandardCases} 標準案`}</span></td></tr>`;
    }).join("");

    const leadRates = [0.1, 0.15, 0.2, 0.25, 0.3];
    const winRates = [0.3, 0.4, 0.5, 0.6];
    const grid = leadsNeededGrid(leadRates, winRates).map(r => `<tr><th>${pct(r.leadToOpp)}</th>${r.cells.map(c =>
      `<td class="num${r.leadToOpp === DATA.funnel.leadToOpp && c.pocToWin === DATA.funnel.pocToWin ? " hl" : ""}">${c.leads}</td>`).join("")}</tr>`).join("");

    const fwd = forwardTable([100, 140, 180, 220, 260]).map(f => {
      const st = vsTarget(f.amount);
      return `<tr><td class="num">${f.leads}</td><td class="num">${fmtNum(f.wins, 1)}</td><td class="num">${fmtWan(f.amount)}</td>
        <td><span data-state="${st.ok ? "ok" : "bad"}">${st.ok ? "✔" : "✘"} ${esc(st.text.replace(/^[✔✘] /, ""))}</span></td></tr>`;
    }).join("");

    const fd = flagshipDelayImpact();
    const fp = flagshipPhasedImpact();
    const a = versionATotal();
    const risk = [
      ["A 版基準", a.total, 0],
      ["旗艦延後到 Q2（Q1 不認列）", fd.without, fd.standardCases],
      ["旗艦改分階段（Q1 先半自動上線）", fp.total, fp.standardCases]
    ].map(([label, total, n]) => `<tr><td>${esc(label)}</td><td class="num">${fmtWan(total)}</td><td class="num">${total >= T ? "—" : fmtWan(T - total)}</td><td class="num">${n ? `+${n} 標準案` : "—"}</td></tr>`).join("");

    const combos = [
      ["標準案（開發工具 + 半自動 + 13 人天）", configure({}).total],
      ["標準案 + 加購 1 套半自動", configure({ extraSemi: 1 }).total],
      ["全自動 + 30 人天（旗艦）", configure({ productType: "full", days: 30 }).total],
      ["入門包（10 人天）", dealAmount("starter")],
      ["入門包（最低授權組合：開發工具＋半自動）", dealAmount("starterLite")],
      ["既有授權沿用：純人天 15", configure({ existingLicense: true, days: 15 }).total]
    ].map(([l, v]) => `<tr><td>${esc(l)}</td><td class="num">${fmtMoney(v)}</td></tr>`).join("");

    $("#ap-scenarios").innerHTML = `
      <p class="eyebrow">附錄 A</p>
      <h2>動態情境對照表</h2>
      <p class="muted">網頁中可即時調整的數字，在此以靜態表格呈現；皆以預設假設計算，轉換率、人天為假設。</p>
      <div class="ap-grid">
        <div class="panel"><h3>B 版：續約率敏感度（已規劃新增 ${fmtWan(b.newTotal)}）</h3>
          <table class="tbl"><thead><tr><th>續約率</th><th class="num">續約</th><th class="num">B 版合計</th><th>結果</th></tr></thead><tbody>${sens}</tbody></table></div>
        <div class="panel"><h3>A 版：所需名單量（列 = 名單→商機，欄 = PoC→回簽）</h3>
          <table class="tbl"><thead><tr><th></th>${winRates.map(w => `<th class="num">${pct(w)}</th>`).join("")}</tr></thead><tbody>${grid}</tbody></table>
          <p class="foot-note">商機→PoC 維持 ${pct(DATA.funnel.oppToPoc)}；底色為預設情境；回簽 ${a.count} 案。</p></div>
        <div class="panel"><h3>正向試算：名單數 → 預期業績（平均客單 ${fmtWan(a.avgTicket)}）</h3>
          <table class="tbl"><thead><tr><th class="num">名單</th><th class="num">預期回簽</th><th class="num">預期業績</th><th>對目標</th></tr></thead><tbody>${fwd}</tbody></table></div>
        <div class="panel"><h3>旗艦案風險情境（新纖）</h3>
          <table class="tbl"><thead><tr><th>情境</th><th class="num">A 版業績</th><th class="num">缺口</th><th class="num">補位</th></tr></thead><tbody>${risk}</tbody></table>
          <h3 style="margin-top:.6rem">常見報價組合（組合器）</h3>
          <table class="tbl"><tbody>${combos}</tbody></table></div>
      </div>`;

    $("#ap-cases").innerHTML = `<div class="ap-title"><p class="eyebrow">附錄 B</p><h2>客戶案例完整內容（${DATA.cases.length} 家）</h2>
      <p class="muted">背景＝公開事實（附來源）；挑戰＝推估，需 Discovery 驗證；效益＝試算假設，非客戶實績。</p></div>` +
      DATA.cases.map(c => `<article class="ap-case">${caseDetailHtml(c)}</article>`).join("");
  }

  // ---------- 更新（保留焦點）----------
  const FOCUS_ATTRS = ["data-case", "data-filter", "data-industry", "data-open-case", "data-goto-cfg"];
  function update() {
    const act = document.activeElement;
    let restore = null;
    if (act) for (const a of FOCUS_ATTRS) if (act.hasAttribute && act.hasAttribute(a)) { restore = `[${a}="${act.getAttribute(a)}"]`; break; }

    renderBinds();
    renderIndustries();
    renderCaseFilter();
    renderCaseGrid();
    renderCaseDetail();
    renderConfigurator();
    renderA();
    renderB();
    renderABToggle();
    renderFunnel();
    renderRisks();
    renderSources();

    if (restore && !document.body.contains(act)) {
      const el = $(restore);
      if (el) el.focus({ preventScroll: true });
    }
  }

  // ---------- 導覽 ----------
  let current = 0;
  function go(i) {
    current = Math.max(0, Math.min(sections.length - 1, i));
    const s = sections[current];
    s.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "start" });
    s.focus({ preventScroll: true });
    markCurrent();
  }
  function buildDots() {
    $("#dots").innerHTML = sections.map((s, i) =>
      `<a class="dot" href="#${s.id}" data-goto="${i}" aria-label="第 ${i + 1} 章：${esc(s.dataset.title)}"><span class="dot-label">${i + 1}. ${esc(s.dataset.title)}</span></a>`).join("");
  }
  function markCurrent() {
    $$(".dot").forEach((d, i) => d.setAttribute("aria-current", String(i === current)));
    $("#progress-bar").style.width = `${((current + 1) / sections.length) * 100}%`;
  }
  function detectCurrent() {
    const y = window.scrollY + window.innerHeight * 0.4;
    let idx = 0;
    sections.forEach((s, i) => { if (s.offsetTop <= y) idx = i; });
    if (idx !== current) { current = idx; markCurrent(); }
  }
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; detectCurrent(); });
  }, { passive: true });

  const help = $("#help");
  function toggleHelp() {
    if (help.open) help.close(); else help.showModal();
  }

  document.addEventListener("keydown", e => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === "?") { e.preventDefault(); toggleHelp(); return; }
    if (help.open) return;
    const tag = (e.target.tagName || "").toUpperCase();
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
    const onControl = tag === "BUTTON" || tag === "A" || tag === "SUMMARY";
    let handled = true;
    switch (e.key) {
      case "ArrowRight": case "PageDown": go(current + 1); break;
      case "ArrowLeft": case "PageUp": go(current - 1); break;
      case " ":
        if (onControl) { handled = false; break; }
        e.shiftKey ? go(current - 1) : go(current + 1); break;
      case "Home": go(0); break;
      case "End": go(sections.length - 1); break;
      default:
        if (/^[0-9]$/.test(e.key)) go(e.key === "0" ? 9 : +e.key - 1);
        else handled = false;
    }
    if (handled) e.preventDefault();
  });

  document.addEventListener("click", e => {
    const t = e.target.closest("[data-goto],[data-industry],[data-filter],[data-case],[data-open-case],[data-goto-cfg],[data-version],[data-funnel-mode]");
    if (!t) return;
    const d = t.dataset;
    if (d.goto !== undefined) { e.preventDefault(); go(+d.goto); return; }
    if (d.industry) {
      state.industry = state.industry === d.industry ? "all" : d.industry;
      syncOpenCaseToFilter();
    } else if (d.filter) {
      state.industry = d.filter;
      syncOpenCaseToFilter();
    } else if (d.case) {
      state.openCase = state.openCase === d.case ? null : d.case;
    } else if (d.openCase) {
      state.openCase = d.openCase;
      update();
      go(sections.findIndex(s => s.id === "s-cases"));
      return;
    } else if (d.gotoCfg) {
      const c = CASE[d.gotoCfg];
      state.cfg = cfgFromCase(c);
      update();
      go(sections.findIndex(s => s.id === "s-pricing"));
      return;
    } else if (d.version) {
      state.version = d.version;
    } else if (d.funnelMode) {
      state.funnelMode = d.funnelMode;
    }
    update();
  });
  function syncOpenCaseToFilter() {
    const list = filteredCases();
    if (!list.some(c => c.id === state.openCase)) state.openCase = list.length ? list[0].id : null;
  }

  // ---------- 初始化 ----------
  decorateSections();
  buildDots();
  buildConfigurator();
  buildB();
  buildFunnel();
  renderStdExplain();
  renderTimeline();
  renderScenarios();
  renderAppendix();
  update();
  detectCurrent();
  markCurrent();
})();
