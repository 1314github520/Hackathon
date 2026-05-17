"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { CoverImage } from "@/components/ui/cover-image";
import { Panel } from "@/components/ui/panel";
import { api } from "@/lib/api/service";
import type { EventItem } from "@/types/api";

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setEvents(await api.listEvents());
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "事件接口联调失败");
      }
    };

    void load();
  }, []);

  return (
    <AppShell title="航空事件" subtitle="用于展示航空史中的关键事件，帮助用户建立时间线理解。">
      <Panel title="事件列表" kicker="GET /api/public/events">
        {error ? <p className="status-error">{error}</p> : null}
        <div className="surface-grid md:grid-cols-2">
          {events.map((item) => (
            <article key={item.id} className="rounded-[1.2rem] border border-[var(--line)] bg-[var(--panel-soft)] p-4">
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
            </article>
          ))}
        </div>
      </Panel>
    </AppShell>
  );
}
