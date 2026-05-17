# 飞行者图鉴后端 API 文档

本目录是“飞行者图鉴”项目的本地后端服务，使用 `Node.js + Express` 实现，当前版本支持本地联调，也支持切换到 MySQL 部署到 Ubuntu 服务器。

服务特性：

- 提供公开内容接口，支持航空器、事件、人物的浏览、搜索、推荐和对比
- 提供前台用户接口，支持账号密码登录、收藏、浏览历史
- 提供后台管理接口，支持登录、字段校验、航空器新增/编辑、提审、审核和审计日志
- 支持本地 `JSON` 文件存储，也支持使用 `MySQL + Prisma`

## 目录

- [快速开始](#快速开始)
- [服务信息](#服务信息)
- [默认账号](#默认账号)
- [鉴权说明](#鉴权说明)
- [统一响应格式](#统一响应格式)
- [API 总览](#api-总览)
- [健康检查](#健康检查)
- [公开接口](#公开接口)
- [前台用户接口](#前台用户接口)
- [后台管理接口](#后台管理接口)
- [媒体上传](#媒体上传)
- [数据存储说明](#数据存储说明)
- [数据库迁移](#数据库迁移)
- [后续建议](#后续建议)

## 快速开始

### 安装依赖

```bash
cd backend
npm install
```

### 启动服务

```bash
npm run dev
```

如果要切换到 MySQL：

```bash
cp .env.example .env
npm run db:generate
npx prisma db push
DATABASE_PROVIDER=mysql npm run dev
```

默认地址：

- API 服务：`http://localhost:3001`
- 健康检查：`http://localhost:3001/health`

## 服务信息

- 运行时：`Node.js`
- 框架：`Express`
- 文件上传：`multer`
- 跨域：`cors`
- ORM：`Prisma`
- 数据库：`MySQL`
- 启动入口：[server.js](file:///C:/Users/Luck/Desktop/Hackathon/backend/src/server.js)
- 本地部署说明：[DEPLOY.md](file:///C:/Users/Luck/Desktop/Hackathon/backend/DEPLOY.md)

## 默认账号

本地种子数据内置了两个账号：

- 管理员：`admin / Admin123!`
- 前台用户：`demo / Demo123!`

种子数据来源见 [seed.js](file:///C:/Users/Luck/Desktop/Hackathon/backend/src/seed.js)。

## 鉴权说明

### 1. 哪些接口需要登录

- 公开接口：不需要登录
- 前台用户接口：需要前台用户登录
- 后台管理接口：需要管理员登录

### 2. 认证方式

登录成功后，服务会返回：

- `accessToken`
- `refreshToken`
- `user`

后续请求需要把 `accessToken` 放到请求头：

```http
Authorization: Bearer <accessToken>
```

鉴权逻辑见 [server.js](file:///C:/Users/Luck/Desktop/Hackathon/backend/src/server.js#L159-L202)。

## 统一响应格式

### 成功响应

```json
{
  "data": {},
  "meta": {},
  "error": null
}
```

### 失败响应

```json
{
  "data": null,
  "meta": null,
  "error": {
    "message": "错误信息",
    "details": null
  }
}
```

统一响应封装见 [server.js](file:///C:/Users/Luck/Desktop/Hackathon/backend/src/server.js#L29-L42)。

## API 总览

| 分类 | 方法 | 路径 | 说明 |
| --- | --- | --- | --- |
| 健康检查 | GET | `/health` | 检查服务是否存活 |
| 公开接口 | GET | `/api/public/aircraft` | 获取已发布航空器列表 |
| 公开接口 | POST | `/api/public/aircraft/compare` | 多机型对比 |
| 公开接口 | GET | `/api/public/aircraft/:id` | 获取航空器详情 |
| 公开接口 | GET | `/api/public/events` | 获取事件列表 |
| 公开接口 | GET | `/api/public/persons` | 获取人物列表 |
| 公开接口 | GET | `/api/public/search` | 混合搜索 |
| 公开接口 | GET | `/api/public/recommendations` | 获取相关推荐 |
| 前台用户 | POST | `/api/user/auth/register` | 注册前台账号 |
| 前台用户 | POST | `/api/user/auth/login` | 前台账号密码登录 |
| 前台用户 | POST | `/api/user/auth/refresh` | 刷新访问令牌 |
| 前台用户 | POST | `/api/user/auth/logout` | 退出登录 |
| 前台用户 | GET | `/api/user/profile` | 获取当前用户信息 |
| 前台用户 | POST | `/api/user/favorites` | 添加收藏 |
| 前台用户 | DELETE | `/api/user/favorites/:id` | 删除收藏 |
| 前台用户 | GET | `/api/user/favorites` | 获取收藏列表 |
| 前台用户 | POST | `/api/user/history` | 记录浏览历史 |
| 前台用户 | GET | `/api/user/history` | 获取浏览历史 |
| 后台管理 | POST | `/api/admin/auth/login` | 管理员登录 |
| 后台管理 | GET | `/api/admin/dashboard/summary` | 后台统计摘要 |
| 后台管理 | POST | `/api/admin/content/validate` | 字段校验 |
| 后台管理 | POST | `/api/admin/aircraft` | 新建航空器 |
| 后台管理 | PUT | `/api/admin/aircraft/:id` | 更新航空器 |
| 后台管理 | POST | `/api/admin/content/submit-review` | 提交审核 |
| 后台管理 | POST | `/api/admin/content/approve` | 审核通过 |
| 后台管理 | POST | `/api/admin/content/reject` | 审核驳回 |
| 后台管理 | GET | `/api/admin/audit-logs` | 获取审计日志 |
| 后台管理 | POST | `/api/admin/media/upload` | 上传媒体文件 |

## 健康检查

### `GET /health`

用途：检查服务是否启动成功。

示例请求：

```bash
curl http://localhost:3001/health
```

示例响应：

```json
{
  "data": {
    "status": "ok"
  },
  "meta": null,
  "error": null
}
```

## 公开接口

公开接口实现见 [server.js:L281-L382](file:///C:/Users/Luck/Desktop/Hackathon/backend/src/server.js#L281-L382)。

### `GET /api/public/aircraft`

用途：获取已发布航空器列表。

查询参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `keyword` | string | 否 | 关键字搜索，匹配名称、简介、制造商 |
| `type` | string | 否 | 机型分类，如 `客机` |

示例请求：

```bash
curl "http://localhost:3001/api/public/aircraft?keyword=A380&type=客机"
```

### `POST /api/public/aircraft/compare`

用途：按多个机型 ID 或 slug 返回统一字段，用于对比页。

请求体：

```json
{
  "ids": ["aircraft-a380", "boeing-747", "concorde"]
}
```

### `GET /api/public/aircraft/:id`

用途：获取单个航空器详情，支持 `id` 或 `slug`。

示例请求：

```bash
curl http://localhost:3001/api/public/aircraft/airbus-a380
```

### `GET /api/public/events`

用途：获取已发布事件列表。

### `GET /api/public/persons`

用途：获取已发布人物列表。

### `GET /api/public/search`

用途：混合搜索航空器、事件、人物。

查询参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `q` | string | 否 | 搜索关键词 |
| `type` | string | 否 | 限定实体类型，可选 `aircraft`、`event`、`person`、`all` |

示例请求：

```bash
curl "http://localhost:3001/api/public/search?q=客机"
```

### `GET /api/public/recommendations`

用途：获取相关推荐。

查询参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `entityType` | string | 否 | 当前仅对 `aircraft` 有实际推荐逻辑 |
| `entityId` | string | 否 | 实体 ID 或 slug |

示例请求：

```bash
curl "http://localhost:3001/api/public/recommendations?entityType=aircraft&entityId=airbus-a380"
```

## 前台用户接口

前台用户接口实现见 [server.js:L384-L602](file:///C:/Users/Luck/Desktop/Hackathon/backend/src/server.js#L384-L602)。

### `POST /api/user/auth/register`

用途：注册前台用户。

请求体：

```json
{
  "username": "newuser",
  "password": "Demo123!"
}
```

### `POST /api/user/auth/login`

用途：前台用户账号密码登录。

请求体：

```json
{
  "username": "demo",
  "password": "Demo123!"
}
```

示例响应：

```json
{
  "data": {
    "accessToken": "token",
    "refreshToken": "token",
    "user": {
      "id": "user-demo",
      "username": "demo",
      "nickname": "本地演示用户",
      "userType": "frontend_user"
    }
  },
  "meta": null,
  "error": null
}
```

### `POST /api/user/auth/refresh`

用途：使用 `refreshToken` 刷新 `accessToken`。

请求体：

```json
{
  "refreshToken": "your-refresh-token"
}
```

### `POST /api/user/auth/logout`

用途：退出当前前台登录态。

请求头：

```http
Authorization: Bearer <accessToken>
```

### `GET /api/user/profile`

用途：获取当前前台用户信息。

### `POST /api/user/favorites`

用途：添加收藏记录。

请求体：

```json
{
  "entityType": "aircraft",
  "entityId": "aircraft-a380"
}
```

### `DELETE /api/user/favorites/:id`

用途：删除收藏记录。

### `GET /api/user/favorites`

用途：获取当前用户收藏列表。

### `POST /api/user/history`

用途：记录浏览历史；同一实体会累计浏览次数。

请求体：

```json
{
  "entityType": "aircraft",
  "entityId": "aircraft-a380"
}
```

### `GET /api/user/history`

用途：获取浏览历史，按最近浏览时间倒序返回。

## 后台管理接口

后台接口实现见 [server.js:L604-L916](file:///C:/Users/Luck/Desktop/Hackathon/backend/src/server.js#L604-L916)。

### `POST /api/admin/auth/login`

用途：管理员账号密码登录。

请求体：

```json
{
  "username": "admin",
  "password": "Admin123!"
}
```

### `GET /api/admin/dashboard/summary`

用途：获取后台摘要统计，包括：

- 已发布条目数
- 缺失字段数量
- 待审核数量
- 本周修复率

### `POST /api/admin/content/validate`

用途：对航空器表单执行字段校验。

请求体示例：

```json
{
  "nameZh": "波音 747",
  "aircraftType": "客机",
  "summary": "经典巨型远程客机",
  "rangeKm": 13850,
  "source": "Boeing 官方资料",
  "requirePublishReady": true
}
```

说明：

- `requirePublishReady: true` 时，会把来源标注等提审必需条件作为阻塞项检查
- `requirePublishReady: false` 时，会返回建议补充项

### `POST /api/admin/aircraft`

用途：新建航空器。

请求体常用字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `nameZh` | string | 是 | 中文名称 |
| `aircraftType` | string | 是 | 机型分类 |
| `summary` | string | 是 | 一句话简介 |
| `description` | string | 否 | 详细介绍 |
| `source` | string | 否 | 来源标注 |
| `firstFlightYear` | number | 否 | 首飞年份 |
| `rangeKm` | number | 否 | 最大航程 |
| `manufacturer` | string | 否 | 制造商 |
| `countryOfOrigin` | string | 否 | 原产国 |
| `eraLabel` | string | 否 | 年代标签 |

### `PUT /api/admin/aircraft/:id`

用途：更新航空器。

说明：`id` 支持传航空器 `id` 或 `slug`。

### `POST /api/admin/content/submit-review`

用途：提交单级审核流。

请求体：

```json
{
  "entityType": "aircraft",
  "entityId": "aircraft-a380"
}
```

当前限制：

- 本地版只支持 `aircraft`
- 提审前必须通过发布级校验

### `POST /api/admin/content/approve`

用途：审核通过。

请求体：

```json
{
  "workflowId": "workflow-id",
  "comment": "审核通过"
}
```

### `POST /api/admin/content/reject`

用途：审核驳回。

请求体：

```json
{
  "workflowId": "workflow-id",
  "comment": "来源信息不完整，请补充"
}
```

说明：

- 驳回时 `comment` 必填

### `GET /api/admin/audit-logs`

用途：获取最近 50 条审计日志。

日志内容包括：

- 操作人
- 操作类型
- 对象类型
- 对象 ID
- 摘要
- 时间

## 媒体上传

### `POST /api/admin/media/upload`

用途：上传媒体文件。

请求方式：

- `multipart/form-data`
- 文件字段名：`file`

示例：

```bash
curl -X POST http://localhost:3001/api/admin/media/upload \
  -H "Authorization: Bearer <accessToken>" \
  -F "file=@./demo.png"
```

示例响应：

```json
{
  "data": {
    "filename": "服务器文件名",
    "originalName": "demo.png",
    "url": "/uploads/服务器文件名"
  },
  "meta": null,
  "error": null
}
```

## 数据存储说明

当前版本支持两种持久化方式：

- `DATABASE_PROVIDER=json`：数据文件 `backend/data/db.json`
- `DATABASE_PROVIDER=mysql`：数据写入 MySQL
- 上传目录：`backend/uploads/`

相关代码：

- 数据读写：[db.js](file:///C:/Users/Luck/Desktop/Hackathon/backend/src/db.js)
- 种子数据：[seed.js](file:///C:/Users/Luck/Desktop/Hackathon/backend/src/seed.js)
- 校验逻辑：[validation.js](file:///C:/Users/Luck/Desktop/Hackathon/backend/src/validation.js)
- Prisma Schema：[schema.prisma](file:///C:/Users/Luck/Desktop/Hackathon/backend/prisma/schema.prisma)

## 数据库迁移

### 1. 初始化 MySQL 表结构

```bash
npm run db:generate
npx prisma db push
```

### 2. 把现有 `db.json` 导入 MySQL

```bash
DATABASE_PROVIDER=mysql npm run db:seed:mysql
```

### 3. 关键说明

- 当前接口层保持不变，`db.js` 会根据 `DATABASE_PROVIDER` 自动切换底层存储
- 服务器建议固定使用 `DATABASE_PROVIDER=mysql`
- 如果数据库信息不足，请先检查 `.env` 的 `DATABASE_URL` 是否正确

## 后续建议

如果你准备把本地版迁到服务器，建议下一步按这个顺序继续：

1. 完成 MySQL 初始化并导入演示数据
2. 把前台登录、收藏、浏览历史页面真正接到这些接口
3. 增加事件详情、人物详情、后台事件管理、后台人物管理接口
4. 将上传文件迁移到 MinIO 或对象存储
5. 用 `pm2 + nginx` 部署到 Ubuntu 服务器

服务器部署可以直接参考 [DEPLOY.md](file:///C:/Users/Luck/Desktop/Hackathon/backend/DEPLOY.md)。
