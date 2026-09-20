import type { Country, Region } from '../contracts/atlas';
import { unique } from '../utils/collections';

export function regionLabel(country: Pick<Country, 'regions' | 'regionMode'>): string {
  return country.regions.join(country.regionMode === 'convention' ? ' or ' : ' & ');
}
export function regionSentence(country: Country): string {
  const label = regionLabel(country);
  if (country.regionMode === 'spans') return `${country.name} spans ${label}. Both belong in its answer.`;
  if (country.regionMode === 'convention') return `${country.name} is grouped with ${label}, depending on the convention. We accept both.`;
  return `${country.name} is in ${label}.`;
}
export function sharesRegion(a: Country, b: Region): boolean { return a.regions.includes(b); }

// Bound memoization to one explicit instant; repeated quiz eligibility checks
// must not construct thousands of identical Intl formatters or leak a growing cache.
let cachedInstant=NaN;
const zoneOffsets=new Map<string,number|null>();
/** Derive actual civil UTC offsets from IANA zones at an explicit instant (DST included). */
export function utcOffset(zone: string, at: Date): number | null {
  if(cachedInstant!==at.getTime()){zoneOffsets.clear();cachedInstant=at.getTime();}
  if(zoneOffsets.has(zone))return zoneOffsets.get(zone)??null;
  let result:number|null=null;
  try {
    const part = new Intl.DateTimeFormat('en', { timeZone: zone, timeZoneName: 'longOffset' })
      .formatToParts(at).find(p => p.type === 'timeZoneName')?.value;
    const match = part?.match(/^(?:GMT|UTC)([+-])(\d{2}):(\d{2})$/);
    result=part==='GMT'||part==='UTC'?0:match?(match[1]==='-'?-1:1)*(Number(match[2])*60+Number(match[3])):null;
  } catch { /* older device tzdb: never guess from longitude */ }
  zoneOffsets.set(zone,result);
  return result;
}
export function offsets(country: Country, at: Date): number[] {
  return unique(country.timeZones.map(zone => utcOffset(zone, at)).filter((n): n is number => n !== null)).sort((a, b) => a - b);
}
export function clockDistance(a: Country, b: Country, at: Date): number | null {
  const first = offsets(a, at), second = offsets(b, at);
  return first.length && second.length ? Math.min(...first.flatMap(x => second.map(y => Math.abs(x - y)))) : null;
}
export function offsetLabel(minutes: number): string {
  const absolute = Math.abs(minutes);
  return `UTC${minutes < 0 ? '−' : '+'}${String(Math.floor(absolute / 60)).padStart(2, '0')}:${String(absolute % 60).padStart(2, '0')}`;
}
export function localClock(zone: string, at: Date): string {
  try { return new Intl.DateTimeFormat('en', { timeZone: zone, hour: 'numeric', minute: '2-digit' }).format(at); }
  catch { return 'Clock unavailable on this device'; }
}
