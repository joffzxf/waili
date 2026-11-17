/* 千江月 · 海报导出
 *
 * 把页面上的那张海报（程序生成的 SVG + 引文排版）渲成可分享的 PNG。
 * 不引第三方库：SVG 走 data URI 画到 canvas，文字用 canvas 逐字排版。
 *
 * 三个比例：
 *   poster  1080×1440（3:4，和页面上的海报同比例，主用）
 *   square  1080×1080（方图，社交媒体最稳）
 *   story   1080×1920（9:16，手机壁纸/快拍）
 */
(function (root) {
  'use strict';

  var SIZES = {
    poster: [1080, 1440],
    square: [1080, 1080],
    story: [1080, 1920]
  };

  var FONT_SERIF = '"Source Han Serif SC","Noto Serif CJK SC","Noto Serif SC","Songti SC",STSong,SimSun,Georgia,serif';
  var FONT_SANS = '"Noto Sans CJK SC","Noto Sans SC","PingFang SC","Microsoft YaHei",system-ui,sans-serif';

  function svgToImage(svg) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { reject(new Error('SVG 渲染失败')); };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });
  }

  /* 断行：汉字逐字断，拉丁文按词断——中文可以任意处折行，
     西文不行，否则会出现 su pa / dre 这种切口 */
  function tokens(text) {
    var out = [], buf = '';
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      if (/\s/.test(ch)) {
        if (buf) { out.push(buf); buf = ''; }
        out.push(' ');
      } else if (/[\u3000-\u303f\u4e00-\u9fff\uff00-\uffef]/.test(ch)) {
        if (buf) { out.push(buf); buf = ''; }
        out.push(ch);
      } else {
        buf += ch;
      }
    }
    if (buf) out.push(buf);
    return out;
  }

  function wrap(ctx, text, maxWidth) {
    var parts = tokens(String(text));
    var lines = [], line = '';
    for (var i = 0; i < parts.length; i++) {
      var tk = parts[i];
      if (tk === ' ' && !line) continue;
      var test = line + tk;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = (tk === ' ') ? '' : tk;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    /* 标点悬挂：中文排版里行尾标点可以出界，不该被挤到下一行单独站着 */
    if (lines.length > 1) {
      var last = lines[lines.length - 1];
      if (last.length === 1 && /[。！？，、；：）」』…]/.test(last)) {
        lines[lines.length - 2] += last;
        lines.pop();
      }
    }
    return lines;
  }

  /* 从大往小试，直到行数放得下 */
  function fitText(ctx, text, maxWidth, maxLines, startSize, minSize, weight) {
    var size = startSize;
    while (size >= minSize) {
      ctx.font = weight + ' ' + size + 'px ' + FONT_SERIF;
      var lines = wrap(ctx, text, maxWidth);
      if (lines.length <= maxLines) return { size: size, lines: lines };
      size -= 4;
    }
    ctx.font = weight + ' ' + minSize + 'px ' + FONT_SERIF;
    var cut = wrap(ctx, text, maxWidth).slice(0, maxLines);
    if (cut.length) cut[cut.length - 1] = cut[cut.length - 1].replace(/.$/, '…');
    return { size: minSize, lines: cut };
  }

  /* 主函数：返回一个 Promise<Blob> */
  function render(opts) {
    opts = opts || {};
    var size = SIZES[opts.ratio] || SIZES.poster;
    var W = size[0], H = size[1];
    var pad = Math.round(W * 0.09);

    var canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    var ctx = canvas.getContext('2d');

    var svg = opts.art || '';

    return svgToImage(svg).then(function (img) {
      /* 背景：等比铺满 */
      var ir = img.width / img.height, cr = W / H;
      var dw, dh;
      if (ir > cr) { dh = H; dw = H * ir; } else { dw = W; dh = W / ir; }
      ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);

      /* 压暗角，保证文字可读 */
      var g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, 'rgba(8,7,6,.46)');
      g.addColorStop(0.38, 'rgba(8,7,6,.06)');
      g.addColorStop(0.66, 'rgba(8,7,6,.34)');
      g.addColorStop(1, 'rgba(8,7,6,.86)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      ctx.textBaseline = 'top';
      var ink = '#f3ecdd';

      /* 顶部品牌 */
      ctx.fillStyle = 'rgba(243,236,221,.62)';
      ctx.font = '500 ' + Math.round(W * 0.022) + 'px ' + FONT_SANS;
      ctx.letterSpacing = '6px';
      ctx.fillText('千　江　月', pad, pad);
      if (opts.med) {
        var tag = opts.med === 'film' ? '电影' : opts.med === 'stage' ? '戏剧' : '小说';
        ctx.textAlign = 'right';
        ctx.fillText(tag + '　' + (opts.year || ''), W - pad, pad);
        ctx.textAlign = 'left';
      }
      ctx.letterSpacing = '0px';

      /* 引文：主角，占中段最大面积 */
      var quoteMaxH = H * 0.46;
      var fitted = fitText(ctx, opts.quote || '', W - pad * 2, Math.floor(quoteMaxH / (W * 0.062)), Math.round(W * 0.072), Math.round(W * 0.036), '600');
      ctx.fillStyle = ink;
      ctx.font = '600 ' + fitted.size + 'px ' + FONT_SERIF;
      var lh = fitted.size * 1.62;
      var blockH = fitted.lines.length * lh;
      var startY = (H - blockH) / 2 - H * 0.02;
      fitted.lines.forEach(function (line, i) {
        ctx.fillText(line, pad, startY + i * lh);
      });

      var cursorY = startY + blockH;

      /* 原文（若有） */
      if (opts.orig) {
        /* 原文是准确性的根基，宁可缩字号也不腰斩：最多 6 行，从 2.4% 缩到 1.5% */
        ctx.fillStyle = 'rgba(243,236,221,.62)';
        var fittedOrig = fitText(ctx, opts.orig, W - pad * 2, 6,
          Math.round(W * 0.024), Math.round(W * 0.015), 'italic 400');
        ctx.font = 'italic ' + fittedOrig.size + 'px ' + FONT_SERIF;
        var olh = fittedOrig.size * 1.62;
        fittedOrig.lines.forEach(function (line, i) {
          ctx.fillText(line, pad, cursorY + W * 0.03 + i * olh);
        });
        cursorY += W * 0.03 + fittedOrig.lines.length * olh;
      }

      /* 底部出处 */
      ctx.fillStyle = 'rgba(243,236,221,.78)';
      var srcSize = Math.round(W * 0.023);
      ctx.font = srcSize + 'px ' + FONT_SANS;
      var sl = wrap(ctx, opts.source || '', W - pad * 2).slice(0, 2);
      sl.forEach(function (line, i) {
        ctx.fillText(line, pad, H - pad - (sl.length - i) * srcSize * 1.7 - W * 0.045);
      });

      ctx.fillStyle = 'rgba(243,236,221,.42)';
      ctx.font = Math.round(W * 0.019) + 'px ' + FONT_SANS;
      ctx.fillText('千江月 · 一句道理，千江映月', pad, H - pad);

      return new Promise(function (resolve, reject) {
        canvas.toBlob(function (blob) {
          if (blob) resolve(blob); else reject(new Error('toBlob 失败'));
        }, 'image/png');
      });
    });
  }

  /* 下载 */
  function download(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  root.QJY_SHARE = { render: render, download: download, SIZES: SIZES };
})(typeof window !== 'undefined' ? window : globalThis);
