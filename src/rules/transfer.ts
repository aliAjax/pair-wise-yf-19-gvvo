import type {
  BoxDraft,
  ClimateZone,
  ReceiptLine,
  RuleResult,
  Specimen,
  StorageBin,
  TransferBatch,
} from "../types";

/**
 * 规则层：纯函数，不读 localStorage、不碰 React。
 * 两条硬性业务规则集中于此：
 *   规则一（调出关）：任一标本缺调出凭证或检疫结论，整批拒收。
 *   规则二（拆箱关）：按气候带拆箱；目标仓位容量不足，或箱内混入与箱面
 *                    气候带不匹配的标本，整次拒绝；来源清单与仓位不动。
 */

export interface DocCheck {
  batchId: string;
}

/** 规则一：调出凭证 + 检疫结论逐项核验，任一缺失即整批拒收。 */
export function checkTransferDocs(specimens: Specimen[]): RuleResult<DocCheck> {
  const missingVoucher: Specimen[] = [];
  const missingQuarantine: Specimen[] = [];
  for (const sp of specimens) {
    if (!sp.voucherNo.trim()) missingVoucher.push(sp);
    if (!sp.quarantine.trim()) missingQuarantine.push(sp);
  }
  if (missingVoucher.length === 0 && missingQuarantine.length === 0) {
    return { ok: true, problems: [] };
  }
  const problems: string[] = [];
  for (const sp of missingVoucher) {
    problems.push(`${sp.collectNo}（${sp.species}）缺少调出凭证编号`);
  }
  for (const sp of missingQuarantine) {
    problems.push(`${sp.collectNo}（${sp.species}）缺少检疫结论`);
  }
  return {
    ok: false,
    reason: "调出资料不全：任一标本缺调出凭证或检疫结论，整批拒收。",
    problems,
  };
}

/** 判断当前有哪些标本仍在来源馆可登记（已在途 / 已上柜 / 已退回需重新登记的另算）。 */
export function isAvailableFromSource(sp: Specimen): boolean {
  return sp.location.kind === "source" || sp.location.kind === "returned";
}

/** 计算各仓位当前占用数（已上柜但未退回）。 */
export function binOccupancy(
  specimens: Specimen[],
  bins: StorageBin[],
): Map<string, number> {
  const occ = new Map<string, number>(bins.map((b) => [b.id, 0]));
  for (const sp of specimens) {
    if (sp.location.kind === "bin") {
      const cur = occ.get(sp.location.binId) ?? 0;
      occ.set(sp.location.binId, cur + 1);
    }
  }
  return occ;
}

/** 同气候带的标本数（在源清单 + 在途批次都算容量需求）。 */
function demandByZone(boxes: BoxDraft[]): Map<ClimateZone, number> {
  const m = new Map<ClimateZone, number>();
  for (const box of boxes) {
    for (const id of box.specimenIds) {
      void id; // 占位，实际数量按 length
    }
    m.set(box.declaredZone, (m.get(box.declaredZone) ?? 0) + box.specimenIds.length);
  }
  return m;
}

export interface ReceiptPlan {
  lines: ReceiptLine[];
}

/**
 * 规则二：拆箱接收预演。
 * 按箱面标注气候带找对应仓位；
 *  - 箱内任一标本实际气候带 ≠ 箱面标注 → 混装，整次拒绝；
 *  - 同气候带总需求超过目标仓位剩余容量 → 容量不足，整次拒绝。
 * 纯预演：不修改任何标本或仓位。
 */
export function planReceipt(
  batch: TransferBatch,
  specimenById: Map<string, Specimen>,
  bins: StorageBin[],
  currentOccupancy: Map<string, number>,
): RuleResult<ReceiptPlan> {
  const problems: string[] = [];
  const demand = demandByZone(batch.boxes);
  const binByZone = new Map<ClimateZone, StorageBin>();
  for (const b of bins) binByZone.set(b.zone, b);

  // 容量核验（按整次汇总，一次不足即整次拒绝）。
  for (const [zone, need] of demand) {
    const bin = binByZone.get(zone);
    if (!bin) {
      problems.push(`缺少气候带「${zoneLabel(zone)}」对应的仓位`);
      continue;
    }
    const used = currentOccupancy.get(bin.id) ?? 0;
    if (used + need > bin.capacity) {
      problems.push(
        `${bin.code}（${zoneLabel(zone)}）容量不足：现存 ${used} 份，本批需入 ${need} 份，容量 ${bin.capacity} 份`,
      );
    }
  }

  // 混装核验。
  const lines: ReceiptLine[] = [];
  for (const box of batch.boxes) {
    const bin = binByZone.get(box.declaredZone);
    for (const sid of box.specimenIds) {
      const sp = specimenById.get(sid);
      if (!sp) {
        problems.push(`${box.boxNo} 中存在找不到台账的标本 ${sid}`);
        continue;
      }
      if (sp.zone !== box.declaredZone) {
        problems.push(
          `${box.boxNo} 混装：${sp.collectNo}（${sp.species}）属${zoneLabel(
            sp.zone,
          )}，与箱面标注${zoneLabel(box.declaredZone)}不匹配`,
        );
      }
    }
    if (bin) {
      lines.push({
        boxNo: box.boxNo,
        declaredZone: box.declaredZone,
        binId: bin.id,
        specimenIds: [...box.specimenIds],
      });
    }
  }

  if (problems.length > 0) {
    return {
      ok: false,
      reason: "拆箱接收失败：仓位容量不足或箱内混入不匹配标本，整次拒绝，来源清单与仓位保持不动。",
      problems,
    };
  }
  return { ok: true, problems: [], data: { lines } };
}

/** 只有待接收批次可执行拆箱。 */
export function canReceive(batch: TransferBatch): boolean {
  return batch.status === "incoming";
}

/** 只有已上柜标本可退回。 */
export function canReturn(sp: Specimen): boolean {
  return sp.location.kind === "bin";
}

export function zoneLabel(z: ClimateZone): string {
  switch (z) {
    case "tropical":
      return "热带";
    case "subtropical":
      return "亚热带";
    case "temperate":
      return "温带";
    case "alpine":
      return "高寒";
  }
}

export const ZONE_ORDER: ClimateZone[] = [
  "tropical",
  "subtropical",
  "temperate",
  "alpine",
];

export function idStatusLabel(s: Specimen["idStatus"]): string {
  switch (s) {
    case "unidentified":
      return "待鉴定";
    case "identified":
      return "已鉴定";
    case "suspect":
      return "存疑待复核";
  }
}

export function quarantineLabel(q: Specimen["quarantine"]): string {
  switch (q) {
    case "":
      return "未出结论";
    case "pass":
      return "检疫合格";
    case "recheck":
      return "待复检";
  }
}

export function batchStatusLabel(s: TransferBatch["status"]): string {
  switch (s) {
    case "incoming":
      return "待接收";
    case "received":
      return "已接收";
    case "rejected":
      return "已拒收";
    case "withdrawn":
      return "已撤回";
  }
}
