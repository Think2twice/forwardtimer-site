(() => {
  "use strict";

  const title = document.getElementById("entry-title");
  const status = document.getElementById("entry-status");
  const destination = document.getElementById("entry-destination");
  const retry = document.getElementById("entry-retry");

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

  function openEntry() {
    retry.hidden = true;
    destination.hidden = true;
    destination.removeAttribute("href");
    const data = document.body.dataset;
    const config = {
      allowedHosts: (data.hosts || "").split(","),
      allowedMailtoRecipients: (data.mail || "").split(",")
    };
    document.title = `${title.textContent} · 织时`;
    if (data.enabled === "false") {
      status.textContent = "这个入口暂未开放。需要帮助时，可以前往支持页。";
      return;
    }
    const target = data.enabled === "true" ? safeTarget(config, data.target) : null;
    if (!target) {
      status.textContent = "暂时无法打开。请重试，或前往支持页。";
      retry.hidden = false;
      return;
    }
    destination.href = target.href;
    destination.hidden = false;
    destination.textContent = target.protocol === "mailto:" ? "撰写邮件" : "继续打开";
    status.textContent = target.protocol === "mailto:"
      ? "点击下方按钮，用邮件联系。"
      : "正在打开；若没有自动跳转，请点击下方按钮。";
    if (target.protocol === "https:") window.location.replace(target.href);
  }

  retry.addEventListener("click", () => window.location.reload());
  openEntry();
})();
