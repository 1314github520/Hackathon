# 飞行者图鉴 Web 联调前端

这是“飞行者图鉴”项目的 Next.js 联调前端，用来验证公开接口、前台用户接口和后台管理接口是否能和 Node.js 后端联通。

## 运行方式

### 1. 安装依赖

```bash
cd frontend-design/web
npm install
```

### 2. 环境变量

项目默认通过 Next.js rewrite 把 `/api-bridge/*` 代理到后端服务。

本地联调服务器后端时，使用：

```env
NEXT_PUBLIC_API_BASE=/api-bridge
API_SERVER_URL=http://8.162.14.195:3001
```

对应文件：

- [`.env.local`](file:///C:/Users/Luck/Desktop/Hackathon/frontend-design/web/.env.local)
- [`.env.example`](file:///C:/Users/Luck/Desktop/Hackathon/frontend-design/web/.env.example)

如果把前端也部署到服务器，推荐使用：

```env
NEXT_PUBLIC_API_BASE=/api-bridge
API_SERVER_URL=http://127.0.0.1:3001
```

对应文件：

- [`.env.production`](file:///C:/Users/Luck/Desktop/Hackathon/frontend-design/web/.env.production)

### 3. 启动前端

```bash
npm run dev
```

默认访问地址：

- 前端页面：`http://localhost:3000`

## 当前已联调页面

- `/`：健康检查、航空器、事件、人物
- `/search`：混合搜索
- `/compare`：飞行器对比
- `/aircraft/[slug]`：详情、推荐、浏览历史、收藏
- `/user/login`：前台注册与登录
- `/me`：用户信息校验、收藏、取消收藏、浏览历史、退出
- `/admin/login`：管理员登录
- `/admin/dashboard`：后台摘要、校验、新建、更新、提审、审核、审计日志

## 代理配置

rewrite 配置见 [next.config.ts](file:///C:/Users/Luck/Desktop/Hackathon/frontend-design/web/next.config.ts)。

默认规则：

- 浏览器请求 `/api-bridge/*`
- Next.js 转发到 `API_SERVER_URL`

这样前端不需要直接跨域访问后端，联调更稳定。

## 联调建议

推荐按这个顺序检查：

1. 打开首页确认健康检查为 `ok`
2. 登录前台用户并进入 `/me`
3. 打开任意航空器详情页，验证浏览历史与收藏
4. 登录管理员并进入 `/admin/dashboard`
5. 依次验证校验、新建、更新、提审、审核
