/* Illustrated sample-home rooms, restyled per style. drawRoom(room, scene) -> SVG string.
   Simple one-point perspective: x across the room (-1..1), z depth (0 = back wall, 1 = front edge), y height (0 floor .. 1 ceiling). */
const ROOMS = (() => {
  const W = 800, H = 500, VX = 400;
  const CX = 0.17, KZ = 0.84;
  const k = z => 1 + KZ * z;
  const P = (x, z, y) => [VX + 30 + (x - CX) * 230 * k(z), 330 + 170 * z - y * 260 * k(z)];
  const pt = p => p[0].toFixed(1) + ',' + p[1].toFixed(1);
  const hexRGB = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const toHex = c => '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { const A = hexRGB(a), B = hexRGB(b); return toHex(A.map((v, i) => v + (B[i] - v) * t)); };
  const sh = (h, t) => t < 0 ? mix(h, '#000000', -t) : mix(h, '#FFFFFF', t);
  const lum = h => { const [r, g, b] = hexRGB(h); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; };
  const line = c => lum(c) > 0.5 ? sh(c, -0.14) : sh(c, 0.16);
  let seed = 1; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const poly = (pts, fill, extra = '') => `<polygon points="${pts.map(pt).join(' ')}" fill="${fill}" ${extra}/>`;
  const rect0 = (x, y, w, h, fill, extra = '') => `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(0, w).toFixed(1)}" height="${Math.max(0, h).toFixed(1)}" fill="${fill}" ${extra}/>`;
  const rect = (x, y, w, h, fill, extra = '') => rect0(x, y, w, h, fill, extra) + (/rx="[0-9]/.test(extra) && fill[0] === '#' && !/stroke|opacity/.test(extra) && h > 6 ? rect0(x, y, w, h, `url(#${pf}cu)`, extra.match(/rx="[^"]*"/)[0]) : '');
  const ln = (a, b, c, w = 1, extra = '') => `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="${c}" stroke-width="${w}" ${extra}/>`;

  // a box: x0..x1, front face at z (depth d going back), height y0..y1
  let pf = 'r0';
  const U = n => `url(#${pf}${n})`;
  function box(x0, x1, z, d, y0, y1, c, o = {}) {
    let s = '';
    if (y0 <= 0.05 && !o.noshadow) { const sx = Math.min(0.12, (y1 - y0) * 0.22); s += poly([P(x0 - 0.02, z + 0.04, 0.001), P(x1 + 0.02 + sx, z + 0.04, 0.001), P(x1 + 0.02 + sx * 1.6, z - d - 0.02, 0.001), P(x0 - 0.02 + sx * 0.6, z - d - 0.02, 0.001)], '#1a1208', `opacity="${0.22 + Math.min(0.14, (y1 - y0) * 0.3)}" filter="${U('b')}"`); }
    const top = [P(x0, z, y1), P(x1, z, y1), P(x1, z - d, y1), P(x0, z - d, y1)];
    if (x1 < CX) s += poly([P(x1, z, y0), P(x1, z - d, y0), P(x1, z - d, y1), P(x1, z, y1)], sh(c, -0.26)) + poly([P(x1, z, y0), P(x1, z - d, y0), P(x1, z - d, y1), P(x1, z, y1)], U('fs'));
    if (x0 > CX) s += poly([P(x0, z, y0), P(x0, z - d, y0), P(x0, z - d, y1), P(x0, z, y1)], sh(c, -0.12)) + poly([P(x0, z, y0), P(x0, z - d, y0), P(x0, z - d, y1), P(x0, z, y1)], U('fs'));
    if (!o.notop) s += poly(top, o.top || sh(c, 0.16));
    const a = P(x0, z, y1), b = P(x1, z, y0);
    s += rect(a[0], a[1], b[0] - a[0], b[1] - a[1], c, o.rx ? `rx="${o.rx}"` : '');
    if (b[1] - a[1] > 3) s += rect(a[0], a[1], b[0] - a[0], b[1] - a[1], U('fs'), o.rx ? `rx="${o.rx}"` : '');
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
    // ambient occlusion in the corners and along the skirting, darker side walls toward the viewer
    s += poly([[0, 0], P(-1, 0, 1), P(-1, 0, 0), [0, H]], U('wl'));
    s += poly([[W, 0], P(1, 0, 1), P(1, 0, 0), [W, H]], U('wr'));
    s += ln(P(-1, 0, 0), P(1, 0, 0), '#000', 10, `opacity="0.22" filter="${U('b')}"`);
    s += ln(P(-1, 0, 0), P(-1, 1.2, 0), '#000', 10, `opacity="0.18" filter="${U('b')}"`) + ln(P(1, 0, 0), P(1, 1.2, 0), '#000', 10, `opacity="0.18" filter="${U('b')}"`);
    s += ln(P(-1, 0, 0), P(-1, 0, 1), '#000', 8, `opacity="0.14" filter="${U('b')}"`) + ln(P(1, 0, 0), P(1, 0, 1), '#000', 8, `opacity="0.14" filter="${U('b')}"`);
    s += ln(P(-1, 0, 1), P(1, 0, 1), '#000', 8, `opacity="0.10" filter="${U('b')}"`);
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
      seed = 19; for (let i = 0; i < n; i++) { const xa = -1.4 + 2.8 * i / n, xb = -1.4 + 2.8 * (i + 1) / n; s += poly([P(xa, 0, 0), P(xb, 0, 0), P(xb, 1.2, 0), P(xa, 1.2, 0)], sh(c, (rnd() - 0.5) * 0.12)); }
      seed = 23; for (let i = 0; i < 60; i++) { const x = -1.4 + 2.8 * rnd(), z = rnd(); s += ln(P(x, z, 0), P(x + 0.002, z + 0.08, 0), sh(c, -0.1), 0.5, 'opacity="0.6"'); }
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
    let s = poly([P(-1, z0, 0.002), P(-1, z1, 0.002), P(-0.15, z1 + 0.22, 0.002), P(-0.15, z0 + 0.22, 0.002)], '#FFF8E8', `opacity="0.22" filter="${U('b2')}"`);
    s += poly([P(-1, z0, y0), P(-1, z1, y0), P(-1, z1, y1), P(-1, z0, y1)], U('sky'));
    s += poly([P(-1, z0, y0), P(-1, z1, y0), P(-1, z1, y1), P(-1, z0, y1)], 'none', `stroke="${frame}" stroke-width="5"`);
    s += ln(P(-1, (z0 + z1) / 2, y0), P(-1, (z0 + z1) / 2, y1), frame, 3);
    if (curtain) { s += poly([P(-1, z0 - 0.04, 0.02), P(-1, z0 + 0.03, 0.02), P(-1, z0 + 0.03, 0.97), P(-1, z0 - 0.04, 0.97)], curtain, 'opacity="0.92"'); s += poly([P(-1, z1 - 0.03, 0.02), P(-1, z1 + 0.05, 0.02), P(-1, z1 + 0.05, 0.97), P(-1, z1 - 0.03, 0.97)], curtain, 'opacity="0.92"'); }
    return s;
  }
  function windowRight(z0, z1, y0, y1, frame) {
    let s = poly([P(1, z0, 0.002), P(1, z1, 0.002), P(0.15, z1 + 0.22, 0.002), P(0.15, z0 + 0.22, 0.002)], '#FFF8E8', `opacity="0.2" filter="${U('b2')}"`);
    s += poly([P(1, z0, y0), P(1, z1, y0), P(1, z1, y1), P(1, z0, y1)], U('sky'));
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
    s = `<circle cx="${cx}" cy="${cy + r}" r="${r * 3.2}" fill="${U('glow')}"/>` + s;
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
  function armchair(x, z, sc, side) {
    const ch = sc.chair; let s = '';
    if (sc.chairT === 'rattan') { const [x0, y0, w, h] = fr(x - 0.15, x + 0.15, z - 0.12, 0.1, 0.44); s += `<path d="M${x0 + w / 2} ${y0 + h} L${x0} ${y0 + h * 0.35} Q${x0 + w / 2} ${y0 - h * 0.15} ${x0 + w} ${y0 + h * 0.35} Z" fill="${ch}" stroke="${sh(ch, -0.25)}" stroke-width="2"/>`; for (let i = 1; i < 7; i++) s += ln([x0 + w / 2, y0 + h], [x0 + i * w / 7, y0 + h * 0.15], sh(ch, -0.2), 1); s += box(x - 0.12, x + 0.12, z, 0.12, 0.05, 0.13, sc.cushions[0], { rx: 6 }); return s; }
    if (sc.chairT === 'round') { const [x0, y0, w, h] = fr(x - 0.16, x + 0.16, z, 0.02, 0.27); s += poly([P(x - 0.16, z + 0.02, 0.001), P(x + 0.16, z + 0.02, 0.001), P(x + 0.16, z - 0.12, 0.001), P(x - 0.16, z - 0.12, 0.001)], '#000', `opacity="0.2" filter="${U('b')}"`); s += `<path d="M${x0} ${y0 + h} V${y0 + h * 0.4} Q${x0 + w / 2} ${y0 - h * 0.3} ${x0 + w} ${y0 + h * 0.4} V${y0 + h} Z" fill="${ch}"/>` + rect(x0 + w * 0.12, y0 + h * 0.55, w * 0.76, h * 0.45, sh(ch, 0.1), 'rx="10"'); return s; }
    const tall = sc.chairT === 'wing' ? 0.38 : 0.3;
    s += box(x - 0.15, x + 0.15, z - 0.13, 0.05, 0.05, tall, sh(ch, -0.06), { rx: 8 });
    s += box(x - 0.15, x + 0.15, z, 0.15, 0.05, 0.15, ch, { rx: 8 });
    s += box(x - 0.17, x - 0.13, z + 0.005, 0.17, 0.05, 0.2, sh(ch, -0.04), { rx: 6, noshadow: true }) + box(x + 0.13, x + 0.17, z + 0.005, 0.17, 0.05, 0.2, sh(ch, -0.04), { rx: 6, noshadow: true });
    [x - 0.13, x + 0.13].forEach(xx => s += ln(P(xx, z, 0.05), P(xx, z, 0), sc.wood, 3));
    { const [px, py, pw, ph] = fr(x - 0.07, x + 0.07, z - 0.09, 0.15, 0.26); s += rect(px, py, pw, ph, sc.cushions[side > 0 ? 1 : 0], 'rx="6"'); }
    return s;
  }
  function living(sc) {
    const wall = sc.wall; let s = shell(wall, sc.floor, sc.floorT, sc.ceil);
    if (sc.accent && !['brick', 'stone', 'wallpaper'].includes(sc.feature)) s += poly([P(-1, 0, 1), P(1, 0, 1), P(1, 0, 0), P(-1, 0, 0)], sc.accent);
    if (sc.feature === 'wallpaper' || sc.feature === 'beams') s += feature(sc.feature, sc.accent || wall, sc);
    // ceiling tray with cove light
    { const [cx, cy] = P(0, 0.5, 1), rx = 0.62 * 230 * k(0.5); s += `<ellipse cx="${cx}" cy="${cy}" rx="${rx + 10}" ry="${rx * 0.2 + 4}" fill="#FFE9B8" opacity="0.35" filter="${U('b')}"/><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${rx * 0.2}" fill="${sh(sc.ceil || sh(wall, 0.35), 0.04)}" stroke="${sh(sc.ceil || sh(wall, 0.35), -0.08)}"/>`; }
    // TV & fireplace build-out on the back wall, shelving recesses either side
    const bm = sc.feature === 'stone' || sc.feature === 'brick' ? (sc.feature === 'brick' ? (sc.accent || '#9A4E35') : mix(wall, '#B9A98D', 0.6)) : (sc.feature === 'slats' || sc.feature === 'fluted' ? sc.wood : sh(sc.accent || wall, -0.05));
    s += box(-0.55, 0.55, 0.09, 0.09, 0, 1, bm, { noshadow: true });
    { const [x, y, w, h] = fr(-0.55, 0.55, 0.09, 0, 1); seed = 33;
      if (sc.feature === 'stone') for (let r = 0; r * 13 < h; r++) { let cx = x; while (cx < x + w) { const ww = 16 + rnd() * 30; s += rect(cx + 1, y + r * 13 + 1, Math.min(ww, x + w - cx) - 2, 11, sh(bm, (rnd() - 0.5) * 0.25), 'rx="2"'); cx += ww; } }
      if (sc.feature === 'brick') for (let r = 0; r * 11 < h; r++) { s += ln([x, y + r * 11], [x + w, y + r * 11], sh(bm, 0.3), 1); for (let c = 0; c * 30 < w; c++) s += ln([x + c * 30 + (r % 2) * 15, y + r * 11], [x + c * 30 + (r % 2) * 15, y + r * 11 + 11], sh(bm, 0.3), 1); }
      if (sc.feature === 'slats' || sc.feature === 'fluted') for (let i = 0; i < 40; i++) s += rect(x + i * w / 40, y, 1.4, h, sh(bm, -0.22)); }
    { const [x, y, w, h] = fr(-0.32, 0.32, 0.09, 0.44, 0.7); s += rect(x - 6, y - 6, w + 12, h + 12, sh(bm, -0.3)) + rect(x, y, w, h, '#1E1F21', 'rx="2"') + rect(x + 4, y + 4, w * 0.5, h * 0.3, '#FFFFFF', 'opacity="0.05"'); }
    { const [x, y, w, h] = fr(-0.3, 0.3, 0.09, 0.07, 0.22); s += rect(x, y, w, h, '#1A1512') + `<ellipse cx="${x + w / 2}" cy="${y + h * 0.75}" rx="${w * 0.4}" ry="${h * 0.3}" fill="#F2A65A" opacity="0.85" filter="${U('b')}"/>` + `<ellipse cx="${x + w / 2}" cy="${y + h * 0.78}" rx="${w * 0.3}" ry="${h * 0.12}" fill="#FFD27A"/>`; s += box(-0.38, 0.38, 0.1, 0.01, 0.22, 0.245, sh(bm, 0.1), { noshadow: true }); }
    const shelfC = sh(sc.wood, -0.08), cols = neutrals(sc);
    [[-0.92, -0.6], [0.6, 0.92]].forEach(([a, b2], si) => { s += box(a, b2, 0.06, 0.06, 0, 0.3, sc.cab2 === wall ? sh(sc.wood, 0.05) : sc.cab2); const [x, y, w, h] = fr(a, b2, 0.005, 0.32, 0.92); s += rect(x, y, w, h, sh(sc.accent || wall, -0.12));
      [0.32, 0.47, 0.62, 0.77, 0.92].forEach((yy, r) => { s += box(a, b2, 0.06, 0.06, yy - 0.012, yy, shelfC, { noshadow: true }); if (r < 4) { seed = r * 7 + si; for (let i = 0; i < 4; i++) { const xx = a + 0.03 + i * (b2 - a - 0.06) / 4; const [ox, oy, ow, oh] = fr(xx, xx + 0.04 + rnd() * 0.03, 0.03, yy, yy + 0.05 + rnd() * 0.06); s += rect(ox, oy, ow, oh, cols[(i + r) % cols.length], i % 2 ? 'rx="3"' : 'rx="8"'); } } }); });
    s += windowLeft(0.2, 0.62, 0.15, 0.92, sc.metal, sh(sc.sofa, 0.3));
    s += rug(-0.7, 0.7, 0.3, 1.05, sc.rug, sc.rugT, sc);
    // armchairs either side of a round coffee table, side tables, plants
    s += roundTable(-0.86, 0.48, 0.06, 0.17, sc.wood, sc.metal) + roundTable(0.86, 0.48, 0.06, 0.17, sc.wood, sc.metal);
    s += armchair(-0.62, 0.62, sc, -1) + armchair(0.62, 0.62, sc, 1);
    { const tb = sc.table, tz = 0.66, [cx, cy] = P(0, tz - 0.08, 0.13), rx = 0.26 * 230 * k(tz), ry = rx * 0.28, [, fy] = P(0, tz - 0.08, 0);
      s += `<ellipse cx="${cx}" cy="${fy}" rx="${rx}" ry="${ry}" fill="#000" opacity="0.18" filter="${U('b')}"/>`;
      if (sc.tableT === 'rect') { s += box(-0.28, 0.28, tz, 0.16, 0.08, 0.12, tb); s += box(-0.26, -0.23, tz, 0.02, 0, 0.08, sh(tb, -0.2)) + box(0.23, 0.26, tz, 0.02, 0, 0.08, sh(tb, -0.2)); }
      else { s += rect(cx - rx, cy, rx * 2, fy - cy, sh(tb, -0.15)) + `<ellipse cx="${cx}" cy="${fy}" rx="${rx}" ry="${ry}" fill="${sh(tb, -0.15)}"/><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${sh(tb, 0.08)}"/>`; }
      s += rect(cx - 6, cy - 22, 12, 22, sc.cushions[1], 'rx="5"') + rect(cx + 14, cy - 8, 26, 6, sh(sc.wood, -0.2), 'rx="2"'); }
    if (sc.plants >= 1) s += plant(-0.94, 0.12, 0.85, potC(sc));
    if (sc.plants >= 2) s += plant(0.94, 0.12, 0.75, potC(sc));
    s += pendant(sc.light, 0, 0.5, 0.2, sc);
    // the sofa, seen from behind, facing the TV wall
    { const so = sc.sofa, z = 1.16; s += box(-0.6, 0.6, z, 0.18, 0, 0.24, sh(so, -0.06), { rx: 10 });
      sc.cushions.slice(0, 3).forEach((c, i) => { const xx = -0.36 + i * 0.36; const [x, y, w, h] = fr(xx - 0.1, xx + 0.1, z - 0.15, 0.22, 0.33); s += rect(x, y, w, h, c, 'rx="8"'); });
      s += box(-0.6, 0.6, z, 0.04, 0.0, 0.24, sh(so, -0.06), { rx: 10, noshadow: true }); }
    return s;
  }
  function shakerRun(x0, x1, z, y0, y1, c, n, metal) {
    let s = ''; const [x, y, w, h] = fr(x0, x1, z, y0, y1);
    for (let i = 0; i < n; i++) { const dx = x + i * w / n; s += ln([dx, y], [dx, y + h], sh(c, -0.25), 1.2) + rect(dx + 4, y + 4, w / n - 8, h - 8, 'none', `stroke="${sh(c, -0.14)}" stroke-width="1.2"`) + rect(dx + w / n / 2 - 2, y + 7, 4, 4, metal, 'rx="2"'); }
    return s;
  }
  function kitchen(sc) {
    let s = shell(sc.wall, sc.floor, sc.floorT, sc.ceil);
    const wallU = sh(sc.wood, -0.05);
    // window over the sink, splashback, plaster range hood over the hob
    s += wallTile(-0.86, 0.72, 0.34, 0.62, sc.splash, sc.splashT);
    { const [x, y, w, h] = fr(-0.5, -0.05, 0.002, 0.4, 0.86); s += rect(x - 5, y - 5, w + 10, h + 10, sh(sc.wall, -0.1)) + rect(x, y, w, h, U('sky')) + rect(x, y, w, h * 0.35, sh(sc.bedding || sc.wall, -0.02)) + ln([x + w / 2, y + h * 0.35], [x + w / 2, y + h], sc.metal, 3); }
    { const [x, y, w, h] = fr(0.12, 0.52, 0.06, 0.62, 1); const hc = sh(sc.wall, lum(sc.wall) > 0.6 ? -0.07 : 0.08); s += `<path d="M${x + w * 0.2} ${y} H${x + w * 0.8} V${y + h * 0.45} Q${x + w} ${y + h * 0.8} ${x + w} ${y + h} H${x} Q${x} ${y + h * 0.8} ${x + w * 0.2} ${y + h * 0.45} Z" fill="${hc}"/>` + rect(x, y + h - 4, w, 4, sh(hc, -0.15)) + `<path d="M${x + w} ${y + h * 0.82} Q${x + w * 0.85} ${y + h * 0.6} ${x + w * 0.8} ${y + h * 0.45} V${y} H${x + w * 0.8}" fill="${sh(hc, -0.08)}"/>`; }
    // wall units to the ceiling, or open shelves
    if (sc.shelves) [0.7, 0.85].forEach(y => { s += box(-0.86, -0.56, 0.06, 0.06, y, y + 0.015, sc.wood, { noshadow: true }); seed = 4; for (let i = 0; i < 3; i++) { const xx = -0.83 + i * 0.09; const [x, yy, w, h] = fr(xx, xx + 0.06, 0.04, y + 0.015, y + 0.07 + rnd() * 0.04); s += rect(x, yy, w, h, neutrals(sc)[i], 'rx="3"'); } });
    else { s += box(-0.86, -0.56, 0.1, 0.1, 0.62, 1, wallU, { noshadow: true }); s += shakerRun(-0.86, -0.56, 0.1, 0.62, 1, wallU, 2, sc.metal); }
    s += box(0.56, 0.72, 0.1, 0.1, 0.62, 1, wallU, { noshadow: true }) + shakerRun(0.56, 0.72, 0.1, 0.62, 1, wallU, 1, sc.metal);
    // tall fridge / oven tower
    s += box(0.72, 0.98, 0.14, 0.14, 0, 1, wallU); { const [x, y, w, h] = fr(0.72, 0.98, 0.14, 0, 1); s += rect(x + 6, y + h * 0.38, w - 12, h * 0.2, '#2A2A2A', 'rx="3"') + rect(x + 10, y + h * 0.4, w - 20, 3, sc.metal) + ln([x, y + h * 0.36], [x + w, y + h * 0.36], sh(wallU, -0.25), 1.2) + ln([x, y + h * 0.6], [x + w, y + h * 0.6], sh(wallU, -0.25), 1.2) + rect(x + w / 2 - 2, y + 12, 4, h * 0.2, sc.metal); }
    // base run with sink and hob
    s += box(-0.92, 0.72, 0.14, 0.13, 0, 0.32, sc.cab) + shakerRun(-0.92, 0.72, 0.14, 0.03, 0.31, sc.cab, 9, sc.metal);
    s += box(-0.93, 0.72, 0.145, 0.14, 0.32, 0.34, sc.top, { noshadow: true });
    { const [sx, sy] = P(-0.28, 0.07, 0.34); s += `<ellipse cx="${sx}" cy="${sy}" rx="30" ry="6" fill="${sh(sc.top, -0.2)}"/><path d="M${sx} ${sy - 4} V${sy - 30} Q${sx} ${sy - 38} ${sx + 10} ${sy - 34} V${sy - 26}" fill="none" stroke="${sc.metal}" stroke-width="3"/>`; }
    { const [hx, hy] = P(0.32, 0.07, 0.34); s += `<ellipse cx="${hx}" cy="${hy}" rx="40" ry="7" fill="#2A2A2A"/>`; }
    // island with seating side towards us, three stools
    s += box(-0.5, 0.5, 0.62, 0.22, 0, 0.33, sc.island) + shakerRun(-0.5, 0.5, 0.62, 0.03, 0.31, sc.island, 4, sc.metal);
    s += box(-0.55, 0.55, 0.65, 0.27, 0.33, 0.355, sc.top);
    { const [x, y, w] = fr(-0.5, 0.5, 0.64, 0.3, 0.33); s += rect(x, y, w, 4, sh(sc.wood, -0.1)); }
    [-0.32, 0, 0.32].forEach(xx => { const z = 0.8; const st = sc.stool; s += poly([P(xx - 0.07, z + 0.02, 0.001), P(xx + 0.07, z + 0.02, 0.001), P(xx + 0.07, z - 0.06, 0.001), P(xx - 0.07, z - 0.06, 0.001)], '#000', `opacity="0.16" filter="${U('b')}"`);
      [-0.055, 0.055].forEach(o => s += ln(P(xx + o * 1.2, z, 0), P(xx + o, z, 0.24), sh(sc.wood, -0.2), 2.5)); s += ln(P(xx - 0.06, z, 0.1), P(xx + 0.06, z, 0.1), sh(sc.wood, -0.2), 2);
      const [bx, by, bw, bh] = fr(xx - 0.07, xx + 0.07, z - 0.05, 0.26, 0.38); s += rect(bx, by, bw, bh, '#C9A46C', `rx="4" stroke="${sh(sc.wood, -0.2)}" stroke-width="2"`); for (let i = 1; i < 5; i++) s += ln([bx + i * bw / 5, by + 2], [bx + i * bw / 5, by + bh - 2], sh('#C9A46C', -0.2), 0.8);
      s += box(xx - 0.075, xx + 0.075, z, 0.07, 0.24, 0.27, st, { rx: 4, noshadow: true }); });
    s += pendant(['chandelier', 'tiered', 'sputnik'].includes(sc.light) ? 'globe' : 'linear', 0, 0.55, 0.26, sc);
    s += plant(-0.78, 0.07, 0.5, potC(sc));
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
    s += box(-0.36, 0.36, 0.76, 0.1, 0, 0.13, sc.cushions[0] === sc.throw ? sh(sc.chair, 0) : sc.cushions[0], { rx: 6 });
    [-0.33, 0.33].forEach(xx => s += ln(P(xx, 0.76, 0.03), P(xx, 0.76, 0), sc.wood, 3));
    if (sc.plants >= 1) s += plant(0.88, 0.45, 1.1, potC(sc));
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
    const [bx, by] = P(0.5, 0.09, 0.335); s += `<path d="M${bx - 30} ${by - 18} Q${bx - 28} ${by} ${bx} ${by} Q${bx + 28} ${by} ${bx + 30} ${by - 18} Z" fill="${potC(sc)}"/><ellipse cx="${bx}" cy="${by - 18}" rx="30" ry="7" fill="${sh(potC(sc), -0.2)}"/>`;
    s += ln(P(-0.9, 0.3, 0.002), P(-0.15, 0.3, 0.002), sc.metal, 3);
    const [tx, ty] = P(0.5, 0.01, 0.38); s += `<path d="M${tx} ${ty} H${tx} V${ty + 14}" stroke="${sc.metal}" stroke-width="3" fill="none"/>` + rect(tx - 2, ty - 4, 4, 18, sc.metal);
    // mirror
    const [x, y, w, h] = fr(0.3, 0.7, 0.003, 0.45, 0.85), mf = sc.metal, mg = '#DDE7EA';
    if (sc.mirrorT === 'round') s += `<circle cx="${x + w / 2}" cy="${y + h / 2}" r="${Math.min(w, h) / 2}" fill="${mg}" stroke="${mf}" stroke-width="4"/>`;
    else if (sc.mirrorT === 'arch') s += `<path d="M${x + w * 0.15} ${y + h} V${y + w * 0.35} A${w * 0.35} ${w * 0.35} 0 0 1 ${x + w * 0.85} ${y + w * 0.35} V${y + h} Z" fill="${mg}" stroke="${mf}" stroke-width="4"/>`;
    else if (sc.mirrorT === 'scallop') { s += `<circle cx="${x + w / 2}" cy="${y + h / 2}" r="${Math.min(w, h) / 2}" fill="${mf}"/>`; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; s += `<circle cx="${x + w / 2 + Math.cos(a) * Math.min(w, h) / 2}" cy="${y + h / 2 + Math.sin(a) * Math.min(w, h) / 2}" r="8" fill="${mf}"/>`; } s += `<circle cx="${x + w / 2}" cy="${y + h / 2}" r="${Math.min(w, h) / 2 - 6}" fill="${mg}"/>`; }
    else if (sc.mirrorT === 'sunburst') { const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2; for (let i = 0; i < 20; i++) { const a = i * Math.PI / 10; s += ln([cx, cy], [cx + Math.cos(a) * r * 1.2, cy + Math.sin(a) * r * 1.2], mf, 3); } s += `<circle cx="${cx}" cy="${cy}" r="${r * 0.75}" fill="${mg}" stroke="${mf}" stroke-width="3"/>`; }
    else s += rect(x + w * 0.1, y, w * 0.8, h, mg, `stroke="${mf}" stroke-width="4"`);
    // towel on rail
    { const [rx, ry] = P(0.93, 0.003, 0.72); for (let i = 0; i < 6; i++) s += ln([rx - 34, ry + i * 14], [rx + 4, ry + i * 14], sc.metal, 2.5); s += ln([rx - 34, ry - 4], [rx - 34, ry + 76], sc.metal, 3) + ln([rx + 4, ry - 4], [rx + 4, ry + 76], sc.metal, 3) + rect(rx - 30, ry + 10, 30, 46, sc.towel, 'rx="3"'); }
    { const [wx, wy] = P(0.05, 0.08, 0.28); s += `<path d="M${wx - 20} ${wy} H${wx + 20} V${wy + 10} Q${wx + 20} ${wy + 34} ${wx} ${wy + 36} Q${wx - 20} ${wy + 34} ${wx - 20} ${wy + 10} Z" fill="#FBFAF7" stroke="${sh('#FBFAF7', -0.15)}"/>`; const [fx, fy] = P(0.05, 0.003, 0.5); s += rect(fx - 10, fy, 20, 12, sc.metal, 'rx="2"'); }
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

  // ---- shared bits for the sample-home rooms ----
  const potC = sc => mix(sc.cushions[0], '#B5653F', 0.55);
  function oliveTree(x, z, size, pot) {
    let s = box(x - 0.07 * size, x + 0.07 * size, z, 0.07 * size, 0, 0.17 * size, pot);
    const [tx, ty] = P(x, z - 0.035 * size, 0.17 * size), [, topY] = P(x, z - 0.035 * size, 0.55 * size), kk = k(z) * size;
    s += `<path d="M${tx} ${ty} C${tx - 4 * kk} ${ty - 30 * kk} ${tx + 6 * kk} ${topY + 40 * kk} ${tx} ${topY + 18 * kk}" stroke="#5B4A3A" stroke-width="${4 * kk}" fill="none"/>`;
    seed = Math.round((x + 3) * 977);
    for (let i = 0; i < 26; i++) { const ang = rnd() * Math.PI * 2, rr = rnd() * 34 * kk, cx = tx + Math.cos(ang) * rr * 1.2, cy = topY + 14 * kk + Math.sin(ang) * rr * 0.8;
      s += `<ellipse cx="${cx}" cy="${cy}" rx="${(9 + rnd() * 8) * kk}" ry="${(6 + rnd() * 5) * kk}" fill="${['#7D8F5E', '#8FA06F', '#6E8052', '#9AAA7E'][i % 4]}"/>`; }
    return s;
  }
  function loungeChair(x, z, sc, mirror) {
    const c = sc.chair, cu = sc.cushions[1] || sc.cushions[0], q = 0.8, woven = sc.chairT === 'rattan' || sc.chairT === 'round' || sc.chairT === 'lounge';
    let s = '';
    const [bx, by, bw, bh] = fr(x - 0.11, x + 0.11, z - 0.12, 0.1, 0.36);
    s += `<path d="M${bx} ${by + bh} V${by + bh * 0.3} Q${bx + bw / 2} ${by - bh * 0.12} ${bx + bw} ${by + bh * 0.3} V${by + bh} Z" fill="${c}" ${woven ? `stroke="${sh(c, -0.25)}" stroke-width="2"` : ''}/>`;
    if (woven) for (let i = 1; i < 8; i++) s += ln([bx + i * bw / 8, by + bh * 0.12], [bx + i * bw / 8, by + bh], sh(c, -0.2), 1);
    s += box(x - 0.12, x + 0.12, z, 0.13, 0.03, 0.12, c, { rx: 6 });
    s += box(x - 0.1, x + 0.1, z - 0.005, 0.1, 0.12, 0.155, cu, { rx: 6, noshadow: true });
    { const [px, py, pw, ph] = fr(x - 0.065, x + 0.065, z - 0.1, 0.15, 0.26); s += rect(px, py, pw, ph, sc.cushions[0], 'rx="7"'); }
    return s;
  }
  function roundTable(x, z, r, h, c, metal) {
    const [cx, cy] = P(x, z, h), rx = r * 230 * k(z), [, fy] = P(x, z, 0);
    return poly([P(x - r, z + 0.02, 0.001), P(x + r, z + 0.02, 0.001), P(x + r, z - 0.06, 0.001), P(x - r, z - 0.06, 0.001)], '#000', `opacity="0.18" filter="${U('b')}"`) +
      rect(cx - 2.5 * k(z), cy, 5 * k(z), fy - cy, metal) + `<ellipse cx="${cx}" cy="${cy + 3}" rx="${rx}" ry="${rx * 0.28}" fill="${sh(c, -0.15)}"/><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${rx * 0.28}" fill="${c}"/>`;
  }
  const sideQuad = (x, z0, z1, y0, y1, fill, extra = '') => poly([P(x, z0, y0), P(x, z1, y0), P(x, z1, y1), P(x, z0, y1)], fill, extra);
  const neutrals = sc => { const c = [sc.bedding, sc.sofa, sh(sc.wall, -0.12), sc.throw, sc.cushions[1], sc.cushions[0], sh(sc.wood, -0.1)].filter(Boolean); return c.sort((a, b) => lum(b) - lum(a)); };

  // ---------- entry porch (sample home: covered entrance terrace) ----------
  function porch(sc) {
    let s = '';
    const soffit = sh(sc.wood, 0.15), stone = mix(sc.wall, '#B9A98D', 0.55), door = sc.accent && lum(sc.accent) < 0.7 ? sc.accent : sh(sc.wood, -0.2), tile = mix(sc.bfloor, sc.wall, 0.35);
    // timber-look soffit with downlights
    s += poly([[0, 0], [W, 0], P(1, 0, 1), P(-1, 0, 1)], soffit);
    for (let i = 1; i < 16; i++) s += ln(P(-1.4 + 2.8 * i / 16, 0, 1), P(-1.4 + 2.8 * i / 16, 1.1, 1), sh(soffit, -0.1), 0.8);
    [-0.5, 0.5].forEach(xx => { const [dx, dy] = P(xx, 0.45, 1); s += `<circle cx="${dx}" cy="${dy}" r="26" fill="${U('glow')}"/><ellipse cx="${dx}" cy="${dy}" rx="6" ry="2.5" fill="#FFF5DC"/>`; });
    // open ends: garden, railing
    [-1, 1].forEach(sx => { s += poly(sx < 0 ? [[0, 0], P(-1, 0, 1), P(-1, 0, 0), [0, H]] : [[W, 0], P(1, 0, 1), P(1, 0, 0), [W, H]], U('sky'));
      s += poly([P(sx, 0, 0), P(sx, 0, 0.45), P(sx, 1.2, 0.45), P(sx, 1.2, 0)], '#6F8F5E'); seed = sx > 0 ? 3 : 8;
      for (let i = 0; i < 14; i++) { const p2 = P(sx, rnd() * 1.1, 0.42 + rnd() * 0.08); s += `<circle cx="${p2[0]}" cy="${p2[1]}" r="${8 + rnd() * 10}" fill="${sh('#6F8F5E', (rnd() - 0.5) * 0.25)}"/>`; }
      [0.34, 0.2].forEach(yy => s += ln(P(sx, 0, yy), P(sx, 1.2, yy), sc.metal, 3));
      for (let i = 0; i <= 10; i++) s += ln(P(sx, i * 0.12, 0), P(sx, i * 0.12, 0.36), sc.metal, 2.5); });
    // facade
    s += poly([P(-1, 0, 1), P(1, 0, 1), P(1, 0, 0), P(-1, 0, 0)], sc.wall);
    s += poly([P(-1.4, 0, 0), P(1.4, 0, 0), [W, H], [0, H]], tile);
    s += clipFloor((() => { let g = ''; for (let i = 0; i <= 8; i++) g += ln(P(-1.4 + 2.8 * i / 8, 0, 0), P(-1.4 + 2.8 * i / 8, 1.2, 0), sh(tile, -0.12), 0.8); for (let j = 1; j <= 4; j++) g += ln(P(-1.4, Math.pow(j / 4, 1.1), 0), P(1.4, Math.pow(j / 4, 1.1), 0), sh(tile, -0.12), 0.8); return g; })());
    s += ln(P(-1, 0, 0), P(1, 0, 0), '#000', 10, `opacity="0.2" filter="${U('b')}"`);
    // windows with planter boxes beneath
    [[-0.88, -0.42], [0.42, 0.88]].forEach(([a, b2]) => { const [x, y, w, h] = fr(a, b2, 0.002, 0.3, 0.86);
      s += rect(x - 4, y - 4, w + 8, h + 8, sh(sc.wall, -0.14)) + rect(x, y, w, h, U('sky')) + rect(x, y, w, h * 0.5, sh(sc.cushions[1] || sc.wall, 0.4), 'opacity="0.75"') + ln([x + w / 2, y], [x + w / 2, y + h], sc.metal, 3);
      s += box(a + 0.02, b2 - 0.02, 0.08, 0.07, 0, 0.12, potC(sc)); seed = Math.round(a * 100) + 50;
      for (let i = 0; i < 12; i++) { const p2 = P(a + 0.05 + rnd() * (b2 - a - 0.1), 0.05, 0.13 + rnd() * 0.06); s += `<ellipse cx="${p2[0]}" cy="${p2[1]}" rx="${10 + rnd() * 8}" ry="${6 + rnd() * 4}" fill="${['#6E8052', '#7D8F5E', '#5E7A4C'][i % 3]}"/>`; } });
    // front door with sconces
    { const [x, y, w, h] = fr(-0.16, 0.16, 0.002, 0, 0.76); s += rect(x - 9, y - 9, w + 18, h + 9, sh(sc.wall, -0.2)) + rect(x, y, w, h, door);
      s += rect(x + w * 0.1, y + h * 0.07, w * 0.35, h * 0.86, sh(door, -0.1), 'rx="2"') + rect(x + w * 0.55, y + h * 0.07, w * 0.35, h * 0.86, sh(door, -0.1), 'rx="2"') + ln([x + w / 2, y], [x + w / 2, y + h], sh(door, -0.25), 1.5);
      s += rect(x + w * 0.46, y + h * 0.45, 3, 18, sc.metal) + rect(x + w * 0.52, y + h * 0.45, 3, 18, sc.metal); }
    [-0.26, 0.26].forEach(xx => { const [lx, ly] = P(xx, 0.003, 0.6); s += `<circle cx="${lx}" cy="${ly}" r="24" fill="${U('glow')}"/>` + rect(lx - 5, ly - 12, 10, 18, '#FFF0C9', `stroke="${sc.metal}" stroke-width="2"`); });
    s += rug(-0.2, 0.2, 0.05, 0.2, sh(sc.rug, -0.12), 'jute', sc);
    // olive trees in large planters: flanking the door and at the outer corners
    s += oliveTree(-0.3, 0.14, 1, potC(sc)) + oliveTree(0.3, 0.14, 1, potC(sc));
    // two seating areas: a pair of lounge chairs and a side table each side
    [-1, 1].forEach(sx => { s += loungeChair(sx * 0.8, 0.5, sc) + loungeChair(sx * 0.52, 0.5, sc) + roundTable(sx * 0.66, 0.66, 0.06, 0.16, sc.wood, sc.metal); });
    // stone-clad columns
    [[-1.02, -0.9], [0.9, 1.02]].forEach(([a, b2]) => { s += box(a, b2, 1.02, 0.08, 0, 1, stone); const [x, y, w, h] = fr(a, b2, 1.02, 0, 1); seed = 31;
      for (let r = 0; r * 14 < h; r++) { let cx = x; while (cx < x + w) { const ww = 14 + rnd() * 24; s += rect(cx + 1, y + r * 14 + 1, Math.min(ww, x + w - cx) - 2, 12, sh(stone, (rnd() - 0.5) * 0.22), 'rx="2"'); cx += ww; } } });
    return s;
  }

  // ---------- rear dining room (sample home: oval table, glazed doors to rear terrace) ----------
  function caneChair(x, z, sc, facing) {
    const frame = sh(sc.wood, -0.08), seat = sc.cushions[0], panel = sc.chairT === 'rattan' || sc.chairT === 'lounge' || sc.chairT === 'round' ? '#C9A46C' : sc.chair;
    let s = '';
    const back = () => { const [x0, y0, w, h] = fr(x - 0.085, x + 0.085, z - (facing ? -0.03 : 0.07), 0.24, 0.48); let t = rect(x0 - 2, y0 - 2, w + 4, h + 4, frame, 'rx="6"') + rect(x0 + 2, y0 + 2, w - 4, h - 4, panel, 'rx="4"');
      if (panel === '#C9A46C') for (let i = 1; i < 7; i++) t += ln([x0 + i * w / 7, y0 + 3], [x0 + i * w / 7, y0 + h - 3], sh(panel, -0.2), 0.8) + ln([x0 + 3, y0 + i * h / 7], [x0 + w - 3, y0 + i * h / 7], sh(panel, -0.2), 0.8);
      return t; };
    if (!facing) s += back();
    s += box(x - 0.09, x + 0.09, z, 0.09, 0.2, 0.24, seat, { rx: 3, noshadow: true });
    [[x - 0.08], [x + 0.08]].forEach(([xx]) => s += ln(P(xx, z, 0.2), P(xx, z, 0), frame, 2.5));
    s += poly([P(x - 0.1, z + 0.02, 0.001), P(x + 0.1, z + 0.02, 0.001), P(x + 0.1, z - 0.1, 0.001), P(x - 0.1, z - 0.1, 0.001)], '#000', `opacity="0.15" filter="${U('b')}"`);
    if (facing) s += back();
    return s;
  }
  function dining(sc) {
    let s = shell(sc.wall, sc.floor, sc.floorT, sc.ceil);
    // glazed sliding doors across the back wall, curtains stacked in pockets, rear terrace beyond
    { const [x, y, w, h] = fr(-0.62, 0.62, 0.002, 0, 0.88);
      s += rect(x, y, w, h, U('sky')) + rect(x, y + h * 0.62, w, h * 0.38, '#7E9C69') + rect(x, y + h * 0.82, w, h * 0.18, mix(sc.bfloor, sc.wall, 0.35));
      seed = 41; for (let i = 0; i < 16; i++) s += `<circle cx="${x + rnd() * w}" cy="${y + h * (0.55 + rnd() * 0.12)}" r="${10 + rnd() * 14}" fill="${sh('#6F8F5E', (rnd() - 0.5) * 0.3)}"/>`;
      [0.25, 0.75].forEach(f => { const cx = x + w * f; s += `<path d="M${cx - 18} ${y + h} V${y + h * 0.84} Q${cx} ${y + h * 0.74} ${cx + 18} ${y + h * 0.84} V${y + h} Z" fill="#C9A46C" opacity="0.9"/>`; });
      s += rect(x - 5, y - 5, w + 10, h + 5, 'none', `stroke="${sc.metal}" stroke-width="5"`) + ln([x + w / 2, y], [x + w / 2, y + h], sc.metal, 4) + ln([x + w / 4, y], [x + w / 4, y + h], sc.metal, 2) + ln([x + w * 0.75, y], [x + w * 0.75, y + h], sc.metal, 2); }
    const cur = mix(sc.bedding, sc.wall, 0.3);
    [[-0.86, -0.64], [0.64, 0.86]].forEach(([a, b2]) => { const [x, y, w, h] = fr(a, b2, 0.02, 0.01, 0.99); s += rect(x, y, w, h, cur); for (let i = 1; i < 5; i++) s += ln([x + i * w / 5, y], [x + i * w / 5, y + h], sh(cur, -0.1), 2); });
    { const [x, y, w] = fr(-1, 1, 0.03, 0.99, 1); s += rect(x, y - 2, w, 6, sh(sc.ceil || sc.wall, -0.15)); }
    // built-in utensil cabinet on the left wall
    const J = joinery(sc);
    s += sideQuad(-0.995, 0.15, 0.55, 0, 0.8, J) + sideQuad(-0.995, 0.15, 0.55, 0, 0.8, U('wl'));
    for (let i = 0; i <= 2; i++) s += ln(P(-0.99, 0.15 + i * 0.2, 0), P(-0.99, 0.15 + i * 0.2, 0.8), sh(J, -0.18), 1.5);
    s += ln(P(-0.99, 0.15, 0.4), P(-0.99, 0.55, 0.4), sh(J, -0.18), 1.5) + ln(P(-0.99, 0.33, 0.25), P(-0.99, 0.33, 0.33), sc.metal, 3) + ln(P(-0.99, 0.37, 0.25), P(-0.99, 0.37, 0.33), sc.metal, 3);
    s += plant(0.9, 0.2, 1.1, potC(sc));
    // rug, oval pedestal table, six cane-back chairs
    s += rug(-0.78, 0.78, 0.32, 1.0, sc.rug, sc.rugT === 'plain' ? 'border' : sc.rugT, sc);
    const tb = Math.abs(lum(sc.table) - lum(sc.floor)) < 0.08 ? sh(sc.table, -0.18) : sc.table, tz = 0.62;
    [-0.2, 0.2].forEach(xx => s += caneChair(xx, tz - 0.2, sc));
    { const [cx, cy] = P(0, tz, 0.29), rx = 0.5 * 230 * k(tz), ry = rx * 0.3, [, fy] = P(0, tz, 0);
      s += `<ellipse cx="${cx}" cy="${fy}" rx="${rx * 0.7}" ry="${ry * 0.5}" fill="#000" opacity="0.18" filter="${U('b')}"/>`;
      s += `<path d="M${cx - 10} ${cy + 8} L${cx - 22} ${fy} H${cx + 22} L${cx + 10} ${cy + 8} Z" fill="${sh(tb, -0.2)}"/><ellipse cx="${cx}" cy="${fy}" rx="28" ry="7" fill="${sh(tb, -0.25)}"/>`;
      s += `<ellipse cx="${cx}" cy="${cy + 5}" rx="${rx}" ry="${ry}" fill="${sh(tb, -0.18)}"/><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${sh(tb, 0.04)}"/>`;
      s += `<ellipse cx="${cx}" cy="${cy}" rx="${rx * 0.75}" ry="${ry * 0.32}" fill="${sc.cushions[1] || sc.bedding}" opacity="0.9"/>`;
      [[-30, 18, 0], [0, 26, 1], [28, 14, 2]].forEach(([dx, hh, i]) => s += `<path d="M${cx + dx - 8} ${cy} Q${cx + dx - 11} ${cy - hh * 0.6} ${cx + dx - 4} ${cy - hh} H${cx + dx + 4} Q${cx + dx + 11} ${cy - hh * 0.6} ${cx + dx + 8} ${cy} Z" fill="${sh(potC(sc), [0, -0.12, 0.12][i])}"/>`); }
    [-0.66, 0.66].forEach(xx => s += caneChair(xx, tz + 0.04, sc));
    [-0.36, 0.36].forEach(xx => s += caneChair(xx, tz + 0.4, sc, true));
    s += pendant(['chandelier', 'tiered', 'sputnik'].includes(sc.light) ? sc.light : 'linear', 0, tz - 0.02, 0.28, sc);
    return s;
  }

  // ---------- walk-in closet (sample home: cane-door hanging wall, open shoe wall, make-up table) ----------
  function closet(sc) {
    let s = shell(sc.wall, sc.floor, sc.floorT, sc.ceil);
    const J = joinery(sc), Jd = sh(J, -0.2), cane = sc.chairT === 'rattan' || sc.chairT === 'lounge' || sc.chairT === 'round' || sc.headT === 'rattan' ? '#C9A46C' : sh(J, 0.08), cols = neutrals(sc), walnut = sh(sc.wood, -0.12);
    const LX = -0.58, RX = 0.68, zs = [0, 0.2, 0.42, 0.66, 0.92, 1.25, 1.8];
    // make-up table with lit mirror on the end wall, window with roller blind
    { const [wx, wy, ww, wh] = fr(0.3, 0.6, 0.002, 0.45, 0.92); s += rect(wx, wy, ww, wh, U('sky')) + rect(wx, wy, ww, wh * 0.55, sh(sc.bedding || sc.wall, -0.04)) + rect(wx - 3, wy - 3, ww + 6, wh + 6, 'none', `stroke="${sc.metal}" stroke-width="3"`); }
    { const [mx, my, mw, mh] = fr(-0.32, 0.18, 0.003, 0.42, 0.9); s += rect(mx - 10, my - 10, mw + 20, mh + 20, '#FFF2D0', `opacity="0.5" filter="${U('b')}"`) + rect(mx, my, mw, mh, '#DDE7EA', `rx="${mw / 2}" stroke="${sc.metal}" stroke-width="4"`) + rect(mx + 4, my + mh * 0.15, mw - 8, mh * 0.5, '#FFFFFF', `rx="${mw / 3}" opacity="0.25"`); }
    s += box(-0.42, 0.28, 0.2, 0.2, 0.12, 0.31, J); { const [x, y, w, h] = fr(-0.42, 0.28, 0.2, 0.12, 0.29); s += ln([x + w / 2, y], [x + w / 2, y + h], Jd, 1.2) + rect(x + w * 0.25 - 10, y + h / 2, 20, 3, sc.metal) + rect(x + w * 0.75 - 10, y + h / 2, 20, 3, sc.metal); }
    { const [tx, ty] = P(-0.25, 0.08, 0.31); s += rect(tx - 4, ty - 14, 8, 14, sc.cushions[0], 'rx="3"') + rect(tx + 8, ty - 9, 10, 9, sc.metal, 'rx="2"'); }
    // open walnut shoe wall / shelves on the right
    s += sideQuad(0.995, 0, 1.8, 0, 1, sh(walnut, -0.15));
    for (let r = 0; r < 7; r++) { const yy = 0.04 + r * 0.14; s += poly([P(RX, 0, yy), P(RX, 1.8, yy), P(1, 1.8, yy), P(1, 0, yy)], walnut) + ln(P(RX, 0, yy), P(RX, 1.8, yy), sh(walnut, 0.15), 1.5); seed = 60 + r;
      for (let i = 0; i < 10; i++) { const z0 = 0.05 + i * 0.13; if (r < 3) { s += sideQuad(RX + 0.06, z0, z0 + 0.05, yy, yy + 0.05, cols[(i + r) % cols.length]) + sideQuad(RX + 0.06, z0 + 0.06, z0 + 0.11, yy, yy + 0.05, cols[(i + r) % cols.length]); }
        else if (r < 6) { const c = cols[(r + Math.floor(i / 2)) % cols.length]; s += sideQuad(RX + 0.05, z0, z0 + 0.1, yy, yy + 0.08 + (i % 2) * 0.02, c); }
        else s += sideQuad(RX + 0.05, z0, z0 + 0.11, yy, yy + 0.1, sh(J, 0.05)); } }
    s += sideQuad(RX, 0, 1.8, 0, 1, 'none', `stroke="${sh(walnut, -0.2)}" stroke-width="2"`);
    // floor-to-ceiling hanging + drawers wall with cane doors on the left; one bay open
    s += sideQuad(LX, 0, 1.8, 0, 1, J);
    zs.slice(0, -1).forEach((z0, i) => { const z1 = zs[i + 1], open = i === 1 || i === 2;
      if (open) { s += sideQuad(LX, z0 + 0.01, z1 - 0.01, 0.38, 0.97, sh(J, -0.3));
        const n = 9; for (let g = 0; g < n; g++) { const za = z0 + 0.02 + g * (z1 - z0 - 0.04) / n, zb = za + (z1 - z0 - 0.04) / n * 0.8, len = i === 1 ? 0.35 : 0.5; s += sideQuad(LX - 0.005, za, zb, 0.92 - len, 0.92, cols[Math.floor(g * cols.length / n)]); }
        s += ln(P(LX, z0, 0.93), P(LX, z1, 0.93), '#FFF2D0', 3, `filter="${U('b')}"`);
        for (let d = 0; d < 3; d++) { const y0 = 0.02 + d * 0.12; s += sideQuad(LX + 0.002, z0 + 0.01, z1 - 0.01, y0, y0 + 0.11, sh(J, 0.04)) + ln(P(LX + 0.003, (z0 + z1) / 2 - 0.03, y0 + 0.06), P(LX + 0.003, (z0 + z1) / 2 + 0.03, y0 + 0.06), sc.metal, 2.5); } }
      else { s += sideQuad(LX + 0.002, z0 + 0.012, z1 - 0.012, 0.02, 0.97, sh(J, 0.03)) + sideQuad(LX + 0.003, z0 + 0.04, z1 - 0.04, 0.08, 0.9, cane);
        if (cane === '#C9A46C') for (let q = 1; q < 10; q++) { const zz = z0 + 0.04 + q * (z1 - z0 - 0.08) / 10; s += ln(P(LX + 0.004, zz, 0.08), P(LX + 0.004, zz, 0.9), sh(cane, -0.18), 0.7); }
        s += ln(P(LX + 0.005, z1 - 0.03, 0.42), P(LX + 0.005, z1 - 0.03, 0.56), sc.metal, 3); } });
    s += sideQuad(LX, 0, 1.8, 0, 1, U('wl'));
    // runner, make-up stool, ceiling
    s += rug(-0.4, 0.5, 0.3, 1.05, sc.rug, sc.rugT === 'plain' ? 'border' : sc.rugT, sc);
    { const [cx, cy] = P(-0.07, 0.4, 0.2), rx = 0.1 * 230 * k(0.4), [, fy] = P(-0.07, 0.4, 0); s += `<ellipse cx="${cx}" cy="${fy}" rx="${rx}" ry="${rx * 0.3}" fill="#000" opacity="0.2" filter="${U('b')}"/>` + rect(cx - rx, cy, rx * 2, fy - cy - 4, sh(sc.chair, -0.15), 'rx="6"') + `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${rx * 0.3}" fill="${sh(sc.chair, 0.1)}"/>` + rect(cx - 3, fy - 6, 6, 6, sc.metal); }
    [0.3, 0.7].forEach(zz => { const [dx, dy] = P(0.05, zz, 1); s += `<circle cx="${dx}" cy="${dy}" r="22" fill="${U('glow')}"/><ellipse cx="${dx}" cy="${dy}" rx="6" ry="2.5" fill="#FFF5DC"/>`; });
    return s;
  }

  function guest(sc) {
    const bedding = sh(sc.cushions[1] || sc.bedding, 0.35), throwC = sc.cushions[0];
    let s = shell(sc.wall, sc.floor, sc.floorT, sc.ceil || sh(sc.wall, 0.4));
    // built-in wardrobe with sliding doors on the left wall
    const J = joinery(sc); s += sideQuad(-0.995, 0.12, 0.62, 0, 0.98, J);
    [0.12, 0.37, 0.62].forEach(zz => s += ln(P(-0.99, zz, 0), P(-0.99, zz, 0.98), sh(J, -0.22), 2));
    s += sideQuad(-0.99, 0.37, 0.39, 0.4, 0.6, sc.metal);
    // window with curtains on the right
    s += windowRight(0.25, 0.62, 0.3, 0.86, sc.metal);
    [[0.2, 0.28], [0.6, 0.68]].forEach(([z0, z1]) => s += sideQuad(0.995, z0, z1, 0.02, 0.97, mix(sc.bedding, sc.wall, 0.4), 'opacity="0.95"'));
    s += rug(-0.6, 0.55, 0.35, 0.95, sc.rug, sc.rugT === 'plain' ? 'jute' : sc.rugT, sc);
    // daybed, long side to the back wall, with storage drawers
    s += art(sc.art === 'gallery' ? 'gallery' : 'print', -0.62, -0.2, 0.5, 0.8, sc);
    s += box(-0.85, 0.05, 0.3, 0.26, 0, 0.13, sc.bed);
    { const [x, y, w, h] = fr(-0.85, 0.05, 0.3, 0.02, 0.12); for (let i = 1; i < 3; i++) s += ln([x + i * w / 3, y], [x + i * w / 3, y + h], sh(sc.bed, -0.22), 1.2); for (let i = 0; i < 3; i++) s += rect(x + i * w / 3 + w / 6 - 9, y + h / 2 - 1, 18, 3, sc.metal); }
    s += box(-0.84, 0.04, 0.3, 0.25, 0.13, 0.2, bedding, { rx: 4, noshadow: true });
    [-0.66, -0.4, -0.14].forEach((xx, i) => { const [x, y, w, h] = fr(xx - 0.11, xx + 0.11, 0.08, 0.2, 0.36); s += rect(x, y, w, h, [sh(bedding, -0.06), sc.cushions[2] || throwC, sh(bedding, -0.06)][i], 'rx="9"'); });
    { const a2 = P(-0.3, 0.3, 0.2), b2 = P(0.05, 0.3, 0.06); s += rect(a2[0], a2[1], b2[0] - a2[0], b2[1] - a2[1], throwC); for (let i = 1; i < 6; i++) s += rect(a2[0], a2[1] + i * (b2[1] - a2[1]) / 6, b2[0] - a2[0], 2.5, sc.cushions[1] || bedding, 'opacity="0.8"'); }
    // full-length mirror, desk + cane chair, desk lamp, shelf
    { const [x, y, w, h] = fr(0.12, 0.24, 0.004, 0.04, 0.8); s += rect(x, y, w, h, '#DDE7EA', `stroke="${sh(sc.wood, -0.3)}" stroke-width="5" rx="3"`) + rect(x + 4, y + 6, w * 0.3, h - 12, '#fff', 'opacity="0.25"'); }
    [0.62, 0.76].forEach(yy => { s += box(0.32, 0.86, 0.05, 0.05, yy, yy + 0.015, sc.wood, { noshadow: true }); seed = Math.round(yy * 50); for (let i = 0; i < 6; i++) { const xx = 0.35 + i * 0.08; const [x, y, w, h] = fr(xx, xx + 0.05, 0.03, yy + 0.015, yy + 0.08 + rnd() * 0.04); s += rect(x, y, w, h, neutrals(sc)[i % neutrals(sc).length], 'rx="2"'); } });
    s += box(0.32, 0.88, 0.2, 0.17, 0.27, 0.3, sc.wood);
    [0.35, 0.85].forEach(xx => s += box(xx - 0.02, xx + 0.02, 0.2, 0.02, 0, 0.27, sh(sc.wood, -0.2)));
    { const [lx, ly] = P(0.8, 0.1, 0.3); s += `<circle cx="${lx - 12}" cy="${ly - 36}" r="22" fill="${U('glow')}"/>` + ln([lx, ly], [lx - 8, ly - 36], sc.metal, 2.5) + `<path d="M${lx - 22} ${ly - 30} L${lx - 14} ${ly - 46} L${lx + 2} ${ly - 40} Z" fill="${sc.metal}"/>`; }
    { const [bx, by] = P(0.5, 0.12, 0.3); s += rect(bx - 26, by - 4, 52, 4, '#3A3A3A') + rect(bx - 22, by - 30, 44, 26, '#4A4A4A', 'rx="2"'); }
    s += caneChair(0.6, 0.4, sc, true);
    if (sc.plants >= 2) s += plant(0.12, 0.62, 0.8, potC(sc));
    s += pendant(sc.light === 'linear' || sc.light === 'chandelier' || sc.light === 'tiered' ? 'globe' : sc.light, -0.1, 0.55, 0.15, sc);
    return s;
  }

  const LABELS = { living: 'Living room', porch: 'Entry porch', dining: 'Rear dining room', kitchen: 'Kitchen', bedroom: 'Master bedroom', guest: 'Bedroom', closet: 'Walk-in closet', bathroom: 'Bathroom' };
  function draw(room, sc) {
    pf = 'r' + (++uid) + Math.random().toString(36).slice(2, 5);
    const body = { living, porch, dining, kitchen, bedroom, guest, closet, bathroom }[room](sc);
    const defs = `<clipPath id="${pf}c"><rect width="${W}" height="${H}"/></clipPath>
      <filter id="${pf}b" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5"/></filter>
      <filter id="${pf}b2" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="14"/></filter>
      <filter id="${pf}grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.45  0 0 0 0 0.4  0 0 0 0.09 0"/></filter>
      <linearGradient id="${pf}fs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.16"/><stop offset="0.4" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.28"/></linearGradient>
      <linearGradient id="${pf}wl" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0.02"/><stop offset="1" stop-color="#000" stop-opacity="0.16"/></linearGradient>
      <linearGradient id="${pf}wr" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0.04"/><stop offset="1" stop-color="#000" stop-opacity="0.2"/></linearGradient>
      <linearGradient id="${pf}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4F9FB"/><stop offset="0.7" stop-color="#CFE2EA"/><stop offset="1" stop-color="#B9D3C2"/></linearGradient>
      <radialGradient id="${pf}cu" cx="0.38" cy="0.3" r="0.8"><stop offset="0" stop-color="#fff" stop-opacity="0.28"/><stop offset="0.55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.22"/></radialGradient><radialGradient id="${pf}glow"><stop offset="0" stop-color="#FFE9B8" stop-opacity="0.55"/><stop offset="1" stop-color="#FFE9B8" stop-opacity="0"/></radialGradient>
      <linearGradient id="${pf}lx" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFF6E2" stop-opacity="0.10"/><stop offset="0.5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#1a1208" stop-opacity="0.10"/></linearGradient>
      <linearGradient id="${pf}ly" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1208" stop-opacity="0.10"/><stop offset="0.35" stop-color="#000" stop-opacity="0"/><stop offset="0.8" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#1a1208" stop-opacity="0.10"/></linearGradient>
      <radialGradient id="${pf}vig" cx="0.5" cy="0.48" r="0.75"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.32"/></radialGradient>`;
    const light = rect(0, 0, W, H, U('lx')) + rect(0, 0, W, H, U('ly')) + rect(0, 0, W, H, U('vig')) + rect(0, 0, W, H, '#000', `filter="${U('grain')}" opacity="0.6"`);
    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${LABELS[room]}, illustrated"><defs>${defs}</defs><g clip-path="url(#${pf}c)">${body}${light}</g></svg>`;
  }
  return { draw, LABELS };
})();
if (typeof module !== 'undefined') module.exports = ROOMS;
