#!/usr/bin/env python3
"""Verify legacy CMS listing-card destinations absent from sitemap and add only public ones."""
from pathlib import Path
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from bs4 import BeautifulSoup
from urllib.parse import urlparse
import requests,json,hashlib,runpy,time
ROOT=Path(__file__).resolve().parent.parent
ARCHIVE=ROOT/'data/archive'
INV=ARCHIVE/'inventory.json'
PROXIES={'https':'http://127.0.0.1:10809','http':'http://127.0.0.1:10809'}
headers={'User-Agent':'RKO-Authorized-Design-Migration/2026 (public listing link reconciliation)'}
manifest=json.loads(INV.read_text())
known={i['url']:i for i in manifest['records']}
discovery=runpy.run_path(str(Path(__file__).with_name('discover-full-site.py')))
kinds=discovery['category']
targets={}
for folder in ('source','linked'):
 for f in (ROOT/'data'/folder).glob('*.json'):
  try:record=json.loads(f.read_text())
  except (ValueError,OSError):continue
  for card in record.get('cards',[]):
   url=card.get('url','').split('#')[0]
   if url not in known and url.startswith('https://cosmatica.org/'):
    targets.setdefault(url,{'url':url,'kind':kinds(url),'sources':['public-listing-card'],'captured':False})
print('UNINDEXED_LISTING_DESTINATIONS',len(targets),flush=True)
def check(rec):
 url=rec['url'];key=hashlib.sha256(url.encode()).hexdigest()[:18]
 dest=ARCHIVE/'html-cache'/(key+'.html')
 for attempt in range(2):
  try:
   r=requests.get(url,proxies=PROXIES,headers=headers,timeout=(7,16))
   if r.status_code in (403,404):
    rec['availability']='forbidden_403' if r.status_code==403 else 'not_found_404'
    return rec
   r.raise_for_status()
   s=BeautifulSoup(r.content,'html.parser')
   if r.url.rstrip('/')!=url.rstrip('/') or not s.select_one('#controller_wrap'):
    rec['availability']='soft_missing_no_public_profile'
   else:
    rec['availability']='available'
    dest.write_bytes(r.content)
   return rec
  except Exception as e:
   if attempt:rec['availability']='network_error';rec['error']=str(e)[:170]
   time.sleep(.5)
 return rec
with ThreadPoolExecutor(max_workers=3) as pool:
 results=list(pool.map(check,targets.values()))
for r in results:known[r['url']]=r
manifest['records']=sorted(known.values(),key=lambda i:i['url'])
manifest['discovered']=len(known)
manifest['byKind']=dict(sorted(Counter(x['kind'] for x in known.values()).items()))
manifest['listingLinkSupplement']={'checked':len(results),'statuses':dict(Counter(x.get('availability') for x in results))}
INV.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('LISTING_LINK_RESULT',manifest['listingLinkSupplement'],'INVENTORY',manifest['discovered'],flush=True)
for rec in results:
 if rec.get('availability')=='network_error':print('NETWORK_ERROR',rec['url'],rec.get('error'))
if any(x.get('availability')=='network_error' for x in results):raise SystemExit(2)
