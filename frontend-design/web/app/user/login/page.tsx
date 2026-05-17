"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { Panel } from "@/components/ui/panel";
import { api } from "@/lib/api/service";
import { writeStoredSession } from "@/lib/session";

export default function UserLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("demo");
  const [password, setPassword] = useState("Demo123!");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
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
    }
  }

  return (
    <AppShell title="用户登录" subtitle="支持普通用户注册和登录，登录后可查看收藏与浏览历史。">
      <Panel title="账号操作" kicker="POST /api/user/auth/register & /login">
        <form className="grid max-w-xl gap-4" onSubmit={onSubmit}>
          <div className="flex gap-3">
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
          <label className="form-field">
            <span className="text-sm text-[var(--muted)]">用户名</span>
            <input className="input-base" value={username} onChange={(e) => setUsername(e.target.value)} />
          </label>
          <label className="form-field">
            <span className="text-sm text-[var(--muted)]">密码</span>
            <input
              className="input-base"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button type="submit" className="action-button">
            {mode === "login" ? "登录前台账号" : "注册并登录"}
          </button>
          {message ? <p className="status-success">{message}</p> : null}
          {error ? <p className="status-error">{error}</p> : null}
        </form>
      </Panel>
    </AppShell>
  );
}
