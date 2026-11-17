/* ==========================================================================
   千江月 · 应用逻辑
   纯原生 JS，无依赖、无构建。直接打开 index.html 即可运行。
   ========================================================================== */
(function () {
  'use strict';

  var DATA = window.WISDOM || { themes: [], generic: { questions: [], actions: [] } };
  var THEMES = DATA.themes;
  var GENERIC = DATA.generic;
  var app = document.getElementById('app');

  var KEY = {
    mode: 'qjy.mode',
    acts: 'qjy.acts.',
    last: 'qjy.last',
    journal: 'qjy.journal',     // 勾选过的行动（用于下次回访）
    outcome: 'qjy.outcome'      // 回访结果 done / missed
  };
  var lastQuery = '';

  /* 主题之环：每条道理与左右相邻的两条相通 */
  var RING = window.QJY_RING || [];
  function neighbours(id) {
    var i = RING.indexOf(id);
    if (i === -1 || RING.length < 3) return [];
    var out = [];
    var a = RING[(i - 1 + RING.length) % RING.length];
    var b = RING[(i + 1) % RING.length];
    if (themeById(a)) out.push(themeById(a));
    if (themeById(b) && b !== a) out.push(themeById(b));
    return out;
  }

  /* ---------------- 基础工具 ---------------- */

  function lsGet(k, d) {
    try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); }
    catch (e) { return d; }
  }
  function lsSet(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 隐私模式忽略 */ }
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* 匹配引擎在 assets/match.js；此处只做绑定与预编译 */
  var M = window.QJY;
  M.prepare(THEMES);

  function match(rawQuery) { return M.match(rawQuery, THEMES); }

  /* ---------------- 渲染零件 ---------------- */

  function sectionHead(num, title, note) {
    return '' +
      '<div class="section-head">' +
        '<span class="section-num">' + num + '</span>' +
        '<h2 class="section-title">' + title + '</h2>' +
        '<span class="section-note">' + (note || '') + '</span>' +
      '</div>' +
      '<div class="section-rule"></div>';
  }

  function renderCanon(list) {
    return list.map(function (c, i) {
      var isCn = String(c.r).charAt(0) === '中';
      return '' +
        '<article class="canon reveal" data-cn="' + (isCn ? 1 : 0) + '" style="animation-delay:' + (i * 55) + 'ms">' +
          '<div class="canon-meta">' +
            '<span class="canon-region">' + esc(c.r) + '</span>' +
            '<span class="canon-kind">' + esc(c.k) + '</span>' +
          '</div>' +
          '<p class="canon-text">' + esc(c.t) + '</p>' +
          '<cite class="canon-source">' + esc(c.s) + '</cite>' +
          '<p class="canon-note">' + esc(c.n) + '</p>' +
        '</article>';
    }).join('');
  }

  function renderHistory(h) {
    var isModel = h.stance === 'model';
    return '' +
      '<article class="history reveal" style="animation-delay:60ms">' +
        '<header class="history-head">' +
          '<h3 class="history-title">' + esc(h.title) + '</h3>' +
          '<span class="history-era">' + esc(h.era) + '</span>' +
          '<span class="stance ' + (isModel ? 'model' : 'contrast') + '">' +
            (isModel ? '正面 · 做成的人' : '反面 · 失衡的人') +
          '</span>' +
        '</header>' +
        '<p class="history-body">' + esc(h.body) + '</p>' +
        '<p class="history-lesson"><b>镜中所见</b>　' + esc(h.lesson) + '</p>' +
      '</article>';
  }

  function renderQuestions(list) {
    return '<ol class="questions">' +
      list.map(function (q, i) {
        return '<li class="reveal" style="animation-delay:' + (i * 70) + 'ms">' + esc(q) + '</li>';
      }).join('') +
      '</ol>';
  }

  function renderActions(id, list) {
    var state = lsGet(KEY.acts + id, []);
    if (!Array.isArray(state)) state = [];

    var items = list.map(function (a, i) {
      var on = state.indexOf(i) !== -1;
      return '' +
        '<li>' +
          '<label class="act">' +
            '<input type="checkbox" data-i="' + i + '"' + (on ? ' checked' : '') + '>' +
            '<span>' + esc(a) + '</span>' +
          '</label>' +
        '</li>';
    }).join('');

    return '<ul class="actions-list" data-theme-id="' + esc(id) + '">' + items + '</ul>' +
      '<p class="act-progress" data-progress-for="' + esc(id) + '"></p>';
  }

  function progressText(total, done) {
    if (!done) return '尚未开始 —— 挑一件，今天做完。';
    if (done === total) return '全部完成 —— 这句话今天算是落地了。';
    return '已完成 ' + done + ' / ' + total;
  }

  /* ---------------- 视图：首页 ---------------- */

  var CHIPS = [
    '欲速则不达',
    '知道很多道理，仍然过不好',
    '太骄傲会出事',
    '己所不欲，勿施于人',
    '怎么才能记住教训',
    '没有人看见的时候'
  ];

  function renderHome() {
    app.innerHTML = '' +
      renderReturner() +
      '<section class="hero reveal">' +
        '<p class="hero-kicker">千 江 有 水 千 江 月</p>' +
        '<h1 class="hero-title">你想表达<span class="em">什么道理</span>？</h1>' +
        '<p class="hero-sub">同一个道理，孔子说过，老子说过，伊索说过，<br>' +
          '希腊的悲剧作家也说过。写下它，看看一千条江里映出的都是谁。</p>' +
        '<form class="ask" id="ask-form" autocomplete="off">' +
          '<div class="ask-box">' +
            '<textarea class="ask-input" id="ask-input" rows="2" maxlength="200" ' +
              'placeholder="例如：欲速则不达 / 不要急功近利 / 人不能太骄傲"></textarea>' +
            '<div class="ask-foot">' +
              '<span class="ask-hint">按 Enter 照见　·　Shift + Enter 换行</span>' +
              '<button type="submit" class="btn btn-primary">照 见</button>' +
            '</div>' +
          '</div>' +
        '</form>' +
        '<div class="examples">' +
          '<span class="examples-label">不 知 从 何 说 起 ？</span>' +
          CHIPS.map(function (c) {
            return '<button type="button" class="chip" data-chip="' + esc(c) + '">' + esc(c) + '</button>';
          }).join('') +
        '</div>' +
      '</section>' +

      '<section class="mirrors reveal" style="animation-delay:160ms">' +
        '<div class="mirror">' +
          '<div class="mirror-num">其 一</div>' +
          '<h3>同此一念</h3>' +
          '<p>典籍、语录、成语、俗语、寓言、史诗。来自不同语言与年代，却在说同一件事。</p>' +
        '</div>' +
        '<div class="mirror">' +
          '<div class="mirror-num">其 二</div>' +
          '<h3>以史为镜</h3>' +
          '<p>既是道理，必有人验证过它，也有人输给过它。看做成的人与失衡的人。</p>' +
        '</div>' +
        '<div class="mirror">' +
          '<div class="mirror-num">其 三</div>' +
          '<h3>照见与起行</h3>' +
          '<p>三个问题照见自己，几条最小行动落在今天。道理不落地，就只是漂亮话。</p>' +
        '</div>' +
      '</section>' +

      featuredStrip();

    var input = document.getElementById('ask-input');
    var form = document.getElementById('ask-form');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      submitQuery(input.value);
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submitQuery(input.value);
      }
    });

    Array.prototype.forEach.call(document.querySelectorAll('[data-chip]'), function (b) {
      b.addEventListener('click', function () {
        input.value = b.getAttribute('data-chip');
        submitQuery(input.value);
      });
    });

    setTimeout(function () { input.focus({ preventScroll: true }); }, 120);
    bindReturner();
  }

  /* 首页底部：三条入门主题 */
  var STARTERS = ['zhixing', 'manzhao', 'shendu'];

  function featuredStrip() {
    var picks = STARTERS.map(function (id) {
      for (var i = 0; i < THEMES.length; i++) if (THEMES[i].id === id) return THEMES[i];
      return null;
    }).filter(Boolean);

    if (!picks.length) return '';

    return '' +
      '<section class="featured reveal" style="animation-delay:240ms">' +
        '<h2 class="featured-title">不 妨 从 这 三 条 看 起</h2>' +
        '<div class="featured-grid">' +
          picks.map(function (t) {
            return '<a class="card" href="#/t/' + encodeURIComponent(t.id) + '">' +
              '<h3 class="card-name">' + esc(t.name) + '</h3>' +
              '<p class="card-gist">' + esc(t.gist) + '</p>' +
              '<div class="card-meta">' +
                '<span>' + t.canon.length + ' 条引证</span>' +
                '<span>中国 ' + t._cn + ' · 域外 ' + (t.canon.length - t._cn) + '</span>' +
              '</div>' +
            '</a>';
          }).join('') +
        '</div>' +
      '</section>';
  }

  function submitQuery(raw) {
    var val = String(raw || '').trim();
    if (!val) {
      var box = document.querySelector('.ask-box');
      if (box) {
        box.animate(
          [{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' },
           { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }],
          { duration: 260, easing: 'ease-in-out' }
        );
      }
      return;
    }

    var r = match(val);
    lastQuery = val;
    lsSet(KEY.last, val);

    if (r && r.hit) {
      navigate('#/t/' + encodeURIComponent(r.hit.id));
    } else {
      navigate('#/miss/' + encodeURIComponent(val));
    }
  }

  /* ---------------- 视图：主题详情 ---------------- */

  var NUM = ['壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌'];

  /* 海报：美术由 assets/poster.js 依作品名生成，非官方剧照 */
  function renderPoster(c, i) {
    var p = c.poster;
    var med = p.med === 'film' ? '电　影' : p.med === 'stage' ? '戏　剧' : '小　说';
    return '' +
      '<figure class="poster-fig reveal" style="animation-delay:' + (i * 70) + 'ms">' +
        '<div class="poster">' +
          '<div class="poster-art" aria-hidden="true">' +
            window.QJY_POSTER.art(p.title + '|' + p.year, p.med) +
          '</div>' +
          '<div class="poster-body">' +
            '<div class="poster-head">' +
              '<span class="poster-med">' + med + '</span>' +
              '<span class="poster-year">' + esc(String(p.year)) + '</span>' +
            '</div>' +
            '<div class="poster-core">' +
              '<h3 class="poster-title">' + esc(p.title) + '</h3>' +
              (p.en ? '<p class="poster-en">' + esc(p.en) + '</p>' : '') +
            '</div>' +
            '<div class="poster-foot">' +
              '<p class="poster-quote">' + esc(c.t) + '</p>' +
              '<p class="poster-by">' + esc(p.by) + '</p>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<figcaption class="poster-label">' +
          '<span class="poster-src">' + esc(c.s) + '</span>' +
          '<span class="poster-note">' + esc(c.n) + '</span>' +
        '</figcaption>' +
      '</figure>';
  }

  function mediaSection(list, num, delay) {
    if (!list.length) return '';
    return '' +
      '<section class="section cinema reveal" style="animation-delay:' + delay + 'ms">' +
        sectionHead(num, '文与影', '小说 · 戏剧 · 电影') +
        '<div class="posters">' + list.map(renderPoster).join('') + '</div>' +
        '<p class="posters-note">海报依作品名程序生成，不是官方剧照——剧照有版权，这里用几何与配色替它说话。' +
          '同一部作品永远得到同一张。</p>' +
      '</section>';
  }

  function renderTheme(id) {
    var t = null;
    for (var i = 0; i < THEMES.length; i++) if (THEMES[i].id === id) { t = THEMES[i]; break; }

    if (!t) {
      app.innerHTML = '<section class="result"><p class="notice">没有找到这个主题。<a href="#/all">看看全部主题</a></p></section>';
      return;
    }

    var q = lastQuery || '';

    /* canon 分两路：带 poster 的去「文与影」，其余留在「同此一念」 */
    var media = t.canon.filter(function (c) { return c.poster; });
    var classic = t.canon.filter(function (c) { return !c.poster; });

    var k = 0;
    var nClassic = NUM[k++];
    var nMedia = media.length ? NUM[k++] : '';
    var nHistory = NUM[k++];
    var nQuestions = NUM[k++];
    var nActions = NUM[k++];
    var nRelated = NUM[k++];

    app.innerHTML = '' +
      '<div class="result">' +
        '<p class="crumb"><a href="#/">← 另说一理</a>　<span>/</span>　<a href="#/all">万理一览</a></p>' +

        '<header class="result-head reveal">' +
          (q ? '<p class="result-input">' + esc(q) + '</p>' : '') +
          '<h1 class="result-title">' + esc(t.name) + '</h1>' +
          '<p class="result-gist">' + esc(t.gist) + '</p>' +
        '</header>' +

        '<section class="section reveal" style="animation-delay:80ms">' +
          sectionHead(nClassic, '同此一念', '跨越 ' + classic.length + ' 种表达') +
          '<div class="canon-list">' + renderCanon(classic) + '</div>' +
        '</section>' +

        mediaSection(media, nMedia, 120) +

        '<section class="section reveal" style="animation-delay:160ms">' +
          sectionHead(nHistory, '以史为镜', '有人验证过它') +
          renderHistory(t.history) +
        '</section>' +

        '<section class="section reveal" style="animation-delay:200ms">' +
          sectionHead(nQuestions, '照见自己', '先别急着回答') +
          renderQuestions(t.questions) +
        '</section>' +

        '<section class="section reveal" style="animation-delay:240ms">' +
          sectionHead(nActions, '起而行之', '勾一下，就算开始') +
          renderActions(t.id, t.actions) +
        '</section>' +

        relatedSection(t, nRelated) +

        '<div class="toolbar">' +
          '<button type="button" class="btn btn-ghost" id="btn-copy">复制这一段</button>' +
          '<button type="button" class="btn btn-ghost" id="btn-share">复制分享链接</button>' +
          '<button type="button" class="btn btn-ghost" id="btn-md">下载 Markdown</button>' +
          '<button type="button" class="btn btn-ghost" id="btn-print">打印一页</button>' +
          '<button type="button" class="btn btn-ghost" id="btn-rand2">再取一理</button>' +
        '</div>' +
      '</div>';

    bindActions(t.id, t.actions);
    updateProgress(t.id, t.actions);

    document.getElementById('btn-copy').addEventListener('click', function () {
      copyText(buildShareText(t, q));
    });
    document.getElementById('btn-share').addEventListener('click', function () {
      copyText(location.origin + location.pathname + '#/t/' + encodeURIComponent(t.id));
    });
    document.getElementById('btn-md').addEventListener('click', function () {
      downloadText(t.name + '.md', buildShareText(t, q).replace(/^/gm, ''));
      showTip('已下载 Markdown');
    });
    document.getElementById('btn-print').addEventListener('click', function () {
      window.print();
    });
    document.getElementById('btn-rand2').addEventListener('click', goRandom);
  }

  /* 相通的另两条：由主题之环推出 */
  function relatedSection(t, num) {
    var near = neighbours(t.id);
    if (!near.length) return '';

    return '' +
      '<section class="section related reveal" style="animation-delay:280ms">' +
        sectionHead(num || '陆', '相通的另两条', '三十六理成环') +
        '<div class="related-grid">' +
          near.map(function (x) {
            return '<a class="related-card" href="#/t/' + encodeURIComponent(x.id) + '">' +
              '<span class="related-name">' + esc(x.name) + '</span>' +
              '<span class="related-gist">' + esc(x.gist) + '</span>' +
            '</a>';
          }).join('') +
        '</div>' +
      '</section>';
  }

  function downloadText(filename, text) {
    try {
      var blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    } catch (e) {
      copyText(text);
    }
  }

  /* ---------------- 视图：未收录 ---------------- */

  function themeById(id) {
    for (var i = 0; i < THEMES.length; i++) if (THEMES[i].id === id) return THEMES[i];
    return null;
  }

  function renderMiss(rawVal) {
    var q = decodeURIComponent(rawVal || '');
    var r = match(q);

    /* 只有真的算出分来，才配叫「相近」。全部 0 分时排名毫无意义，
     * 那只是数组顺序——宁可老实说「不妨先看这几条」，也不要假装相关。 */
    var scored = (r ? r.ranked : []).filter(function (x) { return x.score > 0; });
    var near = scored.slice(0, 3);

    if (near.length < 3) {
      STARTERS.forEach(function (id) {
        if (near.length >= 3) return;
        var t = themeById(id);
        if (!t) return;
        for (var i = 0; i < near.length; i++) if (near[i].theme.id === id) return;
        near.push({ theme: t, score: 0 });
      });
    }

    var hasSignal = scored.length > 0;

    app.innerHTML = '' +
      '<div class="result">' +
        '<p class="crumb"><a href="#/">← 另说一理</a></p>' +
        '<header class="result-head reveal">' +
          '<p class="result-input">' + esc(q) + '</p>' +
          '<h1 class="result-title">这一理，尚未收录</h1>' +
          '<p class="result-gist">语料库现在收着 ' + THEMES.length + ' 条主题。' +
            '不过——道理往往不是找不到，是还没说准。<br>' +
            '你可以换个说法再试，或者先从下面这几条里挑一条看。</p>' +
        '</header>' +

        '<div class="nearest">' +
          '<h3>' + (hasSignal ? '可 能 相 近 的 三 条' : '不 妨 从 这 几 条 看 起') + '</h3>' +
          '<div class="nearest-list">' +
            near.map(function (x) {
              return '<a class="nearest-item reveal" href="#/t/' + encodeURIComponent(x.theme.id) + '">' +
                '<span class="nearest-name">' + esc(x.theme.name) + '</span>' +
                '<span class="nearest-gist">' + esc(x.theme.gist) + '</span>' +
              '</a>';
            }).join('') +
          '</div>' +
        '</div>' +

        '<section class="section reveal" style="animation-delay:140ms">' +
          sectionHead('壹', '通用三问', '任何道理都适用') +
          renderQuestions(GENERIC.questions) +
        '</section>' +

        '<section class="section reveal" style="animation-delay:180ms">' +
          sectionHead('贰', '通用起行', '不求多，只求做') +
          renderActions('__generic__', GENERIC.actions) +
        '</section>' +

        '<div class="notice reveal">' +
          '<b>关于收录</b>　这个语料库是人工编纂的，边写边核出处，' +
          '因此只收有确切来源的句子。不编造引文，比多收几条更重要。' +
        '</div>' +

        '<div class="toolbar">' +
          '<button type="button" class="btn btn-ghost" id="btn-all3">万理一览</button>' +
          '<button type="button" class="btn btn-ghost" id="btn-rand3">随手一理</button>' +
        '</div>' +
      '</div>';

    bindActions('__generic__', GENERIC.actions);
    updateProgress('__generic__', GENERIC.actions);
    document.getElementById('btn-all3').addEventListener('click', function () { navigate('#/all'); });
    document.getElementById('btn-rand3').addEventListener('click', goRandom);
  }

  /* ---------------- 视图：万理一览 ---------------- */

  function renderAll() {
    app.innerHTML = '' +
      '<header class="all-head reveal">' +
        '<h1>万 理 一 览</h1>' +
        '<p>共 ' + THEMES.length + ' 条主题 · ' +
          THEMES.reduce(function (n, t) { return n + t.canon.length; }, 0) + ' 条引证 · ' +
          THEMES.length + ' 则史案</p>' +
      '</header>' +
      '<div class="grid">' +
        THEMES.map(function (t, i) {
          return '<a class="card reveal" href="#/t/' + encodeURIComponent(t.id) + '" ' +
                  'style="animation-delay:' + (i * 35) + 'ms">' +
            '<h2 class="card-name">' + esc(t.name) + '</h2>' +
            '<p class="card-gist">' + esc(t.gist) + '</p>' +
            '<div class="card-meta">' +
              '<span>' + t.canon.length + ' 条引证</span>' +
              '<span>中国 ' + t._cn + ' · 域外 ' + (t.canon.length - t._cn) + '</span>' +
            '</div>' +
          '</a>';
        }).join('') +
      '</div>';
  }

  /* ---------------- 行为绑定 ---------------- */

  function bindActions(id, list) {
    var wrap = document.querySelector('.actions-list[data-theme-id="' + id + '"]');
    if (!wrap) return;
    wrap.addEventListener('change', function (e) {
      var box = e.target;
      if (!box || box.type !== 'checkbox') return;
      var idx = parseInt(box.getAttribute('data-i'), 10);
      var state = lsGet(KEY.acts + id, []);
      if (!Array.isArray(state)) state = [];
      var at = state.indexOf(idx);
      if (box.checked && at === -1) state.push(idx);
      if (!box.checked && at !== -1) state.splice(at, 1);
      lsSet(KEY.acts + id, state);
      updateProgress(id, list);
      journalToggle(id, idx, list[idx], box.checked);
    });
  }

  /* ---------- 行动回访 ----------
   * 勾选即记账，下次打开时问一句「做到了吗」。
   * 全部存在本地，不上传；记满 60 条自动裁掉最旧的。 */
  function journalRead() {
    var j = lsGet(KEY.journal, []);
    return Array.isArray(j) ? j : [];
  }
  function journalWrite(list) {
    lsSet(KEY.journal, list.slice(-60));
  }
  function journalToggle(themeId, idx, text, on) {
    var j = journalRead();
    var key = themeId + ':' + idx;
    var at = -1;
    for (var i = 0; i < j.length; i++) if (j[i].k === key) { at = i; break; }
    if (on && at === -1) {
      j.push({ k: key, t: themeId, i: idx, text: String(text || ''), at: new Date().toISOString() });
    } else if (!on && at !== -1) {
      j.splice(at, 1);
    }
    journalWrite(j);
  }
  function outcomeRead() {
    var o = lsGet(KEY.outcome, {});
    return (o && typeof o === 'object') ? o : {};
  }

  /* 挑出「上次留的、还没回访的、且不是今天的」三条 */
  function pendingActions() {
    var today = new Date().toISOString().slice(0, 10);
    var o = outcomeRead();
    return journalRead().filter(function (e) {
      if (o[e.k]) return false;                      // 已回访
      if ((e.at || '').slice(0, 10) === today) return false; // 今天刚勾的不催
      return true;
    }).slice(-3).reverse();
  }

  function renderReturner() {
    var pending = pendingActions();
    if (!pending.length) return '';

    return '' +
      '<section class="returner reveal" style="animation-delay:120ms">' +
        '<p class="returner-kicker">上 次 你 给 自 己 留 了 几 件 事</p>' +
        '<ul class="returner-list">' +
          pending.map(function (e) {
            var day = (e.at || '').slice(5, 10).replace('-', '/');
            return '<li class="returner-item" data-k="' + esc(e.k) + '">' +
              '<span class="returner-text">' + esc(e.text) + '</span>' +
              '<span class="returner-day">' + esc(day) + '</span>' +
              '<span class="returner-btns">' +
                '<button type="button" class="mini" data-out="done">做到了</button>' +
                '<button type="button" class="mini" data-out="missed">没做到</button>' +
              '</span>' +
            '</li>';
          }).join('') +
        '</ul>' +
        '<p class="returner-foot">回答只记在这台设备的浏览器里。没做到也没关系，记下来就是一次真实的复盘。</p>' +
      '</section>';
  }

  function bindReturner() {
    var box = document.querySelector('.returner');
    if (!box) return;
    box.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('[data-out]') : null;
      if (!btn) return;
      var li = btn.closest('.returner-item');
      if (!li) return;
      var k = li.getAttribute('data-k');
      var o = outcomeRead();
      o[k] = { r: btn.getAttribute('data-out'), at: new Date().toISOString() };
      lsSet(KEY.outcome, o);
      li.classList.add('answered');
      btn.parentNode.innerHTML = '<span class="returner-thanks">' +
        (btn.getAttribute('data-out') === 'done' ? '记下了 —— 这件事算落地了。' : '记下了 —— 下次换个更小的做法。') +
        '</span>';
      showTip('已记录');
    });
  }

  function updateProgress(id, list) {
    var el = document.querySelector('[data-progress-for="' + id + '"]');
    if (!el) return;
    var state = lsGet(KEY.acts + id, []);
    var done = Array.isArray(state) ? state.length : 0;
    el.textContent = progressText(list.length, done);
  }

  function buildShareText(t, q) {
    var lines = [];
    if (q) lines.push('「' + q + '」', '');
    lines.push('【' + t.name + '】' + t.gist, '');
    lines.push('一、同此一念 · 千江映月');
    t.canon.forEach(function (c) {
      lines.push('· ' + c.t);
      lines.push('  —— ' + c.s + '（' + c.r + '·' + c.k + '）');
    });
    lines.push('', '二、以史为镜 · ' + t.history.title + '（' + t.history.era + '）');
    lines.push(t.history.body);
    lines.push('镜中所见：' + t.history.lesson);
    lines.push('', '三、照见自己');
    t.questions.forEach(function (x, i) { lines.push((i + 1) + '. ' + x); });
    lines.push('', '四、起而行之');
    t.actions.forEach(function (x) { lines.push('□ ' + x); });
    lines.push('', '—— 千江月 · 一句道理，千江映月');
    return lines.join('\n');
  }

  function copyText(text) {
    function done() { showTip('已复制'); }
    function fail() { showTip('复制失败，请手动选取'); }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, function () { legacyCopy(text) ? done() : fail(); });
      return;
    }
    legacyCopy(text) ? done() : fail();
  }

  function legacyCopy(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (e) { return false; }
  }

  var tipTimer = null;
  function showTip(msg) {
    var tip = document.querySelector('.copied-tip');
    if (!tip) {
      tip = document.createElement('div');
      tip.className = 'copied-tip';
      document.body.appendChild(tip);
    }
    tip.textContent = msg;
    tip.classList.add('show');
    clearTimeout(tipTimer);
    tipTimer = setTimeout(function () { tip.classList.remove('show'); }, 1900);
  }

  function goRandom() {
    var t = THEMES[Math.floor(Math.random() * THEMES.length)];
    lastQuery = '';
    lsSet(KEY.last, '');
    navigate('#/t/' + encodeURIComponent(t.id));
  }

  /* ---------------- 明暗 ---------------- */

  function initMode() {
    var m = lsGet(KEY.mode, null);
    if (m === 'dark' || m === 'light') document.documentElement.setAttribute('data-theme', m);
  }
  function toggleMode() {
    var cur = document.documentElement.getAttribute('data-theme');
    if (!cur) cur = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    var next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    lsSet(KEY.mode, next);
  }

  /* ---------------- 路由 ---------------- */

  function navigate(hash) {
    if (location.hash === hash) route();
    else location.hash = hash;
  }

  function route() {
    var h = location.hash.replace(/^#/, '');
    if (!h || h === '/') {
      renderHome();
    } else if (h === '/all') {
      renderAll();
    } else if (h.indexOf('/t/') === 0) {
      renderTheme(decodeURIComponent(h.slice(3)));
    } else if (h.indexOf('/miss/') === 0) {
      renderMiss(h.slice(6));
    } else {
      renderHome();
    }
    window.scrollTo(0, 0);
  }

  /* ---------------- 启动 ---------------- */

  initMode();
  lastQuery = lsGet(KEY.last, '') || '';

  /* 页脚印构建指纹，方便一眼判断自己看的是不是缓存里的旧版 */
  (function stampFooter() {
    var build = document.documentElement.getAttribute('data-build');
    var el = document.getElementById('build-id');
    if (el && build) el.textContent = build;
  })();

  document.getElementById('btn-random').addEventListener('click', goRandom);
  document.getElementById('btn-all').addEventListener('click', function () { navigate('#/all'); });
  document.getElementById('btn-mode').addEventListener('click', toggleMode);

  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && !/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) {
      var inp = document.getElementById('ask-input');
      if (inp) { e.preventDefault(); inp.focus(); }
    }
  });

  /* 点主题卡片时不沿用上一次的搜索词，避免详情页显示错位的「你的原话」 */
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('.card') : null;
    if (a) { lastQuery = ''; lsSet(KEY.last, ''); }
  });

  window.addEventListener('hashchange', route);
  route();
})();
