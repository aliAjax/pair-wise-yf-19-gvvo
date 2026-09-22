import { useState } from "react";
import { useStore } from "../state/store";
import { useToast, navigate } from "../components/shell";
import { Empty, IdBadge, ZoneBadge, fmtTime } from "../components/badges";
import { zoneLabel } from "../rules/transfer";

const RETURN_REASONS = [
  "复检发现病虫害",
  "凭证复核不通过",
  "来源馆要求召回",
  "标本损坏不宜入藏",
  "气候带核定错误",
];

export default function BinsPage() {
  const { state, bins, occupancy, specimenById, returnSpecimen } = useStore();
  const toast = useToast();
  const [reason, setReason] = useState(RETURN_REASONS[0]);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  function doReturn(id: string) {
    toast(returnSpecimen(id, reason));
    setConfirmId(null);
  }

  return (
    <div className="bins-grid">
      {bins.map((bin) => {
        const used = occupancy.get(bin.id) ?? 0;
        const items = state.specimens.filter(
          (s) => s.location.kind === "bin" && s.location.binId === bin.id,
        );
        const pct = Math.round((used / bin.capacity) * 100);
        const full = used >= bin.capacity;
        return (
          <section key={bin.id} className={`panel bin-card ${full ? "full" : ""}`}>
            <div className="bin-head">
              <div>
                <p>{bin.code}</p>
                <h2>{bin.name}</h2>
              </div>
              <ZoneBadge zone={bin.zone} />
            </div>
            <div className="bin-env">
              <span>{bin.tempRange}</span>
              <span>{bin.humidity}</span>
            </div>
            <div className="capacity">
              <div className="cap-top">
                <span>
                  容量 <b>{used}</b> / {bin.capacity} 份
                </span>
                <span className={full ? "cap-full" : ""}>{full ? "已满" : `余 ${bin.capacity - used}`}</span>
              </div>
              <div className="cap-bar">
                <i style={{ width: `${pct}%` }} className={full ? "full" : ""} />
              </div>
            </div>

            <ul className="bin-items">
              {items.length === 0 && <Empty text={`${zoneLabel(bin.zone)}仓位暂无标本。`} />}
              {items.map((sp) => (
                <li key={sp.id}>
                  <button className="bin-item-main" onClick={() => navigate(`/specimen/${sp.id}`)}>
                    <b>{sp.collectNo}</b>
                    <span>{sp.species}</span>
                    <IdBadge status={sp.idStatus} />
                    <small>入柜 {fmtTime(sp.receivedAt)}</small>
                  </button>
                  {confirmId === sp.id ? (
                    <span className="return-confirm">
                      <select
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                      >
                        {RETURN_REASONS.map((r) => (
                          <option key={r}>{r}</option>
                        ))}
                      </select>
                      <button className="danger" onClick={() => doReturn(sp.id)}>
                        确认退回
                      </button>
                      <button onClick={() => setConfirmId(null)}>取消</button>
                    </span>
                  ) : (
                    <button className="ghost" onClick={() => setConfirmId(sp.id)}>
                      退回
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <p className="bins-foot">
        退回已接收标本：标本离柜、仓位容量立即释放，调拨历史完整保留，标本状态置为「已退回来源馆」，可在详情页补正后重新登记。
      </p>
    </div>
  );
}
