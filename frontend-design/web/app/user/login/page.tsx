"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { LoadingState, Notice } from "@/components/ui/feedback";
import { Panel } from "@/components/ui/panel";
import { api } from "@/lib/api/service";
import { writeStoredSession } from "@/lib/session";

export default function UserLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("demo");
  const [password, setPassword] = useState("Demo123!");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const canSubmit = username.trim().length >= 2 && password.trim().length >= 6 && !submitting;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setMessage("");
      if (mode === "register") {
        await api.register({ username, password });
      }

      const session = await api.login({ username, password });
      writeStoredSession("frontend", session);
      setMessage("登录成功，正在进入个人中心。");
      router.push("/me");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "前台登录失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell title="用户登录" subtitle="支持普通用户注册和登录，登录后可查看收藏与浏览历史。">
      <Panel title="账号操作" kicker="POST /api/user/auth/register & /login">
        <form className="grid max-w-xl gap-4" onSubmit={onSubmit}>
          <div className="segmented-control" role="tablist" aria-label="登录或注册">
            <button
              type="button"
              className={mode === "login" ? "action-button" : "ghost-button"}
              onClick={() => setMode("login")}
            >
              登录
            </button>
            <button
              type="button"
              className={mode === "register" ? "action-button" : "ghost-button"}
              onClick={() => setMode("register")}
            >
              注册后登录
            </button>
          </div>
          <div className="auth-tip">
            演示账号可直接使用 `demo / Demo123!`。注册模式下会先创建账号，再自动登录进入个人中心。
          </div>
          <label className="form-field">
            <span className="text-sm text-[var(--muted)]">用户名</span>
            <input
              className="input-base"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              autoComplete="username"
            />
          </label>
          <label className="form-field">
            <span className="text-sm text-[var(--muted)]">密码</span>
            <div className="input-with-action">
              <input
                className="input-base"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
              <button type="button" className="input-inline-button" onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? "隐藏" : "显示"}
              </button>
            </div>
            <span className="field-hint">密码至少 6 位，建议使用大小写字母和数字组合。</span>
          </label>
          <button type="submit" className="action-button" disabled={!canSubmit}>
            {submitting ? "提交中..." : mode === "login" ? "登录前台账号" : "注册并登录"}
          </button>
          {submitting ? <LoadingState label="正在提交账号请求" description="系统正在验证账号并创建会话。" compact /> : null}
          {message ? <Notice tone="success">{message}</Notice> : null}
          {error ? <Notice tone="error">{error}</Notice> : null}
        </form>
      </Panel>
    </AppShell>
  );
}
