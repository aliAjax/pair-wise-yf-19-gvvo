import { useState } from "react";
import { SpecimenRow } from "../components/SpecimenRow";
import { fmtDateTime, sourceShort } from "../components/ui";
import { ZONE_LABEL } from "../rules/constants";
import type { Specimen } from "../rules/types";
import { binOverview, returnedSpecimens } from "../state/selectors";
import { useStore } from "../state/store";

function ReturnConfirm({
  specimen,
  onCancel,
  onConfirm,
}: {
  specimen: Specimen;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("馆际复查重号");
  return (
    <div className="inline-confirm">
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="退回原因"
      />
      <button className="danger-btn" onClick={() => onConfirm(reason)}>确认退回并释放 {specimen.slotNo}</button>
      <button onClick={onCancel}>取消</button>
    </div>
  );
}

export function BinsPage({ onOpen }: { onOpen: (id: string) => void }) {
  const { state, dispatch } = useStore();
  const [returning, setReturning] = useState<string | null>(null);
  const overview = binOverview(state);
  const returned = returnedSpecimens(state);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2>气候仓位记录</h2>
          <p>四个预置气候仓位，容量固定。退回已接收标本会即时释放柜位；调拨历史保留可查。</p>
        </div>
      </div>

      <div className="bin-grid">
        {overview.map(({ bin, used, specimens }) => {
          const pct = Math.round((used / bin.capacity) * 100);
          const full = used >= bin.capacity;
          return (
            <article key={bin.id} className={`bin-card ${full ? "is-full" : ""}`}>
              <div className="bin-head">
                <div>
                  <h3>
                    <span className={`zone-dot zone-${bin.zone}`} />
                    {bin.name}
                  </h3>
                  <p className="muted">{bin.code} · {ZONE_LABEL[bin.zone]}气候带</p>
                </div>
                <div className="cap-num">
                  <strong>{used}<small>/{bin.capacity}</small></strong>
                  <span>{full ? "已满" : `剩 ${bin.capacity - used}`}</span>
                </div>
              </div>
              <p className="bin-note">{bin.note}</p>
              <div className="cap-bar">
                <span className={full ? "bar-full" : ""} style={{ width: `${pct}%` }} />
              </div>
              <div className="bin-specimens">
                {specimens.length === 0 && <p className="empty">暂无标本</p>}
                {specimens.map((s) => (
                  <div key={s.id} className="bin-line">
                    <SpecimenRow
                      specimen={s}
                      onOpen={onOpen}
                      action={
                        returning === s.id ? undefined : (
                          <button
                            className="danger-link"
                            onClick={() => setReturning(s.id)}
                          >
                            退回
                          </button>
                        )
                      }
                    />
                    {returning === s.id && (
                      <ReturnConfirm
                        specimen={s}
                        onCancel={() => setReturning(null)}
                        onConfirm={(reason) => {
                          dispatch({ type: "RETURN_SPECIMEN", specimenId: s.id, reason });
                          setReturning(null);
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>

      <section className="block">
        <h3 className="block-title">
          已退回标本（仓位已释放，历史保留）
          <span className="count-pill warn">{returned.length}</span>
        </h3>
        {returned.length === 0 ? (
          <p className="empty">暂无退回记录。</p>
        ) : (
          <div className="plain-list">
            {returned.map((s) => (
              <div key={s.id} className="return-line" onClick={() => onOpen(s.id)}>
                <button className="sp-link" onClick={(e) => { e.stopPropagation(); onOpen(s.id); }}>
                  {s.collectionNo}
                </button>
                <strong>{s.species}</strong>
                <span>{sourceShort(s.sourceId)}</span>
                <span className="muted">退回 {s.returnedAt ? fmtDateTime(s.returnedAt) : "-"}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
