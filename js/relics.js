'use strict';
/* 다크 드웰러 — 전설·신화 장비의 고유 효과와 세트 효과가 실제로 하는 일.
   game.js 가 부른다: relicRecalc(능력치 계산), relicDmg(피해 배율), relicOnHit·relicOnKill·relicOnHurt, relicBlock·relicTaken·relicRevive, relicTick */

/* 적 기본 수치 올림(11-14 대표님 "너무 쉬워") */
/* (적 기본 수치는 mobs.js 로 옮김) */

let ELM={},SETN={},streak=0,streakT=0,soulStack=0,killCount=0,aegisT=0,raT=4,reviveUsed=false,slashN=0;
/* 계열 피해: cut 물리, fire 화염, zap 번개, ice 냉기, vine 독, thud 암흑, all 전부 */
const FXEL={forge:{fire:.25},stormEl:{zap:.25},frostEl:{ice:.25},darkEl:{thud:.25,vine:.25},venomEl:{vine:.4},zeus:{zap:.6},surtr:{fire:.6},poseidon:{ice:.6},erebus:{thud:.6,vine:.6},
  excalibur:{cut:.5},gungnir:{ice:.4,cut:.2},mjolnir:{zap:.3},allDmg:{all:.1}};
function relicReset(){streak=0;streakT=0;soulStack=0;killCount=0;aegisT=0;raT=4;reviveUsed=false;slashN=0;P.valkT=0;}
const setHas=(k,n)=>(SETN[k]||0)>=n;
/* 능력치를 다시 셀 때: 세트 조각 수, 계열 피해, 고유 효과가 바꾸는 능력치 */
function relicRecalc(s,fx){
  SETN={};for(const[sk]of EQUIP_SLOTS){const it=SAVE.equip[sk];if(it&&it.set)SETN[it.set]=(SETN[it.set]||0)+1;}
  ELM={};const el=(o,n)=>{for(const k in o)ELM[k]=(ELM[k]||0)+o[k]*n;},add=(k,v)=>{fx[k]=(fx[k]||0)+v;};
  for(const k in fx)if(FXEL[k])el(FXEL[k],fx[k]);
  fx.zproc=.15*(fx.zeus||0);fx.iceBurst=fx.poseidon||0;
  if(setHas('zeus',2))el({zap:.25},1);if(setHas('zeus',3))add('zapChain',1.5);if(setHas('zeus',4))fx.zproc+=.2;
  if(setHas('odin',2))el({all:.15},1);if(setHas('odin',3))add('wisdom',1);if(setHas('odin',4))add('hecate',1);
  if(setHas('hades',2))el({thud:.25,vine:.25},1);if(setHas('hades',3))add('souls',1);if(setHas('hades',4))add('hadesSet',1);
  if(setHas('athena',2))add('guard',1);if(setHas('athena',3))s.mres+=20;if(setHas('athena',4))add('aegis',1);
  if(setHas('surtr',2))el({fire:.25},1);if(setHas('surtr',3))s.area+=15;if(setHas('surtr',4))add('surtrSet',1);
  if(setHas('poseidon',2))el({ice:.25},1);if(setHas('poseidon',3))add('chillDmg',1);if(setHas('poseidon',4))fx.iceBurst+=1;
  if(fx.gungnir)add('spearTwin',2*fx.gungnir);if(fx.mjolnir)add('axePlus',2*fx.mjolnir);
  if(fx.keenEye)s.crit+=8*fx.keenEye;if(fx.swift)s.move+=15*fx.swift;if(fx.dodge2)s.move+=15*fx.dodge2;if(fx.atlas)s.move-=10*fx.atlas;
  if(fx.regenPlus)s.regen+=1.5*fx.regenPlus;if(fx.chronos)s.cdr+=25*fx.chronos;
  const hpMul=1+.15*((fx.titan||0)+(fx.titan2||0))+.3*(fx.gaia||0);s.hp=Math.round(s.hp*hpMul);if(fx.gaia)s.regen=s.regen*2+1;
}
/* 이번 타격의 피해 배율 */
function relicDmg(e,kind,heavy){
  let m=1+(ELM[kind]||0)+(ELM.all||0);
  if(heavy&&FX.hecate)m*=1+.4*FX.hecate;
  if(FX.cull&&e.hp<e.maxhp*.3)m*=1+.5*FX.cull;
  if(FX.slayer&&e.elite)m*=1+.3*FX.slayer;
  if(FX.chillDmg&&(e.slow>0||e.ice>0))m*=1.2;
  if(streak&&(FX.rampage||FX.nike))m*=1+Math.min(.5*(FX.rampage||0)+(FX.nike||0),streak*(.01*(FX.rampage||0)+.02*(FX.nike||0)));
  if(soulStack)m*=1+soulStack;
  if(FX.titan||FX.titan2)m*=1+(.1*(FX.titan||0)+.15*(FX.titan2||0))*P.maxhp/250;
  return m;
}
const procDmg=b=>b*(1+P.level*.08);
function relicOnHit(e,kind){
  if(e.dead)return;
  if(FX.zproc&&kind==='zap'&&Math.random()<FX.zproc&&can('zp',300)){const x=e.x,y=e.y;later(.08,()=>strikeAt(x,y,60*AREA,procDmg(40),false));}
  if(FX.rune&&Math.random()<.06*FX.rune&&can('rn',300)){const x=e.x,y=e.y;later(.08,()=>strikeAt(x,y,56*AREA,procDmg(34),false));}
  if(FX.medusa&&!e.boss&&Math.random()<.03*FX.medusa){e.stun=Math.max(e.stun,1.5);reactFx(e,'석화','#c9d1e0');}
}
function relicOnKill(e){
  killCount++;streak++;streakT=3;
  if(FX.hades)soulStack=Math.min(FX.hades,soulStack+.005*FX.hades);
  const heal=.003*(FX.souls||0)+.006*(FX.anubis||0);if(heal&&!P.dead)P.hp=Math.min(P.maxhp,P.hp+P.maxhp*heal);
  if(FX.valk)P.valkT=3;
  if(FX.iceBurst&&(e.slow>0||e.ice>0)&&can('ib',200)){const x=e.x,y=e.y-e.r*.6;later(.03,()=>iceBurst(x,y,procDmg(30)));}
  if(FX.surtrSet&&e.lastK==='fire'&&can('sx',200)){const x=e.x,y=e.y;later(.03,()=>{
    for(const o of enemies){if(o.dead)continue;const dx=o.x-x,dy=o.y-y,d=Math.hypot(dx,dy);if(d<74*AREA+o.r)hitEnemy(o,procDmg(26),dx/(d||1),dy/(d||1),200,'fire',true);}
    starFx(x,y-10,34,'#ffb347');ring(x,y,10,300,'#ffe08a');ember(x,y,6,12,90);flash(x,y,170,.16);if(can('boom',70))SFXH.fire();});}
  if(FX.hadesSet&&killCount%30===0)reap(P.x,P.y,180*AREA,procDmg(90),.25);
}
/* true 면 이번 피해를 막는다: 회피·되돌림·보호막 */
function relicBlock(){
  const dodge=Math.min(.6,.15*(FX.dodge||0)+.25*(FX.dodge2||0)+.25*(FX.rewind||0));
  if(dodge&&Math.random()<dodge){textFx(P.x,P.y-66,FX.rewind?'되돌림':'회피');P.inv=.3;return true;}
  if(FX.aegis&&aegisT<=0){aegisT=12/FX.aegis;textFx(P.x,P.y-66,'보호막','#ffe08a');P.inv=.5;ring(P.x,P.y-20,20,520,'#ffe08a');flash(P.x,P.y-20,260,.25);SFX.wave();
    for(const e of enemies){if(e.dead)continue;const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy);if(d<150+e.r)hitEnemy(e,procDmg(40),dx/(d||1),dy/(d||1),420,'light');}
    return true;}
  return false;
}
const relicTaken=()=>Math.max(.4,1-.1*(FX.guard||0)-.2*(FX.atlas||0));
function relicOnHurt(){
  if(!FX.stormArmor)return;const near=enemies.filter(e=>!e.dead&&Math.hypot(e.x-P.x,e.y-P.y)<260);
  for(let i=0;i<4*FX.stormArmor&&near.length;i++){const t=pick(near),x=t.x,y=t.y;later(i*.06,()=>strikeAt(x,y,56*AREA,procDmg(36),false));}
}
function relicRevive(){
  if(!FX.revive||reviveUsed)return false;reviveUsed=true;P.hp=P.maxhp*.5;P.inv=2;uiBanner('되살아남');flash(P.x,P.y-20,500,.6);ring(P.x,P.y-20,20,640,'#ffe08a');SFX.level();
  for(const e of enemies){const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy)||1;if(d<220){e.kx+=dx/d*600*e.T.kb;e.ky+=dy/d*600*e.T.kb;}}return true;
}
/* 태양 광선: 가까운 적 쪽으로 불기둥이 줄지어 지나간다 */
function sunBeam(){
  const t=nearest(P.x,P.y,520);if(!t)return false;const a=Math.atan2(t.y-P.y,t.x-P.x),dmg=procDmg(70);
  for(let i=1;i<=7;i++){const x=P.x+Math.cos(a)*i*105,y=P.y+Math.sin(a)*i*105;later(i*.045,()=>{
    for(const e of enemies){if(e.dead)continue;const dx=e.x-x,dy=e.y-y,d=Math.hypot(dx,dy);if(d<66*AREA+e.r)hitEnemy(e,dmg,dx/(d||1),dy/(d||1),200,'fire');}
    pillar(x,y,260,34,'#ffd27a');ring(x,y,8,260,'#ffe08a');flash(x,y,170,.14);});}
  SFX.wave();return true;
}
function relicTick(dt){
  if(streakT>0){streakT-=dt;if(streakT<=0)streak=0;}
  if(P.valkT>0)P.valkT-=dt;if(aegisT>0)aegisT-=dt;
  if(FX.ra||FX.ra2){raT-=dt;if(raT<=0)raT=sunBeam()?(FX.ra2?6:9):.5;}
}
/* 다섯 번째 베기마다 검기 세 줄기(엑스칼리버) */
function relicOnSlash(a,dmg){
  slashN++;if(!FX.excalibur||slashN%5)return;
  for(let i=-1;i<=1;i++){const an=a+i*.3;shots.push({k:'crescent',x:P.x,y:P.y-20,vx:Math.cos(an)*600,vy:Math.sin(an)*600,a:an,life:.7,dmg:dmg*.9,r:38,hit:new Set()});}
}
/* 보호막이 준비됐을 때 주인공 둘레에 금빛 고리 */
function renderRelic(){
  if(state!=='play'||P.dead||!FX.aegis||aegisT>0)return;
  ctx.lineWidth=5;ctx.strokeStyle=INK;ctx.beginPath();ctx.ellipse(P.x,P.y-22,26,30,0,0,TAU);ctx.stroke();ctx.lineWidth=2.2;ctx.strokeStyle=`rgba(255,224,138,${.6+.3*Math.sin(clock*5)})`;ctx.stroke();
}
/* 장비 설명에 쓸 세트 정보: [세트 이름, 낀 개수, [효과 글, 켜졌는지]...] */
function setInfo(it){if(!it.set||!SETS[it.set])return null;const n=SETN[it.set]||0;return{name:SETS[it.set].n,n,rows:SETS[it.set].b.map((t,i)=>[`${i+2}세트 · ${t}`,n>=i+2])};}
