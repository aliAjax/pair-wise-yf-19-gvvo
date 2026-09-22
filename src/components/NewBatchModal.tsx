import { useMemo, useState } from "react";
import { SOURCES, ZONE_LABEL } from "../rules/constants";
import type { ClimateZone, IdentifyStatus, QuarantineResult } from "../rules/types";
import type { NewSpecimenInput } from "../state/reducer";

interface DraftRow {
  collectionNo: string;
  species: string;
  locality: string;
  altitude: string;
  habitat: string;
  collector: string;
  family: string;
  voucherNo: string;
  quarantine: QuarantineResult;
  zone: ClimateZone;
  identifyStatus: IdentifyStatus;
}

const blankRow = (): DraftRow => ({
  collectionNo: "",
  species: "",
  locality: "",
  altitude: "",
  habitat: "",
  collector: "",
  family: "",
  voucherNo: "",
  quarantine: "pass",
  zone: "subtropical",
  identifyStatus: "pending",
});

export function NewBatchModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (sourceId: string, manifestNo: string, rows: NewSpecimenInput[]) => void;
}) {
  const [sourceId, setSourceId] = useState<string>(SOURCES[0].id);
  const [manifestNo, setManifestNo] = useState("");
  const [rows, setRows] = useState<DraftRow[]>([blankRow(), blankRow()]);
  const [error, setError] = useState("");

  const update = (i: number, patch: Partial<DraftRow>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const valid = useMemo(() => {
    return (
      manifestNo.trim() !== "" &&
      rows.every((r) => r.collectionNo.trim() && r.species.trim() && r.locality.trim())
    );
  }, [manifestNo, rows]);

  const submit = () => {
    if (!valid) {
      setError("请填写清单号，并补全每份标本的采集号、物种名称、采集地点");
      return;
    }
    const payload: NewSpecimenInput[] = rows.map((r) => ({
      collectionNo: r.collectionNo.trim(),
      species: r.species.trim(),
      locality: r.locality.trim(),
      altitude: r.altitude ? Number(r.altitude) : undefined,
      habitat: r.habitat.trim(),
      collector: r.collector.trim(),
      family: r.family.trim(),
      voucherNo: r.voucherNo.trim(),
      quarantine: r.quarantine,
      zone: r.zone,
      identifyStatus: r.identifyStatus,
    }));
    onSubmit(sourceId, manifestNo.trim(), payload);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>跨馆调拨登记</h2>
          <button className="icon-btn" onClick={onClose} aria-label="关闭">×</button>
        </div>

        <div className="form-grid form-grid-3">
          <label>
            <span>来源馆</span>
            <select value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
              {SOURCES.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
          <label>
            <span>来源清单号</span>
            <input
              value={manifestNo}
              onChange={(e) => setManifestNo(e.target.value)}
              placeholder="如 ML-2409-072"
            />
          </label>
          <label className="hint-label">
            <span>规则提示</span>
            <div className="hint-text">登记后须逐份核验调出凭证与检疫结论，任一缺失整批拒收</div>
          </label>
        </div>

        <div className="draft-list">
          {rows.map((r, i) => (
            <fieldset className="draft-card" key={i}>
              <legend>标本 {i + 1}</legend>
              <div className="form-grid form-grid-3">
                <label>
                  <span>采集号 *</span>
                  <input value={r.collectionNo} onChange={(e) => update(i, { collectionNo: e.target.value })} placeholder="HX-XX-000" />
                </label>
                <label>
                  <span>物种名称 *</span>
                  <input value={r.species} onChange={(e) => update(i, { species: e.target.value })} placeholder="物种 / 类群" />
                </label>
                <label>
                  <span>科名</span>
                  <input value={r.family} onChange={(e) => update(i, { family: e.target.value })} placeholder="鉴定科名（可空）" />
                </label>
                <label>
                  <span>采集地点 *</span>
                  <input value={r.locality} onChange={(e) => update(i, { locality: e.target.value })} placeholder="山系 / 地名 / 小地点" />
                </label>
                <label>
                  <span>海拔（米）</span>
                  <input type="number" value={r.altitude} onChange={(e) => update(i, { altitude: e.target.value })} placeholder="如 1200" />
                </label>
                <label>
                  <span>采集人</span>
                  <input value={r.collector} onChange={(e) => update(i, { collector: e.target.value })} />
                </label>
                <label className="span-2">
                  <span>生境描述</span>
                  <input value={r.habitat} onChange={(e) => update(i, { habitat: e.target.value })} placeholder="林分 / 坡位 / 基质" />
                </label>
                <label>
                  <span>气候带（拆箱依据）</span>
                  <select value={r.zone} onChange={(e) => update(i, { zone: e.target.value as ClimateZone })}>
                    {(Object.keys(ZONE_LABEL) as ClimateZone[]).map((z) => (
                      <option key={z} value={z}>{ZONE_LABEL[z]}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>调出凭证号</span>
                  <input value={r.voucherNo} onChange={(e) => update(i, { voucherNo: e.target.value })} placeholder="V-xxxx（缺则拒收）" />
                </label>
                <label>
                  <span>检疫结论</span>
                  <select
                    value={r.quarantine}
                    onChange={(e) => update(i, { quarantine: e.target.value as QuarantineResult })}
                  >
                    <option value="pass">检疫合格</option>
                    <option value="fail">检疫不合格</option>
                    <option value="">未出结论</option>
                  </select>
                </label>
                <label>
                  <span>鉴定状态</span>
                  <select
                    value={r.identifyStatus}
                    onChange={(e) => update(i, { identifyStatus: e.target.value as IdentifyStatus })}
                  >
                    <option value="pending">待鉴定</option>
                    <option value="identified">已鉴定</option>
                    <option value="doubtful">存疑待核</option>
                  </select>
                </label>
              </div>
              {rows.length > 1 && (
                <button className="danger-link" onClick={() => setRows((rs) => rs.filter((_, idx) => idx !== i))}>
                  移除该份
                </button>
              )}
            </fieldset>
          ))}
        </div>

        <button className="ghost-btn" onClick={() => setRows((rs) => [...rs, blankRow()])}>
          + 再添一份标本
        </button>

        {error && <p className="form-error">{error}</p>}

        <div className="modal-foot">
          <button onClick={onClose}>取消</button>
          <button className="primary" onClick={submit} disabled={!valid}>
            登记并进入待核验
          </button>
        </div>
      </div>
    </div>
  );
}
