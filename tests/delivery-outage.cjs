const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto').webcrypto;
function setup(paused, hostname='lakelandelitepowerwashing.com') {
  const nodes=new Map(), events=[];let submitted=0;
  function node(key='') {
    if(nodes.has(key))return nodes.get(key);
    const n={value:'',textContent:'',hidden:false,disabled:false,handlers:{},className:'',
      addEventListener(type,fn){this.handlers[type]=fn;},after(x){nodes.set('#'+x.id,x);},prepend(){},
      querySelector(sel){return node(key+' '+sel);},querySelectorAll(){return [];},
      showModal(){this.open=true;},close(){this.open=false;},focus(){},scrollIntoView(){},
      reportValidity(){return true;},setCustomValidity(){},setAttribute(){},contains(){return false;}};
    nodes.set(key,n);return n;
  }
  const form=node('#quote-form');
  const fields={name:'Test & Example',zip:'33805',address:'TEST ONLY',email:'Rob@Lakelandelitepowerwashing.com',phone:'',details:'Calculator estimate: $200\nHouse & driveway',_subject:'',_next:'https://lakelandelitepowerwashing.com/thank-you.html'};
  const elements={};for(const [k,v] of Object.entries(fields)){elements[k]=node('field:'+k);elements[k].value=v;}
  form.elements={namedItem:k=>elements[k]};
  const choice=node('service');choice.checked=true;choice.value='Pressure washing';choice.nextElementSibling=node('service span');
  form.querySelectorAll=()=>[choice];
  const ctx={window:null,location:{hostname},document:{activeElement:null,querySelector:s=>node(s),querySelectorAll:()=>[],createElement:()=>node('created:'+nodes.size),addEventListener(){}},
    FormData:class{get(k){return elements[k]?.value;}},crypto,Intl,Date,URL,encodeURIComponent,
    HTMLFormElement:{prototype:{submit(){submitted++;}}},matchMedia:()=>({matches:false,addEventListener(){}}),
    navigator:{clipboard:{writeText:async()=>{}}},addEventListener(){},
    estimateDelivery:{enabled:true,paused,endpoint:'https://formsubmit.co/Rob@Lakelandelitepowerwashing.com'},
    eliteLeadTracking:{review(){events.push('review');},sendAttempt(){events.push('send');}}};
  ctx.window=ctx;vm.runInNewContext(fs.readFileSync('dist/app.js','utf8'),ctx);
  return {nodes,events,form,submitted:()=>submitted};
}
const paused=setup(true);paused.form.handlers.submit({preventDefault(){}});
const link=paused.nodes.get('#email-request-fallback');
assert.equal(link.hidden,false);assert.equal(paused.nodes.get('#send-request').hidden,true);
const mail=new URL(link.href);assert.equal(mail.pathname,'Rob@Lakelandelitepowerwashing.com');
assert.match(mail.searchParams.get('body'),/Calculator estimate: \$200\nHouse & driveway/);
assert.match(mail.searchParams.get('body'),/Service address: TEST ONLY/);
assert.match(paused.nodes.get('#send-status').textContent,/Not sent yet/);
paused.nodes.get('#send-request').handlers.click();
assert.equal(paused.submitted(),0);assert.deepEqual(paused.events,['review']);
link.handlers.click();assert.match(paused.nodes.get('#send-status').textContent,/has not been sent/);
const live=setup(false);live.form.handlers.submit({preventDefault(){}});live.nodes.get('#send-request').handlers.click();
assert.equal(live.submitted(),1);assert.deepEqual(live.events,['review','send']);
assert.equal(live.nodes.get('#email-request-fallback').hidden,true);
const preview=setup(false,'localhost');preview.form.handlers.submit({preventDefault(){}});preview.nodes.get('#send-request').handlers.click();assert.equal(preview.submitted(),0);
console.log('PASS: outage blocks native POST and send tracking; prepared email preserves details; no false success; normal and preview flows remain intact.');
