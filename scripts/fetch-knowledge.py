"""Fetch pinned public source snapshots; never fetch data at browser runtime."""
import concurrent.futures
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / 'data/sources'
PIN = '144d6977b2b01ac1cbd220de754c0a005616760b'
CACHE.mkdir(parents=True, exist_ok=True)

def fetch(url, dest):
    dest.parent.mkdir(parents=True, exist_ok=True)
    if not dest.exists():
        subprocess.run(['curl', '--retry', '3', '--max-time', '40', '-fsSL', url, '-o', str(dest)], check=True)
    return dest

fetch(f'https://api.github.com/repos/factbook/factbook.json/git/trees/{PIN}?recursive=1', CACHE/'factbook-tree.json')
tree = json.loads((CACHE/'factbook-tree.json').read_text())
paths = [f['path'] for f in tree['tree'] if f['path'].endswith('.json') and f['path'].count('/') == 1]
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    list(pool.map(lambda p: fetch(f'https://raw.githubusercontent.com/factbook/factbook.json/{PIN}/{p}', CACHE/'factbook'/p), paths))
fetch('https://raw.githubusercontent.com/mledoze/countries/master/countries.json', CACHE/'countries.json')
fetch('https://data.iana.org/time-zones/tzdb/zone.tab', CACHE/'zone.tab')
fetch('https://data.iana.org/time-zones/tzdb/version', CACHE/'tz-version')
fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_geography_regions_polys.geojson', CACHE/'regions.geojson')
print(f'Cached {len(paths)} Factbook records, country metadata, IANA zones, and continent outlines.')
