# ForwardTimer 产品站

ForwardTimer（正向计时）的公开静态产品站，包含产品介绍、使用支持和隐私政策。

## 页面

- `/`：产品介绍
- `/support/`：使用支持与常见问题
- `/privacy/`：隐私政策

## 设计与技术边界

- 只使用原生 HTML、CSS 和少量 JavaScript，不依赖前端框架。
- 不接入分析、广告、Cookie 横幅、表单或远程字体。
- 产品截图来自真实 App 界面，不使用第三方品牌素材。
- `CNAME` 固定为 `forwardtimer.formyweblym.top`。

## 本地预览

```bash
python3 -m http.server 4173
```

然后访问 `http://127.0.0.1:4173/`。

## 发布

站点由 GitHub Pages 从 `main` 分支根目录发布。Cloudflare 的子域名记录应为 DNS-only CNAME，并指向 GitHub Pages 用户域名；HTTPS 由 GitHub Pages 签发并强制启用。

## 验收

```bash
curl -I https://forwardtimer.formyweblym.top/
curl -I https://forwardtimer.formyweblym.top/support/
curl -I https://forwardtimer.formyweblym.top/privacy/
```

三个地址都应返回 `HTTP/2 200`，证书主机名应覆盖 `forwardtimer.formyweblym.top`。

