#!/usr/bin/env node
/* 千江月 · 语料与匹配自检
 * 用法：node tools/check-data.js
 * 退出码 0 = 全部通过；1 = 有失败项
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

/* ---------- 载入浏览器脚本 ---------- */
const sandbox = { console };
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

['assets/data.js', 'assets/data-2.js', 'assets/data-3.js', 'assets/data-4.js', 'assets/data-5.js', 'assets/data-6.js', 'assets/data-7.js', 'assets/data-8.js', 'assets/data-9.js', 'assets/data-10.js', 'assets/data-11.js', 'assets/data-12.js', 'assets/data-13.js', 'assets/data-14.js', 'assets/data-15.js', 'assets/data-16.js', 'assets/data-17.js', 'assets/data-18.js', 'assets/data-19.js', 'assets/data-20.js', 'assets/related.js', 'assets/poster.js', 'assets/shelf.js', 'assets/quiz.js', 'assets/quiz-full.js', 'assets/quiz-v2.js', 'assets/schemes.js', 'assets/axes.js', 'assets/coordinates.js', 'assets/match.js'].forEach(function (f) {
  const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
  vm.runInContext(src, sandbox, { filename: f });
});

const WISDOM = sandbox.window.WISDOM;
const QJY = sandbox.window.QJY;
const THEMES = WISDOM.themes;

let fails = 0;
let checks = 0;

function ok(cond, label, extra) {
  checks++;
  if (!cond) {
    fails++;
    console.log('  ✗ ' + label + (extra ? '  → ' + extra : ''));
  }
}
function section(name) { console.log('\n' + name); }

/* ---------- 1. 结构完整性 ---------- */
section('【1】结构完整性');

const ids = new Set();
let totalCanon = 0;

THEMES.forEach(function (t, idx) {
  const tag = '主题#' + (idx + 1) + ' ' + (t.id || '(无 id)');
  ok(typeof t.id === 'string' && t.id.length > 0, tag + ' id');
  ok(!ids.has(t.id), tag + ' id 唯一', '重复: ' + t.id);
  ids.add(t.id);

  ok(typeof t.name === 'string' && t.name.length > 0, tag + ' name');
  ok(typeof t.gist === 'string' && t.gist.length >= 8, tag + ' gist');
  ok(Array.isArray(t.keywords) && t.keywords.length >= 5, tag + ' keywords>=5',
    '实际 ' + (t.keywords || []).length);

  ok(Array.isArray(t.canon) && t.canon.length >= 5, tag + ' canon>=5',
    '实际 ' + (t.canon || []).length);
  (t.canon || []).forEach(function (c, i) {
    const ct = tag + ' canon[' + i + ']';
    ['r', 'k', 't', 's', 'n'].forEach(function (f) {
      ok(typeof c[f] === 'string' && c[f].trim().length > 0, ct + '.' + f);
    });
    ok(c.t && c.t.length >= 6, ct + ' 原文过短');
    ok(c.s && /[《〔（(]|谚语|铭文|民谣|残篇|存疑/.test(c.s), ct + ' 出处格式可疑', c.s);
    totalCanon++;
  });

  const h = t.history || {};
  ok(h.stance === 'model' || h.stance === 'contrast', tag + ' history.stance', h.stance);
  ok(typeof h.title === 'string' && h.title.length > 0, tag + ' history.title');
  ok(typeof h.era === 'string' && h.era.length > 0, tag + ' history.era');
  ok(typeof h.body === 'string' && h.body.length >= 80, tag + ' history.body 过短',
    (h.body || '').length + ' 字');
  ok(typeof h.lesson === 'string' && h.lesson.length >= 20, tag + ' history.lesson 过短');

  ok(Array.isArray(t.questions) && t.questions.length >= 3, tag + ' questions>=3');
  ok(Array.isArray(t.actions) && t.actions.length >= 2, tag + ' actions>=2');

  // 每主题应有中外双向引证
  const cn = t.canon.filter(function (c) { return String(c.r).charAt(0) === '中'; }).length;
  const other = t.canon.length - cn;
  ok(cn >= 1, tag + ' 缺中国引证');
  ok(other >= 2, tag + ' 缺域外引证', '域外仅 ' + other + ' 条');

  // 正面范例与反面教训都要有（全库层面检查）
});

const stances = THEMES.map(function (t) { return t.history.stance; });
ok(stances.indexOf('model') !== -1, '全库含正面范例');
ok(stances.indexOf('contrast') !== -1, '全库含反面教训');

ok(THEMES.length >= 12, '主题数量 >= 12', '实际 ' + THEMES.length);
ok(Array.isArray(WISDOM.generic.questions) && WISDOM.generic.questions.length >= 3, 'generic.questions');
ok(Array.isArray(WISDOM.generic.actions) && WISDOM.generic.actions.length >= 2, 'generic.actions');

console.log('  主题 ' + THEMES.length + ' 条 · 引证 ' + totalCanon + ' 条 · 史案 ' + THEMES.length + ' 则');

/* ---------- 2. 引文防伪 ---------- */
section('【2】引文防伪');

// 同一句原文不应出现在多个主题里（避免占位式复制）
const seen = new Map();
THEMES.forEach(function (t) {
  t.canon.forEach(function (c) {
    const key = c.t.replace(/\s/g, '');
    if (seen.has(key)) {
      ok(false, '引文重复出现', '「' + c.t.slice(0, 18) + '…」同时见于 ' +
        seen.get(key) + ' 与 ' + t.id);
    } else {
      seen.set(key, t.id);
    }
  });
});

// 标为「存疑」的条目必须自己说明了出处可疑，不能伪装成确证
THEMES.forEach(function (t) {
  t.canon.forEach(function (c) {
    if (c.k === '存疑') {
      ok(/存疑|不确|误植|归于|概括/.test(c.s + c.n), t.id + ' 存疑条目须注明', c.s);
    }
  });
});

/* 关键词跨主题重复 = 词面磁铁。同一个词只应有一个主人，
 * 否则「我总在拖延」这类输入会被两个主题同时认领，谁赢全看分数上那点巧合。
 * 这条规则是被一次真实冲突逼出来的：拖延同时属于「惜时」和「知行合一」。 */
const kwOwner = new Map();
THEMES.forEach(function (t) {
  const seenInTheme = new Set();
  (t.keywords || []).forEach(function (k) {
    const n = QJY.norm(k);
    if (!n || seenInTheme.has(n)) return;
    seenInTheme.add(n);
    if (kwOwner.has(n)) {
      ok(false, '关键词「' + k + '」被 ' + kwOwner.get(n) + ' 与 ' + t.id + ' 同时占用',
        '一个词只能有一个主人');
    } else {
      kwOwner.set(n, t.id);
    }
  });
});

/* ---------- 3. 匹配准确率 ---------- */
section('【3】匹配准确率');

QJY.prepare(THEMES);

const CASES = [
  // 用户可能怎么问 → 期望主题
  ['欲速则不达', 'yusu'],
  ['不要急功近利', 'yusu'],
  ['我太着急了', 'yusu'],
  ['揠苗助长', 'yusu'],
  ['坚持就是胜利', 'jibu'],
  ['每天进步一点点', 'jibu'],
  ['水滴石穿', 'jibu'],
  ['人不能骄傲', 'manzhao'],
  ['太得意会出事', 'manzhao'],
  ['居安思危', 'yuhuan'],
  ['生于忧患死于安乐', 'yuhuan'],
  ['认清自己', 'zizhi'],
  ['要经常反省自己', 'zizhi'],
  ['看清自己很难', 'zizhi'],
  ['知道很多道理，仍然过不好', 'zhixing'],
  ['纸上谈兵', 'zhixing'],
  ['道理都懂就是做不到', 'zhixing'],
  ['以柔克刚', 'ruoshui'],
  ['硬碰硬没有用', 'ruoshui'],
  ['千里之堤溃于蚁穴', 'yixue'],
  ['细节决定成败', 'yixue'],
  ['己所不欲，勿施于人', 'jisuo'],
  ['要懂得换位思考', 'jisuo'],
  ['倒霉的事可能是好事', 'huoxi'],
  ['塞翁失马', 'huoxi'],
  ['说话要留有余地', 'liuyibu'],
  ['过犹不及', 'liuyibu'],
  ['怎么才能记住教训', 'qianshi'],
  ['以史为镜', 'qianshi'],
  ['答应别人的事要做到', 'yinuo'],
  ['做人要讲信用', 'yinuo'],
  ['团队里有不同意见怎么办', 'heertong'],
  ['君子和而不同', 'heertong'],
  ['没人看见的时候', 'shendu'],
  ['自律很难', 'shendu'],
  // 2026-11 新增：不盲从经验 / 尽信书
  ['不要盲从经验', 'jinxin'],
  ['尽信书不如无书', 'jinxin'],
  ['不要照搬老办法', 'jinxin'],
  ['经验主义害死人', 'jinxin'],
  ['要学会独立思考', 'jinxin'],
  ['要善于总结经验', 'qianshi'],
  ['凡事要留有余地', 'liuyibu'],
  ['他太傲慢了', 'manzhao'],
  ['说话要算数', 'yinuo'],
  // 第三批（主题 17—23）
  ['珍惜时间', 'xishi'],
  ['时间就是金钱', 'xishi'],
  ['我总在拖延', 'zhixing'],
  ['知足常乐', 'zhizu'],
  ['我总想要更多', 'zhizu'],
  ['言多必失', 'shenyan'],
  ['我说话太多', 'shenyan'],
  ['近朱者赤', 'jinzhu'],
  ['朋友影响很大', 'jinzhu'],
  ['控制不住发脾气', 'zhinu'],
  ['容易生气', 'zhinu'],
  ['井底之蛙', 'jingwa'],
  ['格局太小', 'jingwa'],
  ['学而不思则罔', 'xuesi'],
  ['死记硬背', 'xuesi'],
  // 第四批（主题 24—30）
  ['以直报怨', 'baoyuan'],
  ['放不下怨恨', 'baoyuan'],
  ['总爱抱怨别人', 'qiuzhuji'],
  ['怕死', 'sisheng'],
  ['总是分心', 'zhuanzhu'],
  ['戒掉坏习惯', 'xiguan'],
  ['不懂装懂', 'buxiawen'],
  ['不知道怎么教孩子', 'qifa'],
  // 第五批（主题 31—36，文学与电影）
  ['看不到希望', 'xiwang'],
  ['撑下去', 'xiwang'],
  ['我认输了', 'buqu'],
  ['想要自由', 'ziyou'],
  ['一个人很孤单', 'gudu'],
  ['忘记过去', 'jiyi'],
  ['不敢开口', 'yongqi'],
  // 第六批（主题 37—40，科学与心理学）
  ['我总是高估自己', 'dake'],
  ['我做什么都没用', 'wuzhu'],
  ['我对这次经历印象很差', 'fengzhong'],
  ['我学不会', 'chengzhang'],
  // 第七批（主题 41—44，生活四题）
  ['怎么赚钱', 'jinqian'],
  ['不会拒绝别人', 'bianjie'],
  ['父母年纪大了', 'daiji'],
  ['总是熬夜', 'shenti']
];

let hitCount = 0;
CASES.forEach(function (pair) {
  const q = pair[0], want = pair[1];
  const r = QJY.match(q, THEMES);
  const got = r.hit ? r.hit.id : '(未命中)';
  const pass = got === want;
  if (pass) hitCount++;
  ok(pass, '「' + q + '」→ ' + want, '实得 ' + got +
    (r.ranked && r.ranked[0] ? ' (最高分 ' + r.ranked[0].score.toFixed(1) + ')' : ''));
});

// 首页示例 chip 必须都能命中
const CHIPS = ['欲速则不达', '知道很多道理，仍然过不好', '太骄傲会出事',
  '己所不欲，勿施于人', '怎么才能记住教训', '没人看见的时候'];
CHIPS.forEach(function (c) {
  const r = QJY.match(c, THEMES);
  ok(!!r.hit, '首页示例「' + c + '」必须命中', '未命中');
});

// 无关输入不应硬凑一个主题
const NEG = ['今天天气怎么样', '帮我写一段 python 代码', '明天开会吗',
  '我很快乐', '这条路很快', '他慢慢走了'];
NEG.forEach(function (q) {
  const r = QJY.match(q, THEMES);
  ok(!r.hit, '无关输入「' + q + '」不应命中', '误命中 ' + (r.hit && r.hit.id));
});

console.log('  匹配用例 ' + hitCount + ' / ' + CASES.length + ' 命中预期');

/* ---------- 4. 反向语义：不能把意思听反 ---------- */
section('【4】反向语义');

/* 这些用例记录过一次真实事故：「不要盲从经验」被匹配到「前事不忘，后事之师」
 * ——那是「要从经验里学」的道理，方向正好相反。
 * 结构为 [输入, 必须命中, 绝不可命中]。
 * 根因是「经验」这类中性领域名词被当成关键词，会朝任意方向吸附。 */
const POLARITY = [
  ['不要盲从经验', 'jinxin', 'qianshi'],
  ['不要照搬书本上的经验', 'jinxin', 'qianshi'],
  ['经验未必可靠', 'jinxin', 'qianshi'],
  ['前人经验不能全信', 'jinxin', 'qianshi'],
  ['要从前人的失败中学习', 'qianshi', 'jinxin'],
  ['总结经验教训很重要', 'qianshi', 'jinxin']
];

POLARITY.forEach(function (c) {
  const q = c[0], want = c[1], forbid = c[2];
  const r = QJY.match(q, THEMES);
  const got = r.hit ? r.hit.id : '(未命中)';
  ok(got === want, '反向「' + q + '」应命中 ' + want, '实得 ' + got);
  ok(got !== forbid, '反向「' + q + '」绝不可命中 ' + forbid, '误命中 ' + forbid);
});

/* 中性领域名词不应作为关键词：它们能朝任意方向吸附。
 * 这里做一道软性提醒——把只用了一个字的关键词列出来供人工复核，
 * 单词关键词最容易造成「沾到字就算命中」。 */
const singleChar = [];
THEMES.forEach(function (t) {
  (t.keywords || []).forEach(function (k) {
    if (QJY.norm(k).length === 1) singleChar.push(t.id + ':' + k);
  });
});
if (singleChar.length) {
  console.log('  · 单字关键词（需人工确认不会误吸附）：' + singleChar.join('、'));
}

/* 「快乐」里的「快」曾把「我希望快乐」吸到「欲速则不达」，
 * 这里断言一批常见复合词不会被拆开误命中。 */
const COMPOSITE = [
  ['傲慢', 'manzhao'],   // 复合词应命中它自己的主题
  ['快乐', null],        // 不应被单字「快」吸到 yusu
  ['慢慢', null],
  ['曲子', null],
  ['习惯成自然', null]
];
COMPOSITE.forEach(function (c) {
  const w = c[0], want = c[1];
  const r = QJY.match(w, THEMES);
  const got = r.hit ? r.hit.id : null;
  if (want) {
    ok(got === want, '复合词「' + w + '」应命中 ' + want, '实得 ' + (got || '(未命中)'));
  } else {
    ok(got !== 'yusu', '复合词「' + w + '」不应被拆字吸到 yusu', '误命中 ' + got);
  }
});

/* ---------- 5. 构建指纹 ---------- */
section('【5】构建指纹');

/* GitHub Pages 发 Cache-Control: max-age=600，浏览器可能拿「新 HTML + 旧 JS」。
 * 指纹变了 ?v= 才会变。改了资源却忘了跑 stamp.js，这里必须报错。 */
const STAMP = require('./stamp.js');
const stampInfo = STAMP.inspect();
ok(stampInfo.synced, 'index.html 构建指纹已与资源同步（改完资源要跑 node tools/stamp.js）',
  '资源指纹 ' + stampInfo.build + '，页内记录 ' + (stampInfo.stored || '(无)'));
ok(stampInfo.versions.length >= STAMP.ASSETS.length, 'index.html 每个资源都带了 ?v=',
  '只找到 ' + stampInfo.versions.length + ' 处，应为 ' + STAMP.ASSETS.length);
console.log('  资源指纹 ' + stampInfo.build + ' · 引用 ' + stampInfo.versions.length + ' 处 ?v=');

/* 语料是纯文本，渲染时统一转义；夹带 Markdown 会原样显示成星号。
 * 曾经有一条按语写成 **限制**，页面上就真的出现了四个星号。 */
THEMES.forEach(function (t) {
  const fields = [t.name, t.gist, t.history.title, t.history.era, t.history.body, t.history.lesson]
    .concat(t.questions || [], t.actions || [])
    .concat((t.canon || []).map(function (c) { return c.t + c.s + c.n; }));
  fields.forEach(function (s) {
    ok(!/\*\*|\[[^\]]+\]\([^)]+\)/.test(String(s)), '语料不应夹带 Markdown 标记：' +
      String(s).slice(0, 26) + '…');
  });
});

/* ---------- 6. 主题之环 ---------- */
section('【6】主题之环');

/* 30 条道理串成一个环，每条与左右相邻的两条相通。
 * 环必须恰好覆盖所有主题一次，否则「相通的另两条」会出现空位或指向不存在的主题。 */
const RING = sandbox.window.QJY_RING || [];
ok(Array.isArray(RING) && RING.length === THEMES.length,
  '环的长度应等于主题数', RING.length + ' vs ' + THEMES.length);

const ringSet = new Set();
RING.forEach(function (id) {
  ok(THEMES.some(function (t) { return t.id === id; }), '环里的主题存在：' + id);
  ok(!ringSet.has(id), '环里没有重复：' + id);
  ringSet.add(id);
});
THEMES.forEach(function (t) {
  ok(ringSet.has(t.id), '每个主题都在环里：' + t.id);
});
console.log('  环上 ' + RING.length + ' 条，每条有 2 个相邻主题');

/* 译文必须附原文。
 * 判据：境外条目若 t 是纯中文（不含拉丁/希腊/西里尔字母），
 * 就必须给 o（原文）或 noOrig（说明为什么没有原文）。
 * 海报上的条目是硬约束——那是读者第一眼看到的东西；
 * 其余条目先做统计，逐步补齐。 */
const LATIN = /[A-Za-zÀ-ÿĀ-ſ\u0370-\u03FF\u0400-\u04FF\u0590-\u05FF\u0600-\u06FF\u0900-\u097F\u3040-\u30FF\uAC00-\uD7AF]/;
let origHave = 0, origSoft = [], posterMissing = 0;

THEMES.forEach(function (t) {
  t.canon.forEach(function (c, i) {
    if (String(c.r).charAt(0) === '中') return;          // 中文原典，无需外文原文
    const tag = t.id + ' canon[' + i + ']';
    const hasInline = LATIN.test(c.t);
    if (c.o || c.oEn) { origHave++; return; }
    if (c.noOrig) { origHave++; return; }                 // 已显式声明无原句
    if (hasInline) { origHave++; return; }                // 原句已内嵌在 t 里

    /* 覆盖已达 100%，此处由软提醒升级为硬约束：
       新增译文条目若只有中文，构建直接失败 */
    if (c.poster) posterMissing++;
    else origSoft.push(t.id + '/' + c.k);
    ok(false, '译文必须附原文(o)／英译(oEn) 或声明无原句(noOrig)：' + tag, c.t.slice(0, 20));
  });
});

ok(posterMissing === 0, '文与影的海报条目都应带外文原文', String(posterMissing) + ' 条缺失');
ok(origSoft.length === 0, '所有译文条目都应附原文或声明无原句', origSoft.length ? origSoft.join('、') : '');
console.log('  译文原文覆盖：' + origHave + ' 条已具备，缺口 ' + origSoft.length + ' 条（缺一条即构建失败）');

/* ---------- 7. 文与影 ---------- */
section('【7】文与影 · 海报');

/* 带 poster 的条目会被搬到「文与影」分区。带来的风险是「同此一念」被抽空，
 * 所以这里强制每个主题至少留 3 条非影视引证。 */
const MED_OK = ['book', 'film', 'stage'];
let mediaCount = 0;
let mediaThemes = 0;

THEMES.forEach(function (t) {
  const media = (t.canon || []).filter(function (c) { return c.poster; });
  const classic = (t.canon || []).filter(function (c) { return !c.poster; });
  if (!media.length) return;

  mediaThemes++;
  mediaCount += media.length;
  ok(classic.length >= 3, '「同此一念」至少保留 3 条非影视引证：' + t.id, '实际 ' + classic.length);

  media.forEach(function (c, i) {
    const p = c.poster || {};
    const tag = t.id + ' poster[' + i + ']';
    ok(MED_OK.indexOf(p.med) !== -1, tag + '.med 取 book/film/stage', String(p.med));
    ok(typeof p.title === 'string' && p.title.length > 0, tag + '.title');
    ok(typeof p.year === 'number' && p.year > 1000 && p.year < 2200, tag + '.year', String(p.year));
    ok(typeof p.by === 'string' && p.by.length > 0, tag + '.by');
  });
});

ok(mediaCount >= 8, '文与影条目数应 ≥ 8', '实际 ' + mediaCount);
console.log('  文与影 ' + mediaCount + ' 条，分布在 ' + mediaThemes + ' 个主题');

const POSTER = sandbox.window.QJY_POSTER;
ok(!!POSTER && typeof POSTER.art === 'function', 'poster.js 已加载且暴露 art()');

if (POSTER && POSTER.art) {
  const a1 = POSTER.art('百年孤独|1967', 'book');
  const a2 = POSTER.art('百年孤独|1967', 'book');
  ok(a1 === a2, '同一作品两次生成必须完全一致（否则每次进页面都变样）');
  ok(a1 !== POSTER.art('老人与海|1952', 'book'), '不同作品应得到不同海报');
  ok(a1 !== POSTER.art('百年孤独|1967', 'film'), '电影与小说的体裁痕迹应不同');
  ok(/^<svg[\s\S]*<\/svg>$/.test(a1), '返回完整 SVG 片段');
  ok(a1.indexOf('url(#pg') !== -1, '渐变引用带唯一前缀，多张海报同页不会串色');
  ok(a1.indexOf('unsafe-inline') === -1, '不应包含内联脚本');
  console.log('  海报生成已校验：确定性、唯一性、体裁差异');
}

/* ---------- 8. 册子逻辑 ---------- */
section('【8】册子（收藏）逻辑');

const SH = sandbox.window.QJY_SHELF;
ok(!!SH && typeof SH.toggle === 'function', 'shelf.js 已加载且暴露 toggle()');

if (SH) {
  ok(SH.has([], 'a', 0) === false, '空册子不含任何条目');

  var one = SH.toggle([], 'a', 0, { text: 'x', src: 'y' });
  ok(one.length === 1 && SH.has(one, 'a', 0), '收藏后应存在');

  var back = SH.toggle(one, 'a', 0);
  ok(back.length === 0, '再次切换应移出');
  ok(one.length === 1, '切换不应修改入参数组（否则界面状态会错乱）');

  var m = SH.toggle([], 'b', 3, { text: 't' });
  var round = SH.deserialize(SH.serialize(m));
  ok(round.length === 1 && round[0].t === 'b' && round[0].i === 3, '导出再导入应保持一致');

  ok(SH.deserialize('这不是 JSON').length === 0, '坏 JSON 不应抛错');
  ok(SH.deserialize(JSON.stringify([{ t: 'c', i: 1 }, { t: 'c', i: 1 }])).length === 1, '导入应去重');
  /* i = -1 是合法值：表示收藏整条主题；-2 及更小才是非法 */
  ok(SH.deserialize(JSON.stringify({ items: [{ t: 'x' }, { t: 'y', i: -2 }, { t: 'z', i: 0 }] })).length === 1,
    '非法条目（缺下标或下标小于 -1）应被过滤');
  ok(SH.deserialize(JSON.stringify({ items: [{ t: 'w', i: -1 }] })).length === 1,
    '-1 应作为「整条主题」被接受');

  var grouped = SH.group(SH.toggle(SH.toggle([], 'a', 1), 'b', 2),
    [{ id: 'a', name: '甲' }, { id: 'b', name: '乙' }]);
  ok(grouped.length === 2 && grouped[0].theme.name === '甲', '分组应按主题聚合且取到主题名');

  console.log('  册子逻辑：切换、去重、往返、分组均已校验');
}

/* ---------- 9. 三观坐标（12 题） ---------- */
section('【9】三观坐标');

const QZ = sandbox.window.QJY_QUIZ;
ok(!!QZ && Array.isArray(QZ.ITEMS), 'quiz.js 已加载');

if (QZ) {
  ok(QZ.ITEMS.length === 12, '题量应为 12', String(QZ.ITEMS.length));

  /* 每轴恰好 3 题，且正反都有——否则某一轴会被同向堆叠拉偏 */
  QZ.AXES.forEach(function (a) {
    const mine = QZ.ITEMS.filter(function (it) { return it.axis === a.id; });
    ok(mine.length === 3, '轴 ' + a.id + ' 应有 3 题', String(mine.length));
    ok(mine.some(function (it) { return it.dir > 0; }), '轴 ' + a.id + ' 缺正向题');
    ok(mine.some(function (it) { return it.dir < 0; }), '轴 ' + a.id + ' 缺反向题');
  });

  /* 每题都要挂到一条真实存在的道理上，结果页才能链回去 */
  QZ.ITEMS.forEach(function (it) {
    ok(THEMES.some(function (t) { return t.id === it.theme; }),
      '题 ' + it.id + ' 指向的主题应存在：' + it.theme);
    ok(typeof it.text === 'string' && it.text.length >= 8, '题 ' + it.id + ' 应有完整断言');
  });

  /* 全选「同意」不应给出清一色的结果——那说明题目同向堆叠了 */
  const allAgree = QZ.score([4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]);
  const vals = QZ.AXES.map(function (a) { return allAgree[a.id]; });
  ok(vals.some(function (v) { return v > 0; }) && vals.some(function (v) { return v < 0; }),
    '全选「同意」时四轴应正负并存', vals.join(','));
  ok(vals.every(function (v) { return Math.abs(v) <= 100; }), '轴分应落在 -100..100');

  /* 全选中立 → 四轴全 0 */
  const neutral = QZ.score([2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]);
  ok(QZ.AXES.every(function (a) { return neutral[a.id] === 0; }), '全选中立时四轴应为 0');

  /* 编码往返 */
  const sample = [4, 3, 2, 1, 0, 4, 2, 2, 3, 1, 0, 4];
  const code = QZ.encode(sample);
  const back = QZ.decode(code);
  ok(!!back && back.join(',') === sample.join(','), '编码解码应无损');
  ok(code.length === 14 && code.slice(0, 2) === 'q1', '编码应为 q1 + 12 位');
  ok(QZ.decode('q1') === null, '长度不对应返回 null');
  ok(QZ.decode('q199999999999') === null, '含非法字符应返回 null');
  ok(QZ.decode('') === null, '空编码应返回 null');

  /* 文明亲和度 */
  const tr = QZ.traditions(sample, THEMES);
  ok(Array.isArray(tr.top) && tr.ranked.length === QZ.GROUPS.length, '应返回完整的分组排名');
  ok(tr.top.length <= 3, '最亲近的文明最多 3 个');
  tr.top.forEach(function (x) {
    ok(typeof x.name === 'string' && x.name.length > 0, '分组应有中文名');
  });

  /* 「保留态度」计数 */
  ok(QZ.reservedCount([3, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]) === 2, '部分同意/部分不同意应计入保留');

  console.log('  四轴 ' + QZ.AXES.length + ' · 题目 ' + QZ.ITEMS.length +
    ' · 文明分组 ' + QZ.GROUPS.length + ' · 编解码与计分已校验');
}

/* ---------- 10. 三观坐标（44 题全版） ---------- */
section('【10】三观诊断（44 题）');

const QF = sandbox.window.QJY_QUIZ_FULL;
ok(!!QF && Array.isArray(QF.ITEMS), 'quiz-full.js 已加载');

if (QF) {
  ok(QF.ITEMS.length === 44, '题量应为 44', String(QF.ITEMS.length));

  QF.AXES.forEach(function (a) {
    const mine = QF.ITEMS.filter(function (it) { return it.axis === a.id; });
    ok(mine.length === 11, '轴 ' + a.id + ' 应有 11 题', String(mine.length));
    ok(mine.some(function (it) { return it.dir > 0; }), '轴 ' + a.id + ' 缺正向题');
    ok(mine.some(function (it) { return it.dir < 0; }), '轴 ' + a.id + ' 缺反向题');
  });

  /* 一条道理一题：44 条主题应被恰好覆盖一次 */
  const used = QF.ITEMS.map(function (it) { return it.theme; });
  const uniq = new Set(used);
  ok(uniq.size === used.length, '同一主题不应被出两道题');
  /* 量表冻结：诊断版固定 44 题，用来做跨时间比较。
     新入库的道理不自动进量表——否则去年和今年的分数不可比。 */
  ok(uniq.size === 44, '诊断版应固定为 44 题（量表冻结）', String(uniq.size));
  QF.ITEMS.forEach(function (it) {
    ok(THEMES.some(function (t) { return t.id === it.theme; }),
      '题目应指向存在的主题：' + it.theme);
  });
  console.log('  量表冻结在 44 题；题库现 ' + THEMES.length + ' 条，新增条目暂不进量表');

  /* 每轴 11 题只能是 6:5，方向不可能完全抵消——
     所以判据不是「正负并存」，而是「一刀切同意不能得出极端分」 */
  const agree = QF.score(new Array(44).fill(4));
  const av = QF.AXES.map(function (a) { return agree[a.id]; });
  ok(av.every(function (v) { return Math.abs(v) <= 15; }),
    '全选同意时四轴应接近中性（|分| ≤ 15）', av.join(','));
  ok(av.every(function (v) { return Math.abs(v) <= 100; }), '轴分应落在 -100..100');

  /* 全选中立 → 全平缓 */
  const neutral = QF.diagnose(QF.score(new Array(44).fill(2)));
  ok(neutral.every(function (d) { return d.tier === 'flat'; }), '全选中立时四轴都应为「平缓」');

  /* 强度分档 */
  ok(QF.tier(80) === 'strong' && QF.tier(40) === 'clear' && QF.tier(5) === 'flat',
    '强度分档阈值应为 60 / 25');

  /* 编解码 */
  const sampleFull = new Array(44).fill(0).map(function (_, i) { return i % 5; });
  const c2 = QF.encode(sampleFull);
  ok(c2.slice(0, 2) === 'q2' && c2.length === 46, '全版编码应为 q2 + 44 位');
  ok((QF.decode(c2) || []).join(',') === sampleFull.join(','), '全版编码解码应无损');
  ok(QF.decode(QZ.encode([2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2])) === null, '不应把快版编码当全版解');

  console.log('  44 题覆盖 ' + uniq.size + ' 条道理 · 每轴 11 题 · 强度分档与编解码已校验');
}

/* ---------- 11. 预置分类法 ---------- */
section('【11】预置分类法');

const SCH = sandbox.window.QJY_SCHEMES;
ok(!!SCH && Array.isArray(SCH.list) && SCH.list.length >= 2, 'schemes.js 已加载，且至少两套');

if (SCH) {
  SCH.list.forEach(function (s) {
    ok(typeof s.name === 'string' && s.name.length > 0, '分类法应有名字：' + s.id);
    ok(Array.isArray(s.groups) && s.groups.length >= 3, '分类法 ' + s.id + ' 至少 3 组');

    const ids = [];
    s.groups.forEach(function (g) {
      ok(typeof g.name === 'string' && g.name.length > 0, '分组应有名字：' + s.id);
      ok(Array.isArray(g.ids) && g.ids.length > 0, '分组不应为空：' + s.id + '/' + g.name);
      g.ids.forEach(function (id) {
        ids.push(id);
        ok(THEMES.some(function (t) { return t.id === id; }),
          '分类法 ' + s.id + ' 含未知主题：' + id);
      });
    });

    /* 每套分类法都必须恰好覆盖 44 条主题各一次 */
    const set = new Set(ids);
    ok(set.size === ids.length, '分类法 ' + s.id + ' 有重复条目');
    ok(set.size === THEMES.length, '分类法 ' + s.id + ' 应覆盖全部主题',
      set.size + ' / ' + THEMES.length);
    const missing = THEMES.filter(function (t) { return !set.has(t.id); }).map(function (t) { return t.id; });
    ok(missing.length === 0, '分类法 ' + s.id + ' 漏了主题', missing.join('、'));

    console.log('  ' + s.name + '：' + s.groups.length + ' 组，覆盖 ' + set.size + ' 条');
  });
}

/* ---------- 12. 坐标与独立性与冲突 ---------- */
section('【12】坐标 · 独立性 · 冲突');

const AX = sandbox.window.QJY_AXES;
const CO = sandbox.window.QJY_COORD;

ok(!!AX && Array.isArray(AX.list), 'axes.js 已加载');
ok(!!CO && CO.map, 'coordinates.js 已加载');

if (AX && CO) {
  const N = AX.list.length;
  ok(N >= 11, '轴表至少 11 根', String(N));
  console.log('  轴表 ' + AX.version + '：' + AX.list.map(function (a) { return a.name; }).join(' / '));

  const map = CO.map;
  const ids = Object.keys(map);

  /* 12.1 每条道理都必须有坐标 */
  ok(ids.length === THEMES.length, '坐标条目数应等于主题数', ids.length + ' / ' + THEMES.length);
  THEMES.forEach(function (t) {
    ok(!!map[t.id], '缺坐标：' + t.id);
  });
  ids.forEach(function (id) {
    ok(THEMES.some(function (t) { return t.id === id; }), '坐标指向不存在的主题：' + id);
  });

  /* 12.2 坐标合法：长度、整数、范围、非全零 */
  let allZero = [];
  ids.forEach(function (id) {
    const c = map[id];
    ok(Array.isArray(c.v) && c.v.length === N, id + ' 的坐标长度应为 ' + N);
    let sum = 0;
    (c.v || []).forEach(function (x, i) {
      ok(Number.isInteger(x), id + ' 坐标第 ' + (i + 1) + ' 位应为整数', String(x));
      ok(x >= -2 && x <= 2, id + ' 坐标越界（' + AX.list[i].name + '）', String(x));
      sum += Math.abs(x);
    });
    if (!sum) allZero.push(id);
  });
  ok(allZero.length === 0, '每条道理至少要被一根轴描述（不允许全零）', allZero.join('、'));

  /* 12.3 每根轴都得真的被用到，否则是死轴 */
  const usage = {};
  AX.list.forEach(function (a) { usage[a.id] = 0; });
  ids.forEach(function (id) {
    map[id].v.forEach(function (x, i) {
      if (Math.abs(x) >= 1) usage[AX.list[i].id] += 1;
    });
  });
  AX.list.forEach(function (a) {
    ok(usage[a.id] >= 3, '轴「' + a.name + '」使用不足（' + usage[a.id] + ' 条），可能是死轴');
  });
  console.log('  轴使用：' + AX.list.map(function (a) { return a.name + '·' + usage[a.id]; }).join(' '));

  /* 12.4 独立性：每条都要有一个能与最近邻分开的具体情境 */
  ids.forEach(function (id) {
    const vs = map[id].vs;
    ok(Array.isArray(vs) && vs.length >= 1, id + ' 缺 vs（区分情境数组）');
    if (!Array.isArray(vs)) return;
    vs.forEach(function (one, k) {
      ok(one.with !== id, id + ' 的 vs[' + k + '] 不应指向自己');
      ok(THEMES.some(function (t) { return t.id === one.with; }),
        id + ' 的 vs[' + k + '] 指向不存在的主题：' + one.with);
      ok(typeof one.when === 'string' && one.when.length >= 10,
        id + ' 的 vs[' + k + '].when 太短或为空');
    });
  });

  /* 12.5 冲突必须对称声明 */
  ids.forEach(function (id) {
    (map[id].cf || []).forEach(function (c) {
      ok(THEMES.some(function (t) { return t.id === c.with; }), id + ' 的冲突指向不存在的主题：' + c.with);
      const back = (map[c.with] && map[c.with].cf) || [];
      const found = back.some(function (b) { return b.with === id; });
      ok(found, '冲突必须对称：' + id + ' 声明了与 ' + c.with + ' 冲突，对方却没有');
    });
  });

  /* 12.6 近邻检测：向量太近的两条，必须已被 vs 或 cf 明确处理 */
  function dist(a, b) {
    let s = 0;
    for (let i = 0; i < N; i++) s += Math.pow((a[i] || 0) - (b[i] || 0), 2);
    return Math.sqrt(s);
  }
  function linked(a, b) {
    const ma = map[a], mb = map[b];
    const hasVs = function (m, target) {
      return (Array.isArray(m.vs) ? m.vs : []).some(function (x) { return x.with === target; });
    };
    if (hasVs(ma, b)) return true;
    if (hasVs(mb, a)) return true;
    if ((ma.cf || []).some(function (c) { return c.with === b; })) return true;
    if ((mb.cf || []).some(function (c) { return c.with === a; })) return true;
    return false;
  }

  const near = [];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const d = dist(map[ids[i]].v, map[ids[j]].v);
      if (d === 0) {
        ok(false, '两条坐标完全相同，必须合并或补轴：' + ids[i] + ' 与 ' + ids[j]);
      } else if (d < 1.0 && !linked(ids[i], ids[j])) {
        ok(false, '距离 < 1.0 且未写清区别，很可能重复：' + ids[i] + ' 与 ' + ids[j],
          'd=' + d.toFixed(2));
      } else if (d < 1.5 && !linked(ids[i], ids[j])) {
        near.push(ids[i] + '↔' + ids[j] + '(d=' + d.toFixed(2) + ')');
      }
    }
  }
  /* 增量式回审：1.0–1.5 之间只记待办，不阻断构建；清单见 tools/audit.js --write */
  if (near.length) console.log('  · 待办（1.0 ≤ d < 1.5 且未写区别）：' + near.length + ' 对');

  const withVs = ids.filter(function (id) {
    return Array.isArray(map[id].vs) && map[id].vs.length;
  }).length;
  const withCf = ids.filter(function (id) { return (map[id].cf || []).length; }).length;
  console.log('  ' + ids.length + ' 条全部有坐标与区分情境；' + withCf + ' 条声明了冲突');
}

/* ---------- 13. 三观坐标 v2（40 题） ---------- */
section('【13】三观坐标 v2');

const Q3 = sandbox.window.QJY_QUIZ_V2;
ok(!!Q3 && Array.isArray(Q3.ITEMS), 'quiz-v2.js 已加载');

if (Q3) {
  ok(Q3.ITEMS.length === 40, 'v2 题量应为 40', String(Q3.ITEMS.length));

  /* v1 的毛病：每轴 6 正 5 反，抵消不干净。v2 必须严格 5 正 5 反 */
  Q3.AXES.forEach(function (a) {
    const mine = Q3.ITEMS.filter(function (it) { return it.axis === a.id; });
    const pos = mine.filter(function (it) { return it.dir > 0; }).length;
    const neg = mine.filter(function (it) { return it.dir < 0; }).length;
    ok(pos === 5, '轴 ' + a.id + ' 应有 5 道正向题', String(pos));
    ok(neg === 5, '轴 ' + a.id + ' 应有 5 道反向题', String(neg));
  });

  /* 全选「同意」或「不同意」都应得 0——正反完全抵消 */
  const agree = Q3.score(new Array(40).fill(4));
  const deny = Q3.score(new Array(40).fill(0));
  Q3.AXES.forEach(function (a) {
    ok(agree[a.id] === 0, '全选同意时轴 ' + a.id + ' 应为 0', String(agree[a.id]));
    ok(deny[a.id] === 0, '全选不同意时轴 ' + a.id + ' 应为 0', String(deny[a.id]));
  });

  /* 每道题都要挂在真实主题上 */
  Q3.ITEMS.forEach(function (it, i) {
    ok(THEMES.some(function (t) { return t.id === it.theme; }),
      'v2 第 ' + (i + 1) + ' 题指向的主题应存在：' + it.theme);
    ok(typeof it.text === 'string' && it.text.length >= 8, 'v2 第 ' + (i + 1) + ' 题应有完整断言');
  });

  /* 必须真的用上了新补的对立面，否则 v2 只是 v1 的删减 */
  const newThemes = ['duliqingshen', 'jiyulida', 'zhichi', 'lianghaixiangquan',
                     'zhiqibuke', 'gongchengshentui', 'buruhuxue', 'qiongzedushan'];
  newThemes.forEach(function (id) {
    ok(Q3.ITEMS.some(function (it) { return it.theme === id; }),
      'v2 应包含来自新语料的题：' + id);
  });

  /* 编码 */
  const sampleV2 = new Array(40).fill(0).map(function (_, i) { return i % 5; });
  const c3 = Q3.encode(sampleV2);
  ok(c3.slice(0, 2) === 'q3' && c3.length === 42, 'v2 编码应为 q3 + 40 位');
  ok((Q3.decode(c3) || []).join(',') === sampleV2.join(','), 'v2 编码解码应无损');
  ok(Q3.decode(QZ.encode(new Array(12).fill(2))) === null, 'v2 不应把 12 题编码当自己的');
  ok(Q3.decode(QF.encode(new Array(44).fill(2))) === null, 'v2 不应把 44 题编码当自己的');

  /* 题序：同一根轴的题不应相邻 */
  let adjacent = 0;
  for (let i = 1; i < Q3.ITEMS.length; i++) {
    if (Q3.ITEMS[i].axis === Q3.ITEMS[i - 1].axis) adjacent++;
  }
  ok(adjacent === 0, '同轴题目不应相邻（会诱导作答惯性）', String(adjacent));

  console.log('  40 题，四轴各 5 正 5 反；全选同意/不同意均为 0');
}

/* ---------- 汇总 ---------- */
console.log('\n' + '─'.repeat(52));
if (fails === 0) {
  console.log('✓ 全部通过（' + checks + ' 项检查）');
  process.exit(0);
} else {
  console.log('✗ 失败 ' + fails + ' 项 / 共 ' + checks + ' 项检查');
  process.exit(1);
}
