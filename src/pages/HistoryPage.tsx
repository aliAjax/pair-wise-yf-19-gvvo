import { useStore } from "../state/store";
import { Empty, fmtTime } from "../components/badges";
import type { HistoryKind } from "../types";

const KIND_LABEL: Record<HistoryKind, string> = {
  registered: "调出登记",
  doc_rejected: "资料关拒收",
  received: "拆箱入库",
  receive_rejected: "拆箱关拒收",
  withdrawn: "撤回",
  returned: "退回",
  id_updated: "鉴定更新",
};

export default function HistoryPage() {
  const { state, sources } = useStore();
  const events = [...state.events].reverse();

  return (
    <section className="panel">
      <div className="heading">
        <div>
          <p>只追加、不删除</p>
          <h2>调拨历史（{events.length}）</h2>
        </div>
      </div>
      {events.length === 0 ? (
        <Empty text="暂无历史事件。" />
      ) : (
        <ol className="timeline">
          {events.map((ev) => (
            <li key={ev.id} className={`tl-item tl-${ev.kind}`}>
              <div className="tl-time">{fmtTime(ev.at)}</div>
              <div className="tl-body">
                <span className={`badge ev-${ev.kind}`}>{KIND_LABEL[ev.kind]}</span>
                {ev.sourceId && (
                  <em className="tl-source">
                    {sources.find((s) => s.id === ev.sourceId)?.code ?? ev.sourceId}
                  </em>
                )}
                <p>{ev.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
