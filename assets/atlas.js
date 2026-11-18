/* 千江月 · 轴盘（把 13 根轴变成一个可以拨的东西）
 *
 * 用法：用户把若干轴拨到某个位置，这里算出「哪几条道理最像站在那儿」。
 *
 * 距离的定义要小心：一条道理平均只在 2.67 根轴上有立场，其余是 0。
 * 若直接用全 13 维欧氏距离，那些「哪根轴都不表态」的条目会凭空占便宜。
 * 所以只算用户**拨动过**的轴；且当道理在某根轴上为 0（不表态）时，
 * 按「与用户意见完全相反」计罚——不表态，就是没站在你要的位置上。
 */
(function (root) {
  'use strict';

  /* vec: 长度 = 轴数，值域 -2..2，0 表示「这根轴我不挑」 */
  function activeAxes(vec) {
    var out = [];
    for (var i = 0; i < vec.length; i++) if (vec[i]) out.push(i);
    return out;
  }

  /* 返回 { dist, n, overlap }；dist 越小越像 */
  function distance(vec, v, axes) {
    var sum = 0, overlap = 0;
    for (var k = 0; k < axes.length; k++) {
      var i = axes[k];
      var u = vec[i];
      var t = v[i] || 0;
      if (t === 0) {
        sum += Math.abs(u) * 1.5;      /* 它压根没表态，罚得比「说反了」更重一点 */
      } else {
        var d = Math.abs(u - t);
        sum += d;
        if (d === 0) overlap++;
      }
    }
    return { dist: sum, overlap: overlap };
  }

  /* 排序：距离升序；同距离时，轴方向完全一致的优先 */
  function rank(vec, themes, coords, axesDef, limit) {
    var axes = activeAxes(vec);
    if (!axes.length) return [];
    var rows = [];
    (themes || []).forEach(function (t) {
      var c = coords[t.id];
      if (!c || !c.v) return;
      var r = distance(vec, c.v, axes);
      rows.push({
        theme: t,
        dist: r.dist,
        overlap: r.overlap,
        axes: axes.length,
        /* 吻合度：完全对上的轴数 / 用户拨动的轴数 */
        fit: axes.length ? r.overlap / axes.length : 0
      });
    });
    rows.sort(function (a, b) {
      if (a.overlap !== b.overlap) return b.overlap - a.overlap;
      return a.dist - b.dist;
    });
    return limit ? rows.slice(0, limit) : rows;
  }

  /* 把用户拨的轴翻译成一句人话 */
  function describe(vec, axesDef) {
    var parts = [];
    for (var i = 0; i < vec.length; i++) {
      if (!vec[i]) continue;
      var a = axesDef[i];
      parts.push(vec[i] > 0 ? a.pos : a.neg);
    }
    return parts;
  }

  root.QJY_ATLAS = {
    activeAxes: activeAxes,
    distance: distance,
    rank: rank,
    describe: describe
  };
})(typeof window !== 'undefined' ? window : globalThis);
