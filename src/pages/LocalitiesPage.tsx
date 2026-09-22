import { useStore } from "../state/store";
import { navigate } from "../components/shell";
import { IdBadge, PressBadge, ZoneBadge } from "../components/badges";
import type { IdStatus } from "../types";

export default function LocalitiesPage({ filter }: { filter: IdStatus | "all" }) {
  const { state, localities, sources } = useStore();

  return (
    <div className="loc-grid">
      {localities.map((loc) => {
        const all = state.specimens.filter((s) => s.localityCode === loc.code);
        const items = filter === "all" ? all : all.filter((s) => s.idStatus === filter);
        const crossZone = new Set(all.map((s) => s.zone)).size > 1;
        return (
          <article key={loc.code} className="panel loc-card">
            <header className="loc-head">
              <div>
                <p>{loc.province} · {loc.code}</p>
                <h3>{loc.name}</h3>
              </div>
              <div className="loc-badges">
                <ZoneBadge zone={loc.zone} />
                {crossZone && <span className="badge cross">含跨气候带标本</span>}
              </div>
            </header>
            <dl className="loc-meta">
              <div>
                <dt>生物群系</dt>
                <dd>{loc.biome}</dd>
              </div>
              <div>
                <dt>坐标</dt>
                <dd>{loc.geo}</dd>
              </div>
            </dl>
            <ul className="loc-specimens">
              {items.length === 0 && <li className="muted">当前鉴定筛选下无标本（共 {all.length} 份）。</li>}
              {items.map((sp) => (
                <li key={sp.id}>
                  <button className="loc-link" onClick={() => navigate(`/specimen/${sp.id}`)}>
                    <span className="loc-link-top">
                      <b>{sp.collectNo}</b>
                      <IdBadge status={sp.idStatus} />
                      <PressBadge status={sp.pressStatus} />
                    </span>
                    <span className="loc-link-bot">
                      {sp.species} · 海拔 {sp.elevation}m ·{" "}
                      {sources.find((s) => s.id === sp.sourceId)?.code ?? sp.sourceId}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </article>
        );
      })}
    </div>
  );
}
