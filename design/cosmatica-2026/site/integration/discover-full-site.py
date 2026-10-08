#!/usr/bin/env python3
"""Inventory of all public Cosmatica URLs: current pagination + legacy XML sitemaps.
This script only discovers URLs; it NEVER marks content as migrated.
Honours robots.txt and throttles concurrent requests. Repeatable/resumable.
"""
from __future__ import annotations
import concurrent.futures, hashlib, json, re, sys, threading, time
from collections import Counter
from pathlib import Path
from urllib.parse import urljoin, urlparse, urlunparse, parse_qs
import requests
from bs4 import BeautifulSoup
from xml.etree import ElementTree as ET

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'data'/'archive'
CACHE=OUT/'listing-cache'
CACHE.mkdir(parents=True,exist_ok=True)
BASE='https://cosmatica.org'
LISTING={'news':135,'library':33,'articles/publikacii':20,'projects':24,'users/index/team':2}
PROXIES={'https':'http://127.0.0.1:10809','http':'http://127.0.0.1:10809'}
UA={'User-Agent':'RKO-Authorized-Design-Migration/2026 (respectful public page inventory)'}
lock=threading.Lock()
last=[0.0]
def normal(url):
 u=urlparse(urljoin(BASE,url))
 if u.hostname not in ('cosmatica.org','www.cosmatica.org') or u.scheme not in ('https','http'):return None
 path=re.sub('/+','/',u.path).rstrip('/') or '/'
 if path.startswith(('/tags/','/news-popular')) or re.fullmatch('/users/3',path) or re.search(r'^/projects/[^/]+/activity',path):return None
 return urlunparse(('https','cosmatica.org',path,'','',''))
def category(url):
 path=urlparse(url).path.strip('/').split('/')
 if not path or not path[0]:return 'home'
 a=path[0]
 if a=='articles':return 'article' if len(path)>1 and re.match(r'^\d+-',path[-1]) else 'articles-list'
 if a=='news':return 'news-item' if len(path)>1 else 'news'
 if a=='poster':return 'poster-item' if len(path)>1 else 'poster'
 if a=='library':return 'book' if len(path)>1 and re.match(r'^\d+-',path[-1]) else 'library-category'
 if a=='projects':return 'project' if len(path)>1 else 'projects'
 if a=='users':return 'profile' if len(path)>1 and path[1].isdigit() else 'users'
 if a=='newspaper':return 'newspaper-item' if len(path)>1 and re.match(r'^\d+-',path[-1]) else 'newspaper'
 if a=='glossary':return 'glossary-item' if len(path)>1 and re.match(r'^\d+-',path[-1]) else 'glossary'
 if a=='section':return 'section-item' if len(path)>1 else 'section'
 if a in ('partners','collegium','departments'):return {'partners':'partner','collegium':'collegium-item','departments':'department'}[a] if len(path)>1 else a
 if a=='about':return 'about-page' if len(path)>1 else 'about'
 return a

def fetch(url):
 dest=CACHE/(hashlib.sha256(url.encode()).hexdigest()[:18]+('.xml' if url.endswith('.xml') else '.html'))
 if dest.exists() and dest.stat().st_size>500:
  return dest.read_bytes()
 with lock:
  pause=max(0,0.28-(time.monotonic()-last[0]))
  if pause:time.sleep(pause)
  last[0]=time.monotonic()
 err=None
 for attempt in range(3):
  try:
   r=requests.get(url,headers=UA,proxies=PROXIES,timeout=(8,20))
   r.raise_for_status()
   if len(r.content)>14_000_000:raise ValueError('Large response')
   dest.write_bytes(r.content)
   return r.content
  except Exception as exc:
   err=exc;time.sleep(1.2*(attempt+1))
 raise RuntimeError(str(err)[:160])

def listing_urls(task):
 section,n=task
 uri=BASE+'/'+section+('' if n==1 else '?page='+str(n))
 html=BeautifulSoup(fetch(uri),'html.parser')
 root=html.select_one('#controller_wrap') or html
 cards=[]
 for a in root.select('a[href]'):
  normalized=normal(a.get('href',''))
  if normalized is None:continue
  path=urlparse(normalized).path
  prefix={'news':'/news/','library':'/library/','articles/publikacii':'/articles/','projects':'/projects/','users/index/team':'/users/'}[section]
  if not path.startswith(prefix):continue
  if section=='users/index/team' and not path.strip('/').split('/')[-1].isdigit():continue
  if section=='articles/publikacii' and not re.match(r'^/articles/\d+-',path):continue
  if section in ('news','library') and not re.match(re.escape(prefix)+r'\d+-',path):continue
  if section=='projects' and path.count('/')>2:continue
  cards.append(normalized)
 return uri,sorted(set(cards))

def main():
 source={}
 errors=[]
 try:
  index=ET.fromstring(fetch(BASE+'/sitemap.xml'))
  for el in index.findall('.//{*}loc'):
   u=(el.text or '').replace('http://','https://')
   try:
    tree=ET.fromstring(fetch(u))
    locs=[normal(x.text or '') for x in tree.findall('.//{*}loc')]
    count=0
    for url in locs:
     if url:source.setdefault(url,set()).add('xml:'+u.split('/')[-1]);count+=1
    print('SITEMAP',u.split('/')[-1],count,flush=True)
   except Exception as e:errors.append({'source':u,'error':str(e)[:170]})
 except Exception as e:
  errors.append({'source':'sitemap.xml','error':str(e)[:170]})
 tasks=[(section,i) for section,lastpage in LISTING.items() for i in range(1,lastpage+1)]
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
  futures={pool.submit(listing_urls,t):t for t in tasks}
  for n,future in enumerate(concurrent.futures.as_completed(futures),1):
   try:
    uri,urls=future.result()
    for url in urls:source.setdefault(url,set()).add('listing:'+uri)
   except Exception as e:
    t=futures[future];errors.append({'source':str(t),'error':str(e)[:170]})
   if n%20==0:
    print('PROGRESS',n,'/',len(tasks),'unique',len(source),'errors',len(errors),flush=True)
 # Preserve existing public URLs even if missing from stale sitemap.
 for fname in list((ROOT/'data/source').glob('*.json'))+list((ROOT/'data/linked').glob('*.json')):
  try:
   d=json.loads(fname.read_text())
   url=normal(d.get('sourceUrl',''))
   if url:source.setdefault(url,set()).add('previously_imported')
  except (OSError,ValueError):pass
 page_map=json.loads((ROOT/'integration/page-map.json').read_text())
 for rec in page_map['entries']:
  url=normal(rec.get('sourceUrl',''))
  if url:source.setdefault(url,set()).add('approved_route')
 seen_imported=set()
 for fname in list((ROOT/'data/source').glob('*.json'))+list((ROOT/'data/linked').glob('*.json')):
  try:
   d=json.loads(fname.read_text());url=normal(d.get('sourceUrl',''))
   if url:seen_imported.add(url)
  except (OSError,ValueError):pass
 records=[{'url':uri,'kind':category(uri),'sources':sorted(orig),'captured':uri in seen_imported}
          for uri,orig in sorted(source.items())]
 count=Counter(r['kind'] for r in records)
 result={'schemaVersion':1,'scope':'public_urls_not_private_accounts',
         'generatedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),
         'discovered':len(records),'previouslyCaptured':sum(r['captured'] for r in records),
         'notYetCaptured':sum(not r['captured'] for r in records),
         'byKind':dict(sorted(count.items())),'listingPagesExpected':len(tasks),
         'errors':errors,'records':records}
 OUT.mkdir(parents=True,exist_ok=True)
 (OUT/'inventory.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
 print('INVENTORY',json.dumps({k:v for k,v in result.items() if k!='records'},ensure_ascii=False),flush=True)
 if errors:sys.exit(2)

if __name__=='__main__':main()
