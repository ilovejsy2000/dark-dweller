'use strict';
/* 다크 드웰러 — 동굴 거점 다시 그리기(11-16 대표님 "로비가 허접한 느낌, 밖에서 들어오는 빛줄기도 어색해, 동굴 안쪽 느낌과 요소들이 배경에 녹아들게").
   hub.js 의 그림 함수(makeCaveBase · makeCaveRocks · drawCaveFloor · hubDrawList · drawCaveRock · hubGlow · hubLights · drawHub)를 이 파일이 바꿔 낀다(뒤에 읽힌 함수가 이긴다).
   - 벽: 둥근 바위 고리 대신 겹겹이 쌓인 바위벽 + 위에서 내려온 종유석 + 벽에 박힌 수정. 모닥불 쪽 면은 따뜻하게, 먼 곳은 깊게 어둡게.
   - 바닥: 매끈한 타원 대신 울퉁불퉁한 가장자리, 가장자리는 그늘로 스며들게(굵은 먹선 없음), 모닥불 둘레 돌판, 이끼·자갈·물웅덩이.
   - 출구: 파란 빛 기둥 대신 바위 기둥 두 개 사이로 달빛 든 풀밭이 보이고, 바닥엔 은은한 달빛 웅덩이만.
   - 네 자리: 바닥에 받침·그림자·소품이 붙어 배경에 앉아 있게(제단 = 룬 원판, 비석 = 돌판·촛불·이끼, 대장간 = 벽돌 화덕·그을음, 창고 = 나무 깔판·궤짝·등불). */

const CV2={box:{x:-600,y:-680,w:1200,h:1600},k:1.25,crystals:[],seed:23};
/* 바닥 가장자리: 각도마다 조금씩 들쭉날쭉(걷는 곳은 hub.js 의 타원 그대로) */
const cv2Ph=(()=>{const r=rng(5);return[0,1,2,3,4,5,6].map(()=>r()*TAU);})();
function cv2Edge(a){let n=0;for(let k=2;k<=6;k++)n+=Math.sin(k*a+cv2Ph[k])/k;return n;}
function cv2FloorPt(a,grow){const n=cv2Edge(a),g=grow||0;return[Math.cos(a)*(CAVE.rx+14+n*26+g),CAVE.cy+Math.sin(a)*(CAVE.ry+8+n*18+g*.85)];}
function cv2FloorPath(g,grow){g.beginPath();for(let i=0;i<=120;i++){const[x,y]=cv2FloorPt(i/120*TAU,grow);i?g.lineTo(x,y):g.moveTo(x,y);}g.closePath();}
const cv2Exit=(g,w0,w1,y0,y1,cont)=>{if(!cont)g.beginPath();g.moveTo(-w0,y0);g.bezierCurveTo(-w0-10,y0+80,-w1+10,y1-120,-w1,y1);g.lineTo(w1,y1);g.bezierCurveTo(w1-10,y1-120,w0+10,y0+80,w0,y0);g.closePath();};
const cv2Lerp=(a,b,t)=>a+(b-a)*t;
function cv2Hex(c){return[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];}
function cv2Mix(c1,c2,t){const a=cv2Hex(c1),b=cv2Hex(c2);return`rgb(${a.map((v,i)=>Math.round(cv2Lerp(v,b[i],t))).join(',')})`;}

/* 바위 하나 그리기: 바탕 · 윗면(밝게) · 모닥불 쪽 따뜻한 테 · 먹선. (0,0)이 바닥 가운데 */
function cv2Rock(g,w,h,r,o){o=o||{};const n=9,pts=[];
  for(let i=0;i<n;i++){const a=Math.PI+i/(n-1)*Math.PI,j=.82+r()*.3;pts.push([Math.cos(a)*w*j,Math.min(0,Math.sin(a)*h*j)]);}
  pts[0][1]=0;pts[n-1][1]=0;
  const base=o.base||'#3a3456',top=o.top||'#575078',warm=o.warm||0,ink=o.ink===undefined?3:o.ink;
  poly(g,pts);g.fillStyle=base;g.fill();
  g.save();poly(g,pts);g.clip();
  /* 윗면: 위쪽 점들을 조금 내려 안쪽 면을 만든다 */
  g.beginPath();g.moveTo(pts[1][0]*.92,pts[1][1]*.9);for(let i=2;i<n-1;i++)g.lineTo(pts[i][0]*.86,pts[i][1]*.96+h*.06);for(let i=n-2;i>=1;i--)g.lineTo(pts[i][0]*.7,pts[i][1]*.55);g.closePath();g.fillStyle=top;g.fill();
  /* 결: 짧은 금 두세 개 */
  g.lineWidth=1.6;g.strokeStyle='rgba(10,8,22,.45)';for(let i=0;i<2+(r()*2|0);i++){const x=(r()-.5)*w*1.1,y=-r()*h*.8;g.beginPath();g.moveTo(x,y);g.lineTo(x+(r()-.5)*w*.4,y+h*.18*(.5+r()));g.stroke();}
  /* 모닥불 쪽 따뜻한 테(warm: -1 왼쪽, 1 오른쪽, 0 위쪽 정면) */
  if(warm){const gx=warm*w*.9,gr=g.createRadialGradient(gx,-h*.3,0,gx,-h*.3,w*1.2);gr.addColorStop(0,'rgba(255,150,80,.32)');gr.addColorStop(1,'rgba(255,150,80,0)');g.fillStyle=gr;g.fillRect(-w*1.2,-h*1.3,w*2.4,h*1.4);}
  /* 아래쪽 그늘 */
  const sg=g.createLinearGradient(0,-h*.35,0,0);sg.addColorStop(0,'rgba(8,6,18,0)');sg.addColorStop(1,'rgba(8,6,18,.45)');g.fillStyle=sg;g.fillRect(-w*1.2,-h*.4,w*2.4,h*.42);
  g.restore();
  if(ink){poly(g,pts);g.lineWidth=ink;g.strokeStyle=INK;g.stroke();}
}
/* 수정 무더기(벽에 박힌 것·바닥 것 같이 씀) */
function cv2Crystal(g,col,sc,r){for(const[dx,h,lean]of[[-13,30,-.4],[0,48,0],[12,28,.38],[-5,20,-.15]]){g.save();g.translate(dx*sc,0);g.rotate(lean+(r()-.5)*.1);const H=h*sc,W=6.5*sc;
  poly(g,[[-W,0],[-W,-H*.74],[0,-H],[W,-H*.74],[W,0]]);g.fillStyle=col;g.fill();g.lineWidth=2.6;g.strokeStyle=INK;g.stroke();
  poly(g,[[-W*.3,-3],[-W*.3,-H*.7],[W*.15,-H*.86]]);g.fillStyle='rgba(255,255,255,.5)';g.fill();g.restore();}}

/* ───── 밑그림(한 번만) ───── */
function makeCaveBase(){
  const B=CV2.box,k=CV2.k,c=document.createElement('canvas');c.width=B.w*k;c.height=B.h*k;const g=c.getContext('2d');g.scale(k,k);g.translate(-B.x,-B.y);g.lineJoin='round';g.lineCap='round';
  const r=rng(CV2.seed);CV2.crystals=[];
  /* 1. 바위 덩어리 바탕 */
  g.fillStyle='#120f22';g.fillRect(B.x,B.y,B.w,B.h);
  for(let i=0;i<260;i++){const x=B.x+r()*B.w,y=B.y+r()*B.h;ell(g,x,y,18+r()*60,12+r()*34,r()*3);g.fillStyle=pick(['#171329','#1b1730','#151226','#1e1a35']);g.fill();}
  /* 2. 벽 바위: 바닥 밖 자리에 크고 작은 바위를 먼 것부터(바닥에 가까운 바위가 위에 오게) */
  const wall=[];
  for(let i=0;i<420;i++){const x=B.x+r()*B.w,y=B.y+r()*(B.h*.62);const a=Math.atan2((y-CAVE.cy)/(CAVE.ry+8),x/(CAVE.rx+14)),[fx,fy]=cv2FloorPt(a),df=Math.hypot(x,y-CAVE.cy)-Math.hypot(fx,fy-CAVE.cy);
    if(df<6)continue;if(y>CAVE.cy+CAVE.ry*.55&&Math.abs(x)<CAVE.exitW+150)continue; /* 출구 자리는 비움 */
    wall.push({x,y,df,a});}
  wall.sort((p,q)=>q.df-p.df||p.y-q.y);
  for(const w of wall){const far=clamp(w.df/320,0,1),s=clamp(70-w.df*.08,30,72)*(.7+r()*.6);
    const base=cv2Mix('#463f66','#1a1630',far),top=cv2Mix('#625a88','#231e3c',far),warm=far<.45?(Math.abs(w.x)<60?0:-Math.sign(w.x)):0;
    g.save();g.translate(w.x,w.y);cv2Rock(g,s,s*(w.y<CAVE.cy?1.25:.9),r,{base,top,warm:warm*(1-far*2),ink:far>.7?0:2.6*(1-far*.5)});g.restore();}
  /* 3. 종유석(위 벽에서 내려옴) */
  for(let i=0;i<26;i++){const x=-520+i*42+(r()-.5)*24,y0=-690+r()*40,len=60+r()*120,w=10+r()*12,far=clamp((-y0-560)/200,0,1);
    poly(g,[[x-w,y0],[x-w*.4,y0+len*.6],[x+(r()-.5)*4,y0+len],[x+w*.45,y0+len*.55],[x+w,y0]]);g.fillStyle=cv2Mix('#3c3658','#221d3a',far);g.fill();g.lineWidth=2.4;g.strokeStyle=INK;g.stroke();
    poly(g,[[x-w*.55,y0],[x-w*.25,y0+len*.55],[x-w*.05,y0+len*.82]]);g.fillStyle='rgba(150,140,200,.18)';g.fill();}
  /* 4. 벽에 박힌 수정(빛은 hubGlow 에서) */
  for(const[x,y,col,sc]of[[-250,-330,'#7fe3ff',1],[-150,-420,'#b678ff',.8],[205,-345,'#b678ff',1.05],[90,-430,'#7fe3ff',.7],[-330,-120,'#ffd56a',.85],[330,-90,'#7fe3ff',.9],[-20,-470,'#b678ff',.65]]){
    g.save();g.translate(x,y);cv2Crystal(g,col,sc,r);g.restore();CV2.crystals.push({x,y,col,sc});}
  /* 5. 바닥 */
  cv2FloorPath(g,0);g.fillStyle='#3b3454';g.fill();
  {const pg=g.createLinearGradient(0,290,0,430);pg.addColorStop(0,'#3b3454');pg.addColorStop(1,'rgba(59,52,84,0)');cv2Exit(g,CAVE.exitW+40,CAVE.exitW+120,CAVE.cy+CAVE.ry*.55,430);g.fillStyle=pg;g.fill();} /* 11-16: 출구 길은 짧게, 그 아래는 부드럽게 사라지는 바깥 풍경이 덮는다 */
  g.save();cv2FloorPath(g,0);cv2Exit(g,CAVE.exitW+40,CAVE.exitW+120,CAVE.cy+CAVE.ry*.55,430,true);g.clip('nonzero');
  /* 바닥 얼룩: 흙과 돌가루 */
  for(let i=0;i<150;i++){const x=(r()-.5)*720,y=CAVE.cy+(r()-.5)*560+r()*200;ell(g,x,y,16+r()*44,8+r()*20,r()*3);g.fillStyle=r()<.5?'rgba(255,240,220,.035)':'rgba(10,8,22,.10)';g.fill();}
  /* 모닥불 둘레 돌판 */
  for(let ring=0;ring<2;ring++){const R0=84+ring*58,n=9+ring*5;for(let i=0;i<n;i++){const a=i/n*TAU+ring*.3+r()*.15,cx=Math.cos(a)*R0,cy=4+Math.sin(a)*R0*.62;if(HUB.some(h=>h.k!=='exit'&&Math.hypot(cx-h.x,cy-h.y)<62))continue;
    const pts=[];const s=17+r()*7;for(let j=0;j<6;j++){const b=j/6*TAU+r()*.4;pts.push([cx+Math.cos(b)*s*(.8+r()*.3),cy+Math.sin(b)*s*.6*(.8+r()*.3)]);}
    blob(g,pts);g.fillStyle=r()<.5?'#4d4569':'#463f62';g.fill();g.lineWidth=2;g.strokeStyle='rgba(14,11,28,.7)';g.stroke();
    blob(g,pts.map(([x,y])=>[cx+(x-cx)*.7,cy+(y-cy)*.6-2]));g.fillStyle='rgba(255,240,230,.05)';g.fill();}}
  /* 금·자갈 */
  g.lineWidth=1.8;g.strokeStyle='rgba(10,8,20,.5)';for(let i=0;i<18;i++){const a=r()*TAU,d=.35+r()*.55;let x=Math.cos(a)*CAVE.rx*d,y=CAVE.cy+Math.sin(a)*CAVE.ry*d;g.beginPath();g.moveTo(x,y);for(let j=0;j<4;j++){x+=(r()-.5)*36;y+=(r()-.5)*22;g.lineTo(x,y);}g.stroke();}
  for(let i=0;i<90;i++){const a=r()*TAU,d=.25+Math.sqrt(r())*.75,x=Math.cos(a)*CAVE.rx*d,y=CAVE.cy+Math.sin(a)*CAVE.ry*d,s=2+r()*4;ell(g,x,y,s,s*.7);g.fillStyle='#2a2440';g.fill();ell(g,x-s*.25,y-s*.25,s*.5,s*.3);g.fillStyle='rgba(255,255,255,.08)';g.fill();}
  /* 이끼: 벽 아래와 출구 쪽(습한 곳) */
  for(let i=0;i<70;i++){const a=r()*TAU,near=Math.sin(a)>.3,[fx,fy]=cv2FloorPt(a,-(near?20:6)-r()*30);const s=6+r()*12;
    for(let j=0;j<4;j++){ell(g,fx+(r()-.5)*s*1.6,fy+(r()-.5)*s*.6,s*(.4+r()*.4),s*(.25+r()*.2));g.fillStyle=pick(['#2f5a52','#36685c','#284b47']);g.fill();}}
  /* 물웅덩이(달빛이 비친다) */
  ell(g,-64,196,34,11);g.fillStyle='#22304e';g.fill();ell(g,-60,194,22,6);g.fillStyle='rgba(170,205,255,.35)';g.fill();ell(g,-64,196,34,11);g.lineWidth=2;g.strokeStyle='rgba(10,8,22,.6)';g.stroke();
  /* 모닥불의 따뜻한 바닥빛 */
  const fg=g.createRadialGradient(0,4,10,0,4,300);fg.addColorStop(0,'rgba(255,170,100,.28)');fg.addColorStop(.5,'rgba(255,140,80,.10)');fg.addColorStop(1,'rgba(255,140,80,0)');g.fillStyle=fg;g.fillRect(-320,-300,640,620);
  /* 가장자리 그늘: 벽 밑으로 스며들게 */
  for(const[lw,al]of[[90,.10],[64,.12],[40,.14],[20,.18],[8,.22]]){cv2FloorPath(g,6);g.lineWidth=lw;g.strokeStyle=`rgba(8,6,18,${al})`;g.stroke();}
  g.restore();
  cv2Outside(g,r);
  /* 6. 바닥 위 소품: 통나무 의자 · 깔개 */
  g.save();g.translate(-48,108);g.rotate(-.2);rr(g,-30,-9,60,17,8);inkF(g,'#7a4f30',2.6);ell(g,27,-0.5,6,8);inkF(g,'#b07a4a',2);ell(g,27,-0.5,3,4);g.strokeStyle='#7a4f30';g.lineWidth=1.4;g.stroke();g.fillStyle='rgba(255,220,180,.12)';rr(g,-26,-8,50,4,2);g.fill();g.restore();
  g.save();g.translate(72,-62);g.rotate(.22);rr(g,-26,-8,52,15,7);inkF(g,'#6b4630',2.6);ell(g,-23,-0.5,5.5,7);inkF(g,'#a8744a',2);g.fillStyle='rgba(255,220,180,.12)';rr(g,-20,-7,42,3.5,2);g.fill();g.restore();
  /* 장작 더미 */
  for(const[dx,dy,rot]of[[-8,0,.1],[6,1,-.08],[-1,-7,.02]]){g.save();g.translate(96+dx,128+dy);g.rotate(rot);rr(g,-16,-4.5,32,9,4.5);inkF(g,'#7a4f30',2);ell(g,15,0,3.5,4.5);inkF(g,'#b07a4a',1.6);g.restore();}
  caveBase=c;
}
/* 출구 너머(11-16 대표님 "빛이 깨져서 박스처럼 나와, 제대로 녹아들게"):
   바깥 풍경을 따로 그린 뒤 둥글고 부드러운 가림막으로 가장자리를 지워 동굴 어둠에 스며들게 하고,
   그 위에 출구에서 안으로 비스듬히 들어오는 달빛 줄기(양 끝·옆이 모두 흐려지는 길쭉한 빛)를 겹친다. 직선 모서리가 하나도 없다 */
function cv2Outside(g,r){
  const X0=-460,Y0=250,OW=920,OH=720,o=document.createElement('canvas');o.width=OW;o.height=OH;const c=o.getContext('2d');c.translate(-X0,-Y0);c.lineJoin='round';
  const gg=c.createLinearGradient(0,Y0,0,Y0+OH);gg.addColorStop(0,'#1a2740');gg.addColorStop(.35,'#26394f');gg.addColorStop(.7,'#33506a');gg.addColorStop(1,'#3e5f78');c.fillStyle=gg;c.fillRect(X0,Y0,OW,OH);
  const mo=c.createRadialGradient(0,760,0,0,760,420);mo.addColorStop(0,'rgba(175,210,255,.42)');mo.addColorStop(.5,'rgba(140,180,240,.14)');mo.addColorStop(1,'rgba(140,180,240,0)');c.fillStyle=mo;c.fillRect(X0,Y0,OW,OH);
  /* 흙길: 동굴 돌바닥이 흐려지며 이어진다 */
  for(let i=0;i<14;i++){const y=330+i*30,x=Math.sin(i*.7)*12+(r()-.5)*18,s=16+i*1.6;ell(c,x,y,s,s*.42,(r()-.5)*.4);c.fillStyle=`rgba(70,68,100,${.75-i*.045})`;c.fill();}
  /* 먼 덤불 그림자 */
  for(let i=0;i<16;i++){const x=X0+30+r()*(OW-60),y=820+r()*120;if(Math.abs(x)<70)continue;for(let j=0;j<3;j++){ell(c,x+(j-1)*16,y-r()*10,22+r()*14,16+r()*10);c.fillStyle='#16233a';c.fill();}}
  /* 풀잎과 들꽃 */
  for(let i=0;i<190;i++){const x=X0+20+r()*(OW-40),y=330+r()*560;if(Math.abs(x)<34+(y-330)*.06&&r()<.8)continue;const h=6+r()*12,q=clamp((y-330)/400,0,1);
    c.beginPath();c.moveTo(x-3,y);c.lineTo(x-1,y-h);c.lineTo(x+1,y-h*.7);c.lineTo(x+3,y-h*.9);c.lineTo(x+4,y);c.closePath();c.fillStyle=cv2Mix('#2c4258','#5d8a93',q*(.6+r()*.4));c.fill();}
  for(let i=0;i<22;i++){const x=X0+60+r()*(OW-120),y=420+r()*400;ell(c,x,y,2.2,2.2);c.fillStyle=pick(['#e4eeff','#ffe6a8','#cdb9ff','#9ff0e2']);c.fill();}
  /* 엷은 안개 띠 */
  for(let i=0;i<5;i++){const y=380+i*70;c.save();c.translate(0,y);c.scale(1,.18);const m=c.createRadialGradient(0,0,0,0,0,360);m.addColorStop(0,'rgba(210,228,255,.10)');m.addColorStop(1,'rgba(210,228,255,0)');c.fillStyle=m;c.fillRect(-460,-360,920,720);c.restore();}
  /* 가림막: 둥글게 + 위쪽(동굴 쪽)으로 부드럽게 사라지게 */
  c.globalCompositeOperation='destination-in';
  c.save();c.translate(0,640);c.scale(1.25,1);const mk=c.createRadialGradient(0,0,0,0,0,360);mk.addColorStop(0,'rgba(0,0,0,1)');mk.addColorStop(.55,'rgba(0,0,0,.95)');mk.addColorStop(.82,'rgba(0,0,0,.45)');mk.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=mk;c.fillRect(-400,-400,800,800);c.restore();
  const tf=c.createLinearGradient(0,Y0,0,Y0+150);tf.addColorStop(0,'rgba(0,0,0,0)');tf.addColorStop(1,'rgba(0,0,0,1)');c.fillStyle=tf;c.fillRect(X0,Y0,OW,OH);
  c.globalCompositeOperation='source-over';
  g.drawImage(o,X0,Y0,OW,OH);
  /* 달빛 줄기: 출구 밖 높은 곳에서 동굴 안쪽 바닥으로. 길쭉한 타원 빛을 기울여 겹친다(가장자리가 모두 흐림) */
  g.save();g.globalCompositeOperation='lighter';
  for(const[tx,len,wid,al]of[[-95,330,34,.07],[-40,360,46,.09],[18,350,40,.085],[70,320,30,.07],[0,250,90,.05]]){
    const sx=tx*.35,sy=470,ex=tx,ey=sy-len,mx=(sx+ex)/2,my=(sy+ey)/2,ang=Math.atan2(ey-sy,ex-sx);
    g.save();g.translate(mx,my);g.rotate(ang);g.scale(len/2/wid,1);const rg=g.createRadialGradient(0,0,0,0,0,wid);rg.addColorStop(0,`rgba(170,205,255,${al})`);rg.addColorStop(.6,`rgba(150,190,255,${al*.45})`);rg.addColorStop(1,'rgba(150,190,255,0)');g.fillStyle=rg;g.fillRect(-wid,-wid,wid*2,wid*2);g.restore();}
  /* 바닥에 떨어진 달빛 웅덩이 */
  g.save();g.translate(0,262);g.scale(1,.42);const pl=g.createRadialGradient(0,0,0,0,0,170);pl.addColorStop(0,'rgba(160,195,250,.20)');pl.addColorStop(.6,'rgba(140,180,245,.07)');pl.addColorStop(1,'rgba(140,180,245,0)');g.fillStyle=pl;g.fillRect(-170,-170,340,340);g.restore();
  g.restore();
}
function drawCaveFloor(L,T,R,B){
  if(!caveBase)makeCaveBase();const X=CV2.box;ctx.fillStyle='#120f22';ctx.fillRect(L-4,T-4,R-L+8,B-T+8);ctx.drawImage(caveBase,X.x,X.y,X.w,X.h);
  /* 출구 쪽 떠다니는 먼지(달빛) */
  for(let i=0;i<12;i++){const q=(clock*.05+i/12)%1,x=Math.sin(i*7.3+clock*.3)*CAVE.exitW*1.3,y=440-q*190;ctx.globalAlpha=Math.sin(q*Math.PI)*.45;ctx.fillStyle='#d8e8ff';ell(ctx,x,y,1.5,1.5);ctx.fill();}ctx.globalAlpha=1;
  /* 제단 바닥 룬 원: 바닥에 그려야 주인공·제단보다 아래 */
  cv2Rune(HUB[0].x,HUB[0].y);
  /* 대장간 그을음 · 창고 깔판 그늘 */
  cv2Soft(HUB[2].x-20,HUB[2].y+4,70,24,'rgba(10,6,4,.45)');cv2Soft(HUB[3].x,HUB[3].y+4,62,20,'rgba(8,6,18,.4)');
}
function cv2Soft(x,y,rx,ry,col){ctx.save();ctx.translate(x,y);ctx.scale(1,ry/rx);const gr=ctx.createRadialGradient(0,0,0,0,0,rx);gr.addColorStop(0,col);gr.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gr;ell(ctx,0,0,rx,rx);ctx.fill();ctx.restore();}
function cv2Rune(x,y){const t=clock,a=.45+.2*Math.sin(t*2);ctx.save();ctx.lineWidth=2.4;ctx.strokeStyle=`rgba(182,120,255,${a})`;ctx.setLineDash([10,7]);ctx.lineDashOffset=-t*14;ell(ctx,x,y+2,58,20);ctx.stroke();ctx.setLineDash([3,9]);ctx.lineDashOffset=t*10;ell(ctx,x,y+2,46,15);ctx.stroke();ctx.setLineDash([]);
  for(let i=0;i<6;i++){const b=i/6*TAU+t*.25,px=x+Math.cos(b)*52,py=y+2+Math.sin(b)*18;ctx.fillStyle=`rgba(214,180,255,${a+.15})`;poly(ctx,[[px,py-3],[px+2.4,py],[px,py+3],[px-2.4,py]]);ctx.fill();}ctx.restore();}

/* ───── 앞쪽 바위(주인공을 가리는 것): 바닥 아래쪽 가장자리 + 출구 기둥 ───── */
function makeCaveRocks(){
  caveRocks=[];const r=rng(31);
  for(let a=.12;a<Math.PI-.1;a+=.2+r()*.08){if(Math.abs(a-Math.PI/2)<.5)continue;const[fx,fy]=cv2FloorPt(a,10),s=34+r()*26,w=s*(1.05+r()*.35),h=s*.95;
    const warm=-Math.sign(fx)*.8,sp=makeSprite(w*2+16,h+16,w+8,h+8,g=>cv2Rock(g,w,h,r,{warm}));caveRocks.push({kind:'rock',x:fx,y:fy+6,sp});}
  /* 출구 기둥: 사이로 걸어 나간다 */
  for(const sx of[-1,1]){const w=62,h=150,sp=makeSprite(w*2+16,h+16,w+8,h+8,g=>{cv2Rock(g,w,h,r,{base:'#36304f',top:'#4f4870',warm:-sx*.5});
      g.fillStyle='rgba(140,180,255,.16)';poly(g,[[-sx*w*.9,-4],[-sx*w*.75,-h*.7],[-sx*w*.45,-h*.75],[-sx*w*.55,-4]]);g.fill();}); /* 달빛 받는 안쪽 면 */
    caveRocks.push({kind:'rock',x:sx*(CAVE.exitW+70),y:CAVE.cy+CAVE.ry+40,sp});}
  /* 바닥 위 작은 돌기둥(석순) 몇 개: 깊이감 */
  for(const[x,y,s]of[[-232,-96,1],[248,-60,.85],[-210,150,.8],[232,165,.9]]){const w=16*s,h=58*s,sp=makeSprite(w*2+16,h+16,w+8,h+8,g=>{poly(g,[[-w,0],[-w*.55,-h*.55],[-w*.1,-h],[w*.3,-h*.6],[w,0]]);g.fillStyle='#463f66';g.fill();g.lineWidth=2.6;g.strokeStyle=INK;g.stroke();poly(g,[[-w*.7,-2],[-w*.4,-h*.55],[-w*.12,-h*.9],[-w*.2,-2]]);g.fillStyle='rgba(255,170,110,.18)';g.fill();});
    caveRocks.push({kind:'rock',x,y,sp});}
}
function hubDrawList(dl){if(!caveRocks)makeCaveRocks();for(const r of caveRocks)dl.push(r);for(const h of HUB)if(h.k!=='exit')dl.push(h);}
function drawCaveRock(o){cv2Soft(o.x,o.y+2,o.sp.w*.36,o.sp.w*.1,'rgba(6,4,14,.5)');blit(o.sp,o.x,o.y,1,1);}
function hubGlow(){if(state!=='lobby')return;
  for(const c of CV2.crystals)glow(c.x,c.y-24*c.sc,60*c.sc,c.col==='#ffd56a'?'rgb(255,214,106)':c.col==='#7fe3ff'?'rgb(127,227,255)':'rgb(182,120,255)',.32+.1*Math.sin(clock*1.6+c.x));
  glow(0,430,150,'rgb(140,180,255)',.16);/* 출구 너머 달빛: 은은하게 */
  const f=HUB[2];glow(f.x-43,f.y-28,46,'rgb(255,140,60)',.5+.1*Math.sin(clock*9));
  const s=HUB[3];glow(s.x+40,s.y-62,30,'rgb(255,200,120)',.55);
  const t=HUB[0];glow(t.x,t.y-62,40,'rgb(182,120,255)',.45+.15*Math.sin(clock*2));
  const c=HUB[1];for(const dx of[-24,24])glow(c.x+dx,c.y-22,16,'rgb(255,200,120)',.45);}
function hubLights(){lights.push([0,440,230,.85]);lights.push([0,300,140,.4]);
  for(const c of CV2.crystals)lights.push([c.x,c.y-20,110*c.sc,.55]);
  const o=HUB[4],near=hubNear===o;ctx.font=`800 ${near?17:14}px "Pretendard Variable",Pretendard,"Noto Sans KR","Malgun Gothic",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=4;ctx.strokeStyle=INK;ctx.strokeText(o.n,o.x,o.y-18);ctx.fillStyle=near?'#5ff3e0':'#e6e9ff';ctx.fillText(o.n,o.x,o.y-18);}

/* ───── 네 자리 ───── */
function cv2Drum(x,y,rx,ry,h,side,top){ /* 납작한 원기둥(받침) */
  ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI);ctx.lineTo(x-rx,y-h);ctx.ellipse(x,y-h,rx,ry,0,Math.PI,0,true);ctx.closePath();inkF(ctx,side,2.8);
  ell(ctx,x,y-h,rx,ry);inkF(ctx,top,2.8);}
function drawHub(o){
  const x=o.x,y=o.y,near=hubNear===o,t=clock;
  switch(o.k){
  case'tal':{ /* 어둠의 제단: 두 단 받침 + 새김 돌 + 떠 있는 수정 */
    cv2Soft(x,y+3,46,15,'rgba(6,4,14,.55)');cv2Drum(x,y,40,14,8,'#3c365a','#4e4772');cv2Drum(x,y-8,30,10,6,'#463f66','#5a5382');
    poly(ctx,[[x-19,y-14],[x-16,y-42],[x+16,y-42],[x+19,y-14]]);inkF(ctx,'#5f6690',2.8);poly(ctx,[[x-19,y-14],[x-16,y-42],[x-9,y-42],[x-11,y-14]]);ctx.fillStyle='rgba(255,255,255,.08)';ctx.fill();
    ctx.lineWidth=2;ctx.strokeStyle=`rgba(214,170,255,${.55+.3*Math.sin(t*2)})`;ctx.beginPath();ctx.moveTo(x,y-36);ctx.lineTo(x,y-20);ctx.moveTo(x-6,y-30);ctx.lineTo(x+6,y-26);ctx.moveTo(x-6,y-24);ctx.lineTo(x+6,y-30);ctx.stroke();
    rr(ctx,x-24,y-48,48,8,3);inkF(ctx,'#7a80a8',2.8);
    const f=Math.sin(t*2)*3;poly(ctx,[[x,y-90-f],[x+12,y-68-f],[x,y-54-f],[x-12,y-68-f]]);inkF(ctx,'#b678ff',3);poly(ctx,[[x,y-86-f],[x+5,y-70-f],[x,y-60-f]]);ctx.fillStyle='#e9d8ff';ctx.fill();
    for(let i=0;i<3;i++){const b=t*1.6+i*TAU/3,px=x+Math.cos(b)*22,py=y-70-f+Math.sin(b)*7;ell(ctx,px,py,2.2,2.2);ctx.fillStyle='#e9d8ff';ctx.fill();}
    lights.push([x,y-64,150,.75]);drawTalBadge(x,y);break;}
  case'cx':{ /* 도감 비석: 돌판 위, 촛불 둘, 이끼 */
    cv2Soft(x,y+3,44,14,'rgba(6,4,14,.55)');rr(ctx,x-34,y-12,68,14,5);inkF(ctx,'#433d62',2.8);rr(ctx,x-34,y-12,68,5,3);ctx.fillStyle='rgba(255,255,255,.07)';ctx.fill();
    ctx.beginPath();ctx.moveTo(x-20,y-10);ctx.lineTo(x-20,y-64);ctx.quadraticCurveTo(x,y-82,x+20,y-64);ctx.lineTo(x+20,y-10);ctx.closePath();inkF(ctx,'#6f7699',3);
    ctx.save();ctx.clip();ctx.fillStyle='rgba(255,255,255,.1)';ctx.fillRect(x-20,y-90,9,90);ctx.fillStyle='rgba(8,6,18,.25)';ctx.fillRect(x+11,y-90,9,90);ctx.restore();
    ctx.lineWidth=2;ctx.strokeStyle=`rgba(255,213,106,${.35+.2*Math.sin(t*1.5)})`;for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(x-11,y-56+i*10);ctx.lineTo(x+(i%2?6:11),y-56+i*10);ctx.stroke();}
    ctx.fillStyle='#ffd56a';ell(ctx,x,y-68,3,3);ctx.fill();
    for(const dx of[-14,-6,8])for(let j=0;j<3;j++){ell(ctx,x+dx+j*3,y-11-j,4,2.6);ctx.fillStyle=j%2?'#36685c':'#2f5a52';ctx.fill();}
    for(const dx of[-27,27]){rr(ctx,x+dx-3,y-24,6,12,2);inkF(ctx,'#efe3c8',1.8);drawFlame(ctx,x+dx,y-24,t+dx,.13);lights.push([x+dx,y-28,70,.5]);}
    lights.push([x,y-44,90,.45]);break;}
  case'forge':{ /* 대장간: 벽돌 화덕(굴뚝) · 그루터기 모루 · 물통 */
    const fx=x-43;rr(ctx,fx-22,y-62,44,62,9);inkF(ctx,'#4e4870',3);
    ctx.lineWidth=1.6;ctx.strokeStyle='rgba(14,11,28,.55)';for(let j=0;j<5;j++){const yy=y-52+j*11;ctx.beginPath();ctx.moveTo(fx-20,yy);ctx.lineTo(fx+20,yy);ctx.stroke();for(let i=0;i<3;i++){const xx=fx-14+i*14+(j%2?7:0);ctx.beginPath();ctx.moveTo(xx,yy);ctx.lineTo(xx,yy+11);ctx.stroke();}}
    rr(ctx,fx-9,y-104,18,44,4);inkF(ctx,'#3f3a5c',2.6);rr(ctx,fx-12,y-108,24,8,3);inkF(ctx,'#5d587e',2.4);
    if(Math.random()<.12)addP({k:'puff',x:fx+rand(-3,3),y:y-112,r:rand(5,9),col:'#4a4560',life:1.6,max:1.6,vx:rand(-6,6),vy:-30});
    ctx.beginPath();ctx.moveTo(fx-12,y-6);ctx.lineTo(fx-12,y-24);ctx.quadraticCurveTo(fx,y-36,fx+12,y-24);ctx.lineTo(fx+12,y-6);ctx.closePath();ctx.fillStyle='#2a1208';ctx.fill();ctx.lineWidth=2.6;ctx.strokeStyle=INK;ctx.stroke();
    ctx.save();ctx.clip();const gl=ctx.createRadialGradient(fx,y-10,2,fx,y-14,22);gl.addColorStop(0,'#ffe08a');gl.addColorStop(.5,'#ff8a2e');gl.addColorStop(1,'#7a2a10');ctx.fillStyle=gl;ctx.fillRect(fx-14,y-38,28,34);drawFlame(ctx,fx,y-8,t,.26);ctx.restore();
    lights.push([fx,y-24,140,.8]);if(Math.random()<.3)ember(fx,y-22,1,6,70);
    rr(ctx,x-18,y-24,36,24,6);inkF(ctx,'#8a5a2c',2.8);ell(ctx,x,y-24,18,5);inkF(ctx,'#b07a4a',2.2);ctx.lineWidth=1.2;ctx.strokeStyle='#7a4f30';ell(ctx,x,y-24,10,2.6);ctx.stroke();
    blob(ctx,[[x-26,y-44],[x+26,y-44],[x+34,y-52],[x+10,y-52],[x+8,y-36],[x-8,y-36],[x-10,y-52],[x-26,y-52]]);inkF(ctx,'#7a80a8',2.8);rr(ctx,x-12,y-39,24,14,3);inkF(ctx,'#5d587e',2.6);
    ctx.fillStyle='rgba(255,255,255,.18)';rr(ctx,x-24,y-52,30,3,1.5);ctx.fill();
    ctx.save();ctx.translate(x+26,y-58);ctx.rotate(-.6+Math.sin(t*3)*.08);rr(ctx,-2,-2,4,24,2);inkF(ctx,'#8a5a2c',2);rr(ctx,-9,-8,18,9,2);inkF(ctx,'#9aa3bf',2);ctx.restore();
    cv2Drum(x+38,y+2,10,4,16,'#6b4630','#8a5a3a');ell(ctx,x+38,y-14,7,2.6);ctx.fillStyle='#4a78a8';ctx.fill();break;}
  case'stash':{ /* 창고: 나무 깔판 · 궤짝 · 자루 · 등불 */
    rr(ctx,x-40,y-8,80,13,4);inkF(ctx,'#6b4630',2.6);ctx.lineWidth=1.4;ctx.strokeStyle='rgba(20,10,4,.6)';for(const dx of[-20,0,20]){ctx.beginPath();ctx.moveTo(x+dx,y-7);ctx.lineTo(x+dx,y+4);ctx.stroke();}
    blob(ctx,[[x-46,y-4],[x-50,y-22],[x-42,y-34],[x-32,y-30],[x-28,y-6]]);inkF(ctx,'#a88b5e',2.6);ctx.lineWidth=2;ctx.strokeStyle='#6b5530';ctx.beginPath();ctx.moveTo(x-46,y-28);ctx.lineTo(x-34,y-32);ctx.stroke();
    blit(sprChest,x,y-4,1.25,1.25);
    rr(ctx,x+30,y-26,22,22,3);inkF(ctx,'#7a5232',2.4);ctx.lineWidth=1.4;ctx.strokeStyle='rgba(20,10,4,.6)';ctx.beginPath();ctx.moveTo(x+30,y-26);ctx.lineTo(x+52,y-4);ctx.moveTo(x+52,y-26);ctx.lineTo(x+30,y-4);ctx.stroke();
    rr(ctx,x+52,y-74,4,70,2);inkF(ctx,'#6b4630',2.2);rr(ctx,x+40,y-76,16,4,2);inkF(ctx,'#6b4630',2);
    const sw=Math.sin(t*1.8)*.08;ctx.save();ctx.translate(x+42,y-72);ctx.rotate(sw);ctx.lineWidth=1.6;ctx.strokeStyle=INK;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,6);ctx.stroke();rr(ctx,-6,6,12,14,3);inkF(ctx,'#ffd27a',2.2);ctx.fillStyle='#fff3c8';ell(ctx,0,13,2.6,3.6);ctx.fill();rr(ctx,-7,4,14,3,1.5);inkF(ctx,'#4a4560',1.6);ctx.restore();
    lights.push([x+42,y-58,130,.7]);lights.push([x,y-20,90,.4]);drawStashBadge(x,y);break;}
  }
  const ly=y-(o.k==='tal'?104:o.k==='cx'?92:o.k==='forge'?118:92);
  ctx.font=`800 ${near?17:14}px "Pretendard Variable",Pretendard,"Noto Sans KR","Malgun Gothic",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=4;ctx.strokeStyle=INK;ctx.strokeText(o.n,x,ly);ctx.fillStyle=near?'#5ff3e0':'#e6e9ff';ctx.fillText(o.n,x,ly);
  if(near){ctx.lineWidth=3;ctx.strokeStyle=`rgba(95,243,224,${.6+.3*Math.sin(t*6)})`;ctx.beginPath();ctx.ellipse(x,y+2,46,15,0,0,TAU);ctx.stroke();}
}
