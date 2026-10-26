// sw.js — the "service worker" that lets PR Board open with no internet.
//
// How it works: the first time you visit, the browser runs this file in the
// background and saves copies of the app's files. After that, when the app
// asks for a file, this worker answers from the saved copies if you're offline.
//
// IMPORTANT: when you change index.html (or any file below), bump the
// version number, e.g. "pr-board-v2". That tells phones to grab the new files.
const CACHE = "pr-board-v16";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

// 1. Install: save the app files
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_FILES)));
  self.skipWaiting();
});

// 2. Activate: delete saved files from older versions
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(names => Promise.all(names.filter(n => n !== CACHE).map(n => caches.delete(n))))
  );
  self.clients.claim();
});

// 3. Fetch: try the internet first so you always get the newest version,
//    and fall back to the saved copy when you're offline.
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));   // keeps fonts and updates saved too
        return response;
      })
      .catch(() => caches.match(event.request).then(saved => saved || caches.match("./index.html")))
  );
});
