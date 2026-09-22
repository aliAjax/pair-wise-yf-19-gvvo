import { useState } from "react";
import {
  EVENT_META,
  IDENTIFY_LABEL,
  QUARANTINE_LABEL,
  ZONE_LABEL,
} from "../rules/constants";
import { eventsForSpecimen } from "../state/selectors";
import { useStore } from "../state/store";
import {
  Badge,
  IdentifyBadge,
  QuarantineBadge,
  StageBadge,
  fmtDateTime,
  sourceName,
} from "./ui";
import type { IdentifyStatus } from "../rules/types";

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="dt-field">
      <dt>{label}</dt>
      <dd>{value === undefined || value === null || value === "" ? "—" : value}</dd>
    </div>
  );
}

export function SpecimenDetail({
  specimenId,
  onClose,
}: {
  specimenId: string;
  onClose: () => void;
}) {
  const { state, dispatch } = useStore();
  const specimen = state.specimens.find((s) => s.id === specimenId);
  const [editing, setEditing] = useState(false);
  const [identify, setIdentify] = useState<IdentifyStatus>("identified");
  const [family, setFamily] = useState("");
  const [returning, setReturning] = useState(false);
  const [reason, setReason] = useState("馆际复查重号");

  if (!specimen) return null;

  const batch = state.batches.find((b) => b.id === specimen.batchId);
  const timeline = eventsForSpecimen(state, specimen.id).sort((a, b) => b.at - a.at);

  const startEdit = () => {
    setIdentify(specimen!.identifyStatus);
    setFamily(specimen!.family ?? "");
    setEditing(true);
  };

  const saveIdentify = () => {
    dispatch({
      type: "UPDATE_IDENTIFY",
      specimenId: specimen.id,
      identifyStatus: identify,
      family: family.trim() || undefined,
    });
    setEditing(false);
  };

  const confirmReturn = () => {
    dispatch({ type: "RETURN_SPECIMEN", specimenId: specimen.id, reason });
    setReturning(false);
  };

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div>
            <p className="eyebrow">单份标本详情</p>
            <h2>{specimen.collectionNo}</h2>
            <div className="dt-badges">
              <StageBadge stage={specimen.stage} />
              <IdentifyBadge status={specimen.identifyStatus} />
              <QuarantineBadge value={specimen.quarantine} />
              <Badge tone="info">{ZONE_LABEL[specimen.zone]}气候带</Badge>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="关闭">×</button>
        </div>

        <div className="drawer-body">
          <section className="dt-section">
            <h3>分类与采集信息</h3>
            <dl className="dt-grid">
              <Field label="物种名称" value={specimen.species} />
              <Field label="科名" value={specimen.family} />
              <Field label="采集地点" value={specimen.locality} />
              <Field label="海拔" value={specimen.altitude !== undefined ? `${specimen.altitude} m` : undefined} />
              <Field label="生境描述" value={specimen.habitat} />
              <Field label="采集人" value={specimen.collector} />
              <Field label="压制状态" value={specimen.pressed ? "已压制" : "待压制"} />
              <Field label="鉴定状态" value={IDENTIFY_LABEL[specimen.identifyStatus]} />
            </dl>
            {!editing ? (
              <button className="ghost-btn" onClick={startEdit}>更新鉴定结论</button>
            ) : (
              <div className="inline-edit">
                <select value={identify} onChange={(e) => setIdentify(e.target.value as IdentifyStatus)}>
                  <option value="identified">已鉴定</option>
                  <option value="pending">待鉴定</option>
                  <option value="doubtful">存疑待核</option>
                </select>
                <input value={family} onChange={(e) => setFamily(e.target.value)} placeholder="科名（可选）" />
                <button className="primary" onClick={saveIdentify}>保存</button>
                <button onClick={() => setEditing(false)}>取消</button>
              </div>
            )}
          </section>

          <section className="dt-section">
            <h3>调拨与仓位</h3>
            <dl className="dt-grid">
              <Field label="来源馆" value={sourceName(specimen.sourceId)} />
              <Field label="调拨批次" value={specimen.batchId} />
              <Field label="来源清单号" value={batch?.manifestNo} />
              <Field label="调出凭证号" value={specimen.voucherNo ?? "（缺失）"} />
              <Field label="检疫结论" value={QUARANTINE_LABEL[specimen.quarantine]} />
              <Field label="馆藏柜位" value={specimen.slotNo ?? "未上柜"} />
              <Field label="入位时间" value={specimen.receivedAt ? fmtDateTime(specimen.receivedAt) : undefined} />
              <Field label="退回时间" value={specimen.returnedAt ? fmtDateTime(specimen.returnedAt) : undefined} />
            </dl>

            {specimen.stage === "stored" && !returning && (
              <button className="danger-btn" onClick={() => setReturning(true)}>
                退回该标本（释放 {specimen.slotNo}）
              </button>
            )}
            {returning && (
              <div className="inline-edit">
                <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="退回原因" />
                <button className="danger-btn" onClick={confirmReturn}>确认退回</button>
                <button onClick={() => setReturning(false)}>取消</button>
              </div>
            )}
            {specimen.stage === "returned" && (
              <div className="rule-note warn">该标本已退回来源馆，对应柜位已释放；调拨历史完整保留。</div>
            )}
          </section>

          <section className="dt-section">
            <h3>调拨轨迹</h3>
            <ol className="timeline compact">
              {timeline.map((e) => {
                const meta = EVENT_META[e.type];
                return (
                  <li key={e.id} className={`tl-item tone-${meta.tone}`}>
                    <span className="tl-dot" />
                    <div className="tl-body">
                      <div className="tl-head">
                        <Badge tone={meta.tone === "bad" ? "bad" : meta.tone === "warn" ? "warn" : meta.tone === "ok" ? "ok" : "info"}>
                          {meta.label}
                        </Badge>
                        <time>{fmtDateTime(e.at)}</time>
                      </div>
                      <p>{e.message}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>
      </aside>
    </div>
  );
}
