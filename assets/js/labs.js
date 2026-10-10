(function () {
  "use strict";
  const M = CowfordModels,
    week = Number(document.body.dataset.week),
    app = document.querySelector("#lab");
  const f = (v, n = 2) =>
    Number(v).toLocaleString("en-US", {
      minimumFractionDigits: n,
      maximumFractionDigits: n,
    });
  const pct = (v) => f(v * 100, 1) + "%",
    dollars = (v) => "$" + f(v, 2) + "K";
  const escape = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const metrics = (items) =>
    '<div class="cf-metrics" aria-live="polite">' +
    items
      .map(
        ([label, value]) =>
          '<div class="cf-metric"><strong>' +
          value +
          "</strong><span>" +
          label +
          "</span></div>",
      )
      .join("") +
    "</div>";
  const slider = (id, label, min, max, value, step = 1) =>
    '<div class="cf-control"><label for="' +
    id +
    '">' +
    label +
    '</label><input type="range" id="' +
    id +
    '" min="' +
    min +
    '" max="' +
    max +
    '" step="' +
    step +
    '" value="' +
    value +
    '"><output for="' +
    id +
    '" id="' +
    id +
    '-value">' +
    value +
    "</output></div>";
  const table = (heads, rows) =>
    '<div class="cf-tablewrap"><table class="cf-table"><thead><tr>' +
    heads.map((h) => '<th scope="col">' + h + "</th>").join("") +
    "</tr></thead><tbody>" +
    rows.join("") +
    "</tbody></table></div>";
  function bindSlider(id, fn, formatter = (x) => x) {
    const el = document.getElementById(id);
    document.getElementById(id + "-value").textContent = formatter(
      Number(el.value),
    );
    el.addEventListener("input", () => {
      document.getElementById(id + "-value").textContent = formatter(
        Number(el.value),
      );
      fn(Number(el.value));
    });
  }
  function chart(id, points, options = {}) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect(),
      ratio = devicePixelRatio || 1;
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);
    const w = rect.width,
      h = rect.height,
      l = 58,
      r = 18,
      t = 20,
      b = 46;
    const xs = points.map((p) => p[0]),
      ys = points.map((p) => p[1]);
    let xmin = options.xmin ?? Math.min(...xs),
      xmax = options.xmax ?? Math.max(...xs),
      ymin = options.ymin ?? Math.min(0, ...ys),
      ymax = options.ymax ?? Math.max(...ys);
    if (xmin === xmax) xmax = xmin + 1;
    if (ymin === ymax) ymax = ymin + 1;
    const X = (x) => l + ((x - xmin) / (xmax - xmin)) * (w - l - r),
      Y = (y) => h - b - ((y - ymin) / (ymax - ymin)) * (h - t - b);
    ctx.font = "12px Arial";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = ymin + ((ymax - ymin) * i) / 4;
      ctx.strokeStyle = "#d3dedb";
      ctx.beginPath();
      ctx.moveTo(l, Y(y));
      ctx.lineTo(w - r, Y(y));
      ctx.stroke();
      ctx.fillStyle = "#526666";
      ctx.textAlign = "right";
      ctx.fillText(f(y, 1), l - 8, Y(y) + 4);
      const x = xmin + ((xmax - xmin) * i) / 4;
      ctx.textAlign = "center";
      ctx.fillText(f(x, 1), X(x), h - b + 20);
    }
    ctx.fillStyle = "#526666";
    ctx.textAlign = "center";
    ctx.fillText(options.xLabel || "", (l + w - r) / 2, h - 8);
    ctx.save();
    ctx.translate(14, (t + h - b) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(options.yLabel || "", 0, 0);
    ctx.restore();
    if (options.line) {
      ctx.strokeStyle = "#28629b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(X(xmin), Y(options.line(xmin)));
      ctx.lineTo(X(xmax), Y(options.line(xmax)));
      ctx.stroke();
    }
    points.forEach(([x, y]) => {
      ctx.fillStyle = "#0b6e4f";
      if (options.bars) {
        const bw = ((w - l - r) / points.length) * 0.85;
        ctx.fillRect(X(x) - bw / 2, Y(y), bw, Y(0) - Y(y));
      } else {
        ctx.beginPath();
        ctx.arc(X(x), Y(y), 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    if (options.deadline !== undefined) {
      ctx.strokeStyle = "#ad3029";
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(X(options.deadline), t);
      ctx.lineTo(X(options.deadline), h - b);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  function questions(items) {
    const section = document.createElement("section");
    section.className = "cf-section cf-questions";
    section.innerHTML =
      "<h2>Concept check</h2>" +
      items
        .map(
          (q, i) =>
            "<fieldset><legend>" +
            q.q +
            "</legend>" +
            q.options
              .map(
                (o, j) =>
                  '<label><input type="radio" name="check' +
                  i +
                  '" value="' +
                  j +
                  '"> ' +
                  o +
                  "</label>",
              )
              .join("") +
            '<p id="feedback' +
            i +
            '" aria-live="polite"></p></fieldset>',
        )
        .join("") +
      '<button id="check-answers">Check answers</button>';
    app.append(section);
    document.getElementById("check-answers").onclick = () =>
      items.forEach((q, i) => {
        const v = section.querySelector("input[name=check" + i + "]:checked");
        document.getElementById("feedback" + i).textContent = !v
          ? "Choose an answer first."
          : (Number(v.value) === q.answer
              ? "Correct. "
              : "Revisit this idea. ") + q.explanation;
      });
  }
  function networkDiagram(s) {
    const ranks = {},
      counts = {},
      positions = {};
    s.tasks.forEach((t) => {
      ranks[t.id] = t.pred.length
        ? 1 + Math.max(...t.pred.map((p) => ranks[p]))
        : 0;
    });
    s.tasks.forEach((t) => {
      const rank = ranks[t.id],
        row = counts[rank] || 0;
      counts[rank] = row + 1;
      positions[t.id] = [50 + rank * 130, 45 + row * 90];
    });
    const width = 100 + Math.max(...Object.values(ranks)) * 130;
    const edges = s.tasks
      .flatMap((t) =>
        t.pred.map((p) => {
          const from = positions[p],
            to = positions[t.id];
          return (
            '<path d="M' +
            (from[0] + 35) +
            " " +
            from[1] +
            " L" +
            (to[0] - 35) +
            " " +
            to[1] +
            '" fill="none" stroke="#526666" stroke-width="2" marker-end="url(#cf-arrow)"/>'
          );
        }),
      )
      .join("");
    const nodes = s.tasks
      .map((t) => {
        const [x, y] = positions[t.id];
        return (
          '<g><rect x="' +
          (x - 34) +
          '" y="' +
          (y - 23) +
          '" width="68" height="46" rx="4" fill="' +
          (t.critical ? "#edf7f1" : "#fff") +
          '" stroke="' +
          (t.critical ? "#0b6e4f" : "#28629b") +
          '" stroke-width="2"/><text x="' +
          x +
          '" y="' +
          (y - 3) +
          '" text-anchor="middle" fill="#202c2c" font-size="15" font-weight="700">' +
          t.id +
          '</text><text x="' +
          x +
          '" y="' +
          (y + 14) +
          '" text-anchor="middle" fill="#526666" font-size="12">' +
          f(t.time, 2) +
          " w</text></g>"
        );
      })
      .join("");
    return (
      '<div class="cf-tablewrap"><svg class="cf-network" viewBox="0 0 ' +
      width +
      ' 180" role="img" aria-label="Activity-on-node network. Arrows indicate predecessors; green nodes are critical. Durations are in weeks."><defs><marker id="cf-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8" fill="#526666"/></marker></defs>' +
      edges +
      nodes +
      "</svg></div>"
    );
  }
  const reset =
    '<button class="secondary" id="reset" title="Restore baseline values">Reset baseline</button>';
  const baseline = () => structuredClone(M.activities);
  function networkTable(tasks, editable = false) {
    return table(
      ["Activity", "Predecessors", "a", "m", "b", "Expected", "Variance"],
      tasks.map(
        (t) =>
          "<tr><td>" +
          t.id +
          " - " +
          escape(t.name) +
          "</td><td>" +
          (editable
            ? '<input class="wide" aria-label="' +
              t.id +
              ' predecessors" data-id="' +
              t.id +
              '" data-field="pred" value="' +
              t.pred.join(",") +
              '">'
            : t.pred.join(", ") || "None") +
          "</td>" +
          ["a", "m", "b"]
            .map(
              (k) =>
                "<td>" +
                (editable
                  ? '<input type="number" min="0" step=".1" aria-label="' +
                    t.id +
                    " " +
                    k +
                    ' weeks" data-id="' +
                    t.id +
                    '" data-field="' +
                    k +
                    '" value="' +
                    t[k] +
                    '">'
                  : t[k]) +
                "</td>",
            )
            .join("") +
          "<td>" +
          f((t.a + 4 * t.m + t.b) / 6, 3) +
          "</td><td>" +
          f(((t.b - t.a) / 6) ** 2, 3) +
          "</td></tr>",
      ),
    );
  }
  function scheduleLab() {
    let tasks = baseline(),
      delay = 0,
      delayTask = "D";
    app.innerHTML =
      '<section class="cf-section"><h2>1. Map the renovation</h2><p>Cowford Properties is renovating a Jacksonville flex-space building. Each activity starts only after all predecessors finish. Times are in weeks. This classroom renovation uses the same numerical network as the Logistics case.</p><p class="cf-note">Expected time = (a + 4m + b) / 6. Variance = ((b - a) / 6)<sup>2</sup>.</p><div id="activity-table"></div><div class="cf-actions">' +
      reset +
      '</div><p id="error" class="cf-error" role="status"></p></section><section class="cf-section"><h2>2. Test a delay</h2><div class="cf-controls"><label>Activity <select id="delay-task">' +
      tasks
        .map(
          (t) =>
            "<option " +
            (t.id === "D" ? "selected" : "") +
            ">" +
            t.id +
            "</option>",
        )
        .join("") +
      "</select></label>" +
      slider("delay", "Additional duration (weeks)", 0, 8, 0, 0.25) +
      '</div><div id="schedule-output"></div><canvas id="gantt" class="cf-chart" role="img" aria-label="Earliest-start schedule by activity. Critical activities are identified in the table."></canvas><div id="passes"></div><p class="cf-note">Forward pass: ES is the largest predecessor EF. Backward pass: LF is the smallest successor LS. Float = LS - ES. Recompute the critical path after every duration change.</p></section>';
    function update() {
      try {
        const original = M.schedule(tasks),
          d = Object.fromEntries(original.tasks.map((t) => [t.id, t.time]));
        d[delayTask] += delay;
        const s = M.schedule(tasks, d);
        document.getElementById("error").textContent = "";
        document.getElementById("schedule-output").innerHTML =
          metrics([
            ["Project completion (weeks)", f(s.finish, 3)],
            ["Baseline completion (weeks)", f(original.finish, 3)],
            ["Delay to project (weeks)", f(s.finish - original.finish, 3)],
          ]) +
          "<p><strong>Critical path" +
          (s.paths.length > 1 ? "s" : "") +
          ":</strong> " +
          s.paths.map((p) => p.join(" → ")).join("; ") +
          "</p>" +
          networkDiagram(s);
        document.getElementById("passes").innerHTML = table(
          ["Activity", "ES", "EF", "LS", "LF", "Float", "Critical"],
          s.tasks.map(
            (t) =>
              '<tr class="' +
              (t.critical ? "cf-critical" : "") +
              '"><td>' +
              t.id +
              "</td>" +
              ["es", "ef", "ls", "lf", "float"]
                .map((k) => "<td>" + f(t[k], 3) + "</td>")
                .join("") +
              "<td>" +
              (t.critical ? "Yes" : "No") +
              "</td></tr>",
          ),
        );
        const c = document.getElementById("gantt"),
          rect = c.getBoundingClientRect(),
          ratio = devicePixelRatio || 1;
        c.width = rect.width * ratio;
        c.height = rect.height * ratio;
        const ctx = c.getContext("2d");
        ctx.scale(ratio, ratio);
        ctx.font = "12px Arial";
        const scale = (rect.width - 90) / s.finish;
        s.tasks.forEach((t, i) => {
          const y = 20 + i * 24;
          ctx.fillStyle = "#202c2c";
          ctx.fillText(t.id, 12, y + 13);
          ctx.fillStyle = t.critical ? "#0b6e4f" : "#28629b";
          ctx.fillRect(45 + t.es * scale, y, t.time * scale, 17);
        });
        ctx.fillStyle = "#526666";
        ctx.fillText(
          "Weeks from start: 0 to " + f(s.finish, 2),
          45,
          rect.height - 12,
        );
      } catch (e) {
        document.getElementById("error").textContent = e.message;
        document.getElementById("schedule-output").innerHTML = "";
        document.getElementById("passes").innerHTML = "";
        document
          .getElementById("gantt")
          .getContext("2d")
          .clearRect(0, 0, 9999, 9999);
      }
    }
    function drawInputs() {
      document.getElementById("activity-table").innerHTML = networkTable(
        tasks,
        true,
      );
      document.querySelectorAll("[data-field]").forEach(
        (el) =>
          (el.onchange = () => {
            const t = tasks.find((t) => t.id === el.dataset.id);
            t[el.dataset.field] =
              el.dataset.field === "pred"
                ? el.value
                    .split(",")
                    .map((x) => x.trim().toUpperCase())
                    .filter(Boolean)
                : Number(el.value);
            update();
          }),
      );
    }
    drawInputs();
    bindSlider(
      "delay",
      (v) => {
        delay = v;
        update();
      },
      (v) => f(v, 2),
    );
    document.getElementById("delay-task").onchange = (e) => {
      delayTask = e.target.value;
      update();
    };
    document.getElementById("reset").onclick = () => {
      tasks = baseline();
      delay = 0;
      document.getElementById("delay").value = 0;
      document.getElementById("delay-value").textContent = "0";
      drawInputs();
      update();
    };
    window.addEventListener("resize", update);
    update();
    questions([
      {
        q: "At a merge, when can the successor start?",
        options: [
          "At the first predecessor finish",
          "After every predecessor finishes",
          "At the average finish time",
        ],
        answer: 1,
        explanation:
          "Use the maximum predecessor EF; all required work must be complete.",
      },
      {
        q: "Does reducing a noncritical activity always shorten the project?",
        options: ["Yes", "No"],
        answer: 1,
        explanation:
          "The longest path controls completion. Off-path improvements may leave the completion date unchanged.",
      },
      {
        q: "What should follow a crash decision?",
        options: [
          "Keep the original critical path",
          "Recalculate the schedule and critical path",
        ],
        answer: 1,
        explanation:
          "A different path can become critical as durations change.",
      },
    ]);
  }
  function uncertaintyLab() {
    let tasks = baseline(),
      result = null,
      deadline = 20;
    const logisticsNames = [
      "Site preparation and permitting",
      "Structural engineering review",
      "Racking procurement",
      "Foundation and structural work",
      "Electrical and utility rough-in",
      "Racking installation",
      "HVAC installation",
      "Final inspections",
      "Handover and staff training",
    ];
    tasks.forEach((t, i) => (t.name = logisticsNames[i]));
    app.innerHTML =
      '<section class="cf-section"><h2>1. Set the commitment date</h2><p>Cowford Logistics must finish the warehouse expansion before Professional Services can use the new storage capacity. The verified Week 9 network is the starting point.</p><div class="cf-controls">' +
      slider("deadline", "Deadline (weeks)", 15, 26, 20, 0.1) +
      '<label>Trials <select id="trials"><option>1000</option><option selected>5000</option><option>10000</option></select></label><label>Random seed <input type="number" id="seed" min="0" max="4294967295" value="4550"></label></div><div class="cf-actions"><button id="run">Run simulation</button>' +
      reset +
      '</div><div id="analytic"></div><p id="error" class="cf-error" role="status"></p></section><section class="cf-section"><h2>2. Compare the evidence</h2><div id="sim-output" aria-live="polite"><p>Run the warehouse model to see the distribution of finish times.</p></div><canvas id="histogram" class="cf-chart" role="img" aria-label="Simulated completion-time histogram; dashed red line is the deadline."></canvas><div id="criticality"></div><p class="cf-note">The analytic PERT result assumes independent durations, a fixed critical path, and an approximately normal project completion time. The simulation samples bounded beta-PERT activity durations (shape weight 4) and recomputes the longest path every trial. Beta-PERT has the same activity means but generally different variances from the textbook ((b-a)/6)<sup>2</sup> approximation. Path switching and distribution choice can both explain differences. These probabilities are model estimates, not guarantees.</p></section><section class="cf-section"><h2>3. Examine the assumptions</h2><details><summary>Activity estimates (weeks)</summary><div id="activity-table"></div></details><p>Keep 0 ≤ a ≤ m ≤ b. Changing an estimate creates a new scenario; reset to recover the verified baseline.</p></section>';
    function analytic() {
      const s = M.schedule(tasks);
      document.getElementById("analytic").innerHTML =
        metrics([
          ["Expected duration (weeks)", f(s.finish, 3)],
          ["Critical-path SD (weeks)", f(s.sd, 4)],
          ["Analytic P(on time)", pct(M.probability(s, deadline))],
        ]) +
        "<p>Critical path: " +
        s.paths.map((p) => p.join(" → ")).join("; ") +
        "</p>" +
        (s.paths.length > 1
          ? '<p class="cf-note">Multiple critical paths: the displayed analytic variance uses the first path only. Use the simulation to examine joint project completion.</p>'
          : "");
    }
    function show() {
      if (!result) return;
      const n = result.samples.length,
        p = result.samples.filter((t) => t <= deadline).length / n,
        se = Math.sqrt((p * (1 - p)) / n);
      document.getElementById("sim-output").innerHTML =
        metrics([
          ["Simulated P(on time)", pct(p)],
          ["Median completion (weeks)", f(result.p50)],
          ["90th percentile (weeks)", f(result.p90)],
          ["Trials", f(n, 0)],
        ]) +
        "<p>Monte Carlo standard error: " +
        f(se * 100, 2) +
        " percentage points. Same seed and inputs reproduce the same sample.</p>";
      const min = Math.min(result.samples[0], deadline),
        max = Math.max(result.samples.at(-1), deadline),
        width = (max - min) / 20,
        bins = Array(20).fill(0);
      result.samples.forEach(
        (x) => bins[Math.min(19, Math.floor((x - min) / width))]++,
      );
      chart(
        "histogram",
        bins.map((v, i) => [min + (i + 0.5) * width, v]),
        {
          bars: true,
          xmin: min,
          xmax: max,
          ymin: 0,
          deadline,
          xLabel: "Completion time (weeks)",
          yLabel: "Trial count",
        },
      );
      document.getElementById("criticality").innerHTML = table(
        ["Activity", "Trials on critical path"],
        tasks.map(
          (t) =>
            "<tr><td>" +
            t.id +
            "</td><td>" +
            pct((result.criticalCounts[t.id] || 0) / n) +
            "</td></tr>",
        ),
      );
    }
    function invalidate() {
      result = null;
      document.getElementById("sim-output").innerHTML =
        "<p>Inputs changed. Run the simulation for this scenario.</p>";
      document.getElementById("criticality").innerHTML = "";
      document
        .getElementById("histogram")
        .getContext("2d")
        .clearRect(0, 0, 9999, 9999);
    }
    function inputs() {
      document.getElementById("activity-table").innerHTML = networkTable(
        tasks,
        true,
      );
      document.querySelectorAll("[data-field]").forEach(
        (el) =>
          (el.onchange = () => {
            const t = tasks.find((t) => t.id === el.dataset.id);
            t[el.dataset.field] =
              el.dataset.field === "pred"
                ? el.value
                    .split(",")
                    .map((x) => x.trim().toUpperCase())
                    .filter(Boolean)
                : Number(el.value);
            invalidate();
            try {
              analytic();
              document.getElementById("error").textContent = "";
            } catch (e) {
              document.getElementById("error").textContent = e.message;
              document.getElementById("analytic").innerHTML = "";
            }
          }),
      );
    }
    bindSlider(
      "deadline",
      (v) => {
        deadline = v;
        try {
          analytic();
          show();
        } catch (e) {
          document.getElementById("error").textContent = e.message;
        }
      },
      (v) => f(v, 1),
    );
    ["trials", "seed"].forEach(
      (id) => (document.getElementById(id).onchange = invalidate),
    );
    document.getElementById("run").onclick = () => {
      try {
        const seed = Number(document.getElementById("seed").value);
        if (!Number.isInteger(seed) || seed < 0 || seed > 4294967295)
          throw Error("Use an integer seed from 0 to 4294967295.");
        result = M.simulate(
          tasks,
          Number(document.getElementById("trials").value),
          seed,
        );
        analytic();
        show();
        document.getElementById("error").textContent = "";
      } catch (e) {
        document.getElementById("error").textContent = e.message;
      }
    };
    document.getElementById("reset").onclick = () => {
      tasks = baseline();
      tasks.forEach((t, i) => (t.name = logisticsNames[i]));
      deadline = 20;
      document.getElementById("deadline").value = 20;
      document.getElementById("deadline-value").textContent = "20";
      inputs();
      invalidate();
      analytic();
    };
    window.addEventListener("resize", show);
    inputs();
    analytic();
    questions([
      {
        q: "Which variance belongs in the textbook fixed-path approximation?",
        options: [
          "All activity variances",
          "Variances on the selected critical path",
        ],
        answer: 1,
        explanation:
          "For that approximation, sum variances on the critical path, then take the square root.",
      },
      {
        q: "What does a 90th-percentile completion date mean?",
        options: [
          "90% of simulated projects finish by that date",
          "The project lasts 90% of the average",
        ],
        answer: 0,
        explanation:
          "A percentile is a probability statement about completion, conditional on the model.",
      },
      {
        q: "Does running more trials fix unrealistic duration assumptions?",
        options: ["Yes", "No"],
        answer: 1,
        explanation:
          "More trials reduce simulation noise; they do not repair the underlying assumptions.",
      },
    ]);
  }
  function regressionLab(multiple) {
    const names = multiple
      ? [
          "Square feet",
          "Location score",
          "Building age",
          "Annual rent ($/sq ft)",
        ]
      : ["Area (1,000 sq ft)", "Annual rent ($K)"];
    let rows = multiple
      ? Array.from({ length: 18 }, (_, i) => {
          const x = 1000 + (i % 6) * 400,
            loc = 3 + ((i * 3) % 7),
            age = 2 + ((i * 7) % 29);
          return [
            x,
            loc,
            age,
            Number(
              (
                14.2 +
                0.018 * x +
                2.85 * loc -
                0.31 * age +
                (((i * 11) % 13) - 6) * 0.8
              ).toFixed(2),
            ),
          ];
        })
      : Array.from({ length: 12 }, (_, i) => {
          const x = 0.5 + i * 0.2;
          return [
            Number(x.toFixed(2)),
            Number((8.4 + 22.5 * x + (((i * 7) % 11) - 5)).toFixed(2)),
          ];
        });
    const initial = structuredClone(rows);
    let selected = multiple ? [0, 1, 2] : [0],
      model = null,
      forecastValues = multiple ? [2000, 7, 15] : [1.5];
    app.innerHTML =
      '<section class="cf-section"><h2>1. Guided forecast</h2><p>Cowford Properties is comparing potential leases. Change the candidate property while keeping the supplied regression equation fixed.</p><p><strong>' +
      (multiple
        ? "Predicted annual rent per sq ft = 14.20 + 0.018 × square feet + 2.85 × location score - 0.31 × building age."
        : "Predicted annual rent ($K) = 8.40 + 22.50 × area (1,000 sq ft).") +
      '</strong></p><div class="cf-controls">' +
      (multiple
        ? slider("area", "Square feet", 1000, 3500, 2000, 50) +
          slider("location", "Location score", 1, 10, 7, 1) +
          slider("age", "Building age (years)", 0, 40, 15, 1)
        : slider("area", "Area (1,000 sq ft)", 0.5, 4, 1.5, 0.1)) +
      '</div><div id="guided"></div><p class="cf-note">' +
      (multiple
        ? "Holding other predictors constant, one location-score point changes predicted rent by $2.85 per sq ft annually. Coefficient magnitudes are not directly comparable across different units. The supplied case output reports R² = .84 and adjusted R² = .82."
        : "One additional thousand square feet is associated with $22.50K more annual rent. The intercept is a mathematical starting point, not a sensible rent estimate for a zero-area lease. The supplied case output reports R² = .78.") +
      ' These supplied outputs do not change when the candidate sliders change.</p></section><section class="cf-section"><h2>2. Refit an editable classroom dataset</h2><p>This synthetic teaching sample is separate from the supplied case output and is not the original 35-lease file. Edit observations or import numeric CSV in the column order below. The fitted equation and diagnostics update from these observations.</p><div class="cf-actions">' +
      reset +
      '<button class="secondary" id="outlier">Raise last rent by 30</button><button class="secondary" id="add-row">Add observation</button><button class="secondary" id="download">Download CSV</button></div>' +
      (multiple
        ? '<p id="predictors">Include predictors: ' +
          ["Square feet", "Location score", "Building age"]
            .map(
              (n, i) =>
                '<label><input type="checkbox" data-predictor="' +
                i +
                '" checked> ' +
                n +
                "</label> ",
            )
            .join("") +
          '</p><button class="secondary" id="correlated">Create correlated predictors</button>'
        : "") +
      '<div id="data-table"></div><details><summary>Import numeric CSV</summary><p>Optional header row; comma-delimited numeric cells only. ' +
      names.join(", ") +
      '.</p><label for="csv">Observations</label><textarea id="csv" spellcheck="false"></textarea><button id="import">Import and fit</button></details><p id="error" class="cf-error" role="status"></p><div id="fit-output"></div><div class="cf-grid"><div><h3>' +
      (multiple
        ? "Observed vs predicted rent"
        : "Scatterplot and fitted line") +
      '</h3><canvas id="scatter" class="cf-chart" role="img" aria-label="Observed data and fitted relationship"></canvas></div><div><h3>Residuals vs fitted values</h3><canvas id="residuals" class="cf-chart" role="img" aria-label="Residuals plotted against fitted rent"></canvas></div></div><div id="coefficients"></div><h3>Forecast from the fitted classroom model</h3><div id="sample-forecast"></div><p class="cf-note">Residual = observed - predicted. Curvature can indicate a missing nonlinear term; a funnel can indicate unequal error variance. The 95% prediction interval assumes the linear model and independent, approximately normal errors with constant variance. Association alone does not establish causation.</p></section>';
    function guided() {
      const y = multiple
        ? 14.2 +
          0.018 * forecastValues[0] +
          2.85 * forecastValues[1] -
          0.31 * forecastValues[2]
        : 8.4 + 22.5 * forecastValues[0];
      document.getElementById("guided").innerHTML = metrics([
        [
          "Supplied-model prediction",
          multiple ? "$" + f(y) + "/sq ft/year" : dollars(y) + "/year",
        ],
      ]);
      sampleForecast();
    }
    function sampleForecast() {
      if (!model) {
        document.getElementById("sample-forecast").innerHTML = "";
        return;
      }
      try {
        const v = M.forecast(model, forecastValues),
          outside = selected.some(
            (col) =>
              forecastValues[col] < Math.min(...rows.map((r) => r[col])) ||
              forecastValues[col] > Math.max(...rows.map((r) => r[col])),
          );
        document.getElementById("sample-forecast").innerHTML =
          metrics([
            ["Fitted-sample prediction", f(v.value)],
            ["95% prediction interval", f(v.lo) + " to " + f(v.hi)],
          ]) +
          "<p>Units: " +
          names.at(-1) +
          ". " +
          (outside
            ? "Extrapolation: at least one candidate predictor is outside the observed range."
            : "Candidate predictor values fall within the observed marginal ranges; unusual combinations may still be unsupported.") +
          "</p>";
      } catch (e) {
        document.getElementById("sample-forecast").textContent = e.message;
      }
    }
    bindSlider(
      "area",
      (v) => {
        forecastValues[0] = v;
        guided();
      },
      (v) => f(v, multiple ? 0 : 1),
    );
    if (multiple) {
      bindSlider("location", (v) => {
        forecastValues[1] = v;
        guided();
      });
      bindSlider("age", (v) => {
        forecastValues[2] = v;
        guided();
      });
    }
    function drawCharts() {
      if (!model) return;
      chart(
        "scatter",
        rows.map((r, i) =>
          multiple ? [model.predict[i], r.at(-1)] : [r[0], r[1]],
        ),
        {
          xLabel: multiple ? "Predicted rent" : names[0],
          yLabel: names.at(-1),
          line: multiple ? (x) => x : (x) => model.coef[0] + model.coef[1] * x,
        },
      );
      chart(
        "residuals",
        model.predict.map((x, i) => [x, model.resid[i]]),
        { xLabel: "Fitted rent", yLabel: "Residual", line: () => 0 },
      );
    }
    function fit() {
      try {
        model = M.regress(rows, selected);
        document.getElementById("error").textContent = "";
        document.getElementById("fit-output").innerHTML =
          metrics([
            ["Observations", f(rows.length, 0)],
            ["R²", f(model.R2, 3)],
            ["Adjusted R²", f(model.adjust_R2, 3)],
            ["Residual SD", f(model.t.sigmaHat, 3)],
          ]) +
          "<p>Fitted equation: ŷ = " +
          f(model.coef[0], 3) +
          selected
            .map(
              (col, i) =>
                " " +
                (model.coef[i + 1] >= 0 ? "+" : "-") +
                " " +
                f(Math.abs(model.coef[i + 1]), 5) +
                " × " +
                names[col],
            )
            .join("") +
          "</p>";
        document.getElementById("coefficients").innerHTML =
          table(
            ["Term", "Coefficient", "Standard error", "p-value", "VIF"],
            model.coef.map(
              (v, i) =>
                "<tr><td>" +
                (i ? names[selected[i - 1]] : "Intercept") +
                "</td><td>" +
                f(v, 5) +
                "</td><td>" +
                f(model.t.se[i], 5) +
                "</td><td>" +
                f(model.t.p[i], 4) +
                "</td><td>" +
                (i ? f(model.vif[i - 1], 2) : "—") +
                "</td></tr>",
            ),
          ) +
          '<p class="cf-muted">VIF measures predictor redundancy. Large VIF values warn that individual coefficients may be unstable. Small p-values describe evidence against a zero coefficient under the model assumptions; they do not measure managerial importance.</p>';
        drawCharts();
        sampleForecast();
      } catch (e) {
        model = null;
        document.getElementById("error").textContent = e.message;
        ["fit-output", "coefficients", "sample-forecast"].forEach(
          (id) => (document.getElementById(id).innerHTML = ""),
        );
        ["scatter", "residuals"].forEach((id) =>
          document
            .getElementById(id)
            .getContext("2d")
            .clearRect(0, 0, 9999, 9999),
        );
      }
    }
    function drawRows() {
      document.getElementById("data-table").innerHTML = table(
        [...names, "Remove"],
        rows.map(
          (r, i) =>
            "<tr>" +
            r
              .map(
                (v, j) =>
                  '<td><input type="number" step="any" aria-label="Observation ' +
                  (i + 1) +
                  " " +
                  names[j] +
                  '" data-row="' +
                  i +
                  '" data-col="' +
                  j +
                  '" value="' +
                  v +
                  '"></td>',
              )
              .join("") +
            '<td><button class="secondary" data-remove="' +
            i +
            '" title="Remove observation ' +
            (i + 1) +
            '" aria-label="Remove observation ' +
            (i + 1) +
            '">×</button></td></tr>',
        ),
      );
      document.querySelectorAll("[data-row]").forEach(
        (el) =>
          (el.onchange = () => {
            rows[Number(el.dataset.row)][Number(el.dataset.col)] =
              el.value === "" ? NaN : Number(el.value);
            fit();
          }),
      );
      document.querySelectorAll("[data-remove]").forEach(
        (el) =>
          (el.onclick = () => {
            rows.splice(Number(el.dataset.remove), 1);
            drawRows();
            fit();
          }),
      );
    }
    document.getElementById("reset").onclick = () => {
      rows = structuredClone(initial);
      selected = multiple ? [0, 1, 2] : [0];
      document
        .querySelectorAll("[data-predictor]")
        .forEach((el) => (el.checked = true));
      drawRows();
      fit();
    };
    document.getElementById("outlier").onclick = () => {
      if (rows.length) {
        rows.at(-1)[names.length - 1] += 30;
        drawRows();
        fit();
      }
    };
    document.getElementById("add-row").onclick = () => {
      rows.push(multiple ? [2000, 6, 10, 65] : [1.5, 43]);
      drawRows();
      fit();
    };
    document.getElementById("download").onclick = () => {
      const blob = new Blob(
          [names.join(",") + "\n" + rows.map((r) => r.join(",")).join("\n")],
          { type: "text/csv" },
        ),
        url = URL.createObjectURL(blob),
        a = document.createElement("a");
      a.href = url;
      a.download = "cowford-week" + week + "-classroom.csv";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    document.getElementById("import").onclick = () => {
      try {
        const lines = document
          .getElementById("csv")
          .value.trim()
          .split(/\r?\n/)
          .filter(Boolean);
        if (!lines.length || !lines[0])
          throw Error("Paste observations first.");
        if (lines[0].split(",").some((v) => !Number.isFinite(Number(v))))
          lines.shift();
        const next = lines.map((line) =>
          line.split(",").map((v) => (v.trim() === "" ? NaN : Number(v))),
        );
        if (
          next.some(
            (r) => r.length !== names.length || !r.every(Number.isFinite),
          )
        )
          throw Error("Each row needs " + names.length + " numeric values.");
        if (next.length > 200) throw Error("Use at most 200 observations.");
        M.regress(next, selected);
        rows = next;
        drawRows();
        fit();
      } catch (e) {
        document.getElementById("error").textContent = e.message;
      }
    };
    if (multiple) {
      document.querySelectorAll("[data-predictor]").forEach(
        (el) =>
          (el.onchange = () => {
            selected = [
              ...document.querySelectorAll("[data-predictor]:checked"),
            ].map((e) => Number(e.dataset.predictor));
            if (!selected.length) {
              el.checked = true;
              selected = [Number(el.dataset.predictor)];
            }
            fit();
          }),
      );
      document.getElementById("correlated").onclick = () => {
        rows = structuredClone(initial).map((r, i) => [
          r[0],
          r[0] / 400 + (i % 2 ? 0.015 : -0.015),
          r[2],
          r[3],
        ]);
        drawRows();
        fit();
      };
    }
    window.addEventListener("resize", drawCharts);
    drawRows();
    fit();
    guided();
    questions(
      multiple
        ? [
            {
              q: "What does a multiple-regression coefficient describe?",
              options: [
                "An association holding included predictors constant",
                "The causal effect regardless of model design",
              ],
              answer: 0,
              explanation:
                "The coefficient is conditional on the other included predictors; causation requires more evidence.",
            },
            {
              q: "Why can R² rise while adjusted R² falls?",
              options: [
                "Adjusted R² penalizes extra predictors",
                "The model cannot do that",
              ],
              answer: 0,
              explanation:
                "An extra predictor can improve raw fit too little to justify its added complexity.",
            },
            {
              q: "What is the primary concern with strongly correlated predictors?",
              options: [
                "Individual coefficients can become unstable",
                "All forecasts must be wrong",
              ],
              answer: 0,
              explanation:
                "Multicollinearity weakens coefficient precision; overall predictions may still be useful within the data range.",
            },
          ]
        : [
            {
              q: "What does a residual of +5 mean?",
              options: [
                "Observed rent is 5 units above predicted rent",
                "Predicted rent is 5 units above observed rent",
              ],
              answer: 0,
              explanation: "Residual = observed minus predicted.",
            },
            {
              q: "Does R² = .78 mean a forecast is 78% accurate?",
              options: ["Yes", "No"],
              answer: 1,
              explanation:
                "R² describes explained variation in the sample, not percentage forecast accuracy.",
            },
            {
              q: "What should a forecast beyond the data range trigger?",
              options: [
                "An extrapolation warning and extra validation",
                "Automatic acceptance",
              ],
              answer: 0,
              explanation:
                "The observed relationship may not continue outside the data range.",
            },
          ],
    );
  }
  function decisionLab() {
    let high = 0.3,
      low = 0.25,
      onTime = 0.862,
      show = false,
      chosen = "";
    const names = [
      "Full expansion",
      "Phased expansion",
      "Defer / lease overflow",
    ];
    app.innerHTML =
      '<section class="cf-section"><h2>1. Make a preliminary decision</h2><p>Cowford Logistics must select one response to uncertain demand. Payoffs are net values in $K. These are the canonical course payoffs, linking the warehouse schedule to the holding company decision.</p>' +
      table(
        ["Alternative", "High demand", "Moderate demand", "Low demand"],
        M.payoffs.map(
          (r, i) =>
            "<tr><td>" +
            names[i] +
            "</td>" +
            r.map((v) => "<td>" + dollars(v) + "</td>").join("") +
            "</tr>",
        ),
      ) +
      "<fieldset><legend>Which alternative would you recommend before calculating EMV?</legend>" +
      names
        .map(
          (n, i) =>
            '<label><input type="radio" name="decision" value="' +
            i +
            '"> ' +
            n +
            " </label>",
        )
        .join("") +
      '</fieldset><button id="reveal">Calculate and compare</button><p id="gate" role="status"></p></section><section class="cf-section"><h2>2. Change the demand outlook</h2><div class="cf-controls">' +
      slider("high", "P(high demand)", 0, 1, 0.3, 0.01) +
      slider("low", "P(low demand)", 0, 1, 0.25, 0.01) +
      '</div><p>Moderate demand receives the remaining probability: <strong id="moderate">45.0%</strong>.</p><div id="decision-output" hidden></div></section><section class="cf-section"><h2>3. Roll back the schedule branch</h2><div class="cf-controls">' +
      slider("ontime", "P(warehouse completes on time)", 0, 1, 0.862, 0.001) +
      '</div><div id="tree-output" hidden></div><p class="cf-note">The additional late-completion loss is $1,020K, modeled as a reduction in full-expansion value. Demand payoffs exclude that additional loss. Schedule outcomes are assumed independent of demand. EMV supports a risk-neutral decision; a board that cannot absorb a worst-case loss may choose differently.</p>' +
      reset +
      "</section>";
    function update() {
      const p = [high, 1 - high - low, low];
      document.getElementById("moderate").textContent = pct(p[1]);
      const d = M.decision(p),
        adj = d.emv[0] - (1 - onTime) * 1020;
      document.getElementById("decision-output").innerHTML =
        metrics([
          ["Highest EMV", names[d.best]],
          ["Expected value with perfect information", dollars(d.evwpi)],
          ["EVPI upper bound", dollars(d.evpi)],
        ]) +
        table(
          ["Alternative", "EMV ($K)", "Worst payoff ($K)", "Max regret ($K)"],
          M.payoffs.map(
            (r, i) =>
              '<tr class="' +
              (i === d.best ? "cf-critical" : "") +
              '"><td>' +
              names[i] +
              "</td><td>" +
              f(d.emv[i]) +
              "</td><td>" +
              f(Math.min(...r)) +
              "</td><td>" +
              f(Math.max(...d.regret[i])) +
              "</td></tr>",
          ),
        ) +
        "<p>EMV = Σ probability × payoff. EVPI = expected value with perfect information - best current EMV. Perfect information allows a different best decision in each demand state.</p>" +
        table(
          ["Regret ($K)", "High", "Moderate", "Low"],
          d.regret.map(
            (r, i) =>
              "<tr><td>" +
              names[i] +
              "</td>" +
              r.map((v) => "<td>" + f(v) + "</td>").join("") +
              "</tr>",
          ),
        ) +
        "<p>Maximax: " +
        names[
          M.payoffs
            .map((r) => Math.max(...r))
            .indexOf(Math.max(...M.payoffs.flat()))
        ] +
        ". Maximin: " +
        names[
          M.payoffs
            .map((r) => Math.min(...r))
            .indexOf(Math.max(...M.payoffs.map((r) => Math.min(...r))))
        ] +
        ". Minimax regret: " +
        names[
          d.regret
            .map((r) => Math.max(...r))
            .indexOf(Math.min(...d.regret.map((r) => Math.max(...r))))
        ] +
        ".</p>";
      const adjusted = [adj, d.emv[1], d.emv[2]],
        best = adjusted.indexOf(Math.max(...adjusted));
      document.getElementById("tree-output").innerHTML =
        '<div class="cf-tree"><strong>Full expansion</strong><ul><li>On time (' +
        pct(onTime) +
        ") → demand EMV " +
        dollars(d.emv[0]) +
        "</li><li>Late (" +
        pct(1 - onTime) +
        ") → demand EMV less loss " +
        dollars(d.emv[0] - 1020) +
        "</li></ul></div>" +
        metrics([
          ["Rollback full-expansion value", dollars(adj)],
          ["Phased-expansion value", dollars(d.emv[1])],
          ["Schedule-adjusted choice", names[best]],
        ]) +
        "<p>Rollback: " +
        f(onTime, 3) +
        " × " +
        f(d.emv[0]) +
        " + " +
        f(1 - onTime, 3) +
        " × " +
        f(d.emv[0] - 1020) +
        " = " +
        f(adj) +
        " ($K).</p>";
      document.getElementById("decision-output").hidden = !show;
      document.getElementById("tree-output").hidden = !show;
    }
    bindSlider(
      "high",
      (v) => {
        high = Math.min(v, 1 - low);
        document.getElementById("high").value = high;
        document.getElementById("high-value").textContent = pct(high);
        update();
      },
      pct,
    );
    bindSlider(
      "low",
      (v) => {
        low = Math.min(v, 1 - high);
        document.getElementById("low").value = low;
        document.getElementById("low-value").textContent = pct(low);
        update();
      },
      pct,
    );
    bindSlider(
      "ontime",
      (v) => {
        onTime = v;
        update();
      },
      pct,
    );
    document.getElementById("reveal").onclick = () => {
      const el = document.querySelector("[name=decision]:checked");
      if (!el) {
        document.getElementById("gate").textContent =
          "Choose a preliminary recommendation first.";
        return;
      }
      chosen = names[Number(el.value)];
      show = true;
      document.getElementById("gate").textContent =
        "Your preliminary choice: " +
        chosen +
        ". Compare it with the expected values and downside risk.";
      update();
    };
    document.getElementById("reset").onclick = () => {
      high = 0.3;
      low = 0.25;
      onTime = 0.862;
      [
        ["high", high],
        ["low", low],
        ["ontime", onTime],
      ].forEach(([id, v]) => {
        document.getElementById(id).value = v;
        document.getElementById(id + "-value").textContent = pct(v);
      });
      update();
    };
    update();
    questions([
      {
        q: "When should EMV be used?",
        options: [
          "When probabilities are defensible and a risk-neutral criterion is appropriate",
          "When probabilities are unknown but can be invented",
        ],
        answer: 0,
        explanation:
          "EMV requires probabilities; the risk attitude and downside exposure still matter.",
      },
      {
        q: "What does EVPI measure?",
        options: [
          "A ceiling on the expected value of perfect information",
          "The actual price of any research study",
        ],
        answer: 0,
        explanation:
          "Imperfect information is generally worth less; EVPI is an upper bound before research cost.",
      },
      {
        q: "How do you evaluate a chance node?",
        options: [
          "Multiply each outcome value by its probability and sum",
          "Choose only the largest payoff",
        ],
        answer: 0,
        explanation:
          "Chance nodes use probability-weighted values; decision nodes select the best available branch.",
      },
    ]);
  }
  function capitalLab() {
    let budget = 2400,
      p = 0.862,
      loss = 1020;
    app.innerHTML =
      '<section class="cf-section"><h2>1. Convene the capital committee</h2><p>Cowford Holdings has $2.4M to invest. Each project must be funded fully or not at all. Capital and NPV below are in $K.</p>' +
      table(
        ["Division", "Capital required", "Unadjusted NPV"],
        M.projects.map(
          (t) =>
            "<tr><td>" +
            t.name +
            "</td><td>" +
            dollars(t.cost) +
            "</td><td>" +
            dollars(t.npv) +
            "</td></tr>",
        ),
      ) +
      '<div class="cf-controls">' +
      slider("budget", "Capital budget ($K)", 0, 3000, 2400, 10) +
      slider(
        "probability",
        "P(Logistics finishes on time)",
        0,
        1,
        0.862,
        0.001,
      ) +
      slider(
        "loss",
        "Additional late-project NPV loss ($K)",
        0,
        1500,
        1020,
        10,
      ) +
      '</div><div class="cf-actions">' +
      reset +
      '</div><div id="capital-output"></div></section><section class="cf-section"><h2>2. Compare every portfolio</h2><div id="portfolios"></div><p class="cf-note">Maximize [430 - (1-p) × loss] × LOG + 355 × PRP + 240 × PS, subject to 1050 × LOG + 880 × PRP + 620 × PS ≤ budget, with each variable binary. Schedule risk changes the objective coefficient; it does not change the project capital requirement.</p></section><section class="cf-section"><h2>3. Defend the recommendation</h2><div id="explain"></div><p>The $1,020K late-project effect is treated here as an incremental NPV-equivalent loss, excluded from the supplied $430K base NPV. For a real investment decision, discount the contract cash flows and test dependencies before subtracting them from NPV.</p><label for="recommendation">Committee note</label><textarea id="recommendation" placeholder="State the funded projects, budget use, expected value, and the assumption most likely to change your recommendation."></textarea><button id="export">Download committee note</button></section>';
    function update() {
      const v = M.portfolio(budget, p, loss);
      document.getElementById("capital-output").innerHTML = metrics([
        ["Preferred portfolio", v.best.funded.join(" + ") || "Fund none"],
        ["Risk-adjusted NPV", dollars(v.best.npv)],
        ["Unspent capital", dollars(budget - v.best.cost)],
        ["Adjusted Logistics NPV", dollars(v.logNpv)],
      ]);
      document.getElementById("portfolios").innerHTML = table(
        ["Portfolio", "Capital ($K)", "Adjusted NPV ($K)", "Status"],
        v.choices.map(
          (t) =>
            '<tr class="' +
            (t.mask === v.best.mask
              ? "cf-critical"
              : !t.feasible
                ? "cf-infeasible"
                : "") +
            '"><td>' +
            (t.funded.join(" + ") || "Fund none") +
            "</td><td>" +
            f(t.cost) +
            "</td><td>" +
            f(t.npv) +
            "</td><td>" +
            (t.mask === v.best.mask
              ? "Preferred"
              : t.feasible
                ? "Feasible"
                : "Over budget") +
            "</td></tr>",
        ),
      );
      const threshold = loss > 0 ? 1 - 190 / loss : null;
      document.getElementById("explain").innerHTML =
        "<p>At the canonical baseline (budget $2,400K, p = .862, loss $1,020K), Logistics + Properties yields $644.24K, exceeding Properties + Professional Services ($595K) by $49.24K. The risk adjustment narrows the advantage; it does not reverse the recommendation.</p><p>" +
        (threshold !== null && threshold >= 0 && threshold <= 1
          ? "With this loss amount, the two portfolios tie at p = " +
            f(threshold, 4) +
            ", provided both are feasible."
          : "With this loss amount there is no tie probability between 0 and 1 for these two portfolios.") +
        " Funding all three requires $2,550K. Unspent budget is permitted when no additional indivisible project fits.</p>";
    }
    bindSlider(
      "budget",
      (v) => {
        budget = v;
        update();
      },
      (v) => dollars(v),
    );
    bindSlider(
      "probability",
      (v) => {
        p = v;
        update();
      },
      pct,
    );
    bindSlider(
      "loss",
      (v) => {
        loss = v;
        update();
      },
      (v) => dollars(v),
    );
    document.getElementById("reset").onclick = () => {
      budget = 2400;
      p = 0.862;
      loss = 1020;
      [
        ["budget", budget],
        ["probability", p],
        ["loss", loss],
      ].forEach(([id, v]) => {
        document.getElementById(id).value = v;
        document.getElementById(id + "-value").textContent =
          id === "probability" ? pct(v) : dollars(v);
      });
      update();
    };
    document.getElementById("export").onclick = () => {
      const v = M.portfolio(budget, p, loss),
        text =
          "Cowford Holdings capital committee\nBudget ($K): " +
          budget +
          "\nOn-time probability: " +
          p +
          "\nLate-project NPV-equivalent loss ($K): " +
          loss +
          "\nPreferred portfolio: " +
          (v.best.funded.join(" + ") || "Fund none") +
          "\nAdjusted NPV ($K): " +
          v.best.npv.toFixed(2) +
          "\n\n" +
          document.getElementById("recommendation").value,
        url = URL.createObjectURL(new Blob([text], { type: "text/plain" })),
        a = document.createElement("a");
      a.href = url;
      a.download = "cowford-capital-committee.txt";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    update();
    questions([
      {
        q: "Why are the funding variables binary?",
        options: [
          "Each project is an all-or-nothing commitment",
          "The budget is uncertain",
        ],
        answer: 0,
        explanation:
          "A fractional project is not an executable choice in this model.",
      },
      {
        q: "At p = .862, which pair is preferred under the stated assumptions?",
        options: [
          "Logistics + Properties",
          "Properties + Professional Services",
        ],
        answer: 0,
        explanation:
          "$644.24K exceeds $595K. Risk reduces the margin but does not reverse the recommendation.",
      },
      {
        q: "Is leaving $470K unspent necessarily an error?",
        options: ["Yes", "No"],
        answer: 1,
        explanation:
          "No remaining indivisible project fits, and spending all the budget is not the objective.",
      },
    ]);
  }
  if (week === 9) scheduleLab();
  else if (week === 10) uncertaintyLab();
  else if (week === 11 || week === 12) regressionLab(week === 12);
  else if (week === 13) decisionLab();
  else if (week === 14) capitalLab();
})();
