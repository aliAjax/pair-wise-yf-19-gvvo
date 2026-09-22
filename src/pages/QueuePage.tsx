import { useState } from "react";
import { useStore } from "../state/store";
import { useToast, navigate } from "../components/shell";
import { DocFlags, Empty, IdBadge, ZoneBadge, fmtTime } from "../components/badges";
import { batchStatusLabel, zoneLabel } from "../rules/transfer";
import type { TransferBatch } from "../types";

export default function QueuePage() {
  const { state, sources, bins, specimenById, receiveBatch, withdrawBatch } = useStore();
  const toast = useToast();
  const [openId, setOpenId] = useState<string | null>(null);

  const sourceName = (id: string) => sources.find((s) => s.id === id)?.name ?? id;
  const binCode = (id: string) => bins.find((b) => b.id === id)?.code ?? id;

  const incoming = state.batches.filter((b) => b.status === "incoming");
  const others = state.batches.filter((b) => b.status !== "incoming");

  function BatchCard({ batch }: { batch: TransferBatch }) {
    const open = openId === batch.id;
    return (
      <article className={`batch-card status-${batch.status}`}>
        <header className="batch-head" onClick={() => setOpenId(open ? null : batch.id)}>
          <div>
            <b>{batch.id.slice(-8).toUpperCase()}</b>
            <span>{sourceName(batch.sourceId)}</span>
          </div>
          <div className="batch-meta">
            <span className={`badge batch-${batch.status}`}>
              {batchStatusLabel(batch.status)}
            </span>
            <span>{batch.specimenIds.length} 份 · {batch.boxes.length} 箱</span>
            <span>{fmtTime(batch.createdAt)}</span>
            <span className="caret">{open ? "收起 ▲" : "展开 ▼"}</span>
          </div>
        </header>

        {open && (
          <div className="batch-body">
            {batch.boxes.map((box) => (
              <div key={box.boxNo} className="box-line">
                <div className="box-line-head">
                  <b>{box.boxNo}</b>
                  <ZoneBadge zone={box.declaredZone} />
                  <span>
                    → {bins.find((b) => b.zone === box.declaredZone)?.code ?? "无对应仓位"}（
                    {zoneLabel(box.declaredZone)}）
                  </span>
                </div>
                <div className="spec-chips">
                  {box.specimenIds.map((sid) => {
                    const sp = specimenById.get(sid);
                    if (!sp) return null;
                    const mismatch = sp.zone !== box.declaredZone;
                    return (
                      <button
                        key={sid}
                        className={`spec-chip ${mismatch ? "mismatch" : ""}`}
                        onClick={() => navigate(`/specimen/${sid}`)}
                        title={mismatch ? "气候带与箱面签不匹配" : "打开详情"}
                      >
                        <b>{sp.collectNo}</b>
                        <span>{sp.species}</span>
                        <IdBadge status={sp.idStatus} />
                        {mismatch && <em className="chip-warn">混装</em>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {batch.status === "incoming" && (
              <div className="batch-actions">
                <button
                  className="primary"
                  onClick={() => toast(receiveBatch(batch.id))}
                >
                  按气候带拆箱接收
                </button>
                <button onClick={() => toast(withdrawBatch(batch.id))}>撤回登记</button>
                <span className="action-note">
                  容量不足或箱内混装将整次拒绝，来源清单与仓位均不改动。
                </span>
              </div>
            )}

            {batch.status === "rejected" && (
              <div className="result-banner bad">
                <b>接收已整次拒绝</b>
                <p>{batch.rejectReason}</p>
                <p className="fix-note">
                  标本仍随本批在途记录保留，来源清单与仓位均未改动。可撤回批次后在标本详情补正资料、重新登记。
                </p>
                <div className="batch-actions" style={{ marginTop: 10 }}>
                  <button onClick={() => toast(withdrawBatch(batch.id))}>撤回该批次（标本回来源清单）</button>
                </div>
              </div>
            )}

            {batch.status === "withdrawn" && (
              <div className="result-banner neutral">
                已撤回：{batch.rejectReason}
              </div>
            )}

            {batch.status === "received" && batch.receipts && (
              <div className="result-banner ok">
                <b>拆箱落位记录（{fmtTime(batch.receivedAt)}）</b>
                <ul>
                  {batch.receipts.map((r) => (
                    <li key={r.boxNo}>
                      {r.boxNo}（{zoneLabel(r.declaredZone)}）→ {binCode(r.binId)} ·{" "}
                      {r.specimenIds.length} 份
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </article>
    );
  }

  return (
    <div className="queue-page">
      <section className="panel">
        <div className="heading">
          <div>
            <p>入库队列</p>
            <h2>待接收批次（{incoming.length}）</h2>
          </div>
        </div>
        {incoming.length === 0 ? (
          <Empty text="暂无待接收批次，先到「调拨登记」选择标本登记调出。" />
        ) : (
          <div className="batch-list">
            {incoming.map((b) => (
              <BatchCard key={b.id} batch={b} />
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="heading">
          <div>
            <p>历史批次</p>
            <h2>已接收 / 拒收 / 撤回（{others.length}）</h2>
          </div>
        </div>
        {others.length === 0 ? (
          <Empty text="尚无处理过的批次。" />
        ) : (
          <div className="batch-list">
            {others.map((b) => (
              <BatchCard key={b.id} batch={b} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
