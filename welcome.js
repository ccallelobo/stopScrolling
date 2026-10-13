(async () => {
  const defaults = { enabled: true, intensity: 'media', whitelist: [], blacklist: [], snoozeUntil: 0 };
  const data = await chrome.storage.local.get('settings');
  const settings = Object.assign(defaults, data.settings || {});
  const buttons = Array.from(document.querySelectorAll('.choice'));

  function render() {
    buttons.forEach((b) => b.classList.toggle('selected', b.dataset.value === settings.intensity));
  }
  render();

  buttons.forEach((b) => {
    b.addEventListener('click', async () => {
      settings.intensity = b.dataset.value;
      await chrome.storage.local.set({ settings });
      render();
    });
  });
})();
