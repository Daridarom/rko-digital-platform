#!/usr/bin/env python3
"""Read-only export of approved public Cosmatica content to reviewable JSON blocks.

This tool does NOT post to production, download image binaries, use credentials,
or grant publishing rights. Export only content you are authorized to migrate.
Requires: pip install requests beautifulsoup4
"""
import argparse
import datetime as dt
import hashlib
import json
import re
import time
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup, Tag, NavigableString

HERE=Path(__file__).resolve().parent
MANIFEST=HERE/'page-map.json'
TAGS={'h2','h3','h4','p','blockquote','ul','ol','img','hr','table'}
SKIP={'script','style','noscript','nav','footer','form','button'}
REQUEST_HEADERS={'User-Agent':'Mozilla/5.0 (compatible; CosmaticaMigrationAudit/1.0)'}

def string(node):
    return ' '.join(node.get_text(' ',strip=True).split())

def choose_body(soup):
    # Actual Cosmatica content usually lives in article.article.
    article=soup.select_one('article.article')
    if article: return article
    for selector in ('main article','main','#content','.main-content','.content_item'):
        found=soup.select_one(selector)
        if found:return found
    return soup.body or soup

def inline_spans(node,url):
    """Keep order and emphasis of inline text; never store executable HTML."""
    spans=[]
    mark_tags={'b':'bold','strong':'bold','i':'italic','em':'italic',
               'u':'underline','code':'code','sup':'sup','sub':'sub'}
    def visit(part,marks=(),href=None):
        if isinstance(part,NavigableString):
            val=str(part)
            if not val:return
            candidate={'text':val}
            if marks:candidate['marks']=list(marks)
            if href:candidate['href']=href
            if spans and all(spans[-1].get(k)==candidate.get(k) for k in ('marks','href')):
                spans[-1]['text']+=val
            else:spans.append(candidate)
            return
        if not isinstance(part,Tag) or part.name in ('script','style','noscript'):return
        nextmarks=marks
        if part.name in mark_tags:
            nextmarks=tuple(dict.fromkeys((*marks,mark_tags[part.name])))
        nextlink=href
        if part.name=='a' and part.get('href'):
            target=urljoin(url,part['href'])
            if target.startswith('https://'):nextlink=target
        for child in part.children:visit(child,nextmarks,nextlink)
    for child in node.children:visit(child)
    return spans

def block(node,url):
    name=node.name
    if name=='hr':return {'type':'separator'}
    if name in ('h2','h3','h4'):
        val=string(node)
        return {'type':'heading','level':int(name[1]),'text':val} if val else None
    if name in ('p','blockquote'):
        val=string(node)
        if not val:return None
        links=[]
        for a in node.find_all('a',href=True):
            href=a.get('href')
            if href and not href.startswith('javascript:'):
                links.append({'text':string(a),'url':urljoin(url,href)})
        out={'type':'quote' if name=='blockquote' else 'paragraph','text':val}
        if links:out['links']=links
        spans=inline_spans(node,url)
        if spans:out['spans']=spans
        return out
    if name in ('ul','ol'):
        items=[string(li) for li in node.find_all('li',recursive=False) if string(li)]
        return {'type':'list','ordered':name=='ol','items':items} if items else None
    if name=='img':
        src=node.get('src') or node.get('data-src') or node.get('data-original')
        if not src:return None
        return {'type':'image','src':urljoin(url,src),'alt':node.get('alt',''),'caption':''}
    if name=='table':
        rows=[]
        for tr in node.find_all('tr'):
            vals=[string(c) for c in tr.find_all(['th','td'],recursive=False)]
            if vals:rows.append(vals)
        return {'type':'table','rows':rows} if rows else None
    return None

def extract(root,url):
    for tag in root.select('script,style,noscript,nav,footer,form,button'):
        tag.decompose()
    blocks=[]
    # Preserve DOM order, and skip nested paragraphs in blockquotes and lists.
    for node in root.descendants:
        if not isinstance(node,Tag) or node.name not in TAGS:continue
        # An image can be nested in a paragraph and still requires its own media block.
        if node.name != 'img' and node.find_parent(list(TAGS)) is not None:continue
        b=block(node,url)
        if b:blocks.append(b)
    return blocks

def run_one(item,timeout=20):
    r=requests.get(item['sourceUrl'],headers=REQUEST_HEADERS,timeout=timeout)
    r.raise_for_status()
    # Keep source diagnostics and database configuration out of editorial exports.
    raw=r.text
    raw=re.sub(r'<pre\\b[^>]*>[\\s\\S]*?(?:cmsDatabase Object|cmsCore Object|db_pass|db_host)[\\s\\S]*?</pre>', '', raw, flags=re.I)
    soup=BeautifulSoup(raw,'html.parser')
    page_title=string(soup.find('h1')) or item['title']
    root=choose_body(soup)
    blocks=extract(root,r.url)
    normalized=json.dumps(blocks,ensure_ascii=False,sort_keys=True)
    return {
        'schemaVersion':1,
        'slug':item['slug'],'sourceUrl':r.url,'sourceId':item['id'],
        'title':page_title,'type':item['slug'],
        'blocks':blocks,
        'sourceHash':hashlib.sha256(normalized.encode('utf8')).hexdigest(),
        'sourceFetchedAt':dt.datetime.now(dt.timezone.utc).isoformat(),
        'editorialReviewed':False,
        'rightsVerified':False,
        'readyForPublication':False,
        'audit':{
            'blockCount':len(blocks),
            'textCharacters':sum(len(b.get('text',''))+sum(map(len,b.get('items',[]))) for b in blocks),
            'sourceHttp':r.status_code,
            'imageRefs':sum(b['type']=='image' for b in blocks),
        }
    }

def main():
    parser=argparse.ArgumentParser(description='Extract public Cosmatica page content for editorial review')
    parser.add_argument('--slug',help='One slug from page-map.json')
    parser.add_argument('--all',action='store_true',help='Export all source page types')
    parser.add_argument('--out',type=Path,help='Local target directory. No files without this flag.')
    args=parser.parse_args()
    if args.all==bool(args.slug):parser.error('Choose exactly one of --slug or --all')
    manifest=json.loads(MANIFEST.read_text(encoding='utf8'))
    selected=[x for x in manifest['entries'] if (args.all or x['slug']==args.slug) and x['slug']!='search-results']
    if not selected:parser.error('Slug not found')
    if args.out:args.out.mkdir(parents=True,exist_ok=True)
    for n,item in enumerate(selected):
        if n:time.sleep(.6)
        try:
            result=run_one(item)
            if args.out:
                target=args.out/(item['slug']+'.json')
                target.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
            print(item['slug'],result['audit'],'saved' if args.out else 'dry-run: no file written')
        except (requests.RequestException,ValueError) as exc:
            print(item['slug'],'ERROR',type(exc).__name__,str(exc)[:100])
            if not args.all:raise

if __name__=='__main__':main()
