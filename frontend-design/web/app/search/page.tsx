"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { EntityCard } from "@/components/feature/entity-card";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState, LoadingState, Notice } from "@/components/ui/feedback";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const searchSummary = useMemo(() => {
    if (type === "all") {
      return "当前搜索范围：全部实体";
    }
    return `当前搜索范围：${type}`;
  }, [type]);

  async function runSearch(nextQuery: string, nextType: string) {
    try {
      setLoading(true);
      setError("");
      const result = await api.search({ q: nextQuery, type: nextType });
      setItems(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "搜索失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void runSearch(initialQuery, initialType);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runSearch(query, type);
  }

  return (
    <AppShell title="全站搜索" subtitle="输入关键词后，可以同时搜索航空器、事件和人物，并快速跳转到对应内容。">
      <Panel title="搜索请求配置" kicker="GET /api/public/search">
        <form className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_auto_auto]" onSubmit={onSubmit}>
          <label className="form-field">
            <span className="text-sm text-[var(--muted)]">关键词</span>
            <input
              className="input-base"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="例如：客机、莱特兄弟、协和式"
              aria-describedby="search-query-hint"
            />
            <span id="search-query-hint" className="field-hint">
              支持模糊搜索，会同时匹配航空器、事件和人物。
            </span>
          </label>
          <label className="form-field">
            <span className="text-sm text-[var(--muted)]">实体类型</span>
            <select className="input-base" value={type} onChange={(e) => setType(e.target.value)} aria-label="实体类型">
              <option value="all">全部</option>
              <option value="aircraft">航空器</option>
              <option value="event">事件</option>
              <option value="person">人物</option>
            </select>
          </label>
          <button type="submit" className="action-button self-end" disabled={loading || query.trim().length === 0}>
            {loading ? "查询中..." : "发送查询"}
          </button>
          <button
            type="button"
            className="ghost-button self-end"
            onClick={() => {
              setQuery(initialQuery);
              setType(initialType);
              void runSearch(initialQuery, initialType);
            }}
          >
            恢复默认
          </button>
        </form>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
          <span className="code-chip">{searchSummary}</span>
          <span className="code-chip">结果数：{items.length}</span>
        </div>
        {error ? (
          <Notice
            tone="error"
            title="搜索请求失败"
            className="mt-4"
            actions={
              <button type="button" className="ghost-button" onClick={() => void runSearch(query, type)}>
                重试
              </button>
            }
          >
            {error}
          </Notice>
        ) : null}
      </Panel>

      <Panel title={`搜索结果（${items.length}）`} kicker="返回解析">
        {loading ? (
          <LoadingState label="正在检索知识库" description="系统正在组合航空器、事件和人物结果。" />
        ) : items.length === 0 ? (
          <EmptyState
            title="没有找到匹配结果"
            description="建议尝试更短的关键词，或把实体类型切回“全部”。"
            actions={
              <Link href="/compare" className="ghost-button">
                去看看航空器对比
              </Link>
            }
          />
        ) : (
          <div className="surface-grid md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => {
              const href =
                item.entityType === "aircraft"
                  ? `/aircraft/${item.slug}`
                  : item.entityType === "event"
                    ? `/events/${item.slug}`
                    : `/persons/${item.slug}`;

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
