'use strict';
/* 다크 드웰러 — 함께하기(11-16 대표님 바로잡음):
   "함께할 동료는 일반 게임이 아니라 멀티플레이인 영겁의 굴레에서 쓰는 것. 10초 동안 매칭이 안 되면 끼어 들어와 같이 하는 느낌.
    캐릭터 옆에 같이 다니는 게 아니고 따로따로 각각의 객체처럼 움직여야 한다."
   - 영겁의 굴레에서 '함께하기'를 켜고 출발하면 10초 동안 같이 할 사람을 찾는다(지금은 온라인 매칭이 없어 빈자리는 AI가 차례로 합류).
     나중에 온라인 함께하기를 만들면 여기서 진짜 사람을 먼저 채우고 남는 자리만 AI로 채운다.
   - AI 동료는 저마다 스킨·이름을 가진 다른 플레이어처럼 굴레 안을 따로 돌아다니며 싸운다(주인공을 졸졸 따라다니지 않음).
     맡은 싸움 방식: 검객(가까이 붙어 벰) · 도사(멀리서 불꽃 구슬) · 수도승(파동, 가까운 아군 체력 회복).
   - 동료 1명당 적 체력 +30%. 쓰러지면 12초 뒤 다시 일어난다. 몇몇 적은 동료를 노린다. */
const MATE_DEF=[
  {k:'sword',role:'검객',col:'#45f0da',cd:.9,rng:220,pref:70,mul:1.15},
  {k:'mage',role:'도사',col:'#ff9a5c',cd:.8,rng:400,pref:250,mul:.85},
  {k:'monk',role:'수도승',col:'#ffd24a',cd:2.6,rng:240,pref:110,mul:1.1},
];
const MATE_NAMES=['월야','Kairo','검은바람','루나','하늘검','새벽여우','청풍','Mira','은하','Raven','다온','설화','Noa','흑운','별빛검'];
let mates=[],pendingParty=null,lastParty=null;
const partyOn=()=>SAVE.party===undefined?true:!!SAVE.party;
const mateCount=()=>mates.length;
/* 매칭 상대(AI) 만들기: 다른 이름 · 스킨 · 싸움 방식 */
function makeMateSeed(i,used){let n;do{n=pick(MATE_NAMES);}while(used.has(n));used.add(n);
  const sk=pick(SKINS.filter(s=>s.tier>=1&&s.tier<=2));return{D:MATE_DEF[i%3],name:n,skin:sk.id};}
/* 판 시작(ui.js uiStart 끝에서 부름): 영겁의 굴레 + 함께하기일 때만 */
function matesBegin(){
  mates=[];if(!rift||!partyOn()){pendingParty=null;return;}
  const party=pendingParty||lastParty;pendingParty=null;if(!party||!party.length)return;lastParty=party;
  party.forEach((s,i)=>{const a=Math.random()*TAU,d=rand(180,320),im=new Image();im.src=SKIN[s.skin]?SKIN[s.skin].img:'img/hero.png';
    mates.push({kind:'mate',D:s.D,name:s.name,im,i,x:P.x+Math.cos(a)*d,y:P.y+Math.sin(a)*d*.8,hp:1,maxhp:1,cd:.6+i*.4,down:0,inv:0,dir:1,move:false,swing:-1,t:Math.random()*5,hurtT:0,goal:null,goalT:0});});
  for(const m of mates)m.maxhp=m.hp=Math.round(P.maxhp*.7);
  RUN.ehp*=1+.3*mates.length;
  uiNote(`${mates.map(m=>m.name).join(' · ')} 님과 함께합니다`);
}
function mateAggro(e){if(!mates.length||e.boss||e.elite||e.guard)return;if(Math.random()<.15*mates.length){e.mt=pick(mates);}}
function mateHurt(m,d){if(m.down>0||m.inv>0)return;m.hp-=d*100/(100+ST.def)*.85;m.inv=.35;m.hurtT=.25;
  if(m.hp<=0){m.hp=0;m.down=12;puff(m.x,m.y-20,4);textFx(m.x,m.y-60,`${m.name} 쓰러짐`,'#ff9aa4');}}
function mateUpdate(dt){
  if(!mates.length||state!=='play')return;
  for(const m of mates){m.t+=dt;m.inv-=dt;m.hurtT-=dt;if(m.swing>=0){m.swing+=dt*5;if(m.swing>1)m.swing=-1;}
    m.maxhp=Math.max(m.maxhp,Math.round(P.maxhp*.7));
    if(m.down>0){m.down-=dt;m.move=false;if(m.down<=0){m.hp=m.maxhp*.5;m.inv=1.5;ring(m.x,m.y-20,12,300,m.D.col);textFx(m.x,m.y-60,`${m.name} 다시 일어남`,m.D.col);}continue;}
    m.hp=Math.min(m.maxhp,m.hp+m.maxhp*.006*dt);
    const D=m.D,dP=Math.hypot(m.x-P.x,m.y-P.y);let vx=0,vy=0,spd=190;
    /* 1) 자기 할 일: 가끔 새 목표 지점을 정해 돌아다닌다(같은 굴레 안, 주인공에게서 250~650 떨어진 곳) */
    m.goalT-=dt;if(!m.goal||m.goalT<=0||Math.hypot(m.goal.x-m.x,m.goal.y-m.y)<40){const a=Math.random()*TAU,d=rand(250,650);m.goal={x:P.x+Math.cos(a)*d,y:P.y+Math.sin(a)*d*.8};keepIn(m.goal,80);m.goalT=rand(4,8);}
    const tg=nearest(m.x,m.y,D.rng);
    if(m.hp<m.maxhp*.35){ /* 2) 체력이 낮으면 적에게서 물러난다 */
      for(const e of enemies){if(e.dead||e.sleep)continue;const dx=m.x-e.x,dy=m.y-e.y,d=Math.hypot(dx,dy)||1;if(d<300){vx+=dx/d*(300-d);vy+=dy/d*(300-d);}}spd=210;}
    else if(tg){ /* 3) 싸움: 맡은 거리(검객 붙어서 · 도사 멀리서)를 유지 */
      const dx=tg.x-m.x,dy=tg.y-m.y,d=Math.hypot(dx,dy)||1,want=D.pref+tg.r;if(d>want+20){vx+=dx/d*200;vy+=dy/d*200;}else if(d<want-20){vx-=dx/d*200;vy-=dy/d*200;}
      vx+=-dy/d*60*(m.i%2?1:-1);vy+=dx/d*60*(m.i%2?1:-1);} /* 옆으로 돌며 싸움 */
    else{const dx=m.goal.x-m.x,dy=m.goal.y-m.y,d=Math.hypot(dx,dy)||1;vx+=dx/d*170;vy+=dy/d*170;}
    /* 4) 바로 옆 적은 피한다 */
    for(const e of enemies){if(e.dead||e.sleep)continue;const dx=m.x-e.x,dy=m.y-e.y,d2=dx*dx+dy*dy,rr=(e.r+40)*(e.r+40);if(d2<rr&&d2>1){const d=Math.sqrt(d2),k=(1-d/(e.r+40))*380;vx+=dx/d*k;vy+=dy/d*k;}}
    /* 5) 너무 멀어지면 다시 무리 쪽으로(달려온다, 아주 멀면 순간 이동) */
    if(dP>900){vx+=(P.x-m.x)/dP*400;vy+=(P.y-m.y)/dP*400;spd=330;}
    if(dP>1600){const a=Math.random()*TAU;m.x=P.x+Math.cos(a)*500;m.y=P.y+Math.sin(a)*400;puff(m.x,m.y-20,3);}
    const sp=Math.hypot(vx,vy),mx=spd;if(sp>mx){vx*=mx/sp;vy*=mx/sp;}
    m.x+=vx*dt;m.y+=vy*dt;m.move=sp>20;if(Math.abs(vx)>8)m.dir=vx>0?1:-1;keepIn(m,40);
    /* 공격 */
    m.cd-=dt;if(m.cd>0)continue;const at=nearest(m.x,m.y,D.k==='mage'?D.rng:D.k==='sword'?130:180);if(!at){m.cd=.2;continue;}
    const base=(9+P.level*2.4)*D.mul*(1+.12*Math.floor(runT/120));m.cd=cdOf(D.cd);if(Math.abs(at.x-m.x)>4)m.dir=at.x>m.x?1:-1;m.swing=0;
    if(D.k==='sword'){const ang=Math.atan2(at.y-m.y,at.x-m.x);slashAt(m.x,m.y,ang,120,base*1.6,false);if(can('mslash',120))SFX.slash&&SFX.slash();}
    else if(D.k==='mage'){const ang=Math.atan2(at.y-12-(m.y-30),at.x-m.x);bolts.push({x:m.x,y:m.y-30,vx:Math.cos(ang)*440,vy:Math.sin(ang)*440,life:1.3,t:at,dmg:base*1.5,R:46*AREA,mini:true});}
    else{waves.push({x:m.x,y:m.y-12,r:20,R:170*AREA,dmg:base*1.3,hit:new Set(),stun:0});flash(m.x,m.y-20,180,.2);
      const heal=P.maxhp*.03;if(!P.dead&&dP<260&&P.hp<P.maxhp){P.hp=Math.min(P.maxhp,P.hp+heal);textFx(P.x,P.y-70,`+${Math.round(heal)}`,'#7dffb0');}
      for(const o of mates)if(o.down<=0&&Math.hypot(o.x-m.x,o.y-m.y)<260)o.hp=Math.min(o.maxhp,o.hp+o.maxhp*.06);}
  }
}
/* 그리기: 동료마다 자기 스킨, 머리 위에 이름·체력, 발밑에 맡은 역할 색 고리 */
function drawMate(m){
  const x=m.x,y=m.y;ctx.fillStyle='rgba(8,8,20,.4)';ell(ctx,x,y+2,13,5);ctx.fill();
  ctx.lineWidth=2;ctx.strokeStyle=m.D.col;ctx.globalAlpha=.55;ell(ctx,x,y+2,17,6.5);ctx.stroke();ctx.globalAlpha=1;
  if(m.down>0){ctx.save();ctx.translate(x,y);ctx.rotate(-1.3);ctx.globalAlpha=.55;drawHero(ctx,{t:0,move:false,swing:-1,im:m.im});ctx.restore();ctx.globalAlpha=1;
    const q=1-m.down/12;ctx.lineWidth=3;ctx.strokeStyle=m.D.col;ctx.beginPath();ctx.arc(x,y-46,10,-Math.PI/2,-Math.PI/2+q*TAU);ctx.stroke();return;}
  if(m.inv>0&&m.hurtT>0&&(clock*22|0)%2===0)return;
  ctx.save();ctx.translate(x,y);ctx.scale(m.dir*.92,.92);drawHero(ctx,{t:m.t,move:m.move,swing:m.swing,im:m.im});ctx.restore();
  const w=34,hy=y-68;rr(ctx,x-w/2,hy,w,5,2.5);ctx.fillStyle='rgba(6,8,20,.75)';ctx.fill();rr(ctx,x-w/2+1,hy+1,Math.max(1,(w-2)*m.hp/m.maxhp),3,1.5);ctx.fillStyle=m.D.col;ctx.fill();
  ctx.font='800 11px "Pretendard Variable",Pretendard,"Noto Sans KR",sans-serif';ctx.textAlign='center';ctx.textBaseline='bottom';ctx.lineWidth=3;ctx.strokeStyle=INK;ctx.strokeText(m.name,x,hy-2);ctx.fillStyle='#fff';ctx.fillText(m.name,x,hy-2);
  lights.push([x,y-22,120,.55]);
}
/* ───── 거점 출발 창: 영겁의 굴레에서만 '함께하기' ───── */
function matesLobbyInit(){const box=$('mateSeg');if(!box)return;
  ['혼자 하기','함께하기 (4인)'].forEach((t,i)=>{const b=el('button',null,t);b.type='button';b.id='mate-'+i;b.addEventListener('click',()=>{SFX.ui();SAVE.party=i;saveNow();matesLobbyRefresh();});box.append(b);});}
function matesLobbyRefresh(){const on=typeof riftSel!=='undefined'&&riftSel&&riftOpen();for(const id of['mateLab','mateSeg','mateSub'])show(id,on);if(!on)return;
  const p=partyOn();for(let i=0;i<2;i++){const b=$('mate-'+i);if(b)b.setAttribute('aria-pressed',(i===1)===p);}
  $('mateSub').textContent=p?'출발하면 10초 동안 같이 할 사람을 찾습니다. 빈자리는 다른 모험가(AI)가 들어옵니다. 1명당 적 체력 +30%.':'혼자 굴레에 들어갑니다.';}
/* ───── 매칭 화면: 10초 동안 찾고, 빈자리는 AI가 차례로 합류 ───── */
let matchT=null;
function matchWanted(){return typeof riftSel!=='undefined'&&riftSel&&riftOpen()&&partyOn();}
function openMatch(go){
  const used=new Set(),seeds=[0,1,2].map(i=>makeMateSeed(i,used)),joinAt=[rand(4,6.5),rand(6.5,8.5),rand(8.5,9.8)].sort((a,b)=>a-b),slots=$('matchSlots');
  slots.innerHTML='';const me=SKIN[typeof skinCur==='function'?skinCur():'base'];
  const slot=(img,name,st,cls)=>{const s=el('div','mslot'+(cls?' '+cls:''));const im=el('img');if(img)im.src=img;s.append(im,el('b',null,name),el('small',null,st));slots.append(s);return s;};
  slot(me.img,(typeof rankMe!=='undefined'&&rankMe&&rankMe.name)||'나','준비 완료','me');const empty=seeds.map(()=>slot('','찾는 중…','','wait'));
  let t=0,joined=0;show('lobby',false);show('match',true);$('matchCount').textContent='10';
  const fill=(i)=>{const s=seeds[i],e=empty[i];e.className='mslot join';e.querySelector('img').src=SKIN[s.skin].img;e.querySelector('b').textContent=s.name;e.querySelector('small').textContent=`${s.D.role} · 합류`;SFX.ui();};
  const finish=()=>{clearInterval(matchT);matchT=null;while(joined<3)fill(joined++);pendingParty=seeds;setTimeout(()=>{show('match',false);go();},700);};
  clearInterval(matchT);matchT=setInterval(()=>{t+=.1;$('matchCount').textContent=Math.max(0,Math.ceil(10-t));while(joined<3&&t>=joinAt[joined])fill(joined++);if(t>=10)finish();},100);
  $('matchNow').onclick=()=>{SFX.ui();finish();};
  $('matchCancel').onclick=()=>{SFX.ui();clearInterval(matchT);matchT=null;pendingParty=null;show('match',false);show('lobby',true);};
}
