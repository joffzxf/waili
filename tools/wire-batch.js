#!/usr/bin/env node
/* 千江月 · 批次接线器
 *
 * 用法：node tools/wire-batch.js tools/batches/03.json
 *
 * 批次文件格式：
 * {
 *   "data": 11,                      // assets/data-11.js
 *   "coords": {                      // 13 维坐标 + vs + cf
 *     "qinyudai": { "v": [0,-2,...], "vs": [{"with":"daiji","when":"..."}], "cf": [] }
 *   },
 *   "scene":   { "qinyudai": "待人与相处" },   // 场景分类法归入哪一组
 *   "subject": { "qinyudai": "人与关系" }      // 学科分类法归入哪一组
 * }
 *
 * 幂等：重复跑不会重复插入。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const specPath = process.argv[2];
if (!specPath) { console.error('缺少批次文件'); process.exit(1); }
const spec = JSON.parse(fs.readFileSync(path.resolve(ROOT, specPath), 'utf8'));

const DATA_NO = spec.data;
const IDS = Object.keys(spec.coords);

function edit(rel, fn) {
  const p = path.join(ROOT, rel);
  const before = fs.readFileSync(p, 'utf8');
  const after = fn(before);
  if (after !== before) { fs.writeFileSync(p, after, 'utf8'); console.log('✔ ' + rel); }
  else console.log('· ' + rel + ' 无变化');
}

/* 1) index.html 载入 */
edit('index.html', function (h) {
  const tag = 'assets/data-' + DATA_NO + '.js';
  if (h.indexOf(tag) !== -1) return h;
  const prev = h.match(new RegExp('<script src="assets/data-' + (DATA_NO - 1) + '\\.js\\?v=([^"]+)"><\\/script>'));
  if (!prev) throw new Error('找不到 data-' + (DATA_NO - 1) + '.js 的标签');
  return h.replace(prev[0], prev[0] + '\n<script src="' + tag + '?v=' + prev[1] + '"></script>');
});

/* 2) 构建指纹名单 */
edit('tools/stamp.js', function (s) {
  const key = "'assets/data-" + DATA_NO + ".js',";
  if (s.indexOf(key) !== -1) return s;
  const prevKey = "'assets/data-" + (DATA_NO - 1) + ".js',";
  if (s.indexOf(prevKey) === -1) throw new Error('stamp 里找不到 ' + prevKey);
  return s.replace(prevKey, prevKey + '\n  ' + key);
});

/* 3) 自检载入 */
edit('tools/check-data.js', function (s) {
  const key = "'assets/data-" + DATA_NO + ".js'";
  if (s.indexOf(key) !== -1) return s;
  const prevKey = "'assets/data-" + (DATA_NO - 1) + ".js'";
  if (s.indexOf(prevKey) === -1) throw new Error('check 里找不到 ' + prevKey);
  return s.replace(prevKey, prevKey + ', ' + key);
});

/* 4) 主题之环 */
edit('assets/related.js', function (s) {
  if (s.indexOf("'" + IDS[0] + "'") !== -1) return s;
  /* 直接找最后的 "];"，在其前追加——不要用正则匹配多行 id 组，容易咬错位置 */
  const at = s.lastIndexOf('\n];');
  if (at === -1) throw new Error('找不到环的结尾');
  const head = s.slice(0, at).replace(/,?\s*$/, '');
  return head + ',\n  ' + IDS.map(function (id) { return "'" + id + "'"; }).join(', ') + s.slice(at);
});

/* 5) 两套分类法 */
edit('assets/schemes.js', function (s) {
  if (s.indexOf("'" + IDS[0] + "'") !== -1) return s;
  let out = s;
  IDS.forEach(function (id) {
    const sceneGroup = spec.scene[id], subjectGroup = spec.subject[id];
    if (!sceneGroup) throw new Error('缺 scene 归组：' + id);
    if (!subjectGroup) throw new Error('缺 subject 归组：' + id);
    [['按场景', sceneGroup], ['按学科', subjectGroup]].forEach(function (pair) {
      const schemeName = pair[0], groupName = pair[1];
      const schemeAt = out.indexOf("name: '" + schemeName + "'");
      if (schemeAt === -1) throw new Error('找不到分类法：' + schemeName);
      const groupAt = out.indexOf("{ name: '" + groupName + "', ids: [", schemeAt);
      if (groupAt === -1) throw new Error('找不到分组：' + schemeName + '/' + groupName);
      const close = out.indexOf('] }', groupAt);
      out = out.slice(0, close) + ", '" + id + "'" + out.slice(close);
    });
  });
  return out;
});

/* 6) 坐标 */
edit('assets/coordinates.js', function (c) {
  if (c.indexOf(IDS[0] + ':') !== -1) return c;
  const fmt = function (list) {
    return '[' + list.map(function (x) {
      return "{ with: '" + x.with + "', when: '" + x.when + "' }";
    }).join(', ') + ']';
  };
  let block = '';
  IDS.forEach(function (id) {
    const row = spec.coords[id];
    block += ',\n\n    /* 批次 ' + DATA_NO + '：' + id + ' */\n    ' + id +
      ': { v: [' + row.v.join(', ') + '],\n                vs: ' + fmt(row.vs || []) +
      (row.cf && row.cf.length ? ',\n                cf: ' + fmt(row.cf) : '') + ' }';
  });
  const closeIdx = c.lastIndexOf('  };');
  if (closeIdx === -1) throw new Error('找不到 COORD 结尾');
  return c.slice(0, closeIdx).replace(/,\s*$/, '') + block + '\n' + c.slice(closeIdx);
});

/* 7) 对称冲突：对方条目也要声明 */
edit('assets/coordinates.js', function (c) {
  function findObject(text, id) {
    const at = text.indexOf('\n    ' + id + ':');
    if (at === -1) return null;
    const start = text.indexOf('{', at);
    let depth = 0, inStr = false, esc = false;
    for (let i = start; i < text.length; i++) {
      const ch = text[i];
      if (inStr) { if (esc) { esc = false; continue; } if (ch === '\\') { esc = true; continue; } if (ch === '"') inStr = false; continue; }
      if (ch === '"') { inStr = true; continue; }
      if (ch === '{') depth++;
      else if (ch === '}') { depth--; if (depth === 0) return { start: start, end: i }; }
    }
    return null;
  }
  IDS.forEach(function (id) {
    (spec.coords[id].cf || []).forEach(function (cf) {
      const other = cf.with;
      if (IDS.indexOf(other) !== -1) return;      /* 同批的对方会在自己的定义里声明 */
      const o = findObject(c, other);
      if (!o) { console.log('  ! 找不到对方条目：' + other); return; }
      const body = c.slice(o.start, o.end + 1);
      if (body.indexOf("with: '" + id + "'") !== -1) return;
      const entry = "{ with: '" + id + "', when: '" + cf.when + "' }";
      const cfAt = body.indexOf('cf: [');
      let nb;
      if (cfAt !== -1) {
        const close = body.indexOf(']', cfAt);
        nb = body.slice(0, close) + ', ' + entry + body.slice(close);
      } else {
        nb = body.slice(0, -1) + ', cf: [' + entry + '] }';
      }
      c = c.slice(0, o.start) + nb + c.slice(o.end + 1);
    });
  });
  return c;
});

console.log('\n接入 ' + IDS.length + ' 条：' + IDS.join('、'));
