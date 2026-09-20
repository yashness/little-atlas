"""Build the extended atlas from a local mledoze/countries snapshot + reviewed clues.
Usage: python3 scripts/build-countries.py /path/to/countries.json
Source: https://github.com/mledoze/countries (ODbL-1.0)
"""
import concurrent.futures
import json
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
STARTERS = set('jp br ca fr in au ke za gb it se ch bd ng us mx ar cn nz np tr id pl ie'.split())
source = json.loads(pathlib.Path(sys.argv[1]).read_text())
selected = [f for f in source if f.get('unMember') or f['cca2'].lower() in ('ps', 'va', 'tw', 'xk')]
assert len(selected) == 197
clues = {}
for line in (ROOT / 'scripts/flag-clues.txt').read_text().splitlines():
    if not line or line.startswith('#'):
        continue
    code, shape, colors, title, hint, other = line.split('|')
    assert code not in clues, code
    clues[code] = dict(shape=shape, colors=colors.split(','), title=title, memory=hint, hint=hint, other=other)
assert set(clues) == {f['cca2'].lower() for f in selected} - STARTERS
names = {'CI': "Côte d’Ivoire", 'CD': 'DR Congo', 'CG': 'Republic of the Congo', 'CV': 'Cabo Verde', 'VA': 'Vatican City', 'TL': 'Timor-Leste', 'SZ': 'Eswatini'}
# Natural Earth uses different administrative codes for these outlines.
map_ids = {'SSD': 'SDS', 'XKX': 'KOS', 'UNK': 'KOS', 'PSE': 'PSX'}
geo_overrides = {
    'RU': 'Russia stretches across eastern Europe and northern Asia. Its capital, Moscow, is in Europe. Its map pin sits in its broad Asian territory.',
    'KZ': 'Kazakhstan is mainly in Central Asia. A small part west of the Ural River is in Europe.',
    'EG': 'Egypt is mainly in northeastern Africa. Its Sinai Peninsula reaches into Asia.',
    'CY': 'Cyprus is an island in the eastern Mediterranean Sea, south of Türkiye. Here we group it with Europe; geographic conventions vary.',
    'XK': 'Kosovo is in southeastern Europe, in the Balkan Peninsula. It is an additional atlas entry, not a UN member or observer state.',
    'TW': 'Taiwan is an island in eastern Asia, off the southeastern coast of China. It is an additional atlas entry, not a UN member or observer state.',
    'VA': 'Vatican City is a tiny country inside Rome, Italy, in southern Europe. The Holy See is a UN observer state.',
    'PS': 'Palestine is in Western Asia, on the eastern side of the Mediterranean region. Its territories include the West Bank and Gaza.',
    'KI': 'Kiribati is a country of islands spread across the central Pacific Ocean, in Oceania. Its islands lie on both sides of the equator.',
}
entries=[]
for f in selected:
    code=f['cca2'].lower()
    if code in STARTERS:
        continue
    region=f['region']
    if region=='Americas':
        region='South America' if f['subregion']=='South America' else 'North America'
    lat,lon=f['latlng']
    name=names.get(f['cca2'], f['name']['common'])
    equator='near the equator, the imaginary line around Earth’s middle' if abs(lat)<5 else ('north' if lat>0 else 'south')+' of the equator, the imaginary line around Earth’s middle'
    geo=geo_overrides.get(f['cca2'], f"{name} is in {f['subregion'] or region}. Its map pin is {equator}.")
    entries.append(dict(c=code,id=map_ids.get(f['cca3'],f['cca3']),n=name,r=region,xy=[lon,lat],scope='additional' if code in ('tw','xk') else 'observer' if code in ('va','ps') else 'member',geo=geo,**clues[code]))
entries.sort(key=lambda f:f['n'])
(ROOT/'assets/country-data.js').write_text('/* Extended country metadata: mledoze/countries (ODbL); visual clues authored for Little Atlas. */\nconst EXTRA_COUNTRIES = '+json.dumps(entries,ensure_ascii=False,indent=2)+';\n')
(ROOT/'assets/countries-source.json').write_text(json.dumps([{'cca2':f['cca2'],'cca3':f['cca3'],'name':f['name']['common'],'region':f['region'],'subregion':f['subregion'],'latlng':f['latlng'],'unMember':f.get('unMember')} for f in selected],ensure_ascii=False,indent=2)+'\n')
def download(f):
    code=f['cca2'].lower(); dest=ROOT/'assets/flags'/f'{code}.svg'
    if not dest.exists():
        url='https://upload.wikimedia.org/wikipedia/commons/5/5c/Flag_of_the_Taliban.svg' if code=='af' else f'https://flagcdn.com/{code}.svg'
        subprocess.run(['curl','--retry','3','-fsSL',url,'-o',str(dest)],check=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    list(pool.map(download,selected))
print(f'Built {len(entries)} new country lessons; {len(selected)} total flags.')
