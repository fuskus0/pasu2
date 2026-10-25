/* GitHub Pages no permite cabeceras COOP/COEP (necesarias para pthreads/SharedArrayBuffer).
   Este service worker las añade y recarga la página una vez. */
if (typeof window === 'undefined') {
  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
  self.addEventListener('fetch', e => {
    const r = e.request;
    if (r.cache === 'only-if-cached' && r.mode !== 'same-origin') return;
    e.respondWith(fetch(r).then(res => {
      if (res.status === 0) return res;
      const h = new Headers(res.headers);
      h.set('Cross-Origin-Embedder-Policy', 'require-corp');
      h.set('Cross-Origin-Opener-Policy', 'same-origin');
      return new Response(res.body, {status: res.status, statusText: res.statusText, headers: h});
    }).catch(err => new Response(String(err), {status: 502})));
  });
} else if (!window.crossOriginIsolated && 'serviceWorker' in navigator && window.isSecureContext) {
  const src = document.currentScript.src;
  navigator.serviceWorker.register(src).then(reg => {
    reg.addEventListener('updatefound', () => location.reload());
    if (reg.active && !navigator.serviceWorker.controller && !sessionStorage.getItem('coi')) {
      sessionStorage.setItem('coi', '1'); location.reload();
    }
  });
}
