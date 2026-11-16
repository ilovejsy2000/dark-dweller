'use strict';
/* 다크 드웰러 — 신화·초월 효과 나누기(11-16 대표님 "아이템별 고유 효과는 초월급에서만, 신화급은 좀 더 약한 기능, 초월 = 약한 능력 + 무기의 고유 효과").
   11-17 대표님 "무협이랑 신이랑 같은데 신화를 낮추라는 거야": 신·무협 똑같이
   신화 장비: 약한 '능력' 하나만 켜진다.
   초월 신화: 약한 능력 + 원래 효과(매화검법·번개 피해 +60% 같은 것) + 초월 효과(무기는 무기마다, 나머지는 부위마다)가 켜진다. */

/* ───── 무협 신화의 약한 능력 ───── */
const WX_WEAK={
  wxPlumW:{t:'매화검기: 치명타 확률 +6% · 베기 피해 +15%',s:{crit:6},el:{cut:.15}},
  wxTianW:{t:'마기: 모든 피해 +10% · 치명타 피해 +15%',s:{critd:15},el:{all:.1}},
  wxTaijiW:{t:'태극의 기: 마법 저항 +12% · 체력 재생 +1/초',s:{mres:12,regen:1}},
  wxPalmW:{t:'용의 기운: 공격 속도 +8% · 모든 피해 +8%',s:{aspd:8},el:{all:.08}},
  wxLingW:{t:'경공: 이동 속도 +12% · 회피 5%',s:{move:12},fx:{dodge:.33}},
  wxShaoW:{t:'금강: 방어 +10 · 체력 재생 +0.8/초',s:{def:10,regen:.8}},
  wxRoarW:{t:'내공: 공격 범위 +8% · 치명타 피해 +15%',s:{area:8,critd:15}},
  wxAcuW:{t:'혈도: 치명타 확률 +5% · 치명타 피해 +15%',s:{crit:5,critd:15}},
  wxWudangW:{t:'도가심법: 쿨타임 -6%',s:{cdr:6}},
};
const WX_WEAK_OF={plum:'wxPlumW',tianmo:'wxTianW',taiji:'wxTaijiW',dragonPalm:'wxPalmW',lingbo:'wxLingW',shaolin:'wxShaoW',lionRoar:'wxRoarW',acupoint:'wxAcuW',wudang:'wxWudangW'};
/* ───── 신 이름 신화의 약한 능력 ───── */
const GOD_WEAK={
  gZeusW:{t:'번개의 기운: 번개 피해 +25%',el:{zap:.25}},
  gGungW:{t:'창술: 냉기 피해 +15% · 물리 피해 +10%',el:{ice:.15,cut:.1}},
  gHadesW:{t:'사신의 기운: 모든 피해 +8% · 치명타 피해 +15%',s:{critd:15},el:{all:.08}},
  gSurtrW:{t:'종말의 불씨: 화염 피해 +25%',el:{fire:.25}},
  gPoseW:{t:'바다의 기운: 냉기 피해 +25%',el:{ice:.25}},
  gExcW:{t:'기사의 검: 물리 피해 +20%',el:{cut:.2}},
  gNikeW:{t:'승리의 기운: 모든 피해 +8%',el:{all:.08}},
  gAnubW:{t:'영원의 기운: 체력 재생 +1/초 · 마법 저항 +8%',s:{regen:1,mres:8}},
  gAegisW:{t:'수호: 방어 +10 · 받는 피해 -5%',s:{def:10},fx:{guard:.5}},
  gWisW:{t:'지혜: 경험치 +15%',s:{xp:15}},
  gTitanW:{t:'신력: 방어 +8 · 모든 피해 +8%',s:{def:8},el:{all:.08}},
  gRewW:{t:'시간의 틈: 회피 5% · 방어 +6',s:{def:6},fx:{dodge:.33}},
  gMjolW:{t:'뇌신의 손: 번개 피해 +15% · 공격 속도 +6%',s:{aspd:6},el:{zap:.15}},
  gGaiaW:{t:'대지의 숨: 체력 재생 +1.5/초',s:{regen:1.5}},
  gHermW:{t:'바람의 날개: 이동 속도 +10% · 회피 5%',s:{move:10},fx:{dodge:.33}},
  gChronW:{t:'시간의 모래: 쿨타임 -8%',s:{cdr:8}},
  gFateW:{t:'운명의 실: 경험치 +12% · 치명타 확률 +3%',s:{xp:12,crit:3}},
  gErebW:{t:'심연: 암흑·독 피해 +25%',el:{thud:.25,vine:.25}},
  gLokiW:{t:'속임수: 치명타 확률 +5% · 치명타 피해 +15%',s:{crit:5,critd:15}},
  gHecW:{t:'마녀의 인장: 모든 피해 +10%',el:{all:.1}},
  gRaW:{t:'태양의 기운: 모든 피해 +6% · 체력 재생 +0.5/초',s:{regen:.5},el:{all:.06}},
};
const GOD_WEAK_OF={zeus:'gZeusW',gungnir:'gGungW',hades:'gHadesW',surtr:'gSurtrW',poseidon:'gPoseW',excalibur:'gExcW',nike:'gNikeW',anubis:'gAnubW',aegis:'gAegisW',wisdom:'gWisW',titan2:'gTitanW',rewind:'gRewW',mjolnir:'gMjolW',gaia:'gGaiaW',dodge2:'gHermW',chronos:'gChronW',fate:'gFateW',erebus:'gErebW',echo2:'gLokiW',hecate:'gHecW',ra2:'gRaW'};
const WEAK=Object.assign({},WX_WEAK,GOD_WEAK);
/* 신 이름 신화 무기의 고유 효과 */
const GOD_UNIQ_OF={zeus:'thunderJ',gungnir:'gungThrow',hades:'wraith',surtr:'flameRing',poseidon:'tide',excalibur:'holyBlade'};
/* 신 이름 신화(무기 말고)의 부위별 초월 효과 */
const PRIME_SLOT_FX={weapon:'holyBlade',helm:'heavenRay',armor:'primeShield',glove:'doubleHit',belt:'lifeSpring',boots:'galeTrail',amulet:'timeStop',ear:'resonance',ring:'starfall'};
Object.assign(FXS,{
  thunderJ:'천둥 심판: 6초마다 가장 강한 적 셋에게 금빛 벼락이 떨어져 잠깐 기절시킴',
  gungThrow:'궁니르 투척: 7초마다 창을 던져 일직선으로 꿰뚫고 되돌아옴',
  wraith:'망령 소환: 40마리 처치마다 망령이 5초 동안 둘레를 돌며 적을 벰',
  flameRing:'종말의 불기둥: 8초마다 둘레에 불기둥 여덟 개가 고리처럼 솟음',
  tide:'해일: 9초마다 가까운 적 쪽으로 파도가 밀려가 적을 밀어내고 느리게 함',
  holyBlade:'성검 해방: 10초마다 가까운 적 쪽으로 길게 뻗는 빛의 검기(관통)',
  heavenRay:'천상의 시선: 10초마다 가장 강한 적에게 빛줄기가 내리꽂힘',
  primeShield:'초월 보호막: 20초마다 3초 동안 무적',
  doubleHit:'연격: 맞힐 때 12% 확률로 한 번 더 벰',
  lifeSpring:'생명의 샘: 체력이 30% 아래로 떨어지면 체력 40% 회복(40초에 한 번)',
  galeTrail:'질풍: 움직인 자리에 바람 칼날이 남아 지나가는 적을 벰',
  timeStop:'시간 정지: 25초마다 2초 동안 둘레 적이 멈춤',
  resonance:'공명: 맞힐 때 6% 확률로 빛이 터져 둘레 적에게 피해',
  starfall:'별의 축복: 12초마다 별똥별 다섯 개가 적에게 떨어짐',
});
for(const k in WEAK)FXS[k]=WEAK[k].t;
for(const t in MYTHS)for(const d of MYTHS[t]){
  d.weak=(d.art?WX_WEAK_OF[d.fx]:GOD_WEAK_OF[d.fx])||null;
  d.uniq=[d.fx,GOD_UNIQ_OF[d.fx]||PRIME_SLOT_FX[t]].filter(Boolean);
}
const mythDef=it=>it&&it.gi===4?(MYTHS[it.t]||[])[it.my]:null;
/* 이 장비가 켜는 효과들: [[이름표, 효과 키, 켜졌는지]] */
function itemFxRows(it){
  const d=mythDef(it);
  if(!d)return it.fx?[['능력',it.fx,true]]:[];
  const r=[];if(d.weak)r.push(['능력',d.weak,true]);for(const u of d.uniq)r.push(['초월 고유 효과',u,!!it.prime]);return r;}
const itemFxList=it=>itemFxRows(it).filter(r=>r[2]).map(r=>r[1]);
const itemFxText=it=>itemFxList(it).map(k=>FXS[k]).filter(Boolean).join(' · ');

/* ───── 능력치에 더하기(relicRecalc 안에서) ───── */
function primeRecalc(s,fx,el){
  for(const k in WEAK){const n=fx[k];if(!n)continue;const W=WEAK[k];
    if(W.s)for(const st in W.s)s[st]=(s[st]||0)+W.s[st]*n;if(W.el)el(W.el,n);if(W.fx)for(const f in W.fx)fx[f]=(fx[f]||0)+W.fx[f]*n;}
}

/* ───── 움직이는 고유 효과 ───── */
let PR={},primeGhosts=[],primeGales=[];
function primeReset(){PR={tj:3,gt:3.5,fr:4,td:4.5,hb:5,hr:5,ps:20,ls:0,ts:12,sf:6,gl:0,wk:0};primeGhosts=[];primeGales=[];}
primeReset();
const byHp=(R)=>enemies.filter(e=>!e.dead&&Math.hypot(e.x-P.x,e.y-P.y)<R).sort((a,b)=>b.hp-a.hp);
/* 한 줄로 지나가며 맞히기 */
function primeLine(a,steps,gap,R,dmg,kind,col,after){
  const x0=P.x,y0=P.y,seen=new Set();
  for(let i=1;i<=steps;i++){const x=x0+Math.cos(a)*i*gap,y=y0+Math.sin(a)*i*gap;later(i*.035,()=>{
    for(const e of enemies){if(e.dead||seen.has(e))continue;const dx=e.x-x,dy=e.y-y,d=Math.hypot(dx,dy);if(d<R*AREA+e.r){seen.add(e);hitEnemy(e,dmg,Math.cos(a),Math.sin(a),after?420:220,kind,false,true);if(after)after(e);}}
    ring(x,y-10,6,R*3,col);flash(x,y-10,R*1.8,.12);});}
}
function primeTick(dt){
  if(state!=='play'||P.dead)return;
  const tgt=()=>nearest(P.x,P.y,620);
  if(FX.thunderJ&&(PR.tj-=dt)<=0){const t=byHp(640).slice(0,3);PR.tj=t.length?6:.6;
    t.forEach((e,i)=>{const x=e.x,y=e.y;later(i*.12,()=>strikeAt(x,y,62*AREA,procDmg(70)*FX.thunderJ,true,true,true));});if(t.length)textFx(P.x,P.y-70,'천둥 심판','#ffe08a');}
  if(FX.gungThrow&&(PR.gt-=dt)<=0){const t=tgt();PR.gt=t?7:.6;if(t){const a=Math.atan2(t.y-P.y,t.x-P.x);
    primeLine(a,9,70,40,procDmg(55)*FX.gungThrow,'ice','#bfe9ff');
    later(.45,()=>{const b=a,x0=P.x+Math.cos(b)*630,y0=P.y+Math.sin(b)*630;const seen=new Set();for(let i=1;i<=9;i++){const x=x0-Math.cos(b)*i*70,y=y0-Math.sin(b)*i*70;later(i*.03,()=>{for(const e of enemies){if(e.dead||seen.has(e))continue;const d=Math.hypot(e.x-x,e.y-y);if(d<40*AREA+e.r){seen.add(e);hitEnemy(e,procDmg(35)*FX.gungThrow,-Math.cos(b),-Math.sin(b),160,'cut',false,true);}}ring(x,y-10,6,100,'#d8f2ff');});}});
    textFx(P.x,P.y-70,'궁니르','#bfe9ff');if(can('pw',200))SFX.wave();}}
  if(FX.flameRing&&(PR.fr-=dt)<=0){PR.fr=8;const R=150*AREA;
    for(let i=0;i<8;i++){const an=i/8*TAU,x=P.x+Math.cos(an)*R,y=P.y+Math.sin(an)*R;later(i*.04,()=>{
      for(const e of enemies){if(e.dead)continue;const dx=e.x-x,dy=e.y-y,d=Math.hypot(dx,dy);if(d<58*AREA+e.r)hitEnemy(e,procDmg(45)*FX.flameRing,dx/(d||1),dy/(d||1),200,'fire',false,true);}
      pillar(x,y,240,30,'#ff9a3c');ring(x,y,8,220,'#ffd27a');ember(x,y,5,10,90);});}
    if(can('boom',70))SFXH.fire();}
  if(FX.tide&&(PR.td-=dt)<=0){const t=tgt();PR.td=t?9:.6;if(t){const a=Math.atan2(t.y-P.y,t.x-P.x),n=-Math.sin(a),m=Math.cos(a);
    for(const off of[-70,0,70]){const ox=n*off,oy=m*off;const x0=P.x,y0=P.y;const seen=new Set();for(let i=1;i<=8;i++){const x=x0+ox+Math.cos(a)*i*70,y=y0+oy+Math.sin(a)*i*70;later(i*.05,()=>{
      for(const e of enemies){if(e.dead||seen.has(e))continue;const d=Math.hypot(e.x-x,e.y-y);if(d<46*AREA+e.r){seen.add(e);e.slow=Math.max(e.slow,2);hitEnemy(e,procDmg(30)*FX.tide,Math.cos(a),Math.sin(a),520,'ice',false,true);}}
      ring(x,y-6,6,180,'#7fd6ff');ember(x,y,3,8,60,'#bfefff');});}}
    textFx(P.x,P.y-70,'해일','#7fd6ff');if(can('pw',200))SFX.wave();}}
  if(FX.holyBlade&&(PR.hb-=dt)<=0){const t=tgt();PR.hb=t?10:.6;if(t){const a=Math.atan2(t.y-P.y,t.x-P.x);
    primeLine(a,11,72,44,procDmg(80)*FX.holyBlade,'light','#fff3c4');shots.push({k:'crescent',x:P.x,y:P.y-20,vx:Math.cos(a)*900,vy:Math.sin(a)*900,a,life:.85,dmg:0,r:44,hit:new Set()});
    textFx(P.x,P.y-70,'성검 해방','#fff3c4');if(can('pw',200))SFX.wave();}}
  if(FX.heavenRay&&(PR.hr-=dt)<=0){const t=byHp(650)[0];PR.hr=t?10:.6;if(t){const x=t.x,y=t.y;pillar(x,y,420,40,'#fff6d0');flash(x,y,260,.25);ring(x,y,10,320,'#ffe08a');
    for(const e of enemies){if(e.dead)continue;const dx=e.x-x,dy=e.y-y,d=Math.hypot(dx,dy);if(d<70*AREA+e.r)hitEnemy(e,procDmg(110)*FX.heavenRay,dx/(d||1),dy/(d||1),200,'light',false,true);}}}
  if(FX.primeShield&&(PR.ps-=dt)<=0){PR.ps=20;P.inv=Math.max(P.inv,3);textFx(P.x,P.y-70,'초월 보호막','#ffe08a');ring(P.x,P.y-20,20,360,'#ffe08a');}
  if(PR.ls>0)PR.ls-=dt;
  if(FX.lifeSpring&&PR.ls<=0&&P.hp<P.maxhp*.3){PR.ls=40;P.hp=Math.min(P.maxhp,P.hp+P.maxhp*.4);textFx(P.x,P.y-70,'생명의 샘','#8dffb0');ring(P.x,P.y-20,20,300,'#8dffb0');flash(P.x,P.y-20,240,.2);}
  if(FX.timeStop&&(PR.ts-=dt)<=0){PR.ts=25;let n=0;for(const e of enemies){if(e.dead)continue;if(Math.hypot(e.x-P.x,e.y-P.y)<320*AREA){e.stun=Math.max(e.stun,e.boss?.6:2);n++;}}
    textFx(P.x,P.y-70,'시간 정지','#d9c7ff');ring(P.x,P.y-20,30,900,'#d9c7ff');flash(P.x,P.y-20,420,.3);}
  if(FX.starfall&&(PR.sf-=dt)<=0){const pool=enemies.filter(e=>!e.dead&&Math.hypot(e.x-P.x,e.y-P.y)<560);PR.sf=pool.length?12:.6;
    for(let i=0;i<5&&pool.length;i++){const e=pick(pool),x=e.x+rand(-20,20),y=e.y+rand(-20,20);later(.1+i*.12,()=>{
      for(const o of enemies){if(o.dead)continue;const dx=o.x-x,dy=o.y-y,d=Math.hypot(dx,dy);if(d<60*AREA+o.r)hitEnemy(o,procDmg(50)*FX.starfall,dx/(d||1),dy/(d||1),180,'light',false,true);}
      pillar(x,y,320,18,'#fff0b0');starFx(x,y-10,30,'#fff0b0');ring(x,y,8,240,'#ffe08a');});}}
  /* 질풍: 움직인 자리에 바람 칼날 */
  if(FX.galeTrail&&P.move&&(PR.gl-=dt)<=0){PR.gl=.22;primeGales.push({x:P.x,y:P.y,life:1.4,t:0});}
  for(const g of primeGales){g.life-=dt;g.t-=dt;if(g.t<=0){g.t=.35;for(const e of enemies){if(e.dead)continue;const d=Math.hypot(e.x-g.x,e.y-g.y);if(d<34*AREA+e.r)hitEnemy(e,procDmg(14)*(FX.galeTrail||1),0,0,60,'cut',true);}}}
  primeGales=primeGales.filter(g=>g.life>0);
  /* 망령 */
  for(const w of primeGhosts){w.life-=dt;w.a+=dt*3.2;w.x=P.x+Math.cos(w.a)*120;w.y=P.y-20+Math.sin(w.a)*80;w.t-=dt;
    if(w.t<=0){w.t=.25;for(const e of enemies){if(e.dead)continue;const dx=e.x-w.x,dy=e.y-w.y,d=Math.hypot(dx,dy);if(d<52*AREA+e.r)hitEnemy(e,procDmg(22)*(FX.wraith||1),dx/(d||1),dy/(d||1),140,'thud',true);}}}
  primeGhosts=primeGhosts.filter(w=>w.life>0);
}
function primeHit(e){
  if(e.dead)return;
  if(FX.doubleHit&&Math.random()<.12*FX.doubleHit&&can('dh',120)){const x=e.x,y=e.y;later(.08,()=>{if(!e.dead){slashes.push({x,y:y-20,a:Math.random()*TAU,R:46,life:.16,max:.16});hitEnemy(e,procDmg(22)*FX.doubleHit,0,0,80,'cut',true);}});}
  if(FX.resonance&&Math.random()<.06*FX.resonance&&can('rs',250)){const x=e.x,y=e.y;later(.05,()=>{
    for(const o of enemies){if(o.dead)continue;const dx=o.x-x,dy=o.y-y,d=Math.hypot(dx,dy);if(d<70*AREA+o.r)hitEnemy(o,procDmg(26)*FX.resonance,dx/(d||1),dy/(d||1),160,'light',true);}
    ring(x,y-10,8,260,'#fff3c4');flash(x,y-10,150,.14);});}
}
function primeKill(){
  if(FX.wraith){PR.wk++;if(PR.wk>=40){PR.wk=0;primeGhosts.push({a:Math.random()*TAU,x:P.x,y:P.y,life:5,t:0});textFx(P.x,P.y-70,'망령 소환','#c9a2ff');}}
}
function primeRender(){
  if(state!=='play')return;
  for(const g of primeGales){ctx.globalAlpha=Math.min(1,g.life)*.55;ctx.strokeStyle='#cfefff';ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(g.x,g.y-8,14,clock*6,clock*6+2.2);ctx.stroke();ctx.beginPath();ctx.arc(g.x,g.y-8,9,clock*6+3.1,clock*6+5);ctx.stroke();}
  for(const w of primeGhosts){ctx.globalAlpha=Math.min(1,w.life)*.85;ctx.fillStyle='rgba(180,130,255,.35)';ctx.beginPath();ctx.ellipse(w.x,w.y,22,26,0,0,TAU);ctx.fill();
    ctx.fillStyle='#efe2ff';ctx.beginPath();ctx.ellipse(w.x,w.y-2,10,13,0,0,TAU);ctx.fill();ctx.fillStyle='#2a1450';ctx.beginPath();ctx.arc(w.x-3.5,w.y-4,1.8,0,TAU);ctx.arc(w.x+3.5,w.y-4,1.8,0,TAU);ctx.fill();}
  ctx.globalAlpha=1;
}
