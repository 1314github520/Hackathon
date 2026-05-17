"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { CoverImage } from "@/components/ui/cover-image";
import { EmptyState, LoadingState, Notice } from "@/components/ui/feedback";
import { Panel } from "@/components/ui/panel";
import { api } from "@/lib/api/service";
import type { EventItem } from "@/types/api";

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setEvents(await api.listEvents());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "事件接口联调失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadEvents();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadEvents]);

  return (
    <AppShell title="航空事件" subtitle="用于展示航空史中的关键事件，帮助用户建立时间线理解。">
      <Panel title="事件列表" kicker="GET /api/public/events">
        {loading ? <LoadingState label="正在加载事件列表" description="系统正在同步航空事件内容。" /> : null}
        {error ? (
          <Notice
            tone="error"
            className="mb-4"
            actions={
              <button type="button" className="ghost-button" onClick={() => void loadEvents()}>
                重新加载
              </button>
            }
          >
            {error}
          </Notice>
        ) : null}
        {!loading && events.length === 0 ? (
          <EmptyState
            title="暂时没有事件内容"
            description="当前知识库没有可展示的航空事件，可先前往后台补充并发布内容。"
          />
        ) : (
          <div className="surface-grid md:grid-cols-2">
            {events.map((item) => (
              <article key={item.id} className="content-card">
                <CoverImage
                  src={item.coverImage}
                  alt={item.title}
                  label={item.eventType}
                  className="mb-4 aspect-[16/9]"
                />
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <span className="code-chip">{item.eventDate}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{item.summary}</p>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">影响：{item.impact}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="code-chip">相关飞机 {item.relatedAircraftCount ?? 0}</span>
                  <span className="code-chip">相关人物 {item.relatedPersonCount ?? 0}</span>
                </div>
                <Link href={`/events/${item.slug}`} className="ghost-button mt-4">
                  查看事件详情
                </Link>
              </article>
            ))}
          </div>
        )}
      </Panel>
    </AppShell>
  );
}
