'use strict';
/* 다크 드웰러 — 더한 스킬(대표님 구성표 참고): 번개·냉기·독·암흑 계열, 소환물, 조합 스킬.
   game.js 의 규칙에 얹힌다: update2(판 계산), onKill2(처치할 때), onSlash2(벨 때), render2*(그리기), drawSkillIcon2(아이콘) */
let allies=[],zones2=[],darks=[],drains=[],suns=[];
function clear2(){allies=[];zones2=[];darks=[];drains=[];suns=[];skill3Reset();}

/* 계열 이름표와 구성표에 맞춘 이름 */
const EL_OF={slash:'물리',blade:'물리',axe:'물리',bolt:'화염',meteor:'화염',zap:'번개',spear:'냉기',vine:'독',wave:'빛',storm:'물리',saw:'물리',shower:'화염',tring:'번개',frost:'냉기',plasma:'번개'};
for(const k in EL_OF)ACTIVES[k].el=EL_OF[k];
ACTIVES.bolt.n='화염구';ACTIVES.meteor.n='화염 낙하';ACTIVES.axe.n='도끼 투척';

/* ───── 공용 동작 ───── */
function strikeAt(x,y,R,dmg,stun,heavy,gold){ // gold: 제우스의 천뇌(금빛 벼락)
  for(const e of enemies){if(e.dead)continue;const dx=e.x-x,dy=e.y-y,d=Math.hypot(dx,dy);if(d<R+e.r){if(stun)e.stun=Math.max(e.stun,.5);hitEnemy(e,dmg,dx/(d||1),dy/(d||1),160,'zap',false,heavy);}}
  const z=makeZap([[x+rand(-40,40),y-520],[x+rand(-18,18),y-260],[x,y]]);z.life=z.max=.2;if(gold){z.gold=1;pillar(x,y,260,22,'#ffe08a');}zaps.push(z);flash(x,y,R*2.6,.18);ring(x,y,10,R*4,gold?'#ffe08a':'#bfe9ff');if(can('strike',90))SFX.zap();
}
function slashAt(x,y,a,R,dmg,heavy){
  slashes.push({x,y:y-20,a,R,life:.22,max:.22});
  for(const e of enemies){if(e.dead)continue;const dx=e.x-x,dy=e.y-y,d=Math.hypot(dx,dy);if(d>R+e.r)continue;let da=Math.atan2(dy,dx)-a;da=Math.atan2(Math.sin(da),Math.cos(da));
    if(Math.abs(da)<1.25||d<e.r+20)hitEnemy(e,dmg,dx/(d||1),dy/(d||1),260,'cut',false,heavy);}
}
function spinAt(x,y,R,dmg){
  slashes.push({x,y:y-20,a:0,R,life:.2,max:.2},{x,y:y-20,a:Math.PI,R,life:.2,max:.2});
  for(const e of enemies){if(e.dead)continue;const dx=e.x-x,dy=e.y-y,d=Math.hypot(dx,dy);if(d<R+e.r)hitEnemy(e,dmg,dx/(d||1),dy/(d||1),220,'cut',false,true);}
}
/* 사신의 낫: 범위 안을 베고, 약해진 적(보스 제외)은 바로 처형 */
function reap(x,y,R,dmg,exec){
  slashes.push({x,y:y-20,a:Math.random()*TAU,R:R*1.15,life:.25,max:.25});
  for(const e of enemies){if(e.dead)continue;const dx=e.x-x,dy=e.y-y,d=Math.hypot(dx,dy);if(d<R+e.r){if(!e.boss&&e.hp<e.maxhp*exec){e.hp=0;reactFx(e,'처형','#e56bff');}hitEnemy(e,dmg,dx/(d||1),dy/(d||1),240,'cut',false,true);}}
  if(can('reap',120))SFX.slash();
}
/* 소환물 수 맞추기: 모자라면 부르고, 단계 옵션(p)을 갱신 */
function keepAllies(k,n,p){
  let c=0;for(const a of allies)if(a.k===k){a.p=p;a.slot=c++;}
  for(;c<n;c++)allies.push({kind:'ally',k,x:P.x+rand(-30,30),y:P.y+rand(-20,20),t:rand(.2,1),ph:rand(0,6),slot:c,p,dir:1,sw:0,move:false});
}
const UP_FUSE=[['피해 +20%',{dmg:.2}],['범위 +20%',{area:.2}],['쿨타임 -15%',{cd:.15}],['피해 +25%',{dmg:.25}],['범위 +20%',{area:.2}]];
const UP_SPIRIT=[['+1마리',{count:1}],['피해 +25%',{dmg:.25}],['공격 속도 +30%',{spin:.3}],['+1마리',{count:1}],['피해 +30%',{dmg:.3}],['공격 속도 +30%',{spin:.3}],['+1마리',{count:1}],['피해 +30%',{dmg:.3}]];

Object.assign(ACTIVES,{
  /* ── 번개·냉기·독·암흑 ── */
  strike:{n:'낙뢰',el:'번개',d:'무작위 적의 머리 위로 벼락을 떨어뜨립니다.',cd:2.4,
    ups:[['+1줄기',{count:1}],['감전: 맞은 적이 0.5초 멈춥니다',{stun:1}],['피해 +25%',{dmg:.25}],['+1줄기',{count:1}],['범위 +25%',{area:.25}],['쿨타임 -20%',{cd:.2}],['+2줄기',{count:2}],['피해 +30%',{dmg:.3}]],
    fire(p){const near=enemies.filter(e=>!e.dead&&Math.hypot(e.x-P.x,e.y-P.y)<480);if(!near.length)return false;
      for(let i=0;i<1+p.count;i++){const t=pick(near),x=t.x,y=t.y;later(i*.09,()=>strikeAt(x,y,58*p.area*AREA,38*p.dmg,p.stun,false,true));}return true;}},
  blizz:{n:'눈보라',el:'냉기',d:'적이 몰린 곳에 눈보라를 일으켜 느리게 만들고 계속 피해를 줍니다.',cd:6,
    ups:[['빙결: 처음 닿은 적이 1초 얼어붙습니다',{freeze:1}],['범위 +20%',{area:.2}],['피해 +25%',{dmg:.25}],['지속 +2초',{life:2}],['+1곳',{count:1}],['피해 +30%',{dmg:.3}],['범위 +20%',{area:.2}],['쿨타임 -20%',{cd:.2}]],
    fire(p){const t=nearest(P.x,P.y,380);if(!t)return false;const used=new Set([t]),life=4+(p.life||0);
      const put=e=>zones2.push({k:'blizz',x:e.x,y:e.y,R:118*p.area*AREA,life,max:life,tick:0,dmg:8*p.dmg,freeze:p.freeze,seen:new Set(),sd:Math.random()*1e9|0});
      put(t);for(let i=0;i<p.count;i++){const o=nearest(P.x+rand(-220,220),P.y+rand(-220,220),440,used);if(o){used.add(o);put(o);}}SFX.spear();return true;}},
  cloud:{n:'독구름',el:'독',d:'독구름을 피워 안에 든 적을 중독시킵니다.',cd:5,
    ups:[['전염: 중독된 적이 죽으면 주위로 옮습니다',{spread:1}],['범위 +20%',{area:.2}],['피해 +25%',{dmg:.25}],['지속 +2초',{life:2}],['+1곳',{count:1}],['약화: 구름 속 적이 받는 피해 +20%',{weak:1}],['피해 +30%',{dmg:.3}],['쿨타임 -20%',{cd:.2}]],
    fire(p){const t=nearest(P.x,P.y,360);if(!t)return false;const used=new Set([t]),life=5+(p.life||0);
      const put=e=>zones2.push({k:'cloud',x:e.x,y:e.y,R:92*p.area*AREA,life,max:life,tick:0,dmg:7*p.dmg,weak:p.weak,sd:Math.random()*1e9|0});
      put(t);for(let i=0;i<p.count;i++){const o=nearest(P.x+rand(-220,220),P.y+rand(-220,220),440,used);if(o){used.add(o);put(o);}}SFX.vine();return true;}},
  dark:{n:'암흑 구체',el:'암흑',d:'천천히 나아가며 닿는 적을 모두 꿰뚫는 암흑 구체를 쏩니다.',cd:2.8,
    ups:[['끌어당김: 지나가며 주위 적을 끌어당깁니다',{pull:1}],['+1개',{count:1}],['끝에서 터집니다',{burst:1}],['피해 +25%',{dmg:.25}],['크기 +30%',{big:.3}],['+1개',{count:1}],['피해 +30%',{dmg:.3}],['쿨타임 -20%',{cd:.2}]],
    fire(p){const t=nearest(P.x,P.y,520);if(!t)return false;const n=1+p.count,a0=Math.atan2(t.y-12-(P.y-24),t.x-P.x);
      for(let i=0;i<n;i++){const a=a0+(i-(n-1)/2)*.35;darks.push({x:P.x,y:P.y-24,vx:Math.cos(a)*230,vy:Math.sin(a)*230,life:2.2,t:0,r:16*(1+(p.big||0)),dmg:34*p.dmg,pull:p.pull,burst:p.burst,hit:new Map()});}
      SFX.cast();return true;}},
  drain:{n:'생명 흡수',el:'암흑',d:'가까운 적의 생명력을 빨아들여 체력을 채웁니다.',cd:3.2,
    ups:[['회복 2배',{heal:1}],['+1줄기',{count:1}],['피해 +25%',{dmg:.25}],['사거리 +30%',{area:.3}],['+1줄기',{count:1}],['지속 +0.6초',{life:.6}],['피해 +30%',{dmg:.3}],['쿨타임 -20%',{cd:.2}]],
    fire(p){const used=new Set();let n=0;for(let i=0;i<1+p.count;i++){const t=nearest(P.x,P.y,300*p.area,used);if(!t)break;used.add(t);drains.push({e:t,life:1.2+(p.life||0),tick:0,dmg:9*p.dmg,heal:.004*(p.heal?2:1)});n++;}
      if(n)SFX.cast();return n>0;}},
  /* ── 소환물: 배우면 늘 곁에 있다 ── */
  sfire:{n:'화염 정령',el:'소환',d:'곁을 맴돌며 불씨를 쏘는 정령을 부릅니다.',ups:UP_SPIRIT.map((u,i)=>i===4?['화상을 입힙니다',{burn:1}]:u),tick(dt,p){keepAllies('fire',1+p.count,p);}},
  sice:{n:'얼음 정령',el:'소환',d:'곁을 맴돌며 얼음 조각을 쏘아 적을 느리게 하는 정령을 부릅니다.',ups:UP_SPIRIT.map((u,i)=>i===4?['얼음 조각이 적을 얼립니다',{freeze:1}]:u),tick(dt,p){keepAllies('ice',1+p.count,p);}},
  szap:{n:'번개 정령',el:'소환',d:'곁을 맴돌며 적에서 적으로 튀는 번개를 쏘는 정령을 부릅니다.',ups:UP_SPIRIT.map((u,i)=>i===4?['번개가 2번 더 튑니다',{chain:2}]:u),tick(dt,p){keepAllies('zap',1+p.count,p);}},
  skel:{n:'해골 병사',el:'소환',d:'가까운 적에게 달려가 칼로 베는 해골 병사 둘을 부릅니다.',
    ups:[['+1명',{count:1}],['피해 +25%',{dmg:.25}],['휩쓸기: 벨 때 주위 적도 함께 벱니다',{cleave:1}],['+1명',{count:1}],['피해 +30%',{dmg:.3}],['+1명',{count:1}],['공격 속도 +30%',{spin:.3}],['+2명',{count:2}]],
    tick(dt,p){keepAllies('skel',2+p.count,p);}},
  reaper:{n:'사신 소환',el:'소환',d:'큰 낫을 휘두르는 사신을 부릅니다. 체력이 20% 아래인 적은 바로 처형합니다.',
    ups:[['처형 기준 +10%',{exec:.1}],['피해 +25%',{dmg:.25}],['낫 범위 +25%',{area:.25}],['공격 속도 +30%',{spin:.3}],['+1명',{count:1}],['피해 +30%',{dmg:.3}],['처형 기준 +10%',{exec:.1}],['공격 속도 +30%',{spin:.3}]],
    tick(dt,p){keepAllies('reaper',1+p.count,p);}},
  clone:{n:'그림자 분신',el:'소환',d:'분신이 따라다니며, 내가 벨 때마다 함께 벱니다.',
    ups:[['+1명',{count:1}],['분신 피해 +25%',{dmg:.25}],['+1명',{count:1}],['분신 피해 +30%',{dmg:.3}],['+1명',{count:1}],['분신 피해 +30%',{dmg:.3}],['+1명',{count:1}],['분신 피해 +30%',{dmg:.3}]],
    tick(dt,p){keepAllies('clone',1+p.count,p);}},
  /* ── 조합 스킬 ── */
  sun:{n:'태양의 심판',el:'화염',fuse:['bolt','strike'],d:'머리 위에 태양이 떠올랐다가 터지며 벼락이 쏟아집니다.',cd:9,
    ups:[['피해 +20%',{dmg:.2}],['범위 +20%',{area:.2}],['벼락 +4줄기',{count:4}],['쿨타임 -15%',{cd:.15}],['피해 +25%',{dmg:.25}]],
    fire(p){if(!nearest(P.x,P.y,360))return false;suns.push({t:1.1,max:1.1,R:250*p.area*AREA,dmg:120*p.dmg,n:6+p.count});SFX.wave();return true;}},
  zero:{n:'절대영도',el:'냉기',fuse:['blizz','spear'],d:'주위의 모든 적을 한꺼번에 얼리고 부숩니다.',cd:10,
    ups:[['피해 +20%',{dmg:.2}],['빙결 +1초',{life:1}],['범위 +20%',{area:.2}],['쿨타임 -15%',{cd:.15}],['피해 +25%',{dmg:.25}]],
    fire(p){const R=320*p.area*AREA;if(!nearest(P.x,P.y,R))return false;const f=2+(p.life||0);
      for(const e of enemies){if(e.dead)continue;const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy);if(d<R+e.r){e.stun=Math.max(e.stun,e.boss?f*.4:f);e.ice=e.boss?f*.4:f;hitEnemy(e,44*p.dmg,dx/(d||1),dy/(d||1),60,'ice',false,true);}}
      ring(P.x,P.y,30,R*3.2,'#d8f6ff');ring(P.x,P.y,16,R*2.2,'#9fd8ff');debris(P.x,P.y,['#bfe9ff','#f4fcff','#86c2ec'],16,1.8);flash(P.x,P.y,R*1.6,.4);shake(.2);SFX.spear();SFX.wave();return true;}},
  smite:{n:'천벌의 낙뢰',el:'번개',fuse:['strike','zap'],d:'큰 벼락이 떨어지고 그 자리에서 번개가 사방으로 튑니다.',cd:5,
    ups:[['피해 +20%',{dmg:.2}],['+1줄기',{count:1}],['쿨타임 -15%',{cd:.15}],['피해 +25%',{dmg:.25}],['+2줄기',{count:2}]],
    fire(p){const near=enemies.filter(e=>!e.dead&&Math.hypot(e.x-P.x,e.y-P.y)<480);if(!near.length)return false;
      for(let i=0;i<3+p.count;i++){const t=pick(near);later(i*.18,()=>{if(t.dead||P.dead)return;thunder(t.x,t.y,70*p.dmg);zapRun(t,[t.x,t.y-200],5,26*p.dmg,{});});}return true;}},
  harvest:{n:'영혼 수확',el:'암흑',fuse:['drain','reaper'],d:'사신이 곁에서 싸우고, 적을 처치할 때마다 영혼을 거둬 체력을 채우며 가끔 그 자리에 낫이 떨어집니다.',
    ups:[['낫 피해 +25%',{dmg:.25}],['사신 +1명',{count:1}],['낫 피해 +30%',{dmg:.3}],['처형 기준 +10%',{exec:.1}],['낫 피해 +30%',{dmg:.3}]],tick(dt,p){keepAllies('reaper',1+p.count,p);}},
  legion:{n:'무한의 분신',el:'소환',fuse:['clone','slash'],d:'분신 셋이 따라다니며 내가 벨 때 함께 베고, 스스로 회전 베기도 합니다.',
    ups:[['분신 피해 +25%',{dmg:.25}],['+1명',{count:1}],['분신 피해 +30%',{dmg:.3}],['+1명',{count:1}],['분신 피해 +30%',{dmg:.3}]],tick(dt,p){keepAllies('clone',3+p.count,p);}},
  miasma:{n:'죽음의 안개',el:'독',fuse:['cloud','dark'],d:'몸 주위에 검은 독안개가 퍼져 적을 좀먹고 체력을 빨아들입니다.',cd:8,
    ups:[['피해 +20%',{dmg:.2}],['지속 +2초',{life:2}],['범위 +20%',{area:.2}],['쿨타임 -15%',{cd:.15}],['피해 +25%',{dmg:.25}]],
    fire(p){if(!nearest(P.x,P.y,260))return false;const life=5+(p.life||0);zones2.push({k:'miasma',x:P.x,y:P.y,R:165*p.area*AREA,life,max:life,tick:0,dmg:14*p.dmg,sd:Math.random()*1e9|0});SFX.cast();return true;}},
});

/* 조합으로 재료 스킬이 사라지면 그 스킬의 소환물도 걷는다 */
const ALLY_OWNER={fire:['sfire'],ice:['sice'],zap:['szap'],skel:['skel'],reaper:['reaper','harvest'],clone:['clone','legion']};
function pruneAllies(){allies=allies.filter(a=>ALLY_OWNER[a.k].some(id=>P.act[id]));blades.length=0;saws.length=0;}

/* ───── 엮는 곳 ───── */
function onSlash2(a,R,dmg){const p=P.pk.clone||P.pk.legion;if(!p)return;for(const c of allies)if(c.k==='clone'){c.sw=.25;slashAt(c.x,c.y,a,R*.85,dmg*.6*p.dmg);}}
function onKill2(e){
  const pc=P.pk.cloud;
  if(pc&&pc.spread&&e.dotT>0&&e.dotK==='vine'){for(const o of enemies){if(o===e||o.dead)continue;if(Math.hypot(o.x-e.x,o.y-e.y)<90+o.r)setDot(o,e.dps,2.5,'vine');}puff(e.x,e.y-10,3,'#9cd16a');}
  if(P.act.harvest&&!P.dead){P.hp=Math.min(P.maxhp,P.hp+P.maxhp*.005);ember(e.x,e.y-e.r,2,6,60,'#e56bff');
    if(Math.random()<.12&&can('hv',400)){const x=e.x,y=e.y,d=50*P.pk.harvest.dmg;later(.05,()=>reap(x,y,80*AREA,d,.2));}}
}
function allyTick(a,dt){
  a.ph+=dt;a.t-=dt;a.sw-=dt;const p=a.p;
  if(a.k==='fire'||a.k==='ice'||a.k==='zap'){ // 정령: 주인 곁을 맴돌며 쏜다
    const an=a.ph*1.1+a.slot*2.1+(a.k==='ice'?2:a.k==='zap'?4:0),tx=P.x+Math.cos(an)*62,ty=P.y-8+Math.sin(an)*34;a.x+=(tx-a.x)*Math.min(1,dt*5);a.y+=(ty-a.y)*Math.min(1,dt*5);
    if(a.t<=0){const t=nearest(a.x,a.y,380);if(!t){a.t=.3;return;}a.t=(a.k==='zap'?1.9:1.15)/(1+(p.spin||0));a.dir=t.x>a.x?1:-1;const ang=Math.atan2(t.y-12-(a.y-30),t.x-a.x);
      if(a.k==='fire')bolts.push({x:a.x,y:a.y-30,vx:Math.cos(ang)*440,vy:Math.sin(ang)*440,life:1.2,t,dmg:12*p.dmg,R:40*AREA,burn:p.burn,mini:true});
      else if(a.k==='ice')shots.push({k:'spear',x:a.x,y:a.y-30,vx:Math.cos(ang)*560,vy:Math.sin(ang)*560,a:ang,life:.7,dmg:11*p.dmg,r:8,freeze:p.freeze,hit:new Set()});
      else zapRun(t,[a.x,a.y-30],2+(p.chain||0),13*p.dmg,{});}
  }else if(a.k==='skel'){ // 해골 병사: 가까운 적에게 달려가 벤다. 주인에게서 너무 멀어지면 돌아온다
    const far=Math.hypot(a.x-P.x,a.y-P.y)>300,t=far?null:nearest(a.x,a.y,260);let tx=P.x+Math.cos(a.slot*2.4)*46,ty=P.y+Math.sin(a.slot*2.4)*30;
    if(t){tx=t.x;ty=t.y;}const dx=tx-a.x,dy=ty-a.y,d=Math.hypot(dx,dy)||1,reach=t?t.r+20:6;
    if(d>reach){const v=(far?260:150)*dt;a.x+=dx/d*Math.min(v,d);a.y+=dy/d*Math.min(v,d);a.move=true;}else a.move=false;
    if(Math.abs(dx)>3)a.dir=dx>0?1:-1;
    if(t&&d<=reach+6&&a.t<=0){a.t=.8/(1+(p.spin||0));a.sw=.2;hitEnemy(t,14*p.dmg,dx/d,dy/d,200,'cut');
      if(p.cleave)for(const e of enemies){if(e!==t&&!e.dead&&Math.hypot(e.x-a.x,e.y-a.y)<60+e.r)hitEnemy(e,8*p.dmg,dx/d,dy/d,120,'cut',true);}}
  }else if(a.k==='reaper'){ // 사신: 가까운 적 곁으로 떠가서 큰 낫을 휘두른다
    const t=nearest(P.x,P.y,340);let tx=P.x-40-a.slot*30,ty=P.y-10;if(t){tx=t.x-a.dir*30;ty=t.y;}a.x+=(tx-a.x)*Math.min(1,dt*2.2);a.y+=(ty-a.y)*Math.min(1,dt*2.2);if(t)a.dir=t.x>a.x?1:-1;
    if(t&&a.t<=0&&Math.hypot(t.x-a.x,t.y-a.y)<90){a.t=2.6/(1+(p.spin||0));a.sw=.3;reap(a.x,a.y,86*p.area*AREA,60*p.dmg,.2+(p.exec||0));}
  }else{ // 그림자 분신: 주인을 따라다닌다. 조합(무한의 분신)을 배우면 스스로 회전 베기
    const an=a.slot*2.2+1,tx=P.x+Math.cos(an)*54,ty=P.y+Math.sin(an)*36;a.x+=(tx-a.x)*Math.min(1,dt*6);a.y+=(ty-a.y)*Math.min(1,dt*6);a.dir=P.dir;
    if(P.act.legion&&a.t<=0){a.t=1.6;a.sw=.25;spinAt(a.x,a.y,92*AREA,22*P.pk.legion.dmg);const t=nearest(a.x,a.y,420);if(t){const an=Math.atan2(t.y-a.y,t.x-a.x);axes.push({x:a.x,y:a.y-22,vx:Math.cos(an)*560,vy:Math.sin(an)*560,t:0,hv:0,size:.8,dmg:16*P.pk.legion.dmg,hit:new Map()});}} // 분광검영: 회전 베기 + 비도
  }
}
function update2(dt,over){
  for(const e of enemies)if(e.weak>0)e.weak-=dt;
  // 눈보라·독구름·죽음의 안개
  for(const z of zones2){z.life-=dt;z.tick-=dt;if(z.k==='miasma'){z.x=P.x;z.y=P.y;}
    if(z.tick<=0){z.tick=z.k==='blizz'?.4:.5;let hits=0;
      for(const e of enemies){if(e.dead)continue;const dx=e.x-z.x,dy=(e.y-z.y)*1.5;if(dx*dx+dy*dy>(z.R+e.r)*(z.R+e.r))continue;hits++;
        if(z.k==='blizz'){e.slow=1;if(z.freeze&&!z.seen.has(e)){z.seen.add(e);e.stun=Math.max(e.stun,1);e.ice=1;}hitEnemy(e,z.dmg,0,0,0,'ice',true);}
        else{if(z.weak)e.weak=1;setDot(e,z.dmg*2,2.5,'vine');hitEnemy(e,z.dmg,0,0,0,z.k==='miasma'?'thud':'vine',true,z.k==='miasma');}}
      if(z.k==='miasma'&&hits&&!P.dead)P.hp=Math.min(P.maxhp,P.hp+P.maxhp*.003*Math.min(hits,8));}}
  zones2=zones2.filter(z=>z.life>0&&!(z.k==='miasma'&&P.dead));
  // 암흑 구체
  for(const o of darks){o.life-=dt;o.t+=dt;o.x+=o.vx*dt;o.y+=o.vy*dt;
    for(const e of enemies){if(e.dead)continue;const dx=e.x-o.x,dy=e.y-e.r*.6-o.y,d=Math.hypot(dx,dy)||1;
      if(o.pull&&d<110&&d>12){e.kx-=dx/d*520*dt*e.T.kb;e.ky-=dy/d*520*dt*e.T.kb;}
      if(d<e.r+o.r&&(o.hit.get(e)||-1)<o.t-.45){o.hit.set(e,o.t);hitEnemy(e,o.dmg,o.vx/230,o.vy/230,90,'thud');if(o.leech&&!P.dead&&can('lch',60)){P.hp=Math.min(P.maxhp,P.hp+P.maxhp*.002*o.leech);ember(e.x,e.y-e.r,1,4,60,'#e56bff');}}}
    if(o.life<=0&&o.burst){for(const e of enemies){if(e.dead)continue;const dx=e.x-o.x,dy=e.y-e.r*.6-o.y,d=Math.hypot(dx,dy);if(d<90*AREA+e.r)hitEnemy(e,o.dmg*1.5,dx/(d||1),dy/(d||1),240,'thud');}
      starFx(o.x,o.y,40,'#e56bff');ring(o.x,o.y,10,360,'#b678ff');flash(o.x,o.y,200,.2);if(can('boom',70))SFXH.thud();}}
  darks=darks.filter(o=>o.life>0);
  // 생명 흡수
  for(const d of drains){d.life-=dt;d.tick-=dt;if(d.e.dead||P.dead){d.life=0;continue;}
    if(d.tick<=0){d.tick=.2;const dx=d.e.x-P.x,dy=d.e.y-P.y,dd=Math.hypot(dx,dy)||1;hitEnemy(d.e,d.dmg,-dx/dd,-dy/dd,40,'thud',true);P.hp=Math.min(P.maxhp,P.hp+P.maxhp*d.heal);}}
  drains=drains.filter(d=>d.life>0);
  // 태양의 심판: 1.1초 뒤에 터진다
  for(const s of suns){s.t-=dt;if(s.t>0)continue;s.dead=1;if(P.dead)continue;
    for(const e of enemies){if(e.dead)continue;const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy);if(d<s.R+e.r)hitEnemy(e,s.dmg,dx/(d||1),dy/(d||1),320,'fire',false,true);}
    const near=enemies.filter(e=>!e.dead&&Math.hypot(e.x-P.x,e.y-P.y)<520);for(let i=0;i<s.n&&near.length;i++){const t=pick(near),x=t.x,y=t.y;later(.1+i*.07,()=>strikeAt(x,y,60*AREA,s.dmg*.35,false,true));}
    starFx(P.x,P.y-70,96,'#ffe08a');ring(P.x,P.y,30,s.R*3.4,'#ffe08a');ring(P.x,P.y,14,s.R*2.2,'#ff8a2e');pillar(P.x,P.y,460,96,'#ffd27a');ember(P.x,P.y-40,24,s.R*.5,160);flash(P.x,P.y,760,.5);shake(.3);SFX.boom();SFX.thunder();}
  suns=suns.filter(s=>!s.dead);
  // 소환물
  if(!over&&!P.dead)for(const a of allies)allyTick(a,dt);
}

/* ───── 그림 ───── */
function drawSpirit(g,p,cA,cB,cC){const s=Math.sin(p*TAU),c=Math.cos(p*TAU);
  cel(g,()=>blob(g,[[-9,-16],[-8,-27],[-3+s*2,-38],[2+s*3,-43],[4+s,-34],[8,-27],[9,-16],[6,-7+c*2],[2,-12],[0,-5-c*2],[-3,-12],[-7,-7+s*2]]),cA,()=>{g.fillStyle=cB;ell(g,0,-8,14,6);g.fill();g.fillStyle=cC;ell(g,-1,-25,4,6);g.fill();},2.6);
  g.fillStyle=INK;ell(g,-3.2,-21,1.7,2.6);g.fill();ell(g,3.2,-21,1.7,2.6);g.fill();}
function drawSkel(g,p){const s=Math.sin(p*TAU),b=Math.abs(s)*2;
  g.beginPath();g.moveTo(-5,-14);g.lineTo(-6-s*4,-1);g.moveTo(5,-14);g.lineTo(6+s*4,-1);g.lineWidth=5;g.strokeStyle=INK;g.stroke();g.lineWidth=2;g.strokeStyle='#efe6cf';g.stroke();
  g.save();g.translate(0,-b);
  g.save();g.translate(12,-20);g.rotate(.5);poly(g,[[-2,2],[-2,-16],[0,-21],[2,-16],[2,2]]);inkF(g,'#c9d1e0',2.2);rr(g,-5,2,10,2.6,1);inkF(g,'#8a5a1c',2);g.restore();
  cel(g,()=>blob(g,[[-8,-13],[-9,-26],[0,-30],[9,-26],[8,-13],[0,-11]]),'#efe6cf',()=>{g.fillStyle='#b9ab8c';ell(g,-6,-18,5,9);g.fill();},2.6);
  g.lineWidth=1.6;g.strokeStyle=INK;g.beginPath();g.moveTo(-5,-23);g.lineTo(5,-23);g.moveTo(-5,-19);g.lineTo(5,-19);g.moveTo(-4,-15.5);g.lineTo(4,-15.5);g.stroke();
  cel(g,()=>blob(g,[[-9,-33],[-9,-43],[0,-48],[9,-43],[9,-33],[4,-29],[-4,-29]]),'#f6efdc',()=>{g.fillStyle='#c9bd9f';ell(g,-7,-36,5,8);g.fill();},2.6);
  g.fillStyle=INK;ell(g,-3.2,-38,2.2,2.8);g.fill();ell(g,3.6,-38,2.2,2.8);g.fill();g.fillRect(-2.6,-32.5,1.3,2.6);g.fillRect(.2,-32.5,1.3,2.6);
  g.restore();}
function drawReaper(g,p){const s=Math.sin(p*TAU),c=Math.cos(p*TAU);
  g.save();g.translate(17,-36);g.rotate(.25+s*.05);rr(g,-1.8,-30,3.6,62,1.6);inkF(g,'#4a3a2e',2.4);g.beginPath();g.moveTo(0,-30);g.quadraticCurveTo(-26,-42,-36,-18);g.quadraticCurveTo(-20,-31,0,-24);g.closePath();inkF(g,'#d2daea',2.6);g.restore();
  cel(g,()=>blob(g,[[-15,-8+c*2],[-14,-36],[-8,-56],[0,-64],[8,-56],[14,-36],[15,-8+s*2],[8,-2],[3,-9],[-2,-1+c*2],[-8,-8]]),'#2a2340',()=>{g.fillStyle='#1b1630';ell(g,-10,-30,9,30);g.fill();},3);
  ell(g,0,-48,7.5,8);g.fillStyle='#0b0a14';g.fill();g.fillStyle='#e56bff';ell(g,-3,-48,1.6,2.2);g.fill();ell(g,3,-48,1.6,2.2);g.fill();}
const ALLY_SPR={
  fire:frames(40,56,20,48,(g,p)=>drawSpirit(g,p,'#ff9a3c','#e0602a','#ffe9a8')),
  ice:frames(40,56,20,48,(g,p)=>drawSpirit(g,p,'#bfe9ff','#86c2ec','#f4fcff')),
  zap:frames(40,56,20,48,(g,p)=>drawSpirit(g,p,'#ffe066','#e0a82a','#fffbe0')),
  skel:frames(60,66,28,58,drawSkel),
  reaper:frames(96,96,50,84,drawReaper),
};
/* 그림자 분신: 주인공 그림을 보랏빛 그림자로 물들인 것 */
let cloneSpr=null;
function cloneSprite(){
  if(cloneSpr||!heroIm.complete||!heroIm.naturalWidth)return cloneSpr;
  const h=180,w=Math.round(h*heroIm.naturalWidth/heroIm.naturalHeight),c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');
  g.drawImage(heroIm,0,0,w,h);g.globalCompositeOperation='source-atop';g.fillStyle='rgba(52,24,110,.82)';g.fillRect(0,0,w,h);c.wr=w/h;return cloneSpr=c;
}
const ALLY_GLOW={fire:'rgb(255,150,60)',ice:'rgb(120,200,255)',zap:'rgb(255,225,100)'};
function drawAlly(a){
  ctx.fillStyle='rgba(8,8,20,.36)';ell(ctx,a.x,a.y+2,a.k==='reaper'?16:10,a.k==='reaper'?6:4);ctx.fill();
  if(a.k==='clone'){const sp=cloneSprite();if(!sp)return;const w=60*sp.wr;ctx.save();ctx.translate(a.x,a.y-Math.sin(a.ph*2.2)*1.5);ctx.scale(a.dir,1);if(a.sw>0)ctx.rotate(-.3+(1-a.sw/.25)*.5);ctx.globalAlpha=.82;ctx.drawImage(sp,-w*.55,-58,w,60);ctx.restore();return;}
  const sp=ALLY_SPR[a.k],moving=a.k==='skel'?a.move:true,f=((moving?a.ph*(a.k==='skel'?2.6:1.3):0)*NF|0)%NF,fy=a.k==='skel'?0:-8+Math.sin(a.ph*3)*3,k=a.sw>0?1.14:1;
  blit(sp.frames[f],a.x,a.y+fy,a.dir*k,k);
  if(ALLY_GLOW[a.k])lights.push([a.x,a.y-26,60,.55]);
}
/* 바닥: 눈보라·독구름·죽음의 안개 */
function render2ground(){
  for(const z of zones2){const a=Math.min(1,z.life*1.5),R2=z.R*Math.min(1,(z.max-z.life)/.3+.2),r=rng(z.sd);
    if(z.k==='blizz'){ctx.globalAlpha=a*.3;ctx.fillStyle='#d8f6ff';ell(ctx,z.x,z.y,R2,R2*.66);ctx.fill();ctx.globalAlpha=a;ctx.lineWidth=2.6;ctx.strokeStyle='#9fd8ff';ctx.stroke();
      ctx.fillStyle='#f4fcff';for(let i=0;i<26;i++){const an=r()*TAU+clock*(1.2+r()),d=Math.sqrt(r())*R2;ell(ctx,z.x+Math.cos(an)*d,z.y+Math.sin(an)*d*.66-r()*26,1.6+r()*1.6,1.6+r()*1.6);ctx.fill();}}
    else{const dark=z.k==='miasma';ctx.globalAlpha=a*(dark?.5:.4);
      for(let i=0;i<9;i++){const an=r()*TAU+clock*.3*(i%2?1:-1),d=Math.sqrt(r())*R2*.7,pr=R2*(.28+r()*.22);ctx.fillStyle=dark?(i%3?'#2a1846':'#3d6b45'):(i%3?'#6fa05c':'#9cd16a');ell(ctx,z.x+Math.cos(an)*d,z.y+Math.sin(an)*d*.66,pr,pr*.7);ctx.fill();}
      ctx.globalAlpha=a;ctx.lineWidth=2.4;ctx.strokeStyle=dark?'#7a4fd0':'#8fd14f';ctx.beginPath();ctx.ellipse(z.x,z.y,R2,R2*.66,0,0,TAU);ctx.stroke();}}
  ctx.globalAlpha=1;
}
/* 어둠이 덮이기 전에 그리는 것: 암흑 구체, 생명 흡수 줄기, 떠오른 태양 */
function render2fx(){
  for(const o of darks){ell(ctx,o.x,o.y,o.r,o.r);inkF(ctx,'#3a1d6e',3);ell(ctx,o.x,o.y,o.r*.62,o.r*.62);ctx.fillStyle='#7a4fd0';ctx.fill();ell(ctx,o.x-o.r*.2,o.y-o.r*.2,o.r*.22,o.r*.22);ctx.fillStyle='#e56bff';ctx.fill();lights.push([o.x,o.y,80,.6]);}
  for(const d of drains){const x1=d.e.x,y1=d.e.y-d.e.r,x2=P.x,y2=P.y-24,mx=(x1+x2)/2+Math.sin(clock*9)*14,my=(y1+y2)/2+Math.cos(clock*7)*14;
    ctx.beginPath();ctx.moveTo(x1,y1);ctx.quadraticCurveTo(mx,my,x2,y2);ctx.lineWidth=7;ctx.strokeStyle=INK;ctx.stroke();ctx.lineWidth=3.5;ctx.strokeStyle='#e0524f';ctx.stroke();ctx.lineWidth=1.4;ctx.strokeStyle='#ffd9d9';ctx.stroke();
    const q=(clock*2.4)%1,ix=x1+(x2-x1)*q,iy=y1+(y2-y1)*q;ell(ctx,ix,iy,3.4,3.4);inkF(ctx,'#ff9d94',1.8);}
  for(const s of suns){const q=1-s.t/s.max,r=14+34*q,x=P.x,y=P.y-96;
    ctx.fillStyle='rgba(255,170,60,.12)';ell(ctx,P.x,P.y,s.R*q,s.R*.66*q);ctx.fill();
    ctx.lineWidth=3;ctx.strokeStyle='#ffe08a';ctx.beginPath();for(let i=0;i<12;i++){const an=i*TAU/12+clock*2;ctx.moveTo(x+Math.cos(an)*(r+5),y+Math.sin(an)*(r+5));ctx.lineTo(x+Math.cos(an)*(r+16),y+Math.sin(an)*(r+16));}ctx.stroke();
    ell(ctx,x,y,r,r);inkF(ctx,'#ffb347',3.5);ell(ctx,x,y,r*.6,r*.6);ctx.fillStyle='#fff1c2';ctx.fill();lights.push([x,y,260*q+80,.95]);}
}
/* 빛 번짐 */
function render2glow(){
  for(const o of darks)glow(o.x,o.y,o.r*2.4,'rgb(170,90,255)',.5);
  for(const s of suns)glow(P.x,P.y-96,160*(1-s.t/s.max)+40,'rgb(255,200,90)',.8);
  for(const a of allies)if(ALLY_GLOW[a.k])glow(a.x,a.y-30,26,ALLY_GLOW[a.k],.5);
}
/* 아이콘: 그렸으면 true */
function drawSkillIcon2(g,k){
  const flame=(c1,c2)=>{blob(g,[[0,-14],[8,-2],[7,8],[0,12],[-7,8],[-8,-2]]);inkF(g,c1);g.fillStyle=INK;ell(g,-3,2,1.5,2.2);g.fill();ell(g,3,2,1.5,2.2);g.fill();g.fillStyle=c2;ell(g,0,-6,2.4,3.4);g.fill();};
  switch(k){
    case'strike':blob(g,[[-11,-8],[-6,-14],[4,-14],[11,-9],[8,-3],[-8,-3]]);inkF(g,'#8a94ac');poly(g,[[2,-3],[-4,5],[0,5],[-2,13],[6,2],[2,2]]);inkF(g,'#ffe066',2);break;
    case'blizz':g.lineWidth=5;g.strokeStyle=INK;g.beginPath();for(let i=0;i<3;i++){const a=i*Math.PI/3;g.moveTo(Math.cos(a)*13,Math.sin(a)*13);g.lineTo(-Math.cos(a)*13,-Math.sin(a)*13);}g.stroke();g.lineWidth=2.2;g.strokeStyle='#d8f6ff';g.stroke();break;
    case'cloud':for(const[x,y,r]of[[-6,3,7],[5,4,6.5],[0,-4,7.5]]){ell(g,x,y,r,r);inkF(g,'#8fd14f');}break;
    case'dark':ell(g,0,0,11.5,11.5);inkF(g,'#3a1d6e');ell(g,0,0,6.5,6.5);g.fillStyle='#7a4fd0';g.fill();ell(g,-2,-2,2.4,2.4);g.fillStyle='#e56bff';g.fill();break;
    case'drain':g.beginPath();g.moveTo(0,-13);g.bezierCurveTo(10,0,9,12,0,12);g.bezierCurveTo(-9,12,-10,0,0,-13);g.closePath();inkF(g,'#e0524f');g.fillStyle='#ffd9d9';ell(g,-3,3,2,3.4,.3);g.fill();break;
    case'sfire':flame('#ff9a3c','#ffe9a8');break;
    case'sice':flame('#bfe9ff','#ffffff');break;
    case'szap':flame('#ffe066','#fffbe0');break;
    case'skel':blob(g,[[-10,2],[-10,-9],[0,-14],[10,-9],[10,2],[5,7],[-5,7]]);inkF(g,'#f6efdc');g.fillStyle=INK;ell(g,-4,-3,2.6,3.2);g.fill();ell(g,4,-3,2.6,3.2);g.fill();g.fillRect(-3.4,6,1.6,5);g.fillRect(-.8,6,1.6,5);g.fillRect(1.8,6,1.6,5);break;
    case'reaper':g.save();g.rotate(.5);rr(g,-1.7,-13,3.4,27,1.5);inkF(g,'#4a3a2e');g.beginPath();g.moveTo(0,-13);g.quadraticCurveTo(-13,-17,-17,-5);g.quadraticCurveTo(-9,-11,0,-9);g.closePath();inkF(g,'#d2daea');g.restore();break;
    case'clone':for(const[x,c]of[[-5,'#5a3d9c'],[5,'#2e2438']]){ell(g,x,-6,5,5);inkF(g,c);blob(g,[[x-6,10],[x-5,0],[x+5,0],[x+6,10]]);inkF(g,c);}break;
    case'sun':g.lineWidth=2.4;g.strokeStyle='#ffe08a';g.beginPath();for(let i=0;i<8;i++){const a=i*TAU/8;g.moveTo(Math.cos(a)*10,Math.sin(a)*10);g.lineTo(Math.cos(a)*15,Math.sin(a)*15);}g.stroke();ell(g,0,0,8,8);inkF(g,'#ffb347',2.5);break;
    case'zero':starPath(g,0,0,6,14,5,0);inkF(g,'#d8f6ff');ell(g,0,0,3,3);g.fillStyle='#fff';g.fill();break;
    case'smite':poly(g,[[-2,-14],[-11,0],[-5,0],[-8,13],[2,-2],[-3,-2]]);inkF(g,'#ffe066',2);poly(g,[[9,-12],[2,-1],[6,-1],[4,9],[12,-3],[8,-3]]);inkF(g,'#bfe9ff',2);break;
    case'harvest':g.save();g.rotate(.5);rr(g,-1.7,-13,3.4,27,1.5);inkF(g,'#4a3a2e');g.beginPath();g.moveTo(0,-13);g.quadraticCurveTo(-13,-17,-17,-5);g.quadraticCurveTo(-9,-11,0,-9);g.closePath();inkF(g,'#e56bff');g.restore();ell(g,8,7,4,4);inkF(g,'#ffd9ff',2);break;
    case'legion':for(const[x,y]of[[-9,3],[0,-3],[9,3]]){ell(g,x,y-6,4,4);inkF(g,'#5a3d9c',2);blob(g,[[x-5,y+8],[x-4,y],[x+4,y],[x+5,y+8]]);inkF(g,'#5a3d9c',2);}break;
    case'miasma':for(const[x,y,r,c]of[[-6,3,7,'#2a1846'],[5,4,6.5,'#3d6b45'],[0,-4,7.5,'#3a1d6e']]){ell(g,x,y,r,r);inkF(g,c);}break;
    default:return false;
  }
  return true;
}
