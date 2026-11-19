/* Illustrated sample-home rooms, restyled per style. drawRoom(room, scene) -> SVG string.
   Simple one-point perspective: x across the room (-1..1), z depth (0 = back wall, 1 = front edge), y height (0 floor .. 1 ceiling). */
const ROOMS = (() => {
  const W = 800, H = 500, VX = 400;
  const k = z => 1 + 0.739 * z;
  const P = (x, z, y) => [VX + x * 230 * k(z), 330 + 170 * z - y * 260 * k(z)];
  const pt = p => p[0].toFixed(1) + ',' + p[1].toFixed(1);
  const hexRGB = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const toHex = c => '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { const A = hexRGB(a), B = hexRGB(b); return toHex(A.map((v, i) => v + (B[i] - v) * t)); };
  const sh = (h, t) => t < 0 ? mix(h, '#000000', -t) : mix(h, '#FFFFFF', t);
  const lum = h => { const [r, g, b] = hexRGB(h); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; };
  const line = c => lum(c) > 0.5 ? sh(c, -0.14) : sh(c, 0.16);
  let seed = 1; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const poly = (pts, fill, extra = '') => `<polygon points="${pts.map(pt).join(' ')}" fill="${fill}" ${extra}/>`;
  const rect = (x, y, w, h, fill, extra = '') => `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(0, w).toFixed(1)}" height="${Math.max(0, h).toFixed(1)}" fill="${fill}" ${extra}/>`;
  const ln = (a, b, c, w = 1, extra = '') => `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="${c}" stroke-width="${w}" ${extra}/>`;

  // a box: x0..x1, front face at z (depth d going back), height y0..y1
  function box(x0, x1, z, d, y0, y1, c, o = {}) {
    let s = '';
    const top = [P(x0, z, y1), P(x1, z, y1), P(x1, z - d, y1), P(x0, z - d, y1)];
    if (x1 < 0) s += poly([P(x1, z, y0), P(x1, z - d, y0), P(x1, z - d, y1), P(x1, z, y1)], sh(c, -0.18));
    if (x0 > 0) s += poly([P(x0, z, y0), P(x0, z - d, y0), P(x0, z - d, y1), P(x0, z, y1)], sh(c, -0.18));
    if (!o.notop) s += poly(top, o.top || sh(c, 0.12));
    const a = P(x0, z, y1), b = P(x1, z, y0);
    s += rect(a[0], a[1], b[0] - a[0], b[1] - a[1], c, o.rx ? `rx="${o.rx}"` : '');
    return s;
  }
  const fr = (x0, x1, z, y0, y1) => { const a = P(x0, z, y1), b = P(x1, z, y0); return [a[0], a[1], b[0] - a[0], b[1] - a[1]]; };

  // ---------- shell ----------
  function shell(wall, floor, floorT, ceil) {
    let s = '';
    const bw = [P(-1, 0, 1), P(1, 0, 1), P(1, 0, 0), P(-1, 0, 0)];
    s += poly([[0, 0], [W, 0], P(1, 0, 1), P(-1, 0, 1)], ceil || sh(wall, 0.35));
    s += poly([[0, 0], P(-1, 0, 1), P(-1, 0, 0), [0, H]], sh(wall, -0.07));
    s += poly([[W, 0], P(1, 0, 1), P(1, 0, 0), [W, H]], sh(wall, -0.1));
    s += poly(bw, wall);
    s += poly([P(-1, 0, 0), P(1, 0, 0), [W, H], [0, H]], floor);
    s += clipFloor(floorLines(floor, floorT));
    // skirting
    s += ln(P(-1, 0, 0.015), P(1, 0, 0.015), sh(wall, -0.12), 2);
    return s;
  }
  function floorLines(c, t) {
    let s = '', lc = sh(c, -0.16), n, rows;
    const along = (x, w = 0.8) => ln(P(x, 0, 0), P(x, 1, 0), lc, w);
    const across = z => ln(P(-1.4, z, 0), P(1.4, z, 0), lc, 0.8);
    if (t === 'wood' || t === 'herring') {
      n = t === 'wood' ? 14 : 22;
      for (let i = 0; i <= n; i++) s += along(-1.4 + 2.8 * i / n, 0.7);
      seed = 7;
      for (let i = 0; i < n; i++) for (let j = 0; j < 5; j++) {
        const x = -1.4 + 2.8 * (i + 0.5) / n, z = (j + rnd()) / 5;
        if (t === 'herring') { const a = P(x - 1.4 / n, z, 0), b = P(x, z + 0.06, 0), c2 = P(x + 1.4 / n, z, 0); s += `<polyline points="${pt(a)} ${pt(b)} ${pt(c2)}" fill="none" stroke="${lc}" stroke-width="0.7"/>`; }
        else s += ln(P(x - 1.4 / n, z, 0), P(x + 1.4 / n, z, 0), lc, 0.7);
      }
    } else {
      const big = t === 'concrete';
      n = big ? 6 : 10; rows = big ? 4 : 7;
      if (t === 'terracotta') lc = sh(c, 0.25);
      for (let i = 0; i <= n; i++) s += along(-1.4 + 2.8 * i / n, big ? 0.6 : 1);
      for (let j = 1; j <= rows; j++) s += across(Math.pow(j / rows, 1.15));
      if (big) { seed = 3; for (let i = 0; i < 40; i++) { const p = P(-1 + 2 * rnd(), rnd(), 0); s += `<circle cx="${p[0]}" cy="${p[1]}" r="${1 + rnd() * 2}" fill="${sh(c, -0.06)}"/>`; } }
    }
    return s;
  }
  let uid = 0;
  function clipFloor(inner) { const id = 'fl' + (++uid) + Math.random().toString(36).slice(2, 6);
    return `<clipPath id="${id}"><polygon points="${[P(-1, 0, 0), P(1, 0, 0), [W, H], [0, H]].map(pt).join(' ')}"/></clipPath><g clip-path="url(#${id})">${inner}</g>`; }
  // back-wall features
  function feature(f, wall, sc) {
    let s = ''; const [x, y, w, h] = fr(-1, 1, 0, 0, 1), lc = sh(wall, -0.1);
    if (f === 'slats') { const [a, b, cw, ch] = fr(-0.98, -0.38, 0.005, 0, 0.98); s += rect(a, b, cw, ch, sh(sc.wood, 0.05)); for (let i = 0; i < 22; i++) s += rect(a + i * cw / 22, b, 1.5, ch, sh(sc.wood, -0.25)); }
    if (f === 'fluted') { const [a, b, cw, ch] = fr(-0.98, -0.42, 0.005, 0, 0.98); s += rect(a, b, cw, ch, sc.wood); for (let i = 0; i < 30; i++) s += rect(a + i * cw / 30, b, cw / 60, ch, sh(sc.wood, -0.12)); }
    if (f === 'panelling') { for (let i = 0; i < 6; i++) { const px = x + 14 + i * (w - 28) / 6; s += rect(px + 6, y + 120, (w - 28) / 6 - 12, h - 136, 'none', `stroke="${lc}" stroke-width="1.5"`); s += rect(px + 6, y + 16, (w - 28) / 6 - 12, 92, 'none', `stroke="${lc}" stroke-width="1.5"`); } }
    if (f === 'brick') { const bc = sc.accent || '#9A4E35'; s += rect(x, y, w, h, bc); for (let r = 0; r * 13 < h; r++) { s += ln([x, y + r * 13], [x + w, y + r * 13], sh(bc, 0.35), 1.2); for (let c = 0; c * 38 < w + 38; c++) { const bx = x + c * 38 + (r % 2) * 19; s += ln([bx, y + r * 13], [bx, y + r * 13 + 13], sh(bc, 0.35), 1.2); } } }
    if (f === 'stone') { const [a, b, cw, ch] = fr(-0.98, -0.3, 0.005, 0, 1); const st = sc.accent || '#A79C8C'; s += rect(a, b, cw, ch, st); seed = 11; for (let r = 0; r < 14; r++) { let cx = a; while (cx < a + cw) { const ww = 18 + rnd() * 30; s += rect(cx + 1, b + r * ch / 14 + 1, Math.min(ww, a + cw - cx) - 2, ch / 14 - 2, sh(st, (rnd() - 0.5) * 0.25), 'rx="3"'); cx += ww; } } s += box(-0.98, -0.3, 0.06, 0.06, 0.42, 0.45, sc.wood); }
    if (f === 'wallpaper') { const bg = sc.accent || '#2F5D3A'; s += rect(x, y, w, h, bg); seed = 5; for (let i = 0; i < 70; i++) { const cx = x + rnd() * w, cy = y + rnd() * h, r = 10 + rnd() * 16, a = rnd() * 180; s += `<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 0.38}" transform="rotate(${a} ${cx} ${cy})" fill="${sh(bg, 0.2 + rnd() * 0.25)}"/>`; } }
    if (f === 'beams') { for (let i = 0; i < 4; i++) { const zz = 0.15 + i * 0.27; s += poly([P(-1, zz, 1), P(1, zz, 1), P(1, zz + 0.06, 1), P(-1, zz + 0.06, 1)], sh(sc.wood, -0.25)); } }
    if (f === 'arch') { const [a, b, cw, ch] = fr(0.55, 0.85, 0.002, 0.35, 0.82); s += `<path d="M${a} ${b + ch} V${b + cw / 2} A${cw / 2} ${cw / 2} 0 0 1 ${a + cw} ${b + cw / 2} V${b + ch} Z" fill="${sh(sc.accent || sc.wall, sc.accent ? 0 : -0.08)}"/>`; s += `<ellipse cx="${a + cw / 2}" cy="${b + ch - 8}" rx="12" ry="18" fill="${sc.cushions[0]}"/>`; }
    return s;
  }
  function windowLeft(z0, z1, y0, y1, frame, curtain) {
    let s = poly([P(-1, z0, y0), P(-1, z1, y0), P(-1, z1, y1), P(-1, z0, y1)], '#DCE8EE');
    s += poly([P(-1, z0, y0), P(-1, z1, y0), P(-1, z1, y1), P(-1, z0, y1)], 'none', `stroke="${frame}" stroke-width="5"`);
    s += ln(P(-1, (z0 + z1) / 2, y0), P(-1, (z0 + z1) / 2, y1), frame, 3);
    if (curtain) { s += poly([P(-1, z0 - 0.04, 0.02), P(-1, z0 + 0.03, 0.02), P(-1, z0 + 0.03, 0.97), P(-1, z0 - 0.04, 0.97)], curtain, 'opacity="0.92"'); s += poly([P(-1, z1 - 0.03, 0.02), P(-1, z1 + 0.05, 0.02), P(-1, z1 + 0.05, 0.97), P(-1, z1 - 0.03, 0.97)], curtain, 'opacity="0.92"'); }
    return s;
  }
  function windowRight(z0, z1, y0, y1, frame) {
    let s = poly([P(1, z0, y0), P(1, z1, y0), P(1, z1, y1), P(1, z0, y1)], '#DCE8EE');
    s += poly([P(1, z0, y0), P(1, z1, y0), P(1, z1, y1), P(1, z0, y1)], 'none', `stroke="${frame}" stroke-width="5"`);
    return s;
  }
  function art(type, x0, x1, y0, y1, sc) {
    if (type === 'none') return '';
    const [x, y, w, h] = fr(x0, x1, 0.003, y0, y1); let s = '';
    if (type === 'gallery') { seed = 9; const fr2 = [[0, 0, .3, .55], [.34, 0, .28, .4], [.66, 0, .34, .62], [.34, .45, .28, .55], [0, .6, .3, .4], [.66, .66, .34, .34]];
      fr2.forEach((f, i) => { s += rect(x + f[0] * w, y + f[1] * h, f[2] * w - 4, f[3] * h - 4, sc.cushions[i % 3], `stroke="${sc.metal}" stroke-width="3"`); }); return s; }
    if (type === 'sunburst') { const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2; for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12; s += ln([cx, cy], [cx + Math.cos(a) * r, cy + Math.sin(a) * r], sc.metal, 2.5); } s += `<circle cx="${cx}" cy="${cy}" r="${r * 0.35}" fill="${sh(sc.wall, 0.3)}" stroke="${sc.metal}" stroke-width="3"/>`; return s; }
    s += rect(x, y, w, h, '#FAF8F4', `stroke="${type === 'print' ? sc.wood : sc.metal}" stroke-width="3"`);
    const ix = x + 8, iy = y + 8, iw = w - 16, ih = h - 16;
    if (type === 'abstract') { s += `<circle cx="${ix + iw * 0.38}" cy="${iy + ih * 0.5}" r="${ih * 0.3}" fill="${sc.cushions[0]}"/>`; s += rect(ix + iw * 0.5, iy + ih * 0.2, iw * 0.35, ih * 0.6, sc.cushions[1], 'opacity="0.85"'); }
    if (type === 'landscape') { s += rect(ix, iy, iw, ih, sh(sc.wall, 0.2)); s += `<path d="M${ix} ${iy + ih} L${ix + iw * 0.3} ${iy + ih * 0.45} L${ix + iw * 0.55} ${iy + ih * 0.75} L${ix + iw * 0.8} ${iy + ih * 0.4} L${ix + iw} ${iy + ih} Z" fill="${sc.cushions[0]}"/>`; }
    if (type === 'photo') { s += rect(ix, iy, iw, ih * 0.55, sh(sc.cushions[1], 0.45)); s += rect(ix, iy + ih * 0.55, iw, ih * 0.45, sh(sc.cushions[0], 0.1)); }
    if (type === 'print') { for (let i = 0; i < 3; i++) s += `<ellipse cx="${ix + iw * (0.3 + i * 0.2)}" cy="${iy + ih * 0.5}" rx="${iw * 0.08}" ry="${ih * 0.32}" fill="${sc.cushions[i]}"/>`; }
    return s;
  }
  function plant(x, z, size, pot) {
    let s = box(x - 0.06 * size, x + 0.06 * size, z, 0.05, 0, 0.1 * size, pot);
    const [cx, cy] = P(x, z - 0.02, 0.1 * size); seed = Math.round((x + 2) * 1000);
    for (let i = 0; i < 9; i++) { const a = -150 + rnd() * 120, r = (34 + rnd() * 34) * size * k(z); const ex = cx + Math.cos(a * Math.PI / 180) * r, ey = cy + Math.sin(a * Math.PI / 180) * r;
      s += `<ellipse cx="${(cx + ex) / 2}" cy="${(cy + ey) / 2}" rx="${r * 0.55}" ry="${r * 0.2}" transform="rotate(${a} ${(cx + ex) / 2} ${(cy + ey) / 2})" fill="${['#4C7A47', '#5E8A52', '#3E6B3C'][i % 3]}"/>`; }
    return s;
  }
  function pendant(type, x, z, drop, sc) {
    const top = P(x, z, 1), [cx, cy] = P(x, z, 1 - drop), r = 22 * k(z); let s = ln(top, [cx, cy], sh(sc.metal, 0), 1.5);
    const m = sc.metal;
    if (type === 'paper') s += `<circle cx="${cx}" cy="${cy + r * 0.8}" r="${r}" fill="#FBF7EE" stroke="#E5DDCF"/>`;
    else if (type === 'globe') s += `<circle cx="${cx}" cy="${cy + r * 0.7}" r="${r * 0.75}" fill="#FCFBF7" stroke="${m}"/>`;
    else if (type === 'woven') s += `<path d="M${cx - r * 1.2} ${cy + r} Q${cx} ${cy - r * 0.6} ${cx + r * 1.2} ${cy + r} Z" fill="#C9A46C" stroke="${sh('#C9A46C', -0.2)}"/>`;
    else if (type === 'factory') s += `<path d="M${cx - r} ${cy + r * 0.8} L${cx - r * 0.3} ${cy} L${cx + r * 0.3} ${cy} L${cx + r} ${cy + r * 0.8} Z" fill="${m}"/><circle cx="${cx}" cy="${cy + r * 0.85}" r="${r * 0.25}" fill="#F3C978"/>`;
    else if (type === 'linear') { const a = P(x - 0.35, z, 1 - drop), b = P(x + 0.35, z, 1 - drop); s = ln(P(x - 0.3, z, 1), P(x - 0.3, z, 1 - drop), m, 1) + ln(P(x + 0.3, z, 1), P(x + 0.3, z, 1 - drop), m, 1) + rect(a[0], a[1], b[0] - a[0], 6 * k(z), m); }
    else if (type === 'lantern') s += rect(cx - r * 0.5, cy, r, r * 1.4, '#F7EBD0', `stroke="${m}" stroke-width="3"`) + ln([cx, cy], [cx, cy + r * 1.4], m, 2);
    else if (type === 'sputnik') { for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; s += ln([cx, cy + r], [cx + Math.cos(a) * r * 1.6, cy + r + Math.sin(a) * r * 1.6], m, 2) + `<circle cx="${cx + Math.cos(a) * r * 1.6}" cy="${cy + r + Math.sin(a) * r * 1.6}" r="3" fill="#FFF6DA"/>`; } }
    else if (type === 'chandelier' || type === 'tiered') { const tiers = type === 'tiered' ? 3 : 1; for (let t = 0; t < tiers; t++) { const w2 = r * (1.6 - t * 0.4), yy = cy + r * 0.6 + t * r * 0.45; s += `<ellipse cx="${cx}" cy="${yy}" rx="${w2}" ry="${r * 0.18}" fill="none" stroke="${m}" stroke-width="2"/>`; for (let i = 0; i < 5; i++) s += `<circle cx="${cx - w2 + i * w2 / 2}" cy="${yy - 4}" r="3" fill="#FFF3C8"/>`; } }
    return s;
  }
  function rug(x0, x1, z0, z1, c, t, sc) {
    let s = poly([P(x0, z0, 0.002), P(x1, z0, 0.002), P(x1, z1, 0.002), P(x0, z1, 0.002)], c);
    const inner = (m, col, w = 2) => poly([P(x0 + m, z0 + m * 0.6, 0.003), P(x1 - m, z0 + m * 0.6, 0.003), P(x1 - m, z1 - m * 0.6, 0.003), P(x0 + m, z1 - m * 0.6, 0.003)], 'none', `stroke="${col}" stroke-width="${w}"`);
    if (t === 'border') s += inner(0.07, sh(c, -0.3), 3) + inner(0.12, sh(c, 0.3), 1.5);
    if (t === 'stripe') for (let i = 1; i < 6; i++) { const zz = z0 + (z1 - z0) * i / 6; s += poly([P(x0, zz, 0.003), P(x1, zz, 0.003), P(x1, zz + 0.025, 0.003), P(x0, zz + 0.025, 0.003)], sc.cushions[i % 2 ? 1 : 0]); }
    if (t === 'kilim') { for (let i = 1; i < 5; i++) { const zz = z0 + (z1 - z0) * i / 5; s += poly([P(x0, zz, 0.003), P(x1, zz, 0.003), P(x1, zz + 0.03, 0.003), P(x0, zz + 0.03, 0.003)], sc.cushions[i % 3]); }
      for (let i = 0; i < 4; i++) { const xx = x0 + (x1 - x0) * (i + 0.5) / 4, zz = (z0 + z1) / 2; s += poly([P(xx, zz - 0.07, 0.004), P(xx + 0.08, zz, 0.004), P(xx, zz + 0.07, 0.004), P(xx - 0.08, zz, 0.004)], sc.cushions[(i + 1) % 3]); } }
    if (t === 'geo') for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) { const [cx, cy] = P(x0 + (x1 - x0) * (i + 0.5) / 5, z0 + (z1 - z0) * (j + 0.5) / 3, 0.003); s += `<ellipse cx="${cx}" cy="${cy}" rx="${10 * k(z0)}" ry="${4 * k(z0)}" fill="none" stroke="${sc.cushions[(i + j) % 3]}" stroke-width="3"/>`; }
    if (t === 'jute') for (let i = 1; i < 18; i++) { const zz = z0 + (z1 - z0) * i / 18; s += ln(P(x0, zz, 0.003), P(x1, zz, 0.003), sh(c, -0.1), 0.8); }
    return s;
  }
  function wallTile(x0, x1, y0, y1, c, t, zoff = 0.003) {
    const [x, y, w, h] = fr(x0, x1, zoff, y0, y1); let s = rect(x, y, w, h, c); const lc = line(c); seed = 21;
    if (t === 'subway') { for (let r = 0; r * 9 < h; r++) { s += ln([x, y + r * 9], [x + w, y + r * 9], lc, 0.8); for (let i = 0; i * 26 < w + 26; i++) { const bx = x + i * 26 + (r % 2) * 13; if (bx < x + w) s += ln([bx, y + r * 9], [bx, Math.min(y + h, y + r * 9 + 9)], lc, 0.8); } } }
    if (t === 'zellige' || t === 'stack') { const tw = t === 'stack' ? 9 : 14, th = t === 'stack' ? 24 : 14; for (let r = 0; r * th < h; r++) for (let i = 0; i * tw < w; i++) s += rect(x + i * tw + 0.6, y + r * th + 0.6, Math.min(tw, x + w - (x + i * tw)) - 1.2, Math.min(th, y + h - (y + r * th)) - 1.2, sh(c, (rnd() - 0.5) * (t === 'zellige' ? 0.22 : 0.06))); }
    if (t === 'slab') { s += ln([x + w / 2, y], [x + w / 2, y + h], lc, 0.8); s += `<path d="M${x} ${y + h * 0.3} C${x + w * 0.3} ${y + h * 0.2} ${x + w * 0.5} ${y + h * 0.6} ${x + w} ${y + h * 0.5}" fill="none" stroke="${sh(c, -0.12)}" stroke-width="1"/>`; }
    if (t === 'herring') { for (let r = 0; r * 12 < h - 6; r++) for (let i = 0; i * 12 < w - 6; i++) { const bx = x + i * 12, by = y + r * 12; s += `<polyline points="${bx},${by + 6} ${bx + 6},${by} ${bx + 12},${by + 6}" fill="none" stroke="${lc}" stroke-width="0.8"/>`; } }
    if (t === 'pattern') { for (let r = 0; r * 22 < h; r++) for (let i = 0; i * 22 < w; i++) { const cx = x + i * 22 + 11, cy = y + r * 22 + 11; if (cx < x + w && cy < y + h) s += `<path d="M${cx} ${cy - 8} L${cx + 8} ${cy} L${cx} ${cy + 8} L${cx - 8} ${cy} Z" fill="${sh(c, 0.45)}"/><circle cx="${cx}" cy="${cy}" r="2.5" fill="${c}"/>`; } }
    if (t === 'stone') { for (let r = 0; r * 18 < h; r++) { let cx = x; while (cx < x + w) { const ww = 20 + rnd() * 34; s += rect(cx + 1, y + r * 18 + 1, Math.min(ww, x + w - cx) - 2, Math.min(18, y + h - y - r * 18) - 2, sh(c, (rnd() - 0.5) * 0.25), 'rx="3"'); cx += ww; } } }
    return s;
  }
  function floorTile(c, t) {
    if (t === 'check' || t === 'pattern' || t === 'hex' || t === 'terrazzo') {
      let s = ''; const n = 12, rows = 8, c2 = t === 'check' ? sh(c, lum(c) > 0.5 ? -0.5 : 0.75) : sh(c, 0.4);
      for (let i = 0; i < n; i++) for (let j = 0; j < rows; j++) { const xa = -1.4 + 2.8 * i / n, xb = -1.4 + 2.8 * (i + 1) / n, za = Math.pow(j / rows, 1.15), zb = Math.pow((j + 1) / rows, 1.15);
        if (t === 'check' && (i + j) % 2) s += poly([P(xa, za, 0), P(xb, za, 0), P(xb, zb, 0), P(xa, zb, 0)], c2);
        if (t === 'pattern') s += poly([P((xa + xb) / 2, za, 0), P(xb, (za + zb) / 2, 0), P((xa + xb) / 2, zb, 0), P(xa, (za + zb) / 2, 0)], c2);
        if (t === 'hex') s += poly([P(xa, za, 0), P(xb, za, 0), P(xb, zb, 0), P(xa, zb, 0)], 'none', `stroke="${sh(c, -0.18)}" stroke-width="0.8"`);
        if (t === 'terrazzo') { seed = i * 31 + j; for (let q = 0; q < 3; q++) { const p = P(xa + (xb - xa) * rnd(), za + (zb - za) * rnd(), 0); s += `<circle cx="${p[0]}" cy="${p[1]}" r="${1.5 + rnd() * 2}" fill="${['#C4632D', '#2F6F73', '#D3A232', '#8A8178'][q % 4]}"/>`; } } }
      return poly([P(-1, 0, 0), P(1, 0, 0), [W, H], [0, H]], c) + clipFloor(s);
    }
    return poly([P(-1, 0, 0), P(1, 0, 0), [W, H], [0, H]], c) + clipFloor(floorLines(c, 'tile'));
  }

  // ---------- rooms ----------
  function living(sc) {
    const wall = sc.wall; let s = shell(wall, sc.floor, sc.floorT, sc.ceil);
    if (sc.accent && !['brick', 'stone', 'wallpaper'].includes(sc.feature)) s += poly([P(-1, 0, 1), P(1, 0, 1), P(1, 0, 0), P(-1, 0, 0)], sc.accent);
    s += feature(sc.feature, sc.accent || wall, sc);
    s += windowLeft(0.15, 0.55, 0.22, 0.85, sc.metal, sh(sc.sofa, 0.25));
    if (sc.feature !== 'gallery' && sc.feature !== 'wallpaper') s += art(sc.art, -0.28, 0.28, 0.48, 0.8, sc);
    if (sc.feature === 'gallery') s += art('gallery', -0.55, 0.55, 0.42, 0.92, sc);
    s += rug(-0.78, 0.78, 0.12, 0.78, sc.rug, sc.rugT, sc);
    // sofa
    const so = sc.sofa, t = sc.sofaT, zf = 0.26, low = t === 'low';
    const seatH = low ? 0.12 : 0.15, backH = low ? 0.25 : (t === 'channel' || t === 'tufted' ? 0.32 : 0.3), legs = ['leggy', 'track', 'channel'].includes(t) ? 0.04 : 0;
    if (t === 'curved') { const [x, y, w, h] = fr(-0.55, 0.55, zf - 0.08, legs, backH); s += `<path d="M${x} ${y + h} V${y + h * 0.35} Q${x + w / 2} ${y - h * 0.25} ${x + w} ${y + h * 0.35} V${y + h} Z" fill="${sh(so, -0.06)}"/>`; s += box(-0.55, 0.55, zf, 0.16, 0, seatH, so, { rx: 14 }); }
    else if (t === 'rattan') { s += box(-0.55, 0.55, zf - 0.12, 0.04, 0.03, backH, sc.chair || '#C9A46C'); const [x, y, w, h] = fr(-0.53, 0.53, zf - 0.119, 0.05, backH - 0.02); for (let i = 0; i < 26; i++) s += ln([x + i * w / 26, y], [x + i * w / 26, y + h], sh('#C9A46C', -0.2), 1); s += box(-0.55, 0.55, zf, 0.16, 0.03, seatH, so); s += box(-0.62, -0.55, zf, 0.2, 0, seatH + 0.06, '#B58F59'); s += box(0.55, 0.62, zf, 0.2, 0, seatH + 0.06, '#B58F59'); }
    else {
      s += box(-0.55, 0.55, zf - 0.13, 0.06, legs, backH, sh(so, -0.05));
      if (t === 'channel') { const [x, y, w, h] = fr(-0.55, 0.55, zf - 0.13, legs, backH); for (let i = 1; i < 10; i++) s += ln([x + i * w / 10, y + 4], [x + i * w / 10, y + h - 4], sh(so, -0.22), 1.5); }
      if (t === 'tufted') { const [x, y, w, h] = fr(-0.55, 0.55, zf - 0.13, legs, backH); for (let i = 1; i < 9; i++) for (let j = 1; j < 3; j++) s += `<circle cx="${x + i * w / 9}" cy="${y + j * h / 3}" r="2" fill="${sh(so, -0.3)}"/>`; }
      s += box(-0.55, 0.55, zf, 0.15, legs, seatH + legs, so);
      const arm = t === 'track' || t === 'channel' ? 0.06 : 0.05, aH = t === 'slip' || t === 'tufted' ? seatH + legs + 0.08 : seatH + legs + 0.06;
      s += box(-0.62, -0.55, zf + 0.005, 0.2, legs, aH, sh(so, -0.03), { rx: t === 'slip' || t === 'tufted' ? 8 : 2 }); s += box(0.55, 0.62, zf + 0.005, 0.2, legs, aH, sh(so, -0.03), { rx: t === 'slip' || t === 'tufted' ? 8 : 2 });
      if (legs) [-0.58, 0.58, -0.4, 0.4].forEach(xx => { const a = P(xx, zf, legs), b = P(xx + (xx < 0 ? -0.02 : 0.02), zf, 0); s += ln(a, b, sc.wood, 3); });
    }
    // cushions
    sc.cushions.concat(sc.cushions[0]).forEach((c, i) => { const xx = -0.42 + i * 0.27; const [x, y, w, h] = fr(xx - 0.09, xx + 0.09, zf - 0.08, seatH + legs, seatH + legs + 0.12); s += rect(x, y, w, h, c, 'rx="6"'); });
    // coffee table
    const tb = sc.table, tz = 0.55;
    if (sc.tableT === 'rect') { s += box(-0.3, 0.3, tz, 0.16, 0.08, 0.12, tb); s += box(-0.28, -0.25, tz, 0.02, 0, 0.08, sh(tb, -0.2)); s += box(0.25, 0.28, tz, 0.02, 0, 0.08, sh(tb, -0.2)); }
    else { const [cx, cy] = P(0, tz - 0.08, 0.13), rx = 0.24 * 230 * k(tz), ry = rx * 0.28; const bh = sc.tableT === 'drum' ? 0.13 : 0.11; const [, fy] = P(0, tz - 0.08, 0);
      if (sc.tableT === 'drum') s += rect(cx - rx, cy, rx * 2, fy - cy, sh(tb, -0.12)) + `<ellipse cx="${cx}" cy="${fy}" rx="${rx}" ry="${ry}" fill="${sh(tb, -0.12)}"/>`;
      else s += rect(cx - 6, cy, 12, fy - cy, sh(sc.metal, 0)) + `<ellipse cx="${cx}" cy="${fy}" rx="${rx * 0.4}" ry="${ry * 0.4}" fill="${sc.metal}"/>`;
      s += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${sh(tb, 0.08)}"/>`; }
    const [vx, vy] = P(0.1, tz - 0.08, 0.13); s += rect(vx - 5, vy - 22, 10, 22, sc.cushions[1], 'rx="4"');
    // accent chair
    const ch = sc.chair, cz = 0.72;
    if (sc.chairT === 'wing' || sc.chairT === 'arm') { s += box(0.62, 0.95, cz - 0.14, 0.05, 0, sc.chairT === 'wing' ? 0.36 : 0.27, sh(ch, -0.06)); s += box(0.62, 0.95, cz, 0.18, 0.03, 0.16, ch); s += box(0.6, 0.65, cz + 0.01, 0.2, 0.03, 0.21, sh(ch, -0.04)); }
    else if (sc.chairT === 'rattan') { const [x, y, w, h] = fr(0.6, 0.97, cz - 0.15, 0.1, 0.46); s += `<path d="M${x + w / 2} ${y + h} L${x} ${y + h * 0.35} Q${x + w / 2} ${y - h * 0.15} ${x + w} ${y + h * 0.35} Z" fill="${ch}" stroke="${sh(ch, -0.25)}" stroke-width="2"/>`; for (let i = 1; i < 7; i++) s += ln([x + w / 2, y + h], [x + i * w / 7, y + h * 0.15], sh(ch, -0.2), 1); s += box(0.66, 0.92, cz, 0.12, 0.05, 0.13, sc.cushions[0], { rx: 6 }); }
    else if (sc.chairT === 'round') { const [x, y, w, h] = fr(0.6, 0.97, cz, 0.02, 0.27); s += `<path d="M${x} ${y + h} V${y + h * 0.4} Q${x + w / 2} ${y - h * 0.3} ${x + w} ${y + h * 0.4} V${y + h} Z" fill="${ch}"/>`; s += rect(x + w * 0.12, y + h * 0.55, w * 0.76, h * 0.45, sh(ch, 0.1), 'rx="10"'); }
    else { s += box(0.62, 0.95, cz - 0.12, 0.05, 0.08, 0.32, sh(ch, -0.05), { rx: 8 }); s += box(0.62, 0.95, cz, 0.16, 0.06, 0.15, ch, { rx: 8 }); const a = P(0.65, cz, 0.06), b = P(0.92, cz, 0.06); s += ln(a, [a[0] - 4, a[1] + 26], sc.wood, 3) + ln(b, [b[0] + 4, b[1] + 26], sc.wood, 3); }
    // plants
    if (sc.plants >= 1) s += plant(-0.86, 0.35, 1.3, sh(sc.wall, -0.25));
    if (sc.plants >= 2) s += plant(0.82, 0.12, 1, sc.metal === '#2B2926' ? '#4A4642' : '#B9603A');
    if (sc.plants >= 3) s += plant(-0.75, 0.05, 0.9, '#C9A46C');
    s += pendant(sc.light, 0, 0.5, 0.2, sc);
    return s;
  }
  function kitchen(sc) {
    let s = shell(sc.wall, sc.floor, sc.floorT, sc.ceil);
    s += windowRight(0.2, 0.5, 0.4, 0.85, sc.metal);
    s += wallTile(-0.95, 0.95, 0.34, 0.6, sc.splash, sc.splashT);
    // wall units or shelves
    if (sc.shelves) { [0.68, 0.84].forEach(y => { s += box(-0.95, -0.2, 0.06, 0.06, y, y + 0.015, sc.wood); seed = 4; for (let i = 0; i < 6; i++) { const xx = -0.9 + i * 0.12; const [x, yy, w, h] = fr(xx, xx + 0.07, 0.04, y + 0.015, y + 0.07 + rnd() * 0.04); s += rect(x, yy, w, h, sc.cushions[i % 3], 'rx="3"'); } }); s += box(0.2, 0.95, 0.1, 0.1, 0.62, 0.98, sc.cab2); }
    else s += box(-0.95, 0.95, 0.1, 0.1, 0.62, 0.98, sc.cab2);
    // tall unit / hood
    s += box(0.98 - 0.0, 0.99, 0.12, 0.12, 0, 0.98, sc.cab2);
    // base run
    s += box(-0.95, 0.95, 0.14, 0.13, 0, 0.32, sc.cab);
    const [bx, by, bw, bh] = fr(-0.95, 0.95, 0.14, 0.02, 0.31); for (let i = 1; i < 8; i++) s += ln([bx + i * bw / 8, by], [bx + i * bw / 8, by + bh], sh(sc.cab, -0.2), 1);
    for (let i = 0; i < 8; i++) s += rect(bx + i * bw / 8 + bw / 16 - 8, by + 8, 16, 2.5, sc.metal);
    s += box(-0.96, 0.96, 0.145, 0.14, 0.32, 0.335, sc.top);
    // tap
    const [tx, ty] = P(-0.4, 0.06, 0.335); s += `<path d="M${tx} ${ty} V${ty - 26} Q${tx} ${ty - 34} ${tx + 10} ${ty - 30} V${ty - 22}" fill="none" stroke="${sc.metal}" stroke-width="3"/>`;
    // island
    s += box(-0.52, 0.52, 0.62, 0.22, 0, 0.33, sc.island);
    s += box(-0.56, 0.56, 0.63, 0.24, 0.33, 0.35, sc.top);
    // stools
    [-0.35, 0, 0.35].forEach(xx => { const z = 0.76; const a = P(xx - 0.07, z, 0.25), b = P(xx + 0.07, z, 0.25); s += ln(P(xx - 0.06, z, 0), [a[0] + 4, a[1]], sc.metal, 2.5) + ln(P(xx + 0.06, z, 0), [b[0] - 4, b[1]], sc.metal, 2.5); s += box(xx - 0.08, xx + 0.08, z + 0.01, 0.06, 0.25, 0.28, sc.stool, { rx: 5 }); });
    [-0.28, 0.28].forEach(xx => s += pendant(sc.light === 'chandelier' || sc.light === 'tiered' || sc.light === 'sputnik' ? 'globe' : sc.light === 'linear' ? 'globe' : sc.light, xx, 0.5, 0.25, sc));
    s += plant(0.75, 0.08, 0.6, sc.cushions[0]);
    return s;
  }
  function bedroom(sc) {
    let s = shell(sc.wall, sc.floor, sc.floorT, sc.ceil || sh(sc.wall, 0.4)); if (sc.bwall && sc.bwall !== sc.wall) s += poly([P(-1, 0, 1), P(1, 0, 1), P(1, 0, 0), P(-1, 0, 0)], sc.bwall);
    s += windowLeft(0.2, 0.55, 0.25, 0.85, sc.metal, sh(sc.bedding, -0.08));
    s += rug(-0.7, 0.7, 0.1, 0.85, sc.rug, sc.rugT, sc);
    const hb = sc.bed, t = sc.headT; let hbTop = 0.42;
    if (t === 'panel') { s += box(-0.75, 0.75, 0.02, 0.02, 0, 0.62, sc.bed === sc.bwall ? sh(hb, -0.06) : hb, { rx: 4 }); hbTop = 0.62; const [x, y, w, h] = fr(-0.75, 0.75, 0.02, 0, 0.62); for (let i = 1; i < 6; i++) s += ln([x + i * w / 6, y + 4], [x + i * w / 6, y + h - 4], sh(hb, -0.12), 1); }
    else if (t === 'slat') { const [x, y, w, h] = fr(-0.5, 0.5, 0.02, 0.1, 0.5); s += rect(x, y, w, h, hb); for (let i = 1; i < 14; i++) s += rect(x + i * w / 14, y, 2, h, sh(hb, -0.25)); }
    else if (t === 'wing') { const [x, y, w, h] = fr(-0.52, 0.52, 0.03, 0.1, 0.55); s += `<path d="M${x} ${y + h} V${y + h * 0.2} Q${x} ${y} ${x + 20} ${y} H${x + w - 20} Q${x + w} ${y} ${x + w} ${y + h * 0.2} V${y + h} Z" fill="${hb}"/>`; hbTop = 0.55; }
    else if (t === 'rattan' || t === 'arch') { const [x, y, w, h] = fr(-0.5, 0.5, 0.02, 0.1, 0.6); s += `<path d="M${x} ${y + h} V${y + w * 0.35} A${w / 2} ${w * 0.35} 0 0 1 ${x + w} ${y + w * 0.35} V${y + h} Z" fill="${t === 'arch' ? sh(sc.bwall || sc.wall, -0.1) : hb}" ${t === 'rattan' ? `stroke="${sh(hb, -0.25)}" stroke-width="3"` : ''}/>`; if (t === 'rattan') for (let i = 1; i < 12; i++) s += ln([x + i * w / 12, y + h * 0.15], [x + i * w / 12, y + h], sh(hb, -0.2), 1); hbTop = 0.6; }
    else if (t === 'fan') { const [x, y, w, h] = fr(-0.52, 0.52, 0.02, 0.1, 0.62); const cx = x + w / 2, cy = y + h; for (let i = 0; i < 9; i++) { const a0 = Math.PI + i * Math.PI / 9, a1 = a0 + Math.PI / 9; s += `<path d="M${cx} ${cy} L${cx + Math.cos(a0) * w / 2} ${cy + Math.sin(a0) * h} A${w / 2} ${h} 0 0 1 ${cx + Math.cos(a1) * w / 2} ${cy + Math.sin(a1) * h} Z" fill="${sh(hb, i % 2 ? -0.08 : 0.04)}" stroke="${sc.metal}" stroke-width="1.5"/>`; } hbTop = 0.62; }
    else if (t === 'spindle' || t === 'metal') { const [x, y, w, h] = fr(-0.5, 0.5, 0.02, 0.1, 0.45); s += rect(x, y, w, 7, hb) + rect(x, y, 7, h, hb) + rect(x + w - 7, y, 7, h, hb); for (let i = 1; i < 10; i++) s += rect(x + i * w / 10, y, t === 'metal' ? 2.5 : 5, h, hb); }
    else if (t === 'tall') { s += box(-0.52, 0.52, 0.02, 0.02, 0.1, 0.72, hb, { rx: 6 }); hbTop = 0.72; const [x, y, w, h] = fr(-0.52, 0.52, 0.02, 0.1, 0.72); for (let i = 1; i < 6; i++) s += ln([x + i * w / 6, y + 6], [x + i * w / 6, y + h - 6], sh(hb, -0.15), 1.5); }
    else { s += box(-0.5, 0.5, 0.02, 0.02, 0.1, 0.3, hb); hbTop = 0.3; }
    if (hbTop < 0.65) s += art(sc.art === 'gallery' ? 'gallery' : (sc.art === 'none' ? 'print' : sc.art), -0.22, 0.22, hbTop + 0.08, Math.min(0.92, hbTop + 0.3), sc);
    // side tables + lamps
    [-0.68, 0.68].forEach(xx => { s += box(xx - 0.1, xx + 0.1, 0.18, 0.14, 0, 0.2, sc.wood); const [lx, ly] = P(xx, 0.11, 0.2); s += rect(lx - 3, ly - 26, 6, 26, sc.metal) + `<path d="M${lx - 16} ${ly - 26} L${lx - 10} ${ly - 44} H${lx + 10} L${lx + 16} ${ly - 26} Z" fill="#F7F1E4" stroke="${sh('#F7F1E4', -0.15)}"/>`; });
    // bed
    s += box(-0.5, 0.5, 0.62, 0.58, 0, 0.12, hb);
    s += box(-0.5, 0.5, 0.63, 0.59, 0.12, 0.2, sc.bedding, { top: sh(sc.bedding, 0.06), rx: 4 });
    [-0.24, 0.24].forEach(xx => { const [x, y, w, h] = fr(xx - 0.19, xx + 0.19, 0.12, 0.2, 0.3); s += rect(x, y, w, h, sh(sc.bedding, -0.04), 'rx="8"'); });
    const [cx, cy, cw, chh] = fr(-0.28, 0.28, 0.12, 0.2, 0.27); s += rect(cx + cw * 0.15, cy + 3, cw * 0.7, chh, sc.cushions[0], 'rx="7"');
    s += poly([P(-0.505, 0.48, 0.205), P(0.505, 0.48, 0.205), P(0.505, 0.6, 0.205), P(-0.505, 0.6, 0.205)], sc.throw);
    { const a = P(-0.505, 0.6, 0.205), b = P(0.505, 0.6, 0.12); s += rect(a[0], a[1], b[0] - a[0], b[1] - a[1], sh(sc.throw, -0.08)); }
    if (sc.plants >= 1) s += plant(0.88, 0.45, 1.1, sh(sc.wall, -0.25));
    s += pendant(sc.light === 'linear' ? 'globe' : sc.light, 0, 0.55, 0.15, sc);
    return s;
  }
  function bathroom(sc) {
    const full = sc.btileT === 'plaster' || sc.btileT === 'stone';
    let s = shell(sc.wall, sc.bfloor, 'tile', sc.ceil);
    s += floorTile(sc.bfloor, sc.bfloorT);
    if (full) s += wallTile(-1, 1, 0, 1, sc.btile, sc.btileT === 'plaster' ? 'none' : 'stone', 0.001);
    else { s += wallTile(-1, -0.05, 0, 1, sc.btile, sc.btileT); s += wallTile(-0.05, 1, 0, 0.42, sc.btile, sc.btileT); }
    // shower glass + head
    s += poly([P(-0.05, 0, 0), P(-0.05, 0.38, 0), P(-0.05, 0.38, 0.8), P(-0.05, 0, 0.8)], 'rgba(200,225,235,0.35)', `stroke="${sc.metal}" stroke-width="2"`);
    const [hx, hy] = P(-0.55, 0.005, 0.78); s += ln([hx, hy - 26], [hx, hy + 8], sc.metal, 3) + rect(hx - 16, hy + 6, 32, 5, sc.metal, 'rx="2"');
    const [mx, my] = P(-0.75, 0.005, 0.4); s += `<circle cx="${mx}" cy="${my}" r="6" fill="${sc.metal}"/>`;
    // vanity
    s += box(0.15, 0.85, 0.16, 0.15, 0.17, 0.32, sc.vanity);
    s += box(0.14, 0.86, 0.165, 0.155, 0.32, 0.335, sc.top || '#ECE7DE');
    const [bx, by] = P(0.5, 0.09, 0.335); s += `<ellipse cx="${bx}" cy="${by - 6}" rx="34" ry="10" fill="#FBFAF7" stroke="${sh('#FBFAF7', -0.15)}"/>`;
    const [tx, ty] = P(0.5, 0.01, 0.38); s += `<path d="M${tx} ${ty} H${tx} V${ty + 14}" stroke="${sc.metal}" stroke-width="3" fill="none"/>` + rect(tx - 2, ty - 4, 4, 18, sc.metal);
    // mirror
    const [x, y, w, h] = fr(0.3, 0.7, 0.003, 0.45, 0.85), mf = sc.metal, mg = '#DDE7EA';
    if (sc.mirrorT === 'round') s += `<circle cx="${x + w / 2}" cy="${y + h / 2}" r="${Math.min(w, h) / 2}" fill="${mg}" stroke="${mf}" stroke-width="4"/>`;
    else if (sc.mirrorT === 'arch') s += `<path d="M${x + w * 0.15} ${y + h} V${y + w * 0.35} A${w * 0.35} ${w * 0.35} 0 0 1 ${x + w * 0.85} ${y + w * 0.35} V${y + h} Z" fill="${mg}" stroke="${mf}" stroke-width="4"/>`;
    else if (sc.mirrorT === 'scallop') { s += `<circle cx="${x + w / 2}" cy="${y + h / 2}" r="${Math.min(w, h) / 2}" fill="${mf}"/>`; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; s += `<circle cx="${x + w / 2 + Math.cos(a) * Math.min(w, h) / 2}" cy="${y + h / 2 + Math.sin(a) * Math.min(w, h) / 2}" r="8" fill="${mf}"/>`; } s += `<circle cx="${x + w / 2}" cy="${y + h / 2}" r="${Math.min(w, h) / 2 - 6}" fill="${mg}"/>`; }
    else if (sc.mirrorT === 'sunburst') { const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2; for (let i = 0; i < 20; i++) { const a = i * Math.PI / 10; s += ln([cx, cy], [cx + Math.cos(a) * r * 1.2, cy + Math.sin(a) * r * 1.2], mf, 3); } s += `<circle cx="${cx}" cy="${cy}" r="${r * 0.75}" fill="${mg}" stroke="${mf}" stroke-width="3"/>`; }
    else s += rect(x + w * 0.1, y, w * 0.8, h, mg, `stroke="${mf}" stroke-width="4"`);
    // towel on rail
    const [rx, ry] = P(0.92, 0.003, 0.55); s += ln([rx - 34, ry], [rx + 6, ry], sc.metal, 3) + rect(rx - 30, ry, 30, 50, sc.towel, 'rx="3"');
    s += plant(0.75, 0.06, 0.45, '#F2EFEA');
    return s;
  }

  // ---------- helpers for the extra rooms ----------
  const pal = sc => [sc.cushions[0], sc.cushions[1], sc.cushions[2], sc.throw, sc.bedding, sc.sofa, sc.chair].filter(Boolean);
  const joinery = sc => (Math.abs(lum(sc.cab2) - lum(sc.wall)) < 0.04 ? sh(sc.wood, 0.05) : sc.cab2);
  function diningChair(x, z, sc, backOnly) {
    const c = sc.chair, w = 0.09, t = sc.chairT; let s = '';
    const backH = t === 'wing' || t === 'arm' ? 0.46 : 0.42;
    if (t === 'rattan') { const [bx, by, bw, bh] = fr(x - w, x + w, z - 0.07, 0.24, backH); s += rect(bx, by, bw, bh, c, `rx="6" stroke="${sh(c, -0.25)}" stroke-width="1.5"`); for (let i = 1; i < 6; i++) s += ln([bx + i * bw / 6, by + 3], [bx + i * bw / 6, by + bh - 3], sh(c, -0.22), 1); }
    else s += box(x - w, x + w, z - 0.07, 0.02, 0.24, backH, t === 'wing' || t === 'arm' || t === 'round' ? c : sh(sc.wood, -0.05), { rx: t === 'round' ? 8 : 3 });
    if (backOnly) return s;
    s += box(x - w, x + w, z, 0.08, 0.2, 0.24, c, { rx: 3 });
    [[x - w + 0.01, z], [x + w - 0.01, z]].forEach(([xx, zz]) => s += ln(P(xx, zz, 0.2), P(xx, zz, 0), sh(sc.wood, -0.15), 2.5));
    return s;
  }
  function garments(x0, x1, zz, yTop, yLen, cols, sd) {
    let s = '', cx = x0; seed = sd;
    const [ra, rb] = [P(x0, zz, yTop), P(x1, zz, yTop)]; s += ln(ra, rb, '#9A9590', 2);
    while (cx < x1 - 0.03) { const gw = 0.035 + rnd() * 0.035, len = yLen * (0.55 + rnd() * 0.45); const g = Math.min(gw, x1 - cx);
      const [x, y, w, h] = fr(cx, cx + g, zz, yTop - len, yTop - 0.02); s += rect(x, y, w - 1, h, cols[Math.floor(rnd() * cols.length)], 'rx="2"'); cx += g; }
    return s;
  }

  function porch(sc) {
    let s = '';
    const sky = '#D7E7EE', hedge = '#5E8A52', ceil = sh(sc.wood, 0.18), door = sc.accent && lum(sc.accent) < 0.75 ? sc.accent : sh(sc.wood, -0.18);
    // ceiling boards, open sides with garden, facade
    s += poly([[0, 0], [W, 0], P(1, 0, 1), P(-1, 0, 1)], ceil);
    for (let i = 1; i < 10; i++) s += ln(P(-1 + 2 * i / 10, 0, 1), P(-1.4 + 2.8 * i / 10, 1, 1), sh(ceil, -0.12), 0.8);
    s += poly([[0, 0], P(-1, 0, 1), P(-1, 0, 0), [0, H]], sky) + poly([[W, 0], P(1, 0, 1), P(1, 0, 0), [W, H]], sky);
    [-1, 1].forEach(sx => { s += poly([P(sx, 0, 0), P(sx, 0, 0.3), P(sx, 1, 0.3), P(sx, 1, 0)], hedge); seed = sx > 0 ? 17 : 13;
      for (let i = 0; i < 18; i++) { const p = P(sx, rnd(), 0.28 + rnd() * 0.04); s += `<circle cx="${p[0]}" cy="${p[1]}" r="${6 + rnd() * 8}" fill="${sh(hedge, (rnd() - 0.5) * 0.3)}"/>`; }
      // railing
      s += ln(P(sx, 0, 0.36), P(sx, 1, 0.36), sh(sc.wall, -0.05), 4);
      for (let i = 0; i <= 14; i++) s += ln(P(sx, i / 14, 0.02), P(sx, i / 14, 0.36), sh(sc.wall, -0.05), 2); });
    s += poly([P(-1, 0, 1), P(1, 0, 1), P(1, 0, 0), P(-1, 0, 0)], sc.wall);
    if (sc.feature === 'brick') s += feature('brick', sc.wall, sc);
    s += floorTile(sc.bfloor, sc.bfloorT);
    // facade windows
    [[-0.85, -0.5], [0.5, 0.85]].forEach(([a, b]) => { const [x, y, w, h] = fr(a, b, 0.002, 0.3, 0.78);
      s += rect(x - 5, y - 5, w + 10, h + 10, sh(sc.wall, -0.12)) + rect(x, y, w, h, '#DCE8EE') + rect(x, y, w, h * 0.45, sh(sc.cushions[1], 0.3), 'opacity="0.8"') + ln([x + w / 2, y], [x + w / 2, y + h], sc.metal, 3) + rect(x - 8, y + h + 5, w + 16, 5, sh(sc.wall, -0.15)); });
    // front door with sidelights
    { const [x, y, w, h] = fr(-0.17, 0.17, 0.002, 0, 0.74); s += rect(x - 10, y - 10, w + 20, h + 10, sh(sc.wall, -0.18)) + rect(x, y, w, h, door);
      s += rect(x + w * 0.12, y + h * 0.08, w * 0.76, h * 0.38, sh(door, -0.12), 'rx="2"') + rect(x + w * 0.12, y + h * 0.54, w * 0.76, h * 0.38, sh(door, -0.12), 'rx="2"');
      s += `<circle cx="${x + w * 0.85}" cy="${y + h * 0.52}" r="4" fill="${sc.metal}"/>`;
      [[-0.25, -0.19], [0.19, 0.25]].forEach(([a, b]) => { const [sx2, sy, sw, shh] = fr(a, b, 0.002, 0.08, 0.7); s += rect(sx2, sy, sw, shh, '#DCE8EE', `stroke="${sc.metal}" stroke-width="2"`); }); }
    // wall lanterns
    [-0.33, 0.33].forEach(xx => { const [lx, ly] = P(xx, 0.003, 0.62); s += rect(lx - 7, ly - 14, 14, 22, '#FFF0C9', `stroke="${sc.metal}" stroke-width="2.5"`) + rect(lx - 9, ly - 17, 18, 4, sc.metal); });
    // doormat, planters
    s += rug(-0.22, 0.22, 0.04, 0.2, sh(sc.rug, -0.1), 'jute', sc);
    s += plant(-0.32, 0.16, 1.05, sc.cushions[0]) + plant(0.32, 0.16, 1.05, sc.cushions[0]);
    // bench under left window
    s += box(-0.88, -0.48, 0.24, 0.1, 0.24, 0.42, sh(sc.wood, -0.05));
    s += box(-0.88, -0.48, 0.34, 0.14, 0.15, 0.18, sc.wood);
    [-0.86, -0.5].forEach(xx => s += box(xx - 0.015, xx + 0.015, 0.34, 0.02, 0, 0.15, sh(sc.wood, -0.2)));
    sc.cushions.slice(0, 2).forEach((c, i) => { const xx = -0.78 + i * 0.2; const [x, y, w, h] = fr(xx - 0.07, xx + 0.07, 0.26, 0.18, 0.3); s += rect(x, y, w, h, c, 'rx="6"'); });
    // chair + side table on the right
    s += box(0.52, 0.8, 0.46, 0.04, 0.16, 0.44, sh(sc.chair, -0.06), { rx: 6 }) + box(0.52, 0.8, 0.58, 0.14, 0.12, 0.17, sc.chair, { rx: 6 });
    s += box(0.84, 0.95, 0.56, 0.08, 0, 0.2, sc.metal === '#2B2926' ? sc.wood : sc.metal);
    // columns
    s += box(-1.0, -0.9, 0.97, 0.06, 0, 1, sh(sc.wall, 0.12)) + box(0.9, 1.0, 0.97, 0.06, 0, 1, sh(sc.wall, 0.12));
    s += pendant({ lantern: 'lantern', factory: 'factory', woven: 'woven', globe: 'globe' }[sc.light] || 'globe', 0, 0.5, 0.18, sc);
    return s;
  }

  function dining(sc) {
    let s = shell(sc.wall, sc.floor, sc.floorT, sc.ceil);
    if (sc.accent && !['brick', 'stone', 'wallpaper'].includes(sc.feature)) s += poly([P(-1, 0, 1), P(1, 0, 1), P(1, 0, 0), P(-1, 0, 0)], sc.accent);
    if (['panelling', 'wallpaper', 'brick', 'beams'].includes(sc.feature)) s += feature(sc.feature, sc.accent || sc.wall, sc);
    // garden doors on the right
    s += windowRight(0.12, 0.7, 0.02, 0.86, sc.metal);
    s += poly([P(1, 0.12, 0.02), P(1, 0.7, 0.02), P(1, 0.7, 0.3), P(1, 0.12, 0.3)], '#7FA36F', 'opacity="0.7"');
    s += ln(P(1, 0.41, 0.02), P(1, 0.41, 0.86), sc.metal, 3);
    // sideboard + art + decor
    const sb = joinery(sc);
    s += box(-0.62, 0.62, 0.12, 0.1, 0.03, 0.3, sb);
    { const [x, y, w, h] = fr(-0.62, 0.62, 0.12, 0.05, 0.28); for (let i = 1; i < 4; i++) s += ln([x + i * w / 4, y], [x + i * w / 4, y + h], sh(sb, -0.2), 1.2); for (let i = 0; i < 4; i++) s += rect(x + i * w / 4 + w / 8 - 7, y + h * 0.4, 14, 2.5, sc.metal); }
    s += art(sc.art === 'none' ? 'print' : sc.art === 'gallery' ? 'gallery' : sc.art, -0.36, 0.36, 0.44, 0.82, sc);
    { const [lx, ly] = P(-0.45, 0.06, 0.3); s += rect(lx - 3, ly - 30, 6, 30, sc.metal) + `<path d="M${lx - 18} ${ly - 30} L${lx - 11} ${ly - 50} H${lx + 11} L${lx + 18} ${ly - 30} Z" fill="#F7F1E4"/>`; }
    { const [vx, vy] = P(0.42, 0.06, 0.3); s += rect(vx - 7, vy - 26, 14, 26, sc.cushions[0], 'rx="6"'); }
    // rug, table, chairs
    s += rug(-0.8, 0.8, 0.28, 0.98, sc.rug, sc.rugT === 'plain' ? 'border' : sc.rugT, sc);
    const tb = sc.table === sc.floor ? sh(sc.table, -0.15) : sc.table, tz = 0.72;
    [-0.28, 0, 0.28].forEach(xx => s += diningChair(xx, tz - 0.3, sc));
    if (sc.tableT === 'round' || sc.tableT === 'drum') {
      const [cx, cy] = P(0, tz - 0.15, 0.28), rx = 0.46 * 230 * k(tz), ry = rx * 0.3, [, fy] = P(0, tz - 0.15, 0);
      s += rect(cx - 10, cy, 20, fy - cy, sh(tb, -0.2)) + `<ellipse cx="${cx}" cy="${fy}" rx="${rx * 0.3}" ry="${ry * 0.3}" fill="${sh(tb, -0.2)}"/>`;
      s += `<ellipse cx="${cx}" cy="${cy + 5}" rx="${rx}" ry="${ry}" fill="${sh(tb, -0.12)}"/><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${sh(tb, 0.06)}"/>`;
    } else {
      s += box(-0.5, 0.5, tz, 0.32, 0.26, 0.29, tb);
      [-0.46, 0.46].forEach(xx => s += box(xx - 0.025, xx + 0.025, tz - 0.01, 0.03, 0, 0.26, sh(tb, -0.2)));
    }
    { const [rx2, ry2] = P(0, tz - 0.16, 0.29); s += `<ellipse cx="${rx2}" cy="${ry2 - 2}" rx="26" ry="7" fill="${sc.cushions[1]}"/>`; s += rect(rx2 - 30, ry2 - 18, 4, 16, '#F7F1E4') + rect(rx2 + 26, ry2 - 18, 4, 16, '#F7F1E4'); }
    [-0.62, 0.62].forEach(xx => s += diningChair(xx, tz - 0.06, sc));
    if (sc.plants >= 1) s += plant(-0.88, 0.3, 1.2, sh(sc.wall, -0.25));
    s += pendant(sc.light === 'paper' || sc.light === 'globe' ? sc.light : sc.light, 0, 0.56, 0.24, sc);
    return s;
  }

  function closet(sc) {
    let s = shell(sc.wall, sc.floor, sc.floorT, sc.ceil);
    const J = joinery(sc), Jd = sh(J, -0.14), cols = pal(sc);
    // back wall units: hanging | shelves over drawers | hanging
    s += box(-0.98, 0.98, 0.1, 0.1, 0, 0.96, J);
    const bays = [[-0.94, -0.36], [-0.32, 0.32], [0.36, 0.94]];
    bays.forEach(([a, b], i) => { const [x, y, w, h] = fr(a, b, 0.1, 0.04, 0.92); s += rect(x, y, w, h, Jd);
      if (i !== 1) { s += garments(a + 0.01, b - 0.01, 0.1, 0.86, i === 0 ? 0.42 : 0.62, cols, 30 + i); s += garments(a + 0.01, b - 0.01, 0.1, 0.42, 0.3, cols, 50 + i);
        seed = 70 + i; for (let j = 0; j < 5; j++) { const xx = a + 0.04 + j * (b - a - 0.08) / 5; const [px, py, pw, ph] = fr(xx, xx + 0.07, 0.1, 0.04, 0.08); s += rect(px, py, pw, ph, cols[(j + i) % cols.length], 'rx="3"'); } }
      else { [0.62, 0.76].forEach(yy => { s += rect(x, fr(a, b, 0.1, yy, yy)[1], w, 3, J); seed = Math.round(yy * 100); for (let j = 0; j < 4; j++) { const xx = a + 0.03 + j * (b - a - 0.06) / 4; for (let q = 0; q < 3; q++) { const [fx, fy, fw, fh] = fr(xx, xx + 0.12, 0.1, yy + q * 0.03, yy + q * 0.03 + 0.028); s += rect(fx, fy, fw, fh, cols[(j + q) % cols.length], 'rx="2"'); } } });
        s += box(a, b, 0.11, 0.01, 0.04, 0.5, J); const [dx, dy, dw, dh] = fr(a, b, 0.11, 0.04, 0.5); for (let j = 1; j < 4; j++) s += ln([dx, dy + j * dh / 4], [dx + dw, dy + j * dh / 4], Jd, 1.2); for (let j = 0; j < 4; j++) s += rect(dx + dw / 2 - 12, dy + j * dh / 4 + dh / 8 - 1, 24, 3, sc.metal); } });
    // left wall: closed doors + full-length mirror
    s += poly([P(-1, 0.1, 0), P(-1, 0.85, 0), P(-1, 0.85, 0.96), P(-1, 0.1, 0.96)], sh(J, -0.05));
    for (let i = 0; i <= 5; i++) { const zz = 0.1 + i * 0.15; s += ln(P(-1, zz, 0), P(-1, zz, 0.96), Jd, 1.5); if (i < 5) s += ln(P(-1, zz + 0.12, 0.42), P(-1, zz + 0.12, 0.56), sc.metal, 3); }
    s += poly([P(-1, 0.42, 0.06), P(-1, 0.53, 0.06), P(-1, 0.53, 0.9), P(-1, 0.42, 0.9)], '#DDE7EA', `stroke="${sc.metal}" stroke-width="3"`);
    // right wall: open shelves with bags and shoes
    s += poly([P(1, 0.1, 0), P(1, 0.7, 0), P(1, 0.7, 0.96), P(1, 0.1, 0.96)], Jd);
    [0.12, 0.3, 0.5, 0.7].forEach((yy, r) => { s += poly([P(1, 0.1, yy), P(1, 0.7, yy), P(0.92, 0.7, yy), P(0.92, 0.1, yy)], J); seed = 90 + r;
      for (let j = 0; j < 4; j++) { const z0 = 0.14 + j * 0.13; s += poly([P(0.995, z0, yy + 0.01), P(0.995, z0 + 0.08, yy + 0.01), P(0.995, z0 + 0.08, yy + (r === 0 ? 0.05 : 0.11)), P(0.995, z0, yy + (r === 0 ? 0.05 : 0.11))], cols[(j + r) % cols.length]); } });
    // runner + island
    s += rug(-0.32, 0.32, 0.3, 0.98, sc.rug, sc.rugT === 'plain' ? 'border' : sc.rugT, sc);
    s += box(-0.3, 0.3, 0.68, 0.24, 0, 0.3, sh(J, lum(J) > 0.45 ? -0.12 : 0.06));
    { const [x, y, w, h] = fr(-0.3, 0.3, 0.68, 0.02, 0.28); for (let j = 1; j < 3; j++) s += ln([x, y + j * h / 3], [x + w, y + j * h / 3], Jd, 1.2); for (let j = 0; j < 3; j++) s += rect(x + w / 2 - 14, y + j * h / 3 + h / 6, 28, 3, sc.metal); }
    s += box(-0.31, 0.31, 0.69, 0.26, 0.3, 0.32, sc.top);
    { const [tx, ty] = P(0.08, 0.56, 0.32); s += `<ellipse cx="${tx}" cy="${ty}" rx="30" ry="8" fill="${sc.metal}"/>`; const [bx, by] = P(-0.14, 0.58, 0.32); s += rect(bx - 22, by - 20, 44, 20, sc.cushions[2] || sc.cushions[0], 'rx="5"'); }
    s += pendant(sc.light === 'linear' ? 'linear' : sc.light, 0, 0.5, 0.18, sc);
    return s;
  }

  function guest(sc) {
    const bedding = sh(sc.cushions[1], 0.35), throwC = sc.cushions[0], pillow = sc.cushions[2] || sc.cushions[0];
    let s = shell(sc.wall, sc.floor, sc.floorT, sc.ceil || sh(sc.wall, 0.4));
    s += windowRight(0.25, 0.6, 0.3, 0.85, sc.metal);
    s += poly([P(1, 0.22, 0.02), P(1, 0.3, 0.02), P(1, 0.3, 0.95), P(1, 0.22, 0.95)], sh(bedding, -0.1), 'opacity="0.92"');
    s += rug(-0.75, 0.3, 0.3, 0.92, sc.rug, sc.rugT, sc);
    // shelves + desk on the right of the back wall
    [0.6, 0.76].forEach(yy => { s += box(0.3, 0.88, 0.05, 0.05, yy, yy + 0.015, sc.wood); seed = Math.round(yy * 50); for (let i = 0; i < 7; i++) { const xx = 0.33 + i * 0.075; const [x, y, w, h] = fr(xx, xx + 0.05, 0.03, yy + 0.015, yy + 0.08 + rnd() * 0.04); s += rect(x, y, w, h, pal(sc)[i % pal(sc).length], 'rx="2"'); } });
    s += box(0.3, 0.9, 0.2, 0.18, 0.27, 0.3, sc.wood);
    [0.33, 0.87].forEach(xx => s += box(xx - 0.02, xx + 0.02, 0.2, 0.02, 0, 0.27, sh(sc.wood, -0.2)));
    { const [lx, ly] = P(0.8, 0.1, 0.3); s += ln([lx, ly], [lx - 8, ly - 36], sc.metal, 2.5) + `<path d="M${lx - 22} ${ly - 30} L${lx - 14} ${ly - 46} L${lx + 2} ${ly - 40} Z" fill="${sc.metal}"/>`; }
    { const [bx, by] = P(0.5, 0.12, 0.3); s += rect(bx - 26, by - 4, 52, 4, '#3A3A3A') + rect(bx - 22, by - 30, 44, 26, '#4A4A4A', 'rx="2"'); }
    s += diningChair(0.6, 0.38, sc);
    // bed against the left of the back wall
    s += art(sc.art === 'gallery' ? 'gallery' : 'print', -0.66, -0.3, 0.5, 0.78, sc);
    s += box(-0.85, -0.15, 0.02, 0.02, 0.08, 0.4, sh(sc.bed, -0.04), { rx: 5 });
    s += box(-0.05, 0.15, 0.2, 0.14, 0, 0.2, sc.wood);
    { const [lx, ly] = P(0.05, 0.13, 0.2); s += rect(lx - 3, ly - 22, 6, 22, sc.metal) + `<path d="M${lx - 14} ${ly - 22} L${lx - 9} ${ly - 38} H${lx + 9} L${lx + 14} ${ly - 22} Z" fill="#F7F1E4"/>`; }
    s += box(-0.85, -0.15, 0.62, 0.58, 0, 0.11, sc.bed);
    s += box(-0.85, -0.15, 0.63, 0.59, 0.11, 0.19, bedding, { top: sh(bedding, 0.06), rx: 4 });
    { const [x, y, w, h] = fr(-0.72, -0.28, 0.12, 0.19, 0.29); s += rect(x, y, w, h, sh(bedding, -0.05), 'rx="8"') + rect(x + w * 0.2, y + 4, w * 0.6, h * 0.8, pillow, 'rx="7"'); }
    s += poly([P(-0.855, 0.42, 0.195), P(-0.145, 0.42, 0.195), P(-0.145, 0.6, 0.195), P(-0.855, 0.6, 0.195)], throwC);
    { const a = P(-0.855, 0.6, 0.195), b = P(-0.145, 0.6, 0.11); s += rect(a[0], a[1], b[0] - a[0], b[1] - a[1], sh(throwC, -0.08)); }
    if (sc.plants >= 2) s += plant(-0.92, 0.75, 0.9, sh(sc.wall, -0.25));
    s += pendant(sc.light === 'linear' || sc.light === 'chandelier' || sc.light === 'tiered' ? 'globe' : sc.light, -0.1, 0.55, 0.15, sc);
    return s;
  }

  const LABELS = { living: 'Living room', porch: 'Entry porch', dining: 'Rear dining room', kitchen: 'Kitchen', bedroom: 'Master bedroom', guest: 'Bedroom', closet: 'Walk-in closet', bathroom: 'Bathroom' };
  function draw(room, sc) {
    const body = { living, porch, dining, kitchen, bedroom, guest, closet, bathroom }[room](sc);
    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${LABELS[room]}, illustrated"><defs><clipPath id="c"><rect width="${W}" height="${H}"/></clipPath></defs><g clip-path="url(#c)">${body}</g></svg>`;
  }
  return { draw, LABELS };
})();
if (typeof module !== 'undefined') module.exports = ROOMS;
