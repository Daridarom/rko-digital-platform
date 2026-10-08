#!/usr/bin/env python3
"""Resumable conservative copy of publicly visible RKO editorial content.

Reads data/archive/inventory.json, writes complete editorial JSON only on a
successful parse. No authentication, actions, comments, private URLs or
server-side technical diagnostics. Does not alter the original site.
"""
import argparse, concurrent.futures, hashlib, json, re, runpy, sys, threading, time
from collections import Counter
from pathlib import Path
from urllib.parse import urlparse
import requests
from bs4 import BeautifulSoup

HERE=Path(__file__).resolve().parent
SITE=HERE.parent
ARCHIVE=SITE/'data'/'archive'
DATA=SITE/'data'/'linked'
CACHE=ARCHIVE/'html-cache'
for d in (ARCHIVE,DATA,CACHE):d.mkdir(parents=True,exist_ok=True)
LOADER=runpy.run_path(str(HERE/'build-editorial-snapshot.py'))
B=LOADER['snapshot'].__globals__
normal=runpy.run_path(str(HERE/'discover-full-site.py'))['normal']
PROXIES={'http':'http://127.0.0.1:10809','https':'http://127.0.0.1:10809'}
UA={'User-Agent':'RKO-Authorized-Design-Migration/2026 (public archive, respectful rate limit)'}
LOCK=threading.Lock()
NEXT=[0.0]
THREAD=threading.local()
def capture_url(url,attempts=2):
 key=hashlib.sha256(url.encode()).hexdigest()[:18]
 path=CACHE/(key+'.html')
 if path.exists() and path.stat().st_size>150:
  result=requests.Response()
  result.status_code=200;result._content=path.read_bytes();result.url=url
  result.encoding='utf-8'
  THREAD.current=result
  return result
 last=None
 for n in range(attempts):
  with LOCK:
   wait=max(0,0.27-(time.monotonic()-NEXT[0]))
   if wait:time.sleep(wait)
   NEXT[0]=time.monotonic()
  try:
   session=getattr(THREAD,'session',None)
   if session is None:
    session=requests.Session()
    session.headers.update(UA)
    session.proxies.update(PROXIES)
    THREAD.session=session
   response=session.get(url,timeout=(6,14))
   response.raise_for_status()
   if not response.content or len(response.content)>14_000_000:
    raise ValueError('Empty/oversized public response')
   path.write_bytes(response.content)
   THREAD.current=response
   return response
  except Exception as exc:
   last=exc
   time.sleep(0.6+n)
 raise RuntimeError(str(last)[:180])
B['fetch']=capture_url

ROUTES={
 'news-item':'news-item','article':'article','book':'book',
 'poster-item':'poster-item','project':'project','profile':'profile',
 'partner':'partner','collegium-item':'collegium-item',
 'department':'department',
 'news':'news','library-category':'library','library':'library',
 'projects':'projects','users':'users',
 'articles-list':'articles-list','poster':'poster',
 'about-page':'article','newspaper-item':'article',
 'glossary-item':'article','section-item':'article',
 'glossary':'articles-list','newspaper':'articles-list',
 'section':'articles-list','collegium':'collegium',
 'partners':'partners','departments':'departments'
}
SKIP={'auth','search','home','direction','first-squad.html'}
TECH=B['TECH']
def textchars(blocks):
 return sum(len(b.get('text',''))+sum(map(len,b.get('items',[]))) for b in blocks)
def key(url):return hashlib.sha256(url.encode()).hexdigest()[:18]

def import_one(item,overwrite):
 url=item['url']
 kind=item['kind']
 route=ROUTES.get(kind,'article')
 if kind in SKIP:return ('skipped',url,'protected-or-site-static')
 destination=DATA/(key(url)+'.json')
 if destination.exists() and not overwrite:
  try:
   previous=json.loads(destination.read_text())
   if previous.get('sourceUrl')==url and isinstance(previous.get('blocks'),list):
    return ('existing',url,'')
  except (ValueError,OSError):pass
 try:
  parsed=B['snapshot'](url,route)
  response=getattr(THREAD,'current',None)
  if response is None:raise RuntimeError('HTTP response was not captured')
  soup=B['strip_technical'](BeautifulSoup(response.content,'html.parser'))
  root=B['editorial_root'](soup)
  content=root.select_one('.content_item') or root
  source_text=B['clean_text'](content)
  captured_length=textchars(parsed['blocks'])
  field_length=sum(len(f.get('value','')) for f in parsed.get('fields',[]))
  card_length=sum(len(c.get('description','')) for c in parsed.get('cards',[]))
  coverage=(captured_length+field_length+card_length)/max(1,len(source_text))
  # Preserve full public text even for legacy div-only CMS markup.
  # Use a visible fallback rather than falsely marking empty blocks as complete.
  if len(source_text)>100 and coverage<0.82:
   parsed['blocks'].append({'type':'heading','level':2,'text':'Полный текст исходного материала'})
   parsed['blocks'].append({'type':'paragraph','text':source_text,
      'spans':[{'text':source_text}]})
   parsed['textFallbackRequired']=True
  else:parsed['textFallbackRequired']=False
  parsed['originalKind']=kind
  parsed['sourceTextCharacters']=len(source_text)
  parsed['capturedBodyCharacters']=textchars(parsed['blocks'])
  parsed['sourceTextSHA256']=hashlib.sha256(source_text.encode()).hexdigest()
  parsed['archiveSnapshotAt']=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())
  parsed['editorialVerified']=False
  raw=json.dumps(parsed,ensure_ascii=False,indent=2)
  if TECH.search(raw):raise RuntimeError('Sensitive backend trace rejected')
  if len(source_text)>150 and len(parsed['blocks'])==0 and len(parsed['cards'])==0:
   raise RuntimeError('Text lost during extraction')
  temporary=destination.with_suffix('.json.tmp')
  temporary.write_text(raw,encoding='utf-8')
  temporary.replace(destination)
  return ('ready',url,str(len(source_text))+(' fallback' if parsed['textFallbackRequired'] else ''))
 except Exception as e:
  return ('failed',url,type(e).__name__+': '+str(e)[:145])
def run(args):
 inventory=json.loads((ARCHIVE/'inventory.json').read_text())
 rows=inventory['records']
 if args.kind:
  rows=[x for x in rows if x['kind'] in args.kind]
 if args.limit:rows=rows[:args.limit]
 stats=Counter();failures=[]
 with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
  futures={pool.submit(import_one,item,args.overwrite):item for item in rows}
  for n,future in enumerate(concurrent.futures.as_completed(futures),1):
   status,url,extra=future.result()
   stats[status]+=1
   if status=='failed':failures.append({'url':url,'error':extra})
   if n%25==0:
    print('IMPORTED',n,'/',len(rows),dict(stats),'errors',len(failures),flush=True)
 report={'startedFrom':len(rows),'results':dict(stats),
   'failures':failures,'timestamp':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())}
 (ARCHIVE/'import-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
 print('REPORT',json.dumps({k:v for k,v in report.items() if k!='failures'},ensure_ascii=False),flush=True)
 if failures:
  print('FAILED_SAMPLES',json.dumps(failures[:8],ensure_ascii=False),flush=True)
  return 2
 return 0
if __name__=='__main__':
 p=argparse.ArgumentParser()
 p.add_argument('--limit',type=int,default=0)
 p.add_argument('--kind',action='append')
 p.add_argument('--workers',type=int,choices=[1,2,3],default=2)
 p.add_argument('--overwrite',action='store_true')
 sys.exit(run(p.parse_args()))
