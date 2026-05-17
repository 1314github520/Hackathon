"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { Panel } from "@/components/ui/panel";
import { api } from "@/lib/api/service";
import { writeStoredSession } from "@/lib/session";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("Admin123!");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setError("");
      const session = await api.adminLogin({ username, password });
      writeStoredSession("admin", session);
      setMessage("管理员登录成功，正在进入后台。");
      router.push("/admin/dashboard");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "管理员登录失败");
    }
  }

  return (
    <AppShell title="管理员登录" subtitle="使用默认管理员账号进入后台联调页。">
      <Panel title="管理员登录" kicker="POST /api/admin/auth/login">
        <form className="grid max-w-xl gap-4" onSubmit={onSubmit}>
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
            登录后台
          </button>
          {message ? <p className="status-success">{message}</p> : null}
          {error ? <p className="status-error">{error}</p> : null}
        </form>
      </Panel>
    </AppShell>
  );
}
