"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { LoadingState, Notice } from "@/components/ui/feedback";
import { Panel } from "@/components/ui/panel";
import { api } from "@/lib/api/service";
import { writeStoredSession } from "@/lib/session";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("Admin123!");
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
      const session = await api.adminLogin({ username, password });
      writeStoredSession("admin", session);
      setMessage("管理员登录成功，正在进入后台。");
      router.push("/admin/dashboard");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "管理员登录失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell title="管理员登录" subtitle="使用默认管理员账号进入后台联调页。">
      <Panel title="管理员登录" kicker="POST /api/admin/auth/login">
        <form className="grid max-w-xl gap-4" onSubmit={onSubmit}>
          <div className="auth-tip">演示默认账号：`admin / Admin123!`。登录后可以进入内容管理、提审和审核流程。</div>
          <label className="form-field">
            <span className="text-sm text-[var(--muted)]">用户名</span>
            <input
              className="input-base"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
                autoComplete="current-password"
              />
              <button type="button" className="input-inline-button" onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? "隐藏" : "显示"}
              </button>
            </div>
          </label>
          <button type="submit" className="action-button" disabled={!canSubmit}>
            {submitting ? "登录中..." : "登录后台"}
          </button>
          {submitting ? <LoadingState label="正在验证管理员身份" description="系统正在创建后台管理会话。" compact /> : null}
          {message ? <Notice tone="success">{message}</Notice> : null}
          {error ? <Notice tone="error">{error}</Notice> : null}
        </form>
      </Panel>
    </AppShell>
  );
}
