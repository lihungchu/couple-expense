const CACHE_NAME = "couple-expense-v10";
const APP_SHELL = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./js/firebase.js",
  "./js/expenses.js",
  "./js/ui.js",
  "./js/stats.js",
  "./js/chart.js",
  "./js/wallets.js",
  "./js/budgets.js",
  "./manifest.webmanifest",
  "./assets/icons/app-icon.svg",
  "./assets/icons/icon-180.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/illustrations/capybara-mode.png?v=3",
  "./assets/illustrations/dragon-mode.png?v=3"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.matchAll({ type: "window" }))
      .then((clients) => {
        clients.forEach((client) => client.navigate(client.url));
      })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
