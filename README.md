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
└── shared/
    ├── components.js
    ├── charts.js
    └── styles.css
```
