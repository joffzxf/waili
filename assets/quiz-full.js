/* 千江月 · 三观坐标（44 题全版 · 诊断向）
 *
 * 与 12 题快版的区别：
 *   快版是**引子**——每段描述都留余地、都告诉你代价。
 *   全版是**诊断**——先给倾向强度（强／中／平），再给更肯定的判断。
 *
 * 结构：44 条道理 → 44 道题，一条一个。四轴各 11 题，正反都有。
 * 轴定义与快版共用 QJY_QUIZ.AXES，不另立一套。
 */
(function (root) {
  'use strict';

  var AXES = (root.QJY_QUIZ && root.QJY_QUIZ.AXES) || [
    { id: 'control', pos: '事在人为', neg: '顺势而为' },
    { id: 'self',    pos: '个体自主', neg: '关系优先' },
    { id: 'rule',    pos: '守原则',   neg: '看后果'   },
    { id: 'engage',  pos: '入世',     neg: '出世'     }
  ];

  /* dir = +1：同意推向正端；-1：同意推向负端 */
  var ITEMS = [
    /* 掌控（11）——事在人为 ↔ 顺势而为 */
    { axis: 'control', dir: +1, theme: 'qiuzhuji', text: '一个人的处境，主要是他自己选择的结果。' },
    { axis: 'control', dir: -1, theme: 'huoxi',    text: '运气在成功里的分量，比大多数人愿意承认的大得多。' },
    { axis: 'control', dir: -1, theme: 'ruoshui',  text: '遇到不公，先想办法适应它，比试图改变它更实际。' },
    { axis: 'control', dir: +1, theme: 'jibu',     text: '长期看，一个人能走多远，由他愿意下多少笨功夫决定。' },
    { axis: 'control', dir: +1, theme: 'chengzhang', text: '「我不擅长」这句话，多半只是个台阶。' },
    { axis: 'control', dir: +1, theme: 'xishi',    text: '「没时间」，几乎从来不是真正的原因。' },
    { axis: 'control', dir: +1, theme: 'qianshi',  text: '反复犯同一个错，通常是因为不肯承认第一次。' },
    { axis: 'control', dir: +1, theme: 'jinxin',   text: '前人说得对不对，得自己验一遍才算数。' },
    { axis: 'control', dir: -1, theme: 'wuzhu',    text: '反复受挫之后，人真的会失去再试一次的力气。' },
    { axis: 'control', dir: -1, theme: 'yuhuan',   text: '太安稳的日子，会悄悄把人养废。' },
    { axis: 'control', dir: -1, theme: 'shenti',   text: '身体的账最后由身体来收，不看你意志多强。' },

    /* 取向（11）——个体自主 ↔ 关系优先 */
    { axis: 'self', dir: -1, theme: 'daiji',   text: '为了不让家人失望，放弃自己想做的事是值得的。' },
    { axis: 'self', dir: +1, theme: 'ziyou',   text: '一个人的价值，首先由他自己定义，而不是由他所在的群体。' },
    { axis: 'self', dir: -1, theme: 'bianjie', text: '关系坏了，事情做成了也是输。' },
    { axis: 'self', dir: +1, theme: 'jingwa',  text: '看不见外面，多半不是没机会，是不想看。' },
    { axis: 'self', dir: +1, theme: 'gudu',    text: '能不能一个人待住，决定你能不能真的和别人在一起。' },
    { axis: 'self', dir: +1, theme: 'zhinu',   text: '管不管得住脾气，是自己的事，别怪环境。' },
    { axis: 'self', dir: +1, theme: 'zhizu',   text: '知道自己要什么，比得到什么更重要。' },
    { axis: 'self', dir: -1, theme: 'xiguan',  text: '你是什么人，取决于你被什么环境反复塑造。' },
    { axis: 'self', dir: +1, theme: 'zhixing', text: '知道却不去做，等于不知道。' },
    { axis: 'self', dir: -1, theme: 'jinzhu',  text: '你最后会变成你身边那些人的样子。' },
    { axis: 'self', dir: -1, theme: 'jisuo',   text: '别人的感受，常常比我的原则更该优先。' },

    /* 准则（11）——守原则 ↔ 看后果 */
    { axis: 'rule', dir: +1, theme: 'yinuo',   text: '说了谎就是错的，哪怕它救了人。' },
    { axis: 'rule', dir: -1, theme: 'liuyibu', text: '规矩是死的，人是活的，破一次例不算什么。' },
    { axis: 'rule', dir: -1, theme: 'baoyuan', text: '对错要看后果，而不是看有没有违反规矩。' },
    { axis: 'rule', dir: +1, theme: 'yixue',   text: '小事不管，迟早变成大祸。' },
    { axis: 'rule', dir: +1, theme: 'buqu',    text: '有些事宁可输，也不能低头。' },
    { axis: 'rule', dir: +1, theme: 'yusu',    text: '宁可慢一点做对，也别抢快做错。' },
    { axis: 'rule', dir: +1, theme: 'shenyan', text: '有些真话，也不该说出口。' },
    { axis: 'rule', dir: +1, theme: 'sisheng', text: '人终有一死，所以更不能违心地活。' },
    { axis: 'rule', dir: -1, theme: 'qifa',    text: '同一条道理，对不同的人应该有不同的说法。' },
    { axis: 'rule', dir: -1, theme: 'dake',    text: '一个人越笃定自己没错，越可能正错着。' },
    { axis: 'rule', dir: -1, theme: 'jiyi',    text: '你以为记得的，未必是真正发生过的。' },

    /* 姿态（11）——入世 ↔ 出世 */
    { axis: 'engage', dir: +1, theme: 'yongqi',    text: '这个世界值得你去改变它，而不是只去理解它。' },
    { axis: 'engage', dir: -1, theme: 'shendu',    text: '一个人能把自己活明白，就已经够了，不必去管天下事。' },
    { axis: 'engage', dir: +1, theme: 'heertong',  text: '看到不对的事，即使与自己无关，也应该出声。' },
    { axis: 'engage', dir: +1, theme: 'xiwang',    text: '只要还在走，就还没到绝路。' },
    { axis: 'engage', dir: -1, theme: 'zhuanzhu',  text: '一个人只要把一件事做到极致，就别去管别的了。' },
    { axis: 'engage', dir: +1, theme: 'xuesi',     text: '知道了却做不到，是这世上最常见的失败。' },
    { axis: 'engage', dir: +1, theme: 'buxiawen',  text: '不懂就问，是成年人最缺的一种勇气。' },
    { axis: 'engage', dir: +1, theme: 'jinqian',   text: '能坦然谈钱的人，才算真正入了世。' },
    { axis: 'engage', dir: -1, theme: 'zizhi',     text: '一个人看清自己，比看清世界有用得多。' },
    { axis: 'engage', dir: -1, theme: 'manzhao',   text: '人一旦觉得「够了」，就不再往外看了。' },
    { axis: 'engage', dir: -1, theme: 'fengzhong', text: '结局比过程重要，所以体面收场最要紧。' }
  ];

  var LABELS = ['不同意', '部分不同意', '中立', '部分同意', '同意'];
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

  /* 诊断向：先给强度，再给判断 */
  function tier(v) {
    var a = Math.abs(v);
    if (a >= 60) return 'strong';
    if (a >= 25) return 'clear';
    return 'flat';
  }
  var TIER_NAME = { strong: '强烈', clear: '明确', flat: '平缓' };

  var DIAG = {
    control: {
      pos: ['你几乎不接受「没办法」这个说法，习惯把结果归到自己手上。',
            '你倾向于认为结果主要由人自己做出来。',
            '你在「人定」与「天定」之间摇摆，视情况而定。'],
      neg: ['你几乎把成败归给环境与时机，个人的位置在你这里很轻。',
            '你倾向于认为环境与时机的作用大于个人努力。',
            '你不认为环境能决定一切，也不认为人能扭转一切。']
    },
    self: {
      pos: ['你把人当作独立的单位，「我是谁」永远先于「我属于谁」。',
            '你看重自我定义多于群体归属。',
            '你在自我与关系之间保持平衡。'],
      neg: ['你几乎总是先考虑关系，个人意愿可以整块让出去。',
            '你看重关系的存续多于个人得失。',
            '你不愿为关系无限让步，也不愿为自我切断关系。']
    },
    rule: {
      pos: ['你把原则放在后果之上，宁可付出代价也不越线。',
            '你看重原则多于结果。',
            '你在原则与后果之间按事判断。'],
      neg: ['你几乎不看规矩，只看结果好不好。',
            '你看重后果多于规矩本身。',
            '你既不僵守规矩，也不轻视规矩。']
    },
    engage: {
      pos: ['你很难对不公平保持沉默，即使与你无关。',
            '你倾向于介入、发声、改变。',
            '你既不急于介入，也不刻意退开。'],
      neg: ['你几乎不介入身外之事，把自己活明白就是全部。',
            '你倾向于退一步看，不卷进时代的喧哗。',
            '你在入世与出世之间来回。']
    }
  };

  function diagnose(scores) {
    return AXES.map(function (a) {
      var v = scores[a.id] || 0;
      var t = tier(v);
      var k = v >= 0 ? 'pos' : 'neg';
      var which = t === 'strong' ? 0 : (t === 'clear' ? 1 : 2);
      return {
        axis: a.id,
        pole: v >= 0 ? a.pos : a.neg,
        value: v,
        tier: t,
        tierName: TIER_NAME[t],
        text: DIAG[a.id][k][which]
      };
    });
  }

  function encode(answers) {
    var s = '';
    for (var i = 0; i < ITEMS.length; i++) {
      var v = Number(answers[i]);
      s += (v >= 0 && v <= 4) ? String(v) : '2';
    }
    return 'q2' + s;
  }

  function decode(code) {
    var s = String(code || '');
    if (s.length !== 2 + ITEMS.length || s.slice(0, 2) !== 'q2') return null;
    var out = [];
    for (var i = 2; i < s.length; i++) {
      if (!/[0-4]/.test(s.charAt(i))) return null;
      out.push(Number(s.charAt(i)));
    }
    return out;
  }

  /* 沿用快版的文明聚合，只是把题源换成全版 */
  function traditions(answers, themes) {
    var Q = root.QJY_QUIZ;
    if (!Q) return { top: [], bottom: null, ranked: [] };
    var byId = {};
    (themes || []).forEach(function (t) { byId[t.id] = t; });
    var acc = {};
    Q.GROUPS.forEach(function (g) { acc[g.id] = 0; });

    ITEMS.forEach(function (it, i) {
      var w = value(answers[i]);
      if (!w) return;
      var t = byId[it.theme];
      if (!t || !t.canon) return;
      var hits = {}, total = 0;
      t.canon.forEach(function (c) {
        Q.GROUPS.forEach(function (g) {
          if (g.test(String(c.r), String(c.k))) hits[g.id] = (hits[g.id] || 0) + 1;
        });
      });
      Object.keys(hits).forEach(function (k) { total += hits[k]; });
      if (!total) return;
      Object.keys(hits).forEach(function (k) { acc[k] += w * hits[k] / total; });
    });

    var ranked = Q.GROUPS.map(function (g) {
      return { id: g.id, name: g.name, v: acc[g.id] };
    }).sort(function (a, b) { return b.v - a.v; });

    return {
      top: ranked.filter(function (x) { return x.v > 0.3; }).slice(0, 3),
      bottom: ranked.filter(function (x) { return x.v < -0.3; }).slice(-1)[0] || null,
      ranked: ranked
    };
  }

  root.QJY_QUIZ_FULL = {
    AXES: AXES, ITEMS: ITEMS, LABELS: LABELS,
    value: value, score: score, tier: tier, TIER_NAME: TIER_NAME,
    diagnose: diagnose, encode: encode, decode: decode, traditions: traditions
  };
})(typeof window !== 'undefined' ? window : globalThis);
