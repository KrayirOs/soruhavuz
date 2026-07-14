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

// ===== YENİ FONKSİYONLAR =====

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function debounce(fn, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

export function throttle(fn, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Cache helper
export const cache = {
  set(key, value, ttl = 3600000) {
    try {
      sessionStorage.setItem(key, JSON.stringify({ value, exp: Date.now() + ttl }));
    } catch (error) {
      console.warn("Cache set failed:", error);
    }
  },
  get(key) {
    try {
      const item = sessionStorage.getItem(key);
      if (!item) return null;
      const { value, exp } = JSON.parse(item);
      if (Date.now() > exp) {
        sessionStorage.removeItem(key);
        return null;
      }
      return value;
    } catch (error) {
      console.warn("Cache get failed:", error);
      return null;
    }
  },
  clear(key) {
    sessionStorage.removeItem(key);
  },
  clearAll() {
    sessionStorage.clear();
  }
};

// Draft management
export const draft = {
  save(key, data) {
    try {
      localStorage.setItem(`draft_${key}`, JSON.stringify({ data, savedAt: new Date().toISOString() }));
    } catch (error) {
      console.warn("Draft save failed:", error);
    }
  },
  load(key) {
    try {
      const item = localStorage.getItem(`draft_${key}`);
      return item ? JSON.parse(item).data : null;
    } catch (error) {
      console.warn("Draft load failed:", error);
      return null;
    }
  },
  remove(key) {
    localStorage.removeItem(`draft_${key}`);
  },
  exists(key) {
    return localStorage.getItem(`draft_${key}`) !== null;
  }
};
