'use strict';
/* 다크 드웰러 — 무협 장비(11-15 대표님 "동양 무협 아이템, 화산신검·장삼풍의 도포·천마신검처럼, 디자인은 새로, 피해만 올리는 것 말고 기능을").
   그림은 img/gear2.png(그림 번호 100+). 고유 효과는 싸움 방식을 바꾸는 것 위주: 주기 기술, 무적, 경직, 피해 흘리기, 쿨타임 되돌리기. */

/* ───── 장비 표에 더하기 ───── */
const WUX_MYTH={
  weapon:[{n:'화산신검',i:0,m:'iron',l:['dmg','crit','aspd','area','critd'],fx:'plum',art:100},{n:'천마신검',i:0,m:'iron',l:['dmg','critd','hp','crit','aspd'],fx:'tianmo',art:101}],
  armor:[{n:'장삼풍의 도포',i:0,m:'leather',l:['def','hp','mres','regen','cdr'],fx:'taiji',art:102}],
  glove:[{n:'항룡십팔장 금수갑',i:1,m:'gold',l:['aspd','dmg','critd','area','hp'],fx:'dragonPalm',art:103}],
  boots:[{n:'능파미보 비단신',i:0,m:'leather',l:['move','aspd','pick','cdr','crit'],fx:'lingbo',art:104}],
  amulet:[{n:'소림 백팔염주',i:0,m:'wood',l:['luck','hp','def','regen','mres'],fx:'shaolin',art:105}],
  ear:[{n:'사자후 금귀걸이',i:0,m:'gold',l:['crit','critd','hp','area','cdr'],fx:'lionRoar',art:106}],
  ring:[{n:'점혈 옥반지',i:1,m:'leather',l:['critd','crit','dmg','aspd','cdr'],fx:'acupoint',art:107}],
  helm:[{n:'무당 진무관',i:1,m:'leather',l:['hp','cdr','mres','regen','dmg'],fx:'wudang',art:108}],
};
const WUX_LEG={
  weapon:[{n:'의천검',b:0,fx:'yicheon',art:109},{n:'도룡도',b:1,fx:'dragon',art:110},{n:'개방 타구봉',b:2,fx:'dagu',art:111}],
  armor:[{n:'금종조 가사',b:2,fx:'goldbell',art:112},{n:'천마 혈의',b:0,fx:'bloodRobe',art:113}],
  belt:[{n:'북명신공 요대',b:0,fx:'beiming',art:114}],
  ring:[{n:'독고구검 은반지',b:2,fx:'dugu',art:115}],
  ear:[{n:'매화 귀걸이',b:1,fx:'plumEar',art:116}],
  helm:[{n:'아미 연화 비녀',b:0,fx:'emei',art:117}],
};
for(const t in WUX_MYTH)for(const d of WUX_MYTH[t]){GEAR_ART_MYTH[t]=GEAR_ART_MYTH[t]||[];GEAR_ART_MYTH[t][MYTHS[t].length]=d.art;MYTHS[t].push(d);}
for(const t in WUX_LEG)for(const d of WUX_LEG[t]){GEAR_ART_LEG[t]=GEAR_ART_LEG[t]||{};GEAR_ART_LEG[t][LEGENDS[t].length]=d.art;LEGENDS[t].push(d);}
Object.assign(FXS,{
  plum:'이십사수 매화검법: 5초마다 매화 꽃잎이 둘레로 흩날리며 닿는 적을 베고 느리게 함',
  tianmo:'천마군림: 처치할 때마다 마기가 쌓여 100이 되면 8초 동안 천마강림(피해 +60%, 받는 피해 -30%)',
  taiji:'태극: 받는 피해의 35%를 흘려 3초에 걸쳐 나눠 받고, 맞을 때 둘레 적을 둥글게 밀어냄',
  dragonPalm:'항룡유회: 8초마다 가까운 적 쪽으로 금빛 용의 장풍이 관통하며 크게 밀어냄',
  lingbo:'능파미보: 움직이는 동안 30% 확률로 피해를 피하고, 피하면 잔상이 둘레 적을 벰',
  shaolin:'금강불괴: 108마리 처치마다 5초 동안 무적, 둘레에 금빛 파동',
  lionRoar:'사자후: 12초마다 둘레 적을 1.5초 기절(보스 제외)',
  acupoint:'점혈: 맞힌 적을 6% 확률로 2초 동안 멈추고, 멈춘 적이 받는 피해 +30%',
  wudang:'무당심법: 쿨타임 -10%, 스킬을 쓸 때 8% 확률로 쿨타임이 바로 돌아옴',
  yicheon:'의천: 적의 방어·마법 저항을 절반 무시',
  dragon:'도룡: 정예·보스에게 피해 +40%, 정예를 맞히면 잠깐 경직',
  dagu:'타구봉법: 맞힌 적을 8% 확률로 넘어뜨려 1초 기절시키고 밀어냄',
  goldbell:'금종조: 체력이 절반 아래로 떨어지면 3초 동안 무적(30초에 한 번)',
  bloodRobe:'혈마공: 잃은 체력만큼 피해가 오름(체력이 바닥이면 최대 +80%)',
  beiming:'흡성대법: 처치할 때 그 적 최대 체력의 1%만큼 회복(한 번에 최대 체력의 2%까지), 경험치 +10%',
  dugu:'독고구검: 치명타가 날 때마다 모든 스킬 쿨타임 0.25초 감소',
  plumEar:'매화낙영: 처치할 때 25% 확률로 꽃잎이 터져 둘레 적에게 피해',
  emei:'아미심공: 체력 30% 아래에서 받는 피해 -20%, 체력 재생 3배',
});

/* ───── 효과 상태 ───── */
let WX={plumT:5,palmT:4,roarT:6,mag:0,tmT:0,taiji:0,shao:0,bellCd:0};
function wuxReset(){WX={plumT:5,palmT:4,roarT:6,mag:0,tmT:0,taiji:0,shao:0,bellCd:0};}
function wuxRecalc(s,fx){if(fx.wudang)s.cdr+=10*fx.wudang;if(fx.beiming)s.xp+=10*fx.beiming;}
/* 피해 배율 */
function wuxDmg(e){let m=1;
  if(WX.tmT>0)m*=1.6;
  if(FX.dragon&&e.elite)m*=1+.4*FX.dragon;
  if(e.acuT&&clock<e.acuT)m*=1.3;
  if(FX.bloodRobe)m*=1+.8*Math.min(1,FX.bloodRobe)*(1-P.hp/P.maxhp);
  return m;}
const wuxTaken=()=>(WX.tmT>0?.7:1)*(FX.emei&&P.hp<P.maxhp*.3?.8:1);
function wuxHit(e){
  if(e.dead)return;
  if(FX.acupoint&&!e.boss&&Math.random()<.06*FX.acupoint){e.stun=Math.max(e.stun,2);e.acuT=clock+2;reactFx(e,'점혈','#9fe8c8');}
  if(FX.dagu&&!e.boss&&Math.random()<.08*FX.dagu){e.stun=Math.max(e.stun,1);const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy)||1;e.kx+=dx/d*380*e.T.kb;e.ky+=dy/d*380*e.T.kb;reactFx(e,'타구','#9cd16a');}
  if(FX.dragon&&e.elite&&!e.boss&&can('drg',900)){e.stun=Math.max(e.stun,.35);}
}
function wuxCrit(){if(!FX.dugu||!can('dugu',120))return;for(const k in P.cds)P.cds[k]=Math.max(.05,P.cds[k]-.25*FX.dugu);}
function wuxKill(e){
  if(FX.tianmo&&WX.tmT<=0){WX.mag++;if(WX.mag>=100){WX.mag=0;WX.tmT=8;uiBanner('천마강림');SFX.elite();shake(.3);ring(P.x,P.y-20,20,700,'#b678ff');flash(P.x,P.y-20,520,.4);}}
  if(FX.beiming&&!P.dead)P.hp=Math.min(P.maxhp,P.hp+Math.min(P.maxhp*.02,e.maxhp*.01));
  if(FX.shaolin){WX.shao++;if(WX.shao>=108){WX.shao=0;P.inv=Math.max(P.inv,5);uiBanner('금강불괴');SFX.level();wuxWave(P.x,P.y,220,procDmg(60),'#ffd56a');}}
  if(FX.plumEar&&Math.random()<.25*FX.plumEar&&can('pe',150)){const x=e.x,y=e.y;later(.03,()=>wuxPetals(x,y,80,procDmg(22),6));}
}
/* 받는 피해를 바꿀 때(태극 흘리기·금종조). 돌려주는 값이 실제로 깎이는 피해 */
function wuxHurt(d){
  if(FX.goldbell&&WX.bellCd<=0&&P.hp-d<P.maxhp*.5){WX.bellCd=30;P.inv=3;uiBanner('금종조');SFX.wave();ring(P.x,P.y-20,16,520,'#ffd56a');flash(P.x,P.y-20,300,.3);return 0;}
  if(FX.taiji){const s=d*.35;WX.taiji+=s;d-=s;
    for(const e of enemies){if(e.dead||e.boss)continue;const dx=e.x-P.x,dy=e.y-P.y,dd=Math.hypot(dx,dy)||1;if(dd<130+e.r){const tx=-dy/dd,ty=dx/dd;e.kx+=(dx/dd*.7+tx*.7)*420*e.T.kb;e.ky+=(dy/dd*.7+ty*.7)*420*e.T.kb;}}
    if(can('tj',400))ring(P.x,P.y-20,14,340,'#e9e4f5');}
  return d;}
/* 능파미보: 움직이는 동안 회피 */
function wuxBlock(){if(FX.lingbo&&P.move&&Math.random()<Math.min(.5,.3*FX.lingbo)){textFx(P.x,P.y-66,'능파미보','#9fd8ff');P.inv=.3;
  for(const e of enemies){if(e.dead)continue;const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy);if(d<110+e.r)hitEnemy(e,procDmg(30),dx/(d||1),dy/(d||1),200,'cut',true);}
  slashes.push({x:P.x,y:P.y-20,a:Math.random()*TAU,R:90,life:.22,max:.22});return true;}return false;}
function wuxTick(dt){
  if(WX.tmT>0)WX.tmT-=dt;if(WX.bellCd>0)WX.bellCd-=dt;
  if(WX.taiji>0){const t=Math.min(WX.taiji,WX.taiji*dt/1.5+dt*2);WX.taiji-=t;P.hp-=t;if(P.hp<=1){P.hp=1;WX.taiji=0;}}
  if(FX.emei&&P.hp<P.maxhp*.3)P.hp=Math.min(P.maxhp,P.hp+ST.regen*2*dt);
  if(P.dead)return;
  if(FX.plum){WX.plumT-=dt;if(WX.plumT<=0){WX.plumT=5;wuxPetals(P.x,P.y,190*AREA,procDmg(34)*FX.plum,24,true);}}
  if(FX.dragonPalm){WX.palmT-=dt;if(WX.palmT<=0)WX.palmT=dragonPalm()?8:.5;}
  if(FX.lionRoar){WX.roarT-=dt;if(WX.roarT<=0){WX.roarT=12;let n=0;for(const e of enemies){if(e.dead||e.boss)continue;if(Math.hypot(e.x-P.x,e.y-P.y)<260+e.r){e.stun=Math.max(e.stun,1.5);n++;}}
    ring(P.x,P.y-20,20,780,'#ffd56a');ring(P.x,P.y-20,10,520,'#fff0c2');textFx(P.x,P.y-80,'사자후','#ffd56a');shake(.15);SFX.horn();}}
}
/* 매화 꽃잎: 둘레로 퍼지며 벤다 */
function wuxPetals(x,y,R,dmg,n,big){
  for(const e of enemies){if(e.dead)continue;const dx=e.x-x,dy=e.y-y,d=Math.hypot(dx,dy);if(d<R+e.r){hitEnemy(e,dmg,dx/(d||1),dy/(d||1),120,'cut',!big);e.slow=Math.max(e.slow,1);}}
  for(let i=0;i<n;i++){const a=i/n*TAU+Math.random()*.3,v=rand(.6,1)*R*2.4;addP({k:'ember',x:x+Math.cos(a)*14,y:y-20+Math.sin(a)*10,vx:Math.cos(a)*v,vy:Math.sin(a)*v*.7,size:rand(2.6,4.2),life:.45,max:.45,col:i%3?'#ffb7d0':'#ff7fae'});}
  ring(x,y,10,R*2.6,'#ffb7d0');if(big){flash(x,y-20,R*1.2,.16);if(can('plm',300))SFX.spear();}}
function wuxWave(x,y,R,dmg,col){for(const e of enemies){if(e.dead)continue;const dx=e.x-x,dy=e.y-y,d=Math.hypot(dx,dy)||1;if(d<R+e.r){hitEnemy(e,dmg,dx/d,dy/d,520,'light');}}ring(x,y,20,R*3,col);flash(x,y-20,R*1.4,.3);}
/* 항룡유회: 가까운 적 쪽으로 금빛 장풍이 일직선으로 */
function dragonPalm(){const t=nearest(P.x,P.y,560);if(!t)return false;const a=Math.atan2(t.y-P.y,t.x-P.x),dmg=procDmg(80)*FX.dragonPalm,hit=new Set();
  for(let i=1;i<=8;i++){const x=P.x+Math.cos(a)*i*80,y=P.y+Math.sin(a)*i*80;later(i*.04,()=>{
    for(const e of enemies){if(e.dead||hit.has(e))continue;const dx=e.x-x,dy=e.y-y,d=Math.hypot(dx,dy);if(d<62*AREA+e.r){hit.add(e);hitEnemy(e,dmg,Math.cos(a),Math.sin(a),720,'thud',false,true);}}
    starFx(x,y-20,30,'#ffd56a');ring(x,y,8,240,'#ffd56a');flash(x,y,150,.12);});}
  textFx(P.x,P.y-80,'항룡유회','#ffd56a');SFX.boom();return true;}
/* 그리기: 천마강림 기운, 마기 수 */
function wuxFx(){if(state!=='play'||P.dead)return;
  if(WX.tmT>0){ctx.lineWidth=4;ctx.strokeStyle=`rgba(182,120,255,${.5+.3*Math.sin(clock*8)})`;ctx.beginPath();ctx.ellipse(P.x,P.y-22,30,36,0,0,TAU);ctx.stroke();lights.push([P.x,P.y-30,140,.6]);if(Math.random()<.4)addP({k:'ember',x:P.x+rand(-16,16),y:P.y-rand(0,50),vx:0,vy:-60,size:rand(1.6,3),life:.5,max:.5,col:'#b678ff'});}
  if(FX.tianmo&&WX.tmT<=0&&WX.mag>0){ctx.font='700 11px "Jua","Malgun Gothic",sans-serif';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle=INK;const t=`마기 ${WX.mag}`;ctx.strokeText(t,P.x,P.y-74);ctx.fillStyle='#c9a0ff';ctx.fillText(t,P.x,P.y-74);}}
