/**
 * Cosmatica data adapter for transferring approved templates to the site's CMS.
 * Pure functions only: no DOM access, fetch, globals or demo payment behaviour.
 *
 * Source CMS schema is unknown. Map its existing fields at the boundary.
 * Never send user credentials or payment details through this adapter.
 */

export const BLOCK_TYPES = Object.freeze([
  'paragraph', 'heading', 'quote', 'list', 'table', 'image', 'file', 'separator'
]);

const text = value => typeof value === 'string' ? value.trim() : '';
const arr = value => Array.isArray(value) ? value : [];
const number = value => typeof value === 'number' && Number.isFinite(value) ? value : null;

export function safeAsset(value) {
  const s=text(value);
  if(!s) return null;
  if(/^https:\/\/[^\s]+$/i.test(s)) return s;
  if(s.includes('..') || s.startsWith('//') || s.includes(':')) return null;
  if(s.startsWith('/') || s.startsWith('./') || /^[a-z0-9][a-z0-9._/-]*$/i.test(s)) return s;
  return null;
}

export function normalizeBlocks(raw) {
  return arr(raw).flatMap(item=>{
    if(!item || typeof item !== 'object') return [];
    const type=text(item.type);
    if(!BLOCK_TYPES.includes(type)) return [];
    if(type==='separator') return [{type}];
    if(type==='image') {
      const src=safeAsset(item.src);
      return src ? [{type,src,alt:text(item.alt),caption:text(item.caption)}] : [];
    }
    if(type==='file') {
      const url=safeAsset(item.url);
      return url ? [{type,url,name:text(item.name),format:text(item.format)}] : [];
    }
    if(type==='list') {
      const items=arr(item.items).map(text).filter(Boolean);
      return items.length ? [{type,items,ordered:Boolean(item.ordered)}] : [];
    }
    if(type==='table') {
      const rows=arr(item.rows).filter(Array.isArray).map(row=>row.map(text));
      return rows.length ? [{type,rows}] : [];
    }
    const value=text(item.text);
    if(!value) return [];
    const safeSpans=arr(item.spans).flatMap(span=>{
      if(!span || typeof span!=='object' || typeof span.text!=='string' || !span.text.length)return [];
      const marks=arr(span.marks).filter(m=>['bold','italic','code','underline','sup','sub'].includes(m));
      const href=span.href ? safeAsset(span.href) : null;
      return [{text:String(span.text),marks,href}];
    });
    const safeLinks=arr(item.links).flatMap(link=>{
      const href=safeAsset(link?.url);
      return href ? [{text:text(link.text),url:href}] : [];
    });
    return [{type,text:value,level:type==='heading'?Math.max(2,Math.min(4,Number(item.level)||2)):undefined,
      ...(safeSpans.length?{spans:safeSpans}:{}),...(safeLinks.length?{links:safeLinks}:{})}];
  });
}

const base=(type,record)=>({
  type,
  id:String(record.id??''),
  title:text(record.title??record.name),
  slug:text(record.slug),
  intro:text(record.intro??record.summary),
  blocks:normalizeBlocks(record.blocks??record.body_blocks),
  related:arr(record.related).map(x=>({id:String(x.id??''),title:text(x.title),url:text(x.url)}))
});

export function normalizeCmsPage(type, record={}) {
  if(!record || typeof record!=='object') throw new TypeError('CMS record must be an object');
  const normalized=base(type,record);
  if(type==='project') {
    const fundraiser=record.fundraising && typeof record.fundraising==='object' ? record.fundraising : {};
    const active=Boolean(fundraiser.enabled);
    normalized.status=text(record.status);
    normalized.mission=text(record.mission);
    normalized.goals=arr(record.goals).map(text).filter(Boolean);
    normalized.hero=safeAsset(record.hero??record.image);
    normalized.team=arr(record.team);
    normalized.news=arr(record.news);
    normalized.events=arr(record.events);
    normalized.files=arr(record.files).map(f=>({name:text(f.name),url:safeAsset(f.url)})).filter(f=>f.url);
    normalized.fundraising={
      mode:active ? (fundraiser.complete ? 'completed' : 'active') : 'none',
      target:number(fundraiser.target),
      raised:number(fundraiser.raised),
      currency:'RUB'
    };
  }
  if(type==='article' || type==='news-item') {
    normalized.author=text(record.author);
    normalized.publishedAt=text(record.published_at??record.publishedAt);
    normalized.images=arr(record.images).map(i=>({src:safeAsset(i.src),alt:text(i.alt)})).filter(i=>i.src);
    normalized.references=arr(record.references);
  }
  if(type==='poster-item') {
    normalized.startsAt=text(record.starts_at??record.date);
    normalized.endsAt=text(record.ends_at);
    normalized.venue=text(record.venue);
    normalized.program=normalizeBlocks(record.program);
    normalized.registration=record.registration??null;
  }
  if(type==='book') {
    normalized.authors=arr(record.authors).map(text).filter(Boolean);
    normalized.cover=safeAsset(record.cover);
    normalized.files=arr(record.files).map(f=>({name:text(f.name),url:safeAsset(f.url)})).filter(f=>f.url);
    normalized.bibliography=text(record.bibliography);
  }
  if(type==='department') {
    normalized.region=text(record.region);
    normalized.address=text(record.address);
    normalized.contacts=arr(record.contacts);
    normalized.team=arr(record.team);
  }
  if(type==='profile') {
    normalized.photo=safeAsset(record.photo);
    normalized.roles=arr(record.roles).map(text).filter(Boolean);
    normalized.projects=arr(record.projects);
  }
  return normalized;
}

/**
 * Find matching template for a legacy Cosmatica URL. Unknown paths return null.
 * Never silently route an unrecognized project to "gagarincy", or to the About page.
 */
export function resolveLegacyRoute(value, manifest) {
  let url;
  try{ url=new URL(value, 'https://cosmatica.org/'); }catch{return null;}
  if(url.hostname!=='cosmatica.org')return null;
  const path=url.pathname.replace(/\/+$/,'')||'/';
  const items=Array.isArray(manifest?.entries)?manifest.entries:[];
  if(path==='/search') {
    const key=url.searchParams.get('q');
    return items.find(x=>x.slug===(key?'search-results':'search'))||null;
  }
  const exact=items.find(item=>{
    try{
      const u=new URL(item.sourceUrl);
      return (u.pathname.replace(/\/+$/,'')||'/')===path;
    }catch{return false;}
  });
  return exact||null;
}

export function validateNormalizedPage(page) {
  const errors=[];
  if(!page || !text(page.type)) errors.push('missing page type');
  if(!page || !text(page.title)) errors.push('missing page title');
  if(page?.type==='article' && !page.blocks?.length) errors.push('article has no content blocks');
  if(page?.type==='project' && !text(page.mission)) errors.push('project mission missing');
  if(page?.type==='project' && page.fundraising?.mode==='active' && !(page.fundraising.target>0)) errors.push('active fundraiser needs a positive target');
  if(page?.type==='poster-item' && !text(page.startsAt)) errors.push('event startsAt missing');
  return errors;
}
