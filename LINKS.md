# 固定外链的维护

App 使用 `https://wovenhours.formyweblym.top/go/<名称>/`。目标地址集中放在仓库 `_data/links.json`。修改并发布这个文件后，App 不需要更新。

GitHub Pages 发布时把配置写入各个跳转页，打开时不再额外请求配置。这是客户端跳转，入口通常先返回 HTTP 200，不是 HTTP 302。GitHub Pages 发布和缓存更新需要时间，保存文件不等于已在网上生效。

## 当前入口

| 名称 | 固定路径 | 状态 |
| --- | --- | --- |
| X | `/go/x/` | 已配置 |
| 小红书 | `/go/xiaohongshu/` | 已配置 |
| 提交反馈 | `/go/feedback/` | 已配置，打开飞书表单 |
| 使用帮助 | `/go/help/` | 已配置，打开现有支持页 |
| 产品介绍 | `/go/product/` | 已配置，打开现有官网 |
| 隐私政策 | `/go/privacy/` | 未开放 |
| 服务条款 | `/go/terms/` | 未开放 |
| 下载织时 | `/go/download/` | 未开放 |
| 法律与隐私 | `/go/legal/` | 未开放 |
| 更新记录 | `/go/changelog/` | 未开放 |
| 公开反馈板 | `/go/roadmap/` | 未开放 |

本批不修改现有首页、支持页、隐私页和域名配置。未开放的入口只显示状态和支持页链接，不自动跳转，也不包含法律草稿。App 应隐藏尚未开放的入口。

## 在 GitHub 网页改地址

1. 打开 [links.json](https://github.com/Think2twice/forwardtimer-site/blob/main/_data/links.json)，点击铅笔图标编辑。
2. 在 `routes` 中找到对应名称，只改它的 `url`。使用完整的 `https://` 地址，保留 JSON 的双引号与逗号。
3. 如果目标换到了一个新域名，把这个精确域名加入同一文件顶部的 `allowedHosts`。例如地址为 `https://example.com/help/`，填 `example.com`；不要写 `*.example.com`、路径或协议。子域名要逐个列出。
4. 启用一个入口时，将 `enabled` 设为 `true`，并填写经过确认的公开地址。暂停入口时，改成 `false`，`url` 改成 `null`。法律页面未审核完成前保持关闭。
5. 点 `Commit changes`，提交到 `main`。等待仓库的 Pages 发布完成，再用手机打开对应固定入口，确认到达正确页面。
6. 如果打开的还是旧目标，等待发布完成后重新打开入口。GitHub Pages 的发布/CDN 更新可能有延迟。改错时，在 GitHub 文件历史中恢复上一版配置并重新发布。

无需重新生成十一个 HTML 文件。GitHub Pages 会用同一个 `_data/links.json` 自动生成它们；改显示名称用 `title`。

## 目标范围

- 只允许 `https://`，且主机名必须精确列在 `allowedHosts` 中。拒绝账号密码、非标准端口、HTTP、JavaScript、相对地址和协议相对地址。
- 若以后要使用邮件入口，填 `mailto:完整邮箱`，并在 `allowedMailtoRecipients` 中列出相同邮箱。只允许单个收件人，不接受附带主题、正文或抄送参数；邮件由用户点击后打开。
- 禁止把目标指回本站 `/go/`，避免循环。URL 查询参数或片段（如 `?url=`、`?next=`）不会改变入口选择，不存在可由访问者指定目标的通用跳转接口。
- 地址不合规时提供重试与支持页；配置不含访问者可覆盖的目标。页面提供重试和支持页入口；JavaScript 关闭时提供支持页入口。
- `allowedHosts` 只限制第一跳。小红书短链等目标站点的后续跳转由对方控制，维护时仍需亲自核对最终页面。

## 本地检查

在本仓库运行：

```sh
node scripts/check-links.cjs
```

检查包括目标格式、允许域名、禁用入口、配置变化、失败回退，以及页面无需第二次配置请求。它不代表外部平台页面或用户登录流程已经验收；发布后仍应点击每个已启用入口核对。

## 发布方式

保留现有 Pages 的 main 分支发布。`_data/links.json` 是唯一目标配置；`_includes/link-entry.html` 是公共模板。不要新建 `.nojekyll`，否则模板不会生成。原首页、支持页和隐私页作为静态文件保留。
