#!/usr/bin/env node
/* 千江月 · 轴表体检
 *
 * 定义的自我一致性靠人看，冗余靠数据算。
 * 若两根轴在全部条目上高度相关，说明它们测的是同一件事，应合并。
 *
 * 输出：
 *   1. 相关系数矩阵──|r| 高的轴对是合并候选
 *   2. 每根轴的有效样本数与方向偏移
 *   3. 条目在被两根轴同时描述的频次（稀疏度）
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');

const sandbox = { console: { log: function () {} } };
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

const FILES = ['data', 'data-2', 'data-3', 'data-4', 'data-5', 'data-6', 'data-7', 'data-8', 'data-9',
  'axes', 'coordinates'];
FILES.forEach(function (f) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'assets', f + '.js'), 'utf8'), sandbox, { filename: f + '.js' });
});

const AXES = sandbox.window.QJY_AXES.list;
const MAP = sandbox.window.QJY_COORD.map;
const ids = Object.keys(MAP);
const N = AXES.length;

function col(i) { return ids.map(function (id) { return MAP[id].v[i] || 0; }); }
function mean(a) { return a.reduce(function (s, x) { return s + x; }, 0) / a.length; }
function sd(a) {
  const m = mean(a);
  return Math.sqrt(a.reduce(function (s, x) { return s + (x - m) * (x - m); }, 0) / a.length);
}
function corr(a, b) {
  const ma = mean(a), mb = mean(b);
  const sa = sd(a), sb = sd(b);
  if (!sa || !sb) return 0;
  let num = 0;
  for (let i = 0; i < a.length; i++) num += (a[i] - ma) * (b[i] - mb);
  return num / a.length / (sa * sb);
}

console.log('\n=== 1. 轴相关矩阵（|r| ≥ 0.40 标出）===');
const cols = AXES.map(function (_, i) { return col(i); });

console.log('        ' + AXES.map(function (a) { return a.name.padStart(4, '　'); }).join(' '));
const flagged = [];
for (let i = 0; i < N; i++) {
  let row = '  ' + AXES[i].name.padEnd(4, '　') + ' ';
  for (let j = 0; j < N; j++) {
    if (i === j) { row += '   ·'; continue; }
    const r = corr(cols[i], cols[j]);
    row += (Math.abs(r) >= 0.40 ? ' ' : ' ') + r.toFixed(2).padStart(5);
    if (j > i && Math.abs(r) >= 0.40) flagged.push({ a: AXES[i].name, b: AXES[j].name, r: r });
  }
  console.log(row);
}

console.log('\n  高相关轴对（合并候选）：');
if (!flagged.length) {
  console.log('    无。所有轴对 |r| < 0.40。');
} else {
  flagged.sort(function (a, b) { return Math.abs(b.r) - Math.abs(a.r); });
  flagged.forEach(function (f) {
    console.log('    · ' + f.a + ' ↔ ' + f.b + '　r = ' + f.r.toFixed(2) +
      '　' + (Math.abs(f.r) >= 0.60 ? '高度疑似冗余' : '需要留意'));
  });
}

console.log('\n=== 2. 每根轴的使用情况 ===');
AXES.forEach(function (a, i) {
  const c = cols[i];
  const used = c.filter(function (x) { return x !== 0; }).length;
  const pos = c.filter(function (x) { return x > 0; }).length;
  const neg = c.filter(function (x) { return x < 0; }).length;
  const strong = c.filter(function (x) { return Math.abs(x) === 2; }).length;
  console.log('  ' + a.name.padEnd(4, '　') + ' 使用 ' + String(used).padStart(2) + '/' + ids.length +
    '（强 ' + String(strong).padStart(2) + '）  +' + String(pos).padStart(2) + ' / −' + String(neg).padStart(2) +
    '  平均 ' + mean(c).toFixed(2) + '  标准差 ' + sd(c).toFixed(2));
});

console.log('\n=== 3. 稀疏度 ===');
const perTheme = ids.map(function (id) {
  return MAP[id].v.filter(function (x) { return x !== 0; }).length;
});
const avgNonZero = perTheme.reduce(function (s, x) { return s + x; }, 0) / perTheme.length;
console.log('  平均每条道理落在 ' + avgNonZero.toFixed(2) + ' 根轴上（共 ' + N + ' 根）');
console.log('  只落在 1 根轴的条目：' + perTheme.filter(function (x) { return x === 1; }).length + ' 条');
console.log('  落在 2 根轴的条目：' + perTheme.filter(function (x) { return x === 2; }).length + ' 条');
console.log('  落在 3 根及以上的：' + perTheme.filter(function (x) { return x >= 3; }).length + ' 条');

/* 两轴同时有立场、且组合从未出现的槽（真正的"高价值空格"） */
console.log('\n=== 4. 高价值空格（两轴都强，但组合没人占）===');
let shown = 0;
for (let i = 0; i < N && shown < 10; i++) {
  for (let j = i + 1; j < N && shown < 10; j++) {
    /* 只在「两轴各自被用得较多」的组合里找空格，避免噪声 */
    const ui = cols[i].filter(function (x) { return x !== 0; }).length;
    const uj = cols[j].filter(function (x) { return x !== 0; }).length;
    if (ui < 8 || uj < 8) continue;
    for (const si of [-1, 1]) {
      for (const sj of [-1, 1]) {
        const members = ids.filter(function (id) {
          const v = MAP[id].v;
          const a = v[i] || 0, b = v[j] || 0;
          return (si > 0 ? a >= 1 : a <= -1) && (sj > 0 ? b >= 1 : b <= -1);
        });
        if (members.length === 0 && shown < 10) {
          console.log('    · 「' + (si > 0 ? AXES[i].pos : AXES[i].neg) + '」×「' +
            (sj > 0 ? AXES[j].pos : AXES[j].neg) + '」');
          shown++;
        }
      }
    }
  }
}
if (!shown) console.log('    无（常用轴的组合都已被占）');
console.log('');
