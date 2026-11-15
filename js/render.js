'use strict';
/* 다크 드웰러 — 화면 그리기. 그리는 일만 하고 규칙은 건드리지 않는다(나중에 그리기 도구를 바꿀 때 이 파일만 바꾼다). */

SFX.spear=()=>{tone('triangle',1300,480,.12,.13);noise(.1,.11,'highpass',3000,6000);};
SFX.vine=()=>{noise(.2,.18,'lowpass',520,190);tone('sine',180,88,.18,.2);};
SFX.wave=()=>{tone('sine',300,920,.3,.22);noise(.3,.18,'bandpass',800,2400,.7);};
SFX.ui=()=>tone('sine',660,990,.07,.16);

/* 주인공: 그림 한 장을 걸음에 맞춰 들썩·기울임 */
const heroIm=new Image();heroIm.src='img/hero.png';
function drawHero(g,o){
  if(!heroIm.complete||!heroIm.naturalWidth)return;
  const wp=o.t*10,st=o.move?Math.sin(wp):0,bob=o.move?Math.abs(st)*3.6:Math.sin(o.t*2.2)*1.2,sq=o.move?1+Math.abs(Math.cos(wp))*.045:1+Math.sin(o.t*2.2)*.014;
  let rot=o.move?.06+st*.05:0;if(o.swing>=0){const e=1-Math.pow(1-o.swing,3);rot+=-.3+e*.52;}
  const h=60,w=h*heroIm.naturalWidth/heroIm.naturalHeight;
  g.save();g.translate(0,-bob);g.rotate(rot);g.scale(1/sq,sq);g.imageSmoothingQuality='high';g.drawImage(heroIm,-w*.55,-h+2,w,h);g.restore();
}

/* 스킬 그림 */
const sprBlade=makeSprite(24,60,12,30,g=>{poly(g,[[-4,10],[-4,-16],[0,-27],[4,-16],[4,10]]);inkF(g,'#f3e6c8',2.6);g.fillStyle='#bff3ff';poly(g,[[-1.2,8],[-1.2,-15],[0,-22],[1.2,-15],[1.2,8]]);g.fill();rr(g,-8,10,16,4,2);inkF(g,'#b08845',2.4);rr(g,-2.2,14,4.4,11,2);inkF(g,'#6b4630',2.4);});
const sprAxe=makeSprite(48,48,24,24,g=>{rr(g,-2.2,-17,4.4,35,2);inkF(g,'#7d5238',2.4);
  g.beginPath();g.moveTo(2,-16);g.quadraticCurveTo(19,-19,18,-2);g.quadraticCurveTo(10,-7,2,-4);g.closePath();inkF(g,'#aab4c8',2.6);
  g.beginPath();g.moveTo(-2,-16);g.quadraticCurveTo(-15,-17,-14,-5);g.quadraticCurveTo(-8,-8,-2,-6);g.closePath();inkF(g,'#8a94ac',2.6);});
const sprMeteor=makeSprite(64,64,32,32,g=>{blob(g,[[-17,-6],[-8,-19],[8,-18],[19,-4],[15,13],[-2,19],[-16,10]]);inkF(g,'#6e7392',3.2);g.fillStyle='#ff8a2e';ell(g,-3,-2,5,4);g.fill();ell(g,7,7,3.5,3);g.fill();});
const sprSaw=makeSprite(76,76,38,38,g=>{starPath(g,0,0,12,32,24,0);inkF(g,'#c9d1e0',3);ell(g,0,0,18,18);inkF(g,'#8a94ac',2.6);ell(g,0,0,6,6);g.fillStyle=INK;g.fill();g.lineWidth=2;g.strokeStyle='#e9f0ff';g.beginPath();g.arc(0,0,13,-2.2,-.9);g.stroke();});
function blitR(sp,x,y,rot,sc){ctx.save();ctx.translate(x,y);ctx.rotate(rot);if(sc)ctx.scale(sc,sc);ctx.drawImage(sp.c,-sp.ox,-sp.oy,sp.w,sp.h);ctx.restore();}
/* 빛 번짐: 색마다 한 번 그려 두고 겹쳐 찍는다 */
const glowCache={};
function glow(x,y,r,col,a){let c=glowCache[col];if(!c){c=glowCache[col]=document.createElement('canvas');c.width=c.height=96;const g=c.getContext('2d'),gr=g.createRadialGradient(48,48,0,48,48,48);gr.addColorStop(0,col);gr.addColorStop(.4,col);gr.addColorStop(1,'rgba(0,0,0,0)');g.globalAlpha=.9;g.fillStyle=gr;g.fillRect(0,0,96,96);}
  ctx.globalAlpha=a;ctx.drawImage(c,x-r,y-r,r*2,r*2);}

const motes=[];for(let i=0;i<30;i++)motes.push({x:Math.random(),y:Math.random(),s:rand(.6,1.8),v:rand(.004,.014),p:Math.random()*TAU});
const lights=[];

function drawEnemy(e){
  const T=e.T,f=(e.phase*NF|0)%NF,fuse=e.ai==='bomber'&&e.st===1,wind=(e.ai==='charge'||e.ai==='ogre')&&e.st===1;
  const white=e.flash>0||(fuse&&(clock*16|0)%2===0),sp=(white?T.white:T.frames)[f],h=e.hitT>0?e.hitT/.14:0;
  let born=(e.age<.25?.35+.65*e.age/.25:1)*e.sc;if(fuse)born*=1+.3*(1-e.at/.8);
  const fy=T.float?-10+Math.sin(clock*3+e.seed)*4:0,jx=wind?Math.sin(clock*70)*2.2:0;
  if(e.champ){ctx.fillStyle='rgba(226,80,76,.3)';ell(ctx,e.x,e.y+2,e.r*1.5,e.r*.6);ctx.fill();ctx.lineWidth=2.2;ctx.strokeStyle=`rgba(255,110,90,${.55+.3*Math.sin(clock*6+e.seed)})`;ctx.stroke();}
  ctx.fillStyle=e.slow>0||e.ice>0?'rgba(120,200,255,.42)':'rgba(8,8,20,.4)';ell(ctx,e.x,e.y+2,e.r*(T.float?.7:1),e.r*.36);ctx.fill();
  /* 그림으로 된 적은 걸음에 맞춰 살짝 늘었다 줄며 통통 뛴다 */
  const wob=T.img?Math.sin(e.phase*TAU):0,hop=T.img&&!T.float?-Math.abs(wob)*2.4:0;if(e.fade>0)ctx.globalAlpha=.3;
  blit(sp,e.x+jx,e.y+fy+hop,(1+.26*h)*e.dir*born*(1-.04*wob),(1-.2*h)*born*(1+.05*wob));ctx.globalAlpha=1;
  if(e.ice>0){ctx.globalAlpha=.5;blit(T.white[f],e.x,e.y+fy,e.dir*born,born);ctx.globalAlpha=1;}
  if(wind){ctx.font='24px "Jua","Malgun Gothic",sans-serif';ctx.textAlign='center';ctx.lineWidth=5;ctx.strokeStyle=INK;ctx.strokeText('!',e.x,e.y-e.r*2.6);ctx.fillStyle='#ffe066';ctx.fillText('!',e.x,e.y-e.r*2.6);}
  if(e.stun>0&&e.ice<=0)for(let i=0;i<3;i++){const a=clock*6+i*TAU/3;starPath(ctx,e.x+Math.cos(a)*e.r*.8,e.y-e.r*2.3*e.sc+Math.sin(a)*4,4,4.5,1.8,a);inkF(ctx,'#ffe066',1.8);}
}
function drawDrop(d){if(d.wait>0)return;const big=d.it.gi>=3,bobv=d.landed?Math.sin(d.t*3+d.seed)*(big?2.5:1):0;
  ctx.fillStyle='rgba(8,8,20,.38)';ell(ctx,d.x,d.y+3,big?12:8,big?4.2:2.8);ctx.fill();
  ctx.save();ctx.translate(d.x,d.y-(big?15:10)-d.z-bobv);if(!d.landed)ctx.rotate(d.t*14);if(!big)ctx.globalAlpha=.9;drawGearAt(ctx,d.it,big?36:24);ctx.restore();}
function drawHeroWorld(){if(P.dead)return;const blink=P.inv>0&&(clock*22|0)%2===0;ctx.fillStyle='rgba(8,8,20,.42)';ell(ctx,P.x,P.y+2,15,5.5);ctx.fill();if(blink)return;
  ctx.save();ctx.translate(P.x,P.y);ctx.scale(P.dir,1);drawHero(ctx,{t:clock,move:P.move,swing:P.swing});ctx.restore();}
function strokeSegs(segs){ctx.beginPath();segs.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();}
function strokeZap(z){strokeSegs(z.segs);for(const b of z.br)strokeSegs(b);}
function warnCircle(x,y,R,q){ctx.fillStyle='rgba(226,80,76,.13)';ell(ctx,x,y,R,R*.66);ctx.fill();ctx.lineWidth=6;ctx.strokeStyle='rgba(20,6,12,.55)';ctx.stroke();/* 붉은 땅(잿불 황야)에서도 보이게 검은 테 */ctx.lineWidth=3;ctx.strokeStyle=`rgba(255,110,90,${.55+.4*Math.sin(clock*22)})`;ctx.stroke();ctx.fillStyle='rgba(226,80,76,.24)';ell(ctx,x,y,R*q,R*.66*q);ctx.fill();}

function render(dt){
  const vw=W/S,vh=H/S,sh=trauma*trauma*(reduce?4:14)*SHK[CFG.shake];
  const cx=cam.x+(Math.random()*2-1)*sh+kick.x,cy=cam.y+(Math.random()*2-1)*sh+kick.y;
  const tx=w=>(w-cx)*S+W/2,ty=w=>(w-cy)*S+H/2;
  const world=()=>ctx.setTransform(DPR*S,0,0,DPR*S,(W/2-cx*S)*DPR,(H/2-cy*S)*DPR);
  world();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.lineJoin='round';ctx.lineCap='round';
  const L=cx-vw/2,T=cy-vh/2,R=cx+vw/2,B=cy+vh/2,dl=[],burn=state==='play'&&burnT>0;
  if(burn&&dt>0&&Math.random()<dt*45)ember(rand(L,R),rand(T,B)+40,1,4,70);
  // 땅
  if(state==='lobby')drawCaveFloor(L,T,R,B); // 거점 = 동굴 안
  else for(let j=Math.floor(T/CH);j<=Math.floor(B/CH);j++)for(let i=Math.floor(L/CH);i<=Math.floor(R/CH);i++)ctx.drawImage(getChunk(i,j),i*CH,j*CH,CH+.6,CH+.6);
  for(let j=Math.floor((T-160)/CH);j<=Math.floor((B+160)/CH);j++)for(let i=Math.floor((L-80)/CH);i<=Math.floor((R+80)/CH);i++)for(const p of getProps(i,j))if(state!=='lobby')dl.push(p);
  // 얼룩
  for(const s of splats){const r=rng(s.sd);ctx.fillStyle=`rgba(12,10,22,${Math.min(.5,s.life*.25)})`;for(let i=0;i<5;i++){ell(ctx,s.x+(r()-.5)*s.r*1.6,s.y+(r()-.5)*s.r*.7,s.r*(.25+r()*.5),s.r*(.12+r()*.2),r()*3);ctx.fill();}}
  lights.length=0;
  // 바닥 장판: 가시 덩굴·불바다
  for(const z of zones){const a=Math.min(1,z.life*1.5),R2=z.R*Math.min(1,(z.max-z.life)/.25+.2),r=rng(z.sd);
    if(z.k==='vine'){ctx.globalAlpha=a*.55;ctx.fillStyle='#1d3a2a';ell(ctx,z.x,z.y,R2,R2*.66);ctx.fill();ctx.globalAlpha=a;
      ctx.lineWidth=2.6;ctx.strokeStyle=z.poison?'#8fd14f':'#3d6b45';ctx.beginPath();ctx.ellipse(z.x,z.y,R2,R2*.66,0,0,TAU);ctx.stroke();
      for(let i=0;i<12;i++){const an=r()*TAU,d=Math.sqrt(r())*R2*.9,x=z.x+Math.cos(an)*d,y=z.y+Math.sin(an)*d*.66,h=10+r()*11,w=Math.sin(clock*4+i)*1.6;poly(ctx,[[x-4,y],[x+w,y-h],[x+4,y]]);inkF(ctx,z.poison?'#9cd16a':'#6fa05c',2.2);}}
    else if(z.k==='frost'){ctx.globalAlpha=a*.34;ctx.fillStyle='#bfe9ff';ell(ctx,z.x,z.y,R2,R2*.66);ctx.fill();ctx.globalAlpha=a;
      ctx.lineWidth=3;ctx.strokeStyle='#f4fcff';ctx.beginPath();ctx.ellipse(z.x,z.y,R2,R2*.66,0,0,TAU);ctx.stroke();
      for(let i=0;i<22;i++){const an=r()*TAU,d=Math.sqrt(r())*R2*.92,x=z.x+Math.cos(an)*d,y=z.y+Math.sin(an)*d*.66,h=(14+r()*20)*Math.min(1,(z.max-z.life)/.3+.1),lean=(r()-.5)*8;poly(ctx,[[x-5,y],[x+lean,y-h],[x+5,y]]);inkF(ctx,i%3?'#d8f6ff':'#9fd8ff',2.2);}
      lights.push([z.x,z.y-10,R2*1.35,.55*a]);}
    else{ctx.globalAlpha=a*.3;ctx.fillStyle='#ff7a2f';ell(ctx,z.x,z.y,R2,R2*.66);ctx.fill();ctx.globalAlpha=a;
      for(let i=0;i<7;i++){const an=r()*TAU,d=Math.sqrt(r())*R2*.8;drawFlame(ctx,z.x+Math.cos(an)*d,z.y+Math.sin(an)*d*.66,clock+i*.7,.42);}
      lights.push([z.x,z.y-10,R2*1.7,.75*a]);}}
  ctx.globalAlpha=1;render2ground();
  // 위험 자리: 운석, 내려찍기, 폭탄 버섯
  for(const mt of meteors){const q=1-mt.t/mt.max;ctx.fillStyle='rgba(255,120,40,.13)';ell(ctx,mt.x,mt.y,mt.R,mt.R*.62);ctx.fill();
    ctx.lineWidth=3;ctx.strokeStyle=`rgba(255,150,60,${.5+.4*Math.sin(clock*20)})`;ctx.stroke();ctx.fillStyle='rgba(255,150,60,.22)';ell(ctx,mt.x,mt.y,mt.R*q,mt.R*.62*q);ctx.fill();}
  renderMobGround();for(const w of warns)warnCircle(w.x,w.y,w.R,1-w.t/w.max);
  for(const e of enemies)if(e.ai==='bomber'&&e.st===1)warnCircle(e.x,e.y,96,1-e.at/.8);
  // 경험치 보석
  for(const g of gems){const b=Math.sin(g.t*5+g.x)*2;ctx.save();ctx.translate(g.x,g.y-5-b);poly(ctx,[[0,-6.5],[5,0],[0,6.5],[-5,0]]);inkF(ctx,g.v>3?'#b6fff2':'#6fd6c8',2.4);ctx.restore();}
  // 회전 칼날 자취
  if(blades.length){const R0=blades[0].rad;ctx.lineWidth=6;ctx.strokeStyle='rgba(243,230,200,.3)';
    for(const b of blades){const rev=b.rad<R0-1;ctx.beginPath();ctx.ellipse(P.x,P.y-20,b.rad,b.rad*.8,0,rev?b.a:b.a-.75,rev?b.a+.75:b.a);ctx.stroke();}}
  // 세로 순서대로
  for(const e of enemies){if(e.x<L-110||e.x>R+110||e.y<T-60||e.y>B+220)continue;dl.push(e);if(e.T.light&&lights.length<16)lights.push([e.x,e.y-34,e.T.light,.62]);if(e.elite)lights.push([e.x,e.y-70*e.sc,95*e.sc,.5]);}
  for(const d of drops)dl.push(d);for(const a of allies)dl.push(a);for(const c of chests)if(c.x>L-60&&c.x<R+60&&c.y>T-60&&c.y<B+80)dl.push(c);for(const g of gims)if(g.x>L-420&&g.x<R+420&&g.y>T-300&&g.y<B+300)dl.push(g);
  dl.push({kind:'hero',y:P.y},{kind:'fire',y:0});if(state==='lobby')hubDrawList(dl);
  dl.sort((a,b)=>a.y-b.y);
  for(const o of dl){switch(o.kind){
    case'enemy':drawEnemy(o);break;
    case'prop':ctx.fillStyle='rgba(8,8,20,.36)';ell(ctx,o.x,o.y+2,o.sp.w*.3,o.sp.w*.1);ctx.fill();blit(o.sp,o.x,o.y,o.flip,1);if(o.pk==='crystal')lights.push([o.x,o.y-26,125+Math.sin(clock*2+o.x)*8,.7]);break;
    case'drop':drawDrop(o);break;
    case'ally':drawAlly(o);break;
    case'chest':drawChest(o);break;
    case'gim':drawGim(o);break;
    case'hub':drawHub(o);break;
    case'rock':drawCaveRock(o);break;
    case'hero':drawHeroWorld();break;
    case'fire':blit(fireBase,0,0,1,1);drawFlame(ctx,0,-6,clock,1);break;}}
  // 조각·연기
  for(const p of parts){if(p.k==='deb'){ctx.save();ctx.translate(p.x,p.y-p.z);ctx.rotate(p.rot);ctx.globalAlpha=Math.min(1,p.life*3);rr(ctx,-p.size,-p.size*.8,p.size*2,p.size*1.6,p.size*.4);inkF(ctx,p.col,2.2);ctx.restore();}
    else if(p.k==='puff'){ctx.globalAlpha=p.life/p.max*.45;ell(ctx,p.x,p.y,p.r,p.r*.8);ctx.fillStyle=p.col;ctx.fill();}}
  ctx.globalAlpha=1;
  // 회전 칼날·도끼·창·검기
  for(const b of blades)blitR(sprBlade,b.x,b.y,b.a+Math.PI,1);
  // 조합 스킬: 칼날 폭풍, 톱날 고리, 플라즈마 구슬
  for(const s of storms){const q=s.t/s.life;ctx.globalAlpha=Math.min(1,(1-q)*3);ctx.lineWidth=5;ctx.strokeStyle='rgba(159,232,255,.5)';
    for(const[x,y,a]of s.pts){const rad=Math.hypot(x-P.x,(y-P.y+20)/.8);ctx.beginPath();ctx.ellipse(P.x,P.y-20,rad,rad*.8,0,a-.5,a);ctx.stroke();blitR(sprBlade,x,y,a+Math.PI,1.2);}ctx.globalAlpha=1;}
  if(saws.length){const R0=Math.hypot(saws[0].x-P.x,(saws[0].y-P.y+20)/.8);ctx.lineWidth=9;ctx.strokeStyle='rgba(200,215,255,.22)';ctx.beginPath();ctx.ellipse(P.x,P.y-20,R0,R0*.8,0,0,TAU);ctx.stroke();
    for(const s of saws)blitR(sprSaw,s.x,s.y,clock*16,1);}
  for(const o of orbs){const w=Math.sin(clock*30)*2;ell(ctx,o.x,o.y,17+w,17+w);inkF(ctx,'#7a6cff',3);ell(ctx,o.x,o.y,11,11);ctx.fillStyle='#bfe9ff';ctx.fill();ell(ctx,o.x-2,o.y-2,5,5);ctx.fillStyle='#f4fcff';ctx.fill();
    ctx.lineWidth=2.4;ctx.strokeStyle='#f4fcff';ctx.beginPath();for(let i=0;i<3;i++){const an=Math.random()*TAU;ctx.moveTo(o.x+Math.cos(an)*14,o.y+Math.sin(an)*14);ctx.lineTo(o.x+Math.cos(an+.4)*27,o.y+Math.sin(an+.4)*27);}ctx.stroke();lights.push([o.x,o.y,150,.85]);}
  for(const a of axes){ctx.lineWidth=4;ctx.strokeStyle='rgba(243,230,200,.45)';ctx.beginPath();ctx.arc(a.x,a.y,18*a.size,a.t*19,a.t*19+2.4);ctx.stroke();blitR(sprAxe,a.x,a.y,a.t*19,1.05*a.size);}
  for(const s of shots){ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.a);
    if(s.k==='spear'){ctx.lineWidth=5;ctx.strokeStyle='rgba(191,233,255,.35)';ctx.beginPath();ctx.moveTo(-58,0);ctx.lineTo(-22,0);ctx.stroke();
      poly(ctx,[[24,0],[5,-6],[-20,-3.2],[-27,0],[-20,3.2],[5,6]]);inkF(ctx,'#bfe9ff',2.8);poly(ctx,[[17,0],[5,-2.6],[-12,0],[5,2.6]]);ctx.fillStyle='#f4fcff';ctx.fill();}
    else{const rr0=s.r;ctx.globalAlpha=Math.min(1,s.life*4);ctx.beginPath();ctx.arc(-rr0*.6,0,rr0,-1.1,1.1);ctx.arc(-rr0*.95,0,rr0*1.05,.85,-.85,true);ctx.closePath();inkF(ctx,'#fff6dc',3);ctx.globalAlpha=1;}
    ctx.restore();lights.push([s.x,s.y,70,.6]);}
  // 베기 자국
  for(const s of slashes){const q=1-s.life/s.max,R0=s.R*.88*(.8+.3*q),sw=1.2;ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.a);ctx.globalAlpha=1-q*q;
    ctx.beginPath();ctx.arc(0,0,R0,-sw,sw);ctx.arc(-R0*.36,0,R0*1.03,sw*.78,-sw*.78,true);ctx.closePath();inkF(ctx,'#fff6dc',3.5);
    ctx.lineWidth=4.5;ctx.strokeStyle='#9fe8ff';ctx.beginPath();ctx.arc(0,0,R0*.965,-sw*.82,sw*.82);ctx.stroke();
    ctx.lineWidth=2.4;ctx.strokeStyle=INK;ctx.beginPath();ctx.arc(0,0,R0+9,-sw*.55,sw*.2);ctx.stroke();ctx.restore();}
  ctx.globalAlpha=1;
  // 불씨탄
  for(const b of bolts){const a=Math.atan2(b.vy,b.vx),k=b.mini?.62:1;ctx.save();ctx.translate(b.x,b.y);ctx.rotate(a);ctx.scale(k,k);
    ctx.fillStyle='rgba(255,138,46,.45)';ell(ctx,-30,0,6,4.5);ctx.fill();ell(ctx,-42,0,4,3);ctx.fill();
    blob(ctx,[[11,0],[2,-7],[-10,-4.5],[-24,0],[-10,4.5],[2,7]]);inkF(ctx,'#ff8a2e',2.8);blob(ctx,[[8,0],[2,-3.6],[-8,0],[2,3.6]]);ctx.fillStyle='#fff1c2';ctx.fill();ctx.restore();lights.push([b.x,b.y,95*k,.75]);}
  // 적의 마법 구슬
  for(const s of eshots)drawEshot(s);
  // 떨어지는 운석
  for(const mt of meteors){if(mt.t>.75)continue;const hgt=mt.t/.75*560,x=mt.x+hgt*.25,y=mt.y-hgt,ux=.243,uy=-.97;
    poly(ctx,[[x-14,y+3],[x+ux*96,y+uy*96],[x+14,y-6]]);inkF(ctx,'#ff7a2f',3);poly(ctx,[[x-7,y+1],[x+ux*60,y+uy*60],[x+7,y-4]]);ctx.fillStyle='#ffe08a';ctx.fill();
    blitR(sprMeteor,x,y,clock*6,1.1);lights.push([x,y,130,.85]);if(dt>0&&Math.random()<.6)ember(x,y-6,1,8,30);}
  render2fx();renderWorldFx();renderRelic();metaFx();
  // 번개 먹선·파동 먹선
  for(const z of zaps){ctx.lineWidth=z.big?13:9;ctx.strokeStyle=INK;strokeZap(z);}
  for(const w of waves){const a=1-w.r/w.R;ctx.globalAlpha=Math.min(1,a*2.5);
    for(const[k,lw]of[[1,11],[.78,7]]){ctx.lineWidth=lw;ctx.strokeStyle=INK;ctx.beginPath();ctx.ellipse(w.x,w.y,w.r*k,w.r*k*.66,0,0,TAU);ctx.stroke();ctx.lineWidth=lw*.5;ctx.strokeStyle=w.zap?(k===1?'#f4fcff':'#9fd8ff'):(k===1?'#fff1c2':'#ffd27a');ctx.stroke();}
    ctx.lineWidth=3;ctx.strokeStyle=w.zap?'#bfe9ff':'#fff1c2';ctx.beginPath();for(let i=0;i<14;i++){const an=i*TAU/14+w.r*.004,c=Math.cos(an),s2=Math.sin(an)*.66;ctx.moveTo(w.x+c*(w.r+6),w.y+s2*(w.r+6));ctx.lineTo(w.x+c*(w.r+22),w.y+s2*(w.r+22));}ctx.stroke();
    lights.push([w.x,w.y,w.r*1.25,.55*a+.2]);}
  ctx.globalAlpha=1;

  // 어둠과 빛 (계단식 밝기 = 만화풍 조명). 보스가 있으면 붉게 가라앉는다
  const fl=Math.sin(clock*11)*6+Math.sin(clock*23.7)*4,bm=bossMood;
  if(state==='lobby')hubLights();const D=state==='lobby'?CAVE_DARK:MAP.dark;lights.push([0,-18,330+fl,1]);if(!P.dead)lights.push([P.x,P.y-22,MAP.light*GIM.light,.86]);
  for(const f of flashes)lights.push([f.x,f.y,f.r*(.6+.4*f.life/f.max),f.life/f.max]);
  lg.setTransform(1,0,0,1,0,0);lg.globalCompositeOperation='source-over';lg.clearRect(0,0,lightC.width,lightC.height);
  lg.fillStyle=`rgba(${D[0]+30*bm|0},${Math.max(0,D[1]-5*bm)|0},${Math.max(0,D[2]-10*bm)|0},${Math.min(.8,D[3]+.06*bm)})`;lg.fillRect(0,0,lightC.width,lightC.height);lg.globalCompositeOperation='destination-out';
  for(const[lx,ly,lr,li]of lights){const sx=tx(lx)/2,sy=ty(ly)/2,r=lr*S/2;if(r<1||sx<-r||sy<-r||sx>lightC.width+r||sy>lightC.height+r)continue;
    const gr=lg.createRadialGradient(sx,sy,0,sx,sy,r);gr.addColorStop(0,`rgba(0,0,0,${li})`);gr.addColorStop(.5,`rgba(0,0,0,${li*.94})`);gr.addColorStop(.56,`rgba(0,0,0,${li*.6})`);gr.addColorStop(.78,`rgba(0,0,0,${li*.52})`);gr.addColorStop(.84,`rgba(0,0,0,${li*.2})`);gr.addColorStop(1,'rgba(0,0,0,0)');
    lg.fillStyle=gr;lg.fillRect(sx-r,sy-r,r*2,r*2);}
  ctx.setTransform(DPR,0,0,DPR,0,0);ctx.drawImage(lightC,0,0,W,H);
  // 빛 번짐
  ctx.globalCompositeOperation='lighter';
  {const sx=tx(0),sy=ty(-18),r=(330+fl)*S,gr=ctx.createRadialGradient(sx,sy,0,sx,sy,r);gr.addColorStop(0,'rgba(255,150,60,.26)');gr.addColorStop(.55,'rgba(255,120,40,.1)');gr.addColorStop(1,'rgba(255,100,30,0)');ctx.fillStyle=gr;ctx.fillRect(sx-r,sy-r,r*2,r*2);}
  if(burn){ctx.fillStyle='rgba(255,110,30,.075)';ctx.fillRect(0,0,W,H);}
  world();
  for(const b of bolts)glow(b.x,b.y,b.mini?26:42,'rgb(255,150,60)',.55);
  for(const s of shots)glow(s.x,s.y,s.k==='spear'?36:44,s.k==='spear'?'rgb(120,200,255)':'rgb(255,240,200)',.45);
  for(const s of eshots)glow(s.x,s.y,s.k==='arrow'?18:30,'rgb(255,45,85)',.55);
  for(const b of blades)glow(b.x,b.y,24,'rgb(255,240,200)',.28);
  for(const s of storms)for(const[x,y]of s.pts)glow(x,y,30,'rgb(150,225,255)',.4*(1-s.t/s.life));
  for(const s of saws)glow(s.x,s.y,44,'rgb(200,215,255)',.32);
  for(const o of orbs)glow(o.x,o.y,60,'rgb(120,130,255)',.7);
  render2glow();renderWorldGlow();gimGlow();metaGlow();hubGlow();
  for(const a of axes)glow(a.x,a.y,30*a.size,'rgb(200,215,255)',.3);
  for(const mt of meteors){if(mt.t>.75)continue;const hgt=mt.t/.75*560;glow(mt.x+hgt*.25,mt.y-hgt,70,'rgb(255,140,50)',.7);}
  for(const z of zones)if(z.k==='fire')glow(z.x,z.y-8,z.R*1.2,'rgb(255,120,40)',.3*Math.min(1,z.life*1.5));
  for(const s of slashes){const q=1-s.life/s.max;ctx.globalAlpha=(1-q)*.5;ctx.lineWidth=24;ctx.strokeStyle='rgba(150,225,255,.6)';ctx.beginPath();ctx.arc(s.x,s.y,s.R*.84*(.8+.3*q),s.a-1.1,s.a+1.1);ctx.stroke();}
  for(const p of parts){if(p.k==='ember'){ctx.globalAlpha=Math.min(1,p.life*2);ctx.fillStyle=p.col;ell(ctx,p.x,p.y,p.size,p.size);ctx.fill();}
    else if(p.k==='pillar'){const a=p.life/p.max,gr=ctx.createLinearGradient(0,p.y,0,p.y-p.h);gr.addColorStop(0,p.col);gr.addColorStop(1,'rgba(0,0,0,0)');ctx.globalAlpha=a;ctx.fillStyle=gr;ctx.fillRect(p.x-p.w*(.6+.4*a),p.y-p.h,p.w*2*(.6+.4*a),p.h);}}
  ctx.globalAlpha=1;
  // 전설·신화 장비 빛기둥 (그 아래 등급은 눈에 띄지 않게 둔다)
  for(const d of drops){if(!d.landed)continue;const gi=d.it.gi,G=GRADES[gi];if(!G.beam)continue;const w=7+gi*3.5,h=G.beam*(.9+.1*Math.sin(d.t*4)),gr=ctx.createLinearGradient(0,d.y,0,d.y-h);gr.addColorStop(0,G.c+'cc');gr.addColorStop(1,G.c+'00');
    ctx.fillStyle=gr;ctx.fillRect(d.x-w,d.y-h,w*2,h);ctx.fillStyle='rgba(255,255,255,.5)';ctx.fillRect(d.x-1.5,d.y-h*.8,3,h*.8);
    ctx.fillStyle=G.c+'55';ell(ctx,d.x,d.y+2,20+gi*5,7+gi*1.6);ctx.fill();
    if(dt>0&&Math.random()<.25)addP({k:'ember',x:d.x+rand(-10,10),y:d.y-rand(0,h*.7),vx:0,vy:-30,size:rand(1.2,2.4),life:.6,max:.6,col:G.c});}
  // 번개·파동 빛
  for(const z of zaps){ctx.globalAlpha=z.life/z.max;ctx.lineWidth=z.big?22:13;ctx.strokeStyle='rgba(90,190,255,.5)';strokeZap(z);}
  for(const w of waves){ctx.globalAlpha=(1-w.r/w.R)*.6;ctx.lineWidth=16;ctx.strokeStyle=w.zap?'rgba(90,190,255,.55)':'rgba(255,210,120,.5)';ctx.beginPath();ctx.ellipse(w.x,w.y,w.r,w.r*.66,0,0,TAU);ctx.stroke();}
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  for(const z of zaps){ctx.lineWidth=z.big?6:4;ctx.strokeStyle='#f4fcff';strokeZap(z);}
  // 타격 별·고리·숫자 (어둠 위에 또렷하게)
  for(const p of parts){if(p.k==='star'){const q=1-p.life/p.max;starPath(ctx,p.x,p.y,p.n,p.size*(.8+.5*q),p.size*.36,p.rot);if(p.size>18)inkF(ctx,p.col,p.size>40?3:2.2);else{ctx.globalAlpha=.85;ctx.fillStyle=p.col;ctx.fill();ctx.globalAlpha=1;}}
    else if(p.k==='ring'){const a=p.life/p.max;ctx.globalAlpha=a;ctx.beginPath();ctx.ellipse(p.x,p.y,p.r,p.r*.62,0,0,TAU);ctx.lineWidth=5*a+1.5;ctx.strokeStyle=INK;ctx.stroke();ctx.lineWidth=3*a+.5;ctx.strokeStyle=p.col;ctx.stroke();ctx.globalAlpha=1;}}
  for(const e of enemies){if(!e.elite||e.boss)continue;const w=92,x=e.x-w/2,y=e.y-150;rr(ctx,x,y,w,11,4);inkF(ctx,'#0d0f1e',3);rr(ctx,x+2,y+2,Math.max(2,(w-4)*clamp(e.hp/e.maxhp,0,1)),7,3);ctx.fillStyle='#e2504c';ctx.fill();}
  ctx.textAlign='center';ctx.textBaseline='middle';
  for(const d of drops){if(!d.landed||d.it.gi<3)continue;const G=GRADES[d.it.gi];ctx.font='700 13px "Noto Sans KR","Malgun Gothic",sans-serif';ctx.lineWidth=4;ctx.strokeStyle=INK;ctx.strokeText(d.it.name,d.x,d.y-40);ctx.fillStyle=gradeColor(d.it);ctx.fillText(d.it.name,d.x,d.y-40);}
  for(const p of parts)if(p.k==='num'){const age=p.max-p.life,sc=1+.6*Math.max(0,1-age/.1);ctx.globalAlpha=Math.min(1,p.life*4);ctx.font=`${p.size*sc}px "Jua","Malgun Gothic",sans-serif`;ctx.lineWidth=p.size*.3;ctx.strokeStyle=INK;ctx.strokeText(p.txt,p.x,p.y);ctx.fillStyle=p.col;ctx.fillText(p.txt,p.x,p.y);}
  ctx.globalAlpha=1;metaTop();

  // 화면 고정 효과
  ctx.setTransform(DPR,0,0,DPR,0,0);
  for(const m of motes){m.y-=m.v*dt*6;m.p+=dt;if(m.y<-.02){m.y=1.02;m.x=Math.random();}ctx.fillStyle=burn?`rgba(255,190,110,${.3+.2*Math.sin(m.p*1.7)})`:`rgba(220,230,255,${.16+.12*Math.sin(m.p*1.7)})`;ell(ctx,(m.x+Math.sin(m.p*.6)*.01)*W,m.y*H,m.s,m.s);ctx.fill();}
  const vg=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.35,W/2,H/2,Math.hypot(W,H)*.62);vg.addColorStop(0,'rgba(6,7,20,0)');vg.addColorStop(1,`rgba(${6+52*bm|0},${7-3*bm|0},${20-6*bm|0},${.62+.12*bm})`);ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
  if(P.inv>.25&&state==='play'){ctx.fillStyle=`rgba(226,80,76,${(P.inv-.25)*.7})`;ctx.fillRect(0,0,W,H);}
  if(joy){ctx.lineWidth=3;ctx.strokeStyle='rgba(243,230,200,.5)';ell(ctx,joy.x0,joy.y0,46,46);ctx.stroke();const dx=joy.x-joy.x0,dy=joy.y-joy.y0,d=Math.hypot(dx,dy)||1,m=Math.min(46,d);ell(ctx,joy.x0+dx/d*m,joy.y0+dy/d*m,19,19);ctx.fillStyle='rgba(243,230,200,.75)';ctx.fill();ctx.strokeStyle=INK;ctx.stroke();}
  gimScreen();drawMinimap();
  if(CFG.fps){ctx.font='700 12px "Noto Sans KR",sans-serif';ctx.textAlign='left';ctx.textBaseline='bottom';ctx.fillStyle='rgba(243,230,200,.8)';ctx.fillText(`${fpsNow} fps · 적 ${enemies.length}`,10,H-8);}
}
