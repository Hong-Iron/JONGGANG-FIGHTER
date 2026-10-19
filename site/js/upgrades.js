// 무기 강화: 교수님을 한 명 이길 때마다 셋 중 하나를 고른다. 한 도전(연속 대전) 안에서만 쌓이고, 끝나면 사라진다.
// [코드, 이름, 한 단계 효과 설명, 최대 단계]
export const UPGRADES = [
  ["dmg", "날 선 타건", "데미지 +15%", 5],
  ["double", "더블 클릭", "2회 공격 확률 +12%", 5],
  ["crit", "운빨 학점", "치명타 확률 +6%", 5],
  ["critdmg", "대학원 추천서", "치명타 피해 +40%", 5],
  ["speed", "손풀기", "연타 간격 -8%", 4],
  ["parry", "말발", "반박 판정 +0.05초", 3],
  ["armor", "철면피", "받는 피해 -10%", 4],
  ["counter", "역질문", "반박 성공 때 교수님에게 10 피해", 5],
  ["caff", "아아 리필", "카페인 충전 +25%", 4],
  ["cool", "계획표", "스킬 재사용 대기 -12%", 4],
  ["nap", "쪽잠", "이길 때마다 수면량 +10 더", 3],
  ["vamp", "학점 세탁", "치명타 때 수면량 +1", 4],
]
export const UP = Object.fromEntries(UPGRADES.map(([id, name, desc, max]) => [id, { id, name, desc, max }]))

// 단계 → 전투에 쓰는 숫자
export function upStats(ups = {}) {
  const l = (id) => Math.min(UP[id].max, ups[id] || 0)
  return {
    dmgMul: 1 + 0.15 * l("dmg"), double: 0.12 * l("double"), critAdd: 0.06 * l("crit"), critMul: 1 + 0.4 * l("critdmg"),
    rateMul: 1 - 0.08 * l("speed"), parryAdd: 0.05 * l("parry"), takenMul: 1 - 0.1 * l("armor"), counter: 10 * l("counter"),
    caffMul: 1 + 0.25 * l("caff"), cdMul: 1 - 0.12 * l("cool"), nap: 10 * l("nap"), vamp: l("vamp"),
  }
}
// 아직 최대가 아닌 강화 중에서 서로 다른 n개
export function rollChoices(ups = {}, n = 3) {
  const pool = UPGRADES.filter(([id, , , max]) => (ups[id] || 0) < max).map(([id]) => id)
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]] }
  return pool.slice(0, n)
}
// "날 선 타건 2 · 더블 클릭 1"
export const upSummary = (ups = {}) => UPGRADES.filter(([id]) => ups[id]).map(([id, name]) => `${name} ${ups[id]}`).join(" · ")
