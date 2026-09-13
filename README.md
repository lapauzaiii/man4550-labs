# MAN4550 Labs

Interactive lab pages for MAN4550: Introduction to Management Science.

## Current Labs

- Week 5.E: Interactive Sensitivity Lab (`week5/`)
  - Logistics concept-intro pane
  - Professional Services staffing sensitivity pane
- Week 6.E: Interactive Integer Programming Lab (`week6/`)
  - Cowford Fleet Ventures practice entity
  - Binary equipment package selection
  - Greedy heuristic and LP relaxation comparison
- The Analyst Challenge (`analyst-challenge/`)
  - One-page student audit hub with in-page navigation
  - Canvas overview and reusable assignment template
  - Student audit templates, rubric, and instructor implementation guide
  - GitHub Pages and Canvas publishing instructions

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

The Analyst Challenge package should be available at:

```text
https://lapauzaiii.github.io/man4550-labs/analyst-challenge/
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

The Analyst Challenge:

```html
<div style="width:100%;overflow:hidden;">
  <iframe
    src="https://lapauzaiii.github.io/man4550-labs/analyst-challenge/"
    style="width:100%;min-height:3200px;border:none;"
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
├── analyst-challenge/
│   ├── index.html              ← AI Decision Model Audit package
│   ├── canvas/
│   ├── templates/
│   ├── instructor/
│   └── assets/
├── week7/
└── shared/
    ├── components.js
    ├── charts.js
    └── styles.css
```
