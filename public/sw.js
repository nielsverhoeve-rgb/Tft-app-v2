const APP = "traitforge-app-v1";
const IMG = "traitforge-img-v1";
const SHELL = [
  "./", "./index.html", "./forge.html", "./matrix.html", "./units.html",
  "./manifest.json", "./icon.svg"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(APP).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== APP && k !== IMG).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;

  // Unit portraits: serve from cache once seen, otherwise fetch and keep.
  if (url.hostname === "raw.communitydragon.org" && /\.(jpg|jpeg|png|webp)$/i.test(url.pathname)) {
    e.respondWith(
      caches.open(IMG).then(c =>
        c.match(e.request).then(hit =>
          hit || fetch(e.request).then(res => {
            if (res.ok) c.put(e.request, res.clone());
            return res;
          }).catch(() => hit)
        )
      )
    );
    return;
  }

  // App files: network first so edits show up, cache as the offline fallback.
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(e.request).then(res => {
        if (res.ok) caches.open(APP).then(c => c.put(e.request, res.clone()));
        return res;
      }).catch(() => caches.match(e.request).then(hit => hit || caches.match("./index.html")))
    );
  }
});
