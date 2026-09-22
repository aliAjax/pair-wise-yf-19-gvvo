import { useState } from "react";
import { NewBatchModal } from "../components/NewBatchModal";
import { ReceiveModal } from "../components/ReceiveModal";
import { SpecimenRow } from "../components/SpecimenRow";
import {
  fmtDateTime,
  sourceName,
} from "../components/ui";
import {
  BATCH_STAGE_LABEL,
  BIN_MAP,
  SOURCE_MAP,
  ZONE_LABEL,
} from "../rules/constants";
import type { Specimen, TransferBatch } from "../rules/types";
import type { NewSpecimenInput } from "../state/reducer";
import {
  batchSpecimens,
  pendingBatches,
  queuedSpecimens,
  readyBatches,
  rejectedBatches,
} from "../state/selectors";
import { useStore } from "../state/store";

function BatchCard({
  batch,
  members,
  onVerify,
  onUnpack,
  onOpen,
}: {
  batch: TransferBatch;
  members: Specimen[];
  onVerify?: () => void;
  onUnpack?: () => void;
  onOpen: (id: string) => void;
}) {
  const source = SOURCE_MAP[batch.sourceId];
  const zones = Array.from(new Set(members.map((m) => m.zone)));
  const missing = members.filter(
    (m) => !m.voucherNo || m.quarantine !== "pass",
  );
  return (
    <article className="batch-card">
      <div className="batch-head">
        <div>
          <h3>{batch.id} <span className="muted">· {source.short}</span></h3>
          <p>
            {source.name} · 来源清单 {batch.manifestNo} · 登记 {fmtDateTime(batch.createdAt)}
          </p>
        </div>
        <div className="batch-side">
          <span className="badge badge-info">{BATCH_STAGE_LABEL[batch.stage]}</span>
          <span className="muted">{members.length} 份 · {zones.map((z) => ZONE_LABEL[z]).join("/")}</span>
        </div>
      </div>

      <div className="batch-specimens">
        {members.map((s) => (
          <SpecimenRow key={s.id} specimen={s} onOpen={onOpen} />
        ))}
      </div>

      {batch.stage === "rejected" && batch.rejectReason && (
        <div className="rule-note bad">整批拒收原因：{batch.rejectReason}</div>
      )}
      {batch.stage === "pending" && missing.length > 0 && (
        <div className="rule-note warn">
          {missing.length} 份凭证/检疫不合规：核验将整批拒收，来源清单与仓位不动
        </div>
      )}

      <div className="batch-actions">
        {onVerify && (
          <button className="primary" onClick={onVerify}>执行整批核验</button>
        )}
        {onUnpack && (
          <button className="primary" onClick={onUnpack}>按气候带拆箱</button>
        )}
        {batch.verifiedAt && (
          <span className="muted">核验通过 {fmtDateTime(batch.verifiedAt)}</span>
        )}
      </div>
    </article>
  );
}

export function IntakePage({ onOpen }: { onOpen: (id: string) => void }) {
  const { state, dispatch } = useStore();
  const [showNew, setShowNew] = useState(false);
  const [unpacking, setUnpacking] = useState<TransferBatch | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const pending = pendingBatches(state);
  const ready = readyBatches(state);
  const rejected = rejectedBatches(state);
  const queued = queuedSpecimens(state);

  const handleAdd = (sourceId: string, manifestNo: string, rows: NewSpecimenInput[]) => {
    dispatch({ type: "ADD_BATCH", sourceId, manifestNo, specimens: rows });
    setShowNew(false);
    setToast("调拨清单已登记，等待整批核验");
    setTimeout(() => setToast(null), 2600);
  };

  const handleVerify = (batchId: string) => {
    const batch = state.batches.find((b) => b.id === batchId)!;
    const members = batchSpecimens(state, batchId);
    dispatch({ type: "VERIFY_BATCH", batchId });
    const ok = members.every((m) => m.voucherNo && m.quarantine === "pass");
    setToast(
      ok
        ? `批次 ${batchId} 核验通过，${members.length} 份进入拆箱队列`
        : `批次 ${batchId} 整批拒收：来源清单保留，仓位未动`,
    );
    setTimeout(() => setToast(null), 3200);
  };

  const handleReceive = (batchId: string, binId: string) => {
    const bin = BIN_MAP[binId];
    const members = state.specimens.filter(
      (s) => s.batchId === batchId && s.stage === "queued",
    );
    const used = state.specimens.filter(
      (s) => s.stage === "stored" && s.binId === binId,
    ).length;
    const mismatch = members.some((s) => s.zone !== bin.zone);
    const fits = !mismatch && used + members.length <= bin.capacity;
    dispatch({ type: "RECEIVE_BOX", batchId, binId });
    return fits
      ? { ok: true as const, message: `${members.length} 份已入位 ${bin.code}` }
      : {
          ok: false as const,
          reason: mismatch
            ? `${bin.name}气候带不匹配，整次拒收已记入历史`
            : `${bin.name}容量不足，整次拒收已记入历史`,
        };
  };

  const freshUnpacking = unpacking
    ? state.batches.find((b) => b.id === unpacking.id) ?? null
    : null;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2>跨馆调拨入库台</h2>
          <p>登记来源清单 → 整批核验凭证与检疫 → 按气候带拆箱入位；任一环节不合规则整批/整次拒收。</p>
        </div>
        <button className="primary" onClick={() => setShowNew(true)}>+ 新调拨登记</button>
      </div>

      <section className="block">
        <h3 className="block-title">
          待核验批次
          <span className="count-pill">{pending.length}</span>
        </h3>
        {pending.length === 0 ? (
          <p className="empty">暂无待核验批次。</p>
        ) : (
          <div className="card-list">
            {pending.map((b) => (
              <BatchCard
                key={b.id}
                batch={b}
                members={batchSpecimens(state, b.id)}
                onVerify={() => handleVerify(b.id)}
                onOpen={onOpen}
              />
            ))}
          </div>
        )}
      </section>

      <section className="block">
        <h3 className="block-title">
          拆箱队列
          <span className="count-pill">{queued.length}</span>
        </h3>
        {ready.length === 0 ? (
          <p className="empty">核验通过的批次会在此按气候带拆箱。</p>
        ) : (
          <div className="card-list">
            {ready.map((b) => (
              <BatchCard
                key={b.id}
                batch={b}
                members={batchSpecimens(state, b.id).filter((s) => s.stage === "queued")}
                onUnpack={() => setUnpacking(b)}
                onOpen={onOpen}
              />
            ))}
          </div>
        )}
      </section>

      {rejected.length > 0 && (
        <section className="block">
          <h3 className="block-title">
            已拒收清单（留存不动）
            <span className="count-pill bad">{rejected.length}</span>
          </h3>
          <div className="card-list">
            {rejected.map((b) => (
              <BatchCard key={b.id} batch={b} members={batchSpecimens(state, b.id)} onOpen={onOpen} />
            ))}
          </div>
        </section>
      )}

      {showNew && (
        <NewBatchModal onClose={() => setShowNew(false)} onSubmit={handleAdd} />
      )}
      {freshUnpacking && (
        <ReceiveModal
          state={state}
          batch={freshUnpacking}
          onClose={() => setUnpacking(null)}
          onReceive={handleReceive}
        />
      )}
      {toast && <div className="toast">{toast}</div>}
      <p className="source-hint">来源馆：{["HITBC", "LSBG", "CBM"].map(sourceName).join("、")}（规则预置，只读）</p>
    </div>
  );
}
