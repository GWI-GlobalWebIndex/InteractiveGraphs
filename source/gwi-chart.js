/*! GWI interactive charts, v1.5.0. <gwi-chart> web component and <gwi-chart-carousel>. No dependencies.
 *  Built from the GWI Design System 2026 data viz templates.
 *  Usage: load gwi-chart.js with a script tag, then  <gwi-chart type="bar" data='{...}'></gwi-chart>
 *  Docs: README.md next to this file. */
(function () {
  'use strict';
  if (window.customElements && customElements.get('gwi-chart')) return;

  var SCRIPT_SRC = (document.currentScript && document.currentScript.src) || '';

  /* ---------- tokens (GWI Design System colour tokens: dataviz and neutral) ---------- */
  var C = { pink: '#FF0077', lime: '#B9DB51', deep: '#940045', dlime: '#729508', grey: '#B0ACAA',
    ink: '#282523', ink100: '#1E1B1A', muted: '#7F7B79', soft: '#9C9896', grid: '#E8E5E3', track: '#F9F7F6', axis: '#D4D0CE', white: '#FFFFFF' };
  var SETS = { 1: [C.pink], 2: [C.pink, C.lime], 3: [C.deep, C.pink, C.lime], 4: [C.deep, C.pink, C.lime, C.dlime] };
  var MAG = ['#FFE8EE', '#FFD2DF', '#FFBACE', '#FF9FBD', '#FF80A9', '#FF5993', '#FF0077', '#DC1F69', '#CC005F'];
  var DARK_ON = {}; [C.lime, C.grey].concat(MAG.slice(0, 6)).forEach(function (c) { DARK_ON[c] = 1; });

  /* ---------- design system colour tokens by name (tokens/color.json), for the colour="" attribute ----------
   * Any token can be passed by its path, for example color="lime.40" or color="color.pink.100". Keep in step with color.json. */
  var TOKENS = {};
  (function () {
    function add(group, steps, hexes) { steps.forEach(function (st, i) { TOKENS[group + '.' + st] = '#' + hexes[i]; }); }
    add('pink', [10, 20, 30, 40, 50, 60, 70, 80, 90, 100], ['FFF1F5', 'FFE8EE', 'FFD2DF', 'FFBACE', 'FF9FBD', 'FF80A9', 'FF5993', 'FF0077', 'DC1F69', 'CC005F']);
    add('lime', [10, 20, 30, 40, 50], ['F5FFD7', 'EDFFB8', 'D2EA88', 'B9DB51', '729508']);
    add('orange', [10, 20, 30, 40, 50], ['FFF1E6', 'FFE3D1', 'FDC9A6', 'FD9647', 'D5661B']);
    add('neutral', [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100], ['FFFFFF', 'FBFAFA', 'F9F7F6', 'E8E5E3', 'D4D0CE', 'B0ACAA', '9C9896', '7F7B79', '4C4947', '282523', '1E1B1A']);
    add('accessory', ['success', 'warning', 'error', 'info'], ['00C28B', 'E6BA35', 'EC2352', '0088FF']);
    TOKENS['dataviz.pink_deep'] = '#940045'; TOKENS['dataviz.highlight'] = TOKENS['pink.80']; TOKENS['dataviz.context'] = TOKENS['neutral.50'];
    ['pink.20', 'pink.30', 'pink.40', 'pink.50', 'pink.60', 'pink.70', 'pink.80', 'pink.90', 'pink.100'].forEach(function (k, i) { TOKENS['dataviz.magnitude.' + (i + 1)] = TOKENS[k]; });
    TOKENS['dataviz.series_2.1'] = TOKENS['pink.80']; TOKENS['dataviz.series_2.2'] = TOKENS['lime.40'];
  })();
  var TOKVALS = {}; Object.keys(TOKENS).forEach(function (k) { TOKVALS[TOKENS[k]] = 1; });
  function tokColor(v, dflt) { /* a token path ("lime.40", "color.pink.100", "pink-100") or a hex colour. Anything else falls back to the default */
    if (v == null || String(v).trim() === '') return dflt;
    var raw = String(v).trim(), k = raw.toLowerCase().replace(/^color\./, '');
    if (TOKENS[k]) return TOKENS[k];
    k = k.replace(/-/g, '.'); if (TOKENS[k]) return TOKENS[k];
    if (/^#[0-9a-f]{6}$/i.test(raw)) { if (!TOKVALS[raw.toUpperCase()] && window.console) console.warn('gwi-chart: ' + raw + ' is not a design system colour. Use a token name such as "pink.100".'); return raw.toUpperCase(); }
    if (window.console) console.warn('gwi-chart: unknown colour "' + raw + '". Use a design system token such as "pink.100" or "lime.40".');
    return dflt;
  }
  function lumHex(h) { var c = [1, 3, 5].map(function (i) { var x = parseInt(h.substr(i, 2), 16) / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
  function contrastOnWhite(h) { return 1.05 / (lumHex(h) + 0.05); }
  var SYMK = 0.94; /* one uniform scale for every % symbol, in every chart: the pin is 28px wide */
  var KEYGAP = 28; /* one gap between key entries, in every chart */
  var RAD = 6; /* one corner radius for every bar, column, segment and cell */
  var SYM = {
    top: { w: 29.79, h: 35.96, d: 'M25.43,4.36C19.61-1.45,10.18-1.45,4.36,4.36c-5.82,5.82-5.82,15.25,0,21.06l10.53,10.53s7.32-7.32,10.53-10.53c5.82-5.82,5.82-15.25,0-21.06ZM6.24,12.34c0-2.14,1.75-3.58,3.89-3.58s3.88,1.44,3.88,3.58c0,2.18-1.73,3.62-3.88,3.62-2.14,0-3.89-1.44-3.89-3.62ZM11.15,21.86h-2.28s5.06-6.55,5.06-6.55l4.34-6.37h2.28s-4.91,6.48-4.91,6.48l-4.5,6.44ZM19.52,22.05c-2.14,0-3.89-1.44-3.89-3.62,0-2.14,1.75-3.58,3.89-3.58,2.14,0,3.87,1.44,3.87,3.58,0,2.18-1.73,3.62-3.87,3.62ZM19.52,16.95c-1.03,0-1.52.48-1.52,1.48,0,1.02.49,1.5,1.52,1.5,1.04,0,1.52-.48,1.52-1.5,0-1-.49-1.48-1.52-1.48ZM11.66,12.34c0-1-.49-1.48-1.52-1.48-1.03,0-1.52.48-1.52,1.48,0,1.02.49,1.5,1.52,1.5,1.03,0,1.52-.48,1.52-1.5Z' },
    side: { w: 35.96, h: 29.79, d: 'M4.36,4.36c-5.82,5.82-5.82,15.25,0,21.06,5.82,5.82,15.25,5.82,21.06,0l10.53-10.53c-4.51-4.51,1.58,1.58-10.53-10.53C19.61-1.45,10.18-1.45,4.36,4.36ZM6.45,11.99c0-2.14,1.75-3.58,3.89-3.58,2.15,0,3.88,1.44,3.88,3.58,0,2.18-1.73,3.62-3.88,3.62s-3.89-1.44-3.89-3.62ZM11.35,21.51h-2.28s5.06-6.55,5.06-6.55l4.34-6.37h2.28s-4.91,6.48-4.91,6.48l-4.5,6.44ZM19.72,21.7c-2.14,0-3.89-1.44-3.89-3.62s1.75-3.58,3.89-3.58,3.87,1.44,3.87,3.58c0,2.18-1.73,3.62-3.87,3.62ZM19.72,16.6c-1.03,0-1.52.48-1.52,1.48,0,1.02.49,1.5,1.52,1.5,1.04,0,1.52-.48,1.52-1.5,0-1-.49-1.48-1.52-1.48ZM11.86,11.99c0-1-.49-1.48-1.52-1.48s-1.52.48-1.52,1.48c0,1.02.49,1.5,1.52,1.5,1.03,0,1.52-.48,1.52-1.5Z' },
    diag: { w: 29.79, h: 29.79, d: 'M14.89,0C6.67,0,0,6.67,0,14.89s6.67,14.89,14.89,14.89h14.89v-14.89C29.79,6.67,23.12,0,14.89,0ZM6.95,12.54c0-2.14,1.75-3.58,3.89-3.58s3.88,1.44,3.88,3.58-1.73,3.62-3.88,3.62-3.89-1.44-3.89-3.62ZM11.85,22.06h-2.28l5.06-6.55,4.34-6.37h2.28l-4.91,6.48-4.5,6.44ZM20.22,22.25c-2.14,0-3.89-1.44-3.89-3.62s1.75-3.58,3.89-3.58,3.87,1.44,3.87,3.58-1.73,3.62-3.87,3.62ZM20.22,17.15c-1.03,0-1.52.48-1.52,1.48s.49,1.5,1.52,1.5,1.52-.48,1.52-1.5-.49-1.48-1.52-1.48ZM12.36,12.54c0-1-.49-1.48-1.52-1.48s-1.52.48-1.52,1.48.49,1.5,1.52,1.5,1.52-.48,1.52-1.5Z' }
  };

  /* ---------- helpers ---------- */
  var uid = 0;
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function r1(n) { return Math.round(n * 10) / 10; }
  function num(v) { v = +v; return isFinite(v) ? v : 0; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  var FONT = '"Instrument Sans", system-ui, -apple-system, "Segoe UI", sans-serif';
  var mctx = document.createElement('canvas').getContext('2d');
  function tw(s, size, w) { mctx.font = (w || 500) + ' ' + size + 'px ' + FONT; return mctx.measureText(String(s)).width; }
  function wrapOne(s, maxW, size, w) {
    var words = String(s).split(/\s+/), lines = [], cur = '';
    words.forEach(function (wd) {
      var t = cur ? cur + ' ' + wd : wd;
      if (tw(t, size, w) <= maxW || !cur) cur = t; else { lines.push(cur); cur = wd; }
    });
    if (cur) lines.push(cur);
    return lines;
  }
  function wrapText(s, maxW, size, w, maxLines) { /* a line break (\n) in the text always starts a new line */
    var lines = [];
    String(s).split(/\n/).forEach(function (part) { lines = lines.concat(wrapOne(part, maxW, size, w)); });
    if (maxLines && lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      var l = lines[maxLines - 1];
      while (l.length > 1 && tw(l + '…', size, w) > maxW) l = l.slice(0, -1);
      lines[maxLines - 1] = l + '…';
    }
    return lines;
  }
  function badge(cx, cy, n) { /* a pink circle with a white number: ranks the rows of a bar chart */
    return '<circle cx="' + r1(cx) + '" cy="' + r1(cy) + '" r="12" fill="' + C.pink + '" aria-hidden="true"/>' + T(cx, cy + 4.2, n, { size: 12, w: 700, a: 'middle', fill: C.white, attrs: ' aria-hidden="true"' });
  }
  function T(x, y, s, o) {
    o = o || {};
    return '<text x="' + r1(x) + '" y="' + r1(y) + '" font-size="' + (o.size || 15) + '" font-weight="' + (o.w || 500) + '" fill="' + (o.fill || C.ink) +
      '" text-anchor="' + (o.a || 'start') + '"' + (o.cls ? ' class="' + o.cls + '"' : '') + (o.attrs || '') + '>' + esc(s) + (o.kids || '') + '</text>';
  }
  function symW(kind) { return SYM[kind].w * SYMK; }
  function symH(kind) { return SYM[kind].h * SYMK; }
  function sym(kind, cx, cy) { /* centered on (cx, cy) */
    var s = SYM[kind];
    return '<g transform="translate(' + r1(cx - s.w * SYMK / 2) + ' ' + r1(cy - s.h * SYMK / 2) + ') scale(' + SYMK + ')" fill="' + C.ink + '" aria-hidden="true"><path d="' + s.d + '"/></g>';
  }
  function magPick(n) {
    if (n >= 9) return MAG.slice(); if (n === 1) return [MAG[6]];
    var o = []; for (var i = 0; i < n; i++) o.push(MAG[Math.round(i * 8 / (n - 1))]); return o;
  }
  function seriesColors(n) {
    if (n <= 4) return SETS[n].slice();
    if (n > 9 && window.console) console.warn('gwi-chart: more than nine series is not covered by the colour rules. Group the smallest into "Other" or split into several charts.');
    return magPick(Math.min(n, 9));
  }
  function labelFill(c) { return c === C.grey ? C.muted : c; } /* grey bars get readable grey numbers */
  function textOn(c) { return DARK_ON[c] ? C.ink100 : C.white; }
  function nice(max, pct) {
    if (pct && max > 50 && max <= 100) return { max: 100, step: 25 };
    if (max <= 0) return { max: 1, step: 0.25 };
    var raw = max / 4, p = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10)), f = raw / p;
    var nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10, step = nf * p;
    return { max: Math.ceil(max / step - 1e-9) * step, step: step };
  }
  function tang(xs, ys) {
    var n = xs.length, m = [], t = [], i;
    for (i = 0; i < n - 1; i++) m[i] = (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]);
    t[0] = m[0]; t[n - 1] = m[n - 2];
    for (i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
    for (i = 0; i < n - 1; i++) {
      if (m[i] === 0) { t[i] = t[i + 1] = 0; } else {
        var a = t[i] / m[i], b = t[i + 1] / m[i], s = a * a + b * b;
        if (s > 9) { var k = 3 / Math.sqrt(s); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; }
      }
    }
    return t;
  }
  function curve(xs, ys, rev) { /* smooth, organic, never overshoots the data */
    if (xs.length < 2) return '';
    var t = tang(xs, ys), n = xs.length, o = '', i, h;
    if (!rev) for (i = 0; i < n - 1; i++) { h = xs[i + 1] - xs[i]; o += ' C' + r1(xs[i] + h / 3) + ' ' + r1(ys[i] + t[i] * h / 3) + ' ' + r1(xs[i + 1] - h / 3) + ' ' + r1(ys[i + 1] - t[i + 1] * h / 3) + ' ' + r1(xs[i + 1]) + ' ' + r1(ys[i + 1]); }
    else for (i = n - 2; i >= 0; i--) { h = xs[i + 1] - xs[i]; o += ' C' + r1(xs[i + 1] - h / 3) + ' ' + r1(ys[i + 1] - t[i + 1] * h / 3) + ' ' + r1(xs[i] + h / 3) + ' ' + r1(ys[i] + t[i] * h / 3) + ' ' + r1(xs[i]) + ' ' + r1(ys[i]); }
    return o;
  }
  function squarify(items, X, Y, W, H) {
    var total = items.reduce(function (s, i) { return s + i.value; }, 0), sc = W * H / total, nodes = items.map(function (i) { return { it: i, a: i.value * sc }; });
    var out = [], row = [], x = X, y = Y, w = W, h = H;
    function worst(rw, side) { var s = 0, mx = 0, mn = 1e18; rw.forEach(function (r) { s += r.a; mx = Math.max(mx, r.a); mn = Math.min(mn, r.a); }); return Math.max(side * side * mx / (s * s), s * s / (side * side * mn)); }
    function lay() {
      var s = row.reduce(function (q, r) { return q + r.a; }, 0), k;
      if (w >= h) { var cw = s / h; var yy = y; row.forEach(function (r) { var rh = r.a / cw; out.push({ it: r.it, x: x, y: yy, w: cw, h: rh }); yy += rh; }); x += cw; w -= cw; }
      else { var rh2 = s / w, xx = x; row.forEach(function (r) { var rw2 = r.a / rh2; out.push({ it: r.it, x: xx, y: y, w: rw2, h: rh2 }); xx += rw2; }); y += rh2; h -= rh2; }
    }
    var i = 0;
    while (i < nodes.length) {
      var side = Math.min(w, h), nr = row.concat([nodes[i]]);
      if (!row.length || worst(nr, side) <= worst(row, side)) { row = nr; i++; } else { lay(); row = []; }
    }
    if (row.length) lay();
    return out;
  }
  function an(attr, from, to, delay, dur) { /* one entrance animation, started by the component when the chart scrolls into view */
    return '<animate attributeName="' + attr + '" from="' + from + '" to="' + to + '" dur="' + (dur || 0.9) + 's" begin="indefinite" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines=".2 .7 .2 1" data-delay="' + (delay || 0) + '"/>';
  }
  function Rc(attrs, kids) { return '<rect ' + attrs + '>' + (kids || '') + '</rect>'; }
  function clipReveal(id, x, y, w, h, dir, anim, delay) {
    /* a wipe that makes bars, lines and areas grow in. dir: 'x' left to right, 'y' bottom to top */
    if (!anim) return '<clipPath id="' + id + '"><rect x="' + r1(x) + '" y="' + r1(y) + '" width="' + r1(w) + '" height="' + r1(h) + '"/></clipPath>';
    var k = 'dur="0.9s" begin="indefinite" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines=".2 .7 .2 1" data-delay="' + (delay || 0) + '"';
    if (dir === 'y') return '<clipPath id="' + id + '"><rect x="' + r1(x) + '" y="' + r1(y + h) + '" width="' + r1(w) + '" height="0"><animate attributeName="y" from="' + r1(y + h) + '" to="' + r1(y) + '" ' + k + '/><animate attributeName="height" from="0" to="' + r1(h) + '" ' + k + '/></rect></clipPath>';
    return '<clipPath id="' + id + '"><rect x="' + r1(x) + '" y="' + r1(y) + '" width="0" height="' + r1(h) + '"><animate attributeName="width" from="0" to="' + r1(w) + '" ' + k + '/></rect></clipPath>';
  }
  function mark(attrs, tipIdx, label) {
    return ' data-tip="' + tipIdx + '" tabindex="0" role="img" aria-label="' + esc(label) + '"' + (attrs || '');
  }

  /* ---------- data ---------- */
  function normalize(raw, type) {
    var d = raw || {}, cats, series;
    if (INSIGHT[type]) { /* one highlighted share of a total: { value, label, total?, name?, restName? } */
      var dv = parseFloat(String(d.value == null ? 0 : d.value).replace(/[^\d.\-]/g, '')); dv = isFinite(dv) ? dv : 0;
      return { cats: [String(d.name || 'Share'), String(d.restName || 'Rest')], series: [{ name: String(d.seriesName || d.valueLabel || 'Value'), values: [dv, 0] }], ds: { v: dv }, raw: d };
    }
    if (d.points && d.points.length) { /* scatter */
      var gl = [], pts = d.points.map(function (p) { var g = p.group != null ? String(p.group) : null; if (g != null && gl.indexOf(g) < 0) gl.push(g); return { name: String(p.name || ''), x: num(p.x), y: num(p.y), g: g }; });
      pts.forEach(function (p) { p.gi = p.g == null ? 0 : gl.indexOf(p.g); });
      return { cats: pts.map(function (p) { return p.name; }), series: [{ name: d.yLabel || 'Y', values: pts.map(function (p) { return p.y; }) }], sc: { pts: pts, groups: gl, xLabel: d.xLabel || '', yLabel: d.yLabel || '' }, raw: d };
    }
    if (d.links && d.links.length) { /* sankey: nodes are optional, they are read from the links */
      var idx = {}, nl = [], lk = [];
      function nid(n) { var nm = typeof n === 'object' ? n.name : String(n); if (!(nm in idx)) { idx[nm] = nl.length; nl.push({ name: nm, column: typeof n === 'object' ? n.column : null, colorHint: typeof n === 'object' ? n.color : null }); } return idx[nm]; }
      (d.nodes || []).forEach(nid);
      d.links.forEach(function (l) { var a = nid(l.source), b = nid(l.target), v = num(l.value); if (v > 0 && a !== b) lk.push({ s: a, t: b, v: v }); });
      return { cats: nl.map(function (n) { return n.name; }), series: [{ name: 'Flow', values: nl.map(function () { return 0; }) }], sk: { nodes: nl, links: lk }, raw: d };
    }
    if (d.groups && d.groups.length) { /* bars in groups: { groups: [ { name, color, items: [ { name, value } ] } ] } */
      var gr = [], gcat = [], gval = [], gidx = [];
      d.groups.forEach(function (g, k) { gr.push({ name: String(g.name || ('Group ' + (k + 1))), color: g.color }); (g.items || []).forEach(function (it) { gcat.push(String(it.name)); gval.push(num(it.value)); gidx.push(k); }); });
      return { cats: gcat.map(function (c) { return c.replace(/\s*\n\s*/g, ' '); }), catsRaw: gcat, series: [{ name: d.seriesName || d.valueLabel || 'Value', values: gval }], groups: gr, grp: gidx, raw: d };
    }
    if (d.items && d.items.length) {
      cats = d.items.map(function (i) { return i.name; });
      series = [{ name: d.seriesName || d.valueLabel || 'Value', values: d.items.map(function (i) { return num(i.value); }) }];
    } else {
      cats = (d.categories || d.x || []).map(String);
      series = (d.series || []).map(function (s, i) { return { name: s.name || ('Series ' + (i + 1)), values: (s.values || s.data || []).map(num), color: s.color }; });
    }
    var catsRaw = cats.map(String); /* a line break (\n) in a name is kept for drawing and turned into a space everywhere else */
    return { cats: catsRaw.map(function (c) { return c.replace(/\s*\n\s*/g, ' '); }), catsRaw: catsRaw, series: series, raw: d };
  }
  function parseCSV(text) {
    var rows = text.replace(/\r/g, '').split('\n').filter(function (l) { return l.trim(); }).map(function (l) {
      var out = [], cur = '', q = false, i, ch;
      for (i = 0; i < l.length; i++) { ch = l[i]; if (ch === '"') { if (q && l[i + 1] === '"') { cur += '"'; i++; } else q = !q; } else if (ch === ',' && !q) { out.push(cur); cur = ''; } else cur += ch; }
      out.push(cur); return out;
    });
    var head = rows.shift();
    return { categories: rows.map(function (r) { return r[0]; }), series: head.slice(1).map(function (n, j) { return { name: n, values: rows.map(function (r) { return num(r[j + 1]); }) }; }) };
  }
  var INSIGHT = { 'inline-donut': 1, 'inline-dots': 1 }; /* Inline insights: a card with a big number and one animated visual, no title, key or buttons */
  var TYPES = { bar: 'bar', bars: 'bar', column: 'column', columns: 'column', line: 'line', lines: 'line', area: 'area',
    'stacked-area': 'stacked-area', 'stacked-bar': 'stacked-bar', 'stacked-column': 'stacked-column', 'stacked-col': 'stacked-column', heatmap: 'heatmap', treemap: 'treemap', sankey: 'sankey', alluvial: 'sankey', scatter: 'scatter', 'dot-plot': 'dot-plot', dot: 'dot-plot', dumbbell: 'dot-plot', slope: 'slope',
    'half-donut': 'half-donut', donut: 'half-donut', 'inline-donut': 'inline-donut', 'donut-stat': 'inline-donut', 'half-donut-stat': 'inline-donut', 'donut-highlight': 'inline-donut', 'inline-dots': 'inline-dots', 'dot-matrix': 'inline-dots', 'inline-dot-matrix': 'inline-dots', 'dots': 'inline-dots', stat: 'stat', 'big-number': 'stat', stats: 'stats', 'big-numbers': 'stats', 'stat-bar': 'stat-bar', 'big-bar': 'stat-bar' };

  /* ---------- chart builders. Each returns { h, svg, tips, hover, legend:{items,align,pad,line}, aria } ---------- */
  function ctx(el, d, W) {
    var a = el._attrs(), S = { W: W, unit: a.unit, pct: a.unit === '%', dec: a.decimals === '' ? null : +a.decimals, anim: el._anim, id: 'g' + (++uid), height: a.height ? +a.height : 0 };
    S.prefix = /^[$£€]$/.test(a.unit) ? a.unit : '';
    S.suffix = (!S.pct && a.unit && !S.prefix) ? a.unit : '';
    S.fmtN = function (v) { var dd = S.dec; if (dd === null) dd = Math.abs(v - Math.round(v)) < 1e-9 ? 0 : 1; return v.toLocaleString('en-US', { minimumFractionDigits: dd, maximumFractionDigits: dd }); };
    S.vs = function (v) { return S.prefix + S.fmtN(v) + S.suffix; };           /* short: the % lives in the symbol */
    S.vf = function (v) { return S.prefix + S.fmtN(v) + S.suffix + (S.pct ? '%' : ''); }; /* full: tooltips, table, aria */
    var asp = a.aspect || '4:3', am = /^(\d+(?:\.\d+)?)\s*[:\/]\s*(\d+(?:\.\d+)?)$/.exec(asp);
    S.targetH = (asp === 'auto' || !am || S.height) ? 0 : Math.round(W * (+am[2]) / (+am[1])); /* 4:3 by default, taller only when the data needs it */
    S.highlight = a.highlight;
    S.dsColor = el.getAttribute('color'); S.dsTrack = el.getAttribute('track-color'); /* donut-stat: design system token names */
    S.normalize = a.normalize !== 'false';
    S.max = a.max ? +a.max : 0;
    S.ranked = el.hasAttribute('ranked') && el.getAttribute('ranked') !== 'false'; /* pink numbered circles beside the rows of a bar chart */
    S.refAttr = a.reference; /* a dotted reference line on a bar chart: reference='{"value":50,"label":"Majority"}' */
    S.barH = parseFloat(getComputedStyle(el).getPropertyValue('--gwi-bar-height')) || 0; /* --gwi-bar-height: 28px */
    S.wideCols = el.getAttribute('columns') === 'wide'; S.layoutSquare = el.getAttribute('layout') === 'square';
    S.above = el.getAttribute('labels') === 'above'; /* labels="above" */
    S.hidden = el._hidden || []; /* groups switched off with the key */
    return S;
  }
  function colorsFor(d, S, type) {
    var n = d.series.length, base = seriesColors(n);
    var cols = d.series.map(function (s, i) { return s.color || base[i]; });
    if (n === 1 && (type === 'bar' || type === 'column') && S.highlight !== '' && S.highlight != null) {
      var hi = isNaN(+S.highlight) ? d.cats.indexOf(S.highlight) : +S.highlight;
      return { hi: hi, cols: cols };
    }
    return { cols: cols };
  }
  function dataMax(d) { var m = 0; d.series.forEach(function (s) { s.values.forEach(function (v) { if (v > m) m = v; }); }); return m; }

  function buildBar(d, S) {
    var W = S.W, ns = d.series.length, nc = d.cats.length, cc = colorsFor(d, S, 'bar'), cols = cc.cols, hi = cc.hi, A = S.anim;
    if (d.groups) return buildGroupBar(d, S);
    var narrow = W < 520 || S.above, fs = 15, tips = [], svg = '';
    var rk = S.ranked && ns === 1, rkW = rk ? 36 : 0, barCols = ns === 1 && S.raw && Array.isArray(S.raw.colors) ? S.raw.colors : null;
    var ref = null; try { ref = S.refAttr ? JSON.parse(S.refAttr) : (S.raw && S.raw.reference); } catch (e) { ref = null; } if (ref && !(+ref.value > 0)) ref = null;
    var maxLab = 0; d.cats.forEach(function (c, i) { String(d.catsRaw ? d.catsRaw[i] : c).split(/\n/).forEach(function (p) { maxLab = Math.max(maxLab, tw(p, fs, 500)); }); });
    var lw = narrow ? 0 : Math.min(Math.ceil(maxLab) + rkW + 4, W * (rk ? 0.42 : 0.34));
    var vfs = ns === 1 ? 15 : 14, vw = 0; d.series.forEach(function (s) { s.values.forEach(function (v) { vw = Math.max(vw, tw(S.vs(v), vfs, 700)); }); }); vw = Math.ceil(vw);
    var top = S.pct ? Math.ceil(symH('top')) + (ns === 1 ? 0 : 10) : 2, labH = narrow ? 26 : 0, bh = ns === 1 ? 16 : 12, gp = 4, sep = ns === 1 ? 12 : 22, fixBh = S.barH > 0; if (fixBh) bh = S.barH;
    var aLines = null; /* labels="above": the statement sits above its bar (up to three lines) and the bar runs the full width of the chart */
    if (S.above) { aLines = d.cats.map(function (c, i) { return wrapText(d.catsRaw ? d.catsRaw[i] : c, W - rkW - vw - 24, 16, 500, 3); }); labH = Math.max.apply(null, aLines.map(function (l) { return l.length; })) * 21 + 10; if (S.height === 0 && ns === 1) sep = 18; }
    if (ref) top += 30;
    function nat() { var g = ns * bh + (ns - 1) * gp; return top + (nc - 1) * (labH + g + sep) + labH + g + 4; }
    var H = nat();
    if (S.height && ns === 1 && S.height > H) { bh = (S.height - top - 4 - (nc - 1) * sep) / nc; H = nat(); } /* height="380": the bars grow so the last one ends exactly at that height */
    if (S.targetH > H && !fixBh) { /* 4:3 by default: thicken the bars, add a little air between rows, then centre what is left */
      var grow = Math.min(1.1, (S.targetH - H) / H); bh = Math.round(bh * (1 + grow)); gp = Math.round(gp * (1 + grow * 0.3)); H = nat();
      if (nc > 1 && S.targetH > H) { sep += Math.min((S.targetH - H) / (nc - 1), 6); H = nat(); }
    }
    var gH = ns * bh + (ns - 1) * gp, pitch = labH + gH + sep, x0 = narrow ? 0 : lw + 20, x1 = W - vw - 16, trackW = Math.max(40, x1 - x0), rx = Math.min(RAD, bh / 2);
    var dom = S.max || (S.pct && dataMax(d) <= 100 ? 100 : nice(dataMax(d)).max);
    var fills = '', vals = '', rest = '';
    if (S.pct) rest += sym('top', W - vw / 2, symH('top') / 2);
    if (ref) { var rxp = x0 + clamp(+ref.value / dom, 0, 1) * trackW, ry0 = (S.pct ? Math.ceil(symH('top')) : 0) + 4; /* dotted reference line over every track, with its label above */
      vals += T(rxp, ry0 + 12, ref.label || '', { size: 13, w: 600, a: 'middle' }) + '<line x1="' + r1(rxp) + '" x2="' + r1(rxp) + '" y1="' + r1(ry0 + 22) + '" y2="' + r1(H - 4) + '" stroke="' + C.ink + '" stroke-width="2" stroke-linecap="round" stroke-dasharray="0 5" aria-hidden="true"/>'; }
    d.cats.forEach(function (cat, i) {
      var rt = top + i * pitch, y0 = rt + labH, k;
      if (ns > 1 && i < nc - 1) rest += '<line x1="1" x2="' + (W - 1) + '" y1="' + r1(rt + labH + gH + sep / 2) + '" y2="' + r1(rt + labH + gH + sep / 2) + '" stroke="' + C.grid + '" stroke-width="1.5" stroke-linecap="round"/>'; /* a line between the groups, same as the column chart */
      var catR = d.catsRaw ? d.catsRaw[i] : cat;
      if (narrow) {
        if (rk) rest += badge(12, rt + 11, i + 1);
        if (aLines) aLines[i].forEach(function (ln, li) { rest += T(rkW, rt + 16 + li * 21, ln, { size: 16, w: 500 }); }); else rest += T(rkW, rt + 16, cat, { size: 14, w: 600 });
      } else {
        var lines = wrapText(catR, lw - rkW, fs, 500, 2), cy = y0 + gH / 2;
        if (rk) rest += badge(12, cy, i + 1);
        lines.forEach(function (ln, li) { rest += T(rkW, cy - (lines.length - 1) * 9 + li * 18 + 5, ln, { size: fs, w: 500 }); });
      }
      for (k = 0; k < ns; k++) {
        var v = d.series[k].values[i], y = y0 + k * (bh + gp), c = cols[k], isHi = true;
        if (hi != null) { isHi = (i === hi); c = isHi ? C.pink : C.grey; }
        if (barCols && barCols[i]) c = barCols[i]; /* per-bar colours: "colors": ["#FF0077", "#FF80A9"] in the data */
        var L = Math.max(RAD * 2, clamp(v / dom, 0, 1) * trackW), ti = tips.length, dl = i * 0.07 + k * 0.05;
        tips.push({ t: cat, rows: [{ c: c, n: d.series[k].name, v: S.vf(v) }], s: k });
        fills += '<rect x="' + r1(x0) + '" y="' + r1(y) + '" width="' + r1(trackW) + '" height="' + bh + '" rx="' + rx + '" fill="' + C.track + '"/>';
        fills += Rc('data-m="' + ti + '" data-s="' + k + '" x="' + r1(x0) + '" y="' + r1(y) + '" width="' + (A ? 0 : r1(L)) + '" height="' + bh + '" rx="' + rx + '" fill="' + c + '"', A ? an('width', 0, r1(L), dl) : '');
        vals += T(W, y + bh / 2 + vfs / 3, S.vs(v), { size: vfs, w: 700, a: 'end', fill: labelFill(c), attrs: ' data-m="' + ti + '" data-s="' + k + '" data-cv="' + v + '" data-delay="' + dl + '"' });
        rest += '<rect class="hit" x="0" y="' + r1(y - gp / 2) + '" width="' + W + '" height="' + (bh + gp) + '" fill="transparent"' + mark(' data-s="' + k + '"', ti, cat + ', ' + d.series[k].name + ': ' + S.vf(v)) + '/>';
      }
    });
    svg += fills + '<g class="fade">' + vals + '</g>' + rest;
    return { h: H, svg: svg, tips: tips, seriesFocus: ns > 1, legend: ns > 1 ? { items: d.series.map(function (s, i) { return [s.name, cols[i]]; }), align: 'end' } : null, aria: 'Bar chart' };
  }

  function buildGroupBar(d, S) { /* bars in groups: one colour per group, a rule between groups, and the key switches groups on and off */
    var W = S.W, A = S.anim, narrow = W < 520 || S.above, fs = 15, tips = [], gN = d.groups.length, hidden = S.hidden || [];
    var base = seriesColors(gN), cols = d.groups.map(function (g, k) { return g.color || base[k]; });
    var items = d.cats.map(function (c, i) { return { n: c, raw: d.catsRaw ? d.catsRaw[i] : c, v: d.series[0].values[i], g: d.grp[i] }; });
    var vis = items.filter(function (it) { return hidden.indexOf(it.g) < 0; }); if (!vis.length) vis = items;
    var maxLab = 0; vis.forEach(function (it) { String(it.raw).split(/\n/).forEach(function (p) { maxLab = Math.max(maxLab, tw(p, fs, 500)); }); });
    var lw = narrow ? 0 : Math.min(Math.ceil(maxLab) + 4, W * 0.34), vfs = 18, vw = 0;
    vis.forEach(function (it) { vw = Math.max(vw, tw(S.vs(it.v), vfs, 700)); }); vw = Math.ceil(vw);
    var top = S.pct ? Math.ceil(symH('top')) + 6 : 2, bh = 30, labH = narrow ? 26 : 0, rowH = narrow ? bh + labH : 40, gp = 8, gs = 26, aL = null;
    if (S.above) { /* labels="above": the statement (up to three lines) sits above a full-width bar */
      aL = {}; vis.forEach(function (it) { aL[it.raw] = wrapText(it.raw, W - vw - 24, 16, 500, 3); }); labH = Math.max.apply(null, vis.map(function (it) { return aL[it.raw].length; })) * 21 + 6; rowH = labH + bh; gp = 18; gs = 40; top += 12;
    }
    var x0 = narrow ? 0 : lw + 20, x1 = W - vw - 16, trackW = Math.max(40, x1 - x0), rx = Math.min(RAD, bh / 2);
    var dom = S.max || (S.pct && dataMax(d) <= 100 ? 100 : nice(dataMax(d)).max), endY = top, fills = '', vals = '', rest = '', prevG = null;
    if (S.pct) rest += sym('top', W - vw / 2, symH('top') / 2);
    vis.forEach(function (it, i) {
      var y;
      if (prevG === null) y = top; else if (it.g !== prevG) { y = endY + gs; rest += '<line x1="1" x2="' + (W - 1) + '" y1="' + r1(endY + gs / 2) + '" y2="' + r1(endY + gs / 2) + '" stroke="' + C.grid + '" stroke-width="1.5" stroke-linecap="round"/>'; } else y = endY + gp;
      endY = y + rowH; prevG = it.g;
      var by = narrow ? y + labH : y + (rowH - bh) / 2, c = cols[it.g], L = Math.max(RAD * 2, clamp(it.v / dom, 0, 1) * trackW), ti = tips.length, dl = i * 0.07;
      if (aL) aL[it.raw].forEach(function (ln, li) { rest += T(0, y + 16 + li * 21, ln, { size: 16, w: 500 }); });
      else if (narrow) rest += T(0, y + 16, String(it.raw).replace(/\s*\n\s*/g, ' '), { size: 14, w: 600 });
      else { var ls = wrapText(it.raw, lw, fs, 500, 2), cy = by + bh / 2; ls.forEach(function (ln, li) { rest += T(0, cy - (ls.length - 1) * 9 + li * 18 + 5, ln, { size: fs, w: 500 }); }); }
      tips.push({ t: it.n, rows: [{ c: c, n: d.groups[it.g].name, v: S.vf(it.v) }], s: it.g });
      fills += '<rect x="' + r1(x0) + '" y="' + r1(by) + '" width="' + r1(trackW) + '" height="' + bh + '" rx="' + rx + '" fill="' + C.track + '"/>';
      fills += Rc('data-m="' + ti + '" data-s="' + it.g + '" x="' + r1(x0) + '" y="' + r1(by) + '" width="' + (A ? 0 : r1(L)) + '" height="' + bh + '" rx="' + rx + '" fill="' + c + '"', A ? an('width', 0, r1(L), dl) : '');
      vals += T(W, by + bh / 2 + vfs / 3, S.vs(it.v), { size: vfs, w: 700, a: 'end', fill: labelFill(c), attrs: ' data-m="' + ti + '" data-s="' + it.g + '" data-cv="' + it.v + '" data-delay="' + dl + '"' });
      rest += '<rect class="hit" x="0" y="' + r1(y) + '" width="' + W + '" height="' + rowH + '" fill="transparent"' + mark(' data-s="' + it.g + '"', ti, it.n + ', ' + d.groups[it.g].name + ': ' + S.vf(it.v)) + '/>';
    });
    var H = endY + 4;
    return { h: H, svg: fills + '<g class="fade">' + vals + '</g>' + rest, tips: tips, seriesFocus: true, legend: gN > 1 ? { items: d.groups.map(function (g, k) { return [g.name, cols[k]]; }), align: 'end', toggle: true } : null, aria: 'Bar chart' };
  }

  function buildColumn(d, S) {
    var W = S.W, ns = d.series.length, nc = d.cats.length, cc = colorsFor(d, S, 'column'), cols = cc.cols, hi = cc.hi, A = S.anim;
    var tips = [], svg = '', fs = 15, barCols = ns === 1 && S.raw && Array.isArray(S.raw.colors) ? S.raw.colors : null;
    var ox = S.pct ? symW('side') + 12 : 0, need = Math.ceil(ox + nc * (ns > 1 ? ns * 18 + (ns - 1) * 6 + 22 : 52));
    if (W < need && !S.noMin) return buildColumn(d, Object.assign({}, S, { W: need, noMin: true, targetH: S.targetH ? S.targetH * need / W : 0 }));
    var gw = (W - ox) / nc, cg = ns > 1 ? 6 : 0;
    var cw = ns === 1 ? (S.wideCols ? Math.max(10, Math.floor(gw - 30)) : clamp(Math.floor(gw * 0.7), 10, 64)) : /* columns="wide": as wide as the cell minus a 30px gap */ clamp(Math.floor((gw * 0.8 - (ns - 1) * cg) / ns), 10, 36), inner = ns * cw + (ns - 1) * cg, rx = Math.min(RAD, cw / 2);
    var nfs = cw < 22 ? 12 : fs, ty = 34;
    var dom = S.max || (S.pct && dataMax(d) <= 100 ? 100 : nice(dataMax(d)).max);
    var lines = d.cats.map(function (c, i) { return wrapText(d.catsRaw ? d.catsRaw[i] : c, Math.max(40, gw - 14), 14, 500, 3); });
    var maxL = Math.max.apply(null, lines.map(function (l) { return l.length; }));
    var labBlock = 26 + (maxL - 1) * 18 + 10, Hn = clamp(W * 0.36, 190, 280);
    var Hp = S.height || (S.targetH ? Math.max(Hn, S.targetH - ty - labBlock) : Hn);
    var labTop = ty + Hp + 26, H = labTop + (maxL - 1) * 18 + 10;
    var fills = '', vals = '', rest = '';
    d.cats.forEach(function (cat, i) {
      var gx = ox + i * gw, ix = gx + (gw - inner) / 2, k;
      for (k = 0; k < ns; k++) {
        var v = d.series[k].values[i], x = ix + k * (cw + cg), c = cols[k];
        if (hi != null) c = (i === hi) ? C.pink : C.grey;
        if (barCols && barCols[i]) c = barCols[i]; /* per-bar colours */
        var h = Math.max(RAD * 2, clamp(v / dom, 0, 1) * Hp), ti = tips.length, dl = i * 0.08 + k * 0.05, yF = ty + Hp - h;
        tips.push({ t: cat, rows: [{ c: c, n: d.series[k].name, v: S.vf(v) }], s: k });
        fills += '<rect x="' + r1(x) + '" y="' + ty + '" width="' + cw + '" height="' + r1(Hp) + '" rx="' + rx + '" fill="' + C.track + '"/>';
        fills += Rc('data-m="' + ti + '" data-s="' + k + '" x="' + r1(x) + '" y="' + r1(A ? ty + Hp : yF) + '" width="' + cw + '" height="' + (A ? 0 : r1(h)) + '" rx="' + rx + '" fill="' + c + '"', A ? an('y', r1(ty + Hp), r1(yF), dl) + an('height', 0, r1(h), dl) : '');
        vals += T(x + cw / 2, 18, S.vs(v), { size: nfs, w: 700, a: 'middle', fill: labelFill(c), attrs: ' data-m="' + ti + '" data-s="' + k + '" data-cv="' + v + '" data-delay="' + dl + '"' });
        rest += '<rect class="hit" x="' + r1(x - cg / 2) + '" y="0" width="' + (cw + cg) + '" height="' + r1(ty + Hp) + '" fill="transparent"' + mark(' data-s="' + k + '"', ti, cat + ', ' + d.series[k].name + ': ' + S.vf(v)) + '/>';
      }
      lines[i].forEach(function (ln, li) { rest += T(gx + gw / 2, labTop + li * 18, ln, { size: 14, w: 500, a: 'middle' }); });
      if (i < nc - 1 && ns > 1) rest += '<line x1="' + r1(gx + gw) + '" x2="' + r1(gx + gw) + '" y1="4" y2="' + r1(labTop + (maxL - 1) * 18 + 6) + '" stroke="' + C.grid + '" stroke-width="1.5" stroke-linecap="round"/>';
    });
    if (S.pct) rest += sym('side', symW('side') / 2, 13);
    svg += fills + '<g class="fade">' + vals + '</g>' + rest;
    return { h: H, w: W, svg: svg, tips: tips, seriesFocus: ns > 1, legend: ns > 1 ? { items: d.series.map(function (s, i) { return [s.name, cols[i]]; }), align: 'end' } : null, aria: 'Column chart' };
  }

  function buildStackedBar(d, S) {
    var W = S.W, ns = d.series.length, nc = d.cats.length, cols = colorsFor(d, S, 'stacked-bar').cols, tips = [], svg = '', fs = 15, A = S.anim;
    var narrow = W < 520, maxLab = 0; d.cats.forEach(function (c) { maxLab = Math.max(maxLab, tw(c, fs, 500)); });
    var lw = narrow ? 0 : Math.min(Math.ceil(maxLab) + 4, W * 0.28), x0 = narrow ? 0 : lw + 20, bw = W - x0, labH = narrow ? 26 : 0, top = 2;
    var bh = narrow ? 32 : 38, sep = 6;
    function nat() { return top + (nc - 1) * (labH + bh + sep) + labH + bh + 2; }
    var H = nat();
    if (S.targetH > H) { var grow = Math.min(1.0, (S.targetH - H) / H); bh = Math.round(bh * (1 + grow)); H = nat(); if (nc > 1 && S.targetH > H) { sep += Math.min((S.targetH - H) / (nc - 1), 4); H = nat(); } }
    var pitch = labH + bh + sep, rx = Math.min(RAD, bh / 2);
    var totals = d.cats.map(function (c, i) { return d.series.reduce(function (s, q) { return s + q.values[i]; }, 0); });
    var maxT = Math.max.apply(null, totals.concat([1]));
    var fills = '', rest = '', clips = '';
    d.cats.forEach(function (cat, i) {
      var rt = top + i * pitch, y = rt + labH, x = x0, k, dl = i * 0.12;
      if (narrow) rest += T(0, rt + 16, cat, { size: 14, w: 600 }); else rest += T(0, y + bh / 2 + 5, wrapText(cat, lw, fs, 500, 1)[0], { size: fs });
      var rowW = S.normalize ? bw : bw * totals[i] / maxT;
      clips += '<clipPath id="' + S.id + 'r' + i + '"><rect x="' + x0 + '" y="' + r1(y) + '" width="' + r1(rowW) + '" height="' + bh + '" rx="' + rx + '"/></clipPath>' + clipReveal(S.id + 'v' + i, x0, y - 2, rowW, bh + 4, 'x', A, dl);
      fills += '<g clip-path="url(#' + S.id + 'r' + i + ')"><g clip-path="url(#' + S.id + 'v' + i + ')">';
      for (k = 0; k < ns; k++) {
        var v = d.series[k].values[i], w = totals[i] ? v / totals[i] * rowW : 0, c = cols[k], ti = tips.length, lab = S.vf(v), fits = w > tw(lab, fs, 700) + 14;
        tips.push({ t: cat, rows: [{ c: c, n: d.series[k].name, v: lab }], s: k });
        fills += '<rect data-m="' + ti + '" data-s="' + k + '" x="' + r1(x) + '" y="' + r1(y) + '" width="' + r1(w) + '" height="' + bh + '" fill="' + c + '" stroke="#fff" stroke-width="2.5" paint-order="stroke"' + (fits ? ' data-notip="1"' : '') + mark('', ti, cat + ', ' + d.series[k].name + ': ' + lab) + '/>';
        if (fits) rest += T(x + w / 2, y + bh / 2 + 5, lab, { size: fs, w: 700, a: 'middle', fill: textOn(c), cls: 'rv', attrs: ' data-m="' + ti + '" data-s="' + k + '" pointer-events="none"' });
        x += w;
      }
      fills += '</g></g>';
    });
    svg += clips + fills + '<g class="fade">' + rest + '</g>';
    return { h: H, svg: svg, tips: tips, seriesFocus: ns > 1, legend: ns > 1 ? { items: d.series.map(function (s, i) { return [s.name, cols[i]]; }), align: 'start' } : null, aria: 'Stacked bar chart' };
  }

  function buildStackedColumn(d, S) {
    var W = S.W, ns = d.series.length, nc = d.cats.length, cols = colorsFor(d, S, 'stacked-column').cols, tips = [], svg = '', fs = 15, A = S.anim;
    var ox = S.pct ? symW('side') + 12 : 0, need = Math.ceil(ox + nc * 52);
    if (W < need && !S.noMin) return buildStackedColumn(d, Object.assign({}, S, { W: need, noMin: true, targetH: S.targetH ? S.targetH * need / W : 0 }));
    var gw = (W - ox) / nc, cw = clamp(Math.floor(gw * 0.84), 24, 120), rx = Math.min(RAD, cw / 2), ty = 6;
    var lines = d.cats.map(function (c, i) { return wrapText(d.catsRaw ? d.catsRaw[i] : c, Math.max(40, gw - 14), 14, 500, 3); });
    var maxL = Math.max.apply(null, lines.map(function (l) { return l.length; }));
    var labBlock = 26 + (maxL - 1) * 18 + 10, Hn = clamp(W * 0.36, 190, 280);
    var Hp = S.height || (S.targetH ? Math.max(Hn, S.targetH - ty - labBlock) : Hn), labTop = ty + Hp + 26, H = labTop + (maxL - 1) * 18 + 10;
    var totals = d.cats.map(function (c, i) { return d.series.reduce(function (s, q) { return s + q.values[i]; }, 0); }), maxT = Math.max.apply(null, totals.concat([1]));
    var fills = '', rest = '', clips = '';
    if (ox) rest += sym('side', symW('side') / 2, ty + symH('side') / 2);
    d.cats.forEach(function (cat, i) {
      var gx = ox + i * gw, x = gx + (gw - cw) / 2, colH = S.normalize ? Hp : Hp * totals[i] / maxT, y = ty + Hp, k, dl = i * 0.1;
      clips += '<clipPath id="' + S.id + 'r' + i + '"><rect x="' + r1(x) + '" y="' + r1(ty + Hp - colH) + '" width="' + cw + '" height="' + r1(colH) + '" rx="' + rx + '"/></clipPath>' + clipReveal(S.id + 'v' + i, x - 2, ty - 2, cw + 4, Hp + 4, 'y', A, dl);
      fills += '<g clip-path="url(#' + S.id + 'r' + i + ')"><g clip-path="url(#' + S.id + 'v' + i + ')">';
      for (k = 0; k < ns; k++) {
        var v = d.series[k].values[i], h = totals[i] ? v / totals[i] * colH : 0, c = cols[k], ti = tips.length, lab = S.vf(v), fits = h > 24 && cw > tw(lab, fs, 700) + 8;
        y -= h; tips.push({ t: cat, rows: [{ c: c, n: d.series[k].name, v: lab }], s: k });
        fills += '<rect data-m="' + ti + '" data-s="' + k + '" x="' + r1(x) + '" y="' + r1(y) + '" width="' + cw + '" height="' + r1(h) + '" fill="' + c + '" stroke="#fff" stroke-width="2.5" paint-order="stroke"' + (fits ? ' data-notip="1"' : '') + mark('', ti, cat + ', ' + d.series[k].name + ': ' + lab) + '/>';
        if (fits) rest += T(x + cw / 2, y + h / 2 + 5, S.vs(v), { size: fs, w: 700, a: 'middle', fill: textOn(c), cls: 'rv', attrs: ' data-m="' + ti + '" data-s="' + k + '" pointer-events="none"' });
      }
      fills += '</g></g>';
      lines[i].forEach(function (ln, li) { rest += T(gx + gw / 2, labTop + li * 18, ln, { size: 14, w: 500, a: 'middle' }); });
    });
    svg += clips + fills + '<g class="fade">' + rest + '</g>';
    return { h: H, svg: svg, tips: tips, seriesFocus: ns > 1, legend: ns > 1 ? { items: d.series.map(function (s, i) { return [s.name, cols[i]]; }), align: 'start' } : null, aria: 'Stacked column chart' };
  }

  function lineGeom(d, S, stacked) {
    var W = S.W, n = d.cats.length, ns = d.series.length, fs = 12, cum = [], k, i;
    var totals = d.cats.map(function (c, j) { return d.series.reduce(function (s, q) { return s + q.values[j]; }, 0); });
    var rawMax = stacked ? Math.max.apply(null, totals) : dataMax(d), rawMin = stacked ? 0 : Math.min(0, Math.min.apply(null, d.series.map(function (s) { return Math.min.apply(null, s.values); })));
    var sc = S.max ? { max: S.max, step: S.max / 4 } : nice(rawMax, S.pct), lo = rawMin;
    var ticks = []; for (var tv = lo; tv <= sc.max + 1e-9; tv += sc.step) ticks.push(tv);
    var left = 0; ticks.forEach(function (t) { left = Math.max(left, tw(S.vf(t), fs, 500)); }); left = Math.ceil(left) + 14;
    var endLab = 0;
    if (!stacked && !S.noEnd && ns >= 1 && W >= 560 && ns > 0) { d.series.forEach(function (s) { endLab = Math.max(endLab, tw(S.vs(s.values[n - 1]), 15, 700), tw(s.name, fs, 500)); }); endLab = Math.ceil(endLab) + 18; }
    var right = Math.max(endLab, 14), top = 6, Hp = S.height || (S.targetH ? Math.max(150, S.targetH * 0.62 - 6 - 30) : clamp(W * 0.34, 200, 300)), pw = W - left - right;
    var X = function (j) { return n > 1 ? left + j * pw / (n - 1) : left + pw / 2; }, Y = function (v) { return top + Hp - (v - lo) / (sc.max - lo) * Hp; };
    return { W: W, n: n, ns: ns, fs: fs, ticks: ticks, left: left, right: right, top: top, Hp: Hp, pw: pw, X: X, Y: Y, totals: totals, endLab: endLab, base: top + Hp, H: top + Hp + 30 };
  }
  function lineAxes(g, d, S, vgrid) {
    var o = '', j;
    g.ticks.forEach(function (t) {
      o += '<line x1="' + g.left + '" x2="' + (g.W - g.right) + '" y1="' + r1(g.Y(t)) + '" y2="' + r1(g.Y(t)) + '" stroke="' + C.grid + '" stroke-width="1"/>';
      o += T(0, g.Y(t) + 4, S.vf(t), { size: g.fs, w: 500, fill: C.muted });
    });
    if (vgrid) for (j = 0; j < g.n; j++) o += '<line x1="' + r1(g.X(j)) + '" x2="' + r1(g.X(j)) + '" y1="' + g.top + '" y2="' + g.base + '" stroke="' + C.grid + '" stroke-width="1"/>';
    var maxw = 0; d.cats.forEach(function (c) { maxw = Math.max(maxw, tw(c, g.fs, 500)); });
    var step = g.n > 1 ? Math.max(1, Math.ceil((maxw + 14) / (g.pw / (g.n - 1)))) : 1;
    for (j = 0; j < g.n; j += step) {
      var w = tw(d.cats[j], g.fs, 500), x = clamp(g.X(j), w / 2, g.W - w / 2);
      o += T(x, g.base + 26, d.cats[j], { size: g.fs, w: 500, fill: C.muted, a: 'middle' });
    }
    return o;
  }
  function hoverLayer(g, d, cols, pos, S) {
    /* crosshair + dots, driven by the component's pointer handler */
    var o = '<g class="xh" style="display:none"><line y1="' + g.top + '" y2="' + g.base + '" stroke="' + C.axis + '" stroke-width="1.5" stroke-linecap="round"/>';
    d.series.forEach(function (s, k) { o += '<circle r="5.5" fill="' + cols[k] + '" stroke="#fff" stroke-width="2.5"/>'; });
    return o + '</g><rect class="hit-x" x="' + g.left + '" y="0" width="' + g.pw + '" height="' + g.base + '" fill="transparent"/>';
  }
  function xTips(d, S, cols, stacked, g) {
    var tips = [];
    d.cats.forEach(function (cat, j) {
      var rows = d.series.map(function (s, k) { return { c: cols[k], n: s.name, v: S.vf(s.values[j]) }; });
      if (stacked) { rows.reverse(); rows.push({ c: null, n: 'Total', v: S.vf(g.totals[j]) }); }
      tips.push({ t: cat, rows: rows });
    });
    return tips;
  }
  function buildLine(d, S) {
    var g = lineGeom(d, Object.assign({}, S, { noEnd: true }), false), cols = colorsFor(d, S, 'line').cols, ns = g.ns, n = g.n, svg = '', k, j;
    svg += clipReveal(S.id + 'c', 0, 0, g.W + 20, g.H, 'x', S.anim);
    svg += lineAxes(g, d, S, false);
    var body = '', ends = '', pos = [];
    for (k = ns - 1; k >= 0; k--) {
      var xs = [], ys = []; for (j = 0; j < n; j++) { xs.push(g.X(j)); ys.push(g.Y(d.series[k].values[j])); }
      if (n > 1) body += '<path class="dl" data-s="' + k + '" d="M' + r1(xs[0]) + ' ' + r1(ys[0]) + curve(xs, ys) + '" fill="none" stroke="' + cols[k] + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>';
      ends += '<circle data-s="' + k + '" cx="' + r1(xs[n - 1]) + '" cy="' + r1(ys[n - 1]) + '" r="5.5" fill="' + cols[k] + '" stroke="#fff" stroke-width="2.5"/>';
    }
    if (g.endLab) { /* direct labels at the line ends, nudged apart */
      var lab = d.series.map(function (s, q) { return { k: q, y: g.Y(s.values[n - 1]) }; }).sort(function (a, b) { return a.y - b.y; });
      for (j = 1; j < lab.length; j++) if (lab[j].y - lab[j - 1].y < 40) lab[j].y = lab[j - 1].y + 40;
      var ov = lab.length ? lab[lab.length - 1].y - (g.base - 10) : 0; if (ov > 0) lab.forEach(function (l) { l.y -= ov; });
      lab.forEach(function (l) {
        var s = d.series[l.k], lx = g.X(n - 1) + 16;
        ends += T(lx, l.y + 5, S.vs(s.values[n - 1]), { size: 15, w: 700, attrs: ' data-s="' + l.k + '"' }) + T(lx, l.y + 22, s.name, { size: g.fs, w: 500, fill: C.muted, attrs: ' data-s="' + l.k + '"' });
      });
    }
    var reveal = '';
    if (ns > 1) for (k = 0; k < ns; k++) for (j = 0; j < n; j++) { /* hovering a series shows every value on its line */
      if (j === n - 1 && g.endLab) continue;
      var px = g.X(j), py = g.Y(d.series[k].values[j]);
      reveal += '<circle class="rv" data-s="' + k + '" cx="' + r1(px) + '" cy="' + r1(py) + '" r="5" fill="' + cols[k] + '" stroke="#fff" stroke-width="2.5" pointer-events="none"/>' +
        T(px, py - 14, S.vs(d.series[k].values[j]), { size: 13, w: 700, a: 'middle', fill: labelFill(cols[k]), cls: 'rv', attrs: ' data-s="' + k + '" stroke="#fff" stroke-width="4" paint-order="stroke" stroke-linejoin="round" pointer-events="none"' });
    }
    svg += '<g clip-path="url(#' + S.id + 'c)">' + body + '</g><g class="fade">' + ends + '</g>' + reveal + hoverLayer(g, d, cols, null, S);
    var hv = { xs: d.cats.map(function (c, q) { return g.X(q); }), ys: d.cats.map(function (c, q) { return d.series.map(function (s) { return g.Y(s.values[q]); }); }), series: ns > 1,
      pick: function (ys, py) { var b = 0, bd = 1e9; ys.forEach(function (y, q) { var dd = Math.abs(y - py); if (dd < bd) { bd = dd; b = q; } }); return b; } };
    return { h: g.H, svg: svg, tips: xTips(d, S, cols, false, g), hover: hv, legend: ns > 1 ? { items: d.series.map(function (s, i) { return [s.name, cols[i]]; }), align: 'start', line: true } : null, aria: 'Line chart' };
  }
  function buildArea(d, S) {
    var d1 = { cats: d.cats, series: [d.series[0]] }, g = lineGeom(d1, Object.assign({}, S, { noEnd: true }), false), col = d.series[0].color || C.pink, n = g.n, j, svg = '';
    var xs = [], ys = []; for (j = 0; j < n; j++) { xs.push(g.X(j)); ys.push(g.Y(d1.series[0].values[j])); }
    svg += clipReveal(S.id + 'c', 0, 0, g.W + 20, g.H, 'x', S.anim);
    svg += lineAxes(g, d1, S, true);
    var a = '<path class="dl" data-s="0" d="M' + r1(xs[0]) + ' ' + r1(ys[0]) + curve(xs, ys) + ' L' + r1(xs[n - 1]) + ' ' + r1(g.base) + ' L' + r1(xs[0]) + ' ' + r1(g.base) + ' Z" fill="' + col + '"/>';
    for (j = 0; j < n; j++) a += '<line x1="' + r1(xs[j]) + '" x2="' + r1(xs[j]) + '" y1="' + g.top + '" y2="' + g.base + '" stroke="#fff" stroke-opacity=".55" stroke-width="1.5"/>';
    var lastTxt = S.vs(d1.series[0].values[n - 1]);
    svg += '<g clip-path="url(#' + S.id + 'c)">' + a + '</g><g class="fade">' + T(xs[n - 1], ys[n - 1] - 12, lastTxt, { size: 15, w: 700, a: 'end', fill: col }) + '</g>' + hoverLayer(g, d1, [col], null, S);
    return { h: g.H, svg: svg, tips: xTips(d1, S, [col], false, g), hover: { xs: xs, ys: ys.map(function (y) { return [y]; }) }, legend: null, aria: 'Area chart' };
  }
  function buildStackedArea(d, S) {
    var g = lineGeom(d, S, true), cols = colorsFor(d, S, 'stacked-area').cols, ns = g.ns, n = g.n, j, k, svg = '';
    var cum = []; for (k = 0; k < ns; k++) { cum.push([]); for (j = 0; j < n; j++) cum[k].push((k ? cum[k - 1][j] : 0) + d.series[k].values[j]); }
    var Xs = []; for (j = 0; j < n; j++) Xs.push(g.X(j));
    svg += clipReveal(S.id + 'c', 0, 0, g.W + 20, g.H, 'x', S.anim);
    svg += lineAxes(g, d, S, true);
    var body = '', hv = { xs: Xs, ys: [] };
    for (k = 0; k < ns; k++) {
      var top = cum[k].map(function (v) { return g.Y(v); }), bot = k ? cum[k - 1].map(function (v) { return g.Y(v); }) : null;
      var p = 'M' + r1(Xs[0]) + ' ' + r1(top[0]) + curve(Xs, top);
      p += bot ? ' L' + r1(Xs[n - 1]) + ' ' + r1(bot[n - 1]) + curve(Xs, bot, true) : ' L' + r1(Xs[n - 1]) + ' ' + r1(g.base) + ' L' + r1(Xs[0]) + ' ' + r1(g.base);
      body += '<path class="dl" data-s="' + k + '" d="' + p + ' Z" fill="' + cols[k] + '"/>';
      if (k < ns - 1) body += '<path data-s="' + k + '" d="M' + r1(Xs[0]) + ' ' + r1(top[0]) + curve(Xs, top) + '" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>';
    }
    for (j = 0; j < n; j++) { body += '<line x1="' + r1(Xs[j]) + '" x2="' + r1(Xs[j]) + '" y1="' + g.top + '" y2="' + g.base + '" stroke="#fff" stroke-opacity=".55" stroke-width="1.5"/>'; hv.ys.push(cum.map(function (c) { return g.Y(c[j]); })); }
    var reveal = '';
    for (k = 0; k < ns; k++) for (j = 0; j < n; j++) { /* hovering a layer shows every value inside it */
      var yt = g.Y(cum[k][j]), yb = k ? g.Y(cum[k - 1][j]) : g.base;
      if (yb - yt < 20) continue;
      var anc = j === 0 ? 'start' : j === n - 1 ? 'end' : 'middle', tx = j === 0 ? Xs[j] + 8 : j === n - 1 ? Xs[j] - 8 : Xs[j];
      reveal += T(tx, (yt + yb) / 2 + 5, S.vs(d.series[k].values[j]), { size: 14, w: 700, a: anc, fill: textOn(cols[k]), cls: 'rv', attrs: ' data-s="' + k + '" pointer-events="none"' });
    }
    svg += '<g clip-path="url(#' + S.id + 'c)">' + body + '</g>' + reveal + hoverLayer(g, d, cols, null, S);
    hv.series = true; hv.pick = function (ys, py) { var b = 0, bd = 1e9; ys.forEach(function (y, q) { var bot = q ? ys[q - 1] : g.base; if (py >= y && py <= bot) { b = q; bd = -1; } else if (bd >= 0) { var dd = Math.min(Math.abs(py - y), Math.abs(py - bot)); if (dd < bd) { bd = dd; b = q; } } }); return b; };
    return { h: g.H, svg: svg, tips: xTips(d, S, cols, true, g), hover: hv, legend: { items: d.series.map(function (s, i) { return [s.name, cols[i]]; }), align: 'start' }, aria: 'Stacked area chart' };
  }

  function hexMix(a, b, t) {
    var pa = [1, 3, 5].map(function (i) { return parseInt(a.substr(i, 2), 16); }), pb = [1, 3, 5].map(function (i) { return parseInt(b.substr(i, 2), 16); });
    return '#' + pa.map(function (v, i) { var x = Math.round(v + (pb[i] - v) * t).toString(16); return x.length < 2 ? '0' + x : x; }).join('');
  }
  function rampAt(t) { t = clamp(t, 0, 1) * (MAG.length - 1); var i = Math.min(MAG.length - 2, Math.floor(t)); return hexMix(MAG[i], MAG[i + 1], t - i); }

  function buildHeatmap(d, S) {
    var W = S.W, nr = d.cats.length, nc = d.series.length, fs = 15, tips = [], svg = '', all = [], A = S.anim;
    d.series.forEach(function (s) { all = all.concat(s.values); });
    var mx = Math.max.apply(null, all), mn = Math.min.apply(null, all), span = (mx - mn) || 1;
    var minCell = 44; d.series.forEach(function (s) { s.name.split(/\s+/).forEach(function (wd) { minCell = Math.max(minCell, Math.ceil(tw(wd, 13, 600)) + 12); }); });
    var rl0 = 0; d.cats.forEach(function (c) { rl0 = Math.max(rl0, tw(c, fs, 500)); }); rl0 = Math.min(Math.ceil(rl0) + 4, W * 0.24);
    var needN = Math.ceil(rl0 + 18 + nc * minCell);
    if (W < needN && !S.noMin) return buildHeatmap(d, Object.assign({}, S, { W: needN, noMin: true, targetH: S.targetH ? S.targetH * needN / W : 0 }));
    var rlw = rl0, cx0 = rlw + 18, cellW = Math.max(minCell, (W - cx0) / nc), hdrH = 34, gap = 4, cellH = 44;
    if (S.targetH) { var avail = S.targetH - hdrH; cellH = clamp((avail + gap) / nr - gap, 44, Math.max(44, cellW * 1.25)); }
    var hd = '', cells = '';
    d.series.forEach(function (s, j) { var hl = wrapText(s.name, cellW - 8, 13, 600, 2); hl.forEach(function (ln, li) { hd += T(cx0 + j * cellW + (cellW - gap) / 2, 13 - (hl.length - 1) * 8 + li * 16, ln, { size: 13, w: 600, a: 'middle' }); }); });
    d.cats.forEach(function (cat, i) {
      var y = hdrH + i * (cellH + gap);
      hd += T(0, y + cellH / 2 + 5, wrapText(cat, rlw, fs, 500, 1)[0], { size: fs });
      d.series.forEach(function (s, j) {
        var v = s.values[i], t = (v - mn) / span, fill = rampAt(t), ti = tips.length, x = cx0 + j * cellW, dl = (i + j) * 0.06, lab = S.vf(v);
        tips.push({ t: cat, rows: [{ c: fill, n: s.name, v: lab }], s: j });
        cells += Rc('data-m="' + ti + '" data-s="' + j + '" x="' + r1(x) + '" y="' + r1(y) + '" width="' + r1(cellW - gap) + '" height="' + r1(cellH) + '" rx="' + RAD + '" fill="' + fill + '"' + (A ? ' opacity="0"' : '') + ' data-notip="1"' + mark('', ti, cat + ', ' + s.name + ': ' + lab), A ? an('opacity', 0, 1, dl, 0.5) : '');
        cells += T(x + (cellW - gap) / 2, y + cellH / 2 + 5, lab, { size: fs, w: 700, a: 'middle', fill: t >= 0.6 ? C.white : C.ink100, cls: 'rv', attrs: ' data-m="' + ti + '" pointer-events="none"' });
      });
    });
    var H = hdrH + nr * (cellH + gap) - gap + 2;
    svg += '<g class="fade">' + hd + '</g>' + cells;
    var gr = { stops: MAG.slice(), labels: [S.vf(mn), S.vf((mn + mx) / 2), S.vf(mx)] };
    return { h: H, w: W, svg: svg, tips: tips, legend: { gradient: gr, align: 'start' }, aria: 'Heatmap' };
  }

  function buildTreemap(d, S) {
    var W = S.W, A = S.anim, items = d.cats.map(function (c, i) { return { name: c, value: Math.max(0, d.series[0].values[i]) }; }).filter(function (i) { return i.value > 0; }).sort(function (a, b) { return b.value - a.value; });
    var H = S.height || S.targetH || clamp(W * 0.5, 260, 440), gap = 4, tips = [], svg = '';
    var mag = items.length <= 7 ? MAG.slice(0, 7).reverse().slice(0, items.length) : magPick(items.length).slice().reverse(); /* biggest tile gets the darkest step: up to seven tiles walk straight down the pink ramp from Pink 80 */
    var rects = S.layoutSquare ? squarify(items, 0, 0, 100, 100).map(function (q) { return { it: q.it, x: q.x * W / 100, y: q.y * H / 100, w: q.w * W / 100, h: q.h * H / 100 }; }) : squarify(items, 0, 0, W, H), body = '', txt = ''; /* layout="square": tiles are laid out in a square and stretched to the chart */
    rects.forEach(function (q, i) {
      var c = mag[i], tc = textOn(c), ti = tips.length, dl = i * 0.1, lab = S.vf(q.it.value);
      tips.push({ t: q.it.name, rows: [{ c: c, n: d.series[0].name, v: lab }] });
      var x = q.x + gap / 2, y = q.y + gap / 2, w = q.w - gap, h = q.h - gap, op = A ? ' opacity="0"' : '', kid = A ? an('opacity', 0, 1, dl, 0.6) : '', showVal = false;
      if (w > 64 && h > 40) {
        var ls = wrapText(q.it.name, w - 32, 15, 600, h > 90 ? 2 : 1);
        ls.forEach(function (ln, li) { txt += T(x + 16, y + 29 + li * 18, ln, { size: 15, w: 600, fill: tc, attrs: ' data-m="' + ti + '" pointer-events="none"' + op, kids: kid }); });
        var big = w * h > 26000;
        if (h > (big ? 90 : 66)) { showVal = true; txt += T(x + 16, y + h - 16, lab, { size: big ? 28 : 20, w: 400, fill: tc, a: 'start', attrs: ' data-m="' + ti + '" pointer-events="none"' + op, kids: kid }); } /* the value is always visible, regular weight, bottom left */
      }
      body += Rc('data-m="' + ti + '" data-s="' + i + '" x="' + r1(x) + '" y="' + r1(y) + '" width="' + r1(w) + '" height="' + r1(h) + '" rx="' + RAD + '" fill="' + c + '"' + op + (showVal ? ' data-notip="1"' : '') + mark('', ti, q.it.name + ': ' + lab), kid);
    });
    svg += body + txt;
    return { h: H, svg: svg, tips: tips, legend: null, aria: 'Treemap' };
  }

  function sectorPath(P, R, r, A, B, rc) { /* an annular sector with softly rounded corners. A is the start angle, B the end angle, both in radians */
    var wid = A - B, c = Math.max(0, Math.min(rc, (R - r) / 3, wid * r * 0.4)), dO = c / R, dI = c / r;
    function pt(rad, t) { var p = P(rad, t); return r1(p[0]) + ' ' + r1(p[1]); }
    var big = wid > Math.PI ? 1 : 0;
    if (c < 0.5) return 'M' + pt(R, A) + 'A' + r1(R) + ' ' + r1(R) + ' 0 ' + big + ' 1 ' + pt(R, B) + 'L' + pt(r, B) + 'A' + r1(r) + ' ' + r1(r) + ' 0 ' + big + ' 0 ' + pt(r, A) + 'Z';
    return 'M' + pt(R, A - dO) + 'A' + r1(R) + ' ' + r1(R) + ' 0 ' + big + ' 1 ' + pt(R, B + dO) + 'Q' + pt(R, B) + ' ' + pt(R - c, B) + 'L' + pt(r + c, B) +
      'Q' + pt(r, B) + ' ' + pt(r, B + dI) + 'A' + r1(r) + ' ' + r1(r) + ' 0 ' + big + ' 0 ' + pt(r, A - dI) + 'Q' + pt(r, A) + ' ' + pt(r + c, A) + 'L' + pt(R - c, A) + 'Q' + pt(R, A) + ' ' + pt(R, A - dO) + 'Z';
  }
  function donutRamp(n) { /* five or more segments: the pink ramp from the darkest step down, the biggest segment darkest */
    var out = [], i; for (i = 0; i < n; i++) out.push(MAG[n <= 7 ? 8 - i : Math.round(8 - i * 8 / (n - 1))]); return out;
  }
  function donutText(c) { return (c === C.lime || c === C.grey || MAG.indexOf(c) > -1 && MAG.indexOf(c) < 4) ? C.ink100 : C.white; }

  function buildDonut(d, S) {
    var W = S.W, A = S.anim, segs = d.cats.map(function (c, i) { return { name: c, v: Math.max(0, d.series[0].values[i]) }; }), n = segs.length;
    if (n > 9 && window.console) console.warn('gwi-chart: half donuts use nine segments or fewer. Group the rest into "Other".');
    var cols = n <= 4 ? seriesColors(n) : donutRamp(Math.min(n, 9)), tot = segs.reduce(function (s, q) { return s + q.v; }, 0) || 1, tips = [], svg = '';
    var R = Math.max(110, W / 2 - 1), r = R * 0.29, cx = W / 2, cy = R + 2, rm = (R + r) / 2, lsz = clamp(R * 0.075, 15, 34);
    var th = Math.PI, arcs = '', labs = '', defs = '', P = function (rad, t) { return [cx + rad * Math.cos(t), cy - rad * Math.sin(t)]; };
    segs.forEach(function (sg, i) {
      var wid = sg.v / tot * Math.PI, t1 = th - wid, c = cols[i % cols.length], ti = tips.length, dl = i * 0.22, lab = S.vs(sg.v), share = sg.v / tot;
      var fits = wid > 0 && rm * wid >= tw(lab, lsz, 600) + 14 && (R - r) >= lsz * 1.3;
      tips.push({ t: sg.name, rows: [{ c: c, n: d.series[0].name, v: S.vf(sg.v) }].concat(S.pct ? [] : [{ c: null, n: 'Share', v: Math.round(share * 100) + '%' }]) });
      arcs += '<path data-m="' + ti + '" data-s="' + i + '" d="' + sectorPath(P, R, r, th, t1, 5) + '" fill="' + c + '" stroke="#fff" stroke-width="3" stroke-linejoin="round"' + (A ? ' opacity="0"' : '') + (fits ? ' data-notip="1"' : '') + mark('', ti, sg.name + ': ' + S.vf(sg.v)) + '>' + (A ? an('opacity', 0, 1, dl, 0.7) : '') + '</path>';
      if (fits) { /* the number sits on the segment and follows the curve of the ring */
        var a0 = P(rm, th), a1 = P(rm, t1), pid = S.id + 'a' + i;
        defs += '<path id="' + pid + '" d="M' + r1(a0[0]) + ' ' + r1(a0[1]) + ' A' + r1(rm) + ' ' + r1(rm) + ' 0 ' + (wid > Math.PI ? 1 : 0) + ' 1 ' + r1(a1[0]) + ' ' + r1(a1[1]) + '" fill="none"/>';
        labs += '<text data-m="' + ti + '" font-size="' + r1(lsz) + '" font-weight="600" fill="' + donutText(c) + '" pointer-events="none"' + (A ? ' opacity="0"' : '') + '><textPath href="#' + pid + '" startOffset="50%" text-anchor="middle" dy="0.35em">' + esc(lab) + '</textPath>' + (A ? an('opacity', 0, 1, dl + 0.35, 0.5) : '') + '</text>';
      }
      th = t1;
    });
    /* a rule, then the key in columns that read top to bottom */
    var ruleY = cy + 26, ktop = ruleY + 30, kc = W >= 480 ? 2 : 1, rows = Math.ceil(n / kc), rowH = 40, cw = W / kc, key = '<line x1="0" x2="' + W + '" y1="' + r1(ruleY) + '" y2="' + r1(ruleY) + '" stroke="' + C.grid + '" stroke-width="2"/>';
    segs.forEach(function (sg, i) {
      var col = Math.floor(i / rows), row = i % rows, kx = col * cw, ky = ktop + row * rowH;
      key += '<g data-m="' + i + '"><circle cx="' + r1(kx + 10) + '" cy="' + r1(ky + 10) + '" r="10" fill="' + cols[i % cols.length] + '"/>' + T(kx + 30, ky + 15, wrapText(sg.name, cw - 40, 16, 500, 1)[0], { size: 16, w: 500 }) + '</g>';
    });
    var H = ktop + (rows - 1) * rowH + 20 + 4;
    var center = S.pct ? T(cx, cy - 3, '%', { size: r * 0.85, w: 400, fill: C.ink, a: 'middle', cls: 'nopointer' }) : '';
    var hl = S.raw && S.raw.headline ? T(cx, cy - 6, S.raw.headline, { size: r * 0.62, w: 400, a: 'middle', cls: 'ovo' }) : '';
    svg += '<defs>' + defs + '</defs><g class="fade">' + center + hl + '</g>' + arcs + labs + '<g class="fade">' + key + '</g>';
    return { h: H, svg: svg, tips: tips, legend: null, aria: 'Half donut chart' };
  }

  /* ---------- Inline insights ----------
   * A small card with a big number, a rule, a statement and one animated visual. Types: inline-donut, inline-dots.
   * No title, key or buttons (the component hides them). The card is a background colour with rounded corners and padding:
   * --gwi-inline-bg, --gwi-inline-radius, --gwi-inline-pad, or background="neutral.20" (a design system token).
   * color="..." is the highlight and track-color="..." the rest, also design system token names. No hover, popup or focus: the animation is the only interaction. */
  function insightParse(d, S, hiDef) {
    var raw = S.raw || {}, v = Math.max(0, d.ds.v), tot = +raw.total > 0 ? +raw.total : (S.max || (S.pct || v <= 100 ? 100 : nice(v).max)); if (v > tot) tot = v;
    d.series[0].values = [v, tot - v];
    var col = tokColor(S.dsColor || raw.color, TOKENS[hiDef]), trk = tokColor(S.dsTrack || raw.trackColor, TOKENS['neutral.40']);
    return { v: v, tot: tot, share: v / tot, col: col, trk: trk, ink: contrastOnWhite(col) >= 3 ? col : C.ink, label: raw.label ? String(raw.label) : '', numTxt: S.vf(v), pct: S.pct };
  }
  function insightText(I, W, narrow, vis, cap) { /* number size, statement lines and the height of the text block */
    var LW = narrow ? W : W - vis - 40, sz = narrow ? clamp((W + 24) * 0.2, 56, 96) : clamp((W + 24) * 0.09, 48, 120); /* the 24 is the extra side padding of the card: the number keeps its size, the visual gets smaller */
    sz = Math.min(sz, Math.max(40, LW / (I.numTxt.length * 0.62)));
    var lines = I.label ? wrapText(I.label, cap ? Math.min(LW, cap) : LW, 16, 400, 7) : [], numH = sz * 0.72;
    return { sz: sz, LW: LW, lines: lines, numH: numH, Bk: numH + 21 + (lines.length ? 26 + (lines.length - 1) * 20 + 5 : 0) };
  }
  function insightTextSvg(I, X, base, ruleEnd, cd, o) { /* the number (counts up), the rule and the statement */
    o = o || {}; var ruleY = base + 21, nm = o.num || { x: 0, y: base, size: X.sz, a: 'start' }, num = T(nm.x, nm.y, I.numTxt, { size: nm.size, w: 400, fill: I.ink, cls: 'ovo', a: nm.a, attrs: ' data-cv="' + I.v + '" data-delay="0.1"' + (cd ? ' data-cd="' + cd + '"' : '') + ' data-suf="' + (I.pct ? '%' : '') + '" style="font-variant-numeric:lining-nums;letter-spacing:-0.02em" pointer-events="none"' });
    var small = '<line x1="0" x2="' + r1(ruleEnd) + '" y1="' + r1(ruleY) + '" y2="' + r1(ruleY) + '" stroke="' + I.ink + '" stroke-width="1" aria-hidden="true"/>';
    X.lines.forEach(function (ln, i) { small += T(0, ruleY + 26 + i * 20, ln, { size: 16, w: 400, fill: C.ink }); });
    return '<g class="fade">' + small + '</g>' + num;
  }

  /* inline-donut: a half donut, the highlighted part sweeps clockwise and stays at its end position. Defaults: pink.100 and neutral.40 */
  function buildInlineDonut(d, S) {
    var W = S.W, A = S.anim, I = insightParse(d, S, 'pink.100'), narrow = W < 560, R, cx, cy, H, base, X;
    R = narrow ? W / 2 - 1 : clamp(W * 0.24, 80, 240); X = insightText(I, W, narrow, 2 * R);
    if (narrow) { cx = W / 2; cy = R + 2; base = cy + 32 - 21; H = base + 21 + (X.lines.length ? 26 + (X.lines.length - 1) * 20 + 8 : 8); } /* narrow: the number goes in the hole */
    else { H = Math.max(R, X.Bk); cx = W - R; cy = H; base = (H - X.Bk) / 2 + X.numH; }
    var ruleY = base + 21, P = function (rad, t) { return [cx + rad * Math.cos(t), cy - rad * Math.sin(t)]; }, r = R * 0.56, rm = (R + r) / 2, t1 = Math.PI - I.share * Math.PI, gap = 4 / rm, id = S.id + 'm', hn = null;
    if (narrow) { var hsz = clamp(r * 0.8, 34, 76), nh; for (; hsz > 30; hsz -= 2) { nh = hsz * 0.72 + 4; if (r * r > nh * nh && I.numTxt.length * 0.62 * hsz <= 2 * Math.sqrt(r * r - nh * nh) * 0.92) break; } hn = { x: cx, y: cy - 6, size: hsz, a: 'middle' }; } /* a thin ring, softly rounded corners, a small gap between the two parts */
    var ruleEnd = narrow ? W : (cy - ruleY < R ? cx - Math.sqrt(R * R - (cy - ruleY) * (cy - ruleY)) : cx - R);
    var defs = '', rest = '', hi = '';
    if (I.share < 1 && (I.share === 0 || t1 - gap > 0.02)) rest = '<path class="nopointer" d="' + sectorPath(P, R, r, I.share > 0 ? t1 - gap : Math.PI, 0, RAD) + '" fill="' + I.trk + '" aria-hidden="true"/>';
    if (I.share > 0) {
      var a0 = P(rm, Math.PI), a1 = P(rm, t1);
      if (A) defs = '<mask id="' + id + '" maskUnits="userSpaceOnUse" x="0" y="0" width="' + r1(W) + '" height="' + r1(H) + '"><path d="M' + r1(a0[0]) + ' ' + r1(a0[1]) + ' A' + r1(rm) + ' ' + r1(rm) + ' 0 0 1 ' + r1(a1[0]) + ' ' + r1(a1[1]) +
        '" fill="none" stroke="#fff" stroke-width="' + r1(R - r + 6) + '" pathLength="1000" stroke-dasharray="1000 1000" stroke-dashoffset="1000">' + an('stroke-dashoffset', 1000, 0, 0.1, 0.8) + '</path></mask>';
      hi = '<path class="nopointer" d="' + sectorPath(P, R, r, Math.PI, t1, RAD) + '" fill="' + I.col + '"' + (A ? ' mask="url(#' + id + ')"' : '') + ' aria-hidden="true"/>';
    }
    return { h: H, svg: '<defs>' + defs + '</defs>' + insightTextSvg(I, X, base, ruleEnd, 0, hn ? { num: hn } : null) + rest + hi, tips: [], legend: null, aria: 'Half donut: ' + I.numTxt + (I.label ? ' ' + I.label : '') };
  }

  /* inline-dots: a 10 by 10 dot matrix, one dot per percent of the total. The highlighted dots fill the end of the grid and appear one by one
   * on load. Defaults: lime.50 and neutral.40 */
  function buildInlineDots(d, S) {
    var W = S.W, A = S.anim, I = insightParse(d, S, 'lime.50'), narrow = W < 560, side, X, H, gx, gy, base, hn = null;
    if (narrow) { /* the number sits left of the matrix, the rule and statement run under both */
      side = Math.min(W * 0.5, 200); X = insightText(I, W, true, 0); gx = W - side; gy = 0; base = side + 28 - 21; H = base + 21 + (X.lines.length ? 26 + (X.lines.length - 1) * 20 + 8 : 8);
      var nsz = clamp((W - side - 16) / (I.numTxt.length * 0.62), 34, 72); hn = { x: 0, y: nsz * 0.72, size: nsz, a: 'start' }; /* the top of the number lines up with the top of the matrix */
    }
    else {
      side = clamp(W * 0.245, 100, 200); X = insightText(I, W, false, side, 370); H = Math.max(side, X.Bk); /* the statement is held to 370px wide */
      if (H > side) { side = H; X = insightText(I, W, false, side, 370); H = Math.max(side, X.Bk); }
      side = H; gx = W - side; gy = 0; base = (H - X.Bk) / 2 + X.numH;
    }
    var p = side / 9.76, sq = p * 0.76, rx = sq * 0.25, nHi = Math.round(I.share * 100), nGrey = 100 - nHi, T2 = 0.85, stag = clamp(0.9 / Math.max(1, nHi), 0.006, 0.03), grey = '', over = '', k;
    for (k = 0; k < 100; k++) { /* all 100 grey dots ripple in first, then the highlighted ones turn on one by one, from the bottom right cell, right to left, upwards */
      var rr = Math.floor(k / 10), cc = k % 10, x = gx + cc * p, y = gy + rr * p, cl = 'class="nopointer" aria-hidden="true" rx="' + r1(rx) + '"';
      grey += '<rect ' + cl + ' x="' + r1(x) + '" y="' + r1(y) + '" width="' + r1(sq) + '" height="' + r1(sq) + '" fill="' + I.trk + '"' + (A ? ' opacity="0">' + an('opacity', 0, 1, 0.1 + ((9 - rr) + (9 - cc)) / 18 * 0.35, 0.25) + '</rect>' : '/>');
      if (k >= nGrey) { /* a hair larger than the grey dot under it, so no grey edge shows */
        over += '<rect ' + cl + ' x="' + r1(x - 0.3) + '" y="' + r1(y - 0.3) + '" width="' + r1(sq + 0.6) + '" height="' + r1(sq + 0.6) + '" fill="' + I.col + '"' + (A ? ' opacity="0">' + an('opacity', 0, 1, T2 + (99 - k) * stag, 0.2) + '</rect>' : '/>');
      }
    }
    var ruleEnd = narrow ? W : gx - 10;
    return { h: H, svg: insightTextSvg(I, X, base, ruleEnd, T2 - 0.1, hn ? { num: hn } : null) + grey + over, tips: [], legend: null, aria: 'Dot matrix: ' + I.numTxt + (I.label ? ' ' + I.label : '') };
  }

  function buildSankey(d, S) {
    var W = S.W, A = S.anim, sk = d.sk, nodes = sk.nodes, links = sk.links, N = nodes.length, L = links.length, i, j, tips = [], svg = '';
    var stages = (S.raw && S.raw.stages) || null, nodeW = 14, pad = 14, top = stages ? 36 : 2, bot = 2;
    /* columns: longest path from a source, unless a node sets its own column */
    var col = nodes.map(function (n) { return n.column != null ? +n.column : 0; }), fixed = nodes.map(function (n) { return n.column != null; });
    for (var it = 0; it < N + 1; it++) links.forEach(function (l) { if (!fixed[l.t] && col[l.t] < col[l.s] + 1) col[l.t] = col[l.s] + 1; });
    var nc = Math.max.apply(null, col) + 1, cols = []; for (i = 0; i < nc; i++) cols.push([]);
    nodes.forEach(function (n, k) { n.i = k; n.c = col[k]; n.inV = 0; n.outV = 0; n.ins = []; n.outs = []; });
    links.forEach(function (l, k) { l.k = k; nodes[l.s].outV += l.v; nodes[l.t].inV += l.v; nodes[l.s].outs.push(l); nodes[l.t].ins.push(l); });
    nodes.forEach(function (n) { n.v = Math.max(n.inV, n.outV) || 0; cols[n.c].push(n); });
    /* labels, and the width reserved for the last column's labels */
    var labW = function (n) { return tw(n.name, 14, 500); }, lastW = 0; cols[nc - 1].forEach(function (n) { lastW = Math.max(lastW, labW(n) + 10 + tw(S.vf(n.v), 14, 700)); });
    lastW = Math.min(Math.ceil(lastW) + 12, W * 0.34);
    var minGap = 130, need = Math.ceil((nc - 1) * minGap + nodeW + lastW);
    if (W < need && !S.noMin && nc > 1) return buildSankey(d, Object.assign({}, S, { W: need, noMin: true, targetH: S.targetH ? S.targetH * need / W : 0 }));
    var maxCnt = 0, cnt; cols.forEach(function (c) { maxCnt = Math.max(maxCnt, c.length); });
    var H0 = S.height || S.targetH || clamp(W * 0.7, 340, 620), H = Math.max(H0, top + bot + maxCnt * 26 + (maxCnt - 1) * pad);
    var avail = H - top - bot, ky = 1e9; cols.forEach(function (c) { var tot = c.reduce(function (s, n) { return s + n.v; }, 0); if (tot > 0) ky = Math.min(ky, (avail - (c.length - 1) * pad) / tot); });
    nodes.forEach(function (n) { n.h = Math.max(4, n.v * ky); });
    function stack() { cols.forEach(function (c) { var tot = c.reduce(function (s, n) { return s + n.h; }, 0) + (c.length - 1) * pad, y = top + Math.max(0, (avail - tot) / 2); c.forEach(function (n) { n.y = y; y += n.h + pad; }); }); }
    cols[0].sort(function (a, b) { return b.v - a.v; }); for (i = 1; i < nc; i++) cols[i].sort(function (a, b) { return b.v - a.v; }); stack();
    function bary(n, side) { var ls = side === 'in' ? n.ins : n.outs, s = 0, w = 0; ls.forEach(function (l) { var o = nodes[side === 'in' ? l.s : l.t]; s += (o.y + o.h / 2) * l.v; w += l.v; }); return w ? s / w : n.y + n.h / 2; }
    for (it = 0; it < 6; it++) { /* sweep forward then back to untangle the crossings */
      for (i = 1; i < nc; i++) { cols[i].forEach(function (n) { n.b = bary(n, 'in'); }); cols[i].sort(function (a, b) { return a.b - b.b; }); stack(); }
      for (i = nc - 2; i >= 0; i--) { cols[i].forEach(function (n) { n.b = bary(n, 'out'); }); cols[i].sort(function (a, b) { return a.b - b.b; }); stack(); }
    }
    /* colours: the first column takes the series colours, every other node follows its biggest source */
    var first = cols[0].slice().sort(function (a, b) { return b.v - a.v; }), pal = first.length <= 4 ? seriesColors(first.length) : magPick(first.length).slice().reverse();
    first.forEach(function (n, k) { n.color = nodes[n.i].colorHint || pal[k]; });
    for (i = 1; i < nc; i++) cols[i].forEach(function (n) { var best = null; n.ins.forEach(function (l) { if (!best || l.v > best.v) best = l; }); n.color = n.colorHint || (best ? nodes[best.s].color : C.grey); });
    /* x positions */
    var span = nc > 1 ? (W - nodeW - lastW) / (nc - 1) : 0;
    nodes.forEach(function (n) { n.x = n.c * span; });
    /* link offsets inside each node, ordered by where the other end sits */
    nodes.forEach(function (n) {
      n.outs.sort(function (a, b) { return nodes[a.t].y - nodes[b.t].y; }); n.ins.sort(function (a, b) { return nodes[a.s].y - nodes[b.s].y; });
      var o = 0; n.outs.forEach(function (l) { l.w = Math.max(1, l.v * ky); l.y0 = n.y + o; o += l.w; });
      var q = 0; n.ins.forEach(function (l) { l.w = Math.max(1, l.v * ky); l.y1 = n.y + q; q += l.w; });
    });
    var rel = {}; /* what stays in colour when something is hovered */
    nodes.forEach(function (n) { var r = [n.i]; n.outs.concat(n.ins).forEach(function (l) { r.push(N + l.k); r.push(l.s); r.push(l.t); }); rel[n.i] = r; });
    links.forEach(function (l) { rel[N + l.k] = [N + l.k, l.s, l.t]; });
    var lg = '', ng = '', tg = '', vg = '';
    var clipId = S.id + 'sk';
    links.forEach(function (l) {
      var a = nodes[l.s], b = nodes[l.t], x0 = a.x + nodeW, x1 = b.x, xm = (x0 + x1) / 2, ti = N + l.k, lab = a.name + ' to ' + b.name + ': ' + S.vf(l.v);
      tips.push({ t: a.name + ' to ' + b.name, rows: [{ c: a.color, n: 'Flow', v: S.vf(l.v) }] });
      var y0b = l.y0 + l.w, y1b = l.y1 + l.w;
      lg += '<path data-m="' + ti + '" data-notip="1"' + mark('', ti, lab) + ' d="M' + r1(x0) + ' ' + r1(l.y0) + ' C' + r1(xm) + ' ' + r1(l.y0) + ' ' + r1(xm) + ' ' + r1(l.y1) + ' ' + r1(x1) + ' ' + r1(l.y1) + ' L' + r1(x1) + ' ' + r1(y1b) + ' C' + r1(xm) + ' ' + r1(y1b) + ' ' + r1(xm) + ' ' + r1(y0b) + ' ' + r1(x0) + ' ' + r1(y0b) + ' Z" fill="' + a.color + '" fill-opacity=".45"/>';
      vg += T(x0 + (x1 - x0) * 0.576, l.y0 + (l.y1 - l.y0) * 0.648 + l.w / 2 + 5, S.vf(l.v), { size: 14, w: 700, a: 'middle', cls: 'rv halo', attrs: ' data-m="' + ti + '" pointer-events="none"' });
    });
    nodes.forEach(function (n) {
      var dl = n.c * 0.3, op = A ? ' opacity="0"' : '', kid = A ? an('opacity', 0, 1, dl, 0.5) : '', cy = n.y + n.h / 2, lx = n.x + nodeW + 10;
      tips[n.i] = { t: n.name, rows: [{ c: n.color, n: 'Total', v: S.vf(n.v) }] };
      var rr = Math.min(4, n.h / 2), x = n.x, y = n.y, w = nodeW, h = n.h, nd;
      if (n.ins.length && n.outs.length || !(n.ins.length || n.outs.length)) nd = 'M' + x + ' ' + r1(y) + 'H' + (x + w) + 'V' + r1(y + h) + 'H' + x + 'Z';
      else if (!n.ins.length) nd = 'M' + (x + rr) + ' ' + r1(y) + 'H' + (x + w) + 'V' + r1(y + h) + 'H' + (x + rr) + 'A' + rr + ' ' + rr + ' 0 0 1 ' + x + ' ' + r1(y + h - rr) + 'V' + r1(y + rr) + 'A' + rr + ' ' + rr + ' 0 0 1 ' + (x + rr) + ' ' + r1(y) + 'Z';
      else nd = 'M' + x + ' ' + r1(y) + 'H' + (x + w - rr) + 'A' + rr + ' ' + rr + ' 0 0 1 ' + (x + w) + ' ' + r1(y + rr) + 'V' + r1(y + h - rr) + 'A' + rr + ' ' + rr + ' 0 0 1 ' + (x + w - rr) + ' ' + r1(y + h) + 'H' + x + 'Z';
      ng += '<path data-m="' + n.i + '" data-notip="1"' + mark('', n.i, n.name + ': ' + S.vf(n.v)) + ' d="' + nd + '" fill="' + n.color + '"' + op + '>' + kid + '</path>'; /* only the outer side is rounded: the side that touches the ribbons stays flat */
      tg += T(lx, cy + 5, n.name, { size: 14, w: 500, cls: 'halo', attrs: ' data-m="' + n.i + '" pointer-events="none"' + op, kids: kid });
      tg += T(lx + tw(n.name, 14, 500) + 8, cy + 5, S.vf(n.v), { size: 14, w: 700, cls: 'rv halo', attrs: ' data-m="' + n.i + '" pointer-events="none"' });
    });
    if (stages) cols.forEach(function (c, k) { if (stages[k] != null) svg += T(k * span, 16, stages[k], { size: 16, w: 700, fill: C.ink, a: 'start', cls: 'fade' }); });
    svg += clipReveal(clipId, 0, 0, W, H, 'x', A, 0.15) + '<g clip-path="url(#' + clipId + ')">' + lg + '</g>' + ng + tg + vg;
    return { h: H, w: W, svg: svg, tips: tips, rel: rel, legend: null, aria: 'Sankey diagram' };
  }

  /* ---------- dot plot: the same marks as the dumbbell reference, one row per category ---------- */
  function buildDotPlot(d, S) {
    var W = S.W, A = S.anim, nr = d.cats.length, ns = d.series.length, cols = colorsFor(d, S, 'dot-plot').cols, tips = [], svg = '', fs = 15;
    var narrow = W < 460, maxLab = 0; d.cats.forEach(function (c) { maxLab = Math.max(maxLab, tw(c, fs, 500)); });
    var lw = narrow ? 0 : Math.min(Math.ceil(maxLab) + 4, W * 0.3), x0 = narrow ? (S.pct ? Math.ceil(symW('diag')) + 12 : 0) : lw + 24 + (S.pct ? Math.ceil(symW('diag')) + 12 : 0), xr = W - 14, labH = narrow ? 24 : 0;
    var lo = 0; d.series.forEach(function (s) { s.values.forEach(function (v) { if (v < lo) lo = v; }); });
    var dom = S.max || (S.pct && dataMax(d) <= 100 ? 100 : nice(dataMax(d)).max), X = function (v) { return x0 + (v - lo) / ((dom - lo) || 1) * (xr - x0); };
    var rad = narrow ? 5.5 : 7, top = 4, valY = 24;
    var p = S.targetH && nr > 1 ? clamp((S.targetH - top - labH - valY - rad - 6) / (nr - 1) - labH, 58, 84) : 58, pitch = p + labH;
    var H = top + (nr - 1) * pitch + labH + valY + rad * 2 + 6, grid = '', conn = '', dots = '', vals = '', rest = '';
    d.cats.forEach(function (cat, i) {
      var yc = top + i * pitch + labH + valY + rad, ti = tips.length, dl = i * 0.07;
      var items = d.series.map(function (s, k) { var v = s.values[i]; return { k: k, v: v, x: X(v), w: tw(S.vs(v), 15, 700), cx: X(v) }; }).sort(function (a, b) { return a.x - b.x; });
      var minX = items[0].x, maxX = items[items.length - 1].x;
      for (var pass = 0; pass < 3; pass++) for (var q = 1; q < items.length; q++) { var gap = items[q].cx - items[q - 1].cx - (items[q].w + items[q - 1].w) / 2 - 8; if (gap < 0) { items[q - 1].cx += gap / 2; items[q].cx -= gap / 2; } }
      tips.push({ t: cat, rows: d.series.map(function (s, k) { return { c: cols[k], n: s.name, v: S.vf(s.values[i]) }; }) });
      if (S.pct && i === 0) rest += sym('diag', x0 - symW('diag') / 2 - 8, yc - 9);
      grid += '<line x1="' + r1(x0) + '" x2="' + W + '" y1="' + r1(yc) + '" y2="' + r1(yc) + '" stroke="' + C.grid + '" stroke-width="1"/>';
      rest += narrow ? T(0, yc - valY - rad + 4, cat, { size: 14, w: 600, attrs: ' data-m="' + ti + '"' }) : T(0, yc + 5, wrapText(cat, lw, fs, 500, 1)[0], { size: fs, attrs: ' data-m="' + ti + '"' });
      if (ns > 1) conn += '<rect data-m="' + ti + '" x="' + r1(minX) + '" y="' + r1(yc - rad) + '" width="' + (A ? 0 : r1(maxX - minX)) + '" height="' + rad * 2 + '" rx="' + rad + '" fill="' + C.axis + '" fill-opacity=".6">' + (A ? an('width', 0, r1(maxX - minX), dl, 0.6) : '') + '</rect>';
      items.slice().sort(function (a, b) { return a.k - b.k; }).forEach(function (it) {
        dots += '<circle data-m="' + ti + '" data-s="' + it.k + '" cx="' + r1(A ? minX : it.x) + '" cy="' + r1(yc) + '" r="' + rad + '" fill="' + cols[it.k] + '" stroke="#fff" stroke-width="2">' + (A ? an('cx', r1(minX), r1(it.x), dl + 0.1, 0.8) : '') + '</circle>';
        var lx = clamp(it.cx, it.w / 2, W - it.w / 2);
        vals += T(lx, yc - rad - 8, S.vs(it.v), { size: 15, w: 700, a: 'middle', fill: labelFill(cols[it.k]), cls: 'rv', attrs: ' data-m="' + ti + '" data-s="' + it.k + '" pointer-events="none"' });
      });
      rest += '<rect class="hit" x="0" y="' + r1(yc - valY - rad - 6) + '" width="' + W + '" height="' + r1(valY + rad * 2 + 14) + '" fill="transparent" data-notip="1"' + mark('', ti, cat + ': ' + d.series.map(function (s) { return s.name + ' ' + S.vf(s.values[i]); }).join(', ')) + '/>';
    });
    svg += '<g class="fade">' + grid + '</g>' + conn + dots + vals + rest;
    return { h: H, svg: svg, tips: tips, seriesFocus: false, legend: ns > 1 ? { items: d.series.map(function (s, i) { return [s.name, cols[i]]; }), align: 'start', dot: true } : null, aria: 'Dot plot' };
  }

  /* ---------- scatter plot ---------- */
  function niceDom(lo, hi, cap) {
    var span = (hi - lo) || Math.abs(hi) || 1, pad = span * 0.12, olo = lo; lo -= pad; hi += pad;
    var raw = (hi - lo) / 5, p = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10)), f = raw / p, st = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
    var a = Math.floor(lo / st + 1e-9) * st, b = Math.ceil(hi / st - 1e-9) * st;
    if (cap != null && b > cap) b = cap; if (a < 0 && olo >= 0) a = 0;
    var ticks = []; for (var v = a; v <= b + st * 1e-6; v += st) ticks.push(Math.round(v / st) * st);
    return { a: a, b: b, ticks: ticks };
  }
  function buildScatter(d, S) {
    var W = S.W, A = S.anim, sc = d.sc, pts = sc.pts, n = pts.length, tips = [], svg = '', fs = 14, ng = sc.groups.length;
    var cols = ng > 1 ? seriesColors(ng) : [C.pink];
    var xs = pts.map(function (q) { return q.x; }), ys = pts.map(function (q) { return q.y; });
    var capX = S.pct && Math.max.apply(null, xs) <= 100 ? 100 : null, capY = S.pct && Math.max.apply(null, ys) <= 100 ? 100 : null;
    var dx = niceDom(Math.min.apply(null, xs), Math.max.apply(null, xs), capX), dy = niceDom(Math.min.apply(null, ys), Math.max.apply(null, ys), capY);
    var ylw = 0; dy.ticks.forEach(function (t) { ylw = Math.max(ylw, tw(S.fmtN(t), fs, 500)); });
    var ml = Math.ceil(ylw) + 16 + (sc.yLabel ? 24 : 0), mr = Math.ceil(tw(S.fmtN(dx.ticks[dx.ticks.length - 1]), fs, 500) / 2) + 2, top = 10, bot = 30 + (sc.xLabel ? 32 : 0);
    var pw = W - ml - mr, ph = S.height || (S.targetH ? Math.max(200, S.targetH - top - bot) : clamp(W * 0.56, 240, 520)), H = top + ph + bot;
    var X = function (v) { return ml + (v - dx.a) / ((dx.b - dx.a) || 1) * pw; }, Y = function (v) { return top + ph - (v - dy.a) / ((dy.b - dy.a) || 1) * ph; };
    var grid = '';
    dx.ticks.forEach(function (t) { grid += '<line x1="' + r1(X(t)) + '" x2="' + r1(X(t)) + '" y1="' + top + '" y2="' + (top + ph) + '" stroke="' + C.axis + '" stroke-width="1"/>' + T(X(t), top + ph + 22, S.fmtN(t), { size: fs, fill: C.soft, a: 'middle' }); });
    dy.ticks.forEach(function (t) { grid += '<line x1="' + ml + '" x2="' + r1(ml + pw) + '" y1="' + r1(Y(t)) + '" y2="' + r1(Y(t)) + '" stroke="' + C.axis + '" stroke-width="1"/>' + T(ml - 10, Y(t) + 5, S.fmtN(t), { size: fs, fill: C.soft, a: 'end' }); });
    if (sc.yLabel) grid += T(top + 2, -4, sc.yLabel, { size: 16, w: 700, attrs: ' transform="rotate(90)"' });
    if (sc.xLabel) grid += T(W, top + ph + 56, sc.xLabel, { size: 16, w: 700, a: 'end' });
    var rpt = W < 480 ? 5.5 : 7, dots = pts.map(function (q) { return { x: X(q.x), y: Y(q.y) }; }), placed = [], out = '';
    function hit(b, o) { return b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1]; }
    pts.forEach(function (q, i) {
      var p0 = dots[i], w = tw(q.name, fs, 500), col = cols[q.gi % cols.length], dl = i * 0.05, ti = tips.length;
      var cands = [
        { a: 'start', x: p0.x + rpt + 6, y: p0.y + 5, b: [p0.x + rpt + 6, p0.y - 9, p0.x + rpt + 6 + w, p0.y + 9] },
        { a: 'end', x: p0.x - rpt - 6, y: p0.y + 5, b: [p0.x - rpt - 6 - w, p0.y - 9, p0.x - rpt - 6, p0.y + 9] },
        { a: 'middle', x: p0.x, y: p0.y - rpt - 7, b: [p0.x - w / 2, p0.y - rpt - 20, p0.x + w / 2, p0.y - rpt - 4] },
        { a: 'middle', x: p0.x, y: p0.y + rpt + 19, b: [p0.x - w / 2, p0.y + rpt + 6, p0.x + w / 2, p0.y + rpt + 22] }], best = null, bs = 1e9;
      cands.forEach(function (c) {
        var s = 0; if (c.b[0] < ml - 2 || c.b[2] > W || c.b[1] < top - 4 || c.b[3] > top + ph + 4) s += 1000;
        placed.forEach(function (o) { if (hit(c.b, o)) s += 100; });
        dots.forEach(function (o, j) { if (j !== i && hit(c.b, [o.x - rpt, o.y - rpt, o.x + rpt, o.y + rpt])) s += 100; });
        if (s < bs) { bs = s; best = c; }
      });
      placed.push(best.b);
      var rows = [{ c: col, n: sc.xLabel || 'X', v: S.fmtN(q.x) }, { c: col, n: sc.yLabel || 'Y', v: S.fmtN(q.y) }];
      tips.push({ t: q.name, rows: rows });
      out += '<circle data-m="' + ti + '" data-s="' + q.gi + '" cx="' + r1(p0.x) + '" cy="' + r1(p0.y) + '" r="' + (A ? 0 : rpt) + '" fill="' + col + '"' + mark('', ti, q.name + ': ' + (sc.xLabel || 'X') + ' ' + S.fmtN(q.x) + ', ' + (sc.yLabel || 'Y') + ' ' + S.fmtN(q.y)) + '>' + (A ? an('r', 0, rpt, dl, 0.45) : '') + '</circle>';
      out += T(best.x, best.y, q.name, { size: fs, w: 500, fill: C.muted, a: best.a, attrs: ' data-m="' + ti + '" data-s="' + q.gi + '" pointer-events="none"' + (A ? ' opacity="0"' : ''), kids: A ? an('opacity', 0, 1, dl + 0.3, 0.4) : '' });
    });
    svg += '<g class="fade">' + grid + '</g>' + out;
    return { h: H, svg: svg, tips: tips, legend: ng > 1 ? { items: sc.groups.map(function (g, i) { return [g, cols[i]]; }), align: 'start', dot: true } : null, aria: 'Scatter plot' };
  }

  /* ---------- slope chart ---------- */
  function slopeCurve(pts) { /* S-curves with level tangents at every dot, so the lines flow */
    var o = 'M' + r1(pts[0][0]) + ' ' + r1(pts[0][1]);
    for (var i = 1; i < pts.length; i++) { var a = pts[i - 1], b = pts[i], m = (a[0] + b[0]) / 2; o += 'C' + r1(m) + ' ' + r1(a[1]) + ' ' + r1(m) + ' ' + r1(b[1]) + ' ' + r1(b[0]) + ' ' + r1(b[1]); }
    return o;
  }
  function buildSlope(d, S) {
    var W = S.W, A = S.anim, nr = d.cats.length, ns = d.series.length, tips = [], svg = '', fs = 15;
    var hl = S.highlight !== '' && S.highlight != null ? (isNaN(+S.highlight) ? d.cats.indexOf(S.highlight) : +S.highlight) : null;
    var lmax = 0, rmax = 0; d.cats.forEach(function (c, i) { lmax = Math.max(lmax, tw(c, fs, 500) + 8 + tw(S.vs(d.series[0].values[i]), fs, 700)); rmax = Math.max(rmax, tw(c, fs, 500) + 8 + tw(S.vs(d.series[ns - 1].values[i]), fs, 700)); });
    var lw = Math.min(Math.ceil(lmax) + 18, W * 0.36), rw = Math.min(Math.ceil(rmax) + 18, W * 0.36), need = lw + rw + 140;
    if (W < need && !S.noMin) return buildSlope(d, Object.assign({}, S, { W: need, noMin: true, targetH: S.targetH ? S.targetH * need / W : 0 }));
    var xa = lw, xb = W - rw, top = S.pct ? Math.ceil(symH('top')) + 40 : 34;
    var all = []; d.series.forEach(function (s) { all = all.concat(s.values); });
    var mn = Math.min.apply(null, all), mx = Math.max.apply(null, all), pad = (mx - mn) * 0.06 || 1, lo = mn >= 0 ? Math.max(0, mn - pad) : mn - pad, hi = mx + pad;
    var Hp = Math.max(nr * 22, S.height || (S.targetH ? S.targetH - top - 6 : clamp(W * 0.7, 300, 560))), H = top + Hp + 6;
    var Y = function (v) { return top + Hp - (v - lo) / ((hi - lo) || 1) * Hp; }, XK = function (k) { return ns > 1 ? xa + k * (xb - xa) / (ns - 1) : xa; };
    function spread(arr) { arr.sort(function (a, b) { return a.y - b.y; }); arr.forEach(function (a) { a.ly = a.y; });
      for (var it = 0; it < 40; it++) { var mv = false; for (var q = 1; q < arr.length; q++) { var g = arr[q].ly - arr[q - 1].ly - 20; if (g < 0) { arr[q - 1].ly += g / 2; arr[q].ly -= g / 2; mv = true; } } if (!mv) break; }
      arr.forEach(function (a) { a.ly = clamp(a.ly, top + 4, top + Hp - 4); }); }
    var L = d.cats.map(function (c, i) { return { i: i, y: Y(d.series[0].values[i]) }; }), R_ = d.cats.map(function (c, i) { return { i: i, y: Y(d.series[ns - 1].values[i]) }; });
    spread(L); spread(R_); var ly = {}, ry = {}; L.forEach(function (a) { ly[a.i] = a.ly; }); R_.forEach(function (a) { ry[a.i] = a.ly; });
    var order = d.cats.map(function (c, i) { return i; }).sort(function (a, b) { return (a === hl) - (b === hl); }); /* the highlighted line is drawn last, on top */
    var lines = '', labs = '', rest = '', head = '';
    d.series.forEach(function (s, k) { head += T(XK(k), 18, s.name, { size: 13, w: 600, fill: C.muted, a: 'middle' }); });
    if (S.pct) { var fi = L[0].i, fv = S.vs(d.series[0].values[fi]); head += sym('top', xa - 14 - tw(fv, fs, 700) / 2, ly[fi] - 6 - symH('top') / 2 - 6); }
    order.forEach(function (i) {
      var cat = d.cats[i], col = hl == null || i === hl ? C.pink : C.grey, ti = tips.length, dl = 0.5 + i * 0.04, lab = hl == null || i === hl ? C.ink : C.muted;
      tips.push({ t: cat, rows: d.series.map(function (s) { return { c: col, n: s.name, v: S.vf(s.values[i]) }; }) });
      var pts = d.series.map(function (s, k) { return [XK(k), Y(s.values[i])]; });
      lines += '<path data-m="' + ti + '" d="' + slopeCurve(pts) + '" fill="none" stroke="' + col + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>';
      pts.forEach(function (q) { lines += '<circle data-m="' + ti + '" cx="' + r1(q[0]) + '" cy="' + r1(q[1]) + '" r="6.5" fill="' + col + '" stroke="#fff" stroke-width="2"/>'; });
      var lv = S.vs(d.series[0].values[i]), rv = S.vs(d.series[ns - 1].values[i]), fade = { attrs: '', kids: '' };
      function tx(x, y, s, o) { o.attrs = ' data-m="' + ti + '" pointer-events="none"' + (A ? ' opacity="0"' : ''); o.kids = A ? an('opacity', 0, 1, dl, 0.4) : ''; return T(x, y, s, o); }
      labs += tx(xa - 14, ly[i] + 5, lv, { size: fs, w: 700, a: 'end', fill: lab }) + tx(xa - 14 - tw(lv, fs, 700) - 8, ly[i] + 5, cat, { size: fs, w: 500, a: 'end', fill: lab });
      labs += tx(xb + 14, ry[i] + 5, rv, { size: fs, w: 700, fill: lab }) + tx(xb + 14 + tw(rv, fs, 700) + 8, ry[i] + 5, cat, { size: fs, w: 500, fill: lab });
      rest += '<path class="hit" d="' + slopeCurve(pts) + '" fill="none" stroke="transparent" stroke-width="16" pointer-events="stroke" data-notip="1"' + mark('', ti, cat + ': ' + d.series.map(function (s) { return s.name + ' ' + S.vf(s.values[i]); }).join(', ')) + '/>';
    });
    svg += clipReveal(S.id + 'sl', 0, 0, W, H, 'x', A, 0.1) + '<g class="fade">' + head + '</g><g clip-path="url(#' + S.id + 'sl)">' + lines + '</g>' + labs + rest;
    return { h: H, w: W, svg: svg, tips: tips, legend: null, aria: 'Slope chart' };
  }

  var BUILD = { bar: buildBar, column: buildColumn, 'stacked-bar': buildStackedBar, 'stacked-column': buildStackedColumn, line: buildLine, area: buildArea, 'stacked-area': buildStackedArea, heatmap: buildHeatmap, treemap: buildTreemap, sankey: buildSankey, scatter: buildScatter, 'dot-plot': buildDotPlot, slope: buildSlope, 'half-donut': buildDonut, 'inline-donut': buildInlineDonut, 'inline-dots': buildInlineDots };

  /* ---------- big number + tiles (HTML, not SVG) ---------- */
  function countUp(el, text) {
    var m = /^([^\d\-]*)(-?[\d.,]+)(.*)$/.exec(text);
    if (!m) { el.textContent = text; return; }
    var pre = m[1], raw = m[2].replace(/,/g, ''), suf = m[3], target = parseFloat(raw), dec = (raw.split('.')[1] || '').length, t0 = null;
    if (!isFinite(target)) { el.textContent = text; return; }
    function f(ts) {
      if (t0 === null) t0 = ts; var p = Math.min(1, (ts - t0) / 900), e = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + (target * e).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf;
      if (p < 1) requestAnimationFrame(f); else el.textContent = text;
    }
    requestAnimationFrame(f);
  }
  function sparkline(vals, labels) {
    var w = 132, h = 44, mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals), rng = (mx - mn) || 1;
    var pts = vals.map(function (v, i) { return [6 + i * (w - 12) / Math.max(1, vals.length - 1), h - 6 - (v - mn) / rng * (h - 12)]; });
    var last = pts[pts.length - 1];
    return '<svg class="spark" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Trend, latest value ' + vals[vals.length - 1] + '" data-vals="' + esc(JSON.stringify(vals)) + '" data-labels="' + esc(JSON.stringify(labels || [])) + '">' +
      '<path pathLength="1" d="M' + pts.map(function (p) { return r1(p[0]) + ' ' + r1(p[1]); }).join(' L') + '" fill="none" stroke="' + C.grey + '" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle class="sd" cx="' + r1(last[0]) + '" cy="' + r1(last[1]) + '" r="5" fill="' + C.pink + '" stroke="#F9F7F6" stroke-width="2.5"/></svg>';
  }

  /* ---------- the element ---------- */
  /* ---------- CSS custom properties: inline styling from the embed ----------
   * Every colour token, the pink ramp, the corner radius, the fonts, the big-number and title sizes, a few gaps and the button shape
   * can be overridden from outside, per chart or site-wide:  <gwi-chart style="--gwi-pink:#0055FF;--gwi-radius:0px" ...>  (list in README-v1.2.md).
   * The stylesheet reads the variables directly. For colours drawn into the SVG, _tok() points each token colour at its variable. */
  var TOKS = [[C.pink, '--gwi-pink'], [C.lime, '--gwi-lime'], [C.deep, '--gwi-deep'], [C.dlime, '--gwi-dlime'], [C.ink, '--gwi-ink'], [C.ink100, '--gwi-ink-strong'], [C.muted, '--gwi-muted'], [C.soft, '--gwi-soft'], [C.grid, '--gwi-grid'], [C.track, '--gwi-track'], [C.axis, '--gwi-axis'], [C.grey, '--gwi-grey']];
  MAG.forEach(function (h, i) { if (i !== 6) TOKS.push([h, '--gwi-ramp-' + (i + 1)]); }); /* step 7 of the ramp is the brand pink */
  var TOKMAP = {}, VARNAMES = ['--gwi-radius', '--gwi-font', '--gwi-number-font', '--gwi-title-size', '--gwi-title-weight', '--gwi-sub-size', '--gwi-stat-size', '--gwi-stat-label-size', '--gwi-stats-cols', '--gwi-stats-gap', '--gwi-stat-bar-height', '--gwi-head-gap', '--gwi-foot-gap', '--gwi-btn-radius', '--gwi-btn-height', '--gwi-max-width', '--gwi-bar-height'];
  TOKS.forEach(function (t) { TOKMAP[t[0].toUpperCase()] = t[1]; VARNAMES.push(t[1]); });
  var TOKRE = /(?<![,\w])#[0-9a-fA-F]{6}\b/g;
  function tokText(t) { return t.replace(TOKRE, function (h) { var v = TOKMAP[h.toUpperCase()]; return v ? 'var(' + v + ',' + h + ')' : h; }); }
  var CSS = [
    ':host{display:block;max-width:var(--gwi-max-width,100%);color:' + C.ink + ';font-family:var(--gwi-font,' + FONT + ');font-size:15px;line-height:1.35;-webkit-font-smoothing:antialiased;text-size-adjust:100%}',
    ':host([hidden]){display:none}',
    '*{box-sizing:border-box}',
    '.wrap{position:relative}',
    ':host([data-inline]) .wrap{background:var(--gwi-inline-bg,' + C.grid + ');border-radius:var(--gwi-inline-radius,12px);padding:var(--gwi-inline-pad,32px 28px);overflow:hidden}',
    ':host([data-inline]) .head,:host([data-inline]) .keyrow,:host([data-inline]) .foot{display:none!important}',
    '.head{margin:0 0 var(--gwi-head-gap,40px)}','.head:has(+ .keyrow.on){margin-bottom:24px}',
    '.title{font-family:var(--gwi-font,' + FONT + ');font-weight:var(--gwi-title-weight,400);font-size:var(--gwi-title-size,clamp(24px,2.8vw,32px));line-height:1.12;letter-spacing:-0.012em;margin:0;color:' + C.ink + ';text-wrap:balance}',
    '.sub{margin:10px 0 0;font-size:var(--gwi-sub-size,16px);font-weight:400;color:' + C.muted + ';max-width:60ch;text-wrap:pretty}',
    '.legend{display:flex;flex-wrap:wrap;gap:8px ' + KEYGAP + 'px;margin:0;padding:0;list-style:none;font-size:14px;font-weight:500;flex:1 1 auto;min-width:0}',
    '.legend.end{justify-content:flex-start}',
    '.keyrow{display:none;flex-wrap:wrap;align-items:flex-start;gap:16px;margin:0 0 40px}.keyrow.on{display:flex}',
    '.keyrow.tbl .legend{display:none}.keyrow.tbl:not(.hasf){display:none}',
    '.keyrow.nolg .filter{margin-left:0}','.filter{margin-left:auto;flex:none;display:none;max-width:100%}.keyrow.hasf .filter{display:block}',
    '.filter{position:relative}.filter .fl{font-size:13px;font-weight:500;color:' + C.muted + ';margin-right:8px}',
    '.dd{position:relative;display:inline-block;vertical-align:middle;max-width:100%}',
    '.ddb{appearance:none;-webkit-appearance:none;display:inline-flex;align-items:center;gap:10px;font:inherit;font-size:13px;font-weight:600;line-height:1;color:' + C.ink + ';background:#fff;border:1px solid ' + C.ink + ';border-radius:var(--gwi-radius,' + RAD + 'px);padding:9px 12px;cursor:pointer;max-width:100%}',
    '.ddb:hover,.ddb:focus-visible{background:#fff}.ddb:focus-visible{outline:2px solid ' + C.ink + ';outline-offset:2px}',
    '.ddb .chev{width:7px;height:7px;margin:-3px 2px 0 0;border-right:1.6px solid ' + C.ink + ';border-bottom:1.6px solid ' + C.ink + ';transform:rotate(45deg);transition:transform .15s;flex:none}',
    '.ddb[aria-expanded=true] .chev{transform:rotate(-135deg);margin-top:3px}',
    '.ddl{position:absolute;z-index:6;top:calc(100% + 6px);right:0;min-width:100%;margin:0;padding:0;list-style:none;background:#fff;border:1px solid ' + C.ink + ';border-radius:var(--gwi-radius,' + RAD + 'px);box-shadow:0 6px 20px rgba(30,27,26,.12);overflow:hidden;max-height:260px;overflow-y:auto}',
    '.ddl[hidden]{display:none}.keyrow.nolg .ddl{right:auto;left:0}',
    '.ddl li{background:#fff;padding:11px 14px;font-size:13px;font-weight:500;color:' + C.ink + ';white-space:nowrap;cursor:pointer;border-top:1px solid ' + C.grid + '}',
    '.subsel{margin:12px 0 0;position:relative}.subsel .ddl{left:0;right:auto}',
    '.ddl li:first-child{border-top:0}.ddl li:hover,.ddl li:focus{background:#fff;font-weight:700;outline:none}.ddl li[aria-selected=true]{font-weight:700}',
    '.legend li.gr{display:block;width:min(100%,280px);padding:0}',
    '.legend .gr .pill{height:14px;border-radius:999px}',
    '.legend .gr .gl{display:flex;justify-content:space-between;margin-top:6px;font-size:12px;font-weight:500;color:' + C.muted + '}',
    '.legend li{display:flex;align-items:center;gap:8px;cursor:default;border-radius:4px;padding:2px 0}',
    '.legend li{transition:filter .15s,opacity .15s}.legend li.off{filter:grayscale(1) opacity(.3)}','.legend i{display:block;width:14px;height:14px;border-radius:3px;flex:none}',
    '.legend.dot i{width:14px;height:14px;border-radius:50%}',
    '.legend.line i{width:20px;height:3px;border-radius:2px}',
    '.stage{position:relative;width:100%;min-height:80px}',
    '.stage.scroll{overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;padding-bottom:6px}',
    'svg.chart{display:block;width:100%;height:auto;overflow:visible;font-family:var(--gwi-font,' + FONT + ');font-feature-settings:"lnum"}',
    'svg.chart text{font-family:var(--gwi-font,' + FONT + ');user-select:none}',
    'svg.chart text.ovo{font-family:var(--gwi-number-font,"Ovo",Georgia,serif)}',
    'svg.chart .nopointer{pointer-events:none}',
    'svg.chart [data-s]{transition:opacity .15s}',
    'svg.chart .off{filter:grayscale(1) opacity(.28)}',
    'svg.chart .halo{paint-order:stroke;stroke:#fff;stroke-width:4px;stroke-linejoin:round}',
    'svg.chart .rv{opacity:0;transition:opacity .15s}svg.chart .rv.on{opacity:1}',
    'svg.chart.hov .dl{filter:grayscale(1);opacity:.4;transition:opacity .15s}',
    'svg.chart [tabindex]{outline:none;cursor:pointer}',
    'svg.chart [tabindex]:focus-visible{outline:2px solid ' + C.ink + ';outline-offset:2px}',
    'svg.chart .hit-x{cursor:crosshair}',
    'svg.pre .fade{opacity:0}svg.go .fade{opacity:1;transition:opacity .45s .1s}',
    '.tip{position:absolute;z-index:3;pointer-events:none;min-width:120px;max-width:260px;background:' + C.ink + ';color:#fff;border-radius:10px;padding:10px 12px;font-size:13px;line-height:1.3;box-shadow:0 6px 20px rgba(30,27,26,.22);opacity:0;transform:translateY(4px);transition:opacity .12s,transform .12s}',
    '.tip.on{opacity:1;transform:none}',
    '.tip b{display:block;font-weight:600;margin-bottom:6px;font-size:13px}',
    '.tip .r{display:flex;align-items:center;gap:8px;margin-top:3px}',
    '.tip .r i{width:10px;height:10px;border-radius:3px;flex:none;background:#fff}',
    '.tip .r span{flex:1;color:#D4D0CE}',
    '.tip .r strong{font-weight:700;color:#fff}',
    '.card{display:grid;perspective:1800px}',
    '.face{grid-area:1/1;min-width:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;transition:transform .75s cubic-bezier(.2,.7,.2,1)}',
    '.front{transform:rotateY(0deg)}.back{transform:rotateY(180deg)}',
    '.card.flipped .front{transform:rotateY(-180deg)}.card.flipped .back{transform:rotateY(0deg)}',
    '.back{background:' + C.track + ';border-radius:var(--gwi-radius,' + RAD + 'px);padding:28px 28px 24px;display:flex;flex-direction:column;gap:24px;overflow:auto}',
    '.bk-h{margin:0;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase}',
    '.bk-dl{margin:0;display:grid;grid-template-columns:max-content 1fr;gap:16px 28px;font-size:15px;line-height:1.4}',
    '.bk-dl dt{font-weight:600;color:#5E5A58}.bk-dl dt::after{content:":"}.bk-dl dd{margin:0}',
    '@media (max-width:520px){.bk-dl{grid-template-columns:1fr;gap:4px}.bk-dl dd{margin-bottom:12px}}',
    '.bk-q{margin:0;padding:0;list-style:none;display:grid;gap:12px}',
    '.back a{color:' + C.ink + ';text-decoration:underline;text-underline-offset:3px;text-decoration-color:' + C.pink + ';text-decoration-thickness:1.5px}',
    '.back a::after{content:"\\2197";display:inline-block;margin-left:4px;font-size:.85em;text-decoration:none}',
    '.back a:hover{color:' + C.pink + '}',
    '.back .acts{margin-top:auto;display:flex;justify-content:flex-end}',
    '.foot{margin-top:var(--gwi-foot-gap,37px);display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px 20px;font-size:12px;line-height:1.5;font-weight:500;color:' + C.soft + '}',
    '.foot .notes{margin:0;flex:1 1 100%;text-wrap:pretty}',
    '.foot .notes b{font-weight:600}',
    '.foot .dot{font-style:normal;margin:0 3px}',
    '.foot .tools{display:flex;flex-wrap:wrap;gap:4px 20px}',
    '.foot .tools button{font:inherit;color:' + C.ink + ';background:none;border:0;padding:4px 0;cursor:pointer;text-decoration:underline;text-underline-offset:3px;text-decoration-color:' + C.axis + '}',
    '.foot .tools button:hover{text-decoration-color:' + C.pink + '}',
    '.foot .ctas{display:flex;flex-wrap:wrap;gap:12px;margin-left:auto}',
    /* Buttons component (Components/Buttons/README.md): fully rounded pill. Compact size for chart cards only: 30px high, 14px SemiBold, 16px side padding (the standard is 60px / 20px). Charts sit on light backgrounds, so Light mode. .cta = Secondary (Sources), .cta.pri = Primary (Download image, Back to chart). Hover only. */
    '.cta{font:inherit;font-size:14px;font-weight:600;line-height:1;white-space:nowrap;color:#1E1B1A;background:#fff;border:1px solid #282523;border-radius:var(--gwi-btn-radius,15px);height:var(--gwi-btn-height,30px);padding:0 16px;cursor:pointer;transition:background .15s,color .15s;display:inline-flex;align-items:center;justify-content:center}',
    '.cta:hover{background:#4C4947;color:#FBFAFA}',
    '.cta.pri{background:#1E1B1A;color:#FBFAFA;border-color:#1E1B1A}',
    '.cta.pri:hover{background:#4C4947;border-color:#4C4947}',
    '.cta:focus-visible,.foot .tools button:focus-visible,.back a:focus-visible{outline:2px solid ' + C.ink + ';outline-offset:2px;border-radius:3px}',
    '@media (prefers-reduced-motion:reduce){.face{transition:none}}',
    '.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}',
    '.tablewrap{overflow:auto}',
    '.tablewrap table{border-collapse:collapse;width:100%;font-size:14px}',
    '.tablewrap th,.tablewrap td{text-align:left;padding:8px 12px;border-bottom:1px solid ' + C.grid + ';font-weight:500}',
    '.tablewrap th{font-weight:700;color:' + C.ink + '}',
    '.tablewrap td+td,.tablewrap th+th{text-align:right}',
    '.msg{padding:28px;border-radius:12px;background:' + C.track + ';color:' + C.muted + ';font-size:14px;text-align:center}',
    /* big number */
    '.stat{display:grid;grid-template-columns:minmax(0,1fr);gap:28px;align-items:center}',
    '.stat.two{grid-template-columns:minmax(0,5fr) minmax(0,6fr);gap:48px}',
    '.hero .num{font-family:var(--gwi-number-font,"Ovo",Georgia,serif);font-weight:400;font-size:var(--gwi-stat-size,clamp(88px,15vw,170px));line-height:.9;color:' + C.pink + ';font-variant-numeric:lining-nums}',
    '.hero .lab{margin-top:18px;font-size:clamp(18px,2vw,22px);font-weight:500;line-height:1.25;max-width:22ch;text-wrap:balance}',
    '.tiles{display:flex;flex-direction:column;gap:12px}',
    '.tile{display:flex;align-items:center;justify-content:space-between;gap:16px;background:' + C.track + ';border-radius:16px;padding:20px 24px}',
    '.tile .tl{font-size:15px;font-weight:500}',
    '.tile .tv{font-family:var(--gwi-number-font,"Ovo",Georgia,serif);font-size:42px;line-height:1;margin:6px 0 4px;color:' + C.ink100 + '}',
    '.tile .td{font-size:14px;font-weight:500;color:' + C.muted + '}',
    '.stat.pre .tile{opacity:0;transform:translateY(14px)}.stat.go .tile{opacity:1;transform:none;transition:opacity .6s cubic-bezier(.2,.7,.2,1) calc(var(--i)*.14s + .15s),transform .6s cubic-bezier(.2,.7,.2,1) calc(var(--i)*.14s + .15s)}',
    '.stat.pre .spark path{stroke-dasharray:1;stroke-dashoffset:1}.stat.go .spark path{stroke-dasharray:1;stroke-dashoffset:0;transition:stroke-dashoffset 1s cubic-bezier(.4,.1,.2,1) calc(var(--i)*.14s + .4s)}',
    '.stat.pre .sd{opacity:0}.stat.go .sd{opacity:1;transition:opacity .3s calc(var(--i)*.14s + 1.3s)}',
    '.spark{flex:none;overflow:visible;cursor:crosshair}',
    /* the key can switch groups off */
    '.legend li.tgoff{opacity:.4}','.legend li[role=button]{cursor:pointer}',
    /* previous / next arrows (when the chart sits in a <gwi-chart-carousel>): white circles, 30px, Neutral 90 outline */
    '.navs{display:flex;gap:8px}',
    '.nav{width:30px;height:30px;padding:0;border-radius:50%;background:#fff;border:1px solid #282523;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;transition:background .15s}',
    '.nav:hover{background:' + C.track + '}','.nav:focus-visible{outline:2px solid ' + C.ink + ';outline-offset:2px}','.nav svg{display:block}',
    /* big numbers (type="stats") */
    '.stats{display:grid;grid-template-columns:repeat(var(--gwi-stats-cols,2),minmax(0,1fr));gap:var(--gwi-stats-gap,40px)}.stats.one{grid-template-columns:minmax(0,1fr);gap:28px}',
    '.sc{border-top:1px solid ' + C.grid + ';padding-top:20px}',
    '.sn{margin:0;display:flex;align-items:flex-start;font-family:var(--gwi-number-font,"Ovo",Georgia,serif);font-weight:400;color:' + C.pink + ';line-height:.9;font-variant-numeric:lining-nums}',
    '.sn .sv{font-size:var(--gwi-stat-size,clamp(88px,15vw,132px));letter-spacing:-0.02em}',
    '.sn .spc{font-family:var(--gwi-font,' + FONT + ');font-weight:600;font-size:clamp(16px,2.4vw,22px);line-height:1;margin:.3em 0 0 0}',
    '.sl{margin:16px 0 0;font-size:var(--gwi-stat-label-size,16px);line-height:1.35;font-weight:500;max-width:28ch;text-wrap:pretty}',
    '.stats.pre .sc{opacity:0;transform:translateY(8px)}.stats.go .sc{opacity:1;transform:none;transition:opacity .5s ease calc(var(--i)*.15s + .1s),transform .6s cubic-bezier(.22,.7,.2,1) calc(var(--i)*.15s + .1s)}',
    /* one tall bar that switches between big stats (type="stat-bar") */
    '.sbar{position:relative;height:var(--gwi-stat-bar-height,clamp(220px,calc(52vw - 40px),340px));background:' + C.grid + ';border-radius:var(--gwi-radius,' + RAD + 'px);overflow:hidden}',
    '.sfill{position:absolute;inset:0 auto 0 0;width:calc(var(--pct)*1%);background:' + C.pink + ';box-shadow:2.5px 0 0 #fff;color:#fff;padding:clamp(20px,4vw,36px);display:flex;flex-direction:column;justify-content:flex-start}',
    '.sfill.in{animation:sgrow 1.1s cubic-bezier(.22,.7,.2,1) both}@keyframes sgrow{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}',
    '.snum{font-family:var(--gwi-number-font,"Ovo",Georgia,serif);font-weight:400;font-size:var(--gwi-stat-size,clamp(88px,17vw,150px));line-height:.9;font-variant-numeric:lining-nums;margin:0;white-space:nowrap}',
    '.snum sup{font-size:.4em;vertical-align:top;position:relative;top:.12em;margin-left:.04em}',
    '.slab{margin:16px 0 0;font-weight:600;font-size:var(--gwi-stat-label-size,clamp(20px,3.2vw,28px));line-height:1.2;max-width:22ch;text-wrap:balance}',
    '.snotes{margin:16px 0 0;font-size:12px;line-height:1.5;font-weight:500;color:' + C.soft + '}.snotes p{margin:0}',
    '@media (prefers-reduced-motion:reduce){svg.chart [data-s],.tip{transition:none}.stats.go .sc{transition:none}.sfill.in{animation:none}}'
  ].join('\n');

  CSS = tokText(CSS);
  var FONT_CSS_DONE = false;
  function fontCSS() {
    if (FONT_CSS_DONE) return; FONT_CSS_DONE = true;
    var G = window.GwiChart || {}, base = G.fontBase || (SCRIPT_SRC ? SCRIPT_SRC.replace(/[^\/]*$/, '') + 'fonts/' : 'fonts/'), f = G.fonts || {};
    var css = '@font-face{font-family:"Instrument Sans";font-style:normal;font-weight:400 700;font-stretch:75% 100%;font-display:swap;src:url("' + (f.instrument || base + 'InstrumentSans.woff2') + '") format("woff2")}' +
      '@font-face{font-family:"Ovo";font-style:normal;font-weight:400;font-display:swap;src:url("' + (f.ovo || base + 'Ovo-Regular.woff2') + '") format("woff2")}';
    var st = document.createElement('style'); st.setAttribute('data-gwi-chart-fonts', ''); st.textContent = css; document.head.appendChild(st);
  }
  var FONTS_READY = null;
  function fontsReady() {
    if (FONTS_READY) return FONTS_READY;
    fontCSS();
    if (!document.fonts || !document.fonts.load) return (FONTS_READY = Promise.resolve());
    FONTS_READY = Promise.all([document.fonts.load('500 15px "Instrument Sans"'), document.fonts.load('700 15px "Instrument Sans"'), document.fonts.load('400 30px "Ovo"')]).catch(function () { });
    return FONTS_READY;
  }

  var ATTRS = ['type', 'data', 'src', 'title', 'subtitle', 'source', 'base', 'question', 'aspect', 'unit', 'highlight', 'decimals', 'height', 'max', 'normalize', 'animate', 'table', 'download', 'questions', 'question-url', 'source-url', 'ranked', 'reference', 'nav', 'filename', 'labels', 'layout', 'columns', 'color', 'track-color', 'background'];

  var GwiChart = class extends HTMLElement {
    static get observedAttributes() { return ATTRS; }
    constructor() {
      super();
      this._root = this.attachShadow({ mode: 'open' });
      this._data = null; this._played = false; this._tipOn = false; this._seq = 0;
      this._root.innerHTML = '<style>' + CSS + '</style><div class="wrap"><div class="card"><div class="face front"><div class="head"></div><div class="keyrow"><ul class="legend"></ul><div class="filter"></div></div><div class="stage"></div><div class="foot"></div></div><div class="face back" inert aria-hidden="true"></div></div><div class="tip" role="presentation"></div></div>';
      this._q = function (s) { return this._root.querySelector(s); };
    }
    _attrs() { var o = {}, self = this; ATTRS.forEach(function (a) { o[a] = self.getAttribute(a) == null ? '' : self.getAttribute(a); }); return o; }
    get data() { return this._data; }
    set data(v) { this._data = v; this._ready && this._render(); }
    connectedCallback() {
      var self = this;
      this._ready = true;
      if (Object.prototype.hasOwnProperty.call(this, 'data')) { var pre_ = this.data; delete this.data; this._data = pre_; } /* data set before the element upgraded */
      this._anim = this.getAttribute('animate') !== 'false' && !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
      if (!this.hasAttribute('role')) this.setAttribute('role', 'group');
      var stage = this._q('.stage');
      if (window.ResizeObserver) { this._ro = new ResizeObserver(function () { var w = Math.round(stage.clientWidth); if (w && w !== self._lastW) self._render(true); }); this._ro.observe(stage); }
      stage.addEventListener('pointermove', function (e) { self._onMove(e); });
      stage.addEventListener('pointerleave', function () { self._hideTip(); self._focusSeries(null); });
      stage.addEventListener('focusin', function (e) { self._onFocus(e); });
      stage.addEventListener('focusout', function () { self._hideTip(); });
      stage.addEventListener('click', function (e) { self._onClick(e); });
      if (document.readyState === 'loading') { /* the script can load before the tag's data has been read: wait for the page to finish parsing */ document.addEventListener('DOMContentLoaded', function () { self._load(); }, { once: true }); } else this._load();
    }
    disconnectedCallback() { if (this._subOut) { document.removeEventListener('click', this._subOut); this._subOut = null; } this._sbStop(); if (this._ddOut) { document.removeEventListener('pointerdown', this._ddOut); this._ddOut = null; } if (this._ro) this._ro.disconnect(); if (this._io) this._io.disconnect(); this._ready = false; }
    attributeChangedCallback(name, o, n) {
      if (!this._ready || o === n) return;
      if (name === 'data' || name === 'src') this._load(); else this._render();
    }
    _inlineData() {
      var s = this.querySelector('script[type="application/json"]');
      if (s) { try { return JSON.parse(s.textContent); } catch (e) { this._fail('The JSON inside <script type="application/json"> is not valid.'); } }
      var a = this.getAttribute('data');
      if (a) { try { return JSON.parse(a); } catch (e) { this._fail('The data attribute is not valid JSON.'); } }
      return null;
    }
    _load() {
      var self = this, src = this.getAttribute('src'), seq = ++this._seq;
      if (src) {
        fetch(src).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return /\.csv(\?|#|$)/i.test(src) ? r.text().then(parseCSV) : r.json(); })
          .then(function (d) { if (seq !== self._seq) return; self._data = d; self._render(); })
          .catch(function (e) { self._fail('Could not load data from ' + src + ' (' + e.message + ').'); });
        this._renderShell(); this._q('.stage').innerHTML = '<div class="msg">Loading chart…</div>';
        return;
      }
      var d = this._inlineData(); if (d) this._data = d;
      this._render();
    }
    _fail(msg) {
      this._renderShell(); this._q('.stage').innerHTML = '<div class="msg" role="alert">' + esc(msg) + '</div>';
      this.dispatchEvent(new CustomEvent('gwi-chart-error', { detail: { message: msg }, bubbles: true, composed: true }));
    }
    _renderShell() {
      var a = this._attrs(), head = this._q('.head');
      var sl = this._sel, subHtml = a.subtitle ? '<p class="sub">' + esc(a.subtitle) + '</p>' : '';
      if (sl && sl.items.length > 1) { /* inside a carousel with "selector": a dropdown takes the subtitle's place */
        var cur = sl.items[sl.index] || a.subtitle || '';
        subHtml = '<div class="subsel"><div class="dd"><button type="button" class="ddb" aria-haspopup="listbox" aria-expanded="false" aria-label="Show: ' + esc(cur) + '"><span>' + esc(cur) + '</span><i class="chev"></i></button><ul class="ddl" role="listbox" tabindex="-1" hidden>' + sl.items.map(function (t, i) { return '<li role="option" tabindex="-1" data-i="' + i + '" aria-selected="' + (i === sl.index) + '">' + esc(t) + '</li>'; }).join('') + '</ul></div></div>';
      }
      var br = function (t) { return esc(t).replace(/\\n|\n/g, '<br>'); }; /* \n in a title or subtitle breaks the line */
      if (a.subtitle && !(sl && sl.items.length > 1)) subHtml = '<p class="sub">' + br(a.subtitle) + '</p>';
      head.innerHTML = (a.title ? '<h3 class="title">' + br(a.title) + '</h3>' : '') + subHtml;
      head.style.display = (a.title || a.subtitle || sl) ? '' : 'none';
      var self = this, ddb = head.querySelector('.ddb'), ddl = head.querySelector('.ddl');
      if (ddb) {
        var opts = [].slice.call(ddl.querySelectorAll('li')), open = function (on) { ddl.hidden = !on; ddb.setAttribute('aria-expanded', on ? 'true' : 'false'); if (on && opts[sl.index]) opts[sl.index].focus(); };
        ddb.onclick = function () { open(ddl.hidden); };
        opts.forEach(function (o, k) {
          o.onclick = function () { open(false); ddb.focus(); self.dispatchEvent(new CustomEvent('gwi-chart-pick', { detail: { index: k }, bubbles: true, composed: true })); };
          o.onkeydown = function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); o.click(); } else if (e.key === 'ArrowDown') { e.preventDefault(); opts[Math.min(opts.length - 1, k + 1)].focus(); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); opts[Math.max(0, k - 1)].focus(); } else if (e.key === 'Escape') { open(false); ddb.focus(); }
          };
        });
        if (!this._subOut) { this._subOut = function (e) { var l = self._q('.subsel .ddl'); if (l && !l.hidden && !e.composedPath().some(function (n) { return n === self._q('.subsel'); })) { l.hidden = true; var b = self._q('.subsel .ddb'); if (b) b.setAttribute('aria-expanded', 'false'); } }; document.addEventListener('click', this._subOut); }
      }
    }
    _render(isResize) {
      var self = this, type = TYPES[(this.getAttribute('type') || '').toLowerCase()];
      if (!this._data) { if (!this.getAttribute('src')) { this._renderShell(); this._q('.stage').innerHTML = '<div class="msg">No data yet. Add a src URL, a data attribute or a &lt;script type="application/json"&gt; child, or set the data property.</div>'; } return; }
      if (!type) { this._fail('Unknown chart type "' + this.getAttribute('type') + '". Use: bar, column, line, area, stacked-area, stacked-bar, stacked-column, heatmap, treemap, sankey, scatter, dot-plot, slope, half-donut, inline-donut, inline-dots, stat, stats or stat-bar.'); return; }
      fontsReady().then(function () { self._draw(type, !!isResize); });
    }
    _tok(root) { /* point the colours and corner radius drawn into the SVG / inline styles at their custom properties */
      var els = (root || this._root).querySelectorAll('*'), at = ['fill', 'stroke', 'stop-color'], i, j, e, v, t;
      if (root && root.nodeType === 1) { els = [root].concat([].slice.call(els)); }
      for (i = 0; i < els.length; i++) {
        e = els[i]; if (e.tagName === 'STYLE') continue;
        for (j = 0; j < at.length; j++) { v = e.getAttribute && e.getAttribute(at[j]); if (v && v.charAt(0) === '#' && (t = TOKMAP[v.toUpperCase()])) e.style.setProperty(at[j], 'var(' + t + ',' + v + ')'); }
        if (e.tagName === 'rect' && e.getAttribute('rx') === String(RAD)) { e.style.setProperty('rx', 'var(--gwi-radius,' + RAD + 'px)'); e.style.setProperty('ry', 'var(--gwi-radius,' + RAD + 'px)'); }
        v = e.getAttribute && e.getAttribute('style'); if (v && v.indexOf('#') > -1) { t = tokText(v); if (t !== v) e.setAttribute('style', t); }
      }
    }
    _draw(type, isResize) { this._draw0(type, isResize); this._tok(); }
    _draw0(type, isResize) {
      this.toggleAttribute('data-inline', !!INSIGHT[type]); /* Inline insights: card, padding, no buttons. Set before the width is measured */
      var bgc = INSIGHT[type] ? tokColor(this.getAttribute('background'), '') : ''; this._q('.wrap').style.background = bgc; /* background="neutral.20": any design system token */
      var a = this._attrs(), stage = this._q('.stage'), W = Math.round(stage.clientWidth) || Math.round(this.getBoundingClientRect().width) || 640;
      this._lastW = W; this._renderShell(); this._type = type;
      var raw = this._eff(), d = (type === 'stat' || type === 'stats' || type === 'stat-bar') ? null : normalize(raw, type);
      var keyrow = this._q('.keyrow'), fdiv = this._q('.filter'), vs = this._views(), hasF = vs.length > 1;
      keyrow.classList.toggle('hasf', hasF);
      if (hasF) { var self0 = this, lbl = (this._data.filterLabel || this._data.filter || 'Filter'), cur = vs[this._view].name;
        fdiv.innerHTML = '<span class="fl">' + esc(lbl) + '</span><div class="dd"><button type="button" class="ddb" aria-haspopup="listbox" aria-expanded="false" aria-label="' + esc(lbl) + ': ' + esc(cur) + '"><span>' + esc(cur) + '</span><i class="chev"></i></button><ul class="ddl" role="listbox" tabindex="-1" hidden>' + vs.map(function (v, i) { return '<li role="option" tabindex="-1" data-i="' + i + '" aria-selected="' + (i === self0._view) + '">' + esc(v.name) + '</li>'; }).join('') + '</ul></div>';
        var btn = fdiv.querySelector('.ddb'), ul = fdiv.querySelector('.ddl'), opts = [].slice.call(ul.children);
        var shut = function (back) { ul.hidden = true; btn.setAttribute('aria-expanded', 'false'); if (back) btn.focus(); };
        var open = function () { ul.hidden = false; btn.setAttribute('aria-expanded', 'true'); (opts[self0._view] || opts[0]).focus(); };
        var pick = function (i) { shut(true); if (i === self0._view) return; self0._view = i; self0._played = false; self0.dispatchEvent(new CustomEvent('gwi-chart-filter', { detail: { view: vs[i].name }, bubbles: true, composed: true })); self0._draw(type, false); };
        btn.onclick = function () { ul.hidden ? open() : shut(); };
        btn.onkeydown = function (e) { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); open(); } };
        ul.onclick = function (e) { var li = e.target.closest && e.target.closest('li'); if (li) pick(+li.getAttribute('data-i')); };
        ul.onkeydown = function (e) { var k = opts.indexOf(document.activeElement) < 0 ? opts.indexOf(self0._root.activeElement) : opts.indexOf(document.activeElement), t = e.key;
          if (t === 'ArrowDown') { e.preventDefault(); opts[Math.min(opts.length - 1, k + 1)].focus(); } else if (t === 'ArrowUp') { e.preventDefault(); opts[Math.max(0, k - 1)].focus(); } else if (t === 'Home') { e.preventDefault(); opts[0].focus(); } else if (t === 'End') { e.preventDefault(); opts[opts.length - 1].focus(); } else if (t === 'Enter' || t === ' ') { e.preventDefault(); if (k >= 0) pick(k); } else if (t === 'Escape' || t === 'Tab') { shut(t === 'Escape'); } };
        if (!this._ddOut) { this._ddOut = function (e) { var u = self0._q('.ddl'); if (u && !u.hidden && !e.composedPath().some(function (n) { return n === self0._q('.dd'); })) { u.hidden = true; var bb = self0._q('.ddb'); if (bb) bb.setAttribute('aria-expanded', 'false'); } }; document.addEventListener('pointerdown', this._ddOut); }
      } else fdiv.innerHTML = '';
      if (d && (!d.cats.length || !d.series.length)) return this._fail('The data has no categories or no series.');
      var foot = this._q('.foot'), legend = this._q('.legend'), tip = this._q('.tip');
      this._hideTip();
      var animate = this._anim && !this._played;
      this._normd = d;
      if (type === 'stat') { this._drawStat(raw, a, animate); }
      else if (type === 'stats') { this._drawStats(raw, a, animate, W); }
      else if (type === 'stat-bar') { this._drawStatBar(raw, a, animate); }
      else {
        this._anim = this._anim; var S = ctx(this, d, W); S.raw = raw; S.anim = animate;
        var res = BUILD[type](d, S); this._res = res; this._S = S;
        var pre = animate ? ' pre' : '';
        var SW = res.w || W; stage.classList.toggle('scroll', SW > W + 1);
        stage.innerHTML = '<svg class="chart' + pre + '" width="' + SW + '" height="' + res.h + '" viewBox="0 0 ' + SW + ' ' + r1(res.h) + '"' + (SW > W + 1 ? ' style="width:' + SW + 'px"' : '') + ' role="img" aria-label="' + esc((a.title || res.aria) + '. ' + (a.subtitle || '')) + '">' + res.svg + '</svg>' +
          '<div class="tablewrap sr" data-table></div>';
        this._buildTable(d, S, type);
        var lg = res.legend;
        legend.innerHTML = !lg ? '' : lg.gradient ? '<li class="gr"><div class="pill" style="background:linear-gradient(90deg,' + lg.gradient.stops.join(',') + ')"></div><div class="gl">' + lg.gradient.labels.map(function (l) { return '<span>' + esc(l) + '</span>'; }).join('') + '</div></li>' : lg.items.map(function (it, i) { return '<li data-k="' + i + '"><i style="background:' + it[1] + '"></i>' + esc(it[0]) + '</li>'; }).join('');
        legend.className = 'legend' + (lg && lg.align === 'end' ? ' end' : '') + (lg && lg.line ? ' line' : '') + (lg && lg.dot ? ' dot' : '');
        keyrow.classList.toggle('on', !!lg || hasF); keyrow.classList.toggle('nolg', !lg);
        legend.style.display = lg ? '' : 'none'; legend.style.paddingLeft = lg && lg.pad ? lg.pad + 'px' : '';
        legend.onpointerover = function (e) { var li = e.target.closest && e.target.closest('li'); self_focus(li && li.hasAttribute('data-k') ? +li.getAttribute('data-k') : null); };
        legend.onpointerleave = function () { self_focus(null); };
        var self = this; function self_focus(k) { self._focusSeries(k); }
        var tg = !!(lg && lg.toggle), hid = this._hidden || [];
        [].forEach.call(legend.querySelectorAll('li[data-k]'), function (li) { /* the key switches groups on and off, one always stays on */
          if (!tg) return; var k = +li.getAttribute('data-k'); li.setAttribute('role', 'button'); li.setAttribute('tabindex', '0'); li.setAttribute('aria-pressed', hid.indexOf(k) < 0 ? 'true' : 'false'); if (hid.indexOf(k) > -1) li.classList.add('tgoff');
        });
        var flip = function (li) { var k = +li.getAttribute('data-k'), h = self._hidden || [], at = h.indexOf(k); if (at > -1) h.splice(at, 1); else if (h.length < lg.items.length - 1) h.push(k); else return; self._hidden = h; self._draw(type, false); };
        legend.onclick = tg ? function (e) { var li = e.target.closest && e.target.closest('li[data-k]'); if (li) flip(li); } : null;
        legend.onkeydown = tg ? function (e) { if (e.key !== 'Enter' && e.key !== ' ') return; var li = e.target.closest && e.target.closest('li[data-k]'); if (li) { e.preventDefault(); flip(li); } } : null;
        if (animate) this._startAnim();
        this._played = true;
        this.dispatchEvent(new CustomEvent('gwi-chart-ready', { detail: { type: type }, bubbles: true, composed: true }));
      }
      var info = this._sourcesInfo(), hasInfo = !!(info.source || info.base || info.qs.length);
      var tools = (a.table !== 'false' && type !== 'stat' ? '<button type="button" data-act="table" aria-pressed="false">View as table</button>' : '') + (a.download !== 'false' && type !== 'stat' ? '<button type="button" data-act="csv">Download data (CSV)</button>' : '');
      var navHtml = this.hasAttribute('nav') ? '<div class="navs"><button type="button" class="nav" data-act="prev" aria-label="Previous graph"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#282523" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7.5 2.5L4 6l3.5 3.5"/></svg></button><button type="button" class="nav" data-act="next" aria-label="Next graph"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#282523" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 2.5L8 6l-3.5 3.5"/></svg></button></div>' : '';
      foot.innerHTML = '<div class="tools">' + tools + '</div><div class="ctas">' + navHtml + (hasInfo ? '<button type="button" class="cta" data-act="flip" aria-expanded="false">Sources</button>' : '') + '<button type="button" class="cta pri" data-act="jpg">Download image<svg width="8.45" height="5.65" viewBox="-39.8 158.5 16.9 11.3" fill="#B9DB51" aria-hidden="true" style="margin-left:8px;flex:none"><g transform="rotate(90)"><path d="M158.524 37.01C158.524 35.088 159.416 34.1953 161.339 34.1953C163.262 34.1953 164.154 35.088 164.154 37.01C164.154 38.9319 163.262 39.8245 161.339 39.8245C159.416 39.8245 158.524 38.9319 158.524 37.01Z"/><path d="M158.524 25.7512C158.524 23.8292 159.416 22.9365 161.339 22.9365C163.262 22.9365 164.154 23.8292 164.154 25.7512C164.154 27.6731 163.262 28.5657 161.339 28.5657C159.416 28.5657 158.524 27.6731 158.524 25.7512Z"/><path d="M164.154 31.381C164.154 29.4591 165.046 28.5664 166.969 28.5664C168.892 28.5664 169.783 29.459 169.783 31.381C169.783 33.303 168.892 34.1956 166.969 34.1956C165.046 34.1956 164.154 33.303 164.154 31.381Z"/></g></svg></button></div>';
      this._renderBack(info, hasInfo);
      var self2 = this;
      foot.onclick = function (e) { var b = e.target.closest && e.target.closest('button'); if (!b) return; var act = b.getAttribute('data-act'); if (act === 'table') self2._toggleTable(b); else if (act === 'csv') self2._csv(); else if (act === 'jpg') self2._jpg(); else if (act === 'flip') self2._flip(true); else if (act === 'prev' || act === 'next') self2.dispatchEvent(new CustomEvent('gwi-chart-nav', { detail: { dir: act === 'prev' ? -1 : 1 }, bubbles: true, composed: true })); };
      foot.style.display = '';
      if (this._tblOn) this._applyTable(true);
    }
    _startAnim() {
      var svg = this._q('svg.chart'), self = this; if (!svg) return;
      if (this._io) this._io.disconnect();
      function go() {
        svg.classList.remove('pre'); svg.classList.add('go');
        [].forEach.call(svg.querySelectorAll('animate'), function (a) { var dl = +a.getAttribute('data-delay') || 0; try { a.beginElementAt(dl); } catch (e) { try { a.beginElement(); } catch (e2) { } } });
        self._countUp(svg);
      }
      if (!('IntersectionObserver' in window)) return go();
      this._io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { self._io.disconnect(); go(); } }, { threshold: 0.15 });
      this._io.observe(svg);
    }
    _countUp(svg) { /* numbers count up in step with their bar, column or segment */
      var S = this._S; if (!S) return;
      [].forEach.call(svg.querySelectorAll('[data-cv]'), function (el) {
        var fv = +el.getAttribute('data-cv'), dl = (+el.getAttribute('data-delay') || 0) * 1000, dd = S.dec !== null ? S.dec : (Math.abs(fv - Math.round(fv)) < 1e-9 ? 0 : 1), t0 = null;
        function fmt(v) { return S.prefix + v.toLocaleString('en-US', { minimumFractionDigits: dd, maximumFractionDigits: dd }) + S.suffix + (el.getAttribute('data-suf') || ''); }
        el.textContent = fmt(0); el.style.opacity = '0';
        setTimeout(function () { el.style.opacity = '1'; setTimeout(function () { requestAnimationFrame(function f(ts) { if (t0 === null) t0 = ts; var p = Math.min(1, (ts - t0) / 800), e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(fv * e); if (p < 1) requestAnimationFrame(f); else el.textContent = fmt(fv); }); }, (+el.getAttribute('data-cd') || 0) * 1000); }, dl);
      });
    }
    _drawStat(d, a, animate) {
      var stage = this._q('.stage'), legend = this._q('.legend'), W = stage.clientWidth || 640, tiles = d.tiles || [];
      legend.style.display = 'none'; this._q('.keyrow').classList.toggle('on', this._views().length > 1); this._q('.keyrow').classList.add('nolg');
      var tileN = 0, tl = tiles.map(function (t) {
        return '<div class="tile"><div><div class="tl">' + esc(t.label || '') + '</div><div class="tv">' + esc(t.value || '') + '</div>' + (t.delta ? '<div class="td">' + esc(t.delta) + '</div>' : '') + '</div>' + (t.trend && t.trend.length > 1 ? sparkline(t.trend.map(num), t.trendLabels) : '') + '</div>';
      }).join('').replace(/<div class="tile">/g, function () { return '<div class="tile" style="--i:' + (tileN++) + '">'; });
      stage.innerHTML = '<div class="stat' + (tiles.length && W >= 720 ? ' two' : '') + (animate ? ' pre' : '') + '"><div class="hero"><div class="num" aria-label="' + esc(d.value || '') + '">' + esc(d.value || '') + '</div><div class="lab">' + esc(d.label || '') + '</div></div>' + (tl ? '<div class="tiles">' + tl + '</div>' : '') + '</div>';
      var num_ = stage.querySelector('.hero .num');
      if (animate && num_) {
        var self = this, st = stage.querySelector('.stat'), run = function () { st.classList.remove('pre'); st.classList.add('go'); countUp(num_, d.value || ''); };
        if ('IntersectionObserver' in window) { this._io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { self._io.disconnect(); run(); } }, { threshold: 0.3 }); this._io.observe(num_); } else run();
      }
      this._played = true; this._normd = null; this._res = null;
      this.dispatchEvent(new CustomEvent('gwi-chart-ready', { detail: { type: 'stat' }, bubbles: true, composed: true }));
    }
    _drawStats(d, a, animate, W) { /* four (or any number of) big numbers with their statements, no chart */
      var self = this, stage = this._q('.stage'), legend = this._q('.legend'), kr = this._q('.keyrow');
      legend.style.display = 'none'; kr.classList.toggle('on', this._views().length > 1); kr.classList.add('nolg');
      var unit = a.unit || '', pct = unit === '%', pre = /^[$£€]$/.test(unit) ? unit : '', suf = pct ? '%' : (!pre && unit ? unit : '');
      var st = (d.stats || []).map(function (s) { return { v: String(s.value), l: String(s.label || s.name || '') }; });
      if (!st.length) return this._fail('The data has no stats.');
      var cells = st.map(function (s, i) {
        return '<div class="sc" style="--i:' + i + '" role="listitem"><p class="sn" aria-label="' + esc(pre + s.v + suf) + '">' + (pre ? '<span class="spc" aria-hidden="true">' + esc(pre) + '</span>' : '') + '<span class="sv" aria-hidden="true" data-final="' + esc(s.v) + '">' + esc(s.v) + '</span>' + (suf ? '<span class="spc" aria-hidden="true">' + esc(suf) + '</span>' : '') + '</p><p class="sl">' + esc(s.l) + '</p></div>';
      }).join('');
      stage.innerHTML = '<div class="stats gx' + (W < 560 ? ' one' : '') + (animate ? ' pre' : '') + '" role="list">' + cells + '</div><div class="tablewrap sr" data-table></div>';
      this._putTable({ head: [d.categoryLabel || 'Statement', d.valueLabel || (pct ? '%' : 'Value')], rows: st.map(function (s) { return [s.l, pre + s.v + suf]; }), raw: st.map(function (s) { return [s.l, s.v]; }) });
      var box = stage.querySelector('.stats');
      if (animate) {
        var run = function () { box.classList.remove('pre'); box.classList.add('go'); [].forEach.call(box.querySelectorAll('.sv'), function (el, i) { var fin = el.getAttribute('data-final'); if (!/^-?[\d.,]+$/.test(fin)) return; el.textContent = '0'; setTimeout(function () { countUp(el, fin); }, 100 + i * 150); }); };
        if ('IntersectionObserver' in window) { this._io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { self._io.disconnect(); run(); } }, { threshold: 0.2 }); this._io.observe(box); } else run();
      }
      this._played = true; this._normd = null; this._res = null;
      this.dispatchEvent(new CustomEvent('gwi-chart-ready', { detail: { type: 'stats' }, bubbles: true, composed: true }));
    }
    _sbStop() { if (this._sb) { clearInterval(this._sb.t); if (this._sb.cancel) this._sb.cancel(); } }
    _drawStatBar(d, a, animate) { /* one tall bar that fills and then stretches from one big stat to the next, and loops */
      var self = this, stage = this._q('.stage'), legend = this._q('.legend'), kr = this._q('.keyrow');
      legend.style.display = 'none'; kr.classList.remove('on'); kr.classList.add('nolg'); this._sbStop();
      var unit = a.unit === '%' ? '%' : '', notes = d.notes || [];
      var st = (d.stats || []).map(function (s) { return { pct: num(s.value), mark: s.mark || '', label: String(s.label || '') }; });
      if (!st.length) return this._fail('The data has no stats.');
      stage.innerHTML = '<div class="sbar gx"' + (a.height ? ' style="height:' + (+a.height) + 'px"' : '') + '><div class="sfill" style="--pct:' + st[0].pct + '"><p class="snum" aria-live="polite"></p><p class="slab"></p></div></div>' + (notes.length ? '<div class="snotes">' + notes.map(function (n) { return '<p>' + esc(n) + '</p>'; }).join('') + '</div>' : '') + '<div class="tablewrap sr" data-table></div>';
      this._putTable({ head: [d.categoryLabel || 'Statistic', d.valueLabel || (unit ? '%' : 'Value')], rows: st.map(function (s) { return [s.label + (s.mark ? ' ' + s.mark : ''), s.pct + unit]; }), raw: st.map(function (s) { return [s.label, s.pct]; }) });
      var fill = stage.querySelector('.sfill'), nm = fill.querySelector('.snum'), lb = fill.querySelector('.slab'), DUR = 1100, i = 0, raf = 0, ms = Math.max(1, +(d.interval || 3)) * 1000;
      function label(v, s) { nm.innerHTML = Math.round(v) + unit + (s.mark ? '<sup>' + esc(s.mark) + '</sup>' : ''); }
      function show(s) { fill.style.transition = 'none'; fill.style.clipPath = ''; fill.style.setProperty('--pct', s.pct); label(s.pct, s); lb.textContent = s.label; }
      function intro(s) { cancelAnimationFrame(raf); fill.classList.remove('in'); show(s); void fill.offsetWidth; fill.classList.add('in'); }
      function extend(from, s) { cancelAnimationFrame(raf); fill.classList.remove('in'); fill.style.transition = 'width ' + DUR + 'ms cubic-bezier(.22,.7,.2,1)'; fill.style.setProperty('--pct', s.pct); lb.textContent = s.label; var t0 = performance.now(); (function tick(t) { var k = Math.min(1, (t - t0) / DUR), e = 1 - Math.pow(1 - k, 3); label(from.pct + (s.pct - from.pct) * e, s); if (k < 1) raf = requestAnimationFrame(tick); })(t0); }
      this._sb = { t: 0, cancel: function () { cancelAnimationFrame(raf); } };
      function start() { show(st[0]); if (!self._anim || st.length < 2) return; intro(st[0]); self._sb.t = setInterval(function () { var prev = st[i]; i = (i + 1) % st.length; if (i === 0) intro(st[0]); else extend(prev, st[i]); }, ms); }
      show(st[0]);
      if (animate && 'IntersectionObserver' in window) { fill.style.clipPath = 'inset(0 100% 0 0)'; this._io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { self._io.disconnect(); start(); } }, { threshold: 0.2 }); this._io.observe(stage.querySelector('.sbar')); } else start(); /* watch the box, not the clipped fill */
      this._played = true; this._normd = null; this._res = null;
      this.dispatchEvent(new CustomEvent('gwi-chart-ready', { detail: { type: 'stat-bar' }, bubbles: true, composed: true }));
    }
    /* ----- tooltip + interaction ----- */
    _showTip(tipObj, x, y) {
      var tip = this._q('.tip'), stage = this._q('.stage');
      this._tipFill = 1; tip.innerHTML = '<b>' + esc(tipObj.t) + '</b>' + tipObj.rows.map(function (r) { return '<div class="r">' + (r.c ? '<i style="background:' + r.c + '"></i>' : '<i style="background:transparent"></i>') + '<span>' + esc(r.n) + '</span><strong>' + esc(r.v) + '</strong></div>'; }).join('');
      this._tok(tip);
      var sr = stage.getBoundingClientRect(), wr = this._q('.wrap').getBoundingClientRect(), tw_ = tip.offsetWidth, th_ = tip.offsetHeight;
      var px = x - wr.left + 14, py = y - wr.top - th_ - 12;
      if (px + tw_ > wr.width) px = x - wr.left - tw_ - 14;
      if (px < 0) px = 0; if (py < 0) py = y - wr.top + 18;
      tip.style.left = px + 'px'; tip.style.top = py + 'px'; tip.classList.add('on'); this._tipOn = true;
    }
    _hideTip() { var tip = this._q('.tip'); if (tip) tip.classList.remove('on'); this._tipOn = false; var xh = this._q('.xh'); if (xh) xh.style.display = 'none'; var sv = this._q('svg.chart'); if (sv) sv.classList.remove('hov'); this._focusMark(null); this._focusSeries(null); }
    _focusMark(m) { /* focus one data point, grey out every other one, reveal its hover-only value */
      var svg = this._q('svg.chart'); if (!svg) return;
      var rel = m != null && this._res && this._res.rel && this._res.rel[m];
      var ss = null; if (m != null) { ss = []; [].forEach.call(svg.querySelectorAll('[data-m][data-s]'), function (el) { var mm = +el.getAttribute('data-m'); if ((rel ? rel.indexOf(mm) > -1 : mm === +m) && ss.indexOf(+el.getAttribute('data-s')) < 0) ss.push(+el.getAttribute('data-s')); }); if (!ss.length) ss = null; }
      this._legendFocus(ss);
      [].forEach.call(svg.querySelectorAll('[data-m]'), function (el) {
        var on = m != null && (rel ? rel.indexOf(+el.getAttribute('data-m')) > -1 : el.getAttribute('data-m') === String(m));
        if (el.classList.contains('rv')) el.classList.toggle('on', on); else el.classList.toggle('off', m != null && !on);
      });
    }
    _onMove(e) {
      if (!this._res || e.pointerType === 'touch' && false) return;
      var res = this._res, t = e.target;
      if (res.hover && t.classList && t.classList.contains('hit-x')) {
        var svg = this._q('svg.chart'), pt = svg.getBoundingClientRect(), sx = svg.viewBox.baseVal.width / pt.width, mx = (e.clientX - pt.left) * sx, xs = res.hover.xs, bi = 0, bd = 1e9;
        xs.forEach(function (x, i) { var dd = Math.abs(x - mx); if (dd < bd) { bd = dd; bi = i; } });
        if (res.hover.series) { /* several series: focus the one under the pointer, show all its values, grey the rest */
          var sy = svg.viewBox.baseVal.height / pt.height, py = (e.clientY - pt.top) * sy;
          this._focusSeries(res.hover.pick(res.hover.ys[bi], py)); this._q('.tip').classList.remove('on'); return;
        }
        var xh = this._q('.xh'); xh.style.display = '';
        xh.querySelector('line').setAttribute('x1', xs[bi]); xh.querySelector('line').setAttribute('x2', xs[bi]);
        [].forEach.call(xh.querySelectorAll('circle'), function (c, k) { c.setAttribute('cx', xs[bi]); c.setAttribute('cy', res.hover.ys[bi][k]); });
        this._q('svg.chart').classList.add('hov'); this._showTip(res.tips[bi], e.clientX, e.clientY);
        return;
      }
      var m = t.closest && t.closest('[data-tip]');
      if (m) {
        var idx = +m.getAttribute('data-tip'), tp = res.tips[idx];
        if (res.seriesFocus && m.hasAttribute('data-s')) { this._focusMark(null); this._focusSeries(+m.getAttribute('data-s')); } else this._focusMark(idx);
        if (m.hasAttribute('data-notip')) { this._q('.tip').classList.remove('on'); } else this._showTip(tp, e.clientX, e.clientY);
      } else this._hideTip();
    }
    _onFocus(e) {
      var m = e.target.closest && e.target.closest('[data-tip]'); if (!m || !this._res) return;
      var r = m.getBoundingClientRect(), fi = +m.getAttribute('data-tip'); if (this._res.seriesFocus && m.hasAttribute('data-s')) this._focusSeries(+m.getAttribute('data-s')); else this._focusMark(fi); if (!m.hasAttribute('data-notip')) this._showTip(this._res.tips[fi], r.left + r.width / 2, r.top);
    }
    _onClick(e) {
      var m = e.target.closest && e.target.closest('[data-tip]'); if (!m || !this._res) return;
      var tp = this._res.tips[+m.getAttribute('data-tip')];
      this.dispatchEvent(new CustomEvent('gwi-chart-select', { detail: { label: tp.t, rows: tp.rows.map(function (r) { return { name: r.n, value: r.v }; }) }, bubbles: true, composed: true }));
    }
    _legendFocus(set) { /* grey the key entries that do not apply to what is hovered */
      var lg = this._q('.legend'); if (!lg) return;
      [].forEach.call(lg.querySelectorAll('li[data-k]'), function (li) { li.classList.toggle('off', !!set && set.indexOf(+li.getAttribute('data-k')) < 0); });
    }
    _focusSeries(k) {
      this._legendFocus(k == null ? null : [k]); /* focus one series: grey out the others, show the values of this one */
      var svg = this._q('svg.chart'); if (!svg) return;
      [].forEach.call(svg.querySelectorAll('[data-s]'), function (el) {
        var on = k != null && +el.getAttribute('data-s') === k;
        if (el.classList.contains('rv')) el.classList.toggle('on', on); else el.classList.toggle('off', k != null && !on);
      });
    }
    /* ----- table + CSV ----- */
    _rows(d, S, type) {
      if (type === 'scatter') { var sc = d.sc, g = sc.groups.length > 1; return { head: ['Name', sc.xLabel || 'X', sc.yLabel || 'Y'].concat(g ? ['Group'] : []), rows: sc.pts.map(function (p) { return [p.name, S.fmtN(p.x), S.fmtN(p.y)].concat(g ? [p.g] : []); }), raw: sc.pts.map(function (p) { return [p.name, p.x, p.y].concat(g ? [p.g] : []); }) }; }
      if (type === 'sankey') { var lk = d.sk.links, nn = d.sk.nodes; return { head: ['Source', 'Target', 'Value'], rows: lk.map(function (l) { return [nn[l.s].name, nn[l.t].name, S.vf(l.v)]; }), raw: lk.map(function (l) { return [nn[l.s].name, nn[l.t].name, l.v]; }) }; }
      if (d.groups) return { head: ['Group', (S.raw && S.raw.categoryLabel) || 'Statement', d.series[0].name], rows: d.cats.map(function (c, i) { return [d.groups[d.grp[i]].name, c, S.vf(d.series[0].values[i])]; }), raw: d.cats.map(function (c, i) { return [d.groups[d.grp[i]].name, c, d.series[0].values[i]]; }) };
      if (type === 'treemap' || type === 'half-donut') return { head: ['Name', d.series[0].name], rows: d.cats.map(function (c, i) { return [c, S.vf(d.series[0].values[i])]; }), raw: d.cats.map(function (c, i) { return [c, d.series[0].values[i]]; }) };
      return { head: [(S.raw && S.raw.categoryLabel) || ''].concat(d.series.map(function (s) { return s.name; })), rows: d.cats.map(function (c, i) { return [c].concat(d.series.map(function (s) { return S.vf(s.values[i]); })); }), raw: d.cats.map(function (c, i) { return [c].concat(d.series.map(function (s) { return s.values[i]; })); }) };
    }
    _buildTable(d, S, type) { this._putTable(this._rows(d, S, type)); }
    _putTable(t) {
      this._tbl = t; var w = this._q('[data-table]'); if (!w) return;
      w.innerHTML = '<table><caption class="sr">' + esc(this.getAttribute('title') || 'Chart data') + '</caption><thead><tr>' + t.head.map(function (h) { return '<th scope="col">' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + t.rows.map(function (r) { return '<tr>' + r.map(function (c, i) { return i ? '<td>' + esc(c) + '</td>' : '<th scope="row">' + esc(c) + '</th>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
    }
    _applyTable(on) { /* show the table or the chart. A chart inside a carousel is switched together with its neighbours */
      this._tblOn = on;
      var wrap = this._q('[data-table]'), svg = this._q('svg.chart') || this._q('.gx'), btn = this._q('[data-act="table"]'); if (!wrap) return;
      wrap.classList.toggle('sr', !on); wrap.classList.toggle('tablewrap', true);
      if (svg) svg.style.display = on ? 'none' : ''; this._q('.keyrow').classList.toggle('tbl', on);
      if (btn) { btn.textContent = on ? 'View as chart' : 'View as table'; btn.setAttribute('aria-pressed', on ? 'true' : 'false'); }
    }
    _toggleTable(btn) { var on = this._q('[data-table]').classList.contains('sr'); this._applyTable(on); this.dispatchEvent(new CustomEvent('gwi-chart-table', { detail: { on: on }, bubbles: true, composed: true })); }
    _views() { /* a data set can hold several views (markets, sectors) behind a filter: { filterLabel, views: [ { name, ...data } ] } or { views: { Name: {...data} } } */
      var v = this._data && this._data.views, out = [];
      if (Array.isArray(v)) v.forEach(function (x, i) { if (x && typeof x === 'object') out.push({ name: String(x.name != null ? x.name : 'View ' + (i + 1)), data: x }); });
      else if (v && typeof v === 'object') Object.keys(v).forEach(function (k) { out.push({ name: k, data: v[k] }); });
      return out;
    }
    _eff() { /* the data for the view that is selected right now */
      var vs = this._views(); if (!vs.length) return this._data;
      if (this._view == null || this._view >= vs.length) { var dn = this._data.defaultView, di = -1; vs.forEach(function (x, i) { if (x.name === dn) di = i; }); this._view = di >= 0 ? di : 0; }
      var base = Object.assign({}, this._data); delete base.views; delete base.filter; delete base.filterLabel; delete base.defaultView;
      return Object.assign(base, vs[this._view].data);
    }
    _sourcesInfo() {
      var a = this._attrs(), raw = this._eff() || {}, qs = [], list = null;
      if (a.questions) { try { list = JSON.parse(a.questions); } catch (e) { list = null; } } else if (raw && raw.questions) list = raw.questions;
      if (Array.isArray(list)) list.forEach(function (q) { if (typeof q === 'string') qs.push({ text: q }); else if (q && (q.text || q.question)) qs.push({ text: q.text || q.question, url: q.url || q.link }); });
      else if (a.question) qs.push({ text: a.question, url: a['question-url'] });
      return { source: a.source, sourceUrl: a['source-url'], base: a.base, qs: qs };
    }
    _renderBack(info, hasInfo) {
      var back = this._q('.back'), self = this;
      function link(t, u) { return /^https?:\/\//i.test(u || '') ? '<a href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' + esc(t) + '</a>' : esc(t); }
      var rows = '';
      if (info.source) rows += '<dt>Source</dt><dd>' + link(info.source, info.sourceUrl) + '</dd>';
      if (info.base) rows += '<dt>Base</dt><dd>' + esc(info.base) + '</dd>';
      if (info.qs.length) rows += '<dt>' + (info.qs.length > 1 ? 'Questions' : 'Question') + '</dt><dd><ol class="bk-q">' + info.qs.map(function (q) { return '<li>' + link(q.text, q.url) + '</li>'; }).join('') + '</ol></dd>';
      back.innerHTML = hasInfo ? '<h4 class="bk-h">Sources</h4><dl class="bk-dl">' + rows + '</dl><div class="acts"><button type="button" class="cta pri" data-act="unflip">Back to chart</button></div>' : '';
      back.onclick = function (e) { var b = e.target.closest && e.target.closest('button'); if (b && b.getAttribute('data-act') === 'unflip') self._flip(false); };
      back.onkeydown = function (e) { if (e.key === 'Escape') self._flip(false); };
      if (this._q('.card').classList.contains('flipped') && !hasInfo) this._flip(false);
    }
    _flip(on) {
      var card = this._q('.card'), front = this._q('.front'), back = this._q('.back'), btn = this._q('[data-act="flip"]');
      if (!this._q('.bk-dl')) return;
      this._hideTip(); card.classList.toggle('flipped', on);
      front.toggleAttribute('inert', on); front.setAttribute('aria-hidden', on ? 'true' : 'false');
      back.toggleAttribute('inert', !on); back.setAttribute('aria-hidden', on ? 'false' : 'true');
      if (btn) btn.setAttribute('aria-expanded', on ? 'true' : 'false');
      var target = on ? back.querySelector('button') : btn; setTimeout(function () { if (target) target.focus({ preventScroll: true }); }, 60);
    }
    _fontData() { /* the fonts as data: URLs, so the image export carries them */
      if (this._fd) return this._fd;
      var css = ''; [].forEach.call(document.querySelectorAll('style[data-gwi-chart-fonts]'), function (st) { css += st.textContent; });
      var urls = []; css.replace(/url\("([^"]+)"\)/g, function (m, u) { if (u.indexOf('data:') !== 0 && urls.indexOf(u) < 0) urls.push(u); return m; });
      return (this._fd = Promise.all(urls.map(function (u) {
        return fetch(u).then(function (r) { return r.blob(); }).then(function (b) { return new Promise(function (res) { var fr = new FileReader(); fr.onload = function () { res([u, fr.result]); }; fr.readAsDataURL(b); }); }).catch(function () { return [u, u]; });
      })).then(function (pairs) { pairs.forEach(function (p) { css = css.split('"' + p[0] + '"').join('"' + p[1] + '"'); }); return css; }));
    }
    _jpg(force) {
      if (!force && !this.dispatchEvent(new CustomEvent('gwi-chart-download', { bubbles: true, composed: true, cancelable: true }))) return; /* a carousel can take over to save every graph */
      var self = this, btn = this._q('[data-act="jpg"]'), front = this._q('.front'); if (!front) return;
      this._hideTip();
      var a = this._attrs(), stage = this._q('.stage'), W = Math.max(Math.round(front.getBoundingClientRect().width), stage.scrollWidth), pad = 24;
      var c = front.cloneNode(true); c.className = 'front'; c.removeAttribute('inert'); c.removeAttribute('aria-hidden'); c.style.cssText = 'width:' + W + 'px';
      [].forEach.call(c.querySelectorAll('animate'), function (an_) { var p = an_.parentNode, at = an_.getAttribute('attributeName'); if (at) p.setAttribute(at, an_.getAttribute('to')); an_.remove(); }); /* show the end state, not the intro */
      [].forEach.call(c.querySelectorAll('.pre'), function (e) { e.classList.remove('pre'); e.classList.add('go'); });
      [].forEach.call(c.querySelectorAll('.off,.on'), function (e) { e.classList.remove('off'); e.classList.remove('on'); });
      [].forEach.call(c.querySelectorAll('[data-final]'), function (e) { e.textContent = e.getAttribute('data-final'); }); /* big numbers: the final figure, not mid count */
      var ssel = c.querySelector('.subsel'); if (ssel) { var sp = document.createElement('p'); sp.className = 'sub'; sp.textContent = (this._sel && this._sel.items[this._sel.index]) || a.subtitle || ''; ssel.replaceWith(sp); } /* the picture shows the subtitle, not the selector */
      var st = c.querySelector('.stage'); if (st) { st.style.overflow = 'visible'; st.classList.remove('scroll'); }
      var sv = c.querySelector('svg.chart'); if (sv) sv.style.display = ''; var tb = c.querySelector('[data-table]'); if (tb) { tb.classList.add('sr'); }
      var lg = c.querySelector('.legend'); if (lg) { lg.style.visibility = ''; lg.style.height = ''; }
      var info = this._sourcesInfo(), parts = [];
      if (info.source) parts.push('<span><b>Source:</b> ' + esc(info.source) + '</span>'); if (info.base) parts.push('<span><b>Base:</b> ' + esc(info.base) + '</span>');
      var ft = c.querySelector('.foot'); if (ft) { ft.innerHTML = parts.length ? '<p class="notes">' + parts.join(' <i class="dot">•</i> ') + '</p>' : ''; if (!parts.length) ft.style.display = 'none'; }
      if (btn) btn.disabled = true;
      this._fontData().then(function (fontCss) {
        var holder = document.createElement('div'); holder.className = 'xhost'; holder.style.cssText = 'width:' + (W + pad * 2) + 'px;padding:' + pad + 'px;box-sizing:border-box;background:#fff'; var hcs = getComputedStyle(self); VARNAMES.forEach(function (n) { var val = hcs.getPropertyValue(n).trim(); if (val) holder.style.setProperty(n, val); }); /* the picture keeps the inline styling */
        var style = document.createElement('style'); style.textContent = fontCss + CSS.replace(/:host\(\[hidden\]\)/g, '.xhost[hidden]').replace(/:host/g, '.xhost'); holder.appendChild(style);
        var wrap = document.createElement('div'); wrap.className = 'wrap'; wrap.appendChild(c); holder.appendChild(wrap);
        var meas = document.createElement('div'); meas.style.cssText = 'position:fixed;left:-99999px;top:0'; document.body.appendChild(meas);
        var sr = meas.attachShadow({ mode: 'open' }); sr.appendChild(holder);
        return (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () {
          var H = Math.ceil(holder.getBoundingClientRect().height), W2 = W + pad * 2; sr.removeChild(holder); meas.remove();
          var xml = new XMLSerializer().serializeToString(holder);
          var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W2 + '" height="' + H + '"><foreignObject x="0" y="0" width="100%" height="100%">' + xml + '</foreignObject></svg>';
          return new Promise(function (res, rej) {
            var img = new Image(); img.onload = function () { res([img, W2, H]); }; img.onerror = function () { rej(new Error('render')); };
            img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
          });
        });
      }).then(function (r) {
        var img = r[0], W2 = r[1], H = r[2], k = Math.min(2, 8000 / Math.max(W2, H)), cv = document.createElement('canvas'); cv.width = Math.round(W2 * k); cv.height = Math.round(H * k);
        var cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(img, 0, 0, cv.width, cv.height);
        cv.toBlob(function (b) {
          if (!b) { if (btn) btn.disabled = false; return; }
          var url = URL.createObjectURL(b), l = document.createElement('a'); l.href = url;
          l.download = ((a.filename || a.title || 'gwi-chart').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'gwi-chart') + '.jpg';
          self._root.appendChild(l); l.click(); l.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 1000); if (btn) btn.disabled = false;
          self.dispatchEvent(new CustomEvent('gwi-chart-image', { bubbles: true, composed: true }));
        }, 'image/jpeg', 0.92);
      }).catch(function () { if (btn) btn.disabled = false; self.dispatchEvent(new CustomEvent('gwi-chart-error', { detail: { message: 'Could not create the image.' }, bubbles: true, composed: true })); });
    }
    _csv() {
      var t = this._tbl; if (!t) return;
      function q(v) { v = String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
      var csv = [t.head].concat(t.raw).map(function (r) { return r.map(q).join(','); }).join('\n');
      var url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), a = document.createElement('a');
      a.href = url; a.download = ((this.getAttribute('title') || 'gwi-chart-data').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'gwi-chart-data') + '.csv';
      this._root.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }
  };

  /* <gwi-chart-carousel interval="8" download-all selector> holds several <gwi-chart> tags and shows one at a time. With selector, each chart's subtitle becomes a dropdown option and the dropdown replaces the subtitle; picking one stops the loop and shows that chart. It moves on by itself
   * every "interval" seconds and loops. Pressing an arrow (the charts draw previous / next arrows by the Download image button)
   * stops that for good and moves one chart. Give every chart the same height="..." so they line up. download-all: Download image
   * saves every chart in turn, not just the one on screen (set a filename="..." on each chart). Table view is switched together. */
  var GwiCarousel = class extends HTMLElement {
    connectedCallback() {
      var self = this; if (this._on) return;
      if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', function () { self.connectedCallback(); }, { once: true }); return; } /* children are not parsed yet */
      this._on = true;
      this.style.display = 'grid'; this._i = 0;
      this._kids = [].slice.call(this.children).filter(function (c) { return c.tagName === 'GWI-CHART'; });
      var sel = this.hasAttribute('selector'), subs = this._kids.map(function (k) { return k.getAttribute('subtitle') || ''; });
      this._kids.forEach(function (k, i) {
        k.style.gridArea = '1 / 1'; k.style.minWidth = '0';
        if (sel) { k._sel = { items: subs, index: i }; k._renderShell(); } else k.setAttribute('nav', ''); /* selector: a dropdown in place of the subtitle. Otherwise: prev / next arrows */
        self._set(k, i === 0);
      });
      this.addEventListener('gwi-chart-pick', function (e) { e.stopPropagation(); self._stop(); self.show((e.detail && e.detail.index) || 0); });
      this.addEventListener('gwi-chart-nav', function (e) { e.stopPropagation(); self._stop(); var n = self._kids.length; self.show((self._i + ((e.detail && e.detail.dir) || 1) + n) % n); });
      this.addEventListener('gwi-chart-table', function (e) { e.stopPropagation(); self._kids.forEach(function (k) { if (k !== e.target) k._applyTable(e.detail.on); }); });
      this.addEventListener('gwi-chart-download', function (e) {
        if (!self.hasAttribute('download-all') || self._kids.length < 2) return;
        e.preventDefault(); e.stopPropagation(); if (self._dl) return; self._dl = true; var p = Promise.resolve();
        self._kids.forEach(function (k) { p = p.then(function () { return new Promise(function (res) { var done = function () { k.removeEventListener('gwi-chart-image', done); res(); }; k.addEventListener('gwi-chart-image', done); k._jpg(true); setTimeout(res, 8000); }).then(function () { return new Promise(function (r) { setTimeout(r, 500); }); }); }); });
        p.then(function () { self._dl = false; });
      });
      var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!still && this._kids.length > 1) {
        var go = function () { var ms = Math.max(1, +(self.getAttribute('interval') || 8)) * 1000; self._t = setInterval(function () { self.show((self._i + 1) % self._kids.length); }, ms); };
        if ('IntersectionObserver' in window) { this._io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { self._io.disconnect(); if (!self._stopped) go(); } }, { threshold: 0.3 }); this._io.observe(this); } else go();
      }
    }
    disconnectedCallback() { this._stop(); if (this._io) this._io.disconnect(); this._on = false; }
    _set(k, on) { k.style.visibility = on ? 'visible' : 'hidden'; k.style.pointerEvents = on ? '' : 'none'; k.toggleAttribute('inert', !on); k.setAttribute('aria-hidden', on ? 'false' : 'true'); }
    _stop() { clearInterval(this._t); this._t = null; this._stopped = true; }
    show(i) {
      var self = this, k = this._kids[i]; if (!k) return;
      this._kids.forEach(function (x, j) { self._set(x, j === i); }); this._i = i;
      k._played = false; k._render();
      if (k.animate) k.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, easing: 'ease' });
    }
  };

  window.GwiChart = window.GwiChart || {};
  window.GwiChart.version = '1.3.0';
  window.GwiChart.cssVars = VARNAMES.slice();
  window.GwiChart.types = ['bar', 'column', 'line', 'area', 'stacked-area', 'stacked-bar', 'stacked-column', 'heatmap', 'treemap', 'sankey', 'scatter', 'dot-plot', 'slope', 'half-donut', 'inline-donut', 'inline-dots', 'stat', 'stats', 'stat-bar'];
  fontCSS();
  customElements.define('gwi-chart', GwiChart);
  if (!customElements.get('gwi-chart-carousel')) customElements.define('gwi-chart-carousel', GwiCarousel);
})();
