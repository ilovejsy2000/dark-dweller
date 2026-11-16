'use strict';
/* 다크 드웰러 — AI 동료(11-16 대표님 "멀티플레이 … 사람이 없으면 AI 캐릭터가 같이" → 먼저 AI 동료부터).
   거점의 출발 창에서 0~3명을 고른다. 동료는 주인공 둘레를 따라다니며 적을 피하고, 저마다 다른 방식으로 싸운다.
   - 청운(검객): 가까운 적을 크게 벤다
   - 월하(도사): 먼 적에게 불꽃 구슬을 쏜다(쫓아가는 탄)
   - 금강(수도승): 둘레에 파동을 터뜨려 적을 밀어내고, 주인공과 동료의 체력을 조금 채운다
   피해는 주인공의 피해 능력치(장비·특성)를 따라 함께 강해진다. 쓰러지면 12초 뒤 다시 일어난다.
   동료가 있으면 적 체력이 1명당 35%, 나오는 수가 15% 늘어난다(같이 싸우는 만큼). 몇몇 적은 동료를 노린다.
   나중에 온라인 함께하기를 만들면, 사람이 안 온 빈자리를 이 동료가 채운다. */
const MATE_DEF=[
  {k:'sword',n:'청운',role:'검객',hue:0,col:'#45f0da',cd:.9,rng:150,mul:1.15},
  {k:'mage',n:'월하',role:'도사',hue:200,col:'#ff9a5c',cd:.8,rng:420,mul:.85},
  {k:'monk',n:'금강',role:'수도승',hue:95,col:'#ffd24a',cd:2.6,rng:170,mul:1.1},
];
let mates=[];
const mateCount=()=>clamp(SAVE.mates===undefined?2:SAVE.mates,0,3);
/* 판 시작(ui.js uiStart 끝에서 부름) */
function matesBegin(){
  mates=[];const n=mateCount();
  for(let i=0;i<n;i++){const D=MATE_DEF[i],a=i/n*TAU+.6;mates.push({kind:'mate',D,i,x:P.x+Math.cos(a)*70,y:P.y+Math.sin(a)*50,hp:1,maxhp:1,cd:.6+i*.3,down:0,inv:0,dir:1,move:false,swing:-1,t:Math.random()*5,hurtT:0});}
  for(const m of mates){m.maxhp=m.hp=Math.round(P.maxhp*.7);}
  if(n){RUN.ehp*=1+.35*n;RUN.spawn*=1+.15*n;}
}
/* 새로 나온 적 몇몇은 동료를 노린다(game.js spawn 에서 부름). 보스·수호자·정예는 늘 주인공 */
function mateAggro(e){if(!mates.length||e.boss||e.elite||e.guard)return;if(Math.random()<.18*mates.length){const m=pick(mates);e.mt=m;}}
/* 적이 동료에게 닿았을 때 */
function mateHurt(m,d){if(m.down>0||m.inv>0)return;m.hp-=d*100/(100+ST.def)*.85;m.inv=.35;m.hurtT=.25;
  if(m.hp<=0){m.hp=0;m.down=12;puff(m.x,m.y-20,4);textFx(m.x,m.y-60,`${m.D.n} 쓰러짐`,'#ff9aa4');}}
function mateUpdate(dt){
  if(!mates.length||state!=='play')return;const n=mates.length;
  for(const m of mates){m.t+=dt;m.inv-=dt;m.hurtT-=dt;if(m.swing>=0){m.swing+=dt*5;if(m.swing>1)m.swing=-1;}
    m.maxhp=Math.max(m.maxhp,Math.round(P.maxhp*.7));
    if(m.down>0){m.down-=dt;m.move=false;if(m.down<=0){m.hp=m.maxhp*.5;m.inv=1.5;ring(m.x,m.y-20,12,300,m.D.col);textFx(m.x,m.y-60,`${m.D.n} 다시 일어남`,m.D.col);}continue;}
    m.hp=Math.min(m.maxhp,m.hp+m.maxhp*.006*dt+(ST.regen||0)*.5*dt);
    /* 움직임: 주인공 둘레의 자기 자리로 + 가까운 적에게서 멀어지기 */
    const a=m.i/n*TAU+runT*.15,tx=P.x+Math.cos(a)*105,ty=P.y+Math.sin(a)*75;let vx=(tx-m.x)*2.2,vy=(ty-m.y)*2.2;
    for(const e of enemies){if(e.dead||e.sleep)continue;const dx=m.x-e.x,dy=m.y-e.y,d2=dx*dx+dy*dy,rr=(e.r+60)*(e.r+60);if(d2<rr&&d2>1){const d=Math.sqrt(d2),k=(1-d/(e.r+60))*420;vx+=dx/d*k;vy+=dy/d*k;}}
    const sp=Math.hypot(vx,vy),mx=200*(1+(ST.move||0)/100);if(sp>mx){vx*=mx/sp;vy*=mx/sp;}
    m.x+=vx*dt;m.y+=vy*dt;m.move=sp>20;if(Math.abs(vx)>8)m.dir=vx>0?1:-1;keepIn(m,40);
    /* 너무 멀어지면(주인공이 달려가면) 따라붙는다 */
    if(Math.hypot(m.x-P.x,m.y-P.y)>520){m.x=P.x+Math.cos(a)*90;m.y=P.y+Math.sin(a)*60;puff(m.x,m.y-20,3);}
    /* 공격 */
    m.cd-=dt;if(m.cd>0||P.dead)continue;
    const D=m.D,tg=nearest(m.x,m.y,D.rng);if(!tg){m.cd=.2;continue;}
    const base=(9+P.level*2.4)*D.mul*(1+.12*Math.floor(runT/120));m.cd=cdOf(D.cd);if(Math.abs(tg.x-m.x)>4)m.dir=tg.x>m.x?1:-1;m.swing=0;
    if(D.k==='sword'){const ang=Math.atan2(tg.y-m.y,tg.x-m.x);slashAt(m.x,m.y,ang,120,base*1.6,false);if(can('mslash',120))SFX.slash&&SFX.slash();}
    else if(D.k==='mage'){const ang=Math.atan2(tg.y-12-(m.y-30),tg.x-m.x);bolts.push({x:m.x,y:m.y-30,vx:Math.cos(ang)*440,vy:Math.sin(ang)*440,life:1.3,t:tg,dmg:base*1.5,R:46*AREA,mini:true});}
    else if(D.k==='monk'){waves.push({x:m.x,y:m.y-12,r:20,R:170*AREA,dmg:base*1.3,hit:new Set(),stun:0});flash(m.x,m.y-20,180,.2);
      const heal=P.maxhp*.03;if(!P.dead&&Math.hypot(P.x-m.x,P.y-m.y)<260&&P.hp<P.maxhp){P.hp=Math.min(P.maxhp,P.hp+heal);textFx(P.x,P.y-70,`+${Math.round(heal)}`,'#7dffb0');}
      for(const o of mates)if(o.down<=0)o.hp=Math.min(o.maxhp,o.hp+o.maxhp*.06);}
  }
}
/* 그리기: 주인공 그림을 색을 바꿔(hue) 조금 작게, 머리 위에 이름·체력 */
function drawMate(m){
  const x=m.x,y=m.y;ctx.fillStyle='rgba(8,8,20,.4)';ell(ctx,x,y+2,13,5);ctx.fill();
  ctx.lineWidth=2;ctx.strokeStyle=m.D.col;ctx.globalAlpha=.55;ell(ctx,x,y+2,17,6.5);ctx.stroke();ctx.globalAlpha=1;
  if(m.down>0){ctx.save();ctx.translate(x,y);ctx.rotate(-1.3);ctx.globalAlpha=.55;drawHero(ctx,{t:0,move:false,swing:-1,im:baseHeroIm});ctx.restore();ctx.globalAlpha=1;
    const q=1-m.down/12;ctx.lineWidth=3;ctx.strokeStyle=m.D.col;ctx.beginPath();ctx.arc(x,y-46,10,-Math.PI/2,-Math.PI/2+q*TAU);ctx.stroke();return;}
  if(m.inv>0&&m.hurtT>0&&(clock*22|0)%2===0)return;
  ctx.save();ctx.translate(x,y);ctx.scale(m.dir*.88,.88);if(m.D.hue)ctx.filter=`hue-rotate(${m.D.hue}deg) saturate(1.15)`;drawHero(ctx,{t:m.t,move:m.move,swing:m.swing,im:baseHeroIm});ctx.filter='none';ctx.restore();
  /* 이름표와 체력 */
  const w=34,hy=y-66;rr(ctx,x-w/2,hy,w,5,2.5);ctx.fillStyle='rgba(6,8,20,.75)';ctx.fill();rr(ctx,x-w/2+1,hy+1,Math.max(1,(w-2)*m.hp/m.maxhp),3,1.5);ctx.fillStyle=m.D.col;ctx.fill();
  ctx.font='800 11px "Pretendard Variable",Pretendard,"Noto Sans KR",sans-serif';ctx.textAlign='center';ctx.textBaseline='bottom';ctx.lineWidth=3;ctx.strokeStyle=INK;ctx.strokeText(m.D.n,x,hy-2);ctx.fillStyle='#fff';ctx.fillText(m.D.n,x,hy-2);
  lights.push([x,y-22,120,.55]);
}
/* 거점 출발 창: 함께할 동료 수 */
function matesLobbyInit(){const box=$('mateSeg');if(!box)return;
  ['혼자','1명','2명','3명'].forEach((t,i)=>{const b=el('button',null,t);b.type='button';b.id='mate-'+i;b.addEventListener('click',()=>{SFX.ui();SAVE.mates=i;saveNow();matesLobbyRefresh();});box.append(b);});}
function matesLobbyRefresh(){const n=mateCount();for(let i=0;i<4;i++){const b=$('mate-'+i);if(b)b.setAttribute('aria-pressed',i===n);}
  const s=$('mateSub');if(s)s.textContent=n?MATE_DEF.slice(0,n).map(d=>`${d.n}(${d.role})`).join(' · ')+` — 적 체력 +${35*n}%`:'혼자 갑니다.';}
