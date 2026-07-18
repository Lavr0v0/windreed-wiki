(() => {
  const source = document.querySelector("[data-mobile-toc], .alberina-toc, .shirul-nav-links");
  const links = Array.from(source?.querySelectorAll('a[href^="#"]') || [])
    .filter((link) => document.getElementById(decodeURIComponent(link.hash.slice(1))));
  if (!links.length) return;

  const trigger = document.createElement("button");
  trigger.className = "chronicle-mobile-toc";
  trigger.type = "button";
  trigger.setAttribute("aria-haspopup", "dialog");
  trigger.setAttribute("aria-expanded", "false");
  trigger.innerHTML = '<i aria-hidden="true">☰</i><b>目录</b><small>本页章节</small>';

  const layer = document.createElement("div");
  layer.className = "chronicle-mobile-layer";
  layer.setAttribute("aria-hidden", "true");
  layer.innerHTML = `
    <button class="chronicle-mobile-scrim" type="button" aria-label="关闭目录"></button>
    <section class="chronicle-mobile-sheet" role="dialog" aria-modal="true" aria-label="本页目录" tabindex="-1">
      <header><div><span>CONTENTS</span><strong>本页目录</strong></div><button type="button" aria-label="关闭本页目录">×</button></header>
      <nav></nav>
    </section>`;

  const sheet = layer.querySelector(".chronicle-mobile-sheet");
  const closeButton = sheet.querySelector("header button");
  const sheetNav = sheet.querySelector("nav");
  const status = trigger.querySelector("small");
  const focusSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
  let activeId = links[0].hash.slice(1);
  let previousOverflow = "";

  links.forEach((link) => {
    const clone = link.cloneNode(true);
    clone.removeAttribute("class");
    clone.addEventListener("click", () => close());
    sheetNav.append(clone);
  });

  function setActive(id) {
    activeId = id;
    const original = links.find((link) => decodeURIComponent(link.hash.slice(1)) === id);
    status.textContent = original?.textContent.trim() || "本页章节";
    sheetNav.querySelectorAll("a").forEach((link) => {
      if (decodeURIComponent(link.hash.slice(1)) === id) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }

  function open() {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    layer.classList.add("is-open");
    layer.setAttribute("aria-hidden", "false");
    trigger.setAttribute("aria-expanded", "true");
    requestAnimationFrame(() => closeButton.focus({ preventScroll: true }));
  }

  function close() {
    document.body.style.overflow = previousOverflow;
    layer.classList.remove("is-open");
    layer.setAttribute("aria-hidden", "true");
    trigger.setAttribute("aria-expanded", "false");
    trigger.focus({ preventScroll: true });
  }

  trigger.addEventListener("click", open);
  closeButton.addEventListener("click", close);
  layer.querySelector(".chronicle-mobile-scrim").addEventListener("click", close);
  window.addEventListener("keydown", (event) => {
    if (!layer.classList.contains("is-open")) return;
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(sheet.querySelectorAll(focusSelector));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  const targets = links.map((link) => document.getElementById(decodeURIComponent(link.hash.slice(1))));
  const update = () => {
    const current = [...targets].reverse().find((target) => target.getBoundingClientRect().top <= 130);
    if (current && current.id !== activeId) setActive(current.id);
  };
  window.addEventListener("scroll", update, { passive: true });
  setActive(activeId);
  document.body.append(trigger, layer);
})();
