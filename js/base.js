'use strict';
/* 다크 드웰러 — 바탕 그림·소리. 맛보기에서 검증한 코드를 옮겨 온 것. */
const $=id=>document.getElementById(id);
const cv=$('cv'),ctx=cv.getContext('2d');
const INK='#12101c',TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v,rand=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.random()*a.length|0];
const reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ───── 난수·잡음 ───── */
function hash2(x,y,s){let h=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(s|0,2246822519);h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return (h>>>0)/4294967296;}
function rng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
function vnoise(x,y){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
  const a=hash2(xi,yi,7),b=hash2(xi+1,yi,7),c=hash2(xi,yi+1,7),d=hash2(xi+1,yi+1,7);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
/* ───── 그리기 도우미 ───── */
function ell(g,x,y,rx,ry,rot){g.beginPath();g.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),rot||0,0,TAU);}
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
function poly(g,pts){g.beginPath();g.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)g.lineTo(pts[i][0],pts[i][1]);g.closePath();}
function blob(g,pts){const n=pts.length;g.beginPath();const p0=pts[n-1],p1=pts[0];g.moveTo((p0[0]+p1[0])/2,(p0[1]+p1[1])/2);
  for(let i=0;i<n;i++){const a=pts[i],b=pts[(i+1)%n];g.quadraticCurveTo(a[0],a[1],(a[0]+b[0])/2,(a[1]+b[1])/2);}g.closePath();}
function starPath(g,x,y,n,R,r,rot){g.beginPath();for(let i=0;i<n*2;i++){const a=rot+i*Math.PI/n,d=i%2?r:R;const px=x+Math.cos(a)*d,py=y+Math.sin(a)*d;i?g.lineTo(px,py):g.moveTo(px,py);}g.closePath();}
function inkF(g,fill,lw){g.fillStyle=fill;g.fill();if(lw)g.lineWidth=lw;g.strokeStyle=INK;g.stroke();}
/* 면 칠하기 → 안쪽에 그림자 면(셀 음영) → 먹선 */
function cel(g,path,fill,shade,lw){path();g.fillStyle=fill;g.fill();if(shade){g.save();g.clip();shade();g.restore();}path();g.lineWidth=lw||3;g.strokeStyle=INK;g.stroke();}

const SS=2;
function makeSprite(w,h,ox,oy,fn){const c=document.createElement('canvas');c.width=w*SS;c.height=h*SS;const g=c.getContext('2d');g.scale(SS,SS);g.translate(ox,oy);g.lineJoin='round';g.lineCap='round';fn(g);return{c,w,h,ox,oy};}
function whiteOf(sp){const c=document.createElement('canvas');c.width=sp.c.width;c.height=sp.c.height;const g=c.getContext('2d');g.drawImage(sp.c,0,0);g.globalCompositeOperation='source-atop';g.fillStyle='rgba(255,255,255,0.93)';g.fillRect(0,0,c.width,c.height);return{c,w:sp.w,h:sp.h,ox:sp.ox,oy:sp.oy};}
function blit(sp,x,y,sx,sy){ctx.save();ctx.translate(x,y);ctx.scale(sx,sy);ctx.drawImage(sp.c,-sp.ox,-sp.oy,sp.w,sp.h);ctx.restore();}
/* ───── 몬스터 그림 ───── */
const NF=8;
function drawMoss(g,p){ // 이끼덩이: 통통 튀는 풀색 덩어리
  const s=Math.sin(p*TAU),hop=Math.max(0,s)*7,bw=19*(1-0.09*s),bh=15*(1+0.12*s),cy=-bh-hop-1;
  g.fillStyle=INK;ell(g,-8,-1,5.5,3.2);g.fill();ell(g,8,-1,5.5,3.2);g.fill();
  cel(g,()=>blob(g,[[-bw,cy+3],[-bw*.82,cy-bh*.85],[0,cy-bh*1.12],[bw*.82,cy-bh*.85],[bw,cy+3],[bw*.72,cy+bh*.95],[0,cy+bh*1.02],[-bw*.72,cy+bh*.95]]),'#74aa5e',()=>{
    g.fillStyle='#4a7c54';ell(g,-3,cy+bh*.95,bw*1.5,bh*.72);g.fill();
    g.fillStyle='#a6d47f';ell(g,-bw*.42,cy-bh*.5,5,2.8,-.5);g.fill();},3);
  // 새싹
  g.lineWidth=2.5;g.strokeStyle=INK;g.beginPath();g.moveTo(0,cy-bh);g.lineTo(1,cy-bh-7);g.stroke();
  blob(g,[[1,cy-bh-7],[7,cy-bh-14],[13,cy-bh-10],[8,cy-bh-5]]);inkF(g,'#a6d47f',2.5);
  blob(g,[[1,cy-bh-7],[-5,cy-bh-13],[-10,cy-bh-8],[-5,cy-bh-4]]);inkF(g,'#8cc46c',2.5);
  // 눈
  for(const ex of[-6.5,6.5]){ell(g,ex,cy-1,4.2,4.8);inkF(g,'#fff7df',2.2);g.fillStyle=INK;ell(g,ex+1.2,cy-.4,1.9,2.3);g.fill();}
  g.lineWidth=2.6;g.strokeStyle=INK;g.beginPath();g.moveTo(-12,cy-7.5);g.lineTo(-3,cy-4.5);g.moveTo(12,cy-7.5);g.lineTo(3,cy-4.5);g.stroke();
  g.beginPath();g.moveTo(-3,cy+7);g.quadraticCurveTo(0,cy+5,3,cy+7);g.stroke();
}
function drawRat(g,p){ // 가시쥐: 낮게 깔려 빠르게 달려드는 가시투성이
  const s=Math.sin(p*TAU),c=Math.cos(p*TAU),b=Math.abs(s)*2;
  g.lineWidth=3.2;g.strokeStyle=INK;g.beginPath();g.moveTo(-18,-9-b);g.quadraticCurveTo(-27,-12-b,-31,-20+c*4);g.stroke();
  g.lineWidth=4;g.beginPath();g.moveTo(-11,-4);g.lineTo(-11-s*6,1);g.moveTo(-3,-4);g.lineTo(-3+s*6,1);g.moveTo(8,-4);g.lineTo(8-s*6,1);g.moveTo(15,-4);g.lineTo(15+s*6,1);g.stroke();
  g.save();g.translate(0,-b);
  const spk=[[-13,-19,-19,-31],[-6,-23,-9,-37],[2,-24,2,-39],[9,-22,13,-35]];
  for(const[x,y,tx,ty]of spk){poly(g,[[x-4.5,y+2],[tx,ty],[x+4.5,y+2]]);inkF(g,'#efdfb8',2.5);}
  cel(g,()=>blob(g,[[-21,-7],[-17,-21],[-2,-25],[13,-21],[27,-10],[21,-2],[0,-1],[-15,-1]]),'#b8643f',()=>{
    g.fillStyle='#8a4532';ell(g,0,-1,30,8.5);g.fill();g.fillStyle='#d8845a';ell(g,2,-20,9,2.6,.15);g.fill();},3);
  ell(g,7,-22,3.6,3.6);inkF(g,'#b8643f',2.5);
  ell(g,26.5,-9,3,3);inkF(g,'#f2a0a0',2.2);
  ell(g,15,-13.5,3.6,3.6);inkF(g,'#fff7df',2.2);g.fillStyle=INK;ell(g,16.2,-13,1.6,1.8);g.fill();
  g.lineWidth=2.6;g.beginPath();g.moveTo(10,-18.5);g.lineTo(19,-15.5);g.stroke();
  g.restore();
}
function drawWisp(g,p){ // 등불귀: 스스로 빛나는 푸른 불 유령
  const s=Math.sin(p*TAU),c=Math.cos(p*TAU),tip=s*4;
  cel(g,()=>blob(g,[[-13,-27],[-12,-41],[-5+tip*.6,-55],[1+tip,-63],[5+tip*.5,-52],[12,-41],[13,-27],[10,-12+c*3],[4,-19],[0,-9-c*3],[-5,-19],[-10,-12+s*3]]),'#bfe9ff',()=>{
    g.fillStyle='#86c2ec';ell(g,0,-12,20,9);g.fill();g.fillStyle='#f4fcff';ell(g,-1,-37,6.5,10);g.fill();},3);
  g.fillStyle=INK;ell(g,-5,-32,2.7,4.3);g.fill();ell(g,5,-32,2.7,4.3);g.fill();ell(g,0,-23,2.2,2.8);g.fill();
}
function drawBrute(g,p){ // 돌덩이 거인: 느리지만 단단한 우두머리
  const s=Math.sin(p*TAU),bob=Math.abs(s)*4;
  // 다리
  for(const[lx,k]of[[-24,1],[24,-1]]){const ly=-Math.max(0,s*k)*7;blob(g,[[lx-13,ly-2],[lx-11,ly-20],[lx+11,ly-20],[lx+13,ly-2],[lx,ly+3]]);inkF(g,'#4b4f6c',3.5);}
  // 뒤쪽 주먹
  const fy=s*9;
  cel(g,()=>blob(g,[[-74,-44+fy],[-66,-64+fy],[-48,-66+fy],[-40,-48+fy],[-46,-30+fy],[-64,-28+fy]]),'#5a5e7c',()=>{g.fillStyle='#43475f';ell(g,-58,-30+fy,22,10);g.fill();},3.5);
  g.save();g.translate(0,-bob);
  const body=[[-42,-12],[-50,-54],[-36,-94],[-8,-112],[26,-104],[48,-72],[46,-24],[28,-6],[-20,-4]];
  cel(g,()=>poly(g,body),'#6e7392',()=>{
    g.fillStyle='#4c5070';poly(g,[[-60,-120],[-22,-120],[-30,-60],[-12,0],[-60,0]]);g.fill();
    g.fillStyle='#4c5070';poly(g,[[-60,0],[60,0],[60,-22],[-60,-16]]);g.fill();
    g.fillStyle='#8c92b2';poly(g,[[4,-112],[30,-106],[40,-84],[12,-92]]);g.fill();},4);
  g.lineWidth=2.4;g.strokeStyle=INK;g.beginPath();g.moveTo(-28,-86);g.lineTo(-16,-74);g.lineTo(-22,-60);g.moveTo(34,-52);g.lineTo(24,-40);g.lineTo(30,-26);g.moveTo(-6,-30);g.lineTo(4,-20);g.stroke();
  // 이끼
  blob(g,[[-34,-94],[-22,-108],[-4,-114],[12,-110],[4,-100],[-10,-104],[-20,-94]]);inkF(g,'#6fa05c',3);
  blob(g,[[20,-104],[32,-100],[40,-88],[30,-92]]);inkF(g,'#5a8a52',2.6);
  // 눈·입
  poly(g,[[-22,-76],[-6,-70],[-8,-62],[-20,-66]]);inkF(g,'#ffb347',3);
  poly(g,[[22,-78],[8,-71],[10,-63],[22,-67]]);inkF(g,'#ffb347',3);
  g.lineWidth=3.2;g.beginPath();g.moveTo(-16,-44);g.lineTo(-8,-50);g.lineTo(0,-44);g.lineTo(8,-50);g.lineTo(16,-44);g.stroke();
  g.restore();
  // 앞쪽 주먹
  cel(g,()=>blob(g,[[42,-46-fy],[50,-66-fy],[68,-66-fy],[76,-48-fy],[70,-30-fy],[50,-28-fy]]),'#7a80a0',()=>{g.fillStyle='#565a7a';ell(g,60,-30-fy,22,10);g.fill();g.fillStyle='#989ebc';ell(g,56,-58-fy,7,3,-.3);g.fill();},3.5);
}
function frames(w,h,ox,oy,fn){const f=[];for(let i=0;i<NF;i++)f.push(makeSprite(w,h,ox,oy,g=>fn(g,i/NF)));return{frames:f,white:f.map(whiteOf)};}
const ET={
  moss:{...frames(60,62,30,52,drawMoss),r:15,hp:24,spd:44,dmg:7,xp:1,anim:1.7,kb:1,deb:['#74aa5e','#4a7c54','#a6d47f']},
  rat:{...frames(72,52,38,44,drawRat),r:14,hp:15,spd:96,dmg:6,xp:1,anim:3.4,kb:1.15,deb:['#b8643f','#8a4532','#efdfb8']},
  wisp:{...frames(52,76,26,66,drawWisp),r:13,hp:36,spd:60,dmg:9,xp:2,anim:1.3,kb:.9,float:true,light:86,deb:['#bfe9ff','#86c2ec','#f4fcff']},
  brute:{...frames(170,150,85,134,drawBrute),r:44,hp:820,spd:31,dmg:24,xp:30,anim:.8,kb:.12,elite:true,deb:['#6e7392','#4c5070','#6fa05c','#8c92b2']},
};
/* ───── 지형물 ───── */
function sprRock(seed){const r=rng(seed),w=26+r()*18,h=18+r()*12;return makeSprite(72,60,36,52,g=>{
  const pts=[[-w,-2],[-w*.9,-h*.7],[-w*.35,-h*1.25],[w*.3,-h*1.1-r()*5],[w*.95,-h*.55],[w,-1],[w*.3,4],[-w*.4,4]];
  cel(g,()=>poly(g,pts),'#3d4160',()=>{g.fillStyle='#2a2d47';poly(g,[[-60,10],[-60,-60],[-w*.3,-60],[-w*.15,-h*.4],[-w*.3,10]]);g.fill();g.fillStyle='#565b80';poly(g,[[-w*.3,-h*1.25],[w*.3,-h*1.1],[w*.5,-h*.7],[-w*.1,-h*.8]]);g.fill();},3.2);
  g.lineWidth=2;g.strokeStyle=INK;g.beginPath();g.moveTo(w*.2,-h*.5);g.lineTo(w*.45,-h*.2);g.stroke();});}
function sprTree(seed){const r=rng(seed);return makeSprite(120,150,60,140,g=>{
  g.lineWidth=3.2;
  const br=(x,y,a,len,w)=>{const ex=x+Math.cos(a)*len,ey=y+Math.sin(a)*len;poly(g,[[x-w,y],[ex,ey],[x+w,y]]);inkF(g,'#3a2f3e');return[ex,ey];};
  br(-4,-70,-2.4-r()*.3,40,5);br(4,-84,-.7+r()*.3,44,5);br(0,-96,-1.7,34,4.5);br(-14,-86,-2.9,22,3);br(20,-98,-.2,20,3);
  cel(g,()=>poly(g,[[-13,2],[-9,-60],[-6,-104],[5,-104],[9,-58],[14,2],[4,5],[-5,5]]),'#473a48',()=>{g.fillStyle='#2f2634';poly(g,[[-20,10],[-20,-110],[-3,-110],[-1,10]]);g.fill();},3.2);
  g.lineWidth=2;g.beginPath();g.moveTo(3,-40);g.lineTo(6,-28);g.moveTo(-2,-72);g.lineTo(2,-62);g.stroke();
  ell(g,3,-50,3,4.5);g.fillStyle=INK;g.fill();});}
function sprPillar(seed){const r=rng(seed);return makeSprite(80,120,40,110,g=>{
  const lean=(r()-.5)*5;
  cel(g,()=>poly(g,[[-22,2],[-22,-12],[22,-12],[22,2]]),'#7c7a92',()=>{g.fillStyle='#55546c';g.fillRect(-30,-20,14,30);},3.2);
  cel(g,()=>poly(g,[[-16,-12],[-15+lean*.3,-50],[15+lean*.3,-50],[16,-12]]),'#8a88a2',()=>{g.fillStyle='#5f5d78';g.fillRect(-30,-60,19,60);g.fillStyle='#a6a4be';g.fillRect(9,-60,4,50);},3.2);
  cel(g,()=>poly(g,[[-15+lean*.3,-50],[-13+lean,-78],[-3+lean,-90],[4+lean,-80],[13+lean,-86],[15+lean*.3,-50]]),'#8a88a2',()=>{g.fillStyle='#5f5d78';g.fillRect(-30,-100,19+lean,60);},3.2);
  g.lineWidth=2;g.strokeStyle=INK;g.beginPath();g.moveTo(-4,-30);g.lineTo(2,-22);g.moveTo(6+lean,-66);g.lineTo(1+lean,-58);g.stroke();
  blob(g,[[-22,-12],[-12,-18],[-2,-12],[-10,-8]]);inkF(g,'#5a8a52',2.4);});}
function sprCrystal(seed){const r=rng(seed);return makeSprite(70,84,35,76,g=>{
  const sh=(x,w,h,l)=>{cel(g,()=>poly(g,[[x-w,0],[x-w*.8+l,-h*.75],[x+l,-h],[x+w*.8+l,-h*.7],[x+w,0]]),'#55dccc',()=>{g.fillStyle='#2ea39b';poly(g,[[x-w-4,4],[x-w-4,-h-4],[x+l-1,-h-4],[x-1,4]]);g.fill();g.fillStyle='#c4fff5';poly(g,[[x+l+1,-h+5],[x+w*.55+l,-h*.68],[x+w*.45,-h*.3],[x+3,-h*.4]]);g.fill();},3);};
  sh(-13,8,30+r()*8,-4);sh(13,7,24+r()*8,4);sh(0,11,52+r()*10,(r()-.5)*4);
  blob(g,[[-26,0],[-14,-6],[0,-3],[14,-6],[26,0],[10,5],[-10,5]]);inkF(g,'#3d4160',3);});}
function sprBones(){return makeSprite(64,40,32,32,g=>{
  g.lineWidth=5.5;g.strokeStyle=INK;g.beginPath();g.moveTo(4,-4);g.lineTo(24,-10);g.moveTo(6,-12);g.lineTo(22,-2);g.stroke();
  g.lineWidth=2.2;g.strokeStyle='#dcd2ba';g.beginPath();g.moveTo(4,-4);g.lineTo(24,-10);g.moveTo(6,-12);g.lineTo(22,-2);g.stroke();
  cel(g,()=>blob(g,[[-22,-6],[-21,-17],[-12,-22],[-3,-17],[-2,-7],[-7,-2],[-17,-2]]),'#dcd2ba',()=>{g.fillStyle='#aa9f88';ell(g,-18,-4,10,6);g.fill();},2.8);
  g.fillStyle=INK;ell(g,-16,-12,2.4,3);g.fill();ell(g,-8.5,-12,2.4,3);g.fill();g.fillRect(-13.5,-6,1.6,3.4);g.fillRect(-10.5,-6,1.6,3.4);});}
const PROPS={rock:[1,2,3].map(sprRock),tree:[4,5].map(sprTree),pillar:[6,7].map(sprPillar),crystal:[8,9].map(sprCrystal),bones:[sprBones()]};
const fireBase=makeSprite(96,56,48,40,g=>{
  const st=[[-30,-4,9,7],[-20,-13,8,6],[20,-13,8,6],[30,-4,9,7]];
  for(const[x,y,a,b]of st){cel(g,()=>ell(g,x,y,a,b),'#565b80',()=>{g.fillStyle='#3a3e5c';ell(g,x-3,y+4,a,b);g.fill();},2.8);}
  g.save();g.rotate(.32);rr(g,-22,-9,44,9,4);inkF(g,'#6b4630',3);g.restore();
  g.save();g.rotate(-.32);rr(g,-22,-9,44,9,4);inkF(g,'#7d5238',3);g.restore();
  for(const[x,y,a,b]of[[-14,5,9,6],[0,8,10,6],[14,5,9,6]]){cel(g,()=>ell(g,x,y,a,b),'#6e7392',()=>{g.fillStyle='#4c5070';ell(g,x-3,y+4,a,b);g.fill();},2.8);}
});
function drawFlame(g,x,y,t,sc){
  for(const[col,k,line]of[['#ff6a2a',1,1],['#ffa53a',.7,0],['#ffe9a8',.4,0]]){
    const w=17*k*sc,h=(46+Math.sin(t*9+k*5)*6)*k*sc,sw=Math.sin(t*6+k*3)*5*k;
    g.beginPath();g.moveTo(x-w,y-3*k);g.bezierCurveTo(x-w*1.35,y-h*.45,x-w*.2+sw,y-h*.6,x+sw*1.4,y-h);
    g.bezierCurveTo(x+w*.5+sw,y-h*.6,x+w*1.35,y-h*.4,x+w,y-3*k);g.quadraticCurveTo(x,y+7*k,x-w,y-3*k);g.closePath();
    g.fillStyle=col;g.fill();if(line){g.lineWidth=3.5;g.strokeStyle=INK;g.stroke();}
  }
}
/* ───── 장비 아이콘 ───── */
function drawIcon(g,kind,col){const base='#eadfc6';g.lineWidth=2.5;
  switch(kind){
    case'sword':g.save();g.rotate(.7);rr(g,-2.6,-14,5.2,19,1.6);inkF(g,base);rr(g,-6.5,4,13,3.6,1.6);inkF(g,col);rr(g,-1.8,7,3.6,6.5,1.6);inkF(g,'#7a5236');g.restore();break;
    case'helm':g.beginPath();g.moveTo(-9.5,5);g.quadraticCurveTo(-10.5,-11,0,-11);g.quadraticCurveTo(10.5,-11,9.5,5);g.closePath();inkF(g,base);rr(g,-11,3,22,4.5,2);inkF(g,col);break;
    case'armor':poly(g,[[-11,-8],[-4,-11],[0,-7],[4,-11],[11,-8],[8.5,10],[-8.5,10]]);inkF(g,base);ell(g,0,1,3.2,3.2);inkF(g,col);break;
    case'boots':g.beginPath();g.moveTo(-6,-11);g.lineTo(1.5,-11);g.lineTo(1.5,2);g.quadraticCurveTo(11,2,11,9);g.lineTo(-6,9);g.closePath();inkF(g,base);rr(g,-7.5,-12,10.5,4.4,1.6);inkF(g,col);break;
    case'ring':ell(g,0,3,6.5,6.5);g.lineWidth=7;g.strokeStyle=INK;g.stroke();g.lineWidth=2.6;g.strokeStyle=base;g.stroke();g.lineWidth=2.4;starPath(g,0,-6,4,5.5,3.2,-Math.PI/2);inkF(g,col);break;
    case'amulet':g.beginPath();g.arc(0,-7,8.5,.12*Math.PI,.88*Math.PI);g.lineWidth=6;g.strokeStyle=INK;g.stroke();g.lineWidth=2;g.strokeStyle=base;g.stroke();g.lineWidth=2.4;ell(g,0,5,4.8,5.8);inkF(g,col);break;
    case'glove':for(const x of[-6.2,-2,2.2])rr(g,x,-12,4,10,1.9),inkF(g,base);rr(g,-7,-5,13.5,13,4);inkF(g,base);rr(g,-8,6,15.5,4.4,2);inkF(g,col);break;
    case'belt':rr(g,-12.5,-3.2,25,6.4,2.2);inkF(g,'#7a5236');rr(g,-4.5,-5.5,9,11,2.2);inkF(g,col);break;
  }}
const iconCache={};
function iconSprite(kind,gi){const k=kind+gi;return iconCache[k]||(iconCache[k]=makeSprite(34,34,17,17,g=>drawIcon(g,kind,GRADES[gi].c)));}
/* ───── 소리 (파일 없이 합성) ───── */
let AC=null,master=null,noiseBuf=null,muted=false,paused=false;const lastS={};
function audioInit(){if(AC){if(AC.state==='suspended')AC.resume();return;}
  try{AC=new(window.AudioContext||window.webkitAudioContext)();const comp=AC.createDynamicsCompressor();master=AC.createGain();master.gain.value=.5;master.connect(comp);comp.connect(AC.destination);
    noiseBuf=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}catch(e){AC=null;}}
function can(k,ms){const n=performance.now();if(n-(lastS[k]||0)<ms)return false;lastS[k]=n;return true;}
function tone(type,f0,f1,dur,vol,delay){if(!AC||muted)return;const t=AC.currentTime+(delay||0),o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(f0,t);if(f1&&f1!==f0)o.frequency.exponentialRampToValueAtTime(f1,t+dur);
  g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol,t+.006);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(master);o.start(t);o.stop(t+dur+.03);}
function noise(dur,vol,type,f0,f1,q,delay){if(!AC||muted)return;const t=AC.currentTime+(delay||0),s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();s.buffer=noiseBuf;f.type=type;f.Q.value=q||1;f.frequency.setValueAtTime(f0,t);if(f1)f.frequency.exponentialRampToValueAtTime(f1,t+dur);
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(f);f.connect(g);g.connect(master);s.start(t,Math.random()*.4);s.stop(t+dur+.03);}
const SFX={
  hit(){if(!can('hit',38))return;const p=.85+Math.random()*.35;noise(.07,.34,'bandpass',1900*p,650,1.2);tone('sine',175*p,58,.09,.5);},
  crit(){if(!can('crit',60))return;noise(.11,.46,'bandpass',2700,850,1.5);tone('square',330,88,.12,.22);tone('sine',125,44,.17,.62);},
  kill(){if(!can('kill',45))return;const p=.9+Math.random()*.3;tone('triangle',250*p,640*p,.08,.28);noise(.13,.3,'lowpass',1500,280);tone('sine',150*p,48,.1,.34);},
  slash(){noise(.17,.26,'bandpass',650,3300,.8);},
  bolt(){if(!can('bolt',60))return;tone('triangle',740,290,.12,.16);noise(.08,.1,'highpass',2000,4200);},
  boom(){if(!can('boom',70))return;noise(.26,.5,'lowpass',950,110);tone('sine',112,38,.28,.7);},
  zap(){noise(.24,.4,'highpass',2400,6200);tone('sawtooth',1500,170,.19,.17);},
  xp(n){if(!can('xp',28))return;tone('sine',620*Math.pow(1.0595,Math.min(n,16)),0,.075,.15);},
  loot(gi){const f=[523,659,784,988,1175][gi];tone('sine',f,0,.5,.28);tone('sine',f*2.01,0,.34,.11);if(gi>=3){tone('sine',f*1.5,0,.5,.2,.09);tone('sine',f*2,0,.7,.2,.18);}},
  level(){[523,659,784,1047].forEach((f,i)=>tone('triangle',f,0,.24,.24,i*.07));},
  hurt(){if(!can('hurt',120))return;tone('square',145,52,.18,.28);noise(.1,.3,'lowpass',620,190);},
  elite(){tone('sawtooth',72,44,.95,.38);noise(.65,.25,'lowpass',320,80);},
};
/* ───── 땅 ───── */
const TILE=64,CH=512;let CS=1;const chunks=new Map();
/* 땅 색(맵마다 바뀐다): base 돌바닥, mossA·mossB 얼룩 땅, tuft 풀 무늬, speck 점, cobble 돌 얼룩, cov 얼룩 땅이 덮는 정도 */
const MAPC={base:'#2b2839',mossA:'#1f3f5e',mossB:'#224566',tuft:'#3c709a',speck:'rgba(120,180,220,.22)',cobble:'rgba(125,115,160,.085)',cov:.53};
function isMoss(tx,ty){if(Math.abs(tx+.5)<3.2&&Math.abs(ty+.5)<3.2)return false;return vnoise(tx*.2+3.3,ty*.2-1.7)*.74+vnoise(tx*.55+40,ty*.55+9)*.26>MAPC.cov;}
function edge(g,x1,y1,x2,y2,seed){const r=rng(seed*4294967296),dx=x2-x1,dy=y2-y1,nx=-dy/TILE,ny=dx/TILE,j1=(r()-.5)*7,j2=(r()-.5)*7;
  g.moveTo(x1,y1);g.bezierCurveTo(x1+dx*.33+nx*j1,y1+dy*.33+ny*j1,x1+dx*.66+nx*j2,y1+dy*.66+ny*j2,x2,y2);}
function buildChunk(cx,cy){const c=document.createElement('canvas'),px=Math.ceil(CH*CS);c.width=c.height=px;const g=c.getContext('2d');g.scale(px/CH,px/CH);g.lineCap='round';g.lineJoin='round';
  g.fillStyle=MAPC.base;g.fillRect(0,0,CH,CH);
  const X0=cx*8,Y0=cy*8;
  for(let j=-1;j<=8;j++)for(let i=-1;i<=8;i++){const tx=X0+i,ty=Y0+j,x=i*TILE,y=j*TILE,r=rng(hash2(tx,ty,3)*4294967296);
    if(isMoss(tx,ty)){g.fillStyle=r()>.5?MAPC.mossA:MAPC.mossB;g.fillRect(x-.5,y-.5,TILE+1,TILE+1);
      if(!isMoss(tx,ty-1)){g.fillStyle='rgba(8,10,26,.38)';g.fillRect(x,y,TILE,10);}
      g.strokeStyle=MAPC.tuft;g.lineWidth=2;
      for(let k=0;k<2;k++){if(r()<.6){const bx=x+8+r()*48,by=y+16+r()*42;g.beginPath();g.moveTo(bx-4,by-6);g.lineTo(bx,by);g.lineTo(bx,by-9);g.moveTo(bx,by);g.lineTo(bx+4,by-6);g.stroke();}}
      if(r()<.35){g.fillStyle=MAPC.speck;ell(g,x+r()*64,y+r()*64,2,1.4);g.fill();}
    }else{
      if(r()>.5){g.fillStyle='rgba(255,255,255,.022)';g.fillRect(x,y,TILE,TILE);}
      for(let k=0;k<3;k++){g.fillStyle=MAPC.cobble;ell(g,x+r()*64,y+r()*64,7+r()*8,5+r()*5,r()*3);g.fill();}
      g.strokeStyle='rgba(14,12,26,.6)';g.lineWidth=2;
      for(let k=0;k<7;k++){const a=r()*TAU;g.beginPath();g.arc(x+r()*64,y+r()*64,6+r()*5,a,a+1.5+r()*1.2);g.stroke();}
    }}
  // 경계 먹선
  for(const[lw,col]of[[9,'rgba(10,10,24,.4)'],[3.2,INK]]){g.lineWidth=lw;g.strokeStyle=col;g.beginPath();
    for(let j=-1;j<=8;j++)for(let i=-1;i<=8;i++){const tx=X0+i,ty=Y0+j,x=i*TILE,y=j*TILE,m=isMoss(tx,ty);
      if(m!==isMoss(tx,ty-1))edge(g,x,y,x+TILE,y,hash2(tx,ty,11));
      if(m!==isMoss(tx-1,ty))edge(g,x,y,x,y+TILE,hash2(tx,ty,12));}
    g.stroke();}
  return c;}
function getChunk(cx,cy){const k=cx+','+cy;let c=chunks.get(k);if(c){chunks.delete(k);chunks.set(k,c);return c;}
  c=buildChunk(cx,cy);chunks.set(k,c);if(chunks.size>40)chunks.delete(chunks.keys().next().value);return c;}
const propMap=new Map();
function getProps(cx,cy){const k=cx+','+cy;let a=propMap.get(k);if(a)return a;a=[];const r=rng(hash2(cx,cy,99)*4294967296),n=r()*3.4|0;
  for(let i=0;i<n;i++){const x=cx*CH+30+r()*(CH-60),y=cy*CH+30+r()*(CH-60);if(Math.hypot(x,y)<210)continue;const t=r();
    const kind=t<.42?'rock':t<.62?'tree':t<.76?'pillar':t<.88?'crystal':'bones',list=PROPS[kind];
    a.push({kind:'prop',pk:kind,x,y,sp:list[r()*list.length|0],flip:r()<.5?-1:1});}
  propMap.set(k,a);if(propMap.size>120)propMap.delete(propMap.keys().next().value);return a;}
