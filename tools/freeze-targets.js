#!/usr/bin/env node
/* 生成「高价值空格」固定清单
 *
 * 为什么要固定：阈值是「两轴使用数均 ≥ 8」。每补一批，轴的使用数就涨，
 * 于是又有新的轴对被纳入范围——目标集合不会单调缩小，永远填不完。
 * 所以冻结一次名单，之后只对着这张表做，做完就结束。
 *
 * 用法：node tools/freeze-targets.js
 * 产出：docs/high-value-cells.md（清单）+ docs/high-value-cells.json（机器可读）
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');

const s = { console: { log: function () {} } };
s.window = s; s.globalThis = s;
vm.createContext(s);

const FILES = ['data', 'data-2', 'data-3', 'data-4', 'data-5', 'data-6', 'data-7',
  'data-8', 'data-9', 'data-10', 'data-11', 'axes', 'coordinates'];
FILES.forEach(function (f) {
  const p = path.join(ROOT, 'assets', f + '.js');
  if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, 'utf8'), s, { filename: f + '.js' });
});

const AX = s.window.QJY_AXES.list;
const MAP = s.window.QJY_COORD.map;
const ids = Object.keys(MAP);
const N = AX.length;
const MIN_USE = 8;

const use = AX.map(function (_, i) {
  return ids.filter(function (id) { return (MAP[id].v[i] || 0) !== 0; }).length;
});

const cells = [];
for (let i = 0; i < N; i++) {
  for (let j = i + 1; j < N; j++) {
    if (use[i] < MIN_USE || use[j] < MIN_USE) continue;
    for (const si of [-1, 1]) {
      for (const sj of [-1, 1]) {
        const members = ids.filter(function (id) {
          const v = MAP[id].v;
          const a = v[i] || 0, b = v[j] || 0;
          return (si > 0 ? a >= 1 : a <= -1) && (sj > 0 ? b >= 1 : b <= -1);
        });
        if (members.length) continue;
        cells.push({
          a: AX[i].name, ap: si > 0 ? AX[i].pos : AX[i].neg,
          b: AX[j].name, bp: sj > 0 ? AX[j].pos : AX[j].neg,
          label: AX[i].name + '·' + (si > 0 ? AX[i].pos : AX[i].neg) +
                 ' × ' + AX[j].name + '·' + (sj > 0 ? AX[j].pos : AX[j].neg)
        });
      }
    }
  }
}

fs.writeFileSync(path.join(ROOT, 'docs', 'high-value-cells.json'),
  JSON.stringify({ frozenAt: new Date().toISOString().slice(0, 10), minUse: MIN_USE, themes: ids.length, cells: cells }, null, 2),
  'utf8');

const lines = [];
lines.push('# 高价值空格 · 固定清单');
lines.push('');
lines.push('> 冻结时间：' + new Date().toISOString().slice(0, 10) + '，当时 ' + ids.length + ' 条道理。');
lines.push('> 由 `node tools/freeze-targets.js` 生成，不要手改。');
lines.push('');
lines.push('**为什么要冻结**：判定阈值是「两轴使用数均 ≥ ' + MIN_USE + '」。每补一批，轴的使用数就涨，');
lines.push('于是又有新的轴对被纳入范围——目标集合不会单调缩小，按动态阈值永远填不完。');
lines.push('所以冻结一次名单，之后只对着这张表做。');
lines.push('');
lines.push('共 **' + cells.length + '** 个格子。');
lines.push('');
lines.push('| # | 格子 |');
lines.push('|---|---|');
cells.forEach(function (c, i) {
  lines.push('| ' + (i + 1) + ' | ' + c.label + ' |');
});
lines.push('');

fs.writeFileSync(path.join(ROOT, 'docs', 'high-value-cells.md'), lines.join('\n'), 'utf8');

console.log('冻结 ' + cells.length + ' 个高价值空格 → docs/high-value-cells.md');
console.log('轴使用：' + AX.map(function (a, i) { return a.name + '·' + use[i]; }).join(' '));
