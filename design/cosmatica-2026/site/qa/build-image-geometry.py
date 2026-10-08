#!/usr/bin/env python3
"""Build image dimensions and truthful, lossless-source responsive thumbnails."""
from pathlib import Path
from PIL import Image, ImageOps
import json, collections
root=Path(__file__).resolve().parents[1]
sources=root/'assets/source'
outdir=root/'assets/optimized'
outdir.mkdir(parents=True,exist_ok=True)
items={}
stats=collections.Counter()
for file in sorted(sources.rglob('*')):
 if not file.is_file() or file.suffix.lower() not in {'.webp','.jpg','.jpeg','.png','.gif'}:continue
 with Image.open(file) as im:
  w,h=im.size
  record={'w':w,'h':h}
  stats['assets']+=1
  if max(w,h)<128:stats['tiny']+=1
  elif max(w,h)<320:stats['small']+=1
  else:stats['larger']+=1
  if w>=700:
   target=420
   dest=outdir/(file.stem+'-w420.webp')
   if not dest.exists():
    photo=ImageOps.exif_transpose(im).convert('RGB')
    photo.thumbnail((target,10000),Image.Resampling.LANCZOS)
    photo.save(dest,'WEBP',quality=81,method=5)
   if dest.stat().st_size < file.stat().st_size:
    record['thumbnail']='assets/optimized/'+dest.name
    stats['thumbnails_used']+=1
    stats['thumbnail_bytes']+=dest.stat().st_size
    stats['original_bytes']+=file.stat().st_size
   else:
    dest.unlink(missing_ok=True)
  items[file.relative_to(root).as_posix()]=record
out=root/'data/image-geometry.json'
out.write_text(json.dumps({'version':1,'images':items},ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
print('IMAGE_GEOMETRY',len(items),dict(stats),'manifest_kb',round(out.stat().st_size/1024,1))
