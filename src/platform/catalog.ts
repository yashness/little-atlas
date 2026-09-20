import raw from '../../data/catalog.json';
import { REGIONS, type Country, type Region } from '../contracts/atlas';

/** JSON is an external boundary even when locally snapshotted. Fail loudly, never guess. */
function readCatalog(value: unknown): Country[] {
  if (!Array.isArray(value)) throw new Error('Country catalog must be an array.');
  const seen=new Set<string>();
  for(const item of value){
    if(typeof item!=='object'||item===null)throw new Error('Invalid country record.');
    const c=item as Record<string,unknown>;
    if(typeof c['code']!=='string'||! /^[a-z]{2}$/.test(c['code'])||seen.has(c['code']))throw new Error('Country codes must be unique two-letter identifiers.');
    seen.add(c['code']);
    for(const key of ['name','mapId','geography','visualTitle','mnemonic','clue','compareWith','shape','regionNote','borderNote'])if(typeof c[key]!=='string')throw new Error(`Missing ${key} for ${c['code']}.`);
    if(!Array.isArray(c['regions'])||!c['regions'].length||!c['regions'].every(r=>REGIONS.includes(r as Region)))throw new Error(`Invalid region membership: ${c['code']}`);
    for(const key of ['colors','features','borderCodes','timeZones','languages','sources'])if(!Array.isArray(c[key]))throw new Error(`Invalid ${key}: ${c['code']}`);
    if(!Array.isArray(c['coordinates'])||c['coordinates'].length!==2||!c['coordinates'].every(Number.isFinite))throw new Error(`Invalid map pin: ${c['code']}`);
    if(!['single','spans','convention'].includes(String(c['regionMode'])))throw new Error(`Invalid region convention: ${c['code']}`);
    if(!['member','observer','additional'].includes(String(c['scope'])))throw new Error(`Invalid status: ${c['code']}`);
    if(typeof c['story']!=='object'||c['story']===null)throw new Error(`Missing flag story: ${c['code']}`);
  }
  // The build-time data audit additionally checks nested fields and cross-record invariants.
  return value as Country[];
}
export const COUNTRIES=readCatalog(raw);
export const BY_CODE=new Map(COUNTRIES.map(c=>[c.code,c]));
export function country(code: string): Country {
  const result=BY_CODE.get(code);
  if(!result)throw new Error(`Unknown country: ${code}`);
  return result;
}
