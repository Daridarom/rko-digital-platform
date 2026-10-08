#!/usr/bin/env python3
"""Offline audit of every published archive route and its editorial payload."""
from collections import Counter, defaultdict
from pathlib import Path
from urllib.parse import urlparse
import json,re,sys
ROOT=Path(__file__).resolve().parent.parent
DATA=ROOT/'data'
issues=[]
def load(path):
 try:return json.loads(path.read_text())
 except Exception as e:
  issues.append(str(path)+' invalid JSON: '+str(e))
  return {}
inventory=load(DATA/'archive/inventory.json')
index=load(DATA/'linked-index.json')
sections=load(DATA/'archive/sections.json')
catalog_records=set()
catalog_count=0
for section in sections:
 ident=section['key']
 found=0
 for n in range(1,section['pages']+1):
  file=DATA/'archive/catalog'/ident/(str(n)+'.json')
  assert file.exists(),str(file)
  document=load(file)
  if document.get('pageNumber')!=n or document.get('pageCount')!=section['pages']:
   issues.append('Wrong pagination metadata '+str(file))
  rows=document.get('cards',[])
  if len(rows)>15:issues.append('Page size exceeded '+str(file))
  for card in rows:
   url=card.get('url');href=card.get('href','')
   if not url or not href.startswith('view.html?p='):
    issues.append('Missing public route '+str(file)+' '+str(url))
    continue
   if not href.startswith('view.html?p=archive') and not re.fullmatch(r'view\.html\?p=[a-z0-9-]+(?:&ref=[a-f0-9]{18})?',href):
    issues.append('Unexpected client target '+href)
   if url not in index or index[url].get('status')!='ready':
    issues.append('Catalog record not resolvable: '+str(url))
   if ident=='all':catalog_records.add(url)
  found+=len(rows);catalog_count+=len(rows)
 if found!=section['count']:
  issues.append('Missing section pages '+ident+' expected='+str(section['count'])+' got='+str(found))
 if found and section['pages']!=(found-1)//15+1:
  issues.append('Incorrect section page count '+ident)
books=0;links=0;videos=0
types=Counter()
checked=0
for url in catalog_records:
 info=index[url]
 file=(DATA/info['file']) if info.get('alias') else (DATA/'linked'/info['file'])
 if not file.exists():
  issues.append('Missing editor record '+str(file))
  continue
 data=load(file);checked+=1
 if not data.get('title') or not isinstance(data.get('blocks'),list):
  issues.append('Empty record '+str(file))
 types[data.get('slug')]+=1
 for block in data.get('blocks',[]):
  if block.get('type')=='video':
   videos+=1
   if block.get('platform')=='youtube':
    if not re.fullmatch(r'[A-Za-z0-9_-]{11}',block.get('videoId','')):
     issues.append('Invalid YouTube reference '+str(file))
   else:
    from urllib.parse import urlparse,parse_qs
    uri=urlparse(block.get('embedUrl',''))
    host=uri.hostname or ''
    path=uri.path
    valid=(uri.scheme=='https' and not uri.username and not uri.password and not uri.port)
    if host in ('cosmovid.ru','radovid.ru','bkvid.ru'):
     valid=valid and bool(re.fullmatch(r'/videos/embed/[a-f0-9-]{36}/?',path,re.I))
    elif host=='rutube.ru':
     valid=valid and bool(re.fullmatch(r'/play/embed/[A-Za-z0-9_-]{12,}/?',path))
    elif host in ('vkvideo.ru','vk.com','vk.ru'):
     query=parse_qs(uri.query)
     valid=valid and path=='/video_ext.php' and bool(re.fullmatch(r'-?\d+',query.get('oid',[''])[0])) and bool(re.fullmatch(r'\d+',query.get('id',[''])[0]))
    elif host=='video.nikatv.ru':
     valid=valid and bool(re.fullmatch(r'/video/[A-Za-z0-9_-]+/?',path))
    else:valid=False
    if not valid:issues.append('Unsafe or invalid embedded video '+str(file))
 if data.get('slug')=='book':
  books+=1
  for doc in data.get('documents',[]):
   uri=doc.get('url','')
   if not re.fullmatch(r'https://cosmatica\.org/files/download/\d+/[0-9a-f]+',uri):
    issues.append('Invalid book download '+str(file))
   if doc.get('localUrl'):
    issues.append('Duplicated book binary '+str(file))
   links+=1
 for photo in data.get('images',[]):
  if isinstance(photo,str) and photo.startswith('assets/source/') and not (ROOT/photo).exists():
   issues.append('Missing local illustration '+photo)
 if data.get('sourceTextCharacters',0)>350:
  text=sum(len(b.get('text',''))+sum(len(x) for x in b.get('items',[])) for b in data['blocks'])
  field=sum(len(f.get('value','')) for f in data.get('fields',[]))
  cardtext=sum(len(c.get('title',''))+len(c.get('description','')) for c in data.get('cards',[]))
  if text+field+cardtext < .8*data['sourceTextCharacters']:
   issues.append('Possible truncated text '+str(file))
print('ARCHIVE_INTEGRITY',json.dumps({'discovered':inventory.get('discovered'),'indexed':len(catalog_records),
 'recordsOpened':checked,'books':books,'originalBookLinks':links,'publicVideos':videos,'kinds':dict(types),
 'sectionRecords':catalog_count,'errors':len(issues)},ensure_ascii=False))
for line in issues[:30]:print('ERROR',line)
if issues:sys.exit(1)
