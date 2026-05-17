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

export default function PersonDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [person, setPerson] = useState<PersonItem | null>(null);
  const [relatedAircraft, setRelatedAircraft] = useState<Aircraft[]>([]);
  const [relatedEvents, setRelatedEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [persons, aircraft, events] = await Promise.all([
        api.listPersons(),
        api.listAircraft(),
        api.listEvents(),
      ]);
      const current = persons.find((item) => item.slug === slug) || null;
      setPerson(current);

      if (!current) {
        return;
      }

      setRelatedAircraft(
        aircraft.filter((item) => current.relatedAircraftIds?.includes(item.id)).slice(0, 3),
      );
      setRelatedEvents(
        events.filter((item) => current.relatedEventIds?.includes(item.id)).slice(0, 3),
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "人物详情加载失败");
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

  const badges = useMemo(
    () =>
      [
        person?.personType ? `身份：${person.personType}` : null,
        person?.nationality ? `国籍：${person.nationality}` : null,
        person?.nameEn ? `英文名：${person.nameEn}` : null,
      ].filter(Boolean) as string[],
    [person],
  );

  return (
    <AppShell
      title={person?.nameZh || "人物详情"}
      subtitle="展示人物身份、主要贡献和相关事件，让用户能把飞机、事件和人物串起来理解。"
      actions={
        <Link href="/persons" className="ghost-button">
          返回人物列表
        </Link>
      }
    >
      {loading ? <LoadingState label="正在加载人物详情" description="系统正在读取人物主信息和关联内容。" /> : null}
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
      {!loading && !person ? (
        <Panel title="未找到人物" kicker="详情缺失">
          <EmptyState
            title="没有找到对应人物"
            description="可能是链接已失效，或当前后端没有这条人物数据。"
            actions={
              <Link href="/persons" className="action-button">
                返回人物列表
              </Link>
            }
          />
        </Panel>
      ) : null}
      {person ? (
        <>
          <div className="two-column">
            <Panel title="人物概览" kicker="核心信息">
              <CoverImage src={person.coverImage} alt={person.nameZh} label={person.personType} className="mb-4 aspect-[16/9]" />
              <div className="detail-copy">
                <div className="detail-badges">
                  {badges.map((item) => (
                    <Badge key={item}>{item}</Badge>
                  ))}
                </div>
                <p>{person.summary}</p>
                <p>{person.biography}</p>
              </div>
            </Panel>

            <Panel title="代表贡献" kicker="快速理解">
              <div className="surface-grid">
                <div className="spec-card">
                  <div className="label">人物身份</div>
                  <div className="value detail-value">{person.personType}</div>
                </div>
                <div className="spec-card">
                  <div className="label">关联航空器</div>
                  <div className="value">{relatedAircraft.length}</div>
                </div>
                <div className="spec-card">
                  <div className="label">关联事件</div>
                  <div className="value">{relatedEvents.length}</div>
                </div>
              </div>
            </Panel>
          </div>

          <div className="two-column">
            <Panel title="相关航空器" kicker="延伸阅读">
              {relatedAircraft.length === 0 ? (
                <EmptyState title="暂时没有关联航空器" description="当前人物数据里还没有绑定相关机型。" />
              ) : (
                <div className="surface-grid">
                  {relatedAircraft.map((item) => (
                    <EntityCard
                      key={item.id}
                      item={item}
                      href={`/aircraft/${item.slug}`}
                      meta={[
                        formatMeta("首飞", item.firstFlightYear),
                        formatMeta("机型", item.aircraftType),
                      ]}
                    />
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="相关事件" kicker="延伸阅读">
              {relatedEvents.length === 0 ? (
                <EmptyState title="暂时没有关联事件" description="当前人物数据里还没有绑定相关事件。" />
              ) : (
                <div className="surface-grid">
                  {relatedEvents.map((item) => (
                    <EntityCard
                      key={item.id}
                      item={item}
                      href={`/events/${item.slug}`}
                      meta={[formatMeta("类型", item.eventType), formatMeta("日期", item.eventDate)]}
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
