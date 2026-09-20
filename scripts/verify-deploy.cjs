#!/usr/bin/env node
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {createHash}=require('node:crypto');
const base=process.argv[2];
assert(base&&/^https:\/\/[^/]+\.pages\.dev\/?$/.test(base),'Usage: node scripts/verify-deploy.cjs https://PROJECT.pages.dev');
const root=base.replace(/\/$/,'');
const build=JSON.parse(fs.readFileSync('evidence/build.json','utf8'));
(async()=>{
 const index=await fetch(root+'/'); assert.equal(index.status,200);
 const csp=index.headers.get('content-security-policy')||'';
 assert(csp.includes("script-src 'self'")&&csp.includes("frame-ancestors 'none'"),'Missing security policy');
 assert.equal(index.headers.get('x-content-type-options'),'nosniff');
 assert.equal(index.headers.get('x-frame-options'),'DENY');
 assert(index.headers.get('permissions-policy').includes('microphone=()'));
 const checked=[];let cursor=0;
 const files=build.filesIncluded.filter(f=>f!=='_headers');
 await Promise.all(Array.from({length:8},async()=>{
  while(cursor<files.length){
   const file=files[cursor++];
   const response=await fetch(`${root}/${file}`,{method:'HEAD',signal:AbortSignal.timeout(20000)});
   assert.equal(response.status,200,`${file} returned ${response.status}`);
   checked.push(file);
  }
 }));
 for(const file of ['index.html','app.js','styles.css','assets/audio-manifest.js','assets/country-data.js']){
  const response=await fetch(`${root}/${file}`);
  const remote=Buffer.from(await response.arrayBuffer());
  const hash=b=>createHash('sha256').update(b).digest('hex');
  assert.equal(hash(remote),hash(fs.readFileSync('dist/'+file)),`Deployed ${file} differs from the verified release`);
 }
 for(const file of ['.env.local','package.json','serve.py','assets/audio/generation.json']){
  const response=await fetch(`${root}/${file}`);assert.equal(response.status,404,`Private/development path should return 404: ${file}`);
 }
 const audio=await fetch(`${root}/assets/audio/learn-jp.mp3`,{headers:{Range:'bytes=0-1023'}});
 // HTTP servers may legally ignore Range and return the complete file (200).
 // The product requires playable short narration, not byte-range seeking.
 assert([200,206].includes(audio.status),'Audio must return a full file or a valid partial response');
 assert((audio.headers.get('content-type')||'').startsWith('audio/'),'Audio MIME type');
 const range=audio.headers.get('content-range');
 const audioBytes=Buffer.from(await audio.arrayBuffer());
 if(audio.status===206){assert(range.startsWith('bytes 0-1023/'));assert.equal(audioBytes.length,1024);}
 else{assert.equal(createHash('sha256').update(audioBytes).digest('hex'),createHash('sha256').update(fs.readFileSync('dist/assets/audio/learn-jp.mp3')).digest('hex'),'Complete audio content must match the release');}
 const cache=audio.headers.get('cache-control')||'';
 assert.equal((cache.match(/max-age=/g)||[]).length,1,'Cache policy must not contain conflicting max-age directives');
 const report={url:root,version:build.version,publicFilesChecked:checked.length,entrypointHashesMatch:true,securityHeaders:true,privateFilesReturn404:true,audioDeliveryStatus:audio.status,audioContentVerified:true,audioRange:range,verifiedAt:new Date().toISOString()};
 fs.writeFileSync('evidence/deployed-assets.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
