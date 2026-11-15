'use strict';
/* 다크 드웰러 — 맵마다 다른 기믹(11-15 대표님 "맵마다 기믹을 넣어줘")
   모닥불 숲  축복 제단: 위에 잠깐 서 있으면 40초 축복(분노·바람·수확·생명 가운데 하나). 쓰고 나면 90초 쉰다
   서리 폐허  얼음 수정: 닿으면 깨지며 둘레의 적을 얼린다(보스는 느려지기만) + 눈보라: 이따금 모두 느려지는데 적이 더 느려진다
   잿불 황야  화약통: 닿으면 1초 뒤 크게 터져 적만 다친다 + 화산탄: 이따금 주인공 둘레에 떨어진다(적과 나 모두 다침, 빨간 원을 피하기)
   심연       영혼 등불: 닿으면 켜져 둘레를 밝히고, 그 빛 안에서는 피해 +30%·체력 회복 + 어둠 잠식: 이따금 주인공 빛이 크게 줄어든다
   GIM: 다른 파일이 곱해 쓰는 값(dmg 내 피해, pspd 내 속도, espd 적 속도, light 내 빛), ev 위 알림 글 */
const GIM={dmg:1,pspd:1,espd:1,light:1,ev:''};
let gims=[],gimT=0,gimEv=0,gimEvT=0,bless=null;
const gimMap=()=>mapIdx();
const BLESS=[
  {k:'rage',n:'분노의 축복',d:'피해 +40%',c:'#ff8a5c'},
  {k:'wind',n:'바람의 축복',d:'이동 속도 +35%',c:'#9fe8ff'},
  {k:'harvest',n:'수확의 축복',d:'둘레 경험치를 모두 끌어옴',c:'#6fd6c8'},
  {k:'life',n:'생명의 축복',d:'체력을 모두 채우고 초당 3% 회복',c:'#9cd16a'},
];
/* 맵 안쪽에 두기: 모닥불을 가운데로 한 타원(가로 WORLD_R, 세로 0.85배) 안 */
function keepIn(o,m){const q=Math.hypot(o.x,o.y/.85)/(WORLD_R-(m||0));if(q>1){o.x/=q;o.y/=q;}}
function gimSpot(d0,d1){const a=Math.random()*TAU,d=rand(d0,d1);return[Math.cos(a)*d,Math.sin(a)*d*.85];}
function gimAdd(k,d0,d1,o){const[x,y]=gimSpot(d0,d1);const g=Object.assign({kind:'gim',k,x,y,t:Math.random()*6,cd:0,lit:0,fuse:-1,hold:0},o||{});gims.push(g);return g;}
function gimInit(){
  gims=[];bless=null;gimEv=0;gimEvT=0;Object.assign(GIM,{dmg:1,pspd:1,espd:1,light:1,ev:''});
  const mi=gimMap();
  if(mi===0){gimAdd('altar',480,640);for(let i=0;i<5;i++)gimAdd('altar',900+i*700,1500+i*700);}
  if(mi===1){for(let i=0;i<4;i++)gimAdd('crystal',300,900);for(let i=0;i<22;i++)gimAdd('crystal',900,4700);gimT=70;}
  if(mi===2){for(let i=0;i<5;i++)gimAdd('barrel',260,800);for(let i=0;i<34;i++)gimAdd('barrel',800,4700);gimT=50;}
  if(mi===3){gimAdd('lamp',380,560);for(let i=0;i<13;i++)gimAdd('lamp',700,4700);gimT=80;}
}
function gimBless(g){const b=pick(BLESS);g.cd=90;bless={...b,t:b.k==='harvest'?0:40};
  uiBanner(b.n);textFx(P.x,P.y-80,b.d,b.c);ring(g.x,g.y,16,520,b.c);flash(g.x,g.y-30,320,.4);SFX.level();buzz(40);
  if(b.k==='harvest'){for(const m of gems)if(Math.hypot(m.x-P.x,m.y-P.y)<1600)m.pull=420;bless=null;}
  if(b.k==='life')P.hp=P.maxhp;}
function gimFreeze(g){g.dead=true;const m=runT/60,R=300;
  for(const e of enemies){if(e.dead||e.sleep)continue;const dx=e.x-g.x,dy=e.y-g.y,d=Math.hypot(dx,dy)||1;if(d>R+e.r)continue;
    if(e.boss)e.slow=Math.max(e.slow,3);else{e.stun=Math.max(e.stun,e.elite?1.6:3);e.ice=Math.max(e.ice,e.elite?1.6:3);}
    hitEnemy(e,90*DIFF.hp(m)*MAP.hp,dx/d,dy/d,200,'ice',false,true);}
  debris(g.x,g.y-20,['#d8f6ff','#9fd8ff','#f4fcff'],14,1.4);ring(g.x,g.y,20,R*3,'#bfe9ff');flash(g.x,g.y-20,R*1.4,.35);SFX.boom();shake(.25);buzz(30);textFx(g.x,g.y-70,'얼어붙음','#bfe9ff');
  later(60,()=>{if(state==='play'&&gimMap()===1)gimAdd('crystal',900,4700);});}
function gimBoom(g){g.dead=true;const m=runT/60,R=270;
  for(const e of enemies){if(e.dead||e.sleep)continue;const dx=e.x-g.x,dy=e.y-g.y,d=Math.hypot(dx,dy)||1;if(d<R+e.r)hitEnemy(e,300*DIFF.hp(m)*MAP.hp,dx/d,dy/d,620,'fire',false,true);}
  for(const o of gims)if(o.k==='barrel'&&!o.dead&&o.fuse<0&&Math.hypot(o.x-g.x,o.y-g.y)<R)o.fuse=.25; // 옆 통도 따라 터진다
  debris(g.x,g.y-14,['#8a5a2c','#63401f','#ffb347'],14,1.6);puff(g.x,g.y-16,10,'#5a5070');ring(g.x,g.y,20,R*3.2,'#ffb347');flash(g.x,g.y-20,R*1.8,.45);ember(g.x,g.y-10,14,40,120);SFX.boom();shake(.45);buzz(50);
  later(50,()=>{if(state==='play'&&gimMap()===2)gimAdd('barrel',800,4700);});}
/* 화산탄: 주인공 둘레 세 곳. 1.4초 뒤 떨어진다(빨간 원 = 나도 다침) */
function gimVolcano(){const n=3+Math.min(3,runT/300|0);for(let i=0;i<n;i++){const a=Math.random()*TAU,d=i===0?rand(0,60):rand(90,330),x=P.x+Math.cos(a)*d,y=P.y+Math.sin(a)*d*.8,R=110,m=runT/60;
  blast(x,y,R,1.4,P.maxhp*.12,false,{deb:['#3a2a2a','#ff7a2f','#ffb347']});
  later(1.4,()=>{if(state!=='play')return;for(const e of enemies){if(e.dead||e.sleep)continue;const dx=e.x-x,dy=e.y-y,dd=Math.hypot(dx,dy)||1;if(dd<R+e.r)hitEnemy(e,220*DIFF.hp(m)*MAP.hp,dx/dd,dy/dd,360,'fire',true,true);}ember(x,y-6,10,30,110);});}}
function gimUpdate(dt){
  if(state!=='play')return;
  const mi=gimMap();GIM.dmg=1;GIM.pspd=1;GIM.espd=1;GIM.light=1;let ev='';
  /* 축복 */
  if(bless){bless.t-=dt;if(bless.t<=0)bless=null;else{if(bless.k==='rage')GIM.dmg*=1.4;if(bless.k==='wind')GIM.pspd*=1.35;if(bless.k==='life'&&!P.dead)P.hp=Math.min(P.maxhp,P.hp+P.maxhp*.03*dt);ev=`${bless.n} ${Math.ceil(bless.t)}초`;}}
  for(const g of gims){g.t+=dt;if(g.dead)continue;const d=Math.hypot(P.x-g.x,P.y-g.y);
    if(g.k==='altar'){if(g.cd>0){g.cd-=dt;g.hold=0;continue;}if(!P.dead&&d<62){g.hold+=dt;if(g.hold>=1.2){g.hold=0;gimBless(g);}}else g.hold=Math.max(0,g.hold-dt*2);}
    else if(g.k==='crystal'){if(!P.dead&&d<46)gimFreeze(g);}
    else if(g.k==='barrel'){if(g.fuse<0){if(!P.dead&&d<44){g.fuse=1;SFX.warn();textFx(g.x,g.y-60,'펑!','#ffb347');}}else{g.fuse-=dt;if(dt>0&&Math.random()<.5)ember(g.x+6,g.y-44,1,3,50);if(g.fuse<=0)gimBoom(g);}}
    else if(g.k==='lamp'){if(g.lit>0){g.lit-=dt;if(!P.dead&&d<380){GIM.dmg*=1.3;P.hp=Math.min(P.maxhp,P.hp+P.maxhp*.015*dt);if(!ev)ev='영혼 등불 빛 안';}}
      else if(!P.dead&&d<50){g.lit=75;uiBanner('영혼 등불');ring(g.x,g.y-40,16,520,'#b8a6ff');flash(g.x,g.y-40,380,.4);SFX.level();}}}
  gims=gims.filter(g=>!g.dead);
  /* 맵 사건: 눈보라·화산탄·어둠 잠식 */
  if(mi>=1&&!ending){gimT-=dt;
    if(mi===1){if(gimEvT>0){gimEvT-=dt;GIM.espd*=.6;GIM.pspd*=.88;ev=ev||'눈보라';}if(gimT<=0){gimT=110;gimEvT=14;uiBanner('눈보라가 몰아칩니다');}}
    if(mi===2){if(gimT<=0){gimT=Math.max(9,20-runT/120);gimVolcano();if(can('vol',8000))uiNote('화산탄! 빨간 원을 피하세요');}}
    if(mi===3){if(gimEvT>0){gimEvT-=dt;GIM.light*=.55;ev=ev||'어둠 잠식';}if(gimT<=0){gimT=95;gimEvT=12;uiBanner('어둠이 짙어집니다');}}}
  GIM.ev=ev;
}
/* 그림: 세로 순서대로 그릴 때 불린다 */
function drawGim(g){const c=ctx,x=g.x,y=g.y,b=Math.sin(g.t*2.4)*3;
  c.fillStyle='rgba(8,8,20,.36)';ell(c,x,y+2,30,9);c.fill();
  if(g.k==='altar'){const on=g.cd<=0,col=on?'#6fd6c8':'#4a4f66';
    c.globalAlpha=on?.35+.15*Math.sin(g.t*3):.18;c.fillStyle=col;ell(c,x,y,64,64*.66);c.fill();c.globalAlpha=1;c.lineWidth=3;c.strokeStyle=col;ell(c,x,y,64,64*.66);c.stroke();
    if(g.hold>0){c.lineWidth=6;c.strokeStyle='#f4fcff';c.beginPath();c.ellipse(x,y,64,64*.66,0,-Math.PI/2,-Math.PI/2+TAU*g.hold/1.2);c.stroke();}
    rr(c,-22+x,-18+y,44,18,5);inkF(c,'#7a7f9a',3);rr(c,-15+x,-46+y,30,30,5);inkF(c,'#8d93b0',3);
    c.fillStyle=on?'#b6fff2':'#5a6078';ell(c,x,y-31,5,7);c.fill();
    if(on){ell(c,x,y-72+b,11,11);inkF(c,'#b6fff2',3);ell(c,x-3,y-75+b,4,4);c.fillStyle='#f4fcff';c.fill();lights.push([x,y-50,190,.75]);}
    else{c.font='700 13px "Noto Sans KR","Malgun Gothic",sans-serif';c.textAlign='center';c.lineWidth=4;c.strokeStyle=INK;c.strokeText(Math.ceil(g.cd)+'초',x,y-62);c.fillStyle='#9aa3bf';c.fillText(Math.ceil(g.cd)+'초',x,y-62);}}
  else if(g.k==='crystal'){for(const[dx,h,w]of[[-13,34,9],[12,30,8],[0,52,11]]){poly(c,[[x+dx-w,y],[x+dx-w*.7,y-h*.7],[x+dx,y-h],[x+dx+w*.7,y-h*.7],[x+dx+w,y]]);inkF(c,dx?'#9fd8ff':'#d8f6ff',3);}
    c.fillStyle='rgba(255,255,255,.75)';poly(c,[[x-3,y-10],[x-2,y-40],[x+2,y-44],[x+1,y-12]]);c.fill();lights.push([x,y-26,150+Math.sin(g.t*2)*10,.75]);}
  else if(g.k==='barrel'){const hot=g.fuse>=0&&Math.sin(g.t*30)>0;rr(c,x-17,y-40,34,40,7);inkF(c,hot?'#fff1c2':'#8a5a2c',3);
    for(const yy of[-31,-11]){rr(c,x-18,y+yy,36,5,2);inkF(c,'#4a3a32',2);}
    c.font='900 15px "Jua","Malgun Gothic",sans-serif';c.textAlign='center';c.fillStyle=hot?'#e0524f':'#ffd27a';c.fillText('!',x,y-15);
    c.lineWidth=2.5;c.strokeStyle=INK;c.beginPath();c.moveTo(x+4,y-40);c.quadraticCurveTo(x+10,y-50,x+6,y-54);c.stroke();if(g.fuse>=0)lights.push([x+6,y-54,90,.8]);}
  else if(g.k==='lamp'){const on=g.lit>0;rr(c,x-3,y-70,6,70,2);inkF(c,'#3a3550',2.4);rr(c,x-13,y-94,26,28,6);inkF(c,on?'#e9e2ff':'#4a4466',3);
    c.fillStyle=on?'#b8a6ff':'#2b2741';ell(c,x,y-80,6,8+(on?Math.sin(g.t*9)*1.5:0));c.fill();
    if(on){lights.push([x,y-70,560*Math.min(1,g.lit/8+.3),.95]);c.globalAlpha=.22;c.lineWidth=3;c.strokeStyle='#b8a6ff';ell(c,x,y,380,380*.66);c.stroke();c.globalAlpha=1;}
    else lights.push([x,y-80,70,.5]);}
}
function gimGlow(){for(const g of gims){if(g.k==='altar'&&g.cd<=0)glow(g.x,g.y-60,46,'rgb(111,214,200)',.45);else if(g.k==='crystal')glow(g.x,g.y-26,40,'rgb(160,220,255)',.3);else if(g.k==='lamp'&&g.lit>0)glow(g.x,g.y-80,70,'rgb(184,166,255)',.6);}}
/* 눈보라 결: 화면에 흰 줄을 흩뿌린다 */
function gimScreen(){if(gimMap()!==1||!(gimEvT>0)||state!=='play')return;const a=Math.min(1,gimEvT/2,(14-gimEvT)/1.5);ctx.save();ctx.setTransform(DPR,0,0,DPR,0,0);ctx.globalAlpha=.55*a;ctx.strokeStyle='#e6f2ff';ctx.lineWidth=1.6;ctx.beginPath();
  for(let i=0;i<70;i++){const s=(i*97.3)%1,x=((i*53.7+clock*420)%(W+200))-100,y=((i*131.1+clock*260*(1+s))%(H+100))-50;ctx.moveTo(x,y);ctx.lineTo(x-14-s*10,y-6);}ctx.stroke();
  ctx.globalAlpha=.08*a;ctx.fillStyle='#dfefff';ctx.fillRect(0,0,W,H);ctx.restore();}
function gimMinimap(mx,my){for(const g of gims){if(g.k==='barrel')continue;const px=mx(g.x),py=my(g.y);
  ctx.fillStyle=g.k==='altar'?(g.cd<=0?'#6fd6c8':'#4a4f66'):g.k==='crystal'?'#bfe9ff':(g.lit>0?'#b8a6ff':'#6a6090');ell(ctx,px,py,2.2,2.2);ctx.fill();}}
