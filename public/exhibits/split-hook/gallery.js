const studio = document.querySelector(".studio");
const model = document.querySelector("#object");
const choices = [...document.querySelectorAll("[data-view]")];
const spin = document.querySelector("#spin");
const reset = document.querySelector("#reset");
const retry = document.querySelector(".retry");
const views = {
  whole: { target: "0.151m 0.036m 0.003m", angles: "28deg 62deg", distance: 0.70 },
  cuff: { target: "0.001m 0.062m 0.006m", angles: "46deg 67deg", distance: 0.47 },
  perch: { target: "0.120m 0.021m 0.003m", angles: "18deg 64deg", distance: 0.34 },
  hook: { target: "0.314m 0m 0m", angles: "33deg 45deg", distance: 0.31 },
};

function widthAllowance() {
  const aspect = model.clientWidth / Math.max(model.clientHeight, 1);
  return Math.max(1, 1.55 / Math.max(aspect, 1));
}

let allowance = widthAllowance();
function fittedOrbit(view) {
  return `${view.angles} ${view.distance * allowance}m`;
}

function setSpin(on) {
  model.toggleAttribute("auto-rotate", on);
  spin.setAttribute("aria-pressed", String(on));
  document.querySelector("#spin-label").textContent = on ? "暂停旋转" : "自动旋转";
}

function showView(name) {
  const view = views[name];
  if (!view) return;
  setSpin(false);
  model.resetTurntableRotation(0);
  model.cameraTarget = view.target;
  model.cameraOrbit = fittedOrbit(view);
  model.fieldOfView = "27deg";
  for (const choice of choices) {
    choice.setAttribute("aria-pressed", String(choice.dataset.view === name));
  }
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) model.jumpCameraToGoal();
}

for (const choice of choices) {
  choice.addEventListener("click", () => showView(choice.dataset.view));
}
spin.addEventListener("click", () => setSpin(!model.hasAttribute("auto-rotate")));
reset.addEventListener("click", () => showView("whole"));
retry.addEventListener("click", () => location.reload());

function toggleControls(enabled) {
  for (const control of [...choices, spin, reset]) control.disabled = !enabled;
}
function showFallback() {
  studio.dataset.state = "error";
  setSpin(false);
  toggleControls(false);
  document.querySelector(".load-note").textContent = "三维视图暂时无法打开";
  retry.hidden = false;
}
model.addEventListener("error", showFallback);
model.addEventListener("load", () => {
  studio.dataset.state = "ready";
  retry.hidden = true;
  toggleControls(true);
});
try {
  await import("/characters/shirul/branch-openwork/vendor/model-viewer.min.js");
  await customElements.whenDefined("model-viewer");
  model.cameraOrbit = fittedOrbit(views.whole);
  new ResizeObserver(() => {
    const next = widthAllowance();
    if (Math.abs(next - allowance) < 0.005) return;
    const ratio = next / allowance;
    allowance = next;
    if (model.loaded) {
      const orbit = model.getCameraOrbit();
      model.cameraOrbit = `${orbit.theta}rad ${orbit.phi}rad ${orbit.radius * ratio}m`;
    } else {
      model.cameraOrbit = fittedOrbit(views.whole);
    }
  }).observe(model);
  model.src = model.dataset.source;
} catch {
  showFallback();
}
