"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { EntityCard } from "@/components/feature/entity-card";
import { AppShell } from "@/components/layout/app-shell";
import { CoverImage } from "@/components/ui/cover-image";
import { EmptyState, LoadingState, Notice } from "@/components/ui/feedback";
import { Badge, Panel } from "@/components/ui/panel";
import { api } from "@/lib/api/service";
import { isUnauthorizedError, readStoredSession, syncFrontendSession, writeStoredSession } from "@/lib/session";
import type { Aircraft, AircraftDetail } from "@/types/api";

export default function AircraftDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [item, setItem] = useState<AircraftDetail | null>(null);
  const [recommendations, setRecommendations] = useState<Aircraft[]>([]);
  const [session, setSession] = useState(readStoredSession("frontend"));
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const recordedHistoryKeysRef = useRef(new Set<string>());

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
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

        setSession(nextSession);
        writeStoredSession("frontend", nextSession);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "登录态恢复失败");
        }
      }

      if (!cancelled) {
        setReady(true);
      }
    };

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const loadDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const detail = await api.getAircraftDetail(slug);
      setItem(detail);
      const recommendResult = await api.getRecommendations("aircraft", detail.slug);
      setRecommendations(recommendResult.filter((entry) => entry.id !== detail.id));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "详情联调失败");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) {
      const timer = window.setTimeout(() => {
        void loadDetail();
      }, 0);

      return () => window.clearTimeout(timer);
    }
  }, [loadDetail, slug]);

  useEffect(() => {
    const recordHistory = async () => {
      if (!session?.accessToken || !item || !session.user.id) {
        return;
      }

      const historyKey = `${session.user.id}:${item.id}`;
      if (recordedHistoryKeysRef.current.has(historyKey)) {
        return;
      }

      try {
        await api.recordHistory(session.accessToken, "aircraft", item.id);
        recordedHistoryKeysRef.current.add(historyKey);
      } catch (actionError) {
        if (isUnauthorizedError(actionError)) {
          setSession(null);
          writeStoredSession("frontend", null);
          setError("登录态已失效，浏览历史未写入，请重新登录。");
          return;
        }
        setError(actionError instanceof Error ? actionError.message : "浏览历史记录失败");
      }
    };

    void recordHistory();
  }, [item, session]);

  async function addFavorite() {
    if (!session?.accessToken || !item) {
      setError("请先登录前台用户后再收藏。");
      return;
    }

    try {
      setSavingFavorite(true);
      setError("");
      await api.addFavorite(session.accessToken, "aircraft", item.id);
      setMessage("已加入收藏。");
    } catch (actionError) {
      if (isUnauthorizedError(actionError)) {
        setSession(null);
        writeStoredSession("frontend", null);
        setError("登录态已失效，请重新登录后再收藏。");
        return;
      }
      setError(actionError instanceof Error ? actionError.message : "收藏失败");
    } finally {
      setSavingFavorite(false);
    }
  }

  return (
    <AppShell
      title={item?.nameZh || "飞行器详情"}
      subtitle="用更易读的结构展示飞行器介绍、关键参数、相关人物事件和相关推荐。"
      actions={
        <>
          {item?.specSourceConfidence ? <Badge>{item.specSourceConfidence}</Badge> : null}
          <Link href="/compare" className="ghost-button">
            去对比
          </Link>
          <button className="action-button" onClick={addFavorite} type="button" disabled={savingFavorite}>
            {savingFavorite ? "收藏中..." : "加入收藏"}
          </button>
        </>
      }
    >
      {!ready ? (
        <Panel title="状态" kicker="用户登录态">
          <LoadingState label="正在恢复本地登录信息" description="系统正在验证前台用户会话。" compact />
        </Panel>
      ) : null}
      {error ? (
        <Notice
          tone="error"
          actions={
            <button type="button" className="ghost-button" onClick={() => void loadDetail()}>
              重试
            </button>
          }
        >
          {error}
        </Notice>
      ) : null}
      {message ? <Notice tone="success">{message}</Notice> : null}
      {loading ? <LoadingState label="正在加载飞机详情" description="系统正在读取主信息、参数与相关推荐。" /> : null}
      {!loading && !item ? (
        <Panel title="未找到航空器" kicker="详情缺失">
          <EmptyState
            title="没有找到对应航空器"
            description="可能是链接已失效，或当前没有这条航空器数据。"
            actions={
              <Link href="/search" className="action-button">
                回到搜索页
              </Link>
            }
          />
        </Panel>
      ) : null}
      {item ? (
        <>
          <div className="two-column">
            <Panel title="核心信息" kicker="GET /api/public/aircraft/:id">
              <div className="grid gap-4">
                <CoverImage
                  src={item.coverImage}
                  alt={item.nameZh}
                  label={item.aircraftType}
                  className="aspect-[16/9]"
                />
                <p className="text-base leading-7 text-[var(--text)]">{item.summary}</p>
                <p className="text-sm leading-7 text-[var(--muted)]">{item.description}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge>{item.aircraftType}</Badge>
                  <Badge>{item.manufacturer || "待补充"}</Badge>
                  <Badge>{item.firstFlightYear || "待补充"}</Badge>
                </div>
                <div className="detail-copy">
                  <p>
                    适合场景：{item.aircraftType === "客机" ? "长途民航运输与大型枢纽航线" : "用于特定任务或专业飞行场景"}
                  </p>
                </div>
              </div>
            </Panel>

            <Panel title="参数面板" kicker="结构化字段">
              <div className="spec-grid">
                <div className="spec-card">
                  <div className="label">机长</div>
                  <div className="value">{item.specs.lengthM ?? "待补充"} m</div>
                </div>
                <div className="spec-card">
                  <div className="label">翼展</div>
                  <div className="value">{item.specs.wingspanM ?? "待补充"} m</div>
                </div>
                <div className="spec-card">
                  <div className="label">最大速度</div>
                  <div className="value">{item.specs.maxSpeedKmh ?? "待补充"} km/h</div>
                </div>
                <div className="spec-card">
                  <div className="label">航程</div>
                  <div className="value">{item.specs.rangeKm ?? "待补充"} km</div>
                </div>
                <div className="spec-card md:col-span-2">
                  <div className="label">发动机类型</div>
                  <div className="value">{item.specs.engineType || "待补充"}</div>
                </div>
              </div>
            </Panel>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Panel title="关联事件与人物" kicker="详情联动">
              <div className="surface-grid">
                {item.relatedEvents.length === 0 && item.relatedPersons.length === 0 ? (
                  <EmptyState title="暂无关联内容" description="当前航空器还没有绑定相关事件或人物。" />
                ) : null}
                {item.relatedEvents.map((event) => (
                  <div key={event.id} className="content-card">
                    <CoverImage
                      src={event.coverImage}
                      alt={event.title}
                      label="相关事件"
                      className="mb-4 aspect-[16/9]"
                    />
                    <h4 className="text-base font-semibold">{event.title}</h4>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{event.summary}</p>
                    <Link href={`/events/${event.slug}`} className="ghost-button mt-4">
                      查看事件
                    </Link>
                  </div>
                ))}
                {item.relatedPersons.map((person) => (
                  <div key={person.id} className="content-card">
                    <CoverImage
                      src={person.coverImage}
                      alt={person.nameZh}
                      label="相关人物"
                      className="mb-4 aspect-[16/9]"
                    />
                    <h4 className="text-base font-semibold">{person.nameZh}</h4>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{person.summary}</p>
                    <Link href={`/persons/${person.slug}`} className="ghost-button mt-4">
                      查看人物
                    </Link>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="相关推荐" kicker="GET /api/public/recommendations">
              {recommendations.length === 0 ? (
                <EmptyState title="暂无相关推荐" description="当前接口没有返回其他相似机型。" />
              ) : (
                <div className="surface-grid">
                  {recommendations.map((recommendation) => (
                    <EntityCard
                      key={recommendation.id}
                      item={recommendation}
                      href={`/aircraft/${recommendation.slug}`}
                      meta={[
                        `首飞：${recommendation.firstFlightYear ?? "待补充"}`,
                        `航程：${recommendation.specs.rangeKm ?? "待补充"} km`,
                      ]}
                    />
                  ))}
                </div>
              )}
            </Panel>
          </div>
        </>
      ) : null}
    </AppShell>
  );
}
