#!/usr/bin/env python3
"""Discover public glossary definitions missing from legacy XML sitemaps.
Visits only the public alphabetic glossary pagination, caches public HTML.
"""
from pathlib import Path
from urllib.parse import urljoin,urlparse,parse_qs
from collections import Counter
from concurrent.futures import ThreadPoolExecutor,as_completed
from bs4 import BeautifulSoup
import hashlib,json,re,requests,time

ROOT=Path(__file__).resolve().parent.parent
STORE=ROOT/'data/archive'
CACHE=STORE/'html-cache'
INVENTORY=STORE/'inventory.json'
PROXIES={'https':'http://127.0.0.1:10809','http':'http://127.0.0.1:10809'}
HEAD={'User-Agent':'RKO-Authorized-Design-Migration/2026 (public sitemap reconciliation)'}
def cached(url):
 return CACHE/(hashlib.sha256(url.encode()).hexdigest()[:18]+'.html')
def load(url):
 p=cached(url)
 if p.exists() and p.stat().st_size>200:return p.read_bytes()
 r=requests.get(url,proxies=PROXIES,headers=HEAD,timeout=(7,16))
 r.raise_for_status()
 if r.content:p.write_bytes(r.content)
 return r.content
def normalize(url):
 u=urlparse(urljoin('https://cosmatica.org/',url))
 return 'https://cosmatica.org'+u.path if u.hostname in ('cosmatica.org','www.cosmatica.org') else None
def matches(url):
 return bool(re.fullmatch(r'https://cosmatica.org/glossary/\d+-[^/]+\.html',url or ''))
def links(html,base,letter):
 root=BeautifulSoup(html,'html.parser').select_one('#controller_wrap')
 if not root:return set(),set()
 entries=set();pages=set()
 for a in root.select('a[href]'):
  full=urljoin(base,a.get('href',''))
  parsed=urlparse(full)
  clean=normalize(full)
  if matches(clean):entries.add(clean)
  if parsed.hostname in ('cosmatica.org','www.cosmatica.org') and parsed.path==f'/glossary/{letter}':
   page=parse_qs(parsed.query).get('page',['1'])[0]
   if page.isdecimal() and 1<int(page)<=6:pages.add(int(page))
 return entries,pages
inv=json.loads(INVENTORY.read_text())
known={r['url']:r for r in inv['records']}
letters=sorted({r['url'].rsplit('/',1)[-1] for r in inv['records']
                if r.get('kind')=='glossary' and re.fullmatch(r'https://cosmatica.org/glossary/[a-z]{1,3}',r['url'])})
all_urls=set();failures=[];page_counts=Counter()
for letter in letters:
 base=f'https://cosmatica.org/glossary/{letter}'
 try:entries,pages=links(load(base),base,letter)
 except Exception as ex:failures.append({'page':base,'error':str(ex)[:140]});continue
 all_urls.update(entries)
 seen={1};todo=sorted(pages)
 while todo:
  n=todo.pop(0)
  if n in seen:continue
  seen.add(n)
  url=base+'?page='+str(n)
  try:new,more=links(load(url),url,letter)
  except Exception as ex:failures.append({'page':url,'error':str(ex)[:140]});continue
  all_urls.update(new);page_counts[letter]+=1
  todo+=sorted(more-seen)
 print('LETTER',letter,'extra_pages',page_counts[letter],'total_entries',len(entries),flush=True)
new_urls=sorted(u for u in all_urls if u not in known or known[u].get('availability')=='network_error')
print('DISCOVERED_NEW_GLOSSARY',len(new_urls),'PAGINATED',dict(page_counts),'LISTING_ERRORS',len(failures),flush=True)
def check(url):
 for i in range(2):
  try:
   response=requests.get(url,proxies=PROXIES,headers=HEAD,timeout=(7,15))
   if response.status_code==404:return url,'not_found_404',None
   if response.status_code==403:return url,'forbidden_403',None
   response.raise_for_status()
   content=BeautifulSoup(response.content,'html.parser')
   if not content.select_one('#controller_wrap'):
    return url,'soft_missing_no_public_profile',None
   cached(url).write_bytes(response.content)
   return url,'available',len(response.content)
  except Exception as ex:
   if i:return url,'network_error',str(ex)[:140]
   time.sleep(.6)
results=Counter();errors=[]
with ThreadPoolExecutor(max_workers=3) as pool:
 for url,status,detail in pool.map(check,new_urls):
  results[status]+=1
  record={'url':url,'kind':'glossary-item','sources':['glossary-letter-pagination'],
          'captured':False}
  if status!='available':record['availability']=status
  known[url]=record
  if status=='network_error':errors.append({'url':url,'detail':detail})
inv['records']=sorted(known.values(),key=lambda x:x['url'])
inv['discovered']=len(known)
from collections import Counter as C
inv['byKind']=dict(sorted(C(x['kind'] for x in known.values()).items()))
inv['glossarySupplement']={'checked':len(new_urls),'result':dict(results),'pages':dict(page_counts),'errors':errors,'listingErrors':failures}
INVENTORY.write_text(json.dumps(inv,ensure_ascii=False,indent=2)+'\n')
print('NEW_GLOSSARY_RESULT',dict(results),'INVENTORY',inv['discovered'],'NETWORK_ERRORS',len(errors),flush=True)
if failures or errors:raise SystemExit(2)
