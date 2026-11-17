/* 千江月 · 预置分类法
 *
 * 为什么要预置：让用户从零发明一套分类法，成本很高，多数人会放弃。
 * 先给两套成熟的、互不相同的切法，再让他改。
 *
 * 两套都必须**恰好覆盖 44 条主题各一次**——自检强制，漏一条或重一条即失败。
 */
(function (root) {
  'use strict';

  var SCHEMES = [
    {
      id: 'scene',
      name: '按场景',
      hint: '我遇到的是什么事',
      groups: [
        { name: '做事与决断', ids: ['yusu', 'jibu', 'zhuanzhu', 'xiguan', 'qianshi', 'xuesi', 'zhixing', 'qifa', 'buxiawen', 'jingwa'] },
        { name: '待人与相处', ids: ['jisuo', 'heertong', 'liuyibu', 'bianjie', 'jinzhu', 'daiji', 'yinuo', 'shenyan'] },
        { name: '对己与心性', ids: ['qiuzhuji', 'manzhao', 'zizhi', 'shendu', 'gudu', 'jiyi', 'sisheng', 'buqu', 'ziyou', 'xiwang', 'yongqi'] },
        { name: '世事与得失', ids: ['yuhuan', 'huoxi', 'zhizu', 'jinqian', 'yixue', 'fengzhong', 'dake', 'wuzhu', 'chengzhang', 'jinxin', 'shenti', 'ruoshui', 'baoyuan', 'zhinu', 'xishi'] }
      ]
    },
    {
      id: 'subject',
      name: '按学科',
      hint: '它属于哪一门',
      groups: [
        { name: '伦理与修养', ids: ['jisuo', 'yinuo', 'manzhao', 'shendu', 'zizhi', 'buqu', 'bianjie', 'liuyibu'] },
        { name: '认识与方法', ids: ['dake', 'jinxin', 'jingwa', 'xuesi', 'qifa', 'buxiawen', 'qianshi', 'jiyi'] },
        { name: '行动与做事', ids: ['zhixing', 'zhuanzhu', 'xiguan', 'jibu', 'yusu', 'yixue', 'xishi', 'fengzhong'] },
        { name: '人与关系', ids: ['heertong', 'jinzhu', 'daiji', 'gudu', 'shenyan', 'zhinu', 'jinqian'] },
        { name: '处境与选择', ids: ['yuhuan', 'huoxi', 'zhizu', 'ruoshui', 'baoyuan', 'qiuzhuji', 'xiwang', 'sisheng', 'ziyou', 'yongqi', 'chengzhang', 'wuzhu', 'shenti'] }
      ]
    }
  ];

  function byId(id) {
    for (var i = 0; i < SCHEMES.length; i++) if (SCHEMES[i].id === id) return SCHEMES[i];
    return null;
  }

  /* 把收藏按分类法分组：只保留组里有收藏的 */
  function arrange(favs, themes, schemeId) {
    var s = byId(schemeId);
    if (!s) return null;
    var themeOf = {};
    (themes || []).forEach(function (t) { themeOf[t.id] = t; });

    return s.groups.map(function (g) {
      var set = {};
      g.ids.forEach(function (id) { set[id] = 1; });
      var items = (favs || []).filter(function (f) { return set[f.t]; });
      return { name: g.name, items: items };
    }).filter(function (g) { return g.items.length; });
  }

  /* 一条主题属于该分类法下的哪一组 */
  function groupOf(themeId, schemeId) {
    var s = byId(schemeId);
    if (!s) return null;
    for (var i = 0; i < s.groups.length; i++) {
      if (s.groups[i].ids.indexOf(themeId) !== -1) return s.groups[i].name;
    }
    return null;
  }

  root.QJY_SCHEMES = { list: SCHEMES, byId: byId, arrange: arrange, groupOf: groupOf };
})(typeof window !== 'undefined' ? window : globalThis);
