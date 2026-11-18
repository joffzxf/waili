/* 千江月 · 哲学门类
 *
 * 轴描述「立场」，门类描述「题材」——这是两件事。
 * 两条道理可以在轴上完全同向，却分属伦理与认识论；
 * 反过来，同一门里的两条也可能在轴上正相反（这正是冲突的来源）。
 *
 * 六门取中西共通的切法，每门给一组中外对应的传统名目，
 * 说明这不是拿西学分中国书，而是两边本来就在问同一批问题。
 */
(function (root) {
  'use strict';

  var FIELDS = [
    {
      id: 'ethics',
      name: '伦理与德性',
      en: 'Ethics',
      ask: '该怎么做人，什么算对',
      cn: '仁义 · 忠恕 · 义利之辨',
      west: '德性伦理 · 义务论 · 后果论',
      note: '这一门问的是「我应该怎样」，而不是「怎样有效」。'
    },
    {
      id: 'episteme',
      name: '认识与求知',
      en: 'Epistemology',
      ask: '怎么知道，怎么学',
      cn: '格物致知 · 学思之辨 · 知言',
      west: '知识论 · 方法论 · 怀疑论',
      note: '这一门问的是「我凭什么相信」，包括凭什么相信自己。'
    },
    {
      id: 'self',
      name: '心性与修养',
      en: 'Self-cultivation',
      ask: '怎么管自己，情绪与欲望',
      cn: '慎独 · 克己 · 主敬 · 工夫',
      west: '斯多葛练习 · 意志与自制',
      note: '这一门问的是「我拿自己怎么办」，不涉及别人怎么看我。'
    },
    {
      id: 'action',
      name: '行动与成败',
      en: 'Philosophy of action',
      ask: '怎么做事，怎么决断',
      cn: '知行 · 权变 · 见几 · 谋与断',
      west: '实践智慧 phronesis · 决断论',
      note: '这一门问的是「现在做什么」，重点在时机与代价。'
    },
    {
      id: 'politics',
      name: '处世与政治',
      en: 'Political philosophy',
      ask: '怎么与人、与权力相处',
      cn: '和而不同 · 出处进退 · 治乱',
      west: '正义 · 秩序 · 公民不服从',
      note: '这一门问的是「我和他人、和权力之间那条线在哪」。'
    },
    {
      id: 'fate',
      name: '生死与天命',
      en: 'Existence and fate',
      ask: '怎么面对限度与结局',
      cn: '知命 · 安时处顺 · 生死观',
      west: '存在哲学 · 命运与自由',
      note: '这一门问的是「有些事我改不了，然后呢」。'
    }
  ];

  /* 一条道理只归一門：按它主要在处理哪一类问题 */
  var MAP = {
    /* 伦理与德性（27） */
    jisuo: 'ethics', yinuo: 'ethics', baoyuan: 'ethics', yongqi: 'ethics',
    bianjie: 'ethics', daiji: 'ethics', jinqian: 'ethics', qiuming: 'ethics',
    zhichi: 'ethics', jiyulida: 'ethics', zhiqibuke: 'ethics', bushijie: 'ethics',
    qinyudai: 'ethics', huannan: 'ethics', chengrenzhimei: 'ethics',
    xiannanzhihou: 'ethics', sizhi: 'ethics', weisheng: 'ethics',
    jingye: 'ethics', kuaile: 'ethics', ningming: 'ethics', shizhiji: 'ethics',
    lujian: 'ethics', xiaozi: 'ethics', xiangyuan: 'ethics', zhongnan: 'ethics',
    kuangzhe: 'ethics',

    /* 认识与求知（21） */
    zhixing: 'episteme', qianshi: 'episteme', jinxin: 'episteme', jingwa: 'episteme',
    xuesi: 'episteme', buxiawen: 'episteme', qifa: 'episteme', jiyi: 'episteme',
    dake: 'episteme', fengzhong: 'episteme', shuerbuzuo: 'episteme',
    shiyandaojun: 'episteme', zeshan: 'episteme', dadan: 'episteme',
    jiaoxue: 'episteme', duxue: 'episteme', weixue: 'episteme', boxue: 'episteme',
    buji: 'episteme', zhenyi: 'episteme', baowen: 'episteme',

    /* 心性与修养（21） */
    manzhao: 'self', yuhuan: 'self', zizhi: 'self', shendu: 'self', zhizu: 'self',
    shenyan: 'self', zhinu: 'self', qiuzhuji: 'self', zhuanzhu: 'self',
    xiguan: 'self', gudu: 'self', wuzhu: 'self', chengzhang: 'self',
    bupingzemin: 'self', buyiwuxi: 'self', shijufei: 'self', kuji: 'self',
    mianzi: 'self', shoushuo: 'self', congxin: 'self', jingyiyou: 'self',

    /* 行动与成败（23） */
    yusu: 'action', jibu: 'action', yixue: 'action', shenti: 'action',
    qufahushang: 'action', bingguishensu: 'action', jiangzaiwai: 'action',
    gongchengshentui: 'action', lianghaixiangquan: 'action', buruhuxue: 'action',
    xiaoburen: 'action', jianji: 'action', junzibuli: 'action',
    daqiwancheng: 'action', qingshan: 'action', jinri: 'action', daxing: 'action',
    pofu: 'action', jianhao: 'action', dangduan: 'action', wukebuke: 'action',
    qutuxixin: 'action', zhinantui: 'action',

    /* 处世与政治（15） */
    ruoshui: 'politics', liuyibu: 'politics', heertong: 'politics',
    jinzhu: 'politics', ziyou: 'politics', duliqingshen: 'politics',
    qiongzedushan: 'politics', buzaizhiwei: 'politics', mingzhe: 'politics',
    shishiwu: 'politics', liangqin: 'politics', bufucong: 'politics',
    zhongkou: 'politics', mianzhe: 'politics', zongfa: 'politics',

    /* 生死与天命（12） */
    huoxi: 'fate', xishi: 'fate', sisheng: 'fate', xiwang: 'fate', buqu: 'fate',
    jinshixingle: 'fate', suiyueran: 'fate', gaiguan: 'fate', ziqiuduofu: 'fate',
    qiongtu: 'fate', jingguishen: 'fate', gupen: 'fate'
  };

  function byId(id) {
    for (var i = 0; i < FIELDS.length; i++) if (FIELDS[i].id === id) return FIELDS[i];
    return null;
  }

  root.QJY_FIELDS = { list: FIELDS, map: MAP, byId: byId };
})(typeof window !== 'undefined' ? window : globalThis);
