"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
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
        <div className="surface-grid">
          {events.map((item) => (
            <article key={item.id} className="rounded-2xl border border-[var(--line)] bg-[var(--panel-soft)] p-4">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <span className="code-chip">{item.eventDate}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{item.summary}</p>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">影响：{item.impact}</p>
            </article>
          ))}
        </div>
      </Panel>
    </AppShell>
  );
}
