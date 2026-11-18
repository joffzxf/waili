#!/usr/bin/env node
/* 千江月 · 构建指纹
 *
 * 目的：GitHub Pages 对所有文件发 Cache-Control: max-age=600。
 * 浏览器因此可能拿「新 HTML + 旧 JS」，导致刚修好的内容看不到。
 *
 * 做法：对全部静态资源算一个内容指纹，写进 index.html 的 data-build 与每个 ?v=。
 * 资源一改，指纹就变，浏览器必然重新取。
 *
 * 用法：
 *   node tools/stamp.js          # 计算并写入
 *   node tools/check-data.js     # 校验是否已同步（未同步会失败）
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');

/* 参与指纹的资源：改任何一个，都应触发缓存失效 */
const ASSETS = [
  'assets/style.css',
  'assets/data.js',
  'assets/data-2.js',
  'assets/data-3.js',
  'assets/data-4.js',
  'assets/data-5.js',
  'assets/data-6.js',
  'assets/data-7.js',
  'assets/data-8.js',
  'assets/data-9.js',
  'assets/data-10.js',
  'assets/data-11.js',
  'assets/data-12.js',
  'assets/data-13.js',
  'assets/data-14.js',
  'assets/data-15.js',
  'assets/data-16.js',
  'assets/data-17.js',
  'assets/data-18.js',
  'assets/data-19.js',
  'assets/data-20.js',
  'assets/data-21.js',
  'assets/data-22.js',
  'assets/data-23.js',
  'assets/related.js',
  'assets/poster.js',
  'assets/shelf.js',
  'assets/share.js',
  'assets/quiz.js',
  'assets/quiz-full.js',
  'assets/quiz-v2.js',
  'assets/schemes.js',
  'assets/axes.js',
  'assets/coordinates.js',
  'assets/atlas.js',
  'assets/match.js',
  'assets/app.js'
];

function computeBuild() {
  const h = crypto.createHash('sha256');
  ASSETS.forEach(function (rel) {
    h.update(rel);
    h.update(fs.readFileSync(path.join(ROOT, rel)));
  });
  return h.digest('hex').slice(0, 10);
}

/* 把 index.html 里的指纹统一替换成 build */
function stamped(html, build) {
  return html
    .replace(/(<html[^>]*\bdata-build=")[^"]*(")/, '$1' + build + '$2')
    .replace(/(\.(?:css|js))\?v=[A-Za-z0-9_.-]*/g, '$1?v=' + build);
}

function readIndex() {
  return fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
}

/* 供 check-data.js 复用：返回 { build, stored, synced } */
function inspect() {
  const html = readIndex();
  const build = computeBuild();
  const m = html.match(/data-build="([^"]*)"/);
  const stored = m ? m[1] : null;
  const versions = [];
  const re = /\.(?:css|js)\?v=([A-Za-z0-9_.-]*)/g;
  let hit;
  while ((hit = re.exec(html))) versions.push(hit[1]);
  const allMatch = versions.length > 0 && versions.every(function (v) { return v === build; });
  return {
    build: build,
    stored: stored,
    versions: versions,
    count: ASSETS.length,
    synced: stored === build && allMatch
  };
}

if (require.main === module) {
  const html = readIndex();
  const build = computeBuild();
  const next = stamped(html, build);
  if (next === html) {
    console.log('指纹已是最新：' + build);
  } else {
    fs.writeFileSync(path.join(ROOT, 'index.html'), next, 'utf8');
    console.log('已写入指纹：' + build);
  }
  const info = inspect();
  console.log('校验：' + (info.synced ? '✓ data-build 与 ' + info.versions.length + ' 处 ?v= 一致'
                                      : '✗ 仍不一致'));
}

module.exports = { computeBuild: computeBuild, inspect: inspect, ASSETS: ASSETS };
