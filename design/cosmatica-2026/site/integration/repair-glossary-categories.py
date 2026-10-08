#!/usr/bin/env python3
"""Build complete clickable alphabetical glossary categories from public entries."""
from pathlib import Path
from collections import defaultdict
import json,re,hashlib
from urllib.parse import urljoin
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parent.parent
LINKED=ROOT/'data/linked'
records=[]
for file in LINKED.glob('*.json'):
 try:row=json.loads(file.read_text())
 except Exception:continue
 records.append((file,row))
def norm(text):return ' '.join(str(text or '').split()).casefold()
by_letter=defaultdict(dict)
known_urls=set()
for _,row in records:
 if row.get('originalKind')!='glossary-item':continue
 if row.get('sourceUrl'):known_urls.add(row['sourceUrl'])
 title=row.get('title','').strip()
 match=re.search(r'[а-яёА-ЯЁa-zA-Z]',title)
 if not match:continue
 key=match.group(0).upper()
 by_letter[key][norm(title)]={'title':title,'url':row.get('sourceUrl'),'description':''}
stats={'categories':0,'linked':0,'unlinkedSourceTitles':0}
for file,row in records:
 if row.get('originalKind')!='glossary':continue
 letter=row.get('title','').strip().upper()
 if len(letter)!=1:continue
 known=by_letter.get(letter,{})
 seen=set();cards=[]
 source_links={}
 source=row.get('sourceUrl','')
 cache=ROOT/'data/archive/html-cache'/(hashlib.sha256(source.encode()).hexdigest()[:18]+'.html')
 if cache.exists():
  soup=BeautifulSoup(cache.read_bytes(),'html.parser')
  for a in soup.select('#controller_wrap a[href]'):
   target=urljoin(source,a['href'])
   if re.fullmatch(r'https://cosmatica.org/glossary/\d+-[^/]+\.html',target):
    source_links[norm(a.get_text(' ',strip=True))]=target
 prior=[b.get('text','') for b in row.get('blocks',[]) if b.get('type')=='heading']
 if not prior:prior=[c.get('title','') for c in row.get('cards',[])]
 for title in prior:
  title=title.strip()
  if not title or title.upper()==letter or title=='Полный текст исходного материала':continue
  key=norm(title)
  if key in seen:continue
  seen.add(key)
  card=known.get(key)
  if card:cards.append(card.copy());stats['linked']+=1
  else:
   target=source_links.get(key)
   if target in known_urls:
    cards.append({'title':title,'url':target,'description':''});stats['linked']+=1
   else:cards.append({'title':title,'description':''});stats['unlinkedSourceTitles']+=1
 for key,card in sorted(known.items()):
  if key not in seen:cards.append(card.copy());stats['linked']+=1
 blocks=row.get('blocks',[])
 clean=[];skip_next=False
 for i,block in enumerate(blocks):
  if block.get('type')=='heading' and block.get('text')=='Полный текст исходного материала':
   skip_next=True;continue
  if skip_next and block.get('type')=='paragraph':
   skip_next=False;continue
  skip_next=False
  if block.get('type')=='heading':continue
  clean.append(block)
 row['blocks']=clean
 row['cards']=cards
 row['glossaryCategoryLinked']=True
 row['textFallbackRequired']=False
 row['glossaryTermCount']=len(cards)
 temp=file.with_suffix('.json.tmp')
 temp.write_text(json.dumps(row,ensure_ascii=False,indent=2)+'\n')
 temp.replace(file)
 stats['categories']+=1
print('GLOSSARY_ALPHABET_REPAIRED',stats)
if stats['categories']!=24:raise SystemExit(2)
