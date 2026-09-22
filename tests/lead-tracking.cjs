const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const code = fs.readFileSync('dist/lead-tracking.js', 'utf8');
function setup({host='lakelandelitepowerwashing.com', path='/', referrer='', storage=new Map(), blocked=false, brokenTag=false}={}) {
  const events=[], handlers={}, formHandlers={}; let serviceClick;
  const context={location:{hostname:host,pathname:path}, URL, Date,
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
s.context.eliteLeadTracking.review();s.context.eliteLeadTracking.sendAttempt();
assert.deepEqual(s.events.map(e=>e[1]),['call_click','text_click','email_click','estimate_start','estimate_review','estimate_send_attempt']);
for(const e of s.events) assert.deepEqual(Object.keys(e[2]),['send_to']);
assert(!JSON.stringify(s.events).includes('Rob@'));
const returned=setup({path:'/thank-you.html',referrer:'https://formsubmit.co/',storage:s.storage});
assert.deepEqual(returned.events.map(e=>e[1]),['estimate_return']);
assert.equal(setup({path:'/thank-you.html',referrer:'https://formsubmit.co/',storage:s.storage}).events.length,0);
for(const referrer of ['', 'https://example.com/', 'https://formsubmit.co.evil.example/']) {
 assert.equal(setup({path:'/thank-you.html',referrer,storage:new Map([['elite_estimate_pending',String(Date.now())]])}).events.length,0);
}
for(const when of [Date.now()-3600001,Date.now()+60000]) {
 assert.equal(setup({path:'/thank-you.html',referrer:'https://formsubmit.co/',storage:new Map([['elite_estimate_pending',String(when)]])}).events.length,0);
}
assert.equal(setup({host:'localhost'}).context.eliteLeadTracking,undefined);
assert.equal(setup({host:'update-contact-tracking-handoff.rob-8d5.workers.dev'}).events.length,0);
assert.doesNotThrow(()=>setup({blocked:true,brokenTag:true}).context.eliteLeadTracking.sendAttempt());
assert.doesNotThrow(()=>setup({blocked:true,path:'/thank-you.html'}));
console.log('PASS: contact events, start once, form steps, privacy, return deduplication, direct/stale/invalid returns, preview exclusion, storage and analytics failures.');
