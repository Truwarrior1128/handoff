(function () {
  'use strict';
  const modal = document.querySelector('#wash-dialog');
  const launchers = document.querySelectorAll('[data-wash-open]');
  const canvas = document.querySelector('#wash-canvas');
  if (!modal || !canvas || !window.LEWashEngine) return;
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  const status = document.querySelector('#wash-status');
  const meter = document.querySelector('#wash-progress');
  const percent = document.querySelector('#wash-percent');
  const loading = document.querySelector('#wash-loading');
  const retry = document.querySelector('#wash-retry');
  const action = document.querySelector('#wash-action');
  const soundButton = document.querySelector('#wash-sound');
  const skip = document.querySelector('#wash-skip');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let model, cleanImage, sprite, loadingPromise, frame = 0, lastTime = 0, elapsed = 0;
  let running = false, paused = false, finished = false, focusBefore, lastScore = 0;
  let particles = [], previousImpact = null, lastPhase = '', grinTime = 0;
  let audioContext, noise, gain, filter, soundEnabled = false;
  const createCanvas = (w,h) => { const c = document.createElement('canvas'); c.width=w; c.height=h; return c; };
  const image = src => new Promise((resolve,reject) => { const im=new Image(); im.onload=()=>resolve(im); im.onerror=()=>reject(new Error('Image unavailable')); im.src=src; });
  const ease = t => 1-Math.pow(1-Math.max(0,Math.min(1,t)),3);
  const mix = (a,b,t) => a+(b-a)*t;
  const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
  const setStatus = text => { if(status.textContent!==text)status.textContent=text; };
  function resize(){
    if(!modal.open||!model)return;
    const box=canvas.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);
    canvas.width=Math.max(1,Math.round(box.width*dpr));canvas.height=Math.max(1,Math.round(box.height*dpr));requestRender();
  }
  function requestRender(){if(!frame&&modal.open&&model)frame=requestAnimationFrame(tick);}
  function volume(on){if(gain&&audioContext)gain.gain.setTargetAtTime(on&&soundEnabled?0.11:0,audioContext.currentTime,0.045);}
  function chime(){
    if(!soundEnabled||!audioContext)return;
    [1046.5,1568,2093].forEach((frequency,i)=>{
      const osc=audioContext.createOscillator(),g=audioContext.createGain(),at=audioContext.currentTime+i*0.09;
      osc.type='sine';osc.frequency.value=frequency;g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(0.055,at+0.01);g.gain.exponentialRampToValueAtTime(0.001,at+0.5);
      osc.connect(g);g.connect(audioContext.destination);osc.start(at);osc.stop(at+0.52);
    });
  }
  async function toggleSound(){
    if(soundEnabled){soundEnabled=false;volume(false);}
    else{
      try{
        const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw new Error('Unavailable');
        if(!audioContext){
          audioContext=new Audio();const buffer=audioContext.createBuffer(1,audioContext.sampleRate*2,audioContext.sampleRate),data=buffer.getChannelData(0);
          for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
          noise=audioContext.createBufferSource();noise.buffer=buffer;noise.loop=true;
          filter=audioContext.createBiquadFilter();filter.type='bandpass';filter.frequency.value=1800;filter.Q.value=0.7;
          gain=audioContext.createGain();gain.gain.value=0;noise.connect(filter);filter.connect(gain);gain.connect(audioContext.destination);noise.start();
        }
        await audioContext.resume();soundEnabled=true;volume(running&&!paused&&lastPhase==='wash');
      }catch{setStatus('Sound isn’t available here. Elite can still do his thing.');return;}
    }
    soundButton.setAttribute('aria-pressed',String(soundEnabled));soundButton.textContent=soundEnabled?'Sound on':'Sound off';
  }
  function init(){
    if(model)return Promise.resolve(true);if(loadingPromise)return loadingPromise;
    loading.hidden=false;retry.hidden=true;loading.querySelector('span').textContent='Elite is grabbing his gear…';
    loadingPromise=Promise.all([image('/assets/hero.webp'),image('/assets/hero-dirty.webp'),image('/assets/elite-sprites.webp')]).then(([clean,dirty,mascot])=>{
      cleanImage=clean;sprite=mascot;model=window.LEWashEngine.createModel({clean,dirty,createCanvas});
      modal.querySelectorAll('[data-wash-control]').forEach(button=>button.disabled=false);loading.hidden=true;resize();return true;
    }).catch(()=>{loadingPromise=null;loading.querySelector('span').textContent='The scene couldn’t load. Let’s try that again.';retry.hidden=false;return false;});
    return loadingPromise;
  }
  function start(){
    if(!model)return;
    if(running){paused=!paused;action.textContent=paused?'Keep washing':'Pause';volume(!paused&&lastPhase==='wash');lastTime=0;requestRender();return;}
    model.reset();elapsed=0;grinTime=0;lastTime=0;lastScore=0;lastPhase='';previousImpact=null;particles=[];running=true;paused=false;finished=false;
    modal.classList.remove('is-finished');meter.value=0;percent.textContent='0%';action.textContent='Pause';skip.hidden=false;
    setStatus('Stand back. Elite’s got this.');requestRender();
  }
  async function open(){
    if(modal.open)return;focusBefore=document.activeElement;modal.showModal();
    if(await init()){if(modal.open){resize();start();}}
  }
  function complete(){
    if(!model)return;
    model.clear();running=false;paused=false;finished=true;grinTime=0;particles=[];volume(false);chime();
    meter.value=100;percent.textContent='100%';action.textContent='Wash again';skip.hidden=true;
    modal.classList.add('is-finished');setStatus('Driveway: spotless. Smile: blinding.');requestRender();
  }
  // Normal timeline: entrance, four satisfying passes, then a proud camera-facing grin.
  function sceneAt(t){
    const W=model.width,H=model.height;
    const entrance=reduceMotion.matches?0.08:0.85,pass=reduceMotion.matches?0.24:1.68,turn=reduceMotion.matches?0.03:0.24;
    const rows=[{y:.657,a:.25,b:.97},{y:.77,a:.97,b:.075},{y:.878,a:.02,b:1.025},{y:1.005,a:1.04,b:-.045}];
    if(t<entrance){const p=ease(t/entrance);return{phase:'enter',heroX:mix(-.15,.11,p)*W,heroY:mix(.81,.615,p)*H,pose:0,size:.28*H,direction:1};}
    let local=t-entrance;
    for(let i=0;i<rows.length;i++){
      const row=rows[i],dir=row.b>row.a?1:-1;
      if(local<pass){const p=clamp(local/pass,0,1),x=mix(row.a,row.b,p)*W,y=row.y*H;return{phase:'wash',impact:{x,y},heroX:x-dir*.13*W,heroY:y-.065*H,pose:dir>0?1:2,size:(.235+i*.018)*H,direction:dir};}
      local-=pass;
      if(i<rows.length-1){
        if(local<turn){const p=clamp(local/turn,0,1),next=rows[i+1],nextDir=next.b>next.a?1:-1;return{phase:'turn',heroX:mix(row.b-dir*.13,next.a-nextDir*.13,p)*W,heroY:mix(row.y-.065,next.y-.065,p)*H,pose:0,size:(.235+i*.018)*H,direction:nextDir};}
        local-=turn;
      }
    }
    return{phase:'done'};
  }
  function addSpray(s,dt){
    model.wash(previousImpact||s.impact,s.impact,'ridiculous');previousImpact={...s.impact};
    if(reduceMotion.matches)return;
    const count=Math.min(24,Math.ceil(dt*650));
    for(let i=0;i<count&&particles.length<360;i++)particles.push({x:s.impact.x+(Math.random()-.5)*model.width*.22,y:s.impact.y+(Math.random()-.5)*20,vx:(Math.random()-.5)*260,vy:-60-Math.random()*150,life:.25+Math.random()*.4,size:1.5+Math.random()*4});
  }
  function star(x,y,size,alpha){
    if(alpha<=0)return;ctx.save();ctx.translate(x,y);ctx.globalAlpha=alpha;
    ctx.fillStyle='#fffef3';ctx.shadowColor='#eaffad';ctx.shadowBlur=18;
    ctx.beginPath();ctx.moveTo(0,-size);ctx.quadraticCurveTo(size*.18,-size*.18,size,0);ctx.quadraticCurveTo(size*.18,size*.18,0,size);ctx.quadraticCurveTo(-size*.18,size*.18,-size,0);ctx.quadraticCurveTo(-size*.18,-size*.18,0,-size);ctx.fill();ctx.restore();
  }
  function drawHero(s,time){
    const cellW=sprite.width/2,cellH=sprite.height/2,size=s.size;
    const bob=!reduceMotion.matches&&(s.phase==='enter'||s.phase==='turn')?Math.sin(time*17)*5:0;
    ctx.save();
    ctx.fillStyle='rgba(13,35,29,.19)';ctx.beginPath();ctx.ellipse(s.heroX,s.heroY+3,size*.19,size*.035,0,0,Math.PI*2);ctx.fill();
    ctx.drawImage(sprite,(s.pose%2)*cellW,Math.floor(s.pose/2)*cellH,cellW,cellH,s.heroX-size*.5,s.heroY-size*[.98,.96,.93,.94][s.pose]+bob,size,size);
    ctx.restore();
  }
  function drawWater(s,time){
    if(s.phase!=='wash')return;
    const x=s.impact.x,y=s.impact.y,dir=s.direction;
    const nozzleX=s.heroX+dir*s.size*.42,nozzleY=s.heroY-s.size*(dir>0?.13:.155);
    ctx.save();
    const beam=ctx.createLinearGradient(nozzleX,nozzleY,x,y);beam.addColorStop(0,'rgba(243,254,255,.9)');beam.addColorStop(1,'rgba(221,250,255,.10)');
    ctx.fillStyle=beam;ctx.beginPath();ctx.moveTo(nozzleX,nozzleY);ctx.lineTo(x-model.width*.13,y+8);ctx.quadraticCurveTo(x,y-model.height*.08,x+model.width*.13,y+8);ctx.closePath();ctx.fill();
    ctx.strokeStyle='rgba(249,255,255,.57)';ctx.lineWidth=1.6;
    for(let i=0;i<12;i++){ctx.beginPath();ctx.moveTo(nozzleX,nozzleY);ctx.lineTo(x+(-.12+i/11*.24)*model.width,y+Math.sin(time*20+i)*7);ctx.stroke();}
    const radius=model.width*.145,mist=ctx.createRadialGradient(x,y,0,x,y,radius);mist.addColorStop(0,'rgba(240,255,255,.34)');mist.addColorStop(1,'rgba(232,255,255,0)');ctx.fillStyle=mist;ctx.fillRect(x-radius,y-radius,radius*2,radius*2);ctx.restore();
  }
  function render(s,dt,time){
    ctx.setTransform(canvas.width/model.width,0,0,canvas.height/model.height,0,0);
    ctx.clearRect(0,0,model.width,model.height);ctx.drawImage(cleanImage,0,0,model.width,model.height);ctx.drawImage(model.layer,0,0);
    if(s.phase!=='done'){drawHero(s,time);drawWater(s,time);}
    for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=330*dt;ctx.fillStyle=`rgba(234,252,255,${Math.max(0,p.life)*1.1})`;ctx.beginPath();ctx.ellipse(p.x,p.y,p.size,p.size*1.65,.2,0,Math.PI*2);ctx.fill();}
    particles=particles.filter(p=>p.life>0);
    if(finished){
      const p=reduceMotion.matches?1:ease(grinTime/.75),size=mix(.27,.48,p)*model.height;
      const jump=reduceMotion.matches?0:Math.sin(clamp(grinTime/.6,0,1)*Math.PI)*model.height*.045;
      const hero={phase:'victory',pose:3,heroX:mix(.13,.50,p)*model.width,heroY:.975*model.height-jump,size};drawHero(hero,time);
      const pulse=reduceMotion.matches?.7:Math.max(0,Math.sin(Math.min(grinTime,2.4)*7));
      star(hero.heroX+size*.005,hero.heroY-size*.742,17+pulse*12,.7+pulse*.3);
      if(!reduceMotion.matches&&grinTime<2.6){star(model.width*.31,model.height*.73,13+9*pulse,pulse*.8);star(model.width*.72,model.height*.85,12+8*(1-pulse),(1-pulse)*.8);star(model.width*.79,model.height*.65,14,pulse*.7);}
    }
  }
  function tick(time){
    frame=0;if(!modal.open||!model)return;
    const dt=lastTime?Math.min(.045,(time-lastTime)/1000):.016;lastTime=time;
    if(running&&!paused)elapsed+=dt;
    let scene=sceneAt(elapsed);
    if(running&&!paused){
      if(scene.phase==='wash'){addSpray(scene,dt);volume(true);}else{previousImpact=null;volume(false);}
      if(scene.phase!==lastPhase){if(scene.phase==='wash')setStatus('A little pressure. A whole lot of clean.');lastPhase=scene.phase;}
      if(time-lastScore>180){lastScore=time;const value=Math.min(99,Math.floor(model.progress()));meter.value=value;percent.textContent=value+'%';}
      if(scene.phase==='done')complete();
    }
    if(finished){grinTime+=dt;scene={phase:'done'};}
    render(scene,paused?0:dt,time/1000);
    if((running&&!paused)||(finished&&grinTime<2.7))requestRender();
  }
  action.addEventListener('click',start);soundButton.addEventListener('click',toggleSound);
  skip.addEventListener('click',complete);document.querySelector('#wash-close').addEventListener('click',()=>modal.close());
  retry.addEventListener('click',async()=>{if(await init())start();});
  document.querySelector('#wash-quote').addEventListener('click',()=>modal.close());
  modal.addEventListener('close',()=>{
    running=false;paused=false;volume(false);cancelAnimationFrame(frame);frame=0;lastTime=0;
    if(audioContext)audioContext.suspend().catch(()=>{});soundEnabled=false;soundButton.setAttribute('aria-pressed','false');soundButton.textContent='Sound off';
    if(focusBefore?.isConnected)focusBefore.focus({preventScroll:true});
  });
  modal.addEventListener('click',event=>{if(event.target!==modal)return;const b=modal.getBoundingClientRect();if(event.clientX<b.left||event.clientX>b.right||event.clientY<b.top||event.clientY>b.bottom)modal.close();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&running){paused=true;action.textContent='Keep washing';volume(false);cancelAnimationFrame(frame);frame=0;}else{lastTime=0;requestRender();}});
  window.addEventListener('resize',resize);
  launchers.forEach(button=>{button.hidden=false;button.addEventListener('click',open);});
  if(location.hash==='#power-wash')open();
  window.addEventListener('hashchange',()=>{if(location.hash==='#power-wash')open();});
})();
