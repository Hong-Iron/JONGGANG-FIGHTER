"""배포 전에 실행: 모든 JS·CSS·그림 원본 경로에 ?v=<버전>을 붙여, 브라우저가 옛 파일과 새 파일을 섞어 쓰지 않게 한다.
python3 tools/bump.py [버전]   (버전을 안 주면 지금 시각)"""
import re, sys, time, pathlib
root = pathlib.Path(__file__).resolve().parent.parent / "site"
v = sys.argv[1] if len(sys.argv) > 1 else time.strftime("%Y%m%d%H%M")
def tag(path): return re.sub(r"\?v=[\w.-]+", "", path) + "?v=" + v
html = (root / "index.html").read_text()
html = re.sub(r'(href|src)="((?:css|js)/[^"?]+)(\?v=[\w.-]+)?"', lambda m: f'{m.group(1)}="{tag(m.group(2))}"', html)
(root / "index.html").write_text(html)
for f in (root / "js").glob("*.js"):
    s = f.read_text()
    s = re.sub(r'(from\s+|import\(\s*)(["\'])(\.{1,2}/[^"\'?]+\.js)(\?v=[\w.-]+)?\2', lambda m: f"{m.group(1)}{m.group(2)}{tag(m.group(3))}{m.group(2)}", s)
    s = re.sub(r'fetch\("(art/[^"?]+)(\?v=[\w.-]+)?"\)', lambda m: f'fetch("{tag(m.group(1))}")', s)
    f.write_text(s)
print("version", v)
