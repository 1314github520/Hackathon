"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

import { EntityCard } from "@/components/feature/entity-card";
import { AppShell } from "@/components/layout/app-shell";
import { CoverImage } from "@/components/ui/cover-image";
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

  useEffect(() => {
    const load = async () => {
      try {
        setError("");
        const detail = await api.getAircraftDetail(slug);
        setItem(detail);
        const recommendResult = await api.getRecommendations("aircraft", detail.slug);
        setRecommendations(recommendResult);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "详情联调失败");
      }
    };

    if (slug) {
      void load();
    }
  }, [slug]);

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
    }
  }

  return (
    <AppShell
      title={item?.nameZh || "飞行器详情"}
      subtitle="用更易读的结构展示飞行器介绍、关键参数、相关人物事件和相关推荐。"
      actions={
        <>
          {item?.specSourceConfidence ? <Badge>{item.specSourceConfidence}</Badge> : null}
          <button className="action-button" onClick={addFavorite}>
            加入收藏
          </button>
        </>
      }
    >
      {!ready ? <Panel title="状态" kicker="用户登录态">正在恢复本地登录信息...</Panel> : null}
      {error ? <p className="status-error">{error}</p> : null}
      {message ? <p className="status-success">{message}</p> : null}
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
                {item.relatedEvents.map((event) => (
                  <div key={event.id} className="rounded-xl border border-[var(--line)] bg-[var(--panel-soft)] p-4">
                    <CoverImage
                      src={event.coverImage}
                      alt={event.title}
                      label="相关事件"
                      className="mb-4 aspect-[16/9]"
                    />
                    <h4 className="text-base font-semibold">{event.title}</h4>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{event.summary}</p>
                  </div>
                ))}
                {item.relatedPersons.map((person) => (
                  <div key={person.id} className="rounded-xl border border-[var(--line)] bg-[var(--panel-soft)] p-4">
                    <CoverImage
                      src={person.coverImage}
                      alt={person.nameZh}
                      label="相关人物"
                      className="mb-4 aspect-[16/9]"
                    />
                    <h4 className="text-base font-semibold">{person.nameZh}</h4>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{person.summary}</p>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="相关推荐" kicker="GET /api/public/recommendations">
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
            </Panel>
          </div>
        </>
      ) : null}
    </AppShell>
  );
}
