(function () {
  "use strict";
  const labs = [
    ["week5", "Sensitivity"],
    ["week6", "Integer programming"],
    ["week7", "Midterm practice"],
    ["week8", "Networks"],
    ["week9", "Project scheduling"],
    ["week10", "Schedule risk"],
    ["week11", "Simple regression"],
    ["week12", "Multiple regression"],
    ["week13", "Decision analysis"],
    ["week14", "Capital allocation"],
  ];
  const script = document.currentScript;
  const base = new URL("../../", script.src);
  const current = labs.findIndex(
    ([path]) =>
      location.pathname.includes("/" + path + "/") ||
      (path === "week7" && location.pathname.includes("/midterm-prep/")),
  );
  const nav = document.createElement("nav");
  nav.className = "cf-nav";
  nav.setAttribute("aria-label", "Course labs");
  nav.innerHTML =
    '<a class="cf-wordmark" href="' +
    base.href +
    '"><img src="' +
    new URL("assets/img/cowford-mark.svg", base) +
    '" alt="">COWFORD HOLDINGS <span class="cf-muted">/ MAN4550</span></a><a href="' +
    base.href +
    '">All labs</a><label for="cf-week">Week</label><select id="cf-week"><option value="">Select a lab</option>' +
    labs
      .map(
        ([p, n], i) =>
          '<option value="' +
          new URL(p + "/", base) +
          '" ' +
          (current === i ? "selected" : "") +
          ">W" +
          p.slice(4) +
          " - " +
          n +
          "</option>",
      )
      .join("") +
    "</select>";
  document.body.prepend(nav);
  nav.querySelector("select").addEventListener("change", (e) => {
    if (e.target.value) location.assign(e.target.value);
  });
  const footer = document.createElement("footer");
  footer.className = "cf-footer";
  footer.innerHTML =
    (current > 0
      ? '<a href="' +
        new URL(labs[current - 1][0] + "/", base) +
        '">Previous week</a>'
      : '<a href="' + base + '">All labs</a>') +
    (current >= 0 && current < labs.length - 1
      ? '<a href="' +
        new URL(labs[current + 1][0] + "/", base) +
        '">Next week</a>'
      : "");
  (
    document.querySelector("main") ||
    document.querySelector(".wrap") ||
    document.querySelector(".lab") ||
    document.body
  ).append(footer);
})();
