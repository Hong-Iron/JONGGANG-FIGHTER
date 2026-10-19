// 학생 꾸미기 파츠, 무기 성능, 스탯과 세트 효과. 그림은 art/game.px.js가 같은 코드 이름으로 그린다.
// 스탯: 멘탈(받는 피해 감소), 타자(연타 간격·반박 여유), 운(치명타 확률), 카페인(회복 속도)

// 무기: [코드, 이름, 단과대, {공격 dmg, 치명 crit, 연타 간격 rate, 파편 debris, 특수 fx}]
export const WEAPONS = [
  ["keyboard", "청축 기계식 키보드", "eng", { dmg: 2, crit: 0.12, rate: 0.065, debris: "keycap", note: "평범하지만 키캡이 튄다" }],
  ["solder", "가열된 인두기", "eng", { dmg: 1.6, crit: 0.12, rate: 0.055, debris: "spark", fx: "burn", note: "치명타 때 화상(지속 피해)" }],
  ["wrench", "대형 몽키스패너", "eng", { dmg: 3, crit: 0.1, rate: 0.09, debris: "bolt", note: "느리지만 묵직하다" }],
  ["gpu", "무거운 그래픽카드", "eng", { dmg: 3.4, crit: 0.08, rate: 0.1, debris: "chip", critMul: 3.5, note: "치명타가 아주 아프다" }],
  ["dict", "옥스퍼드 대사전", "hum", { dmg: 3.2, crit: 0.1, rate: 0.095, debris: "page", note: "양손 둔기" }],
  ["pen", "만년필 레이피어", "hum", { dmg: 1.5, crit: 0.22, rate: 0.05, debris: "ink", note: "빠르고 치명타가 잦다" }],
  ["law", "육법전서 해머", "soc", { dmg: 3.6, crit: 0.06, rate: 0.11, debris: "page", fx: "reject", note: "치명타 때 '기각' 도장" }],
  ["gavel", "판사봉", "soc", { dmg: 2.4, crit: 0.14, rate: 0.075, debris: "chip", fx: "order", note: "치명타 때 교수님 공격이 늦어진다" }],
  ["chart", "주가 폭락 차트 검", "soc", { dmg: 2, crit: 0.18, rate: 0.065, debris: "candle", note: "치명타 확률이 높다" }],
  ["pipette", "8채널 멀티 피펫", "sci", { dmg: 0.9, crit: 0.1, rate: 0.085, debris: "drop", shots: 3, note: "한 번에 세 발 (샷건)" }],
  ["compass", "칠판용 대형 컴퍼스", "sci", { dmg: 2.2, crit: 0.14, rate: 0.07, debris: "chalk", note: "분필 가루가 날린다" }],
  ["geohammer", "지질조사 망치", "sci", { dmg: 2.8, crit: 0.12, rate: 0.085, debris: "rock", note: "바위도 깬다" }],
  ["ruler", "1m 알루미늄 자", "art", { dmg: 2.2, crit: 0.12, rate: 0.065, debris: "paint", note: "길고 고르다" }],
  ["stand", "접이식 보면대", "art", { dmg: 2.6, crit: 0.1, rate: 0.08, debris: "note", note: "악보가 쏟아진다" }],
  ["shinai", "죽도", "art", { dmg: 1.9, crit: 0.16, rate: 0.055, debris: "bamboo", note: "빠른 연타" }],
  ["syringe", "50cc 대형 주사기", "nur", { dmg: 1.5, crit: 0.18, rate: 0.055, debris: "drop", note: "빠르게 콕콕" }],
  ["ivpole", "링거 거치대", "nur", { dmg: 3, crit: 0.1, rate: 0.09, debris: "pill", note: "길고 묵직하다" }],
  ["clipboard", "인계장 클립보드", "nur", { dmg: 2.2, crit: 0.14, rate: 0.07, debris: "page", fx: "order", note: "치명타 때 교수님 공격이 늦어진다" }],
  ["scalpel", "메스", "med", { dmg: 1.4, crit: 0.26, rate: 0.05, debris: "spark", note: "치명타가 아주 잦다" }],
  ["stetho", "청진기 채찍", "med", { dmg: 1.9, crit: 0.15, rate: 0.06, debris: "chip", note: "휘두르면 채찍처럼" }],
  ["casebook", "판례집 3권 묶음", "law", { dmg: 3.4, crit: 0.08, rate: 0.1, debris: "page", note: "양손 둔기" }],
  ["seal", "법원 직인", "law", { dmg: 2.4, crit: 0.14, rate: 0.075, debris: "chip", fx: "reject", note: "치명타 때 '기각' 도장" }],
  ["scales", "정의의 저울", "law", { dmg: 2, crit: 0.18, rate: 0.065, debris: "coin", note: "치명타 확률이 높다" }],
  ["eraser", "칠판 지우개", "edu", { dmg: 1.7, crit: 0.14, rate: 0.055, debris: "chalk", note: "빠르게 탁탁, 분필 가루" }],
  ["rollbook", "출석부", "edu", { dmg: 3, crit: 0.1, rate: 0.09, debris: "page", fx: "order", note: "치명타 때 교수님 공격이 늦어진다" }],
  ["handbell", "수업 종", "edu", { dmg: 2.6, crit: 0.12, rate: 0.08, debris: "note", critMul: 3.4, note: "땡! 치명타가 아프다" }],
  ["anatomy", "2kg 해부학 아틀라스", "med", { dmg: 3.4, crit: 0.08, rate: 0.1, debris: "page", critMul: 3.5, note: "양손 둔기, 치명타가 아프다" }],
]
export const WEAPON = Object.fromEntries(WEAPONS.map(([c, n, col, s]) => [c, { code: c, name: n, college: col, ...s }]))

// 꾸미기 묶음: [키, 이름, 선택지([코드, 이름, 스탯])]
const S = (o) => o
export const PART_GROUPS = [
  ["몸과 얼굴", [
    ["college", "단과대", [["eng", "공대"], ["hum", "인문대"], ["soc", "사회대"], ["sci", "자연대"], ["art", "예대"], ["nur", "간호대"], ["med", "의대"], ["law", "법대"], ["edu", "사범대"], ["none", "안 밝힘"]]],
    ["gender", "성별", [["m", "남학생"], ["f", "여학생"]]],
    ["skin", "피부", [["dry", "카페인 푸석"], ["pale", "지박령 창백"], ["flush", "숙취 홍조"], ["tan", "실습 탄 피부"]]],
    ["eyeshape", "눈매", [["normal", "보통"], ["sharp", "날카로운 눈매"], ["droopy", "처진 눈매"], ["big", "큰 눈"]]],
    ["eyes", "눈 상태", [["tired", "반쯤 감긴 눈"], ["dead", "초점 없는 동태눈"], ["crazy", "광기의 벼락치기 눈"], ["calc", "학점 계산기 눈"], ["tears", "눈물 고인 눈"]]],
    ["dark", "다크서클", [[1, "1단계"], [2, "2단계"], [3, "3단계"], [4, "4단계"], [5, "5단계 (판다)"]]],
    ["red", "충혈", [["no", "없음"], ["yes", "실핏줄 터짐", S({ luck: 1 })]]],
    ["mouth", "입", [["none", "그대로"], ["chinmask", "턱스크"], ["mask", "검은 마스크", S({ mental: 1 })], ["gasmask", "방독면", S({ mental: 2 })], ["patch", "구내염 패치"], ["pen", "입에 문 펜", S({ speed: 1 })], ["bar", "에너지바", S({ caff: 2 })], ["nose", "코피 휴지"]]],
  ]],
  ["머리", [
    ["hair", "모양", [["greasy", "3일 안 감은 머리"], ["buzz", "전역 밤톨"], ["pudding", "푸딩 탈색모"], ["bun", "연필 꽂은 똥머리", S({ speed: 1 })], ["capmark", "모자 자국 눌린 머리"], ["twoblock", "투블럭"], ["long", "긴 생머리"], ["ponytail", "질끈 묶은 포니테일", S({ speed: 1 })], ["bob", "단발"], ["clip", "집게핀 올림머리", S({ mental: 1 })]]],
    ["hstate", "상태", [["none", "그대로"], ["static", "정전기 뻗침"], ["gray", "스트레스성 새치", S({ mental: 1 })]]],
  ]],
  ["옷", [
    ["top", "상의", [["jamba", "과잠", S({ mental: 1 })], ["jamba_up", "과잠 (깃 세움)", S({ mental: 2 })], ["hoodie", "후드티"], ["hood_up", "후드티 (모자 씀)", S({ mental: 1 })], ["flannel", "체크 플란넬"], ["clubtee", "목 늘어난 동아리 티", S({ speed: 1 })], ["vest", "랩실 패딩 조끼", S({ mental: 1, caff: 1 })]]],
    ["print", "등판", [["college", "단과대 마크 + 이름"], ["custom", "직접 쓴 글씨"], ["jersey", "학번 크게 (유니폼)"], ["crest", "대학 문장"], ["none", "없음"]]],
    ["jacket", "색 1", [["navy", "남색"], ["black", "검정"], ["wine", "와인"], ["green", "초록"], ["gray", "회색"]]],
    ["sleeve", "색 2", [["cream", "크림"], ["white", "흰색"], ["gray", "회색"], ["black", "검정"]]],
  ]],
  ["장신구", [
    ["head", "머리·귀", [["none", "없음"], ["phones", "노이즈캔슬링 헤드폰", S({ mental: 3 })], ["bone", "골전도 이어폰", S({ mental: 1, speed: 1 })]]],
    ["neck", "목", [["none", "없음"], ["lanyard", "학생증 걸이", S({ luck: 2 })]]],
    ["wrist", "손목", [["none", "없음"], ["pas", "파스 도배", S({ speed: 1 })], ["brace", "손목 보호대", S({ speed: 2 })], ["watch", "스마트워치 (150bpm)", S({ speed: 1, luck: 1 })], ["bands", "머리끈 3개", S({ luck: 1 })]]],
    ["back", "등", [["none", "없음"], ["tactical", "전술 백팩", S({ mental: 2 })], ["tube", "도면 원통", S({ luck: 1 })], ["rack", "미니 서버 랙", S({ caff: 2 })], ["ecobag", "책 5권 에코백", S({ mental: 1 })], ["canvas", "100호 캔버스", S({ mental: 2 })], ["cello", "첼로 하드케이스", S({ mental: 2 })]]],
  ]],
  ["무기·동료", [
    ["weapon", "주무기", WEAPONS.map(([c, n]) => [c, n])],
    ["pet", "동료", [["none", "없음"], ["rc", "자율주행 RC카"], ["drone", "5분짜리 드론"], ["penguin", "펭귄 홀로그램"], ["owl", "종이접기 부엉이"], ["rat", "탈출한 흰쥐"], ["bust", "미니 석고상"]]],
  ]],
]
export const PARTS = Object.fromEntries(PART_GROUPS.flatMap(([, rows]) => rows.map(([k, , list]) => [k, list])))
export const PART_LABEL = Object.fromEntries(PART_GROUPS.flatMap(([, rows]) => rows.map(([k, n]) => [k, n])))

// 세트 효과: 조건이 모두 맞으면 켜진다
export const SETS = [
  { id: "deadline", name: "마감 1시간 전의 기적", need: (s) => s.dark >= 5 && s.hair === "greasy" && s.wrist === "pas",
    hint: "다크서클 5단계 + 3일 안 감은 머리 + 파스", desc: "연타 속도 +40%, 대신 수면량이 1초에 0.5씩 준다", fx: { rate: 0.6, drain: 0.5 } },
  { id: "fossil", name: "화석의 귀환", need: (s) => s.top.startsWith("jamba") && s.eyes === "dead" && s.hair === "buzz",
    hint: "과잠 + 동태눈 + 전역 밤톨", desc: "멘탈 +3: 교수님 공격 피해 감소", fx: { mental: 3 } },
  { id: "gear", name: "풀소유 장비병", need: (s) => s.head === "phones" && s.wrist === "watch" && s.back === "tactical",
    hint: "헤드폰 + 스마트워치 + 전술 백팩", desc: "공격력 +25%", fx: { dmgMul: 1.25 } },
  { id: "lab", name: "랩실 붙박이", need: (s) => s.top === "vest" && s.back === "rack" && (s.pet === "rat" || s.pet === "drone"),
    hint: "패딩 조끼 + 서버 랙 + 흰쥐나 드론", desc: "카페인 회복 +50%, 동료 공격 2배", fx: { caffMul: 1.5, petMul: 2 } },
]

// 지금 꾸미기로 계산한 스탯과 켜진 세트
export function statsOf(stu) {
  const st = { mental: 0, speed: 0, luck: 0, caff: 0 }
  for (const [k, list] of Object.entries(PARTS)) {
    const opt = list.find((o) => o[0] === stu[k]); const add = opt && opt[2]
    if (add) for (const n in add) st[n] += add[n]
  }
  const sets = SETS.filter((s) => { try { return s.need(stu) } catch { return false } })
  const fx = { rate: 1, drain: 0, dmgMul: 1, caffMul: 1, petMul: 1 }
  for (const s of sets) for (const [k, v] of Object.entries(s.fx)) { if (k === "mental") st.mental += v; else if (k === "drain") fx.drain += v; else fx[k] *= v }
  return { ...st, sets, fx }
}

// ================================================================ 교수님 꾸미기
// [키, 이름, 선택지]. 그림은 art/game.px.js의 drawProf가 같은 코드로 그린다.
export const PROF_GROUPS = [
  ["기본", [
    ["college", "단과대", [["eng", "공대: 모니터 기계팔"], ["hum", "인문대: 철학자 환영"], ["soc", "사회대: 속보 자막"], ["sci", "자연대: 자기장 폭주"], ["art", "예대: 추상화 그림자"], ["nur", "간호대: 링거 폭주"], ["med", "의대: 수술 로봇 팔"], ["law", "법대: 법정 소환"], ["edu", "사범대: 칠판 증식"]]],
    ["level", "난이도", [["easy", "순한맛"], ["normal", "보통맛"], ["hard", "매운맛"]]],
    ["grad", "랩장", [["shield", "방어형 박사 6년차"], ["attack", "공격형 석사 1기 (감점)"], ["heal", "힐러형 행정조교 (회복)"]]],
  ]],
  ["얼굴", [
    ["gender", "성별", [["m", "남자 교수님"], ["f", "여자 교수님"]]],
    ["age", "나이대", [["young", "30대 신임"], ["middle", "50대 정교수"], ["senior", "60대 정년 직전"]]],
    ["skin", "피부", [["base", "보통"], ["pale", "연구실 창백"], ["red", "불그레"], ["tan", "등산으로 탄"]]],
    ["body", "체형", [["normal", "보스형"], ["thin", "학자형 (마른 거북목)"], ["big", "야전사령관형 (풍채)"]]],
    ["face", "표정", [["smirk", "한쪽 눈썹 치켜뜸"], ["kind", "인자한 미소 (학점은 C+)"], ["stone", "무표정"], ["tired", "마감에 지친 얼굴"]]],
    ["eyes", "눈매", [["normal", "보통"], ["sharp", "날카로운 눈매"], ["big", "큰 눈"], ["droopy", "처진 눈매"], ["narrow", "실눈"]]],
    ["beard", "수염", [["none", "없음"], ["mustache", "콧수염"], ["goatee", "염소수염"], ["full", "덥수룩 수염"], ["stubble", "까슬한 수염"]]],
  ]],
  ["머리와 안경", [
    ["hair", "머리", [["bald", "대머리 + 옆머리"], ["pomade", "2:8 포마드"], ["white", "부스스"], ["side", "단정한 가르마"], ["back", "올백"], ["perm", "곱슬 파마"], ["long", "장발 묶음"], ["shaved", "반짝 민머리"], ["bob", "단발"], ["short", "숏컷"], ["updo", "올림머리"], ["straight", "긴 생머리"], ["ponytail", "포니테일"]]],
    ["hcolor", "머리색", [["gray", "흰머리"], ["salt", "반백"], ["black", "검정"], ["brown", "갈색"]]],
    ["glasses", "안경", [["half", "코끝 반무테"], ["tint", "변색렌즈"], ["horn", "두꺼운 뿔테"], ["metal", "얇은 금속테"], ["forehead", "이마에 올린 안경"], ["chain", "돋보기 + 안경줄"], ["none", "안경 없음"]]],
    ["hat", "모자", [["none", "없음"], ["beret", "베레모"], ["cap", "등산 모자"], ["grad", "학사모"]]],
  ]],
  ["옷", [
    ["outfit", "옷", [["tweed", "팔꿈치 패치 재킷"], ["hiking", "등산 자켓"], ["turtle", "올블랙 터틀넥"], ["suit", "학회 정장"], ["vest", "조끼 스웨터"], ["labcoat", "실험 가운"], ["shortsleeve", "한겨울 반팔 셔츠"], ["cardigan", "한여름 두꺼운 가디건"]]],
    ["neck", "목", [["auto", "옷에 맞게"], ["redtie", "빨간 넥타이"], ["bluetie", "파란 넥타이"], ["bowtie", "나비넥타이"], ["scarf", "스카프"], ["nametag", "학회 네임택"], ["none", "없음"]]],
    ["pocket", "가슴주머니", [["pens", "3색 볼펜"], ["card", "명함"], ["none", "없음"]]],
  ]],
  ["손과 교탁", [
    ["hand", "손에 든 것", [["laser", "레이저 포인터"], ["stick", "늘어나는 지시봉"], ["chalk", "분필"], ["espresso", "에스프레소 잔"], ["mic", "인터뷰 마이크"], ["pad", "결재판"]]],
    ["desk", "교탁 위", [["thinkpad", "낡은 ThinkPad"], ["ipad", "아이패드 + 펜슬"], ["thermos", "보이차 보온병"], ["molecule", "분자 구조 모형"], ["books", "포스트잇 원서 더미"]]],
  ]],
]
export const PROF_PARTS = Object.fromEntries(PROF_GROUPS.flatMap(([, rows]) => rows.map(([k, , list]) => [k, list])))
export const PROF_KEYS = Object.keys(PROF_PARTS)

// 성별에 맞는 선택지: 키마다 성별별로 보이는 코드 목록. 없으면 전부 보인다
export const BY_GENDER = {
  stu: { hair: { m: ["greasy", "buzz", "twoblock", "pudding", "bun", "capmark"], f: ["long", "ponytail", "bob", "clip", "greasy", "pudding", "bun", "capmark"] } },
  prof: {
    hair: { m: ["bald", "pomade", "white", "side", "back", "perm", "long", "shaved"], f: ["bob", "short", "updo", "straight", "ponytail", "perm", "white"] },
    beard: { f: ["none"] },
  },
}
export const allowedFor = (kind, key, obj) => BY_GENDER[kind]?.[key]?.[obj?.gender || "m"] || null
