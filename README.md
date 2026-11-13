# AlgoVision: Min & Max by Divide and Conquer

## Chalane ke 2 tareeqe
1. **Python ke saath (recommended, teacher ki requirement):**
   - Windows: `START_PRESENTATION.bat` par double-click. (Ya terminal mein `python server.py`.)
   - Browser khud khulta hai: http://127.0.0.1:8000
   - Live lab ke saare steps `algorithm.py` (Python) se aate hain. Lab ke title ke paas badge dikhta hai: **Engine: Python (algorithm.py)**.
   - Koi package install nahi karna, sirf Python 3.8+.
2. **Sirf browser:** `index.html` double-click. Yahan wahi algorithm JavaScript mein chalta hai (badge: Engine: JavaScript).

## Files
- `algorithm.py`: algorithm. Part 1 = saaf `min_max()` jo viva mein samjhana hai, Part 2 = step-by-step trace jo web page ko jata hai.
- `server.py`: chhota Python server. `POST /api/trace` algorithm.py chalata hai, `GET /api/health` status deta hai.
- `index.html`, `style.css`, `app.js`: presentation UI.
- `REVIEW_URDU.md`: aapke purane project ka review.

## Terminal se
    python algorithm.py 38 12 77 5 41 90 23 66     (min, max, comparisons)
    python algorithm.py --test                      (5000 random arrays ka self-test)

## Shortcuts
Left/Right (sections, lab me steps), Space (lab play/pause), F (full screen), T (theme), ? (help).
`app.js` ke shuru me `CONFIG` se naam/date/university badal sakte hain.
