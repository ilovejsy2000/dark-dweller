'use strict';
/* 다크 드웰러 — 내용 표.
   등급·옵션·장비·고유 효과·패시브·모드·난이도는 여기 줄을 고치거나 더하면 된다.
   (액티브 스킬은 움직임이 달라서 game.js 의 ACTIVES 에 있다.) */

/* 등급: w 떨어질 때의 확률(%) — 전설 1%, 신화 0.5%, 초월 신화 0.05%(11-14 대표님). n 옵션 줄 수, m 수치 배율, beam 빛기둥 높이 */
const GRADES=[
  {k:'일반',c:'#d8d2c4',w:60,n:1,m:1},
  {k:'레어',c:'#57a8ff',w:29.45,n:2,m:1.3},
  {k:'유니크',c:'#b678ff',w:9,n:3,m:1.7},
  {k:'전설',c:'#ffab2e',w:1,n:4,m:2.2,beam:195},
  {k:'신화',c:'#ff4f72',w:.55,n:5,m:2.8,beam:265},
];

/* 옵션: min~max 는 일반 등급 기준 범위. 등급 배율 m 을 곱한 값이 그 장비의 범위이고, max×m 이 '최대'로 표시된다. */
const STAT={
  dmg:{n:'공격력',u:'%',min:4,max:9},
  aspd:{n:'공격 속도',u:'%',min:3,max:7},
  crit:{n:'치명타 확률',u:'%',min:2,max:5},
  critd:{n:'치명타 피해',u:'%',min:8,max:18},
  hp:{n:'체력',u:'',min:30,max:75},
  def:{n:'방어',u:'',min:3,max:8},
  mres:{n:'마법 저항',u:'%',min:2,max:5},
  move:{n:'이동 속도',u:'%',min:2,max:5},
  pick:{n:'획득 범위',u:'%',min:8,max:18},
  xp:{n:'경험치',u:'%',min:4,max:9},
  luck:{n:'행운',u:'',min:3,max:7},
  cdr:{n:'쿨타임',u:'%',min:2,max:4,neg:1},
  regen:{n:'체력 재생',u:'/초',min:.6,max:1.6,dec:1},
  area:{n:'공격 범위',u:'%',min:3,max:7},
};
const STAT_ORDER=['dmg','aspd','crit','critd','hp','def','mres','move','pick','xp','luck','cdr','regen','area'];
const fmtVal=(k,v)=>{const s=STAT[k];return `${s.neg?'-':'+'}${s.dec?(+v).toFixed(1):Math.round(v)}${s.u}`;};
const fmtLine=(k,v)=>`${STAT[k].n} ${fmtVal(k,v)}`;
function lineRange(k,gi){const s=STAT[k],m=GRADES[gi].m,f=v=>s.dec?Math.round(v*10)/10:Math.max(1,Math.round(v));return[f(s.min*m),f(s.max*m)];}

/* 장비 종류: w 떨어질 비중(칸 수만큼) */
const SLOT_TYPES={
  helm:{n:'투구',icon:'helm',w:1},amulet:{n:'목걸이',icon:'amulet',w:1},ear:{n:'귀걸이',icon:'ear',w:2},weapon:{n:'무기',icon:'sword',w:2},armor:{n:'갑옷',icon:'armor',w:1},
  glove:{n:'장갑',icon:'glove',w:1},belt:{n:'벨트',icon:'belt',w:1},boots:{n:'신발',icon:'boots',w:1},ring:{n:'반지',icon:'ring',w:4},
};
/* 장비 칸 14개: [칸 이름, 종류] */
const EQUIP_SLOTS=[['helm','helm'],['amulet','amulet'],['ear1','ear'],['ear2','ear'],['weapon1','weapon'],['weapon2','weapon'],['armor','armor'],
  ['glove','glove'],['belt','belt'],['boots','boots'],['ring1','ring'],['ring2','ring'],['ring3','ring'],['ring4','ring']];
const STASH_MAX=200;

/* 이름이 정해진 장비. l = 그 장비가 가질 수 있는 옵션 5줄(순서대로, 등급의 줄 수만큼 붙는다). m = 그림 재질 */
const ITEM_BASES={
  weapon:[{n:'장검',m:'iron',l:['dmg','crit','critd','aspd','area']},{n:'손도끼',m:'iron',l:['dmg','critd','hp','area','luck']},{n:'단창',m:'wood',l:['dmg','aspd','cdr','crit','move']},{n:'쌍날검',m:'gold',l:['dmg','aspd','crit','critd','cdr']}],
  helm:[{n:'가죽 두건',m:'leather',l:['hp','xp','luck','cdr','mres']},{n:'무쇠 투구',m:'iron',l:['hp','def','mres','regen','dmg']},{n:'뿔 투구',m:'bone',l:['hp','dmg','critd','def','area']}],
  armor:[{n:'누비 갑옷',m:'leather',l:['def','hp','regen','mres','xp']},{n:'사슬 갑옷',m:'iron',l:['def','hp','mres','dmg','cdr']},{n:'비늘 갑옷',m:'gold',l:['def','mres','hp','regen','area']}],
  glove:[{n:'가죽 장갑',m:'leather',l:['aspd','crit','pick','dmg','luck']},{n:'무쇠 장갑',m:'iron',l:['aspd','def','dmg','critd','hp']}],
  belt:[{n:'밧줄 허리띠',m:'wood',l:['hp','pick','xp','regen','move']},{n:'징 박힌 벨트',m:'iron',l:['hp','def','dmg','mres','cdr']}],
  boots:[{n:'짚신',m:'wood',l:['move','pick','xp','luck','regen']},{n:'가죽 장화',m:'leather',l:['move','def','hp','mres','aspd']},{n:'무쇠 장화',m:'iron',l:['move','def','hp','dmg','mres']}],
  amulet:[{n:'뼈 목걸이',m:'bone',l:['luck','crit','dmg','xp','cdr']},{n:'호박 목걸이',m:'gold',l:['luck','hp','regen','mres','area']},{n:'부적 목걸이',m:'wood',l:['luck','mres','cdr','xp','def']}],
  ear:[{n:'은 귀걸이',m:'iron',l:['crit','critd','luck','aspd','cdr']},{n:'송곳니 귀걸이',m:'bone',l:['crit','dmg','critd','hp','area']},{n:'달 귀걸이',m:'gold',l:['crit','mres','xp','luck','regen']}],
  ring:[{n:'구리 반지',m:'wood',l:['critd','dmg','hp','crit','pick']},{n:'옥 반지',m:'leather',l:['critd','luck','mres','cdr','regen']},{n:'뱀 반지',m:'gold',l:['critd','crit','aspd','dmg','area']}],
};
const PREFIX=[['낡은','무딘','거친'],['단단한','날랜','서늘한'],['달무리','이끼 낀','재투성이']];
/* 전설: 정해진 이름 + 바탕 장비(b) + 고유 효과(fx) + 세트(set). 이름은 대표님 구성표의 신·영웅에서 가져왔다 */
const LEGENDS={
  weapon:[{n:'아레스의 파멸검',b:0,fx:'rampage'},{n:'헤파이스토스의 망치',b:1,fx:'forge'},{n:'아킬레우스의 창',b:2,fx:'cull'},{n:'페르세우스의 검',b:3,fx:'slayer'},{n:'토르의 전투 도끼',b:1,fx:'stormEl'},
    {n:'하데스의 사령검',b:0,fx:'souls',set:'hades'},{n:'수르트의 불꽃검',b:0,fx:'forge',set:'surtr'},{n:'포세이돈의 작살',b:2,fx:'frostEl',set:'poseidon'}],
  helm:[{n:'아테나의 투구',b:1,fx:'guard',set:'athena'},{n:'오딘의 외눈 투구',b:2,fx:'allDmg',set:'odin'},{n:'길가메시의 왕관',b:1,fx:'slayer'},{n:'메두사의 응시',b:2,fx:'medusa'}],
  armor:[{n:'제우스의 번개 갑옷',b:1,fx:'stormArmor',set:'zeus'},{n:'헤라클레스의 흉갑',b:2,fx:'titan'},{n:'발키리의 전투 갑옷',b:1,fx:'valk'},{n:'아틀라스의 거신 갑옷',b:2,fx:'atlas'},{n:'오시리스의 부활 갑옷',b:0,fx:'revive'},
    {n:'하데스의 수의',b:0,fx:'darkEl',set:'hades'},{n:'아테나의 흉갑',b:2,fx:'guard',set:'athena'}],
  glove:[{n:'토르의 장갑',b:1,fx:'stormEl'},{n:'헤파이스토스의 장갑',b:0,fx:'forge'},{n:'수르트의 손아귀',b:1,fx:'forge',set:'surtr'}],
  belt:[{n:'치우의 허리띠',b:1,fx:'firstBlood'},{n:'요르문간드의 비늘',b:1,fx:'venomEl'},{n:'포세이돈의 허리띠',b:0,fx:'frostEl',set:'poseidon'}],
  boots:[{n:'헤르메스의 날개 신발',b:0,fx:'dodge'},{n:'이카루스의 깃털 신발',b:1,fx:'swift'},{n:'발키리의 장화',b:2,fx:'valk'}],
  amulet:[{n:'아프로디테의 심장',b:1,fx:'regenPlus'},{n:'프레이야의 목걸이',b:1,fx:'golden'},{n:'오딘의 룬 목걸이',b:0,fx:'rune',set:'odin'},{n:'제우스의 뇌석',b:1,fx:'stormEl',set:'zeus'}],
  ear:[{n:'아르테미스의 귀걸이',b:1,fx:'keenEye'},{n:'아누비스의 귀걸이',b:1,fx:'execute'},{n:'펜리르의 송곳니',b:1,fx:'cull'},{n:'포세이돈의 진주 귀걸이',b:0,fx:'frostEl',set:'poseidon'},{n:'하데스의 흑요석 귀걸이',b:0,fx:'darkEl',set:'hades'}],
  ring:[{n:'로키의 반지',b:2,fx:'echo'},{n:'프로메테우스의 불씨',b:0,fx:'forge'},{n:'라의 태양 반지',b:1,fx:'ra'},{n:'제우스의 반지',b:0,fx:'stormEl',set:'zeus'},{n:'오딘의 반지',b:1,fx:'allDmg',set:'odin'},{n:'아테나의 반지',b:1,fx:'guard',set:'athena'},{n:'수르트의 반지',b:0,fx:'forge',set:'surtr'}],
};
/* 신화: 옵션 5줄과 전투 방식을 바꾸는 고유 효과가 정해져 있다. i 그림 모양 번호, deco 꾸밈 */
const MYTHS={
  weapon:[{n:'제우스의 천벌',i:0,deco:'bolt',m:'gold',l:['dmg','crit','critd','aspd','area'],fx:'zeus',set:'zeus'},{n:'오딘의 궁니르',i:2,m:'iron',l:['dmg','aspd','cdr','crit','critd'],fx:'gungnir',set:'odin'},
    {n:'하데스의 영혼 수확자',i:0,m:'iron',l:['dmg','critd','hp','cdr','area'],fx:'hades',set:'hades'},{n:'수르트의 종말검',i:0,m:'gold',l:['dmg','area','critd','aspd','crit'],fx:'surtr',set:'surtr'},
    {n:'포세이돈의 삼지창',i:2,m:'gold',l:['dmg','area','aspd','cdr','crit'],fx:'poseidon',set:'poseidon'},{n:'아서왕의 엑스칼리버',i:0,m:'gold',l:['dmg','crit','critd','aspd','hp'],fx:'excalibur'}],
  helm:[{n:'니케의 승리의 월계관',i:1,deco:'plume',m:'gold',l:['hp','dmg','critd','cdr','area'],fx:'nike'},{n:'아누비스의 영원한 가면',i:0,m:'gold',l:['hp','mres','dmg','regen','luck'],fx:'anubis'}],
  armor:[{n:'아테나의 절대 갑옷',i:1,m:'gold',l:['def','hp','mres','regen','cdr'],fx:'aegis',set:'athena'},{n:'오딘의 지혜로운 망토',i:0,m:'leather',l:['def','xp','mres','cdr','hp'],fx:'wisdom'},
    {n:'헤라클레스의 신력 갑옷',i:2,m:'gold',l:['def','hp','dmg','regen','area'],fx:'titan2'},{n:'크로노스의 시간 갑옷',i:1,m:'iron',l:['def','hp','mres','cdr','regen'],fx:'rewind'}],
  glove:[{n:'토르의 묠니르 장갑',i:1,deco:'bolt',m:'iron',l:['aspd','dmg','critd','crit','area'],fx:'mjolnir'}],
  belt:[{n:'가이아의 생명의 띠',i:0,m:'wood',l:['hp','regen','def','mres','xp'],fx:'gaia'}],
  boots:[{n:'헤르메스의 탈라리아',i:0,deco:'wing',m:'gold',l:['move','aspd','pick','cdr','luck'],fx:'dodge2'}],
  amulet:[{n:'크로노스의 시간의 모래',i:1,m:'gold',l:['luck','cdr','aspd','xp','hp'],fx:'chronos'},{n:'발두르의 광휘',i:1,m:'gold',l:['luck','hp','mres','regen','def'],fx:'aegis'}],
  ear:[{n:'모이라이의 운명의 실',i:2,m:'gold',l:['crit','xp','luck','cdr','critd'],fx:'fate'},{n:'에레보스의 심연의 눈',i:1,m:'bone',l:['crit','critd','dmg','area','cdr']  ,fx:'erebus'}],
  ring:[{n:'로키의 속임수 반지',i:2,m:'gold',l:['critd','crit','luck','aspd','dmg'],fx:'echo2'},{n:'헤카테의 마녀 인장',i:1,m:'gold',l:['critd','dmg','area','cdr','crit'],fx:'hecate'},{n:'라의 태양 원반',i:1,deco:'sun',m:'gold',l:['critd','dmg','area','cdr','regen'],fx:'ra2'}],
};
/* 신화 가운데 아주 드물게(신화 11개에 하나) 나오는 '초월' 신화: 모든 줄의 범위가 1.5배 */
const PRIME={k:'초월',c:'#fff0c2',m:1.5,p:1/11};

/* 고유 효과 설명 */
const FXS={
  zapChain:'연쇄 번개가 2번 더 튐',boltTwin:'화염구 +1발',slashWide:'베기 범위 +30%',bladePlus:'회전 칼날 +1개',meteorBig:'화염 낙하 폭발 범위 +40%',spearTwin:'얼음 창 +1개',axePlus:'도끼 투척 +1개',
  vineLong:'가시 덩굴 지속 +2초',waveHeal:'빛의 파동이 체력을 4% 채움',fireKeeper:'모닥불 곁 회복 3배',thorns:'맞으면 주위 적에게 피해',
  firstBlood:'체력이 가득한 적에게 피해 +40%',dodge:'15% 확률로 피해를 피함',golden:'장비가 30% 더 잘 떨어짐',execute:'체력 15% 아래의 적을 바로 처치(보스 제외)',echo:'치명타가 20% 확률로 한 번 더 들어감',
  rampage:'연속 처치할수록 피해 +1%씩(최대 +50%, 3초 안에 못 잡으면 초기화)',forge:'화염 피해 +25%',stormEl:'번개 피해 +25%',frostEl:'냉기 피해 +25%',darkEl:'암흑·독 피해 +25%',venomEl:'독 피해 +40%',
  cull:'체력 30% 아래의 적에게 피해 +50%',slayer:'정예·보스에게 피해 +30%',souls:'처치할 때마다 체력 0.3% 회복',allDmg:'모든 피해 +10%',guard:'받는 피해 -10%',medusa:'맞힌 적을 3% 확률로 1.5초 석화',
  stormArmor:'맞으면 주위 적 넷에게 벼락',titan:'최대 체력 +15%, 최대 체력 100마다 피해 +10%',valk:'처치하면 3초 동안 이동·공격 속도 +15%',atlas:'받는 피해 -20%, 이동 속도 -10%',revive:'한 판에 한 번, 쓰러질 때 체력 50%로 되살아남',
  swift:'이동 속도 +15%',regenPlus:'체력 재생 +1.5/초',rune:'스킬이 맞을 때 6% 확률로 낙뢰',keenEye:'치명타 확률 +8%',ra:'9초마다 태양 광선이 적진을 가로지름',
  zeus:'번개 피해 +60%, 번개가 맞을 때 15% 확률로 낙뢰',gungnir:'냉기 피해 +40%·물리 피해 +20%, 얼음 창 +2개',hades:'처치할 때마다 이번 판 피해 +0.5%(최대 +100%)',surtr:'화염 피해 +60%, 화염 낙하가 늘 불바다를 남김',
  poseidon:'냉기 피해 +60%, 얼거나 느려진 적이 죽으면 얼음이 터짐',excalibur:'물리 피해 +50%, 다섯 번째 베기마다 검기 세 줄기',nike:'연속 처치할수록 피해 +2%씩(최대 +100%)',anubis:'처치할 때마다 체력 0.6% 회복',
  aegis:'12초마다 피해를 한 번 막고 주위 적에게 되돌림',wisdom:'레벨업 선택지 +1',titan2:'최대 체력 +15%, 최대 체력 100마다 피해 +15%',rewind:'25% 확률로 받은 피해를 되돌림',
  mjolnir:'번개 피해 +30%, 도끼 투척 +2개',gaia:'최대 체력 +30%, 체력 재생 2배',dodge2:'25% 확률로 피해를 피함, 이동 속도 +15%',chronos:'쿨타임 -25%, 10% 확률로 스킬을 바로 다시 씀',
  fate:'레벨업할 때 10% 확률로 선택을 한 번 더',erebus:'암흑·독 피해 +60%',echo2:'치명타가 35% 확률로 한 번 더 들어감',hecate:'조합 스킬 피해 +40%',ra2:'6초마다 태양 광선이 적진을 가로지름',
};
/* 세트: 같은 세트 장비를 2·3·4개 끼면 차례로 켜진다 */
const SETS={
  zeus:{n:'제우스의 천벌',b:['번개 피해 +25%','연쇄 번개 +3번','번개가 맞을 때 20% 확률로 낙뢰']},
  odin:{n:'오딘의 지혜',b:['모든 피해 +15%','레벨업 선택지 +1','조합 스킬 피해 +40%']},
  hades:{n:'하데스의 지배',b:['암흑·독 피해 +25%','처치할 때마다 체력 0.3% 회복','30마리 처치마다 사신의 낫']},
  athena:{n:'아테나의 수호',b:['받는 피해 -10%','마법 저항 +20%','12초마다 피해를 한 번 막음']},
  surtr:{n:'수르트의 종말',b:['화염 피해 +25%','공격 범위 +15%','화염으로 처치하면 폭발']},
  poseidon:{n:'포세이돈의 심판',b:['냉기 피해 +25%','얼거나 느려진 적에게 피해 +20%','얼거나 느려진 적이 죽으면 얼음이 터짐']},
};

/* 패시브: 단계마다 stat 이 v 만큼 오른다 */
const PASSIVES={
  might:{n:'파괴력',icon:'sword',stat:'dmg',v:10},
  haste:{n:'연타',icon:'glove',stat:'aspd',v:8},
  keen:{n:'치명',icon:'star',stat:'crit',v:5,stat2:'critd',v2:10},
  vigor:{n:'생명력',icon:'heart',stat:'hp',v:50},
  hide:{n:'철갑',icon:'armor',stat:'def',v:6},
  ward:{n:'마법 방벽',icon:'ward',stat:'mres',v:8},
  swift:{n:'질주',icon:'boots',stat:'move',v:6},
  magnet:{n:'자력',icon:'magnet',stat:'pick',v:25},
  learn:{n:'지식',icon:'book',stat:'xp',v:10},
  luck:{n:'행운',icon:'ring',stat:'luck',v:10},
  regen:{n:'재생',icon:'heart',stat:'regen',v:1.2},
  focus:{n:'가속',icon:'hourglass',stat:'cdr',v:5},
  reach:{n:'확장',icon:'rings',stat:'area',v:8},
};
function passiveText(id){const p=PASSIVES[id];return fmtLine(p.stat,p.v)+(p.stat2?' · '+fmtLine(p.stat2,p.v2):'');}

/* 시간 모드 (t 초, 0 = 무한) */
/* 11-15 대표님 "판이 길어 지루": 맵마다 정해진 시간을 버티고 끝 보스를 잡으면 클리어(t:-1 = 그 맵의 clear), 무한은 그대로 */
const MODES=[{k:'클리어',t:-1},{k:'무한',t:0}];
/* 액티브는 가짓수 제한 없이 전부 배울 수 있다(11-14 대표님). 패시브는 6종까지. */
const BOSS_EVERY=300,ELITE_FROM=45,ELITE_EVERY=25,MAX_ACT=99,MAX_PAS=6;
/* 사건: 몰려오기(90초부터 3분마다 12초), 버닝 타임(3분부터 3분마다 20초: 경험치 2배·드롭 2.5배·적 더 많이) */
const MINI_HORDE=40,HORDE_FROM=90,HORDE_EVERY=180,HORDE_LEN=12,BURN_FROM=180,BURN_EVERY=180,BURN_LEN=20;

/* 난이도: m = 버틴 분 */
const DIFF={
  spawn:m=>Math.min(32,2.4+m*2.4),            // 초당 등장 수
  cap:m=>Math.min(440,190+m*26),              // 동시에 있는 적의 한도
  hp:m=>(.75+.75*m)*Math.pow(1.105,m), // 11-15 대표님 "시간에 따라 체력을 더 탄력적으로": 1.08 → 1.105 (10분 22배, 20분 116배, 30분 460배)         // 적 체력 배율 (시작 0.75배, 5분 6.6배, 10분 17배, 20분 75배) — 초반만 살짝 약하게. 기본 체력 자체를 3배쯤 올려 처음부터 여러 번 때려야 죽는다
  dmg:m=>1+.42*m,                              // 적 공격 배율
  spd:m=>1+Math.min(.45,m*.025),              // 적 이동 속도 배율
  xp:m=>1+.15*m+.035*m*m,                     // 경험치 배율(늦게 갈수록 크게: 10분 5배, 20분 18배, 30분 37배)
  champ:m=>Math.min(.35,Math.max(0,(m-.5)*.04)), // 강화된 적(크고 붉은 기운)이 섞여 나올 확률
  /* 등장 흐름(11-15 대표님 "시간에 따라 개체 수 조절"): 80초 주기로 밀물(1.3배)·썰물(0.7배), 시간이 갈수록 조금씩 더(10분 1.5배까지).
     적마다 등장 비용(cost: 단단한 적일수록 큼)을 치르므로 늦게 나오는 큰 적은 적게, 작은 적은 떼로 나온다 */
  pace:t=>(1+Math.min(.5,t/60*.05))*(1+.3*Math.sin(t*TAU/80)),
};
/* 11-15 대표님 "약한 딜 스킬은 쿨타임 짧게, 한 방 한 방이 큰 스킬은 길게": 쿨타임 배수(같은 배수만큼 한 방 피해도 커져서 초당 피해는 비슷) */
const SKILL_HV={spear:1.1,dark:1.1,zap:1.3,vine:1.3,cloud:1.3,strike:1.4,plasma:1.4,wave:1.5,blizz:1.5,storm:1.5,tring:1.5,frost:1.5,miasma:1.5,meteor:1.6,shower:1.6,smite:1.6,sun:1.8,zero:1.8};
/* 범위 한계 체감: 1.3배는 1.25배, 1.6배는 1.42배, 아무리 커져도 1.8배를 못 넘는다(11-15 대표님 "범위·크기는 어느 정도 커지면 잘 안 커지게") */
const softArea=x=>x<=1?x:1+.8*(1-Math.exp(-(x-1)/.8));
/* 조합 스킬: 재료 두 스킬이 모두 이 단계가 되면 선택지에 나온다 */
const FUSE_LV=5,FUSE_PLV=1,FUSE_MAX=99,SKILL_MAX=10; // 재료 단계, 주인공 레벨, 한 판의 조합 수, 스킬 최고 단계. 11-14 대표님 "조건 풀어": 레벨 조건·개수 제한 없이 재료 둘이 5단계면 조합
/* 맵: 맵마다 기본 난이도가 다르고, 어느 맵에서든 시간이 흐르면 위 DIFF 만큼 더 강해진다.
   hp·dmg·spawn 적 배율, champ 강화된 적 확률 더하기, loot 높은 등급 확률 더하기, floor 장비 수치 바닥값 더하기,
   dark 어둠 색과 짙기, light 주인공 빛 반경, pal 땅 색, w 적 등장 비중 바꾸기 */
const MAPS=[
  {k:'모닥불 숲',star:1,clear:600,d:'처음 가는 곳입니다. 적이 순한 편입니다. 축복 제단 위에 잠깐 서 있으면 40초 동안 강해집니다.',hp:1,dmg:1,spawn:1,champ:0,loot:0,floor:0,dark:[8,10,30,.34],light:300,
    pal:{base:'#3e3a54',mossA:'#2c587e',mossB:'#316189',tuft:'#5490c0',speck:'rgba(120,180,220,.22)',cobble:'rgba(125,115,160,.085)',cov:.53},w:{}},
  {k:'서리 폐허',star:2,clear:900,d:'마법을 쓰는 적이 많습니다. 얼음 수정에 닿으면 둘레의 적이 얼어붙고, 이따금 눈보라가 붑니다.',hp:2.4,dmg:1.5,spawn:1.05,champ:.03,loot:.6,floor:.1,dark:[10,18,40,.34],light:300,
    pal:{base:'#48506e',mossA:'#b9cfe6',mossB:'#a6c0dc',tuft:'#e6f2ff',speck:'rgba(255,255,255,.5)',cobble:'rgba(200,215,240,.07)',cov:.5},w:{wisp:9,shaman:7,moss:6,wraith:6,sorcerer:3,beetle:5}},
  {k:'잿불 황야',star:3,clear:1200,d:'터지는 적과 돌진하는 적이 몰려옵니다. 화약통에 닿으면 크게 터지고, 하늘에서 화산탄이 떨어집니다.',hp:5,dmg:2.1,spawn:1.2,champ:.06,loot:1.3,floor:.2,dark:[26,8,10,.36],light:300,
    pal:{base:'#47353a',mossA:'#8f2f1c',mossB:'#a63a1e',tuft:'#ff9a3c',speck:'rgba(255,200,120,.5)',cobble:'rgba(190,120,100,.08)',cov:.6},w:{puff:8,rat:9,moss:7,imp:8,wolf:7,orc:5}},
  {k:'심연',star:4,clear:1800,d:'빛이 좁고 모든 적이 강합니다. 영혼 등불을 켜면 그 빛 안에서 강해집니다. 가장 좋은 장비가 나옵니다.',hp:9,dmg:2.9,spawn:1.3,champ:.1,loot:2.2,floor:.3,dark:[6,2,16,.55],light:230,
    pal:{base:'#2b2741',mossA:'#3b2463',mossB:'#452d77',tuft:'#7a4fd0',speck:'rgba(190,150,255,.4)',cobble:'rgba(120,90,170,.07)',cov:.5},w:{wraith:6,sorcerer:3,spider:6,bat:7}},
];
const mapIdx=()=>MAP.base!==undefined?MAP.base:MAPS.indexOf(MAP); // 영겁의 굴레는 맵 사본을 쓰므로 원래 맵 번호(base)
/* 등장 표(11-15 다시 짬): from 분부터 1분에 걸쳐 늘고, to 분이 지나면 2분에 걸쳐 2할까지 줄어든다 → 몇 분마다 나오는 적의 얼굴이 바뀐다. w 비중 */
const SPAWNS=[{type:'moss',from:0,to:4,w:10},{type:'rat',from:.3,to:5,w:6},{type:'bat',from:.8,to:8,w:3},{type:'wisp',from:1.2,to:9,w:4},{type:'skel',from:1.5,to:12,w:3},{type:'wolf',from:2,to:10,w:4},
  {type:'archer',from:2.5,to:14,w:3},{type:'shaman',from:3,to:14,w:3},{type:'mimic',from:3,w:.25},{type:'jelly',from:3.5,to:15,w:2.2},{type:'spider',from:4,to:16,w:3},{type:'goblin',from:4.5,to:18,w:3},
  {type:'puff',from:5,to:18,w:3},{type:'imp',from:5.5,to:20,w:3},{type:'monk',from:6,w:1.4},{type:'toad',from:6.5,to:20,w:3},{type:'icesp',from:7,to:22,w:3},{type:'orc',from:7.5,w:3},
  {type:'garg',from:8,w:3},{type:'ninja',from:9,w:2.5},{type:'beetle',from:9.5,w:3},{type:'wraith',from:10.5,w:3},{type:'turtle',from:11,w:2},{type:'sorcerer',from:12,w:1.5}];
const spawnFade=(s,m)=>m<s.from?0:Math.min(1,(m-s.from)+.3)*(s.to!==undefined&&m>s.to?Math.max(.2,1-(m-s.to)/2):1);
/* 레벨업에 드는 경험치. 11-14 대표님 목표: 10분 45~50레벨, 20분 75, 30분 100(무적 시험으로 잰 경험치 수입에 맞춤).
   앞쪽 30레벨은 할인(초반에 빨리 올라 재미있게), 높은 레벨은 증가가 완만해진다 */
const needXp=L=>Math.max(4,Math.round(.8*(4+3*L+5*L*L/(1+L/80))*Math.min(1,.3+.7*L/30)*(L<=20?1:1+1.2*Math.pow((L-20)/30,1.5)))); // 11-15 대표님 "높은 레벨도 너무 빨라": 20레벨 뒤로 배수(50레벨 2.2배, 80레벨 4.4배) // .8: 스킬을 집중해 키우는 자동 플레이로 재어 맞춘 값(10분 47~54레벨, 20분 약 75, 30분 약 100 — 보스를 얼마나 빨리 잡느냐에 따라 흔들림)
/* 선택지 수: 기본 3, 행운 25 에 4개, 60 에 5개 */
const choiceCount=luck=>3+(luck>=25?1:0)+(luck>=60?1:0);
const EARLY_CHOICE_LV=10; // 이 레벨까지는 선택지가 하나 더(초반에 고르는 재미)
/* 늦게 떨어진 장비일수록 수치가 최대에 가깝게 굴려진다(바닥값). 20분이면 범위의 위쪽 40% 안에서만 나온다. */
const rollFloor=minutes=>Math.min(.6,minutes*.03);
