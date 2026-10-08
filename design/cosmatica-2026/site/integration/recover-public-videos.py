#!/usr/bin/env python3
"""Restore public YouTube embeds to already imported editorial JSON (no videos copied)."""
from pathlib import Path
from bs4 import BeautifulSoup
from collections import Counter
import runpy,json,hashlib
ROOT=Path(__file__).resolve().parent.parent
BASE=ROOT/'data'
helpers=runpy.run_path(str(Path(__file__).with_name('build-editorial-snapshot.py')))
added=Counter();pages=0;unreadable=[]
for folder in ('source','linked'):
 for file in (BASE/folder).glob('*.json'):
  try:doc=json.loads(file.read_text())
  except (ValueError,OSError) as e:unreadable.append((str(file),str(e)));continue
  url=doc.get('sourceUrl','')
  if not url.startswith('https://cosmatica.org/'):continue
  h=hashlib.sha256(url.encode()).hexdigest()[:18]
  html=BASE/'archive/html-cache'/(h+'.html')
  if not html.exists() or b'<iframe' not in html.read_bytes():continue
  raw=BeautifulSoup(html.read_bytes(),'html.parser')
  root=helpers['editorial_root'](raw)
  videos=helpers['video_blocks'](root,url)
  if not videos:continue
  existing={b.get('videoId') for b in doc.get('blocks',[]) if b.get('type')=='video'}
  fresh=[b for b in videos if b['videoId'] not in existing]
  if not fresh:continue
  doc.setdefault('blocks',[]).extend(fresh)
  doc['publicVideoCount']=sum(b.get('type')=='video' for b in doc['blocks'])
  temp=file.with_suffix('.json.tmp')
  temp.write_text(json.dumps(doc,ensure_ascii=False,indent=2))
  temp.replace(file)
  added[folder]+=len(fresh)
  pages+=1
print('RESTORED_PUBLIC_VIDEO_EMBEDS',dict(added),'PAGES',pages,'INVALID',len(unreadable))
for item in unreadable[:5]:print('UNREADABLE',item)
if unreadable:raise SystemExit(2)
