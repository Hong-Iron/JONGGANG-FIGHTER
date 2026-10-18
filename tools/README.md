# 전투 자동 테스트

`test_battle.html`을 `site/`에 복사해 두고 로컬 서버(`cd site && python3 -m http.server 8765`)를 띄운 뒤,
`python3 tools/recv.py out.json`으로 결과 받는 서버(8766)를 켜고 헤드리스 Chrome으로 페이지를 연다.
페이지가 시작 연출·내려치기·옆 휘두르기·두 손 내려찍기·연타 보너스·분필·쪽지시험 장면을 찍어 JSON(PNG data URL)으로 보낸다.
