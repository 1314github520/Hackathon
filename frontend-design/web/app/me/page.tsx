"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { Panel } from "@/components/ui/panel";
import { api } from "@/lib/api/service";
import { isUnauthorizedError, readStoredSession, syncFrontendSession, writeStoredSession } from "@/lib/session";
import type { FavoriteItem, HistoryItem } from "@/types/api";

export default function MePage() {
  const [session, setSession] = useState(readStoredSession("frontend"));
  const [ready, setReady] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const validateSession = async () => {
      const stored = readStoredSession("frontend");
      if (!stored) {
        if (!cancelled) {
          setReady(true);
        }
        return;
      }

      try {
        const nextSession = await syncFrontendSession(stored);
        if (cancelled) {
          return;
        }

        if (!nextSession) {
          writeStoredSession("frontend", null);
          setSession(null);
          setMessage("前台登录态已失效，请重新登录。");
          setReady(true);
          return;
        }

        writeStoredSession("frontend", nextSession);
        setSession(nextSession);
        setReady(true);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "用户信息校验失败");
          setReady(true);
        }
      }
    };

    void validateSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!session?.accessToken) {
        return;
      }

      try {
        const [favoriteResult, historyResult] = await Promise.all([
          api.favorites(session.accessToken),
          api.history(session.accessToken),
        ]);
        setFavorites(favoriteResult);
        setHistory(historyResult);
      } catch (loadError) {
        if (isUnauthorizedError(loadError)) {
          writeStoredSession("frontend", null);
          setSession(null);
          setMessage("前台登录态已过期，请重新登录。");
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "个人数据获取失败");
      }
    };

    void load();
  }, [session?.accessToken]);

  async function removeFavorite(favoriteId: string) {
    if (!session?.accessToken) {
      return;
    }

    try {
      await api.removeFavorite(session.accessToken, favoriteId);
      setFavorites((current) => current.filter((item) => item.id !== favoriteId));
      setMessage("已调用取消收藏接口。");
    } catch (actionError) {
      if (isUnauthorizedError(actionError)) {
        writeStoredSession("frontend", null);
        setSession(null);
        setMessage("前台登录态已过期，请重新登录。");
        return;
      }
      setError(actionError instanceof Error ? actionError.message : "取消收藏失败");
    }
  }

  async function onLogout() {
    if (!session?.accessToken) {
      return;
    }

    try {
      await api.logout(session.accessToken);
      writeStoredSession("frontend", null);
      setSession(null);
      setMessage("已调用退出接口并清除本地登录态。");
    } catch (logoutError) {
      if (isUnauthorizedError(logoutError)) {
        writeStoredSession("frontend", null);
        setSession(null);
        setMessage("登录态已过期，已清除本地会话。");
        return;
      }
      setError(logoutError instanceof Error ? logoutError.message : "退出失败");
    }
  }

  return (
    <AppShell title="个人中心" subtitle="登录后可以查看个人资料、收藏记录和浏览历史。">
      {!ready ? <Panel title="状态" kicker="本地会话">正在恢复登录态...</Panel> : null}
      {message ? <p className="status-success">{message}</p> : null}
      {error ? <p className="status-error">{error}</p> : null}
      {!session ? (
        <Panel title="尚未登录" kicker="引导">
          <p className="text-sm text-[var(--muted)]">请先登录前台用户，才能查看收藏和浏览历史。</p>
          <Link href="/user/login" className="action-button mt-4">
            去登录
          </Link>
        </Panel>
      ) : (
        <>
          <Panel
            title={`欢迎回来，${session.user.nickname}`}
            kicker="GET /api/user/profile"
            rightSlot={<button className="ghost-button" onClick={onLogout}>退出登录</button>}
          >
            <div className="flex flex-wrap gap-3 text-sm text-[var(--muted)]">
              <span className="code-chip">{session.user.username}</span>
              <span className="code-chip">{session.user.userType}</span>
            </div>
          </Panel>

          <div className="grid gap-4 md:grid-cols-2">
            <Panel title="收藏列表" kicker="GET /api/user/favorites">
              <div className="surface-grid">
                {favorites.length === 0 ? (
                  <div className="empty-tip">当前没有收藏记录。可先去飞行器详情页调用收藏接口。</div>
                ) : (
                  favorites.map((item) => (
                    <div key={item.id} className="rounded-xl border border-[var(--line)] bg-[var(--panel-soft)] p-4">
                      <p className="font-medium">{item.entityName}</p>
                      <p className="mt-2 text-sm text-[var(--muted)]">
                        类型：{item.entityType} · 实体 ID：{item.entityId}
                      </p>
                      <button className="ghost-button mt-3" onClick={() => void removeFavorite(item.id)}>
                        取消收藏
                      </button>
                    </div>
                  ))
                )}
              </div>
            </Panel>

            <Panel title="浏览历史" kicker="GET /api/user/history">
              <div className="surface-grid">
                {history.length === 0 ? (
                  <div className="empty-tip">当前没有浏览记录。进入飞行器详情页后会自动记录浏览历史。</div>
                ) : (
                  history.map((item) => (
                    <div key={item.id} className="rounded-xl border border-[var(--line)] bg-[var(--panel-soft)] p-4">
                      <p className="font-medium">{item.entityName}</p>
                      <p className="mt-2 text-sm text-[var(--muted)]">
                        浏览次数：{item.viewCount} · 最近浏览：{new Date(item.lastViewedAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </Panel>
          </div>
        </>
      )}
    </AppShell>
  );
}
