#!/usr/bin/env python3
"""Build static browsing/search routes only for captured public archive pages.
Book binaries are never copied. Source URL identity is preserved.
"""
from pathlib import Path
import json, hashlib, math, re
from collections import defaultdict,Counter
from urllib.parse import urlparse
from bs4 import BeautifulSoup

ROOT=Path(__file__).resolve().parent.parent
DATA=ROOT/'data'
INV=json.loads((DATA/'archive/inventory.json').read_text())
LISTING={'news':135,'library':33,'articles/publikacii':20,'projects':24,'users/index/team':2}
SECTIONS={
 'all':('Весь публичный архив РКО',None),
 'news':('Новости',{'news-item'}),
 'library':('Библиотека',{'book','library-category'}),
 'articles':('Публикации и материалы',{'article','articles-list'}),
 'projects':('Проекты',{'project'}),
 'poster':('Мероприятия',{'poster-item'}),
 'users':('Участники РКО',{'profile'}),
 'glossary':('Глоссарий',{'glossary-item','glossary'}),
 'newspaper':('Газета РКО',{'newspaper-item'}),
 'departments':('Отделения',{'department'}),
 'partners':('Партнёры',{'partner'}),
 'collegium':('Советы',{'collegium-item'}),
 'about':('Об РКО',{'about-page'}),
 'section':('Секции',{'section-item'})
}
def normalize(s):
 if not s:return ''
 u=urlparse(s)
 if u.netloc.lower() not in ('cosmatica.org','www.cosmatica.org'):return ''
 return 'https://cosmatica.org'+(u.path.rstrip('/') or '/')
def slug(url):
 s=urlparse(url).path.strip('/').split('/')[-1]
 m=re.match(r'(\d+)[-\.]',s)
 return int(m.group(1)) if m else 0
def plain(s):
 return ' '.join(str(s or '').replace('\u200b','').split())
def first_image(d):
 for i in d.get('images',[]):
  if i and isinstance(i,str):return i
 for c in d.get('cards',[]):
  if c.get('image'):return c['image']
 return None
def summary(d):
 for b in d.get('blocks',[]):
  if b.get('type')=='paragraph' and len(plain(b.get('text','')))>45:
   return plain(b['text'])[:420]
 for f in d.get('fields',[]):
  if len(plain(f.get('value','')))>40:return plain(f['value'])[:420]
 return plain(d.get('intro',''))[:420]

map_old=json.loads((DATA/'linked-index.json').read_text())
for entry in json.loads((ROOT/'integration/page-map.json').read_text())['entries']:
 if entry['slug']=='search-results':continue
 url=normalize(entry['sourceUrl'])
 if url:map_old[url]={'url':url,'status':'ready','alias':True,'file':'source/'+entry['slug']+'.json','type':entry['slug']}

inventory={r['url']:r for r in INV['records']}
blocked={'not_found_404','forbidden_403','soft_missing_no_public_profile','network_error'}
for url in list(map_old):
 info=map_old[url]
 if url not in inventory or inventory[url].get('availability') in blocked or (not info.get('alias') and not (DATA/'linked'/info.get('file','')).exists()):
  del map_old[url]
good={}
for folder in ['linked','source']:
 for file in (DATA/folder).glob('*.json'):
  try:d=json.loads(file.read_text())
  except (OSError,ValueError):continue
  url=normalize(d.get('sourceUrl'))
  if not url or url not in inventory:continue
  if not d.get('title') or not isinstance(d.get('blocks'),list):continue
  # Use exact content type saved in source. No technical/auth/search routes.
  kind=inventory[url]['kind']
  if kind in ('auth','search') or url=='https://cosmatica.org/' or inventory[url].get('availability') in blocked:continue
  if folder=='linked':
   type_=d.get('slug','article')
   map_old[url]={'url':url,'file':file.name,'type':type_,'status':'ready'}
   ident=file.stem
   page_url=f'view.html?p={type_}&ref={ident}'
  else:
   type_=d.get('slug','article')
   map_old[url]={'url':url,'file':'source/'+file.name,'type':type_,'status':'ready','alias':True}
   page_url=f'view.html?p={type_}'
  good[url]={'title':plain(d['title']),'description':summary(d),'url':url,
             'image':first_image(d),'kind':kind,'href':page_url,
             'type':type_,'sourceCharacters':d.get('sourceTextCharacters',0),
             'verified':d.get('editorialVerified',False)}
# For a given catalog, preserve known original pagination order where available.
rank={}
for prefix,nmax in LISTING.items():
 ordered=[];seen=set()
 for n in range(1,nmax+1):
  url='https://cosmatica.org/'+prefix+('' if n==1 else '?page='+str(n))
  path=DATA/'archive/listing-cache'/(hashlib.sha256(url.encode()).hexdigest()[:18]+'.html')
  if not path.exists():continue
  soup=BeautifulSoup(path.read_bytes(),'html.parser')
  main=soup.select_one('#controller_wrap') or soup
  for a in main.select('a[href]'):
   uri=normalize(a['href'] if a['href'].startswith('http') else 'https://cosmatica.org'+a['href'])
   if uri not in good or uri in seen:continue
   if prefix=='news' and good[uri]['kind']!='news-item':continue
   if prefix=='library' and good[uri]['kind']!='book':continue
   if prefix=='articles/publikacii' and good[uri]['kind']!='article':continue
   if prefix=='projects' and good[uri]['kind']!='project':continue
   if prefix=='users/index/team' and good[uri]['kind']!='profile':continue
   ordered.append(uri);seen.add(uri)
 rank[prefix]={u:i for i,u in enumerate(ordered)}
def sortkey(section,item):
 group={'news':'news','library':'library','articles':'articles/publikacii',
        'projects':'projects','users':'users/index/team'}.get(section)
 url=item['url']
 if group and url in rank[group]:return (0,rank[group][url],url)
 return (1,-slug(url),url)
out=DATA/'archive/catalog'
out.mkdir(parents=True,exist_ok=True)
sitemap=[]
for section,(title,kinds) in SECTIONS.items():
 rows=[x for x in good.values() if kinds is None or x['kind'] in kinds]
 rows.sort(key=lambda d:sortkey(section,d))
 count=len(rows);pages=max(1,math.ceil(count/15))
 dest=out/section;dest.mkdir(exist_ok=True)
 for n in range(1,pages+1):
  sliced=rows[(n-1)*15:n*15]
  record={'schemaVersion':2,'slug':'archive','archiveSection':section,
          'title':title,'sourceUrl':'https://cosmatica.org/',
          'intro':'Публичный архив материалов Русского космического общества.',
          'pageNumber':n,'pageCount':pages,'total':count,
          'blocks':[],'cards':sliced,'fields':[],'images':[],'documents':[],
          'editorialVerified':False}
  (dest/(str(n)+'.json')).write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
 sitemap.append({'key':section,'title':title,'count':count,'pages':pages})
(DATA/'archive/sections.json').write_text(json.dumps(sitemap,ensure_ascii=False,indent=2))
(DATA/'linked-index.json').write_text(json.dumps(map_old,ensure_ascii=False,indent=2)+'\n')
# Compact full-text inverted index. Browser loads only shards needed for query.
# Every public word in body text, fields and cards is searchable, even past the excerpt.
import unicodedata
items=[]
for x in good.values():
 items.append({'type':x['type'],'title':x['title'],'route':x['href'],
               'summary':x['description'][:240],
               'text':(x['title']+' '+x['description'])[:650],
               'url':x['url'],'sections':[key for key,(label,kinds) in SECTIONS.items() if kinds is None or x['kind'] in kinds]})
items.sort(key=lambda x:(x['type'],x['title']))
shards=defaultdict(lambda:defaultdict(list))
for i,item in enumerate(items):
 url=item['url']
 info=map_old[url]
 path=(DATA/info['file']) if info.get('alias') else (DATA/'linked'/info['file'])
 record=json.loads(path.read_text())
 full=' '.join(
  [item['title'],item['summary']]+
  [b.get('text','')+' '+' '.join(b.get('items',[])) for b in record.get('blocks',[])]+
  [str(f.get('value','')) for f in record.get('fields',[])]+
  [c.get('title','')+' '+c.get('description','') for c in record.get('cards',[])])
 terms=set(re.findall(r'[^\W_]{3,}',unicodedata.normalize('NFKC',full).casefold(),re.U))
 for term in terms:
  if len(term)>80:continue
  shards[format(ord(term[0]),'x')][term].append(i)
 if (i+1)%500==0:print('INDEX_WORDS',i+1,'/',len(items),flush=True)
search_dir=DATA/'archive/search-shards'
search_dir.mkdir(parents=True,exist_ok=True)
for key,words in shards.items():
 (search_dir/(key+'.json')).write_text(json.dumps(words,ensure_ascii=False,separators=(',',':'))+chr(10))
for stale in search_dir.glob('*.json'):
 if stale.stem not in shards:stale.unlink()
(DATA/'archive/search-index.json').write_text(json.dumps(
 {'version':2,'sharded':True,'count':len(items),'records':items},ensure_ascii=False,indent=2))
print('INDEX_SHARDS',len(shards),flush=True)
gone=sum(x.get('availability')=='not_found_404' for x in inventory.values())
forbidden=sum(x.get('availability')=='forbidden_403' for x in inventory.values())
soft=sum(x.get('availability')=='soft_missing_no_public_profile' for x in inventory.values())
network=sum(x.get('availability')=='network_error' for x in inventory.values())
non_editorial=sum(x.get('availability') not in blocked and x.get('kind') in ('auth','search','home') for x in inventory.values())
eligible=len(inventory)-gone-forbidden-soft-network-non_editorial
report={'discovered':len(inventory),'origin404':gone,'origin403':forbidden,'softMissing':soft,'networkUnverified':network,'nonEditorial':non_editorial,
        'eligible':eligible,'renderable':len(good),
        'unresolved':max(0,eligible-len(good)),'sections':sitemap,
        'cautions':['Search uses local full-text shards; no external service.','Editorial verification is separate from import.'],
        'downloadStrategy':'No PDF/DOC/DOCX book copies; use original RKO file URLs.'}
(DATA/'archive/catalog-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('CATALOG',json.dumps({'discovered':report['discovered'],'renderable':report['renderable'],'origin404':gone,'unresolved':report['unresolved'],'sections':sitemap},ensure_ascii=False))
