import type { Axis, Country, ExplorerOptions, Selection, Topic } from '../contracts/atlas';
import { normalized } from '../utils/collections';
import { clockDistance, sharesRegion } from './geography';

export const STARTERS = ['jp','br','ca','fr','in','au','ke','za','gb','it','se','ch','bd','ng','us','mx','ar','cn','nz','np','tr','id','pl','ie'];
export const AXES: ReadonlyArray<{ id: Axis; title: string; icon: string; description: string }> = [
  { id:'first-steps', title:'First little steps', icon:'✦', description:'A friendly first set of 24 flags.' },
  { id:'alphabetical', title:'A to Z', icon:'Aa', description:'A clear path through every country.' },
  { id:'continent', title:'Around a continent', icon:'◎', description:'Places that share a part of the world.' },
  { id:'colors', title:'Follow a color', icon:'●', description:'Find a favorite color in different flags.' },
  { id:'patterns', title:'Shapes & symbols', icon:'✧', description:'Circles, stars, crosses, and stripes.' },
  { id:'bands', title:'Count the bands', icon:'☰', description:'Two, three, four… count the background stripes.' },
  { id:'similarity', title:'Flag look-alikes', icon:'≋', description:'Compare patterns and main color palettes.' },
  { id:'neighbors', title:'Next-door countries', icon:'↔', description:'Hop across listed land borders.' },
  { id:'languages', title:'Words we share', icon:'“', description:'Countries with a listed language in common.' },
  { id:'clocks', title:'Clock neighbors', icon:'◷', description:'Nearby UTC offsets today, including summer time.' },
  { id:'unvisited', title:'Somewhere new', icon:'↗', description:'Places not yet stamped in this passport.' },
];
export const TOPICS: readonly Topic[] = [
  {id:'countries',name:'Countries & flags',available:true},
  {id:'rivers',name:'Rivers',available:false},{id:'deserts',name:'Deserts',available:false},
  {id:'forests',name:'Forests',available:false},{id:'languages',name:'Language adventures',available:false},
  {id:'wonders',name:'Wonders',available:false},{id:'places',name:'Places',available:false},
];
export const DEFAULT_EXPLORER: ExplorerOptions = {axis:'alphabetical',region:'all',color:'all',feature:'all',bands:'all',anchor:'in',language:'all',clockWindowMinutes:60,search:''};
export function similarity(a: Country, b: Country): number {
  const palette = (colors: string[]) => new Set(colors.map(c => c === 'light blue' ? 'blue' : c === 'saffron' ? 'orange' : c === 'maroon' ? 'red' : c));
  const ac = palette(a.colors), bc = palette(b.colors), both = [...ac].filter(c => bc.has(c)).length;
  const union = new Set([...ac,...bc]).size;
  return (a.shape === b.shape ? 4 : 0) + (a.bands !== null && a.bands === b.bands ? 1 : 0) + (union ? both / union * 3 : 0);
}
export function selectCountries(catalog: readonly Country[], options: ExplorerOptions, visited: readonly string[], at: Date): Selection {
  const anchor = catalog.find(c => c.code === options.anchor);
  const query = normalized(options.search.trim());
  let result = catalog.filter(c => (!query || normalized(`${c.name} ${c.code} ${c.regions.join(' ')} ${c.code==='tr'?'Turkey':''}`).includes(query))
    && (options.region === 'all' || sharesRegion(c, options.region))
    && (options.color === 'all' || c.colors.includes(options.color))
    && (options.feature === 'all' || c.features.includes(options.feature))
    && (options.bands === 'all' || (options.bands === '5+' ? c.bands !== null && c.bands >= 5 : c.bands === Number(options.bands)))
    && (options.language === 'all' || c.languages.some(l => l.code === options.language)));
  let description = AXES.find(a => a.id === options.axis)?.description ?? '';
  if (options.axis === 'first-steps') result = result.filter(c => STARTERS.includes(c.code));
  if (options.axis === 'unvisited') result = result.filter(c => !visited.includes(c.code));
  if (options.axis === 'neighbors') {
    result = anchor ? result.filter(c => anchor.borderCodes.includes(c.code)) : [];
    description = anchor ? `Listed land neighbors of ${anchor.name}. ${anchor.borderNote}` : 'Choose a reference country.';
  }
  if (options.axis === 'clocks') {
    result = anchor ? result.filter(c => { const distance=clockDistance(anchor,c,at); return distance!==null && distance<=options.clockWindowMinutes; }) : [];
    description = anchor ? `At least one time zone within ${options.clockWindowMinutes/60} hour(s) of a zone in ${anchor.name}, today. UTC offsets, not physical distance; dates can differ.` : 'Choose a reference clock country.';
  }
  result = [...result].sort((a,b) => a.name.localeCompare(b.name,'en'));
  if (options.axis === 'first-steps') result.sort((a,b) => STARTERS.indexOf(a.code)-STARTERS.indexOf(b.code));
  if (options.axis === 'similarity' && anchor) {
    result = result.filter(c => c.code !== anchor.code).sort((a,b) => similarity(anchor,b)-similarity(anchor,a) || a.name.localeCompare(b.name)).slice(0,12);
    description = `Closest pattern-and-palette matches to ${anchor.name}. Similar is a memory aid, not a historical relationship.`;
  }
  if (options.axis === 'clocks' && anchor) result.sort((a,b) => (clockDistance(anchor,a,at)??Infinity)-(clockDistance(anchor,b,at)??Infinity) || a.name.localeCompare(b.name));
  return {countries:result,description,emptyReason:result.length?'':'No countries match these choices. Clear a filter or choose a different reference country; your settings have not been ignored.'};
}
