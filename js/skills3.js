'use strict';
/* 다크 드웰러 — 스킬 다듬기(11-15 대표님 "필요 없는 게 많아, 이름을 무기처럼 신·무협으로, 번개 번지는 건 토르의 절규·제우스의 천뇌,
   물리는 무협풍 이기어검·태극권·금강불괴, 이펙트와 효과에 특성이 있게, 꼼꼼하게").
   32종 → 기본 15종 + 조합 9종. 겹치던 것(독 장판 둘, 정령 셋, 해골 병사, 칼날 고리류)은 빼고, 남긴 것은 이름·설명·계열·고유 동작을 새로 입힌다.
   아이콘은 img/skillsB.png(ui.js SKB_ORDER). 안쪽 이름(slash, blade …)은 장비 효과와 엮여 있어 그대로 두고 보이는 것만 바꾼다. */

/* ───── 빼는 스킬 ───── */
for(const k of['cloud','drain','sfire','sice','szap','skel','saw','tring','frost','plasma'])delete ACTIVES[k];

/* ───── 새 스킬: 금강불괴(무공) ───── */
ACTIVES.golden={cd:9,
  ups:[['지속 +0.5초',{life:.5}],['풀릴 때 파동 피해 +40%',{dmg:.4}],['쿨타임 -15%',{cd:.15}],['풀릴 때 체력 8% 회복',{heal:1}],['파동 범위 +25%',{area:.25}],['지속 +0.5초',{life:.5}],['쿨타임 -15%',{cd:.15}],['피해 +30%',{dmg:.3}]],
  fire(p){if(!nearest(P.x,P.y,240))return false;P.goldT=2.5+(p.life||0);P.goldMax=P.goldT;P.goldSrc='golden';
    textFx(P.x,P.y-84,'금강불괴','#ffd56a');ring(P.x,P.y-20,14,420,'#ffd56a');flash(P.x,P.y-20,240,.25);SFX.wave();return true;}};
/* 조합: 태극무극(태극권 + 금강불괴) */
ACTIVES.taiji={fuse:['wave','golden'],cd:10,
  ups:[['피해 +20%',{dmg:.2}],['범위 +20%',{area:.2}],['지속 +1초',{life:1}],['쿨타임 -15%',{cd:.15}],['피해 +25%',{dmg:.25}]],
  fire(p){if(!nearest(P.x,P.y,300))return false;const life=3+(p.life||0);taijis.push({x:P.x,y:P.y,R:230*p.area*AREA,life,max:life,tick:0,dmg:14*p.dmg,big:70*p.dmg,a:0});
    P.goldT=Math.max(P.goldT||0,life);P.goldMax=life;P.goldSrc='taiji';textFx(P.x,P.y-84,'태극무극','#f3ead2');SFX.wave();SFX.elite();return true;}};

/* ───── 이름 · 계열 · 설명 ───── */
const SK_NEW={
  slash:['청풍검법','무공','맑은 바람 같은 검기로 가까운 적을 넓게 벱니다.'],
  blade:['이기어검','무공','기로 부리는 검이 몸 둘레를 돌다가, 때때로 가까운 적에게 날아가 꿰뚫습니다.'],
  axe:['천수비도','무공','비도를 부채꼴로 던집니다. 날아갔다 돌아오며 길 위의 적을 벱니다.'],
  wave:['태극권','무공','태극의 기운을 퍼뜨려 적을 밀쳐내고 느리게 하며, 날아오는 마법 구슬을 지웁니다.'],
  golden:['금강불괴','무공','몸이 금빛 종에 싸여 잠깐 어떤 공격도 받지 않고 닿는 적을 튕겨 냅니다. 풀릴 때 금빛 파동이 퍼집니다.'],
  clone:['환영분신술','무공','환영 분신이 따라다니며, 내가 청풍검법으로 벨 때 함께 벱니다.'],
  bolt:['프로메테우스의 불씨','화염','신에게서 훔친 불씨를 쏩니다. 적을 따라가 터집니다.'],
  meteor:['수르트의 업화','화염','불의 거인 수르트의 업화가 적이 있는 자리에 떨어집니다.'],
  zap:['토르의 절규','번개','묠니르가 울부짖으며 번개가 적에서 적으로 번집니다.'],
  strike:['제우스의 천뇌','번개','하늘에서 금빛 벼락이 무작위 적에게 떨어집니다.'],
  spear:['스카디의 빙창','냉기','겨울 여신의 얼음 창이 일직선으로 꿰뚫고 적을 느리게 만듭니다.'],
  blizz:['보레아스의 눈보라','냉기','북풍의 신이 적이 몰린 곳에 눈보라를 일으켜 느리게 하고 계속 피해를 줍니다.'],
  vine:['가이아의 가시덩굴','자연','대지의 여신이 가시덩굴을 깔아 계속 피해를 주고 발을 느리게 합니다.'],
  dark:['하데스의 명계구','암흑','명계의 구체가 천천히 나아가며 꿰뚫고, 닿은 적의 생명을 조금씩 빨아들입니다.'],
  reaper:['타나토스의 낫','소환','죽음의 신 타나토스가 곁에서 큰 낫을 휘두릅니다. 체력이 20% 아래인 적은 바로 처형합니다.'],
  storm:['만검귀종','무공','만 자루의 검이 소용돌이치며 퍼져 나가 닿는 모든 적을 벱니다.'],
  legion:['분광검영','무공','빛을 가르는 환영 분신 셋이 따라다니며 스스로 회전 베기를 하고 비도를 던집니다.'],
  taiji:['태극무극','무공','발밑에 거대한 태극이 돌며 그 안에서는 어떤 공격도 받지 않습니다. 적은 소용돌이에 끌려들며 갈리고, 끝날 때 크게 터지며 멈춥니다.'],
  shower:['라그나로크','화염','세상의 끝, 불타는 운석이 연달아 쏟아져 불바다를 만듭니다.'],
  smite:['묠니르 강림','번개','하늘에서 묠니르가 내리꽂히고 그 자리에서 번개가 사방으로 번집니다.'],
  zero:['니플헤임','냉기','얼음 세계의 냉기로 주위의 모든 적을 한꺼번에 얼리고 부숩니다.'],
  harvest:['하데스의 영혼 수확','암흑','명계의 사신이 곁에서 싸우고, 처치할 때마다 영혼을 거둬 체력을 채우며 가끔 그 자리에 낫이 떨어집니다.'],
  miasma:['스틱스의 독안개','자연','저승의 강 스틱스의 독안개가 몸 둘레에 퍼져 적을 좀먹고 체력을 빨아들입니다.'],
  sun:['라의 심판','화염','태양신 라의 원반이 머리 위에 떠올랐다가 터지며 벼락이 쏟아집니다.'],
};
for(const k in SK_NEW){const A=ACTIVES[k];if(!A)continue;[A.n,A.el,A.d]=SK_NEW[k];}
/* 조합 재료(빠진 재료를 새 짝으로) */
ACTIVES.legion.fuse=['clone','axe'];ACTIVES.harvest.fuse=['dark','reaper'];ACTIVES.miasma.fuse=['vine','dark'];
/* 단계 옵션 다듬기 */
ACTIVES.blade.ups=[['+1자루',{count:1}],['날아가는 검 +1자루',{fly:1}],['회전 +40%',{spin:.4}],['피해 +25%',{dmg:.25}],['안쪽에 궤도가 하나 더 생깁니다',{ring2:1}],['+1자루',{count:1}],['날아가는 검 +1자루',{fly:1}],['피해 +30%',{dmg:.3}]];
ACTIVES.axe.ups=[['끝에서 0.6초 맴돌며 벱니다',{hover:1}],['+1자루',{count:1}],['큰 비도: 크기 +40%',{big:.4}],['피해 +25%',{dmg:.25}],['+1자루',{count:1}],['+1자루',{count:1}],['피해 +30%',{dmg:.3}],['쿨타임 -20%',{cd:.2}]];
ACTIVES.zap.ups[4]=['묠니르: 마지막 적에게 벼락이 떨어집니다',{thunder:1}];
ACTIVES.dark.ups=[['끌어당김: 지나가며 둘레 적을 끌어당깁니다',{pull:1}],['+1개',{count:1}],['끝에서 터집니다',{burst:1}],['피해 +25%',{dmg:.25}],['생명 흡수 2배',{leech:1}],['크기 +30%',{big:.3}],['+1개',{count:1}],['피해 +30%',{dmg:.3}]];
ACTIVES.wave.ups[4]=['퍼질 때마다 체력을 3% 채웁니다',{heal:1}];

/* ───── 고유 동작 ───── */
let taijis=[],hammers=[];
/* 이기어검: 도는 검이 2.2초마다 가까운 적에게 날아가 꿰뚫는다 */
{const bt=ACTIVES.blade.tick;ACTIVES.blade.tick=function(dt,p){bt(dt,p);P.flyT=(P.flyT||0)-dt;if(P.flyT>0)return;const t=nearest(P.x,P.y,400);if(!t){P.flyT=.3;return;}P.flyT=2.2;
  const n=Math.min(blades.length,1+(p.fly||0));for(let i=0;i<n;i++){const b=blades[i],a=Math.atan2(t.y-12-b.y,t.x-b.x)+(i-(n-1)/2)*.14;
    shots.push({k:'jian',x:b.x,y:b.y,vx:Math.cos(a)*720,vy:Math.sin(a)*720,a,life:.6,dmg:30*p.dmg,r:14,hit:new Set()});}SFX.spear();};}
/* 토르의 절규: 첫 적에게 묠니르가 꽂힌다 */
{const zf=ACTIVES.zap.fire;ACTIVES.zap.fire=function(p){const t=nearest(P.x,P.y,440),ok=zf(p);if(ok&&t)hammerAt(t.x,t.y,.7);return ok;};}
/* 하데스의 명계구: 닿은 적의 생명을 빨아들인다 */
{const df=ACTIVES.dark.fire;ACTIVES.dark.fire=function(p){const n0=darks.length,ok=df(p);for(let i=n0;i<darks.length;i++)darks[i].leech=1+(p.leech||0);return ok;};}
function hammerAt(x,y,sc){hammers.push({x,y,t:0,sc:sc||1});}
/* 금강불괴·태극무극 동안은 어떤 피해도 받지 않는다 */
function goldBlock(){if(!(P.goldT>0))return false;if(can('gbk',500))textFx(P.x,P.y-70,P.goldSrc==='taiji'?'무극':'금강','#ffd56a');P.inv=.2;return true;}
function goldBurst(p){const R=150*p.area*AREA;for(const e of enemies){if(e.dead)continue;const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy)||1;if(d<R+e.r)hitEnemy(e,40*p.dmg,dx/d,dy/d,520,'light',false,true);}
  ring(P.x,P.y,20,R*3,'#ffd56a');ring(P.x,P.y,10,R*2,'#fff0c2');flash(P.x,P.y-20,R*1.4,.3);shake(.15);SFX.boom();if(p.heal&&!P.dead)P.hp=Math.min(P.maxhp,P.hp+P.maxhp*.08);}
function skill3Reset(){taijis=[];hammers=[];P.goldT=0;P.flyT=0;P.goldSrc=null;}
function skill3Update(dt){
  for(const h of hammers)h.t+=dt;hammers=hammers.filter(h=>h.t<.5);
  if(P.goldT>0){P.goldT-=dt;
    if(P.goldSrc==='golden'){const p=P.pk.golden;if(p)for(const e of enemies){if(e.dead)continue;const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy)||1;if(d<e.r+44&&!(e.gbT>clock)){e.gbT=clock+.4;hitEnemy(e,10*p.dmg,dx/d,dy/d,480,'thud',true);}}
      if(P.goldT<=0&&P.pk.golden)goldBurst(P.pk.golden);}}
  for(const t of taijis){t.life-=dt;t.x=P.x;t.y=P.y;t.a+=dt*2.4;t.tick-=dt;
    for(const s of eshots)if(Math.hypot(s.x-t.x,(s.y-t.y)*1.5)<t.R)s.life=0;
    if(t.tick<=0){t.tick=.35;for(const e of enemies){if(e.dead)continue;const dx=e.x-t.x,dy=e.y-t.y,d=Math.hypot(dx,dy)||1;if(d<t.R+e.r){const kb=e.T.kb||1;e.kx+=(-dy/d*.8-dx/d*.45)*280*kb;e.ky+=(dx/d*.8-dy/d*.45)*280*kb;e.slow=Math.max(e.slow,.5);hitEnemy(e,t.dmg,0,0,0,'thud',true,true);}}}
    if(t.life<=0){for(const e of enemies){if(e.dead)continue;const dx=e.x-t.x,dy=e.y-t.y,d=Math.hypot(dx,dy)||1;if(d<t.R*1.1+e.r){e.stun=Math.max(e.stun,1.2);hitEnemy(e,t.big,dx/d,dy/d,520,'light',false,true);}}
      ring(t.x,t.y,30,t.R*3.2,'#f3ead2');ring(t.x,t.y,16,t.R*2.2,'#1b1830');flash(t.x,t.y-20,t.R*1.6,.35);shake(.25);SFX.boom();}}
  taijis=taijis.filter(t=>t.life>0);
}

/* ───── 그리기 ───── */
/* 태극 원반(땅에 납작하게) */
function taijiDisc(x,y,R,rot,al){if(R<6||al<=0)return;ctx.save();ctx.translate(x,y);ctx.scale(1,.66);ctx.rotate(rot);ctx.globalAlpha=al;
  ctx.beginPath();ctx.arc(0,0,R,0,TAU);ctx.fillStyle='#f3ead2';ctx.fill();
  ctx.beginPath();ctx.arc(0,0,R,-Math.PI/2,Math.PI/2);ctx.arc(0,R/2,R/2,Math.PI/2,-Math.PI/2,false);ctx.arc(0,-R/2,R/2,Math.PI/2,-Math.PI/2,true);ctx.closePath();ctx.fillStyle='#1b1830';ctx.fill();
  ctx.fillStyle='#1b1830';ctx.beginPath();ctx.arc(0,-R/2,R*.13,0,TAU);ctx.fill();ctx.fillStyle='#f3ead2';ctx.beginPath();ctx.arc(0,R/2,R*.13,0,TAU);ctx.fill();
  ctx.lineWidth=Math.max(3,R*.03);ctx.strokeStyle=INK;ctx.beginPath();ctx.arc(0,0,R,0,TAU);ctx.stroke();ctx.restore();ctx.globalAlpha=1;}
function skill3Ground(){for(const t of taijis){const q=Math.min(1,(t.max-t.life)/.25),f=Math.min(1,t.life/.3);taijiDisc(t.x,t.y,t.R*q,t.a,.52*f);
  ctx.lineWidth=4;ctx.strokeStyle=`rgba(255,214,106,${.5*f})`;ctx.beginPath();ctx.ellipse(t.x,t.y,t.R*q*1.04,t.R*q*.69,0,0,TAU);ctx.stroke();lights.push([t.x,t.y,t.R*1.2,.6*f]);}}
/* 금강불괴: 몸을 감싼 금빛 종 */
function goldBell(){if(!(P.goldT>0)||P.goldSrc!=='golden'||P.dead)return;const x=P.x,y=P.y+4,w=30,h=64,f=Math.min(1,P.goldT/.3),pulse=1+.03*Math.sin(clock*12);
  ctx.save();ctx.translate(x,y);ctx.scale(pulse,pulse);ctx.globalAlpha=.85*f;ctx.beginPath();ctx.moveTo(-w-6,0);ctx.quadraticCurveTo(-w,-h*.35,-w*.72,-h*.75);ctx.quadraticCurveTo(-w*.55,-h,0,-h);ctx.quadraticCurveTo(w*.55,-h,w*.72,-h*.75);ctx.quadraticCurveTo(w,-h*.35,w+6,0);ctx.closePath();
  ctx.fillStyle='rgba(255,207,63,.22)';ctx.fill();ctx.lineWidth=5;ctx.strokeStyle=INK;ctx.stroke();ctx.lineWidth=3;ctx.strokeStyle='#ffd56a';ctx.stroke();
  ctx.lineWidth=2;ctx.strokeStyle='rgba(255,240,194,.8)';ctx.beginPath();ctx.moveTo(-w*.55,-h*.62);ctx.quadraticCurveTo(-w*.3,-h*.85,0,-h*.86);ctx.stroke();ctx.beginPath();ctx.ellipse(0,-h-4,6,5,0,0,TAU);ctx.stroke();ctx.restore();ctx.globalAlpha=1;
  lights.push([x,y-30,150,.8]);}
/* 묠니르: 위에서 내리꽂히는 망치 */
const sprHammer=makeSprite(60,70,30,60,g=>{rr(g,-3,-38,6,40,2);inkF(g,'#8a5a2c',2.4);g.fillStyle='#e0524f';rr(g,-3,-6,6,6,1);g.fill();rr(g,-20,-56,40,22,5);inkF(g,'#9aa3bf',3);g.lineWidth=2;g.strokeStyle='#5fb6ff';g.beginPath();g.moveTo(-10,-51);g.lineTo(-4,-45);g.lineTo(-10,-39);g.moveTo(10,-51);g.lineTo(4,-45);g.lineTo(10,-39);g.stroke();});
function drawHammers(){for(const h of hammers){const drop=Math.max(0,1-h.t/.12),y=h.y-10-drop*160,a=h.t<.12?1:Math.max(0,1-(h.t-.12)/.38);ctx.globalAlpha=a;blitR(sprHammer,h.x,y,Math.PI,1.1*h.sc);ctx.globalAlpha=1;
  if(h.t>=.12&&!h.boom){h.boom=1;ring(h.x,h.y,14,360*h.sc,'#9fd8ff');starFx(h.x,h.y-16,40*h.sc,'#bfe9ff');flash(h.x,h.y,200*h.sc,.18);}lights.push([h.x,h.y-30,140,.7*a]);}}
function skill3Fx(){goldBell();drawHammers();}
function skill3Glow(){if(P.goldT>0&&P.goldSrc==='golden'&&!P.dead)glow(P.x,P.y-28,70,'rgb(255,207,63)',.45);for(const t of taijis)glow(t.x,t.y,t.R*.5,'rgb(255,240,200)',.18*Math.min(1,t.life/.3));
  for(const h of hammers)glow(h.x,h.y-20,50,'rgb(120,190,255)',.5*Math.max(0,1-h.t/.5));}
