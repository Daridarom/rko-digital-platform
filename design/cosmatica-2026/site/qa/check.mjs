import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const dir=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(dir,'..');
const errors=[];
const assert=(ok,message)=>{if(!ok)errors.push(message);};
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const context={window:{}};
for(const name of ['routes.js','content.js']){
 try{vm.runInNewContext(read(name),context,{filename:name,timeout:2000});}
 catch(e){errors.push(name+': '+e.message);}
}
const routes=context.window.COSMATICA_ROUTES||[];
const data=context.window.COSMATICA_CONTENT||{};
assert(routes.length===32,'Expected exactly 32 interface states');
assert(Object.keys(data).length>=31,'Expected data for each interface');
assert(new Set(routes.map(r=>r.slug)).size===32,'Duplicate interface slugs');
routes.forEach((r,i)=>{
 assert(r.id===i+1,'Unexpected order/id at '+r.slug);
 assert(Boolean(data[r.slug]),'Missing content model: '+r.slug);
 assert(Boolean(r.title&&r.name&&r.type),'Incomplete route: '+r.slug);
});
assert(routes[30]?.slug==='search'&&routes[31]?.slug==='search-results','Search must have two states');
const variants=data.project?.variants||{};
for(const name of ['gagarincy','rusleo','sns','chotv','slovo']){
 const p=variants[name];
 assert(Boolean(p),'Missing project variant: '+name);
 if(!p)continue;
 for(const fld of ['name','fullName','mission','goal','status','sourceUrl']) assert(Boolean(p[fld]),'Project '+name+' missing '+fld);
 assert(p.sourceUrl.startsWith('https://cosmatica.org/'),'Unexpected project source: '+name);
 assert(Boolean(p.fundraising),'Missing fundraising state: '+name);
}
assert(variants.gagarincy?.fundraising?.enabled===true,'Gagarincy support missing');
assert(variants.sns?.fundraising?.enabled===false,'SNS should not show fundraising');
for(const file of ['index.html','view.html','site.js','site.css','sitemap.html','assets/rko-mark.svg','assets/gagarincy.svg','assets/book.svg','assets/profile.svg']){
 assert(fs.existsSync(path.join(root,file)),'Missing file: '+file);
}
for(const file of ['site.js','routes.js','content.js']){
 try{new Function(read(file));}catch(e){errors.push('Syntax '+file+': '+e.message);}
}
for(const file of ['index.html','view.html']){
 const h=read(file);
 assert(h.includes('content.js'),'Missing content model in '+file);
 assert(h.includes('routes.js')&&h.includes('site.js'),'Missing scripts in '+file);
}
if(fs.existsSync(path.join(root,'data/archive/inventory.json'))){
 const p=spawnSync('python3',['qa/archive-integrity.py'],{cwd:root,encoding:'utf8',timeout:120000});
 if(p.stdout)console.log(p.stdout.trim());
 if(p.status!==0)errors.push('Full public archive integrity check failed: '+(p.stderr||p.stdout||p.error?.message||p.status).slice(-900));
}
const result={routes:routes.length,contentModels:Object.keys(data).length,projectVariants:Object.keys(variants).length,errors};
console.log(JSON.stringify(result,null,2));
if(errors.length)process.exit(1);
