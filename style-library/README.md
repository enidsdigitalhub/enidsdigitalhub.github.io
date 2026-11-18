# enidsdigitalhub Interior Style Library

Single source of truth for the 16 interior styles (plus 2 signature colour stories).
Everything else (the style quiz, style guides, pins, listings) is generated from these files.

| File | What it is |
|---|---|
| `styles_data.py` | The 18 styles: 9-colour palette, words, blurb, materials, pieces with sizes, dos/avoid, quiz profile |
| `questions.py` | The 12 quiz questions; each option sets profile values and signals specific styles |
| `match.py` | Scoring (profile similarity + style signals) and a test proving all 16 styles can be reached |
| `quiz_template.html` | Quiz page template |
| `build_quiz.py` | Builds the quiz: `python3 build_quiz.py ../apps/style-quiz` |
| `styles.json` | JSON export of the style data: `python3 styles_data.py` |

Edit a style once in `styles_data.py`, rebuild, and every product picks up the change.
