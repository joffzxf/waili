/* 千江月 · 海报美术生成器
 *
 * 为什么不用剧照：电影剧照有版权，放进公开仓库是实实在在的侵权风险。
 * 这里改为「程序生成」——每张海报的配色与几何母题由作品名散列派生，
 * 同一部作品永远得到同一张图，不同作品各不相同。
 *
 * 体裁会留下痕迹：电影带胶片齿孔，小说带书脊线，戏剧带幕布褶。
 */
(function (root) {
  'use strict';

  /* FNV-1a：同一字符串 → 同一整数，保证海报稳定不闪烁 */
  function hash(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  /* 六套配色，都压得很低饱和，靠近胶片/旧纸的调子 */
  var PALETTES = [
    { a: '#1c1a16', b: '#332e26', ink: '#efe4cd', accent: '#b3502f' }, // 墨纸
    { a: '#0e1a21', b: '#1d3541', ink: '#dbe8ea', accent: '#7fb3b8' }, // 靛青
    { a: '#231315', b: '#42232a', ink: '#f2ddd4', accent: '#c8563f' }, // 绛红
    { a: '#131a14', b: '#26332a', ink: '#e2e9d9', accent: '#93a56c' }, // 松绿
    { a: '#22190f', b: '#3d2e1b', ink: '#f4e6c9', accent: '#c99a4e' }, // 赭金
    { a: '#0f0f13', b: '#23232d', ink: '#e4e4ec', accent: '#8b8fb8' }  // 钢蓝
  ];

  var MOTIFS = ['disc', 'horizon', 'columns', 'arcs', 'ridge'];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* 母题：全部用几何，避免任何具体形象的版权问题 */
  function motifShape(kind, p, M, gid) {
    var W = 300, H = 400, glow = 'url(#' + gid + 'glow)';
    switch (kind) {
      case 'disc': /* 一轮圆：月、日、或一个念头 */
        return '<circle cx="150" cy="150" r="86" fill="' + glow + '" opacity=".92"/>' +
               '<circle cx="150" cy="150" r="86" fill="none" stroke="' + p.accent + '" stroke-width=".8" opacity=".55"/>' +
               '<circle cx="150" cy="150" r="112" fill="none" stroke="' + p.ink + '" stroke-width=".4" opacity=".18"/>';
      case 'horizon': /* 地平线：把画面切成上下两半 */
        return '<rect x="0" y="228" width="' + W + '" height="1" fill="' + p.accent + '" opacity=".85"/>' +
               '<rect x="0" y="229" width="' + W + '" height="171" fill="' + glow + '" opacity=".55"/>' +
               '<circle cx="216" cy="228" r="42" fill="' + p.accent + '" opacity=".22"/>';
      case 'columns': /* 竖排栅栏：像窗、像胶片、像一段被切分的时间 */
        var s = '';
        for (var i = 0; i < 7; i++) {
          var w = 8 + ((M >> i) % 14);
          s += '<rect x="' + (18 + i * 40) + '" y="70" width="' + w + '" height="260" fill="' + p.ink +
               '" opacity="' + (0.05 + ((M >> (i + 3)) % 7) / 100) + '"/>';
        }
        return s;
      case 'arcs': /* 同心弧：声波、回响、或者年轮 */
        var a = '';
        for (var j = 1; j <= 5; j++) {
          a += '<circle cx="150" cy="300" r="' + (j * 46) + '" fill="none" stroke="' + p.accent +
               '" stroke-width=".7" opacity="' + (0.42 - j * 0.06) + '"/>';
        }
        return a;
      default: /* ridge：山脉轮廓，用折线拼出来 */
        var d = 'M0 300', y = 300, x = 0;
        for (var k = 0; k < 9; k++) {
          x += 36;
          y = 240 + ((M >> (k * 2)) % 90);
          d += ' L' + x + ' ' + y;
        }
        d += ' L300 400 L0 400 Z';
        return '<path d="' + d + '" fill="' + glow + '" opacity=".8"/>';
    }
  }

  /* 体裁痕迹：电影 = 齿孔，小说 = 书脊，戏剧 = 幕布褶 */
  function mediumMark(medium, p) {
    if (medium === 'film') {
      var holes = '';
      for (var i = 0; i < 9; i++) {
        holes += '<rect x="4" y="' + (18 + i * 42) + '" width="4.5" height="9" rx="1.2" fill="' + p.ink + '" opacity=".2"/>';
        holes += '<rect x="291.5" y="' + (18 + i * 42) + '" width="4.5" height="9" rx="1.2" fill="' + p.ink + '" opacity=".2"/>';
      }
      return holes;
    }
    if (medium === 'book') {
      return '<rect x="10" y="0" width="1" height="400" fill="' + p.ink + '" opacity=".3"/>' +
             '<rect x="13" y="0" width="1" height="400" fill="' + p.ink + '" opacity=".14"/>';
    }
    /* stage：上下两道幕边 */
    return '<rect x="0" y="0" width="300" height="10" fill="' + p.accent + '" opacity=".3"/>' +
           '<rect x="0" y="390" width="300" height="10" fill="' + p.accent + '" opacity=".3"/>';
  }

  /* 生成完整 SVG 字符串。seed 决定一切，同一 seed 结果恒定。 */
  function art(seed, medium) {
    var h = hash(String(seed || ''));
    var p = PALETTES[h % PALETTES.length];
    var motif = MOTIFS[(h >>> 5) % MOTIFS.length];
    var id = 'pg' + h.toString(36);

    return '' +
      '<svg viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<defs>' +
          '<linearGradient id="' + id + 'bg" x1="0" y1="0" x2="0.4" y2="1">' +
            '<stop offset="0" stop-color="' + p.a + '"/>' +
            '<stop offset="1" stop-color="' + p.b + '"/>' +
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

  /* 供页面内联使用：颜色与母题也可单独取，用于角标等 */
  function palette(seed) {
    return PALETTES[hash(String(seed || '')) % PALETTES.length];
  }

  root.QJY_POSTER = { art: art, palette: palette, hash: hash, esc: esc };
})(typeof window !== 'undefined' ? window : globalThis);
