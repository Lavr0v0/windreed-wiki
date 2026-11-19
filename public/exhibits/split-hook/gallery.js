const studio = document.querySelector("#studio");
const model = document.querySelector("#object");
const still = document.querySelector("#still");
const portrait = matchMedia("(max-aspect-ratio: 4/5)");

const full = {
  wide: { target: "0.09594m 0.13142m -0.07808m", angles: "-14deg 70deg", width: 2.32, height: 1.61, depth: 0.04 },
  tall: { target: "0.05616m 0.07691m -0.05821m", angles: "54deg 46deg", width: 1.26, height: 2.72, depth: 0.045 },
  posters: ["study.webp", "portrait.webp"]
};
const elbow = {
  wide: { target: "-0.00871m 0.06918m 0.00811m", angles: "2deg 79deg", width: 1.16, height: 0.82, depth: 0.01 },
  tall: { target: "0.00813m 0.07271m -0.00518m", angles: "37deg 59deg", width: 0.88, height: 1.12, depth: 0.025 },
  posters: ["elbow.webp", "elbow-portrait.webp"]
};
let view;
let handled = false;

function frameModel() {
  if (handled || !model.loaded || !model.clientHeight) return;
  const aspect = model.clientWidth / model.clientHeight;
  const pose = portrait.matches ? view.tall : view.wide;
  // The viewer widens its vertical field of view on narrow screens.
  const heightScale = Math.max(1, model.getIdealAspect() / aspect);
  const distance = pose.depth + Math.max(pose.width / aspect, pose.height) / heightScale;
  model.cameraTarget = pose.target;
  model.cameraOrbit = pose.angles + " " + distance + "m";
  model.jumpCameraToGoal();
}

function selectView() {
  view = location.hash === "#elbow" ? elbow : full;
  handled = false;
  still.querySelector("source").srcset = "./" + view.posters[1] + "?v=8";
  still.querySelector("img").src = "./" + view.posters[0] + "?v=8";
  frameModel();
}

selectView();
window.addEventListener("hashchange", selectView);
model.addEventListener("camera-change", (event) => {
  if (event.detail.source === "user-interaction") handled = true;
});
model.addEventListener("load", () => {
  frameModel();
  studio.setAttribute("data-ready", "");
  still.setAttribute("aria-hidden", "true");
});
model.addEventListener("error", () => {
  studio.removeAttribute("data-ready");
  still.removeAttribute("aria-hidden");
});
try {
  await import("/characters/shirul/branch-openwork/vendor/model-viewer.min.js");
  await customElements.whenDefined("model-viewer");
  new ResizeObserver(frameModel).observe(model);
  model.src = "./split-hook.glb?v=8";
} catch {
  studio.removeAttribute("data-ready");
}
