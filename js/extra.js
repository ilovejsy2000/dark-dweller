'use strict';
/* 다크 드웰러 — 덧붙인 몬스터 그림, 행동 방식, 소리(스킬별 타격음·배경음) */

/* ───── 마법 쓰는 적·터지는 적 ───── */
function drawShaman(g,p){ // 주술사: 거리를 두고 마법 구슬을 쏜다
  const s=Math.sin(p*TAU),bob=Math.abs(s)*2;
  g.fillStyle=INK;ell(g,-6,-1,5,3);g.fill();ell(g,6,-1,5,3);g.fill();
  g.save();g.translate(0,-bob);
  rr(g,15,-52,3.6,51,1.6);inkF(g,'#5a4636',2.4);ell(g,16.8,-57,6.2,6.2);inkF(g,'#e56bff',2.6);g.fillStyle='#ffd9ff';ell(g,15,-59,2.1,1.7);g.fill();
  cel(g,()=>blob(g,[[-14,-4],[-12,-30],[-6,-44],[6,-44],[12,-30],[14,-4],[6,0],[-6,0]]),'#5b3f8f',()=>{g.fillStyle='#3f2a69';ell(g,-9,-14,9,26);g.fill();},3);
  cel(g,()=>blob(g,[[-12,-34],[-11,-50],[0,-58],[11,-50],[12,-34],[0,-30]]),'#6f4fae',()=>{g.fillStyle='#4a3380';ell(g,-9,-42,7,14);g.fill();},3);
  ell(g,1,-42,7,7.6);inkF(g,'#efe6cf',2.4);g.fillStyle=INK;ell(g,-1.6,-43,1.7,2.5);g.fill();ell(g,4.2,-43,1.7,2.5);g.fill();
  g.lineWidth=1.8;g.strokeStyle=INK;g.beginPath();g.moveTo(-1,-37.5);g.lineTo(3.5,-37.5);g.stroke();
  g.restore();
}
function drawPuff(g,p){ // 폭탄 버섯: 다가와서 터진다
  const s=Math.sin(p*TAU),y=-Math.max(0,s)*4;
  g.fillStyle=INK;ell(g,-6,-1,4.5,3);g.fill();ell(g,6,-1,4.5,3);g.fill();
  cel(g,()=>blob(g,[[-9,y-2],[-10,y-18],[10,y-18],[9,y-2],[0,y+1]]),'#eadfc6',()=>{g.fillStyle='#b9ab8c';ell(g,-7,y-8,5,12);g.fill();},3);
  cel(g,()=>blob(g,[[-21,y-16],[-18,y-33],[0,y-41],[18,y-33],[21,y-16],[0,y-12]]),'#e2603c',()=>{g.fillStyle='#b3432c';ell(g,-13,y-18,12,10);g.fill();},3);
  g.fillStyle='#ffe9c0';for(const[x,yy,r]of[[-8,-30,3.2],[6,-34,2.8],[12,-23,2.3],[-2,-22,2.1]]){ell(g,x,y+yy,r,r);g.fill();}
  g.fillStyle=INK;ell(g,-4,y-9,1.8,2.5);g.fill();ell(g,4,y-9,1.8,2.5);g.fill();
  g.lineWidth=2.2;g.strokeStyle=INK;g.beginPath();g.moveTo(-8,y-13.5);g.lineTo(-2,y-11.5);g.moveTo(8,y-13.5);g.lineTo(2,y-11.5);g.stroke();
}
ET.shaman={...frames(64,84,32,70,drawShaman),r:14,hp:44,spd:54,dmg:13,xp:3,anim:1.4,kb:.9,light:64,deb:['#5b3f8f','#3f2a69','#e56bff']};
ET.puff={...frames(64,66,32,56,drawPuff),r:14,hp:30,spd:74,dmg:24,xp:2,anim:2.3,kb:1,deb:['#e2603c','#b3432c','#eadfc6']};
/* 행동 방식: chase 곧장 달려듦, charge 멈칫했다가 돌진, weave 좌우로 흔들며 다가옴(닿으면 마법 피해),
   caster 거리를 두고 마법 구슬, bomber 붙어서 터짐, slam 내려찍기(보스는 구슬도 뿌림) */
Object.assign(ET.moss,{n:'이끼덩이',ai:'chase',dmg:9});
Object.assign(ET.rat,{n:'가시쥐',ai:'charge',dmg:9});
Object.assign(ET.wisp,{n:'등불귀',ai:'weave',dmg:11,magic:true});
Object.assign(ET.shaman,{n:'주술사',ai:'caster'});
Object.assign(ET.puff,{n:'폭탄 버섯',ai:'bomber',magic:true});
Object.assign(ET.brute,{n:'돌덩이 거인',ai:'slam',dmg:28});

/* ───── 소리 ───── */
/* 스킬에 맞는 타격음: cut 베임, fire 불, zap 전기, ice 얼음, thud 둔탁, vine 덩굴, light 빛 */
const SFXH={
  cut(){noise(.05,.26,'highpass',2600,5200,.7);tone('triangle',880,300,.05,.11);tone('sine',190,70,.06,.22);},
  fire(){noise(.09,.3,'lowpass',1500,380);tone('sine',210,80,.09,.26);},
  zap(){tone('square',1900,620,.05,.06);noise(.04,.11,'highpass',4200,7000);},
  ice(){tone('sine',2300,1750,.09,.09);tone('sine',3150,2600,.07,.05);noise(.03,.07,'highpass',5000,8000);},
  thud(){tone('sine',150,58,.1,.36);noise(.05,.14,'lowpass',520,200);},
  vine(){noise(.04,.07,'bandpass',900,600,2);},
  light(){tone('sine',700,1150,.08,.09);},
};
function hitSound(kind,crit){if(can('h'+kind,kind==='vine'?120:48))(SFXH[kind]||SFXH.thud)();if(crit&&can('hc',70))tone('triangle',1500,2300,.06,.1);}
SFX.horn=()=>{tone('sawtooth',98,92,.9,.22);tone('sawtooth',147,138,.9,.14,.05);noise(.5,.08,'lowpass',400,200);};
SFX.cast=()=>{if(can('cast',90)){tone('sine',520,880,.16,.1);tone('triangle',1040,1560,.12,.04);}};
SFX.thunder=()=>{noise(.5,.5,'lowpass',2200,90);tone('sine',90,34,.5,.6);tone('sawtooth',1600,120,.16,.14);};
SFX.warn=()=>{if(can('warn',160))tone('square',430,430,.07,.07);};
SFX.pick=()=>tone('sine',880,1320,.07,.12);
SFX.soft=()=>{if(can('soft',80))tone('sine',740,740,.12,.07);};

/* 배경음: 낮게 깔리는 울림 + 바람 + 드문드문 울리는 음. 보스가 있으면 심장 뛰는 북, 버닝 타임에는 빠른 음 */
let amb=null;
const AMB_SCALE=[220,261.63,293.66,329.63,392,440,523.25,587.33];
function ambStart(){
  if(!AC||amb||!CFG.bgm||muted)return;
  try{const t=AC.currentTime,out=AC.createGain();out.gain.setValueAtTime(.0001,t);out.gain.linearRampToValueAtTime(.6,t+3);out.connect(master);
    const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=260;lp.Q.value=.7;lp.connect(out);const nodes=[];
    for(const[type,f,v]of[['sawtooth',55,.1],['sawtooth',55.35,.1],['sine',82.5,.15],['sine',110.2,.06]]){const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.value=f;g.gain.value=v;o.connect(g);g.connect(lp);o.start();nodes.push(o);}
    const lfo=AC.createOscillator(),lg1=AC.createGain();lfo.frequency.value=.07;lg1.gain.value=90;lfo.connect(lg1);lg1.connect(lp.frequency);lfo.start();nodes.push(lfo);
    const ws=AC.createBufferSource();ws.buffer=noiseBuf;ws.loop=true;const bp=AC.createBiquadFilter();bp.type='bandpass';bp.frequency.value=420;bp.Q.value=.5;const wg=AC.createGain();wg.gain.value=.05;
    ws.connect(bp);bp.connect(wg);wg.connect(out);ws.start();nodes.push(ws);
    const lfo2=AC.createOscillator(),lg2=AC.createGain();lfo2.frequency.value=.11;lg2.gain.value=180;lfo2.connect(lg2);lg2.connect(bp.frequency);lfo2.start();nodes.push(lfo2);
    amb={out,nodes,next:1,beat:0};}catch(_){amb=null;}
}
function ambStop(){if(!amb)return;const a=amb;amb=null;try{a.out.gain.cancelScheduledValues(AC.currentTime);a.out.gain.setValueAtTime(a.out.gain.value,AC.currentTime);a.out.gain.linearRampToValueAtTime(.0001,AC.currentTime+.4);
  setTimeout(()=>{a.nodes.forEach(n=>{try{n.stop();}catch(_){}});try{a.out.disconnect();}catch(_){}},500);}catch(_){}}
function ambTick(raw){
  if(!amb)return;amb.next-=raw;
  const near=clamp(1-Math.hypot(P.x,P.y)/260,0,1);if(near>0&&Math.random()<raw*7*near)noise(.025,.05*near,'highpass',2500,5200);
  if(amb.next>0)return;
  const boss=state==='play'&&bossRef&&!bossRef.dead,burn=state==='play'&&burnT>0;
  if(boss){amb.next=.52;tone('sine',68,38,.3,.32);if(amb.beat++%4===3)tone('triangle',pick([110,130.81,146.83]),0,1.3,.07);}
  else if(burn){amb.next=.26;tone('triangle',pick(AMB_SCALE)*2,0,.26,.045);}
  else{amb.next=rand(1.7,3.8);const f=pick(AMB_SCALE);tone('sine',f,0,2.6,.05);if(Math.random()<.4)tone('sine',f*1.5,0,2.2,.028,.25);}
}
function soundOn(){audioInit();ambStart();}
