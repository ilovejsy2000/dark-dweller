'use strict';
/* 다크 드웰러 — 배경음악·효과음 보강(11-15 대표님 "사운드 보완", 루아 시험: 배경음이 낮은 울림 + 가끔 한 음뿐, 효과음이 전부 단순한 삐 소리).
   파일 없이 코드로 만드는 반복 음악: 화음(패드) + 베이스 + 아르페지오 + 멜로디 + 북. 장면마다 곡이 바뀐다.
   거점(동굴) = 느리고 잔잔한 오르골 · 판 = 112BPM 단조 모험 · 버닝 타임 = 판 곡을 밝고 빠르게 · 보스 = 136BPM 화성단음계로 긴박하게.
   extra.js 의 ambStart·ambStop·ambTick 을 이 파일의 것으로 바꿔 끼운다(설정의 '배경음' 켜고 끄기도 그대로 쓴다). */

const MINOR=[0,2,3,5,7,8,10],HMINOR=[0,2,3,5,7,8,11];
const hz=s=>440*Math.pow(2,(s-9)/12);              // s: 가온 C(=0) 기준 반음
const deg=(root,d,sc)=>root+12*Math.floor(d/7)+(sc||MINOR)[((d%7)+7)%7];
/* 곡: 마디마다 화음 뿌리(반음), 16칸 패턴. mel = 마디별 16칸 음(음계 도수, null=쉼) */
const TRACKS={
  hub:{bpm:78,root:-3,sc:MINOR,chords:[0,-4,3,-2],vol:.7,pad:1,arp:'box',drums:0,bass:0,
    mel:[[7,null,null,null,9,null,null,null,10,null,9,null,7,null,null,null],[5,null,null,null,7,null,null,null,8,null,7,null,5,null,null,null],
         [9,null,null,null,10,null,null,null,12,null,10,null,9,null,null,null],[8,null,null,null,7,null,null,null,6,null,null,null,null,null,null,null]]},
  run:{bpm:112,root:-3,sc:MINOR,chords:[0,-4,-2,-5],vol:.85,pad:1,arp:'run',drums:1,bass:1,
    mel:[[7,null,7,9,10,null,9,null,7,null,null,5,7,null,null,null],[5,null,5,7,8,null,7,null,5,null,null,3,5,null,null,null],
         [6,null,6,7,9,null,7,null,6,null,null,4,6,null,null,null],[4,null,4,5,7,null,9,null,11,null,10,null,9,null,7,null]]},
  boss:{bpm:136,root:2,sc:HMINOR,chords:[0,-2,-7,-5],vol:1,pad:1,arp:'boss',drums:2,bass:2,
    mel:[[7,null,8,null,7,null,6,null,7,null,null,null,11,null,null,null],[8,null,9,null,8,null,7,null,8,null,null,null,6,null,null,null],
         [7,null,8,null,10,null,8,null,7,null,6,null,4,null,null,null],[6,null,7,null,8,null,9,null,11,null,null,null,10,null,9,null]]},
};
let mus=null;
function ambStart(){
  if(!AC||mus||!CFG.bgm||muted)return;
  try{const bus=AC.createGain();bus.gain.setValueAtTime(.0001,AC.currentTime);bus.gain.linearRampToValueAtTime(.32,AC.currentTime+2);bus.connect(master);
    const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=3200;lp.connect(bus);
    mus={bus,lp,next:AC.currentTime+.15,step:0,track:'hub',want:'hub',burn:false};}catch(_){mus=null;}
}
function ambStop(){if(!mus)return;const m=mus;mus=null;try{m.bus.gain.cancelScheduledValues(AC.currentTime);m.bus.gain.setValueAtTime(m.bus.gain.value,AC.currentTime);m.bus.gain.linearRampToValueAtTime(.0001,AC.currentTime+.4);setTimeout(()=>{try{m.bus.disconnect();}catch(_){}},600);}catch(_){}}
/* 소리 한 개: 파형·주파수·시작·길이·크기·붙는 시간 */
function vnote(type,f,t,dur,vol,att,dest){const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(f,t);
  g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol,t+(att||.008));g.gain.exponentialRampToValueAtTime(.0005,t+dur);o.connect(g);g.connect(dest||mus.lp);o.start(t);o.stop(t+dur+.05);}
function vnoise2(t,dur,vol,type,f,dest){const s=AC.createBufferSource(),fl=AC.createBiquadFilter(),g=AC.createGain();s.buffer=noiseBuf;fl.type=type;fl.frequency.value=f;
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0005,t+dur);s.connect(fl);fl.connect(g);g.connect(dest||mus.bus);s.start(t,Math.random()*.5);s.stop(t+dur+.05);}
function drumKick(t,v){const o=AC.createOscillator(),g=AC.createGain();o.frequency.setValueAtTime(140,t);o.frequency.exponentialRampToValueAtTime(42,t+.14);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+.22);o.connect(g);g.connect(mus.bus);o.start(t);o.stop(t+.25);}
/* 한 칸(16분음표) 연주 */
function musStep(T,st,t,dur){
  const bar=(st>>4)%4,i=st&15,root=T.root+T.chords[bar],ch=[0,2,4].map(d=>deg(root,d,T.sc));
  const burn=mus.burn,b=burn?1.15:1;
  if(T.pad&&i===0)for(const s of ch){vnote('sawtooth',hz(s-12),t,dur*16*.98,.022*T.vol,.35);vnote('triangle',hz(s),t,dur*16*.98,.03*T.vol,.4);}
  if(T.bass){const pat=T.bass===2?[1,0,1,0,1,0,1,1,1,0,1,0,1,0,1,1]:[1,0,0,1,0,0,1,0,1,0,0,1,0,0,1,0];if(pat[i])vnote('triangle',hz(root-24+(i===8&&T.bass===1?12:0)),t,dur*1.8,.2*T.vol);}
  if(T.arp==='box'&&i%4===0){const s=ch[(i/4)%3]+12;vnote('sine',hz(s),t,dur*5,.07*T.vol,.004);vnote('sine',hz(s+12),t,dur*3,.025*T.vol,.004);}
  if(T.arp==='run'&&i%2===0){const s=ch[[0,1,2,1,0,2,1,2][(i/2)|0]]+12;vnote('square',hz(s),t,dur*1.2,.022*T.vol*b,.004);}
  if(T.arp==='boss'&&(i%4===0||i%4===3)){for(const s of ch)vnote('sawtooth',hz(s),t,dur*.9,.018*T.vol,.004);}
  const m=T.mel[bar][i];if(m!==null&&m!==undefined){const s=deg(T.root,m,T.sc)+12;vnote(T.arp==='box'?'sine':'triangle',hz(s),t,dur*(T.arp==='box'?6:3),(T.arp==='box'?.07:.075)*T.vol*b,.01);if(burn)vnote('sine',hz(s+12),t,dur*2,.03,.01);}
  if(T.drums){const D=T.drums;
    if(i%8===0||(D===2&&i%4===0)||(i===14&&bar===3))drumKick(t,.5);
    if(i%8===4)vnoise2(t,.14,.22,'bandpass',1800);
    if(i%2===0||burn)vnoise2(t,.04,i%4===2?.07:.045,'highpass',7000);
    if(D===2&&i===15)vnoise2(t,.25,.12,'highpass',4000);}
}
function ambTick(raw){
  if(!mus||!AC)return;
  const boss=state==='play'&&bossRef&&!bossRef.dead&&!bossRef.sleep,run=state==='play'&&!ending;
  mus.want=boss?'boss':run?'run':'hub';mus.burn=state==='play'&&burnT>0;
  /* 곡을 바꿀 때는 마디가 끝날 때 바꾼다(보스는 바로) */
  if(mus.want!==mus.track&&(mus.step%16===0||mus.want==='boss')){mus.track=mus.want;mus.step=0;}
  const T=TRACKS[mus.track],dur=60/T.bpm/4/(mus.burn?1.0:1);
  if(mus.next<AC.currentTime-.3)mus.next=AC.currentTime+.05;
  while(mus.next<AC.currentTime+.18){musStep(T,mus.step,mus.next,dur);mus.next+=dur;mus.step++;}
  /* 모닥불 가까이에선 장작 타닥 소리 */
  const near=state!=='play'?.4:clamp(1-Math.hypot(P.x,P.y)/260,0,1);if(near>0&&Math.random()<raw*6*near)noise(.025,.05*near,'highpass',2500,5200);
}

/* ───── 효과음 보강: 화음과 겹소리로 손맛을 더한다 ───── */
SFX.level=()=>{[0,4,7,12].forEach((s,i)=>{tone('triangle',hz(12+s),0,.22,.2,i*.06);tone('sine',hz(24+s),0,.16,.07,i*.06);});tone('sine',hz(24),0,.5,.12,.24);noise(.3,.08,'highpass',6000,9000,1,.24);};
SFX.loot=gi=>{const base=[12,14,16,19,24][gi]||12;
  if(gi>=3){[0,4,7,11,14].forEach((s,i)=>tone('sine',hz(base+s),0,.6,.16,i*.07));tone('triangle',hz(base-12),0,.9,.18,.0);noise(.5,.1,'highpass',7000,10000,1,.1);}
  else{tone('sine',hz(base+7),0,.18,.16);tone('sine',hz(base+12),0,.14,.12,.05);}};
SFX.pick=()=>{tone('sine',hz(31),0,.06,.1);tone('sine',hz(36),0,.08,.08,.04);};
SFX.boom=()=>{if(!can('boom',70))return;noise(.35,.55,'lowpass',1200,90);tone('sine',120,34,.35,.75);noise(.12,.25,'highpass',2500,900);};
SFX.elite=()=>{tone('sawtooth',hz(-22),hz(-24),1.1,.32);tone('sawtooth',hz(-15),hz(-17),1.1,.18,.04);noise(.8,.28,'lowpass',380,70);tone('sine',55,30,.9,.5);};
SFX.die=()=>{[7,3,0,-5].forEach((s,i)=>tone('triangle',hz(s),0,.35,.18,i*.13));noise(.8,.15,'lowpass',600,80,1,.1);};
SFX.win=()=>{[0,4,7,12,16,19,24].forEach((s,i)=>tone('triangle',hz(12+s),0,.3,.16,i*.07));[0,4,7].forEach(s=>tone('sine',hz(12+s),0,1.2,.08,.5));};
SFX.hurt=()=>{if(!can('hurt',120))return;tone('square',160,60,.16,.22);noise(.12,.3,'lowpass',800,180);tone('sine',90,50,.12,.3);};
SFX.ui=()=>{tone('sine',hz(24),hz(31),.06,.12);tone('triangle',hz(36),0,.05,.04,.03);};
