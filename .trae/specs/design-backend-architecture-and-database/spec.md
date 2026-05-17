# 赛题三后端架构与数据库设计 Spec

## Why
赛题三要求作品同时具备前台知识展示、搜索浏览、飞行器对比与后台内容管理能力。当前项目尚未定义后端技术框架、数据模型、管理流程与部署结构，容易导致前后端接口不稳定、字段定义不统一、对比功能难以实现、后台录入无法校验、后续扩展 AI 问答与推荐困难。需要先建立一套适合单台 Ubuntu 服务器部署的后端与数据库方案，为 Demo 快速落地和后续扩展提供稳定基础。

## What Changes
- 新增一份面向赛题三的后端总体架构方案，覆盖 API 服务、数据库、缓存、文件存储、搜索、后台管理与 AI 能力接入
- 明确适合单台 Ubuntu 服务器的推荐技术栈与部署拓扑，支持你现有服务器 `8.162.14.195`
- 明确后端语言固定为 `Node.js`，框架采用 `NestJS`
- 明确前台用户登录方式只采用账号密码登录
- 定义航空器、航空事件、航空人物三类核心实体的数据结构、关联关系与后台录入规则
- 设计支持飞行器横向对比的数据模型，优先覆盖外观、尺寸、速度、航程、发动机类型、首飞年份等赛题要求字段
- 定义前台用户登录、收藏、浏览历史，以及单级严格审核流、版本记录、来源标注、字段校验、媒体资源管理与操作日志等后台支撑能力
- 给出数据库表拆分、主键与索引策略、典型查询场景与后续扩展方向

## Impact
- Affected specs: 后端架构、数据库设计、后台管理、内容建模、部署方案
- Affected code: `.trae/specs/design-backend-architecture-and-database/spec.md`

## Recommended Stack

### Requirement: 单机可落地的后端技术栈
系统 SHALL 采用适合竞赛 Demo、易部署、易扩展、适合单台 Ubuntu 服务器运行的分层架构。

#### Scenario: 推荐技术选型明确
- **WHEN** 团队开始搭建后端
- **THEN** 后端语言固定为 `Node.js`
- **THEN** 推荐采用 `NestJS + PostgreSQL + Redis + MinIO + Nginx + Docker Compose`
- **THEN** 后端 API 推荐使用 `REST` 为主，便于前台展示页、后台管理页和后续移动端共用
- **THEN** ORM 推荐使用 `Prisma`，便于快速建模、迁移与联表查询
- **THEN** 搜索能力在 MVP 阶段优先使用 PostgreSQL 全文检索；数据量增大后可扩展 Elasticsearch

#### Scenario: 服务器资源友好
- **WHEN** 系统部署在单台 Ubuntu 服务器 `8.162.14.195`
- **THEN** 所有核心服务必须支持通过 Docker Compose 编排部署
- **THEN** 必须允许使用一套数据库实例同时承载前台查询和后台管理
- **THEN** 文件存储在 MVP 阶段可优先使用 MinIO 或本地挂载目录，避免过早引入复杂云依赖

### Requirement: 分层后端架构
系统 SHALL 按接入层、业务层、数据层、基础设施层拆分，以保证功能清晰、便于协作和后续扩展。

#### Scenario: 接入层职责明确
- **WHEN** 前端、后台或智能问答模块访问后端
- **THEN** 请求必须先进入 API Gateway 层，由 Nginx 负责 HTTPS、反向代理、静态资源转发与基础限流
- **THEN** API 服务必须按公开接口和后台接口分组，例如 `/api/public/*` 与 `/api/admin/*`

#### Scenario: 业务层模块化
- **WHEN** 后端实现业务能力
- **THEN** 至少拆分以下模块：前台用户、后台用户与权限、航空器、事件、人物、媒体资源、搜索、对比、推荐、收藏、浏览历史、审核流、AI 问答、审计日志
- **THEN** 每个模块必须独立维护 DTO、Service、Controller、Repository 与校验规则

#### Scenario: 数据层职责明确
- **WHEN** 业务模块访问持久化数据
- **THEN** 结构化数据必须存入 PostgreSQL
- **THEN** 热点查询、验证码、会话、限流计数与短期缓存必须优先存入 Redis
- **THEN** 图片与富媒体文件必须存入对象存储或本地媒体目录，并在数据库中只保存元数据和访问地址

## Architecture Blueprint

### Requirement: 面向赛题功能的后端模块设计
系统 SHALL 具备满足赛题三核心要求的后端服务边界，并支持后续增加知识图谱、时间轴与推荐能力。

#### Scenario: 前台能力可被后端支撑
- **WHEN** 用户在前台浏览内容
- **THEN** 后端必须支持航空器、事件、人物三类内容的列表、详情、搜索、筛选、相关推荐与基础统计
- **THEN** 后端必须支持多机型对比接口，能一次返回多架航空器的统一字段
- **THEN** 后端必须支持按标签、年代、国家、用途、制造商等维度筛选
- **THEN** 后端必须支持前台用户注册登录、收藏实体、记录浏览历史与查看个人收藏列表

#### Scenario: 后台能力可被后端支撑
- **WHEN** 管理员进入后台
- **THEN** 后端必须支持新增、编辑、提交审核、审核通过、审核驳回、发布、下线、草稿保存与字段校验
- **THEN** 后端必须支持图片上传、封面设置、来源信息登记与版本留痕
- **THEN** 后端必须支持字段缺失检查、单位格式校验与基础冲突检测

#### Scenario: 严格审核流生效
- **WHEN** 内容从后台进入前台
- **THEN** 未经过审核通过的内容不得直接发布到前台
- **THEN** 内容必须至少经过“编辑提交 -> 审核人审核 -> 通过后发布或驳回修改”的流程
- **THEN** 审核流程必须记录审核人、审核意见、审核时间与对应版本号

#### Scenario: 智能能力具备接入点
- **WHEN** 项目接入“飞行者图鉴智能导览助手”
- **THEN** 后端必须预留问答上下文接口，能够按实体聚合返回结构化数据
- **THEN** 后端必须能记录 AI 请求日志、上下文实体 ID、回答摘要与人工复核状态

### Requirement: API 规划清晰
系统 SHALL 对公开接口和后台接口进行清晰分组，确保前后端联调高效。

#### Scenario: 公开接口清单完整
- **WHEN** 前台调用公开 API
- **THEN** 必须至少提供以下接口组：
- `GET /api/public/aircraft`
- `GET /api/public/aircraft/:id`
- `POST /api/public/aircraft/compare`
- `GET /api/public/events`
- `GET /api/public/events/:id`
- `GET /api/public/persons`
- `GET /api/public/persons/:id`
- `GET /api/public/search`
- `GET /api/public/recommendations`

#### Scenario: 前台用户接口清单完整
- **WHEN** 前台已接入用户中心
- **THEN** 必须至少提供以下接口组：
- `POST /api/user/auth/register`
- `POST /api/user/auth/login`
- `POST /api/user/auth/refresh`
- `POST /api/user/auth/logout`
- `GET /api/user/profile`
- `POST /api/user/favorites`
- `DELETE /api/user/favorites/:id`
- `GET /api/user/favorites`
- `POST /api/user/history`
- `GET /api/user/history`
- **THEN** 前台登录方式只支持账号密码，不扩展短信验证码登录和邮箱验证码登录

#### Scenario: 后台接口清单完整
- **WHEN** 后台调用管理 API
- **THEN** 必须至少提供以下接口组：
- `POST /api/admin/auth/login`
- `GET /api/admin/dashboard/summary`
- `POST /api/admin/aircraft`
- `PUT /api/admin/aircraft/:id`
- `POST /api/admin/events`
- `POST /api/admin/persons`
- `POST /api/admin/media/upload`
- `POST /api/admin/content/validate`
- `POST /api/admin/content/submit-review`
- `POST /api/admin/content/approve`
- `POST /api/admin/content/reject`
- `GET /api/admin/audit-logs`

## Database Design

### Requirement: 核心实体模型完整
系统 SHALL 使用关系型数据库保存三大内容实体、关系映射、媒体资源、来源信息和后台管理数据。

#### Scenario: 核心表具备可扩展结构
- **WHEN** 设计数据库
- **THEN** 必须至少包含以下核心表：
- `users`
- `roles`
- `user_roles`
- `user_sessions`
- `user_favorites`
- `user_browsing_history`
- `aircraft`
- `aircraft_images`
- `aircraft_specs`
- `events`
- `event_images`
- `persons`
- `person_images`
- `tags`
- `entity_tags`
- `relations_aircraft_events`
- `relations_aircraft_persons`
- `relations_event_persons`
- `sources`
- `entity_sources`
- `content_revisions`
- `approval_workflows`
- `approval_tasks`
- `review_comments`
- `audit_logs`
- `ai_qa_logs`

### Requirement: 用户体系支撑前台登录与个人行为
系统 SHALL 区分前台普通用户与后台审核管理用户，并支持登录态、收藏与浏览历史。

#### Scenario: 用户主表兼容多角色
- **WHEN** 设计 `users` 表
- **THEN** 必须至少包含以下字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | bigint / uuid | 主键 |
| `username` | varchar(60) unique | 用户名 |
| `email` | varchar(120) unique | 邮箱，可空但建议保留 |
| `phone` | varchar(30) unique | 手机号，可空 |
| `password_hash` | varchar(255) | 密码哈希 |
| `user_type` | varchar(30) | `frontend_user` 或 `admin_user` |
| `status` | varchar(30) | 正常、禁用、待激活 |
| `nickname` | varchar(80) | 昵称 |
| `avatar_url` | varchar(255) | 头像地址，可空 |
| `last_login_at` | timestamp | 最近登录时间 |
| `created_at` | timestamp | 创建时间 |
| `updated_at` | timestamp | 更新时间 |

#### Scenario: 账号密码登录边界明确
- **WHEN** 设计前台登录能力
- **THEN** 登录凭证以 `username` 加 `password_hash` 为主
- **THEN** `email` 与 `phone` 字段只作为资料补充或后续扩展预留，不作为本期登录主流程必需能力

#### Scenario: 会话管理独立
- **WHEN** 用户登录系统
- **THEN** 必须使用 `user_sessions` 存储刷新令牌、设备信息、过期时间与吊销状态
- **THEN** JWT 访问令牌应保持短时有效，刷新令牌应支持单设备失效控制

#### Scenario: 收藏与浏览行为可追踪
- **WHEN** 前台用户收藏或浏览内容
- **THEN** 必须使用 `user_favorites` 记录用户收藏的实体类型、实体 ID、收藏时间
- **THEN** 必须使用 `user_browsing_history` 记录用户浏览的实体类型、实体 ID、最近浏览时间、浏览次数
- **THEN** 收藏表必须限制同一用户对同一实体不能重复收藏

### Requirement: 收藏与浏览历史结构清晰
系统 SHALL 为推荐和个人中心提供稳定的数据基础。

#### Scenario: 收藏表字段完整
- **WHEN** 设计 `user_favorites` 表
- **THEN** 必须至少包含 `id`、`user_id`、`entity_type`、`entity_id`、`created_at`

#### Scenario: 浏览历史表字段完整
- **WHEN** 设计 `user_browsing_history` 表
- **THEN** 必须至少包含 `id`、`user_id`、`entity_type`、`entity_id`、`view_count`、`first_viewed_at`、`last_viewed_at`
- **THEN** 同一用户与同一实体的浏览历史应使用唯一约束或幂等更新策略

### Requirement: 航空器数据结构满足对比场景
系统 SHALL 将飞行器对比高频字段结构化存储，避免全部塞入 JSON，保证查询和排序能力。

#### Scenario: 航空器主表信息完整
- **WHEN** 新建航空器条目
- **THEN** `aircraft` 表必须至少包含以下字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | bigint / uuid | 主键 |
| `slug` | varchar(120) unique | 前台友好地址 |
| `name_zh` | varchar(120) | 中文名称 |
| `name_en` | varchar(120) | 英文名称，可空 |
| `aircraft_type` | varchar(50) | 机型分类，如客机、战斗机、直升机、无人机 |
| `manufacturer` | varchar(120) | 制造商 |
| `country_of_origin` | varchar(80) | 原产国或地区 |
| `first_flight_date` | date | 首飞日期，可只保留年份映射 |
| `service_entry_date` | date | 服役或投入使用日期，可空 |
| `status` | varchar(30) | 草稿、已发布、已下线 |
| `summary` | text | 面向前台的一句话简介 |
| `description` | text | 详细介绍 |
| `cover_image_id` | bigint / uuid | 封面图 |
| `era_label` | varchar(50) | 所属年代标签，例如二战、喷气时代 |
| `created_by` | bigint / uuid | 创建人 |
| `updated_by` | bigint / uuid | 更新人 |
| `published_at` | timestamp | 发布时间 |
| `created_at` | timestamp | 创建时间 |
| `updated_at` | timestamp | 更新时间 |

#### Scenario: 航空器参数表适合对比
- **WHEN** 保存航空器参数
- **THEN** `aircraft_specs` 表必须与 `aircraft` 一对一关联
- **THEN** 必须优先结构化保存以下字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `aircraft_id` | fk | 对应航空器 |
| `length_m` | decimal(8,2) | 机长，单位米 |
| `wingspan_m` | decimal(8,2) | 翼展，单位米 |
| `height_m` | decimal(8,2) | 机高，单位米 |
| `max_speed_kmh` | integer | 最大速度，公里/小时 |
| `cruise_speed_kmh` | integer | 巡航速度 |
| `range_km` | integer | 最大航程，公里 |
| `ceiling_m` | integer | 实用升限，可空 |
| `engine_type` | varchar(80) | 发动机类型，如涡扇、活塞、涡桨 |
| `engine_count` | smallint | 发动机数量 |
| `powerplant_model` | varchar(120) | 发动机型号，可空 |
| `crew_capacity` | smallint | 机组人数，可空 |
| `passenger_capacity` | integer | 载客量，可空 |
| `max_takeoff_weight_kg` | integer | 最大起飞重量，可空 |
| `unit_notes` | text | 单位换算和说明 |
| `spec_source_confidence` | varchar(20) | 参数可信度，已核实/待确认 |
| `updated_at` | timestamp | 更新时间 |

#### Scenario: 航空器图片管理独立
- **WHEN** 条目包含多张图片
- **THEN** `aircraft_images` 表必须独立保存图片元数据，支持缩略图、排序、版权说明与来源标注

### Requirement: 航空事件数据结构清晰
系统 SHALL 支持事故、首航、纪录突破、技术里程碑等事件的结构化管理。

#### Scenario: 事件主表信息完整
- **WHEN** 新建事件条目
- **THEN** `events` 表必须至少包含以下字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | bigint / uuid | 主键 |
| `slug` | varchar(120) unique | 前台友好地址 |
| `title` | varchar(160) | 事件标题 |
| `event_type` | varchar(50) | 事故、首航、首飞、纪录、技术突破等 |
| `event_date` | date | 事件日期 |
| `location_name` | varchar(160) | 发生地点 |
| `summary` | text | 一句话摘要 |
| `description` | text | 完整说明 |
| `impact` | text | 对航空发展的影响 |
| `status` | varchar(30) | 草稿、已发布、已下线 |
| `cover_image_id` | bigint / uuid | 封面图 |
| `created_by` | bigint / uuid | 创建人 |
| `updated_by` | bigint / uuid | 更新人 |
| `created_at` | timestamp | 创建时间 |
| `updated_at` | timestamp | 更新时间 |

### Requirement: 航空人物数据结构清晰
系统 SHALL 支持飞行员、设计师、工程师、企业家、航空科学家等人物的结构化管理。

#### Scenario: 人物主表信息完整
- **WHEN** 新建人物条目
- **THEN** `persons` 表必须至少包含以下字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | bigint / uuid | 主键 |
| `slug` | varchar(120) unique | 前台友好地址 |
| `name_zh` | varchar(120) | 中文名 |
| `name_en` | varchar(120) | 英文名，可空 |
| `person_type` | varchar(50) | 飞行员、设计师、工程师等 |
| `birth_date` | date | 出生日期，可空 |
| `death_date` | date | 逝世日期，可空 |
| `nationality` | varchar(80) | 国籍 |
| `summary` | text | 一句话简介 |
| `biography` | text | 生平与贡献 |
| `status` | varchar(30) | 草稿、已发布、已下线 |
| `cover_image_id` | bigint / uuid | 封面图 |
| `created_by` | bigint / uuid | 创建人 |
| `updated_by` | bigint / uuid | 更新人 |
| `created_at` | timestamp | 创建时间 |
| `updated_at` | timestamp | 更新时间 |

### Requirement: 关联关系支持知识联动
系统 SHALL 通过关系表打通航空器、事件、人物之间的知识连接，支撑相关推荐、时间轴与知识图谱扩展。

#### Scenario: 实体之间可双向关联
- **WHEN** 后台维护实体关系
- **THEN** 必须支持以下关系表：

| 关系表 | 说明 |
| --- | --- |
| `relations_aircraft_events` | 某航空器参与或关联某事件 |
| `relations_aircraft_persons` | 某人物设计、驾驶、制造、研究某航空器 |
| `relations_event_persons` | 某人物参与某事件 |

- **THEN** 每个关系表至少包含 `id`、左右实体 ID、`relation_type`、`description`、`sort_order`、`created_at`

### Requirement: 标签、来源与版本记录可追踪
系统 SHALL 支持内容标签化管理、来源追溯与版本回滚参考。

#### Scenario: 标签与来源具备统一规范
- **WHEN** 内容运营录入条目
- **THEN** 必须支持 `tags` 与 `entity_tags` 进行多对多标签关联
- **THEN** 必须支持 `sources` 与 `entity_sources` 记录数据来源、来源类型、链接、摘录与可信度等级
- **THEN** 必须支持 `content_revisions` 保存编辑前后的快照摘要，便于审查和回溯

### Requirement: 严格审核流可落地
系统 SHALL 使用独立审核流表管理提交、审核、驳回和发布，不允许仅靠状态字段粗放处理。

#### Scenario: 审核流表结构完整
- **WHEN** 设计严格审核流
- **THEN** 必须包含以下表：

| 表名 | 说明 |
| --- | --- |
| `approval_workflows` | 审核流主表，记录实体、当前阶段、当前状态 |
| `approval_tasks` | 审核任务表，记录待谁审核、审核结果、处理时间 |
| `review_comments` | 审核意见表，记录驳回原因、修改建议、备注 |
- **THEN** 审核流只实现单级审核，不设计初审、终审等多级审批链路

#### Scenario: 审核流关键字段明确
- **WHEN** 设计 `approval_workflows` 表
- **THEN** 必须至少包含 `id`、`entity_type`、`entity_id`、`revision_id`、`submitter_id`、`current_reviewer_id`、`workflow_status`、`submitted_at`、`completed_at`

#### Scenario: 审核任务可追踪
- **WHEN** 设计 `approval_tasks` 表
- **THEN** 必须至少包含 `id`、`workflow_id`、`reviewer_id`、`task_status`、`decision`、`processed_at`、`created_at`
- **THEN** `decision` 至少支持 `pending`、`approved`、`rejected`
- **THEN** 每次内容提审只生成一个待处理审核任务，由单一审核人完成通过或驳回

### Requirement: 后台安全与运营表完整
系统 SHALL 具备基础权限控制、日志追踪和 AI 记录能力。

#### Scenario: 后台操作可审计
- **WHEN** 管理员登录、编辑或删除内容
- **THEN** 必须写入 `audit_logs`
- **THEN** 日志必须记录 `operator_id`、操作对象类型、对象 ID、操作类型、变更摘要、IP、时间

#### Scenario: AI 输出可回查
- **WHEN** 智能助手生成回答或校验建议
- **THEN** 必须写入 `ai_qa_logs`
- **THEN** 日志必须记录问题、命中实体、答案摘要、模型标识、是否人工复核、时间

## Index Strategy

### Requirement: 高频查询必须有索引支撑
系统 SHALL 为列表筛选、详情访问、搜索和关系查询建立必要索引。

#### Scenario: 主查询索引完整
- **WHEN** 建立 PostgreSQL 索引
- **THEN** 必须至少建立以下索引：
- `users(username)` 唯一索引
- `users(email)` 唯一索引
- `user_sessions(user_id, revoked_at, expires_at)`
- `user_favorites(user_id, entity_type, entity_id)` 唯一索引
- `user_browsing_history(user_id, entity_type, entity_id)` 唯一索引
- `aircraft(slug)` 唯一索引
- `aircraft(status, aircraft_type, first_flight_date desc)` 组合索引
- `aircraft(manufacturer)`
- `aircraft(country_of_origin)`
- `aircraft_specs(engine_type, range_km, max_speed_kmh)`
- `events(slug)` 唯一索引
- `events(event_type, event_date desc)`
- `persons(slug)` 唯一索引
- `persons(person_type, nationality)`
- `entity_tags(entity_type, entity_id, tag_id)`
- `approval_workflows(entity_type, entity_id, workflow_status)`
- `approval_tasks(workflow_id, reviewer_id, task_status)`
- 各关系表上的左右实体 ID 组合索引

#### Scenario: 搜索索引可扩展
- **WHEN** 平台需要关键词搜索
- **THEN** `aircraft`、`events`、`persons` 的标题和简介字段必须建立全文检索向量列或 trigram 索引
- **THEN** 搜索结果必须支持按实体类型、相关性和发布时间排序

## Data Validation Rules

### Requirement: 后台录入具备字段校验
系统 SHALL 在保存前执行结构化校验，降低错漏数据进入前台的风险。

#### Scenario: 航空器录入校验
- **WHEN** 管理员保存航空器条目
- **THEN** 必须校验 `name_zh`、`aircraft_type`、`summary`、`description`、封面图、至少一项来源信息
- **THEN** 对比核心字段如 `length_m`、`wingspan_m`、`max_speed_kmh`、`range_km`、`engine_type`、`first_flight_date` 缺失时必须提示“建议补充”
- **THEN** 单位必须统一为米、公里、公里/小时、千克，前台如需英制单位再做转换

#### Scenario: 时间与逻辑校验
- **WHEN** 保存事件或人物信息
- **THEN** 必须校验时间字段不能出现明显冲突，例如逝世日期早于出生日期、事件日期晚于录入描述中的历史时期结论
- **THEN** 对“待确认”字段必须允许保存，但必须标注可信度状态

#### Scenario: 审核提交校验
- **WHEN** 编辑人员提交内容审核
- **THEN** 若必填字段、封面图、来源信息或核心参数缺失，系统不得进入审核通过阶段
- **THEN** 驳回时必须填写驳回原因或修改建议

## Deployment Design

### Requirement: Ubuntu 单机部署方案清晰
系统 SHALL 支持在 Ubuntu 服务器 `8.162.14.195` 上完成一键式或接近一键式部署。

#### Scenario: 容器部署拓扑明确
- **WHEN** 部署到 Ubuntu
- **THEN** 推荐使用以下容器：
- `nginx`: 80/443 入口，负责 HTTPS 和静态代理
- `app`: NestJS API 服务
- `postgres`: 主数据库
- `redis`: 缓存与会话
- `minio`: 图片和附件存储
- **THEN** 所有服务必须置于 Docker Compose 同一网络内

#### Scenario: 基础安全配置明确
- **WHEN** 服务器对外提供访问
- **THEN** 必须仅开放 `22`、`80`、`443` 等必要端口
- **THEN** PostgreSQL、Redis、MinIO 管理端口默认不直接暴露公网
- **THEN** 必须启用数据库强密码、JWT 密钥、对象存储访问密钥和环境变量隔离

#### Scenario: 目录规划清晰
- **WHEN** 规划服务器目录
- **THEN** 推荐目录结构如下：

```text
/opt/flyer-guide/
  docker-compose.yml
  .env
  /nginx
  /app
  /data/postgres
  /data/redis
  /data/minio
  /backups
```

## Suggested Roadmap

### Requirement: MVP 开发顺序合理
系统 SHALL 按赛题优先级安排开发，优先保证演示闭环。

#### Scenario: 第一阶段聚焦闭环
- **WHEN** 团队进入 MVP 开发
- **THEN** 必须优先完成前台用户登录、航空器管理、航空器详情、搜索、对比、图片上传、收藏与浏览历史
- **THEN** 事件与人物模块可先完成基础 CRUD 与详情页

#### Scenario: 第二阶段提升亮点
- **WHEN** 基础闭环稳定后
- **THEN** 再补充严格审核流全链路、相关推荐、AI 问答、来源校验、时间轴和后台数据质量提示

## Open Questions
- 是否需要保存用户自定义对比方案；如需要，可补充 `comparison_sets` 与 `comparison_items` 表
