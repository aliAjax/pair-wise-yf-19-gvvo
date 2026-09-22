import { useMemo, useState } from "react";
import { StoreProvider, useStore } from "./state/store";
import { ToastProvider, useHashRoute } from "./components/shell";
import { idStatusLabel } from "./rules/transfer";
import type { IdStatus } from "./types";
import RegisterPage from "./pages/RegisterPage";
import QueuePage from "./pages/QueuePage";
import BinsPage from "./pages/BinsPage";
import LocalitiesPage from "./pages/LocalitiesPage";
import HistoryPage from "./pages/HistoryPage";
import SpecimenDetail from "./pages/SpecimenDetail";

type Tab = "register" | "queue" | "bins" | "localities" | "history";

const TABS: { id: Tab; label: string }[] = [
  { id: "register", label: "调拨登记" },
  { id: "queue", label: "入库队列" },
  { id: "bins", label: "仓位记录" },
  { id: "localities", label: "采集地卡" },
  { id: "history", label: "调拨历史" },
];

const ID_FILTERS: { id: IdStatus | "all"; label: string }[] = [
  { id: "all", label: "全部鉴定" },
  { id: "unidentified", label: "待鉴定" },
  { id: "suspect", label: "存疑待复核" },
  { id: "identified", label: "已鉴定" },
];

function Metrics() {
  const { state, occupancy, bins } = useStore();
  const queued = state.batches.filter((b) => b.status === "incoming").length;
  const pendingId = state.specimens.filter(
    (s) => s.idStatus !== "identified" && s.location.kind !== "returned",
  ).length;
  const onShelf = state.specimens.filter((s) => s.location.kind === "bin").length;
  const spots = useMemo(() => {
    let free = 0;
    for (const b of bins) free += b.capacity - (occupancy.get(b.id) ?? 0);
    return free;
  }, [occupancy, bins]);
  const sites = new Set(state.specimens.map((s) => s.localityCode)).size;

  const cards = [
    { label: "待接收批次", value: queued },
    { label: "待鉴定/存疑", value: pendingId },
    { label: "已上柜标本", value: onShelf },
    { label: "仓位空余份数", value: spots },
    { label: "采集点", value: sites },
  ];
  return (
    <section className="metrics">
      {cards.map((c) => (
        <article key={c.label}>
          <small>{c.label}</small>
          <strong>{c.value}</strong>
        </article>
      ))}
    </section>
  );
}

function Workspace() {
  const { state, resetAll } = useStore();
  const route = useHashRoute();
  const [tab, setTab] = useState<Tab>("register");
  const [idFilter, setIdFilter] = useState<IdStatus | "all">("all");

  // 详情路由：#/specimen/SP-001
  const detailMatch = route.match(/^#?\/specimen\/(.+)$/);
  if (detailMatch) {
    const id = decodeURIComponent(detailMatch[1]);
    return <SpecimenDetail id={id} />;
  }

  return (
    <>
      <section className="hero">
        <p>跨馆调拨 · 按气候带拆箱入库 · 数据仅存本机浏览器</p>
        <h1>植物标本馆跨馆调拨入库台</h1>
        <span>
          三个来源馆（KUN 昆明 / PE 北京 / IBSC 华南）向本馆调拨压制标本。登记时逐份核验调出凭证与检疫结论，任一缺失整批拒收；
          接收时按箱面气候带拆入热带、亚热带、温带、高寒四个仓位，容量不足或箱内混装则整次拒绝，来源清单与仓位不动；
          已接收标本可退回，仓位释放、历史保留。
        </span>
      </section>

      <Metrics />

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? "active" : ""}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.id === "queue" && (
              <em className="tab-dot">
                {state.batches.filter((b) => b.status === "incoming").length}
              </em>
            )}
          </button>
        ))}
        <button className="reset" onClick={() => {
          if (window.confirm("清空浏览器中的全部本地数据并恢复预置台账？")) resetAll();
        }}>
          重置演示数据
        </button>
      </nav>

      <div className="filter-bar panel">
        <span>鉴定筛选（同步于采集地卡与各标本列表）：</span>
        <div className="chips">
          {ID_FILTERS.map((f) => (
            <button
              key={f.id}
              className={idFilter === f.id ? "chip-active" : ""}
              onClick={() => setIdFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        {idFilter !== "all" && (
          <em className="filter-note">
            当前仅显示「{idStatusLabel(idFilter)}」相关内容
          </em>
        )}
      </div>

      {tab === "register" && <RegisterPage />}
      {tab === "queue" && <QueuePage />}
      {tab === "bins" && <BinsPage />}
      {tab === "localities" && <LocalitiesPage filter={idFilter} />}
      {tab === "history" && <HistoryPage />}
    </>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <main className="app">
          <Workspace />
        </main>
      </ToastProvider>
    </StoreProvider>
  );
}
