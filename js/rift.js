'use strict';
/* 다크 드웰러 — 영겁의 굴레(11-15 대표님 "디아블로 대균열 같은 걸, 사람들이 도전할 수 있게").
   심연을 끝까지 클리어하면 열린다. 단계를 골라 들어가 제한 시간 안에 적을 잡아 굴레 게이지를 채우면 '굴레의 수호자'가 나오고,
   수호자를 잡으면 성공. 남은 시간이 많을수록 다음 단계가 크게 열린다(절반 넘게 남기면 +3, 4분의 1 넘게 +2, 그 밖 +1).
   맵(땅·기믹)은 네 곳 가운데 하나를 무작위로 고르고, 적의 세기·보상은 단계로 정한다. */
const RIFT_T=600; // 제한 시간(초)
let rift=null,riftSel=false,riftTier=1;
const RIFT_TEST_OPEN=true; /* 11-16 대표님 "굴레 바로 열어줘 테스트해보게" — 출시 전 false로(출시 할 일 목록) */
const riftOpen=()=>RIFT_TEST_OPEN||['심연·클리어','심연·30분','심연·1시간'].some(k=>SAVE.best[k]&&SAVE.best[k].win);
const riftMax=()=>Math.max(1,(SAVE.rift&&SAVE.rift.open)||1);
/* 단계마다 적 체력 ×1.17, 공격 ×1.09. 1단계도 서리 폐허쯤 */
function riftMap(tier,mi){const B=MAPS[mi];return Object.assign({},B,{k:'영겁의 굴레',base:mi,rift:1,hp:2.6*Math.pow(1.17,tier-1),dmg:1.5*Math.pow(1.09,tier-1),spawn:1.15,
  champ:Math.min(.25,.04+.01*tier),loot:Math.min(4,.6+.15*tier),floor:Math.min(.5,.1+.02*tier),clear:0,myth:2+.6*tier});} /* 11-16: 단계가 높을수록 굴레 안 신화가 잘 나온다 */
/* 게이지: 보통 적 1, 강화된 적 4, 정예 15, 수호 보스 40 */
const riftNeed=tier=>5000+tier*50; // 무적 자동 플레이로 재어 1단계 수호자가 5~6분쯤 나오게(11-15)
function riftStartMap(tier){MAP=riftMap(tier,Math.random()*4|0);Object.assign(MAPC,MAP.pal);chunks.clear();propMap.clear();}
function riftBegin(tier){rift={tier,prog:0,need:riftNeed(tier),guard:null,done:false,gain:0};nextBoss=Infinity;uiBanner(`영겁의 굴레 ${tier}단계`);}
function riftKill(e){if(!rift||rift.guard||e.boss===2)return;
  rift.prog+=e.guard?40:e.elite?15:e.champ?4:1;
  if(rift.prog>=rift.need)riftGuard();}
function riftGuard(){const ids=Object.keys(BOSS_DEF),bk=pick(ids),a=Math.random()*TAU,rad=viewRad()*.8;rift.prog=rift.need;
  rift.guard=bossRef=spawn(bk,{hpMul:5.5,dmgMul:1.3,boss:2,name:'굴레의 수호자 · '+ET[bk].n,at:[P.x+Math.cos(a)*rad,P.y+Math.sin(a)*rad*.8]});
  burnT=0;thinOut();cine={t:2.2,max:2.2,e:bossRef};uiCine(bossRef.name,true);SFX.elite();shake(.5);buzz(60);}
function riftUpdate(){if(!rift||rift.done||ending)return;
  if(runT>=RIFT_T){rift.done=true;ending={win:false,t:1.6};uiBanner('시간 초과');for(const e of enemies)if(!e.dead&&!e.boss){e.dead=true;puff(e.x,e.y-e.r*.6,2);}}}
/* 성공: 다음 단계를 열고 보상을 창고에 */
function riftWin(){const r=rift,rem=RIFT_T-runT;r.done=true;r.gain=rem>=RIFT_T*.5?3:rem>=RIFT_T*.25?2:1;
  const R=SAVE.rift||(SAVE.rift={open:1,best:0,bestT:0});R.open=Math.max(R.open||1,r.tier+r.gain);
  if(r.tier>R.best||(r.tier===R.best&&runT<(R.bestT||1e9))){R.best=r.tier;R.bestT=Math.floor(runT);}
  riftTier=Math.min(R.open,r.tier+r.gain);
  const n=Math.min(6,1+(r.tier/3|0)),mp=Math.min(.95,.1+.06*(r.tier-1));let my=0;for(let i=0;i<n;i++){let g=4;if(g===4)my++;addLoot(makeItem(g,curFloor()));}} /* 11-24 대표님 "보상은 신화 이상": 성공 보상 전부 신화(초월 확률은 그대로) */ /* 11-16 대표님 "단계가 높을수록 신화가 잘 나오게": 성공 보상 전설 이상 n개, 신화 확률 10%+단계당 6%, 10단계부터 신화 1개 확정 */
function riftGoal(){if(!rift)return'';if(rift.guard)return'수호자를 잡으세요';return`굴레 ${Math.floor(rift.prog/rift.need*100)}%`;}
function riftTitle(win){return win?`${rift.tier}단계 성공`:rift.done&&runT>=RIFT_T?'시간 초과':'쓰러졌습니다';}
function riftSum(win){const r=rift;return win?`남은 시간 ${mmss(Math.max(0,RIFT_T-runT))} · 다음 단계 +${r.gain} · 레벨 ${P.level} · 처치 ${kills}`:`${r.tier}단계 · 굴레 ${Math.floor(r.prog/r.need*100)}% · 레벨 ${P.level} · 처치 ${kills}`;}
function riftBestText(){const R=SAVE.rift;return R&&R.best?`최고 ${R.best}단계 (${mmss(R.bestT)}) · ${riftMax()}단계까지 열림`:`${riftMax()}단계까지 열림 · 아직 기록이 없습니다.`;}

/* 거점: 맵 아래의 굴레 단추와 단계 고르기 */
function riftLobbyInit(){
  const b=btn('',()=>{SFX.ui();soundOn();if(!riftOpen()){riftSel=false;refreshLobby();$('mapDesc').textContent='심연을 끝까지 클리어하면 열립니다.';return;}riftSel=true;dailySel=false;riftTier=Math.min(riftTier,riftMax());refreshLobby();},'');
  b.id='riftBtn';b.append(el('b',null,'영겁의 굴레'),el('i',null,''));$('riftRow').append(b);
  const tr=$('tierRow');tr.append(btn('−',()=>{riftTier=Math.max(1,riftTier-1);SFX.ui();refreshLobby();},''),el('b','tierN',''),btn('+',()=>{riftTier=Math.min(riftMax(),riftTier+1);SFX.ui();refreshLobby();},''));
}
function riftLobbyRefresh(){const open=riftOpen(),b=$('riftBtn');b.setAttribute('aria-pressed',riftSel);b.classList.toggle('lock',!open);b.lastChild.textContent=open?(SAVE.rift&&SAVE.rift.best?`최고 ${SAVE.rift.best}단계`:'도전'):'심연 클리어 뒤 열림';
  show('modes',!riftSel);show('tierRow',riftSel);$('modeLab').textContent=riftSel?'몇 단계에 도전할까요':'어떻게 할까요';
  if(riftSel){riftTier=clamp(riftTier,1,riftMax());$('tierRow').querySelector('.tierN').textContent=`${riftTier}단계`;
    $('mapDesc').textContent=`네 맵 가운데 한 곳이 무작위로 열립니다. ${mmss(RIFT_T)} 안에 적을 잡아 굴레를 채우고 수호자를 잡으세요. 적 체력 ${(riftMap(riftTier,0).hp).toFixed(1)}배 · 공격 ${(riftMap(riftTier,0).dmg).toFixed(1)}배, 단계가 높을수록 보상이 좋습니다.`;
    $('best').textContent=riftBestText();}}
