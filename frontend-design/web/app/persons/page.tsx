"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { CoverImage } from "@/components/ui/cover-image";
import { EmptyState, LoadingState, Notice } from "@/components/ui/feedback";
import { Panel } from "@/components/ui/panel";
import { api } from "@/lib/api/service";
import type { PersonItem } from "@/types/api";

export default function PersonsPage() {
  const [persons, setPersons] = useState<PersonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPersons = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setPersons(await api.listPersons());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "人物接口联调失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPersons();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadPersons]);

  return (
    <AppShell title="航空人物" subtitle="展示与航空发展相关的重要人物，帮助用户把飞机和历史人物联系起来。">
      <Panel title="人物列表" kicker="GET /api/public/persons">
        {loading ? <LoadingState label="正在加载人物列表" description="系统正在同步航空人物内容。" /> : null}
        {error ? (
          <Notice
            tone="error"
            className="mb-4"
            actions={
              <button type="button" className="ghost-button" onClick={() => void loadPersons()}>
                重新加载
              </button>
            }
          >
            {error}
          </Notice>
        ) : null}
        {!loading && persons.length === 0 ? (
          <EmptyState
            title="暂时没有人物内容"
            description="当前知识库没有可展示的航空人物，可先前往后台补充并发布内容。"
          />
        ) : (
          <div className="surface-grid md:grid-cols-2">
            {persons.map((item) => (
              <article key={item.id} className="content-card">
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
                <Link href={`/persons/${item.slug}`} className="ghost-button mt-4">
                  查看人物详情
                </Link>
              </article>
            ))}
          </div>
        )}
      </Panel>
    </AppShell>
  );
}
