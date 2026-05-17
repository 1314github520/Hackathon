# 飞行者图鉴

面向黑客松赛题三的航空科普知识平台 Demo，目标是把分散、专业、难比较的航空知识整理成一个可搜索、可对比、可继续探索、可后台运营的“活的知识中枢”。

当前仓库包含 3 类核心资产：

- 一个可本地运行的 Node.js 后端服务
- 一套可直接演示的前端高保真静态原型
- 一批围绕赛题需求整理的产品、架构与智能体文档

## 项目定位

这个项目对应 [赛题三：飞行者图鉴 —— 开放型航空科普知识平台](./title.md)。

平台希望解决 3 个问题：

- 航空器、事件、人物资料分散，搜索和整理成本高
- 不同飞行器很难在统一维度下横向比较
- 后台录入内容时，字段缺失、来源不清、单位不统一等问题容易影响展示质量

面向用户主要分为两类：

- 前台用户：浏览、搜索、对比、收藏、继续学习
- 后台运营 / 管理员：录入内容、执行校验、提审、审核、查看日志

## 当前状态

这个仓库目前不是“完整成型的一体化 Web 应用”，而是一个适合比赛演示的阶段性版本：

- `backend/` 已提供可运行 REST API，本地 JSON 持久化，支持公开浏览、用户体系、后台校验和航空器审核流
- `frontend-design/prototype/` 是静态高保真原型，已经接入部分本地后端接口，用于展示搜索、后台校验和提审流程
- `.trae/documents/` 与 `.trae/specs/` 保存了产品、架构和治理方案，适合作为后续正式开发的依据
- 智能助手目前以提示词与展示原型为主，仓库里还没有独立的 LLM 服务接入实现

如果你要向评委展示，这个仓库已经足够支撑“前台体验 + 后台内容管理 + 智能化方向”的整体叙事。如果你要继续开发成正式产品，还需要补齐真实前端工程、更多实体 CRUD、数据库迁移与 AI 服务落地。

## 已实现能力

### 1. 公开内容能力

- 航空器列表查询与关键词过滤
- 航空器详情查询
- 多机型参数对比
- 事件列表、人物列表
- 混合搜索：航空器 / 事件 / 人物
- 简单相关推荐

### 2. 前台用户能力

- 用户注册、登录、刷新令牌、退出登录
- 个人资料读取
- 收藏新增 / 删除 / 列表
- 浏览历史写入 / 查询

### 3. 后台运营能力

- 管理员登录
- 仪表盘摘要数据
- 航空器内容校验
- 新建航空器
- 更新航空器
- 提交审核
- 审核通过 / 驳回
- 审计日志查询
- 媒体上传

### 4. 原型演示能力

静态原型当前覆盖以下页面或场景：

- 首页导览
- 搜索探索
- 飞行器详情
- 多机型对比
- 事件与人物联动页
- 智能助手抽屉
- 后台管理与质量校验面板

其中已经和后端发生真实联调的交互包括：

- 搜索接口调用
- 管理员自动登录
- 后台摘要数据加载
- 表单字段校验
- 新建航空器并提交审核

## 还未完成或仍属规划的部分

为了避免误解，这里把当前缺口单独列出来：

- 还没有正式的前端工程项目，当前前台主要是静态原型，不是 `Next.js` 成品
- 事件、人物的后台 CRUD 还没有落地
- 还没有航空器删除接口
- 事件详情、人物详情接口尚未补齐
- 智能助手还没有真实接入大模型 API
- 当前数据存储仍是本地 JSON 文件，不适合并发和生产环境
- 权限、审计、上传、安全策略仍是 Demo 级实现

## 目录结构

```text
Hackathon/
├─ README.md
├─ title.md
├─ backend/
│  ├─ data/
│  │  └─ db.json
│  ├─ src/
│  │  ├─ auth.js
│  │  ├─ db.js
│  │  ├─ seed.js
│  │  ├─ server.js
│  │  └─ validation.js
│  ├─ DEPLOY.md
│  ├─ package.json
│  └─ package-lock.json
├─ frontend-design/
│  ├─ frontend-design-package.md
│  └─ prototype/
│     ├─ index.html
│     ├─ script.js
│     └─ styles.css
└─ .trae/
   ├─ agents/
   ├─ documents/
   ├─ rules/
   └─ specs/
```

## 技术栈

### 当前实际落地

- 后端：Node.js + Express
- 中间件：`cors`、`multer`
- 认证方式：基于随机 Token 的会话机制
- 数据存储：本地 JSON 文件
- 前端演示：原生 HTML + CSS + JavaScript 静态原型

### 文档中的后续目标方案

以下内容来自当前设计文档，属于推荐落地方向，不代表仓库里已经实现：

- 前端：Next.js 15 + React 19 + TypeScript
- 样式：Tailwind CSS + CSS Variables
- 状态管理：TanStack Query + Zustand
- 表单：React Hook Form + Zod
- 测试：Vitest + Playwright + axe-core
- 生产数据层：PostgreSQL / Redis / 对象存储

## 快速开始

### 环境要求

- Node.js 18 及以上，推荐 Node.js 20 LTS
- npm
- 任意静态文件服务器，用于打开原型页面

### 1. 启动后端

```bash
cd backend
npm install
npm run dev
```

默认地址：

- API：`http://localhost:3001`
- 健康检查：`http://localhost:3001/health`

### 2. 启动前端原型

在项目根目录任选一种静态服务方式即可。示例：

```bash
python -m http.server 4173
```

打开：

- 原型页：`http://localhost:4173/frontend-design/prototype/`

原型脚本默认请求：

- `http://localhost:3001`

所以需要同时启动后端和静态文件服务。

## 演示账号

默认演示账号由种子数据生成：

- 管理员：`admin / Admin123!`
- 前台用户：`demo / Demo123!`

说明：

- 原型中的后台联调会自动使用管理员账号登录
- 如果你删除 `backend/data/db.json` 后重启服务，系统会自动重新生成一份种子数据

## 数据与持久化说明

当前后端为了快速演示，采用本地文件持久化：

- 数据文件：`backend/data/db.json`
- 上传目录：`backend/uploads/`

这意味着：

- 启动成本低，适合黑客松现场演示
- 数据结构清晰，便于快速调试
- 但不适合多用户并发、复杂查询和生产环境部署

## 核心接口概览

### 公开接口

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| `GET` | `/health` | 健康检查 |
| `GET` | `/api/public/aircraft` | 航空器列表 |
| `POST` | `/api/public/aircraft/compare` | 多机型对比 |
| `GET` | `/api/public/aircraft/:id` | 航空器详情 |
| `GET` | `/api/public/events` | 事件列表 |
| `GET` | `/api/public/persons` | 人物列表 |
| `GET` | `/api/public/search` | 混合搜索 |
| `GET` | `/api/public/recommendations` | 相关推荐 |

### 前台用户接口

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| `POST` | `/api/user/auth/register` | 注册 |
| `POST` | `/api/user/auth/login` | 登录 |
| `POST` | `/api/user/auth/refresh` | 刷新令牌 |
| `POST` | `/api/user/auth/logout` | 退出登录 |
| `GET` | `/api/user/profile` | 当前用户信息 |
| `POST` | `/api/user/favorites` | 新增收藏 |
| `DELETE` | `/api/user/favorites/:id` | 删除收藏 |
| `GET` | `/api/user/favorites` | 收藏列表 |
| `POST` | `/api/user/history` | 写入浏览历史 |
| `GET` | `/api/user/history` | 浏览历史列表 |

### 后台接口

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| `POST` | `/api/admin/auth/login` | 管理员登录 |
| `GET` | `/api/admin/dashboard/summary` | 仪表盘摘要 |
| `POST` | `/api/admin/content/validate` | 内容校验 |
| `POST` | `/api/admin/aircraft` | 新建航空器 |
| `PUT` | `/api/admin/aircraft/:id` | 更新航空器 |
| `POST` | `/api/admin/content/submit-review` | 提交审核 |
| `POST` | `/api/admin/content/approve` | 审核通过 |
| `POST` | `/api/admin/content/reject` | 审核驳回 |
| `GET` | `/api/admin/audit-logs` | 审计日志 |
| `POST` | `/api/admin/media/upload` | 媒体上传 |

## 一个最小联调流程

### 1. 搜索内容

在原型页顶部搜索框输入关键词，例如：

- `喷气时代最有代表性的客机`
- `波音`
- `乔·萨特`

点击“自然语言搜索”后，原型会调用 `/api/public/search` 并刷新结果区。

### 2. 执行后台校验

进入“后台管理”页后，点击“执行字段校验”，原型会调用：

- `/api/admin/auth/login`
- `/api/admin/content/validate`

如果缺少航程、来源等字段，右侧会显示告警。

### 3. 提交审核

在后台表单补充来源后点击“提交审核”，原型会依次调用：

- `/api/admin/aircraft`
- `/api/admin/content/submit-review`
- `/api/admin/dashboard/summary`

这个流程可以完整展示“录入 -> 校验 -> 提审 -> 摘要刷新”的闭环。

## 示例请求

### 搜索

```bash
curl "http://localhost:3001/api/public/search?q=A380"
```

### 管理员登录

```bash
curl -X POST "http://localhost:3001/api/admin/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"Admin123!\"}"
```

### 航空器内容校验

```bash
curl -X POST "http://localhost:3001/api/admin/content/validate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d "{\"nameZh\":\"波音 747\",\"aircraftType\":\"客机\",\"summary\":\"经典巨型远程客机\",\"rangeKm\":0,\"source\":\"\"}"
```

## 数据模型概览

当前种子数据至少包含以下实体：

- `aircraft`
- `events`
- `persons`
- `users`
- `sessions`
- `favorites`
- `browsingHistory`
- `approvalWorkflows`
- `approvalTasks`
- `reviewComments`
- `auditLogs`
- `contentRevisions`

默认种子样例包括：

- 航空器：空客 A380、波音 747、协和式
- 事件：喷气时代来临
- 人物：乔·萨特

## 智能体与文档资产

仓库中已经整理了一批对后续开发很有用的资料：

- 智能体说明：`./.trae/agents/flight-encyclopedia-agent.md`
- 前端 PRD：`./.trae/documents/飞行者图鉴-前端PRD.md`
- 前端技术架构：`./.trae/documents/飞行者图鉴-前端技术架构.md`
- 前端设计执行包：`./frontend-design/frontend-design-package.md`
- 后端部署说明：`./backend/DEPLOY.md`
- 赛题规则：`./.trae/rules/hackathon.md`

如果你想继续把项目做完整，建议优先阅读这些文档，再开始正式前端工程搭建和 AI 服务接入。

## 推荐开发顺序

如果接下来要继续推进，我建议按这个顺序走：

1. 搭建真实前端工程，把原型页面迁移到 `Next.js`
2. 补齐事件、人物详情与后台 CRUD
3. 将本地 JSON 存储迁移到 PostgreSQL
4. 接入真正的智能问答接口
5. 增加更完整的测试、权限控制和部署脚本

## 风险与注意事项

- `backend/data/db.json` 是可变演示数据，提交前注意不要把临时脏数据当成正式内容
- 当前 Token 和会话机制是 Demo 方案，不适合直接上线
- 上传文件当前保存在本地目录，生产环境建议迁移到对象存储
- 原型展示里部分内容是静态示例，不能等同于全部功能都已实现

## 适合答辩时强调的亮点

- 不只是“航空百科”，而是把搜索、对比、导览、后台运营串成了完整闭环
- 兼顾了前台用户体验和后台内容治理
- 对“非专业用户可理解”做了明显优化，适合科普场景
- 已经预留智能助手、时间线、知识图谱等扩展方向

## License

当前仓库未提供单独的许可证文件。如需开源或分发，建议后续补充 `LICENSE`。
