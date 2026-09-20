"""Fetch pinned public source snapshots; never fetch data at browser runtime."""
import concurrent.futures
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT / 'data/sources'
PIN = '144d6977b2b01ac1cbd220de754c0a005616760b'
COUNTRY_PIN = 'c8015eebdd94c533358406b0d709f441389e1f2e'
EARTH_PIN = 'ca96624a56bd078437bca8184e78163e5039ad19'
TZ_VERSION = '2026d'
CACHE.mkdir(parents=True, exist_ok=True)
cache_index = CACHE / 'downloads.json'
try:
    cached_urls = json.loads(cache_index.read_text())
except (FileNotFoundError, json.JSONDecodeError):
    cached_urls = {}

def fetch(url, dest):
    dest.parent.mkdir(parents=True, exist_ok=True)
    key = str(dest.relative_to(CACHE))
    if not dest.exists() or cached_urls.get(key) != url:
        temporary = dest.with_suffix(dest.suffix + '.download')
        subprocess.run(['curl', '--retry', '3', '--max-time', '40', '-fsSL', url, '-o', str(temporary)], check=True)
        temporary.replace(dest)
        cached_urls[key] = url
    return dest

fetch(f'https://api.github.com/repos/factbook/factbook.json/git/trees/{PIN}?recursive=1', CACHE/'factbook-tree.json')
tree = json.loads((CACHE/'factbook-tree.json').read_text())
paths = [f['path'] for f in tree['tree'] if f['path'].endswith('.json') and f['path'].count('/') == 1]
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    list(pool.map(lambda p: fetch(f'https://raw.githubusercontent.com/factbook/factbook.json/{PIN}/{p}', CACHE/'factbook'/p), paths))
fetch(f'https://raw.githubusercontent.com/mledoze/countries/{COUNTRY_PIN}/countries.json', CACHE/'countries.json')
fetch(f'https://raw.githubusercontent.com/eggert/tz/{TZ_VERSION}/zone.tab', CACHE/'zone.tab')
(CACHE/'tz-version').write_text(TZ_VERSION+'\n')
fetch(f'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/{EARTH_PIN}/geojson/ne_110m_geography_regions_polys.geojson', CACHE/'regions.geojson')
fetch(f'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/{EARTH_PIN}/geojson/ne_110m_admin_0_countries.geojson', CACHE/'world.geojson')
cache_index.write_text(json.dumps(cached_urls, indent=2)+'\n')
print(f'Cached {len(paths)} pinned Factbook records, country metadata, IANA zones, and map outlines.')
