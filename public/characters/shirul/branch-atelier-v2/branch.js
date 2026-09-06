(() => {
  const host = document.querySelector('#branch-model');
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
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  const fullDistance = 3.35;
  host.inert = true;
  const views = {
    full: { target: 0.27, theta: -14, phi: 78, radius: fullDistance },
    blade: { target: 0.52, theta: 6, phi: 84, radius: 0.9 },
    opening: { target: 0.145, theta: 18, phi: 82, radius: 0.51 },
    hilt: { target: -0.02, theta: 18, phi: 80, radius: 0.81 },
    grip: { target: -0.16, theta: 22, phi: 82, radius: 0.66 },
    pommel: { target: -0.295, theta: 20, phi: 78, radius: 0.36 },
    tip: { target: 0.877, theta: 4, phi: 86, radius: 0.39 },
  };
  let ready = false, loading = false, module = null, stage = null;
  let attempts = 0, sequence = 0, timer, controller, pendingView = null;
  let draggingSlider = null;
  const degrees = angle => angle * 180 / Math.PI;
  const normalized = angle => ((angle + 180) % 360 + 360) % 360 - 180;
  function controlsEnabled(enabled) {
    for (const group of [toolbar, adjustments]) {
      group.inert = !enabled; group.classList.toggle('is-disabled', !enabled);
      group.querySelectorAll('button, input').forEach(control => { control.disabled = !enabled; });
    }
  }
  function rotationLabel() {
    const active = Boolean(ready && stage?.autoRotate);
    rotationButton.setAttribute('aria-pressed', String(active));
    rotationButton.querySelector('span:last-child').textContent = active ? '暂停转动' : '自动转动';
  }
  function clearPreset() {
    presets.forEach(button => { button.classList.remove('is-active'); button.setAttribute('aria-pressed', 'false'); });
  }
  function syncControls() {
    if (!ready || !stage) return;
    const orbit = stage.getCameraOrbit(), target = stage.getCameraTarget();
    const angle = normalized(degrees(orbit.theta)), zoom = fullDistance / orbit.radius;
    if (draggingSlider !== 'orbit') sliders.orbit.value = String(angle);
    if (draggingSlider !== 'height') {
      sliders.height.min = String(Math.min(-34, Math.floor(target.y * 100)));
      sliders.height.max = String(Math.max(94, Math.ceil(target.y * 100)));
      sliders.height.value = String(target.y * 100);
    }
    if (draggingSlider !== 'zoom') { sliders.zoom.max = String(Math.max(18, Math.ceil(zoom * 100) / 100)); sliders.zoom.value = String(zoom); }
    outputs.orbit.textContent = `${Math.round(angle)}°`;
    outputs.height.textContent = `${(target.y * 100).toFixed(1)} cm`;
    outputs.zoom.textContent = `${zoom.toFixed(1)}×`;
    for (const key of Object.keys(sliders)) sliders[key].setAttribute('aria-valuetext', outputs[key].textContent);
    rotationLabel();
  }
  function selectView(name) {
    if (!ready || !views[name]) return;
    stage.setView({ ...views[name], resetTarget: true });
    presets.forEach(button => {
      const active = button.dataset.view === name;
      button.classList.toggle('is-active', active); button.setAttribute('aria-pressed', String(active));
    });
    syncControls();
  }
  function fallback(message) {
    clearTimeout(timer); controller?.abort(); ready = false; loading = false;
    stage?.dispose(); stage = null; host.stage = null; host.loaded = false;
    host.dataset.state = 'error'; host.classList.remove('is-active'); host.inert = true;
    poster.classList.remove('is-hidden'); loadButton.classList.remove('is-hidden'); loadButton.disabled = false;
    loadButton.querySelector('span').textContent = '重新加载三维展示';
    panel.setAttribute('aria-busy', 'false'); controlsEnabled(false); rotationLabel(); status.textContent = message;
  }
  async function loadModel() {
    if (ready || loading) return;
    loading = true; const current = ++sequence, retry = attempts++;
    host.dataset.state = 'loading'; panel.setAttribute('aria-busy', 'true');
    loadButton.disabled = true; loadButton.querySelector('span').textContent = '正在加载三维展示';
    status.textContent = '正在载入查看器…'; progress.style.transform = 'scaleX(0)';
    controller = new AbortController();
    timer = setTimeout(() => { if (current === sequence) fallback('载入时间较长，当前保留静态图，可重试'); }, 45000);
    try {
      if (!module) module = await import(`./vendor/branch-stage.min.js?rev=forest4${retry ? `&retry=${retry}` : ''}`);
      if (!loading || current !== sequence) return;
      const asset = new URL(host.dataset.src, document.baseURI), environment = new URL(host.dataset.environment, document.baseURI), panorama = new URL(host.dataset.panorama, document.baseURI);
      if (retry) { asset.searchParams.set('retry', String(retry)); environment.searchParams.set('retry', String(retry)); panorama.searchParams.set('retry', String(retry)); }
      const loadedStage = await module.createBranchStage({
        host, modelUrl: asset.href, environmentUrl: environment.href, panoramaUrl: panorama.href, signal: controller.signal,
        onProgress: amount => {
          if (!loading || current !== sequence) return;
          progress.style.transform = `scaleX(${amount})`;
          status.textContent = amount < 0.9 ? `正在载入 ${Math.round(amount * 100)}%` : '正在准备光影…';
        },
        onChange: event => { if (event.source === 'user-interaction') clearPreset(); syncControls(); },
        onError: () => { if (current === sequence) fallback('三维展示暂时中断，当前保留静态图'); },
      });
      if (!loading || current !== sequence) { loadedStage.dispose(); return; }
      stage = loadedStage; host.stage = stage; host.loaded = true;
      ready = true; loading = false; clearTimeout(timer);
      host.dataset.state = 'ready'; host.classList.add('is-active'); host.inert = false; poster.classList.add('is-hidden');
      loadButton.classList.add('is-hidden'); loadButton.disabled = false; panel.setAttribute('aria-busy', 'false');
      controlsEnabled(true); syncControls(); status.textContent = '三维展示已就绪';
      if (pendingView) { selectView(pendingView); pendingView = null; }
    } catch (error) {
      if (current !== sequence) return;
      if (error?.name === 'AbortError' && !loading) return;
      fallback('三维展示暂时无法载入，仍可查看静态图');
    }
  }
  for (const [key, slider] of Object.entries(sliders)) {
    slider.addEventListener('pointerdown', () => { draggingSlider = key; });
    slider.addEventListener('input', () => {
      if (!ready) return;
      const value = Number(slider.value); clearPreset();
      if (key === 'height') stage.setView({ target: value / 100 });
      if (key === 'orbit') stage.setView({ theta: value });
      if (key === 'zoom') stage.setView({ radius: fullDistance / value });
      syncControls();
    });
    slider.addEventListener('change', () => { draggingSlider = null; syncControls(); });
  }
  window.addEventListener('pointerup', () => { draggingSlider = null; syncControls(); });
  window.addEventListener('pointercancel', () => { draggingSlider = null; });
  presets.forEach(button => button.addEventListener('click', () => selectView(button.dataset.view)));
  rotationButton.addEventListener('click', () => { if (ready) { clearPreset(); stage.setRotation(!stage.autoRotate); rotationLabel(); } });
  motionPreference.addEventListener('change', event => { if (event.matches && stage) { stage.setRotation(false); rotationLabel(); } });
  document.querySelectorAll('[data-inspect]').forEach(button => button.addEventListener('click', () => {
    document.querySelector('#model-stage').scrollIntoView({ behavior: motionPreference.matches ? 'instant' : 'smooth', block: 'start' });
    if (ready) selectView(button.dataset.inspect); else { pendingView = button.dataset.inspect; loadModel(); }
  }));
  loadButton.addEventListener('click', loadModel);
  const pageProgress = () => {
    const available = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    document.querySelector('#page-progress-bar').style.transform = `scaleX(${Math.max(0, Math.min(1, scrollY / available))})`;
  };
  addEventListener('scroll', pageProgress, { passive: true }); addEventListener('resize', pageProgress, { passive: true }); pageProgress();
})();
