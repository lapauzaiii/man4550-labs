(function (root, factory) {
  const api = factory(
    typeof module === "object"
      ? require("../vendor/jstat.min.js").jStat
      : root.jStat,
  );
  if (typeof module === "object") module.exports = api;
  else root.CowfordModels = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (jStat) {
  "use strict";
  const activities = [
    {
      id: "A",
      name: "Permitting and site preparation",
      pred: [],
      a: 2,
      m: 3,
      b: 4,
    },
    {
      id: "B",
      name: "Structural engineering review",
      pred: ["A"],
      a: 1,
      m: 2,
      b: 3,
    },
    {
      id: "E",
      name: "Interior materials procurement",
      pred: ["A"],
      a: 2,
      m: 3,
      b: 5,
    },
    { id: "C", name: "Structural renovation", pred: ["B"], a: 3, m: 5, b: 7 },
    {
      id: "D",
      name: "Electrical and utility rough-in",
      pred: ["B"],
      a: 4,
      m: 4,
      b: 6,
    },
    { id: "F", name: "Interior fit-out", pred: ["C", "E"], a: 1, m: 2, b: 4 },
    { id: "G", name: "HVAC installation", pred: ["C", "D"], a: 3, m: 4, b: 8 },
    { id: "H", name: "Final inspections", pred: ["F", "G"], a: 2, m: 3, b: 4 },
    { id: "I", name: "Tenant handover", pred: ["H"], a: 1, m: 1, b: 2 },
  ];
  function schedule(input, durations) {
    const pending = input.map((t) => ({ ...t, pred: [...t.pred] }));
    const ordered = [],
      byId = {};
    if (new Set(input.map((t) => t.id)).size !== input.length)
      throw Error("Activity IDs must be unique.");
    for (const t of input) {
      if (
        ![t.a, t.m, t.b].every(Number.isFinite) ||
        t.a < 0 ||
        t.a > t.m ||
        t.m > t.b
      )
        throw Error("Use 0 <= optimistic <= most likely <= pessimistic.");
      if (t.pred.some((p) => !input.some((x) => x.id === p)))
        throw Error("A predecessor ID is missing from the activity table.");
    }
    while (pending.length) {
      const i = pending.findIndex((t) => t.pred.every((p) => byId[p]));
      if (i < 0) throw Error("The predecessor network contains a cycle.");
      const t = pending.splice(i, 1)[0];
      t.time = durations ? durations[t.id] : (t.a + 4 * t.m + t.b) / 6;
      if (!Number.isFinite(t.time) || t.time < 0)
        throw Error("Activity durations must be nonnegative.");
      t.variance = ((t.b - t.a) / 6) ** 2;
      t.es = Math.max(0, ...t.pred.map((p) => byId[p].ef));
      t.ef = t.es + t.time;
      byId[t.id] = t;
      ordered.push(t);
    }
    const finish = Math.max(...ordered.map((t) => t.ef));
    [...ordered].reverse().forEach((t) => {
      const succ = ordered.filter((s) => s.pred.includes(t.id));
      t.lf = succ.length ? Math.min(...succ.map((s) => s.ls)) : finish;
      t.ls = t.lf - t.time;
      t.float = Math.max(0, t.ls - t.es);
      t.critical = t.float < 1e-7;
    });
    // Trace every tied longest path; do not sum the union of critical activities.
    const paths = [];
    function trace(t, path) {
      const next = [t.id, ...path];
      const pred = t.pred
        .map((p) => byId[p])
        .filter((p) => Math.abs(p.ef - t.es) < 1e-7);
      if (!pred.length) paths.push(next);
      else pred.forEach((p) => trace(p, next));
    }
    ordered
      .filter(
        (t) =>
          !ordered.some((s) => s.pred.includes(t.id)) &&
          Math.abs(t.ef - finish) < 1e-7,
      )
      .forEach((t) => trace(t, []));
    const variance = paths[0].reduce((s, id) => s + byId[id].variance, 0);
    return { tasks: ordered, finish, paths, variance, sd: Math.sqrt(variance) };
  }
  function probability(s, deadline) {
    return s.sd === 0
      ? Number(deadline >= s.finish)
      : jStat.normal.cdf(deadline, s.finish, s.sd);
  }
  function rng(seed) {
    let v = seed >>> 0;
    return () => {
      v = (1664525 * v + 1013904223) >>> 0;
      return (v + 0.5) / 4294967296;
    };
  }
  function simulate(input, count, seed = 4550) {
    schedule(input);
    const random = rng(seed),
      samples = [],
      criticalCounts = {};
    jStat.setRandom(random);
    try {
      for (let i = 0; i < count; i++) {
        const d = {};
        input.forEach((t) => {
          const range = t.b - t.a;
          d[t.id] =
            range === 0
              ? t.a
              : t.a +
                range *
                  jStat.beta.sample(
                    1 + (4 * (t.m - t.a)) / range,
                    1 + (4 * (t.b - t.m)) / range,
                  );
        });
        const s = schedule(input, d);
        samples.push(s.finish);
        s.tasks
          .filter((t) => t.critical)
          .forEach(
            (t) => (criticalCounts[t.id] = (criticalCounts[t.id] || 0) + 1),
          );
      }
    } finally {
      jStat.setRandom(Math.random);
    }
    samples.sort((a, b) => a - b);
    return {
      samples,
      criticalCounts,
      mean: jStat.mean(samples),
      p50: jStat.percentile(samples, 0.5),
      p90: jStat.percentile(samples, 0.9),
    };
  }
  function regress(rows, selected) {
    if (rows.length <= selected.length + 1)
      throw Error("Add more observations than fitted coefficients.");
    if (rows.some((r) => !r.every(Number.isFinite)))
      throw Error("Every data cell must contain a number.");
    const X = rows.map((r) => [1, ...selected.map((i) => r[i])]),
      y = rows.map((r) => r.at(-1));
    const qr = jStat.QR(X)[1];
    if (
      X[0].some(
        (_, i) =>
          !Number.isFinite(qr[i][i]) ||
          Math.abs(qr[i][i]) <
            1e-10 * Math.sqrt(X.reduce((s, r) => s + r[i] ** 2, 0)),
      )
    )
      throw Error(
        "Predictors are constant or perfectly correlated. Change the data or exclude a predictor.",
      );
    if (jStat.variance(y, true) < 1e-12)
      throw Error("The outcome must vary across observations.");
    // QR least squares is provided by jStat; reject rank-deficient predictor sets.
    const m = jStat.models.ols(y, X);
    if (!m.coef.every(Number.isFinite) || !m.t.se.every(Number.isFinite))
      throw Error(
        "Predictors are constant or perfectly correlated. Change the data or exclude a predictor.",
      );
    const vif = selected.map((col, k) => {
      const others = selected.filter((_, i) => i !== k);
      if (!others.length) return 1;
      const sub = jStat.models.ols(
        rows.map((r) => r[col]),
        rows.map((r) => [1, ...others.map((i) => r[i])]),
      );
      return 1 / (1 - sub.R2);
    });
    return { ...m, selected, vif };
  }
  function forecast(model, values) {
    const x = [1, ...model.selected.map((i) => values[i])];
    const value = x.reduce((s, v, i) => s + v * model.coef[i], 0);
    const xt = jStat.transpose(model.exog),
      inv = jStat.inv(jStat.multiply(xt, model.exog));
    const leverage = x.reduce(
      (s, a, i) => s + a * x.reduce((q, b, j) => q + inv[i][j] * b, 0),
      0,
    );
    const half =
      jStat.studentt.inv(0.975, model.df_resid) *
      Math.sqrt((model.SSR / model.df_resid) * (1 + leverage));
    return { value, lo: value - half, hi: value + half };
  }
  const payoffs = [
    [1180, 340, -610],
    [740, 410, -180],
    [260, 190, 60],
  ];
  function decision(p, table = payoffs) {
    if (
      p.some((x) => !Number.isFinite(x) || x < 0) ||
      Math.abs(p.reduce((a, b) => a + b, 0) - 1) > 1e-8
    )
      throw Error("Probabilities must be nonnegative and sum to one.");
    const emv = table.map((row) => row.reduce((s, v, i) => s + v * p[i], 0));
    const bestByState = p.map((_, i) => Math.max(...table.map((r) => r[i])));
    const evwpi = bestByState.reduce((s, v, i) => s + v * p[i], 0),
      evpi = evwpi - Math.max(...emv);
    const regret = table.map((row) => row.map((v, i) => bestByState[i] - v));
    return { emv, evwpi, evpi, regret, best: emv.indexOf(Math.max(...emv)) };
  }
  const projects = [
    { name: "Logistics", cost: 1050, npv: 430 },
    { name: "Properties", cost: 880, npv: 355 },
    { name: "Professional Services", cost: 620, npv: 240 },
  ];
  function portfolio(budget = 2400, p = 0.862, loss = 1020) {
    const choices = [];
    for (let mask = 0; mask < 8; mask++) {
      const funded = projects.filter((_, i) => mask & (1 << i));
      const cost = funded.reduce((s, t) => s + t.cost, 0);
      const npv =
        funded.reduce((s, t) => s + t.npv, 0) - (mask & 1 ? (1 - p) * loss : 0);
      choices.push({
        mask,
        funded: funded.map((t) => t.name),
        cost,
        npv,
        feasible: cost <= budget,
      });
    }
    const best = choices
      .filter((t) => t.feasible)
      .sort((a, b) => b.npv - a.npv || a.cost - b.cost)[0];
    return { choices, best, logNpv: 430 - (1 - p) * loss };
  }
  return {
    activities,
    schedule,
    probability,
    simulate,
    regress,
    forecast,
    decision,
    payoffs,
    projects,
    portfolio,
  };
});
