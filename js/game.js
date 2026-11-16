'use strict';
/* 다크 드웰러 — 규칙: 저장, 장비, 능력치, 한 판의 진행, 스킬, 전투 */

/* ───── 저장 (이 기기에만). v2: 장비가 '정해진 이름 + 최대치' 방식으로 바뀌어 옛 저장과 섞지 않는다 ───── */
const SAVE_KEY='darkdweller.save.v2';
let SAVE={v:2,seq:1,equip:{},stash:[],best:{},mode:0};
function saveNow(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(SAVE));}catch(_){}}
function loadSave(){
  try{const s=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');if(s&&s.v===2&&Array.isArray(s.stash)&&s.equip)SAVE=Object.assign(SAVE,s);}catch(_){}
  migrateSave();
  if(!SAVE.started){SAVE.started=1;const it=makeItem(0,0,'weapon');it.b=0;it.name='낡은 장검';it.lines=[{k:'dmg',v:lineRange('dmg',0)[0]}];SAVE.equip.weapon1=it;saveNow();}
}
/* 체력 기준을 2.5배(100 → 250)로 올리면서, 이미 가진 장비의 체력·재생 줄도 같은 비율로 한 번만 올린다 */
function migrateSave(){if(SAVE.hp2)return;SAVE.hp2=1;for(const it of SAVE.stash.concat(Object.values(SAVE.equip)))for(const l of(it&&it.lines)||[]){if(l.k==='hp')l.v=Math.round(l.v*2.5);else if(l.k==='regen')l.v=Math.round(l.v*20)/10;}saveNow();}
function exportSave(){return btoa(unescape(encodeURIComponent(JSON.stringify(SAVE))));}
function importSave(code){
  try{const s=JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
    if(!s||s.v!==2||!Array.isArray(s.stash)||!s.equip||typeof s.equip!=='object')return false;
    SAVE=s;migrateSave();saveNow();recalc();return true;}catch(_){return false;}
}

/* ───── 장비 ───── */
function rollType(){let t=0;for(const k in SLOT_TYPES)t+=SLOT_TYPES[k].w;let r=Math.random()*t;for(const k in SLOT_TYPES){r-=SLOT_TYPES[k].w;if(r<=0)return k;}return'ring';}
function rollGrade(min,boost){const pool=GRADES.map((g,i)=>i<min?0:g.w*(i===2?boost:i>=3?Math.min(2.5,1+(boost-1)*.2)*(i===4?(MAP.myth||1):1):1)); /* MAP.myth: 그 맵의 신화 배수(11-16) */let r=Math.random()*pool.reduce((a,b)=>a+b,0);for(let i=0;i<pool.length;i++){r-=pool[i];if(r<=0)return i;}return min;}
function rollLine(k,gi,floor){const[a,b]=lineRange(k,gi),v=a+(b-a)*(floor+(1-floor)*Math.random());return STAT[k].dec?Math.round(v*10)/10:Math.round(v);}
/* floor: 굴림 바닥값(0~0.6). 높을수록 최대치에 가깝게 나온다 */
function makeItem(gi,floor,type){
  const tk=type||rollType(),ex={};let def,name,fx=null;
  if(gi===4){ex.my=Math.random()*MYTHS[tk].length|0;def=MYTHS[tk][ex.my];name=def.n;fx=def.fx;if(def.set)ex.set=def.set;if(Math.random()<PRIME.p){ex.prime=1;name=PRIME.k+' · '+name;}}
  else if(gi===3){ex.lg=Math.random()*LEGENDS[tk].length|0;const L=LEGENDS[tk][ex.lg];ex.b=L.b;def=ITEM_BASES[tk][L.b];name=L.n;fx=L.fx;if(L.set)ex.set=L.set;}
  else{ex.b=Math.random()*ITEM_BASES[tk].length|0;def=ITEM_BASES[tk][ex.b];name=pick(PREFIX[gi])+' '+def.n;}
  const lines=def.l.slice(0,GRADES[gi].n).map(k=>{let v=rollLine(k,gi,floor||0);if(ex.prime)v=STAT[k].dec?Math.round(v*PRIME.m*10)/10:Math.round(v*PRIME.m);return{k,v};});
  return Object.assign({id:SAVE.seq++,t:tk,gi,name,lines,fx},ex);
}
/* 완성도: 각 줄이 범위 안에서 얼마나 높게 나왔는지(0~100) */
/* 그 장비의 한 줄이 가질 수 있는 범위(초월 신화는 1.5배) */
function itemRange(it,k){const[a,b]=lineRange(k,it.gi);if(!it.prime)return[a,b];const f=v=>STAT[k].dec?Math.round(v*PRIME.m*10)/10:Math.round(v*PRIME.m);return[f(a),f(b)];}
const gradeColor=it=>it.prime?PRIME.c:GRADES[it.gi].c,gradeName=it=>it.prime?PRIME.k+' 신화':GRADES[it.gi].k;
function itemQuality(it){let s=0;for(const l of it.lines){const[a,b]=itemRange(it,l.k);s+=b>a?clamp((l.v-a)/(b-a),0,1):1;}return Math.round(s/it.lines.length*100);}
const itemScore=it=>it.gi*1000+(it.prime?500:0)+itemQuality(it);
function slotsOf(type){return EQUIP_SLOTS.filter(s=>s[1]===type).map(s=>s[0]);}
/* 낄 자리: 빈 칸 → 방금 누른 칸 → 가장 약한 것이 든 칸 */
function targetSlot(type,prefer){const ks=slotsOf(type),empty=ks.find(k=>!SAVE.equip[k]);if(empty)return empty;if(prefer&&ks.includes(prefer))return prefer;
  return ks.reduce((a,b)=>itemScore(SAVE.equip[a])<=itemScore(SAVE.equip[b])?a:b);}
function equipItem(it,slotKey){const i=SAVE.stash.indexOf(it);if(i<0)return;const old=SAVE.equip[slotKey];SAVE.stash.splice(i,1);if(old)SAVE.stash.push(old);SAVE.equip[slotKey]=it;recalc();saveNow();}
function unequipSlot(slotKey){const it=SAVE.equip[slotKey];if(!it||SAVE.stash.length>=STASH_MAX)return false;delete SAVE.equip[slotKey];SAVE.stash.push(it);recalc();saveNow();return true;}
/* 버리기 = 분해: 등급만큼 마력 가루(재련 재료)가 남는다(11-15) */
function discardItem(it){const i=SAVE.stash.indexOf(it);if(i>=0){SAVE.stash.splice(i,1);SAVE.dust=(SAVE.dust||0)+dustOf(it);saveNow();}}
function discardGrade(gi){for(const it of SAVE.stash)if(it.gi===gi)SAVE.dust=(SAVE.dust||0)+dustOf(it);SAVE.stash=SAVE.stash.filter(it=>it.gi!==gi);saveNow();}

/* ───── 능력치 ───── */
let ST={},FX={},AREA=1;
function recalc(){
  const s={dmg:0,aspd:0,crit:5,critd:150,hp:250,def:0,mres:0,move:0,pick:0,xp:0,luck:0,cdr:0,regen:0,area:0},fx={};
  for(const[sk]of EQUIP_SLOTS){const it=SAVE.equip[sk];if(!it)continue;for(const l of it.lines)s[l.k]+=l.v;if(it.fx)fx[it.fx]=(fx[it.fx]||0)+1;}
  if(state==='play')for(const id in P.pas){const p=PASSIVES[id];s[p.stat]+=p.v*P.pas[id];if(p.stat2)s[p.stat2]+=p.v2*P.pas[id];}
  talentApply(s);relicRecalc(s,fx);
  s.cdr=Math.min(35,s.cdr);s.move=clamp(s.move,-50,100);s.crit=Math.min(100,s.crit);s.mres=Math.min(75,s.mres);
  ST=s;FX=fx;AREA=softArea(1+s.area/100);P.maxhp=s.hp;P.hp=state==='play'?Math.min(P.hp,P.maxhp):P.maxhp;
}

/* ───── 한 판의 상태 ───── */
let state='lobby',clock=0,runT=0,trauma=0,freeze=0,kills=0,spawnAcc=0,nextBoss=BOSS_EVERY,nextElite=ELITE_FROM,nextHorde=HORDE_FROM,nextBurn=BURN_FROM,hordeT=0,burnT=0,miniDone=false,lastBoss=null,bossSince=0,
  xpCombo=0,xpComboT=0,pendingLv=0,choosing=false,ending=null,bossRef=null,cine=null,bossMood=0,mode=MODES[0],MAP=MAPS[0],fullT=0;
/* 맵 고르기: 땅 색을 바꾸고 그려 둔 땅 조각을 버린다 */
function setMap(i){MAP=MAPS[i]||MAPS[0];SAVE.map=MAPS.indexOf(MAP);Object.assign(MAPC,MAP.pal);chunks.clear();propMap.clear();}
const bestKey=()=>RUN.daily?'오늘의 도전':MAP.rift?'굴레':MAP===MAPS[0]?mode.k:MAP.k+'·'+mode.k;
const curFloor=()=>Math.min(.8,rollFloor(runT/60)+MAP.floor);
const cam={x:0,y:-20},kick={x:0,y:0};
const P={x:-52,y:30,hp:100,maxhp:100,spd:168,dir:1,move:false,inv:0,dead:false,level:1,xp:0,need:needXp(1),swing:-1,act:{},pas:{},pk:{},cds:{},bladeA:0};
let enemies=[],bolts=[],shots=[],axes=[],meteors=[],zones=[],waves=[],blades=[],storms=[],orbs=[],saws=[],eshots=[],warns=[],laters=[],gems=[],drops=[],parts=[],splats=[],slashes=[],zaps=[],flashes=[],runLoot=[];
function clearWorld(){enemies=[];bolts=[];shots=[];axes=[];meteors=[];zones=[];waves=[];blades=[];storms=[];orbs=[];saws=[];eshots=[];warns=[];laters=[];gems=[];drops=[];parts=[];splats=[];slashes=[];zaps=[];flashes=[];clear2();clearWorld2();}
function startRun(mi,rt){
  rift=null;RUN=runInit();if(rt)mode={k:'굴레',t:0};else{mode=Object.assign({},MODES[mi]);if(mode.t<0)mode.t=MAP.clear;SAVE.m2=mi;}clearWorld();runLoot=[];
  runT=0;trauma=0;freeze=0;kills=0;spawnAcc=0;nextBoss=BOSS_EVERY;nextElite=ELITE_FROM;nextHorde=HORDE_FROM;nextBurn=BURN_FROM;hordeT=0;burnT=0;miniDone=false;lastBoss=null;bossSince=0;pendingLv=0;choosing=false;ending=null;bossRef=null;cine=null;fullT=0;
  Object.assign(P,{x:-52,y:30,dir:1,move:false,inv:0,dead:false,level:1,xp:0,need:needXp(1),swing:-1,act:{slash:1},pas:{},pk:{},cds:{},bladeA:0});
  state='play';relicReset();recalc();calcPerks('slash');P.hp=P.maxhp;cam.x=P.x;cam.y=P.y-20;initWorld();if(rt)riftBegin(rt);else newbieEase();
}
function toLobby(){state='lobby';clearWorld();ending=null;bossRef=null;cine=null;burnT=0;hordeT=0;Object.assign(P,{x:-52,y:30,dir:1,move:false,dead:false,swing:-1,inv:0});recalc();}
const viewRad=()=>Math.hypot(W,H)/(2*S);
function later(t,fn){laters.push({t,fn});}
/* 보스가 나올 때: 멀리 있는 잔챙이를 걷어 40마리 안쪽으로 */
function thinOut(){const small=enemies.filter(e=>!e.dead&&!e.elite&&!e.boss).sort((a,b)=>Math.hypot(b.x-P.x,b.y-P.y)-Math.hypot(a.x-P.x,a.y-P.y));
  for(let i=0;i<small.length-40;i++){const e=small[i];e.dead=true;if(i<30)puff(e.x,e.y-e.r*.6,2,'#5a5070');}}

/* ───── 효과 ───── */
function addP(o){if(parts.length<560)parts.push(o);}
const fmtNum=n=>n>=1e4?(n/1e4).toFixed(1)+'만':String(n);
function numFx(x,y,n,crit){if(!crit&&parts.length>220)return;addP({k:'num',dmg:1,x,y,vy:-52,txt:fmtNum(n),col:crit?'#eef1f8':'#c3c8d6',size:crit?18:12,life:crit?.6:.4,max:crit?.6:.4});} /* 피해 숫자: 회색·반투명(11-16) */
function textFx(x,y,txt,col){addP({k:'num',x,y,vy:-46,txt,col:col||'#9fe8ff',size:20,life:.8,max:.8});}
function starFx(x,y,size,col){addP({k:'star',x,y,rot:Math.random()*TAU,size,col:col||'#ffe066',n:4+(Math.random()*3|0),life:.1,max:.1});}
function debris(x,y,cols,n,pow){for(let i=0;i<n;i++){const a=Math.random()*TAU,v=rand(40,150)*pow;addP({k:'deb',x,y,z:rand(8,22),vx:Math.cos(a)*v,vy:Math.sin(a)*v*.6,vz:rand(120,260)*pow,rot:Math.random()*TAU,vr:rand(-9,9),size:rand(3.5,7),col:pick(cols),life:rand(.7,1.2)});}}
function puff(x,y,n,col){for(let i=0;i<n;i++){const a=Math.random()*TAU;addP({k:'puff',x:x+Math.cos(a)*6,y:y+Math.sin(a)*4,vx:Math.cos(a)*rand(20,60),vy:Math.sin(a)*rand(10,34)-12,r:rand(5,9),life:.42,max:.42,col:col||'#cfc6dc'});}}
function ember(x,y,n,spread,up,col){for(let i=0;i<n;i++)addP({k:'ember',x:x+rand(-spread,spread),y:y+rand(-spread,spread)*.5,vx:rand(-22,22),vy:-rand(up*.5,up),size:rand(1.4,3),life:rand(.5,1.3),max:1.3,col:col||(Math.random()<.5?'#ffb347':'#ffe08a')});}
function ring(x,y,r,vr,col){addP({k:'ring',x,y,r,vr,col:col||'#f3e6c8',life:.3,max:.3});}
function pillar(x,y,h,w,col){addP({k:'pillar',x,y,h,w,col,life:.28,max:.28});}
function flash(x,y,r,life){flashes.push({x,y,r,life,max:life});}
function shake(a){trauma=Math.min(1,trauma+a);}
function buzz(ms){if(reduce||!CFG.vib)return;try{navigator.vibrate&&navigator.vibrate(ms);}catch(_){}}

/* ───── 전투 ───── */
/* 쿨타임: 기본의 1.4배로 느리게(11-14 대표님 "스킬 속도를 줄여야"). 공격 속도·쿨타임 감소를 다 모아도 기본의 55% 아래로는 안 내려간다 */
const CD_SLOW=1.6,cdOf=c=>Math.max(c*.55,c/(1+(ST.aspd+(P.valkT>0?15*(FX.valk||0):0))/100)*(1-ST.cdr/100))*CD_SLOW;
const lootBoost=()=>1+runT/60*.08+ST.luck*.01+MAP.loot;
function reactFx(e,txt,col){if(can('rx',220))textFx(e.x,e.y-e.r*2.4,txt,col);}
function nearest(x,y,max,skip){let b=null,bd=max*max;for(const e of enemies){if(e.dead||(skip&&skip.has(e)))continue;const dx=e.x-x,dy=e.y-y,d=dx*dx+dy*dy;if(d<bd){bd=d;b=e;}}return b;}
const SPARK={cut:'#fff6dc',fire:'#ffb347',zap:'#bfe9ff',ice:'#d8f6ff',thud:'#ffe066',vine:'#9cd16a',light:'#fff1c2'};
/* 맞은 적에게만 보이는 작은 효과(화면 전체는 흔들지 않는다) */
function hitSpark(e,nx,ny,kind,crit){
  const x=e.x-nx*e.r*.4+rand(-5,5),y=e.y-e.r*.9+rand(-5,5);
  if(kind==='fire')ember(x,y,crit?4:2,6,50);
  else if(kind==='ice'){if(crit||Math.random()<.4)starFx(x,y,crit?22:11,SPARK.ice);if(crit)debris(e.x,e.y,['#bfe9ff','#f4fcff'],2,.7);}
  else if(crit||Math.random()<.4)starFx(x,y,crit?24:11,SPARK[kind]||SPARK.thud);
  if(crit)debris(e.x,e.y,e.T.deb,1,.9);
}
/* kind 소리·불꽃 종류, quiet 장판·중독처럼 자주 들어가는 피해, heavy 상위 스킬용(치명타 때 화면이 크게 반응) */
function hitEnemy(e,base,nx,ny,kb,kind,quiet,heavy){
  if(e.dead)return;if(e.sleep)wakeGuard(e);
  let d=base*(1+ST.dmg/100)*rand(.88,1.12)*relicDmg(e,kind,heavy)*GIM.dmg*RUN.pdmg;e.lastK=kind;
  if(FX.firstBlood&&e.hp>=e.maxhp)d*=1+.4*FX.firstBlood;
  if(e.weak>0)d*=1.2;
  /* 적의 방어(베기·둔기)와 마법 저항(불·번개·얼음·독·빛) */
  const phys=kind==='cut'||kind==='thud',rs=((phys?e.def:e.mres)||0)*(FX.yicheon?.5:1);if(rs){d*=1-rs;if(rs>=.4&&can('rs',1500))textFx(e.x,e.y-e.r*2.6,phys?'단단함':'저항','#9aa3bf');}
  /* 원소 반응: 얼거나 느려진 적 + 불 = 융해(피해 1.6배), 멈춘 적 + 베기 = 급소(치명타 확정), 불타는 적 + 번개 = 과부하(주위 폭발) */
  let crit=Math.random()*100<ST.crit;
  if(kind==='fire'&&(e.ice>0||e.slow>0)){d*=1.6;e.ice=0;e.slow=0;reactFx(e,'융해','#ffb347');}
  else if(kind==='cut'&&e.stun>0&&!e.boss&&!crit){crit=true;reactFx(e,'급소','#fff6dc');}
  if(crit){d*=ST.critd/100;wuxCrit();}
  d=Math.max(1,Math.round(d));
  e.hp-=d;e.flash=.11;e.hitT=.16;const k=kb*1.2*e.T.kb/e.sc;e.kx+=nx*k;e.ky+=ny*k;
  if(crit||clock-(e.nT||-9)>.28){e.nT=clock;numFx(e.x+rand(-9,9),e.y-e.r*1.7-rand(0,12),d,crit);} // 보통 피해 숫자는 적마다 0.28초에 하나만
  if(crit&&(FX.echo||FX.echo2)&&Math.random()<.2*(FX.echo||0)+.35*(FX.echo2||0)){e.hp-=d;numFx(e.x+rand(-14,14),e.y-e.r*2.3,d,true);}
  if(!quiet){hitSpark(e,nx,ny,kind,crit);hitSound(kind,crit);
    if(crit&&can('cf',160)){shake(.07);freeze=Math.max(freeze,.022);kick.x+=nx*3;kick.y+=ny*3;}} // 치명타: 아주 짧게 멈칫
  relicOnHit(e,kind);
  if(kind==='zap'&&e.dotT>0&&e.dotK==='fire'&&e.ovT<=0){e.ovT=1.2;reactFx(e,'과부하','#bfe9ff');starFx(e.x,e.y-e.r,30,'#bfe9ff');ring(e.x,e.y,8,300,'#ffb347');
    for(const o of enemies){if(o===e||o.dead)continue;const ox=o.x-e.x,oy=o.y-e.y,od=Math.hypot(ox,oy);if(od<78+o.r)hitEnemy(o,base*.6,ox/(od||1),oy/(od||1),160,'thud',true);}}
  /* 조합 스킬의 치명타만 화면이 크게 반응한다(너무 잦지 않게 0.35초에 한 번) */
  if(heavy&&crit&&can('heavy',350)){shake(.2);freeze=Math.max(freeze,.045);buzz(10);}
  if(FX.execute&&!e.boss&&e.hp>0&&e.hp<e.maxhp*.15)e.hp=0;
  if(e.hp<=0)killEnemy(e);
}
function setDot(e,dps,t,k){if(e.dotT<=0||dps>=e.dps){e.dps=dps;e.dotK=k;}e.dotT=Math.max(e.dotT,t);}
function killEnemy(e){
  e.dead=true;kills++;const T=e.T,big=e.elite;
  splats.push({x:e.x,y:e.y,r:e.r*1.1,life:7,sd:Math.random()*1e9|0});if(splats.length>70)splats.shift();
  debris(e.x,e.y,T.deb,big?18:3,big?1.5:1);puff(e.x,e.y-e.r*.6,big?8:1);ring(e.x,e.y-e.r*.5,e.r*.6,big?520:240);
  const n=big?(e.boss?22:12):1,xv=(big?Math.ceil(e.xp/n):e.xp)*(burnT>0?2:1);
  for(let i=0;i<n;i++)gems.push({x:e.x+(big?rand(-e.r,e.r):0),y:e.y+(big?rand(-e.r,e.r)*.6:0),v:xv,t:0,pull:0});
  if(e===bossRef)bossRef=null;
  onKill2(e);relicOnKill(e);if(e.guard)guardLoot(e);if(rift)riftKill(e);metaKill(e);
  if(T.split&&enemies.length<400)for(let i=0;i<3;i++){const a=i*TAU/3;spawn(T.split,{at:[e.x+Math.cos(a)*22,e.y+Math.sin(a)*16]});} // 분홍 젤리: 꼬마 젤리 셋으로 갈라짐
  if(big){buzz(e.boss?80:40);shake(e.boss?.9:.5);freeze=Math.max(freeze,e.boss?.25:.1);flash(e.x,e.y-40,420,.4);SFX.boom();
    const cnt=e.guard?0:e.boss?1:(RUN.newbie||Math.random()<.6?1:0); /* 11-15 대표님 "아이템 나오는 양을 줄여": 보스 2→1, 정예 1→60% */for(let i=0;i<cnt;i++)dropItem(e.x,e.y,rollGrade(e.boss?2:1,lootBoost()+(e.boss?1.5:.5)),i*.09);
    if(e.boss===2)winRun();
  }else{SFX.kill();if(can('kp',70))shake(.035);if(Math.random()<(e.champ?.03:T.loot||.004)*(1+ST.luck/100)*(burnT>0?2:1)*(1+.3*(FX.golden||0)))dropItem(e.x,e.y,Math.min(2,rollGrade(e.champ?1:0,lootBoost())),0);} /* 11-16 성장 속도: 잡몹 드롭 .007→.004(강화 적 .06→.03), 잡몹은 유니크까지만 */
}
function dropItem(x,y,gi,delay){const a=Math.random()*TAU;drops.push({kind:'drop',it:makeItem(gi,curFloor()),x,y,z:0,vx:Math.cos(a)*rand(50,110),vy:Math.sin(a)*rand(30,70),vz:rand(280,360),wait:delay,landed:false,t:0,seed:Math.random()*9});}
function addLoot(it){if(SAVE.stash.length>=STASH_MAX)return false;SAVE.stash.push(it);runLoot.push(it);cxGear(it);return true;}
/* magic: 마법 피해(마법 저항으로 줄어듦), 아니면 물리 피해(방어로 줄어듦) */
function hurt(d,magic){
  if(P.inv>0||P.dead||ending||cine)return;
  if(relicBlock())return;RUN.lastHurt=runT;
  P.hp-=wuxHurt((magic?d*(1-ST.mres/100):d*100/(100+ST.def))*relicTaken()*RUN.taken);P.inv=Math.max(P.inv,.22);P.hurtT=.3;relicOnHurt();shake(.3);SFX.hurt();buzz(35);flash(P.x,P.y-20,160,.15);
  if(FX.thorns)for(const e of enemies){const dx=e.x-P.x,dy=e.y-P.y,dd=Math.hypot(dx,dy)||1;if(dd<130+e.r)hitEnemy(e,28*(1+P.level*.1)*FX.thorns,dx/dd,dy/dd,320,'thud');}
  if(P.hp<=0&&(relicRevive()||metaRevive()))return;
  if(P.hp<=0){P.hp=0;P.dead=true;ending={win:false,t:1.3};P.deadT=clock;if(SFX.die)SFX.die();debris(P.x,P.y,['#f3e6c8','#2f7b7e','#f08a3c'],12,1.3);puff(P.x,P.y-20,8);}
}
function winRun(){
  ending={win:true,t:2.6};const mi=mapIdx();
  if(rift)riftWin();else for(let i=0;i<2+mi;i++)addLoot(makeItem(rollGrade(2,lootBoost()+1+mi),curFloor()));
  for(const e of enemies)if(!e.dead){e.dead=true;puff(e.x,e.y-e.r*.6,2);}
  eshots=[];warns=[];flash(P.x,P.y-20,600,.8);SFX.level();
}
function finishRun(){
  const win=ending&&ending.win,bk=bestKey(),old=SAVE.best[bk];
  if(!old||(win&&!old.win)||(!old.win&&runT>old.t)||(win&&old.win&&kills>old.kills)){SAVE.best[bk]={t:Math.floor(runT),kills,lv:P.level,win:!!win};RUN.newBest=true;}
  metaRunEnd(!!win);saveNow();state='over';cine=null;uiCine(null);uiResult(!!win);
}
function spawn(type,o){
  o=o||{};const T=ET[type],m=runT/60,a=Math.random()*TAU;
  /* 강화된 적: 시간이 갈수록, 어려운 맵일수록 자주 섞여 나온다(크고 붉은 기운, 체력 4배·공격 1.5배, 장비를 잘 떨어뜨림) */
  const champ=!T.elite&&!o.sc&&Math.random()<DIFF.champ(m)+MAP.champ,sc=o.sc||(champ?1.35:1),rad=(runT<25?viewRad()*.72:viewRad()+80)+(sc>1?60:0); // 처음 25초는 화면 가장자리 안쪽에서 나와 바로 싸움이 붙는다
  const e={kind:'enemy',T,type,ai:T.ai||'chase',x:o.at?o.at[0]:P.x+Math.cos(a)*rad,y:o.at?o.at[1]:P.y+Math.sin(a)*rad*.85,kx:0,ky:0,
    hp:T.hp*DIFF.hp(m)*MAP.hp*RUN.ehp*(o.hpMul||1)*(champ?4:1)*(o.boss?Math.sqrt(ADAPT):ADAPT),dmg:T.dmg*DIFF.dmg(m)*MAP.dmg*RUN.edmg*(o.dmgMul||1)*(champ?1.5:1),xp:Math.ceil(T.xp*DIFF.xp(m)*(champ?4:1)),r:T.r*sc*(o.boss?.7:T.elite?.6:.5),vs:o.boss?.7:T.elite?.6:.5,sc, /* 11-16 대표님 "적 크기 약 50%": 반지름·그림 잡몹 0.5, 정예 0.6, 보스 0.7 */sm:DIFF.spd(m),champ,
    flash:0,hitT:0,slow:0,stun:0,ice:0,weak:0,bt:0,bt2:0,ovT:0,dotT:0,dps:0,dotK:'fire',dotAcc:0,st:0,at:rand(1.5,4),at2:6,cx:0,cy:0,sx:0,sy:0,
    phase:Math.random(),dir:1,age:0,seed:Math.random()*9,dead:false,boss:o.boss||0,elite:!!T.elite,name:o.name||T.n,def:T.def||0,mres:T.mres||0,pst:0,rage:0,fade:0,lane:0};
  if(!o.at&&Math.hypot(e.x,e.y/.85)>WORLD_R-60){e.x=2*P.x-e.x;e.y=2*P.y-e.y;}if(!o.at)keepIn(e,60);
  e.maxhp=e.hp;enemies.push(e);mateAggro(e);if(o.boss!==3)cxSee('m',type);/* 잠든 수호자는 깨어날 때 도감에 */return e;
}
function pickSpawn(m){const pool=SPAWNS.filter(s=>m>=s.from),wt=s=>(MAP.w[s.type]||s.w)*spawnFade(s,m);let r=Math.random()*pool.reduce((a,s)=>a+wt(s),0);for(const s of pool){r-=wt(s);if(r<=0)return s.type;}return'moss';}
function gainXp(v){
  P.xp+=v*(1+ST.xp/100)*RUN.xp;
  while(P.xp>=P.need){P.xp-=P.need;P.level++;P.need=needXp(P.level);pendingLv++;if(FX.fate&&Math.random()<.1*FX.fate)pendingLv++;P.hp=Math.min(P.maxhp,P.hp+P.maxhp*.03);
    ring(P.x,P.y-20,20,620,'#6fd6c8');ring(P.x,P.y-20,10,380,'#f3e6c8');flash(P.x,P.y-20,360,.35);SFX.level();
    for(const e of enemies){const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy)||1;if(d<190){e.kx+=dx/d*420*e.T.kb;e.ky+=dy/d*420*e.T.kb;e.hitT=.14;}}}
}

/* ───── 레벨업 선택지 ───── */
const fusedCount=()=>Object.keys(P.act).filter(k=>ACTIVES[k].fuse).length;
/* 조합 조건: 재료 둘 다 FUSE_LV 단계 + 주인공 FUSE_PLV 레벨 + 한 판에 FUSE_MAX 개까지 */
const fusionReady=id=>{const A=ACTIVES[id];return !!A.fuse&&!P.act[id]&&P.level>=FUSE_PLV&&fusedCount()<FUSE_MAX&&A.fuse.every(k=>(P.act[k]||0)>=FUSE_LV);};
const usedUp=id=>Object.keys(P.act).some(k=>ACTIVES[k].fuse&&ACTIVES[k].fuse.includes(id)); /* 조합 재료로 쓰인 스킬 */
function rollChoices(kind){
  const n=Math.min(4,choiceCount(ST.luck)+(FX.wisdom||0)+tal('choice')+RUN.choice),mix=a=>a.slice().sort(()=>Math.random()-.5); // 11-15 대표님: 3개, 행운에 따라 4개, 최대 4개
  if(kind==='pas'){const own=Object.keys(P.pas);return mix(own.length>=MAX_PAS?own:Object.keys(PASSIVES)).slice(0,n);}
  /* 액티브: 조합 스킬은 재료가 갖춰졌을 때만 나오고(맨 위에 한 장 더), 배운 뒤에는 다른 스킬처럼 섞여 나온다 */
  const ready=Object.keys(ACTIVES).filter(fusionReady),all=Object.keys(ACTIVES).filter(id=>(!ACTIVES[id].fuse||P.act[id])&&!usedUp(id)),open=all.filter(id=>(P.act[id]||0)<SKILL_MAX),pool=open.length?open:all; // 스킬은 SKILL_MAX 단계까지
  return (ready.length?[pick(ready)]:[]).concat(mix(pool).slice(0,ready.length?n-1:n));
}
function takeChoice(kind,id){
  if(kind==='act'){const A=ACTIVES[id],fresh=!P.act[id];P.act[id]=(P.act[id]||0)+1;calcPerks(id);
    if(fresh&&A.fuse){cxSee('f',id);for(const k of A.fuse){delete P.act[k];delete P.pk[k];delete P.cds[k];}pruneAllies();} // 조합: 재료 두 스킬은 하나로 합쳐져 사라진다
    return;}
  P.pas[id]=(P.pas[id]||0)+1;recalc();if(PASSIVES[id].stat==='hp')P.hp=Math.min(P.maxhp,P.hp+PASSIVES[id].v);
}
/* 스킬 단계마다 붙는 옵션. ups[i] = (i+2)단계가 될 때 얻는 것. 다 얻은 뒤에는 단계마다 피해 +12% */
function calcPerks(id){
  const A=ACTIVES[id],lv=P.act[id],p={dmg:(A.fuse?1.8:1)*1.14*(SKILL_HV[id]||1),area:1,cd:1,count:0}; // 1.14: 기본 쿨타임을 늘린 만큼 한 방을 키움 // 조합 스킬은 재료 둘을 삼킨 만큼 처음부터 강하다
  for(let i=0;i<lv-1;i++){const u=A.ups[i];if(!u){p.dmg+=.12;continue;}for(const k in u[1]){if(k==='cd')p.cd*=1-u[1][k];else p[k]=(p[k]||0)+u[1][k];}}
  p.area=softArea(p.area);if(p.big)p.big=softArea(1+p.big)-1;
  P.pk[id]=p;
}
const PLAIN_PERK={dmg:1,area:1,cd:1,count:1,life:1,big:1,spin:1};
function upInfo(id,toLv){const u=ACTIVES[id].ups[toLv-2];if(!u)return{text:'피해 +12%',special:false};return{text:u[0],special:Object.keys(u[1]).some(k=>!PLAIN_PERK[k])};}
function choiceInfo(kind,id){
  const lv=(kind==='act'?P.act:P.pas)[id]||0;
  if(kind==='pas')return{text:passiveText(id),special:false};
  const A=ACTIVES[id];
  if(!lv)return{text:A.d+(A.fuse?` (${A.fuse.map(k=>ACTIVES[k].n).join(' + ')} 가 하나로 합쳐집니다)`:''),special:false,fuse:!!A.fuse};
  return Object.assign(upInfo(id,lv+1),{fuse:!!A.fuse});
}

/* ───── 액티브 스킬 ─────
   cd 기본 쿨타임(초), fire(p) 쏘면 true, tick(dt,p) 늘 켜진 것, ups 단계별 옵션(p 로 모여 들어온다) */
function doSlash(a,R,dmg){
  slashes.push({x:P.x,y:P.y-20,a,R,life:.22,max:.22});
  for(const e of enemies){if(e.dead)continue;const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy);if(d>R+e.r)continue;let da=Math.atan2(dy,dx)-a;da=Math.atan2(Math.sin(da),Math.cos(da));
    if(Math.abs(da)<1.25||d<e.r+20)hitEnemy(e,dmg,dx/(d||1),dy/(d||1),300,'cut');}
}
function zapRun(start,from,chain,dmg,p){
  let t=start,lastT=null;const used=new Set(),pts=[from];
  for(let i=0;i<chain&&t;i++){used.add(t);const px=pts[pts.length-1];pts.push([t.x,t.y-t.r*.8]);const dx=t.x-px[0],dy=t.y-px[1],d=Math.hypot(dx,dy)||1;
    if(p.stun)t.stun=Math.max(t.stun,.6);hitEnemy(t,dmg,dx/d,dy/d,140,'zap');flash(t.x,t.y-10,130,.12);lastT=t;t=nearest(pts[pts.length-1][0],pts[pts.length-1][1],210,used);}
  zaps.push(makeZap(pts));
  if(p.thunder&&lastT){const x=lastT.x,y=lastT.y;later(.12,()=>thunder(x,y,dmg*1.2));}
  return used;
}
function makeZap(pts){
  const segs=[],br=[];
  for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],len=Math.hypot(b[0]-a[0],b[1]-a[1]),k=Math.max(2,len/26|0);segs.push(a);
    for(let j=1;j<k;j++){const f=j/k,q=[a[0]+(b[0]-a[0])*f+rand(-11,11),a[1]+(b[1]-a[1])*f+rand(-11,11)];segs.push(q);
      if(Math.random()<.22){const an=Math.random()*TAU,l=rand(16,34);br.push([q,[q[0]+Math.cos(an)*l*.5+rand(-5,5),q[1]+Math.sin(an)*l*.5+rand(-5,5)],[q[0]+Math.cos(an)*l,q[1]+Math.sin(an)*l]]);}}}
  segs.push(pts[pts.length-1]);return{segs,br,life:.18,max:.18};
}
function thunder(x,y,dmg){hammerAt(x,y,1); // 묠니르
  const R=95*AREA;for(const e of enemies){if(e.dead)continue;const dx=e.x-x,dy=e.y-y,d=Math.hypot(dx,dy);if(d<R+e.r)hitEnemy(e,dmg,dx/(d||1),dy/(d||1),220,'zap');}
  const z=makeZap([[x+rand(-50,50),y-560],[x+rand(-24,24),y-300],[x,y]]);z.life=z.max=.26;z.big=1;zaps.push(z);
  flash(x,y,320,.3);ring(x,y,16,520,'#bfe9ff');pillar(x,y,300,26,'#9fd8ff');shake(.12);SFX.thunder();
}
function iceBurst(x,y,dmg){
  const R=64*AREA;for(const e of enemies){if(e.dead)continue;const dx=e.x-x,dy=e.y-e.r*.6-y,d=Math.hypot(dx,dy);if(d<R+e.r){e.slow=Math.max(e.slow,1.6);hitEnemy(e,dmg,dx/(d||1),dy/(d||1),160,'ice');}}
  ring(x,y,10,360,'#bfe9ff');debris(x,y,['#bfe9ff','#f4fcff','#86c2ec'],6,1);flash(x,y,130,.16);
}
function doWave(R,dmg,p){waves.push({x:P.x,y:P.y-12,r:24,R,dmg,hit:new Set(),stun:p.stun});flash(P.x,P.y-20,R*1.3,.3);SFX.wave();
  const heal=(FX.waveHeal||0)*.04+(p.heal?.03:0);if(heal)P.hp=Math.min(P.maxhp,P.hp+P.maxhp*heal);}
const ACTIVES={
  slash:{n:'베기',d:'가까운 적 쪽으로 넓게 벱니다.',cd:.85,
    ups:[['등 뒤도 함께 벱니다',{back:1}],['피해 +25%',{dmg:.25}],['베면서 검기를 날립니다',{wave:1}],['범위 +15%',{area:.15}],['한 번에 두 번 벱니다',{twin:1}],['쿨타임 -20%',{cd:.2}],['피해 +25%',{dmg:.25}],['피해 +30%',{dmg:.3}]],
    fire(p){const R=118*p.area*(1+.3*(FX.slashWide||0))*AREA,t=nearest(P.x,P.y,R+30);
      if(!t)return false; /* 11-16: 멀리 있는 적에게 검기를 날리던 것 뺌 — 가까이 와야 벤다 */
      const a=Math.atan2(t.y-P.y,t.x-P.x),dmg=30*p.dmg;P.dir=Math.cos(a)>=0?1:-1;P.swing=0;SFX.slash();
      doSlash(a,R,dmg);if(p.back)doSlash(a+Math.PI,R*.9,dmg*.8);onSlash2(a,R,dmg);relicOnSlash(a,dmg);if(nearest(P.x,P.y,R))freeze=Math.max(freeze,.018);
      if(p.wave)shots.push({k:'crescent',x:P.x,y:P.y-20,vx:Math.cos(a)*540,vy:Math.sin(a)*540,a,life:.6,dmg:dmg*.6,r:30*p.area,hit:new Set()});
      if(p.twin)later(.2,()=>{if(P.dead)return;P.swing=0;SFX.slash();doSlash(a,R,dmg*.7);if(p.back)doSlash(a+Math.PI,R*.9,dmg*.55);});
      return true;}},
  bolt:{n:'불씨탄',d:'적을 따라가 터지는 불덩이를 쏩니다.',cd:1.35,
    ups:[['화상: 맞은 적이 3초 동안 탑니다',{burn:1}],['+1발',{count:1}],['터질 때 작은 불씨로 갈라집니다',{split:1}],['피해 +25%',{dmg:.25}],['+1발',{count:1}],['폭발 범위 +40%',{area:.4}],['+1발',{count:1}],['피해 +30%',{dmg:.3}]],
    fire(p){const cnt=Math.min(9,1+p.count+(FX.boltTwin||0)),used=new Set();let shot=0;
      for(let i=0;i<cnt;i++){const t=nearest(P.x,P.y,560,used);if(!t)break;used.add(t);const a=Math.atan2(t.y-10-(P.y-24),t.x-P.x);
        bolts.push({x:P.x+Math.cos(a)*14,y:P.y-24+Math.sin(a)*14,vx:Math.cos(a)*440,vy:Math.sin(a)*440,life:1.5,t,dmg:26*p.dmg,R:56*p.area*AREA,burn:p.burn,split:p.split});shot++;}
      if(shot)SFX.bolt();return shot>0;}},
  zap:{n:'연쇄 번개',d:'적에서 적으로 튀는 번개를 내리칩니다.',cd:3.4,
    ups:[['감전: 맞은 적이 0.6초 멈춥니다',{stun:1}],['+2번 더 튐',{count:2}],['두 갈래로 내리칩니다',{fork:1}],['피해 +25%',{dmg:.25}],['낙뢰: 마지막 적에게 벼락이 떨어집니다',{thunder:1}],['+2번 더 튐',{count:2}],['쿨타임 -20%',{cd:.2}],['피해 +30%',{dmg:.3}]],
    fire(p){const t=nearest(P.x,P.y,440);if(!t)return false;const chain=3+p.count+2*(FX.zapChain||0),dmg=34*p.dmg,from=[P.x+P.dir*10,P.y-46],used=zapRun(t,from,chain,dmg,p);
      if(p.fork){const t2=nearest(P.x,P.y,440,used);if(t2)zapRun(t2,from,chain,dmg*.8,p);}
      shake(.05);SFX.zap();return true;}},
  blade:{n:'회전 칼날',d:'몸 주위를 도는 칼날이 닿는 적을 벱니다.',
    ups:[['+1개',{count:1}],['회전 +40%',{spin:.4}],['안쪽에 궤도가 하나 더 생깁니다',{ring2:1}],['피해 +25%',{dmg:.25}],['+1개',{count:1}],['궤도 +25%',{area:.25}],['+1개',{count:1}],['피해 +30%',{dmg:.3}]],
    tick(dt,p){P.bladeA+=3.3*(1+(p.spin||0))*dt;const n=Math.min(10,2+p.count+(FX.bladePlus||0)),R=82*p.area*AREA,dmg=13*p.dmg;blades.length=0;
      const put=(a,rad)=>{const bx=P.x+Math.cos(a)*rad,by=P.y-20+Math.sin(a)*rad*.8;blades.push({x:bx,y:by,a,rad});
        for(const e of enemies){if(e.dead||e.bt>0)continue;const dx=e.x-bx,dy=e.y-e.r*.5-by;if(dx*dx+dy*dy<(e.r+15)*(e.r+15)){const ox=e.x-P.x,oy=e.y-P.y,od=Math.hypot(ox,oy)||1;e.bt=.55;hitEnemy(e,dmg,ox/od,oy/od,170,'cut');}}};
      for(let i=0;i<n;i++)put(P.bladeA+i*TAU/n,R);
      if(p.ring2){const n2=Math.max(2,n>>1);for(let i=0;i<n2;i++)put(-P.bladeA*1.3+i*TAU/n2,R*.52);}}},
  spear:{n:'얼음 창',d:'일직선으로 꿰뚫고 적을 느리게 만듭니다.',cd:1.8,
    ups:[['빙결: 맞은 적이 0.8초 얼어붙습니다',{freeze:1}],['+1개',{count:1}],['사라질 때 얼음이 터집니다',{shatter:1}],['피해 +25%',{dmg:.25}],['+1개',{count:1}],['+2개',{count:2}],['쿨타임 -20%',{cd:.2}],['피해 +30%',{dmg:.3}]],
    fire(p){const t=nearest(P.x,P.y,560);if(!t)return false;const n=Math.min(11,1+p.count+(FX.spearTwin||0)),a0=Math.atan2(t.y-12-(P.y-24),t.x-P.x);
      for(let i=0;i<n;i++){const a=a0+(i-(n-1)/2)*.17;shots.push({k:'spear',x:P.x,y:P.y-24,vx:Math.cos(a)*640,vy:Math.sin(a)*640,a,life:.95,dmg:30*p.dmg,r:10,freeze:p.freeze,shatter:p.shatter,hit:new Set()});}
      SFX.spear();return true;}},
  meteor:{n:'운석',d:'적이 있는 자리에 운석을 떨어뜨립니다.',cd:2.6,
    ups:[['불바다: 떨어진 자리가 3초 동안 탑니다',{pool:1}],['+1개',{count:1}],['범위 +15%',{area:.15}],['피해 +30%',{dmg:.3}],['+1개',{count:1}],['쿨타임 -25%',{cd:.25}],['범위 +20%',{area:.2}],['피해 +30%',{dmg:.3}]],
    fire(p){const near=enemies.filter(e=>!e.dead&&Math.hypot(e.x-P.x,e.y-P.y)<470);if(!near.length)return false;
      for(let i=0;i<1+p.count;i++){const t=pick(near);meteors.push({x:t.x+rand(-14,14),y:t.y+rand(-10,10),t:.7+i*.12,max:.7+i*.12,R:84*p.area*(1+.4*(FX.meteorBig||0))*AREA,dmg:60*p.dmg,pool:p.pool||FX.surtr});}return true;}},
  vine:{n:'가시 덩굴',d:'바닥에 깔려 계속 피해를 주고 발을 느리게 합니다.',cd:4.2,
    ups:[['독: 벗어나도 2초 동안 중독됩니다',{poison:1}],['지속 +1.5초',{life:1.5}],['속박: 처음 닿은 적을 1초 묶습니다',{root:1}],['피해 +25%',{dmg:.25}],['+1곳',{count:1}],['범위 +20%',{area:.2}],['피해 +30%',{dmg:.3}],['지속 +1.5초',{life:1.5}]],
    fire(p){const t=nearest(P.x,P.y,340);if(!t)return false;const life=4+(p.life||0)+2*(FX.vineLong||0),used=new Set([t]);
      const put=e=>zones.push({k:'vine',x:e.x,y:e.y,R:76*p.area*AREA,life,max:life,tick:0,dmg:9*p.dmg,poison:p.poison,root:p.root,rooted:new Set(),sd:Math.random()*1e9|0});
      put(t);for(let i=0;i<p.count;i++){const o=nearest(P.x+rand(-200,200),P.y+rand(-200,200),420,used);if(o){used.add(o);put(o);}}
      SFX.vine();return true;}},
  axe:{n:'돌아오는 도끼',d:'날아갔다가 돌아오며 길 위의 적을 벱니다.',cd:2.2,
    ups:[['끝에서 0.6초 맴돌며 벱니다',{hover:1}],['+1개',{count:1}],['큰 도끼: 크기 +40%',{big:.4}],['피해 +25%',{dmg:.25}],['+1개',{count:1}],['+1개',{count:1}],['피해 +30%',{dmg:.3}],['쿨타임 -20%',{cd:.2}]],
    fire(p){const t=nearest(P.x,P.y,520);if(!t)return false;const n=Math.min(9,1+p.count+(FX.axePlus||0)),a0=Math.atan2(t.y-12-(P.y-22),t.x-P.x);
      for(let i=0;i<n;i++){const a=a0+(i-(n-1)/2)*.42;axes.push({x:P.x,y:P.y-22,vx:Math.cos(a)*560,vy:Math.sin(a)*560,t:0,hv:p.hover?.6:0,size:1+(p.big||0),dmg:24*p.dmg,hit:new Map()});}
      SFX.slash();return true;}},
  wave:{n:'빛의 파동',d:'주위로 빛을 터뜨려 적을 멀리 밀쳐내고 마법 구슬을 지웁니다.',cd:5,
    ups:[['기절: 맞은 적이 0.8초 멈춥니다',{stun:1}],['범위 +15%',{area:.15}],['파동이 두 번 퍼집니다',{twin:1}],['피해 +30%',{dmg:.3}],['퍼질 때마다 체력을 3% 채웁니다',{heal:1}],['쿨타임 -20%',{cd:.2}],['범위 +20%',{area:.2}],['피해 +30%',{dmg:.3}]],
    fire(p){const R=190*p.area*AREA;if(!nearest(P.x,P.y,R)&&!eshots.length)return false;const dmg=18*p.dmg;
      doWave(R,dmg,p);if(p.twin)later(.35,()=>{if(!P.dead)doWave(R,dmg*.7,p);});return true;}},
  /* ── 조합 스킬: 재료 두 스킬(fuse)이 모두 FUSE_LV 단계가 되면 선택지에 나온다. 치명타 때 화면이 크게 반응한다 ── */
  storm:{n:'칼날 폭풍',fuse:['slash','blade'],d:'칼날이 소용돌이치며 바깥으로 퍼져 나갑니다.',cd:7,
    ups:[['피해 +20%',{dmg:.2}],['칼날 +3개',{count:3}],['쿨타임 -15%',{cd:.15}],['피해 +25%',{dmg:.25}],['범위 +20%',{area:.2}]],
    fire(p){if(!nearest(P.x,P.y,330))return false;storms.push({t:0,life:2.6,n:10+p.count,dmg:22*p.dmg,area:p.area*AREA,hit:new Map(),pts:[]});SFX.slash();SFX.wave();return true;}},
  shower:{n:'유성우',fuse:['bolt','meteor'],d:'불타는 운석이 연달아 쏟아져 불바다를 만듭니다.',cd:8,
    ups:[['피해 +20%',{dmg:.2}],['운석 +3개',{count:3}],['범위 +20%',{area:.2}],['쿨타임 -15%',{cd:.15}],['피해 +25%',{dmg:.25}]],
    fire(p){if(!nearest(P.x,P.y,470))return false;
      for(let i=0;i<8+p.count;i++)later(i*.26,()=>{if(P.dead)return;const near=enemies.filter(e=>!e.dead&&Math.hypot(e.x-P.x,e.y-P.y)<440),t=near.length?pick(near):null;
        meteors.push({x:(t?t.x:P.x+rand(-240,240))+rand(-30,30),y:(t?t.y:P.y+rand(-200,200))+rand(-24,24),t:.6,max:.6,R:74*p.area*AREA,dmg:48*p.dmg,pool:1,heavy:1});});
      return true;}},
  tring:{n:'천둥 고리',fuse:['zap','wave'],d:'번개 고리가 퍼지며 닿는 적마다 벼락이 떨어져 멈춥니다.',cd:6,
    ups:[['피해 +20%',{dmg:.2}],['범위 +20%',{area:.2}],['쿨타임 -15%',{cd:.15}],['피해 +25%',{dmg:.25}],['범위 +20%',{area:.2}]],
    fire(p){const R=270*p.area*AREA;if(!nearest(P.x,P.y,R))return false;waves.push({x:P.x,y:P.y-12,r:24,R,dmg:32*p.dmg,hit:new Set(),stun:1,zap:1,bolts:16});flash(P.x,P.y-20,R*1.2,.3);SFX.thunder();return true;}},
  frost:{n:'서리 가시밭',fuse:['spear','vine'],d:'발밑에 얼음 가시밭이 펼쳐져 들어온 적을 얼리고 찌릅니다.',cd:9,
    ups:[['피해 +20%',{dmg:.2}],['지속 +2초',{life:2}],['범위 +20%',{area:.2}],['쿨타임 -15%',{cd:.15}],['피해 +25%',{dmg:.25}]],
    fire(p){const R=185*p.area*AREA;if(!nearest(P.x,P.y,R+60))return false;const life=5+(p.life||0);
      zones.push({k:'frost',x:P.x,y:P.y,R,life,max:life,tick:0,dmg:16*p.dmg,rooted:new Set(),sd:Math.random()*1e9|0});flash(P.x,P.y,R*1.3,.3);SFX.spear();SFX.vine();return true;}},
  plasma:{n:'플라즈마 구슬',fuse:['bolt','zap'],d:'천천히 나아가는 구슬이 주위 적을 계속 지지다가 크게 터집니다.',cd:5.5,
    ups:[['피해 +20%',{dmg:.2}],['+1개',{count:1}],['범위 +20%',{area:.2}],['쿨타임 -15%',{cd:.15}],['피해 +25%',{dmg:.25}]],
    fire(p){const t=nearest(P.x,P.y,520);if(!t)return false;const a0=Math.atan2(t.y-12-(P.y-24),t.x-P.x),n=1+p.count;
      for(let i=0;i<n;i++){const a=a0+(i-(n-1)/2)*.5;orbs.push({x:P.x,y:P.y-24,vx:Math.cos(a)*150,vy:Math.sin(a)*150,life:3.2,tick:0,dmg:20*p.dmg,R:130*p.area*AREA});}
      SFX.zap();return true;}},
  saw:{n:'톱날 고리',fuse:['axe','blade'],d:'큰 톱날이 넓게 돌며 닿는 적을 갈아 버립니다.',
    ups:[['톱날 +1개',{count:1}],['피해 +20%',{dmg:.2}],['궤도 +20%',{area:.2}],['톱날 +1개',{count:1}],['피해 +25%',{dmg:.25}]],
    tick(dt,p){P.sawA=(P.sawA||0)-2.3*dt;const n=2+p.count,R=150*p.area*AREA,dmg=40*p.dmg;saws.length=0;
      for(let i=0;i<n;i++){const a=P.sawA+i*TAU/n,sx=P.x+Math.cos(a)*R,sy=P.y-20+Math.sin(a)*R*.8;saws.push({x:sx,y:sy});
        for(const e of enemies){if(e.dead||e.bt2>0)continue;const dx=e.x-sx,dy=e.y-e.r*.5-sy;if(dx*dx+dy*dy<(e.r+30)*(e.r+30)){const ox=e.x-P.x,oy=e.y-P.y,od=Math.hypot(ox,oy)||1;e.bt2=.4;hitEnemy(e,dmg,ox/od,oy/od,220,'cut',false,true);}}}}},
};

/* ───── 적의 행동 ───── */
function enemyShot(x,y,a,speed,dmg,life,o){eshots.push(Object.assign({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:life||4.5,dmg,r:8},o));}
/* 돌아오는 값: 이번 틀의 이동 속도(0 이면 멈춤). 방향은 e.cx, e.cy 에 넣는다 */
function enemyAI(e,dx,dy,d,dt){
  const T=e.T;let v=T.spd*e.sm;e.cx=dx/d;e.cy=dy/d;
  switch(e.ai){
    case'charge': // 가시쥐: 멈칫(0.45초) → 일직선 돌진
      e.at-=dt;
      if(e.st===1){v=0;if(e.at<=0){e.st=2;e.at=.5;e.sx=dx/d;e.sy=dy/d;}}
      else if(e.st===2){v=T.spd*e.sm*3.4;e.cx=e.sx;e.cy=e.sy;if(e.at<=0){e.st=0;e.at=rand(2.6,4.6);}}
      else{v*=.75+.5*Math.abs(Math.sin(clock*3+e.seed));if(e.at<=0&&d<290&&d>70){e.st=1;e.at=.45;SFX.warn();}}
      break;
    case'weave':{const sd=Math.sin(clock*2.4+e.seed*7)*.9,x=e.cx-e.cy*sd,y=e.cy+e.cx*sd,l=Math.hypot(x,y)||1;e.cx=x/l;e.cy=y/l;break;}
    case'caster': // 주술사: 거리를 벌리고 마법 구슬
      if(d<180){e.cx=-e.cx;e.cy=-e.cy;v*=.7;}else if(d<250)v=0;
      e.at-=dt;if(e.at<=0&&d<440){e.at=2.9;e.flash=.12;SFX.cast();enemyShot(e.x+e.dir*16,e.y-56,Math.atan2(P.y-20-(e.y-56),P.x-(e.x+e.dir*16)),150,e.dmg);}
      break;
    case'bomber': // 폭탄 버섯: 붙으면 0.8초 뒤 터짐
      if(e.st===1){v=0;e.at-=dt;if(e.at<=0){const R=96;if(Math.hypot(P.x-e.x,P.y-e.y)<R+10)hurt(e.dmg,true);
          starFx(e.x,e.y-14,46,'#ff8a2e');ring(e.x,e.y,14,R*3.4,'#ffb347');ember(e.x,e.y-10,10,24,100);debris(e.x,e.y,e.T.deb,8,1.3);flash(e.x,e.y,R*2.2,.2);shake(.1);SFX.boom();e.dead=true;}}
      else if(d<64){e.st=1;e.at=.8;SFX.warn();}
      break;
    case'slam': // 거인·보스: 자리를 찍어 두고 0.9초 뒤 내려찍기. 보스는 구슬도 뿌리고 부하를 부른다
      e.at-=dt;
      if(e.st===1){v=0;if(e.at<=0){e.st=0;e.at=rand(3.6,5.6);const R=120*e.sc;
          if(Math.hypot(P.x-e.sx,P.y-e.sy)<R+10)hurt(e.dmg*1.4,false);
          ring(e.sx,e.sy,20,R*3.2,'#e2504c');debris(e.sx,e.sy,['#6e7392','#4c5070','#2b2839'],10,1.3);splats.push({x:e.sx,y:e.sy,r:R*.5,life:4,sd:Math.random()*1e9|0});shake(.16);SFXH.thud();
          if(e.boss){const n=8+e.boss*4,a0=Math.random()*TAU;for(let i=0;i<n;i++)enemyShot(e.x,e.y-50,a0+i*TAU/n,165,e.dmg*.6,5);SFX.cast();}}}
      else if(e.at<=0&&d<250*e.sc){e.st=1;e.at=.9;e.sx=P.x;e.sy=P.y;warns.push({x:P.x,y:P.y,R:120*e.sc,t:.9,max:.9});SFX.warn();}
      if(e.boss){e.at2-=dt;if(e.at2<=0){e.at2=9;for(let i=0;i<5+e.boss*2;i++){const a=Math.random()*TAU;spawn(i%3?'moss':'rat',{at:[e.x+Math.cos(a)*70,e.y+Math.sin(a)*50]});}puff(e.x,e.y-30,8);}}
      break;
    default:{const r=mobAI(e,dx,dy,d,dt);if(r!==undefined)v=r;}
  }
  return v;
}

/* ───── 한 틀 계산 ───── */
function update(dt){
  runT+=dt/SPEEDS[CFG.spd];const m=runT/60,over=!!ending;
  // 이동
  let mx=0,my=0;
  if(!P.dead){mx=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);my=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0);
    if(joy){const dx=joy.x-joy.x0,dy=joy.y-joy.y0,d=Math.hypot(dx,dy);if(d>7){const k=Math.min(1,d/46);mx=dx/d*k;my=dy/d*k;}}}
  const ml=Math.hypot(mx,my);if(ml>1){mx/=ml;my/=ml;}
  const sp=P.spd*(1+(ST.move+(P.valkT>0?15*(FX.valk||0):0))/100)*(P.slowT>0?.6:1)*GIM.pspd;P.move=ml>.05;P.x+=mx*sp*dt;P.y+=my*sp*dt*.92;if(Math.abs(mx)>.1&&P.swing<0)P.dir=mx>0?1:-1;
  const fd=Math.hypot(P.x,P.y+4);if(fd<30){P.x*=30/fd;P.y=(P.y+4)*30/fd-4;}
  if(!P.dead){P.hp=Math.min(P.maxhp,P.hp+ST.regen*dt);
    if(fd<140&&P.hp<P.maxhp){P.hp=Math.min(P.maxhp,P.hp+7*(1+2*(FX.fireKeeper||0))*dt);if(Math.random()<dt*5)ember(P.x,P.y-20,1,8,40);}}
  P.inv-=dt;if(P.swing>=0){P.swing+=dt/.24;if(P.swing>=1)P.swing=-1;}
  for(const l of laters){l.t-=dt;if(l.t<=0){l.done=1;l.fn();}}laters=laters.filter(l=>!l.done);

  // 등장·사건
  hordeT-=dt;burnT-=dt;
  if(rift)riftUpdate();metaUpdate(dt);
  if(!over){
    /* 보스전: 보스가 나온 뒤 45초는 잔챙이를 크게 줄이고(11-14 대표님 "보스전 때 잔챙이가 너무 많아"), 그 뒤 1분에 걸쳐 원래대로 돌린다.
       보스를 오래 못 잡아도 경험치가 끊기지 않게 하려는 것 */
    if(bossRef!==lastBoss){lastBoss=bossRef;bossSince=runT;}
    const bossOn=!!(bossRef&&!bossRef.dead&&!bossRef.sleep),bt=runT-bossSince,calm=bossOn&&bt<60,bk2=bossOn?.3:1; /* 11-16 대표님 "보스 중엔 잡몹 적게": 보스가 살아 있는 내내 등장 0.3배·동시 한도 0.35배 */
    const cap=Math.min(DIFF.cap(m),W<700?180:240) /* 11-16 화면에 쌓이는 적 한도: 폰 290→180 */*Math.max(.35,bk2);spawnAcc+=dt*DIFF.spawn(m)*DIFF.pace(runT)*MAP.spawn*RUN.spawn*(hordeT>0?2.5:1)*(burnT>0?1.6:1)*bk2;
    while(spawnAcc>=1){const t=pickSpawn(m);spawnAcc-=ET[t].cost||1;if(enemies.length<cap){const e=spawn(t);for(let k=1;k<(e.T.pack||1);k++)spawn(t,{at:[e.x+rand(-46,46),e.y+rand(-46,46)]});}} // pack: 떼로 나오는 적
    if(runT>=nextElite){nextElite+=ELITE_EVERY*RUN.eliteEvery;if(!calm&&enemies.filter(e=>e.elite&&!e.boss&&!e.dead).length<4)spawn(eliteKind(m));} /* 2회차: 정예는 동시에 4마리까지(못 잡으면 화면을 덮던 것) */
    if(!miniDone&&runT>=MINI_HORDE){miniDone=true;uiBanner('작은 무리');const n=16,rad=viewRad()+30;for(let i=0;i<n;i++){const a=i/n*TAU;spawn('moss',{at:[P.x+Math.cos(a)*rad,P.y+Math.sin(a)*rad*.85]});}}
    if(runT>=nextHorde&&calm)nextHorde=runT+20; // 보스가 막 나왔으면 몰려오기를 미룬다
    if(runT>=nextHorde){nextHorde+=HORDE_EVERY;hordeT=HORDE_LEN;uiBanner('적이 몰려옵니다');SFX.horn();
      const n=Math.min(64,24+m*4|0),rad=viewRad()+40;for(let i=0;i<n;i++){const a=i/n*TAU;spawn(hordeKind(m,i),{at:[P.x+Math.cos(a)*rad,P.y+Math.sin(a)*rad*.85]});}}
    if(runT>=nextBurn){nextBurn+=BURN_EVERY;if(!bossRef){burnT=BURN_LEN;uiBanner('버닝 타임');SFX.level();}}
    if(runT>=nextBoss&&!(mode.t>0&&runT>=mode.t)&&enemies.some(e=>e.boss===1&&!e.dead))nextBoss=runT+30; // 앞 보스가 살아 있으면 다음 보스는 미룬다(쌓이지 않게)
    if(runT>=nextBoss){const fin=mode.t>0&&runT>=mode.t;nextBoss=fin?Infinity:nextBoss+BOSS_EVERY;const a=Math.random()*TAU,rad=viewRad()*.8;
      const bk=bossKind(bossN++,fin);bossRef=spawn(bk,{hpMul:fin?2:1,dmgMul:fin?1.3:1,boss:fin?2:1,name:fin?'대군주 '+ET[bk].n:ET[bk].n,at:[P.x+Math.cos(a)*rad,P.y+Math.sin(a)*rad*.8]});
      burnT=0;thinOut();cine={t:2.2,max:2.2,e:bossRef};uiCine(bossRef.name,fin);SFX.elite();shake(.5);buzz(60);}
  }

  // 적
  const n=enemies.length;
  for(let i=0;i<n;i++){const e=enemies[i],T=e.T;if(e.dead)continue;if(e.mt&&(e.mt.down>0||!mates.includes(e.mt)))e.mt=null;const tg=e.mt||P,dx=tg.x-e.x,dy=tg.y-e.y,d=Math.hypot(dx,dy)||1; /* tg: 노리는 상대(주인공 또는 동료) */
    if(e.sleep){if(d<330&&!P.dead)wakeGuard(e);else continue;} // 잠든 수호자는 다가갈 때까지 가만히 있는다
    if(d>1500&&!e.boss){const a=Math.random()*TAU,rad=viewRad()+80;e.x=P.x+Math.cos(a)*rad;e.y=P.y+Math.sin(a)*rad*.85;continue;}
    e.age+=dt;e.flash-=dt;e.hitT-=dt;e.slow-=dt;e.bt-=dt;e.bt2-=dt;e.ovT-=dt;e.ice-=dt;
    if(e.dotT>0){e.dotT-=dt;e.dotAcc+=dt;if(Math.random()<dt*6)ember(e.x,e.y-e.r,1,e.r*.6,30,e.dotK==='fire'?'#ffb347':'#9cd16a');
      if(e.dotAcc>=.5){e.dotAcc=0;hitEnemy(e,e.dps*.5,0,0,0,e.dotK,true);if(e.dead)continue;}}
    let v=0;
    /* 상태이상: 보스는 기절·빙결에 99% 면역, 정예는 절반만 간다 */
    if(e.elite&&e.stun>e.pst+1e-6){if(e.boss){if(Math.random()<.99){e.stun=0;e.ice=0;if(can('imm',900))textFx(e.x,e.y-e.r*2.4,'면역','#c9d1e0');}}else{e.stun=e.pst+(e.stun-e.pst)*.5;e.ice=Math.min(e.ice,e.stun);}}
    if(e.stun>0)e.stun-=dt;else{v=enemyAI(e,dx,dy,d,dt);if(e.dead)continue;}
    e.pst=Math.max(0,e.stun);
    v*=(e.hitT>0?(e.elite?.9:.3):1)*(e.slow>0?(e.boss?.85:e.elite?.75:.55):1)*(burnT>0?1.15:1)*(P.dead?.3:1)*GIM.espd*RUN.espd;
    e.x+=(e.cx*v+e.kx)*dt;e.y+=(e.cy*v+e.ky)*dt;const dec=Math.exp(-dt*9);e.kx*=dec;e.ky*=dec;
    if(Math.abs(dx)>4)e.dir=dx>0?1:-1;if(v>0)e.phase+=T.anim*dt*(e.slow>0?.5:1)*(e.st===2?2.2:1);
    if(d<e.r+13&&e.ai!=='caster'&&!T.harmless&&e.stun<=0&&!(e.fade>0)){if(tg===P)hurt(e.dmg*(e.st===2?1.5:1),!!T.magic);else mateHurt(tg,e.dmg*(e.st===2?1.5:1));}
    for(let j=i+1;j<n;j++){const o=enemies[j],ax=o.x-e.x,ay=o.y-e.y,rs=(e.r+o.r)*.85,q=ax*ax+ay*ay;
      if(q<rs*rs&&q>.01){const dd=Math.sqrt(q),ov=(rs-dd)/dd*.5,wa=e.elite?.1:o.elite?.9:.5;e.x-=ax*ov*wa;e.y-=ay*ov*wa;o.x+=ax*ov*(1-wa);o.y+=ay*ov*(1-wa);}}
  }
  // 적의 마법 구슬·경고 자리
  for(const s of eshots){s.life-=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;const dx=P.x-s.x,dy=P.y-20-s.y;if(dx*dx+dy*dy<(s.r+13)*(s.r+13)){s.life=0;hurt(s.dmg,!s.phys);if(s.slow)slowHero(s.slow);ring(s.x,s.y,6,200,'#ff3b5c');}}
  eshots=eshots.filter(s=>s.life>0);if(eshots.length>140)eshots.splice(0,eshots.length-140);
  for(const w of warns)w.t-=dt;warns=warns.filter(w=>w.t>0);

  // 스킬
  mateUpdate(dt);
  if(!P.dead&&!over)for(const id in P.act){const A=ACTIVES[id],p=P.pk[id];if(A.tick)A.tick(dt,p);
    if(A.cd){P.cds[id]=(P.cds[id]===undefined?.4:P.cds[id])-dt;if(P.cds[id]<=0)P.cds[id]=A.fire(p)?((FX.chronos&&Math.random()<.1*FX.chronos||FX.wudang&&Math.random()<.08*FX.wudang)?.25:cdOf(A.cd*(SKILL_HV[id]||1)*p.cd)):.15;}}
  if(!P.act.blade||P.dead)blades.length=0;if(!P.act.saw||P.dead)saws.length=0;

  // 불씨탄
  for(const b of bolts){b.life-=dt;if(b.t&&!b.t.dead){const dx=b.t.x-b.x,dy=b.t.y-12-b.y,d=Math.hypot(dx,dy)||1;b.vx+=dx/d*900*dt;b.vy+=dy/d*900*dt;const v=Math.hypot(b.vx,b.vy);b.vx*=440/v;b.vy*=440/v;}
    b.x+=b.vx*dt;b.y+=b.vy*dt;if(Math.random()<dt*40)ember(b.x,b.y,1,3,24);
    for(const e of enemies){if(e.dead)continue;const dx=e.x-b.x,dy=e.y-e.r*.6-b.y;if(dx*dx+dy*dy<(e.r+7)*(e.r+7)){b.life=0;
      for(const o of enemies){if(o.dead)continue;const ox=o.x-b.x,oy=o.y-o.r*.6-b.y,od=Math.hypot(ox,oy);if(od<b.R+o.r){hitEnemy(o,b.dmg,ox/(od||1),oy/(od||1),220,'fire');if(b.burn&&!o.dead)setDot(o,b.dmg*.3,3,'fire');}}
      starFx(b.x,b.y,b.mini?20:32,'#ffb347');ring(b.x,b.y,10,b.R*5,'#ffe08a');ember(b.x,b.y,b.mini?4:8,10,90);flash(b.x,b.y,b.R*3,.16);if(!b.mini)shake(.04);if(can('boom',70))SFXH.fire();
      if(b.split&&!b.mini){const used=new Set([e]);for(let k=0;k<3;k++){const t=nearest(b.x,b.y,260,used),a=t?Math.atan2(t.y-12-b.y,t.x-b.x):Math.random()*TAU;if(t)used.add(t);
        bolts.push({x:b.x,y:b.y,vx:Math.cos(a)*440,vy:Math.sin(a)*440,life:.7,t,dmg:b.dmg*.4,R:b.R*.6,burn:b.burn,mini:true});}}
      break;}}}
  bolts=bolts.filter(b=>b.life>0);
  // 날아가는 것: 얼음 창·검기
  for(const s of shots){s.life-=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;if(Math.random()<dt*30)ember(s.x,s.y,1,3,10,s.k==='spear'?'#bfe9ff':'#fff6dc');
    for(const e of enemies){if(e.dead||s.hit.has(e))continue;const dx=e.x-s.x,dy=e.y-e.r*.6-s.y,rr2=e.r+s.r;if(dx*dx+dy*dy<rr2*rr2){s.hit.add(e);
      if(s.k==='spear'){if(s.freeze){e.stun=Math.max(e.stun,.8);e.ice=.8;}else e.slow=1.6;hitEnemy(e,s.dmg,Math.cos(s.a),Math.sin(s.a),150,'ice');}
      else hitEnemy(e,s.dmg,Math.cos(s.a),Math.sin(s.a),200,'cut');}}
    if(s.life<=0&&s.shatter)iceBurst(s.x,s.y,s.dmg*.5);}
  shots=shots.filter(s=>s.life>0);
  // 돌아오는 도끼
  for(const a of axes){a.t+=dt;const out=.42;
    if(a.t<out){const k=Math.exp(-dt*3.2);a.vx*=k;a.vy*=k;}
    else if(a.t<out+a.hv){a.vx*=Math.exp(-dt*12);a.vy*=Math.exp(-dt*12);}
    else{const dx=P.x-a.x,dy=P.y-22-a.y,d=Math.hypot(dx,dy)||1;a.vx+=dx/d*2400*dt;a.vy+=dy/d*2400*dt;const v=Math.hypot(a.vx,a.vy);if(v>640){a.vx*=640/v;a.vy*=640/v;}if(d<26)a.dead=true;}
    a.x+=a.vx*dt;a.y+=a.vy*dt;if(a.t>3.6)a.dead=true;const hr=16*a.size,gap=a.t>=out&&a.t<out+a.hv?.2:.35;
    for(const e of enemies){if(e.dead)continue;const dx=e.x-a.x,dy=e.y-e.r*.6-a.y;if(dx*dx+dy*dy<(e.r+hr)*(e.r+hr)&&(a.hit.get(e)||-1)<a.t-gap){a.hit.set(e,a.t);const ox=e.x-P.x,oy=e.y-P.y,od=Math.hypot(ox,oy)||1;hitEnemy(e,a.dmg,ox/od,oy/od,180,'cut');}}}
  axes=axes.filter(a=>!a.dead);
  // 조합: 칼날 폭풍(소용돌이치며 퍼지는 칼날)
  for(const s of storms){s.t+=dt;const rad=(40+s.t*96)*s.area;s.pts.length=0;
    for(let i=0;i<s.n;i++){const a=s.t*7+i*TAU/s.n,bx=P.x+Math.cos(a)*rad,by=P.y-20+Math.sin(a)*rad*.8;s.pts.push([bx,by,a]);
      for(const e of enemies){if(e.dead)continue;const dx=e.x-bx,dy=e.y-e.r*.5-by;if(dx*dx+dy*dy<(e.r+18)*(e.r+18)&&(s.hit.get(e)||-1)<s.t-.25){s.hit.set(e,s.t);const ox=e.x-P.x,oy=e.y-P.y,od=Math.hypot(ox,oy)||1;hitEnemy(e,s.dmg,ox/od,oy/od,150,'cut',false,true);}}}}
  storms=storms.filter(s=>s.t<s.life&&!P.dead);
  // 조합: 플라즈마 구슬(지나가며 지지다가 터짐)
  for(const o of orbs){o.life-=dt;o.x+=o.vx*dt;o.y+=o.vy*dt;o.tick-=dt;
    if(o.tick<=0){o.tick=.22;const used=new Set();for(let k=0;k<3;k++){const t=nearest(o.x,o.y,o.R,used);if(!t)break;used.add(t);const dx=t.x-o.x,dy=t.y-o.y,d=Math.hypot(dx,dy)||1;
      zaps.push(Object.assign(makeZap([[o.x,o.y],[t.x,t.y-t.r*.8]]),{life:.1,max:.1}));hitEnemy(t,o.dmg,dx/d,dy/d,60,'zap',false,true);}}
    if(o.life<=0){for(const e of enemies){if(e.dead)continue;const dx=e.x-o.x,dy=e.y-e.r*.6-o.y,d=Math.hypot(dx,dy);if(d<115*AREA+e.r)hitEnemy(e,o.dmg*3,dx/(d||1),dy/(d||1),300,'fire',false,true);}
      starFx(o.x,o.y,50,'#bfe9ff');ring(o.x,o.y,14,520,'#9fd8ff');ring(o.x,o.y,8,320,'#ffb347');pillar(o.x,o.y,200,40,'#9fd8ff');flash(o.x,o.y,300,.25);shake(.12);SFX.thunder();}}
  orbs=orbs.filter(o=>o.life>0);
  // 운석
  for(const mt of meteors){mt.t-=dt;if(mt.t<=0){mt.dead=true;
    for(const e of enemies){if(e.dead)continue;const dx=e.x-mt.x,dy=e.y-mt.y,d=Math.hypot(dx,dy);if(d<mt.R+e.r)hitEnemy(e,mt.dmg,dx/(d||1),dy/(d||1),280,'fire',false,mt.heavy);}
    starFx(mt.x,mt.y-10,52,'#ffb347');ring(mt.x,mt.y,20,mt.R*3.2,'#ffe08a');ring(mt.x,mt.y,10,mt.R*2,'#ff8a2e');pillar(mt.x,mt.y,220,mt.R*.5,'#ffb347');
    debris(mt.x,mt.y,['#6e7392','#4c5070','#ff8a2e'],9,1.4);ember(mt.x,mt.y,14,mt.R*.4,120);
    splats.push({x:mt.x,y:mt.y,r:mt.R*.55,life:5,sd:Math.random()*1e9|0});flash(mt.x,mt.y,mt.R*2.6,.25);shake(.12);SFX.boom();
    if(mt.pool)zones.push({k:'fire',x:mt.x,y:mt.y,R:mt.R*.8,life:3,max:3,tick:0,dmg:mt.dmg*.14,sd:Math.random()*1e9|0});}}
  meteors=meteors.filter(mt=>!mt.dead);
  // 바닥 장판: 가시 덩굴·불바다
  for(const z of zones){z.life-=dt;z.tick-=dt;if(z.tick<=0){z.tick=.4;
    for(const e of enemies){if(e.dead)continue;const dx=e.x-z.x,dy=(e.y-z.y)*1.5;if(dx*dx+dy*dy<(z.R+e.r)*(z.R+e.r)){
      if(z.k==='vine'){e.slow=.7;if(z.root&&!z.rooted.has(e)){z.rooted.add(e);e.stun=Math.max(e.stun,1);}if(z.poison)setDot(e,z.dmg*1.5,2,'vine');hitEnemy(e,z.dmg,0,0,0,'vine',true);}
      else if(z.k==='frost'){e.slow=.8;if(!z.rooted.has(e)){z.rooted.add(e);e.stun=Math.max(e.stun,1.1);e.ice=1.1;}hitEnemy(e,z.dmg,0,0,0,'ice',true,true);}
      else hitEnemy(e,z.dmg,0,0,0,'fire',true);}}}}
  zones=zones.filter(z=>z.life>0);
  // 빛의 파동
  for(const w of waves){w.r+=560*dt;
    for(const e of enemies){if(e.dead||w.hit.has(e))continue;const dx=e.x-w.x,dy=e.y-w.y,d=Math.hypot(dx,dy)||1;if(d<w.r+e.r){w.hit.add(e);if(w.stun)e.stun=Math.max(e.stun,.8);if(!w.zap)e.slow=Math.max(e.slow,1);
      if(w.zap&&w.bolts>0){w.bolts--;zaps.push(makeZap([[e.x+rand(-40,40),e.y-420],[e.x+rand(-14,14),e.y-200],[e.x,e.y-e.r]]));flash(e.x,e.y-10,120,.12);}
      hitEnemy(e,w.dmg,dx/d,dy/d,w.zap?260:560,w.zap?'zap':'light',false,!!w.zap);}}
    for(const s of eshots){if(Math.hypot(s.x-w.x,s.y-w.y)<w.r){s.life=0;ember(s.x,s.y,2,4,30,'#e56bff');}}}
  waves=waves.filter(w=>w.r<w.R);

  update2(dt,over);skill3Update(dt);updateWorld(dt);mobsUpdate(dt);relicTick(dt);

  // 경험치·장비 줍기
  xpComboT-=dt;if(xpComboT<=0)xpCombo=0;const pr=135*(1+ST.pick/100);
  for(const g of gems){g.t+=dt;const dx=P.x-g.x,dy=P.y-14-g.y,d=Math.hypot(dx,dy)||1;if(!P.dead&&(d<pr||g.pull)){g.pull=Math.min(900,(g.pull||160)+1500*dt);g.x+=dx/d*g.pull*dt;g.y+=dy/d*g.pull*dt;}
    if(d<18&&!P.dead){g.dead=true;xpCombo++;xpComboT=.5;SFX.xp(xpCombo);gainXp(g.v);}}
  gems=gems.filter(g=>!g.dead);if(gems.length>260){const old=gems.splice(0,gems.length-200);let v=0;for(const g of old)v+=g.v;const o=old[old.length-1];gems.push({x:o.x,y:o.y,v,t:0,pull:0});} // 넘치면 큰 보석 하나로(1회차)
  fullT-=dt;
  for(const d of drops){if(d.wait>0){d.wait-=dt;continue;}d.t+=dt;const gi=d.it.gi;
    if(!d.landed){d.vz-=820*dt;d.z+=d.vz*dt;d.x+=d.vx*dt;d.y+=d.vy*dt;if(d.z<=0){d.z=0;d.landed=true;
      if(gi>=3){SFX.loot(gi);puff(d.x,d.y,3);flash(d.x,d.y,120+gi*40,.3);ring(d.x,d.y,6,240,GRADES[gi].c);uiBanner(d.it.prime?'초월 신화 장비':gi===4?'신화 장비':'전설 장비');}else SFX.soft();}}
    else if(!P.dead&&Math.hypot(P.x-d.x,P.y-d.y)<32&&d.t>.45){
      if(addLoot(d.it)){d.dead=true;saveNow();if(gi>=3){uiToast(d.it);ring(d.x,d.y-8,6,200,GRADES[gi].c);SFX.loot(gi);}else SFX.pick();}
      else if(fullT<=0){fullT=3;uiNote('창고가 가득 찼습니다');}}}
  drops=drops.filter(d=>!d.dead);if(drops.length>90)drops.splice(0,drops.length-90);

  // 조각
  for(const p of parts){p.life-=dt;
    if(p.k==='deb'){p.vz-=760*dt;p.z+=p.vz*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.rot+=p.vr*dt;if(p.z<0){p.z=0;p.vz*=-.42;p.vx*=.55;p.vy*=.55;p.vr*=.5;}}
    else if(p.k==='puff'){p.x+=p.vx*dt;p.y+=p.vy*dt;p.r+=30*dt;}
    else if(p.k==='ember'){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx+=rand(-60,60)*dt;}
    else if(p.k==='ring'){p.r+=p.vr*dt;}
    else if(p.k==='num'){p.y+=p.vy*dt;p.vy*=Math.exp(-dt*3);}}
  parts=parts.filter(p=>p.life>0);
  for(const s of splats)s.life-=dt;splats=splats.filter(s=>s.life>0);
  for(const s of slashes)s.life-=dt;slashes=slashes.filter(s=>s.life>0);
  for(const z of zaps)z.life-=dt;zaps=zaps.filter(z=>z.life>0);
  enemies=enemies.filter(e=>!e.dead);
}
