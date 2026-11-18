const studio = document.querySelector("#studio");
const model = document.querySelector("#object");
const portrait = matchMedia("(max-aspect-ratio: 4/5)");
let handled = false;

function frameModel() {
  if (handled) return;
  const aspect = model.clientWidth / Math.max(model.clientHeight, 1);
  if (portrait.matches) {
    model.cameraTarget = "0.154m 0.036m 0.003m";
    model.cameraOrbit = "62deg 46deg 1.10m";
  } else {
    const distance = 1.17 * Math.max(1, 1.55 / Math.max(aspect, 1));
    model.cameraTarget = "0.154m 0.036m 0.003m";
    model.cameraOrbit = `29deg 62deg ${distance}m`;
  }
}
model.addEventListener("camera-change", (event) => {
  if (event.detail.source === "user-interaction") handled = true;
});
model.addEventListener("load", () => {
  studio.setAttribute("data-ready", "");
  document.querySelector("#still").setAttribute("aria-hidden", "true");
});
model.addEventListener("error", () => {
  studio.removeAttribute("data-ready");
  document.querySelector("#still").removeAttribute("aria-hidden");
});
try {
  await import("/characters/shirul/branch-openwork/vendor/model-viewer.min.js");
  await customElements.whenDefined("model-viewer");
  frameModel();
  new ResizeObserver(frameModel).observe(model);
  model.src = "./split-hook.glb?v=2";
} catch {
  studio.removeAttribute("data-ready");
}
