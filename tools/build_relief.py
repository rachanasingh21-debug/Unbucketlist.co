"""Build the map's natural relief layers from open elevation data (AWS / Mapzen "terrarium" terrain tiles:
SRTM, GMTED, ETOPO1 and others, free to use with attribution).
Output (public/data/): world-ocean.jpg, world-land-1k.jpg, world-land-3k.jpg, relief-<destination>.webp + relief.json
The colouring is designed (region colours, height tints, snowline, soft sun from the north-west), not satellite imagery."""
import io, json, math, os, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor
import numpy as np
from PIL import Image, ImageFilter

S = os.path.dirname(os.path.abspath(__file__))
BASE = os.environ.get('RELIEF_OUT', '/home/user/Unbucketlist.co/public/data/')   # set RELIEF_OUT to build somewhere else first
OUT = BASE
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

BM_URL = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_NextGeneration/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg'
def bm_tile(z, x, y):
    # NASA Blue Marble (cloud-free): used only as a guide to where land is green, brown or red; restyled in grade()
    p = f'{S}/bm/{z}/{x}/{y}.jpg'
    if not os.path.exists(p):
        os.makedirs(os.path.dirname(p), exist_ok=True)
        for a in range(5):
            try:
                with urllib.request.urlopen(urllib.request.Request(BM_URL.format(z=z, x=x, y=y), headers={'User-Agent': 'UnbucketlistMapBuilder/1.0'}), timeout=60) as r:
                    open(p, 'wb').write(r.read()); break
            except Exception:
                time.sleep(2 * (a + 1))
        else:
            raise RuntimeError(f'bm tile {z}/{x}/{y} failed')
    return np.asarray(Image.open(p).convert('RGB'), dtype=np.float32)

def albedo(lon, lat, z):
    z = int(min(8, z)); W_ = lon.shape[1]
    lon = np.clip(lon, -179.999, 179.999); lat = np.clip(lat, -85.05, 85.05)   # tile margins can reach past the world's edge
    x0, x1 = float(lon.min()), float(lon.max()); y0, y1 = float(lat.min()), float(lat.max())
    tx0, ty1 = merc_px(np.array(x0), np.array(y0), z); tx1, ty0 = merc_px(np.array(x1), np.array(y1), z)
    tx0, tx1, ty0, ty1 = int(tx0 // 256), min(2 ** z - 1, int(tx1 // 256)), max(0, int(ty0 // 256)), min(2 ** z - 1, int(ty1 // 256))
    jobs = [(z, x, y) for y in range(ty0, ty1 + 1) for x in range(tx0, tx1 + 1)]
    with ThreadPoolExecutor(8) as ex: tiles = list(ex.map(lambda j: bm_tile(*j), jobs))
    w, h = tx1 - tx0 + 1, ty1 - ty0 + 1; m = np.zeros((h * 256, w * 256, 3), np.float32)
    for i, t in enumerate(tiles): yy, xx = divmod(i, w); m[yy * 256:(yy + 1) * 256, xx * 256:(xx + 1) * 256] = t
    px, py = merc_px(lon, lat, z)
    return np.dstack([sample(m[..., c], px - tx0 * 256, py - ty0 * 256) for c in range(3)])

def rgb2lab(c):
    c = c / 255; c = np.where(c > .04045, ((c + .055) / 1.055) ** 2.4, c / 12.92)
    M = np.array([[.4124, .3576, .1805], [.2126, .7152, .0722], [.0193, .1192, .9505]], np.float32)
    xyz = (c @ M.T) / np.array([.9505, 1, 1.089], np.float32)
    f = np.where(xyz > .008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.dstack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])])

def lab2rgb(l):
    fy = (l[..., 0] + 16) / 116; fx = fy + l[..., 1] / 500; fz = fy - l[..., 2] / 200
    f = np.dstack([fx, fy, fz]); xyz = np.where(f > .2069, f ** 3, (f - 16 / 116) / 7.787) * np.array([.9505, 1, 1.089], np.float32)
    Mi = np.array([[3.2406, -1.5372, -.4986], [-.9689, 1.8758, .0415], [.0557, -.2040, 1.0570]], np.float32)
    c = xyz @ Mi.T; c = np.where(c > .0031308, 1.055 * np.clip(c, 0, None) ** (1 / 2.4) - .055, 12.92 * c)
    return np.clip(c * 255, 0, 255)

def grade(rgb):
    # restyle real-world colour into the reference's tones: lifted, muted, greens pulled towards olive
    L = rgb2lab(rgb); l, a, b = L[..., 0], L[..., 1], L[..., 2]
    g = PAL['grade']; C = np.hypot(a, b); h = np.arctan2(b, a)
    green = np.clip(np.cos(h - math.radians(135)), 0, 1) ** 2            # how 'green' a hue is
    l2 = g['l0'] + g['l1'] * l + g.get('lg', 0) * green * np.clip(C / 12, 0, 1)   # greens are lifted (the print's forests are light sage, not dark)
    h2 = h - math.radians(g['olive']) * green                          # greens lean yellow-olive
    C2 = C * g['c'] * (1 + g['cg'] * green)
    return lab2rgb(np.dstack([l2, C2 * np.cos(h2), C2 * np.sin(h2)])), L

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

def merc_y(lat):  # Web Mercator y in 'degrees' (equals lat at the equator; +-180 at +-85.05)
    return np.degrees(np.log(np.tan(np.pi / 4 + np.radians(np.clip(lat, -85.0511, 85.0511)) / 2)))

def inv_merc(y): return np.degrees(2 * np.arctan(np.exp(np.radians(y))) - np.pi / 2)

def mgrid(x0, x1, ytop, ybot, w, h):
    # pixel-centre lon/lat for a Mercator image spanning lon x0..x1 and Mercator y ytop..ybot
    lon = np.linspace(x0 + (x1 - x0) / (2 * w), x1 - (x1 - x0) / (2 * w), w)[None, :].repeat(h, 0)
    ym = np.linspace(ytop - (ytop - ybot) / (2 * h), ybot + (ytop - ybot) / (2 * h), h)
    return lon, inv_merc(ym)[:, None].repeat(w, 1)

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

def smooth(a, r):  # three box blurs ~ a gaussian, edge-padded
    def box(x, r, axis):
        pad = [(0, 0)] * x.ndim; pad[axis] = (r + 1, r); x = np.pad(x, pad, mode='edge')
        cs = np.cumsum(x, axis=axis, dtype=np.float64)
        hi = np.take(cs, range(2 * r + 1, x.shape[axis]), axis=axis); lo = np.take(cs, range(0, x.shape[axis] - 2 * r - 1), axis=axis)
        return ((hi - lo) / (2 * r + 1)).astype(np.float32)
    for _ in range(3): a = box(box(a, r, 0), r, 1)
    return a

def hexrgb(h): h = h.lstrip('#'); return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], np.float32)
def sstep(a, b, v): t = np.clip((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)
def mix(c, col, w): return c * (1 - w[..., None]) + col * w[..., None]

LOOKS = {
 # the current, calm natural look
 'natural': dict(dry='#dcc796', mid='#b9c287', wet='#6f9a5c', boreal='#5f8560', dune='#e2c48a', rock='#a99272', high='#bdb3a3', snow='#f6f7f3',
                 warm='#fff0d2', cool='#44557a', sea=['#a6dbd6', '#93cfd2', '#7cbccb', '#5f9fbd', '#4785ad'], sat=1.12, lift=0, tint=.55),
 # satellite: natural, muted land (forest, olive, tan, grey rock, white ice) on one flat, calm ocean colour
 'satellite': dict(dry='#cfbb93', mid='#8f9b63', wet='#3d6a3a', boreal='#34563b', dune='#dcc79c', rock='#8d7c68', high='#aba095', snow='#f5f7f7',
                   warm='#fff3dc', cool='#26364c', sea=['#1c3a54'] * 5, sat=1.02, lift=0, tint=.5, flat_sea=True),
 # atlas: the client's reference (relief wall maps): pale seafoam ocean with soft sea-floor relief, natural green and sand land, white ice
 'atlas': dict(dry='#dcc7a0', mid='#b3b983', wet='#5e8a52', boreal='#4c7352', dune='#e6d2a8', rock='#a8926f', high='#c9bca8', snow='#ffffff',
               warm='#fff6e0', cool='#2f4a52', sea=['#d7ebe3', '#c3e0db', '#a9d1d0', '#8fbfc4', '#7aafb8'], sat=1.08, lift=.02, tint=.5, sea_relief=.5),
 # relief: the client's reference (Kuzeyoku relief wall maps): seafoam sea with visible sea-floor relief, olive/sage lowlands,
 # sand deserts, tan uplands, taupe plateaus, white ice; crisp, strong hillshade with warm light and brown-olive shade
 'relief': dict(mode='relief', dry='#e0c193', mid='#a3ab7c', wet='#6f8559', boreal='#5f6a52', dune='#e8cc9c', rock='#a3866a', high='#908b80',
                peak='#bdb8b0', snow='#ffffff', warm='#fff4e0', cool='#2e2c24', sea=['#c4eedb', '#b3e3d3', '#a6d5c9', '#99c9be', '#8ebeb4'],
                sat=.94, lift=0, tint=.35, sea_relief=.2, exag_world=24, exag_crop=2.6, local=.55, world_z=5, world_sizes=[(1024, 1024), (4096, 3072)],
                cast=.5, cast_sea=.32, ao=.38, sun_alt=24, bm_world_z=4,
                shade_k=1.05, soft=dict(exag_world=.42, cast=.25, cast_sea=.3, ao=.4, local=.65, shade_k=.62),   # multipliers for levels 0 and 1 (the world view)
                grade=dict(w=.9, l0=47, l1=.5, c=1.0, cg=.35, olive=3, lg=8)),
 # golden hour: emerald and honey, coral light, plum shadows, turquoise lagoons, sapphire sea
 'golden': dict(dry='#f3cf86', mid='#c6d06f', wet='#3f9a5b', boreal='#2f7a5a', dune='#f0b971', rock='#c98d63', high='#e9bf9f', snow='#fff7ee',
                warm='#ffcf8f', cool='#5b3f7d', sea=['#a8efe2', '#69d9d3', '#33b6c9', '#2584b4', '#1b5694'], sat=1.28, lift=.03, tint=.4),
 # dreamy pastel: mint and peach, rose rock, lavender shade, aqua to periwinkle sea
 'pastel': dict(dry='#f6d6ae', mid='#cfe4b2', wet='#94d0a2', boreal='#86bba3', dune='#f4c7a1', rock='#dcb0b4', high='#ead0e4', snow='#ffffff',
                warm='#fff1e4', cool='#8a82cf', sea=['#d2f6ef', '#b4ebec', '#9bdbe8', '#86c1e6', '#7aa4de'], sat=1.0, lift=.09, tint=.3),
 # vivid explorer: jade and lime, saffron sand, terracotta mountains, ultramarine sea with bright cyan shallows
 'vivid': dict(dry='#f4c25f', mid='#a5d153', wet='#119a64', boreal='#127a58', dune='#f5ab4e', rock='#c76844', high='#eda57b', snow='#ffffff',
               warm='#ffe0a0', cool='#283f96', sea=['#7df4e2', '#36dcd6', '#10b5d3', '#0f78c4', '#103f9b'], sat=1.42, lift=0, tint=.32),
}
PAL = LOOKS['natural']
DEST_GREEN = {'ladakh': .08, 'rajasthan': .1, 'morocco': .15, 'santorini': .2, 'maldives': .3, 'iceland': .35, 'patagonia': .4,
              'serengeti': .45, 'lofoten': .5, 'peru': .55, 'newzealand': .7, 'kyoto': .85, 'bali': .95}

_LANDMASK = None
def decode_rings(rs):
    out = []
    for a in rs:
        x = y = 0; pts = []; off = 0; px = None
        for i in range(0, len(a), 2):
            x += a[i]; y += a[i + 1]; X = x / 100 + off
            if px is not None and X - px > 180: off -= 360; X -= 360
            elif px is not None and X - px < -180: off += 360; X += 360
            px = X; pts.append((X, y / 100))
        out.append(pts)
    return out

def landmask(lon, lat, extra=(), base=True):
    # Natural Earth coastlines rasterised onto this grid (union of rings)
    global _LANDMASK
    if _LANDMASK is None:
        rs = json.load(open('/home/user/Unbucketlist.co/public/data/land-50.json')); _LANDMASK = []
        for a in rs:
            x = y = 0; pts = []; off = 0; px = None
            for i in range(0, len(a), 2):                     # unwrap rings that cross the date line
                x += a[i]; y += a[i + 1]; X = x / 100 + off
                if px is not None and X - px > 180: off -= 360; X -= 360
                elif px is not None and X - px < -180: off += 360; X += 360
                px = X; pts.append((X, y / 100))
            for sh in (0, -360, 360): _LANDMASK.append([(p_[0] + sh, p_[1]) for p_ in pts])
    H, W = lon.shape; x0, x1, y0, y1 = lon[0, 0], lon[0, -1], lat[0, 0], lat[-1, 0]
    from PIL import ImageDraw
    im = Image.new('L', (W, H), 0); d = ImageDraw.Draw(im)
    for pts in (list(_LANDMASK) if base else []) + list(extra):
        xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
        if max(xs) < min(x0, x1) or min(xs) > max(x0, x1) or max(ys) < min(y0, y1) or min(ys) > max(y0, y1): continue
        y0m, y1m = float(merc_y(y0)), float(merc_y(y1))
        ys_ = merc_y(np.array([p[1] for p in pts]))
        d.polygon([((px - x0) / (x1 - x0) * (W - 1), (y0m - py) / (y0m - y1m) * (H - 1)) for (px, _), py in zip(pts, ys_)], fill=255)
    return np.asarray(im) > 127

def colourise(elev, lon, lat, exag, palette=None, patches=(), alb=None, gw=None, norms=None):
    H, W = elev.shape
    gw = gw or int(round(W * 360 / max(1e-9, float(lon[0, -1] - lon[0, 0]))))   # pixels across the whole world at this scale
    def norm(key, f):                       # tiles share one brightness scale, so their seams don't show
        if norms is not None and key in norms: return norms[key]
        v = f()
        if norms is not None: norms[key] = v
        return v
    if PAL.get('mode') == 'relief':
        # Greenland (its west and east coasts, so Baffin Island, Quebec and Iceland stay out) and Antarctica
        west = np.where(lat < 74, -57, np.where(lat < 77, -68, -74)); east = np.where(lat < 68, -34, np.where(lat < 77, -17, -10))
        ice = ((lat > 59.5) & (lon > west) & (lon < east)) | (lat < -60)
        if ice.any():
            mask = landmask(lon, lat) & ice
            elev = np.where(mask, np.maximum(elev, 900 + 2200 * sstep(0, 1, smooth(mask.astype(np.float32), max(3, gw // 200)))), elev)
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
    dry, mid, wet, boreal = hexrgb(PAL['dry']), hexrgb(PAL['mid']), hexrgb(PAL['wet']), hexrgb(PAL['boreal'])
    c = mix(np.broadcast_to(dry, (H, W, 3)).copy(), mid, sstep(.1, .5, G))
    c = mix(c, wet, sstep(.5, .95, G))
    c = mix(c, boreal, sstep(50, 60, al) * (1 - sstep(64, 70, al)) * sstep(.5, .8, G) * .7)
    for col, w in special: c = mix(c, hexrgb(col), w * .9)
    if PAL.get('mode') == 'relief':  # olive-sage greens, darker in the boreal north and wet tropics
        c = mix(c, hexrgb(PAL['boreal']), (sstep(48, 60, al) * (1 - sstep(66, 72, al)) * .75 + sstep(.85, 1, G) * .5) * sstep(.4, .75, G) * (.55 + .45 * N))
    c = c * (0.94 + 0.12 * N)[..., None]            # gentle mottling across plains
    LAKE = np.zeros(elev.shape, bool)
    if alb is not None and PAL.get('grade'):
        al_ = np.dstack([smooth(alb[..., i], max(1, gw // 1400)) for i in range(3)])       # soften: colour only, no photo texture
        gc, L0 = grade(al_)
        known = (np.abs(lat) < 84.5)[..., None]
        c = np.where(known, mix(c, gc, np.full(elev.shape, PAL['grade']['w'], np.float32)), c)
        # water inside the land (Great Lakes, Baikal, Victoria...): take the sea's colour
        LAKE = (((L0[..., 2] < -6) & (L0[..., 0] < 45)) | ((L0[..., 0] < 6) & (np.abs(lat) < 60))) & (elev > 0) & (np.abs(lat) < 84.5)  # bluish, or near-black (Victoria, Biwa)
        LAKE = smooth(LAKE.astype(np.float32), 1) > .5
    if palette is not None and alb is None:  # each place leans to its own character (arid Ladakh, lush Bali), in this look's colours
        pc = hexrgb(PAL['dry']) * (1 - palette) + hexrgb(PAL['wet']) * palette
        c = mix(c, pc, np.full(elev.shape, PAL['tint'], np.float32))
    for kind, la, lo, r in patches:
        if kind in ('dune', 'snow'):
            w = np.clip(1 - (((lon - lo) ** 2 + (lat - la) ** 2) / (r * 1.3) ** 2), 0, 1) ** .7 * .85
            c = mix(c, hexrgb(PAL['dune'] if kind == 'dune' else PAL['snow']), w)
    # height: green lowlands -> warm rock -> pale high rock -> snow above a latitude-aware snowline
    land = elev > 0
    if PAL.get('mode') == 'relief':
        hw = .4 if alb is not None else 1                     # real colour already carries the browns of high ground
        c = mix(c, hexrgb(PAL['rock']), sstep(500, 1800, elev) * .55 * hw)
        c = mix(c, hexrgb(PAL['high']), sstep(2200, 4200, elev) * .75 * (.3 + .7 * hw))
        c = mix(c, hexrgb(PAL['peak']), sstep(4800, 6000, elev) * .6 * (.3 + .7 * hw))
    else:
        c = mix(c, hexrgb(PAL['rock']), sstep(900, 2800, elev) * .6)
        c = mix(c, hexrgb(PAL['high']), sstep(3600, 5200, elev) * .6)
    snowline = 6100 - np.maximum(0, np.abs(lat) - 33) * 140   # ~6,000 m in the Himalaya, lower towards the poles
    SNOW = sstep(snowline - 250, snowline + 450, elev)
    c = mix(c, hexrgb(PAL['snow']), SNOW * .95)
    # soft sunlight from the north-west
    lat_r = np.radians(lat)
    dlon = (lon[0, 1] - lon[0, 0]) if W > 1 else 1
    dlat = (-np.gradient(lat[:, 0]) if H > 1 else np.ones(1))[:, None]       # Mercator rows: the step in latitude changes row by row
    dx = dlon * 111320 * np.cos(lat_r); dy = dlat * 110540
    gy, gx = np.gradient(elev * exag)
    sx_ = gx / np.maximum(dx, 1); sy_ = -gy / dy
    nx, ny, nz = -sx_, -sy_, np.ones_like(sx_)
    nl = np.sqrt(nx * nx + ny * ny + nz * nz)
    def light(az_deg, alt_deg):  # 0 on flat ground, + sunlit, - shadow
        az, alt = math.radians(az_deg), math.radians(alt_deg)
        lx_, ly_, lz_ = math.cos(alt) * math.sin(az), math.cos(alt) * math.cos(az), math.sin(alt)
        return np.clip((nx * lx_ + ny * ly_ + nz * lz_) / nl, 0, 1) - math.sin(alt)
    # key light from the north-west plus a softer fill from the west: sculpted, not flat
    k = .72 * light(315, 38) + .28 * light(255, 28)
    if PAL.get('mode') == 'relief': k = .8 * light(315, 32) + .2 * light(270, 24)   # lower sun: longer, crisper shadows
    # local relief: ridges catch light, valleys sit in soft shadow (a cheap ambient occlusion)
    r = max(3, int(gw / 320))
    blur = smooth(elev.astype(np.float32), r)
    lr = elev - blur; sc = norm('lr', lambda: float(np.percentile(np.abs(lr[land]), 92) + 1) if land.any() else 1.0)
    k = k + PAL.get('local', .32) * np.tanh(lr / sc)
    kk = np.clip(k, -1, 1)
    CAST = np.zeros_like(elev, dtype=np.float32); AO = np.zeros_like(CAST)
    if PAL.get('cast'):
        hp = (np.maximum(elev, 0) * exag / np.maximum(dy, 1)).astype(np.float32)   # height in pixel units
        drop = math.sqrt(2) * math.tan(math.radians(PAL.get('sun_alt', 24)))
        K = int(min(110, max(4, hp.max() / drop)))
        pad = np.pad(hp, ((K, 0), (K, 0)), mode='edge'); best = np.full_like(hp, -1e9)
        step = 1
        k = 1
        while k <= K:                                   # the sun is in the north-west: look up-left for anything taller
            best = np.maximum(best, pad[K - k:K - k + H, K - k:K - k + W] - k * drop)
            k += step; step = 1 if k < 24 else 2
        CAST = smooth(sstep(0, 2.5, best - hp).astype(np.float32), 1)
    if PAL.get('ao'):
        e0 = np.maximum(elev, 0).astype(np.float32) * exag
        for r_, w_ in ((2, .45), (6, .35), (16, .2)):
            d_ = smooth(e0, max(1, int(r_ * gw / 4096 * (4 if gw < 2000 else 1)))) - e0
            sc_ = norm(f'ao{r_}', lambda: float(np.percentile(np.abs(d_[land]), 90) + 1) if land.any() else 1.0)
            AO += w_ * np.clip(d_ / sc_, 0, 1)
    if PAL.get('mode') == 'relief': kk = kk * (1 - .6 * sstep(.5, 1, SNOW))   # ice sheets stay smooth and bright
    if PAL.get('mode') == 'relief':
        c = c * (1 + kk[..., None] * np.where(land, np.where(kk > 0, .38, PAL.get('shade_k', 1.05)), .3)[..., None])
    else:
        c = c * (1 + kk[..., None] * np.where(land, np.where(kk > 0, .45, .8), .3)[..., None])
    c = mix(c, hexrgb(PAL['warm']), np.clip(kk, 0, 1) * np.where(land, .28, 0))        # warm light
    c = mix(c, hexrgb(PAL['cool']), np.clip(-kk, 0, 1) * np.where(land, .3, .1))       # cool shade
    c = c * (1 - PAL.get('cast', 0) * CAST)[..., None] * (1 - PAL.get('ao', 0) * AO * land)[..., None]
    g = c.mean(axis=2, keepdims=True); c = g + (c - g) * PAL['sat']                          # a touch richer
    # sea floor: turquoise shelves, deep blue ocean
    d = np.clip(-elev, 0, None)
    sea = np.broadcast_to(hexrgb(PAL['sea'][0]), c.shape).copy()
    for lim, col in zip((60, 300, 2000, 5000), PAL['sea'][1:]):
        sea = mix(sea, hexrgb(col), sstep(0, lim, d))
    seac = sea * (1 + kk[..., None] * PAL.get('sea_relief', .25))
    if PAL.get('flat_sea'): seac = np.broadcast_to(hexrgb(PAL['sea'][0]), c.shape)
    seac = seac * (1 - PAL.get('cast_sea', 0) * CAST)[..., None]   # the land throws its shadow onto the sea
    lakec = np.broadcast_to(hexrgb(PAL['sea'][1]), c.shape) * (1 + kk[..., None] * .05)
    c = np.where(LAKE[..., None], lakec, c)
    out = np.where(land[..., None], c, seac)
    out = out + (255 - out) * PAL['lift']  # pastel looks are lighter overall
    return np.clip(out, 0, 255).astype(np.uint8), land

def world():
    z = PAL.get('world_z', 4); n = 2 ** z
    m = mosaic(z, 0, n - 1, 0, n - 1)
    for W, SAVE in PAL.get('world_sizes', [(1024, 1024), (3072, 3072)]):
        H = W // 2
        lon = np.linspace(-180 + 180 / W, 180 - 180 / W, W)[None, :].repeat(H, 0)
        lat = np.linspace(90 - 90 / H, -90 + 90 / H, H)[:, None].repeat(W, 1)
        px, py = merc_px(lon, lat, z); el = sample(m, px, py)
        el[lat < -84] = 2500  # Antarctic plateau beyond the tiles
        alb = albedo(lon, lat, PAL.get('bm_world_z', 4)) if PAL.get('grade') else None
        rgb, land = colourise(el, lon, lat, exag=PAL.get('exag_world', 9), alb=alb)
        im = Image.fromarray(rgb)
        if SAVE != W: im = im.resize((SAVE, SAVE // 2), Image.LANCZOS)
        im.save(OUT + f'world-land-{SAVE // 1024}k.jpg', quality=82, optimize=True, progressive=True)
        if SAVE == 3072:
            im.resize((2048, 1024), Image.LANCZOS).save(OUT + 'world-ocean.jpg', quality=82, optimize=True, progressive=True)
        print('world', W, 'done')

def mworld(levels=(0, 1, 2)):
    """Mercator world pyramid: m/0.webp (2048 px, the whole world, also the sea under everything),
    m/1/<row>-<col>.webp (4096 px world in 4x4 tiles) and m/2/... (8192 px in 8x8). Only tiles with land are written."""
    z = 5; m = mosaic(z, 0, 2 ** z - 1, 0, 2 ** z - 1)
    def elev_at(lon, lat):
        px, py = merc_px(lon, lat, z); el = sample(m, px, py); el[lat < -84] = 2500; return el
    os.makedirs(OUT + 'm', exist_ok=True)
    S0 = 2048
    base = dict(PAL); soft = {k: base[k] * v for k, v in PAL.get('soft', {}).items() if k in base}
    def look(L): PAL.clear(); PAL.update(base); PAL.update(soft if L < 2 else {})
    lon, lat = mgrid(-180, 180, 180, -180, S0, S0)
    el0 = elev_at(lon, lat); alb0 = albedo(lon, lat, 4) if PAL.get('grade') else None
    norms_by = {}
    for grp in ((0,), (2,)):             # one brightness scale per look, from the whole world, so tiles join without seams
        look(grp[0]); norms_by[grp[0]] = {}
        rgb, land0 = colourise(el0, lon, lat, exag=PAL['exag_world'], alb=alb0, gw=S0, norms=norms_by[grp[0]])
        if grp[0] == 0: Image.fromarray(rgb).save(OUT + 'm/0.webp', quality=80, method=6); print('m0 done', norms_by[0], flush=True)
    norms_by[1] = norms_by[0]
    old = OUT + 'm/tiles.json'
    have = {int(k): v for k, v in json.load(open(old))['levels'].items()} if os.path.exists(old) else {}
    for L in levels:
        if L == 0: continue
        S = S0 * 2 ** L; n = S // 1024; T = 360 / n; M = 96; px = 360 / S; have[L] = []; look(L); norms = norms_by[L]
        os.makedirs(OUT + f'm/{L}', exist_ok=True)
        for j in range(n):
            for i in range(n):
                r0, c0 = j * S0 // n, i * S0 // n
                if not land0[max(0, r0 - 2):r0 + S0 // n + 2, max(0, c0 - 2):c0 + S0 // n + 2].any(): continue
                x0 = -180 + i * T - M * px; x1 = x0 + T + 2 * M * px
                yt = 180 - j * T + M * px; yb = yt - T - 2 * M * px
                lon, lat = mgrid(x0, x1, yt, yb, 1024 + 2 * M, 1024 + 2 * M)
                alb = albedo(lon, lat, 5) if PAL.get('grade') else None
                rgb, _ = colourise(elev_at(lon, lat), lon, lat, exag=PAL['exag_world'] * PAL.get('exag_lvl', 1) ** L, alb=alb, gw=S, norms=norms)
                Image.fromarray(rgb[M:M + 1024, M:M + 1024]).save(OUT + f'm/{L}/{j}-{i}.webp', quality=78, method=6)
                have[L].append(f'{j}-{i}')
            print('level', L, 'row', j, 'done', flush=True)
    look(2); PAL.clear(); PAL.update(base)
    json.dump({'size0': S0, 'tile': 1024, 'levels': {str(k): v for k, v in sorted(have.items())}}, open(OUT + 'm/tiles.json', 'w'))

LOOK_PALETTE = {'ladakh': '#c7ad86', 'rajasthan': '#dcc28f', 'morocco': '#d6b98a', 'serengeti': '#c9c07f', 'iceland': '#a9ad8e',
                'patagonia': '#b5b48c', 'peru': '#a9ae7c', 'kyoto': '#86a66d', 'bali': '#76a061', 'newzealand': '#93ad74',
                'lofoten': '#9fae86', 'santorini': '#c9b593', 'maldives': '#e8dcae'}

def crops(only=None):
    meta = {}
    for rid, r in D['ROUTES'].items():
        if only and rid not in only: continue
        la = [s[1] for s in r['stops']]; lo = [s[2] for s in r['stops']]
        my = [float(merc_y(v)) for v in la]
        cx, cym = (min(lo) + max(lo)) / 2, (min(my) + max(my)) / 2
        span = max(max(lo) - min(lo), max(my) - min(my), .08)
        half = span * 2.2 + .15
        x0, x1, y0, y1 = cx - half, cx + half, float(inv_merc(cym - half)), float(inv_merc(cym + half))
        W = 1600; H = int(round(W * float(merc_y(y1) - merc_y(y0)) / (x1 - x0)))
        H = max(400, min(2400, H))
        degpx = (x1 - x0) / W
        z = int(min(12, max(5, math.ceil(math.log2(360 / (256 * degpx))))))
        tx0, ty1 = merc_px(np.array(x0), np.array(y0), z); tx1, ty0 = merc_px(np.array(x1), np.array(y1), z)
        tx0, tx1, ty0, ty1 = int(tx0 // 256), int(tx1 // 256), int(ty0 // 256), int(ty1 // 256)
        while (tx1 - tx0 + 1) * (ty1 - ty0 + 1) > 260 and z > 5:
            z -= 1; tx0, ty1 = merc_px(np.array(x0), np.array(y0), z); tx1, ty0 = merc_px(np.array(x1), np.array(y1), z)
            tx0, tx1, ty0, ty1 = int(tx0 // 256), int(tx1 // 256), int(ty0 // 256), int(ty1 // 256)
        m = mosaic(z, tx0, tx1, ty0, ty1)
        lon, lat = mgrid(x0, x1, float(merc_y(y1)), float(merc_y(y0)), W, H)
        px, py = merc_px(lon, lat, z); el = sample(m, px - tx0 * 256, py - ty0 * 256)
        exag = (2.2 if span > 1 else 3.2) * PAL.get('exag_crop', 1)
        alb = albedo(lon, lat, z) if PAL.get('grade') else None
        rgb, land = colourise(el, lon, lat, exag=exag, palette=DEST_GREEN.get(rid), patches=r.get('patches', []), alb=alb)
        # feathered edges so the close-up melts into the world layer
        yy, xx = np.mgrid[0:H, 0:W]; e = np.minimum.reduce([xx, W - 1 - xx, yy, H - 1 - yy]).astype(np.float32)
        alpha = (np.clip(e / (min(W, H) * .12), 0, 1) ** 1.5 * 255).astype(np.uint8)
        Image.fromarray(np.dstack([rgb, alpha])).save(OUT + f'relief-{rid}.webp', quality=78, method=6)
        meta[rid] = [round(x0, 4), round(y0, 4), round(x1, 4), round(y1, 4)]
        print(rid, 'z', z, 'tiles', (tx1 - tx0 + 1) * (ty1 - ty0 + 1), 'size', W, H, f'{os.path.getsize(OUT + f"relief-{rid}.webp") // 1024}KB', flush=True)
    p = BASE + 'relief.json'
    old = json.load(open(p)) if os.path.exists(p) else {}
    old.update(meta); json.dump(old, open(p, 'w'))

if __name__ == '__main__':
    args = sys.argv[1:]
    looks = [a for a in args if a in LOOKS] or list(LOOKS)
    rest = [a for a in args if a not in LOOKS]
    for look in looks:
        PAL = LOOKS[look]; OUT = BASE + f'looks/{look}/'; os.makedirs(OUT, exist_ok=True); print('== look', look, flush=True)
        if not rest or 'world' in rest: mworld()
        if 'world0' in rest: mworld((0,))
        if 'world01' in rest: mworld((0, 1))
        if not rest or 'crops' in rest: crops([a for a in rest if a not in ('world', 'crops')] or None)
        print(look, sum(os.path.getsize(OUT + f) for f in os.listdir(OUT)) // 1024, 'KB total', flush=True)
