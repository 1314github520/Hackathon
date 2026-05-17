# [OPEN] frontend-swc-error

## 背景
- 症状：前端执行 `npm run dev` 时，Next.js 启动后报 `Failed to load SWC binary for win32/x64`
- 环境：Windows，本地开发环境，项目路径 `frontend-design/web`

## 当前假设
- 假设 1：本机 Node.js 架构与安装的 `@next/swc-win32-x64-msvc` 二进制不匹配
- 假设 2：`node_modules` 中的 SWC 原生模块损坏或下载不完整
- 假设 3：依赖安装过程被中断，导致可选依赖 `@next/swc-*` 未正确落盘
- 假设 4：本机系统缺失 SWC 运行依赖，导致 `.node` 文件被判定为无效 Win32 应用程序
- 假设 5：存在缓存或锁文件污染，导致当前安装结果和实际平台不一致

## 调试计划
1. 收集 Node/NPM 架构与版本信息
2. 检查 `@next/swc-win32-x64-msvc` 安装状态与文件存在性
3. 复现启动错误并核对完整日志
4. 基于证据给出最小修复方案

## 结果
- 待确认
