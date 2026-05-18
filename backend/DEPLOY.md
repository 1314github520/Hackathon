# 飞行者图鉴后端运行与部署说明

## 1. 本地运行

### 1.1 进入目录

```bash
cd backend
```

### 1.2 安装依赖

```bash
npm install
```

### 1.3 配置环境变量

默认示例先使用 JSON，复制一份环境变量文件即可：

```bash
cp .env.example .env
```

默认配置如下：

```env
PORT=9001
DATABASE_PROVIDER=json
CORS_ALLOWED_ORIGINS=https://heikesong.mexqf.top,http://localhost:9000,http://127.0.0.1:9000
```

### 1.4 启动本地服务

```bash
npm run dev
```

默认启动地址：

- 后端 API：`http://localhost:9001`
- 健康检查：`http://localhost:9001/health`

默认本地演示账号：

- 管理员：`admin / Admin123!`
- 前台用户：`demo / Demo123!`

## 2. 与当前前端原型联调

当前前端原型默认通过：

- `http://localhost:4173/frontend-design/prototype/`

访问方式联调。

原型脚本里已经把 API 基地址写为：

```text
http://localhost:9001
```

因此只要同时启动前端静态服务和后端服务即可联调。

## 3. 数据库模式说明

现在后端支持两种存储模式：

- `DATABASE_PROVIDER=json`：继续使用 `backend/data/db.json`
- `DATABASE_PROVIDER=mysql`：使用 MySQL + Prisma

当前建议先用 JSON 跑通服务，确认前后端联通后再迁移到 MySQL。

## 4. Ubuntu 服务器部署

适用服务器：`8.162.14.195`

### 4.1 安装 Node.js

建议安装 Node.js 20 LTS。

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 4.2 安装 MySQL

```bash
sudo apt-get update
sudo apt-get install -y mysql-server
```

创建数据库和专用账号：

```bash
sudo mysql -u root -p
```

进入 MySQL 后执行：

```sql
CREATE DATABASE flyer_guide CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'flyer'@'localhost' IDENTIFIED BY 'StrongPassword_123';
GRANT ALL PRIVILEGES ON flyer_guide.* TO 'flyer'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 4.3 上传项目

将整个项目目录上传到服务器，例如：

```bash
/opt/flyer-guide/
```

### 4.4 安装后端依赖

```bash
cd /opt/flyer-guide/backend
npm install
```

### 4.5 配置生产环境变量

```bash
cp .env.example .env
```

如果你已经用了我写好的服务器配置，也可以直接：

```bash
cp .env.server .env
```

把 `.env` 改成：

```env
PORT=9001
CORS_ALLOWED_ORIGINS=https://heikesong.mexqf.top,http://localhost:9000,http://127.0.0.1:9000
DATABASE_PROVIDER=json
```

### 4.6 初始化数据库表

如果你暂时使用 JSON，这一步可以先跳过。

如果后续要迁移到 MySQL，当前代码已提供 Prisma schema，可直接推送表结构：

```bash
npm run db:generate
npx prisma db push
```

如果你本地已有 `backend/data/db.json`，后续可把演示数据导入 MySQL：

```bash
DATABASE_PROVIDER=mysql npm run db:seed:mysql
```

### 4.7 启动后端

临时启动：

```bash
npm run dev
```

推荐长期运行方式：

```bash
npm install -g pm2
pm2 start src/server.js --name flyer-guide-backend --update-env
pm2 save
pm2 startup
```

如果使用 `pm2`，建议先执行：

```bash
export DATABASE_PROVIDER=json
export PORT=9001
export CORS_ALLOWED_ORIGINS="https://heikesong.mexqf.top,http://localhost:9000,http://127.0.0.1:9000"
```

### 4.8 Nginx 反向代理

示例配置：

```nginx
server {
    listen 80;
    server_name heikesong.mexqf.top;

    location /api/ {
        proxy_pass http://127.0.0.1:9001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:9001;
        proxy_set_header Host $host;
    }
}
```

## 5. 迁移步骤建议

建议按下面顺序操作，风险最低：

1. 上传项目并配置 `.env` 为 `DATABASE_PROVIDER=json`
2. 先用 `npm run dev` 或 `pm2` 跑通后端
3. 用 `curl http://127.0.0.1:9001/health` 和公开接口检查服务
4. 前后端联通稳定后，再安装并配置 MySQL
5. 执行 `npx prisma db push`
6. 执行 `DATABASE_PROVIDER=mysql npm run db:seed:mysql`
7. 最后把 `.env` 切到 `mysql` 并重启服务

## 6. 当前说明

这个版本已经补上数据库相关代码和迁移脚本，但仍保留 JSON 模式，方便你本地继续联调。
