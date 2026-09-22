import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { BINS, LOCALITIES, SOURCES, buildSeedSpecimens } from "../data/catalog";
import {
  binOccupancy,
  canReceive,
  canReturn,
  checkTransferDocs,
  planReceipt,
} from "../rules/transfer";
import type {
  AppState,
  BoxDraft,
  HistoryEvent,
  HistoryKind,
  IdStatus,
  ReceiptLine,
  Specimen,
  TransferBatch,
} from "../types";

const STORAGE_KEY = "herbarium-transfer-v1";

export interface ActionResult {
  ok: boolean;
  title: string;
  detail?: string;
  problems?: string[];
}

interface StoreShape {
  state: AppState;
  bins: typeof BINS;
  localities: typeof LOCALITIES;
  sources: typeof SOURCES;
  specimenById: Map<string, Specimen>;
  occupancy: Map<string, number>;
  registerTransfer: (
    sourceId: string,
    boxes: BoxDraft[],
  ) => ActionResult;
  receiveBatch: (batchId: string) => ActionResult;
  withdrawBatch: (batchId: string) => ActionResult;
  returnSpecimen: (specimenId: string, reason: string) => ActionResult;
  updateIdStatus: (specimenId: string, status: IdStatus) => void;
  updateDocs: (
    specimenId: string,
    patch: { voucherNo?: string; quarantine?: Specimen["quarantine"] },
  ) => ActionResult;
  resetAll: () => void;
}

const StoreCtx = createContext<StoreShape | null>(null);

function freshState(): AppState {
  const specimens = buildSeedSpecimens();
  return {
    specimens,
    batches: [],
    events: [
      {
        id: "EV-0000",
        at: new Date().toISOString(),
        kind: "registered",
        detail: `预置台账建立：${SOURCES.length} 个来源馆、${BINS.length} 个气候仓位、${specimens.length} 份在源标本。`,
      },
    ],
  };
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshState();
    const parsed = JSON.parse(raw) as AppState;
    if (!Array.isArray(parsed.specimens) || !Array.isArray(parsed.batches)) {
      return freshState();
    }
    return parsed;
  } catch {
    return freshState();
  }
}

let seq = 1;
function nextId(prefix: string): string {
  const n = seq++;
  const t = Date.now().toString(36);
  return `${prefix}-${t}-${n}`;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState);
  const ref = useRef(state);
  ref.current = state;

  // 只存浏览器：每次变化写入 localStorage，刷新后保留。
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // 存储满或不可用时静默，不影响当次操作。
    }
  }, [state]);

  const api = useMemo<StoreShape>(() => {
    const addEvent = (
      prev: AppState,
      kind: HistoryKind,
      detail: string,
      extra?: Partial<HistoryEvent>,
    ): HistoryEvent => ({
      id: nextId("EV"),
      at: new Date().toISOString(),
      kind,
      detail,
      ...extra,
    });

    return {
      state,
      bins: BINS,
      localities: LOCALITIES,
      sources: SOURCES,

      specimenById: new Map(state.specimens.map((s) => [s.id, s])),
      occupancy: binOccupancy(state.specimens, BINS),

      /** 规则一在登记入口执行：缺凭证/检疫整批拒收，标本留来源清单。 */
      registerTransfer(sourceId, boxes) {
        const prev = ref.current;
        const ids = boxes.flatMap((b) => b.specimenIds);
        if (ids.length === 0) {
          return { ok: false, title: "无法登记", detail: "未选择任何标本。" };
        }
        const unique = new Set(ids);
        if (unique.size !== ids.length) {
          return {
            ok: false,
            title: "无法登记",
            detail: "同一份标本被装入多个箱，请检查拆箱单。",
          };
        }
        const chosen = ids
          .map((id) => prev.specimens.find((s) => s.id === id))
          .filter((s): s is Specimen => Boolean(s));
        if (chosen.some((s) => s.sourceId !== sourceId)) {
          return {
            ok: false,
            title: "无法登记",
            detail: "选择了不属于该来源馆的标本。",
          };
        }
        const busy = chosen.filter(
          (s) => s.location.kind === "incoming" || s.location.kind === "bin",
        );
        if (busy.length > 0) {
          return {
            ok: false,
            title: "无法登记",
            detail: `以下标本已在途或已上柜：${busy
              .map((s) => s.collectNo)
              .join("、")}`,
          };
        }

        const check = checkTransferDocs(chosen);
        if (!check.ok) {
          // 整批拒收：不创建批次、不改动来源清单，仅留调拨历史。
          const reason = check.reason ?? "调出资料不全，整批拒收。";
          setState((p) => ({
            ...p,
            events: [
              ...p.events,
              addEvent(
                p,
                "doc_rejected",
                `${reason} 涉及标本：${ids.length} 份。`,
                { sourceId, specimenIds: ids },
              ),
            ],
          }));
          return {
            ok: false,
            title: "整批拒收",
            detail: check.reason,
            problems: check.problems,
          };
        }

        const batchId = nextId("BAT");
        const batch: TransferBatch = {
          id: batchId,
          sourceId,
          createdAt: new Date().toISOString(),
          status: "incoming",
          boxes: boxes.map((b) => ({ ...b, specimenIds: [...b.specimenIds] })),
          specimenIds: ids,
        };
        setState((p) => ({
          ...p,
          batches: [batch, ...p.batches],
          specimens: p.specimens.map((s) =>
            ids.includes(s.id)
              ? { ...s, location: { kind: "incoming", batchId } }
              : s,
          ),
          events: [
            ...p.events,
            addEvent(
              p,
              "registered",
              `来源馆 ${sourceId} 调出批次 ${batchId.slice(-6).toUpperCase()} 已登记：${
                boxes.length
              } 箱、${ids.length} 份，等待拆箱接收。`,
              { sourceId, batchId, specimenIds: ids },
            ),
          ],
        }));
        return {
          ok: true,
          title: "登记成功",
          detail: `批次进入待接收队列，${ids.length} 份标本在途锁定。`,
        };
      },

      /** 规则二在接收时执行：容量不足/混装整次拒绝，来源清单与仓位不动。 */
      receiveBatch(batchId) {
        const prev = ref.current;
        const batch = prev.batches.find((b) => b.id === batchId);
        if (!batch) return { ok: false, title: "批次不存在" };
        if (!canReceive(batch)) {
          return {
            ok: false,
            title: "无法接收",
            detail: "该批次当前状态不允许拆箱。",
          };
        }
        const byId = new Map(prev.specimens.map((s) => [s.id, s]));
        const plan = planReceipt(batch, byId, BINS, binOccupancy(prev.specimens, BINS));
        if (!plan.ok || !plan.data) {
          // 整次拒绝：批次标记拒收，标本仍随该批在途记录保留；来源清单与仓位不动。
          setState((p) => ({
            ...p,
            batches: p.batches.map((b) =>
              b.id === batchId
                ? {
                    ...b,
                    status: "rejected",
                    rejectReason: plan.reason,
                  }
                : b,
            ),
            events: [
              ...p.events,
              addEvent(p, "receive_rejected", plan.reason ?? "拆箱整次拒绝。", {
                batchId,
                sourceId: batch.sourceId,
                specimenIds: batch.specimenIds,
              }),
            ],
          }));
          return {
            ok: false,
            title: "整次拒绝接收",
            detail: plan.reason,
            problems: plan.problems,
          };
        }

        const lines: ReceiptLine[] = plan.data.lines;
        const binOf = new Map<string, string>();
        for (const line of lines) {
          for (const sid of line.specimenIds) binOf.set(sid, line.binId);
        }
        const now = new Date().toISOString();
        setState((p) => ({
          ...p,
          batches: p.batches.map((b) =>
            b.id === batchId
              ? { ...b, status: "received", receipts: lines, receivedAt: now }
              : b,
          ),
          specimens: p.specimens.map((s) => {
            const binId = binOf.get(s.id);
            return binId
              ? { ...s, location: { kind: "bin", binId }, receivedAt: now }
              : s;
          }),
          events: [
            ...p.events,
            addEvent(
              p,
              "received",
              `批次 ${batchId
                .slice(-6)
                .toUpperCase()} 按气候带拆箱入库：${lines
                .map((l) => `${l.boxNo}→${l.binId}（${l.specimenIds.length}份）`)
                .join("，")}。`,
              {
                batchId,
                sourceId: batch.sourceId,
                specimenIds: batch.specimenIds,
              },
            ),
          ],
        }));
        return {
          ok: true,
          title: "接收入库完成",
          detail: `已按 ${lines.length} 个箱面气候带落位，共 ${batch.specimenIds.length} 份。`,
        };
      },

      /** 撤回待接收批次：标本回到来源清单，批次历史保留。 */
      withdrawBatch(batchId) {
        const prev = ref.current;
        const batch = prev.batches.find((b) => b.id === batchId);
        if (!batch || (batch.status !== "incoming" && batch.status !== "rejected")) {
          return {
            ok: false,
            title: "无法撤回",
            detail: "仅待接收或已拒收的批次可撤回。",
          };
        }
        const reasonText =
          batch.status === "rejected"
            ? "拆箱拒收后撤回登记，标本退回来源馆清单。"
            : "来源馆主动撤回登记。";
        setState((p) => ({
          ...p,
          batches: p.batches.map((b) =>
            b.id === batchId ? { ...b, status: "withdrawn", rejectReason: reasonText } : b,
          ),
          specimens: p.specimens.map((s) =>
            batch.specimenIds.includes(s.id) && s.location.kind === "incoming"
              ? { ...s, location: { kind: "source" } }
              : s,
          ),
          events: [
            ...p.events,
            addEvent(p, "withdrawn", `批次 ${batchId.slice(-6).toUpperCase()} 已撤回，标本退回来源馆清单。`, {
              batchId,
              sourceId: batch.sourceId,
              specimenIds: batch.specimenIds,
            }),
          ],
        }));
        return { ok: true, title: "已撤回", detail: "标本回到来源馆清单，可重新登记。" };
      },

      /** 退回已接收标本：释放仓位、保留调拨历史。 */
      returnSpecimen(specimenId, reason) {
        const prev = ref.current;
        const sp = prev.specimens.find((x) => x.id === specimenId);
        if (!sp || !canReturn(sp) || sp.location.kind !== "bin") {
          return { ok: false, title: "无法退回", detail: "只有已上柜标本可以退回。" };
        }
        const binId = sp.location.binId;
        setState((p) => ({
          ...p,
          specimens: p.specimens.map((s) =>
            s.id === specimenId ? { ...s, location: { kind: "returned" } } : s,
          ),
          events: [
            ...p.events,
            addEvent(
              p,
              "returned",
              `标本 ${sp.collectNo}（${sp.species}）由仓位 ${binId} 退回来源馆 ${sp.sourceId}。原因：${reason} 仓位容量已释放。`,
              { sourceId: sp.sourceId, specimenIds: [specimenId] },
            ),
          ],
        }));
        return {
          ok: true,
          title: "已退回",
          detail: `${sp.collectNo} 已离柜，仓位容量同步释放，调拨历史保留。`,
        };
      },

      updateIdStatus(specimenId, status) {
        const prev = ref.current;
        const sp = prev.specimens.find((s) => s.id === specimenId);
        if (!sp || sp.idStatus === status) return;
        setState((p) => ({
          ...p,
          specimens: p.specimens.map((s) =>
            s.id === specimenId ? { ...s, idStatus: status } : s,
          ),
          events: [
            ...p.events,
            addEvent(
              p,
              "id_updated",
              `标本 ${sp.collectNo} 鉴定状态更新为 ${status}。`,
              { specimenIds: [specimenId] },
            ),
          ],
        }));
      },

      /** 在源 / 已退回标本可补录凭证与检疫结论（退回后可重新登记）。 */
      updateDocs(specimenId, patch) {
        const prev = ref.current;
        const sp = prev.specimens.find((s) => s.id === specimenId);
        if (!sp) {
          return { ok: false, title: "标本不存在" };
        }
        if (sp.location.kind === "incoming" || sp.location.kind === "bin") {
          return {
            ok: false,
            title: "不可修改",
            detail: "在途或已上柜标本的调出资料不可改动。",
          };
        }
        setState((p) => ({
          ...p,
          specimens: p.specimens.map((s) => (s.id === specimenId ? { ...s, ...patch } : s)),
        }));
        return { ok: true, title: "资料已保存" };
      },

      resetAll() {
        seq = 1;
        setState(freshState());
      },
    };
  }, [state]);

  return <StoreCtx.Provider value={api}>{children}</StoreCtx.Provider>;
}

export function useStore(): StoreShape {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore 必须在 StoreProvider 内使用");
  return ctx;
}
