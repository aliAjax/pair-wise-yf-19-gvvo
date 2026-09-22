import { useMemo, useState } from "react";
import { useStore } from "../state/store";
import { useToast } from "../components/shell";
import { DocFlags, Empty, IdBadge, ZoneBadge } from "../components/badges";
import { ZONE_ORDER, isAvailableFromSource, zoneLabel } from "../rules/transfer";
import type { ClimateZone, Specimen } from "../types";

/** 调拨登记台：勾选来源标本并按气候带生成装箱单，提交时执行规则一。 */
export default function RegisterPage() {
  const { sources, state, registerTransfer } = useStore();
  const toast = useToast();
  const [sourceId, setSourceId] = useState(sources[0].id);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  // 箱面标注覆盖：specimenId -> declaredZone（默认标本自身气候带）
  const [override, setOverride] = useState<Record<string, ClimateZone>>({});
  // 是否允许缺资料标本被勾选（默认允许——勾了才会触发整批拒收演示）
  const [showAll, setShowAll] = useState(true);

  const source = sources.find((s) => s.id === sourceId)!;
  const available = state.specimens.filter(
    (s) => s.sourceId === sourceId && isAvailableFromSource(s),
  );

  const visible = showAll
    ? available
    : available.filter((s) => s.voucherNo && s.quarantine);

  function toggle(id: string) {
    setPicked((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function toggleAll() {
    if (visible.every((s) => picked.has(s.id))) {
      setPicked(new Set());
    } else {
      setPicked(new Set(visible.map((s) => s.id)));
    }
  }

  // 装箱单：先按「箱面标注气候带」分组，每组一箱。
  const groups = useMemo(() => {
    const chosen = state.specimens.filter((s) => picked.has(s.id));
    const map = new Map<ClimateZone, Specimen[]>();
    for (const sp of chosen) {
      const z = override[sp.id] ?? sp.zone;
      const arr = map.get(z) ?? [];
      arr.push(sp);
      map.set(z, arr);
    }
    return ZONE_ORDER.filter((z) => map.has(z)).map((z, i) => ({
      zone: z,
      boxNo: `BX-${String(i + 1).padStart(2, "0")}`,
      items: map.get(z)!,
    }));
  }, [picked, override, state.specimens]);

  const chosenSpecimens = state.specimens.filter((s) => picked.has(s.id));
  const missingDocs = chosenSpecimens.filter((s) => !s.voucherNo || !s.quarantine);
  const misboxed = chosenSpecimens.filter((s) => (override[s.id] ?? s.zone) !== s.zone);

  function submit() {
    if (picked.size === 0) {
      toast({ ok: false, title: "无法登记", detail: "请先勾选要调出的标本。" });
      return;
    }
    const boxes = groups.map((g, i) => ({
      boxNo: `BX-${String(i + 1).padStart(2, "0")}`,
      declaredZone: g.zone,
      specimenIds: g.items.map((s) => s.id),
    }));
    const r = registerTransfer(sourceId, boxes);
    toast(r);
    if (r.ok) {
      setPicked(new Set());
      setOverride({});
    }
  }

  return (
    <div className="register-grid">
      <section className="panel">
        <div className="heading">
          <div>
            <p>第一步</p>
            <h2>选择来源馆与调出标本</h2>
          </div>
        </div>

        <div className="source-tabs">
          {sources.map((s) => (
            <button
              key={s.id}
              className={s.id === sourceId ? "active" : ""}
              onClick={() => {
                setSourceId(s.id);
                setPicked(new Set());
                setOverride({});
              }}
            >
              <b>{s.code}</b>
              <span>{s.name}</span>
            </button>
          ))}
        </div>

        <div className="source-meta">
          联系人：{source.keeper} · {source.contact} · 在源/可登记标本 {available.length} 份
          <label className="inline-check">
            <input
              type="checkbox"
              checked={showAll}
              onChange={(e) => setShowAll(e.target.checked)}
            />
            显示资料不全的标本（勾选后提交可演示整批拒收）
          </label>
        </div>

        <div className="pick-bar">
          <button onClick={toggleAll}>
            {visible.length > 0 && visible.every((s) => picked.has(s.id))
              ? "全部取消"
              : "全选当前"}
          </button>
          <span>已选 {picked.size} 份</span>
        </div>

        <div className="pick-list">
          {visible.length === 0 && <Empty text="该来源馆暂无可登记标本。" />}
          {visible.map((sp) => (
            <label key={sp.id} className={`pick-row ${picked.has(sp.id) ? "on" : ""}`}>
              <input type="checkbox" checked={picked.has(sp.id)} onChange={() => toggle(sp.id)} />
              <div className="pick-main">
                <div className="pick-title">
                  <b>{sp.collectNo}</b>
                  <span>{sp.species}</span>
                  <IdBadge status={sp.idStatus} />
                </div>
                <div className="pick-sub">
                  <ZoneBadge zone={sp.zone} />
                  <DocFlags sp={sp} />
                </div>
              </div>
              {picked.has(sp.id) && (
                <select
                  value={override[sp.id] ?? sp.zone}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) =>
                    setOverride((o) => ({ ...o, [sp.id]: e.target.value as ClimateZone }))
                  }
                  title="箱面标注气候带（改成与标本不符可演示混装拒收）"
                >
                  {ZONE_ORDER.map((z) => (
                    <option key={z} value={z}>
                      贴{zoneLabel(z)}签
                    </option>
                  ))}
                </select>
              )}
            </label>
          ))}
        </div>
      </section>

      <aside className="panel pack-panel">
        <div className="heading">
          <div>
            <p>第二步</p>
            <h2>装箱单与登记</h2>
          </div>
        </div>

        <p className="hint">
          系统按标本气候带自动分箱，每箱贴一个气候带箱面签；接收时按此签拆到对应仓位。
        </p>

        <div className="box-preview">
          {groups.length === 0 && <Empty text="勾选标本后自动生成装箱单。" />}
          {groups.map((g) => (
            <article key={g.zone} className="box-card">
              <header>
                <b>{g.boxNo}</b>
                <ZoneBadge zone={g.zone} />
                <span>{g.items.length} 份</span>
              </header>
              <ul>
                {g.items.map((sp) => (
                  <li key={sp.id} className={sp.zone !== g.zone ? "mismatch" : ""}>
                    {sp.collectNo} · {sp.species}
                    {sp.zone !== g.zone && <em>实际为{zoneLabel(sp.zone)}（混装）</em>}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        {missingDocs.length > 0 && (
          <div className="warn-box">
            <b>资料核验未通过（{missingDocs.length} 份）</b>
            <ul>
              {missingDocs.map((s) => (
                <li key={s.id}>
                  {s.collectNo}：{!s.voucherNo && "缺调出凭证 "}
                  {!s.quarantine && "缺检疫结论"}
                </li>
              ))}
            </ul>
            <p>提交后将整批拒收，不生成批次、来源清单不动。</p>
          </div>
        )}
        {misboxed.length > 0 && missingDocs.length === 0 && (
          <div className="warn-box soft">
            箱面签与 {misboxed.length} 份标本实际气候带不符；登记可成功，但接收拆箱时会整次拒绝。
          </div>
        )}

        <button className="primary big" onClick={submit} disabled={picked.size === 0}>
          提交调出登记（{picked.size} 份）
        </button>
      </aside>
    </div>
  );
}
