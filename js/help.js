'use strict';
/* 다크 드웰러 — 게임 설명 화면(거점·멈춤·설정에서 연다).
   내용은 되도록 스킬 표·data.js 에서 읽어 와서, 숫자나 이름이 바뀌면 설명도 따라 바뀐다 */
const HELP_TABS=[['basic','기본'],['skill','스킬'],['fuse','조합'],['pas','패시브'],['gear','장비'],['mob','적·보스']];
let helpTab='basic';
const secs=s=>s<60?`${s}초`:s%60?`${s/60|0}분 ${s%60}초`:`${s/60}분`;
function hsec(title,...ps){const s=el('div','hsec');s.append(el('h3',null,title));for(const p of ps)s.append(typeof p==='string'?el('p',null,p):p);return s;}
function hrow(src,name,tag,text){const r=el('div',src?'hrow':'hrow noimg'),d=el('div');if(src){const im=el('img');im.src=src;im.alt='';r.append(im);}
  const h=el('div','hd');h.append(el('b',null,name));if(tag)h.append(el('em',null,tag));d.append(h,el('span',null,text));r.append(d);return r;}
const mobURLs={};
function mobURL(id){if(mobURLs[id]!==undefined)return mobURLs[id];try{return mobURLs[id]=ET[id].frames[0].c.toDataURL();}catch(_){return mobURLs[id]='';}}

/* 적마다 한 줄 설명 */
const MOB_TIP={moss:'곧장 다가옵니다.',rat:'잠깐 멈칫했다가 일직선으로 돌진합니다.',wisp:'좌우로 흔들며 다가옵니다. 닿으면 마법 피해입니다.',shaman:'거리를 두고 마법 구슬을 쏩니다.',puff:'붙으면 잠시 뒤 터집니다. 피해가 큽니다.',
  bat:'셋씩 떼로 빠르게 날아옵니다.',archer:'빨간 조준선이 보인 뒤 빠른 화살을 쏩니다.',wolf:'빠르게 돌진합니다.',spider:'거미줄을 쏩니다. 맞으면 2초 동안 느려집니다.',toad:'서 있는 자리에 독 웅덩이를 뱉습니다.',
  imp:'이리저리 흔들며 불덩이를 세 갈래로 쏩니다.',orc:'방패로 물리 피해를 절반 막습니다.',beetle:'수정 껍질이 마법 피해를 60% 막습니다.',wraith:'사라졌다가 곁에 나타나 벱니다.',sorcerer:'구슬을 고리 모양으로 쏘고 박쥐를 부릅니다.',
  skel:'셋씩 떼로 다가옵니다. 물리 피해를 조금 막습니다.',jelly:'잡으면 꼬마 젤리 셋으로 갈라집니다.',goblin:'거리를 두고 폭탄을 던집니다. 빨간 원을 피하세요.',monk:'뒤에서 둘레 적의 체력을 채웁니다. 먼저 잡으세요.',
  ninja:'둘씩 나와 사라졌다가 곁에 나타나 벱니다.',icesp:'얼음 조각을 쏩니다. 맞으면 느려집니다.',garg:'둘씩 흔들며 날아옵니다. 물리 피해를 절반 막습니다.',turtle:'아주 단단하고, 지나간 자리에 불 웅덩이를 남깁니다.',mimic:'상자인 척 가만히 있다가 다가가면 깨어납니다. 장비를 잘 떨어뜨립니다.',
  golem:'자리를 찍어 두고 내려칩니다.',ogre:'돌진한 뒤 그 자리를 내려칩니다.',treant:'뿌리를 세 줄기로 뻗습니다. 맞으면 느려집니다.'};
const PAT_N={slam:'내려찍기',crack:'땅 균열',nova:'구슬 고리',spiral:'나선 탄막',aimed:'조준 연사',breath:'숨결',charge:'돌진',rain:'불비',pools:'장판',summon:'부하 소환',blink:'순간이동'};
const pct=v=>Math.round(v*100)+'%';

const HELP={
  basic:()=>[
    hsec('조작','화면 아무 곳이나 누른 채 끌면 그쪽으로 움직입니다. PC에서는 WASD나 방향키입니다.','공격과 스킬은 모두 자동으로 나갑니다. 피하면서 적을 스킬 범위 안에 두는 것이 전부입니다.'),
    hsec('한 판의 흐름','적을 잡으면 떨어지는 경험치 구슬을 주워 레벨을 올립니다. 레벨이 오르면 액티브 스킬 하나, 패시브 하나를 차례로 고릅니다.',
      '선택지는 3개이고, 행운이 25 이상이거나 혜안 같은 효과가 있으면 4개(최대 4개)입니다. 아래 초록 단추로 광고를 보면 보이는 선택지를 모두 받습니다. 레벨과 스킬은 판마다 처음으로 돌아가지만, 주운 장비는 창고에 남아 다음 판에도 끼고 들어갑니다.','고른 시간을 버티면 그 맵의 대군주가 나타나고, 잡으면 승리입니다. 무한 모드는 끝이 없습니다.'),
    hsec('난이도','시간이 흐를수록 적이 많아지고 체력과 공격이 오릅니다.','맵은 별이 많을수록 처음부터 강하고, 그만큼 좋은 장비가 나옵니다.','붉은 기운을 두른 강화된 적은 체력 4배·공격 1.5배이고 장비를 잘 떨어뜨립니다.'),
    hsec('일어나는 일',`정예 — ${secs(ELITE_FROM)}부터 ${ELITE_EVERY}초마다 한 마리씩 나옵니다.`,`보스 — ${secs(BOSS_EVERY)}마다 나옵니다. 잡으면 장비 2개를 줍니다.`,
      `몰려오기 — ${secs(HORDE_FROM)}부터 ${secs(HORDE_EVERY)}마다 ${HORDE_LEN}초 동안 적이 사방에서 밀려옵니다.`,`버닝 타임 — ${secs(BURN_FROM)}부터 ${secs(BURN_EVERY)}마다 ${BURN_LEN}초. 경험치 2배, 장비 2배, 적도 더 많이 나옵니다.`),
    hsec('회복','모닥불 곁에 서 있으면 체력이 찹니다. 레벨이 오를 때도 조금 찹니다.','재생 패시브와 장비의 체력 재생으로 더 채울 수 있습니다.'),
    hsec('미니맵 (왼쪽 위)','주황 점 = 모닥불 · 흰 점 = 나 · 금빛 네모 = 보물 상자','빨간 마름모 = 잠든 수호 보스. 멀리 있는 것일수록 강하고, 잡으면 신화 장비가 반드시 나옵니다.','주황 고리 = 지금 나타나 있는 보스 · 색 점 = 바닥에 떨어진 전설·신화 장비'),
    hsec('적의 공격 알아보기','적의 공격은 모두 빨간색입니다. 내 스킬은 이 색을 쓰지 않습니다.','빨간 가시가 도는 검은 구슬 = 적의 탄 · 빨간 끝의 화살 = 궁수의 화살','빨간 원·빨간 띠 = 곧 공격이 떨어질 자리. 다 차기 전에 벗어나세요.','빨간 점선 테두리의 검붉은 웅덩이 = 적이 깐 장판. 밟고 있는 동안 계속 피해를 줍니다(거미줄·얼음은 발도 느려짐).'),
    hsec('맵 기믹','모닥불 숲 · 축복 제단: 위에 잠깐 서 있으면 축복 하나를 받습니다(분노 피해 +40%, 바람 이동 +35%, 수확 경험치 끌어오기, 생명 체력 회복). 쓰고 나면 90초 쉽니다.','서리 폐허 · 얼음 수정: 닿으면 깨지며 둘레의 적을 3초 얼립니다(보스는 느려지기만). 눈보라가 불면 나도 조금 느려지지만 적은 훨씬 느려집니다.','잿불 황야 · 화약통: 닿으면 1초 뒤 크게 터져 적만 다칩니다. 옆 통도 따라 터집니다. 화산탄은 빨간 원으로 미리 보이니 피하세요(적도 맞습니다).','심연 · 영혼 등불: 닿으면 75초 동안 켜집니다. 빛 안에서는 피해 +30%, 체력이 조금씩 찹니다. 어둠이 짙어질 때 등불 곁으로 가세요.'),
    hsec('져도 남는 것','어둠 결정: 오늘의 도전과 영겁의 굴레에서만 얻습니다(버틴 시간·처치·클리어만큼, 쓰러져도 받음). 거점의 어둠의 제단(특성)에서 써서 체력·피해·쿨타임·다시 굴리기·불사 같은 영구 능력을 올립니다. 보통 맵에서는 장비와 마력 가루를 얻습니다.','야영지: 거점은 동굴 안입니다. 모닥불 둘레를 걸어 다니다 아래 출구에서 맵을 골라 바깥으로 나가고, 대장간·창고·어둠의 제단(특성)·도감 비석에 다가가면 열 수 있습니다.','분해·재련(야영지 대장간에서만, 판 안에서는 안 됨): 안 쓰는 장비를 분해하면 마력 가루가 남습니다. 가루로 장비의 줄을 새로 굴립니다. 오를 수도 내려갈 수도 있고, 2% 확률로 빛이 나며 한 줄이 최대치가 됩니다. 최대치가 된 줄은 잠가서 지킬 수 있고, 잠근 줄 하나마다 재련값이 60%씩 비싸집니다.','도감: 처음 보는 것마다 마력 가루 +3(도전·굴레 안에서는 어둠 결정 +2), 한 갈래를 다 모으면 마력 가루 +150.','오늘의 도전: 날마다 맵과 규칙 둘이 바뀝니다. 그날 첫 판은 버틴 만큼 어둠 결정, 판마다 마력 가루를 얻고, 그날 처음 깨면 신화 장비 1개 확정 + 그 판의 어둠 결정·마력 가루 4배(최소 결정 200 · 가루 400).'),
    hsec('판 안의 사건','보물 고블린: 이따금 금빛 고블린이 나타나 도망칩니다. 25초 안에 잡으면 장비 넷과 보석이 쏟아집니다.','갈림길 제단: 보라 불꽃 제단 위에 1초 서 있으면 계약 둘 가운데 하나를 고릅니다(대가를 받고 보상을 얻음). 그냥 지나가도 됩니다.','작은 임무: 화면 위에 짧은 임무가 뜹니다. 해내면 경험치와 보상 상자.','희귀 선택지: 레벨업 때 금빛 선택지는 두 단계가 한 번에 오릅니다. 특성의 다시 굴리기로 선택지를 새로 받을 수 있습니다.','보물 상자는 열 때 등급이 룰렛처럼 돌다 멈춥니다.','자석: 주우면 화면의 경험치 보석을 모두 끌어옵니다(정예가 꼭 떨어뜨리고, 1분 남짓마다 근처에 생깁니다). 찐빵: 체력 30% 회복.','쓰러지면 한 판에 한 번, 광고를 보고 그 자리에서 부활할 수 있습니다.'),
    hsec('클리어와 영겁의 굴레','클리어: 맵마다 정해진 시간(모닥불 숲 · 서리 폐허 · 잿불 황야 10분, 심연 15분)을 버티면 대군주가 나오고, 잡으면 클리어입니다. 무한은 쓰러질 때까지 계속됩니다.','적은 몇 분마다 얼굴이 바뀝니다. 처음 나온 적은 시간이 지나면 덜 나오고 새 적이 섞여 들어옵니다. 등장은 80초 주기로 밀물과 썰물이 있습니다.','영겁의 굴레: 심연을 클리어하면 열립니다. 단계를 골라 들어가 10분 안에 적을 잡아 굴레를 채우면 굴레의 수호자가 나옵니다. 수호자를 잡으면 성공이고, 남은 시간이 절반 넘으면 +3단계, 4분의 1 넘으면 +2단계, 그 밖에는 +1단계가 열립니다.','단계가 오를 때마다 적 체력이 17%, 공격이 9% 늘고, 성공 보상(장비 수와 등급)이 좋아집니다. 성공 보상은 모두 전설 이상이고, 단계가 높을수록 신화가 잘 나옵니다(10단계부터 신화 1개 확정). 맵은 네 곳 가운데 하나가 무작위로 열립니다.'),
    hsec('보스전','보스가 나오면 멀리 있던 잔챙이는 흩어지고, 처음 45초 동안은 잔챙이가 적게 나옵니다(그 뒤 1분에 걸쳐 원래대로). 그동안은 정예와 몰려오기도 미뤄집니다.','앞 보스를 잡기 전에는 다음 보스가 나오지 않습니다. 마지막 대군주만은 시간이 되면 반드시 나옵니다.'),
  ],
  skill:()=>{
    const out=[hsec('액티브 스킬',`가짓수 제한 없이 전부 배울 수 있고, 한 스킬은 ${SKILL_MAX}단계까지 오릅니다.`,'단계가 오를 때마다 그 스킬만의 옵션이 붙습니다. 선택지에 "특수"라고 적힌 것은 피해 말고 다른 효과가 생기는 단계입니다.')];
    const box=el('div','hsec');box.append(el('h3',null,'스킬 목록'));
    for(const id in ACTIVES){const A=ACTIVES[id];if(!A.fuse)box.append(hrow(skillIconURL(id),A.n,A.el,A.d));}
    out.push(box,hsec('원소 반응','융해 — 얼었거나 느려진 적에게 불을 맞히면 피해 1.6배.','급소 — 멈춘(기절·빙결) 적을 베면 반드시 치명타. 보스에게는 안 통합니다.','과부하 — 불타는 적에게 번개를 맞히면 주위가 함께 터집니다.'));
    return out;},
  fuse:()=>{
    const out=[hsec('조합 스킬',`재료가 되는 두 스킬이 모두 ${FUSE_LV}단계가 되면 선택지 맨 위에 조합 스킬이 나옵니다.`,'조합하면 재료 두 스킬은 하나로 합쳐져 사라지고, 그만큼 처음부터 강합니다(피해 1.8배에서 시작).','멈춤 화면에서 재료가 몇 단계까지 찼는지 볼 수 있습니다.')];
    const box=el('div','hsec');box.append(el('h3',null,'조합표'));
    for(const id in ACTIVES){const A=ACTIVES[id];if(!A.fuse)continue;const r=hrow(skillIconURL(id),A.n,A.el,A.d),f=el('div','hfuse');
      A.fuse.forEach((k,i)=>{if(i)f.append(el('i',null,'+'));const im=el('img');im.src=skillIconURL(k);im.alt='';f.append(im,ACTIVES[k].n);});r.lastChild.append(f);box.append(r);}
    out.push(box);return out;},
  pas:()=>{
    const out=[hsec('패시브',`한 판에 ${MAX_PAS}종까지 고를 수 있습니다. 같은 것을 다시 고르면 효과가 그만큼 더 쌓입니다.`,'행운이 25가 되면 선택지가 4개, 60이 되면 5개로 늘고 장비도 더 잘 떨어집니다.',
      `쿨타임 감소는 모두 합쳐 35%까지만 먹힙니다.`)];
    const box=el('div','hsec');box.append(el('h3',null,'패시브 목록'));
    for(const id in PASSIVES)box.append(hrow(skillIconURL('p_'+id),PASSIVES[id].n,null,'1단계마다 '+passiveText(id)));
    out.push(box);return out;},
  gear:()=>{
    const gr=el('div','hsec');gr.append(el('h3',null,'등급'));
    const rate=['60%','29.45%','9%','1%','0.5%'];
    GRADES.forEach((g,i)=>{const r=el('div','hgrade');r.style.setProperty('--gc',g.c);r.append(el('i'),el('b',null,g.k),el('span',null,`능력치 ${g.n}줄 · 나올 확률 ${rate[i]}`));gr.append(r);});
    const pr=el('div','hgrade');pr.style.setProperty('--gc',PRIME.c);pr.append(el('i'),el('b',null,PRIME.k+' 신화'),el('span',null,'모든 줄의 최대치가 1.5배 · 0.05%'));gr.append(pr);
    const st=el('div','hsec');st.append(el('h3',null,'세트 효과'),el('p',null,'같은 세트의 장비를 2·3·4개 끼면 효과가 차례로 켜집니다.'));
    for(const k in SETS){const s=SETS[k];st.append(hrow('',s.n,null,s.b.map((t,i)=>`${i+2}개: ${t}`).join(' / ')));}
    return[
      hsec('장비 칸','모두 14칸입니다 — 투구, 목걸이, 귀걸이 2, 무기 2, 갑옷, 장갑, 벨트, 신발, 반지 4.','판 도중에도 멈추고 갈아 낄 수 있습니다. 창고는 200칸입니다.'),gr,
      hsec('능력치 읽는 법','장비를 누르면 줄마다 지금 값과 그 줄이 가질 수 있는 최대치가 함께 나옵니다.','칸 오른쪽 아래 숫자는 완성도(0~100)입니다. 모든 줄이 최대치면 100입니다.','늦은 시간에, 어려운 맵에서 떨어진 장비일수록 최대치에 가깝게 나옵니다.'),
      hsec('고유 효과','전설과 신화 장비에는 이름마다 정해진 고유 효과가 하나씩 붙습니다. 장비 설명 창의 금빛 줄이 그것입니다.'),st,
      hsec('어디서 나오나','보통 적 1.2%, 강화된 적 10% 확률로 떨어뜨립니다. 정예는 1개, 보스는 2개, 보물 상자는 1~2개를 줍니다.','수호 보스는 신화 장비를 반드시 주고, 먼 곳의 수호 보스는 하나 더 줍니다.'),
    ];},
  mob:()=>{
    const out=[hsec('적의 방어','방패 오크처럼 "단단함"이 뜨는 적은 물리(무공 계열) 피해를, "저항"이 뜨는 적은 마법(화염·번개·냉기·자연·암흑·태극) 피해를 덜 받습니다. 다른 계열 스킬로 잡는 것이 빠릅니다.',
      '정예는 기절·빙결이 절반만 갑니다.')];
    const b1=el('div','hsec');b1.append(el('h3',null,'보통 적'));const b2=el('div','hsec');b2.append(el('h3',null,'정예'));const b3=el('div','hsec');b3.append(el('h3',null,'보스'));
    for(const id in MOB_TIP){const T=ET[id];if(T)(T.elite?b2:b1).append(hrow(mobURL(id),T.n,T.magic?'마법':null,MOB_TIP[id]));}
    b3.append(el('p',null,'기절과 빙결에 99% 면역이고 둔화도 거의 안 먹힙니다. 체력이 50%가 되면 분노, 20%가 되면 광폭 상태가 되어 공격이 빨라지고 세집니다.'));
    for(const id in BOSS_DEF){const T=ET[id];b3.append(hrow(mobURL(id),T.n,null,`물리 ${pct(T.def)} · 마법 ${pct(T.mres)} 줄임 — ${T.pats.map(k=>PAT_N[k]).join(', ')}`));}
    out.push(b1,b2,b3);return out;},
};
function renderHelp(){
  const tb=$('helpTabs');tb.innerHTML='';
  for(const[k,n]of HELP_TABS){const b=el('button',k===helpTab?'on':null,n);b.type='button';b.addEventListener('click',()=>{helpTab=k;SFX.ui();renderHelp();});tb.append(b);}
  const body=$('helpBody');body.innerHTML='';body.append(...HELP[helpTab]());body.scrollTop=0;
}
function openHelp(){soundOn();SFX.ui();joy=null;renderHelp();show('help',true);}
for(const id of['helpBtn','helpBtn2','helpBtn3'])$(id).addEventListener('click',openHelp);
$('helpClose').addEventListener('click',()=>show('help',false));
