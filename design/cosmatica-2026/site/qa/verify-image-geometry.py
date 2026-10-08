#!/usr/bin/env python3
"""Validate the actual local image geometry and derivative files."""
from pathlib import Path
from PIL import Image
import json, collections
root=Path(__file__).resolve().parents[1]
manifest=json.loads((root/'data/image-geometry.json').read_text(encoding='utf-8'))
assert manifest.get('version')==1
photos=manifest['images']
assert len(photos)>=400,len(photos)
stats=collections.Counter()
for ref,meta in photos.items():
 assert ref.startswith('assets/source/') and '..' not in ref,ref
 path=root/ref
 assert path.is_file(),ref
 with Image.open(path) as photo:
  assert tuple(photo.size)==(meta['w'],meta['h']),(ref,photo.size,meta)
 w,h=meta['w'],meta['h']
 if max(w,h)<128:stats['tiny']+=1
 elif max(w,h)<320:stats['small']+=1
 else:stats['medium_or_large']+=1
 if 'thumbnail' in meta:
  thumb=meta['thumbnail']
  assert thumb.startswith('assets/optimized/') and '..' not in thumb,thumb
  file=root/thumb
  assert file.is_file(),thumb
  with Image.open(file) as photo:
   assert photo.size[0]<=420,(thumb,photo.size)
   assert photo.size[0]<=w,(thumb,w)
  assert file.stat().st_size<path.stat().st_size,thumb
  stats['responsive']+=1
  stats['original_bytes']+=path.stat().st_size
  stats['responsive_bytes']+=file.stat().st_size
print('IMAGE_QUALITY_PASS',len(photos),dict(stats))
