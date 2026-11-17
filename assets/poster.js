/* 千江月 · 海报美术生成器（二版）
 *
 * 二版改了主张：海报的主角是**那句台词/文本**，不是书名。
 * 所以版面不再固定成「标题居中 + 引文垫底」的一块字区，
 * 而是从 8 种版式里按作品名散列挑一种——竖排、斜置、角落、截句都在其中。
 *
 * 仍然不用剧照：剧照有版权。美术是程序生成的几何与配色，
 * 同一部作品永远得到同一张。原文由数据层提供（canon.o），海报只负责排。
 */
(function (root) {
  'use strict';

  function hash(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  /* 八套配色，深浅两档混排，避免整页看着是同一个调子 */
  var PALETTES = [
    { a: '#1c1a16', b: '#332e26', ink: '#efe4cd', accent: '#b3502f' }, // 墨纸
    { a: '#0e1a21', b: '#1d3541', ink: '#dbe8ea', accent: '#7fb3b8' }, // 靛青
    { a: '#231315', b: '#42232a', ink: '#f2ddd4', accent: '#c8563f' }, // 绛红
    { a: '#131a14', b: '#26332a', ink: '#e2e9d9', accent: '#93a56c' }, // 松绿
    { a: '#22190f', b: '#3d2e1b', ink: '#f4e6c9', accent: '#c99a4e' }, // 赭金
    { a: '#0f0f13', b: '#23232d', ink: '#e4e4ec', accent: '#8b8fb8' }, // 钢蓝
    { a: '#211a21', b: '#3a2c3a', ink: '#eddfe8', accent: '#a87b9c' }, // 紫檀
    { a: '#0d1512', b: '#1c2a22', ink: '#dfe8e0', accent: '#6f9683' }  // 苔青
  ];

  var MOTIFS = ['disc', 'horizon', 'columns', 'arcs', 'ridge', 'grid', 'wave', 'blocks'];

  function motifShape(kind, p, M, gid) {
    var W = 300, H = 400, glow = 'url(#' + gid + 'glow)';
    var s = '', i;
    switch (kind) {
      case 'disc':
        return '<circle cx="150" cy="150" r="86" fill="' + glow + '" opacity=".92"/>' +
               '<circle cx="150" cy="150" r="86" fill="none" stroke="' + p.accent + '" stroke-width=".8" opacity=".55"/>' +
               '<circle cx="150" cy="150" r="112" fill="none" stroke="' + p.ink + '" stroke-width=".4" opacity=".18"/>';
      case 'horizon':
        return '<rect x="0" y="228" width="' + W + '" height="1" fill="' + p.accent + '" opacity=".85"/>' +
               '<rect x="0" y="229" width="' + W + '" height="171" fill="' + glow + '" opacity=".55"/>' +
               '<circle cx="216" cy="228" r="42" fill="' + p.accent + '" opacity=".22"/>';
      case 'columns':
        for (i = 0; i < 7; i++) {
          s += '<rect x="' + (18 + i * 40) + '" y="70" width="' + (8 + ((M >> i) % 14)) +
               '" height="260" fill="' + p.ink + '" opacity="' + (0.05 + ((M >> (i + 3)) % 7) / 100) + '"/>';
        }
        return s;
      case 'arcs':
        for (i = 1; i <= 5; i++) {
          s += '<circle cx="150" cy="300" r="' + (i * 46) + '" fill="none" stroke="' + p.accent +
               '" stroke-width=".7" opacity="' + (0.42 - i * 0.06) + '"/>';
        }
        return s;
      case 'ridge':
        s = 'M0 300';
        var y = 300, x = 0;
        for (i = 0; i < 9; i++) { x += 36; y = 240 + ((M >> (i * 2)) % 90); s += ' L' + x + ' ' + y; }
        return '<path d="' + s + ' L300 400 L0 400 Z" fill="' + glow + '" opacity=".8"/>';
      case 'grid': /* 点阵：像星图，也像正文被拆成格子 */
        for (i = 0; i < 11; i++) {
          for (var j = 0; j < 14; j++) {
            if ((M >> ((i + j) % 29)) % 5) continue;
            s += '<circle cx="' + (22 + i * 26) + '" cy="' + (24 + j * 27) + '" r="1.4" fill="' +
                 p.ink + '" opacity=".38"/>';
          }
        }
        return s;
      case 'wave': /* 横向波纹 */
        for (i = 0; i < 6; i++) {
          var yy = 90 + i * 48, d = 'M0 ' + yy;
          for (var k = 0; k < 6; k++) {
            d += ' q25 ' + (-14 - ((M >> (k + i)) % 22)) + ' 50 0';
          }
          s += '<path d="' + d + '" fill="none" stroke="' + p.accent + '" stroke-width=".8" opacity="' +
               (0.34 - i * 0.04) + '"/>';
        }
        return s;
      default: /* blocks：错落的实心方块，接近现代主义海报 */
        for (i = 0; i < 5; i++) {
          var bw = 40 + ((M >> i) % 90), bh = 40 + ((M >> (i + 4)) % 120);
          s += '<rect x="' + ((M >> (i + 8)) % 240) + '" y="' + ((M >> (i + 12)) % 300) +
               '" width="' + bw + '" height="' + bh + '" fill="' + p.accent + '" opacity="' +
               (0.06 + ((M >> (i + 16)) % 10) / 100) + '"/>';
        }
        return s;
    }
  }

  function mediumMark(medium, p) {
    var holes = '', i;
    if (medium === 'film') {
      for (i = 0; i < 9; i++) {
        holes += '<rect x="4" y="' + (18 + i * 42) + '" width="4.5" height="9" rx="1.2" fill="' + p.ink + '" opacity=".2"/>';
        holes += '<rect x="291.5" y="' + (18 + i * 42) + '" width="4.5" height="9" rx="1.2" fill="' + p.ink + '" opacity=".2"/>';
      }
      return holes;
    }
    if (medium === 'book') {
      return '<rect x="10" y="0" width="1" height="400" fill="' + p.ink + '" opacity=".3"/>' +
             '<rect x="13" y="0" width="1" height="400" fill="' + p.ink + '" opacity=".14"/>';
    }
    return '<rect x="0" y="0" width="300" height="10" fill="' + p.accent + '" opacity=".3"/>' +
           '<rect x="0" y="390" width="300" height="10" fill="' + p.accent + '" opacity=".3"/>';
  }

  function art(seed, medium) {
    var h = hash(String(seed || ''));
    var p = PALETTES[h % PALETTES.length];
    var motif = MOTIFS[(h >>> 5) % MOTIFS.length];
    var id = 'pg' + h.toString(36);

    return '' +
      '<svg viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<defs>' +
          '<linearGradient id="' + id + 'bg" x1="0" y1="0" x2="0.4" y2="1">' +
            '<stop offset="0" stop-color="' + p.a + '"/><stop offset="1" stop-color="' + p.b + '"/>' +
          '</linearGradient>' +
          '<radialGradient id="' + id + 'glow" cx="0.5" cy="0.5" r="0.5">' +
            '<stop offset="0" stop-color="' + p.accent + '" stop-opacity=".9"/>' +
            '<stop offset="1" stop-color="' + p.accent + '" stop-opacity="0"/>' +
          '</radialGradient>' +
          '<filter id="' + id + 'grain">' +
            '<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch"/>' +
            '<feColorMatrix type="saturate" values="0"/>' +
          '</filter>' +
        '</defs>' +
        '<rect width="300" height="400" fill="url(#' + id + 'bg)"/>' +
        '<g>' + motifShape(motif, p, h, id) + '</g>' +
        '<g>' + mediumMark(medium, p) + '</g>' +
        '<rect width="300" height="400" filter="url(#' + id + 'grain)" opacity=".07"/>' +
      '</svg>';
  }

  /* 版式变体 0—7，由散列决定；同一作品恒定 */
  function variant(seed) {
    return hash(String(seed || '') + '#layout') % 8;
  }

  function palette(seed) {
    return PALETTES[hash(String(seed || '')) % PALETTES.length];
  }

  root.QJY_POSTER = { art: art, variant: variant, palette: palette, hash: hash };
})(typeof window !== 'undefined' ? window : globalThis);
