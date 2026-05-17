"use client";

import { FormEvent, useEffect, useState } from "react";

import { EntityCard } from "@/components/feature/entity-card";
import { AppShell } from "@/components/layout/app-shell";
import { Panel } from "@/components/ui/panel";
import { api } from "@/lib/api/service";
import { formatMeta } from "@/lib/format";
import type { SearchItem } from "@/types/api";

const initialQuery = "客机";
const initialType = "all";

export default function SearchPage() {
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState(initialType);
  const [items, setItems] = useState<SearchItem[]>([]);
  const [error, setError] = useState("");

  async function runSearch(nextQuery = query, nextType = type) {
    try {
      setError("");
      const result = await api.search({ q: nextQuery, type: nextType });
      setItems(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "搜索失败");
    }
  }

  useEffect(() => {
    let cancelled = false;

    api
      .search({ q: initialQuery, type: initialType })
      .then((result) => {
        if (!cancelled) {
          setItems(result);
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "搜索失败");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runSearch();
  }

  return (
    <AppShell title="全站搜索" subtitle="输入关键词后，可以同时搜索航空器、事件和人物，并快速跳转到对应内容。">
      <Panel title="搜索请求配置" kicker="GET /api/public/search">
        <form className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_200px_auto]" onSubmit={onSubmit}>
          <label className="form-field">
            <span className="text-sm text-[var(--muted)]">关键词</span>
            <input className="input-base" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <label className="form-field">
            <span className="text-sm text-[var(--muted)]">实体类型</span>
            <select className="input-base" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="all">全部</option>
              <option value="aircraft">航空器</option>
              <option value="event">事件</option>
              <option value="person">人物</option>
            </select>
          </label>
          <button type="submit" className="action-button self-end">
            发送查询
          </button>
        </form>
        {error ? <p className="status-error mt-3">{error}</p> : null}
      </Panel>

      <Panel title={`搜索结果（${items.length}）`} kicker="返回解析">
        {items.length === 0 ? (
          <div className="empty-tip">当前条件下没有结果，建议更换关键词或放宽实体类型。</div>
        ) : (
          <div className="surface-grid md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => {
              const href =
                item.entityType === "aircraft"
                  ? `/aircraft/${item.slug}`
                  : item.entityType === "event"
                    ? "/events"
                    : "/persons";

              return (
                <EntityCard
                  key={`${item.entityType}-${item.id}`}
                  item={item}
                  href={href}
                  meta={Object.entries(item.meta || {}).map(([label, value]) => formatMeta(label, value))}
                />
              );
            })}
          </div>
        )}
      </Panel>
    </AppShell>
  );
}
