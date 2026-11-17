/* 千江月 · 三观坐标（12 题快版）
 *
 * 设计原则：
 *   1. 每道题是一个**可被反对的断言**，不是美德词汇。能被大多数人同意的话测不出任何东西。
 *   2. 四根轴，每轴 3 题，正反都有，避免同向堆叠。
 *   3. 每题挂一条现成的道理（theme），结果页由此链回九文明——测验不是终点，是入口。
 *   4. 不测心理健康、不测政治立场、不给类型标签当身份。
 *
 * 四轴（+ 端命名在前）：
 *   掌控  事在人为 ↔ 顺势而为
 *   取向  个体自主 ↔ 关系优先
 *   准则  守原则   ↔ 看后果
 *   姿态  入世     ↔ 出世
 */
(function (root) {
  'use strict';

  var AXES = [
    { id: 'control', pos: '事在人为', neg: '顺势而为' },
    { id: 'self',    pos: '个体自主', neg: '关系优先' },
    { id: 'rule',    pos: '守原则',   neg: '看后果'   },
    { id: 'engage',  pos: '入世',     neg: '出世'     }
  ];

  /* dir = +1 表示「同意」把该轴推向正端；-1 表示推向负端 */
  var ITEMS = [
    { id: 1,  axis: 'control', dir: +1, theme: 'qiuzhuji',
      text: '一个人的处境，主要是他自己选择的结果。' },
    { id: 2,  axis: 'control', dir: -1, theme: 'huoxi',
      text: '运气在成功里的分量，比大多数人愿意承认的大得多。' },
    { id: 3,  axis: 'control', dir: -1, theme: 'ruoshui',
      text: '遇到不公，先想办法适应它，比试图改变它更实际。' },

    { id: 4,  axis: 'self',    dir: -1, theme: 'daiji',
      text: '为了不让家人失望，放弃自己想做的事是值得的。' },
    { id: 5,  axis: 'self',    dir: +1, theme: 'ziyou',
      text: '一个人的价值，首先由他自己定义，而不是由他所在的群体。' },
    { id: 6,  axis: 'self',    dir: -1, theme: 'bianjie',
      text: '关系坏了，事情做成了也是输。' },

    { id: 7,  axis: 'rule',    dir: +1, theme: 'yinuo',
      text: '说了谎就是错的，哪怕它救了人。' },
    { id: 8,  axis: 'rule',    dir: -1, theme: 'liuyibu',
      text: '规矩是死的，人是活的，破一次例不算什么。' },
    { id: 9,  axis: 'rule',    dir: -1, theme: 'baoyuan',
      text: '对错要看后果，而不是看有没有违反规矩。' },

    { id: 10, axis: 'engage',  dir: +1, theme: 'yongqi',
      text: '这个世界值得你去改变它，而不是只去理解它。' },
    { id: 11, axis: 'engage',  dir: -1, theme: 'shendu',
      text: '一个人能把自己活明白，就已经够了，不必去管天下事。' },
    { id: 12, axis: 'engage',  dir: +1, theme: 'heertong',
      text: '看到不对的事，即使与自己无关，也应该出声。' }
  ];

  var LABELS = ['不同意', '部分不同意', '中立', '部分同意', '同意'];
  /* 0..4 → -2..+2；「部分同意/部分不同意」按方向记 ±1 */
  function value(ans) { return (Number(ans) || 0) - 2; }

  /* ---- 计分：返回每个轴的 -100..100 ---- */
  function score(answers) {
    var sums = {}, counts = {};
    AXES.forEach(function (a) { sums[a.id] = 0; counts[a.id] = 0; });
    ITEMS.forEach(function (it, i) {
      var v = value(answers[i]);
      sums[it.axis] += v * it.dir;
      counts[it.axis] += 1;
    });
    var out = {};
    AXES.forEach(function (a) {
      /* 每轴最多 3 题 × 2 分 = 6 */
      out[a.id] = counts[a.id] ? Math.round(sums[a.id] / (counts[a.id] * 2) * 100) : 0;
    });
    return out;
  }

  /* ---- 文字描述 ---- */
  var DESCRIBE = {
    control: {
      pos: '你相信结果主要是人自己做出来的，因此听到「没办法」这三个字会本能地不服气。代价是：你容易把别人的失意也读成不够努力。',
      neg: '你相信环境与时机占了很大分量，因此更愿意等风来，而不是硬顶。代价是：有时候你会把「顺势」当成不动的理由。'
    },
    self: {
      pos: '你把「我是谁」放在「我属于谁」前面，宁愿孤单也不愿被定义。代价是：你会低估那些愿意为关系让步的人。',
      neg: '你先看关系的存续，再谈个人的得失，认为有些事赢了也没意思。代价是：你有时候会用自己的委屈去换一个没有明说的和谐。'
    },
    rule: {
      pos: '你认为有些线不能踩，即使踩过去结果更好。代价是：你会被懂得变通的人说成不知变通。',
      neg: '你看重后果重于规矩，愿意为更大的善破一次例。代价是：破例的门一旦开了，很难只破这一次。'
    },
    engage: {
      pos: '你觉得看见不对就该开口，哪怕改变不了什么。代价是：你容易被消耗在与你无关的战场上。',
      neg: '你更在意把自己活明白，不愿被时代的喧哗拖进去。代价是：沉默久了，会分不清是通透还是退缩。'
    }
  };

  /* ---- 文明亲和度 ----
   * 由「你同意的条目挂在哪条道理上」反推：那条道理的引证来自哪些文明。
   * 这用的是语料自身的 region 字段，不是另编的标签。 */
  var GROUPS = [
    { id: 'cn',   name: '中国经典',   test: function (r) { return /^中/.test(r); } },
    { id: 'gr',   name: '希腊罗马',   test: function (r) { return /^(希腊|罗马)/.test(r); } },
    { id: 'heb',  name: '希伯来·犹太', test: function (r) { return /^(希伯来|犹太)/.test(r); } },
    { id: 'in',   name: '印度',       test: function (r) { return /^印/.test(r); } },
    { id: 'jp',   name: '日本',       test: function (r) { return /^日/.test(r); } },
    { id: 'west', name: '近现代西方', test: function (r) { return /^(法|英|德|美|西班牙|匈|奥|哥|阿|非|苏格兰|意|俄)/.test(r); } },
    { id: 'sci',  name: '现代科学',   test: function (r, k) { return /^(论文|研究)$/.test(k); } }
  ];

  function traditions(answers, themes) {
    var byId = {};
    (themes || []).forEach(function (t) { byId[t.id] = t; });
    var acc = {};
    GROUPS.forEach(function (g) { acc[g.id] = 0; });

    ITEMS.forEach(function (it, i) {
      var w = value(answers[i]);
      if (!w) return;
      var t = byId[it.theme];
      if (!t || !t.canon) return;
      var hits = {};
      t.canon.forEach(function (c) {
        GROUPS.forEach(function (g) {
          if (g.test(String(c.r), String(c.k))) hits[g.id] = (hits[g.id] || 0) + 1;
        });
      });
      var total = 0;
      Object.keys(hits).forEach(function (k) { total += hits[k]; });
      if (!total) return;
      Object.keys(hits).forEach(function (k) { acc[k] += w * hits[k] / total; });
    });

    var ranked = GROUPS.map(function (g) {
      return { id: g.id, name: g.name, v: acc[g.id] };
    }).sort(function (a, b) { return b.v - a.v; });

    return {
      top: ranked.filter(function (x) { return x.v > 0.35; }).slice(0, 3),
      bottom: ranked.filter(function (x) { return x.v < -0.35; }).slice(-1)[0] || null,
      ranked: ranked
    };
  }

  /* ---- URL 编码：12 位 0–4 ---- */
  function encode(answers) {
    var s = '';
    for (var i = 0; i < ITEMS.length; i++) {
      var v = Number(answers[i]);
      s += (v >= 0 && v <= 4) ? String(v) : '2';
    }
    return 'q1' + s;
  }

  function decode(code) {
    var s = String(code || '');
    if (s.length !== 2 + ITEMS.length || s.slice(0, 2) !== 'q1') return null;
    var out = [];
    for (var i = 2; i < s.length; i++) {
      var d = s.charAt(i);
      if (!/[0-4]/.test(d)) return null;
      out.push(Number(d));
    }
    return out;
  }

  /* ---- 结果文字 ---- */
  function summary(scores) {
    var lines = AXES.map(function (a) {
      var v = scores[a.id] || 0;
      var pole = v >= 0 ? a.pos : a.neg;
      var k = v >= 0 ? 'pos' : 'neg';
      return {
        axis: a.id,
        label: a.pos + ' ↔ ' + a.neg,
        pole: pole,
        value: v,
        text: DESCRIBE[a.id][k]
      };
    });
    return lines;
  }

  function reservedCount(answers) {
    var n = 0;
    for (var i = 0; i < ITEMS.length; i++) if (Number(answers[i]) === 3 || Number(answers[i]) === 1) n++;
    return n;
  }

  root.QJY_QUIZ = {
    AXES: AXES, ITEMS: ITEMS, LABELS: LABELS, GROUPS: GROUPS,
    value: value, score: score, traditions: traditions,
    encode: encode, decode: decode, summary: summary, reservedCount: reservedCount
  };
})(typeof window !== 'undefined' ? window : globalThis);
