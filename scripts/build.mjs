// 把 style / data / calc / app 內嵌進 template → dist/rpa-plan.html（零依賴）
import { readFileSync, writeFileSync, mkdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = p => readFileSync(join(root, p), "utf8");

// 移除 export 前綴（src/*.js 之間不使用 import）
const stripExports = src => {
  if (/^\s*import\s/m.test(src)) throw new Error("src/*.js 不得使用 import");
  return src.replace(/^export\s+(?=(const|let|function|class)\b)/gm, "");
};

const parts = {
  STYLE: read("src/style.css"),
  DATA: stripExports(read("src/data.js")),
  CALC: stripExports(read("src/calc.js")),
  APP: stripExports(read("src/app.js"))
};

for (const [k, v] of Object.entries(parts)) {
  if (k !== "STYLE" && /<\/script/i.test(v)) throw new Error(`${k} 內含 </script，會破壞內嵌`);
  if (k === "STYLE" && /<\/style/i.test(v)) throw new Error("style.css 內含 </style");
}

let html = read("src/index.template.html");
for (const [k, v] of Object.entries(parts)) {
  const marker = `<!--${k}-->`;
  if (!html.includes(marker)) throw new Error(`template 缺少佔位 ${marker}`);
  html = html.replace(marker, () => v);
}

const out = join(root, "dist/rpa-plan.html");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html, "utf8");
const kb = statSync(out).size / 1024;
console.log(`✔ build 完成：dist/rpa-plan.html（${kb.toFixed(1)} KB）`);
if (kb > 500) console.warn("⚠ 檔案超過建議上限 500KB");
