"""Build the map's natural relief layers from open elevation data (AWS / Mapzen "terrarium" terrain tiles:
SRTM, GMTED, ETOPO1 and others, free to use with attribution).
Output (public/data/): world-ocean.jpg, world-land-1k.jpg, world-land-3k.jpg, relief-<destination>.webp + relief.json
The colouring is designed (region colours, height tints, snowline, soft sun from the north-west), not satellite imagery."""
import io, json, math, os, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor
import numpy as np
from PIL import Image, ImageFilter

S = os.path.dirname(os.path.abspath(__file__))
OUT = '/home/user/Unbucketlist.co/public/data/'
CACHE = S + '/terrain/'
D = json.load(open(S + '/mapdata.json'))
URL = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'

def tile(z, x, y):
    p = f'{CACHE}{z}/{x}/{y}.png'
    if not os.path.exists(p):
        os.makedirs(os.path.dirname(p), exist_ok=True)
        for a in range(5):
            try:
                with urllib.request.urlopen(urllib.request.Request(URL.format(z=z, x=x, y=y), headers={'User-Agent': 'UnbucketlistMapBuilder/1.0'}), timeout=60) as r:
                    open(p, 'wb').write(r.read()); break
            except Exception as e:
                time.sleep(2 * (a + 1))
        else:
            raise RuntimeError(f'tile {z}/{x}/{y} failed')
    a = np.asarray(Image.open(p).convert('RGB'), dtype=np.float32)
    return a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768

def mosaic(z, x0, x1, y0, y1):
    jobs = [(z, x % (2 ** z), y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)]
    with ThreadPoolExecutor(8) as ex: tiles = list(ex.map(lambda j: tile(*j), jobs))
    w, h = x1 - x0 + 1, y1 - y0 + 1
    m = np.zeros((h * 256, w * 256), np.float32)
    for i, t in enumerate(tiles): yy, xx = divmod(i, w); m[yy * 256:(yy + 1) * 256, xx * 256:(xx + 1) * 256] = t
    return m

def merc_px(lon, lat, z):
    n = 256 * 2 ** z; lat = np.clip(lat, -85.05, 85.05); r = np.radians(lat)
    return (lon + 180) / 360 * n, (1 - np.log(np.tan(r) + 1 / np.cos(r)) / math.pi) / 2 * n

def sample(m, px, py):  # bilinear
    px = np.clip(px, 0, m.shape[1] - 1.001); py = np.clip(py, 0, m.shape[0] - 1.001)
    x0 = px.astype(int); y0 = py.astype(int); fx = px - x0; fy = py - y0
    return (m[y0, x0] * (1 - fx) * (1 - fy) + m[y0, x0 + 1] * fx * (1 - fy) + m[y0 + 1, x0] * (1 - fx) * fy + m[y0 + 1, x0 + 1] * fx * fy)

_NOISE = None
def noise(lon, lat):
    global _NOISE
    if _NOISE is None:
        rng = np.random.default_rng(7); acc = np.zeros((1024, 2048), np.float32)
        for (w, h), amp in (((16, 8), .45), ((64, 32), .28), ((256, 128), .17), ((1024, 512), .10)):
            r = rng.random((h, w)).astype(np.float32)
            acc += amp * np.asarray(Image.fromarray((r * 255).astype(np.uint8)).resize((2048, 1024), Image.BICUBIC), np.float32) / 255
        _NOISE = acc
    px = (lon + 180) / 360 * 2047; py = (90 - lat) / 180 * 1023
    return sample(_NOISE, px, py)

def hexrgb(h): h = h.lstrip('#'); return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], np.float32)
def sstep(a, b, v): t = np.clip((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)
def mix(c, col, w): return c * (1 - w[..., None]) + col * w[..., None]

def colourise(elev, lon, lat, exag, palette=None, patches=()):
    H, W = elev.shape
    # region colours, painted the same way as the map's soft regions
    N = noise(lon, lat)
    # greenness from a simple climate model: wet tropics, dry subtropical belts, green temperate lands, tundra
    al = np.abs(lat)
    G = np.interp(al, [0, 8, 14, 22, 30, 38, 48, 58, 66, 72, 90], [.95, .9, .6, .25, .3, .55, .78, .8, .55, .35, .2]).astype(np.float32)
    G = G + (N - .5) * .55
    special = []
    for lx, la, rx, ry, col, a in D['BIOME']:
        if lx + rx * 1.4 < lon.min() or lx - rx * 1.4 > lon.max() or la + ry * 1.4 < lat.min() or la - ry * 1.4 > lat.max(): continue
        e = ((lon - lx) / rx) ** 2 + ((lat - la) / ry) ** 2 + (N - .5) * 1.8   # ragged, natural edges
        w = a * sstep(1.3, .1, e)
        if not w.any(): continue
        if col in ('#ead19a', '#dcd29f'): G = G - w * (1.1 if col == '#ead19a' else .55)      # deserts and steppe
        elif col == '#d2cc8c': G = G * (1 - w * .5) + .42 * w * .5                           # savanna
        elif col == '#6f9d5d': G = G + w * .45                                               # rainforest
        elif col in ('#86a774', '#a8bd86'): G = G + w * .35                                  # forests
        else: special.append((col, w))                                                       # tundra, ice, plateaus
    G = np.clip(G, 0, 1)
    dry, mid, wet, boreal = hexrgb('#dcc796'), hexrgb('#b9c287'), hexrgb('#6f9a5c'), hexrgb('#5f8560')
    c = mix(np.broadcast_to(dry, (H, W, 3)).copy(), mid, sstep(.1, .5, G))
    c = mix(c, wet, sstep(.5, .95, G))
    c = mix(c, boreal, sstep(50, 60, al) * (1 - sstep(64, 70, al)) * sstep(.5, .8, G) * .7)
    for col, w in special: c = mix(c, hexrgb(col), w * .9)
    c = c * (0.94 + 0.12 * N)[..., None]            # gentle mottling across plains
    if palette: c = mix(c, hexrgb(palette), np.full(elev.shape, .55, np.float32))
    for kind, la, lo, r in patches:
        if kind in ('dune', 'snow'):
            w = np.clip(1 - (((lon - lo) ** 2 + (lat - la) ** 2) / (r * 1.3) ** 2), 0, 1) ** .7 * .85
            c = mix(c, hexrgb('#e2c48a' if kind == 'dune' else '#f4f5f1'), w)
    # height: green lowlands -> warm rock -> pale high rock -> snow above a latitude-aware snowline
    land = elev > 0
    c = mix(c, hexrgb('#a99272'), sstep(900, 2800, elev) * .6)
    c = mix(c, hexrgb('#bdb3a3'), sstep(3600, 5200, elev) * .6)
    snowline = 6100 - np.maximum(0, np.abs(lat) - 33) * 140   # ~6,000 m in the Himalaya, lower towards the poles
    c = mix(c, hexrgb('#f6f7f3'), sstep(snowline - 250, snowline + 450, elev) * .95)
    # soft sunlight from the north-west
    lat_r = np.radians(lat)
    dlon = (lon[0, 1] - lon[0, 0]) if W > 1 else 1; dlat = (lat[0, 0] - lat[1, 0]) if H > 1 else 1
    dx = dlon * 111320 * np.cos(lat_r); dy = dlat * 110540
    gy, gx = np.gradient(elev * exag)
    sx_ = gx / np.maximum(dx, 1); sy_ = -gy / dy
    az, alt = math.radians(315), math.radians(42)
    nx, ny, nz = -sx_, -sy_, np.ones_like(sx_)
    nl = np.sqrt(nx * nx + ny * ny + nz * nz)
    lx_, ly_, lz_ = math.cos(alt) * math.sin(az), math.cos(alt) * math.cos(az), math.sin(alt)
    shade = np.clip((nx * lx_ + ny * ly_ + nz * lz_) / nl, 0, 1)
    flat = math.sin(alt)
    k = (shade - flat)  # 0 on flat ground, + sunlit, - shadow
    kk = np.clip(k, -1, 1); c = c * (1 + kk[..., None] * np.where(land, np.where(kk > 0, .5, .85), .3)[..., None])
    c = mix(c, hexrgb('#4d5d78'), np.clip(-k, 0, 1) * .22)
    # sea floor: turquoise shelves, deep blue ocean
    d = np.clip(-elev, 0, None)
    sea = np.broadcast_to(hexrgb('#a6dbd6'), c.shape).copy()
    for lim, col in ((60, '#93cfd2'), (300, '#7cbccb'), (2000, '#5f9fbd'), (5000, '#4785ad')):
        sea = mix(sea, hexrgb(col), sstep(0, lim, d))
    seac = sea * (1 + np.clip(k, -1, 1)[..., None] * .25)
    out = np.where(land[..., None], c, seac)
    return np.clip(out, 0, 255).astype(np.uint8), land

def world():
    z = 4; n = 2 ** z
    m = mosaic(z, 0, n - 1, 0, n - 1)
    for W in (1024, 3072):
        H = W // 2
        lon = np.linspace(-180 + 180 / W, 180 - 180 / W, W)[None, :].repeat(H, 0)
        lat = np.linspace(90 - 90 / H, -90 + 90 / H, H)[:, None].repeat(W, 1)
        px, py = merc_px(lon, lat, z); el = sample(m, px, py)
        el[lat < -84] = 2500  # Antarctic plateau beyond the tiles
        rgb, land = colourise(el, lon, lat, exag=9)
        Image.fromarray(rgb).save(OUT + f'world-land-{W // 1024}k.jpg', quality=80, optimize=True, progressive=True)
        if W == 3072:
            Image.fromarray(rgb).resize((2048, 1024), Image.LANCZOS).save(OUT + 'world-ocean.jpg', quality=80, optimize=True, progressive=True)
        print('world', W, 'done')

LOOK_PALETTE = {'ladakh': '#c7ad86', 'rajasthan': '#dcc28f', 'morocco': '#d6b98a', 'serengeti': '#c9c07f', 'iceland': '#a9ad8e',
                'patagonia': '#b5b48c', 'peru': '#a9ae7c', 'kyoto': '#86a66d', 'bali': '#76a061', 'newzealand': '#93ad74',
                'lofoten': '#9fae86', 'santorini': '#c9b593', 'maldives': '#e8dcae'}

def crops(only=None):
    meta = {}
    for rid, r in D['ROUTES'].items():
        if only and rid not in only: continue
        la = [s[1] for s in r['stops']]; lo = [s[2] for s in r['stops']]
        cx, cy = (min(lo) + max(lo)) / 2, (min(la) + max(la)) / 2
        span = max(max(lo) - min(lo), max(la) - min(la), .08)
        half = span * 2.2 + .15
        hx = half / max(.3, math.cos(math.radians(cy)))  # wider in degrees of longitude at high latitude
        x0, x1, y0, y1 = cx - hx, cx + hx, cy - half, cy + half
        W = 1600; H = int(round(W * (y1 - y0) / (x1 - x0)))
        H = max(400, min(2400, H))
        degpx = (x1 - x0) / W
        z = int(min(12, max(5, math.ceil(math.log2(360 / (256 * degpx))))))
        tx0, ty1 = merc_px(np.array(x0), np.array(y0), z); tx1, ty0 = merc_px(np.array(x1), np.array(y1), z)
        tx0, tx1, ty0, ty1 = int(tx0 // 256), int(tx1 // 256), int(ty0 // 256), int(ty1 // 256)
        while (tx1 - tx0 + 1) * (ty1 - ty0 + 1) > 260 and z > 5:
            z -= 1; tx0, ty1 = merc_px(np.array(x0), np.array(y0), z); tx1, ty0 = merc_px(np.array(x1), np.array(y1), z)
            tx0, tx1, ty0, ty1 = int(tx0 // 256), int(tx1 // 256), int(ty0 // 256), int(ty1 // 256)
        m = mosaic(z, tx0, tx1, ty0, ty1)
        lon = np.linspace(x0, x1, W)[None, :].repeat(H, 0); lat = np.linspace(y1, y0, H)[:, None].repeat(W, 1)
        px, py = merc_px(lon, lat, z); el = sample(m, px - tx0 * 256, py - ty0 * 256)
        exag = 2.2 if span > 1 else 3.2
        rgb, land = colourise(el, lon, lat, exag=exag, palette=LOOK_PALETTE.get(rid), patches=r.get('patches', []))
        # feathered edges so the close-up melts into the world layer
        yy, xx = np.mgrid[0:H, 0:W]; e = np.minimum.reduce([xx, W - 1 - xx, yy, H - 1 - yy]).astype(np.float32)
        alpha = (np.clip(e / (min(W, H) * .12), 0, 1) ** 1.5 * 255).astype(np.uint8)
        Image.fromarray(np.dstack([rgb, alpha])).save(OUT + f'relief-{rid}.webp', quality=78, method=6)
        meta[rid] = [round(x0, 4), round(y0, 4), round(x1, 4), round(y1, 4)]
        print(rid, 'z', z, 'tiles', (tx1 - tx0 + 1) * (ty1 - ty0 + 1), 'size', W, H, f'{os.path.getsize(OUT + f"relief-{rid}.webp") // 1024}KB', flush=True)
    p = OUT + 'relief.json'
    old = json.load(open(p)) if os.path.exists(p) else {}
    old.update(meta); json.dump(old, open(p, 'w'))

if __name__ == '__main__':
    args = sys.argv[1:]
    if not args or 'world' in args: world()
    if not args or 'crops' in args: crops([a for a in args if a not in ('world', 'crops')] or None)
    for f in sorted(os.listdir(OUT)):
        if f.startswith(('world-', 'relief')): print(f, os.path.getsize(OUT + f) // 1024, 'KB')
