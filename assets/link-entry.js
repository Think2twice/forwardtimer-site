(() => {
  "use strict";

  const title = document.getElementById("entry-title");
  const status = document.getElementById("entry-status");
  const destination = document.getElementById("entry-destination");
  const retry = document.getElementById("entry-retry");
  let loading = false;

  function safeTarget(config, value) {
    if (typeof value !== "string" || value !== value.trim() || /[\u0000-\u0020\u007f\\]/.test(value)) return null;
    let url;
    try { url = new URL(value); } catch { return null; }

    if (url.protocol === "https:") {
      if (url.username || url.password || url.port || !Array.isArray(config.allowedHosts)) return null;
      if (!config.allowedHosts.includes(url.hostname)) return null;
      // Never loop through this redirect service, including encoded path segments.
      let path;
      try { path = decodeURIComponent(url.pathname).toLowerCase().replace(/\/{2,}/g, "/"); } catch { return null; }
      if (url.hostname === "wovenhours.formyweblym.top" && /^\/go(?:\/|$)/.test(path)) return null;
      return url;
    }

    if (url.protocol === "mailto:" && !url.search && !url.hash && Array.isArray(config.allowedMailtoRecipients)) {
      const recipient = value.slice("mailto:".length);
      if (/^[A-Za-z0-9.!#$&'*+\-/=?^_`{|}~]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(recipient)
          && config.allowedMailtoRecipients.includes(recipient)) return url;
    }
    return null;
  }

  async function openEntry() {
    if (loading) return;
    loading = true;
    retry.hidden = true;
    destination.hidden = true;
    destination.removeAttribute("href");
    status.textContent = "正在打开…";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      // Destination selection uses only the fixed route path, never query/hash input.
      const match = window.location.pathname.match(/^\/go\/([a-z0-9-]+)(?:\/index\.html|\/)?$/);
      if (!match) throw new Error("Unknown route");
      const response = await fetch(`/links.json?v=${Date.now()}`, {
        cache: "no-store",
        credentials: "omit",
        redirect: "error",
        referrerPolicy: "no-referrer",
        signal: controller.signal
      });
      if (!response.ok) throw new Error("Link configuration unavailable");
      const config = await response.json();
      if (config.schemaVersion !== 1 || !config.routes || !Object.prototype.hasOwnProperty.call(config.routes, match[1])) throw new Error("Invalid configuration");
      const route = config.routes[match[1]];
      if (!route || typeof route.title !== "string" || !route.title.trim()) throw new Error("Invalid route");
      title.textContent = route.title;
      document.title = `${route.title} · 织时`;

      if (route.enabled === false) {
        status.textContent = "这个入口暂未开放。需要帮助时，可以前往支持页。";
        return;
      }
      const target = route.enabled === true ? safeTarget(config, route.url) : null;
      if (!target) throw new Error("Invalid destination");
      destination.href = target.href;
      destination.hidden = false;
      destination.textContent = target.protocol === "mailto:" ? "撰写邮件" : "继续打开";
      status.textContent = target.protocol === "mailto:"
        ? "点击下方按钮，用邮件联系。"
        : "正在打开；若没有自动跳转，请点击下方按钮。";
      if (target.protocol === "https:") window.location.replace(target.href);
    } catch {
      status.textContent = "暂时无法打开。请重试，或前往支持页。";
      retry.hidden = false;
    } finally {
      clearTimeout(timeout);
      loading = false;
    }
  }

  retry.addEventListener("click", openEntry);
  openEntry();
})();
