#!/usr/bin/env node
/* 千江月 · 扩库审计
 *
 * 三个用途：
 *   1. 轴覆盖：每根轴的两个极各有多少条道理撑着——哪儿是裸的
 *   2. 交叉空格：任意两轴 × 两个极 = 一个「立场槽」，空的槽就是还没被填的道理
 *   3. 增量回审：每个条目只看最近的 k 个邻居，把「距离近但还没写清区别」的对
 *      列成待办，人工顺着清单走，不重读全库
 *
 * 用法：node tools/audit.js [--k=3] [--write]
 *   --write 会写 docs/axis-coverage.md 与 docs/pending-pairs.md
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

/* ---------- 载入 ---------- */
const sandbox = { console: { log: function () {} } };
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

['data', 'data-2', 'data-3', 'data-4', 'data-5', 'data-6', 'data-7',
 'axes', 'coordinates'].forEach(function (f) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'assets', f + '.js'), 'utf8'),
    sandbox, { filename: f + '.js' });
});

const THEMES = sandbox.window.WISDOM.themes;
const AXES = sandbox.window.QJY_AXES.list;
const MAP = sandbox.window.QJY_COORD.map;
const N = AXES.length;

const args = process.argv.slice(2);
const K = (function () {
  const hit = args.find(function (a) { return a.indexOf('--k=') === 0; });
  return hit ? parseInt(hit.slice(4), 10) || 3 : 3;
})();
const WRITE = args.indexOf('--write') !== -1;

const nameOf = {};
THEMES.forEach(function (t) { nameOf[t.id] = t.name; });

/* ---------- 1. 轴覆盖 ---------- */
function poleCount(axisIdx, sign) {
  let deep = 0, any = 0;
  Object.keys(MAP).forEach(function (id) {
    const v = MAP[id].v[axisIdx] || 0;
    if (sign > 0 ? v >= 1 : v <= -1) any++;
    if (sign > 0 ? v >= 2 : v <= -2) deep++;
  });
  return { any: any, deep: deep };
}

console.log('\n=== 1. 轴覆盖（每极有几条撑着）===');
const bareAxes = [];
AXES.forEach(function (a, i) {
  const neg = poleCount(i, -1), pos = poleCount(i, +1);
  const flag = (neg.any < 2 || pos.any < 2) ? '  ← 裸' : '';
  if (flag) bareAxes.push(a.name);
  console.log('  ' + a.name.padEnd(4, '　') +
    '  −端 ' + String(neg.any).padStart(2) + ' 条（强 ' + neg.deep + '）' +
    '    +端 ' + String(pos.any).padStart(2) + ' 条（强 ' + pos.deep + '）' + flag);
});

/* ---------- 2. 交叉空格 ---------- */
/* 两轴各取一极，构成一个「立场槽」：既有条目数 = 槽里的人数 */
const cells = [];
for (let i = 0; i < N; i++) {
  for (let j = i + 1; j < N; j++) {
    [-1, 1].forEach(function (si) {
      [-1, 1].forEach(function (sj) {
        const members = Object.keys(MAP).filter(function (id) {
          const v = MAP[id].v;
          const a = v[i] || 0, b = v[j] || 0;
          return (si > 0 ? a >= 1 : a <= -1) && (sj > 0 ? b >= 1 : b <= -1);
        });
        cells.push({
          a: AXES[i], b: AXES[j], si: si, sj: sj,
          members: members
        });
      });
    });
  }
}

const empty = cells.filter(function (c) { return c.members.length === 0; });
const single = cells.filter(function (c) { return c.members.length === 1; });

function poleName(axis, s) { return s > 0 ? axis.pos : axis.neg; }

console.log('\n=== 2. 交叉空格（每个格子 = 一个立场槽）===');
console.log('  共 ' + cells.length + ' 个槽：空 ' + empty.length +
  ' 个，只有 1 条 ' + single.length + ' 个，有 2 条以上 ' + (cells.length - empty.length - single.length) + ' 个');

console.log('\n  最空的 12 个槽（可以直接当选题）：');
empty.slice(0, 12).forEach(function (c) {
  console.log('    · 「' + poleName(c.a, c.si) + '」×「' + poleName(c.b, c.sj) + '」　—— 还没有任何一条道理站在这儿');
});

/* ---------- 3. 增量回审 ---------- */
function dist(x, y) {
  let s = 0;
  for (let i = 0; i < N; i++) s += Math.pow((x[i] || 0) - (y[i] || 0), 2);
  return Math.sqrt(s);
}
function documented(a, b) {
  const ma = MAP[a], mb = MAP[b];
  const has = function (m, t) {
    return (Array.isArray(m.vs) ? m.vs : []).some(function (x) { return x.with === t; });
  };
  if (has(ma, b) || has(mb, a)) return true;
  if ((ma.cf || []).some(function (c) { return c.with === b; })) return true;
  if ((mb.cf || []).some(function (c) { return c.with === a; })) return true;
  return false;
}

const ids = Object.keys(MAP);
const pending = [];
const hard = [];

console.log('\n=== 3. 增量回审（每条只看最近 ' + K + ' 个邻居）===');
ids.forEach(function (id) {
  const near = ids
    .filter(function (o) { return o !== id; })
    .map(function (o) { return { id: o, d: dist(MAP[id].v, MAP[o].v) }; })
    .sort(function (a, b) { return a.d - b.d; })
    .slice(0, K);

  near.forEach(function (o) {
    if (documented(id, o.id)) return;
    if (o.d >= 1.5) return;          // 距离够远，不必写区别
    const pair = [id, o.id].sort().join('|');
    if (pending.some(function (p) { return p.pair === pair; })) return;
    const rec = { pair: pair, a: id, b: o.id, d: o.d };
    pending.push(rec);
    if (o.d < 1.0) hard.push(rec);
  });
});

console.log('  最近邻中「距离 < 1.5 且未写清区别」的：' + pending.length + ' 对');
if (hard.length) {
  console.log('  其中距离 < 1.0（很可能真的重复）：' + hard.length + ' 对');
  hard.forEach(function (p) {
    console.log('    ! ' + nameOf[p.a] + ' ↔ ' + nameOf[p.b] + '  d=' + p.d.toFixed(2));
  });
} else {
  console.log('  没有距离 < 1.0 的未处理对 —— 没有明显重复');
}

/* ---------- 写文件 ---------- */
if (WRITE) {
  const lines = [];
  lines.push('# 扩库审计 · 轴覆盖与待办');
  lines.push('');
  lines.push('> 由 `node tools/audit.js --write` 生成，不要手改；改完坐标后重跑。');
  lines.push('');
  lines.push('## 一、轴覆盖');
  lines.push('');
  lines.push('| 轴 | − 端 | 条数 | + 端 | 条数 |');
  lines.push('|---|---|---|---|---|');
  AXES.forEach(function (a, i) {
    const neg = poleCount(i, -1), pos = poleCount(i, +1);
    lines.push('| ' + a.name + ' | ' + a.neg + ' | ' + neg.any + ' | ' + a.pos + ' | ' + pos.any + ' |');
  });
  lines.push('');
  if (bareAxes.length) {
    lines.push('**裸轴（某一极不足 2 条）**：' + bareAxes.join('、'));
    lines.push('');
  }
  lines.push('## 二、最空的交叉槽（选题清单）');
  lines.push('');
  lines.push('每个格子是「两轴各取一极」的立场槽。空的格子 = 还没有任何一条道理站在这儿。');
  lines.push('');
  empty.slice(0, 40).forEach(function (c) {
    lines.push('- 「' + poleName(c.a, c.si) + '」×「' + poleName(c.b, c.sj) + '」');
  });
  lines.push('');
  lines.push('## 三、待处理的近邻对');
  lines.push('');
  if (!pending.length) {
    lines.push('无。所有近邻对都已用 `vs` 或 `cf` 写明区别。');
  } else {
    lines.push('| A | B | 距离 | 处理 |');
    lines.push('|---|---|---|---|');
    pending.forEach(function (p) {
      lines.push('| ' + nameOf[p.a] + ' | ' + nameOf[p.b] + ' | ' + p.d.toFixed(2) + ' | 写 vs 或合并 |');
    });
  }
  lines.push('');

  fs.writeFileSync(path.join(ROOT, 'docs', 'axis-coverage.md'), lines.join('\n'), 'utf8');
  console.log('\n已写入 docs/axis-coverage.md');
}

console.log('\n' + '─'.repeat(52));
console.log('结论：' + (hard.length ? '有疑似重复，先处理 ' + hard.length + ' 对' :
  (pending.length ? '无重复，但有 ' + pending.length + ' 对没写清区别' : '干净')));
