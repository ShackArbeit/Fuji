// DOM 與互動；只讀 DATA 與 calc 結果。M0 階段僅顯示驗算表。
(function () {
  "use strict";

  function get(obj, path) {
    return path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
  }

  function bindAll(root) {
    root.querySelectorAll("[data-bind]").forEach(el => {
      const v = get({ meta: DATA.meta }, el.getAttribute("data-bind"));
      if (v != null) el.textContent = v;
    });
  }

  function renderM0() {
    const a = versionATotal();
    const b = versionBTotal();
    const fa = funnelA();
    const fb = funnelB();
    const sens = renewalSensitivity()
      .map(s => `${Math.round(s.rate * 100)}%：缺口 ${fmtWan(s.gap)} → ${s.standardCases} 案`)
      .join("；");
    const rows = [
      ["標準案金額", fmtMoney(standardCaseAmount())],
      ["全自動旗艦", fmtMoney(dealAmount("flagship"))],
      ["入門包（10 人天）", fmtMoney(dealAmount("starter"))],
      ["入門包（純授權）", fmtMoney(dealAmount("starterLite"))],
      ["既有客戶擴充", fmtMoney(dealAmount("expansion"))],
      ["A 版合計", `${fmtMoney(a.total)}（${a.count} 案）`],
      ["B 版（基準續約率）", `${fmtMoney(b.renewal)} + ${fmtMoney(b.newTotal)} = ${fmtMoney(b.total)}（新增 ${b.count} 案）`],
      ["A 版漏斗", `PoC ${fa.byKey.poc.ceil}、商機 ${fa.byKey.opp.ceil}、名單 ${fa.byKey.lead.ceil}、覆蓋 ${fa.coverage.toFixed(2)} 倍`],
      ["B 版漏斗", `擴充商機 ${fb.existing.byKey.opp.raw.toFixed(2)}（進位 ${fb.existing.byKey.opp.ceil}）、新客商機 ${fb.fresh.byKey.opp.ceil}、新客名單 ${fb.fresh.byKey.lead.ceil}`],
      ["B 敏感度", sens]
    ];
    const tbody = document.getElementById("m0-table");
    rows.forEach(([k, v]) => {
      const tr = document.createElement("tr");
      const th = document.createElement("td");
      const td = document.createElement("td");
      th.textContent = k;
      td.textContent = v;
      tr.append(th, td);
      tbody.append(tr);
    });
  }

  bindAll(document);
  renderM0();
})();
