const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto').webcrypto;
const assert = require('node:assert/strict');
const code = fs.readFileSync('dist/lead-tracking.js', 'utf8');
function setup({host='lakelandelitepowerwashing.com', path='/', referrer='', token, storage=new Map(), blocked=false, brokenTag=false}={}) {
  const events=[], handlers={}, formHandlers={}; let serviceClick;
  const context={location:{hostname:host,pathname:path}, URL, Date, crypto, eliteEstimateReturnToken:token,
    document:{referrer, addEventListener:(name,fn)=>handlers[name]=fn,
      querySelector:()=>path==='/'?{addEventListener:(name,fn)=>formHandlers[name]=fn}:null,
      querySelectorAll:()=>[{addEventListener:(name,fn)=>serviceClick=fn}]},
    sessionStorage:{getItem:key=>{if(blocked)throw Error();return storage.get(key)||null;},setItem:(key,val)=>{if(blocked)throw Error();storage.set(key,val);},removeItem:key=>{if(blocked)throw Error();storage.delete(key);}},
    gtag:(...args)=>{if(brokenTag)throw Error();events.push(args);}};
  context.window=context; vm.runInNewContext(code,context);
  return {context,events,handlers,formHandlers,service:()=>serviceClick(),storage};
}
const s=setup();
for(const href of ['tel:+18633624188','sms:+18633624188','mailto:Rob@Lakelandelitepowerwashing.com','https://example.com/']) {
 s.handlers.click({target:{closest:()=>({getAttribute:()=>href})}});
}
s.formHandlers.input();s.formHandlers.change();s.service();
const next = {value:'https://lakelandelitepowerwashing.com/thank-you.html'};
s.context.eliteLeadTracking.review();s.context.eliteLeadTracking.sendAttempt({elements:{namedItem:()=>next}});
const token = new URL(next.value).hash.split('=')[1];
assert.match(token,/^[a-f0-9-]{36}$/);
assert.equal(JSON.parse(s.storage.get('elite_estimate_pending')).token,token);
assert.deepEqual(s.events.map(e=>e[1]),['call_click','text_click','email_click','estimate_start','estimate_review','estimate_send_attempt']);
for(const e of s.events) assert.deepEqual(Object.keys(e[2]),['send_to']);
assert(!JSON.stringify(s.events).includes('Rob@'));
const pendingValue=s.storage.get('elite_estimate_pending');
// Production hosting redirects .html to this canonical extensionless path.
const canonicalStorage = new Map([['elite_estimate_pending', pendingValue]]);
assert.deepEqual(setup({path:'/thank-you',token,storage:canonicalStorage}).events.map(e=>e[1]),['estimate_return']);
assert.equal(setup({path:'/thank-you',token,storage:canonicalStorage}).events.length,0);
assert.equal(setup({path:'/thank-you',token}).events.length,0);
// Missing referrer reproduces the fragile old condition; token return succeeds.
const returned=setup({path:'/thank-you.html',token,storage:s.storage});
assert.deepEqual(returned.events.map(e=>e[1]),['estimate_return']);
assert.equal(setup({path:'/thank-you.html',token,storage:s.storage}).events.length,0);
for(const badToken of [undefined,'wrong']) {
 assert.equal(setup({path:'/thank-you.html',token:badToken,referrer:'https://formsubmit.co/',storage:new Map([['elite_estimate_pending',pendingValue]])}).events.length,0);
}
for(const time of [Date.now()-3600001,Date.now()+60000]) {
 assert.equal(setup({path:'/thank-you.html',token,storage:new Map([['elite_estimate_pending',JSON.stringify({token,time})]])}).events.length,0);
}
assert.equal(setup({path:'/thank-you.html',token,storage:new Map([['elite_estimate_pending','broken']])}).events.length,0);
// Execute the real head cleanup script and confirm the marker is removed before GA.
const html=fs.readFileSync('dist/thank-you.html','utf8');
const capture=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const clean={location:{hash:'#estimate-return='+token,pathname:'/thank-you.html',search:''},history:{state:null,replaceState:(state,title,url)=>{clean.url=url;}}};
clean.window=clean;vm.runInNewContext(capture,clean);
assert.equal(clean.eliteEstimateReturnToken,token);assert.equal(clean.url,'/thank-you.html');
assert.equal(setup({host:'localhost'}).context.eliteLeadTracking,undefined);
assert.equal(setup({host:'update-contact-tracking-handoff.rob-8d5.workers.dev'}).events.length,0);
assert.doesNotThrow(()=>setup({blocked:true,brokenTag:true}).context.eliteLeadTracking.sendAttempt({elements:{namedItem:()=>({value:'https://lakelandelitepowerwashing.com/thank-you.html'})}}));
assert.doesNotThrow(()=>setup({blocked:true,path:'/thank-you.html'}));
console.log('PASS: contact events, start once, form steps, privacy, return deduplication, direct/stale/invalid returns, preview exclusion, storage and analytics failures.');
