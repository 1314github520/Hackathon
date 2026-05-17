"use client";

import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
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
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const result = await api.listAircraft();
        setAllAircraft(result);
        setSelectedIds(result.slice(0, 3).map((item) => item.id));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "航空器列表加载失败");
      }
    };

    void load();
  }, []);

  useEffect(() => {
    const runCompare = async () => {
      if (selectedIds.length < 2) {
        setItems([]);
        return;
      }

      try {
        setError("");
        const result = await api.compareAircraft(selectedIds);
        setItems(result);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "对比接口调用失败");
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
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }
      return [...current, id];
    });
  }

  return (
    <AppShell title="航空器对比" subtitle="勾选多架飞机后，从尺寸、速度、航程和发动机等核心维度进行横向比较。">
      <Panel
        title="选择飞机"
        kicker="POST /api/public/aircraft/compare"
        rightSlot={
          <button className="ghost-button" onClick={() => setShowDiffOnly((value) => !value)}>
            {showDiffOnly ? "显示全部字段" : "仅看差异"}
          </button>
        }
      >
        <div className="grid gap-3 md:grid-cols-2">
          {allAircraft.map((item) => (
            <label
              key={item.id}
              className={`selection-card ${selectedIds.includes(item.id) ? "active" : ""}`}
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(item.id)}
                onChange={() => toggleAircraft(item.id)}
              />
              <span className="min-w-0">
                <span className="block font-medium">{item.nameZh}</span>
                <span className="mt-1 block text-sm text-[var(--muted)]">
                  {item.aircraftType} · {item.firstFlightYear ?? "首飞待补充"}
                </span>
              </span>
            </label>
          ))}
        </div>
        {selectedIds.length < 2 ? <p className="mt-4 text-sm text-[var(--muted)]">请至少勾选两架飞机。</p> : null}
        {error ? <p className="status-error mt-4">{error}</p> : null}
      </Panel>

      <Panel title="对比结果" kicker={`已选 ${selectedIds.length} 架`}>
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
      </Panel>
    </AppShell>
  );
}
