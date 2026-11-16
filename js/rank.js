'use strict';
/* 다크 드웰러 — 온라인 순위(11-16 대표님 "영겁의 굴레 순위 + 부위별 가장 높은 등급·완성도, 합계로"). 서버는 클라우드플레어(게임\순위서버).
   순위 셋: 영겁의 굴레(최고 단계 → 빠른 시간) · 장비 합계(낀 장비 점수 합) · 부위별 최고 장비(무기·투구 …).
   장비 점수 = 등급(일반 0 ~ 신화 4) × 100 + 완성도%.  닉네임을 처음 한 번 정하면 id·열쇠를 이 기기에 둔다.
   판이 끝날 때와 순위 창을 열 때 기록을 보낸다(서버가 20초에 한 번만 받는다). 인터넷이 안 되면 조용히 넘어간다. */
const RANK_PROD='https://dd-rank.dd-rank.workers.dev';   /* 11-16 클라우드플레어에 올림(대표님 계정) */
const RANK_URL=(/^(localhost|127\.0\.0\.1)$/.test(location.hostname))?'http://127.0.0.1:8787':RANK_PROD;
const RANK_SLOTS=[['weapon','무기'],['helm','투구'],['armor','갑옷'],['glove','장갑'],['belt','벨트'],['boots','신발'],['amulet','목걸이'],['ear','귀걸이'],['ring','반지']];
const GRADE_K=['일반','레어','유니크','전설','신화'];
let rankMe=null,rankBoard='rift',rankSlot='weapon',rankSentAt=0;
try{rankMe=JSON.parse(localStorage.getItem('darkdweller.rank')||'null');}catch(_){}
const gearScore=it=>it.gi*100+itemQuality(it);
/* 부위별 가장 좋은 장비(낀 것 + 창고) · 낀 장비 합계 */
function rankGear(){const best={};
  const see=it=>{if(!it)return;const t=SLOT_TYPES[it.t]?it.t:null;const k=t;if(!k)return;const s=gearScore(it);if(!best[k]||s>best[k].s)best[k]={s,g:it.gi,q:itemQuality(it),n:String(it.name).slice(0,20)};};
  for(const[sk]of EQUIP_SLOTS)see(SAVE.equip[sk]);for(const it of SAVE.stash)see(it);
  const gear={};for(const[k]of RANK_SLOTS)if(best[k])gear[k]={g:best[k].g,q:best[k].q,n:best[k].n};
  let total=0;for(const[sk]of EQUIP_SLOTS){const it=SAVE.equip[sk];if(it)total+=gearScore(it);}
  return{gear,total:Math.min(7000,Math.round(total))};}
async function rankPost(path,body){if(!RANK_URL)throw new Error('off');const r=await fetch(RANK_URL+path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const j=await r.json().catch(()=>({ok:false,error:'응답 오류'}));if(!r.ok||!j.ok)throw new Error(j.error||'실패');return j;}
/* 기록 보내기: rift = {tier,t} (굴레 성공 때만) */
async function rankSubmit(rift){if(!rankMe||!RANK_URL)return;const now=Date.now();if(!rift&&now-rankSentAt<25000)return;rankSentAt=now;
  const g=rankGear();const body={id:rankMe.id,key:rankMe.key,gear:g.gear,total:g.total,skin:typeof skinCur==='function'?skinCur():'base'};
  const R=SAVE.rift;if(!rift&&R&&R.best)rift={tier:R.best,t:clamp(R.bestT||600,60,600)}; /* 이 기기의 굴레 최고 기록도 함께 */
  if(rift)body.rift=rift;
  try{await rankPost('/submit',body);}catch(_){}}
/* 판이 끝날 때(meta.js metaRunEnd 뒤에서 부름) */
function rankAfterRun(win){if(!rankMe)return;const r=(typeof rift!=='undefined'&&rift&&rift.done&&rift.gain>0)?{tier:rift.tier,t:clamp(Math.floor(runT),60,600)}:null;setTimeout(()=>rankSubmit(r),300);}

/* ───── 화면 ───── */
function rankInit(){
  nickInit();
  $('rankBtn').addEventListener('click',()=>{SFX.ui();soundOn();rankOpen();});
  $('rankClose').addEventListener('click',()=>{SFX.ui();show('rank',false);});
  $('rankJoin').addEventListener('click',rankJoin);
  $('rankName').addEventListener('keydown',e=>{if(e.key==='Enter')rankJoin();});
  for(const[b,k]of[['rkRift','rift'],['rkTotal','total'],['rkSlot','slot']])$(b).addEventListener('click',()=>{SFX.ui();rankBoard=k;rankLoad();});
  const sl=$('rankSlots');for(const[k,n]of RANK_SLOTS){const b=el('button','chipbtn',n);b.type='button';b.dataset.k=k;b.addEventListener('click',()=>{SFX.ui();rankSlot=k;rankLoad();});sl.append(b);}
}
function rankOpen(){show('rank',true);show('hubHint',false);const on=!!rankMe;show('rankJoinBox',!on&&!!RANK_URL);
  $('rankWho').textContent=!RANK_URL?'순위 서버를 준비 중입니다.':on?`${rankMe.name} 님`:'닉네임을 정하면 순위에 오릅니다.';
  if(on)rankSubmit(null);rankLoad();}
async function rankJoin(){const ok=await rankRegister($('rankName').value.trim(),$('rankMsg'));if(ok){SFX.level();rankOpen();}}
/* 닉네임 등록(순위 창·시작 창이 함께 씀) */
async function rankRegister(nm,msg){
  if(!/^[가-힣A-Za-z0-9_]{2,12}$/.test(nm)){msg.textContent='닉네임은 2~12자, 한글·영문·숫자만 쓸 수 있습니다.';return false;}
  msg.textContent='등록하는 중…';
  try{const j=await rankPost('/register',{name:nm});rankMe={id:j.id,key:j.key,name:j.name};try{localStorage.setItem('darkdweller.rank',JSON.stringify(rankMe));}catch(_){}
    msg.textContent='';return true;}
  catch(e){msg.textContent=e.message==='off'?'순위 서버를 준비 중입니다.':(e instanceof TypeError||!e.message)?'등록하지 못했습니다. 인터넷 연결을 확인해 주세요.':e.message;return false;}}
/* 11-16 대표님 "닉네임은 시작시 만드는 걸로": 제목 화면을 누르면 닉네임이 없을 때 먼저 묻는다. 서버가 안 되면 '나중에'로 넘어가고 다음에 다시 묻는다. */
let nickGo=null,nickBusy=false;
function nickGate(go){if(rankMe||!RANK_URL){go();return;}nickGo=go;show('nick',true);show('nickLaterBox',false);$('nickMsg').textContent='';setTimeout(()=>{try{$('nickName').focus();}catch(_){}} ,60);}
async function nickSubmit(){if(nickBusy)return;nickBusy=true;$('nickOk').disabled=true;
  const ok=await rankRegister($('nickName').value.trim(),$('nickMsg'));nickBusy=false;$('nickOk').disabled=false;
  if(ok){SFX.level();nickDone();}else if(!/닉네임은|이미|사용/.test($('nickMsg').textContent))show('nickLaterBox',true);}
function nickDone(){show('nick',false);const g=nickGo;nickGo=null;if(g)g();}
function nickInit(){$('nickOk').addEventListener('click',()=>{SFX.ui();nickSubmit();});$('nickName').addEventListener('keydown',e=>{if(e.key==='Enter')nickSubmit();});$('nickLater').addEventListener('click',()=>{SFX.ui();nickDone();});}
async function rankLoad(){
  for(const[b,k]of[['rkRift','rift'],['rkTotal','total'],['rkSlot','slot']])$(b).classList.toggle('on',rankBoard===k);
  show('rankSlots',rankBoard==='slot');for(const b of $('rankSlots').children)b.classList.toggle('on',b.dataset.k===rankSlot);
  const box=$('rankList');box.innerHTML='';const mine=$('rankMine');mine.textContent='';
  if(!RANK_URL){box.append(el('div','rkempty','곧 열립니다.'));return;}
  box.append(el('div','rkempty','불러오는 중…'));
  const board=rankBoard==='slot'?'slot:'+rankSlot:rankBoard;
  try{const r=await fetch(`${RANK_URL}/top?board=${encodeURIComponent(board)}&n=50${rankMe?'&me='+rankMe.id:''}`);const j=await r.json();if(!j.ok)throw 0;
    box.innerHTML='';if(!j.rows.length){box.append(el('div','rkempty','아직 기록이 없습니다. 첫 번째가 되어 보세요!'));}
    j.rows.forEach((w,i)=>{const row=el('div','rkrow'+(w.me?' me':'')+(i<3?' top'+(i+1):''));const nm=el('span','rknm');const sk=(typeof SKIN!=='undefined'&&SKIN[w.skin])||null;if(sk){const av=el('img','rkav');av.src=sk.img;av.alt='';nm.append(av);}nm.append(document.createTextNode(w.name));row.append(el('b','rkn',String(i+1)),nm);
      let v='';if(rankBoard==='rift')v=`${w.tier}단계 · ${mmss(w.t)}`;else if(rankBoard==='total')v=`${w.score}점`;else{const sp=el('span','rkv');const gg=el('em','rkg',GRADE_K[w.grade]);gg.style.color=GRADES[w.grade].c;sp.append(gg,document.createTextNode(` ${w.q}%`));row.append(sp);row.title=w.item;box.append(row);return;}
      row.append(el('span','rkv',v));box.append(row);});
    if(j.myRank)mine.textContent=`내 순위 ${j.myRank}위`;else if(rankMe)mine.textContent=rankBoard==='rift'?'굴레를 깨면 순위에 오릅니다.':'판을 마치면 기록이 올라갑니다.';}
  catch(_){box.innerHTML='';box.append(el('div','rkempty','순위를 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.'));}}
