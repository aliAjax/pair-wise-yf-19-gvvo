// 领域模型：植物标本馆跨馆调拨入库

export type ClimateZone = "tropical" | "subtropical" | "temperate" | "alpine";

export type IdentifyStatus = "pending" | "identified" | "doubtful";

export type QuarantineResult = "pass" | "fail" | "";

export type SpecimenStage = "pending" | "queued" | "stored" | "returned";

export type BatchStage = "pending" | "rejected" | "verified" | "received";

export type EventType =
  | "registered" // 调拨登记
  | "verified" // 整批核验通过
  | "rejected" // 整批拒收（凭证/检疫）
  | "received" // 拆箱入位
  | "receive_rejected" // 拆箱拒收（容量/混入）
  | "returned"; // 退回来源馆

export interface Specimen {
  id: string;
  batchId: string;
  sourceId: string;
  collectionNo: string; // 采集号
  species: string; // 物种名称
  family?: string; // 科名（鉴定结果）
  locality: string; // 采集地点
  altitude?: number; // 海拔（米）
  habitat?: string; // 生境描述
  collector?: string; // 采集人
  pressed: boolean; // 压制状态
  identifyStatus: IdentifyStatus;
  voucherNo?: string; // 调出凭证号
  quarantine: QuarantineResult; // 检疫结论
  zone: ClimateZone; // 气候带
  stage: SpecimenStage;
  binId?: string; // 已上柜仓位
  slotNo?: string; // 柜位号
  receivedAt?: number;
  returnedAt?: number;
  createdAt: number;
}

export interface TransferBatch {
  id: string;
  sourceId: string;
  manifestNo: string; // 来源清单号
  createdAt: number;
  stage: BatchStage;
  rejectReason?: string;
  verifiedAt?: number;
}

export interface Bin {
  id: string;
  name: string;
  code: string;
  zone: ClimateZone;
  capacity: number; // 容量（份数）
  note: string;
}

export interface TransferEvent {
  id: string;
  at: number;
  type: EventType;
  batchId: string;
  sourceId: string;
  binId?: string;
  specimenIds?: string[];
  message: string;
}

export interface AppState {
  batches: TransferBatch[];
  specimens: Specimen[];
  events: TransferEvent[];
}
