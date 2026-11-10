// Convert Natural Earth land (world-atlas, public domain data) into compact delta-encoded rings for the map.
// Output: public/data/land-110.json, land-50.json, and land-detail.json (10m coastlines clipped around each destination).
const fs = require('fs');
const topo = require('topojson-client');
const OUT = '/home/user/Unbucketlist.co/public/data/';
fs.mkdirSync(OUT, {recursive: true});

function rings(file) {
  const t = JSON.parse(fs.readFileSync(require.resolve('world-atlas/' + file)));
  const f = topo.feature(t, t.objects.land);
  const out = [];
  for (const feat of (f.features || [f])) {
    const g = feat.geometry; const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
    for (const p of polys) for (const r of p) out.push(r);
  }
  return out;
}
// Douglas-Peucker in degrees
function simplify(pts, tol) {
  if (pts.length < 4) return pts;
  const f = pts[0], l = pts[pts.length - 1];
  if (f[0] === l[0] && f[1] === l[1]) { // closed ring: simplify the two halves separately
    const m = pts.length >> 1;
    return simplifyOpen(pts.slice(0, m + 1), tol).slice(0, -1).concat(simplifyOpen(pts.slice(m), tol));
  }
  return simplifyOpen(pts, tol);
}
function simplifyOpen(pts, tol) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop(); let md = 0, mi = -1;
    const [ax, ay] = pts[a], [bx, by] = pts[b], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1e-9;
    for (let i = a + 1; i < b; i++) { const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / L; if (d > md) { md = d; mi = i; } }
    if (md > tol) { keep[mi] = 1; stack.push([a, mi], [mi, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
// rectangle clip (Sutherland-Hodgman)
function clip(ring, [x0, y0, x1, y1]) {
  let pts = ring;
  const edges = [[p => p[0] >= x0, (a, b) => inter(a, b, 0, x0)], [p => p[0] <= x1, (a, b) => inter(a, b, 0, x1)],
                 [p => p[1] >= y0, (a, b) => inter(a, b, 1, y0)], [p => p[1] <= y1, (a, b) => inter(a, b, 1, y1)]];
  function inter(a, b, k, v) { const t = (v - a[k]) / (b[k] - a[k]); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
  for (const [inside, cut] of edges) {
    const res = [];
    for (let i = 0; i < pts.length; i++) {
      const cur = pts[i], prev = pts[(i + pts.length - 1) % pts.length];
      if (inside(cur)) { if (!inside(prev)) res.push(cut(prev, cur)); res.push(cur); }
      else if (inside(prev)) res.push(cut(prev, cur));
    }
    pts = res; if (!pts.length) break;
  }
  return pts;
}
// delta encode in 1/100 degree
function encode(rs, minPts = 4) {
  const out = [];
  for (const r of rs) {
    if (r.length < minPts) continue;
    const a = []; let px = 0, py = 0;
    for (const [x, y] of r) { const X = Math.round(x * 100), Y = Math.round(y * 100); if (a.length && X === px && Y === py) continue; a.push(X - px, Y - py); px = X; py = Y; }
    if (a.length >= minPts * 2) out.push(a);
  }
  return out;
}
const w110 = rings('land-110m.json').map(r => simplify(r, 0.08));
const w50 = rings('land-50m.json').map(r => simplify(r, 0.03));
fs.writeFileSync(OUT + 'land-110.json', JSON.stringify(encode(w110)));
fs.writeFileSync(OUT + 'land-50.json', JSON.stringify(encode(w50)));

// 10m detail only around destinations (bbox in lng/lat, generous margin)
const boxes = JSON.parse(process.argv[2]);
const w10 = rings('land-10m.json');
const detail = {};
for (const [id, b] of Object.entries(boxes)) {
  const rs = [];
  for (const r of w10) {
    let xmin = 1e9, xmax = -1e9, ymin = 1e9, ymax = -1e9;
    for (const [x, y] of r) { if (x < xmin) xmin = x; if (x > xmax) xmax = x; if (y < ymin) ymin = y; if (y > ymax) ymax = y; }
    if (xmax < b[0] || xmin > b[2] || ymax < b[1] || ymin > b[3]) continue;
    const c = clip(r, b); if (c.length >= 3) rs.push(simplify(c, 0.004));
  }
  detail[id] = encode(rs, 3);
}
fs.writeFileSync(OUT + 'land-detail.json', JSON.stringify(detail));
for (const f of ['land-110.json', 'land-50.json', 'land-detail.json']) console.log(f, (fs.statSync(OUT + f).size / 1024).toFixed(0) + ' KB');
console.log(Object.entries(detail).map(([k, v]) => k + ':' + v.length).join(' '));
