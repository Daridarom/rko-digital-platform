#!/usr/bin/env python3
"""Reproducible public editorial snapshot for the approved 32 Cosmatica views.

For authorized content migration only. Reads public pages, strips technical
diagnostics, and writes typed JSON and local media. Does not publish to source
CMS or collect credentials. Does not assert editorial sign-off.
"""
import concurrent.futures
import hashlib
import io
import json
import re
import sys
import time
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup, NavigableString, Tag
from PIL import Image

SITE=Path(__file__).resolve().parent.parent
HERE=Path(__file__).resolve().parent
DATA=SITE/'data'
ORIGINAL=DATA/'source'
LINKED=DATA/'linked'
ASSETS=SITE/'assets'/'source'
for root in (DATA,ORIGINAL,LINKED,ASSETS):root.mkdir(parents=True,exist_ok=True)
MANIFEST=json.loads((HERE/'page-map.json').read_text(encoding='utf8'))
TECH=re.compile(r'cmsDatabase\s+Object|cmsCore\s+Object|db_pass\b|db_host\b|session_save_path\b|document_root\b|PDOException|Stack trace:',re.I)
LIST={
 'news':'.news_list_item','poster':'.poster_list_item',
 'projects':'.groups-list .item','partners':'.partners_list_item',
 'departments':'.departments_list_item','users':'#users_profiles_list .item',
 'library':'.library_list tbody tr','collegium':'.collegium_list_item',
 'articles-list':'.articles_list_item','about-info':'#controller_wrap ul li',
 'articles':'#controller_wrap .content_categories li',
 'direction':'#controller_wrap .item','home':'#controller_wrap .item'
}
KINDS={'news':'news-item','poster':'poster-item','projects':'project',
 'users':'profile','library':'book','partners':'partner',
 'departments':'department','collegium':'collegium-item','articles':'article'}
UA={'User-Agent':'Mozilla/5.0 (compatible; RKO-ContentMigration/2026)'}

def clean_text(tag):
 return ' '.join(tag.get_text(' ',strip=True).split()) if tag else ''

def fetch(url,attempts=3,timeout=23):
 if urlparse(url).hostname!='cosmatica.org':
  raise ValueError('Only the approved source host can be fetched')
 last=None
 for n in range(attempts):
  try:
   response=requests.get(url,headers=UA,timeout=timeout)
   response.raise_for_status()
   if len(response.content)>13_000_000:raise ValueError('Large source page')
   return response
  except (requests.RequestException,ValueError) as exc:
   last=exc
   time.sleep(n+.8)
 raise last

def abs_url(value,base):
 if not isinstance(value,str) or not value or value.startswith(('javascript:','data:','mailto:','tel:','#')):
  return None
 try:
  uri=urljoin(base,value)
  return uri if uri.startswith('https://') else None
 except ValueError:return None

def strip_technical(soup):
 for tag in soup.select('script,style,noscript,iframe'):
  tag.decompose()
 for node in soup.select('pre,code,textarea'):
  if TECH.search(clean_text(node)):node.decompose()
 return soup

def editorial_root(soup):
 # The legacy CMS places About and Direction in widgets separate from
 # #controller_wrap. The wrapper has a heading but no editorial body.
 wrapper=soup.select_one('#controller_wrap')
 if wrapper and len(clean_text(wrapper))>=150:
  return wrapper
 special=(soup.select_one('.widget.article_rko .widget_html_block') or
          soup.select_one('.widget.direction-wrapper .direction-content'))
 if special:return special
 return (wrapper or soup.select_one('article.article') or soup.select_one('main')
  or soup.select_one('#content') or soup.select_one('.main-content')
  or soup.body or soup)

def image_of(node,url):
 if not node:return None
 img=node if node.name=='img' else node.select_one('img[src],img[data-src]')
 if img:
  return abs_url(img.get('src') or img.get('data-src'),url)
 match=re.search(r'url\(["\']?([^)"\']+)',node.get('style',''))
 return abs_url(match.group(1),url) if match else None

def rich_spans(node,url):
 spans=[]
 marks={'strong':'bold','b':'bold','i':'italic','em':'italic',
        'u':'underline','code':'code','sup':'sup','sub':'sub'}
 def walk(part,active=(),href=None):
  if isinstance(part,NavigableString):
   val=str(part)
   if not val:return
   item={'text':val}
   if active:item['marks']=list(active)
   if href:item['href']=href
   if spans and all(spans[-1].get(k)==item.get(k) for k in ('marks','href')):
    spans[-1]['text']+=val
   else:spans.append(item)
  elif isinstance(part,Tag) and part.name not in ('script','style'):
   m=tuple(dict.fromkeys(active+(marks[part.name],))) if part.name in marks else active
   nexturl=abs_url(part.get('href'),url) if part.name=='a' else href
   for child in part.children:walk(child,m,nexturl or href)
 for child in node.children:walk(child)
 return spans

def convert_block(node,url):
 name=node.name
 if name in ('h2','h3','h4'):
  return {'type':'heading','text':clean_text(node),'level':int(name[1])}
 if name in ('p','blockquote'):
  txt=clean_text(node)
  if not txt:return None
  links=[{'text':clean_text(a),'url':abs_url(a.get('href'),url)}
         for a in node.select('a[href]') if abs_url(a.get('href'),url)]
  result={'type':'quote' if name=='blockquote' else 'paragraph','text':txt,
          'spans':rich_spans(node,url)}
  if links:result['links']=links
  return result
 if name in ('ul','ol'):
  items=[clean_text(li) for li in node.find_all('li',recursive=False) if clean_text(li)]
  return {'type':'list','ordered':name=='ol','items':items} if items else None
 if name=='img':
  src=image_of(node,url)
  return {'type':'image','src':src,'alt':node.get('alt','')} if src else None
 if name=='table':
  rows=[[clean_text(c) for c in tr.find_all(['td','th'],recursive=False)]
        for tr in node.find_all('tr')]
  rows=[r for r in rows if r]
  return {'type':'table','rows':rows} if rows else None
 if name=='hr':return {'type':'separator'}
 return None

def blocks(root,url):
 clone=BeautifulSoup(str(root),'html.parser')
 for node in clone.select('script,style,noscript,nav,footer,form,button'):
  node.decompose()
 allowed={'h2','h3','h4','p','blockquote','ul','ol','img','table','hr'}
 output=[]
 for node in clone.descendants:
  if not isinstance(node,Tag) or node.name not in allowed:continue
  if node.name!='img' and node.find_parent(list(allowed)) is not None:continue
  converted=convert_block(node,url)
  if converted:output.append(converted)
 return output

def direction_blocks(root,url):
 # Preserve the nested council/department hierarchy and individual biographies.
 # The original CMS uses divs inside nested <li>, not article paragraphs.
 result=[]
 for person_group in root.select('li'):
  title=person_group.find('div',class_='direction-title',recursive=False)
  depth=len(person_group.find_parents('li'))
  if title and clean_text(title):
   result.append({'type':'heading','level':min(4,2+depth),'text':clean_text(title)})
  for entry in person_group.find_all('div',class_='direction-cont',recursive=False):
   name=entry.select_one('.direction-name')
   if name and clean_text(name):
    result.append({'type':'heading','level':4,'text':clean_text(name)})
   picture=entry.select_one('.direction-image img')
   if picture:
    uri=image_of(picture,url)
    if uri:result.append({'type':'image','src':uri,'alt':clean_text(name) if name else ''})
   desc=entry.select_one('.direction-description')
   if desc:
    parts=desc.find_all(['p','div'],recursive=False)
    if not parts:parts=[desc]
    for p in parts:
     value=clean_text(p)
     if value:result.append({'type':'paragraph','text':value,'spans':rich_spans(p,url)})
 return result

def cards(root,url,slug):
 selector=LIST.get(slug)
 if not selector:return []
 found=[];seen=set()
 for node in root.select(selector):
  value=clean_text(node)
  if len(value)<3:continue
  links=node.select('a[href]')
  main=next((a for a in links if a.get('href','').startswith('/') and '/index/' not in a.get('href','')),links[0] if links else None)
  href=abs_url(main['href'],url) if main else None
  title=clean_text(node.select_one('.field.f_title .value, .field.f_title, .title .value, .title, h2, h3, h4') or main)
  if not title:title=value[:125]
  key=(title,href)
  if key in seen:continue
  seen.add(key)
  found.append({'title':title,'description':value,'url':href,
   'image':image_of(node,url),
   'links':[{'title':clean_text(a)[:150],'url':abs_url(a.get('href'),url)}
            for a in links if clean_text(a) and abs_url(a.get('href'),url)][:12]})
 return found

def fields(root,url):
 seen=set();out=[]
 for el in root.select('.content_item .field, .group_profile_header .field, .controller_wrap .field'):
  key=clean_text(el.select_one('.title_left') or el.select_one('.title'))
  value=clean_text(el.select_one('.value') or el)
  if not value or (key,value) in seen:continue
  seen.add((key,value))
  out.append({'key':key,'value':value,
   'links':[{'title':clean_text(a),'url':abs_url(a.get('href'),url)}
     for a in el.select('a[href]') if abs_url(a.get('href'),url)],
   'image':image_of(el,url)})
 return out

def snapshot(url,kind):
 response=fetch(url)
 soup=strip_technical(BeautifulSoup(response.text,'html.parser'))
 root=editorial_root(soup)
 title=(clean_text(soup.select_one('#controller_wrap h1')) or
        clean_text(root.select_one('h1')) or clean_text(soup.select_one('title')) or kind)
 body=direction_blocks(root,response.url) if kind=='direction' else blocks(root,response.url)
 # The homepage stores its editorial sections in separate widgets, not
 # paragraphs inside the normal controller. Preserve their visible text.
 home_widgets=[]
 if kind=='home':
  home_widgets=[w for w in soup.select('#body .widget') if len(clean_text(w))>=100]
  for widget in home_widgets:
   text=clean_text(widget)
   heading=widget.select_one('.widget_header,.widget_title,h2,h3')
   label=clean_text(heading) if heading else text[:55]
   body.append({'type':'heading','level':2,'text':label})
   body.append({'type':'paragraph','text':text,'spans':[{'text':text}]})
 gallery=[]
 for element in root.select('img[src],.photo,[style*="background-image"]'):
  ref=image_of(element,response.url)
  if ref and ref not in gallery:gallery.append(ref)
 documents=[{'label':clean_text(a) or 'Документ','url':abs_url(a.get('href'),response.url)}
   for a in root.select('a[href]') if '/files/download/' in a.get('href','')]
 content={'schemaVersion':2,'slug':kind,'sourceUrl':response.url,'title':title,
   'intro':'','blocks':body,'cards':cards(root,response.url,kind),
   'fields':fields(root,response.url),'images':gallery,'documents':documents,
   'categories':[clean_text(i) for i in root.select('.content_datasets li, .content_categories li') if clean_text(i)],
   'editorialVerified':False}
 stored=sum(len(b.get('text',''))+sum(map(len,b.get('items',[]))) for b in body)
 content['sourceEvidence']={
   'http':response.status_code,'sourceTextCharacters':(sum(len(clean_text(w)) for w in home_widgets) if kind=='home' else len(clean_text(root))),
   'storedTextCharacters':stored,'sourceCardCount':len(content['cards']),
   'sourceImageCount':len(gallery),'paragraphCount':len(root.select('p')),
   'sourceBytes':len(response.content)}
 if TECH.search(json.dumps(content,ensure_ascii=False)):raise ValueError('Technical source data rejected')
 return content

def write_json(path,data):
 path.parent.mkdir(parents=True,exist_ok=True)
 path.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf8')

def key(url):return hashlib.sha256(url.encode()).hexdigest()[:18]

def produce_pages():
 source=MANIFEST['entries']
 output=[];source_urls={}
 for i,row in enumerate(source):
  if row['slug']=='search-results':continue
  slug=row['slug'];url=row['sourceUrl']
  try:
   data=snapshot(url,slug);write_json(ORIGINAL/(slug+'.json'),data)
   source_urls[url.split('?')[0]]=slug
   output.append({'slug':slug,'status':'ready','blocks':len(data['blocks']),'cards':len(data['cards'])})
   print('SOURCE',slug,len(data['blocks']),len(data['cards']),flush=True)
  except Exception as exc:
   output.append({'slug':slug,'status':'failed','reason':type(exc).__name__})
   print('FAILED',slug,type(exc).__name__,flush=True)
  if i%5==0:time.sleep(.5)
 if len([x for x in output if x['status']=='ready'])!=31:
  raise RuntimeError('Not all approved source templates were captured')
 write_json(HERE/'source-build-report.json',{'sourceCount':31,'completed':31,'details':output})
 return source_urls

def produce_links(source_urls):
 targets={}
 for file in ORIGINAL.glob('*.json'):
  data=json.loads(file.read_text())
  for card in data.get('cards',[]):
   uri=card.get('url')
   if uri and urlparse(uri).hostname=='cosmatica.org':
    targets.setdefault(uri,card.get('slug') or data['slug'])
 index={}
 for uri,kind in targets.items():
  alias=source_urls.get(uri.split('?')[0])
  if alias:index[uri]={'url':uri,'file':'source/'+alias+'.json','type':alias,'status':'ready','alias':True}
 def task(item):
  uri,parent=item
  route=urlparse(uri).path.strip('/').split('/')[0] or parent
  slug=KINDS.get(route,parent)
  if urlparse(uri).path.split('/')[-1] in {'publikacii','konferencii','media','gazeta'}:slug='articles-list'
  try:
   data=snapshot(uri,slug)
   filename=key(uri)+'.json'
   write_json(LINKED/filename,data)
   return uri,{'url':uri,'file':filename,'type':slug,'status':'ready'}
  except Exception as exc:
   return uri,{'url':uri,'type':slug,'status':'failed','reason':type(exc).__name__}
 remaining=[(u,p) for u,p in targets.items() if u not in index]
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
  for n,(url,details) in enumerate(pool.map(task,remaining),1):
   index[url]=details
   if n%20==0:print('LINKED',n,'/',len(remaining),flush=True)
 write_json(DATA/'linked-index.json',index)
 ok=sum(r['status']=='ready' for r in index.values())
 write_json(HERE/'linked-build-report.json',{'links':len(index),'fetched':ok,
   'files':len(list(LINKED.glob('*.json'))),
   'errors':[{'url':u,'reason':x.get('reason','')} for u,x in index.items() if x['status']!='ready']})
 print('LINKS',ok,'/',len(index),flush=True)
 return index

def local_asset(url):
 if not isinstance(url,str) or urlparse(url).hostname!='cosmatica.org':return None
 name=hashlib.sha256(url.encode()).hexdigest()[:24]+'.webp'
 target=ASSETS/name
 if target.exists():return 'assets/source/'+name
 try:
  r=fetch(url,attempts=2,timeout=17)
  if len(r.content)>12_000_000:return None
  img=Image.open(io.BytesIO(r.content));img.load()
  img.thumbnail((1600,1600),Image.Resampling.LANCZOS)
  if img.mode not in ('RGB','RGBA'):img=img.convert('RGB')
  img.save(target,'WEBP',quality=87,method=4)
  return 'assets/source/'+name
 except Exception:return None

def media():
 files=list(ORIGINAL.glob('*.json'))+list(LINKED.glob('*.json'))
 photos=set();docs=set()
 for file in files:
  page=json.loads(file.read_text())
  photos.update(p for p in page.get('images',[]) if p)
  for c in page.get('cards',[]):
   if c.get('image'):photos.add(c['image'])
  for b in page.get('blocks',[]):
   if b.get('type')=='image' and b.get('src'):photos.add(b['src'])
  docs.update(d.get('url') for d in page.get('documents',[]) if d.get('url'))
 mapping={}
 with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
  futures={pool.submit(local_asset,url):url for url in photos}
  for n,f in enumerate(concurrent.futures.as_completed(futures),1):
   uri=futures[f];local=f.result()
   if local:mapping[uri]=local
   if n%50==0:print('IMAGES',n,'/',len(photos),flush=True)
 downloaded={}
 for uri in sorted(docs):
  try:
   r=fetch(uri,attempts=1,timeout=12)
   if len(r.content)>15_000_000:continue
   sample=r.content[:20]
   ext='.pdf' if sample.startswith(b'%PDF') else '.docx' if sample.startswith(b'PK') else None
   if not ext:continue
   file=ASSETS/(hashlib.sha256(uri.encode()).hexdigest()[:24]+ext)
   file.write_bytes(r.content)
   downloaded[uri]='assets/source/'+file.name
  except Exception:continue
 def convert(value):
  if isinstance(value,dict):return {k:convert(v) for k,v in value.items()}
  if isinstance(value,list):return [convert(v) for v in value]
  if isinstance(value,str):return mapping.get(value,value)
  return value
 for file in files:
  content=convert(json.loads(file.read_text()))
  for doc in content.get('documents',[]):
   if doc.get('url') in downloaded:doc['localUrl']=downloaded[doc['url']]
  write_json(file,content)
 write_json(HERE/'asset-build-report.json',{'pages':len(files),'referencedImages':len(photos),
   'downloadedImages':len(mapping),'missingImages':sorted(photos-set(mapping)),
   'referencedDocuments':len(docs),'downloadedDocuments':len(downloaded)})
 print('ASSETS',len(mapping),'images and',len(downloaded),'documents',flush=True)

def search_index():
 records=[];seen=set()
 for file in sorted(list(ORIGINAL.glob('*.json'))+list(LINKED.glob('*.json'))):
  page=json.loads(file.read_text())
  if page['slug'] in {'login','register','restore','donate','search'}:continue
  if page['sourceUrl'] in seen:continue
  seen.add(page['sourceUrl'])
  route=('index.html' if file.parent==ORIGINAL and page['slug']=='home' else
         'view.html?p='+page['slug'] if file.parent==ORIGINAL else
         'view.html?p='+page['slug']+'&ref='+file.stem)
  text=[]
  for b in page.get('blocks',[]):
   if b.get('text'):text.append(b['text'])
   text.extend(b.get('items',[]))
  for c in page.get('cards',[]):text.extend([c.get('title',''),c.get('description','')])
  for f in page.get('fields',[]):text.append(f.get('value',''))
  full=' '.join(x for x in text if x)
  full=re.sub(r'\s+',' ',full)
  records.append({'type':page['slug'],'title':page['title'],'route':route,
                  'summary':full[:240],'text':full})
 write_json(DATA/'search-index.json',{'schemaVersion':1,'count':len(records),'records':records})
 print('SEARCH',len(records),flush=True)

def repair_omitted():
 """Rebuild mislocated public widgets without refreshing unrelated records."""
 revised=[]
 for slug in ('about','direction'):
  page=snapshot('https://cosmatica.org/'+slug,slug)
  assert len(page['blocks'])>=20 and page['sourceEvidence']['storedTextCharacters']>=5000,slug+' unexpectedly truncated'
  urls={b.get('src') for b in page['blocks'] if b.get('type')=='image'}
  urls.update(page.get('images',[]))
  mapping={uri:local_asset(uri) for uri in sorted(urls) if uri}
  absent=[uri for uri,local in mapping.items() if not local]
  if absent:
   # Preserve people's names and biographies even when the legacy image URL is broken.
   print('UNAVAILABLE_ORIGINAL_IMAGES',slug,absent,flush=True)
   page['images']=[uri for uri in page['images'] if uri not in absent]
   page['blocks']=[b for b in page['blocks'] if b.get('type')!='image' or b.get('src') not in absent]
  def convert(item):
   if isinstance(item,dict):return {k:convert(v) for k,v in item.items()}
   if isinstance(item,list):return [convert(v) for v in item]
   if isinstance(item,str):return mapping.get(item) or item
   return item
  page=convert(page)
  write_json(ORIGINAL/(slug+'.json'),page)
  revised.append((slug,len(page['blocks']),len(page['images'])))
 report=json.loads((HERE/'source-build-report.json').read_text())
 for item in report['details']:
  if item['slug'] in {'about','direction'}:
   item['blocks']=len(json.loads((ORIGINAL/(item['slug']+'.json')).read_text())['blocks'])
 write_json(HERE/'source-build-report.json',report)
 assets=json.loads((HERE/'asset-build-report.json').read_text())
 assets['downloadedImages']=len(list(ASSETS.glob('*.webp')))
 assets['referencedImages']=assets['downloadedImages']+len(assets['missingImages'])
 write_json(HERE/'asset-build-report.json',assets)
 search_index()
 print('REPAIRED_WIDGET_PAGES',revised,flush=True)

def main():
 sources=produce_pages()
 produce_links(sources)
 media()
 search_index()
 pages=list(ORIGINAL.glob('*.json'))+list(LINKED.glob('*.json'))
 for file in pages:
  if TECH.search(file.read_text()):
   raise RuntimeError('Sensitive technical content found in '+file.name)
 print('COMPLETE',len(pages),'editorial records',flush=True)

if __name__=='__main__':
 repair_omitted() if '--repair-omitted' in __import__('sys').argv else main()
