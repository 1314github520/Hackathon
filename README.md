# 飞行者图鉴

面向“赛题三：飞行者图鉴”打造的航空科普知识平台 Demo，围绕航空器、航空事件、航空人物三类内容，提供前台浏览搜索、多机型对比，以及后台录入校验与审核演示能力。

## 目录

- [项目概览](#项目概览)
- [仓库包含什么](#仓库包含什么)
- [赛题覆盖情况](#赛题覆盖情况)
- [已实现能力](#已实现能力)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [演示账号与数据](#演示账号与数据)
- [开发命令](#开发命令)
- [推荐演示路线](#推荐演示路线)
- [目录结构](#目录结构)
- [关键页面与接口](#关键页面与接口)
- [相关文档](#相关文档)
- [当前边界](#当前边界)
- [后续建议](#后续建议)
- [License](#license)

## 项目概览

`飞行者图鉴` 不是单一的信息展示页，而是一个围绕航空科普场景设计的完整 Demo：

- 前台面向普通用户，强调“看得懂、搜得到、能比较”
- 后台面向运营和评审演示，强调“可录入、可校验、可审核”
- 数据层同时支持本地 JSON 和 MySQL，便于快速演示与后续扩展
- 仓库内保留了产品文档、技术架构稿、原型稿和实现代码，适合继续打磨成正式参赛作品

这个仓库当前最适合用于三类场景：

- 黑客松现场演示
- 课程作业或比赛答辩材料整理
- 后续继续扩展成完整航空知识平台

## 仓库包含什么

本项目由三个核心部分组成：

| 模块 | 位置 | 作用 |
| --- | --- | --- |
| 联调前端 | `frontend-design/web` | 基于 Next.js 的真实可运行 Web Demo，展示前台与后台主要流程 |
| 后端服务 | `backend` | 基于 Express 的本地 API 服务，负责公开内容、用户能力和后台管理接口 |
| 设计与文档资产 | `frontend-design/prototype`、`.trae/documents` | 保留原型、PRD、技术架构、竞赛规则等资料 |

## 赛题覆盖情况

下面按赛题三的基础要求整理当前仓库的覆盖状态：

| 赛题要求 | 当前状态 | 说明 |
| --- | --- | --- |
| 浏览航空器、事件、人物 | 已覆盖 | 首页、搜索页、事件列表、人物列表、航空器详情已可演示 |
| 搜索三类内容 | 已覆盖 | 支持航空器、事件、人物混合搜索，也可按实体类型筛选 |
| 航空器横向对比 | 已覆盖 | 支持尺寸、速度、航程、发动机类型、首飞年份等核心维度 |
| 面向非专业用户的结构化展示 | 已覆盖 | 页面文案偏科普表达，重点参数集中展示 |
| 后台新增、编辑、删除内容 | 部分覆盖 | 已支持航空器新增、更新、校验、提审、审核；删除入口暂未提供 |
| 上传图片及关键参数 | 已覆盖 | 后台支持图片上传和结构化字段录入 |
| 字段完整性校验 | 已覆盖 | 后台支持阻塞项与建议项校验 |

如果用于答辩，建议主动说明“后台内容治理闭环已完成航空器主链路，事件与人物后台管理仍可继续补齐”。

## 已实现能力

### 前台能力

- 首页聚合展示平台亮点、后端健康状态、精选航空器、事件、人物
- 全站搜索支持航空器、事件、人物混合检索
- 航空器详情页支持核心参数、相关推荐、相关事件、相关人物展示
- 对比页支持多架飞机横向对比，并可切换“仅看差异”
- 事件页与人物页已提供基础列表浏览
- 前台用户支持注册、登录、登录态恢复、收藏、浏览历史

### 后台能力

- 管理员账号登录
- 仪表盘摘要统计
- 航空器字段校验
- 航空器新建与更新
- 提交审核、审核通过、审核驳回
- 审核队列查看
- 审计日志查看
- 图片上传

### 数据与存储

- 默认不配置数据库时，可直接使用本地 JSON 数据启动
- 已接入 Prisma，可切换到 MySQL
- JSON 模式首次启动时会自动生成演示种子数据
- 默认种子数据包含 3 架航空器、1 条事件、1 位人物和 2 个演示账号

## 技术栈

### 前端

- `Next.js 16`
- `React 19`
- `TypeScript`
- `Tailwind CSS 4`
- `Zustand`
- `ESLint`
- `Vitest`

### 后端

- `Node.js`
- `Express`
- `Prisma`
- `MySQL`
- `multer`
- `cors`

### 包管理与工程化

- 包管理器：`npm`
- 前后端均已包含 `package-lock.json`

## 快速开始

### 环境要求

- `Node.js 18+`，推荐 `Node.js 20 LTS`
- `npm`

### 1. 启动后端

后端默认端口为 `9001`。如果没有设置数据库环境变量，服务会以本地 JSON 模式运行。

```bash
cd backend
npm install
npm run dev
```

启动成功后可访问：

- API 根地址：`http://localhost:9001`
- 健康检查：`http://localhost:9001/health`

### 2. 启动前端

前端默认端口为 `9000`，通过 Next.js rewrite 将 `/api-bridge/*` 转发到后端服务。

```bash
cd frontend-design/web
npm install
npm run dev
```

启动成功后访问：

- Web 页面：`http://localhost:9000`

### 3. 可选：切换到 MySQL

后端已经提供 Prisma Schema 和 MySQL 迁移脚本。需要 MySQL 时，可以按下面的顺序配置：

1. 直接修改 `backend/.env`
2. 补充 `.env` 中的 `DATABASE_URL`
3. 将 `DATABASE_PROVIDER` 设为 `mysql`
4. 执行以下命令

```bash
cd backend
npm run db:generate
npm run db:push
```

如果要把现有 JSON 演示数据导入 MySQL，可继续执行：

```bash
cd backend
npm run db:seed:mysql
```

### 4. 可选：显式配置前端环境变量

本地联调通常不需要额外配置，因为前端已经内置默认值：

- `NEXT_PUBLIC_API_BASE=/api-bridge`
- `API_SERVER_URL=http://localhost:9001`

如果你希望手动指定，可直接编辑 `frontend-design/web/.env`：

```env
NEXT_PUBLIC_API_BASE=/api-bridge
API_SERVER_URL=http://localhost:9001
```

### 5. 可选：查看静态原型

如果你想展示更偏视觉方案的原型稿，而不是联调版页面，可以单独启动静态文件服务：

```bash
python -m http.server 4173
```

然后访问：

- `http://localhost:4173/frontend-design/prototype/`

## 演示账号与数据

本地种子数据内置了两个账号：

| 角色 | 账号 | 密码 |
| --- | --- | --- |
| 管理员 | `admin` | `Admin123!` |
| 前台用户 | `demo` | `Demo123!` |

适合演示的数据内容包括：

- 航空器：空客 A380、波音 747、协和式
- 事件：喷气时代来临
- 人物：乔·萨特

## 开发命令

### 后端

在 `backend` 目录下可使用以下命令：

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动后端服务 |
| `npm run start` | 以生产方式启动后端服务 |
| `npm run db:generate` | 生成 Prisma Client |
| `npm run db:push` | 将 Prisma Schema 推送到数据库 |
| `npm run db:migrate` | 执行 Prisma 迁移部署 |
| `npm run db:studio` | 打开 Prisma Studio |
| `npm run db:seed:mysql` | 将 JSON 演示数据导入 MySQL |

### 前端

在 `frontend-design/web` 目录下可使用以下命令：

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动开发环境，端口为 `9000` |
| `npm run build` | 构建生产版本 |
| `npm run start` | 启动生产构建结果，端口为 `9000` |
| `npm run lint` | 执行 ESLint 检查 |
| `npm run test` | 运行 Vitest 测试 |
| `npm run check` | 执行 TypeScript、ESLint 和 Vitest 一体检查 |

## 推荐演示路线

如果你要做比赛答辩，推荐按下面顺序演示：

1. 打开首页，确认后端健康状态为 `ok`
2. 进入 `/search`，演示三类实体混合搜索
3. 打开任意航空器详情页，展示结构化参数、相关事件、相关人物和相关推荐
4. 进入 `/compare`，展示多机型横向对比和“仅看差异”
5. 使用普通用户登录，演示收藏和浏览历史
6. 使用管理员登录，演示字段校验、创建条目、提审、审核和审计日志
7. 最后补充静态原型或产品文档，说明项目可继续扩展的方向

## 目录结构

```text
Hackathon/
├─ README.md
├─ title.md
├─ backend/
│  ├─ data/                     # 本地 JSON 数据
│  ├─ prisma/                   # Prisma Schema
│  ├─ src/
│  │  ├─ server.js              # API 入口
│  │  ├─ db.js                  # JSON / MySQL 存储切换
│  │  ├─ seed.js                # 演示种子数据
│  │  ├─ validation.js          # 航空器字段校验
│  │  └─ scripts/
│  │     └─ migrate-json-to-mysql.js
│  ├─ .env
│  ├─ DEPLOY.md
│  ├─ README.md
│  └─ package.json
├─ frontend-design/
│  ├─ prototype/                # 静态高保真原型
│  ├─ web/                      # Next.js 联调前端
│  │  ├─ app/                   # App Router 页面
│  │  ├─ public/
│  │  ├─ src/
│  │  │  ├─ components/
│  │  │  ├─ lib/
│  │  │  ├─ store/
│  │  │  └─ types/
│  │  ├─ README.md
│  │  └─ package.json
│  └─ frontend-design-package.md
└─ .trae/
   ├─ agents/                   # 智能导览助手提示资产
   ├─ documents/                # PRD 与技术架构稿
   ├─ rules/                    # 竞赛规则
   └─ specs/                    # 任务与规范沉淀
```

## 关键页面与接口

### 当前前端页面

| 路由 | 说明 |
| --- | --- |
| `/` | 首页总览 |
| `/search` | 全站搜索 |
| `/compare` | 航空器对比页 |
| `/aircraft/[slug]` | 航空器详情页 |
| `/events` | 航空事件列表页 |
| `/persons` | 航空人物列表页 |
| `/user/login` | 前台用户登录与注册 |
| `/me` | 个人中心 |
| `/admin/login` | 管理员登录 |
| `/admin/dashboard` | 后台联调与管理演示页 |

### 当前后端接口分类

- 公开接口：航空器、事件、人物、搜索、推荐、对比
- 前台用户接口：注册、登录、刷新令牌、退出、收藏、浏览历史
- 后台管理接口：登录、摘要、航空器管理、审核流、审计日志、媒体上传

详细接口说明请查看：

- `backend/README.md`
- `frontend-design/web/README.md`

## 相关文档

仓库内已经包含多份可直接用于继续开发、部署或整理答辩材料的文档：

- `backend/README.md`：后端接口和本地运行说明
- `backend/DEPLOY.md`：后端部署说明
- `frontend-design/web/README.md`：前端联调说明
- `frontend-design/frontend-design-package.md`：前端设计执行包
- `.trae/documents/飞行者图鉴-前端PRD.md`：产品需求稿
- `.trae/documents/飞行者图鉴-前端技术架构.md`：前端技术架构稿
- `.trae/rules/hackathon.md`：赛题规则原文

## 当前边界

为了避免把当前 Demo 误解为完整生产系统，建议在答辩或交接时明确说明以下边界：

- 后台主流程目前重点覆盖航空器，事件与人物的后台管理链路仍待补齐
- 前端已提供事件和人物列表页，但独立详情页暂未落地
- 后端已经提供事件详情、人物详情接口，前端还没有完全接上这部分页面
- 审核、上传、审计和鉴权流程可演示，但仍属于 Demo 级实现
- 默认本地存储为 JSON，适合联调和展示，不适合直接用于生产环境
- 当前仓库未集成真实的大模型问答服务，智能导览更多体现在产品方向和提示资产层
- 仓库当前没有自动化测试用例，`Vitest` 已接入但测试文件尚未补充

## 后续建议

- 补齐事件与人物详情页，以及后台内容管理页面
- 将搜索结果中的事件与人物卡片接到真实详情页
- 增加删除能力、权限边界控制和更完整的运营流程
- 将演示数据迁移到 MySQL，减少 JSON 模式带来的限制
- 为关键 API 和页面补充自动化测试
- 接入真正的智能问答、相关推荐和知识导览能力

## License

当前仓库未提供单独的 `LICENSE` 文件。如需开源、分发或提交正式成果，建议补充许可证说明。
