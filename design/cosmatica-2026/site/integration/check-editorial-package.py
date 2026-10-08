#!/usr/bin/env python3
"""Fail CI on missing approved content, missing files, or exposed server diagnostics."""
import json,re,sys,runpy
from pathlib import Path
site=Path(__file__).resolve().parent.parent
data=site/'data'
manifest=json.loads((site/'integration/page-map.json').read_text(encoding='utf8'))
source=list((data/'source').glob('*.json'))
linked=list((data/'linked').glob('*.json'))
index=json.loads((data/'linked-index.json').read_text(encoding='utf8'))
issues=[]
if len(source)!=31:issues.append('Expected 31 approved source pages, found '+str(len(source)))
if len(linked)<150:issues.append('Too few linked content pages: '+str(len(linked)))
for r in manifest['entries']:
 if r['slug']!='search-results' and not (data/'source'/(r['slug']+'.json')).exists():
  issues.append('Missing '+r['slug'])
tech=re.compile(r'cmsDatabase\s+Object|cmsCore\s+Object|db_pass\b|db_host\b|session_save_path\b|document_root\b|PDOException|Stack trace:',re.I)
for path in source+linked:
 raw=path.read_text(encoding='utf8')
 if tech.search(raw):issues.append('Technical information leaked into '+path.name)
 rec=json.loads(raw)
 if not rec.get('title'):issues.append('Empty title '+path.name)
 if not isinstance(rec.get('blocks'),list) or not isinstance(rec.get('cards'),list):
  issues.append('Malformed body '+path.name)
 for uri in rec.get('images',[]):
  if isinstance(uri,str) and uri.startswith('assets/source/') and not (site/uri).exists():
   issues.append('Missing asset '+uri)
 for doc in rec.get('documents',[]):
  if doc.get('localUrl') and not (site/doc['localUrl']).exists():
   issues.append('Missing document '+str(doc['localUrl']))
for uri,rec in index.items():
 if rec.get('status')!='ready':continue
 file=data/rec['file'] if rec.get('alias') else data/'linked'/rec['file']
 if not file.is_file():issues.append('Missing linked page for '+uri)
def characters(name):
 p=json.loads((data/'source'/(name+'.json')).read_text())
 return sum(len(b.get('text',''))+sum(len(s) for s in b.get('items',[])) for b in p['blocks'])
for name,minimum in [('about',6500),('direction',6500),('article',44000),('project',20000),('poster-item',11000),('collegium-item',5000),('tabs',5000)]:
 if name in {f.stem for f in source} and characters(name)<minimum:
  issues.append('Shortened main content '+name)
report={'sourcePages':len(source),'linkedPages':len(linked),
 'linkedReady':sum(x.get('status')=='ready' for x in index.values()),
 'assets':len(list((site/'assets/source').glob('*'))),'errors':issues}
print(json.dumps(report,ensure_ascii=False))
if issues:sys.exit(1)
# Reuse the existing GitHub Actions command: no workflow permission required.
runpy.run_path(str(site/'qa/source-fidelity.py'))
