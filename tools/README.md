# Map build tools (not deployed)

- `convert_land.js`: turns Natural Earth coastlines (npm `world-atlas`) into `public/data/land-*.json`.
  Run from a folder with `world-atlas` and `topojson-client` installed; pass destination boxes as JSON.
- `build_relief.py`: builds the natural relief layers in `public/data/looks/relief/` (Web Mercator, like the printed reference):
  `m/0.webp` (2048 px world overview, also the sea), `m/1/<row>-<col>.webp` and `m/2/...` (1024 px tiles of a 4096 / 8192 px world,
  land tiles only, listed in `m/tiles.json`), `relief-<id>.webp` close-ups and `relief.json` (their lon/lat boxes)
  from AWS / Mapzen Terrain Tiles (open elevation data: SRTM, GMTED, ETOPO1 and others; attribution shown on the map).
  Needs numpy + Pillow and a `mapdata.json` next to it with `{BIOME, RANGES, ROUTES}` exported from `public/map.js` and `public/routes.js`.
  `python3 build_relief.py relief world crops` rebuilds everything (about 15 min); `... relief world0` only the overview (40 s, for colour tests);
  `... relief crops ladakh` one place. Colour comes from NASA Blue Marble tiles used only as a hidden guide, graded in `grade()`.
  Tiles are built with a margin and share one brightness scale (`norms`), so their seams don't show.
