# 종강 파이터

과잠 입은 공대생이 청축 키보드로 교수님과 싸우는 도트 웹 게임 (공대 프로토타입).

- 화면 연타로 과제를 제출해 교수님 체력을 깎고, 말풍선 공격은 타이밍 맞춰 **[반박!]** 으로 쳐낸다.
- 스킬: 점퍼선(묶기), 원샷(데미지 2배), 강제 푸시(카페인 100으로 큰 한 방).
- 체력 50%에서 2페이즈(학회 마감 D-1 모드): 모니터 기계팔, 랩장 소환.
- 교수님을 직접 만들어 `?b=` 링크로 친구에게 보낼 수 있다. 결과는 1080×1350 공문서 카드로 저장·공유된다.

실존 인물을 닮게 만들어도 친구끼리 웃자고만 쓰세요. 비방·모욕은 안 됩니다.

## 구조

```
site/                 GitHub Pages로 그대로 배포 (빌드 없음)
  index.html, css/, js/
  art/game.px.js      그림 원본 (pxl). 브라우저가 꾸미기 선택(OPT)을 넣어 실행해 스프라이트를 그린다
  vendor/pxl/core/    pxl 엔진 (MIT, github.com/crsolver/claude-pxl)
art/                  스타일 목업과 데모 (배포 안 함)
```

- 그림 규칙: 둥근 모양 없음(원·타원·둥근 붓 금지), 면으로 나눈 명암, 빛은 왼쪽 위, 모든 글자는 1배 픽셀.
- 글꼴: [갈무리](https://github.com/quiple/galmuri) (OFL-1.1), jsDelivr에서 불러온다.
- 미리보기: `node <pxl>/bin/pxl.js build site/art/game.px.js --only preview`
- 로컬 실행: `cd site && python3 -m http.server`
