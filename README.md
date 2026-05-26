# Project A 前端部署说明

本项目基于 Soybean Admin AntDesign 改造，用作 Project A 的 Vue 后台前端。当前前端已适配 FastAPI Best Architecture 后端接口，并通过 Docker Nginx 部署到服务器路径 `/test/`。

## 技术栈

- Vue 3
- Vite
- TypeScript
- Pinia
- Ant Design Vue
- pnpm workspace
- Docker + Nginx 静态部署

## 目录结构

```text
soybean-admin-antd
├── src
│   ├── service
│   │   ├── api              # 后端接口封装
│   │   └── request          # Axios 请求实例、Token 注入
│   ├── store                # Pinia 状态管理
│   ├── views                # 页面
│   ├── router               # 路由
│   └── typings              # 全局类型声明
├── packages                 # workspace 内部包
├── public                   # 静态资源
├── dist                     # 构建产物，本地 build 后生成
├── package.json
├── pnpm-lock.yaml
└── vite.config.ts
```

## 后端接口适配

当前接口文档：

```text
https://apifox.com/apidoc/shared-28a93f02-730b-4f33-bb5e-4dad92058cc0
```

已适配的主要接口：

```text
POST /api/v1/auth/login              登录
POST /api/v1/auth/refresh            刷新 token
GET  /api/v1/sys/users/me            当前用户信息
GET  /api/v1/sys/users               用户分页列表
GET  /api/v1/sys/roles               角色分页列表
GET  /api/v1/sys/roles/all           全部角色
GET  /api/v1/sys/menus               菜单树
```

前端部署在子路径 `/test/`，因此浏览器实际请求路径是：

```text
/test/api/v1/...
```

Token 处理逻辑：

```text
登录成功后保存 data.access_token 到 localStorage
后续请求自动添加 Authorization: Bearer <access_token>
```

## 本地开发

安装依赖：

```bash
pnpm install
```

启动开发服务：

```bash
pnpm dev
```

默认开发模式接口配置在 `.env.test` 中。生产构建时建议用环境变量覆盖。

## 本地生产构建

Project A 当前部署在 `/test/` 子路径，构建时必须指定：

```powershell
$env:VITE_BASE_URL='/test/'
$env:VITE_SERVICE_BASE_URL='/test/api/v1'
$env:VITE_SERVICE_SUCCESS_CODE='200'
$env:VITE_SERVICE_LOGOUT_CODES='401,8888,8889'
pnpm.cmd build
```

构建完成后产物在：

```text
dist/
```

## 服务器部署结构

服务器路径：

```text
/opt/apps/project-a
├── frontend              # Vue dist 静态文件
├── frontend-nginx.conf   # 前端容器内 Nginx 配置
├── backend-src           # FastAPI 后端源码
├── backend-env.server    # 后端环境变量
├── docker-compose.yml    # project-a 服务编排
├── fba-data
│   ├── postgres          # PostgreSQL 数据
│   └── redis             # Redis 数据
└── logs/fba              # 后端日志
```

公共 Nginx 配置：

```text
/opt/apps/nginx/conf.d/project-a.conf
```

当前公网访问地址：

```text
http://47.109.155.75/test/
```

根路径 `/` 当前返回 404，用来避免多个系统混在一起。

## 上传前端构建产物

在本地项目根目录执行：

```powershell
tar -czf D:\Work\Project\deploy-artifacts\soybean-dist.tar.gz -C D:\Work\Project\soybean-admin-antd\dist .
scp D:\Work\Project\deploy-artifacts\soybean-dist.tar.gz root@服务器IP:/tmp/soybean-dist.tar.gz
```

服务器执行：

```bash
rm -rf /opt/apps/project-a/frontend/*
tar -xzf /tmp/soybean-dist.tar.gz -C /opt/apps/project-a/frontend
cd /opt/apps/project-a
docker compose restart frontend
```

验证：

```bash
curl -I http://127.0.0.1/test/
curl http://127.0.0.1/test/api/v1/auth/captcha
```

## Docker 服务

Project A 服务：

```bash
cd /opt/apps/project-a
docker compose ps
docker compose up -d --no-build
docker compose restart frontend
docker compose restart backend
docker compose logs -f backend
```

公共 Nginx：

```bash
cd /opt/apps/nginx
docker compose ps
docker compose restart nginx
docker compose logs -f nginx
```

## 新服务器复刻步骤

1. 安装 Docker 和 Docker Compose。
2. 创建目录：

```bash
mkdir -p /opt/apps/project-a
mkdir -p /opt/apps/nginx/conf.d
```

3. 上传或拉取后端源码到：

```text
/opt/apps/project-a/backend-src
```

4. 上传前端 `dist` 到：

```text
/opt/apps/project-a/frontend
```

5. 准备这些配置文件：

```text
/opt/apps/project-a/docker-compose.yml
/opt/apps/project-a/frontend-nginx.conf
/opt/apps/project-a/backend-env.server
/opt/apps/nginx/docker-compose.yml
/opt/apps/nginx/conf.d/project-a.conf
```

6. 启动服务：

```bash
cd /opt/apps/project-a
docker compose up -d --no-build
cd /opt/apps/nginx
docker compose up -d
```

7. 初始化后端数据库，仅首次部署执行：

```bash
printf "y\n" | docker exec -i -w /fba project-a-backend python -c "from backend.cli import main; main()" init
```

8. 关闭登录验证码，当前前端登录页未接验证码输入框：

```bash
docker exec project-a-db psql -U postgres -d fba -c "update sys_config set value='false' where \"key\"='LOGIN_CAPTCHA_ENABLED';"
docker exec project-a-redis sh -c "redis-cli --scan --pattern 'fba:cache:config*' | xargs -r redis-cli del"
cd /opt/apps/project-a
docker compose restart backend
```

## 常用验证命令

登录：

```bash
curl -s -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}' \
  http://127.0.0.1/test/api/v1/auth/login
```

当前用户，需要替换 token：

```bash
curl -H "Authorization: Bearer <access_token>" \
  http://127.0.0.1/test/api/v1/sys/users/me
```

角色列表：

```bash
curl -H "Authorization: Bearer <access_token>" \
  "http://127.0.0.1/test/api/v1/sys/roles?page=1&size=10"
```

## 注意事项

- `/sys/users/me` 不带 `Authorization` 返回 401 是正常行为。
- 前端部署在 `/test/`，构建时必须设置 `VITE_BASE_URL=/test/`。
- 后端接口地址必须设置为 `VITE_SERVICE_BASE_URL=/test/api/v1`。
- PostgreSQL 和 Redis 不要暴露公网，只通过 Docker 内网访问。
- 服务器内存较小时，建议本地构建后端 Docker 镜像，再上传 `docker load`，避免服务器构建卡住。
