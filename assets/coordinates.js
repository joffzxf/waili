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
                vs: [{ with: 'jibu', when: '只剩三天、机会只开一次：jibu 仍主张继续攒，yusu 主张先别赶' }] , cf: [{ with: 'bingguishensu', when: '时间紧、机会只开一次，该快还是该稳' }] },
    jibu:     { v: [0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 2, 0, 2],
                vs: [{ with: 'xiwang', when: '长期看不到结果时：jibu 让你继续攒量，xiwang 让你相信还在走' }] },
    xishi:    { v: [0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 1, -2, 0],
                vs: [{ with: 'jiyi', when: '回忆与当下冲突时：xishi 让你往前走，jiyi 让你留下来记住' }] , cf: [{ with: 'jinshixingle', when: '该把时间存起来，还是现在就花掉' }] },
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
                cf: [{ with: 'liuyibu', when: '承诺与处境冲突时，守约还是变通' }, { with: 'jiangzaiwai', when: '承诺与现场情况冲突时' }] },
    liuyibu:  { v: [0, -2, -2, 0, 0, 0, 0, 0, 0, 0, -1, 0, 0],
                vs: [{ with: 'yinuo', when: '口头答应但条件变了：liuyibu 主张按新情况办，yinuo 主张先认账' }],
                cf: [{ with: 'yinuo', when: '承诺与处境冲突时，守约还是变通' }, { with: 'bushijie', when: '尊严与通融冲突时' }] },
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
                cf: [{ with: 'shendu', when: '与己无关的不公，要不要开口' }, { with: 'junzibuli', when: '面对明显危险时，上还是避' }, { with: 'mingzhe', when: '局面不利时，是上还是避' }] },
    shendu:   { v: [0, 0, 0, -2, 0, 0, 0, 2, 2, 0, 0, 0, 0],
                vs: [{ with: 'yongqi', when: '没有人监督时：shendu 说守住自己就够了，yongqi 说还要替别人出头' }],
                cf: [{ with: 'yongqi', when: '与己无关的不公，要不要开口' }, { with: 'qiuming', when: '要不要在乎别人怎么评价你' }, { with: 'zhiqibuke', when: '与己无关又改不了的事，要不要介入' }] },
    heertong: { v: [0, -1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
                vs: [{ with: 'shendu', when: '看到不对的事：heertong 说要当面说，shendu 说先收着' }],
                cf: [{ with: 'shenyan', when: '该不该把不同意见说出口' }, { with: 'buzaizhiwei', when: '看到不对的事，该不该开口' }] },
    shenyan:  { v: [0, 0, 0, -1, 0, 0, 0, 2, 0, 0, 0, 0, 0],
                vs: [{ with: 'heertong', when: '有些真话可能伤人：shenyan 说烂在肚子里，heertong 说讲出来才算和' }],
                cf: [{ with: 'heertong', when: '该不该把不同意见说出口' }, { with: 'bupingzemin', when: '有情绪时该不该说出口' }] },
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
                cf: [{ with: 'jinqian', when: '有一个明显更好的赚钱机会，要不要追' }, { with: 'qufahushang', when: '已经够用，还要不要再往上走' }] },
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
,

    /* v2 补裸极：shuerbuzuo */
    shuerbuzuo: { v: [0, 0, 0, 0, 1, -2, 0, 0, 0, 0, 1, 0, 0],
                vs: [{ with: 'jinxin', when: '读一本经典：shuerbuzuo 说先把注疏读通，jinxin 说先怀疑它' }] },

    /* v2 补裸极：bupingzemin */
    bupingzemin: { v: [0, 0, 0, 1, 0, 0, 0, -2, 0, 0, 0, 0, 0],
                vs: [{ with: 'shenyan', when: '心里堵着一句话：shenyan 说咽下去，bupingzemin 说必须说出来' }],
                cf: [{ with: 'shenyan', when: '有情绪时该不该说出口' }] },

    /* v2 补裸极：qiuming */
    qiuming: { v: [0, 0, 0, 1, 0, 0, 0, 0, -2, 0, 0, 0, 0],
                vs: [{ with: 'shendu', when: '没人看见的时候：shendu 说守住自己就够，qiuming 说名声正是由这些时刻攒起来的' }],
                cf: [{ with: 'shendu', when: '要不要在乎别人怎么评价你' }] },

    /* v2 补裸极：qufahushang */
    qufahushang: { v: [0, 0, 0, 0, 2, 0, -1, 0, 0, -2, 0, 0, 0],
                vs: [{ with: 'zhizu', when: '已经够用之后：zhizu 说停，qufahushang 说再上一层' }],
                cf: [{ with: 'zhizu', when: '已经够用，还要不要再往上走' }] },

    /* v2 补裸极：bingguishensu */
    bingguishensu: { v: [0, 0, 0, 0, 0, 0, -2, 0, 0, 0, -1, -2, 0],
                vs: [{ with: 'yusu', when: '机会只剩三天：yusu 说别赶，bingguishensu 说立刻动手' }],
                cf: [{ with: 'yusu', when: '时间紧、机会只开一次，该快还是该稳' }] },

    /* v2 补裸极：jinshixingle */
    jinshixingle: { v: [0, 0, 0, 0, -2, 0, 0, -1, 0, -1, 0, 0, 0],
                vs: [{ with: 'xishi', when: '今晚就能高兴一下：xishi 说改天，jinshixingle 说就今晚' }],
                cf: [{ with: 'xishi', when: '该把时间存起来，还是现在就花掉' }, { with: 'xiannanzhihou', when: '有好处时，先拿还是先做' }] },

    /* v2 补裸极：duliqingshen */
    duliqingshen: { v: [0, 2, 0, 1, 0, 1, 0, -1, 0, 0, 0, 0, 0],
                vs: [{ with: 'ziyou', when: '所有人都不认同你：ziyou 说自己定义就够了，duliqingshen 说还要公开说出来' }] },

    /* v2 补裸极：jiangzaiwai */
    jiangzaiwai: { v: [0, 0, -1, 0, 0, 0, -1, 0, 0, 0, -2, 0, 0],
                vs: [{ with: 'yinuo', when: '当初答应的条件已经变了：yinuo 说守，jiangzaiwai 说改' }],
                cf: [{ with: 'yinuo', when: '承诺与现场情况冲突时' }] }
,

    /* 补裸极 / 交叉空格：shiyandaojun */
    shiyandaojun: { v: [0, 0, 0, 0, 1, -2, 0, 0, 0, 0, 0, 0, 0],
                vs: [{ with: 'shuerbuzuo', when: '想学一门手艺：shuerbuzuo 让你读传世的文本，shiyandaojun 让你找那个还活着的人当面学' }] },

    /* 补裸极 / 交叉空格：zhichi */
    zhichi: { v: [0, 0, 1, 0, 0, 0, 0, 1, -2, 0, 0, 0, 0],
                vs: [{ with: 'qiuming', when: '没人看见的时候：qiuming 说名声正是由这些时刻攒起来的，zhichi 说先问问自己惭不惭愧' }] },

    /* 补裸极 / 交叉空格：qiongzedushan */
    qiongzedushan: { v: [-2, 2, 0, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                vs: [{ with: 'duliqingshen', when: '大势已去时：duliqingshen 说还要公开说出来，qiongzedushan 说退回来守住自己' }] },

    /* 补裸极 / 交叉空格：jiyulida */
    jiyulida: { v: [2, -2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                vs: [{ with: 'jisuo', when: '想让人先得利时：jisuo 说别把你不要的推给别人，jiyulida 说先帮他把想要的拿到' }] },

    /* 补裸极 / 交叉空格：gongchengshentui */
    gongchengshentui: { v: [2, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                vs: [{ with: 'shendu', when: '功成之后：shendu 说继续守着自己，gongchengshentui 说这时候该走了' }] },

    /* 补裸极 / 交叉空格：lianghaixiangquan */
    lianghaixiangquan: { v: [2, 0, -2, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
                vs: [{ with: 'baoyuan', when: '两个选项都糟：baoyuan 说按直回一次，lianghaixiangquan 说算清代价取轻的那个' }] }
,

    /* 高价值空格：zhiqibuke */
    zhiqibuke: { v: [-2, 0, 1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                vs: [{ with: 'shendu', when: '明知改不了还要不要做：shendu 说先管好自己就够了，zhiqibuke 说正因改不了才该做' }],
                cf: [{ with: 'shendu', when: '与己无关又改不了的事，要不要介入' }] },

    /* 高价值空格：bushijie */
    bushijie: { v: [-1, 0, 2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
                vs: [{ with: 'liuyibu', when: '有人给你好处但态度轻蔑：bushijie 说别接，liuyibu 说先留余地' },
                { with: 'baoyuan', when: '被人轻慢之后：baoyuan 说按直回一次，bushijie 说连这次回应都不必给' }],
                cf: [{ with: 'liuyibu', when: '尊严与通融冲突时' }] },

    /* 高价值空格：buruhuxue */
    buruhuxue: { v: [2, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0],
                vs: [{ with: 'lianghaixiangquan', when: '两个选项都糟：lianghaixiangquan 说取轻的那个，buruhuxue 说另开一条路' }] },

    /* 高价值空格：suiyueran */
    suiyueran: { v: [-2, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, 0],
                vs: [{ with: 'qiongzedushan', when: '环境改不了时：qiongzedushan 说退回来守住自己，suiyueran 说就在这里安顿下来' }] },

    /* 高价值空格：zeshan */
    zeshan: { v: [1, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0],
                vs: [{ with: 'shuerbuzuo', when: '该跟谁学：shuerbuzuo 说守住一个传统读透，zeshan 说博采众家各取所长' }, { with: 'shiyandaojun', when: '求学的方式：shiyandaojun 说找一位老师跟到底，zeshan 说同时学好几家' }] }
,

    /* 批次 11：qinyudai */
    qinyudai: { v: [0, -2, 0, 0, -2, 0, 0, 1, 0, 0, 0, 0, 0],
                vs: [{ with: 'daiji', when: '父母还健在时：daiji 说怎么孝顺，qinyudai 说别等到来不及' }, { with: 'jinshixingle', when: '想把好事留到以后：jinshixingle 说的是自己的享受，qinyudai 说的是别人的时间窗口' }] },

    /* 批次 11：huannan */
    huannan: { v: [0, -1, 1, 0, 0, 0, -1, 0, 0, 0, 0, 0, 0],
                vs: [{ with: 'jinzhu', when: '该和谁走近：jinzhu 说看他们平时怎样，huannan 说看你落难时谁还在' },
                     { with: 'jisuo', when: '面对一个关系：jisuo 说要怎么对待对方，huannan 说先看对方值不值得这样对待' }] },

    /* 批次 11：xiaoburen */
    xiaoburen: { v: [0, 0, 1, 0, 2, 0, 0, 2, 0, 0, 0, 0, 0],
                vs: [{ with: 'baoyuan', when: '被人当面羞辱：baoyuan 说按直回一次，xiaoburen 说忍到更大的事做成' }] },

    /* 批次 11：gaiguan */
    gaiguan: { v: [0, 0, 1, 0, 2, 0, 0, 0, -1, 0, 0, 0, 0],
                vs: [{ with: 'qiuming', when: '在乎身后名：qiuming 说现在就要挣，gaiguan 说要等整段走完才能论定' }] },

    /* 批次 11：dadan */
    dadan: { v: [1, 0, 0, 0, 0, 2, -2, 0, 0, 0, 0, 0, 0],
                vs: [{ with: 'jinxin', when: '面对一个新想法：jinxin 说先怀疑它，dadan 说先大胆假设再小心求证' }] }
,

    /* 批次 12：ziqiuduofu */
    ziqiuduofu: { v: [2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                vs: [{ with: 'qiuzhuji', when: '遇到难处：qiuzhuji 说先查自己哪里不对，ziqiuduofu 说自己去找出路' }] },

    /* 批次 12：qiongtu */
    qiongtu: { v: [-1, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0],
                vs: [{ with: 'bupingzemin', when: '憋着一口气：bupingzemin 说要说出来，qiongtu 说走到真尽头就哭一场' }] },

    /* 批次 12：buyiwuxi */
    buyiwuxi: { v: [2, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0],
                vs: [{ with: 'xiaoburen', when: '被人激怒：xiaoburen 说为大局忍下来，buyiwuxi 说这件事根本不值得动心' }] },

    /* 批次 12：shijufei */
    shijufei: { v: [-1, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0],
                vs: [{ with: 'shendu', when: '外界都在否定你：shendu 说守住自己就够，shijufei 说毁誉都不该改变你的标准' },
                     { with: 'zizhi', when: '评价标准向内：zizhi 让你向内看清自己，shijufei 让你在众人的誉与非里不动摇' }] },

    /* 批次 12：jianji */
    jianji: { v: [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0],
                vs: [{ with: 'jiangzaiwai', when: '计划遇到变化：jiangzaiwai 说把决定权交给现场，jianji 说看到苗头立刻动手别等' }] }
,

    /* 批次 13：junzibuli */
    junzibuli: { v: [0, 1, -1, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0],
                vs: [{ with: 'yongqi', when: '明知有危险：yongqi 说该上就上，junzibuli 说先看看这堵墙会不会倒' }],
                cf: [{ with: 'yongqi', when: '面对明显危险时，上还是避' }] },

    /* 批次 13：buzaizhiwei */
    buzaizhiwei: { v: [0, -1, 1, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                vs: [{ with: 'heertong', when: '看到一件不对的事：heertong 说该说，buzaizhiwei 说那不在你的位置上' }, { with: 'jisuo', when: '别人来求你办事：jisuo 说别把你不要的推给他，buzaizhiwei 说先看这事归不归你' }, { with: 'huannan', when: '同伴出了事：huannan 说这时候你该在，buzaizhiwei 说那是他的位置不是你的' }],
                cf: [{ with: 'heertong', when: '看到不对的事，该不该开口' }] },

    /* 批次 13：daqiwancheng */
    daqiwancheng: { v: [0, 0, 0, -1, 2, 0, 0, 1, 0, 0, 0, 0, 0],
                vs: [{ with: 'bingguishensu', when: '时间很紧：bingguishensu 说快，daqiwancheng 说值钱的东西造得都慢' }, { with: 'sisheng', when: '时间有限：sisheng 说先想清楚意义，daqiwancheng 说值钱的东西本来就得慢慢磨' }, { with: 'xiannanzhihou', when: '要不要先做难的：xiannanzhihou 说先苦后甜，daqiwancheng 说别急，慢工才出活' }] },

    /* 批次 13：chengrenzhimei */
    chengrenzhimei: { v: [0, -1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
                vs: [{ with: 'baoyuan', when: '被人得罪：baoyuan 说按直回一次，chengrenzhimei 说帮他把事做成' }, { with: 'jisuo', when: '别人向你开口：jisuo 说别把你不想要的推给他，chengrenzhimei 说看他想要什么就给他' }, { with: 'heertong', when: '观点与人不同：heertong 说保留分歧也要相处，chengrenzhimei 说先帮他把事做成' }, { with: 'bianjie', when: '朋友来求你：bianjie 说保持距离别越界，chengrenzhimei 说能帮就帮一把' }, { with: 'daiji', when: '家人和朋友同时要你出力：daiji 说先家人，chengrenzhimei 说谁的事更紧就先帮谁' }, { with: 'huannan', when: '朋友落难：huannan 说留下来陪他，chengrenzhimei 说帮他把事情做成' }, { with: 'buzaizhiwei', when: '别人正在做一件事：buzaizhiwei 说别插手，chengrenzhimei 说能补一块就补一块' }] },

    /* 批次 13：xiannanzhihou */
    xiannanzhihou: { v: [0, 0, -1, 0, 2, 0, 0, 1, 0, 0, 0, 0, 0],
                vs: [{ with: 'jinshixingle', when: '有件好事可享：jinshixingle 说现在就享，xiannanzhihou 说先把难的做完' }],
                cf: [{ with: 'jinshixingle', when: '有好处时，先拿还是先做' }] }
,

    /* 批次 14：kuji */
    kuji: { v: [0, 1, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0],
                vs: [{ with: 'yinuo', when: '答应别人一件事：yinuo 说守信到底，kuji 说先看这件事该不该做' }] },

    /* 批次 14：sizhi */
    sizhi: { v: [0, 1, 2, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0],
                vs: [{ with: 'shendu', when: '没人看见时：shendu 说守住自己就够，sizhi 说假设有四双眼睛在看着你' }] },

    /* 批次 14：weisheng */
    weisheng: { v: [0, 1, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0],
                vs: [{ with: 'yinuo', when: '约定之后情况变了：yinuo 说守约，weisheng 说守到死也不改口' }] },

    /* 批次 14：qingshan */
    qingshan: { v: [0, 1, -1, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0],
                vs: [{ with: 'xiannanzhihou', when: '眼前有个大代价：xiannanzhihou 说先苦后甜扛过去，qingshan 说先保住本钱再图后计' }] },

    /* 批次 14：mingzhe */
    mingzhe: { v: [0, 1, 1, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0],
                vs: [{ with: 'yongqi', when: '局面明显不利：yongqi 说该上就上，mingzhe 说危邦不入' }],
                cf: [{ with: 'yongqi', when: '局面不利时，是上还是避' }, { with: 'bufucong', when: '面对一个不义的政权，抗命还是避开' }] }
,

    /* 批次 15：jiaoxue */
    jiaoxue: { v: [0, -1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0],
                vs: [{ with: 'zeshan', when: '学东西时：zeshan 说主动挑老师博采众长，jiaoxue 说讲给别人听才算学会' }, { with: 'xuesi', when: '读了很多还是不懂：xuesi 说停下来想，jiaoxue 说讲给别人听一遍就知道哪没懂' }] },

    /* 批次 15：duxue */
    duxue: { v: [-1, -2, 0, 0, 0, -1, 0, 0, 0, 0, 0, 0, 0],
                vs: [{ with: 'jinzhu', when: '身边没人可交流：jinzhu 说干脆换一批人，duxue 说至少得有个能抬杠的' }] },

    /* 批次 15：jingye */
    jingye: { v: [0, -1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0],
                vs: [{ with: 'heertong', when: '团队里有人不行：heertong 说当面说清楚，jingye 说先把自己那份做到挑不出毛病' }, { with: 'daiji', when: '家里与工作在抢时间：daiji 说先顾家人，jingye 说手上这件正事不能敷衍' }, { with: 'chengrenzhimei', when: '同事做事：chengrenzhimei 说去帮他把事做成，jingye 说先把你自己那份做到挑不出毛病' }] },

    /* 批次 15：shishiwu */
    shishiwu: { v: [0, 0, -1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                vs: [{ with: 'liuyibu', when: '规矩和形势冲突：liuyibu 说按情况通融，shishiwu 说先看清时势再决定站不站' }] },

    /* 批次 15：liangqin */
    liangqin: { v: [0, 1, -1, 0, 0, 0, 0, 0, 0, 0, -1, 0, 0],
                vs: [{ with: 'jinzhu', when: '环境不好：jinzhu 说人是被身边人塑造的，liangqin 说那就换一棵树' }] }
,

    /* 批次 16：bufucong */
    bufucong: { v: [0, 1, 2, 1, 0, 0, -2, 0, 2, 0, 0, 0, 0],
                vs: [{ with: 'buqu', when: '面对不义：buqu 说个人宁折不弯，bufucong 说指出这条规矩本身不合法' }],
                cf: [{ with: 'mingzhe', when: '面对一个不义的政权，抗命还是避开' }] },

    /* 批次 16：kuaile */
    kuaile: { v: [0, 0, 0, -1, -1, 0, 0, 1, 0, 1, 0, 0, 0],
                vs: [{ with: 'jinshixingle', when: '今晚就能高兴：jinshixingle 说就去享乐，kuaile 说先问这是不是只是「没有痛苦」' }] },

    /* 批次 16：jingguishen */
    jingguishen: { v: [0, 0, 0, -1, 0, 0, 1, 1, 0, 0, 0, 0, 0],
                vs: [{ with: 'mingzhe', when: '遇到说不清的力量：mingzhe 说避开危险，jingguishen 说保持敬意但不必亲近' }, { with: 'shenyan', when: '面对说不清的事：shenyan 说干脆少说，jingguishen 说可以敬着，只是别靠近' }, { with: 'zhinu', when: '遇到让人害怕的东西：zhinu 说先把火压住，jingguishen 说保持距离而非压住情绪' }] },

    /* 批次 16：weixue */
    weixue: { v: [0, 0, 0, -1, 0, -1, 0, 0, 0, 2, 0, 0, 0],
                vs: [{ with: 'jinxin', when: '面对一堆知识：jinxin 说逐条验证，weixue 说先减掉大半再说' }] },

    /* 批次 16：boxue */
    boxue: { v: [0, 0, 0, 0, 0, 2, 0, 1, 0, 0, 2, 0, 0],
                vs: [{ with: 'zhixing', when: '学了做不到：zhixing 说先去做，boxue 说五步是一整条链，缺哪步补哪步' }] }
,

    /* 批次 17：zhongkou */
    zhongkou: { v: [-1, 0, 0, 0, 0, 0, 0, -1, -2, 0, 0, 0, 0],
                vs: [{ with: 'qiuming', when: '在乎别人怎么看你：qiuming 说名声值得主动去挣，zhongkou 说舆论既然能杀人也就不必当真' }] },

    /* 批次 17：jinri */
    jinri: { v: [1, 0, 0, 0, -1, 0, 0, 0, 0, 0, 2, 0, 0],
                vs: [{ with: 'daqiwancheng', when: '事情还早：daqiwancheng 说慢慢磨，jinri 说今天必须了结一件' }] },

    /* 批次 17：ningming */
    ningming: { v: [1, 0, 0, 1, 0, 0, 0, -2, 0, 0, 0, 0, 0],
                vs: [{ with: 'bupingzemin', when: '有话要说：bupingzemin 说该把不平说出来，ningming 说宁可付出代价也不闭嘴' }, { with: 'lujian', when: '看到不公：ningming 说的是自己非说不可，lujian 说的是为别人挡一下' }] },

    /* 批次 17：shizhiji */
    shizhiji: { v: [1, 0, 1, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0],
                vs: [{ with: 'yinuo', when: '为何守信：yinuo 说承诺本身要守，shizhiji 说因为那个人懂我' }, { with: 'zhichi', when: '对错的来源：zhichi 说做了会抬不起头，shizhiji 说怕对不起那个懂我的人' }] }
,

    /* 批次 18：gupen */
    gupen: { v: [0, 0, -1, -1, 0, 0, 0, -2, 0, 0, 0, 0, 0],
                vs: [{ with: 'qiongtu', when: '亲人去世：qiongtu 说走到尽头就放声哭，gupen 说看穿了就不必哭' }] },

    /* 批次 18：lujian */
    lujian: { v: [0, -1, 0, 1, 0, 0, 0, -2, 0, 0, 0, 0, 0],
                vs: [{ with: 'heertong', when: '看到不对的事：heertong 说保持和气地表达不同，lujian 说直接出手' }, { with: 'bupingzemin', when: '看到不平：bupingzemin 说的是把不平说出来，lujian 说的是直接出手帮那个人' }, { with: 'mianzhe', when: '当众表达：mianzhe 是当面反对某个人的说法，lujian 是当场护住一个被欺负的人' }] },

    /* 批次 18：mianzi */
    mianzi: { v: [0, -1, 0, 0, 0, 0, 0, 1, -2, 0, 0, 0, 0],
                vs: [{ with: 'chengrenzhimei', when: '在众人面前：chengrenzhimei 想的是帮人成事，mianzi 想的是自己别丢脸' }, { with: 'zhichi', when: '羞耻感的来源：zhichi 说做了会抬不起头（内在），mianzi 说怕别人看不起（外在）' }] },

    /* 批次 18：mianzhe */
    mianzhe: { v: [0, 0, 1, 1, 0, 0, 0, -2, 0, 0, 0, 0, 0],
                vs: [{ with: 'ningming', when: '有意见要说：ningming 说的是自己非说不可，mianzhe 说的是当着当事人的面说' }, { with: 'bupingzemin', when: '有意见：bupingzemin 说的是把情绪说出来，mianzhe 说的是当着当事人的面把道理摆出来' }] },

    /* 批次 18：daxing */
    daxing: { v: [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0],
                vs: [{ with: 'jianji', when: '要不要临时改主意：jianji 说看准苗头就动，daxing 说为了大事可以不守小节' }] }
,

    /* 批次 19：xiaozi */
    xiaozi: { v: [0, -2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0],
                vs: [{ with: 'junzibuli', when: '要不要冒一个险：junzibuli 说自己判断这堵墙会不会倒，xiaozi 说先想谁在等你回去' }] },

    /* 批次 19：buji */
    buji: { v: [0, -1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
                vs: [{ with: 'chengrenzhimei', when: '被误解时：chengrenzhimei 说去帮对方把事做成，buji 说别人不了解你那件事根本不归你管' }, { with: 'jisuo', when: '怎么对待别人：jisuo 说别把你不要的推给他，buji 说先去了解他到底要什么' }, { with: 'huannan', when: '与朋友相处：huannan 说看他落难时在不在，buji 说平时就得真正了解这个人' }, { with: 'buzaizhiwei', when: '别人做错事：buzaizhiwei 说那不在你的位置上别管，buji 说先弄清他那件事的实情再说' }] },

    /* 批次 19：pofu */
    pofu: { v: [0, 0, 0, 0, -1, 0, -2, 0, 0, 0, -1, 0, 0],
                vs: [{ with: 'buruhuxue', when: '要不要冒险：buruhuxue 说想清楚对方不知道什么再动手，pofu 说先把自己的退路烧掉' }] },

    /* 批次 19：jianhao */
    jianhao: { v: [0, 0, 0, 0, -1, 0, 2, 0, 0, 0, 0, 0, 0],
                vs: [{ with: 'zhizu', when: '已经得到不少：zhizu 说知道够就够了，jianhao 说还要看什么时候该收手，晚了就收不住' }] },

    /* 批次 19：shoushuo */
    shoushuo: { v: [0, 0, 0, -1, 0, 0, 0, 0, 0, 0, 2, 0, 0],
                vs: [{ with: 'daqiwancheng', when: '要不要慢慢磨：daqiwancheng 说慢慢磨才出好东西，shoushuo 说干脆退出来，不在别人的场子里磨' }] }
  };

  root.QJY_COORD = { version: 'v2', map: COORD, axisOrder: ['A','B','C','D','E','F','G','H','I','J','K','L','M'] };
})(typeof window !== 'undefined' ? window : globalThis);
