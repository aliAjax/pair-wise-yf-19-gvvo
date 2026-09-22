// 类型层：仅描述跨馆调拨业务的数据形状，不包含任何规则与界面逻辑。

/** 气候带：四个气候仓位各对应一种。 */
export type ClimateZone = "tropical" | "subtropical" | "temperate" | "alpine";

/** 鉴定筛选状态。 */
export type IdStatus = "unidentified" | "identified" | "suspect";

/** 压制状态。 */
export type PressStatus = "pressed" | "pending";

/** 检疫结论：空串表示尚无结论（不允许调出）。 */
export type Quarantine = "" | "pass" | "recheck";

/** 标本当前所在位置。 */
export type SpecimenLocation =
  | { kind: "source" } // 仍在来源馆清单中
  | { kind: "incoming"; batchId: string } // 已登记调拨、在途待接收
  | { kind: "bin"; binId: string } // 已入气候仓位
  | { kind: "returned" }; // 已退回来源馆（历史保留，可再次登记）

/** 标本主数据。 */
export interface Specimen {
  id: string; // 馆内流水号
  collectNo: string; // 采集号
  species: string; // 物种名称
  family: string; // 科名
  collector: string; // 采集人
  localityCode: string; // 采集地编码（关联采集地卡）
  elevation: number; // 海拔（米）
  habitat: string; // 生境描述
  pressStatus: PressStatus;
  idStatus: IdStatus;
  zone: ClimateZone; // 标本自身的气候带（拆箱判据）
  voucherNo: string; // 调出凭证编号，空串表示缺失
  quarantine: Quarantine; // 检疫结论
  sourceId: string; // 来源馆 id
  location: SpecimenLocation;
  receivedAt?: string;
}

/** 来源馆。 */
export interface SourceHerbarium {
  id: string;
  code: string;
  name: string;
  keeper: string;
  contact: string;
}

/** 气候仓位。 */
export interface StorageBin {
  id: string;
  code: string;
  zone: ClimateZone;
  name: string;
  tempRange: string;
  humidity: string;
  capacity: number; // 容量（份）
}

/** 采集地卡。 */
export interface Locality {
  code: string;
  name: string;
  province: string;
  zone: ClimateZone;
  biome: string;
  geo: string;
}

/** 登记调拨时的拆箱草稿：箱号 + 箱面标注气候带。 */
export interface BoxDraft {
  boxNo: string;
  declaredZone: ClimateZone;
  specimenIds: string[];
}

/** 调拨批次状态。 */
export type BatchStatus = "incoming" | "received" | "rejected" | "withdrawn";

/** 一次拆箱接收结果（每箱）。 */
export interface ReceiptLine {
  boxNo: string;
  declaredZone: ClimateZone;
  binId: string;
  specimenIds: string[];
}

/** 调拨批次。来源清单与批次不可变历史通过 specimen.location 与 events 体现。 */
export interface TransferBatch {
  id: string;
  sourceId: string;
  createdAt: string;
  status: BatchStatus;
  boxes: BoxDraft[];
  specimenIds: string[];
  /** 拒收 / 撤回原因（仅 rejected / withdrawn 有值）。 */
  rejectReason?: string;
  /** 成功接收时的拆箱落位记录。 */
  receipts?: ReceiptLine[];
  receivedAt?: string;
}

export type HistoryKind =
  | "registered"
  | "doc_rejected"
  | "received"
  | "receive_rejected"
  | "withdrawn"
  | "returned"
  | "id_updated";

/** 调拨历史事件（只追加，退回不删除）。 */
export interface HistoryEvent {
  id: string;
  at: string;
  kind: HistoryKind;
  sourceId?: string;
  batchId?: string;
  specimenIds?: string[];
  detail: string;
}

export interface AppState {
  specimens: Specimen[];
  batches: TransferBatch[];
  events: HistoryEvent[];
}

/** 规则执行结果的统一形状。 */
export interface RuleResult<T = undefined> {
  ok: boolean;
  reason?: string;
  /** 逐条列出问题标本/箱，便于界面展示。 */
  problems: string[];
  data?: T;
}
