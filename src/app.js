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
  const evBadge = level => `<span class="badge ev ev-${level === "A-" ? "Am" : esc(level)}">證據 ${esc(level)}</span>`;
  const prodBadge = t => `<span class="badge prod-${t}">${t === "full" ? "全自動" : "半自動"}</span>`;
  const roleBadge = ind => `<span class="badge role${ind.role === "主攻" ? " role-main" : ""}">${esc(ind.role)}</span>`;

  // ---------- 狀態 ----------
  const defaultCfg = () => ({ caseId: "", productType: "semi", extraSemi: 0, days: DATA.standardCase.days });
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
      "wd.days": wd.days,
      "time.sign": shortDate(DATA.timeline.signTargetDate),
      "time.buffer": wd.bufferDays,
      "hero.title": CASE[DATA.meta.heroCaseId].title
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
        <thead><tr><th scope="col">產業（角色）</th>${head}<th scope="col" class="num">合計</th><th scope="col" class="num">A 版案數</th><th scope="col" class="num">痛點卡</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p class="foot-note">評分 1–5 為主觀假設；「導入阻力」分數越高代表阻力越低。點產業名稱可篩選痛點卡片。</p>`;

    const ind = IND[state.industry];
    const det = $("#industry-detail");
    if (!ind) {
      det.innerHTML = `<h3>怎麼看這張表</h3>
        <ul class="plain">
          <li>製造業：分數最高，作為主攻，A 版超過一半案數在這裡。</li>
          <li>零售：決策快，但客單偏低，作為副攻。</li>
          <li>百貨、金融：家數少或審查長，走 ABM 單點突破與既有客戶擴充。</li>
        </ul>
        <p class="foot-note">點左側任一產業，查看切入理由與對應痛點流程。</p>`;
      return;
    }
    const cases = DATA.cases.filter(c => c.industry === ind.id);
    const nDeals = (a.byIndustry[ind.id] || { n: 0, amount: 0 });
    det.innerHTML = `<h3>${esc(ind.name)} ${roleBadge(ind)}</h3>
      <p>${esc(ind.pitch)} <span class="tag-assume">推論</span></p>
      <h4>A 版規劃</h4>
      <p>${nDeals.n} 案、${fmtWan(nDeals.amount)}${ind.abm ? "（ABM：鎖定少數目標客戶）" : ""}</p>
      <h4>對應痛點流程（${cases.length}）</h4>
      <ul>${cases.map(c => `<li><button type="button" class="link-btn" data-open-case="${c.id}">${esc(c.title)}</button> ${evBadge(c.evidence.level)}</li>`).join("")}</ul>`;
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
      return `<button type="button" class="case-card${hero ? " is-hero" : ""}" data-case="${c.id}" aria-expanded="${state.openCase === c.id}" aria-controls="case-detail">
        <span class="case-top">${esc(IND[c.industry].short)}${hero ? ' <span class="badge hero-badge">主打</span>' : ""}</span>
        <span class="case-title">${esc(c.title)}</span>
        <span class="case-meta">${evBadge(c.evidence.level)}${prodBadge(c.productType)}<span>${c.estDays} 人天</span></span>
      </button>`;
    }).join("");
  }
  function renderCaseDetail() {
    const c = CASE[state.openCase];
    const el = $("#case-detail");
    if (!c) {
      el.innerHTML = `<p class="muted">點左側任一卡片，展開痛點、流程、報價與證據。</p>`;
      return;
    }
    const q = configure({ caseId: c.id });
    const hero = c.id === DATA.meta.heroCaseId;
    const refs = c.evidence.refs.map(r => {
      const s = SRC[r.sourceId];
      const t = s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a>` : esc(s.title);
      return `<li>${t}：${esc(r.note)}</li>`;
    }).join("");
    el.innerHTML = `
      <div class="detail-head">
        <h3>${esc(c.title)}</h3>${evBadge(c.evidence.level)}${prodBadge(c.productType)}
        <span class="muted">${esc(IND[c.industry].name)}${hero ? "｜主打流程" : ""}${c.existingCustomerCandidate ? "｜適合既有客戶擴充" : ""}</span>
      </div>
      <p class="pain">${esc(c.painStory)}</p>
      <div class="flows">
        <div class="flow"><h4>現況：全靠人工</h4><ol>
          ${c.asIs.map(s => `<li class="step step-manual"><span class="actor">人工</span><span>${esc(s)}</span></li>`).join("")}
        </ol></div>
        <div class="flow"><h4>導入後：機器人做、人覆核</h4><ol>
          ${c.toBe.map(s => `<li class="step step-${s.actor}"><span class="actor">${s.actor === "robot" ? "機器人" : "人工覆核"}</span><span>${esc(s.text)}</span></li>`).join("")}
        </ol></div>
      </div>
      <div class="detail-foot">
        <div class="box">
          <p class="kpi-label">報價試算 ${ASSUME}</p>
          <p class="quote-total">${fmtWan(q.total)}</p>
          <p>授權 ${fmtWan(q.license)}（開發工具 + ${ROBOT[q.productType]}）+ 開發 ${q.days} 人天 ${fmtWan(q.service)}</p>
          <p class="muted">${esc(c.productNote || "")}</p>
          <p><button type="button" class="btn btn-ghost" data-goto-cfg="${c.id}">在組合器調整 →</button></p>
        </div>
        <div class="box evidence">
          <p class="kpi-label">${evBadge(c.evidence.level)} ${esc(DATA.evidenceLevels[c.evidence.level])}</p>
          <p>${esc(c.evidence.why)}</p>
          <ul>${refs}</ul>
        </div>
      </div>`;
  }

  // ---------- 4. 組合器 ----------
  function buildConfigurator() {
    const groups = DATA.industries.map(ind => {
      const opts = DATA.cases.filter(c => c.industry === ind.id).map(c => `<option value="${c.id}">${esc(c.title)}</option>`).join("");
      return opts ? `<optgroup label="${esc(ind.name)}">${opts}</optgroup>` : "";
    }).join("");
    $("#cfg-form").innerHTML = `
      <h3>報價組合器</h3>
      <div class="field">
        <label for="cfg-case">選擇流程</label>
        <select id="cfg-case"><option value="">標準案（不指定流程）</option>${groups}</select>
      </div>
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
      state.cfg = c ? { caseId: c.id, productType: c.productType, extraSemi: 0, days: c.estDays } : defaultCfg();
      update();
    });
    $$('input[name="cfg-prod"]').forEach(r => r.addEventListener("change", e => { state.cfg.productType = e.target.value; update(); }));
    $("#cfg-extra").addEventListener("input", e => { state.cfg.extraSemi = +e.target.value; update(); });
    $("#cfg-days").addEventListener("input", e => { state.cfg.days = +e.target.value; update(); });
    $("#cfg-reset").addEventListener("click", () => { state.cfg = defaultCfg(); update(); });
  }
  function syncConfiguratorControls() {
    $("#cfg-case").value = state.cfg.caseId;
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
      <h3>${c ? esc(c.title) : "標準案"}${c ? " " + evBadge(c.evidence.level) : ""}</h3>
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
    const rows = a.deals.map(d => `<tr><td>${esc(IND[d.industry].short)}</td><td>${esc(d.label)}${d.caseId ? `<br><span class="muted">${esc(CASE[d.caseId].title)}</span>` : ""}</td><td class="num">${d.n}</td><td class="num">${fmtWan(d.unit)}</td><td class="num">${fmtWan(d.amount)}</td></tr>`).join("");
    const inds = Object.entries(a.byIndustry).map(([k, v]) => ({ label: IND[k].short, value: v.amount, text: `${fmtWan(v.amount)}｜${fmtPct(v.amount / a.total)}` }));
    const maxInd = Math.max(...inds.map(i => i.value));
    const mfg = a.byIndustry.manufacturing || { amount: 0 };
    $("#ab-a").innerHTML = `
      <div class="ab-grid">
        <div class="panel">
          <h3>A 版：從零開始，新簽 ${a.count} 案</h3>
          <table class="tbl">
            <thead><tr><th>產業</th><th>案型</th><th class="num">案數</th><th class="num">單價</th><th class="num">小計</th></tr></thead>
            <tbody>${rows}</tbody>
            <tfoot><tr><td colspan="2">合計</td><td class="num">${a.count}</td><td></td><td class="num">${fmtMoney(a.total)}</td></tr></tfoot>
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
    const dealRows = b.deals.map(d => `<tr><td>${SRC_LABEL[d.source]}</td><td>${esc(d.label)}</td><td class="num">${d.n}</td><td class="num">${fmtWan(d.unit)}</td><td class="num">${fmtWan(d.amount)}</td></tr>`).join("");
    $("#b-comp").innerHTML = `
      <h3>B 版：續約保底 + 新增 ${b.count} 案</h3>
      <table class="tbl">
        <thead><tr><th>來源</th><th>項目</th><th class="num">案數</th><th class="num">單價</th><th class="num">小計</th></tr></thead>
        <tbody>
          <tr><td>既有續約</td><td>${fmtWan(DATA.versionB.renewalBase)} × ${pct(state.renewalRate)}</td><td></td><td></td><td class="num">${fmtWan(b.renewal)}</td></tr>
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
        <li>新增以「既有客戶擴充（純人天）」為主：不需新授權採購流程，回簽較快。</li>
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
      return `純授權每案約 ${fmtWan(lite)}，只有標準案的 ${fmtPct(lite / standardCaseAmount())}，同樣目標需要更多案數`;
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

    const ev = evidenceSummary();
    const citedBy = id => DATA.cases.filter(c => c.evidence.refs.some(r => r.sourceId === id));
    $("#sources").innerHTML = `
      <h3>證據等級與來源</h3>
      <div class="ev-legend">${Object.entries(DATA.evidenceLevels).map(([lv, d]) => `<p>${evBadge(lv)} ${ev[lv]} 張：${esc(d)}</p>`).join("")}</div>
      <ul class="src-list">${DATA.sources.map(s => {
        const cs = citedBy(s.id);
        const t = s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a>` : `<strong>${esc(s.title)}</strong>`;
        return `<li>${t}：${esc(s.summary)}${cs.length ? ` <span class="cited">→ ${cs.map(c => esc(c.title)).join("、")}</span>` : ""}</li>`;
      }).join("")}</ul>
      <p class="foot-note">公開案例皆為「同類型案例」，用於佐證痛點存在；不代表任何特定潛在客戶一定有此痛點，亦不涉及富士軟片內部客戶資料。</p>`;
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
      state.cfg = { caseId: c.id, productType: c.productType, extraSemi: 0, days: c.estDays };
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
  update();
  detectCurrent();
  markCurrent();
})();
