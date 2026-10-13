(async () => {
  const $ = (id) => document.getElementById(id);
  const todayKey = () => new Date().toLocaleDateString('en-CA');
  const ALL_SITES = { origins: ['http://*/*', 'https://*/*'] };
  const SNOOZE_MS = 15 * 60 * 1000;

  const fmt = (secs) => {
    const m = Math.floor((secs || 0) / 60);
    if (m < 60) return `${m} min`;
    return `${Math.floor(m / 60)} h ${m % 60} min`;
  };

  const defaults = { enabled: true, intensity: 'media', whitelist: [], blacklist: [], snoozeUntil: 0 };
  const data = await chrome.storage.local.get(['settings', 'timeByDay']);
  const settings = Object.assign(defaults, data.settings || {});

  // Pestaña activa (activeTab nos da su URL mientras el popup está abierto)
  let host = null;
  let tabId = null;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && /^https?:/.test(tab.url)) {
      host = new URL(tab.url).hostname.replace(/^www\./, '');
      tabId = tab.id;
    }
  } catch (_) {}

  const inList = (list) => host && list.some((d) => host === d || host.endsWith('.' + d));
  const isKnownHost = inList(self.SSB_KNOWN_HOSTS || []);

  // Estadísticas de hoy
  const today = (data.timeByDay || {})[todayKey()] || {};
  const totalSecs = Object.values(today).reduce((a, b) => a + b, 0);
  $('host').textContent = host || 'esta página';
  $('time-site').textContent = host ? fmt(today[host]) : '—';
  $('time-total').textContent = `total hoy en sitios con fricción: ${fmt(totalSecs)}`;

  // Estado actual de los controles
  $('enabled').checked = settings.enabled;
  $('intensity').value = settings.intensity;
  $('sitemode').value = inList(settings.whitelist) ? 'never'
    : inList(settings.blacklist) ? 'always'
    : 'auto';
  $('sitemode').disabled = !host;
  $('everywhere').checked = await chrome.permissions.contains(ALL_SITES);

  async function save() {
    await chrome.storage.local.set({ settings });
  }

  // Inyecta el script en la pestaña actual sin esperar a recargar
  async function injectIntoActiveTab() {
    if (tabId == null) return;
    try {
      await chrome.scripting.insertCSS({ target: { tabId }, files: ['content.css'] });
      await chrome.scripting.executeScript({ target: { tabId }, files: ['feeds.js', 'content.js'] });
    } catch (_) {}
  }

  // ---- Pausa temporal ----
  function renderSnooze() {
    const until = settings.snoozeUntil || 0;
    const active = until > Date.now();
    const btn = $('snooze');
    btn.classList.toggle('active', active);
    if (active) {
      const hhmm = new Date(until).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      btn.textContent = `Pausada hasta las ${hhmm} · Reanudar`;
    } else {
      btn.textContent = 'Pausar 15 min';
    }
  }
  renderSnooze();

  $('snooze').addEventListener('click', async () => {
    const active = (settings.snoozeUntil || 0) > Date.now();
    settings.snoozeUntil = active ? 0 : Date.now() + SNOOZE_MS;
    await save();
    renderSnooze();
  });

  $('enabled').addEventListener('change', (e) => {
    settings.enabled = e.target.checked;
    save();
  });

  $('intensity').addEventListener('change', (e) => {
    settings.intensity = e.target.value;
    save();
  });

  let prevSiteMode = $('sitemode').value;
  $('sitemode').addEventListener('change', async (e) => {
    if (!host) return;
    const mode = e.target.value;

    // "Siempre" en una web fuera de la lista fija: necesitamos permiso para esa web
    if (mode === 'always' && !isKnownHost) {
      const origin = { origins: [`*://*.${host}/*`] };
      if (!(await chrome.permissions.contains(origin))) {
        const ok = await chrome.permissions.request(origin);
        if (!ok) { e.target.value = prevSiteMode; return; }
        injectIntoActiveTab();
      }
    }

    settings.whitelist = settings.whitelist.filter((d) => d !== host);
    settings.blacklist = settings.blacklist.filter((d) => d !== host);
    if (mode === 'never') settings.whitelist.push(host);
    if (mode === 'always') settings.blacklist.push(host);
    prevSiteMode = mode;
    save();
  });

  $('everywhere').addEventListener('change', async (e) => {
    if (e.target.checked) {
      const ok = await chrome.permissions.request(ALL_SITES);
      e.target.checked = ok;
      if (ok) injectIntoActiveTab();
    } else {
      const ok = await chrome.permissions.remove(ALL_SITES);
      if (!ok) e.target.checked = true;
    }
  });
})();
