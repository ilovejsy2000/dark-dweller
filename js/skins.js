'use strict';
/* 다크 드웰러 — 캐릭터 스킨(11-16 대표님).
   일반(마력 가루로 싸게) 10가지 · 고급(가루를 많이 모아야) 6가지 · 유료 4가지(제우스·하데스·천마·무림맹주, 스토어 출시 때 결제 — 지금은 잠금).
   그림은 게임\그림 원본\피그마\스킨 후보 1116 → 게임\스킨자르기.py 로 잘라 img/skin_*.png.
   고른 스킨은 판 안·거점의 주인공 그림으로 쓰고, 순위표에도 보인다. AI 동료는 기본 방랑자 그림 그대로. */
const SKIN_TIER=['기본','일반','고급','유료'];
const SKINS=[
  {id:'base',n:'방랑자',tier:0,price:0,img:'img/hero.png'},
  {id:'n_samurai',n:'붉은 무사',tier:1,price:300,img:'img/skin_n_samurai.png'},
  {id:'n_snow',n:'눈사냥꾼',tier:1,price:300,img:'img/skin_n_snow.png'},
  {id:'n_ranger',n:'숲 궁수',tier:1,price:300,img:'img/skin_n_ranger.png'},
  {id:'n_monk',n:'수도승',tier:1,price:300,img:'img/skin_n_monk.png'},
  {id:'n_desert',n:'사막 방랑자',tier:1,price:300,img:'img/skin_n_desert.png'},
  {id:'n_pirate',n:'해적',tier:1,price:450,img:'img/skin_n_pirate.png'},
  {id:'n_ninja',n:'그림자 닌자',tier:1,price:450,img:'img/skin_n_ninja.png'},
  {id:'n_knight',n:'철갑 기사',tier:1,price:450,img:'img/skin_n_knight.png'},
  {id:'n_mage',n:'별 마법사',tier:1,price:600,img:'img/skin_n_mage.png'},
  {id:'n_pumpkin',n:'호박 유령',tier:1,price:600,img:'img/skin_n_pumpkin.png'},
  {id:'thor',n:'토르',tier:2,price:3000,img:'img/skin_thor.png'},
  {id:'apollo',n:'아폴론',tier:2,price:3000,img:'img/skin_apollo.png'},
  {id:'artemis',n:'아르테미스',tier:2,price:3000,img:'img/skin_artemis.png'},
  {id:'wukong',n:'손오공',tier:2,price:3000,img:'img/skin_wukong.png'},
  {id:'valkyrie',n:'발키리',tier:2,price:3000,img:'img/skin_valkyrie.png'},
  {id:'hermes',n:'헤르메스',tier:2,price:3000,img:'img/skin_hermes.png'},
  {id:'zeus',n:'제우스',tier:3,price:0,img:'img/skin_zeus.png'},
  {id:'hades',n:'하데스',tier:3,price:0,img:'img/skin_hades.png'},
  {id:'cheonma',n:'천마',tier:3,price:0,img:'img/skin_cheonma.png'},
  {id:'maengju',n:'무림맹주',tier:3,price:0,img:'img/skin_maengju.png'},
];
const SKIN=Object.fromEntries(SKINS.map(s=>[s.id,s]));
const SKIN_PAID_OPEN=true; /* 출시 때 false 로 바꾸면 유료 스킨이 다시 잠긴다 */
const skinOwned=id=>id==='base'||(SAVE.skins||[]).includes(id)||(SKIN_PAID_OPEN&&SKIN[id]&&SKIN[id].tier===3);
const skinCur=()=>SKIN[SAVE.skin]&&skinOwned(SAVE.skin)?SAVE.skin:'base';
/* 동료는 늘 기본 그림 */
const baseHeroIm=new Image();baseHeroIm.src='img/hero.png';
function skinApply(){const s=SKIN[skinCur()];if(heroIm.getAttribute('src')!==s.img)heroIm.src=s.img;}
let skinSel='base';
function skinInit(){
  $('skinBtn').addEventListener('click',()=>{SFX.ui();soundOn();skinSel=skinCur();renderSkins();show('skin',true);show('hubHint',false);});
  $('skinClose').addEventListener('click',()=>{SFX.ui();show('skin',false);});
  $('skinAct').addEventListener('click',skinAct);
  skinApply();
}
function skinAct(){const s=SKIN[skinSel];if(!s)return;
  if(skinOwned(s.id)){SAVE.skin=s.id;saveNow();skinApply();SFX.level();renderSkins();if(typeof rankSubmit==='function')rankSubmit(null);return;}
  if(s.tier===3){$('skinMsg').textContent='유료 스킨은 스토어 출시 때 열립니다.';return;}
  if((SAVE.dust||0)<s.price){$('skinMsg').textContent=`마력 가루가 ${s.price-(SAVE.dust||0)} 모자랍니다.`;return;}
  SAVE.dust-=s.price;(SAVE.skins||(SAVE.skins=[])).push(s.id);SAVE.skin=s.id;saveNow();skinApply();SFX.loot(s.tier>=2?4:3);renderSkins();
}
function renderSkins(){
  const cur=skinCur(),s=SKIN[skinSel]||SKIN.base;
  $('skinBig').src=s.img;$('skinName').textContent=s.n;$('skinTier').textContent=SKIN_TIER[s.tier];$('skinTier').className='sktier t'+s.tier;$('skinMsg').textContent='';
  $('skinDust').textContent=`마력 가루 ${SAVE.dust||0}`;
  const b=$('skinAct');b.disabled=false;b.className='go';
  if(s.id===cur){b.textContent='끼고 있음';b.disabled=true;}
  else if(skinOwned(s.id))b.textContent='끼기';
  else if(s.tier===3){b.textContent='곧 판매 (유료)';b.disabled=true;b.className='go vio';}
  else{b.textContent=`사기 · 가루 ${s.price}`;if((SAVE.dust||0)<s.price)b.className='go dim';}
  const box=$('skinGrid');box.innerHTML='';
  for(const t of[0,1,2,3]){const list=SKINS.filter(k=>k.tier===t);if(!list.length)continue;box.append(el('div','skh',t===0?'기본':t===1?'일반 · 가루로 사기':t===2?'고급 · 가루를 많이 모아서':(SKIN_PAID_OPEN?'유료 · 지금은 시험으로 무료':'유료 · 출시 때 판매')));
    const g=el('div','skg');box.append(g);
    for(const k of list){const c=el('button','skc t'+k.tier+(k.id===skinSel?' sel':'')+(k.id===cur?' on':'')+(skinOwned(k.id)?'':' lock'));c.type='button';const im=el('img');im.src=k.img;im.alt='';im.loading='lazy';c.append(im,el('span',null,k.n));
      if(!skinOwned(k.id))c.append(el('em',null,k.tier===3?'유료':k.price));c.addEventListener('click',()=>{SFX.ui();skinSel=k.id;renderSkins();});g.append(c);}}
}
