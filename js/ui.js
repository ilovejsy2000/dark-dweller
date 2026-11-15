'use strict';
/* 다크 드웰러 — 화면: 거점(맵·시간 고르기), 판 중 정보, 레벨업 선택, 멈춤, 장비·창고, 결과, 설정 */
const show=(id,on)=>{$(id).hidden=!on;};
const el=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e;};
const mmss=t=>{t=Math.floor(t);return (t/60|0)+':'+String(t%60).padStart(2,'0');};
function btn(label,fn,cls){const b=el('button',cls==null?'ghost':cls,label);b.type='button';b.addEventListener('click',fn);return b;}
/* 두 번 눌러야 되는 단추(버리기·포기) */
function confirmBtn(label,fn,cls){const b=el('button',cls||'ghost warn',label);b.type='button';let armed=0;
  b.addEventListener('click',()=>{if(armed){fn();return;}armed=1;b.textContent='한 번 더 누르면 '+label;setTimeout(()=>{armed=0;b.textContent=label;},2500);});return b;}

/* ───── 아이콘 ───── */
const urlCache={};
function itemIconURL(it){return gearURL(it);}
function drawSkillIcon(g,k){g.lineWidth=2.5;
  const ringL=(x,r,col)=>{ell(g,x,0,r,r);g.lineWidth=5;g.strokeStyle=INK;g.stroke();g.lineWidth=2.2;g.strokeStyle=col;g.stroke();g.lineWidth=2.5;};
  switch(k){
    case'slash':g.beginPath();g.arc(-4,1,13,-1.2,1.2);g.arc(-9,1,13.5,.95,-.95,true);g.closePath();inkF(g,'#fff6dc');break;
    case'bolt':blob(g,[[0,-14],[8,-2],[7,8],[0,12],[-7,8],[-8,-2]]);inkF(g,'#ff8a2e');blob(g,[[0,-4],[4,3],[0,8],[-4,3]]);g.fillStyle='#fff1c2';g.fill();break;
    case'zap':poly(g,[[3,-14],[-8,2],[-1,2],[-4,14],[8,-3],[1,-3]]);inkF(g,'#ffe066');break;
    case'blade':g.save();g.rotate(.7);poly(g,[[-3,6],[-3,-9],[0,-15],[3,-9],[3,6]]);inkF(g,'#f3e6c8');rr(g,-6,6,12,3.4,1.5);inkF(g,'#b08845');g.restore();g.beginPath();g.arc(0,0,13.5,2.1,4.3);g.strokeStyle='#f3e6c8';g.stroke();break;
    case'spear':g.save();g.rotate(-.75);poly(g,[[15,0],[3,-4.5],[-14,-2.5],[-14,2.5],[3,4.5]]);inkF(g,'#bfe9ff');g.restore();break;
    case'meteor':poly(g,[[-3,-4],[-14,-14],[-8,0]]);inkF(g,'#ff8a2e');blob(g,[[-5,-2],[1,-9],[10,-5],[12,5],[4,11],[-4,8]]);inkF(g,'#6e7392');break;
    case'vine':for(const[x,h]of[[-8,13],[0,20],[8,13]]){poly(g,[[x-4.5,10],[x,10-h],[x+4.5,10]]);inkF(g,'#6fa05c');}break;
    case'axe':g.save();g.rotate(.5);rr(g,-1.8,-12,3.6,25,1.6);inkF(g,'#7d5238');g.beginPath();g.moveTo(1.5,-12);g.quadraticCurveTo(14,-14,13,-1);g.quadraticCurveTo(7,-5,1.5,-3);g.closePath();inkF(g,'#aab4c8');g.restore();break;
    case'wave':ringL(0,12,'#fff1c2');ringL(0,6.5,'#fff1c2');ell(g,0,0,2.4,2.4);g.fillStyle='#fff1c2';g.fill();break;
    /* 조합 스킬 */
    case'storm':for(let i=0;i<3;i++){g.save();g.rotate(i*TAU/3);g.beginPath();g.moveTo(0,-3);g.quadraticCurveTo(10,-14,2,-16);g.quadraticCurveTo(5,-9,0,-3);g.closePath();inkF(g,'#bff3ff');g.restore();}ell(g,0,0,3,3);inkF(g,'#f3e6c8');break;
    case'shower':for(const[x,y]of[[-8,-6],[3,-1],[9,8]]){poly(g,[[x-2,y-2],[x-9,y-10],[x-5,y]]);inkF(g,'#ff8a2e',2);ell(g,x,y,4.5,4.5);inkF(g,'#6e7392',2);}break;
    case'tring':ringL(0,12,'#9fd8ff');poly(g,[[2,-9],[-5,1],[-1,1],[-3,9],[5,-2],[1,-2]]);inkF(g,'#ffe066',2);break;
    case'frost':for(const[x,h]of[[-9,12],[0,21],[9,12]]){poly(g,[[x-4.5,10],[x,10-h],[x+4.5,10]]);inkF(g,'#d8f6ff');}starPath(g,0,-1,6,4,1.4,0);g.fillStyle='#fff';g.fill();break;
    case'plasma':ell(g,0,0,11,11);inkF(g,'#7a6cff');ell(g,0,0,6.5,6.5);g.fillStyle='#bfe9ff';g.fill();ell(g,-1.5,-1.5,3,3);g.fillStyle='#fff';g.fill();g.lineWidth=2;g.strokeStyle='#bfe9ff';g.beginPath();g.moveTo(9,-9);g.lineTo(14,-13);g.moveTo(-9,9);g.lineTo(-14,13);g.moveTo(10,7);g.lineTo(15,9);g.stroke();break;
    case'saw':starPath(g,0,0,10,14,10,0);inkF(g,'#c9d1e0');ell(g,0,0,6.5,6.5);inkF(g,'#8a94ac');ell(g,0,0,2,2);g.fillStyle=INK;g.fill();break;
    /* 패시브 */
    case'star':starPath(g,0,0,5,13.5,5.6,-Math.PI/2);inkF(g,'#ffe066');break;
    case'heart':g.beginPath();g.moveTo(0,11);g.bezierCurveTo(-17,0,-10,-14,0,-5);g.bezierCurveTo(10,-14,17,0,0,11);g.closePath();inkF(g,'#e2504c');break;
    case'magnet':g.beginPath();g.arc(0,-2,9.5,Math.PI,0);g.lineTo(9.5,10);g.lineTo(4,10);g.lineTo(4,-2);g.arc(0,-2,4,0,Math.PI,true);g.lineTo(-4,10);g.lineTo(-9.5,10);g.closePath();inkF(g,'#e2504c');g.fillStyle='#eadfc6';g.fillRect(-8.3,6,3.2,3);g.fillRect(5.1,6,3.2,3);break;
    case'book':rr(g,-12,-9,24,18,2.5);inkF(g,'#6c4ab8');g.fillStyle='#eadfc6';g.fillRect(-9,-6,8,12);g.fillRect(1,-6,8,12);break;
    case'hourglass':poly(g,[[-8,-12],[8,-12],[1.5,0],[8,12],[-8,12],[-1.5,0]]);inkF(g,'#eadfc6');g.fillStyle='#ff9a3c';poly(g,[[-5,10.5],[5,10.5],[0,3.5]]);g.fill();break;
    case'rings':ringL(-4,8,'#6fd6c8');ringL(5,8,'#eadfc6');break;
    case'ward':g.beginPath();g.moveTo(-10,-11);g.lineTo(10,-11);g.lineTo(10,1);g.quadraticCurveTo(9,10,0,14);g.quadraticCurveTo(-9,10,-10,1);g.closePath();inkF(g,'#57a8ff');starPath(g,0,0,4,6,2.4,-Math.PI/2);g.fillStyle='#e9f4ff';g.fill();break;
    default:if(!drawSkillIcon2(g,k))drawIcon(g,k,'#ff9a3c');
  }}
/* 스킬·패시브 그림판(img/skills.png, 한 칸 108, 6칸씩). 패시브는 'p_이름'. 그림을 못 읽으면 코드로 그린 아이콘 */
const skAtlas=new Image();skAtlas.src='img/skills.png';
const SK_CELL=108,SK_ORDER=['slash','bolt','zap','blade','spear','meteor','vine','axe','wave','strike','blizz','cloud','dark','drain','sfire','sice','szap','skel','reaper','clone','storm','shower','tring','frost','plasma','saw','sun','zero','smite','harvest','legion','miasma',
  'p_might','p_haste','p_keen','p_vigor','p_hide','p_ward','p_swift','p_magnet','p_learn','p_luck','p_regen','p_focus','p_reach'];
function skillIconURL(k){
  const i=SK_ORDER.indexOf(k);
  if(i>=0&&skAtlas.complete&&skAtlas.naturalWidth){if(urlCache['a'+k])return urlCache['a'+k];
    try{const c=document.createElement('canvas');c.width=c.height=96;const g=c.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(skAtlas,(i%6)*SK_CELL+5,(i/6|0)*SK_CELL+5,SK_CELL-10,SK_CELL-10,0,0,96,96); /* 칸 가장자리 5픽셀은 여백 */return urlCache['a'+k]=c.toDataURL();}catch(_){}}
  const ck=k.startsWith('p_')?PASSIVES[k.slice(2)].icon:k;return urlCache['s'+ck]||(urlCache['s'+ck]=makeSprite(34,34,17,17,g=>drawSkillIcon(g,ck)).c.toDataURL());
}

/* ───── 판 중 정보 ───── */
let hudC={};
function uiHud(){const h=hudC,hp=Math.ceil(P.hp);
  if(h.hp!==hp||h.mhp!==P.maxhp){h.hp=hp;h.mhp=P.maxhp;$('hpFill').style.width=(P.hp/P.maxhp*100)+'%';$('hpTxt').textContent=`${hp} / ${Math.round(P.maxhp)}`;}
  const xp=Math.round(P.xp/P.need*100);if(h.xp!==xp){h.xp=xp;$('xpFill').style.width=xp+'%';}
  if(h.lv!==P.level){h.lv=P.level;$('lvBadge').textContent=P.level;}
  const t=runT|0;if(h.t!==t){h.t=t;$('timer').textContent=rift?mmss(Math.max(0,RIFT_T-t)):mmss(t);const dg=(t/60|0)+1;if(!rift&&h.dg!==dg){h.dg=dg;$('goal').textContent=mode.t?`목표 ${mode.t/60}분`:`위험도 ${dg}`;}}
  if(rift){const g=riftGoal();if(h.rg!==g){h.rg=g;$('goal').textContent=g;}}
  if(h.k!==kills){h.k=kills;$('kills').textContent=kills;}
  const ev=burnT>0?`버닝 타임 ${Math.ceil(burnT)}초`:hordeT>0?'적이 몰려오는 중':GIM.ev;if(h.ev!==ev){h.ev=ev;$('event').textContent=ev;$('event').className=burnT>0?'burn':'';}
  const b=bossRef&&!bossRef.dead?bossRef:null;
  if(!!b!==!!h.boss){h.boss=!!b;h.bf=-1;show('bossBar',!!b);if(b)$('bossName').textContent=b.name;}
  if(b){const f=Math.round(clamp(b.hp/b.maxhp,0,1)*100);if(h.bf!==f){h.bf=f;$('bossFill').style.width=f+'%';}}
  metaHud(h);
}
function uiBanner(txt){const b=$('banner');b.hidden=true;void b.offsetWidth;b.textContent=txt;b.hidden=false;clearTimeout(uiBanner.t);uiBanner.t=setTimeout(()=>{b.hidden=true;},1350);}
/* 보스 등장 연출: 위아래 검은 띠와 이름. name 이 없으면 걷는다 */
function uiCine(name,fin){if(!name){show('cine',false);return;}$('cineSub').textContent=fin?'최종 보스':'보스 등장';$('cineName').textContent=name;show('cine',false);void $('cine').offsetWidth;show('cine',true);}
function uiNote(txt){const n=$('note');n.textContent=txt;n.hidden=false;clearTimeout(uiNote.t);uiNote.t=setTimeout(()=>{n.hidden=true;},2200);}
function uiToast(it){const t=el('div','toast');t.style.setProperty('--gc',gradeColor(it));
  const b=el('b',null,`${gradeName(it)} · ${it.name}`);t.append(b,el('span',null,it.lines.map(l=>fmtLine(l.k,l.v)).join(' · ')+(it.fx?' · '+FXS[it.fx]:'')));
  const box=$('toasts');box.append(t);while(box.children.length>3)box.firstChild.remove();setTimeout(()=>{t.style.opacity=0;setTimeout(()=>t.remove(),520);},2800);}

/* ───── 거점: 맵과 시간 고르기 ───── */
let modeSel=0,mapSel=0;
const stars=n=>'★'.repeat(n)+'☆'.repeat(4-n);
function bestText(){const M=MAPS[mapSel],k=mapSel===0?MODES[modeSel].k:M.k+'·'+MODES[modeSel].k,b=SAVE.best[k];if(!b)return'아직 기록이 없습니다.';return (b.win?'클리어 · ':'최고 기록 '+mmss(b.t)+' · ')+`처치 ${b.kills} · 레벨 ${b.lv}`;}
function refreshLobby(){const M=MAPS[mapSel];MODES.forEach((m,i)=>{const b=$('mode-'+i);b.setAttribute('aria-pressed',i===modeSel);b.textContent=m.t<0?`클리어 · ${M.clear/60}분`:m.k;});MAPS.forEach((m,i)=>$('map-'+i).setAttribute('aria-pressed',!riftSel&&!dailySel&&i===mapSel));
  $('mapDesc').textContent=M.d+(mapSel?` 적 체력 ${M.hp}배 · 공격 ${M.dmg}배, 높은 등급 장비가 더 잘 나옵니다.`:'')+(MODES[modeSel].t<0?` ${M.clear/60}분을 버티고 끝 보스를 잡으면 클리어입니다.`:'');$('best').textContent=bestText();riftLobbyRefresh();metaLobbyRefresh();}
function uiLobby(){for(const id of['hud','result','pause','lvl','inv','tip'])show(id,false);modeSel=SAVE.m2||0;mapSel=SAVE.map||0;if(MAP!==MAPS[mapSel])setMap(mapSel);refreshLobby();show('lobby',true);}
function uiStart(){soundOn();if(dailySel)dailyStart();else if(riftSel&&riftOpen()){riftStartMap(riftTier);startRun(0,riftTier);}else{riftSel=false;setMap(mapSel);startRun(modeSel);}hudC={};show('bossBar',false);show('lvl',false);/* 앞 판에서 못 잡은 보스의 체력 띠가 남지 않게(11-15) */$('toasts').innerHTML='';show('lobby',false);show('result',false);show('hud',true);uiHud();uiNote('공격은 자동입니다. 움직이기만 하세요.');}

/* ───── 레벨업 선택: 액티브 → 패시브 ───── */
let lvStep='act',choiceAt=0;
function uiOpenChoice(){choosing=true;joy=null;lvStep='act';renderChoice();show('lvl',true);}
function renderChoice(){
  const kind=lvStep,ids=rollChoices(kind);choiceAt=performance.now();
  $('lvlStep').textContent=`레벨 ${P.level-pendingLv+1} · ${kind==='act'?'1 / 2':'2 / 2'}`;$('lvlTitle').textContent=kind==='act'?'액티브 선택':'패시브 선택';
  const box=$('choices');box.innerHTML='';
  const rb=$('rerollBtn');rb.hidden=RUN.rerolls<=0;rb.textContent=`다시 굴리기 (${RUN.rerolls})`;
  for(const id of ids){const def=kind==='act'?ACTIVES[id]:PASSIVES[id],lv=(kind==='act'?P.act:P.pas)[id]||0,info=choiceInfo(kind,id),rare=canRare(kind,id)&&Math.random()<rareChance(),b=el('button','choice'+(info.fuse?' fuse':'')+(rare?' rare':''));b.type='button';b.id='ch-'+id;
    const im=el('img');im.src=skillIconURL(kind==='act'?id:'p_'+id);im.alt='';
    const head=el('div','hd');head.append(el('b',null,def.n));if(def.el)head.append(el('em','el',def.el));if(info.fuse)head.append(el('em','fz','조합'));if(info.special)head.append(el('em','sp','특수'));if(rare)head.append(el('em','rr','희귀 · 2단계'));head.append(el('em',null,lv?`${lv} → ${lv+(rare?2:1)}단계`:rare?'새로 배움 · 2단계부터':'새로 배움'));
    const d=el('div');d.append(head,el('p',null,info.text));b.append(im,d);
    b.addEventListener('click',()=>{if(performance.now()-choiceAt<350)return;SFX.ui();if(info.fuse&&!lv)SFX.level();takeChoice(kind,id);if(rare){SFX.level();takeChoice(kind,id);}nextChoice();});box.append(b);}
}
function nextChoice(){
  if(lvStep==='act'){lvStep='pas';renderChoice();return;}
  pendingLv--;if(pendingLv>0){lvStep='act';renderChoice();return;}
  show('lvl',false);choosing=false;P.inv=Math.max(P.inv,.6);
}

/* ───── 멈춤: 배운 스킬과 조합식 ───── */
function renderOwned(){
  const box=$('owned');box.innerHTML='';
  const chip=(url,txt)=>{const c=el('span','chip');const im=el('img');im.src=url;im.alt='';c.append(im,document.createTextNode(txt));box.append(c);};
  for(const id in P.act)chip(skillIconURL(id),`${ACTIVES[id].n} ${P.act[id]}`);
  for(const id in P.pas)chip(skillIconURL('p_'+id),`${PASSIVES[id].n} ${P.pas[id]}`);
  const rc=$('recipes');rc.innerHTML='';
  for(const id in ACTIVES){const A=ACTIVES[id];if(!A.fuse)continue;const row=el('div','rcp'+(P.act[id]?' on':''));const im=el('img');im.src=skillIconURL(id);im.alt='';
    const need=A.fuse.map(k=>`${ACTIVES[k].n} ${Math.min(P.act[k]||0,FUSE_LV)}/${FUSE_LV}`).join(' + ');
    row.append(im,el('b',null,A.n),el('span',null,P.act[id]?`배움 · ${P.act[id]}단계`:need));rc.append(row);}
}
function uiPause(){if(state!=='play'||choosing||ending||paused)return;paused=true;joy=null;renderOwned();$('pauseWhere').textContent=rift?`영겁의 굴레 ${rift.tier}단계 · ${MAPS[MAP.base].k}`:`${MAP.k} · ${mode.t?'클리어 '+mode.t/60+'분':'무한'}`;show('pause',true);}
function uiResume(){paused=false;show('pause',false);}

/* ───── 장비 · 창고: 위쪽은 몸 부위에 맞춘 칸, 장비를 누르면 설명 창이 뜬다 ───── */
/* 몸 부위 자리: [가로 칸, 세로 칸] (5×5) */
const DOLL={ear1:[1,1],helm:[3,1],ear2:[5,1],weapon1:[1,2],amulet:[3,2],weapon2:[5,2],ring1:[1,3],armor:[3,3],ring3:[5,3],ring2:[1,4],belt:[3,4],ring4:[5,4],glove:[1,5],boots:[3,5]};
let invFrom='lobby',tipPrefer=null;
function uiInv(from){invFrom=from;tipPrefer=null;show(from==='pause'?'pause':'lobby',false);show('inv',true);renderInv();}
function closeInv(){show('tip',false);show('inv',false);if(invFrom==='pause'){renderOwned();show('pause',true);}else{refreshLobby();show('lobby',true);}}
function cellFor(it){const c=el('button','cell');c.type='button';if(it){c.classList.add('g'+it.gi);if(it.prime)c.classList.add('prime');c.style.setProperty('--gc',gradeColor(it));c.style.backgroundImage=`url(${itemIconURL(it)})`;c.setAttribute('aria-label',`${gradeName(it)} ${it.name}`);c.append(el('small',null,itemQuality(it)));}return c;}
/* 장비 내용: 줄마다 지금 수치와 그 등급에서 나올 수 있는 최대치를 나란히 보여 준다 */
function describe(box,it){const G={c:gradeColor(it),k:gradeName(it)},hd=el('div','ihd');const im=el('img');im.src=itemIconURL(it);im.alt='';const tt=el('div');
  const nm=el('b','nm',it.name);nm.style.color=G.c;tt.append(nm,el('div','meta',`${G.k} ${SLOT_TYPES[it.t].n} · 완성도 ${itemQuality(it)}%`));hd.append(im,tt);box.append(hd);
  for(const l of it.lines){const[a,b]=itemRange(it,l.k),full=l.v>=b,row=el('div','ln');row.style.setProperty('--gc',G.c);
    const bar=el('div','lbar'),fill=el('i');fill.style.width=(b>a?clamp((l.v-a)/(b-a),0,1)*100:100)+'%';bar.append(fill);
    row.append(el('span',null,fmtLine(l.k,l.v)),el('span','mx'+(full?' full':''),full?'최대치':`최대 ${fmtVal(l.k,b)}`),bar);box.append(row);}
  if(it.fx)box.append(el('div','fx','고유 효과 · '+FXS[it.fx]));
  const si=setInfo(it);if(si){const sb=el('div','setb');sb.append(el('div','st',`세트 · ${si.name} (${si.n}개 착용)`));for(const[t,on]of si.rows)sb.append(el('div',on?'on':null,t));box.append(sb);}}
/* 설명 창: 창고 장비면 장착·버리기, 낀 장비면 해제 */
function openTip(it,slot){
  const card=$('tipCard');card.innerHTML='';card.style.setProperty('--gc',gradeColor(it));describe(card,it);
  const row=el('div','btns');
  if(slot){row.append(btn('재련',()=>{SFX.ui();openRefine(it,slot);},'ghost'));row.append(btn('해제',()=>{if(unequipSlot(slot)){show('tip',false);renderInv();}else card.append(el('div','fx','창고가 가득 차서 해제할 수 없습니다.'));},'go sm'));}
  else{const ts=targetSlot(it.t,tipPrefer),old=SAVE.equip[ts];
    row.append(btn('장착',()=>{equipItem(it,ts);SFX.loot(Math.max(1,it.gi));show('tip',false);renderInv();},'go sm'),btn('재련',()=>{SFX.ui();openRefine(it,null);},'ghost'),confirmBtn(`분해 (가루 +${dustOf(it)})`,()=>{discardItem(it);show('tip',false);renderInv();}));
    if(old){const c=el('div','cmp');c.append(el('div','ct',`지금 낀 것 · ${gradeName(old)} ${old.name}`));for(const l of old.lines)c.append(el('div',null,fmtLine(l.k,l.v)));if(old.fx)c.append(el('div',null,'고유 효과 · '+FXS[old.fx]));card.append(c);}}
  row.append(btn('닫기',()=>show('tip',false)));card.append(row);show('tip',true);
}
function renderBulk(){const box=$('bulk');box.innerHTML='';const cnt=[0,0,0,0,0];for(const it of SAVE.stash)cnt[it.gi]++;
  if(cnt[0]+cnt[1]+cnt[2]===0)return;box.append(el('span',null,'한 번에 분해'));
  for(let gi=0;gi<3;gi++)if(cnt[gi])box.append(confirmBtn(`${GRADES[gi].k} ${cnt[gi]}개`,()=>{discardGrade(gi);renderInv();}));}
function renderStats(){const box=$('statList');box.innerHTML='';
  const val=k=>{const v=ST[k],s=STAT[k];if(k==='hp'||k==='def'||k==='luck')return String(Math.round(v));if(k==='regen')return v.toFixed(1)+'/초';if(k==='crit'||k==='critd'||k==='mres')return Math.round(v)+'%';return (s.neg?'-':'+')+Math.round(v)+'%';};
  for(const k of STAT_ORDER){const r=el('div');r.append(el('span',null,STAT[k].n),el('span',null,val(k)));box.append(r);}
  for(const k in SETN){if(!SETS[k]||SETN[k]<2)continue;const r=el('div','setrow');r.append(el('span',null,`${SETS[k].n} ${SETN[k]}세트`),el('span',null,SETS[k].b.slice(0,SETN[k]-1).join(' · ')));box.append(r);}}
function renderInv(){
  const doll=$('doll');doll.innerHTML='';
  for(const[sk,type]of EQUIP_SLOTS){const it=SAVE.equip[sk],c=cellFor(it),pos=DOLL[sk];c.id='eq-'+sk;c.style.gridColumn=pos[0];c.style.gridRow=pos[1];
    if(!it){c.classList.add('empty');c.append(document.createTextNode(SLOT_TYPES[type].n));}
    c.addEventListener('click',()=>{SFX.ui();if(it)openTip(it,sk);else{tipPrefer=sk;uiNote2(`${SLOT_TYPES[type].n} 칸입니다. 아래 창고에서 ${SLOT_TYPES[type].n} 장비를 누르세요.`);}});doll.append(c);}
  const sg=$('stashGrid'),top=sg.scrollTop;sg.innerHTML='';
  const list=SAVE.stash.slice().sort((a,b)=>itemScore(b)-itemScore(a)||a.id-b.id);
  for(const it of list){const c=cellFor(it);c.id='st-'+it.id;c.addEventListener('click',()=>{SFX.ui();openTip(it,null);});sg.append(c);}
  if(!list.length)sg.append(el('p','empty-note','창고가 비어 있습니다. 판에서 주운 장비가 여기에 쌓입니다.'));
  sg.scrollTop=top;$('stashCount').textContent=`${SAVE.stash.length} / ${STASH_MAX} · 마력 가루 ${SAVE.dust||0}`;$('invNote').textContent='';
  renderBulk();renderStats();
}
function uiNote2(txt){$('invNote').textContent=txt;}

/* ───── 결과 ───── */
function uiResult(win){
  for(const id of['hud','lvl','pause','inv','tip'])show(id,false);paused=false;choosing=false;
  $('resEyebrow').textContent=win?'살아남았습니다':'쓰러졌습니다';$('resTitle').textContent=rift?riftTitle(win):win?MAP.k+' 클리어':mmss(runT)+' 버팀';
  $('resSum').textContent=rift?riftSum(win)+` · 얻은 장비 ${runLoot.length}개`:`${MAP.k} · 레벨 ${P.level} · 처치 ${kills} · 얻은 장비 ${runLoot.length}개`;
  metaResult();
  const g=$('resLoot');g.innerHTML='';$('resDetail').textContent=runLoot.length?'장비를 누르면 내용이 보입니다. 모두 창고에 들어갔습니다.':'';
  for(const it of runLoot.slice().sort((a,b)=>b.gi-a.gi||itemQuality(b)-itemQuality(a))){const c=cellFor(it);
    c.addEventListener('click',()=>{$('resDetail').textContent=`${gradeName(it)} · ${it.name} (완성도 ${itemQuality(it)}%) — `+it.lines.map(l=>fmtLine(l.k,l.v)).join(' · ')+(it.fx?' · 고유 효과: '+FXS[it.fx]:'');});g.append(c);}
  show('result',true);
}

/* ───── 설정 ───── */
const OPTS=[['spd','게임 속도',['보통','빠르게','더 빠르게']],['zoom','화면 거리',['가까이','보통','멀리']],['q','화질',['낮음','보통','높음']],['shake','화면 흔들림',['강하게','약하게','끔']],['snd','소리',['끔','켬']],['bgm','배경음',['끔','켬']],['vib','진동',['끔','켬']],['fps','성능 표시',['끔','켬']]];
function applyCfg(){muted=!CFG.snd;if(muted||!CFG.bgm)ambStop();else ambStart();resize();try{localStorage.setItem('darkdweller.cfg',JSON.stringify(CFG));}catch(_){}
  for(const[k]of OPTS)document.querySelectorAll(`#cfgRows button[data-k="${k}"]`).forEach(b=>b.setAttribute('aria-pressed',+b.dataset.v===CFG[k]));}
let cfgHeld=false;
function openCfg(){soundOn();cfgHeld=state==='play'&&!paused;if(cfgHeld)paused=true;joy=null;$('saveMsg').textContent='';show('cfg',true);}
function closeCfg(){show('cfg',false);if(cfgHeld){paused=false;cfgHeld=false;}}

function uiInit(){
  MAPS.forEach((m,i)=>{const b=btn('',()=>{mapSel=i;riftSel=false;dailySel=false;SFX.ui();soundOn();setMap(i);saveNow();refreshLobby();},'');b.id='map-'+i;b.append(el('b',null,m.k),el('i',null,stars(m.star)));$('maps').append(b);});
  MODES.forEach((m,i)=>{const b=btn(m.k,()=>{modeSel=i;SFX.ui();soundOn();refreshLobby();},'');b.id='mode-'+i;$('modes').append(b);});
  riftLobbyInit();metaLobbyInit();
  for(const[k,label,vals]of OPTS){const row=el('div','row');row.append(el('span',null,label));const seg=el('div','seg');
    vals.forEach((v,i)=>{const b=btn(v,()=>{CFG[k]=i;applyCfg();soundOn();SFX.ui();if(k==='vib'&&i)buzz(30);},'');b.id=`cfg-${k}-${i}`;b.dataset.k=k;b.dataset.v=i;seg.append(b);});
    row.append(seg);$('cfgRows').append(row);}
  $('goBtn').addEventListener('click',uiStart);
  $('rerollBtn').addEventListener('click',()=>{if(RUN.rerolls<=0||performance.now()-choiceAt<350)return;RUN.rerolls--;SFX.ui();renderChoice();});
  $('invBtn').addEventListener('click',()=>{soundOn();SFX.ui();uiInv('lobby');});
  $('invBtn2').addEventListener('click',()=>{SFX.ui();uiInv('pause');});
  $('invClose').addEventListener('click',closeInv);
  $('tip').addEventListener('click',e=>{if(e.target===$('tip'))show('tip',false);});
  $('cfgBtn').addEventListener('click',openCfg);$('cfgBtn2').addEventListener('click',openCfg);$('cfgClose').addEventListener('click',closeCfg);
  $('pauseBtn').addEventListener('click',()=>{soundOn();uiPause();});
  $('resumeBtn').addEventListener('click',uiResume);
  $('quitBtn').replaceWith(Object.assign(confirmBtn('포기하고 거점으로',()=>{paused=false;show('pause',false);ending={win:false,t:0};finishRun();}),{id:'quitBtn'}));
  $('homeBtn').addEventListener('click',()=>{toLobby();uiLobby();});
  $('fsBtn').addEventListener('click',()=>{try{const d=document.documentElement;if(document.fullscreenElement)document.exitFullscreen();else if(d.requestFullscreen)d.requestFullscreen().catch(()=>{});}catch(_){}});
  $('expBtn').addEventListener('click',()=>{const box=$('saveBox');box.value=exportSave();box.focus();box.select();
    const done=()=>{$('saveMsg').textContent='저장 코드를 복사했습니다. 메모장 같은 곳에 붙여 두세요.';},fail=()=>{$('saveMsg').textContent='위 칸의 코드를 길게 눌러 복사해 두세요.';};
    try{navigator.clipboard.writeText(box.value).then(done,fail);}catch(_){fail();}});
  $('impBtn').addEventListener('click',()=>{if(state!=='lobby'){$('saveMsg').textContent='거점에서만 가져올 수 있습니다.';return;}
    const ok=importSave($('saveBox').value);$('saveMsg').textContent=ok?'저장을 가져왔습니다.':'코드가 올바르지 않습니다.';if(ok){modeSel=SAVE.m2||0;riftSel=false;dailySel=false;mapSel=SAVE.map||0;setMap(mapSel);refreshLobby();}});
  applyCfg();uiLobby();
}
