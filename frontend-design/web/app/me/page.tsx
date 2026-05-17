"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { CoverImage } from "@/components/ui/cover-image";
import { EmptyState, LoadingState, Notice } from "@/components/ui/feedback";
import { Panel } from "@/components/ui/panel";
import { api } from "@/lib/api/service";
import { isUnauthorizedError, readStoredSession, syncFrontendSession, writeStoredSession } from "@/lib/session";
import type { FavoriteItem, HistoryItem } from "@/types/api";

function buildEntityHref(item: { entityType: string; entitySlug?: string }) {
  if (item.entityType === "aircraft" && item.entitySlug) {
    return `/aircraft/${item.entitySlug}`;
  }
  if (item.entityType === "event") {
    return item.entitySlug ? `/events/${item.entitySlug}` : "/events";
  }
  if (item.entityType === "person") {
    return item.entitySlug ? `/persons/${item.entitySlug}` : "/persons";
  }
  return "/search";
}

export default function MePage() {
  const [session, setSession] = useState(readStoredSession("frontend"));
  const [ready, setReady] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
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

  const loadUserData = useCallback(async () => {
    if (!session?.accessToken) {
      return;
    }

    try {
      setLoadingData(true);
      setError("");
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
    } finally {
      setLoadingData(false);
    }
  }, [session]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadUserData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadUserData]);

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
      setLoggingOut(true);
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
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <AppShell title="个人中心" subtitle="登录后可以查看个人资料、收藏记录和浏览历史。">
      {!ready ? (
        <Panel title="状态" kicker="本地会话">
          <LoadingState label="正在恢复登录态" description="系统正在验证本地保存的前台用户会话。" />
        </Panel>
      ) : null}
      {message ? <Notice tone="success">{message}</Notice> : null}
      {error ? (
        <Notice
          tone="error"
          actions={
            session ? (
              <button type="button" className="ghost-button" onClick={() => void loadUserData()}>
                重新加载
              </button>
            ) : null
          }
        >
          {error}
        </Notice>
      ) : null}
      {!session ? (
        <Panel title="尚未登录" kicker="引导">
          <EmptyState
            title="请先登录前台账号"
            description="登录后可以同步收藏、浏览历史和个人会话状态。"
            actions={
              <Link href="/user/login" className="action-button">
                去登录
              </Link>
            }
          />
        </Panel>
      ) : (
        <>
          <Panel
            title={`欢迎回来，${session.user.nickname}`}
            kicker="GET /api/user/profile"
            rightSlot={
              <div className="dashboard-actions">
                <button className="ghost-button" type="button" onClick={() => void loadUserData()}>
                  刷新数据
                </button>
                <button className="ghost-button" type="button" onClick={onLogout} disabled={loggingOut}>
                  {loggingOut ? "退出中..." : "退出登录"}
                </button>
              </div>
            }
          >
            <div className="flex flex-wrap gap-3 text-sm text-[var(--muted)]">
              <span className="code-chip">{session.user.username}</span>
              <span className="code-chip">{session.user.userType}</span>
            </div>
            {loadingData ? <LoadingState label="正在同步个人数据" description="正在获取收藏和浏览历史。" compact /> : null}
          </Panel>

          <div className="grid gap-4 md:grid-cols-2">
            <Panel title="收藏列表" kicker="GET /api/user/favorites">
              <div className="surface-grid">
                {favorites.length === 0 ? (
                  <EmptyState
                    title="当前没有收藏记录"
                    description="可以先去航空器、事件或人物详情页收藏内容。"
                  />
                ) : (
                  favorites.map((item) => (
                    <div key={item.id} className="content-card">
                      <CoverImage
                        src={item.entityCoverImage}
                        alt={item.entityName}
                        label={item.entityType}
                        className="mb-4 aspect-[16/9]"
                      />
                      <p className="font-medium">{item.entityName}</p>
                      <p className="mt-2 text-sm text-[var(--muted)]">
                        类型：{item.entityType} · 实体 ID：{item.entityId}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-3">
                        <Link href={buildEntityHref(item)} className="ghost-button">
                          查看内容
                        </Link>
                        <button className="ghost-button" onClick={() => void removeFavorite(item.id)}>
                          取消收藏
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Panel>

            <Panel title="浏览历史" kicker="GET /api/user/history">
              <div className="surface-grid">
                {history.length === 0 ? (
                  <EmptyState
                    title="当前没有浏览记录"
                    description="进入航空器详情页后会自动记录浏览历史。"
                  />
                ) : (
                  history.map((item) => (
                    <div key={item.id} className="content-card">
                      <CoverImage
                        src={item.entityCoverImage}
                        alt={item.entityName}
                        label={item.entityType}
                        className="mb-4 aspect-[16/9]"
                      />
                      <p className="font-medium">{item.entityName}</p>
                      <p className="mt-2 text-sm text-[var(--muted)]">
                        浏览次数：{item.viewCount} · 最近浏览：{new Date(item.lastViewedAt).toLocaleString()}
                      </p>
                      <Link href={buildEntityHref(item)} className="ghost-button mt-3">
                        再看一次
                      </Link>
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
