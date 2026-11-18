/* 千江月 · 坐标 v1（44 条）
 *
 * 每条的 v 是 11 个数，顺序固定为 axes.js 里的 A…K：
 *   A归因 B关系 C规范 D姿态 E时间 F认识 G风险 H情绪 I认可 J欲望 K执行
 * 0 表示「与这根轴无关」，不是「居中」。
 *
 * vs = { with, when }：一个能把它和最接近的那条分开的**具体情境**。
 *   这是「独立」的操作定义：存在情境，二者给出不同建议。
 * cf = 与哪些条目在**同一情境下给出相反建议**（对称声明，校验器会检查）。
 */
(function (root) {
  'use strict';

  var COORD = {
    /* —— A 归因 / E 时间 / K 执行 一线 —— */
    yusu:     { v: [1, 0, 0, 0, 2, 0, 0, 0, 0, 0, 1, 2, 0],
                vs: [{ with: 'jibu', when: '只剩三天、机会只开一次：jibu 仍主张继续攒，yusu 主张先别赶' }] },
    jibu:     { v: [0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 2, 0, 2],
                vs: [{ with: 'xiwang', when: '长期看不到结果时：jibu 让你继续攒量，xiwang 让你相信还在走' }] },
    xishi:    { v: [0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 1, -2, 0],
                vs: [{ with: 'jiyi', when: '回忆与当下冲突时：xishi 让你往前走，jiyi 让你留下来记住' }] },
    shenti:   { v: [0, 0, 0, 0, 2, 0, 1, 0, 0, 0, 1, 2, 0],
                vs: [{ with: 'yuhuan', when: '日子过得很舒服时：shenti 说去保养，yuhuan 说去吃苦' },
                { with: 'yusu', when: '项目临近截止而身体已经报警：yusu 让你慢下来做完，shenti 让你先停' }] },
    sisheng:  { v: [0, 0, 0, -1, 2, 0, 0, 0, 0, 0, 0, 0, 0],
                vs: [{ with: 'xishi', when: '时间是有限的：sisheng 让你先想清意义，xishi 让你立刻动手' }] },

    /* —— 环境 vs 自己 —— */
    qiuzhuji: { v: [2, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
                vs: [{ with: 'jinzhu', when: '同伴把你带坏了：qiuzhuji 说查自己，jinzhu 说换环境' }],
                cf: [{ with: 'jinzhu', when: '同一件事出了岔子，怪环境还是怪自己' }] },
    jinzhu:   { v: [-2, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                vs: [{ with: 'qiuzhuji', when: '学坏之后：jinzhu 先怪环境，qiuzhuji 先怪自己' },
                { with: 'yuhuan', when: '身边人都在混日子：jinzhu 说换环境，yuhuan 说这正该警惕' }],
                cf: [{ with: 'qiuzhuji', when: '同一件事出了岔子，怪环境还是怪自己' }] },
    yuhuan:   { v: [-2, 0, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0, 0],
                vs: [{ with: 'huoxi', when: '刚失败一次时：yuhuan 说这是好事，huoxi 说别急着判定' }] },
    huoxi:    { v: [-2, 0, 0, 0, 1, 0, -1, 0, 0, 0, 0, 0, 0],
                vs: [{ with: 'yuhuan', when: '祸事刚发生：huoxi 让你等它翻面，yuhuan 让你借它磨自己' }] },
    wuzhu:    { v: [-2, 0, 0, -1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
                vs: [{ with: 'chengzhang', when: '连续失败三次后：wuzhu 说这是学来的无助，chengzhang 说再试一次' }],
                cf: [{ with: 'chengzhang', when: '连续失败之后还要不要再试' }] },
    chengzhang:{ v: [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, -1],
                vs: [{ with: 'wuzhu', when: '已经放弃过一次的事：chengzhang 说能力能长，wuzhu 说那是旧伤在说话' }],
                cf: [{ with: 'wuzhu', when: '连续失败之后还要不要再试' }] },
    xiguan:   { v: [-1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 1, 0],
                vs: [{ with: 'chengzhang', when: '想改掉一个习惯：xiguan 靠重复换掉它，chengzhang 靠相信能变' }] },

    /* —— C 规范 —— */
    yinuo:    { v: [0, 0, 2, 0, 0, 0, 0, 0, 1, 0, 2, 0, 0],
                vs: [{ with: 'liuyibu', when: '答应的事后来极难做到：yinuo 让你守，liuyibu 让你通融' }],
                cf: [{ with: 'liuyibu', when: '承诺与处境冲突时，守约还是变通' }] },
    liuyibu:  { v: [0, -2, -2, 0, 0, 0, 0, 0, 0, 0, -1, 0, 0],
                vs: [{ with: 'yinuo', when: '口头答应但条件变了：liuyibu 主张按新情况办，yinuo 主张先认账' }],
                cf: [{ with: 'yinuo', when: '承诺与处境冲突时，守约还是变通' }] },
    jisuo:    { v: [0, -2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                vs: [{ with: 'ziyou', when: '家人反对你的选择：jisuo 让你体谅他们的处境，ziyou 让你自己定' }],
                cf: [{ with: 'ziyou', when: '个人意愿与家庭期待正面冲突' }] },
    ziyou:    { v: [0, 2, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                vs: [{ with: 'jisuo', when: '要为自己活还是为关系活：ziyou 选前者，jisuo 选后者' }],
                cf: [{ with: 'jisuo', when: '个人意愿与家庭期待正面冲突' }] },
    yixue:    { v: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0],
                vs: [{ with: 'liuyibu', when: '一个小错要不要为关系放过去：yixue 说不放，liuyibu 说留余地' }] },
    buqu:     { v: [0, 0, 2, 1, 0, 0, -1, 0, 0, 0, 0, 0, 0],
                vs: [{ with: 'ruoshui', when: '对手明显更强时：buqu 说不低头，ruoshui 说先绕开' }],
                cf: [{ with: 'ruoshui', when: '面对一个更强的对手，硬扛还是绕开' }] },
    baoyuan:  { v: [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
                vs: [{ with: 'zhinu', when: '刚被人伤害：baoyuan 说按直回一次，zhinu 说先把火压住再说' }] },

    /* —— D 姿态 / H 情绪 —— */
    yongqi:   { v: [0, 0, 1, 2, 0, 0, -2, 0, 0, 0, 0, 0, 0],
                vs: [{ with: 'shendu', when: '目睹不公而自己并不相干：yongqi 说站出来，shendu 说先管好自己' }],
                cf: [{ with: 'shendu', when: '与己无关的不公，要不要开口' }] },
    shendu:   { v: [0, 0, 0, -2, 0, 0, 0, 2, 2, 0, 0, 0, 0],
                vs: [{ with: 'yongqi', when: '没有人监督时：shendu 说守住自己就够了，yongqi 说还要替别人出头' }],
                cf: [{ with: 'yongqi', when: '与己无关的不公，要不要开口' }] },
    heertong: { v: [0, -1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
                vs: [{ with: 'shendu', when: '看到不对的事：heertong 说要当面说，shendu 说先收着' }],
                cf: [{ with: 'shenyan', when: '该不该把不同意见说出口' }] },
    shenyan:  { v: [0, 0, 0, -1, 0, 0, 0, 2, 0, 0, 0, 0, 0],
                vs: [{ with: 'heertong', when: '有些真话可能伤人：shenyan 说烂在肚子里，heertong 说讲出来才算和' }],
                cf: [{ with: 'heertong', when: '该不该把不同意见说出口' }] },
    gudu:     { v: [0, 1, 0, -1, 0, 0, 0, 0, 1, 0, 0, 0, 0],
                vs: [{ with: 'heertong', when: '周末有人约你但你只想独处：gudu 说留下，heertong 说去见面' }] },
    zhinu:    { v: [0, 0, 0, 0, 0, 0, 1, 2, 0, 0, 0, 0, 0],
                vs: [{ with: 'baoyuan', when: '对方刚伤了你：zhinu 说二十四小时之内不做决定，baoyuan 说该回就回一次' },
                { with: 'shenyan', when: '正在气头上：zhinu 说先压住再讲，shenyan 说这种话根本不该出口' }] },

    /* —— F 认识 / I 认可 —— */
    jinxin:   { v: [0, 0, -1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0],
                vs: [{ with: 'buxiawen', when: '遇到不懂的事：jinxin 说去查去验，buxiawen 说先问人' },
                { with: 'fengzhong', when: '查一段历史的记载：jinxin 说原书也未必可靠，fengzhong 说印象由最后一页决定' }] },
    buxiawen: { v: [0, 0, 0, 0, 0, 2, 0, 0, 1, 0, 0, 0, 0],
                vs: [{ with: 'jinxin', when: '书上的说法你不信：buxiawen 让你找人问，jinxin 让你自己验' },
                { with: 'dake', when: '你想知道自己到底懂不懂：buxiawen 说去问别人，dake 说你可能正高估自己' },
                { with: 'jingwa', when: '你发现自己视野窄：buxiawen 说去找人请教，jingwa 说先走出自己的环境' },
                { with: 'zizhi', when: '想弄清自己是什么人：buxiawen 说问别人眼里的你，zizhi 说自己三省' },
                { with: 'fengzhong', when: '评价一次合作：buxiawen 说去问参与者，fengzhong 说结尾决定印象' }] },
    dake:     { v: [0, 0, 0, 0, 0, 2, 0, 0, 2, 0, 0, 0, 0],
                vs: [{ with: 'zizhi', when: '你觉得自己已经看得很清楚：dake 说你正在盲区，zizhi 说那就再省一次' }] },
    zizhi:    { v: [0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0],
                vs: [{ with: 'dake', when: '自评很高时：zizhi 让你三省，dake 提醒你高估本身才是问题' }] },
    jingwa:   { v: [0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0],
                vs: [{ with: 'zizhi', when: '觉得自己眼界很开：jingwa 说你还在井里，zizhi 说你只是没看清自己' },
                { with: 'dake', when: '你笃定自己判断没错：jingwa 说是井口太小，dake 说是能力不足造成的错觉' },
                { with: 'jiyi', when: '你以为自己记得很清楚：jingwa 说你只是没看过外面，jiyi 说记忆已被改写过' },
                { with: 'xuesi', when: '读了很多却越发糊涂：jingwa 说眼界不够，xuesi 说没有消化' }] },
    qianshi:  { v: [0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 2],
                vs: [{ with: 'fengzhong', when: '复盘一段经历：qianshi 让你看全程与教训，fengzhong 说结尾最影响你的评价' }] },
    fengzhong:{ v: [0, 0, 0, 0, -1, 2, 0, 0, 0, 0, 0, 0, 0],
                vs: [{ with: 'qianshi', when: '评价一次合作：fengzhong 说结尾决定印象，qianshi 说要查全程记录' },
                { with: 'jinxin', when: '回忆一段往事：jinxin 说别信现成的记载，fengzhong 说你的记忆由结尾定型' },
                { with: 'jiyi', when: '回忆一件事：fengzhong 说结尾决定你的印象，jiyi 说这段记忆本身已被重写过' }] },
    jiyi:     { v: [0, 0, 0, 0, -1, 1, 0, 0, 0, 0, 0, 0, 0],
                vs: [{ with: 'xishi', when: '旧事反复回来：jiyi 让你承认它改写过，xishi 让你别在它上面耗时间' },
                { with: 'xuesi', when: '你记住的与书上写的不一样：jiyi 说记忆会改写，xuesi 说该把它想明白' }] },

    /* —— B 关系 —— */
    bianjie:  { v: [0, -1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0],
                vs: [{ with: 'daiji', when: '家人与朋友同时需要你：bianjie 讲分寸与边界，daiji 说先家里' },
                { with: 'heertong', when: '饭桌上有人说了让你不适的真话：heertong 说继续谈，bianjie 说留分寸' },
                { with: 'qifa', when: '教一个人时：qifa 说因人而异，bianjie 说别越过界替他决定' }] },
    daiji:    { v: [0, -2, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
                vs: [{ with: 'bianjie', when: '父母的要求越过你的边界：daiji 说先顺着，bianjie 说讲清楚' },
                { with: 'jisuo', when: '父母的要求会伤到第三方：daiji 说先顾父母，jisuo 说己所不欲' },
                { with: 'heertong', when: '家族群里为一件不公争执：daiji 说别伤和气，heertong 说该争' }] },

    /* —— J 欲望 / C 规范 —— */
    zhizu:    { v: [0, 0, 0, 0, 0, 0, 1, 0, 2, 2, 0, 0, 0],
                vs: [{ with: 'jinqian', when: '收入可以翻倍但要换城市：zhizu 问够不够，jinqian 问这钱该不该挣' }],
                cf: [{ with: 'jinqian', when: '有一个明显更好的赚钱机会，要不要追' }] },
    jinqian:  { v: [0, 0, 1, 0, 0, 0, 0, 0, 0, -1, 0, 0, 0],
                vs: [{ with: 'zhizu', when: '多赚一倍的代价是多花一半时间：jinqian 说先看这笔钱干净不干净，zhizu 说先问你够不够' },
                { with: 'baoyuan', when: '有人用不光彩的方式赚了钱：baoyuan 说按直回一次，jinqian 说先看这钱干不干净' }],
                cf: [{ with: 'zhizu', when: '有一个明显更好的赚钱机会，要不要追' }] },

    /* —— 认识与行动之间 —— */
    zhixing:  { v: [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 2, 0, 0],
                vs: [{ with: 'xuesi', when: '读了很多却做不到：zhixing 说去做，xuesi 说先停下来想清楚' }] },
    xuesi:    { v: [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
                vs: [{ with: 'zhixing', when: '手上信息很多却动不了：xuesi 让你先想，zhixing 让你先动' }] },
    zhuanzhu: { v: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 2, 0, -2],
                vs: [{ with: 'qifa', when: '一个方法连试三次都不奏效：zhuanzhu 说继续钻下去，qifa 说换一种教法' }] },
    qifa:     { v: [0, -1, -1, 0, 0, 0, 0, 0, 0, 0, -1, 0, 0],
                vs: [{ with: 'zhuanzhu', when: '同一条方法对两个人效果不同：qifa 说该因人而异，zhuanzhu 说该继续练' },
                { with: 'liuyibu', when: '同一条规矩对某个人明显不合身：qifa 说换教法，liuyibu 说放宽尺度' }] },
    xiwang:   { v: [1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
                vs: [{ with: 'jibu', when: '看不到进展时：xiwang 说还在走，jibu 说量还不够' }] },

    /* —— 自我评价与克制 —— */
    manzhao:  { v: [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0],
                vs: [{ with: 'zhizu', when: '你已经比别人强：manzhao 说危险来了，zhizu 说够了就行' }] },
    ruoshui:  { v: [-2, 0, -1, 0, 0, 0, 1, 2, 0, 0, 0, 0, 0],
                vs: [{ with: 'qiuzhuji', when: '遇到不公：ruoshui 让你顺着水走，qiuzhuji 让你先改自己那一段' }],
                cf: [{ with: 'buqu', when: '面对一个更强的对手，硬扛还是绕开' }] }
  };

  root.QJY_COORD = { version: 'v2', map: COORD, axisOrder: ['A','B','C','D','E','F','G','H','I','J','K','L','M'] };
})(typeof window !== 'undefined' ? window : globalThis);
