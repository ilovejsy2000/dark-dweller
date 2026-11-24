'use strict';
/* 다크 드웰러 — 오래 붙잡는 장치(11-15 대표님 "중독성을 강화할 아이디어, 추천한 거 전부 넣어줘").
   ① 어둠 결정 + 특성(영구 성장: 져도 남는다) ② 보물 고블린 · 갈림길 제단(위험과 보상) · 상자 등급 룰렛
   ③ 장비 분해(마력 가루) · 재련(잠그지 않은 줄 다시 굴리기, 오르내림 · 2% 빛나는 재련 = 한 줄 최대 · 최대치 줄 잠금) ④ 레벨업 희귀 선택지 · 다시 굴리기
   ⑤ 판 안의 작은 임무 ⑥ 도감 ⑦ 오늘의 도전.
   드롭 확률(전설 1%·신화 0.5%)은 건드리지 않는다. 특별한 순간(고블린·제단·임무·상자)에만 보상을 몰아준다. */

/* ───── 한 판에만 걸리는 배율(제단의 계약·오늘의 도전) ───── */
let RUN=runInit();
function runInit(){return{ehp:1,edmg:1,spawn:1,xp:1,pdmg:1,php:1,taken:1,espd:1,eliteEvery:1,gobEvery:1,altarEvery:1,choice:0,
  rerolls:tal('reroll'),revive:tal('revive'),shardBonus:0,shardGain:0,dustBonus:0,dustGain:0,eliteLoot:0,daily:false,pacts:[],lastHurt:0,
  gobT:rand(50,80),altarT:90,altar:null,quest:null,questT:50,newCx:0};}

/* ───── ① 특성 ───── */
const TALENTS=[ /* max:Infinity = 상한 없음(11-16 대표님) */
  {id:'hp',n:'강인함',d:'최대 체력 +20',max:Infinity,c:8,ap:(s,l)=>{s.hp+=20*l;}},
  {id:'dmg',n:'힘',d:'피해 +3%',max:Infinity,c:10,ap:(s,l)=>{s.dmg+=3*l;}},
  {id:'def',n:'단련',d:'방어 +4',max:Infinity,c:8,ap:(s,l)=>{s.def+=4*l;}},
  {id:'regen',n:'회복력',d:'초당 체력 회복 +0.4',max:Infinity,c:8,ap:(s,l)=>{s.regen+=.4*l;}},
  {id:'move',n:'민첩',d:'이동 속도 +3%',max:Infinity,c:8,ap:(s,l)=>{s.move+=3*l;}},
  {id:'pick',n:'수집가',d:'획득 범위 +12%',max:Infinity,c:6,ap:(s,l)=>{s.pick+=12*l;}},
  {id:'xp',n:'배움',d:'경험치 +5%',max:Infinity,c:10,ap:(s,l)=>{s.xp+=5*l;}},
  {id:'cdr',n:'집중',d:'쿨타임 -1%',max:Infinity,c:12,ap:(s,l)=>{s.cdr+=l;}},
  {id:'crit',n:'예리함',d:'치명타 확률 +1%',max:Infinity,c:12,ap:(s,l)=>{s.crit+=l;}},
  {id:'reroll',n:'다시 굴리기',d:'판마다 레벨업 선택지를 다시 굴리는 횟수 +1',max:3,c:25},
  {id:'rare',n:'행운의 별',d:'희귀 선택지(2단계 오름)가 나올 확률 +1.5%',max:5,c:15},
  {id:'revive',n:'불사',d:'판마다 한 번, 쓰러지면 체력 50%로 일어납니다',max:1,c:150},
  {id:'choice',n:'혜안',d:'레벨업 선택지 +1',max:1,c:200},
];
const TAL=Object.fromEntries(TALENTS.map(t=>[t.id,t]));
function tal(id){return(SAVE.tal&&SAVE.tal[id])||0;}
const talCost=t=>Math.round(t.c*2.5*Math.pow(1.55,tal(t.id))); // 11-15 대표님 "능력 업에 드는 재료를 더": 2.5배, 단계마다 1.45→1.55배
function talentApply(s){for(const t of TALENTS){const l=tal(t.id);if(l&&t.ap)t.ap(s,l);}if(state==='play')s.hp*=RUN.php;}
function metaRevive(){if(RUN.revive<=0)return false;RUN.revive--;P.hp=P.maxhp*.5;P.inv=2;uiBanner('불사 · 다시 일어섭니다');ring(P.x,P.y-20,20,700,'#ffe08a');flash(P.x,P.y-20,500,.5);SFX.level();
  for(const e of enemies){const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy)||1;if(d<260&&!e.boss){e.kx+=dx/d*600;e.ky+=dy/d*600;}}return true;}
/* 판이 끝날 때. 어둠 결정(특성 재료)은 오늘의 도전·영겁의 굴레에서만(11-16 대표님). 보통 맵은 장비와 마력 가루만 */
const hardRun=()=>!!(RUN.daily||rift);
function metaRunEnd(win){
  let n=0,du=RUN.dustBonus||0;
  const today0=dayKey(),dayShardDone=RUN.daily&&SAVE.dailyShard===today0; /* 11-16 대표님 "하루 한 번만": 오늘의 도전의 버틴 만큼 결정은 그날 첫 판에서만 */
  if(hardRun()&&!dayShardDone){n=Math.floor(runT/60*4)+Math.floor(kills/50)+RUN.shardBonus;if(win&&rift)n+=10*rift.tier;}
  if(RUN.daily)SAVE.dailyShard=today0;
  if(RUN.daily)du+=Math.floor(runT/60*6)+Math.floor(kills/40);
  const today=dayKey();
  /* 오늘의 도전 첫 클리어: 신화 장비 확정(창고가 꽉 차도 넣는다) + 결정 80 + 가루 150 */
  if(RUN.daily&&win&&(!SAVE.daily||SAVE.daily.done!==today)){SAVE.daily={done:today};
    const bs=Math.floor(runT/60*4)+Math.floor(kills/50)+RUN.shardBonus,bd=Math.floor(runT/60*6)+Math.floor(kills/40)+(RUN.dustBonus||0); /* 한 판치 */
    n=Math.max(200,bs*4);du=Math.max(400,bd*4);RUN.dailyX=4;const it=makeItem(4,curFloor());if(!addLoot(it)){SAVE.stash.push(it);runLoot.push(it);cxGear(it);}RUN.dailyPrize=1;}
  setTimeout(()=>{if(typeof rankAfterRun==='function')rankAfterRun(win);},0);
  RUN.shardGain=n;RUN.dustGain=du;SAVE.shard=(SAVE.shard||0)+n;SAVE.dust=(SAVE.dust||0)+du;SAVE.runs=(SAVE.runs||0)+1;
  if(RUN.newbie&&runT>120)for(let i=0;i<2;i++)addLoot(makeItem(rollGrade(1,lootBoost()+.5),curFloor())); // 4회차: 장비가 약한 동안 덤 장비
}
function metaResult(){const s=$('resSum');if(RUN.dustGain&&hardRun())s.textContent+=` · 마력 가루 +${RUN.dustGain}`;if(RUN.dailyPrize)s.textContent+=` · 오늘의 도전 보상: 신화 장비 + 결정·가루 4배(결정 ${RUN.shardGain} · 가루 ${RUN.dustGain})`;}

/* ───── ② 보물 고블린 ───── */
ET.tgob={...ET.goblin,art:['d',2,66],n:'보물 고블린',ai:'flee',r:16,hp:900,spd:128,dmg:0,xp:20,anim:3.4,kb:.5,harmless:true,tint:'rgba(255,196,40,.5)',light:110,deb:['#ffd56a','#c9962e','#fff0c2']};
ET.tgob.cost=9;
function spawnGoblin(){const a=Math.random()*TAU,rad=viewRad()*.55,g=spawn('tgob',{at:[P.x+Math.cos(a)*rad,P.y+Math.sin(a)*rad*.8]});g.gold=1;uiBanner('보물 고블린!');SFX.horn();return g;}
/* 도망: 주인공 반대쪽으로 흔들며 달린다. 25초가 지나거나 너무 멀어지면 사라진다 */
function fleeAI(e,dx,dy,d,dt){
  const w=Math.sin(clock*2.2+e.seed*5)*.8,ax=-dx/d,ay=-dy/d;e.cx=ax-ay*w;e.cy=ay+ax*w;const l=Math.hypot(e.cx,e.cy)||1;e.cx/=l;e.cy/=l;
  if(e.age>25||d>1150){e.dead=true;puff(e.x,e.y-20,8,'#ffe08a');uiBanner('보물 고블린이 도망쳤습니다');return 0;}
  if(e.hitT>0&&Math.random()<dt*6)gems.push({x:e.x+rand(-10,10),y:e.y+rand(-8,8),v:Math.ceil(DIFF.xp(runT/60)),t:0,pull:0}); // 맞을 때마다 보석을 흘린다
  return e.T.spd*(d<160?1.25:1);
}
function goblinLoot(e){for(let i=0;i<3;i++)dropItem(e.x,e.y,i===0?4:rollGrade(1,lootBoost()+2),i*.1); /* 11-24: 하나는 신화 확정 */
  for(let i=0;i<30;i++)gems.push({x:e.x+rand(-40,40),y:e.y+rand(-28,28),v:Math.ceil(3*DIFF.xp(runT/60)),t:0,pull:0});
  if(hardRun()){RUN.shardBonus+=10;uiBanner('보물 고블린 처치 · 어둠 결정 +10');}else{RUN.dustBonus+=20;uiBanner('보물 고블린 처치 · 마력 가루 +20');}SFX.loot(4);flash(e.x,e.y-20,380,.4);ring(e.x,e.y,16,520,'#ffd56a');ember(e.x,e.y-20,24,30,140,'#ffd56a');}

/* ───── ② 갈림길 제단: 저주 하나를 받고 보상 하나를 얻는다 ───── */
const PACTS=[
  {n:'피의 계약',cost:'적 체력 +25%',gain:'신화 장비 하나를 바로 얻습니다',go(){RUN.ehp*=1.25;dropItem(P.x,P.y,4,0);}},
  {n:'무리의 계약',cost:'적이 30% 더 많이 나옵니다',gain:'경험치 +40%',go(){RUN.spawn*=1.3;RUN.xp*=1.4;}},
  {n:'유리 칼날',cost:'최대 체력 -20%',gain:'피해 +30%',go(){RUN.php*=.8;RUN.pdmg*=1.3;recalc();}},
  {n:'고통의 계약',cost:'받는 피해 +25%',gain:'다음 정예 하나가 신화 장비를 떨어뜨립니다',go(){RUN.taken*=1.25;RUN.eliteLoot+=1;}},
  {n:'탐욕의 계약',cost:'적 공격 +20%',gain:'보물 고블린이 바로 나타나고, 곁에 상자 둘이 생깁니다',go(){RUN.edmg*=1.2;spawnGoblin();chestNear();chestNear();}},
  {n:'시간의 계약',cost:'적 이동 속도 +15%',gain:'배운 스킬 둘이 한 단계씩 오릅니다',go(){RUN.espd*=1.15;const ids=Object.keys(P.act).filter(k=>P.act[k]<SKILL_MAX).sort(()=>Math.random()-.5).slice(0,2);for(const k of ids){P.act[k]++;calcPerks(k);}}},
];
function chestNear(){const a=Math.random()*TAU,d=rand(120,220);chests.push({kind:'chest',x:P.x+Math.cos(a)*d,y:P.y+Math.sin(a)*d*.8,t:0});}
function openPact(){choosing=true;joy=null;const box=$('pactList');box.innerHTML='';
  const two=PACTS.slice().sort(()=>Math.random()-.5).slice(0,2);
  for(const p of two){const b=el('button','choice pact');b.type='button';const d=el('div');d.append(el('b',null,p.n),el('p','pc','대가 · '+p.cost),el('p','pg','보상 · '+p.gain));b.append(el('span','pi','✦'),d);
    b.addEventListener('click',()=>{SFX.elite();p.go();RUN.pacts.push(p.n);closePact();uiBanner(p.n);});box.append(b);}
  const skip=btn('그냥 지나가기',()=>{SFX.ui();closePact();},'ghost');box.append(skip);show('pact',true);}
function closePact(){show('pact',false);choosing=false;P.inv=Math.max(P.inv,.6);}

/* ───── ⑤ 작은 임무 ───── */
const QUESTS=[
  {k:'kill',t:60,make:m=>({need:Math.round(60+m*14)}),txt:q=>`적 처치 ${q.n}/${q.need}`},
  {k:'elite',t:70,make:()=>({need:1}),txt:q=>`정예 처치 ${q.n}/1`},
  {k:'nohit',t:30,make:()=>({need:1}),txt:q=>'맞지 않고 버티기'},
  {k:'chest',t:100,make:()=>({need:1}),txt:q=>'보물 상자 열기'},
];
function newQuest(){const Q=pick(QUESTS),m=runT/60;RUN.quest=Object.assign({Q,n:0,left:Q.t,start:runT},Q.make(m));if(Q.k==='chest')chestNear();uiNote('임무 · '+Q.txt(RUN.quest));}
function questDone(){const q=RUN.quest;RUN.quest=null;RUN.questT=40;gainXp(P.need*.6);chestNear();uiBanner('임무 완료 · 보상 상자');SFX.level();}
function questFail(){RUN.quest=null;RUN.questT=35;uiNote('임무 실패');}

/* ───── 판 안에서 매 틀 ───── */
function metaUpdate(dt){
  if(ending||P.dead)return;
  /* 고블린: 1분쯤부터, 1분 반~2분 20초마다 */
  RUN.gobT-=dt;if(RUN.gobT<=0){RUN.gobT=rand(90,140)*RUN.gobEvery; /* 11-24: 2분 반~4분 → 1분 반~2분 20초 */if(!enemies.some(e=>e.type==='tgob'&&!e.dead))spawnGoblin();}
  /* 제단: 1분 반부터 2분마다, 60초 동안 서 있다. 1초 올라서면 계약 고르기 */
  RUN.altarT-=dt;
  if(RUN.altarT<=0&&!RUN.altar){RUN.altarT=120*RUN.altarEvery; /* 11-24: 3분 → 2분 */const a=Math.random()*TAU,d=rand(260,360);RUN.altar={x:P.x+Math.cos(a)*d,y:P.y+Math.sin(a)*d*.8,life:60,on:0};keepIn(RUN.altar,60);uiBanner('갈림길 제단이 나타났습니다');}
  const al=RUN.altar;if(al){al.life-=dt;if(al.life<=0)RUN.altar=null;else if(Math.hypot(P.x-al.x,(P.y-al.y)*1.3)<62){al.on+=dt;if(al.on>=1){RUN.altar=null;openPact();}}else al.on=Math.max(0,al.on-dt*2);}
  /* 임무 */
  if(!RUN.quest){RUN.questT-=dt;if(RUN.questT<=0&&!(bossRef&&!bossRef.dead))newQuest();}
  else{const q=RUN.quest;q.left-=dt;
    if(q.Q.k==='nohit'&&RUN.lastHurt>q.start){questFail();return;}
    if(q.Q.k==='nohit'&&q.left<=0){questDone();return;}
    if(q.n>=q.need){questDone();return;}
    if(q.left<=0)questFail();}
}
function metaKill(e){
  pickOnKill(e);
  if(e.type==='tgob')goblinLoot(e);
  if(e.elite&&!e.boss&&RUN.eliteLoot>0){RUN.eliteLoot--;dropItem(e.x,e.y,4,.2);}
  const q=RUN.quest;if(q){if(q.Q.k==='kill')q.n++;else if(q.Q.k==='elite'&&e.elite&&!e.boss)q.n++;}
}
function metaChest(){const q=RUN.quest;if(q&&q.Q.k==='chest')q.n++;}
/* 상자: 열리면 0.9초 동안 등급 이름이 돌아가다 멈춘다(그동안 상자는 그 자리에) */
function chestOpen(c){const n=1+(Math.random()<.2?1:0);c.gis=[];for(let i=0;i<n;i++)c.gis.push(rollGrade(1,lootBoost()+1.5));c.spin=.95;c.best=Math.max(...c.gis);SFX.ui();metaChest();}
function chestSpinEnd(c){c.dead=1;c.gis.forEach((g,i)=>dropItem(c.x,c.y,g,i*.08));
  for(let i=0;i<8;i++)gems.push({x:c.x+rand(-24,24),y:c.y+rand(-16,16),v:Math.ceil(2*DIFF.xp(runT/60)),t:0,pull:0});
  puff(c.x,c.y-10,6,'#ffe08a');ring(c.x,c.y,10,300,GRADES[c.best].c);flash(c.x,c.y,220+c.best*60,.3);SFX.loot(Math.max(1,c.best));uiBanner(GRADES[c.best].k+' 상자');}

/* ───── 그리기 ───── */
function metaFx(){
  const al=RUN.altar;if(al&&state==='play'){const x=al.x,y=al.y,q=al.on;
    ctx.fillStyle='rgba(120,40,160,.25)';ell(ctx,x,y,62,62*.66);ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#b678ff';ctx.setLineDash([8,6]);ctx.lineDashOffset=-clock*20;ctx.stroke();ctx.setLineDash([]);
    if(q>0){ctx.lineWidth=6;ctx.strokeStyle='#ffe08a';ctx.beginPath();ctx.ellipse(x,y,70,46,0,-Math.PI/2,-Math.PI/2+TAU*Math.min(1,q));ctx.stroke();}
    rr(ctx,x-16,y-34,32,34,5);inkF(ctx,'#4a3a5e',3);rr(ctx,x-22,y-40,44,9,3);inkF(ctx,'#6b5a80',3);
    const f=Math.sin(clock*9)*2;blob(ctx,[[x,y-70-f],[x+9,y-50],[x+6,y-42],[x-6,y-42],[x-9,y-50]]);inkF(ctx,'#b678ff',2.4);ell(ctx,x,y-48,3.5,5);ctx.fillStyle='#ffe0ff';ctx.fill();
    lights.push([x,y-40,190,.8]);}
}
function metaGlow(){
  const al=RUN.altar;if(al&&state==='play')glow(al.x,al.y-50,70,'rgb(180,110,255)',.6);
  for(const e of enemies)if(e.type==='tgob'&&!e.dead){glow(e.x,e.y-30,60,'rgb(255,205,80)',.55);if(Math.random()<.2)addP({k:'ember',x:e.x+rand(-14,14),y:e.y-rand(10,50),vx:0,vy:-40,size:rand(1.2,2.4),life:.6,max:.6,col:'#ffd56a'});}
}
function metaTop(){
  ctx.textAlign='center';ctx.textBaseline='middle';
  for(const e of enemies){if(e.type!=='tgob'||e.dead)continue;const w=70,x=e.x-w/2,y=e.y-e.r*4.6;rr(ctx,x,y,w,9,4);inkF(ctx,'#0d0f1e',3);rr(ctx,x+2,y+2,Math.max(2,(w-4)*clamp(e.hp/e.maxhp,0,1)),5,2);ctx.fillStyle='#ffd56a';ctx.fill();
    const lft=Math.max(0,25-e.age);ctx.font='700 12px "Noto Sans KR","Malgun Gothic",sans-serif';ctx.lineWidth=4;ctx.strokeStyle=INK;ctx.strokeText(`보물 고블린 ${Math.ceil(lft)}`,e.x,y-10);ctx.fillStyle='#ffd56a';ctx.fillText(`보물 고블린 ${Math.ceil(lft)}`,e.x,y-10);}
  for(const c of chests){if(c.spin===undefined)continue;const fin=c.spin<.22,gi=fin?c.best:(clock*(10+30*c.spin)|0)%GRADES.length,G=GRADES[gi],y=c.y-62-(fin?6:0);
    ctx.font=`900 ${fin?24:19}px "Pretendard Variable",Pretendard,"Noto Sans KR","Malgun Gothic",sans-serif`;ctx.lineWidth=6;ctx.strokeStyle=INK;ctx.strokeText(G.k,c.x,y);ctx.fillStyle=G.c;ctx.fillText(G.k,c.x,y);}
  const al=RUN.altar;if(al&&state==='play'){ctx.font='700 12px "Noto Sans KR","Malgun Gothic",sans-serif';ctx.lineWidth=4;ctx.strokeStyle=INK;const t=`갈림길 제단 ${Math.ceil(al.life)}`;ctx.strokeText(t,al.x,al.y-92);ctx.fillStyle='#e0c8ff';ctx.fillText(t,al.x,al.y-92);}
}
function metaMinimap(mx,my){
  const al=RUN.altar;if(al){ctx.fillStyle='#b678ff';ell(ctx,mx(al.x),my(al.y),3.2,3.2);ctx.fill();ctx.lineWidth=1;ctx.strokeStyle=INK;ctx.stroke();}
  for(const e of enemies)if(e.type==='tgob'&&!e.dead){ctx.fillStyle='#ffd56a';ell(ctx,mx(e.x),my(e.y),3+Math.sin(clock*10),3+Math.sin(clock*10));ctx.fill();ctx.lineWidth=1;ctx.strokeStyle=INK;ctx.stroke();}
}
function metaHud(h){const q=RUN.quest,t=q?`임무 · ${q.Q.txt(q)} · ${Math.ceil(Math.max(0,q.left))}초`:'';if(h.qt!==t){h.qt=t;$('quest').textContent=t;}}

/* ───── ③ 분해 · 재련 ───── */
/* 11-15 대표님 "재련에 드는 재료를 더, 분해로 얻는 재료는 더 적게": 가루 [1,3,8,25,60]→[1,2,4,10,25], 재련 [2,5,12,30,60]→[6,15,40,100,200], 굴릴 때마다 +25%→+40% */
const DUST=[1,2,4,10,25],REF_COST=[6,15,40,100,200];
const dustOf=it=>DUST[it.gi]*(it.prime?2:1);
/* 11-16 ② 대표님 "완벽 재련은 너무 쉽다 → 2% 확률로 빛이 나면서 한 줄만 최대로, 최대치가 된 줄만 잠글 수 있고, 나머지 재련은 좀 더 비싸게":
   재련 = 잠기지 않은 줄을 모두 새로 굴린다(오르내림). 2%로 '빛나는 재련' — 잠기지 않은 줄 하나가 최대치가 된다.
   최대치인 줄만 잠글 수 있고, 잠근 줄 하나마다 재련값이 60%씩 비싸진다(잠그면 그 줄은 안 바뀜) */
const REF_GLOW=.02,REF_LOCK_COST=.6;
const refLocked=it=>it.lines.filter(l=>l.lock).length;
const refCost=it=>Math.round(REF_COST[it.gi]*(1+(it.rf||0)*.4)*(1+REF_LOCK_COST*refLocked(it)));
function refLineMax(it,l){const[,b]=itemRange(it,l.k);return l.v>=b;}
function refToggleLock(it,i){const l=it.lines[i];if(!l)return;if(l.lock)delete l.lock;else if(refLineMax(it,l))l.lock=1;saveNow();}
function refineAll(it){const c=refCost(it);if((SAVE.dust||0)<c)return null;const free=it.lines.filter(l=>!l.lock);if(!free.length)return null;SAVE.dust-=c;it.rf=(it.rf||0)+1;
  const old=it.lines.map(l=>({k:l.k,v:l.v})),q0=itemQuality(it),glow=Math.random()<REF_GLOW?pick(free):null;
  for(const l of free){const[a,b]=itemRange(it,l.k);const v=l===glow?b:a+(b-a)*Math.random();l.v=STAT[l.k].dec?Math.round(v*10)/10:Math.round(v);}
  recalc();saveNow();return{old,q0,q1:itemQuality(it),glow:glow?glow.k:null};}
function openRefine(it,slot,msg,res){
  const card=$('tipCard');card.innerHTML='';card.style.setProperty('--gc',gradeColor(it));
  if(res&&res.glow){const j=el('div','rjack','빛나는 재련!');j.append(el('small',null,`${STAT[res.glow].n} 최대치`));card.append(j);}
  describe(card,it);
  if(res){const box=el('div','rres');box.append(el('b',null,`완성도 ${res.q0}% → ${res.q1}%`));box.lastChild.className=res.q1>res.q0?'up':res.q1<res.q0?'dn':'';
    for(let i=0;i<it.lines.length;i++){const o=res.old[i],l=it.lines[i],d=l.v-o.v,r=el('div','rl'+(l.lock?' lk':d>0?' up':d<0?' dn':'')+(res.glow===l.k?' glow':''));
      r.append(el('span',null,l.lock?`${fmtLine(l.k,l.v)} (잠금)`:`${fmtLine(l.k,o.v)} → ${fmtLine(l.k,l.v)}`),el('em',null,l.lock?'🔒':refLineMax(it,l)?'최대!':d>0?'▲':d<0?'▼':'='));box.append(r);}card.append(box);}
  /* 줄 잠그기: 최대치인 줄만 */
  const lk=el('div','rlock');lk.append(el('b',null,'최대치인 줄은 잠글 수 있습니다 (잠근 줄은 재련해도 안 바뀜, 한 줄마다 재련값 +60%)'));
  it.lines.forEach((l,i)=>{const mx=refLineMax(it,l),b=btn(l.lock?`🔒 ${STAT[l.k].n}`:mx?`잠그기 · ${STAT[l.k].n}`:`${STAT[l.k].n}`,()=>{refToggleLock(it,i);SFX.ui();openRefine(it,slot,null,null);},'ghost sm'+(l.lock?' on':''));if(!mx&&!l.lock)b.disabled=true;lk.append(b);});
  card.append(lk);
  card.append(el('div','fx',`재련 · 잠그지 않은 줄을 모두 새로 굴립니다. 오를 수도, 내려갈 수도 있습니다. 아주 드물게(2%) 빛이 나며 한 줄이 최대치가 됩니다. 마력 가루 ${SAVE.dust||0}`));
  if(msg)card.append(el('div','fx rmsg',msg));
  const allLocked=!it.lines.some(l=>!l.lock),row=el('div','btns'),go=btn(allLocked?'모든 줄이 잠겨 있습니다':`재련하기 · 가루 ${refCost(it)}`,()=>{const r=refineAll(it);if(!r){openRefine(it,slot,'마력 가루가 모자랍니다. 안 쓰는 장비를 분해하세요.');return;}
    if(r.glow){SFX.win&&SFX.win();buzz(120);}else if(r.q1>r.q0)SFX.loot(Math.max(1,it.gi));else SFX.ui();openRefine(it,slot,null,r);},'go');
  if(allLocked)go.disabled=true;row.append(go,btn('돌아가기',()=>{openTip(it,slot);},'ghost sm'));card.append(row);show('tip',true);
}

/* ───── ④ 희귀 선택지 ───── */
const rareChance=()=>.03+.015*tal('rare'); /* 11-16 대표님 "너무 자주 나와 고르는 재미를 막는다": 7%→3% */
function canRare(kind,id){const lv=(kind==='act'?P.act:P.pas)[id]||0;return kind==='act'?lv+2<=SKILL_MAX:true;}

/* ───── ⑥ 도감 ───── */
function cxAll(){return{
  m:[...new Set(SPAWNS.map(s=>s.type).concat(['jellet','golem','treant','ogre','tgob'],Object.keys(BOSS_DEF)))],
  f:Object.keys(ACTIVES).filter(k=>ACTIVES[k].fuse),
  g:[].concat(...Object.keys(LEGENDS).map(t=>LEGENDS[t].map((L,i)=>`${t}:l${i}`)),...Object.keys(MYTHS).map(t=>MYTHS[t].map((M,i)=>`${t}:m${i}`)))};}
function cxSee(cat,key){const C=SAVE.cx||(SAVE.cx={m:{},f:{},g:{},done:{}});if(C[cat][key])return;C[cat][key]=1;
  if(state==='play'){RUN.newCx++;if(hardRun())RUN.shardBonus+=2;else RUN.dustBonus+=3;}
  const all=cxAll()[cat];if(!C.done[cat]&&all.every(k=>C[cat][k])){C.done[cat]=1;SAVE.dust=(SAVE.dust||0)+150;if(state==='play')uiBanner('도감 완성 · 마력 가루 +150');}}
function cxGear(it){if(it.gi===3)cxSee('g',`${it.t}:l${it.lg}`);else if(it.gi===4)cxSee('g',`${it.t}:m${it.my}`);}
const cxName=k=>{const[t,c]=k.split(':'),i=+c.slice(1);return c[0]==='l'?LEGENDS[t][i].n:MYTHS[t][i].n;};

/* ───── ⑦ 오늘의 도전 ───── */
const DAILY_MODS=[
  {n:'대군세',d:'적이 60% 더 많이 나오고, 경험치 +30%',ap(){RUN.spawn*=1.6;RUN.xp*=1.3;}},
  {n:'유리 대포',d:'최대 체력 -40%, 피해 +50%',ap(){RUN.php*=.6;RUN.pdmg*=1.5;}},
  {n:'황금의 날',d:'보물 고블린이 세 배 자주 나옵니다',ap(){RUN.gobEvery=1/3;RUN.gobT=40;}},
  {n:'폭주',d:'적 이동 속도 +25%, 경험치 +20%',ap(){RUN.espd*=1.25;RUN.xp*=1.2;}},
  {n:'거인의 날',d:'정예가 두 배 자주 나옵니다',ap(){RUN.eliteEvery=.5;}},
  {n:'혜안',d:'레벨업 선택지 +1, 적 체력 +30%',ap(){RUN.choice+=1;RUN.ehp*=1.3;}},
  {n:'계약의 날',d:'갈림길 제단이 두 배 자주 나옵니다',ap(){RUN.altarEvery=.5;RUN.altarT=60;}},
];
let dailySel=false;
function dayKey(){const d=new Date();return`${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;}
function dailyPlan(){const k=dayKey();let h=0;for(const ch of k)h=(h*31+ch.charCodeAt(0))>>>0;const r=rng(h);const map=Math.floor(r()*3),a=Math.floor(r()*DAILY_MODS.length);let b=Math.floor(r()*(DAILY_MODS.length-1));if(b>=a)b++;return{map,mods:[DAILY_MODS[a],DAILY_MODS[b]]};}
function dailyStart(){const p=dailyPlan();setMap(p.map);startRun(0);mode.t=600;mode.k='오늘';RUN.daily=true;for(const m of p.mods)m.ap();recalc();P.hp=P.maxhp;uiBanner('오늘의 도전');}

/* ───── 거점 ───── */
function metaLobbyInit(){
  const d=btn('',()=>{SFX.ui();soundOn();dailySel=true;riftSel=false;refreshLobby();},'');d.id='dailyBtn';d.append(el('b',null,'오늘의 도전'),el('i',null,''));$('dailyRow').append(d);
  $('talBtn').addEventListener('click',()=>{SFX.ui();soundOn();renderTal();show('lobby',false);show('tal',true);});
  $('talClose').addEventListener('click',()=>{show('tal',false);recalc();refreshLobby();});
  $('cxBtn').addEventListener('click',()=>{SFX.ui();soundOn();renderCx();show('lobby',false);show('cx',true);});
  $('cxClose').addEventListener('click',()=>{show('cx',false);});
}
function metaLobbyRefresh(){
  const p=dailyPlan(),done=SAVE.daily&&SAVE.daily.done===dayKey(),b=$('dailyBtn');b.setAttribute('aria-pressed',dailySel);b.lastChild.textContent=done?'오늘 깸 · 내일 새 도전':`${MAPS[p.map].k} · ${p.mods.map(m=>m.n).join(' · ')}`;
  $('talBtn').textContent=SAVE.shard?`특성 ${SAVE.shard}`:'특성';
  if(dailySel){show('modes',false);show('tierRow',false);$('modeLab').textContent='오늘의 규칙';$('riftBtn').setAttribute('aria-pressed',false);
    $('mapDesc').textContent=`${MAPS[p.map].k}에서 10분을 버티고 끝 보스를 잡으세요. `+p.mods.map(m=>`${m.n}: ${m.d}.`).join(' ');
    const sh=SAVE.dailyShard===dayKey();$('best').textContent=done?'오늘 보상은 모두 받았습니다. 다시 하면 마력 가루만 얻습니다.':sh?'오늘 어둠 결정은 받았습니다. 깨면 신화 장비 1개 확정 + 이번 판 결정·가루 4배.':'깨면 신화 장비 1개 확정 + 이번 판 어둠 결정·마력 가루 4배(평소 3~5판치, 하루 한 번). 첫 판은 버틴 만큼 결정도 얻습니다.';}
}
const TAL_ICON={hp:'p_vigor',dmg:'p_might',def:'p_hide',regen:'p_regen',move:'p_swift',pick:'p_magnet',xp:'p_learn',cdr:'p_focus',crit:'p_keen',reroll:'p_luck',rare:'p_luck',revive:'golden',choice:'p_learn'};
function renderTal(){const box=$('talList');box.innerHTML='';$('talShard').textContent=`어둠 결정 ${SAVE.shard||0} · 오늘의 도전·영겁의 굴레에서 얻습니다`;
  for(const t of TALENTS){const l=tal(t.id),c=talCost(t),row=el('div','talrow'+(l>=t.max?' max':''));const ic=el('img','talic');ic.src=skillIconURL(TAL_ICON[t.id]||'p_might');ic.alt='';row.append(ic);const tx=el('div');tx.append(el('b',null,t.n),el('span','lv',t.max===Infinity?`${l}단계`:`${l} / ${t.max}`),el('p',null,t.d));
    const b=btn(l>=t.max?'최대':`올리기 ${c}`,()=>{if(tal(t.id)>=t.max||(SAVE.shard||0)<c)return;SAVE.shard-=c;(SAVE.tal||(SAVE.tal={}))[t.id]=l+1;saveNow();SFX.level();renderTal();},'ghost sm');
    if(l>=t.max||(SAVE.shard||0)<c)b.disabled=true;row.append(tx,b);box.append(row);}}
function renderCx(){const C=SAVE.cx||(SAVE.cx={m:{},f:{},g:{},done:{}}),A=cxAll(),box=$('cxList');box.innerHTML='';
  const sec=(title,cat)=>{const n=A[cat].filter(k=>C[cat][k]).length;box.append(el('div','cxh',`${title} ${n} / ${A[cat].length}`+(C.done[cat]?' · 완성':' · 다 모으면 마력 가루 +150')));const g=el('div','cxg');box.append(g);return g;};
  let g=sec('적','m');for(const k of A.m){const t=el('div','cxt'+(C.m[k]?'':' no'));{const im=el('img');im.src=mobURL(k);im.alt='';t.append(im);}t.append(el('small',null,C.m[k]?ET[k].n:'???'));g.append(t);}
  g=sec('조합 스킬','f');for(const k of A.f){const t=el('div','cxt'+(C.f[k]?'':' no'));const im=el('img');im.src=skillIconURL(k);im.alt='';t.append(im,el('small',null,C.f[k]?ACTIVES[k].n:'???'));g.append(t);}
  g=sec('전설 · 신화 장비','g');g.classList.add('names');for(const k of A.g){const my=k.split(':')[1][0]==='m',s=el('span',C.g[k]?(my?'my':'lg'):'no',C.g[k]?cxName(k):'???');g.append(s);}}
