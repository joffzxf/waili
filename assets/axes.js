/* 千江月 · 轴表 v1（冻结）
 *
 * 一条道理 = 各轴上的一个坐标。轴只负责**描述**，不负责判定两条道理是否独立
 * ——独立靠 coordinates.js 里的 vs 字段（一个能区分二者的具体情境）。
 *
 * 取值：-2 … +2 的整数。**0 表示「这条道理与这根轴无关」**，不是「居中」。
 * 大量道理只涉及两三根轴，填 0 是常态。
 *
 * 冻结规则（改轴必须走迁移）：
 *   新增轴 → 版本号 +1 → 所有旧条目补 0 并标记未评估 → 跑校验器
 *   → 只人工处理「仍然无法区分」的清单，不重读全部条目。
 */
(function (root) {
  'use strict';

  var AXES = [
    { id: 'A', key: 'attr',   name: '归因', neg: '境（顺势）', pos: '人（事在人为）',
      hint: '对已经发生的结果，解释权归谁' },
    { id: 'B', key: 'rel',    name: '关系', neg: '关系优先',   pos: '个体自主',
      hint: '判断事情时，谁的利益与意愿排在前面' },
    { id: 'C', key: 'norm',   name: '规范', neg: '后果优先',   pos: '原则优先',
      hint: '凭什么判对错：看结果，还是看有没有越线' },
    { id: 'D', key: 'stance', name: '姿态', neg: '出世',       pos: '入世',
      hint: '对身外之事：介入，还是退开' },
    { id: 'E', key: 'time',   name: '时间', neg: '当下兑现',   pos: '长远积累',
      hint: '偏好哪个时间段兑现' },
    { id: 'F', key: 'epist',  name: '认识', neg: '承袭权威',   pos: '亲自验证',
      hint: '凭什么相信：权威／传统，还是自己验过' },
    { id: 'G', key: 'risk',   name: '风险', neg: '冒险求变',   pos: '避险保本',
      hint: '对**尚未发生**的机会与损失的态度（与归因不同）' },
    { id: 'H', key: 'affect', name: '情绪', neg: '外放',       pos: '克制',
      hint: '情绪该显出多少' },
    { id: 'I', key: 'worth',  name: '认可', neg: '外求',       pos: '内定',
      hint: '评价标准从哪里来：他人／专家／书本，还是自己（与关系不同）' },
    { id: 'J', key: 'desire', name: '欲望', neg: '进取扩张',   pos: '节制知足',
      hint: '要多少才算够' },
    { id: 'K', key: 'exec',   name: '执行', neg: '临机权变',   pos: '按计划持守',
      hint: '定好的事：照做到底，还是见机调整（原来想用「知行」，但它只够解释一条道理）' },
    /* —— v2 新增：v1 首轮审查发现 8 对条目分不开，全部挤在「长远＋执行」这一角 —— */
    { id: 'L', key: 'tempo',  name: '节奏', neg: '求快',       pos: '求稳',
      hint: 'v2 新增：v1 里「欲速则不达」与「一寸光阴」同坐标，靠它分开' },
    { id: 'M', key: 'span',   name: '范围', neg: '聚焦单点',   pos: '广泛累积',
      hint: 'v2 新增：v1 里「不积跬步」与「用心一也」同坐标，靠它分开' }
  ];

  var VERSION = 'v2';

  function byId(id) {
    for (var i = 0; i < AXES.length; i++) if (AXES[i].id === id) return AXES[i];
    return null;
  }
  function index(id) {
    for (var i = 0; i < AXES.length; i++) if (AXES[i].id === id) return i;
    return -1;
  }

  root.QJY_AXES = { version: VERSION, list: AXES, byId: byId, index: index, size: AXES.length };
})(typeof window !== 'undefined' ? window : globalThis);
