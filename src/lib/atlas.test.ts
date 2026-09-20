import test from 'node:test';
import assert from 'node:assert/strict';
import { COUNTRIES, country } from '../platform/catalog';
import { DEFAULT_EXPLORER, selectCountries } from './explorer';
import { makeQuestion, eligibleTargets } from './questions';
import { clockDistance, utcOffset, regionLabel } from './geography';
import type { GameOptions, Region } from '../contracts/atlas';

const now=new Date('2026-07-01T12:00:00Z');
const flags:GameOptions={kind:'flags',rounds:5,choices:2,clues:true};

test('catalog is complete, source-attributed, internally linked, and explicit about status',()=>{
  assert.equal(COUNTRIES.length,197);
  assert.deepEqual(['member','observer','additional'].map(scope=>COUNTRIES.filter(c=>c.scope===scope).length),[193,2,2]);
  assert.equal(new Set(COUNTRIES.map(c=>c.code)).size,197);
  for(const c of COUNTRIES){
    assert(c.story.summary&&c.story.detail&&c.story.source.url.startsWith('https://'),c.code);
    assert(c.languages.length&&c.timeZones.length,c.code);
    assert(c.coordinates[0]>=-180&&c.coordinates[0]<=180&&c.coordinates[1]>=-90&&c.coordinates[1]<=90,c.code);
    assert(!c.borderCodes.includes(c.code));
    for(const neighbor of c.borderCodes)assert(country(neighbor).borderCodes.includes(c.code),`${c.code}/${neighbor}`);
    assert(!c.beliefs||!/%/.test(c.beliefs.text),'Undated percentages must not masquerade as current facts');
    assert(c.bands===null||(Number.isInteger(c.bands)&&c.bands>=2));
    assert(country(c.compareWith));
  }
});

test('Türkiye and other multi-region places have one consistent, non-punitive answer',()=>{
  assert.equal(regionLabel(country('tr')),'Asia & Europe');
  for(const code of ['tr','ru','kz','eg','id','cy','ge','az']){
    const c=country(code);
    assert.equal(c.regions.length,2);
    for(const region of c.regions){
      const pool=selectCountries(COUNTRIES,{...DEFAULT_EXPLORER,region},[],now).countries;
      assert(pool.some(item=>item.code===code),`${code} should appear under ${region}`);
    }
    const result=makeQuestion(c,COUNTRIES,{...flags,kind:'places',choices:4},now,()=>.3);
    assert(result.ok);
    assert.deepEqual(result.question.choices.find(x=>x.correct)?.regions,c.regions);
    for(const wrong of result.question.choices.filter(x=>!x.correct))assert(!wrong.regions?.some(r=>c.regions.includes(r)),`${code}: legitimate region was marked wrong`);
  }
  assert.equal(country('cy').regionMode,'convention');
  assert.equal(country('tr').regionMode,'spans');
});

test('reviewed visual facts do not infer stars from the words “no star”',()=>{
  assert(!country('ml').features.includes('stars'));
  assert(country('sn').features.includes('stars'));
  assert.equal(country('af').bands,null);
  assert.equal(country('bw').bands,5);
  assert.equal(country('ss').bands,5);
  assert.equal(country('mu').bands,4);
  assert(country('in').story.summary.includes('not Gandhi’s spinning wheel'));
});

test('A–Z journeys are deterministic; filters intersect rather than silently broadening',()=>{
  const all=selectCountries(COUNTRIES,DEFAULT_EXPLORER,[],now).countries;
  assert.equal(all[0]?.name,'Afghanistan');
  assert.equal(all.at(-1)?.name,'Zimbabwe');
  assert.deepEqual(all.map(c=>c.name),[...all.map(c=>c.name)].sort((a,b)=>a.localeCompare(b,'en')));
  const filtered=selectCountries(COUNTRIES,{...DEFAULT_EXPLORER,region:'Europe',color:'green'},[],now).countries;
  assert(filtered.length>0);assert(filtered.every(c=>c.regions.includes('Europe')&&c.colors.includes('green')));
  const noMatch=selectCountries(COUNTRIES,{...DEFAULT_EXPLORER,search:'not-a-country'},[],now);
  assert.equal(noMatch.countries.length,0);assert(noMatch.emptyReason);
  assert(selectCountries(COUNTRIES,{...DEFAULT_EXPLORER,search:'turkey'},[],now).countries.some(c=>c.code==='tr'));
});

test('neighbors mean land borders: no imaginary bridge from Sri Lanka to India',()=>{
  const neighbors=selectCountries(COUNTRIES,{...DEFAULT_EXPLORER,axis:'neighbors',anchor:'tr'},[],now).countries;
  assert(neighbors.some(c=>c.code==='gr'));assert(neighbors.some(c=>c.code==='sy'));
  assert(!country('lk').borderCodes.includes('in'));
  assert.equal(selectCountries(COUNTRIES,{...DEFAULT_EXPLORER,axis:'neighbors',anchor:'jp'},[],now).countries.length,0);
});

test('clock proximity uses IANA time and daylight saving, preserving quarter-hour offsets',()=>{
  assert.equal(utcOffset('Europe/London',new Date('2026-01-01T12:00:00Z')),0);
  assert.equal(utcOffset('Europe/London',now),60);
  assert.equal(utcOffset('Asia/Kathmandu',now),345);
  assert.equal(clockDistance(country('in'),country('np'),now),15);
  assert.equal(utcOffset('Not/A_Zone',now),null);
  const nearby=selectCountries(COUNTRIES,{...DEFAULT_EXPLORER,axis:'clocks',anchor:'in',clockWindowMinutes:60},[],now).countries;
  assert(nearby.some(c=>c.code==='np'));assert(!nearby.some(c=>c.code==='gb'));
});

test('configured games keep every country choice in the chosen pool and one unambiguous answer',()=>{
  const pool=selectCountries(COUNTRIES,{...DEFAULT_EXPLORER,region:'Europe'},[],now).countries;
  for(const kind of ['flags','shapes','places','neighbors','clocks'] as const){
    const options={...flags,kind,choices:3 as const};
    for(const target of eligibleTargets(pool,options,now)){
      const result=makeQuestion(target,pool,options,now,()=>.4);assert(result.ok);
      assert.equal(result.question.choices.length,3);
      assert.equal(result.question.choices.filter(c=>c.correct).length,1);
      assert.equal(new Set(result.question.choices.map(c=>c.id)).size,3);
      for(const choice of result.question.choices)if(choice.countryCode)assert(pool.some(c=>c.code===choice.countryCode));
    }
  }
});

test('near-identical flags and undersized pools cannot create unfair quizzes',()=>{
  assert(!makeQuestion(country('td'),[country('td'),country('ro')],flags,now).ok);
  assert(!makeQuestion(country('mc'),[country('mc'),country('id')],flags,now).ok);
  assert(!makeQuestion(country('jp'),[country('jp')],flags,now).ok);
  assert.equal(eligibleTargets([country('jp'),country('bd')],{...flags,kind:'pairs'},now).length,0);
});

test('regional map answers never pretend Oceania is a country',()=>{
  const result=makeQuestion(country('au'),COUNTRIES,{...flags,kind:'places'},now);
  assert(result.ok);assert.equal(result.question.choices.find(c=>c.correct)?.label,'Oceania');
  const group:Region='Oceania';assert(country('au').regions.includes(group));
});
