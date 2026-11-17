/* 千江月 · 册子（收藏）
 *
 * 纯逻辑，不碰 DOM——这样可以在 Node 里被自检覆盖。
 * 一条收藏的身份是 `主题id + 在原 canon 数组里的下标`，
 * 不用引文文字做键：文字可能被修订，下标不会。
 */
(function (root) {
  'use strict';

  function norm(list) {
    if (!Array.isArray(list)) return [];
    return list.filter(function (x) {
      return x && typeof x.t === 'string' && x.t && typeof x.i === 'number' && x.i >= 0;
    });
  }

  function key(themeId, idx) { return themeId + '#' + idx; }

  function has(list, themeId, idx) {
    var k = key(themeId, idx);
    return norm(list).some(function (x) { return key(x.t, x.i) === k; });
  }

  /* 返回新数组，不改入参 */
  function toggle(list, themeId, idx, extra) {
    var cur = norm(list).slice();
    var k = key(themeId, idx);
    var at = -1;
    for (var i = 0; i < cur.length; i++) if (key(cur[i].t, cur[i].i) === k) { at = i; break; }
    if (at !== -1) { cur.splice(at, 1); return cur; }
    var item = { t: themeId, i: idx, at: new Date().toISOString() };
    if (extra) {
      if (extra.text) item.x = String(extra.text).slice(0, 160);
      if (extra.src) item.s = String(extra.src).slice(0, 120);
    }
    cur.push(item);
    return cur;
  }

  function remove(list, themeId, idx) {
    var k = key(themeId, idx);
    return norm(list).filter(function (x) { return key(x.t, x.i) !== k; });
  }

  function serialize(list) {
    return JSON.stringify({ v: 1, app: '千江月', items: norm(list) }, null, 2);
  }

  function deserialize(str) {
    var o;
    try { o = JSON.parse(String(str || '')); } catch (e) { return []; }
    var items = o && Array.isArray(o.items) ? o.items : (Array.isArray(o) ? o : []);
    /* 合并去重，保持顺序 */
    var out = [], seen = {};
    norm(items).forEach(function (x) {
      var k = key(x.t, x.i);
      if (seen[k]) return;
      seen[k] = 1;
      out.push(x);
    });
    return out;
  }

  /* 按主题分组，供册子页渲染。themes 用于取标题与顺序。 */
  function group(list, themes) {
    var byId = {};
    (themes || []).forEach(function (t) { byId[t.id] = t; });
    var order = [], buckets = {};
    norm(list).forEach(function (x) {
      if (!buckets[x.t]) { buckets[x.t] = []; order.push(x.t); }
      buckets[x.t].push(x);
    });
    return order.map(function (id) {
      return { theme: byId[id] || { id: id, name: id }, items: buckets[id] };
    });
  }

  root.QJY_SHELF = {
    key: key, has: has, toggle: toggle, remove: remove,
    serialize: serialize, deserialize: deserialize, group: group
  };
})(typeof window !== 'undefined' ? window : globalThis);
