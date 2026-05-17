"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { EntityCard } from "@/components/feature/entity-card";
import { AppShell } from "@/components/layout/app-shell";
import { Panel, StatCard } from "@/components/ui/panel";
import { api } from "@/lib/api/service";
import { formatMeta } from "@/lib/format";
import type { Aircraft, EventItem, PersonItem } from "@/types/api";

export default function HomePage() {
  const [health, setHealth] = useState("加载中");
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [persons, setPersons] = useState<PersonItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [healthResult, aircraftResult, eventResult, personResult] = await Promise.all([
          api.health(),
          api.listAircraft(),
          api.listEvents(),
          api.listPersons(),
        ]);
        setHealth(healthResult.status);
        setAircraft(aircraftResult);
        setEvents(eventResult);
        setPersons(personResult);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "加载首页数据失败");
      }
    };

    void load();
  }, []);

  return (
    <AppShell
      title="让航空知识变得可看、可搜、可比较"
      subtitle="把分散、专业的航空器资料、历史事件和人物信息整理成适合普通用户浏览和学习的结构化知识平台。"
      actions={
        <>
          <Link href="/user/login" className="ghost-button">
            体验用户功能
          </Link>
          <Link href="/admin/login" className="action-button">
            进入管理后台
          </Link>
        </>
      }
    >
      <div className="hero-grid">
        <Panel title="平台亮点" kicker="核心能力" className="hero-panel">
          <div className="info-list">
            <div className="info-list-item">
              <div>
                <div className="font-medium">多类型知识整合</div>
                <div className="muted-text text-sm">飞机、事件、人物统一纳入一套浏览和搜索路径。</div>
              </div>
              <span className="code-chip">01</span>
            </div>
            <div className="info-list-item">
              <div>
                <div className="font-medium">航空器横向对比</div>
                <div className="muted-text text-sm">围绕尺寸、速度、航程、发动机和首飞年份快速比差异。</div>
              </div>
              <span className="code-chip">02</span>
            </div>
            <div className="info-list-item">
              <div>
                <div className="font-medium">内容管理闭环</div>
                <div className="muted-text text-sm">从字段校验、新建到提审和审核，适合赛事演示后台能力。</div>
              </div>
              <span className="code-chip">03</span>
            </div>
          </div>
        </Panel>

        <Panel title="当前联调状态" kicker="系统概览" className="hero-panel">
          <div className="hero-stats">
            <StatCard label="后端状态" value={health} tone={health === "ok" ? "success" : "warning"} />
            <StatCard label="航空器数量" value={`${aircraft.length} 条`} />
            <StatCard label="事件和人物" value={`${events.length + persons.length} 条`} />
          </div>
          {error ? <p className="status-error mt-4">{error}</p> : null}
        </Panel>
      </div>

      <div className="two-column">
        <Panel title="给用户的价值" kicker="平台定位">
          <div className="space-y-3 text-sm leading-7 text-[var(--muted)]">
            <p>面向非专业用户，这个平台会把航空知识拆成更容易理解的页面结构，不用先懂很多术语也能看明白。</p>
            <p>用户既可以单独认识一架飞机，也可以通过搜索、相关推荐和对比功能建立横向认知。</p>
            <p>如果后续继续扩展，还可以接入时间轴、知识图谱和更多内容策展能力。</p>
          </div>
        </Panel>

        <Panel title="建议演示路线" kicker="答辩顺序">
          <ol className="space-y-2 text-sm leading-7 text-[var(--muted)]">
            <li>1. 从首页进入搜索，展示知识入口和公开内容。</li>
            <li>2. 打开某架飞机详情页，讲清楚参数、相关人物和相关推荐。</li>
            <li>3. 进入对比页，展示多架飞机差异分析。</li>
            <li>4. 最后切到后台，说明数据录入、校验和审核流程。</li>
          </ol>
        </Panel>
      </div>

      <div className="section-head">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.03em]">精选知识卡片</h2>
          <p>从不同维度展示航空器、历史事件和代表人物，适合首页快速浏览。</p>
        </div>
        <Link href="/search" className="ghost-button">
          去搜索更多内容
        </Link>
      </div>

      <div className="three-column">
        <Panel title="航空器" kicker="GET /api/public/aircraft">
          <div className="surface-grid">
            {aircraft.slice(0, 3).map((item) => (
              <EntityCard
                key={item.id}
                item={item}
                href={`/aircraft/${item.slug}`}
                meta={[
                  formatMeta("首飞", item.firstFlightYear),
                  formatMeta("发动机", item.specs.engineType || null),
                  formatMeta("航程", item.specs.rangeKm ? `${item.specs.rangeKm} km` : null),
                ]}
              />
            ))}
          </div>
        </Panel>

        <Panel title="航空事件" kicker="GET /api/public/events">
          <div className="surface-grid">
            {events.slice(0, 3).map((item) => (
              <EntityCard
                key={item.id}
                item={item}
                href="/events"
                meta={[formatMeta("类型", item.eventType), formatMeta("日期", item.eventDate)]}
              />
            ))}
          </div>
        </Panel>

        <Panel title="航空人物" kicker="GET /api/public/persons">
          <div className="surface-grid">
            {persons.slice(0, 3).map((item) => (
              <EntityCard
                key={item.id}
                item={item}
                href="/persons"
                meta={[formatMeta("身份", item.personType), formatMeta("国籍", item.nationality)]}
              />
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
