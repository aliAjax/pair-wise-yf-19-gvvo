import { useMemo, useState } from "react";
import { ZoneTag } from "../components/ui";
import { ZONE_LABEL } from "../rules/constants";
import { localityCards } from "../state/selectors";
import { useStore } from "../state/store";

export function LocalitiesPage({ onOpen }: { onOpen: (id: string) => void }) {
  const { state } = useStore();
  const [open, setOpen] = useState<string | null>(null);
  const cards = useMemo(() => localityCards(state), [state]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2>采集地信息卡</h2>
          <p>按采集地点聚合同地标本，显示气候带、海拔区间、物种数与上柜进度；点击展开明细。</p>
        </div>
      </div>

      <div className="loc-grid">
        {cards.map((c) => {
          const expanded = open === c.locality;
          const members = state.specimens.filter(
            (s) => s.locality === c.locality && s.stage !== "returned",
          );
          const altRange =
            c.altitudes.length === 0
              ? "—"
              : c.altitudes.length === 1
                ? `${c.altitudes[0]}m`
                : `${Math.min(...c.altitudes)} ~ ${Math.max(...c.altitudes)}m`;
          return (
            <article
              key={c.locality}
              className={`loc-card ${expanded ? "expanded" : ""}`}
              onClick={() => setOpen(expanded ? null : c.locality)}
            >
              <div className="loc-head">
                <h3>{c.locality}</h3>
                <span className="count-pill">{c.count} 份</span>
              </div>
              <div className="loc-tags">
                {c.zones.map((z) => (
                  <ZoneTag key={z} zone={z} />
                ))}
              </div>
              <dl className="loc-dl">
                <div><dt>海拔</dt><dd>{altRange}</dd></div>
                <div><dt>已上柜</dt><dd>{c.stored}/{c.count}</dd></div>
                <div><dt>物种</dt><dd>{c.species.length} 种</dd></div>
              </dl>
              {expanded && (
                <div className="loc-members" onClick={(e) => e.stopPropagation()}>
                  {members.map((s) => (
                    <button
                      key={s.id}
                      className="loc-member"
                      onClick={() => onOpen(s.id)}
                    >
                      <span className="sp-link">{s.collectionNo}</span>
                      <strong>{s.species}</strong>
                      <span className="muted">
                        {ZONE_LABEL[s.zone]}
                        {s.slotNo ? ` · ${s.slotNo}` : ""}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
