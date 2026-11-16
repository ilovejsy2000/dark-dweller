'use strict';
/* 다크 드웰러 — 첫인상 다듬기(11-15 대표님 "전부 다 개선해줘", 루아가 5분 해 보고 찾은 것).
   시작 화면 · 첫 판 조작 안내 · 처음 세 판 보정 · 쓰러지는 연출 · 광고 보고 부활 · 다시 하기 · 결과 화면 · 특성 알림 */

/* ───── 시작 화면: 처음 켤 때 한 번. 누르면 동굴로 걸어 들어온다 ───── */
let titleOn=true;
function titleInit(){
  $('title').addEventListener('click',()=>{if(!titleOn)return;titleOn=false;soundOn();SFX.ui();show('title',false);hubArrive();});
}

/* ───── 첫 판 조작 안내: 끌어서 움직이기 ───── */
let tutT=0,tutX=0,tutY=0;
function pickReset(){picks=[];pickT=70;adaptReset();}
function tutStart(){if((SAVE.runs||0)>0)return;tutT=7;tutX=P.x;tutY=P.y;show('tut',true);}
function tutTick(dt){
  if(state==='play'&&!RUN.early&&runT>3&&!rift){RUN.early=1;const n=10,rad=230;for(let i=0;i<n;i++){const a=i/n*TAU;spawn('moss',{at:[P.x+Math.cos(a)*rad,P.y+Math.sin(a)*rad*.85]});}} // 3초: 첫 무리
  if(tutT<=0)return;tutT-=dt;if(tutT<=0||Math.hypot(P.x-tutX,P.y-tutY)>220){tutT=0;show('tut',false);}}

/* ───── 처음 세 판은 적이 약하고 정예가 늦게 나온다(새 사용자가 1분 만에 쓰러지지 않게) ───── */
/* 계정의 힘: 낀 장비(일반 1 · 레어 3 · 유니크 5.8 · 전설 9.2 · 신화 13) + 특성 단계 0.4씩. 50이면 보정 없음(4회차: 낮은 등급 몇 개로 보정이 꺼지던 것) */
function accountPower(){let p=0;for(const[sk]of EQUIP_SLOTS){const it=SAVE.equip[sk];if(it)p+=Math.pow(it.gi+1,1.6);}for(const k in(SAVE.tal||{}))p+=.4*SAVE.tal[k];return p;}
function newbieEase(){if(RUN.daily)return;const pk=clamp(accountPower()/50,0,1),vet=Object.values(SAVE.best||{}).some(b=>b&&(b.win||b.t>=300)),k=vet?pk:Math.min(pk,clamp((SAVE.runs||0)/5,0,1));if(k>=1)return;
  RUN.edmg*=.45+.55*k;RUN.ehp*=.65+.35*k;nextElite=Math.max(nextElite,100-55*k);nextHorde=Math.max(nextHorde,170-80*k);RUN.newbie=k<.35;}

/* ───── 쓰러질 때: 천천히 쓰러지고 혼이 빠져나간다 ───── */
function drawHeroDeath(){if(!ending||ending.win||!P.deadT)return;const q=Math.min(1,(clock-P.deadT)/.6);
  ctx.save();ctx.translate(P.x,P.y);ctx.scale(P.dir,1);ctx.rotate(-q*1.35);ctx.globalAlpha=1-q*.55;drawHero(ctx,{t:0,move:false,swing:-1});ctx.restore();ctx.globalAlpha=1;
  const s=Math.min(1,(clock-P.deadT)/1.2),y=P.y-30-s*90;ctx.globalAlpha=(1-s)*.8;ell(ctx,P.x,y,9,12);ctx.fillStyle='#d8e8ff';ctx.fill();ell(ctx,P.x-3,y-2,1.6,2.2);ctx.fillStyle=INK;ctx.fill();ell(ctx,P.x+3,y-2,1.6,2.2);ctx.fill();ctx.globalAlpha=1;
  lights.push([P.x,y,90,.6*(1-s)]);}

/* ───── 광고 보고 부활(한 판에 한 번): 쓰러진 뒤 6초 안에 고른다 ───── */
let revT=null;
function reviveOffer(){
  if(!ending||ending.win||ending.asked||!P.dead||RUN.revived)return false;
  ending.asked=1;choosing=true;joy=null;let n=6;$('revCount').textContent=n;show('revive',true);
  clearInterval(revT);revT=setInterval(()=>{n--;$('revCount').textContent=Math.max(0,n);if(n<=0)reviveGiveUp();},1000);return true;}
function reviveClose(){clearInterval(revT);revT=null;show('revive',false);}
function reviveGiveUp(){if($('revive').hidden)return;reviveClose();choosing=false;finishRun();}
function reviveNow(){reviveClose();RUN.revived=1;P.dead=false;P.deadT=0;P.hp=P.maxhp*.6;P.inv=3;ending=null;choosing=false;eshots=[];warns=[];
  for(const e of enemies){const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy)||1;if(d<300&&!e.boss){e.kx+=dx/d*700*(e.T.kb||1);e.ky+=dy/d*700*(e.T.kb||1);e.stun=Math.max(e.stun,1);}}
  ring(P.x,P.y-20,20,800,'#ffe08a');ring(P.x,P.y-20,10,520,'#fff0c2');flash(P.x,P.y-20,600,.6);SFX.level();uiBanner('부활!');}
function reviveInit(){
  $('revAd').addEventListener('click',()=>{clearInterval(revT);SFX.ui();showRewardAd(reviveNow);});
  $('revNo').addEventListener('click',()=>{SFX.ui();reviveGiveUp();});
}

/* ───── 결과 화면: 숫자 카드 + 최고 기록 + 다시 하기 ───── */
function resultExtra(win){
  tutT=0;show('tut',false);
  const box=$('resStats');box.innerHTML='';
  const card=(label,val,cls)=>{const c=el('div','rstat'+(cls?' '+cls:''));c.append(el('small',null,label),el('b',null,val));box.append(c);return c;};
  card('버틴 시간',mmss(runT));card('처치',String(kills));card('레벨',String(P.level));
  const hard=hardRun(),sc=card(hard?'어둠 결정':'마력 가루','+0','shard');let v=0;const goal=(hard?RUN.shardGain:RUN.dustGain)||0,st=performance.now();
  const up=()=>{const q=Math.min(1,(performance.now()-st)/900);v=Math.round(goal*q*(2-q));sc.lastChild.textContent='+'+v;if(q<1)requestAnimationFrame(up);};requestAnimationFrame(up);
  $('resBest').hidden=!RUN.newBest;
  const can=TALENTS.some(t=>tal(t.id)<t.max&&(SAVE.shard||0)>=talCost(t));$('resTal').hidden=!can;
  if(win)SFX.win&&SFX.win();
}
function invExtraInit(){$('autoEq').addEventListener('click',()=>{const n=autoEquip();SFX.loot(n?3:1);renderInv();uiNote2(n?`${n}칸을 더 좋은 장비로 바꿨습니다.`:'이미 가장 좋은 장비를 끼고 있습니다.');});}
function resultInit(){invExtraInit();$('retryBtn').addEventListener('click',()=>{SFX.ui();uiStart();});}

/* ───── 특성을 올릴 수 있으면 제단 위에 느낌표 ───── */
const talReady=()=>TALENTS.some(t=>tal(t.id)<t.max&&(SAVE.shard||0)>=talCost(t));
function drawTalBadge(x,y){if(!talReady())return;const b=Math.sin(clock*5)*3;ell(ctx,x,y-118+b,11,11);inkF(ctx,'#ff5a6a',3);ctx.font='800 16px "Pretendard Variable",Pretendard,"Noto Sans KR","Malgun Gothic",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff';ctx.fillText('!',x,y-117+b);}

/* ───── 줍는 물건(1회차): 자석 = 화면의 경험치 보석을 모두 끌어옴, 찐빵 = 체력 30% 회복 ─────
   적을 피해 다니면 보석을 못 주워 레벨이 멈추던 것(보석 200개 넘게 쌓임)을 풀어 준다 */
let picks=[],pickT=70;
const sprMagnet=makeSprite(40,40,20,22,g=>{g.lineWidth=9;g.strokeStyle=INK;g.beginPath();g.arc(0,-2,11,Math.PI*.05,Math.PI*.95,true);g.stroke();g.lineWidth=5.5;g.strokeStyle='#e2504c';g.stroke();
  for(const s of[-1,1]){rr(g,s*11-4.5,-4,9,9,2);inkF(g,'#dfe6f5',2.4);}});
const sprBun=makeSprite(40,36,20,26,g=>{blob(g,[[-14,0],[-12,-10],[-4,-16],[6,-15],[13,-8],[14,0]]);inkF(g,'#fff3e8',2.6);g.lineWidth=1.6;g.strokeStyle='#d9c8b8';g.beginPath();g.moveTo(-4,-14);g.quadraticCurveTo(0,-9,4,-14);g.stroke();
  g.fillStyle='#ffb7a8';ell(g,-7,-5,2.4,1.6);g.fill();ell(g,7,-5,2.4,1.6);g.fill();});
function pickAdd(k,x,y){if(picks.length<12)picks.push({k,x,y,t:0});}
function pickOnKill(e){if(e.elite&&!e.boss)pickAdd('magnet',e.x+16,e.y);else if(e.champ&&Math.random()<.18)pickAdd(Math.random()<.5?'magnet':'bun',e.x,e.y);}
function pickTick(dt){if(state!=='play'||ending)return;
  pickT-=dt;if(pickT<=0){pickT=rand(60,85);const a=Math.random()*TAU;pickAdd(Math.random()<.6?'magnet':'bun',P.x+Math.cos(a)*230,P.y+Math.sin(a)*170);}
  for(const p of picks){p.t+=dt;keepIn(p,40);if(Math.hypot(P.x-p.x,P.y-p.y)<34&&!P.dead){p.dead=1;
    if(p.k==='magnet'){for(const g of gems)g.pull=g.pull||260;textFx(P.x,P.y-70,'자석!','#ffe08a');SFX.pick();ring(P.x,P.y-20,10,600,'#ffe08a');}
    else{P.hp=Math.min(P.maxhp,P.hp+P.maxhp*.3);textFx(P.x,P.y-70,'+체력','#8fe88f');SFX.level();ring(P.x,P.y-20,10,300,'#8fe88f');}}}
  picks=picks.filter(p=>!p.dead&&p.t<45);}
function pickFx(){if(state!=='play')return;for(const p of picks){const b=Math.sin(p.t*4)*3,f=p.t>40?((p.t*8|0)%2):1;if(!f)continue;ctx.fillStyle='rgba(8,8,20,.35)';ell(ctx,p.x,p.y+3,12,4);ctx.fill();
  blit(p.k==='magnet'?sprMagnet:sprBun,p.x,p.y-8-b,1,1);lights.push([p.x,p.y-10,70,.6]);}}

/* ───── 탄력 난이도(2회차): 최근 20초 처치 속도를 보고 새로 나오는 적의 체력을 0.3~1.8배로 맞춘다 ─────
   장비 없는 새 사용자가 6분쯤 피해가 적 체력을 못 따라가 경험치가 끊기던 벽(처치 4분에 41마리)을 풀고, 잘하는 사람은 더 단단한 적을 만난다.
   기대 처치 속도 = 2 + 0.35×분(마리/초). 영겁의 굴레는 단계 기록을 위해 쓰지 않는다 */
let ADAPT=1,adaptHist=[],adaptT=0;
function adaptReset(){ADAPT=1;adaptHist=[];adaptT=0;}
function adaptTick(dt){if(state!=='play'||ending||rift)return;adaptT-=dt;if(adaptT>0)return;adaptT=5;
  adaptHist.push({t:runT,k:kills});if(adaptHist.length>5)adaptHist.shift();if(runT<40||adaptHist.length<4)return;
  const h=adaptHist[0],rate=(kills-h.k)/Math.max(1,runT-h.t),want=2+.35*runT/60;
  if(rate<want*.6)ADAPT=Math.max(.3,ADAPT*.92);else if(rate>want*1.3)ADAPT=Math.min(1.8,ADAPT*1.05);}

/* ───── 좋은 장비 한 번에 끼기(3회차): 칸마다 창고에서 점수가 가장 높은 것을 낀다 ───── */
function bestFor(type){let b=null;for(const it of SAVE.stash)if(it.t===type&&(!b||itemScore(it)>itemScore(b)))b=it;return b;}
function autoEquip(){let n=0;for(const[sk,type]of EQUIP_SLOTS){const cur=SAVE.equip[sk],b=bestFor(type);if(b&&(!cur||itemScore(b)>itemScore(cur))){equipItem(b,sk);n++;}}return n;}
const gearUpgrade=()=>EQUIP_SLOTS.some(([sk,type])=>{const cur=SAVE.equip[sk],b=bestFor(type);return b&&(!cur||itemScore(b)>itemScore(cur));});
function drawStashBadge(x,y){if(!gearUpgrade())return;const b=Math.sin(clock*5+1)*3;ell(ctx,x,y-92+b,11,11);inkF(ctx,'#ff5a6a',3);ctx.font='800 16px "Pretendard Variable",Pretendard,"Noto Sans KR","Malgun Gothic",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff';ctx.fillText('!',x,y-91+b);}
