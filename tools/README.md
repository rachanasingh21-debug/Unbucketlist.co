# Map build tools (not deployed)

- `convert_land.js`: turns Natural Earth coastlines (npm `world-atlas`) into `public/data/land-*.json`.
  Run from a folder with `world-atlas` and `topojson-client` installed; pass destination boxes as JSON.
- `build_relief.py`: builds the natural relief layers in `public/data/` (`world-*.jpg`, `relief-<id>.webp`, `relief.json`)
  from AWS / Mapzen Terrain Tiles (open elevation data: SRTM, GMTED, ETOPO1 and others; attribution shown on the map).
  Needs numpy + Pillow and a `mapdata.json` next to it with `{BIOME, RANGES, ROUTES}` exported from `public/map.js` and `public/routes.js`.
  `python3 build_relief.py world crops` rebuilds everything; `python3 build_relief.py crops ladakh` rebuilds one place.
