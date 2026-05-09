# 云服务器部署方案

本项目为纯静态站点（HTML/CSS/JS），无需构建，直接部署静态文件即可。

---

## 方案一：GitHub Actions 自动部署（推荐）

每次 `git push` 后自动将代码同步到服务器，无需手动操作。

### 1. 配置 GitHub Secrets

在 GitHub 仓库 → Settings → Secrets and variables → Actions 中添加：

| Secret 名称 | 说明 |
|---|---|
| `SERVER_HOST` | 服务器 IP 或域名 |
| `SERVER_USER` | SSH 登录用户名（如 `root`） |
| `SSH_KEY` | SSH 私钥内容（`~/.ssh/id_rsa` 的内容） |

### 2. 创建 Workflow 文件

新建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Server

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy via rsync
        uses: burnett01/rsync-deployments@7.0.1
        with:
          switches: -avz --delete
          path: ./
          remote_path: /var/www/zblog/
          remote_host: ${{ secrets.SERVER_HOST }}
          remote_user: ${{ secrets.SERVER_USER }}
          remote_key: ${{ secrets.SSH_KEY }}
```

> `remote_path` 改为你服务器上实际的网站目录。

### 3. 服务器确认 SSH 公钥已添加

```bash
# 本地生成密钥对（如果还没有）
ssh-keygen -t ed25519 -C "github-actions"

# 将公钥追加到服务器
ssh-copy-id user@your-server
# 或手动追加到 ~/.ssh/authorized_keys
```

---

## 方案二：服务器定时 git pull（轻量）

适合服务器已经安装 git、不想配置 CI 的情况。

### 1. 服务器首次克隆

```bash
cd /var/www
git clone https://github.com/zhuzhengwen/Z-BLOG.git zblog
```

### 2. 手动更新

```bash
cd /var/www/zblog && git pull origin main
```

### 3. 配合 GitHub Webhook 自动触发（可选）

在服务器上放一个简单的 PHP 或 Python 脚本接收 webhook，收到 push 事件后执行 `git pull`。

---

## 方案三：rsync 本地手动同步

不依赖 GitHub，直接从本地推文件到服务器。

```bash
rsync -avz --delete \
  --exclude='.git' \
  --exclude='.claude' \
  --exclude='*.md' \
  ./ user@your-server:/var/www/zblog/
```

可保存为脚本 `sync.sh` 方便复用。

---

## 服务器 Nginx 配置

安装 Nginx 后添加站点配置：

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/zblog;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff2)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# 重载配置
nginx -t && systemctl reload nginx
```

如需 HTTPS，可用 Certbot 自动签发免费证书：

```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com
```

---

## 方案对比

| 方案 | 自动化 | 复杂度 | 适用场景 |
|---|---|---|---|
| GitHub Actions | ✅ push 即部署 | 中 | 长期维护、团队协作 |
| git pull | ⚠️ 手动或 webhook | 低 | 个人项目、简单场景 |
| rsync | ❌ 手动执行 | 低 | 偶尔同步、无 GitHub |
