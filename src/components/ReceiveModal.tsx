import { useMemo, useState } from "react";
import { BINS, SOURCE_MAP, ZONE_LABEL } from "../rules/constants";
import { checkReceive } from "../rules/transfer";
import type { AppState, TransferBatch } from "../rules/types";
import { batchSpecimens, storedInBin } from "../state/selectors";
import { IdentifyBadge, ZoneTag } from "./ui";

export function ReceiveModal({
  state,
  batch,
  onClose,
  onReceive,
}: {
  state: AppState;
  batch: TransferBatch;
  onClose: () => void;
  onReceive: (
    batchId: string,
    binId: string,
  ) => { ok: true; message: string } | { ok: false; reason: string };
}) {
  const members = useMemo(
    () => batchSpecimens(state, batch.id).filter((s) => s.stage === "queued"),
    [state, batch.id],
  );
  const zones = useMemo(
    () => Array.from(new Set(members.map((m) => m.zone))),
    [members],
  );
  const suggested = zones.length === 1 ? zones[0] : undefined;
  const suggestedBin = suggested ? BINS.find((b) => b.zone === suggested) : undefined;
  const [binId, setBinId] = useState<string>(
    suggestedBin?.id ?? BINS[0].id,
  );
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const bin = BINS.find((b) => b.id === binId)!;
  const used = storedInBin(state, bin.id).length;
  const check = checkReceive(members, bin, used);
  const mismatchCount = members.filter((m) => m.zone !== bin.zone).length;
  const source = SOURCE_MAP[batch.sourceId];

  const doReceive = () => {
    const res = onReceive(batch.id, bin.id);
    setFeedback(
      res.ok
        ? { ok: true, text: res.message }
        : { ok: false, text: `已记录拆箱拒收：${res.reason}` },
    );
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2>按气候带拆箱 · {batch.id}</h2>
            <p className="modal-sub">
              {source?.name} · 清单 {batch.manifestNo} · 队列中 {members.length} 份
              {zones.map((z) => ` · ${ZONE_LABEL[z]} ${members.filter((m) => m.zone === z).length}`)}
            </p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="关闭">×</button>
        </div>

        <label className="target-select">
          <span>目标仓位（选错气候带或容量不足将整次拒绝）</span>
          <div className="bin-choice">
            {BINS.map((b) => {
              const bUsed = storedInBin(state, b.id).length;
              const isMatch = zones.includes(b.zone);
              return (
                <button
                  key={b.id}
                  className={b.id === binId ? "bin-pick active" : "bin-pick"}
                  onClick={() => { setBinId(b.id); setFeedback(null); }}
                  title={isMatch ? undefined : "本箱无该气候带标本"}
                >
                  <strong>{b.code} · {b.name}</strong>
                  <span className={bUsed >= b.capacity ? "danger-text" : ""}>
                    {bUsed}/{b.capacity}
                  </span>
                  {isMatch && <em className="pick-tag">匹配</em>}
                </button>
              );
            })}
          </div>
        </label>

        <div className="unpack-list">
          {members.map((s) => {
            const matched = s.zone === bin.zone;
            return (
              <div key={s.id} className={`unpack-item ${matched ? "" : "mismatch"}`}>
                <div>
                  <strong>
                    {s.collectionNo} · {s.species}
                    {!matched && <span className="badge badge-bad">气候带不匹配</span>}
                  </strong>
                  <span>{s.locality}{s.altitude !== undefined ? ` · ${s.altitude}m` : ""}</span>
                </div>
                <div className="sp-badges">
                  <IdentifyBadge status={s.identifyStatus} />
                  <ZoneTag zone={s.zone} />
                </div>
              </div>
            );
          })}
        </div>

        <div className={`rule-note ${check.ok ? "ok" : "bad"}`}>
          {check.ok
            ? `✓ ${members.length} 份标本气候带全部匹配 ${bin.code}，剩余容量 ${
                bin.capacity - used
              } 份充足，整次入位（柜位 ${bin.code}-${String(used + 1).padStart(2, "0")} 起）`
            : `✕ ${check.reason}。执行将整次拒绝，来源清单与仓位均不动，仅记录调拨历史。`}
        </div>

        {mismatchCount === 0 && !check.ok && (
          <p className="muted">提示：可先退回部分已上柜标本释放柜位，再重新拆箱。</p>
        )}

        {feedback && (
          <div className={`rule-note ${feedback.ok ? "ok" : "bad"}`}>
            {feedback.ok ? "✓ " : "✕ "}{feedback.text}
          </div>
        )}

        <div className="modal-foot">
          <button onClick={onClose}>关闭</button>
          <button
            className={check.ok ? "primary" : "danger-btn"}
            onClick={doReceive}
          >
            {check.ok ? `确认拆箱入位（${members.length} 份）` : "仍执行（记录整次拒收）"}
          </button>
        </div>
      </div>
    </div>
  );
}
