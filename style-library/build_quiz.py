"""Build the quiz page from styles_data.py + questions.py. Usage: python3 build_quiz.py [outdir]"""
import json, sys, pathlib
from styles_data import STYLES, AXES
from questions import QUESTIONS
from match import W_TAG
here = pathlib.Path(__file__).parent
out = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else here / "dist")
out.mkdir(parents=True, exist_ok=True)
html = (here / "quiz_template.html").read_text()
html = (html.replace("/*__DATA__*/", json.dumps(dict(axes=AXES, styles=STYLES), ensure_ascii=False))
            .replace("/*__QUESTIONS__*/", json.dumps(QUESTIONS, ensure_ascii=False))
            .replace("/*__WTAG__*/", str(W_TAG)))
(out / "index.html").write_text(html)
print("built", out / "index.html", len(html) // 1024, "KB")
