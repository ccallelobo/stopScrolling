(() => {
  'use strict';
  if (window.top !== window) return; // solo el frame principal
  if (!/^https?:$/.test(location.protocol)) return;
  // El script fijo (manifest) y el dinámico (background) pueden coincidir en
  // la misma página. Solo debe correr una instancia.
  if (window.__ssbLoaded) return;
  window.__ssbLoaded = true;

  const HOST = location.hostname.replace(/^www\./, '');
  const KNOWN_FEEDS = self.SSB_KNOWN_HOSTS || [];

  const INTENSITIES = {
    suave: { gray: 0.6,  blur: 0,   contrast: 0.95, cooldown: 130, pauseMin: 15 },
    media: { gray: 0.85, blur: 0.3, contrast: 0.9,  cooldown: 260, pauseMin: 10 },
    dura:  { gray: 1.0,  blur: 0.5, contrast: 0.82, cooldown: 450, pauseMin: 5 }
  };

  // Los efectos suben de 0 a 100% durante este tiempo (así una consulta rápida no molesta)
  const RAMP_SECONDS = 90;

  // Zonas "tranquilas" dentro de un feed conocido: conversaciones, mensajes,
  // ajustes, un hilo concreto. Ahí no hay scroll infinito que combatir y la
  // fricción solo estorbaría. [regex de host, regex de ruta]
  const QUIET_AREAS = [
    [/(^|\.)instagram\.com$/,     /^\/direct\//],
    [/(^|\.)(x|twitter)\.com$/,   /^\/(messages|compose|settings)(\/|$)/],
    [/(^|\.)facebook\.com$/,      /^\/(messages|settings)(\/|$)/],
    [/(^|\.)tiktok\.com$/,        /^\/messages(\/|$)/],
    [/^chat\.reddit\.com$/,       /./],
    [/(^|\.)reddit\.com$/,        /\/comments\/|^\/(message|chat|settings)(\/|$)/],
    [/(^|\.)bsky\.app$/,          /^\/messages(\/|$)/],
    [/(^|\.)pinterest\.com$/,     /^\/(messages|settings)(\/|$)/],
    [/(^|\.)threads\.(net|com)$/, /^\/settings(\/|$)/]
  ];

  let settings = { enabled: true, intensity: 'media', whitelist: [], blacklist: [], snoozeUntil: 0 };
  let frictionOn = false;
  let genericDetected = false;
  let rampSeconds = 0;
  let dayKey = todayKey();   // día al que pertenecen los contadores en memoria
  let todaySeconds = 0;      // tiempo de hoy en este dominio (cargado de storage)
  let pendingSeconds = 0;    // segundos aún no guardados
  let sincePauseSeconds = 0; // para la pausa forzada
  let lastWheelOk = 0;
  let overlayEl = null;
  let bannerEl = null;
  let filterEl = null;

  function todayKey() { return new Date().toLocaleDateString('en-CA'); } // YYYY-MM-DD
  const inList = (list) => (list || []).some((d) => HOST === d || HOST.endsWith('.' + d));
  const intensity = () => INTENSITIES[settings.intensity] || INTENSITIES.media;
  const isSnoozed = () => (settings.snoozeUntil || 0) > Date.now();

  function isEditable(el) {
    return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
  }

  function isKnownHost() {
    return inList(KNOWN_FEEDS);
  }

  function isKnownFeed() {
    if (HOST === 'youtube.com' || HOST.endsWith('.youtube.com')) {
      const p = location.pathname;
      // Shorts, portada, feeds y búsqueda sí; ver un vídeo concreto, no
      return p === '/' || p.startsWith('/shorts') || p.startsWith('/feed') || p.startsWith('/results');
    }
    if (HOST === 'linkedin.com' || HOST.endsWith('.linkedin.com')) {
      return location.pathname === '/feed' || location.pathname.startsWith('/feed/');
    }
    return isKnownHost();
  }

  function isQuietArea() {
    return QUIET_AREAS.some(([host, path]) => host.test(HOST) && path.test(location.pathname));
  }

  // ---------- Detección genérica de scroll infinito ----------
  // Si estando cerca del fondo la página crece varias veces, es un feed infinito.
  // Solo se usa en sitios que NO están en la lista fija (ahí ya sabemos la respuesta).
  // Las mutaciones se agrupan: una comprobación como mucho cada 300 ms.
  let lastHeight = 0;
  let growthEvents = 0;
  let detectTimer = null;

  function nearBottom() {
    const doc = document.documentElement;
    return window.scrollY + window.innerHeight > doc.scrollHeight - window.innerHeight * 1.5;
  }

  function checkGrowth() {
    detectTimer = null;
    const h = document.documentElement.scrollHeight;
    if (lastHeight && nearBottom() && h > lastHeight + 400) {
      growthEvents++;
      if (growthEvents >= 2) {
        genericDetected = true;
        mutationObserver.disconnect(); // ya está decidido: dejamos de observar
      }
    }
    lastHeight = Math.max(lastHeight, h);
  }

  const mutationObserver = new MutationObserver(() => {
    if (!detectTimer) detectTimer = setTimeout(checkGrowth, 300);
  });

  function startDetection() {
    if (isKnownHost() || inList(settings.whitelist)) return;
    lastHeight = document.documentElement.scrollHeight;
    if (document.body) {
      mutationObserver.observe(document.body, { childList: true, subtree: true });
    }
  }

  // ---------- Efectos visuales ----------
  function ramp() {
    return Math.min(1, rampSeconds / RAMP_SECONDS);
  }

  function ensureFilterEl() {
    if (filterEl && filterEl.isConnected) return filterEl;
    filterEl = document.createElement('div');
    filterEl.id = 'ssb-filter';
    document.documentElement.appendChild(filterEl);
    return filterEl;
  }

  function ensureBannerEl() {
    if (bannerEl && bannerEl.isConnected) return bannerEl;
    bannerEl = document.createElement('div');
    bannerEl.id = 'ssb-banner';
    document.documentElement.appendChild(bannerEl);
    return bannerEl;
  }

  function fmtMinutes(secs) {
    const m = Math.floor(secs / 60);
    if (m < 60) return `${m} min`;
    return `${Math.floor(m / 60)} h ${m % 60} min`;
  }

  function updateVisuals() {
    if (!frictionOn) return;
    const cfg = intensity();
    const r = ramp();
    const f = ensureFilterEl();
    f.style.backdropFilter =
      `grayscale(${(cfg.gray * r).toFixed(2)}) ` +
      `contrast(${(1 - (1 - cfg.contrast) * r).toFixed(2)}) ` +
      (cfg.blur ? `blur(${(cfg.blur * r).toFixed(2)}px)` : '');
    const b = ensureBannerEl();
    b.textContent = `⏳ ${fmtMinutes(todaySeconds)} hoy en ${HOST} · stopScrolling`;
  }

  function applyFriction() {
    if (frictionOn) return;
    frictionOn = true;
    document.documentElement.classList.add('ssb-friction');
    updateVisuals();
  }

  function removeFriction() {
    if (!frictionOn) return;
    frictionOn = false;
    document.documentElement.classList.remove('ssb-friction');
    if (filterEl) { filterEl.remove(); filterEl = null; }
    if (bannerEl) { bannerEl.remove(); bannerEl = null; }
    hideOverlay();
  }

  // ---------- Scroll lento y a trompicones ----------
  function shouldThrottleWheel(e) {
    if (e.ctrlKey || e.metaKey) return false;                 // zoom del navegador
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return false; // scroll horizontal (carruseles)
    if (isEditable(e.target)) return false;                    // dentro de un campo de texto
    return true;
  }

  window.addEventListener('wheel', (e) => {
    if (overlayEl) { e.preventDefault(); e.stopImmediatePropagation(); return; }
    if (!frictionOn || !shouldThrottleWheel(e)) return;
    const now = performance.now();
    if (now - lastWheelOk < intensity().cooldown) {
      e.preventDefault();
      e.stopImmediatePropagation();
    } else {
      lastWheelOk = now;
    }
  }, { passive: false, capture: true });

  const SCROLL_KEYS = new Set([' ', 'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp']);
  window.addEventListener('keydown', (e) => {
    if (!frictionOn) return;
    if (!SCROLL_KEYS.has(e.key)) return;
    if (isEditable(e.target)) return;
    const now = performance.now();
    if (overlayEl || now - lastWheelOk < intensity().cooldown) {
      e.preventDefault();
      e.stopImmediatePropagation();
    } else {
      lastWheelOk = now;
    }
  }, { passive: false, capture: true });

  // ---------- Pausa forzada ----------
  function showOverlay() {
    if (overlayEl) return;
    document.querySelectorAll('video').forEach((v) => { try { v.pause(); } catch (_) {} });

    overlayEl = document.createElement('div');
    overlayEl.id = 'ssb-overlay';
    overlayEl.innerHTML = `
      <div class="ssb-card">
        <div class="ssb-emoji">🦋</div>
        <h1>Un momento.</h1>
        <p>Llevas <strong>${fmtMinutes(todaySeconds)}</strong> hoy en <strong>${HOST}</strong>.</p>
        <p class="ssb-q">¿Hay algo que preferirías estar haciendo ahora mismo?</p>
        <div class="ssb-buttons">
          <button id="ssb-leave">Salir de aquí</button>
          <button id="ssb-continue" disabled>Continuar (10)</button>
        </div>
      </div>`;
    document.documentElement.appendChild(overlayEl);

    const btnCont = overlayEl.querySelector('#ssb-continue');
    const btnLeave = overlayEl.querySelector('#ssb-leave');
    let left = 10;
    const iv = setInterval(() => {
      left--;
      if (left <= 0) {
        clearInterval(iv);
        btnCont.disabled = false;
        btnCont.textContent = 'Continuar (no recomendado)';
      } else {
        btnCont.textContent = `Continuar (${left})`;
      }
    }, 1000);

    btnCont.addEventListener('click', () => {
      sincePauseSeconds = 0;
      hideOverlay();
    });
    btnLeave.addEventListener('click', () => {
      // El background cierra la pestaña; si no puede, página en blanco.
      try { chrome.runtime.sendMessage({ type: 'ssb-close-tab' }); } catch (_) {}
      setTimeout(() => { location.href = 'about:blank'; }, 400);
    });
  }

  function hideOverlay() {
    if (overlayEl) { overlayEl.remove(); overlayEl = null; }
  }

  // ---------- Tiempo y bucle principal ----------
  async function loadState() {
    const data = await chrome.storage.local.get(['settings', 'timeByDay']);
    if (data.settings) settings = Object.assign(settings, data.settings);
    const day = (data.timeByDay || {})[dayKey] || {};
    todaySeconds = day[HOST] || 0;
  }

  // Las escrituras van en cola: nunca dos lecturas-modificaciones a la vez.
  let writeQueue = Promise.resolve();
  function persist(key, secs) {
    if (secs <= 0) return writeQueue;
    writeQueue = writeQueue.then(async () => {
      const data = await chrome.storage.local.get('timeByDay');
      const timeByDay = data.timeByDay || {};
      timeByDay[key] = timeByDay[key] || {};
      timeByDay[key][HOST] = (timeByDay[key][HOST] || 0) + secs;
      // conserva solo los últimos 14 días
      const limit = new Date(Date.now() - 14 * 864e5).toLocaleDateString('en-CA');
      for (const k of Object.keys(timeByDay)) {
        if (k < limit) delete timeByDay[k];
      }
      if (key === dayKey) todaySeconds = timeByDay[key][HOST];
      await chrome.storage.local.set({ timeByDay });
    }).catch(() => {});
    return writeQueue;
  }

  function flushTime() {
    const secs = pendingSeconds;
    pendingSeconds = 0;
    return persist(dayKey, secs);
  }

  // Si la pestaña sigue abierta al pasar la medianoche, lo pendiente se guarda
  // en el día anterior y los contadores de pantalla arrancan de cero.
  function rolloverIfNeeded() {
    const k = todayKey();
    if (k === dayKey) return;
    const carry = pendingSeconds;
    pendingSeconds = 0;
    persist(dayKey, carry);
    dayKey = k;
    todaySeconds = 0;
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.settings) {
      settings = Object.assign(settings, changes.settings.newValue);
    }
  });

  function evaluate() {
    const shouldBeOn =
      settings.enabled &&
      !isSnoozed() &&
      !inList(settings.whitelist) &&
      !isQuietArea() &&
      (inList(settings.blacklist) || isKnownFeed() || genericDetected);
    if (shouldBeOn && !frictionOn) applyFriction();
    if (!shouldBeOn && frictionOn) removeFriction();
  }

  let tickCount = 0;
  setInterval(() => {
    rolloverIfNeeded();
    evaluate(); // también cubre navegación SPA (YouTube, etc.) y el fin de una pausa
    if (frictionOn && document.visibilityState === 'visible') {
      todaySeconds++;
      pendingSeconds++;
      sincePauseSeconds++;
      if (rampSeconds < RAMP_SECONDS) rampSeconds++;
      // La pausa espera a que el usuario termine de escribir
      if (sincePauseSeconds >= intensity().pauseMin * 60 && !overlayEl && !isEditable(document.activeElement)) {
        showOverlay();
      }
      updateVisuals();
    } else if (!frictionOn && rampSeconds > 0) {
      rampSeconds--; // sin fricción los efectos se "enfrían" al mismo ritmo al que subieron
    }
    if (++tickCount % 5 === 0) flushTime();
  }, 1000);

  loadState().then(() => {
    startDetection();
    evaluate();
  });
})();
