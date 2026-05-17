"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { EntityCard } from "@/components/feature/entity-card";
import { AppShell } from "@/components/layout/app-shell";
import { CoverImage } from "@/components/ui/cover-image";
import { EmptyState, LoadingState, Notice } from "@/components/ui/feedback";
import { Badge, Panel } from "@/components/ui/panel";
import { api } from "@/lib/api/service";
import { formatMeta } from "@/lib/format";
import type { Aircraft, EventItem, PersonItem } from "@/types/api";

export default function EventDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [event, setEvent] = useState<EventItem | null>(null);
  const [relatedAircraft, setRelatedAircraft] = useState<Aircraft[]>([]);
  const [relatedPersons, setRelatedPersons] = useState<PersonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [events, aircraft, persons] = await Promise.all([
        api.listEvents(),
        api.listAircraft(),
        api.listPersons(),
      ]);
      const current = events.find((item) => item.slug === slug) || null;
      setEvent(current);

      if (!current) {
        return;
      }

      setRelatedAircraft(
        aircraft.filter((item) => current.relatedAircraftIds?.includes(item.id)).slice(0, 3),
      );
      setRelatedPersons(
        persons.filter((item) => current.relatedPersonIds?.includes(item.id)).slice(0, 3),
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "事件详情加载失败");
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

  const eventMeta = useMemo(
    () => [
      event?.eventType ? `事件类型：${event.eventType}` : null,
      event?.eventDate ? `发生时间：${event.eventDate}` : null,
      event?.locationName ? `地点：${event.locationName}` : null,
    ].filter(Boolean) as string[],
    [event],
  );

  return (
    <AppShell
      title={event?.title || "事件详情"}
      subtitle="把事件发生了什么、为什么重要、影响了什么机型和人物，整理成便于讲解的内容页。"
      actions={
        <Link href="/events" className="ghost-button">
          返回事件列表
        </Link>
      }
    >
      {loading ? <LoadingState label="正在加载事件详情" description="系统正在读取事件主信息和关联内容。" /> : null}
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
      {!loading && !event ? (
        <Panel title="未找到事件" kicker="详情缺失">
          <EmptyState
            title="没有找到对应事件"
            description="可能是链接已失效，或当前后端没有这条事件数据。"
            actions={
              <Link href="/events" className="action-button">
                返回事件列表
              </Link>
            }
          />
        </Panel>
      ) : null}
      {event ? (
        <>
          <div className="two-column">
            <Panel title="事件概览" kicker="核心信息">
              <CoverImage src={event.coverImage} alt={event.title} label={event.eventType} className="mb-4 aspect-[16/9]" />
              <div className="detail-copy">
                <div className="detail-badges">
                  {eventMeta.map((item) => (
                    <Badge key={item}>{item}</Badge>
                  ))}
                </div>
                <p>{event.summary}</p>
                <p>{event.description}</p>
              </div>
            </Panel>

            <Panel title="事件意义" kicker="科普解读">
              <div className="surface-grid">
                <div className="spec-card">
                  <div className="label">为什么重要</div>
                  <div className="value detail-value">{event.impact || "待补充"}</div>
                </div>
                <div className="spec-card">
                  <div className="label">关联航空器</div>
                  <div className="value">{relatedAircraft.length}</div>
                </div>
                <div className="spec-card">
                  <div className="label">关联人物</div>
                  <div className="value">{relatedPersons.length}</div>
                </div>
              </div>
            </Panel>
          </div>

          <div className="two-column">
            <Panel title="相关航空器" kicker="延伸阅读">
              {relatedAircraft.length === 0 ? (
                <EmptyState
                  title="暂时没有关联航空器"
                  description="当前事件数据里还没有绑定相关机型。"
                />
              ) : (
                <div className="surface-grid">
                  {relatedAircraft.map((item) => (
                    <EntityCard
                      key={item.id}
                      item={item}
                      href={`/aircraft/${item.slug}`}
                      meta={[
                        formatMeta("首飞", item.firstFlightYear),
                        formatMeta("航程", item.specs.rangeKm ? `${item.specs.rangeKm} km` : null),
                      ]}
                    />
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="相关人物" kicker="延伸阅读">
              {relatedPersons.length === 0 ? (
                <EmptyState title="暂时没有关联人物" description="当前事件数据里还没有绑定相关人物。" />
              ) : (
                <div className="surface-grid">
                  {relatedPersons.map((item) => (
                    <EntityCard
                      key={item.id}
                      item={item}
                      href={`/persons/${item.slug}`}
                      meta={[formatMeta("身份", item.personType), formatMeta("国籍", item.nationality)]}
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
