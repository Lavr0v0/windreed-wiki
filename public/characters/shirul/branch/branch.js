(() => {
  const model = document.querySelector("#branch-model");
  const status = document.querySelector("#viewer-status");
  const modelProgress = document.querySelector("#model-progress-bar");
  const pageProgress = document.querySelector("#page-progress-bar");
  const rotationButton = document.querySelector("#rotation-toggle");
  const rotationLabel = rotationButton?.querySelector("span:last-child");
  const presetButtons = Array.from(document.querySelectorAll("[data-view]"));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const views = {
    full: { target: "0m 0.295m 0m", orbit: "18deg 78deg 112%" },
    blade: { target: "0m 0.34m 0m", orbit: "10deg 82deg 42%" },
    hilt: { target: "0m -0.08m 0m", orbit: "22deg 82deg 35%" },
  };

  let readyTimer = 0;

  function markModelReady() {
    window.clearTimeout(readyTimer);
    modelProgress.style.transform = "scaleX(1)";
    status.textContent = "三维模型已就绪";
    window.setTimeout(() => status.classList.add("is-quiet"), 2200);
  }

  function updatePageProgress() {
    const root = document.documentElement;
    const available = Math.max(1, root.scrollHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, window.scrollY / available));
    pageProgress.style.transform = `scaleX(${progress})`;
  }

  function setRotation(paused) {
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
      const view = views[button.dataset.view];
      if (!view) return;

      model.setAttribute("camera-target", view.target);
      model.setAttribute("camera-orbit", view.orbit);
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
    status.textContent = "当前显示静态展示图";
  });

  if (reducedMotion) setRotation(true);
  window.addEventListener("scroll", updatePageProgress, { passive: true });
  window.addEventListener("resize", updatePageProgress, { passive: true });
  updatePageProgress();
})();
