import { useState } from "react";
import { useStore } from "../state/store";
import { useToast, navigate } from "../components/shell";
import { DocFlags, Empty, IdBadge, PressBadge, QuarantineBadge, ZoneBadge, fmtTime } from "../components/badges";
import { idStatusLabel, zoneLabel } from "../rules/transfer";
import type { IdStatus, Quarantine } from "../types";

const RETURN_REASONS = [
  "复检发现病虫害",
  "凭证复核不通过",
  "来源馆要求召回",
  "标本损坏不宜入藏",
  "气候带核定错误",
];

export default function SpecimenDetail({ id }: { id: string }) {
  const { state, sources, localities, bins, updateIdStatus, updateDocs, returnSpecimen } =
    useStore();
  const toast = useToast();
  const sp = state.specimens.find((x) => x.id === id);
  const [voucher, setVoucher] = useState(sp?.voucherNo ?? "");
  const [quarantine, setQuarantine] = useState<Quarantine>(sp?.quarantine ?? "");
  const [reason, setReason] = useState(RETURN_REASONS[0]);

  if (!sp) {
    return (
      <section className="panel">
        <Empty text="找不到该标本，可能已被重置。" />
        <button className="primary" onClick={() => navigate("/")}>
          返回工作台
        </button>
      </section>
    );
  }

  const source = sources.find((s) => s.id === sp.sourceId);
  const loc = localities.find((l) => l.code === sp.localityCode);
  // 与该标本相关的事件：直接点名的，或其所在批次的事件。
  const batchIds = new Set(
    state.batches.filter((b) => b.specimenIds.includes(sp.id)).map((b) => b.id),
  );
  const relatedEvents = state.events.filter(
    (e) => e.specimenIds?.includes(sp.id) || (Boolean(e.batchId) && batchIds.has(e.batchId!)),
  );

  const editable = sp.location.kind === "source" || sp.location.kind === "returned";
  const locText = (() => {
    switch (sp.location.kind) {
      case "source":
        return `在来源馆：${source?.name ?? sp.sourceId}`;
      case "returned":
        return `已退回来源馆：${source?.name ?? sp.sourceId}（可补正后重新登记）`;
      case "incoming":
        return `调拨在途，批次 ${sp.location.batchId.slice(-8).toUpperCase()}`;
      case "bin": {
        const bin = bins.find((b) => b.id === (sp.location.kind === "bin" ? sp.location.binId : ""));
        return `已上柜：${bin?.code ?? sp.location.binId}（${bin ? zoneLabel(bin.zone) : ""}）`;
      }
    }
  })();

  return (
    <div className="detail-grid">
      <section className="panel">
        <button className="back" onClick={() => navigate("/")}>
          ← 返回工作台
        </button>
        <div className="detail-head">
          <div>
            <p>{sp.id} · 采集号 {sp.collectNo}</p>
            <h2>{sp.species}</h2>
            <div className="detail-badges">
              <ZoneBadge zone={sp.zone} />
              <IdBadge status={sp.idStatus} />
              <PressBadge status={sp.pressStatus} />
              <QuarantineBadge q={sp.quarantine} />
            </div>
          </div>
          <div className="detail-loc">{locText}</div>
        </div>

        <dl className="detail-fields">
          <div><dt>科名</dt><dd>{sp.family}</dd></div>
          <div><dt>采集人</dt><dd>{sp.collector}</dd></div>
          <div><dt>来源馆</dt><dd>{source?.code} · {source?.name}</dd></div>
          <div><dt>采集地</dt><dd>{loc?.name}（{loc?.province}）</dd></div>
          <div><dt>海拔</dt><dd>{sp.elevation} m</dd></div>
          <div><dt>坐标 / 群系</dt><dd>{loc?.geo} · {loc?.biome}</dd></div>
          <div className="span2"><dt>生境描述</dt><dd>{sp.habitat}</dd></div>
          <div><dt>调出凭证</dt><dd>{sp.voucherNo || <em className="muted">缺失</em>}</dd></div>
          <div><dt>入柜时间</dt><dd>{fmtTime(sp.receivedAt)}</dd></div>
        </dl>
      </section>

      <div className="detail-side">
        <section className="panel">
          <h3>鉴定状态</h3>
          <div className="seg">
            {(["unidentified", "identified", "suspect"] as IdStatus[]).map((s) => (
              <button
                key={s}
                className={sp.idStatus === s ? "active" : ""}
                onClick={() => {
                  updateIdStatus(sp.id, s);
                  toast({ ok: true, title: "已更新", detail: `鉴定状态：${idStatusLabel(s)}` });
                }}
              >
                {idStatusLabel(s)}
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          <h3>调出凭证与检疫</h3>
          {editable ? (
            <div className="doc-edit">
              <label>
                <span>调出凭证编号</span>
                <input value={voucher} onChange={(e) => setVoucher(e.target.value)} placeholder="如 DZ-KUN-240805" />
              </label>
              <label>
                <span>检疫结论</span>
                <select value={quarantine} onChange={(e) => setQuarantine(e.target.value as Quarantine)}>
                  <option value="">未出结论</option>
                  <option value="pass">检疫合格</option>
                  <option value="recheck">待复检</option>
                </select>
              </label>
              <button
                className="primary"
                onClick={() => {
                  const r = updateDocs(sp.id, {
                    voucherNo: voucher.trim(),
                    quarantine,
                  });
                  toast(r);
                }}
              >
                保存资料
              </button>
              <p className="hint">补齐后重新登记即可通过资料关。</p>
            </div>
          ) : (
            <DocFlags sp={sp} />
          )}
        </section>

        <section className="panel">
          <h3>退回处理</h3>
          {sp.location.kind === "bin" ? (
            <div className="doc-edit">
              <label>
                <span>退回原因</span>
                <select value={reason} onChange={(e) => setReason(e.target.value)}>
                  {RETURN_REASONS.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </label>
              <button
                className="danger"
                onClick={() => {
                  const r = returnSpecimen(sp.id, reason);
                  toast(r);
                }}
              >
                退回来源馆并释放仓位
              </button>
            </div>
          ) : (
            <p className="muted">仅已上柜标本可退回。</p>
          )}
        </section>
      </div>

      <section className="panel span-all">
        <h3>该标本的调拨轨迹</h3>
        {relatedEvents.length === 0 ? (
          <Empty text="尚无调拨事件。" />
        ) : (
          <ol className="timeline">
            {[...relatedEvents].reverse().map((ev) => (
              <li key={ev.id} className={`tl-item tl-${ev.kind}`}>
                <div className="tl-time">{fmtTime(ev.at)}</div>
                <div className="tl-body">
                  <p>{ev.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
