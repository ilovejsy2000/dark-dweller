'use strict';
/* 다크 드웰러 — 야영지 = 동굴 안(11-15 대표님 "동굴 앞 느낌으로 아예 새롭게, 아니면 동굴 안이었다가 맵에 들어갈 때 동굴 밖으로 나가는 연출").
   거점은 동굴 안: 둥근 돌벽, 빛나는 수정, 가운데 모닥불, 아래쪽에 달빛이 드는 출구.
   주인공이 걸어 다니다 자리에 다가가면 아래 단추로 연다 — 대장간(재련·분해) · 창고 · 어둠의 제단(특성) · 도감 비석 · 동굴 출구(맵 고르고 출발).
   출발하면 주인공이 출구로 걸어 나가며 화면이 어두워지고 맵으로 넘어간다. 판이 끝나면 출구 쪽에서 걸어 들어온다.
   재련·분해는 야영지에서만 된다(판 안의 장비 창에서는 막음 — 나중에 수익 구조를 위해). */
const HUB=[
  {kind:'hub',k:'tal',x:-115,y:-150,n:'어둠의 제단',act:'특성'},
  {kind:'hub',k:'cx',x:115,y:-150,n:'도감 비석',act:'도감'},
  {kind:'hub',k:'forge',x:-138,y:60,n:'대장간',act:'재련 · 분해'},
  {kind:'hub',k:'stash',x:136,y:60,n:'창고',act:'장비'},
  {kind:'hub',k:'exit',x:0,y:265,n:'동굴 출구',act:'바깥으로 · 출발 준비'},
];
const CAVE={rx:300,ry:255,cy:0,exitW:70};          // 동굴 바닥(타원)과 출구 폭
const CAVE_DARK=[10,8,22,.3];                        // 동굴 안 어둠
let hubNear=null,hubHinted=false,hubExit=null,hubEnter=0;
const hubPanels=['lobby','inv','tal','cx','cfg','help','tip','result'];
const hubFree=()=>state==='lobby'&&!hubExit&&hubPanels.every(id=>$(id).hidden);
function hubOpen(k){SFX.ui();soundOn();joy=null;show('hubHint',false); /* 안내문이 열린 창 위에 겹치지 않게 */
  if(k==='exit'){refreshLobby();show('lobby',true);}
  else if(k==='forge'){uiInv('lobby');uiNote2('대장간 · 장비를 눌러 재련하거나, 꾹 눌러 여러 개를 골라 분해하세요.');}
  else if(k==='stash')uiInv('lobby');
  else if(k==='tal'){renderTal();show('tal',true);}
  else if(k==='cx'){renderCx();show('cx',true);}}
/* 걸을 수 있는 곳: 바닥 타원 + 아래쪽 출구 길 */
function caveClamp(){
  if(P.y>CAVE.cy+CAVE.ry*.7&&Math.abs(P.x)<CAVE.exitW){P.x=clamp(P.x,-CAVE.exitW+16,CAVE.exitW-16);P.y=Math.min(P.y,330);return;}
  const q=Math.hypot(P.x/(CAVE.rx-30),(P.y-CAVE.cy)/(CAVE.ry-30));if(q>1){P.x/=q;P.y=CAVE.cy+(P.y-CAVE.cy)/q;}
}
function hubUpdate(dt){
  if(titleOn){show('hubTop',false);show('hubAct',false);return;}
  /* 들어오는 연출: 화면이 밝아지며 출구에서 걸어 들어온다 */
  if(hubEnter>0){hubEnter-=dt;P.move=true;P.y-=110*dt;P.dir=1;fadeTo(Math.max(0,hubEnter/.9));if(hubEnter<=0){fadeTo(0);P.move=false;}show('hubTop',false);show('hubAct',false);return;}
  /* 나가는 연출: 출구로 걸어가며 어두워진 뒤 맵으로 */
  if(hubExit){const h=hubExit;h.t+=dt;const tx=0,ty=470,dx=tx-P.x,dy=ty-P.y,d=Math.hypot(dx,dy)||1;P.move=true;P.x+=dx/d*Math.min(d,200*dt);P.y+=dy/d*Math.min(d,200*dt);if(Math.abs(dx)>4)P.dir=dx>0?1:-1;
    fadeTo(clamp((h.t-.55)/.65,0,1),'동굴 밖으로');if(h.t>=1.35){hubExit=null;fadeOut();uiStart();}return;}
  const free=hubFree();show('hubTop',free);
  if(!free){show('hubAct',false);return;}
  hubTopRefresh();
  let mx=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0),my=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0);
  if(joy){const dx=joy.x-joy.x0,dy=joy.y-joy.y0,d=Math.hypot(dx,dy);if(d>7){const k=Math.min(1,d/46);mx=dx/d*k;my=dy/d*k;}}
  const ml=Math.hypot(mx,my);if(ml>1){mx/=ml;my/=ml;}
  P.move=ml>.05;P.x+=mx*170*dt;P.y+=my*170*dt*.92;if(Math.abs(mx)>.1)P.dir=mx>0?1:-1;
  caveClamp();
  const fd=Math.hypot(P.x,(P.y+4)*1.25);if(fd<54){P.x*=54/fd;P.y=(P.y+4)*54/fd-4;} /* 11-16: 모닥불 위에 올라선 것처럼 보이지 않게 둘레를 넓힘 */
  for(const h of HUB){if(h.k==='exit')continue;const d=Math.hypot(P.x-h.x,(P.y-h.y)*1.4);if(d<32){P.x=h.x+(P.x-h.x)*32/d;P.y=h.y+(P.y-h.y)*32/d;}}
  let near=null,bd=1e9;for(const h of HUB){const d=Math.hypot(P.x-h.x,P.y-h.y);if(d<(h.k==='exit'?95:82)&&d<bd){bd=d;near=h;}}
  if(near!==hubNear){hubNear=near;const b=$('hubAct');if(near){b.textContent=`${near.n} · ${near.act}`;SFX.ui();}show('hubAct',!!near);}
  if(!hubHinted&&clock>1.5){hubHinted=true;uiHubHint();}
}
/* 출발: 맵 고르기 창의 '출발'을 누르면 바로 시작하지 않고 걸어 나간다 */
function hubDepart(){if(hubExit)return;soundOn();SFX.ui();show('lobby',false);show('hubAct',false);show('hubTop',false);joy=null;hubExit={t:0};}
/* 돌아올 때: 출구 쪽에서 걸어 들어온다 */
function hubArrive(){P.x=0;P.y=320;P.dir=1;hubEnter=.9;cam.x=0;cam.y=270;fadeTo(1,'');}
function fadeTo(a,txt){const f=$('fade');f.classList.remove('out');f.hidden=a<=0;f.style.opacity=a;if(txt!==undefined)$('fadeTxt').textContent=txt;}
function fadeOut(){const f=$('fade');f.classList.add('out');f.style.opacity=0;setTimeout(()=>{if(f.classList.contains('out'))f.hidden=true;},650);}
function uiHubHint(){const h=$('hubHint');h.hidden=false;setTimeout(()=>{h.hidden=true;},5200);}
let hubResC='';function hubTopRefresh(){const t=`어둠 결정 ${SAVE.shard||0} · 마력 가루 ${SAVE.dust||0}`;if(t!==hubResC){hubResC=t;$('hubRes').textContent=t;}}

/* ───── 그림 ───── */
/* 동굴 바닥·벽 밑그림: 한 번만 그려 두고 찍는다(세계 좌표 -600~600, -480~560) */
const CAVE_BOX={x:-560,y:-430,w:1120,h:1330};
let caveBase=null;
function makeCaveBase(){
  const B=CAVE_BOX,c=document.createElement('canvas'),k=1;c.width=B.w*k;c.height=B.h*k;const g=c.getContext('2d');g.translate(-B.x,-B.y);const r=rng(7);
  g.fillStyle='#1d1935';g.fillRect(B.x,B.y,B.w,B.h);
  for(let i=0;i<140;i++){const x=B.x+r()*B.w,y=B.y+r()*B.h;g.fillStyle=r()<.5?'#1d1934':'#120f22';ell(g,x,y,10+r()*40,8+r()*26,r()*3);g.fill();}
  /* 출구 길: 아래로 갈수록 넓어지며 달빛이 든다 */
  const ex=CAVE.exitW;g.beginPath();g.moveTo(-ex-20,CAVE.cy+CAVE.ry*.6);g.lineTo(-ex-150,900);g.lineTo(ex+150,900);g.lineTo(ex+20,CAVE.cy+CAVE.ry*.6);g.closePath();g.fillStyle='#3b3653';g.fill();
  const og=g.createLinearGradient(0,250,0,620);og.addColorStop(0,'rgba(80,120,190,0)');og.addColorStop(.5,'rgba(110,150,215,.6)');og.addColorStop(1,'rgba(175,208,255,1)');g.fillStyle=og;g.fill();
  g.lineWidth=7;g.strokeStyle='#0b0a17';g.beginPath();g.moveTo(-ex-20,CAVE.cy+CAVE.ry*.6);g.lineTo(-ex-150,900);g.moveTo(ex+20,CAVE.cy+CAVE.ry*.6);g.lineTo(ex+150,900);g.stroke();
  g.save();g.beginPath();g.moveTo(-ex-20,CAVE.cy+CAVE.ry*.6);g.lineTo(-ex-150,900);g.lineTo(ex+150,900);g.lineTo(ex+20,CAVE.cy+CAVE.ry*.6);g.closePath();g.clip();
  g.fillStyle='rgba(175,208,255,1)';g.fillRect(-ex-150,620,2*ex+300,280);g.restore(); // 동굴 밖: 달빛 든 바깥(출구 길 모양 안에서만)
  /* 바닥 타원 */
  ell(g,0,CAVE.cy,CAVE.rx,CAVE.ry);g.fillStyle='#3b3653';g.fill();
  const fg=g.createRadialGradient(0,0,20,0,CAVE.cy,CAVE.rx);fg.addColorStop(0,'#6a5c80');fg.addColorStop(.55,'#514870');fg.addColorStop(1,'#3a3456');g.fillStyle=fg;g.fill();
  g.lineWidth=8;g.strokeStyle='#0b0a17';g.stroke();
  /* 바닥 무늬: 납작한 돌판·자갈·금 */
  for(let i=0;i<46;i++){const a=r()*TAU,d=Math.sqrt(r())*.86,x=Math.cos(a)*CAVE.rx*d,y=CAVE.cy+Math.sin(a)*CAVE.ry*d;if(Math.hypot(x,y)<60)continue;
    ell(g,x,y,14+r()*22,8+r()*10,r()*3);g.fillStyle=r()<.5?'rgba(255,255,255,.035)':'rgba(0,0,0,.12)';g.fill();}
  g.lineWidth=2;g.strokeStyle='rgba(10,8,20,.45)';for(let i=0;i<14;i++){const a=r()*TAU,d=.3+r()*.55;let x=Math.cos(a)*CAVE.rx*d,y=CAVE.cy+Math.sin(a)*CAVE.ry*d;g.beginPath();g.moveTo(x,y);for(let j=0;j<3;j++){x+=(r()-.5)*40;y+=(r()-.5)*26;g.lineTo(x,y);}g.stroke();}
  for(let i=0;i<60;i++){const a=r()*TAU,d=Math.sqrt(r())*.92,x=Math.cos(a)*CAVE.rx*d,y=CAVE.cy+Math.sin(a)*CAVE.ry*d;ell(g,x,y,2+r()*3,1.5+r()*2);g.fillStyle='#262139';g.fill();}
  /* 모닥불 둘레의 돌 고리 자리(밝은 흙) */
  ell(g,0,4,70,40);g.fillStyle='rgba(120,90,70,.25)';g.fill();
  caveBase=c;
}
/* 벽 바위: 바닥 가장자리를 따라. 아래쪽 바위는 주인공을 가리게 세로 순서로 그린다 */
let caveRocks=null;
function makeCaveRocks(){
  caveRocks=[];const r=rng(11),cols=[['#4a4568','#5d587e'],['#3f3a5c','#524d72'],['#45405f','#58537a']];
  for(let a=0;a<TAU;a+=.13+r()*.05){const gap=Math.abs(Math.atan2(Math.sin(a-Math.PI/2),Math.cos(a-Math.PI/2)));if(gap<.36)continue;
    const s=34+r()*34,x=Math.cos(a)*(CAVE.rx+s*.25),y=CAVE.cy+Math.sin(a)*(CAVE.ry+s*.2),c=pick(cols),w=s*(1.1+r()*.4),h=s*(Math.sin(a)<0?1.5:1.05);
    const sp=makeSprite(w*2+16,h+18,w+8,h+8,g=>{blob(g,[[-w,0],[-w*.9,-h*.55],[-w*.45,-h],[w*.2,-h*.92],[w*.85,-h*.5],[w,0]]);inkF(g,c[0],3.5);
      g.fillStyle=c[1];blob(g,[[-w*.6,-h*.5],[-w*.35,-h*.86],[w*.1,-h*.8],[-w*.1,-h*.5]]);g.fill();});
    caveRocks.push({kind:'rock',x,y:y+4,sp});}
  /* 수정 무더기 */
  for(const[a,col]of[[-2.5,'#7fe3ff'],[-.65,'#b678ff'],[2.7,'#b678ff'],[.35,'#7fe3ff'],[-1.55,'#ffd56a']]){const x=Math.cos(a)*(CAVE.rx-24),y=CAVE.cy+Math.sin(a)*(CAVE.ry-20);
    const sp=makeSprite(70,80,35,72,g=>{for(const[dx,h,lean]of[[-14,34,-.35],[0,52,0],[14,30,.4]]){g.save();g.translate(dx,0);g.rotate(lean);poly(g,[[-7,0],[-7,-h*.75],[0,-h],[7,-h*.75],[7,0]]);inkF(g,col,3);g.fillStyle='rgba(255,255,255,.45)';poly(g,[[-2,-4],[-2,-h*.7],[1,-h*.85]]);g.fill();g.restore();}});
    caveRocks.push({kind:'rock',x,y:y+2,sp,glow:col});}
}
/* 동굴 바닥(땅 조각 대신) */
function drawCaveFloor(L,T,R,B){
  if(!caveBase)makeCaveBase();ctx.fillStyle='#1d1935';ctx.fillRect(L-4,T-4,R-L+8,B-T+8);ctx.drawImage(caveBase,CAVE_BOX.x,CAVE_BOX.y,CAVE_BOX.w,CAVE_BOX.h);
  /* 출구 밖으로 내리는 달빛 먼지 */
  for(let i=0;i<10;i++){const q=(clock*.08+i/10)%1,x=Math.sin(i*7.3)*CAVE.exitW*1.2,y=520-q*200;ctx.globalAlpha=(1-q)*.5;ctx.fillStyle='#d8e8ff';ell(ctx,x,y,1.6,1.6);ctx.fill();}ctx.globalAlpha=1;
}
function hubDrawList(dl){if(!caveRocks)makeCaveRocks();for(const r of caveRocks)dl.push(r);for(const h of HUB)if(h.k!=='exit')dl.push(h);}
function drawCaveRock(o){blit(o.sp,o.x,o.y,1,1);if(o.glow)lights.push([o.x,o.y-30,130,.7]);}
function hubGlow(){if(state!=='lobby'||!caveRocks)return;for(const r of caveRocks)if(r.glow)glow(r.x,r.y-30,52,r.glow==='#ffd56a'?'rgb(255,214,106)':r.glow==='#7fe3ff'?'rgb(127,227,255)':'rgb(182,120,255)',.35+.1*Math.sin(clock*2+r.x));
  glow(0,520,200,'rgb(150,190,255)',.4);}
function hubLights(){lights.push([0,520,320,1]);lights.push([0,330,170,.6]);
  /* 출구 이름표 */
  const o=HUB[4],near=hubNear===o;ctx.font=`800 ${near?17:14}px "Pretendard Variable",Pretendard,"Noto Sans KR","Malgun Gothic",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=4;ctx.strokeStyle=INK;ctx.strokeText(o.n,o.x,o.y-18);ctx.fillStyle=near?'#ffcf3f':'#e6e9ff';ctx.fillText(o.n,o.x,o.y-18);}
function drawHub(o){
  const x=o.x,y=o.y,near=hubNear===o,t=clock;
  ctx.fillStyle='rgba(8,8,20,.4)';ell(ctx,x,y+2,34,10);ctx.fill();
  switch(o.k){
  case'forge':{ // 화덕 + 그루터기 위 모루 + 망치
    rr(ctx,x-58,y-46,30,46,5);inkF(ctx,'#5d587e',3);ctx.fillStyle='#ff8a2e';rr(ctx,x-52,y-26,18,14,4);ctx.fill();drawFlame(ctx,x-43,y-24,t,.3);lights.push([x-43,y-30,120,.75]);
    rr(ctx,x-22,y-26,44,26,6);inkF(ctx,'#8a5a2c',3);ctx.fillStyle='#6b4630';ell(ctx,x,y-26,22,6);ctx.fill();
    blob(ctx,[[x-30,y-48],[x+30,y-48],[x+38,y-56],[x+12,y-56],[x+10,y-40],[x-10,y-40],[x-12,y-56],[x-30,y-56]]);inkF(ctx,'#7a80a8',3);rr(ctx,x-14,y-42,28,16,3);inkF(ctx,'#5d587e',3);
    ctx.save();ctx.translate(x+30,y-62);ctx.rotate(-.6+Math.sin(t*3)*.08);rr(ctx,-2,-2,4,26,2);inkF(ctx,'#8a5a2c',2.2);rr(ctx,-9,-8,18,9,2);inkF(ctx,'#9aa3bf',2.2);ctx.restore();
    if(Math.random()<.25)ember(x-43,y-34,1,5,60);break;}
  case'stash':{blit(sprChest,x,y,1.35,1.35);lights.push([x,y-20,110,.55]);drawStashBadge(x,y);break;}
  case'tal':{ // 돌 제단 + 떠 있는 보라 수정
    rr(ctx,x-22,y-30,44,30,5);inkF(ctx,'#5f6690',3);rr(ctx,x-28,y-36,56,9,3);inkF(ctx,'#7a80a8',3);
    const f=Math.sin(t*2)*3;poly(ctx,[[x,y-82-f],[x+12,y-58-f],[x,y-42-f],[x-12,y-58-f]]);inkF(ctx,'#b678ff',3);poly(ctx,[[x,y-78-f],[x+5,y-60-f],[x,y-50-f]]);ctx.fillStyle='#e9d8ff';ctx.fill();
    lights.push([x,y-60,150,.75]);drawTalBadge(x,y);break;}
  case'cx':{ // 글이 새겨진 비석
    ctx.beginPath();ctx.moveTo(x-20,y);ctx.lineTo(x-20,y-58);ctx.quadraticCurveTo(x,y-74,x+20,y-58);ctx.lineTo(x+20,y);ctx.closePath();inkF(ctx,'#7a80a8',3);
    ctx.lineWidth=2.2;ctx.strokeStyle='#3d4370';for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(x-11,y-50+i*11);ctx.lineTo(x+11,y-50+i*11);ctx.stroke();}
    ctx.fillStyle='#ffd56a';ell(ctx,x,y-62,3,3);ctx.fill();lights.push([x,y-40,100,.5]);break;}
  }
  const ly=y-(o.k==='tal'?96:o.k==='cx'?86:o.k==='forge'?80:70);
  ctx.font=`800 ${near?17:14}px "Pretendard Variable",Pretendard,"Noto Sans KR","Malgun Gothic",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=4;ctx.strokeStyle=INK;ctx.strokeText(o.n,x,ly);ctx.fillStyle=near?'#ffcf3f':'#e6e9ff';ctx.fillText(o.n,x,ly);
  if(near){ctx.lineWidth=3;ctx.strokeStyle=`rgba(255,207,63,${.6+.3*Math.sin(t*6)})`;ctx.beginPath();ctx.ellipse(x,y,40,14,0,0,TAU);ctx.stroke();}
}
function hubInit(){
  $('hubAct').addEventListener('click',()=>{if(hubNear)hubOpen(hubNear.k);});
  $('campBtn').addEventListener('click',()=>{SFX.ui();show('lobby',false);});
  window.addEventListener('keydown',e=>{if((e.code==='KeyE'||e.code==='Enter'||e.code==='Space')&&hubNear&&hubFree()){e.preventDefault();hubOpen(hubNear.k);}});
}
