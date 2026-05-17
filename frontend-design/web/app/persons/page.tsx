"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { CoverImage } from "@/components/ui/cover-image";
import { Panel } from "@/components/ui/panel";
import { api } from "@/lib/api/service";
import type { PersonItem } from "@/types/api";

export default function PersonsPage() {
  const [persons, setPersons] = useState<PersonItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setPersons(await api.listPersons());
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "人物接口联调失败");
      }
    };

    void load();
  }, []);

  return (
    <AppShell title="航空人物" subtitle="展示与航空发展相关的重要人物，帮助用户把飞机和历史人物联系起来。">
      <Panel title="人物列表" kicker="GET /api/public/persons">
        {error ? <p className="status-error">{error}</p> : null}
        <div className="surface-grid md:grid-cols-2">
          {persons.map((item) => (
            <article key={item.id} className="rounded-[1.2rem] border border-[var(--line)] bg-[var(--panel-soft)] p-4">
              <CoverImage
                src={item.coverImage}
                alt={item.nameZh}
                label={item.personType}
                className="mb-4 aspect-[16/10]"
              />
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-lg font-semibold">{item.nameZh}</h3>
                <span className="code-chip">{item.personType}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{item.summary}</p>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">国籍：{item.nationality}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="code-chip">相关飞机 {item.relatedAircraftCount ?? 0}</span>
                <span className="code-chip">相关事件 {item.relatedEventCount ?? 0}</span>
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </AppShell>
  );
}
