// Service worker. Dos tareas pequeñas:
//  1) Mantener registrado el content script en los sitios que el usuario ha
//     autorizado FUERA de la lista fija del manifest (toggle "detectar en
//     cualquier web" o "siempre con fricción" en un sitio concreto).
//  2) Cerrar la pestaña cuando el usuario pulsa "Salir de aquí" en la pausa
//     (un content script no puede cerrar una pestaña que no abrió él).

const DYNAMIC_ID = 'ssb-dynamic';

async function syncDynamicScript() {
  const { origins = [] } = await chrome.permissions.getAll();
  const matches = origins.filter((o) => /^(https?|\*):\/\//.test(o));
  const existing = await chrome.scripting.getRegisteredContentScripts({ ids: [DYNAMIC_ID] });

  if (!matches.length) {
    if (existing.length) await chrome.scripting.unregisterContentScripts({ ids: [DYNAMIC_ID] });
    return;
  }
  const script = {
    id: DYNAMIC_ID,
    matches,
    js: ['feeds.js', 'content.js'],
    css: ['content.css'],
    runAt: 'document_end',
    persistAcrossSessions: true
  };
  if (existing.length) await chrome.scripting.updateContentScripts([script]);
  else await chrome.scripting.registerContentScripts([script]);
}

chrome.runtime.onInstalled.addListener((details) => {
  syncDynamicScript();
  if (details.reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') });
  }
});
chrome.runtime.onStartup.addListener(syncDynamicScript);
chrome.permissions.onAdded.addListener(syncDynamicScript);
chrome.permissions.onRemoved.addListener(syncDynamicScript);

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg && msg.type === 'ssb-close-tab' && sender.tab && sender.tab.id != null) {
    chrome.tabs.remove(sender.tab.id);
  }
});
