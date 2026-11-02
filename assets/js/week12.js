/* W12.E Multiple Regression lab (Cowford Properties).
   Twenty leases that reproduce the Week 11 simple model exactly
   (Yhat = 8.40 + 22.50 X, R^2 = .78). Adding building age and a prime-location
   flag lowers the area coefficient to 18.36; adding parking spaces, which is
   nearly redundant with area, shows multicollinearity.
   Units: area in thousands of sq ft; rent in thousands of dollars per year. */
(function () {
  "use strict";
  const M = CowfordModels,
    app = document.querySelector("#lab");
  const LEASES = [
    [0.8, 29, 0, 3, 22.09],
    [0.9, 21, 0, 3, 19.23],
    [1.0, 14, 1, 3, 46.76],
    [1.1, 16, 0, 4, 37.63],
    [1.2, 12, 1, 4, 35.92],
    [1.3, 28, 1, 5, 40.28],
    [1.45, 31, 0, 5, 34.21],
    [1.55, 22, 0, 6, 30.43],
    [1.65, 13, 0, 6, 46.87],
    [1.8, 24, 0, 7, 50.01],
    [1.9, 13, 0, 7, 46.06],
    [2.0, 16, 0, 7, 46.38],
    [2.15, 20, 1, 8, 64.91],
    [2.3, 2, 1, 8, 71.52],
    [2.4, 11, 1, 9, 66.53],
    [2.55, 18, 1, 9, 73.88],
    [2.65, 10, 1, 10, 72.63],
    [2.8, 8, 1, 10, 78.02],
    [2.9, 29, 1, 10, 57.16],
    [3.0, 18, 0, 11, 68.98],
  ];
  const VARS = [
    { name: "Area", held: "area", per: "1,000 sq ft" },
    { name: "Age", held: "building age", per: "year of building age" },
    { name: "Prime", held: "location type", per: "prime location" },
    { name: "Parking", held: "parking", per: "parking space" },
  ];
  const PRESETS = {
    A: { label: "Model A: area only (Week 11)", cols: [0] },
    B: { label: "Model B: area, age, prime", cols: [0, 1, 2] },
    C: { label: "Model C: Model B plus parking", cols: [0, 1, 2, 3] },
  };
  const SUPPLIED = { b0: 21.47, area: 18.36, age: -0.54, prime: 8.46 };
  const RANGE = { area: [0.8, 3.0], age: [2, 31] };

  const fmt = (v, n = 2) =>
    Number(v).toLocaleString("en-US", {
      minimumFractionDigits: n,
      maximumFractionDigits: n,
    });
  const k$ = (v) => (v < 0 ? "−$" : "$") + fmt(Math.abs(v)) + "K";
  const pfmt = (p) => (p < 0.001 ? "< 0.001" : fmt(p, 3));
  const signed = (v, n = 2) => (v < 0 ? "− " : "+ ") + fmt(Math.abs(v), n);

  app.innerHTML = `
  <section class="cf-section" id="s1">
    <h2>1. Price a candidate lease with the supplied model</h2>
    <p>Cowford Properties fit <strong>Model B</strong> to its 20 commercial leases
    (800 to 3,000 sq ft). Rent is in thousands of dollars per year.</p>
    <p class="w12-eq"><strong>Predicted rent ($K) = 21.47 + 18.36 × Area − 0.54 × Age + 8.46 × Prime</strong></p>
    <div class="cf-controls">
      <div class="cf-control"><label for="area">Area (1,000 sq ft)</label>
        <input type="range" id="area" min="0.5" max="4" step="0.05" value="2.0">
        <output id="area-value" for="area">2.00</output></div>
      <div class="cf-control"><label for="age">Building age (years)</label>
        <input type="range" id="age" min="0" max="45" step="1" value="15">
        <output id="age-value" for="age">15</output></div>
      <fieldset class="w12-toggle"><legend>Location</legend>
          <label><input type="radio" name="prime" value="1" checked> Prime</label>
          <label><input type="radio" name="prime" value="0"> Suburban</label>
      </fieldset>
    </div>
    <div id="guided" aria-live="polite"></div>
    <p class="cf-note">Each piece of the prediction is shown separately so you can see what each predictor adds.
    The Week 11 model (8.40 + 22.50 × Area) is shown for comparison: it ignores age and location.</p>
  </section>

  <section class="cf-section" id="s2">
    <h2>2. Build the model one predictor at a time</h2>
    <p>Choose a preset or tick predictors yourself. Before you click, predict: will the area coefficient go up, go down, or stay at 22.50?</p>
    <div class="cf-actions">
      <button id="preset-A" class="secondary">Model A</button>
      <button id="preset-B" class="secondary">Model B</button>
      <button id="preset-C" class="secondary">Model C</button>
    </div>
    <p id="predictors">Include: ${VARS.map(
      (v, i) =>
        `<label><input type="checkbox" data-predictor="${i}"${i < 3 ? " checked" : ""}> ${v.name}</label>`,
    ).join(" ")}</p>
    <p id="error" class="cf-error" role="status"></p>
    <div id="fit-output" aria-live="polite"></div>
    <div id="coefficients"></div>
    <div id="plain"></div>
    <h3>Area coefficient across the models you have fit</h3>
    <div id="history"></div>
  </section>

  <section class="cf-section" id="s3">
    <h2>3. Look at the data and the residuals</h2>
    <div class="cf-grid">
      <figure><figcaption><strong>Rent vs area.</strong> Triangles are prime leases; circles are suburban.</figcaption>
        <div id="scatter"></div></figure>
      <figure><figcaption><strong>Residuals vs fitted rent</strong> for the current model. Look for a curve or a funnel.</figcaption>
        <div id="residuals"></div></figure>
    </div>
    <details><summary>Show all 20 leases</summary><div id="data-table"></div>
      <button class="secondary" id="download">Download CSV</button></details>
  </section>

  <section class="cf-section" id="s4">
    <h2>4. Say it in plain English</h2>
    <div class="w12-cards">
      <div class="w12-card"><h3>Holding others constant</h3><p>Picture two leases in buildings of the same age and the same kind of location. If one is 1,000 sq ft bigger, Model B says it rents for about $18,360 more a year.</p></div>
      <div class="w12-card"><h3>Why 22.50 became 18.36</h3><p>Big leases at Cowford tend to sit in newer, prime buildings. The one-variable model gave area the credit for all three. Once age and location get their own columns, area keeps only its own share.</p></div>
      <div class="w12-card"><h3>The 0/1 variable</h3><p>Prime = 1 adds $8,460 compared with an otherwise identical suburban lease. Suburban is the baseline; the coefficient is the gap from it.</p></div>
      <div class="w12-card"><h3>Adjusted R²</h3><p>R² never falls when you add a column, even a useless one. Adjusted R² charges a fee for each column, so it rises only when the new column earns its keep.</p></div>
      <div class="w12-card"><h3>Reading the residual plot</h3><p>A residual is actual rent minus predicted rent. A healthy plot looks like a shapeless cloud around zero. A curve means the model is missing a bend; a funnel means its misses grow with size.</p></div>
      <div class="w12-card"><h3>Multicollinearity</h3><p>Parking and area move almost in lockstep. The model cannot tell which one deserves the credit, so it splits it unpredictably. Predictions stay fine; the individual coefficients stop being trustworthy.</p></div>
    </div>
  </section>`;

  /* ---------- section 1: supplied model ---------- */
  const cand = { area: 2.0, age: 15, prime: 1 };
  function guided() {
    const parts = [
      ["Starting value", SUPPLIED.b0],
      ["Area: 18.36 × " + fmt(cand.area), SUPPLIED.area * cand.area],
      ["Age: −0.54 × " + cand.age, SUPPLIED.age * cand.age],
      ["Prime: 8.46 × " + cand.prime, SUPPLIED.prime * cand.prime],
    ];
    const y = parts.reduce((s, p) => s + p[1], 0),
      simple = 8.4 + 22.5 * cand.area;
    const warn = [];
    if (cand.area < RANGE.area[0] || cand.area > RANGE.area[1])
      warn.push("area is outside the 800–3,000 sq ft in the data");
    if (cand.age < RANGE.age[0] || cand.age > RANGE.age[1])
      warn.push("building age is outside the 2–31 years in the data");
    document.getElementById("guided").innerHTML =
      '<div class="cf-metrics"><div class="cf-metric"><strong>' +
      k$(y) +
      "</strong><span>Model B predicted annual rent</span></div>" +
      '<div class="cf-metric"><strong>' +
      k$(simple) +
      "</strong><span>Week 11 model (area only)</span></div></div>" +
      '<div class="cf-tablewrap"><table class="cf-table"><tbody>' +
      parts
        .map(
          (p) =>
            "<tr><td>" + p[0] + "</td><td>" + signed(p[1]) + "</td></tr>",
        )
        .join("") +
      "<tr><th scope='row'>Predicted rent ($K)</th><th>" +
      fmt(y) +
      "</th></tr></tbody></table></div>" +
      (warn.length
        ? '<p class="cf-error">Extrapolation: ' +
          warn.join(" and ") +
          ". The model has no evidence about leases like this one.</p>"
        : '<p class="cf-muted">Inside the range of the data. Unusual combinations, such as a brand-new tiny suburban suite, can still be poorly supported.</p>');
  }
  function bind(id, key, digits) {
    const el = document.getElementById(id);
    el.addEventListener("input", () => {
      cand[key] = Number(el.value);
      document.getElementById(id + "-value").textContent = fmt(
        cand[key],
        digits,
      );
      guided();
    });
  }
  bind("area", "area", 2);
  bind("age", "age", 0);
  document
    .querySelectorAll("input[name=prime]")
    .forEach((el) =>
      el.addEventListener("change", () => {
        cand.prime = Number(el.value);
        guided();
      }),
    );

  /* ---------- section 2: model building ---------- */
  let selected = [0, 1, 2],
    model = null;
  const history = [];
  function interpret(col, b) {
    const v = VARS[col],
      amt = "$" + fmt(Math.round(Math.abs(b) * 100) * 10, 0);
    const others = selected
      .filter((c) => c !== col)
      .map((c) => VARS[c].held);
    const held = others.length
      ? " for leases with the same " +
        (others.length > 1
          ? others.slice(0, -1).join(", ") + " and " + others.at(-1)
          : others[0])
      : "";
    if (col === 2)
      return `Prime leases rent about ${amt} ${b >= 0 ? "more" : "less"} a year than suburban leases${held}.`;
    return `Each additional ${v.per} goes with about ${amt} ${b >= 0 ? "more" : "less"} annual rent${held}.`;
  }
  function fit() {
    try {
      model = M.regress(LEASES, selected);
      document.getElementById("error").textContent = "";
      const n = LEASES.length,
        k = selected.length;
      document.getElementById("fit-output").innerHTML =
        '<div class="cf-metrics">' +
        [
          ["R²", fmt(model.R2, 3)],
          ["Adjusted R²", fmt(model.adjust_R2, 3)],
          ["Standard error ($K)", fmt(model.t.sigmaHat, 2)],
          ["Leases / predictors", n + " / " + k],
        ]
          .map(
            ([l, v]) =>
              '<div class="cf-metric"><strong>' +
              v +
              "</strong><span>" +
              l +
              "</span></div>",
          )
          .join("") +
        "</div><p>Fitted equation: Predicted rent ($K) = " +
        fmt(model.coef[0], 2) +
        selected
          .map(
            (c, i) =>
              " " +
              signed(model.coef[i + 1]) +
              " × " +
              VARS[c].name,
          )
          .join("") +
        "</p>";
      document.getElementById("coefficients").innerHTML =
        '<div class="cf-tablewrap"><table class="cf-table"><thead><tr><th scope="col">Term</th><th scope="col">Coefficient</th><th scope="col">Std. error</th><th scope="col">p-value</th><th scope="col">VIF</th></tr></thead><tbody>' +
        model.coef
          .map((b, i) => {
            const vif = i ? model.vif[i - 1] : null;
            return (
              "<tr" +
              (vif && vif > 10 ? ' class="w12-flag"' : "") +
              "><td>" +
              (i ? VARS[selected[i - 1]].name : "Intercept") +
              "</td><td>" +
              fmt(b, 4) +
              "</td><td>" +
              fmt(model.t.se[i], 4) +
              "</td><td>" +
              pfmt(model.t.p[i]) +
              "</td><td>" +
              (i ? fmt(vif, 1) + (vif > 10 ? " ⚠" : "") : "—") +
              "</td></tr>"
            );
          })
          .join("") +
        "</tbody></table></div>" +
        '<p class="cf-muted">VIF above 10 (flagged ⚠) means a predictor is largely repeating information in the others. Its coefficient and p-value become unstable.</p>';
      document.getElementById("plain").innerHTML =
        "<h3>What each coefficient says</h3><ul>" +
        selected
          .map(
            (c, i) =>
              "<li>" +
              interpret(c, model.coef[i + 1]) +
              (model.t.p[i + 1] > 0.05
                ? " <em>(p = " +
                  pfmt(model.t.p[i + 1]) +
                  ": the data cannot pin this down.)</em>"
                : "") +
              "</li>",
          )
          .join("") +
        "</ul>";
      const label = selected.map((c) => VARS[c].name).join(" + ");
      if (selected.includes(0) && !history.some((h) => h.label === label)) {
        history.push({
          label,
          b: model.coef[1 + selected.indexOf(0)],
          p: model.t.p[1 + selected.indexOf(0)],
          adj: model.adjust_R2,
        });
      }
      document.getElementById("history").innerHTML = history.length
        ? '<div class="cf-tablewrap"><table class="cf-table"><thead><tr><th scope="col">Predictors</th><th scope="col">Area coefficient</th><th scope="col">Area p-value</th><th scope="col">Adjusted R²</th></tr></thead><tbody>' +
          history
            .map(
              (h) =>
                "<tr><td>" +
                h.label +
                "</td><td>" +
                fmt(h.b, 2) +
                "</td><td>" +
                pfmt(h.p) +
                "</td><td>" +
                fmt(h.adj, 3) +
                "</td></tr>",
            )
            .join("") +
          "</tbody></table></div>"
        : '<p class="cf-muted">Include Area to track its coefficient.</p>';
      charts();
    } catch (e) {
      model = null;
      document.getElementById("error").textContent = e.message;
    }
  }
  function setSelected(cols) {
    selected = cols.slice();
    document
      .querySelectorAll("[data-predictor]")
      .forEach(
        (el) => (el.checked = selected.includes(Number(el.dataset.predictor))),
      );
    fit();
  }
  Object.keys(PRESETS).forEach((key) =>
    document
      .getElementById("preset-" + key)
      .addEventListener("click", () => setSelected(PRESETS[key].cols)),
  );
  document.querySelectorAll("[data-predictor]").forEach((el) =>
    el.addEventListener("change", () => {
      const next = [...document.querySelectorAll("[data-predictor]:checked")]
        .map((e) => Number(e.dataset.predictor))
        .sort();
      if (!next.length) {
        el.checked = true;
        return;
      }
      selected = next;
      fit();
    }),
  );

  /* ---------- section 3: SVG charts (color-safe shapes) ---------- */
  function svgChart(points, opt) {
    const W = 460,
      H = 300,
      l = 56,
      r = 14,
      t = 14,
      b = 44;
    const xs = points.map((p) => p.x),
      ys = points.map((p) => p.y);
    const xmin = opt.xmin ?? Math.min(...xs),
      xmax = opt.xmax ?? Math.max(...xs);
    let ymin = opt.ymin ?? Math.min(...ys),
      ymax = opt.ymax ?? Math.max(...ys);
    const pad = opt.nopad ? 0 : (ymax - ymin) * 0.08;
    ymin -= pad;
    ymax += pad;
    const X = (x) => l + ((x - xmin) / (xmax - xmin)) * (W - l - r),
      Y = (y) => H - b - ((y - ymin) / (ymax - ymin)) * (H - t - b);
    let s = `<svg viewBox="0 0 ${W} ${H}" class="w12-svg" role="img" aria-label="${opt.aria}">`;
    for (let i = 0; i <= 4; i++) {
      const yv = ymin + ((ymax - ymin) * i) / 4,
        xv = xmin + ((xmax - xmin) * i) / 4;
      s += `<line x1="${l}" x2="${W - r}" y1="${Y(yv)}" y2="${Y(yv)}" class="w12-grid"/>`;
      s += `<text x="${l - 6}" y="${Y(yv) + 4}" text-anchor="end">${fmt(yv, 0)}</text>`;
      s += `<text x="${X(xv)}" y="${H - b + 16}" text-anchor="middle">${fmt(xv, opt.xdigits ?? 1)}</text>`;
    }
    s += `<text x="${(l + W - r) / 2}" y="${H - 6}" text-anchor="middle">${opt.xLabel}</text>`;
    s += `<text transform="translate(14 ${(t + H - b) / 2}) rotate(-90)" text-anchor="middle">${opt.yLabel}</text>`;
    (opt.lines || []).forEach((ln) => {
      s += `<line x1="${X(xmin)}" x2="${X(xmax)}" y1="${Y(ln.f(xmin))}" y2="${Y(ln.f(xmax))}" class="${ln.cls}"/>`;
    });
    points.forEach((p) => {
      const cx = X(p.x),
        cy = Y(p.y);
      s += p.prime
        ? `<polygon points="${cx},${cy - 6} ${cx - 5.5},${cy + 4} ${cx + 5.5},${cy + 4}" class="w12-prime"><title>${p.tip}</title></polygon>`
        : `<circle cx="${cx}" cy="${cy}" r="4.5" class="w12-sub"><title>${p.tip}</title></circle>`;
    });
    return s + "</svg>";
  }
  function charts() {
    const pts = LEASES.map((r, i) => ({
      x: r[0],
      y: r[4],
      prime: r[2] === 1,
      tip: `Lease ${i + 1}: ${fmt(r[0] * 1000, 0)} sq ft, ${r[1]} yrs, ${r[2] ? "prime" : "suburban"}, $${fmt(r[4])}K`,
    }));
    document.getElementById("scatter").innerHTML =
      svgChart(pts, {
        xmin: 0.7,
        xmax: 3.1,
        ymin: 0,
        ymax: 80,
        nopad: true,
        xLabel: "Area (1,000 sq ft)",
        yLabel: "Annual rent ($K)",
        aria:
          "Scatterplot of annual rent against lease area for 20 leases; prime leases cluster at larger sizes and higher rents; the Week 11 line rises from about 24 to 76.",
        lines: [{ f: (x) => 8.4 + 22.5 * x, cls: "w12-line" }],
      }) +
      '<p class="cf-muted">Line: Week 11 model, 8.40 + 22.50 × Area. Notice how many triangles sit above it and circles below it.</p>';
    if (!model) return;
    const res = LEASES.map((r, i) => ({
      x: model.predict[i],
      y: model.resid[i],
      prime: r[2] === 1,
      tip: `Lease ${i + 1}: fitted ${fmt(model.predict[i])}, residual ${fmt(model.resid[i])}`,
    }));
    const m = Math.ceil(Math.max(...res.map((p) => Math.abs(p.y))) / 4) * 4;
    document.getElementById("residuals").innerHTML = svgChart(res, {
      ymin: -m,
      ymax: m,
      nopad: true,
      xLabel: "Fitted rent ($K)",
      yLabel: "Residual ($K)",
      xdigits: 0,
      aria:
        "Residuals against fitted rent for the current model; points scatter above and below zero with no clear curve or funnel.",
      lines: [{ f: () => 0, cls: "w12-zero" }],
    });
  }
  document.getElementById("data-table").innerHTML =
    '<div class="cf-tablewrap"><table class="cf-table"><thead><tr><th scope="col">Lease</th><th scope="col">Area (1,000 sq ft)</th><th scope="col">Age (yrs)</th><th scope="col">Prime</th><th scope="col">Parking</th><th scope="col">Rent ($K/yr)</th></tr></thead><tbody>' +
    LEASES.map(
      (r, i) =>
        `<tr><td>${i + 1}</td><td>${fmt(r[0])}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${fmt(r[4])}</td></tr>`,
    ).join("") +
    "</tbody></table></div>";
  document.getElementById("download").addEventListener("click", () => {
    const csv =
      "lease,area_1000sqft,age_years,prime,parking_spaces,rent_k\n" +
      LEASES.map((r, i) => [i + 1, ...r].join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      a = document.createElement("a");
    a.href = url;
    a.download = "cowford-w12-leases.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  guided();
  // seed the history with Model A so the comparison starts from Week 11
  setSelected([0]);
  setSelected([0, 1, 2]);
  window.CowfordWeek12 = { LEASES, fit: (cols) => M.regress(LEASES, cols) };
})();
