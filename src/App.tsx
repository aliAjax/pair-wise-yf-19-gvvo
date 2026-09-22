import { useMemo, useState } from "react";
import "./styles.css";
import { SpecimenDetail } from "./components/SpecimenDetail";
import { BinsPage } from "./pages/BinsPage";
import { HistoryPage } from "./pages/HistoryPage";
import { IntakePage } from "./pages/IntakePage";
import { LocalitiesPage } from "./pages/LocalitiesPage";
import { ScreeningPage } from "./pages/ScreeningPage";
import {
  localityCards,
  queuedSpecimens,
  storedSpecimens,
} from "./state/selectors";
import { StoreProvider, useStore } from "./state/store";

type TabId = "intake" | "bins" | "screening" | "localities" | "history";

const TABS: { id: TabId; label: string }[] = [
  { id: "intake", label: "入库台" },
  { id: "bins", label: "仓位记录" },
  { id: "screening", label: "鉴定筛选" },
  { id: "localities", label: "采集地卡" },
  { id: "history", label: "调拨历史" },
];

function Metrics() {
  const { state } = useStore();
  const metrics = useMemo(
    () => [
      { label: "待拆箱（份）", value: queuedSpecimens(state).length },
      { label: "待鉴定（在馆）", value: state.specimens.filter((s) => s.identifyStatus === "pending" && s.stage !== "returned").length },
      { label: "已上柜（份）", value: storedSpecimens(state).length },
      { label: "采集点（个）", value: localityCards(state).length },
    ],
    [state],
  );
  return (
    <section className="metrics">
      {metrics.map((m) => (
        <article key={m.label}>
          <small>{m.label}</small>
          <strong>{m.value}</strong>
        </article>
      ))}
    </section>
  );
}

function Shell() {
  const { state, dispatch } = useStore();
  const [tab, setTab] = useState<TabId>("intake");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const open = (id: string) => setDetailId(id);

  return (
    <main className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">植</span>
          <div>
            <h1>植物标本馆 · 跨馆调拨入库台</h1>
            <p>三馆调拨 · 四气候仓位 · 整批核验 · 按带拆箱</p>
          </div>
        </div>
        <div className="top-actions">
          {!confirmReset ? (
            <button className="ghost-btn" onClick={() => setConfirmReset(true)}>
              恢复预置数据
            </button>
          ) : (
            <div className="inline-reset">
              <span>清空当前数据并恢复预置？</span>
              <button
                className="danger-btn"
                onClick={() => {
                  dispatch({ type: "RESET" });
                  setConfirmReset(false);
                  setDetailId(null);
                }}
              >
                确认
              </button>
              <button onClick={() => setConfirmReset(false)}>取消</button>
            </div>
          )}
        </div>
      </header>

      <section className="rule-strip">
        <span className="rule-item"><b>规则一</b>任一标本缺调出凭证或检疫结论非“合格”，整批拒收</span>
        <span className="rule-item"><b>规则二</b>按气候带拆箱，容量不足或混入不匹配标本，整次拒绝</span>
        <span className="rule-item"><b>规则三</b>拒收不动来源清单与仓位；退回释放柜位且历史保留</span>
        <span className="rule-item"><b>存储</b>数据仅存本浏览器（localStorage），刷新保留</span>
      </section>

      <Metrics />

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? "tab active" : "tab"}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "intake" && <IntakePage onOpen={open} />}
      {tab === "bins" && <BinsPage onOpen={open} />}
      {tab === "screening" && <ScreeningPage onOpen={open} />}
      {tab === "localities" && <LocalitiesPage onOpen={open} />}
      {tab === "history" && <HistoryPage onOpen={open} />}

      {detailId && (
        <SpecimenDetail
          specimenId={detailId}
          onClose={() => setDetailId(null)}
        />
      )}

      <footer className="footer">
        共 {state.batches.length} 个调拨批次 · {state.specimens.length} 份标本 · {state.events.length} 条调拨事件 · 规则 / 状态 / 页面分层
      </footer>
    </main>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
