#!/usr/bin/env python3
"""Audit the public archive's exact navigational and rendering contract; no network."""
from pathlib import Path
from urllib.parse import parse_qs, urlsplit
import json, re, collections, hashlib

ROOT=Path(__file__).resolve().parents[1]
load=lambda rel:json.loads((ROOT/rel).read_text(encoding='utf-8'))
sections=load('data/archive/sections.json')
index=load('data/linked-index.json')
search=load('data/archive/search-index.json')['records']
stats=collections.Counter()
problems=[]
samples=collections.defaultdict(list)
def problem(code,context):
    stats['issue_'+code]+=1
    if len(samples[code])<15: samples[code].append(context)

known_types=set(x['type'] for x in search)
all_cards=[]
seen_targets=collections.Counter()
unique_urls=collections.Counter()
for sec in sections:
    slug=sec['key']; total=0
    for page_no in range(1,sec['pages']+1):
        f=Path('data/archive/catalog')/slug/(str(page_no)+'.json')
        if not (ROOT/f).is_file():
            problem('missing_page',str(f));continue
        data=load(f)
        cards=data.get('cards',[])
        if data.get('archiveSection')!=slug or data.get('pageNumber')!=page_no or data.get('total')!=sec['count'] or data.get('pageCount')!=sec['pages']:
            problem('page_meta',str(f))
        if not isinstance(cards,list) or len(cards)>15:problem('invalid_page_size',(str(f),len(cards)));continue
        if not cards and sec['count']:problem('empty_page',str(f))
        total+=len(cards);stats['cards_in_sections']+=len(cards)
        for card in cards:
            url=card.get('url','')
            href=card.get('href','')
            if slug=='all':
                all_cards.append(card)
                unique_urls[url]+=1
            if not href:
                problem('missing_href',(slug,card.get('title'),url));continue
            parsed=urlsplit(href);params=parse_qs(parsed.query)
            sl=params.get('p',[''])[0]; rid=params.get('ref',[''])[0]
            if parsed.path!='view.html':
                problem('bad_href',(slug,href));continue
            if rid:
                filename=Path('data/linked')/(rid+'.json')
                if not (ROOT/filename).is_file():
                    problem('missing_record',(slug,href));continue
                rec=load(filename)
                if rec.get('slug')!=sl:
                    problem('slug_mismatch',(slug,href,rec.get('slug')))
                if not (rec.get('title') or rec.get('blocks') or rec.get('cards')):
                    problem('empty_record',(slug,href))
                if rec.get('sourceUrl') and url!=rec['sourceUrl']:
                    problem('source_mismatch',(slug,href,url,rec['sourceUrl']))
            else:
                fname=Path('data/source')/(sl+'.json')
                if not (ROOT/fname).exists() and sl not in ('login','restore','register','archive','search','search-results'):
                    problem('missing_source',(slug,href))
            seen_targets[href]+=1
    if total!=sec['count']:problem('category_count',(slug,total,sec['count']))
    stats['categories_checked']+=1
stats['all_cards']=len(all_cards)
stats['unique_all_urls']=len(unique_urls)
stats['search_records']=len(search)
stats['index_records']=len(index)
stats['distinct_link_targets']=len(seen_targets)
for card in all_cards:
    url=card.get('url','')
    if url not in index and url!='https://cosmatica.org/':
        problem('catalog_url_not_indexed',(url,card.get('href')))
for rec in search:
    if rec.get('route','').startswith('view.html?p='):
        route=rec['route']
        q=parse_qs(urlsplit(route).query)
        slug=q.get('p',[''])[0];id=q.get('ref',[''])[0]
        if id and not (ROOT/'data/linked'/f'{id}.json').exists():
            problem('search_broken_ref',route)
        elif id:
            item=load('data/linked/'+id+'.json')
            if item.get('slug')!=slug: problem('search_slug_mismatch',(route,item.get('slug')))
    else:
        problem('search_nonlocal',rec.get('route',''))
for url,num in unique_urls.items():
    if num>1:problem('duplicates_all_catalog',(url,num))
supported_blocks={'paragraph','image','list','heading','video','quote','separator','table','file'}
for record_file in list((ROOT/'data/linked').glob('*.json'))+list((ROOT/'data/source').glob('*.json')):
    item=json.loads(record_file.read_text(encoding='utf8'))
    stats['editorial_records_scanned']+=1
    for block in item.get('blocks',[]):
        kind=block.get('type')
        stats['editorial_blocks_scanned']+=1
        if kind not in supported_blocks:
            problem('unsupported_block',(record_file.name,kind))
        if kind=='image':
            stats['image_blocks_scanned']+=1
            src=block.get('src','')
            if src.startswith('assets/') and not (ROOT/src).is_file():
                problem('missing_block_image',(record_file.name,src))
            elif src and not (src.startswith('assets/') or src.startswith('https://')):
                problem('unsupported_image_source',(record_file.name,src[:110]))
        if kind=='video':stats['video_blocks_scanned']+=1
    for image in item.get('images',[]):
        stats['gallery_assets_scanned']+=1
        if isinstance(image,str) and image.startswith('assets/') and not (ROOT/image).is_file():
            problem('missing_gallery_image',(record_file.name,image))
stats['status']='PASS' if not any(k.startswith('issue_') for k in stats) else 'ISSUES'
print(json.dumps({'stats':stats,'examples':samples},ensure_ascii=False,indent=2))
