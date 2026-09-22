import { BIN_MAP, BINS } from "./constants";
import type { Bin, ClimateZone, Specimen, TransferBatch } from "./types";

// 规则一：整批核验——任一标本缺调出凭证，或检疫结论不是“合格”，整批拒收
export interface VerifyResult {
  ok: boolean;
  reasons: string[];
}

export function verifyBatch(specimens: Specimen[]): VerifyResult {
  const reasons: string[] = [];
  specimens.forEach((s) => {
    if (!s.voucherNo || !s.voucherNo.trim()) {
      reasons.push(`${s.collectionNo} 缺调出凭证`);
    }
    if (s.quarantine !== "pass") {
      reasons.push(
        `${s.collectionNo} ${
          s.quarantine === "fail" ? "检疫不合格" : "检疫结论缺失"
        }`,
      );
    }
  });
  return { ok: reasons.length === 0, reasons };
}

// 规则二：拆箱接收——按气候带拆箱；混入不匹配标本或目标仓位容量不足，整次拒绝
export interface ReceiveCheck {
  ok: boolean;
  reason?: string;
}

export function checkReceive(
  boxSpecimens: Specimen[],
  targetBin: Bin,
  currentStoredCount: number,
): ReceiveCheck {
  if (boxSpecimens.length === 0) {
    return { ok: false, reason: "本次没有可拆箱标本" };
  }
  const mismatch = boxSpecimens.find((s) => s.zone !== targetBin.zone);
  if (mismatch) {
    return {
      ok: false,
      reason: `混入气候带不匹配标本：${mismatch.collectionNo}（${mismatch.zone}）不能进入 ${targetBin.code} 仓位`,
    };
  }
  const remaining = targetBin.capacity - currentStoredCount;
  if (remaining < boxSpecimens.length) {
    return {
      ok: false,
      reason: `${targetBin.name}（${targetBin.code}）容量不足：剩余 ${remaining} 份，本次需入 ${boxSpecimens.length} 份`,
    };
  }
  return { ok: true };
}

// 柜位号：仓位编码-序号
export function nextSlotNo(bin: Bin, storedCount: number): string {
  return `${bin.code}-${String(storedCount + 1).padStart(2, "0")}`;
}

// 调拨批次号：B + 年月 + 两位序号
export function nextBatchCode(existing: TransferBatch[]): string {
  const now = new Date();
  const prefix = `B${String(now.getFullYear()).slice(2)}${String(
    now.getMonth() + 1,
  ).padStart(2, "0")}`;
  const seq =
    existing.filter((b) => b.id.startsWith(prefix)).length + 1;
  return `${prefix}-${String(seq).padStart(2, "0")}`;
}

export function binOfZone(zone: ClimateZone): Bin {
  return BINS.find((b) => b.zone === zone) ?? BINS[0];
}

export function binById(id: string): Bin | undefined {
  return BIN_MAP[id];
}

export function genId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}
