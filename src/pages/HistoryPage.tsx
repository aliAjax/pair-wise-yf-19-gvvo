import { useMemo, useState } from "react";
import { EVENT_META } from "../rules/constants";
import type { EventType } from "../rules/types";
import { useStore } from "../state/store";
import { fmtDateTime, sourceShort } from "../components/ui";

const FILTERS: { id: EventType | "all"; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "registered", label: "调拨登记" },
  { id: "verified", label: "核验通过" },
  { id: "rejected", label: "整批拒收" },
  { id: "received", label: "拆箱入位" },
  { id: "receive_rejected", label: "拆箱拒收" },
  { id: "returned", label: "退回" },
];

export function HistoryPage({ onOpen }: { onOpen: (id: string) => void }) {
  const { state } = useStore();
  const [filter, setFilter] = useState<EventType | "all">("all");

  const events = useMemo(
    () =>
      [...state.events]
        .filter((e) => filter === "all" || e.type === filter)
        .sort((a, b) => b.at - a.at),
    [state.events, filter],
  );

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2>调拨历史</h2>
          <p>登记、核验、拆箱、拒收与退回全程留痕；退回不删除历史。共 {state.events.length} 条。</p>
        </div>
      </div>

      <div className="filter-bar">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={filter === f.id ? "chip active" : "chip"}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <ol className="timeline">
        {events.map((e) => {
          const meta = EVENT_META[e.type];
          const specimenId = e.specimenIds?.[0];
          return (
            <li key={e.id} className={`tl-item tone-${meta.tone}`}>
              <span className="tl-dot" />
              <div className="tl-body">
                <div className="tl-head">
                  <span className={`badge badge-${meta.tone === "bad" ? "bad" : meta.tone === "warn" ? "warn" : meta.tone === "ok" ? "ok" : "info"}`}>
                    {meta.label}
                  </span>
                  <strong>{e.batchId}</strong>
                  <span className="muted">{sourceShort(e.sourceId)}</span>
                  <time>{fmtDateTime(e.at)}</time>
                </div>
                <p>{e.message}</p>
                {specimenId && (
                  <button className="sp-link" onClick={() => onOpen(specimenId)}>
                    查看相关标本详情 →
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      {events.length === 0 && <p className="empty">该筛选下暂无记录。</p>}
    </div>
  );
}
