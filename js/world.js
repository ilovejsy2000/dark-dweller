'use strict';
/* 다크 드웰러 — 넓은 맵: 보물 상자, 잠든 수호자(고정 보스 · 매우 강함 · 신화 장비 확정), 미니맵 */
const WORLD_R=5000;            // 맵 크기: 모닥불에서 사방으로 이만큼(미니맵이 보여 주는 범위, 그 밖으로는 못 나간다)
const GUARD_HP=5.5,GUARD_DMG=1.7,GUARD_N=6,CHEST_N=9; // 수호 보스 배율(그 시각의 보스 대비), 마릿수, 상자 수
let chests=[],guards=[],nextChest=0,hudPad={l:16,t:10};
function clearWorld2(){chests=[];guards=[];ezones=[];gims=[];}
function addChest(near){const a=Math.random()*TAU,d=near?rand(420,620):rand(650,4700);chests.push({kind:'chest',x:Math.cos(a)*d,y:Math.sin(a)*d*.85,t:Math.random()*6});}
/* 판을 시작할 때: 상자 9개, 잠든 수호 보스 6마리(보스 9종 가운데 무작위 여섯)를 먼 곳에 흩어 둔다. 멀리 있는 것일수록 강하고 보상이 좋다 */
function initWorld(){
  chests=[];guards=[];ezones=[];bossN=0;P.slowT=0;nextChest=60;for(let i=0;i<CHEST_N;i++)addChest(i===0); // 하나는 가까이(초반에 찾아갈 거리)
  const mix=a=>a.sort(()=>Math.random()-.5),kinds=mix(Object.keys(BOSS_DEF)).slice(0,GUARD_N),ang=mix([0,1,2,3,4,5]),a0=Math.random()*TAU;
  kinds.forEach((k,i)=>{const a=a0+ang[i]*TAU/GUARD_N+rand(-.3,.3),d=2600+i*440+rand(-120,120),g=spawn(k,{boss:3,name:'잠든 '+ET[k].n,at:[Math.cos(a)*d,Math.sin(a)*d*.85]});
    g.sleep=true;g.guard=true;g.tier=i;guards.push(g);});
  gimInit();
}
/* 다가가거나 때리면 깨어난다. 깨어나는 순간의 시간·맵 난이도로 강해진다 */
function wakeGuard(e){
  const m=runT/60,t=e.tier||0;e.sleep=false;e.name='깨어난 '+e.T.n;e.maxhp=e.hp=e.T.hp*DIFF.hp(m)*MAP.hp*GUARD_HP*(1+.35*t);e.dmg=e.T.dmg*DIFF.dmg(m)*MAP.dmg*GUARD_DMG*(1+.1*t);e.sm=DIFF.spd(m);e.xp=Math.ceil(e.T.xp*DIFF.xp(m)*(3+t));e.at=1.5;
  if(!bossRef||bossRef.dead)bossRef=e;thinOut();cine={t:1.8,max:1.8,e};uiCine(e.name,false);$('cineSub').textContent='수호자 · 매우 강함';cxSee('m',e.type);setTimeout(()=>{if(state==='play')uiNote('수호자는 아주 강합니다 · 잡으면 신화 장비');},1900);SFX.elite();shake(.5);buzz(60);
}
/* 수호 보스 보상: 신화 확정. 먼 곳의 수호 보스일수록 더 준다 */
function guardLoot(e){const t=e.tier||0;dropItem(e.x,e.y,4,0);if(t>=2)dropItem(e.x,e.y,3,.12);if(t>=4)dropItem(e.x,e.y,4,.24);uiBanner('수호 보스 처치');}
function updateWorld(dt){
  // 상자: 다가가면 열린다. 1분마다 하나씩 다시 생긴다(최대 5개)
  nextChest-=dt;if(nextChest<=0){nextChest=60;if(chests.length<CHEST_N)addChest();}
  const wq=Math.hypot(P.x,P.y/.85)/WORLD_R;if(wq>1){P.x/=wq;P.y/=wq;} // 맵 끝
  /* 장비·경험치·적도 맵 밖으로 나가지 않게(11-15 대표님 "나갈 수 없는 맵 밖에 아이템이 떨어져 있어") */
  for(const d of drops)keepIn(d,40);for(const g of gems)keepIn(g,20);for(const e of enemies)if(!e.dead)keepIn(e,0);
  gimUpdate(dt);
  /* 다가가면 열리고, 등급 이름이 룰렛처럼 돌다 멈춘 뒤 장비가 나온다(11-15, meta.js) */
  for(const c of chests){c.t+=dt;if(c.spin!==undefined){c.spin-=dt;if(c.spin<=0)chestSpinEnd(c);continue;}if(P.dead||Math.hypot(P.x-c.x,P.y-c.y)>34)continue;chestOpen(c);}
  chests=chests.filter(c=>!c.dead);guards=guards.filter(g=>!g.dead);
}

/* 그림 */
const sprChest=makeSprite(56,50,28,42,g=>{
  cel(g,()=>rr(g,-19,-22,38,22,3),'#8a5a2c',()=>{g.fillStyle='#63401f';g.fillRect(-22,-24,12,26);},3);
  cel(g,()=>{g.beginPath();g.moveTo(-20,-21);g.quadraticCurveTo(-20,-37,0,-37);g.quadraticCurveTo(20,-37,20,-21);g.closePath();},'#a06a34',()=>{g.fillStyle='#74481f';g.fillRect(-22,-40,12,22);},3);
  for(const x of[-13,13]){rr(g,x-2.5,-37,5,37,1.5);inkF(g,'#e6b450',2);}
  rr(g,-21,-24,42,4.5,2);inkF(g,'#e6b450',2.2);rr(g,-4.5,-27,9,11,2);inkF(g,'#fff0c2',2.2);g.fillStyle=INK;ell(g,0,-21,1.6,2.4);g.fill();});
function drawChest(c){ctx.fillStyle='rgba(8,8,20,.4)';ell(ctx,c.x,c.y+2,22,7);ctx.fill();const k=1+Math.sin(c.t*3)*.03;blit(sprChest,c.x,c.y,k,2-k);lights.push([c.x,c.y-14,120,.72]);}
/* 어둠이 덮이기 전: 잠든 수호자 표시 */
function renderWorldFx(){
  for(const g of guards){if(!g.sleep)continue;lights.push([g.x,g.y-80,210,.55]);ctx.font='800 22px "Pretendard Variable",Pretendard,"Noto Sans KR","Malgun Gothic",sans-serif';ctx.textAlign='center';
    for(let i=0;i<3;i++){const q=((clock*.5+i/3)%1),x=g.x+34*(g.vs||1)+q*26,y=g.y-g.T.art[2]*.78*(g.vs||1)-q*44;ctx.globalAlpha=1-q;ctx.lineWidth=5;ctx.strokeStyle=INK;ctx.strokeText('Z',x,y);ctx.fillStyle='#d8f6ff';ctx.fillText('Z',x,y);}ctx.globalAlpha=1;}
}
function renderWorldGlow(){for(const c of chests)glow(c.x,c.y-14,46,'rgb(255,210,120)',.4+.15*Math.sin(c.t*3));}
/* 미니맵: 왼쪽 위. 주황 = 모닥불, 흰 점 = 나, 금빛 네모 = 보물 상자, 빨간 마름모 = 수호자, 주황 고리 = 나타난 보스, 등급 색 점 = 전설·신화 장비 */
/* 11-16: 화면 밖에 있는 중요한 것(갈림길 제단·황금 도깨비·보스·전설 이상 장비) 쪽 화면 가장자리에 화살표 */
function guideArrows(tx,ty){if(state!=='play'||P.dead)return;const T=[];
  if(RUN.altar)T.push([RUN.altar.x,RUN.altar.y,'#b678ff']);
  for(const e of enemies)if(!e.dead&&e.type==='tgob')T.push([e.x,e.y,'#ffd56a']);
  if(bossRef&&!bossRef.dead)T.push([bossRef.x,bossRef.y,'#ff6a4a']);
  for(const d of drops)if(d.landed&&d.it.gi>=3)T.push([d.x,d.y,gradeColor(d.it)]);
  const m=30,top=hudPad.t+(bossRef&&!bossRef.dead?135:85);let n=0; /* 위쪽 체력·보스 띠와 겹치지 않게 */
  for(const[x,y,c]of T){if(n>=6)break;const sx=tx(x),sy=ty(y);if(sx>-8&&sx<W+8&&sy>-8&&sy<H+8)continue;n++;
    const dx=sx-W/2,dy=sy-H/2,t=Math.min((W/2-m)/(Math.abs(dx)||1),(H/2-m)/(Math.abs(dy)||1)),px=W/2+dx*t,py=clamp(H/2+dy*t,top,H-m),a=Math.atan2(dy,dx),p=1+.12*Math.sin(clock*6);
    ctx.save();ctx.translate(px,py);ctx.rotate(a);ctx.scale(p,p);ctx.beginPath();ctx.moveTo(13,0);ctx.lineTo(-8,-9);ctx.lineTo(-4,0);ctx.lineTo(-8,9);ctx.closePath();ctx.lineWidth=4;ctx.strokeStyle=INK;ctx.stroke();ctx.fillStyle=c;ctx.fill();ctx.restore();}
}
function drawMinimap(){
  if(state!=='play')return;
  const s=96,x0=hudPad.l,y0=hudPad.t+60+(bossRef&&!bossRef.dead?44:0),k=s/(WORLD_R*2),lim=s/2-4,mx=w=>x0+s/2+clamp(w*k,-lim,lim),my=w=>y0+s/2+clamp(w*k,-lim,lim);
  rr(ctx,x0,y0,s,s,9);ctx.fillStyle='rgba(10,12,23,.74)';ctx.fill();ctx.lineWidth=3.5;ctx.strokeStyle=INK;ctx.stroke();ctx.lineWidth=1.3;ctx.strokeStyle='#3d4889';ctx.stroke();
  ctx.lineWidth=1;ctx.strokeStyle='rgba(154,163,191,.16)';ctx.beginPath();ctx.moveTo(x0+s/2,y0+5);ctx.lineTo(x0+s/2,y0+s-5);ctx.moveTo(x0+5,y0+s/2);ctx.lineTo(x0+s-5,y0+s/2);ctx.stroke();
  ctx.fillStyle='#ff9a3c';ell(ctx,mx(0),my(0),2.8,2.8);ctx.fill();
  ctx.fillStyle='#ffd27a';ctx.strokeStyle=INK;ctx.lineWidth=1;for(const c of chests){const px=mx(c.x),py=my(c.y);ctx.fillRect(px-2.4,py-2.4,4.8,4.8);ctx.strokeRect(px-2.4,py-2.4,4.8,4.8);}
  for(const d of drops)if(d.landed&&d.it.gi>=4){ctx.fillStyle=gradeColor(d.it);ell(ctx,mx(d.x),my(d.y),2,2);ctx.fill();} /* 11-16 대표님: 미니맵엔 신화 장비만 */
  for(const g of guards){const px=mx(g.x),py=my(g.y),r=(g.sleep?3.6:3.6+Math.sin(clock*8))+(g.tier||0)*.3;poly(ctx,[[px,py-r],[px+r,py],[px,py+r],[px-r,py]]);ctx.fillStyle='#e0524f';ctx.fill();ctx.lineWidth=1;ctx.strokeStyle=INK;ctx.stroke();}
  if(bossRef&&!bossRef.dead&&!bossRef.guard){ctx.lineWidth=1.6;ctx.strokeStyle='#ff9a3c';ell(ctx,mx(bossRef.x),my(bossRef.y),4,4);ctx.stroke();}
  gimMinimap(mx,my);metaMinimap(mx,my);
  ell(ctx,mx(P.x),my(P.y),2.8,2.8);ctx.fillStyle='#fff';ctx.fill();ctx.lineWidth=1.2;ctx.strokeStyle=INK;ctx.stroke();
}
