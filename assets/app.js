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

  var KEY = { mode: 'qjy.mode', acts: 'qjy.acts.', last: 'qjy.last' };
  var lastQuery = '';

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

  function renderCanon(t) {
    return t.canon.map(function (c, i) {
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

  function renderTheme(id) {
    var t = null;
    for (var i = 0; i < THEMES.length; i++) if (THEMES[i].id === id) { t = THEMES[i]; break; }

    if (!t) {
      app.innerHTML = '<section class="result"><p class="notice">没有找到这个主题。<a href="#/all">看看全部主题</a></p></section>';
      return;
    }

    var q = lastQuery || '';
    app.innerHTML = '' +
      '<div class="result">' +
        '<p class="crumb"><a href="#/">← 另说一理</a>　<span>/</span>　<a href="#/all">万理一览</a></p>' +

        '<header class="result-head reveal">' +
          (q ? '<p class="result-input">' + esc(q) + '</p>' : '') +
          '<h1 class="result-title">' + esc(t.name) + '</h1>' +
          '<p class="result-gist">' + esc(t.gist) + '</p>' +
        '</header>' +

        '<section class="section reveal" style="animation-delay:80ms">' +
          sectionHead('壹', '同此一念', '跨越 ' + t.canon.length + ' 种表达') +
          '<div class="canon-list">' + renderCanon(t) + '</div>' +
        '</section>' +

        '<section class="section reveal" style="animation-delay:120ms">' +
          sectionHead('贰', '以史为镜', '有人验证过它') +
          renderHistory(t.history) +
        '</section>' +

        '<section class="section reveal" style="animation-delay:160ms">' +
          sectionHead('叁', '照见自己', '先别急着回答') +
          renderQuestions(t.questions) +
        '</section>' +

        '<section class="section reveal" style="animation-delay:200ms">' +
          sectionHead('肆', '起而行之', '勾一下，就算开始') +
          renderActions(t.id, t.actions) +
        '</section>' +

        '<div class="toolbar">' +
          '<button type="button" class="btn btn-ghost" id="btn-copy">复制这一段</button>' +
          '<button type="button" class="btn btn-ghost" id="btn-share">复制分享链接</button>' +
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
    document.getElementById('btn-rand2').addEventListener('click', goRandom);
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
