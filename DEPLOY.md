# Vue 前端部署文档

---

## 技术栈

| 层 | 技术 |
|---|------|
| 框架 | Vue 3 (soybean-admin-antd) |
| 构建 | Vite + pnpm |
| 运行时 | Nginx (alpine) |
| 镜像仓库 | GitHub Container Registry (ghcr.io) |
| CI/CD | GitHub Actions |

---

## 镜像构建

### Dockerfile (`Dockerfile`)

```dockerfile
FROM node:20 AS builder
RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY .npmrc ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**两阶段构建**：Node 编译 → Nginx 运行时，最终镜像仅 ~50MB。

### 手动构建（可选）

```bash
cd soybean-admin-antd
pnpm install
pnpm build              # 产物在 dist/

docker build -t vue-demo .
docker run -p 80:80 vue-demo
```

---

## 部署架构

```
GitHub push main
  → Actions: pnpm build + docker build
  → push → ghcr.io/moi-igit/vue-demo:latest
  → SSH 到 ECS
  → docker compose pull frontend
  → docker compose up -d --force-recreate frontend
```

---

## 环境变量

### `.env.prod`

```bash
VITE_BASE_URL=/project-a/                   # 前端访问子路径
VITE_SERVICE_BASE_URL=/project-a/api        # 后端 API 地址
```

修改后需要重新构建镜像，`pnpm build` 会自动注入这些变量。

---

## Nginx 配置 (`nginx.conf`)

```
http://47.109.155.75/          → 301 重定向到 /project-a/
http://47.109.155.75/project-a/ → 前端 SPA
http://47.109.155.75/project-a/api/* → 反向代理到 fba_server:8001/api/v1/*
```

- 根路径 `/` 自动 301 跳转
- `/project-a/` SPA 路由，`try_files` 兜底到 `index.html`
- `/project-a/api/` rewrite 前缀后代理到后端

---

## 服务器配置

### 目录结构

```
/opt/apps/project-a/
├── docker-compose.yml    # 前端 + 后端 + db + redis 统一编排
└── proxy-nginx.conf      # （已废弃，镜像自带）
```

### docker-compose.yml（前端部分）

```yaml
services:
  frontend:
    image: ghcr.io/moi-igit/vue-demo:latest
    container_name: project-a-frontend
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - project-a-public       # shared-network（用于外部访问）
      - project-a-internal     # 与后端通信
```

---

## GitHub Actions (`deploy.yml`)

```yaml
name: Build and Deploy
on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4
      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ghcr.io/${{ github.repository }}:latest

      - name: Deploy to server
        uses: appleboy/ssh-action@v1.2.1
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          password: ${{ secrets.SSH_PASSWORD }}
          command_timeout: 5m
          script: |
            cd /opt/apps/project-a
            timeout 180 docker compose pull frontend 2>&1 || echo "timeout"
            docker compose up -d --force-recreate frontend
```

---

## GitHub Secrets（需配置）

| Secret | 值 |
|--------|---|
| `SSH_HOST` | `47.109.155.75` |
| `SSH_USER` | `root` |
| `SSH_PASSWORD` | 服务器 root 密码 |

---

## 手动部署

```bash
# 服务器上执行
cd /opt/apps/project-a
docker compose pull frontend
docker compose up -d --force-recreate frontend
```

---

## 验证

```bash
# 前端页面
curl http://47.109.155.75/
# → 301 → /project-a/

# 前端 JS 资源
curl http://47.109.155.75/project-a/

# API 代理
curl http://47.109.155.75/project-a/api/v1/auth/login
```

---

## 修改子路径

如果需要改为 `/app-b/` 等其他前缀：

1. `nginx.conf` — 三处 `project-a` 替换
2. `.env.prod` — `VITE_BASE_URL` 和 `VITE_SERVICE_BASE_URL`
3. 提交代码 → GitHub Actions 自动重新构建 → 镜像层不变则秒级重建
