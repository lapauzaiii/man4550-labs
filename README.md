# MAN4550 Labs

Interactive lab pages for MAN4550: Introduction to Management Science.

## Cowford Lab Sequence

Student-facing, buildless HTML tools hosted from `main` on GitHub Pages. The
Notion planner holds the corresponding lab specifications and instructor talk
tracks. AI assignments and transcript submissions are retired.

| Week | Stable Route | Experience |
| --- | --- | --- |
| 5 | `week5/` | Sensitivity: Logistics introduction and PS staffing |
| 6 | `week6/` | Integer programming; existing W6.D solver remains available |
| 7 | `week7/` | Midterm practice; redirects to the preserved `midterm-prep/` route |
| 8 | `week8/` | Transportation and transshipment |
| 9 | `week9/` | Properties renovation: editable activity network and schedule |
| 10 | `week10/` | Verified Logistics PERT network and beta-PERT simulation |
| 10 | `week10/lesson/` | Self-paced lesson replacing the class session: variance, deadline probability, commitment dates, board message |
| 11 | `week11/` | Simple regression: guided forecast and editable classroom sample |
| 11 | `week11/lesson/` | Self-paced lesson replacing the class session: slope and intercept in units, R², p-value, extrapolation, forecast message |
| 12 | `week12/` | Multiple regression: guided forecast, editable data and diagnostics |
| 13 | `week13/` | Canonical warehouse payoff table, EMV, EVPI, regret and tree rollback |
| 14 | `week14/` | Exhaustive binary capital allocation and schedule-risk sensitivity |

Every hosted lab includes shared Cowford navigation. Earlier URLs, including
version query strings and `week6/w6d-cowford-properties-solver.html`, remain valid.
Weeks 1-4 have no hosted lab routes in this repository; navigation lists the
available hosted sequence rather than creating empty destinations.

### Numerical Contracts

- PERT baseline: expected duration `56/3` weeks, critical path A-B-C-G-H-I,
  variance `1.5`, SD `sqrt(1.5)`, P(T <= 20) `0.8618485413` (rounded `.862`).
- Week 9 relabels the same numeric network for a Properties renovation.
- Week 10 simulation uses independent bounded beta-PERT distributions with
  shape weight 4 and recomputes paths each trial. These activity variances can
  differ from textbook PERT approximations. Fixed seeds reproduce samples.
- Week 11 supplied equation: `8.40 + 22.50X`, X in thousands of square feet,
  Y in thousands of annual dollars. Week 12: `14.20 + .018X1 + 2.85X2 - .31X3`,
  raw square feet, location score, age; Y is annual dollars per square foot.
- Editable regression data are explicitly synthetic, separate from the
  supplied case equations and the unavailable original 35-lease dataset.
- Week 11 lesson embeds an illustrative 20-lease sample (X = 0.8 to 3.0) built so
  least squares returns exactly `a = 8.40`, `b = 22.50`, R² `0.7799` (rounded `.78`),
  t `7.99` on 18 df. The observed range 800-3,000 sq ft defines extrapolation in
  the lesson, W11.C, and W11.D.
- Week 13 EMVs: `354.5`, `361.5`, `178.5` ($K); EVPI `192` ($K).
- Week 14 canonical p is the rounded `.862`; LOG NPV `289.24`, LOG+PRP
  `644.24`, PRP+PS `595`, crossover p `1 - 190/1020`. LOG+PRP remains preferred.
- The late-project loss is treated as incremental and excluded from base
  payoffs. Week 14 treats it as NPV-equivalent for instructional consistency;
  real cash flows require discounting and checks against double counting.

### Maintenance and Verification

Shared identity is in `assets/css/cowford.css` and `assets/js/cowford-nav.js`.
Weeks 9-14 share `assets/js/models.js` and `assets/js/labs.js`; week pages only
declare their topic and week. Vendored jStat 1.9.6 supplies QR least squares,
distribution functions, and inferential statistics; its MIT license is included
in `assets/vendor/jstat-LICENSE`. All runtime assets are local to the repository.

Run numerical contracts with `node tests/models.test.js`. Run browser checks
with `node tests/browser.cjs` in an environment with Playwright and Chromium;
optional `PLAYWRIGHT_MODULE` and `CHROMIUM_PATH` select installed runtimes.
Browser checks use an ephemeral local server and verify interactions, routes,
chart pixels, and desktop/mobile overflow. They save QA screenshots to the
system temporary directory, not the published site.

The Canvas iframe pattern below also applies to Weeks 9-14: replace the week
route and provide a descriptive `title`. Allow vertical scrolling for the
longer editable regression labs. Do not copy faculty-only answer keys or talk
tracks into a student-facing module.

## Current Labs

- Week 5.E: Interactive Sensitivity Lab (`week5/`)
  - Logistics concept-intro pane
  - Professional Services staffing sensitivity pane
- Week 6.E: Interactive Integer Programming Lab (`week6/`)
  - Cowford Fleet Ventures practice entity
  - Binary equipment package selection
  - Greedy heuristic and LP relaxation comparison
- Week 8.E: Cowford Logistics Network Lab (`week8/`)
  - Transportation and transshipment network optimization
  - Cheapest-lane heuristic comparison
  - Capacity value and Baymeadows cross-dock analysis

## GitHub Pages

After GitHub Pages is enabled for this repository, the public site should be available at:

```text
https://lapauzaiii.github.io/man4550-labs/
```

The Week 5.E lab should be available at:

```text
https://lapauzaiii.github.io/man4550-labs/week5/
```

The Week 6.E lab should be available at:

```text
https://lapauzaiii.github.io/man4550-labs/week6/
```

The Week 8.E lab should be available at:

```text
https://lapauzaiii.github.io/man4550-labs/week8/
```

## Canvas Embed Code

Use the corresponding iframe on the Canvas page after GitHub Pages finishes deploying.

Week 5.E:

```html
<div style="width:100%;overflow:hidden;">
  <iframe
    src="https://lapauzaiii.github.io/man4550-labs/week5/"
    style="width:100%;min-height:1200px;border:none;"
    loading="lazy"
    allowfullscreen>
  </iframe>
</div>
```

Week 6.E:

```html
<div style="width:100%;overflow:hidden;">
  <iframe
    src="https://lapauzaiii.github.io/man4550-labs/week6/?v=w6e2"
    style="width:100%;min-height:1200px;border:none;"
    loading="lazy"
    allowfullscreen>
  </iframe>
</div>
```

Week 8.E:

```html
<div style="width:100%;overflow:hidden;">
  <iframe
    src="https://lapauzaiii.github.io/man4550-labs/week8/?v=w8e1"
    style="width:100%;min-height:1400px;border:none;"
    loading="lazy"
    allowfullscreen>
  </iframe>
</div>
```

## Repository Structure

```text
man4550-labs/
├── index.html
├── README.md
├── assets/
│   ├── css/
│   │   └── man4550.css
│   ├── js/
│   │   └── man4550.js
│   └── img/
├── week5/
│   ├── index.html              ← W5.E Interactive Sensitivity Lab
│   └── assets/
├── week6/
│   ├── index.html              ← W6.E Interactive Integer Programming Lab
│   └── assets/
├── week7/
├── week8/
│   └── index.html              ← W8.E Cowford Logistics Network Lab
└── shared/
    ├── components.js
    ├── charts.js
    └── styles.css
```
