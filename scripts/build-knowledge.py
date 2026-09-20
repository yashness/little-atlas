"""Build a source-attributed, typed-ready catalog. Run fetch-knowledge.py first."""
import datetime
import html
import json
import re
from pathlib import Path

ROOT=Path(__file__).resolve().parent.parent
CACHE=ROOT/'data/sources'
PIN='144d6977b2b01ac1cbd220de754c0a005616760b'
DATE='2026-09-20'
base=json.loads((ROOT/'data/countries.json').read_text())
curated=json.loads((ROOT/'data/curation.json').read_text())
metadata=json.loads((CACHE/'countries.json').read_text())
by_code={f['cca2'].lower():f for f in metadata}
iso3={f['cca3']:f['cca2'].lower() for f in metadata}
selected={f['c'] for f in base}

def clean(value):
    if isinstance(value,dict):value=value.get('text','')
    value=re.sub(r'<(?:br\s*/?|/p)>','\n',str(value),flags=re.I)
    return re.sub(r'[ \t]+',' ',html.unescape(re.sub('<[^>]+>','',value))).strip()

facts={}
for path in (CACHE/'factbook').glob('*/*.json'):
    document=json.loads(path.read_text())
    domain=clean(document.get('Communications',{}).get('Internet country code',''))
    code=re.search(r'\.([a-z]{2})(?:\W|$)',domain)
    if code:
        country=code[1]
        if country=='uk':country='gb'
        if country=='ps' and path.stem!='we':continue # regional limits are explicitly noted below
        facts[country]=(document,path.relative_to(CACHE/'factbook').as_posix())
# A few tiny states use shared country-code domains or a differently named field.
file_overrides={'va':'europe/vt.json','xk':'europe/kv.json','ps':'middle-east/we.json'}
for code,relative in file_overrides.items():
    p=CACHE/'factbook'/relative
    if p.exists():facts[code]=(json.loads(p.read_text()),relative)

zones={}
for line in (CACHE/'zone.tab').read_text().splitlines():
    if not line or line.startswith('#'):continue
    code,_,zone,*_=line.split('\t')
    zones.setdefault(code.lower(),[]).append(zone)
zones['xk']=['Europe/Belgrade'] # shared civil-time rules; not a sovereignty statement
features={code:[] for code in selected}
for feature,codes in curated['features'].items():
    for code in codes.split():
        assert code in selected,(feature,code)
        features[code].append(feature)
bands={}
for count,codes in curated['bands'].items():
    for code in codes.split():
        assert code not in bands,code
        bands[code]=int(count)
source_meta={'label':'mledoze country metadata','url':'https://github.com/mledoze/countries','snapshot':DATE}
source_tz={'label':'IANA Time Zone Database','url':'https://data.iana.org/time-zones/tzdb/zone.tab','snapshot':(CACHE/'tz-version').read_text().strip()}
source_geo={'label':'UN M49 statistical regions (not the only geographic convention)','url':'https://unstats.un.org/unsd/methodology/m49/','snapshot':DATE}

catalog=[]
missing=[]
for raw in base:
    code=raw['c'];meta=by_code[code]
    fact,relative=facts.get(code,({},''))
    government=fact.get('Government',{})
    field=government.get('Flag',government.get('Flag description',{}))
    detail=clean(field)
    if isinstance(field,dict) and field.get('note'):detail+='\n'+clean(field['note'])
    if not detail:missing.append(code)
    parts=re.split(r'\b(description|meaning|history|name):\s*',detail,flags=re.I)
    sections={parts[i].lower():parts[i+1].strip() for i in range(1,len(parts)-1,2)}
    meaning=sections.get('meaning') or sections.get('history') or detail
    summary=curated['storySummaries'].get(code)
    if not summary:
        sentences=re.split(r'(?<=[.!?])\s+',meaning)
        summary=' '.join(sentences[:2])
        if len(summary)>550:summary=summary[:550].rsplit(' ',1)[0]+'…'
    source={'label':'CIA World Factbook, archived public-domain text','url':f'https://github.com/factbook/factbook.json/blob/{PIN}/{relative}','snapshot':f'pinned {PIN[:12]}, retrieved {DATE}; individual estimates vary'}
    fact_source=source.copy()
    note='Source descriptions can include historical interpretations; they are not meanings shared by every individual.'
    if code=='ps':
        summary='Palestine’s flag uses the Pan-Arab colors. Its design resembles Jordan’s flag, but it has no white star. Shared colors connect these flags to a broader Arab historical tradition.'
        detail='A red triangle at the flagpole meets three horizontal bands: black, white, and green. The flag is used by the State of Palestine. It shares the Arab Revolt color family with several neighboring countries; Jordan adds a white star.'
        source={'label':'Flag of Palestine: design and historical context','url':'https://en.wikipedia.org/wiki/Flag_of_Palestine','snapshot':DATE}
        missing.remove(code)
    if code=='af':
        summary='This white flag with the Shahada is used by Afghanistan’s de facto Taliban authorities. The former republic used a different black-red-green tricolor. Recognition and flag usage remain politically sensitive.'
        detail='The illustrated white flag bears the Shahada, an Islamic statement of faith. It replaced the former republic’s tricolor in use by the de facto authorities in 2021. Do not confuse the two designs when using older reference books.'
        source={'label':'Wikimedia Commons: illustrated de facto flag and history','url':'https://commons.wikimedia.org/wiki/File:Flag_of_the_Taliban.svg','snapshot':DATE}
        note='The older Factbook flag text describes the former republic’s flag and is deliberately not used for this image.'
    if code=='sy':
        summary='The green-white-black flag with three red stars was used in earlier periods of Syrian history and returned after the change of government in late 2024. Older books may show the red-white-black flag with two green stars.'
        note='The archived source explains earlier meanings and explicitly says current interpretations may change; do not treat every historical meaning as settled today.'
    region=curated['regions'].get(code,{})
    regions=region.get('regions',[raw['r']])
    region_note=region.get('note','Oceania is a world region covering Australia and many Pacific islands.' if raw['r']=='Oceania' else 'Continental grouping describes the main territory; overseas territories may be discussed separately.')
    geo=region.get('note',raw['geo'])
    if code=='in':
        raw.update(title='Three stripes. One blue wheel.',memory='Saffron above white above green. The blue Ashoka Chakra in the middle has 24 spokes. Imagine a wheel moving forward—a memory trick, not a spinning-wheel claim.')
    neighbors=sorted({iso3[b] for b in meta.get('borders',[]) if b in iso3 and iso3[b] in selected and iso3[b]!=code})
    people=fact.get('People and Society',{})
    beliefs=clean(people.get('Religions',{}))
    # Present plural traditions, not undated demographic percentages as current facts.
    beliefs=re.sub(r'\b\d+(?:\.\d+)?(?:\s*[-–]\s*\d+(?:\.\d+)?)?\s*%','',beliefs)
    beliefs=re.sub(r'\s+([,;)])',r'\1',beliefs)
    beliefs=re.sub(r'\s{2,}',' ',beliefs).strip()
    if code=='ps':beliefs='' # the cached record covers West Bank, not all Palestinian territories
    catalog.append({
        'code':code,'name':raw['n'],'mapId':raw['id'],'regions':regions,
        'regionMode':region.get('mode','single'),'regionNote':region_note,
        'coordinates':raw['xy'],'geography':geo,'colors':raw['t'] if 't' in raw else raw['colors'],
        'shape':raw['shape'],'features':features[code],'bands':bands.get(code),
        'visualTitle':raw['title'],'mnemonic':raw['memory'],'clue':raw['hint'],
        'compareWith':raw['other'],'scope':raw.get('scope','member'),
        'story':{'summary':summary,'detail':detail,'source':source,'note':note},
        'languages':[{'code':k,'name':v} for k,v in sorted(meta.get('languages',{}).items())],
        'borderCodes':neighbors,'borderNote':curated['borderNotes'].get(code,'Land-border connections follow the cited country dataset; sea neighbors are different.'),
        'timeZones':zones.get(code,[]),
        'beliefs':{'text':beliefs,'note':'Traditions mentioned in an archived source, not a description of every person. Percentages are omitted; estimate dates, if stated, are retained. People may hold other beliefs or none.','source':fact_source} if beliefs else None,
        'sources':[source,fact_source,source_meta,source_tz,source_geo] if source!=fact_source else [source,source_meta,source_tz,source_geo],
    })
assert not missing,('Missing flag sources:',missing)
assert all(c['timeZones'] for c in catalog),[c['code'] for c in catalog if not c['timeZones']]
assert all(c['languages'] for c in catalog),[c['code'] for c in catalog if not c['languages']]
# Border datasets occasionally omit a reciprocal link. Treat only mutual links as quiz-safe;
# preserve the source list in the audit for review rather than guessing an extra frontier.
by={c['code']:c for c in catalog}
asymmetric=[(c['code'],n) for c in catalog for n in c['borderCodes'] if c['code'] not in by[n]['borderCodes']]
for a,b in asymmetric:
    by[a]['borderCodes'].remove(b)
    by[a]['borderNote']+=' An inconsistent one-sided source link was excluded pending review.'
(ROOT/'data/catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
(ROOT/'data/provenance.json').write_text(json.dumps({'retrievedAt':DATE,'factbookCommit':PIN,'timeZoneVersion':source_tz['snapshot'],'entries':len(catalog),'flagStories':len(catalog),'religionNotes':sum(c['beliefs'] is not None for c in catalog),'asymmetricBordersExcluded':asymmetric,'sources':[source_meta,source_tz,source_geo]},ensure_ascii=False,indent=2)+'\n')
# Physical continent outlines avoid coloring all of Russia as Europe merely
# because a country dataset assigns it a statistical region.
geojson=json.loads((CACHE/'regions.geojson').read_text())
outlines={}
for feature in geojson['features']:
    props=feature['properties']
    if props.get('FEATURECLA')!='Continent' or props['NAME']=='ANTARCTICA':continue
    name=props['NAME'].title();name='Oceania' if name=='Australia' else name
    geom=feature['geometry']; polygons=geom['coordinates'] if geom['type']=='MultiPolygon' else [geom['coordinates']]
    paths=[]
    for polygon in polygons:
        for ring in polygon:
            points=[((lon+180)*2.5,(85-lat)*2.8) for lon,lat,*_ in ring]
            paths.append('M'+'L'.join(f'{x:.1f},{y:.1f}' for x,y in points)+'Z')
    outlines[name]=''.join(paths)
# Oceania additionally uses the local country/island outlines, not Australia alone.
(ROOT/'data/continent-outlines.json').write_text(json.dumps(outlines,separators=(',',':'))+'\n')
print(f'Built {len(catalog)} sourced profiles and flag explanations; {len(asymmetric)} inconsistent border links excluded for review.')
