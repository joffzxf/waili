#!/usr/bin/env node
/* 生成格子普查表：剩余每一个冻结空格的状态、候选方向或无法成立的理由 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');

const s = { console: { log: function () {} } };
s.window = s; s.globalThis = s;
vm.createContext(s);
const F = ['data', 'data-2', 'data-3', 'data-4', 'data-5', 'data-6', 'data-7', 'data-8', 'data-9',
  'data-10', 'data-11', 'data-12', 'data-13', 'data-14', 'data-15', 'data-16', 'data-17', 'data-18',
  'axes', 'coordinates'];
F.forEach(function (f) {
  const p = path.join(ROOT, 'assets', f + '.js');
  if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, 'utf8'), s, { filename: f + '.js' });
});

const AX = s.window.QJY_AXES.list;
const M = s.window.QJY_COORD.map;
const ids = Object.keys(M);
const tgt = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'high-value-cells.json'), 'utf8'));
const byId = {};
AX.forEach(function (a, i) { byId[a.name] = i; });


/* 人工判断放在 docs/cell-notes.json，生成器只负责合并与排版 */
const NOTES_FILE = path.join(ROOT, 'docs', 'cell-notes.json');
let NOTES = {};
try {
  NOTES = JSON.parse(fs.readFileSync(NOTES_FILE, 'utf8')).notes || {};
} catch (e) {
  NOTES = {};
}

const rows = [];
tgt.cells.forEach(function (c, n) {
  const i = byId[c.a], j = byId[c.b];
  const si = c.ap === AX[i].pos ? 1 : -1;
  const sj = c.bp === AX[j].pos ? 1 : -1;
  const has = ids.some(function (id) {
    const v = M[id].v;
    const a = v[i] || 0, b = v[j] || 0;
    return (si > 0 ? a >= 1 : a <= -1) && (sj > 0 ? b >= 1 : b <= -1);
  });
  if (has) return;
  const note = NOTES[c.label];
  rows.push({
    n: n + 1,
    label: c.label,
    status: note ? note.status : '未逐一检索',
    why: note ? note.why : '还没看'
  });
});

const lines = [];
lines.push('# 高价值空格 · 普查表');
lines.push('');
lines.push('> 由 `node tools/cell-census.js` 生成。冻结清单共 ' + tgt.cells.length +
  ' 格，已填 ' + (tgt.cells.length - rows.length) + '，剩余 **' + rows.length + '**。');
lines.push('> 当前语料 ' + ids.length + ' 条。');
lines.push('');
lines.push('## 状态说明');
lines.push('');
lines.push('| 状态 | 含义 |');
lines.push('|---|---|');
lines.push('| 已填 | 已有条目占据该格 |');
lines.push('| 待考 | 有方向，但还没找到可查原典 |');
lines.push('| 较难 | 两种立场在真实思想传统里张力很大，可能无典可依 |');
lines.push('| 未逐一检索 | 还没看 |');
lines.push('');
lines.push('## 剩余格子');
lines.push('');
lines.push('| # | 格子 | 状态 | 备注 |');
lines.push('|---|---|---|---|');
rows.forEach(function (r) {
  lines.push('| ' + r.n + ' | ' + r.label + ' | ' + r.status + ' | ' + r.why + ' |');
});
lines.push('');
lines.push('## 为什么会有「较难」');
lines.push('');
lines.push('轴的判定是「两轴都取到 |值| ≥ 1」，而真实的思想传统里，');
lines.push('有些立场组合几乎不共存——例如「活在当下」与「服从传统」，');
lines.push('或「退隐」与「冒险」。这类格子不是找得不努力，是那样的人少。');
lines.push('');
lines.push('**本项目的底线：宁可留空，也不编一句查不到出处的话。**');

fs.writeFileSync(path.join(ROOT, 'docs', 'cell-census.md'), lines.join('\n'), 'utf8');
console.log('剩余 ' + rows.length + ' 格 → docs/cell-census.md');
