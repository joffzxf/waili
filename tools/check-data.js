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

['assets/data.js', 'assets/data-2.js', 'assets/data-3.js', 'assets/data-4.js', 'assets/data-5.js', 'assets/data-6.js', 'assets/related.js', 'assets/poster.js', 'assets/match.js'].forEach(function (f) {
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
  ['我学不会', 'chengzhang']
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
const LATIN = /[A-Za-zÀ-ÿĀ-ſ\u0370-\u03FF\u0400-\u04FF]/;
let origHave = 0, origSoft = [], posterMissing = 0;

THEMES.forEach(function (t) {
  t.canon.forEach(function (c, i) {
    if (String(c.r).charAt(0) === '中') return;          // 中文原典，无需外文原文
    const tag = t.id + ' canon[' + i + ']';
    const hasInline = LATIN.test(c.t);
    if (c.o) { origHave++; return; }
    if (c.noOrig) { origHave++; return; }                 // 已显式声明无原句
    if (hasInline) { origHave++; return; }                // 原句已内嵌在 t 里

    if (c.poster) {
      posterMissing++;
      ok(false, '海报条目必须附原文或声明无原句：' + tag, c.t.slice(0, 20));
    } else {
      origSoft.push(t.id + '/' + c.k);
    }
  });
});

ok(posterMissing === 0, '文与影的海报条目都应带外文原文', String(posterMissing) + ' 条缺失');
console.log('  译文原文覆盖：' + origHave + ' 条已具备；其余 ' + origSoft.length +
  ' 条纯中译条目待补（不阻断构建，见 docs/行动指引.md）');

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

/* ---------- 汇总 ---------- */
console.log('\n' + '─'.repeat(52));
if (fails === 0) {
  console.log('✓ 全部通过（' + checks + ' 项检查）');
  process.exit(0);
} else {
  console.log('✗ 失败 ' + fails + ' 项 / 共 ' + checks + ' 项检查');
  process.exit(1);
}
