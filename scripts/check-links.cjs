"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const config = JSON.parse(fs.readFileSync(path.join(root, "links.json"), "utf8"));
const script = fs.readFileSync(path.join(root, "assets/link-entry.js"), "utf8");
const keys = ["x", "xiaohongshu", "feedback", "help", "legal", "product", "changelog", "roadmap", "privacy", "terms", "download"];
let checks = 0;

async function render({ pathname = "/go/x/", data = config, fail = false, status = 200, stall = false } = {}) {
  const elements = {};
  for (const id of ["entry-title", "entry-status", "entry-destination", "entry-retry"]) {
    elements[id] = { hidden: true, textContent: "", removeAttribute(key) { delete this[key]; }, addEventListener(name, fn) { this[name] = fn; } };
  }
  const redirects = [], requests = [];
  const context = {
    URL, AbortController, Date, clearTimeout,
    setTimeout: stall ? (fn) => setTimeout(fn, 0) : setTimeout,
    document: { title: "", getElementById: (id) => elements[id] },
    window: { location: { pathname, search: "?url=https://evil.example/&next=https://evil.example/", hash: "#https://evil.example/", replace: (url) => redirects.push(url) } },
    fetch: async (url, options) => {
      requests.push({ url, options });
      if (stall) return new Promise((resolve, reject) => options.signal.addEventListener("abort", () => reject(new Error("aborted"))));
      if (fail) throw new Error("offline");
      return { ok: status >= 200 && status < 300, json: async () => structuredClone(data) };
    }
  };
  vm.runInNewContext(script, context);
  await new Promise((resolve) => setTimeout(resolve, stall ? 15 : 0));
  checks++;
  return { elements, redirects, requests, context };
}

function withRoute(url, enabled = true) {
  const copy = structuredClone(config);
  copy.routes.x.url = url;
  copy.routes.x.enabled = enabled;
  return copy;
}

(async () => {
  assert.equal(config.schemaVersion, 1);
  assert.deepEqual(Object.keys(config.routes).sort(), [...keys].sort());
  assert.ok(config.allowedHosts.every((host) => /^[a-z0-9.-]+$/.test(host) && !host.includes("..")));
  for (const key of keys) {
    const route = config.routes[key];
    assert.equal(typeof route.enabled, "boolean");
    assert.ok(route.title.trim());
    const html = fs.readFileSync(path.join(root, "go", key, "index.html"), "utf8");
    assert.ok(html.includes('/assets/link-entry.js') && html.includes('<noscript>'));
    assert.ok(!html.includes('http-equiv="refresh"'));
    const result = await render({ pathname: `/go/${key}/` });
    if (route.enabled) {
      assert.deepEqual(result.redirects, [route.url]);
      assert.equal(result.elements["entry-destination"].href, route.url);
    } else {
      assert.equal(route.url, null);
      assert.deepEqual(result.redirects, []);
      assert.ok(result.elements["entry-status"].textContent.includes("暂未开放"));
      assert.equal(result.elements["entry-destination"].hidden, true);
    }
  }

  const first = await render();
  assert.deepEqual(first.redirects, [config.routes.x.url]); // Query/hash cannot override the route.
  assert.ok(first.requests[0].url.startsWith("/links.json?v="));
  assert.equal(first.requests[0].options.cache, "no-store");
  assert.equal(first.requests[0].options.credentials, "omit");
  assert.equal(first.requests[0].options.redirect, "error");
  assert.equal(first.requests[0].options.referrerPolicy, "no-referrer");

  for (const pathname of ["/go/x", "/go/x/index.html"]) {
    assert.deepEqual((await render({ pathname })).redirects, [config.routes.x.url]);
  }
  for (const pathname of ["/go/unknown/", "/go/__proto__/", "/go/constructor/", "/go/x/extra/", "/go/%78/"]) {
    const result = await render({ pathname });
    assert.deepEqual(result.redirects, []);
    assert.equal(result.elements["entry-retry"].hidden, false);
  }

  for (const url of [
    "http://x.com/Wovenhours", "javascript:alert(1)", "//x.com/Wovenhours", "/support/",
    "https://x.com.evil.example/", "https://sub.x.com/", "https://x.com@evil.example/",
    "https://user:password@x.com/", "https://x.com:8443/", "https://x.com\\@evil.example/",
    " https://x.com/", "https://x.com/\n", "https://wovenhours.formyweblym.top/go/x/",
    "https://wovenhours.formyweblym.top/%67o/x/", "https://wovenhours.formyweblym.top/%2fgo/x/",
    "mailto:someone@example.com", "mailto:docdreamer@outlook.com?subject=test",
    "mailto:docdreamer@outlook.com%0Acc:someone@example.com", null
  ]) {
    const result = await render({ data: withRoute(url) });
    assert.deepEqual(result.redirects, [], `Unexpected redirect: ${url}`);
    assert.equal(result.elements["entry-destination"].hidden, true, `Unexpected link: ${url}`);
    assert.equal(result.elements["entry-retry"].hidden, false);
  }

  const mail = await render({ data: withRoute("mailto:docdreamer@outlook.com") });
  assert.deepEqual(mail.redirects, []);
  assert.equal(mail.elements["entry-destination"].href, "mailto:docdreamer@outlook.com");
  assert.equal(mail.elements["entry-destination"].textContent, "撰写邮件");

  const revised = withRoute("https://x.com/Wovenhours/status/123");
  assert.deepEqual((await render({ data: revised })).redirects, [revised.routes.x.url]);
  assert.deepEqual((await render({ data: withRoute(null, false) })).redirects, []);
  for (const options of [{ fail: true }, { status: 404 }, { data: {} }, { stall: true }]) {
    const result = await render(options);
    assert.deepEqual(result.redirects, []);
    assert.equal(result.elements["entry-retry"].hidden, false);
  }
  console.log(`PASS: ${checks} route/configuration/fallback/security scenarios. External sites and production publication were not tested.`);
})().catch((error) => { console.error(error); process.exitCode = 1; });
