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

/* 已想过的候选方向 / 无法成立的理由（键为格子标签） */
const NOTES = {
  '归因·境（顺势） × 认识·亲自验证': '待考：既认命又亲自求证，可用「尽人事听天命」这一类，但现有一句常被用作反向，须找到明确原典',
  '归因·境（顺势） × 执行·临机权变': '待考：顺势而行 + 见机而作，两者其实相邻，缺的是一位明确写过「因势而动」的人',
  '关系·个体自主 × 时间·当下兑现': '待考：为自己活且趁现在，容易写成享乐主义；需要与「及时行乐」区分开的原典',
  '规范·后果优先 × 姿态·出世': '较难：看后果的人通常想改变结果，与「退开」张力大；庄子「无用之用」可能是唯一入口',
  '规范·原则优先 × 情绪·外放': '待考：守原则且外放，正是谏臣一类；可由「面折廷争」拆分出不同坐标',
  '时间·当下兑现 × 认识·承袭权威': '较难：珍惜当下的人多半反传统；传统主义者多半看长远。这一格可能真的空',
  '姿态·入世 × 风险·避险': '待考：入世又要避险，近似「明哲保身」，但那条在坐标上 D=0',
  '姿态·出世 × 风险·冒险': '较难：退开的人不冒险；冒险的人不退开',
  '姿态·入世 × 执行·临机权变': '待考：入世 + 见机，接近「识时务」，但那条 C=−1 D=+1，缺 K'
};

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
  rows.push({
    n: n + 1,
    label: c.label,
    note: NOTES[c.label] || '未逐一检索'
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
  const st = r.note.indexOf('较难') === 0 ? '较难' :
    (r.note.indexOf('待考') === 0 ? '待考' : '未逐一检索');
  lines.push('| ' + r.n + ' | ' + r.label + ' | ' + st + ' | ' + r.note + ' |');
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
