'use strict';
/* 다크 드웰러 — 켜기: 설정, 화면 크기, 입력, 틀 돌리기 */

/* 설정 (이 기기에만 저장) */
const CFG={zoom:1,q:1,shake:1,spd:1,snd:1,bgm:1,vib:1,fps:0};
try{Object.assign(CFG,JSON.parse(localStorage.getItem('darkdweller.cfg')||'{}'));}catch(_){}
const ZOOMS=[1.22,1,.82],QUAL=[1,1.5,2.5],SHK=[1,.45,0],SPEEDS=[1,1.25,1.45]; // 게임 속도: 보통·빠르게(기본)·아주 빠르게

/* 화면 크기 */
let W=0,H=0,DPR=1,S=1,fpsNow=0;const lightC=document.createElement('canvas'),lg=lightC.getContext('2d');
function resize(){const r=cv.getBoundingClientRect();W=Math.max(200,r.width);H=Math.max(200,r.height);DPR=Math.min(window.devicePixelRatio||1,QUAL[CFG.q]);
  cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);S=clamp(Math.min(W,H)/440,.8,1.3)*ZOOMS[CFG.zoom]; // 폰 세로 화면 기준: 가로로 440칸쯤 보이게
  lightC.width=Math.ceil(W/2);lightC.height=Math.ceil(H/2);
  try{const cs=getComputedStyle($('hud'));hudPad={l:parseFloat(cs.paddingLeft)||16,t:parseFloat(cs.paddingTop)||10};}catch(_){}
  const ns=clamp(Math.round(S*DPR*4)/4,1,1.5);if(ns!==CS){CS=ns;chunks.clear();}}
window.addEventListener('resize',resize);

/* 입력: 키보드, 화면 아무 곳이나 누른 채 끌기 */
const keys={};let joy=null;
window.addEventListener('keydown',e=>{keys[e.code]=true;if(/^Arrow|Space/.test(e.code))e.preventDefault();if(e.code==='Escape'){if(paused&&!$('pause').hidden)uiResume();else uiPause();}});
window.addEventListener('keyup',e=>{keys[e.code]=false;});
window.addEventListener('blur',()=>{for(const k in keys)keys[k]=false;joy=null;});
document.addEventListener('visibilitychange',()=>{if(document.hidden)uiPause();});
cv.addEventListener('pointerdown',e=>{if(state!=='play'||paused||choosing)return;soundOn();const r=cv.getBoundingClientRect();joy={id:e.pointerId,x0:e.clientX-r.left,y0:e.clientY-r.top,x:e.clientX-r.left,y:e.clientY-r.top};try{cv.setPointerCapture(e.pointerId);}catch(_){}});
cv.addEventListener('pointermove',e=>{if(joy&&e.pointerId===joy.id){const r=cv.getBoundingClientRect();joy.x=e.clientX-r.left;joy.y=e.clientY-r.top;}});
const joyEnd=e=>{if(joy&&e.pointerId===joy.id)joy=null;};cv.addEventListener('pointerup',joyEnd);cv.addEventListener('pointercancel',joyEnd);

/* 틀 돌리기 */
let last=0,fpsAcc=0,fpsN=0;
function frame(now){
  requestAnimationFrame(frame);const raw=Math.min(.034,(now-last)/1000||0);last=now;if(document.hidden)return;
  fpsAcc+=raw;fpsN++;if(fpsAcc>=.5){fpsNow=Math.round(fpsN/fpsAcc);fpsAcc=0;fpsN=0;}
  tick(raw);
}
function tick(raw){
  const held=paused||choosing;if(!held)clock+=raw;
  let dt=raw;if(freeze>0){freeze-=raw;dt=raw*.06;}
  if(state==='play'&&!held){
    if(cine){cine.t-=raw;dt*=.1;if(cine.t<=0){cine=null;uiCine(null);}} // 보스 등장: 잠깐 느려지고 화면이 보스를 비춘다
    if(ending){ending.t-=raw;dt*=.3;}
    update(dt*SPEEDS[CFG.spd]);
    if(ending&&ending.t<=0)finishRun();else{if(pendingLv>0&&!ending&&!cine)uiOpenChoice();uiHud();}
  }else if(state!=='play'){for(const p of parts){p.life-=raw;if(p.k==='ember'){p.x+=p.vx*raw;p.y+=p.vy*raw;}}parts=parts.filter(p=>p.life>0);}
  bossMood+=((state==='play'&&bossRef&&!bossRef.dead?1:0)-bossMood)*Math.min(1,raw*2.2);
  if(!held){ambTick(raw);if(Math.random()<raw*16)ember(0,-26,1,9,70);}
  for(const f of flashes)f.life-=raw;flashes=flashes.filter(f=>f.life>0);
  trauma=Math.max(0,trauma-raw*1.9);const kd=Math.exp(-raw*14);kick.x*=kd;kick.y*=kd;
  const k=1-Math.exp(-raw*7),down=state==='lobby'?H/S*.2:0; // 거점에서는 모닥불이 카드 위로 보이게
  let tx=P.x,ty=P.y-22+down;if(cine&&cine.e&&cine.t>.55&&cine.t<cine.max-.12){tx=cine.e.x;ty=cine.e.y-60;}
  cam.x+=(tx-cam.x)*k;cam.y+=(ty-cam.y)*k;
  render(held?0:raw);
}

loadSave();recalc();resize();uiInit();requestAnimationFrame(frame);

/* 검사용 창구(화면 확인 때만 씀) */
window.__dd={get s(){return{state,runT,kills,enemies:enemies.length,parts:parts.length,hp:P.hp,maxhp:P.maxhp,level:P.level,act:P.act,pas:P.pas,drops:drops.length,stash:SAVE.stash.length,pendingLv,choosing,paused,ending,fps:fpsNow,W,H,S};},
  P,get SAVE(){return SAVE;},get ST(){return ST;},start:uiStart,spawn,setKey(k,v){keys[k]=v;},setT(t){runT=t;},give(gi,n){for(let i=0;i<(n||1);i++)SAVE.stash.push(makeItem(gi,Math.random()*.6));saveNow();},drop(gi){dropItem(P.x+40,P.y+40,gi,0);},map(i){mapSel=i;setMap(i);},step(n){for(let i=0;i<n;i++)tick(1/60);},learn(id,n){for(let i=0;i<(n||1);i++){P.act[id]=(P.act[id]||0)+1;}calcPerks(id);},xp(v){gainXp(v);}};
