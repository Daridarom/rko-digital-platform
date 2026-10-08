#!/usr/bin/env python3
"""Cache ONLY public book-cover images, never PDFs or documents.
Lightweight WebP previews keep the static redesign fast and independent of
external image latency. The canonical book download URL is never modified.
"""
from pathlib import Path
from urllib.parse import urlparse
from io import BytesIO
from concurrent.futures import ThreadPoolExecutor,as_completed
from collections import Counter
from PIL import Image, ImageOps, UnidentifiedImageError
import requests, hashlib, json, time, threading, re, os
ROOT=Path(__file__).resolve().parent.parent
DATA=ROOT/'data/linked'
DEST=ROOT/'assets/source/book-covers'
DEST.mkdir(parents=True,exist_ok=True)
PROXIES={'http':'http://127.0.0.1:10809','https':'http://127.0.0.1:10809'}
HEAD={'User-Agent':'RKO-Public-Design-Preview/2026 (cover images only)'}
Image.MAX_IMAGE_PIXELS=20_000_000
books=[]
for path in DATA.glob('*.json'):
 try:doc=json.loads(path.read_text())
 except (ValueError,OSError):continue
 if doc.get('slug')!='book':continue
 src=next((url for url in doc.get('images',[]) if url.startswith('https://cosmatica.org/upload/')),None)
 if src:books.append((path,src))
def work(item):
 path,url=item
 parsed=urlparse(url)
 if parsed.scheme!='https' or parsed.hostname!='cosmatica.org' or not parsed.path.startswith('/upload/'):
  return path,url,None,'outside approved public image archive'
 digest=hashlib.sha256(url.encode()).hexdigest()[:22]
 target=DEST/(digest+'.webp')
 if target.exists() and target.stat().st_size>1000:
  return path,url,'assets/source/book-covers/'+target.name,None
 err=None
 for attempt in range(2):
  try:
   response=requests.get(url,proxies=PROXIES,headers=HEAD,timeout=(7,18),stream=True)
   response.raise_for_status()
   content_type=response.headers.get('Content-Type','').split(';')[0].lower()
   if content_type not in ('image/jpeg','image/png','image/webp','image/gif','image/bmp'):
    raise ValueError('Not an image: '+content_type)
   buffer=bytearray()
   for chunk in response.iter_content(32768):
    buffer.extend(chunk)
    if len(buffer)>8_000_000:raise ValueError('Cover file too large')
   img=Image.open(BytesIO(buffer))
   if img.width<20 or img.height<20:raise ValueError('Empty preview')
   img=ImageOps.exif_transpose(img)
   img.thumbnail((560,790),Image.Resampling.LANCZOS)
   if img.mode!='RGB':img=img.convert('RGB')
   tmp=target.with_suffix('.webp.tmp')
   img.save(tmp,format='WEBP',quality=82,method=5)
   tmp.replace(target)
   return path,url,'assets/source/book-covers/'+target.name,None
  except Exception as ex:
   err=str(ex)[:140];time.sleep(.4*(attempt+1))
 return path,url,None,err
success={};failed=[]
with ThreadPoolExecutor(max_workers=3) as executor:
 futures=[executor.submit(work,item) for item in books]
 for n,future in enumerate(as_completed(futures),1):
  path,url,local,error=future.result()
  if error:failed.append({'url':url,'error':error})
  else:success[url]=local
  if n%50==0:print('COVERS',n,'/',len(books),'ok',len(success),'failed',len(failed),flush=True)
# Only commit successful conversions after the complete download pass.
updated=0
for path,src in books:
 local=success.get(src)
 if not local:continue
 record=json.loads(path.read_text())
 record['images']=[local if x==src else x for x in record['images']]
 for block in record.get('blocks',[]):
  if block.get('type')=='image' and block.get('src')==src:block['src']=local
 for card in record.get('cards',[]):
  if card.get('image')==src:card['image']=local
 path.write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
 updated+=1
report={'total':len(books),'optimized':updated,'failed':failed,
        'missingOriginalCovers':sum(1 for p in DATA.glob('*.json') if (lambda d:d.get('slug')=='book' and not d.get('images'))(json.loads(p.read_text())))}
(ROOT/'data/archive/book-cover-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('BOOK_COVERS_RESULT',json.dumps({k:v for k,v in report.items() if k!='failed'},ensure_ascii=False),'failures',len(failed),flush=True)
for item in failed[:15]:print('FAILED_COVER',item,flush=True)
