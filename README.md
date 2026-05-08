# DAA GPA Calculator

A clean, animated GPA calculator built specifically for students at **Dubai American Academy (DAA)**. It supports the school's official course weighting system and lets you track both your semester and cumulative GPA in real time.

---

## Why this exists

DAA uses a weighted GPA system where AP and IB courses carry a +0.25 bonus on top of the standard 4.0 letter-grade scale. There was no simple, dedicated tool for DAA students to quickly estimate their GPA using those exact weights — so this was built to fill that gap.

This project has **no affiliation, endorsement, or official connection** to Dubai American Academy or any of its staff. It was independently created by **Ali Ballan** as a personal project to help fellow students.

---

## Features

- **Weighted & unweighted GPA** — displayed side by side everywhere, so you always see both numbers
- **Live gauge** — an animated arc gauge in the corner updates in real time as you enter courses
- **Course type weighting** — Regular and Honors carry no bonus; AP, IB SL, and IB HL each add +0.25, matching DAA's handbook
- **Choose Grade placeholder** — new courses start blank and don't affect your GPA until you actually pick a grade
- **Semester history** — add past semesters to calculate your full cumulative GPA across your DAA career
- **Save & load** — data is stored in your browser's localStorage so you can pick up where you left off
- **Scroll storytelling** — an Apple-style scroll-driven "How it works" section explains the calculator step by step
- **FAQ** — answers to the most common questions about DAA's grading system and how the calculator works
- **Disclaimer modal** — clearly identifies the tool as independent on every page load
- **Responsive design** — works on desktop and mobile

---

## Grade Scale

DAA uses a standard 4.0 base scale:

| Grade | Points |
|-------|--------|
| A+    | 4.0    |
| A     | 4.0    |
| A−    | 3.7    |
| B+    | 3.3    |
| B     | 3.0    |
| B−    | 2.7    |
| C+    | 2.3    |
| C     | 2.0    |
| C−    | 1.7    |
| D+    | 1.3    |
| D     | 1.0    |
| D−    | 0.7    |
| F     | 0.0    |

AP, IB SL, and IB HL courses each add **+0.25** to the grade point value above.

---

## Course Types & Weights

| Type    | Weight Bonus |
|---------|-------------|
| Regular | +0.00       |
| Honors  | +0.00       |
| AP      | +0.25       |
| IB SL   | +0.25       |
| IB HL   | +0.25       |

---

## Credit Values

| Duration      | Credits |
|---------------|---------|
| Year-long     | 1.0     |
| Semester-only | 0.5     |

Credits affect how much a course's grade is weighted in the overall average. A year-long course counts twice as much as a semester course.

---

## How the GPA is calculated

**Unweighted GPA:**
```
UW GPA = Σ(grade_points × credits) / Σ(credits)
```

**Weighted GPA:**
```
W GPA = Σ((grade_points + type_bonus) × credits) / Σ(credits)
```

Courses left on "Choose Grade" are excluded from both calculations entirely.

---

## How to use

1. **Add Course** — click the button to add a row for each class
2. **Enter a grade** — select from the dropdown (A+ through F)
3. **Set the course type** — Regular, Honors, AP, IB SL, or IB HL
4. **Set the credit duration** — Year (1.0) or Semester (0.5)
5. **Read your GPA** — the badge in the top-right of each card and the live gauge update instantly
6. **Add past semesters** — click "Add Semester" to include previous terms and see your cumulative GPA
7. **Save your data** — click the save icon in the header to persist everything in localStorage

---

## Tech stack

Plain HTML, CSS, and vanilla JavaScript — no frameworks, no build tools, no dependencies. Just three files served statically.

- `index.html` — structure and content
- `style.css` — all styling, animations, and responsive layout
- `script.js` — GPA logic, gauge, scroll storytelling, save/load, and UI interactions

---

## Disclaimer

This tool was independently built by **Ali Ballan** on his own personal account. It is **not affiliated with, endorsed by, or produced in collaboration with Dubai American Academy**. All grade weights and scale values are based on publicly available school handbooks. Always verify your GPA with your official school records.

---

## Contact

Built by **Ali Ballan**

- GitHub: [github.com/AliBallan](https://github.com/AliBallan)
- LinkedIn: [linkedin.com/in/ali-ballan-553989260](https://www.linkedin.com/in/ali-ballan-553989260/)
- Email: [ali.ballanjr@gmail.com](mailto:ali.ballanjr@gmail.com)
