/* 千江月 · 三观坐标 v2（40 题）
 *
 * v1（44 题，见 quiz-full.js）有两个毛病，v2 专门修它们：
 *   1. 每轴 6 正 5 反，方向抵消不干净（全选「同意」时四轴一律 +9）
 *      → v2 每轴 5 正 5 反，完全对齐，全选「同意」时四轴应为 0
 *   2. 题目全部取自最初 44 条，语料一边倒时写出来的题目也一边倒
 *      → v2 每轴各补一道来自新增对立面的题（不平则鸣、取法乎上、功成身退……）
 *
 * 与 v1 不可比：轴相同，题目不同，分数不能跨版本对照。
 * 版本号写在编码里（q3），解码时据此分流。
 */
(function (root) {
  'use strict';

  var BASE = root.QJY_QUIZ_FULL;
  var Q1 = root.QJY_QUIZ;
  var AXES = (Q1 && Q1.AXES) || BASE.AXES;

  var LABELS = ['不同意', '部分不同意', '中立', '部分同意', '同意'];

  /* 每轴新增一正一反，来自 44 条之后补的语料 */
  var EXTRA = [
    { axis: 'control', dir: +1, theme: 'buruhuxue',
      text: '想要的东西，多半要用一次可能失败的行动去换。' },
    { axis: 'control', dir: -1, theme: 'qiongzedushan',
      text: '环境不由你选，能守住的只有自己那一点。' },
    { axis: 'self',    dir: +1, theme: 'duliqingshen',
      text: '如果所有人都反对，你仍然可能是对的。' },
    { axis: 'self',    dir: -1, theme: 'jiyulida',
      text: '想让别人接受你，先帮他把他想要的拿到。' },
    { axis: 'rule',    dir: +1, theme: 'zhichi',
      text: '有些事做了会抬不起头，这本身就是理由。' },
    { axis: 'rule',    dir: -1, theme: 'lianghaixiangquan',
      text: '两个选项都糟糕时，该选代价小的那个。' },
    { axis: 'engage',  dir: +1, theme: 'zhiqibuke',
      text: '明知改变不了，仍然值得去做。' },
    { axis: 'engage',  dir: -1, theme: 'gongchengshentui',
      text: '做完就该走，留下来的人常常输在最后。' }
  ];

  /* 每轴从 v1 保留 4 正 4 反，与 EXTRA 合成 5 正 5 反 */
  var ITEMS = (function () {
    var out = [];
    AXES.forEach(function (a) {
      ['pos', 'neg'].forEach(function (side) {
        var dir = side === 'pos' ? 1 : -1;
        var kept = BASE.ITEMS.filter(function (it) {
          return it.axis === a.id && it.dir === dir;
        }).slice(0, 4);
        kept.forEach(function (it) {
          out.push({ axis: it.axis, dir: it.dir, theme: it.theme, text: it.text });
        });
        EXTRA.filter(function (it) { return it.axis === a.id && it.dir === dir; })
          .forEach(function (it) {
            out.push({ axis: it.axis, dir: it.dir, theme: it.theme, text: it.text });
          });
      });
    });
    /* 打散：同一根轴的题不相邻，正反交替，减少作答惯性 */
    var buckets = {};
    AXES.forEach(function (a) { buckets[a.id] = out.filter(function (it) { return it.axis === a.id; }); });
    AXES.forEach(function (a) {
      buckets[a.id].sort(function (x, y) { return x.dir - y.dir; }); /* 先负后正 */
    });
    var mixed = [];
    var maxLen = Math.max.apply(null, AXES.map(function (a) { return buckets[a.id].length; }));
    for (var i = 0; i < maxLen; i++) {
      AXES.forEach(function (a) {
        if (buckets[a.id][i]) mixed.push(buckets[a.id][i]);
      });
    }
    return mixed;
  })();

  function value(ans) { return (Number(ans) || 0) - 2; }

  function score(answers) {
    var sums = {}, counts = {};
    AXES.forEach(function (a) { sums[a.id] = 0; counts[a.id] = 0; });
    ITEMS.forEach(function (it, i) {
      sums[it.axis] += value(answers[i]) * it.dir;
      counts[it.axis] += 1;
    });
    var out = {};
    AXES.forEach(function (a) {
      out[a.id] = counts[a.id] ? Math.round(sums[a.id] / (counts[a.id] * 2) * 100) : 0;
    });
    return out;
  }

  function encode(answers) {
    var s = '';
    for (var i = 0; i < ITEMS.length; i++) {
      var v = Number(answers[i]);
      s += (v >= 0 && v <= 4) ? String(v) : '2';
    }
    return 'q3' + s;
  }

  function decode(code) {
    var s = String(code || '');
    if (s.length !== 2 + ITEMS.length || s.slice(0, 2) !== 'q3') return null;
    var out = [];
    for (var i = 2; i < s.length; i++) {
      if (!/[0-4]/.test(s.charAt(i))) return null;
      out.push(Number(s.charAt(i)));
    }
    return out;
  }

  /* 文明亲和度：与 quiz-full 同法，题源换成 v2 */
  function traditions(answers, themes) {
    var byId = {};
    (themes || []).forEach(function (t) { byId[t.id] = t; });
    var GROUPS = (Q1 && Q1.GROUPS) || [];
    var acc = {};
    GROUPS.forEach(function (g) { acc[g.id] = 0; });

    ITEMS.forEach(function (it, i) {
      var w = value(answers[i]);
      if (!w) return;
      var t = byId[it.theme];
      if (!t || !t.canon) return;
      var hits = {}, total = 0;
      t.canon.forEach(function (c) {
        GROUPS.forEach(function (g) {
          if (g.test(String(c.r), String(c.k))) hits[g.id] = (hits[g.id] || 0) + 1;
        });
      });
      Object.keys(hits).forEach(function (k) { total += hits[k]; });
      if (!total) return;
      Object.keys(hits).forEach(function (k) { acc[k] += w * hits[k] / total; });
    });

    var ranked = GROUPS.map(function (g) { return { id: g.id, name: g.name, v: acc[g.id] }; })
      .sort(function (a, b) { return b.v - a.v; });
    return {
      top: ranked.filter(function (x) { return x.v > 0.3; }).slice(0, 3),
      bottom: ranked.filter(function (x) { return x.v < -0.3; }).slice(-1)[0] || null,
      ranked: ranked
    };
  }

  root.QJY_QUIZ_V2 = {
    version: 'v2',
    AXES: AXES, ITEMS: ITEMS, LABELS: LABELS,
    value: value, score: score, encode: encode, decode: decode,
    traditions: traditions,
    summary: function (s) { return Q1.summary(s); }
  };
})(typeof window !== 'undefined' ? window : globalThis);
