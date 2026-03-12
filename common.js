export function $(selector, root = document) {
  return root.querySelector(selector);
}

export function $all(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

export function showMessage(el, message, type = "info") {
  if (!el) return;
  el.textContent = message;
  el.className = `status ${type}`;
}

export function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function formatDate(isoDate) {
  if (!isoDate) return "-";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("tr-TR");
}

export function setActiveNav(pathname) {
  const links = $all(".top-nav a");
  links.forEach((link) => {
    const href = link.getAttribute("href");
    const isActive = href === pathname || (pathname.endsWith("/") && href === "index.html");
    link.classList.toggle("active", isActive);
  });
}

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  try {
    await navigator.serviceWorker.register("./service-worker.js");
  } catch (error) {
    console.error("Service worker registration failed:", error);
  }
}

export async function bootPage() {
  setActiveNav(location.pathname.split("/").pop() || "index.html");
  await registerServiceWorker();
}

export function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("Blob read failed."));
    reader.readAsDataURL(blob);
  });
}

export async function dataURLToBlob(dataUrl) {
  const response = await fetch(dataUrl);
  return response.blob();
}

export function safeFileName(value) {
  return String(value).replace(/[^a-z0-9-_]+/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}
