import { BIN_MAP, SOURCE_MAP } from "../rules/constants";
import {
  checkReceive,
  genId,
  nextBatchCode,
  nextSlotNo,
  verifyBatch,
} from "../rules/transfer";
import type {
  AppState,
  ClimateZone,
  IdentifyStatus,
  QuarantineResult,
  Specimen,
  TransferEvent,
} from "../rules/types";
import { createSeed } from "./seed";
import { batchSpecimens } from "./selectors";

export type Action =
  | {
      type: "ADD_BATCH";
      sourceId: string;
      manifestNo: string;
      specimens: NewSpecimenInput[];
    }
  | { type: "VERIFY_BATCH"; batchId: string }
  | {
      type: "RECEIVE_BOX";
      batchId: string;
      binId: string;
    }
  | { type: "RETURN_SPECIMEN"; specimenId: string; reason: string }
  | {
      type: "UPDATE_IDENTIFY";
      specimenId: string;
      identifyStatus: IdentifyStatus;
      family?: string;
    }
  | { type: "RESET" };

export interface NewSpecimenInput {
  collectionNo: string;
  species: string;
  family?: string;
  locality: string;
  altitude?: number;
  habitat?: string;
  collector?: string;
  identifyStatus: IdentifyStatus;
  voucherNo?: string;
  quarantine: QuarantineResult;
  zone: ClimateZone;
}

function event(
  partial: Omit<TransferEvent, "id" | "at">,
  at = Date.now(),
): TransferEvent {
  return { id: genId("EV"), at, ...partial };
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "ADD_BATCH": {
      const batchId = nextBatchCode(state.batches);
      const now = Date.now();
      const specimens: Specimen[] = action.specimens.map((input, i) => ({
        id: genId("SP"),
        batchId,
        sourceId: action.sourceId,
        collectionNo: input.collectionNo,
        species: input.species,
        family: input.family || undefined,
        locality: input.locality,
        altitude: input.altitude,
        habitat: input.habitat || undefined,
        collector: input.collector || undefined,
        pressed: true,
        identifyStatus: input.identifyStatus,
        voucherNo: input.voucherNo?.trim() || undefined,
        quarantine: input.quarantine,
        zone: input.zone,
        stage: "pending",
        createdAt: now + i,
      }));
      const source = SOURCE_MAP[action.sourceId];
      const newEvent = event({
        type: "registered",
        batchId,
        sourceId: action.sourceId,
        message: `${source?.short ?? action.sourceId}调拨清单 ${
          action.manifestNo
        } 登记，${specimens.length} 份标本待核验`,
      });
      return {
        batches: [
          ...state.batches,
          {
            id: batchId,
            sourceId: action.sourceId,
            manifestNo: action.manifestNo,
            createdAt: now,
            stage: "pending",
          },
        ],
        specimens: [...state.specimens, ...specimens],
        events: [...state.events, newEvent],
      };
    }

    case "VERIFY_BATCH": {
      const batch = state.batches.find((b) => b.id === action.batchId);
      if (!batch || batch.stage !== "pending") return state;
      const members = batchSpecimens(state, batch.id);
      const result = verifyBatch(members);
      const now = Date.now();
      if (result.ok) {
        return {
          ...state,
          batches: state.batches.map((b) =>
            b.id === batch.id
              ? { ...b, stage: "verified", verifiedAt: now }
              : b,
          ),
          specimens: state.specimens.map((s) =>
            s.batchId === batch.id ? { ...s, stage: "queued" } : s,
          ),
          events: [
            ...state.events,
            event({
              type: "verified",
              batchId: batch.id,
              sourceId: batch.sourceId,
              message: `${members.length} 份标本调出凭证齐全、检疫全部合格，核验通过，进入拆箱队列`,
            }),
          ],
        };
      }
      // 任一标本缺凭证或检疫不合格 → 整批拒收；来源清单与仓位不动
      return {
        ...state,
        batches: state.batches.map((b) =>
          b.id === batch.id
            ? {
                ...b,
                stage: "rejected",
                rejectReason: result.reasons.join("；"),
              }
            : b,
        ),
        events: [
          ...state.events,
          event({
            type: "rejected",
            batchId: batch.id,
            sourceId: batch.sourceId,
            message: `整批拒收：${result.reasons.join("；")}。来源清单保留，标本不得入库`,
          }),
        ],
      };
    }

    case "RECEIVE_BOX": {
      const batch = state.batches.find((b) => b.id === action.batchId);
      const bin = BIN_MAP[action.binId];
      if (!batch || !bin) return state;
      // 本次整箱 = 该批次中仍在拆箱队列的全部标本；逐份比对目标仓位气候带
      const box = state.specimens.filter(
        (s) => s.batchId === batch.id && s.stage === "queued",
      );
      const used = state.specimens.filter(
        (s) => s.stage === "stored" && s.binId === bin.id,
      ).length;
      const check = checkReceive(box, bin, used);
      if (!check.ok) {
        // 整次拒绝：来源清单与仓位均不动，只记录调拨历史
        return {
          ...state,
          events: [
            ...state.events,
            event({
              type: "receive_rejected",
              batchId: batch.id,
              sourceId: batch.sourceId,
              binId: bin.id,
              message: `拆箱拒收（${bin.code}）：${check.reason}。清单与仓位均未变更`,
            }),
          ],
        };
      }
      const now = Date.now();
      const receiveIds = new Set(box.map((s) => s.id));
      let seq = used;
      const updated = state.specimens.map((s) => {
        if (!receiveIds.has(s.id)) return s;
        seq += 1;
        return {
          ...s,
          stage: "stored" as const,
          binId: bin.id,
          slotNo: nextSlotNo(bin, seq - 1),
          receivedAt: now,
        };
      });
      const slots = box.map((_, i) => nextSlotNo(bin, used + i));
      return {
        ...state,
        specimens: updated,
        batches: state.batches.map((b) =>
          b.id === batch.id ? { ...b, stage: "received" } : b,
        ),
        events: [
          ...state.events,
          event({
            type: "received",
            batchId: batch.id,
            sourceId: batch.sourceId,
            binId: bin.id,
            specimenIds: box.map((s) => s.id),
            message: `${bin.code} ${bin.name}拆箱入位 ${
              box.length
            } 份（${slots.join("、")}）`,
          }),
        ],
      };
    }

    case "RETURN_SPECIMEN": {
      const target = state.specimens.find(
        (s) => s.id === action.specimenId,
      );
      if (!target || target.stage !== "stored" || !target.binId) return state;
      const bin = BIN_MAP[target.binId];
      const now = Date.now();
      return {
        ...state,
        // 退回已接收标本：释放仓位，保留调拨历史
        specimens: state.specimens.map((s) =>
          s.id === target.id
            ? {
                ...s,
                stage: "returned",
                binId: undefined,
                slotNo: undefined,
                returnedAt: now,
              }
            : s,
        ),
        batches: state.batches,
        events: [
          ...state.events,
          event({
            type: "returned",
            batchId: target.batchId,
            sourceId: target.sourceId,
            binId: bin?.id,
            specimenIds: [target.id],
            message: `${target.collectionNo} ${target.species} 退回来源馆（${
              action.reason || "馆际调拨退回"
            }），柜位 ${target.slotNo} 已释放，调拨历史保留`,
          }),
        ],
      };
    }

    case "UPDATE_IDENTIFY": {
      const target = state.specimens.find((s) => s.id === action.specimenId);
      if (!target) return state;
      return {
        ...state,
        specimens: state.specimens.map((s) =>
          s.id === target.id
            ? {
                ...s,
                identifyStatus: action.identifyStatus,
                family: action.family ?? s.family,
              }
            : s,
        ),
        events: [
          ...state.events,
          event({
            type: "registered",
            batchId: target.batchId,
            sourceId: target.sourceId,
            specimenIds: [target.id],
            message: `${target.collectionNo} 鉴定信息更新为 ${
              action.identifyStatus === "identified"
                ? "已鉴定"
                : action.identifyStatus === "doubtful"
                  ? "存疑待核"
                  : "待鉴定"
            }${action.family ? `（${action.family}）` : ""}`,
          }),
        ],
      };
    }

    case "RESET":
      return createSeed();

    default:
      return state;
  }
}
