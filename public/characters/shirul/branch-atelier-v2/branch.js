(() => {
  const model = document.querySelector('#branch-model');
  const poster = document.querySelector('#model-poster');
  const loadButton = document.querySelector('#model-load-action');
  const status = document.querySelector('#viewer-status');
  const panel = document.querySelector('#viewer-panel');
  const toolbar = document.querySelector('.viewer-toolbar');
  const adjustments = document.querySelector('#viewer-adjustments');
  const rotationButton = document.querySelector('#rotation-toggle');
  const progress = document.querySelector('#model-progress-bar');
  const presets = [...document.querySelectorAll('[data-view]')];
  const sliders = Object.fromEntries(['orbit', 'height', 'zoom'].map(key => [key, document.querySelector(`#view-${key}`)]));
  const outputs = Object.fromEntries(['orbit', 'height', 'zoom'].map(key => [key, document.querySelector(`#view-${key}-output`)]));
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const environmentSource = model.getAttribute('environment-image');
  const views = {
    full: { target: 0.295, theta: -14, phi: 82, radius: 108 },
    blade: { target: 0.52, theta: 6, phi: 84, radius: 30 },
    opening: { target: 0.145, theta: 18, phi: 82, radius: 17 },
    hilt: { target: -0.02, theta: 18, phi: 80, radius: 27 },
    grip: { target: -0.16, theta: 22, phi: 82, radius: 22 },
    pommel: { target: -0.295, theta: 20, phi: 80, radius: 11 },
    tip: { target: 0.877, theta: 4, phi: 86, radius: 13 },
  };
  let ready = false;
  let loading = false;
  let loadedModule = false;
  let moduleAttempts = 0;
  let assetAttempts = 0;
  let timeout;
  let pendingView = null;
  let fullDistance = 3.17;
  let draggingSlider = null;

  const radians = degrees => degrees * Math.PI / 180;
  const degrees = angle => angle * 180 / Math.PI;
  const normalizeAngle = angle => ((angle + 180) % 360 + 360) % 360 - 180;

  function setControlsEnabled(enabled) {
    for (const group of [toolbar, adjustments]) {
      group.inert = !enabled;
      group.classList.toggle('is-disabled', !enabled);
      group.querySelectorAll('button, input').forEach(control => { control.disabled = !enabled; });
    }
  }

  function setRotation(rotating) {
    model.autoRotate = rotating && ready;
    rotationButton.setAttribute('aria-pressed', String(rotating && ready));
    rotationButton.querySelector('span:last-child').textContent = rotating && ready ? '暂停转动' : '自动转动';
  }

  function clearPreset() {
    for (const button of presets) {
      button.classList.remove('is-active');
      button.setAttribute('aria-pressed', 'false');
    }
  }

  function readCamera() {
    return { orbit: model.getCameraOrbit(), target: model.getCameraTarget() };
  }

  function syncControls() {
    if (!ready) return;
    const { orbit, target } = readCamera();
    const angle = normalizeAngle(degrees(orbit.theta));
    const zoom = fullDistance / orbit.radius;
    if (draggingSlider !== 'orbit') sliders.orbit.value = String(angle);
    if (draggingSlider !== 'height') {
      // A user can pan beyond the sword: keep the range truthful and reversible.
      sliders.height.min = String(Math.min(-34, Math.floor(target.y * 100)));
      sliders.height.max = String(Math.max(94, Math.ceil(target.y * 100)));
      sliders.height.value = String(target.y * 100);
    }
    if (draggingSlider !== 'zoom') {
      sliders.zoom.max = String(Math.max(15, Math.ceil(zoom * 100) / 100));
      sliders.zoom.value = String(zoom);
    }
    outputs.orbit.textContent = `${Math.round(angle)}°`;
    outputs.height.textContent = `${(target.y * 100).toFixed(1)} cm`;
    outputs.zoom.textContent = `${zoom.toFixed(1)}×`;
    sliders.orbit.setAttribute('aria-valuetext', outputs.orbit.textContent);
    sliders.height.setAttribute('aria-valuetext', outputs.height.textContent);
    sliders.zoom.setAttribute('aria-valuetext', outputs.zoom.textContent);
  }

  function selectView(name) {
    if (!ready || !views[name]) return;
    const view = views[name];
    setRotation(false);
    // Reset the turntable so a preset has the same orientation after auto-rotation.
    model.resetTurntableRotation(0);
    model.cameraTarget = `0m ${view.target}m 0m`;
    model.cameraOrbit = `${view.theta}deg ${view.phi}deg ${fullDistance * view.radius / views.full.radius}m`;
    if (motionPreference.matches) model.jumpCameraToGoal();
    presets.forEach(button => {
      const active = button.dataset.view === name;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function showFallback(message) {
    window.clearTimeout(timeout);
    ready = false;
    loading = false;
    model.dataset.state = 'error';
    panel.setAttribute('aria-busy', 'false');
    setRotation(false);
    setControlsEnabled(false);
    model.classList.remove('is-active');
    poster.classList.remove('is-hidden');
    loadButton.classList.remove('is-hidden');
    loadButton.disabled = false;
    loadButton.querySelector('span').textContent = '重新加载三维展示';
    status.textContent = message;
  }

  async function loadModel() {
    if (ready || loading) return;
    loading = true;
    model.dataset.state = 'loading';
    panel.setAttribute('aria-busy', 'true');
    loadButton.disabled = true;
    loadButton.querySelector('span').textContent = '正在加载三维展示';
    status.textContent = '正在载入查看器…';
    progress.style.transform = 'scaleX(0)';
    // A stalled request stays on the poster and can be retried. This never marks
    // a model ready: only the actual model-viewer load event does that.
    timeout = window.setTimeout(() => showFallback('载入时间较长，当前保留静态图，可重试'), 45000);
    try {
      if (!loadedModule) {
        if (!customElements.get('model-viewer')) {
          const retry = moduleAttempts++;
          await import(`../branch-openwork/vendor/model-viewer.min.js${retry ? `?retry=${retry}` : ''}`);
        }
        await customElements.whenDefined('model-viewer');
        loadedModule = true;
      }
      if (!loading) return;
      status.textContent = '正在载入剑与材质…';
      model.removeAttribute('src');
      model.cameraTarget = `0m ${views.full.target}m 0m`;
      model.cameraOrbit = `${views.full.theta}deg ${views.full.phi}deg ${views.full.radius}%`;
      model.resetTurntableRotation(0);
      await model.updateComplete;
      // model-viewer retains a rejected asset URL in its loader cache. Give a
      // user-requested retry a fresh URL so a recovered connection really retries.
      const attempt = assetAttempts++;
      const asset = new URL(model.dataset.src, document.baseURI);
      if (attempt) {
        asset.searchParams.set('retry', String(attempt));
        const environment = new URL(environmentSource, document.baseURI);
        // This bundled viewer identifies HDR files from the end of the URL.
        environment.searchParams.set('retry', `${attempt}.hdr`);
        model.environmentImage = environment.href;
      }
      model.src = asset.href;
    } catch {
      showFallback('三维展示暂时无法载入，仍可查看静态图');
    }
  }

  model.addEventListener('load', () => {
    if (!loading) return;
    window.clearTimeout(timeout);
    ready = true;
    loading = false;
    model.dataset.state = 'ready';
    panel.setAttribute('aria-busy', 'false');
    model.jumpCameraToGoal();
    const distance = model.getCameraOrbit().radius;
    if (distance > 0) fullDistance = distance;
    model.classList.add('is-active');
    poster.classList.add('is-hidden');
    loadButton.classList.add('is-hidden');
    loadButton.disabled = false;
    setControlsEnabled(true);
    setRotation(false);
    syncControls();
    status.textContent = '三维展示已就绪';
    if (pendingView) {
      selectView(pendingView);
      pendingView = null;
    }
  });

  model.addEventListener('progress', event => {
    if (!loading) return;
    const amount = Math.max(0, Math.min(1, event.detail.totalProgress || 0));
    progress.style.transform = `scaleX(${amount})`;
    status.textContent = amount < 1 ? `正在载入 ${Math.round(amount * 100)}%` : '正在准备画面…';
  });
  model.addEventListener('error', () => showFallback('三维展示暂时无法载入，当前保留静态图'));
  model.addEventListener('camera-change', event => {
    if (!ready) return;
    if (event.detail.source === 'user-interaction') {
      setRotation(false);
      clearPreset();
    }
    syncControls();
  });

  for (const [name, slider] of Object.entries(sliders)) {
    slider.addEventListener('pointerdown', () => { draggingSlider = name; });
    slider.addEventListener('input', () => {
      if (!ready) return;
      const { orbit, target } = readCamera();
      const value = Number(slider.value);
      setRotation(false);
      clearPreset();
      if (name === 'height') model.cameraTarget = `${target.x}m ${value / 100}m ${target.z}m`;
      if (name === 'orbit') model.cameraOrbit = `${radians(value)}rad ${orbit.phi}rad ${orbit.radius}m`;
      if (name === 'zoom') model.cameraOrbit = `${orbit.theta}rad ${orbit.phi}rad ${fullDistance / value}m`;
      model.jumpCameraToGoal();
    });
    slider.addEventListener('change', () => { draggingSlider = null; syncControls(); });
  }
  window.addEventListener('pointerup', () => { draggingSlider = null; syncControls(); });
  window.addEventListener('pointercancel', () => { draggingSlider = null; });
  presets.forEach(button => button.addEventListener('click', () => selectView(button.dataset.view)));
  rotationButton.addEventListener('click', () => {
    if (!ready) return;
    clearPreset();
    setRotation(!model.autoRotate);
  });
  motionPreference.addEventListener('change', event => {
    if (event.matches) { setRotation(false); if (ready) model.jumpCameraToGoal(); }
  });
  document.querySelectorAll('[data-inspect]').forEach(button => button.addEventListener('click', () => {
    document.querySelector('#model-stage').scrollIntoView({ behavior: motionPreference.matches ? 'instant' : 'smooth', block: 'start' });
    if (ready) selectView(button.dataset.inspect);
    else { pendingView = button.dataset.inspect; loadModel(); }
  }));
  loadButton.addEventListener('click', loadModel);
  const updatePageProgress = () => {
    const available = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    document.querySelector('#page-progress-bar').style.transform = `scaleX(${Math.max(0, Math.min(1, window.scrollY / available))})`;
  };
  window.addEventListener('scroll', updatePageProgress, { passive: true });
  window.addEventListener('resize', updatePageProgress, { passive: true });
  updatePageProgress();
})();
