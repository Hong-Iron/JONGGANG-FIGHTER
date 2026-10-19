"""로컬 시험용 가짜 Supabase: jg_add / jg_board 두 함수를 schema.sql과 같은 규칙으로 흉내 낸다.
python3 tools/mock_supabase.py  (127.0.0.1:8767). 게임에서 localStorage jg-lb-url=http://127.0.0.1:8767 로 바꿔 쓴다.
GET /calls 로 받은 요청 목록을 본다."""
import http.server, json
COLLEGES = [("eng", "공과대학", 1), ("hum", "인문대학", 2), ("soc", "사회과학대학", 3), ("sci", "자연과학대학", 4), ("art", "예술대학", 5), ("nur", "간호대학", 6), ("med", "의과대학", 7), ("law", "법과대학", 8), ("edu", "사범대학", 9)]
DATA = {c: {"wins": 0, "best": 0, "runs": 0} for c, _, _ in COLLEGES}
DATA["hum"] = {"wins": 7, "best": 4, "runs": 3}   # 다른 단과대도 있어 보이게
CALLS = []
class H(http.server.BaseHTTPRequestHandler):
    def cors(self):
        self.send_header("Access-Control-Allow-Origin", "*"); self.send_header("Access-Control-Allow-Headers", "apikey, authorization, content-type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    def do_OPTIONS(self): self.send_response(204); self.cors(); self.end_headers()
    def reply(self, code, obj):
        b = json.dumps(obj, ensure_ascii=False).encode(); self.send_response(code); self.cors()
        self.send_header("Content-Type", "application/json"); self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        if self.path == "/calls": return self.reply(200, CALLS)
        self.reply(404, {})
    def do_POST(self):
        n = int(self.headers.get("Content-Length", 0)); body = json.loads(self.rfile.read(n) or b"{}")
        if not self.headers.get("apikey"): return self.reply(401, {"message": "no apikey"})
        if self.path == "/rest/v1/rpc/jg_add":
            CALLS.append(body); c, s = body.get("p_code"), body.get("p_streak")
            if c in DATA and isinstance(s, int) and 1 <= s <= 300:
                d = DATA[c]; d["wins"] += 1; d["best"] = max(d["best"], s); d["runs"] += 1 if s == 1 else 0
            return self.reply(200, None)
        if self.path == "/rest/v1/rpc/jg_board":
            return self.reply(200, [{"code": c, "name": nm, "sort": so, "today_wins": DATA[c]["wins"], "today_best": DATA[c]["best"], "today_runs": DATA[c]["runs"],
                                     "total_wins": DATA[c]["wins"] + 10, "best_ever": DATA[c]["best"] + 1, "total_runs": DATA[c]["runs"] + 5} for c, nm, so in COLLEGES])
        self.reply(404, {})
    def log_message(self, *a): pass
http.server.ThreadingHTTPServer(("127.0.0.1", 8767), H).serve_forever()
