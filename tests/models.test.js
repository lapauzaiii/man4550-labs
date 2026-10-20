const assert = require("node:assert/strict");
const M = require("../assets/js/models");
const close = (a, b, tol = 1e-8) =>
  assert.ok(Math.abs(a - b) < tol, `${a} != ${b}`);
const base = M.schedule(M.activities);
close(base.finish, 56 / 3);
close(base.variance, 1.5);
close(base.sd, Math.sqrt(1.5));
assert.deepEqual(base.paths, [["A", "B", "C", "G", "H", "I"]]);
close(M.probability(base, 20), 0.861848541331258);
close(base.tasks.find((t) => t.id === "D").float, 2 / 3);
const durations = Object.fromEntries(base.tasks.map((t) => [t.id, t.time]));
durations.D += 0.5;
close(M.schedule(M.activities, durations).finish, base.finish);
durations.D += 0.5;
const switched = M.schedule(M.activities, durations);
close(switched.finish, 19);
assert.deepEqual(switched.paths, [["A", "B", "D", "G", "H", "I"]]);
assert.throws(
  () =>
    M.schedule(
      M.activities.map((t) => (t.id === "A" ? { ...t, pred: ["I"] } : t)),
    ),
  /cycle/,
);
assert.throws(
  () =>
    M.schedule(M.activities.map((t) => (t.id === "A" ? { ...t, m: 99 } : t))),
  /optimistic/,
);
const tied = [
  { id: "A", name: "A", pred: [], a: 1, m: 1, b: 1 },
  { id: "B", name: "B", pred: [], a: 1, m: 1, b: 1 },
  { id: "C", name: "C", pred: ["A", "B"], a: 1, m: 1, b: 1 },
];
assert.equal(M.schedule(tied).paths.length, 2);
const sim = M.simulate(M.activities, 1000, 4550);
assert.deepEqual(sim, M.simulate(M.activities, 1000, 4550));
assert.ok(sim.samples.every((t) => t >= 12 && t <= 28));
const d = M.decision([0.3, 0.45, 0.25]);
assert.deepEqual(d.emv, [354.5, 361.5, 178.5]);
close(d.evpi, 192);
assert.equal(d.best, 1);
assert.throws(() => M.decision([0.3, 0.5, 0.3]), /sum/);
const p = M.portfolio();
assert.equal(p.best.mask, 3);
close(p.logNpv, 289.24);
close(p.best.npv, 644.24);
close(2400 - p.best.cost, 470);
assert.equal(M.portfolio(2400, 0.8).best.mask, 6);
assert.equal(M.portfolio(2550).best.mask, 7);
assert.equal(M.portfolio(0).best.mask, 0);
const rows = Array.from({ length: 12 }, (_, i) => [
  i,
  i % 3,
  10 + 2 * i - 3 * (i % 3) + (i % 2 ? 0.1 : -0.1),
]);
const fit = M.regress(rows, [0, 1]);
close(fit.coef[1], 2, 0.05);
close(fit.coef[2], -3, 0.05);
const prediction = M.forecast(fit, [5, 1]);
assert.ok(prediction.lo < prediction.value && prediction.value < prediction.hi);
assert.throws(
  () =>
    M.regress(
      [
        [1, 3],
        [1, 4],
        [1, 5],
      ],
      [0],
    ),
  /constant|correlated/,
);
const lessonHtml = require("node:fs").readFileSync(
  require("node:path").join(__dirname, "../week11/lesson/index.html"),
  "utf8",
);
const arr = (name) =>
  JSON.parse(lessonHtml.match(new RegExp("var " + name + " = (\\[[^\\]]+\\])"))[1]);
const lx = arr("X"),
  ly = arr("Y");
assert.equal(lx.length, 20);
assert.equal(Math.min(...lx), 0.8);
assert.equal(Math.max(...lx), 3);
const lessonFit = M.regress(
  lx.map((x, i) => [x, ly[i]]),
  [0],
);
close(lessonFit.coef[0], 8.4, 1e-9);
close(lessonFit.coef[1], 22.5, 1e-9);
assert.equal(lessonFit.R2.toFixed(2), "0.78");
console.log(
  "Verified PERT, path switching, invalid networks, reproducible simulation, EMV/EVPI, portfolios, regression, prediction intervals and the Week 11 lesson sample.",
);
