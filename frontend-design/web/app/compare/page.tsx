"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { EmptyState, LoadingState, Notice } from "@/components/ui/feedback";
import { Panel } from "@/components/ui/panel";
import { api } from "@/lib/api/service";
import type { Aircraft } from "@/types/api";

const compareFields: Array<{
  key: keyof Aircraft | "lengthM" | "wingspanM" | "maxSpeedKmh" | "rangeKm" | "engineType";
  label: string;
}> = [
  { key: "aircraftType", label: "机型" },
  { key: "firstFlightYear", label: "首飞年份" },
  { key: "lengthM", label: "机长（m）" },
  { key: "wingspanM", label: "翼展（m）" },
  { key: "maxSpeedKmh", label: "最大速度（km/h）" },
  { key: "rangeKm", label: "航程（km）" },
  { key: "engineType", label: "发动机类型" },
];

type CompareAircraft = Aircraft &
  Partial<Record<"lengthM" | "wingspanM" | "maxSpeedKmh" | "rangeKm" | "engineType", string | number | null>>;

function readValue(item: CompareAircraft, key: string) {
  if (["lengthM", "wingspanM", "maxSpeedKmh", "rangeKm", "engineType"].includes(key)) {
    return (
      item.specs?.[key as keyof Aircraft["specs"]] ??
      item[key as keyof CompareAircraft] ??
      "待补充"
    );
  }

  return item[key as keyof Aircraft] ?? "待补充";
}

export default function ComparePage() {
  const [allAircraft, setAllAircraft] = useState<Aircraft[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [items, setItems] = useState<CompareAircraft[]>([]);
  const [showDiffOnly, setShowDiffOnly] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [error, setError] = useState("");

  const loadAircraftOptions = useCallback(async () => {
    try {
      setLoadingList(true);
      setError("");
      const result = await api.listAircraft();
      setAllAircraft(result);
      setSelectedIds(result.slice(0, 3).map((item) => item.id));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "航空器列表加载失败");
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAircraftOptions();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadAircraftOptions]);

  useEffect(() => {
    const runCompare = async () => {
      if (selectedIds.length < 2) {
        setItems([]);
        return;
      }

      try {
        setLoadingCompare(true);
        setError("");
        const result = await api.compareAircraft(selectedIds);
        setItems(result);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "对比接口调用失败");
      } finally {
        setLoadingCompare(false);
      }
    };

    void runCompare();
  }, [selectedIds]);

  const rows = useMemo(() => {
    return compareFields.filter((field) => {
      if (!showDiffOnly) {
        return true;
      }

      const values = items.map((item) => String(readValue(item, field.key)));
      return new Set(values).size > 1;
    });
  }, [items, showDiffOnly]);

  function toggleAircraft(id: string) {
    if (selectedIds.includes(id)) {
      setSelectedIds((current) => current.filter((item) => item !== id));
      return;
    }

    if (selectedIds.length >= 4) {
      setError("为了保证对比可读性，当前最多同时选择 4 架飞机。");
      return;
    }

    setError("");
    setSelectedIds((current) => [...current, id]);
  }

  return (
    <AppShell title="航空器对比" subtitle="勾选多架飞机后，从尺寸、速度、航程和发动机等核心维度进行横向比较。">
      <Panel
        title="选择飞机"
        kicker="POST /api/public/aircraft/compare"
        rightSlot={
          <button className="ghost-button" onClick={() => setShowDiffOnly((value) => !value)} type="button">
            {showDiffOnly ? "显示全部字段" : "仅看差异"}
          </button>
        }
      >
        {loadingList ? (
          <LoadingState label="正在加载可对比航空器" description="系统正在读取已发布航空器列表。" />
        ) : allAircraft.length === 0 ? (
          <EmptyState
            title="暂无可对比航空器"
            description="公开内容里还没有可用于对比的飞机，可先前往后台发布航空器。"
            actions={
              <Link href="/admin/dashboard" className="action-button">
                去后台补充数据
              </Link>
            }
          />
        ) : (
          <>
            <div className="compare-toolbar">
              <div className="compare-count">
                已选择 <strong>{selectedIds.length}</strong> / 4 架
              </div>
              <div className="compare-selection">
                {selectedIds.length === 0 ? <span className="muted-text">尚未选择航空器</span> : null}
                {selectedIds.map((id) => {
                  const selected = allAircraft.find((item) => item.id === id);
                  if (!selected) {
                    return null;
                  }
                  return (
                    <button
                      key={id}
                      type="button"
                      className="compare-chip"
                      onClick={() => toggleAircraft(id)}
                      aria-label={`移除 ${selected.nameZh}`}
                    >
                      {selected.nameZh}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {allAircraft.map((item) => (
                <label
                  key={item.id}
                  className={`selection-card ${selectedIds.includes(item.id) ? "active" : ""}`}
                >
                  <input
                    className="selection-checkbox"
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => toggleAircraft(item.id)}
                    aria-label={`选择 ${item.nameZh} 进入对比`}
                  />
                  <span className="min-w-0">
                    <span className="block font-medium">{item.nameZh}</span>
                    <span className="mt-1 block text-sm text-[var(--muted)]">
                      {item.aircraftType} · {item.firstFlightYear ?? "首飞待补充"} · {item.specs.engineType || "发动机待补充"}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </>
        )}
        {selectedIds.length < 2 && !loadingList ? <p className="mt-4 text-sm text-[var(--muted)]">请至少勾选两架飞机，才能生成对比结果。</p> : null}
        {error ? (
          <Notice
            tone="error"
            className="mt-4"
            actions={
              <button type="button" className="ghost-button" onClick={() => void loadAircraftOptions()}>
                刷新列表
              </button>
            }
          >
            {error}
          </Notice>
        ) : null}
      </Panel>

      <Panel title="对比结果" kicker={`已选 ${selectedIds.length} 架`}>
        {selectedIds.length < 2 ? (
          <EmptyState
            title="等待生成对比表"
            description="至少选择两架飞机后，系统会自动加载参数对比结果。"
          />
        ) : loadingCompare ? (
          <LoadingState label="正在生成对比结果" description="系统正在请求多机型对比接口。" />
        ) : (
          <div className="overflow-x-auto">
            <table className="panel-table min-w-[760px]">
              <thead>
                <tr>
                  <th>维度</th>
                  {items.map((item) => (
                    <th key={item.id}>{item.nameZh}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.key}>
                    <th>{row.label}</th>
                    {items.map((item) => (
                      <td key={`${item.id}-${row.key}`}>{String(readValue(item, row.key))}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </AppShell>
  );
}
