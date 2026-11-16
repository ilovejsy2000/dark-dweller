'use strict';
/* 다크 드웰러 — 바닥과 소품 다시 그리기(11-15 대표님 "배경 디자인 보완", 루아 시험: 64픽셀 칸 단위라 계단 모양·바둑판 줄이 보이고 같은 낙서 무늬가 반복됨).
   바닥은 세계 좌표로 이어지는 부드러운 무늬(조각 사이 이음매 없음)에 만화풍 먹선 테두리, 풀숲 안엔 풀잎·꽃, 흙바닥엔 자갈만 조금.
   소품은 맵마다 다르게: 숲(나무·덤불·꽃·버섯) / 서리(얼음 수정·마른 나무·눈 더미) / 잿불(탄 그루터기·뼈·바위) / 심연(수정·빛나는 버섯·기둥).
   base.js 의 buildChunk·getProps 를 이 파일의 것으로 바꿔 끼운다. */

const hexRgb=h=>{h=h.replace('#','');return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];};
/* 바닥 무늬 값(세계 좌표). 모닥불 둘레는 흙 마당 */
function groundField(x,y){let f=vnoise(x*.0042+3.3,y*.0042-1.7)*.6+vnoise(x*.012+40,y*.012+9)*.3+vnoise(x*.035+7,y*.035+3)*.1;
  const d=Math.hypot(x,y+4);if(d<300)f-=(1-d/300)*.45;return f;}
function buildChunk(cx,cy){
  const px=Math.ceil(CH*CS),c=document.createElement('canvas');c.width=c.height=px;const g=c.getContext('2d');
  /* 1) 8픽셀마다 무늬 값을 재 두고(65×65), 2픽셀 단위로 사이를 이어 칠한다 */
  const STEP=8,N=CH/STEP+1,X0=cx*CH,Y0=cy*CH,F=new Float32Array(N*N),V=new Float32Array(N*N);
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const wx=X0+i*STEP,wy=Y0+j*STEP;F[j*N+i]=groundField(wx,wy);V[j*N+i]=vnoise(wx*.009+11,wy*.009+5);}
  const RES=2,M=CH/RES,img=new ImageData(M,M),D=img.data,cov=MAPC.cov,A=hexRgb(MAPC.mossA),B=hexRgb(MAPC.mossB),G=hexRgb(MAPC.base),K=[18,16,34];
  for(let y=0;y<M;y++){const gy=y*RES/STEP,j0=gy|0,ty=gy-j0;
    for(let x=0;x<M;x++){const gx=x*RES/STEP,i0=gx|0,tx=gx-i0,k=j0*N+i0;
      const f=(F[k]*(1-tx)+F[k+1]*tx)*(1-ty)+(F[k+N]*(1-tx)+F[k+N+1]*tx)*ty,v=(V[k]*(1-tx)+V[k+1]*tx)*(1-ty)+(V[k+N]*(1-tx)+V[k+N+1]*tx)*ty;
      let r,gg,b;
      if(f>cov+.007){const m=v,l=1+Math.min(.12,(f-cov)*.9);r=(A[0]+(B[0]-A[0])*m)*l;gg=(A[1]+(B[1]-A[1])*m)*l;b=(A[2]+(B[2]-A[2])*m)*l;}       // 풀숲: 두 색이 부드럽게 섞이고 안쪽이 조금 밝다
      else if(f>cov-.009){r=K[0];gg=K[1];b=K[2];}                                                                                                 // 테두리 먹선
      else{const sh=f>cov-.045?.8:1,l=(.9+.2*v)*sh;r=G[0]*l;gg=G[1]*l;b=G[2]*l;}                                                                   // 흙: 풀숲 바로 아래는 그림자
      const o=(y*M+x)*4;D[o]=r;D[o+1]=gg;D[o+2]=b;D[o+3]=255;}}
  const s=document.createElement('canvas');s.width=s.height=M;s.getContext('2d').putImageData(img,0,0);
  g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(s,0,0,px,px);
  /* 2) 장식: 풀숲엔 풀잎·꽃, 흙엔 자갈 조금(세계 칸마다 정해진 값이라 다시 그려도 같다) */
  g.scale(px/CH,px/CH);g.lineCap='round';g.lineJoin='round';const mi=mapIdx(),flowers=mi===0,snow=mi===1,ash=mi===2;
  for(let j=0;j<8;j++)for(let i=0;i<8;i++){const tx=cx*8+i,ty=cy*8+j,r=rng(hash2(tx,ty,3)*4294967296);
    for(let k=0;k<3;k++){const lx=i*64+r()*64,ly=j*64+r()*64,f=groundField(X0+lx,Y0+ly),t=r();
      if(f>cov+.03){
        if(t<.55){g.strokeStyle=MAPC.tuft;g.lineWidth=2.4;g.beginPath();g.moveTo(lx-5,ly-7);g.quadraticCurveTo(lx-1,ly-2,lx,ly);g.moveTo(lx,ly-11);g.lineTo(lx,ly);g.moveTo(lx+5,ly-7);g.quadraticCurveTo(lx+1,ly-2,lx,ly);g.stroke();}
        else if(flowers&&t<.68){const col=['#ff8fb8','#ffd56a','#c9b8ff'][r()*3|0];for(let p=0;p<5;p++){const a=p*TAU/5;g.fillStyle=col;ell(g,lx+Math.cos(a)*3,ly+Math.sin(a)*3,2.4,2.4);g.fill();}g.fillStyle='#fff3c2';ell(g,lx,ly,1.8,1.8);g.fill();}
        else if(snow&&t<.7){g.fillStyle='rgba(240,248,255,.55)';ell(g,lx,ly,6+r()*6,3+r()*2);g.fill();}}
      else if(f<cov-.06&&t<.28){const w=3+r()*4;ell(g,lx,ly,w,w*.7);g.fillStyle=ash?'#3a2a2e':'rgba(0,0,0,.18)';g.fill();ell(g,lx-w*.25,ly-w*.25,w*.45,w*.3);g.fillStyle='rgba(255,255,255,.08)';g.fill();
        if(ash&&r()<.3){g.fillStyle='rgba(255,138,46,.7)';ell(g,lx,ly,1.4,1.4);g.fill();}}}}
  return c;}

/* ───── 새 소품 ───── */
function sprBush(seed,c1,c2,berry){const r=rng(seed);return makeSprite(90,70,45,62,g=>{
  for(const[x,y,s]of[[-18,-16,18],[16,-14,17],[0,-26,21]]){ell(g,x,y,s,s*.9);inkF(g,c1,3);}
  g.fillStyle=c2;for(const[x,y]of[[-22,-22],[10,-20],[-4,-36]]){ell(g,x,y,6,4);g.fill();}
  if(berry)for(let i=0;i<4;i++){ell(g,-20+r()*40,-30+r()*20,3,3);inkF(g,berry,1.6);}});}
function sprFlowers(seed){const r=rng(seed);return makeSprite(70,60,35,54,g=>{
  for(let i=0;i<3;i++){const x=-16+i*16+r()*6,h=18+r()*14;g.lineWidth=3;g.strokeStyle='#2f7d6a';g.beginPath();g.moveTo(x,0);g.quadraticCurveTo(x+4,-h/2,x,-h);g.stroke();
    const col=['#ff8fb8','#ffd56a','#c9b8ff'][i%3];for(let p=0;p<5;p++){const a=p*TAU/5;ell(g,x+Math.cos(a)*5,-h+Math.sin(a)*5,4,4);inkF(g,col,1.8);}ell(g,x,-h,3,3);g.fillStyle='#fff3c2';g.fill();}});}
function sprMush(seed,cap,dots,glowCol){const r=rng(seed);return makeSprite(70,64,35,58,g=>{
  for(const[x,s]of[[-12,1],[10,.75]]){rr(g,x-5*s,-18*s,10*s,18*s,4*s);inkF(g,'#efe6cf',2.4);g.beginPath();g.ellipse(x,-18*s,16*s,11*s,0,Math.PI,0);g.closePath();inkF(g,cap,2.6);
    g.fillStyle=dots;for(let i=0;i<3;i++){ell(g,x-8*s+i*8*s,-24*s+(i%2)*3*s,2.6*s,2*s);g.fill();}}});}
function sprDeadTree(seed){const r=rng(seed);return makeSprite(100,130,50,122,g=>{
  const br=(x,y,a,len,w)=>{const ex=x+Math.cos(a)*len,ey=y+Math.sin(a)*len;poly(g,[[x-w,y],[ex,ey],[x+w,y]]);inkF(g,'#6b7394',2.6);g.fillStyle='#eef6ff';ell(g,ex,ey+2,w*.9,w*.6);g.fill();return[ex,ey];};
  rr(g,-6,-70,12,72,4);inkF(g,'#6b7394',3);br(-2,-60,-2.3-r()*.3,36,4);br(2,-68,-.8+r()*.3,34,4);br(0,-70,-1.6,30,3.5);});}
function sprSnow(seed){const r=rng(seed);return makeSprite(90,46,45,40,g=>{blob(g,[[-38,0],[-30,-12],[-10,-20],[12,-18],[32,-10],[38,0]]);inkF(g,'#e6f2ff',3);g.fillStyle='#b9cfe6';blob(g,[[-30,0],[-20,-6],[10,-6],[30,0]]);g.fill();});}
function sprStump(seed){return makeSprite(70,56,35,48,g=>{rr(g,-22,-26,44,26,6);inkF(g,'#3a2a2e',3);ell(g,0,-26,22,8);inkF(g,'#5a3e3a',2.6);g.strokeStyle='#2a1c1e';g.lineWidth=1.6;ell(g,0,-26,12,4);g.stroke();
  g.fillStyle='#ff8a2e';ell(g,-8,-12,3,2);g.fill();ell(g,10,-6,2.4,1.8);g.fill();});}
const PROPS2={
  bush:[[11,'#2f7d6a','#4fae8a','#e0524f'],[12,'#2a6f7d','#47a0ae',null]].map(a=>sprBush(...a)),
  flowers:[13,14].map(sprFlowers),
  mush:[sprMush(15,'#e2504c','#fff3e8')],
  glow:[sprMush(16,'#7fe3ff','#e6fbff'),sprMush(17,'#b678ff','#f3e6ff')],
  deadtree:[18,19].map(sprDeadTree),snow:[20,21].map(sprSnow),stump:[sprStump(22)],
};
const PROP_TABLE=[
  [['tree',.18],['bush',.26],['flowers',.2],['mush',.12],['rock',.18],['bones',.06]],
  [['rock',.26],['crystal',.2],['deadtree',.2],['snow',.28],['bones',.06]],
  [['rock',.3],['bones',.2],['stump',.3],['pillar',.2]],
  [['crystal',.3],['pillar',.22],['glow',.32],['bones',.16]],
];
function getProps(cx,cy){const k=cx+','+cy;let a=propMap.get(k);if(a)return a;a=[];const r=rng(hash2(cx,cy,99)*4294967296),n=3+(r()*4|0),tab=PROP_TABLE[mapIdx()]||PROP_TABLE[0];
  for(let i=0;i<n;i++){const x=cx*CH+30+r()*(CH-60),y=cy*CH+30+r()*(CH-60);if(Math.hypot(x,y)<230)continue;let t=r(),kind=tab[0][0];for(const[kk,w]of tab){if(t<w){kind=kk;break;}t-=w;}
    const list=PROPS2[kind]||PROPS[kind];a.push({kind:'prop',pk:kind,x,y,sp:list[r()*list.length|0],flip:r()<.5?-1:1});}
  propMap.set(k,a);if(propMap.size>120)propMap.delete(propMap.keys().next().value);return a;}
