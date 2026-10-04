// Applies the saved (or system) colour mode before first paint; AppProviders takes over after.
// A file rather than an inline script, so the Content-Security-Policy can forbid inline scripts.
try {
  var saved = localStorage.getItem('cerebro.theme');
  var dark = saved ? saved === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
} catch (e) {}
