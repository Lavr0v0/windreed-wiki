(() => {
  const model = document.querySelector("#branch-model");
  const poster = document.querySelector("#model-poster");
  const loadButton = document.querySelector("#model-load-action");
  const toolbar = document.querySelector(".viewer-toolbar");
  const adjustments = document.querySelector("#viewer-adjustments");
  const status = document.querySelector("#viewer-status");
  const modelProgress = document.querySelector("#model-progress-bar");
  const pageProgress = document.querySelector("#page-progress-bar");
  const rotationButton = document.querySelector("#rotation-toggle");
  const rotationLabel = rotationButton?.querySelector("span:last-child");
  const heightSlider = document.querySelector("#view-height");
  const heightOutput = document.querySelector("#view-height-output");
  const zoomSlider = document.querySelector("#view-zoom");
  const zoomOutput = document.querySelector("#view-zoom-output");
  const presetButtons = Array.from(document.querySelectorAll("[data-view]"));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const views = {
    full: { target: 0.295, theta: 18, phi: 78, radius: 112 },
    blade: { target: 0.14, theta: 2, phi: 82, radius: 14 },
    hilt: { target: -0.08, theta: 22, phi: 82, radius: 32 },
  };

  const activeCamera = { ...views.full };

  let modelReady = false;
  let moduleReady = false;
  let readyTimer = 0;

  function formatHeight(value) {
    const centimeters = Math.round(value * 1000) / 10;
    const rounded = Number.isInteger(centimeters) ? centimeters.toFixed(0) : centimeters.toFixed(1);
    return `${centimeters > 0 ? "+" : ""}${rounded} cm`;
  }

  function syncCameraControls() {
    heightSlider.value = String(activeCamera.target * 100);
    heightOutput.textContent = formatHeight(activeCamera.target);
    zoomSlider.value = String(activeCamera.radius);
    zoomOutput.textContent = `${Math.round(activeCamera.radius)}%`;
  }

  function applyCameraView() {
    model.setAttribute("camera-target", `0m ${activeCamera.target.toFixed(3)}m 0m`);
    model.setAttribute("camera-orbit", `${activeCamera.theta}deg ${activeCamera.phi}deg ${activeCamera.radius}%`);
  }

  function clearPresetSelection() {
    presetButtons.forEach((button) => {
      button.classList.remove("is-active");
      button.setAttribute("aria-pressed", "false");
    });
  }

  function markModelReady() {
    window.clearTimeout(readyTimer);
    modelReady = true;
    modelProgress.style.transform = "scaleX(1)";
    model.classList.add("is-active");
    poster.classList.add("is-hidden");
    loadButton.classList.add("is-hidden");
    toolbar.classList.remove("is-disabled");
    toolbar.removeAttribute("aria-hidden");
    adjustments.classList.remove("is-disabled");
    adjustments.removeAttribute("aria-hidden");
    heightSlider.disabled = false;
    zoomSlider.disabled = false;
    syncCameraControls();
    status.textContent = "三维模型已就绪";
    window.setTimeout(() => status.classList.add("is-quiet"), 2200);
    if (reducedMotion) setRotation(true);
  }

  async function loadModel() {
    if (modelReady || loadButton.disabled) return;
    loadButton.disabled = true;
    loadButton.querySelector("span").textContent = "正在载入查看器";
    status.classList.remove("is-quiet");
    status.textContent = "正在载入三维查看器…";

    try {
      if (!moduleReady) {
        await import("./vendor/model-viewer.min.js");
        await customElements.whenDefined("model-viewer");
        moduleReady = true;
      }
      status.textContent = "正在载入三维模型…";
      model.removeAttribute("src");
      window.requestAnimationFrame(() => model.setAttribute("src", model.dataset.src));
    } catch {
      status.textContent = "三维模型暂时无法载入，仍可查看静态展示图";
      loadButton.disabled = false;
      loadButton.querySelector("span").textContent = "重新加载三维模型";
    }
  }

  function updatePageProgress() {
    const root = document.documentElement;
    const available = Math.max(1, root.scrollHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, window.scrollY / available));
    pageProgress.style.transform = `scaleX(${progress})`;
  }

  function setRotation(paused) {
    if (!modelReady) return;
    rotationButton.setAttribute("aria-pressed", String(paused));
    if (paused) {
      model.removeAttribute("auto-rotate");
      rotationLabel.textContent = "继续转动";
    } else {
      model.setAttribute("auto-rotate", "");
      rotationLabel.textContent = "暂停转动";
    }
  }

  presetButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (!modelReady) return;
      const view = views[button.dataset.view];
      if (!view) return;

      Object.assign(activeCamera, view);
      applyCameraView();
      syncCameraControls();
      // A preset is an inspection view: hold its intentional angle until the
      // visitor chooses to rotate again, so fine etching is not carried into a
      // grazing-angle reflection while they are trying to read it.
      setRotation(true);
      presetButtons.forEach((candidate) => {
        const active = candidate === button;
        candidate.classList.toggle("is-active", active);
        candidate.setAttribute("aria-pressed", String(active));
      });
    });
  });

  rotationButton?.addEventListener("click", () => {
    setRotation(rotationButton.getAttribute("aria-pressed") !== "true");
  });

  heightSlider?.addEventListener("input", () => {
    if (!modelReady) return;
    activeCamera.target = Number(heightSlider.value) / 100;
    model.setAttribute("camera-target", `0m ${activeCamera.target.toFixed(3)}m 0m`);
    heightOutput.textContent = formatHeight(activeCamera.target);
    clearPresetSelection();
  });

  zoomSlider?.addEventListener("input", () => {
    if (!modelReady) return;
    activeCamera.radius = Number(zoomSlider.value);
    const orbit = typeof model.getCameraOrbit === "function" ? model.getCameraOrbit() : null;
    const theta = Number.isFinite(orbit?.theta) ? `${orbit.theta}rad` : `${activeCamera.theta}deg`;
    const phi = Number.isFinite(orbit?.phi) ? `${orbit.phi}rad` : `${activeCamera.phi}deg`;
    model.setAttribute("camera-orbit", `${theta} ${phi} ${activeCamera.radius}%`);
    zoomOutput.textContent = `${Math.round(activeCamera.radius)}%`;
    clearPresetSelection();
  });

  model?.addEventListener("progress", (event) => {
    const progress = Math.min(1, Math.max(0, event.detail.totalProgress || 0));
    modelProgress.style.transform = `scaleX(${progress})`;
    if (progress < 1) {
      status.textContent = `模型载入 ${Math.round(progress * 100)}%`;
    } else {
      status.textContent = "正在生成材质…";
      window.clearTimeout(readyTimer);
      readyTimer = window.setTimeout(markModelReady, 500);
    }
  });

  model?.addEventListener("load", markModelReady);
  model?.addEventListener("error", () => {
    modelReady = false;
    model.classList.remove("is-active");
    poster.classList.remove("is-hidden");
    loadButton.classList.remove("is-hidden");
    loadButton.disabled = false;
    loadButton.querySelector("span").textContent = "重新加载三维模型";
    toolbar.classList.add("is-disabled");
    toolbar.setAttribute("aria-hidden", "true");
    adjustments.classList.add("is-disabled");
    adjustments.setAttribute("aria-hidden", "true");
    heightSlider.disabled = true;
    zoomSlider.disabled = true;
    status.textContent = "当前显示静态展示图，三维模型可稍后重试";
  });

  loadButton?.addEventListener("click", loadModel);
  window.addEventListener("scroll", updatePageProgress, { passive: true });
  window.addEventListener("resize", updatePageProgress, { passive: true });
  updatePageProgress();

  if (reducedMotion) rotationButton.setAttribute("aria-pressed", "true");
})();
