import json,runpy
from pathlib import Path
site=Path(__file__).resolve().parent.parent
code=runpy.run_path(str(site/'integration/build-editorial-snapshot.py'))
p=site/'data/source/home.json'
old=json.loads(p.read_text())
fresh=code['snapshot']('https://cosmatica.org/','home')
widget_count=old.get('sourceEvidence',{}).get('homeWidgetBlocks',10)
core=old['blocks'][:-widget_count] if widget_count else old['blocks']
widgets=fresh['blocks'][len(core):]
assert len(widgets)>=6,'Homepage widget selection missing'
old['blocks']=core+widgets
old['sourceEvidence']=fresh['sourceEvidence']
old['sourceEvidence']['homeWidgetBlocks']=len(widgets)
old['sourceEvidence']['storedTextCharacters']=sum(len(b.get('text',''))+sum(map(len,b.get('items',[]))) for b in old['blocks'])
code['write_json'](p,old)
report_path=site/'integration/source-build-report.json'
report=json.loads(report_path.read_text())
for item in report['details']:
 if item['slug']=='home':item['blocks']=len(old['blocks'])
code['write_json'](report_path,report)
code['search_index']()
print('HOME',len(old['blocks']),len(widgets),'sourceText',old['sourceEvidence']['sourceTextCharacters'],'storedText',old['sourceEvidence']['storedTextCharacters'])
