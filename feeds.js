// Lista de dominios que sabemos que son feeds infinitos.
// La comparten content.js y popup.js. Si añades uno aquí, añádelo también
// en "content_scripts.matches" de manifest.json para que el script se inyecte.
// YouTube y LinkedIn no están aquí: se deciden por ruta en content.js.
self.SSB_KNOWN_HOSTS = [
  'instagram.com', 'tiktok.com', 'facebook.com', 'twitter.com', 'x.com',
  'reddit.com', 'pinterest.com', 'twitch.tv', '9gag.com', 'tumblr.com',
  'threads.net', 'threads.com', 'bsky.app', 'youtube.com', 'linkedin.com'
];
