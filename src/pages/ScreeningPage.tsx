import { useMemo, useState } from "react";
import { SpecimenRow } from "../components/SpecimenRow";
import { IDENTIFY_FILTERS } from "../rules/constants";
import type { IdentifyStatus, SpecimenStage } from "../rules/types";
import { useStore } from "../state/store";

const STAGE_TABS: { id: SpecimenStage | "all"; label: string }[] = [
  { id: "all", label: "全部环节" },
  { id: "queued", label: "待拆箱" },
  { id: "stored", label: "已上柜" },
  { id: "pending", label: "待核验" },
  { id: "returned", label: "已退回" },
];

export function ScreeningPage({ onOpen }: { onOpen: (id: string) => void }) {
  const { state } = useStore();
  const [identify, setIdentify] = useState<IdentifyStatus | "all">("all");
  const [stage, setStage] = useState<SpecimenStage | "all">("all");
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return state.specimens
      .filter((s) => identify === "all" || s.identifyStatus === identify)
      .filter((s) => stage === "all" || s.stage === stage)
      .filter(
        (s) =>
          !kw ||
          [s.collectionNo, s.species, s.family ?? "", s.locality, s.collector ?? "", s.slotNo ?? ""]
            .join(" ")
            .toLowerCase()
            .includes(kw),
      )
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [state.specimens, identify, stage, q]);

  const pendingCount = state.specimens.filter((s) => s.identifyStatus === "pending" && s.stage !== "returned").length;
  const doubtfulCount = state.specimens.filter((s) => s.identifyStatus === "doubtful" && s.stage !== "returned").length;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2>鉴定筛选</h2>
          <p>按鉴定状态、入库环节与关键字筛查标本；待鉴定 {pendingCount} 份，存疑待核 {doubtfulCount} 份。</p>
        </div>
        <input
          className="search-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索采集号 / 物种 / 地点 / 柜位"
        />
      </div>

      <div className="filter-bar">
        {IDENTIFY_FILTERS.map((f) => (
          <button
            key={f.id}
            className={identify === f.id ? "chip active" : "chip"}
            onClick={() => setIdentify(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="filter-bar sub">
        {STAGE_TABS.map((t) => (
          <button
            key={t.id}
            className={stage === t.id ? "chip chip-outline active" : "chip chip-outline"}
            onClick={() => setStage(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="result-meta muted">共 {list.length} 份</div>
      <div className="plain-list">
        {list.length === 0 ? (
          <p className="empty">没有符合条件的标本。</p>
        ) : (
          list.map((s) => <SpecimenRow key={s.id} specimen={s} onOpen={onOpen} />)
        )}
      </div>
    </div>
  );
}
