'use strict';
/* 다크 드웰러 — 장비 그림: 이름마다 모양이 다르고, 재질(m)과 등급 색으로 칠한다 */
const MAT={iron:['#c9d1e0','#8a94ac'],leather:['#b98556','#7d5238'],wood:['#c8a46a','#8a6a3c'],bone:['#efe6cf','#b9ab8c'],gold:['#ffd56a','#c9962e']};
function drawGear(g,type,idx,mat,col,deco){
  const[A,B]=MAT[mat]||MAT.iron;g.lineWidth=2.5;g.lineJoin='round';g.lineCap='round';
  const gem=(x,y,r)=>{ell(g,x,y,r,r);inkF(g,col);};
  const chain=()=>{g.beginPath();g.arc(0,-8,9,.1*Math.PI,.9*Math.PI);g.lineWidth=5.5;g.strokeStyle=INK;g.stroke();g.lineWidth=2;g.strokeStyle=A;g.stroke();g.lineWidth=2.5;};
  const hook=()=>{g.beginPath();g.arc(0,-8,4.5,Math.PI*.9,Math.PI*2.2);g.lineWidth=5;g.strokeStyle=INK;g.stroke();g.lineWidth=2;g.strokeStyle=A;g.stroke();g.lineWidth=2.5;};
  switch(type){
  case'weapon':
    if(idx===1){g.save();g.rotate(.6);rr(g,-1.9,-13,3.8,27,1.7);inkF(g,'#7d5238');g.beginPath();g.moveTo(1.5,-13);g.quadraticCurveTo(15,-15,14,-1);g.quadraticCurveTo(8,-5,1.5,-3);g.closePath();inkF(g,A);gem(0,-8,2);g.restore();}
    else if(idx===2){g.save();g.rotate(.75);rr(g,-1.6,-8,3.2,23,1.5);inkF(g,'#7d5238');poly(g,[[0,-17],[4.5,-8],[0,-5],[-4.5,-8]]);inkF(g,A);rr(g,-3,-6,6,2.6,1);inkF(g,col);g.restore();}
    else if(idx===3){for(const r of[-.75,.75]){g.save();g.rotate(r);poly(g,[[-2.2,5],[-2.2,-11],[0,-15],[2.2,-11],[2.2,5]]);inkF(g,A);rr(g,-4.5,5,9,2.8,1.2);inkF(g,col);rr(g,-1.5,7.5,3,5,1.2);inkF(g,'#7d5238');g.restore();}}
    else{g.save();g.rotate(.7);rr(g,-2.6,-14,5.2,19,1.6);inkF(g,A);rr(g,-6.5,4,13,3.6,1.6);inkF(g,col);rr(g,-1.8,7,3.6,6.5,1.6);inkF(g,'#7d5238');g.restore();}
    break;
  case'helm':
    if(idx===0){blob(g,[[-10,8],[-11,-6],[0,-14],[11,-6],[10,8],[0,11]]);inkF(g,A);ell(g,1,0,5.5,6);inkF(g,'#231d2e');}
    else{if(idx===2)for(const s of[-1,1]){g.beginPath();g.moveTo(s*7,-6);g.quadraticCurveTo(s*15,-9,s*13,-16);g.quadraticCurveTo(s*10,-10,s*4,-9);g.closePath();inkF(g,'#efe6cf');}
      g.beginPath();g.moveTo(-9.5,5);g.quadraticCurveTo(-10.5,-11,0,-11);g.quadraticCurveTo(10.5,-11,9.5,5);g.closePath();inkF(g,A);rr(g,-11,3,22,4.5,2);inkF(g,col);
      if(idx===1){rr(g,-5,-3,10,3,1.2);g.fillStyle=INK;g.fill();}}
    break;
  case'armor':poly(g,[[-11,-9],[-4,-12],[0,-8],[4,-12],[11,-9],[9,11],[-9,11]]);inkF(g,A);g.strokeStyle=B;g.lineWidth=1.6;g.beginPath();
    if(idx===0){g.moveTo(-6,-5);g.lineTo(6,7);g.moveTo(6,-5);g.lineTo(-6,7);}
    else if(idx===1){for(let y=0;y<=8;y+=4)for(let x=-6;x<=6;x+=4){g.moveTo(x+1.4,y);g.arc(x,y,1.4,0,TAU);}}
    else{for(let y=1;y<=9;y+=4.5)for(let x=-6;x<=6;x+=4){g.moveTo(x-2,y);g.arc(x,y,2,Math.PI,0,true);}}
    g.stroke();g.lineWidth=2.5;gem(0,-4,2.4);break;
  case'glove':for(const x of[-6.2,-2,2.2]){rr(g,x,-12,4,10,1.9);inkF(g,A);}rr(g,-7,-5,13.5,13,4);inkF(g,A);rr(g,-8,6,15.5,4.4,2);inkF(g,col);
    if(idx===1){g.fillStyle=B;for(const x of[-4,0,4]){ell(g,x,-1,1.5,1.5);g.fill();}}break;
  case'belt':
    if(idx===0){rr(g,-12.5,-3,25,6,3);inkF(g,A);g.strokeStyle=B;g.lineWidth=1.6;g.beginPath();for(let x=-10;x<=8;x+=4){g.moveTo(x,-2.5);g.lineTo(x+2,2.5);}g.stroke();g.lineWidth=2.5;ell(g,0,0,4,4.5);inkF(g,col);}
    else{rr(g,-12.5,-3.2,25,6.4,2.2);inkF(g,'#7a5236');g.fillStyle=A;for(const x of[-9,9]){ell(g,x,0,1.6,1.6);g.fill();}rr(g,-4.5,-5.5,9,11,2.2);inkF(g,col);}
    break;
  case'boots':
    if(idx===0){rr(g,-10,5,20,4.5,2);inkF(g,A);g.lineWidth=5;g.strokeStyle=INK;g.beginPath();g.moveTo(-6,5);g.lineTo(0,-6);g.lineTo(6,5);g.stroke();g.lineWidth=2;g.strokeStyle=col;g.stroke();g.lineWidth=2.5;}
    else{g.beginPath();g.moveTo(-6,-11);g.lineTo(1.5,-11);g.lineTo(1.5,2);g.quadraticCurveTo(11,2,11,9);g.lineTo(-6,9);g.closePath();inkF(g,A);rr(g,-7.5,-12,10.5,4.4,1.6);inkF(g,col);
      if(idx===2){g.beginPath();g.moveTo(4,3.5);g.quadraticCurveTo(10,4,10.5,8.5);g.lineTo(4,8.5);g.closePath();inkF(g,'#c9d1e0',2);g.lineWidth=2.5;}}
    break;
  case'amulet':chain();
    if(idx===0){poly(g,[[-3.5,1],[3.5,1],[0,12]]);inkF(g,A);}
    else if(idx===1){ell(g,0,6,5.2,6);inkF(g,col);g.fillStyle='rgba(255,255,255,.55)';ell(g,-1.6,4,1.4,2);g.fill();}
    else{rr(g,-4.5,1,9,11,1.5);inkF(g,A);g.strokeStyle=col;g.lineWidth=2;g.beginPath();g.moveTo(0,3.5);g.lineTo(0,9.5);g.moveTo(-2.3,6.5);g.lineTo(2.3,6.5);g.stroke();g.lineWidth=2.5;}
    break;
  case'ear':hook();
    if(idx===0){ell(g,0,4,5,5);g.lineWidth=6;g.strokeStyle=INK;g.stroke();g.lineWidth=2.4;g.strokeStyle=A;g.stroke();g.lineWidth=2.5;gem(0,10,2.4);}
    else if(idx===1){poly(g,[[-3.2,-2],[3.2,-2],[0,12]]);inkF(g,A);gem(0,-2,2);}
    else{g.beginPath();g.arc(0,5,7,.5*Math.PI,1.5*Math.PI);g.arc(3,5,6,1.4*Math.PI,.6*Math.PI,true);g.closePath();inkF(g,col);}
    break;
  default:
    if(idx===2){g.beginPath();g.arc(0,2,7,.2,TAU*.92);g.lineWidth=7;g.strokeStyle=INK;g.stroke();g.lineWidth=3;g.strokeStyle=A;g.stroke();g.lineWidth=2.5;ell(g,6.5,-1.5,3,2.4);inkF(g,A);g.fillStyle=col;ell(g,7.2,-1.8,1,1);g.fill();}
    else{ell(g,0,3,6.5,6.5);g.lineWidth=7;g.strokeStyle=INK;g.stroke();g.lineWidth=2.6;g.strokeStyle=A;g.stroke();g.lineWidth=2.5;
      if(idx===1){ell(g,0,-5,4.2,3.6);inkF(g,col);}else{starPath(g,0,-6,4,5.5,3.2,-Math.PI/2);inkF(g,col);}}
  }
  /* 꾸밈: 신화의 표식(번개·날개·깃·해), 전설·신화의 반짝임 */
  if(deco==='bolt'){poly(g,[[9,-15],[4,-7],[8,-7],[5,0],[13,-10],[9,-10]]);inkF(g,'#ffe066',2);}
  else if(deco==='wing'){g.beginPath();g.moveTo(-8,2);g.quadraticCurveTo(-17,-2,-15,-11);g.quadraticCurveTo(-11,-6,-6,-5);g.closePath();inkF(g,'#f4fcff',2);}
  else if(deco==='plume'){g.beginPath();g.moveTo(0,-11);g.quadraticCurveTo(2,-19,11,-16);g.quadraticCurveTo(5,-13,4,-9);g.closePath();inkF(g,'#e2504c',2);}
  else if(deco==='sun'){g.strokeStyle='#ffe066';g.lineWidth=2;g.beginPath();for(let i=0;i<8;i++){const a=i*TAU/8;g.moveTo(Math.cos(a)*6,-5+Math.sin(a)*6);g.lineTo(Math.cos(a)*9.5,-5+Math.sin(a)*9.5);}g.stroke();}
  if(deco){g.fillStyle='#fff7df';starPath(g,-12,-11,4,3.6,1.3,0);g.fill();starPath(g,12,10,4,2.8,1,0);g.fill();}
}
function gearInfo(it){
  if(it.gi===4){const M=MYTHS[it.t][it.my]||MYTHS[it.t][0];return{idx:M.i||0,mat:M.m,deco:M.deco||'spark'};}
  const B=ITEM_BASES[it.t][it.b]||ITEM_BASES[it.t][0];return{idx:it.b||0,mat:B.m,deco:it.gi===3?'spark':null};
}
/* 그린 그림(img/gear.png): 192칸짜리 그림판, 한 줄에 6개. 번호는 왼쪽 위부터.
   GEAR_ART[종류][장비 번호] = 그림판 번호. 그림이 없는 것은 같은 종류의 다른 그림이나 위의 코드 그림을 쓴다. */
const gearAtlas=new Image();gearAtlas.src='img/gear.png';
const GEAR_CELL=144,GEAR_COLS=6;
const GEAR_ART={weapon:[0,1,2,3],helm:[4,5,6],armor:[9,10,11],glove:[12,13],belt:[14,15],boots:[16,17,18],amulet:[19,20,21],ear:[22,23,24],ring:[25,26,44]};
/* 신화 장비는 이름마다 제 그림(my 번호 순), 전설 장비 몇 개도 제 그림(lg 번호) */
const GEAR_ART_MYTH={weapon:[7,8,36,37,38,39],helm:[27,28],armor:[29,30,31,32],glove:[33],belt:[34],boots:[35],amulet:[40,41],ear:[42,43],ring:[45,46,47]};
const GEAR_ART_LEG={weapon:{0:48,1:49,4:50},helm:{3:51},armor:{4:52},ring:{1:53}};
function gearArt(it){
  let a;
  const nm=String(it.name||'').replace(PRIME.k+' · ','');
  if(it.gi===3){const L=(LEGENDS[it.t]||[])[it.lg];if(L&&L.n===nm)a=(GEAR_ART_LEG[it.t]||{})[it.lg];if(a===undefined)a=(GEAR_ART[it.t]||[])[it.b||0];}
  else if(it.gi===4){const M0=(MYTHS[it.t]||[])[it.my];if(M0&&M0.n===nm)a=(GEAR_ART_MYTH[it.t]||[])[it.my];if(a===undefined){const M=MYTHS[it.t][it.my]||MYTHS[it.t][0];a=(GEAR_ART[it.t]||[])[M.i||0];}}
  else a=(GEAR_ART[it.t]||[])[it.b||0];
  return a===undefined||!gearAtlas.complete||!gearAtlas.naturalWidth?-1:a;
}
/* 판 위(바닥에 떨어진 장비)에 그리기: 가운데가 원점, size 는 한 변 길이 */
function drawGearAt(g,it,size){
  const a=gearArt(it);
  if(a>=0){g.imageSmoothingQuality='high';g.drawImage(gearAtlas,(a%GEAR_COLS)*GEAR_CELL,(a/GEAR_COLS|0)*GEAR_CELL,GEAR_CELL,GEAR_CELL,-size/2,-size/2,size,size);}
  else{const sp=gearSprite(it),k=size/30;g.drawImage(sp.c,-sp.ox*k,-sp.oy*k,sp.w*k,sp.h*k);}
}
/* 장비 칸에 넣을 그림 주소. 파일을 직접 열어(인터넷 주소 없이) 그림을 읽지 못하면 코드 그림으로 돌아간다 */
const gearURLs={};
function gearURL(it){
  const a=gearArt(it);
  if(a>=0){if(gearURLs[a])return gearURLs[a];
    try{const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');g.imageSmoothingQuality='high';
      g.drawImage(gearAtlas,(a%GEAR_COLS)*GEAR_CELL,(a/GEAR_COLS|0)*GEAR_CELL,GEAR_CELL,GEAR_CELL,0,0,128,128);return gearURLs[a]=c.toDataURL();}catch(_){}}
  const sp=gearSprite(it);return sp.url||(sp.url=sp.c.toDataURL());
}
const gearCache={};
function gearSprite(it){const o=gearInfo(it),k=it.t+o.idx+o.mat+it.gi+o.deco;return gearCache[k]||(gearCache[k]=makeSprite(38,38,19,19,g=>drawGear(g,it.t,o.idx,o.mat,GRADES[it.gi].c,o.deco)));}
