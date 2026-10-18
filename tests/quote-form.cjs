const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {webcrypto} = require('node:crypto');
const {parseContact, canDeliver, deliver} = require('../dist/quote-form.js');
const config = {enabled:true,paused:false,provider:'formspree',endpoint:'https://formspree.io/f/mqpajdpb'};
assert.deepEqual(parseContact('text','(863) 555-0123'),{email:'',phone:'(863) 555-0123'});
assert.deepEqual(parseContact('email','test@example.com'),{email:'test@example.com',phone:''});
for (const [type,value] of [['text','123'],['text','phone 8635550123'],['email','bad@'],['other','8635550123']]) assert(parseContact(type,value).error);
assert.equal(canDeliver(config,'localhost'),false);
assert.equal(canDeliver({...config,paused:true},'lakelandelitepowerwashing.com'),false);
assert.equal(canDeliver({...config,endpoint:'https://example.com/f/x'},'lakelandelitepowerwashing.com'),false);
function setup({host='lakelandelitepowerwashing.com',cfg=config,response={ok:true},reject=false,wait=false}={}) {
 const nodes=new Map(), calls=[], tracks=[], navigation=[];
 function node(key){if(nodes.has(key))return nodes.get(key);const n={value:'',textContent:'',hidden:false,checked:false,disabled:false,handlers:{},style:{setProperty(){}},setCustomValidity(s){this.error=s;},reportValidity(){return !this.error;},focus(){},scrollIntoView(){},setAttribute(){},getAttribute(){return 'false';},addEventListener(name,fn){(this.handlers[name]??=[]).push(fn);},querySelector(){return null;},querySelectorAll(){return [];}};nodes.set(key,n);return n;}
 const fields={name:'Test Customer',address:'123 Test St, Lakeland FL 33805',contact_preference:'text',contact:'8635550123',email:'',phone:'',zip:'',services:'',details:'Test only',calculator_estimate:'Driveway: $200',_subject:'',_next:'https://lakelandelitepowerwashing.com/thank-you.html'};
 const form=node('#quote-form');const values={};for(const [k,v] of Object.entries(fields)){values[k]=node('field:'+k);values[k].value=v;}
 form.elements={namedItem:k=>values[k]||null};form.reportValidity=()=>Object.values(values).every(n=>!n.error);
 const check=node('service');check.value='Driveway cleaning';check.checked=true;
 form.querySelectorAll=()=>[check];form.querySelector=()=>node('submit');
 const allEvents={};let resolveFetch;
 const context={location:{hostname:host,origin:'https://'+host,assign:url=>navigation.push(url)},document:{querySelector:sel=>['.menu-button','#mobile-nav','#year','#requested-service'].includes(sel)?null:node(sel),querySelectorAll:()=>[],addEventListener(){}},FormData:class{constructor(){this.data=Object.fromEntries(Object.entries(values).map(([k,n])=>[k,n.value]));}get(k){return this.data[k];}},URL,Date,Intl,crypto:webcrypto,Uint32Array,encodeURIComponent,matchMedia:()=>({matches:false,addEventListener(){}}),estimateDelivery:cfg,eliteLeadTracking:{sendAttempt(){tracks.push('attempt');},success(){tracks.push('success');}},addEventListener:(name,fn)=>{allEvents[name]=fn;},fetch:async(url,opts)=>{calls.push({url,data:opts.body.data});if(wait)await new Promise(resolve=>resolveFetch=resolve);if(reject)throw Error('Network');return response;}};
 context.window=context;vm.runInNewContext(fs.readFileSync('dist/quote-form.js','utf8'),context);
 return {nodes,values,calls,tracks,navigation,allEvents,submit:()=>form.handlers.submit[0]({preventDefault(){}}),release:()=>resolveFetch(),change:()=>values.contact_preference.handlers.change[0]()};
}
(async()=>{
 let fetched=false;assert.equal((await deliver(config,'localhost',{},async()=>{fetched=true;})).sent,false);assert.equal(fetched,false);
 const s=setup();await s.submit();assert.equal(s.calls.length,1);assert.equal(s.calls[0].data.phone,'8635550123');assert.equal(s.calls[0].data.email,'');assert.equal(s.calls[0].data.zip,'33805');assert.equal(s.calls[0].data.calculator_estimate,'Driveway: $200');assert.deepEqual(s.tracks,['attempt','success']);assert.equal(s.navigation.length,1);await s.submit();assert.equal(s.calls.length,1);
 const email=setup();email.values.contact_preference.value='email';email.change();assert.equal(email.values.email.required,true);assert.equal(email.values.contact.required,false);email.values.contact.value='';email.values.email.value='test@example.com';await email.submit();assert.equal(email.calls[0].data.email,'test@example.com');assert.equal(email.calls[0].data.phone,'');
 const switched=setup();assert.equal(switched.values.email.required,false);assert.equal(switched.values.contact.required,true);switched.values.email.value='saved@example.com';switched.values.contact_preference.value='email';switched.change();switched.values.contact_preference.value='call';switched.change();assert.equal(switched.values.contact.value,'8635550123');assert.equal(switched.values.email.value,'saved@example.com');await switched.submit();assert.equal(switched.calls[0].data.email,'saved@example.com');assert.equal(switched.calls[0].data.phone,'8635550123');
 const badEmail=setup();badEmail.values.email.value='bad@';await badEmail.submit();assert.equal(badEmail.calls.length,0);assert.match(badEmail.values.email.error,/valid email/);
 const missingEmail=setup();missingEmail.values.contact_preference.value='email';missingEmail.change();await missingEmail.submit();assert.equal(missingEmail.calls.length,0);assert.match(missingEmail.values.email.error,/valid email/);
 for(const options of [{host:'localhost'},{cfg:{...config,paused:true}}]){const p=setup(options);await p.submit();assert.equal(p.calls.length,0);assert.equal(p.tracks.length,0);assert.equal(p.navigation.length,0);}
 for(const options of [{response:{ok:false}},{reject:true}]){const f=setup(options);await f.submit();assert.deepEqual(f.tracks,['attempt']);assert.equal(f.navigation.length,0);assert.equal(f.nodes.get('#quote-fallback').hidden,false);assert.equal(f.values.name.value,'Test Customer');assert.match(f.nodes.get('#quote-status').textContent,/could not confirm delivery/);}
 const double=setup({wait:true});const pending=double.submit();await double.submit();assert.equal(double.calls.length,1);double.release();await pending;assert.deepEqual(double.tracks,['attempt','success']);
 const invalid=setup();invalid.values.contact.value='123';await invalid.submit();assert.equal(invalid.calls.length,0);assert.match(invalid.values.contact.error,/area code/);
 const empty=setup();empty.values.name.value=' ';await empty.submit();assert.equal(empty.calls.length,0);
 console.log('PASS: direct form flow, phone/email switching, estimates preserved, duplicate-send lock, preview/outage guards, failure recovery and success-only tracking.');
})();
