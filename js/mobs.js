'use strict';
/* 다크 드웰러 — 그림으로 된 적 18종·보스 9종, 새 행동 방식, 보스 패턴, 적이 바닥에 까는 장판.
   game.js 가 부른다: mobAI(행동), mobsUpdate(장판·둔화), eliteKind·hordeKind·bossKind(누가 나올지)
   render.js 가 부른다: renderMobGround(장판·조준선·돌진 길), drawEshot(적의 탄) */

/* ───── 그림판: 한 칸에 하나씩, 발이 칸 바닥에 닿게 잘라 둔 그림 ───── */
const MOB_SHEETS={a:{src:'img/mobs.png',cell:160},b:{src:'img/mobs2.png',cell:224},c:{src:'img/bosses.png',cell:288},d:{src:'img/mobs3.png',cell:192}};
function mobSprite(img,cell,idx,size,flip){
  const c=document.createElement('canvas');c.width=c.height=cell;const g=c.getContext('2d');if(flip){g.translate(cell,0);g.scale(-1,1);}
  g.drawImage(img,(idx%6)*cell,(idx/6|0)*cell,cell,cell,0,0,cell,cell);return{c,w:size,h:size,ox:size/2,oy:size*(1-5/cell)};
}
/* 그림이 읽히면 그 종류의 그림을 바꿔 끼운다(읽히기 전·못 읽을 때는 코드로 그린 그림) */
function loadMobArt(){
  for(const k in MOB_SHEETS){const sh=MOB_SHEETS[k],im=new Image();
    im.onload=()=>{for(const id in ET){const T=ET[id];if(!T.art||T.art[0]!==k)continue;
      try{const sp=mobSprite(im,sh.cell,T.art[1],T.art[2],T.flip);if(T.tint){const g=sp.c.getContext('2d');g.globalCompositeOperation='source-atop';g.fillStyle=T.tint;g.fillRect(0,0,sp.c.width,sp.c.height);g.globalCompositeOperation='source-over';}const wh=whiteOf(sp);T.frames=Array(NF).fill(sp);T.white=Array(NF).fill(wh);T.img=1;}catch(_){}}};
    im.src=sh.src;}
}

/* ───── 적 종류 ─────
   art [그림판, 번호, 화면 크기], def 물리 피해 줄임, mres 마법 피해 줄임(0~1), pack 한 번에 몇 마리 */
const fbk=k=>({frames:ET[k].frames,white:ET[k].white});
const ROCK=['#6e7392','#4c5070','#2b2839'];
Object.assign(ET.moss,{art:['a',0,46],hp:70,dmg:13,xp:1,spd:46});
Object.assign(ET.rat,{art:['a',1,54],hp:50,dmg:13,xp:1});
Object.assign(ET.wisp,{art:['a',2,56],hp:110,dmg:16,xp:2,mres:.3});
Object.assign(ET.shaman,{art:['a',3,64],hp:130,dmg:20,xp:3});
Object.assign(ET.puff,{art:['a',4,54],hp:95,dmg:45,xp:2});
ET.bat={...fbk('wisp'),art:['a',5,54],n:'흡혈 박쥐',ai:'weave',r:12,hp:36,spd:118,dmg:10,xp:1,anim:3.2,kb:1.2,float:true,pack:3,deb:['#5b3f8f','#3f2a69','#e0524f']};
ET.archer={...fbk('shaman'),art:['a',6,62],n:'해골 궁수',ai:'archer',r:13,hp:100,spd:58,dmg:18,xp:3,anim:1.6,kb:1,deb:['#efe6cf','#4a7c54','#8a5a2c']};
ET.wolf={...fbk('rat'),art:['a',7,66],n:'잿빛 늑대',ai:'charge',r:16,hp:120,spd:104,dmg:17,xp:2,anim:3,kb:.9,deb:['#8c92b2','#4c5070','#efdfb8']};
ET.spider={...fbk('rat'),art:['a',8,58],n:'독거미',ai:'web',r:15,hp:115,spd:70,dmg:15,xp:3,anim:2.6,kb:1,deb:['#3f2a69','#2b2839','#e0524f']};
ET.toad={...fbk('moss'),art:['b',0,60],n:'독두꺼비',ai:'spitter',r:17,hp:170,spd:40,dmg:16,xp:4,anim:1.4,kb:.8,magic:true,deb:['#74aa5e','#5b3f8f','#e6c36a']};
ET.imp={...fbk('shaman'),art:['b',1,54],n:'불꽃 임프',ai:'imp',r:13,hp:95,spd:92,dmg:17,xp:3,anim:2.6,kb:1.1,magic:true,light:70,deb:['#e0524f','#8a2a2a','#ffb347']};
ET.orc={...fbk('moss'),art:['b',2,74],n:'방패 오크',ai:'chase',r:19,hp:300,spd:50,dmg:22,xp:5,anim:1.5,kb:.5,def:.5,deb:['#74aa5e','#8a5a2c','#6e7392']};
ET.beetle={...fbk('moss'),art:['b',3,60],n:'수정 딱정벌레',ai:'charge',r:16,hp:220,spd:66,dmg:18,xp:4,anim:2.2,kb:.6,mres:.6,light:60,deb:['#57a8ff','#bfe9ff','#2c5aa8']};
ET.wraith={...fbk('wisp'),art:['b',4,74],n:'망령 기사',ai:'blink',r:17,hp:240,spd:62,dmg:22,xp:5,anim:1.4,kb:.7,magic:true,float:true,light:90,def:.3,deb:['#5b6aa8','#8fb4ff','#2b2839']};
ET.sorcerer={...fbk('shaman'),art:['b',8,80],n:'암흑 술사',ai:'summoner',r:18,hp:400,spd:48,dmg:22,xp:9,anim:1.2,kb:.6,mres:.5,light:80,deb:['#2b2839','#5b3f8f','#b678ff']};
/* 11-15 새 적 9종(카툰 그림판 d). split 죽으면 갈라짐, loot 장비 떨어뜨릴 확률 */
const JELLY=['#ff8fb8','#e0609a','#ffd0e2'];
ET.skel={...fbk('moss'),art:['d',0,62],n:'해골 전사',ai:'chase',r:15,hp:140,spd:66,dmg:18,xp:3,anim:2,kb:.9,def:.3,pack:3,deb:['#efe6cf','#8a5a2c','#6e7392']};
ET.jelly={...fbk('moss'),art:['d',1,72],n:'분홍 젤리',ai:'chase',r:20,hp:260,spd:42,dmg:18,xp:4,anim:1.3,kb:.7,split:'jellet',deb:JELLY};
ET.jellet={...fbk('moss'),art:['d',1,38],n:'꼬마 젤리',ai:'chase',r:11,hp:60,spd:84,dmg:10,xp:1,anim:2.4,kb:1.2,deb:JELLY};
ET.goblin={...fbk('rat'),art:['d',2,58],n:'고블린 폭탄병',ai:'thrower',r:14,hp:110,spd:70,dmg:20,xp:3,anim:2.4,kb:1,deb:['#74aa5e','#2b2839','#ff8a2e']};
ET.monk={...fbk('shaman'),art:['d',3,60],n:'등불 수도승',ai:'healer',r:14,hp:150,spd:52,dmg:14,xp:5,anim:1.4,kb:.9,mres:.3,light:80,deb:['#8a5a2c','#6fd66f','#efdfb8']};
ET.ninja={...fbk('shaman'),art:['d',4,62],n:'그림자 자객',ai:'blink',r:15,hp:180,spd:84,dmg:22,xp:4,anim:2.6,kb:.8,pack:2,deb:['#3f2a69','#2b2839','#c9d1e0']};
ET.icesp={...fbk('wisp'),art:['d',5,56],n:'얼음 정령',ai:'frost',r:13,hp:140,spd:56,dmg:16,xp:4,anim:1.3,kb:.9,float:true,magic:true,mres:.5,light:70,deb:['#bfe9ff','#86c2ec','#f4fcff']};
ET.garg={...fbk('wisp'),art:['d',6,64],n:'가고일',ai:'weave',r:16,hp:220,spd:82,dmg:20,xp:4,anim:2,kb:.6,float:true,def:.5,pack:2,deb:ROCK};
ET.turtle={...fbk('moss'),art:['d',7,78],n:'용암 거북',ai:'trail',r:21,hp:520,spd:34,dmg:24,xp:7,anim:1,kb:.3,def:.4,light:70,deb:['#4a7c54','#ff8a2e','#2b2839']};
ET.mimic={...fbk('moss'),art:['d',8,66],n:'미믹',ai:'mimic',r:18,hp:650,spd:60,dmg:30,xp:12,anim:2.4,kb:.4,loot:.4,deb:['#b08845','#6b4630','#e0524f']};
/* 등장 비용: 단단하고 떼로 나오는 적일수록 크다(0.8~2.8) */
for(const id in ET){const T=ET[id];T.cost=clamp(Math.sqrt((T.hp||70)/70)*Math.pow(T.pack||1,.7),.8,2.8);}
/* 정예(30초마다): 보통 적의 열다섯 배쯤 단단하고, 걸린 상태이상이 절반만 간다 */
ET.golem={...fbk('brute'),art:['b',5,150],n:'돌 거인',ai:'slam',r:42,hp:1300,spd:34,dmg:44,xp:30,anim:.8,kb:.12,elite:true,def:.25,deb:ROCK.concat('#6fa05c')};
ET.treant={...fbk('brute'),art:['b',6,150],n:'고목 정령',ai:'roots',r:40,hp:1150,spd:30,dmg:40,xp:30,anim:.8,kb:.1,elite:true,mres:.25,deb:['#6b4a2a','#4a7c54','#8a6a3c']};
ET.ogre={...fbk('brute'),art:['b',7,150],n:'오우거',ai:'ogre',r:44,hp:1400,spd:44,dmg:46,xp:30,anim:1,kb:.12,elite:true,deb:['#8a5a2c','#63401f','#6e7392']};

/* ───── 보스 9종 ─────
   기절·빙결 99% 면역, 둔화는 조금만. pats 쓰는 패턴, minions 부르는 부하, shotC 탄 색, pool 불바다를 남김, poolC·poolSlow 장판 색·둔화 */
const BOSS_BASE={hp:6500,spd:80,dmg:40,xp:90,anim:.8,kb:.05,elite:true,ai:'boss',light:150};
const BOSS_DEF={
  b_golem:{n:'바위 군주',art:['c',0,205],r:58,def:.6,mres:.3,pats:['slam','crack','summon','nova'],minions:['moss','rat','orc'],shotC:'#ff9a3c',deb:ROCK.concat('#ff9a3c')},
  b_ice:{n:'서리 여왕',art:['c',1,195],r:44,def:.3,mres:.7,pats:['aimed','pools','spiral','blink'],minions:['wisp'],shotC:'#9fd8ff',poolC:'#9fd8ff',poolSlow:1,deb:['#bfe9ff','#86c2ec','#f4fcff']},
  b_lava:{n:'용암 군주',art:['c',2,205],r:58,def:.5,mres:.5,pats:['rain','charge','nova','slam'],shotC:'#ff8a2e',pool:1,deb:['#8a2a2a','#ff8a2e','#2b2839']},
  b_eye:{n:'심연의 눈',art:['c',3,185],r:52,def:.3,mres:.7,float:true,pats:['spiral','aimed','summon','nova'],minions:['wisp','bat'],shotC:'#b678ff',deb:['#5b3f8f','#b678ff','#3f2a69']},
  b_king:{n:'해골 왕',art:['c',4,205],r:46,def:.6,mres:.35,pats:['charge','slam','summon','crack'],minions:['archer'],shotC:'#e2504c',deb:['#efe6cf','#8a2a2a','#e6b450']},
  b_spider:{n:'거미 여왕',art:['c',5,195],r:60,def:.4,mres:.4,pats:['pools','summon','charge','aimed'],minions:['spider'],shotC:'#e9e4f5',poolC:'#e9e4f5',poolSlow:1,deb:['#3f2a69','#e0524f','#e6b450']},
  b_hydra:{n:'늪의 히드라',art:['c',6,205],r:60,def:.4,mres:.5,pats:['breath','pools','nova','slam'],shotC:'#7bd14a',poolC:'#7bd14a',deb:['#4a7c54','#74aa5e','#e6c36a']},
  b_dragon:{n:'그림자 용',art:['c',7,225],r:64,def:.5,mres:.6,pats:['breath','rain','charge','spiral'],shotC:'#b678ff',pool:1,deb:['#3f2a69','#5b3f8f','#b678ff']},
  b_reaper:{n:'사신 군주',art:['c',8,215],r:50,def:.5,mres:.6,pats:['blink','spiral','summon','nova','charge'],minions:['wraith'],shotC:'#9fe8c8',deb:['#2b2839','#efe6cf','#5b6aa8']},
};
for(const id in BOSS_DEF)ET[id]=Object.assign({},fbk('brute'),BOSS_BASE,BOSS_DEF[id]);
loadMobArt();

/* 맵마다 나오는 보스: 앞의 셋이 5분마다 돌아가며, 마지막이 그 맵의 대군주(끝 보스) */
const MAP_BOSS=[['b_golem','b_spider','b_king','b_hydra'],['b_ice','b_eye','b_king','b_reaper'],['b_lava','b_golem','b_hydra','b_dragon'],['b_eye','b_reaper','b_dragon','b_king']];
let bossN=0;
const bossKind=(i,fin)=>{const L=MAP_BOSS[mapIdx()]||MAP_BOSS[0];return fin?L[3]:L[i%3];};
const eliteKind=m=>pick(m<3?['golem']:m<6?['golem','ogre']:['golem','ogre','treant']);
const hordeKind=(m,i)=>{const t=m>3?['moss','rat','bat','wolf']:m>1?['moss','moss','rat','bat']:['moss'];return t[i%t.length];};

/* ───── 적이 쓰는 공격 도구 ───── */
let ezones=[]; // 적이 깐 장판: 밟고 있으면 마법 피해
/* 경고 원을 띄우고 t 초 뒤에 터진다. o: c 색, deb 파편, slow 둔화(초), pool 장판 지속(초), pc 장판 색, pslow 장판 둔화, snd 소리 */
function blast(x,y,R,t,dmg,magic,o){
  o=o||{};warns.push({x,y,R,t,max:t});
  later(t,()=>{if(state!=='play')return;
    if(!P.dead&&Math.hypot(P.x-x,(P.y-y)*1.5)<R+8){hurt(dmg,magic);if(o.slow)slowHero(o.slow);}
    ring(x,y,12,R*3.2,'#ff3b5c');flash(x,y,R*1.6,.14);if(o.deb)debris(x,y,o.deb,5,1.1);
    if(o.pool)ezones.push({x,y,R:R*.85,life:o.pool,max:o.pool,tick:.3,dmg:dmg*.3,c:o.pc||'#7bd14a',slow:o.pslow,sd:Math.random()*9});
    if(can('bl',90))(o.snd||SFXH.thud)();});
}
function slowHero(t){if(P.dead)return;if(!(P.slowT>0)&&can('slw',600))textFx(P.x,P.y-70,'둔화','#9fd8ff');P.slowT=Math.max(P.slowT||0,t);}
function novaShots(e,n,speed,dm,off){const a0=Math.random()*TAU+(off||0);for(let i=0;i<n;i++)enemyShot(e.x,e.y-e.r*.8,a0+i*TAU/n,speed,e.dmg*dm,5,{c:e.T.shotC});}
function mobsUpdate(dt){
  if(P.slowT>0)P.slowT-=dt;
  for(const z of ezones){z.life-=dt;z.tick-=dt;if(z.tick<=0&&!P.dead&&Math.hypot(P.x-z.x,(P.y-z.y)*1.5)<z.R){z.tick=.55;hurt(z.dmg,true);if(z.slow)slowHero(.8);}}
  ezones=ezones.filter(z=>z.life>0);if(ezones.length>40)ezones.splice(0,ezones.length-40);
}

/* ───── 새 행동 방식 ─────
   archer 조준(0.6초) 뒤 빠른 화살 · web 거미줄(둔화) · spitter 독 웅덩이 · imp 흔들며 불덩이 세 갈래 · blink 사라졌다 옆에 나타나 베기
   summoner 구슬 고리 + 박쥐 소환 · roots 뿌리 세 줄기 · ogre 돌진 뒤 내려찍기 · boss 보스 패턴
   돌아오는 값: 이번 틀의 이동 속도 */
function mobAI(e,dx,dy,d,dt){
  const T=e.T,base=T.spd*e.sm;
  switch(e.ai){
    case'archer':
      e.at-=dt;
      if(e.st===1){if(e.at<=0){e.st=0;e.at=rand(2.2,3.4);enemyShot(e.x+Math.cos(e.aim)*14,e.y-28+Math.sin(e.aim)*14,e.aim,360,e.dmg,2,{k:'arrow',phys:1,r:5,a:e.aim});if(can('arw',80))noise(.05,.12,'highpass',3000,6000);}return 0;}
      if(e.at<=0&&d<470&&d>60){e.st=1;e.at=.6;e.aim=Math.atan2(P.y-20-(e.y-28),P.x-e.x);return 0;}
      if(d<190){e.cx=-e.cx;e.cy=-e.cy;return base*.8;}
      return d<300?0:base;
    case'web':
      e.at-=dt;if(e.at<=0&&d<340&&d>50){e.at=rand(3.4,5);e.flash=.1;enemyShot(e.x,e.y-18,Math.atan2(P.y-20-(e.y-18),P.x-e.x),240,e.dmg*.5,2.2,{k:'web',phys:1,r:9,slow:2,c:'#e9e4f5'});}
      return base;
    case'spitter':
      e.at-=dt;if(e.at<=0&&d<420){e.at=rand(3.2,4.6);e.flash=.12;blast(P.x,P.y,74,.9,e.dmg,true,{c:'#7bd14a',pool:4,snd:SFXH.vine});}
      return d<150?0:base;
    case'imp':{
      const sd=Math.sin(clock*3.1+e.seed*5)*1.1,x=e.cx-e.cy*sd,y=e.cy+e.cx*sd,l=Math.hypot(x,y)||1;e.cx=x/l;e.cy=y/l;
      e.at-=dt;if(e.at<=0&&d<400){e.at=rand(2.4,3.4);e.flash=.12;SFX.cast();const a=Math.atan2(P.y-20-(e.y-30),P.x-e.x);for(let i=-1;i<=1;i++)enemyShot(e.x,e.y-30,a+i*.22,190,e.dmg*.7,3.5,{c:'#ff8a2e'});}
      return d<170?base*.3:base;}
    case'blink':
      e.at-=dt;
      if(e.st===1){e.fade=1;if(e.at<=0){e.st=0;e.fade=0;e.at=rand(4,6);puff(e.x,e.y-20,4,'#5b6aa8');e.x=e.sx;e.y=e.sy;puff(e.x,e.y-20,4,'#5b6aa8');}return 0;}
      if(e.at<=0&&d<420&&d>90){const a=Math.random()*TAU;e.sx=P.x+Math.cos(a)*56;e.sy=P.y+Math.sin(a)*42;e.st=1;e.at=.5;blast(e.sx,e.sy,78,.85,e.dmg*1.3,true,{c:'#8fb4ff'});return 0;}
      return base;
    case'summoner':
      e.at-=dt;e.at2-=dt;
      if(e.at<=0&&d<460){e.at=4.2;e.flash=.15;SFX.cast();novaShots(e,8,140,.6);}
      if(e.at2<=0){e.at2=9;if(enemies.length<300){for(let i=0;i<3;i++){const a=Math.random()*TAU;spawn('bat',{at:[e.x+Math.cos(a)*40,e.y+Math.sin(a)*30]});}puff(e.x,e.y-30,6,'#5b3f8f');}}
      if(d<200){e.cx=-e.cx;e.cy=-e.cy;return base*.7;}
      return d<290?0:base;
    case'roots':
      e.at-=dt;
      if(e.st===1){if(e.at<=0){e.st=0;e.at=rand(3.4,4.8);}return 0;}
      if(e.at<=0&&d<520){e.st=1;e.at=.8;e.flash=.15;const a=Math.atan2(dy,dx);
        for(const off of[-.42,0,.42])for(let i=1;i<=6;i++)blast(e.x+Math.cos(a+off)*i*78,e.y+Math.sin(a+off)*i*78*.9,54,.55+i*.11,e.dmg*1.1,false,{c:'#8a6a3c',deb:['#6b4a2a','#4a7c54'],slow:1.5});
        SFX.warn();return 0;}
      return base;
    case'ogre':
      e.at-=dt;
      if(e.st===1){if(e.at<=0){e.st=2;e.at=.6;e.lane=0;SFXH.thud();}return 0;}
      if(e.st===2){e.cx=e.sx;e.cy=e.sy;if(e.at<=0){e.st=0;e.at=rand(2.6,3.8);blast(e.x,e.y,125,.5,e.dmg*1.3,false,{deb:ROCK});}return 420;}
      if(e.at<=0&&d<420&&d>90){e.st=1;e.at=.7;e.sx=dx/d;e.sy=dy/d;e.lane=1;SFX.warn();return 0;}
      return base;
    case'thrower': // 고블린 폭탄병: 거리를 두고 폭탄을 던진다(빨간 원이 뜬 뒤 1초 뒤 터짐)
      e.at-=dt;if(e.at<=0&&d<430&&d>80){e.at=rand(3,4.4);e.flash=.12;blast(P.x+rand(-30,30),P.y+rand(-20,20),78,1.05,e.dmg*1.2,false,{deb:['#2b2839','#ff8a2e'],snd:SFX.boom});}
      if(d<180){e.cx=-e.cx;e.cy=-e.cy;return base*.7;}return d<300?0:base;
    case'healer':{ // 등불 수도승: 뒤에 서서 둘레 적의 체력을 채운다 → 먼저 잡아야 할 적
      e.at-=dt;if(e.at<=0&&d<760){e.at=4.5;let n=0;for(const o of enemies){if(o.dead||o.boss||o===e||o.hp>=o.maxhp)continue;if(Math.hypot(o.x-e.x,o.y-e.y)<230){o.hp=Math.min(o.maxhp,o.hp+o.maxhp*.3);n++;}}
        if(n){ring(e.x,e.y,10,460,'#6fd66f');if(can('heal',700))textFx(e.x,e.y-e.r*3,'치유','#8fe88f');}}
      if(d<240){e.cx=-e.cx;e.cy=-e.cy;return base*.8;}return d<340?0:base;}
    case'frost': // 얼음 정령: 맞으면 느려지는 얼음 조각
      e.at-=dt;if(e.at<=0&&d<420){e.at=rand(2.8,3.8);e.flash=.12;SFX.cast();enemyShot(e.x,e.y-30,Math.atan2(P.y-20-(e.y-30),P.x-e.x),210,e.dmg,3.5,{c:'#9fd8ff',slow:1.4});}
      if(d<170){e.cx=-e.cx;e.cy=-e.cy;return base*.7;}return d<260?0:base;
    case'trail': // 용암 거북: 지나간 자리에 불 웅덩이
      e.at-=dt;if(e.at<=0){e.at=1.4;ezones.push({x:e.x,y:e.y,R:44,life:3.2,max:3.2,tick:.3,dmg:e.dmg*.35,c:'#ff8a2e',sd:Math.random()*9});}return base;
    case'mimic': // 미믹: 상자인 척 가만히 있다가 다가가거나 때리면 깨어나 빠르게 쫓아온다. 장비를 잘 떨어뜨린다
      if(e.st===0){if(d<170||e.hp<e.maxhp){e.st=1;e.flash=.2;SFX.warn();textFx(e.x,e.y-e.r*2.8,'미믹!','#ffd94a');}return 0;}return base*2.1;
    case'flee':return fleeAI(e,dx,dy,d,dt);
    case'boss':return bossAI(e,dx,dy,d,dt);
  }
}

/* ───── 보스 패턴 ─────
   wind 준비 동작(초, 그동안 멈춤), rest 다음 패턴까지 쉬는 시간, pre 준비를 시작할 때(경고 표시), go 준비가 끝났을 때. r = 분노 단계(0·1·2) */
const BPAT={
  slam:{wind:.9,rest:1.8,pre(e,r){blast(P.x,P.y,150,.9,e.dmg*1.5,false,{deb:ROCK});
    for(let i=0;i<r*3;i++){const a=Math.random()*TAU;blast(P.x+Math.cos(a)*190,P.y+Math.sin(a)*130,100,1.1+i*.15,e.dmg*1.2,false,{deb:ROCK});}},go(){shake(.2);}},
  crack:{wind:.7,rest:2,pre(e,r){const n=r?3:1,a0=Math.atan2(P.y-e.y,P.x-e.x);
    for(let l=0;l<n;l++){const a=a0+(l-(n-1)/2)*.5;for(let i=1;i<=7;i++)blast(e.x+Math.cos(a)*i*86,e.y+Math.sin(a)*i*86*.9,62,.6+i*.1,e.dmg*1.2,false,{deb:ROCK});}}},
  nova:{wind:.7,rest:1.6,go(e,r){const n=12+r*4;novaShots(e,n,160,.55);SFX.cast();if(r)later(.45,()=>{if(!e.dead)novaShots(e,n,160,.55,Math.PI/n);});}},
  spiral:{wind:.5,rest:3,go(e,r){const n=22+r*8,arms=r>1?3:2,a0=Math.random()*TAU,dir=Math.random()<.5?1:-1;
    for(let i=0;i<n;i++)later(i*.09,()=>{if(e.dead)return;for(let k=0;k<arms;k++)enemyShot(e.x,e.y-e.r*.8,a0+dir*i*.36+k*TAU/arms,150,e.dmg*.5,5,{c:e.T.shotC});if(i%3===0)SFX.cast();});}},
  aimed:{wind:.6,rest:2,go(e,r){for(let j=0;j<3+r;j++)later(j*.32,()=>{if(e.dead)return;const a=Math.atan2(P.y-20-(e.y-e.r),P.x-e.x);
    for(let i=-2;i<=2;i++)enemyShot(e.x,e.y-e.r,a+i*.16,250,e.dmg*.55,3.2,{c:e.T.shotC});SFX.cast();});}},
  breath:{wind:.7,rest:2.4,go(e,r){const a0=Math.atan2(P.y-20-(e.y-e.r),P.x-e.x),n=16+r*6;
    for(let i=0;i<n;i++)later(i*.07,()=>{if(e.dead)return;enemyShot(e.x+Math.cos(a0)*e.r*.6,e.y-e.r,a0+Math.sin(i*.55)*.5+rand(-.06,.06),230,e.dmg*.45,2.6,{c:e.T.shotC});if(i%4===0)SFX.cast();});}},
  charge:{wind:.8,rest:1.2,pre(e){const dx=P.x-e.x,dy=P.y-e.y,d=Math.hypot(dx,dy)||1;e.sx=dx/d;e.sy=dy/d;e.lane=1;},go(e){e.st=2;e.at=.7;e.lane=0;SFXH.thud();}},
  rain:{wind:.6,rest:2.4,pre(e,r){const n=7+r*3;for(let i=0;i<n;i++){const a=Math.random()*TAU,q=i?rand(40,260):0;
    blast(P.x+Math.cos(a)*q,P.y+Math.sin(a)*q*.8,82,.8+i*.16,e.dmg*1.1,true,{c:'#ff8a2e',pool:e.T.pool?3:0,pc:'#ff8a2e',snd:SFXH.fire});}}},
  pools:{wind:.6,rest:2,pre(e,r){for(let i=0;i<3+r;i++){const a=Math.random()*TAU,q=i?rand(60,200):0;
    blast(P.x+Math.cos(a)*q,P.y+Math.sin(a)*q*.8,92,.8+i*.2,e.dmg*.8,true,{c:e.T.poolC,pool:5,pc:e.T.poolC,pslow:e.T.poolSlow,snd:SFXH.vine});}}},
  summon:{wind:.6,rest:1.5,go(e,r){const n=enemies.filter(o=>!o.dead&&!o.elite).length>70?0:3+r; /* 이미 많으면 부르지 않는다 */for(let i=0;i<n;i++){const a=Math.random()*TAU;spawn(pick(e.T.minions),{at:[e.x+Math.cos(a)*(e.r+50),e.y+Math.sin(a)*(e.r+30)]});}puff(e.x,e.y-30,10);SFX.horn();}},
  blink:{wind:.5,rest:1.4,pre(e){const a=Math.random()*TAU;e.sx=P.x+Math.cos(a)*90;e.sy=P.y+Math.sin(a)*70;e.fade=1;blast(e.sx,e.sy,135,.8,e.dmg*1.5,true,{c:'#b678ff'});},
    go(e){puff(e.x,e.y-30,8,'#5b3f8f');e.x=e.sx;e.y=e.sy;e.fade=0;puff(e.x,e.y-30,8,'#5b3f8f');}},
};
function bossAI(e,dx,dy,d,dt){
  const T=e.T,q=e.hp/e.maxhp,rage=q<.2?2:q<.5?1:0,v=T.spd*e.sm*(1+.2*rage);
  if(rage>e.rage){e.rage=rage;uiBanner(e.name+(rage===2?' · 광폭':' · 분노'));SFX.elite();shake(.3);ring(e.x,e.y-e.r,20,700,'#ff5a4a');flash(e.x,e.y-e.r,420,.3);novaShots(e,14+rage*4,175,.5);}
  if(e.st===2){e.at-=dt;e.cx=e.sx;e.cy=e.sy;if(e.at<=0){e.st=0;e.at=1.2;}return 620;} // 돌진 중
  if(e.st===1){e.at-=dt;if(e.at<=0){const pt=e.pat;e.st=0;e.at=pt.rest/(1+.35*rage);if(pt.go)pt.go(e,rage);}return 0;} // 준비 동작
  e.at-=dt;
  if(e.at<=0&&d<640){let k;do{k=pick(T.pats);}while(T.pats.length>1&&k===e.lastPat);e.lastPat=k;const pt=BPAT[k];e.pat=pt;e.st=1;e.at=pt.wind;e.lane=0;e.flash=.15;if(pt.pre)pt.pre(e,rage);SFX.warn();}
  return d<e.r+36?0:v; // 주인공을 덮지 않게 조금 떨어져 선다
}

/* ───── 그리기 ───── */
/* 바닥: 적이 깐 장판, 궁수의 조준선, 돌진할 길 */
/* 적의 공격은 내 스킬과 헷갈리지 않게 늘 '검붉은 바탕 + 빨간 점선 테두리'(11-14 대표님). 원소 색은 안쪽 거품으로만 */
const EVIL='#ff3b5c';
function renderMobGround(){
  for(const z of ezones){const q=Math.min(1,z.life/.6,(z.max-z.life)/.25+.2);ctx.globalAlpha=.42*q;ctx.fillStyle='#3a0716';ell(ctx,z.x,z.y,z.R,z.R*.66);ctx.fill();
    ctx.globalAlpha=.9*q;ctx.lineWidth=3;ctx.strokeStyle=EVIL;ctx.setLineDash([10,7]);ctx.lineDashOffset=-clock*30;ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=.55*q;ctx.fillStyle=z.c;
    for(let i=0;i<4;i++){const a=z.sd+i*1.7+clock*.4,rr2=z.R*(.25+.12*i),s=2+2*Math.abs(Math.sin(clock*3+i+z.sd));ell(ctx,z.x+Math.cos(a)*rr2,z.y+Math.sin(a)*rr2*.66,s,s*.7);ctx.fill();}
    ctx.globalAlpha=1;}
  for(const e of enemies){if(e.dead||e.st!==1)continue;
    if(e.ai==='archer'){const x=e.x,y=e.y-28;ctx.lineWidth=2;ctx.strokeStyle=`rgba(255,110,90,${.35+.45*(1-e.at/.6)})`;ctx.setLineDash([8,7]);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(e.aim)*420,y+Math.sin(e.aim)*420);ctx.stroke();ctx.setLineDash([]);}
    else if(e.lane>0){const L=e.boss?470:270,w=e.r*1.7;ctx.save();ctx.translate(e.x,e.y);ctx.rotate(Math.atan2(e.sy,e.sx));ctx.fillStyle=`rgba(226,80,76,${.16+.08*Math.sin(clock*22)})`;ctx.fillRect(0,-w/2,L,w);ctx.lineWidth=2.5;ctx.strokeStyle='rgba(255,110,90,.7)';ctx.strokeRect(0,-w/2,L,w);ctx.restore();}}
}
/* 적의 탄: 화살은 가늘게, 나머지는 색이 다른 구슬 */
function drawEshot(s){
  if(s.k==='arrow'){ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.a);ctx.lineWidth=5;ctx.strokeStyle=INK;ctx.beginPath();ctx.moveTo(-14,0);ctx.lineTo(10,0);ctx.stroke();ctx.lineWidth=2.2;ctx.strokeStyle='#5a2030';ctx.stroke();
    poly(ctx,[[16,0],[7,-5],[7,5]]);inkF(ctx,EVIL,1.6);ctx.restore();lights.push([s.x,s.y,40,.4]);return;}
  /* 검은 알맹이 + 빨간 테두리 + 도는 가시 넷. 안쪽 작은 점만 원소 색 */
  const r=s.r,sp=clock*7+(s.x+s.y)*.01;ctx.save();ctx.translate(s.x,s.y);ctx.rotate(sp);poly(ctx,[[0,-r*1.75],[r*.42,-r*.42],[r*1.75,0],[r*.42,r*.42],[0,r*1.75],[-r*.42,r*.42],[-r*1.75,0],[-r*.42,-r*.42]]);inkF(ctx,EVIL,2.2);ctx.restore();
  ell(ctx,s.x,s.y,r*.95,r*.95);inkF(ctx,'#24060f',2.2);ctx.fillStyle=s.c||'#ff8aa0';ell(ctx,s.x,s.y,r*.38,r*.38);ctx.fill();lights.push([s.x,s.y,52,.5]);
}
