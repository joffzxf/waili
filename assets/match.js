/* ==========================================================================
   千江月 · 匹配引擎
   独立于 DOM，可在 Node 中直接测试（见 tools/check-data.js）。
   思路：关键词精确命中为主，二元字组重合为辅，二者加权后取最高分。
   ========================================================================== */
(function (root) {
  'use strict';

  /* 归一化：去空白与标点，只留文字 */
  function norm(s) {
    return String(s == null ? '' : s).toLowerCase()
      .replace(/[\s\u3000]+/g, '')
      .replace(/[，。、；：？！“”‘’「」『』《》〈〉（）()\[\]{}·…—\-_\/\\|~`@#$%^&*+=<>.,;:?!"']/g, '');
  }

  /* 二元字组 */
  function grams(s) {
    var set = Object.create(null);
    if (!s) return set;
    if (s.length === 1) { set[s] = 1; return set; }
    for (var i = 0; i < s.length - 1; i++) set[s.substr(i, 2)] = 1;
    return set;
  }

  function overlap(a, b) {
    var ka = Object.keys(a), hit = 0;
    for (var i = 0; i < ka.length; i++) if (b[ka[i]]) hit++;
    return ka.length ? hit / ka.length : 0;
  }

  /* 预编译主题特征，只做一次 */
  function prepare(themes) {
    themes.forEach(function (t) {
      if (t._kw) return;
      t._kw = (t.keywords || []).map(norm).filter(Boolean);
      t._kw.push(norm(t.name));                 // 主题名本身也算关键词
      t._kwG = t._kw.map(grams);
      t._nameG = grams(norm(t.name));
      t._gistG = grams(norm(t.gist));
      t._cn = t.canon.filter(function (c) { return String(c.r).charAt(0) === '中'; }).length;
      t._hay = norm(
        t.name + t.gist + (t.keywords || []).join('') +
        t.canon.map(function (c) { return c.t; }).join('')
      );
    });
    return themes;
  }

  function scoreTheme(t, q, qg) {
    var s = 0, exact = 0, i, kw;

    /* 1. 关键词精确命中：权重最高 */
    for (i = 0; i < t._kw.length; i++) {
      kw = t._kw[i];
      if (kw && q.indexOf(kw) !== -1) {
        s += 10 + Math.min(kw.length, 6);
        exact++;
      }
    }
    /* 2. 关键词近似：二元字组重合 60% 以上 */
    for (i = 0; i < t._kwG.length; i++) {
      var r = overlap(t._kwG[i], qg);
      if (r >= 0.6) s += 4.5 * r;
    }
    /* 3. 主题名与洞见句的近似 */
    s += 9 * overlap(t._nameG, qg);
    s += 5 * overlap(t._gistG, qg);

    return { s: s, exact: exact };
  }

  /* 返回 { hit, ranked, q } */
  function match(rawQuery, themes) {
    var q = norm(rawQuery);
    if (!q) return { hit: null, ranked: [], q: '' };

    var qg = grams(q);
    var ranked = themes.map(function (t) {
      var r = scoreTheme(t, q, qg);
      return { theme: t, score: r.s, exact: r.exact };
    }).sort(function (a, b) { return b.score - a.score; });

    var best = ranked[0];
    var hit = (best && (best.exact >= 1 || best.score >= 9)) ? best.theme : null;
    return { hit: hit, ranked: ranked, q: q };
  }

  root.QJY = { norm: norm, grams: grams, overlap: overlap, prepare: prepare, match: match };
})(typeof window !== 'undefined' ? window : globalThis);
